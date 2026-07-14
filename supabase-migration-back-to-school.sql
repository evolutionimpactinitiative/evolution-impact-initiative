-- ============================================
-- Back to School Drive 2026 — schema extensions
-- ============================================
-- Extends the existing events + registrations flow so the Back to School Drive
-- (Sat 22 Aug 2026, Sunlight Centre Gillingham, 12:00–15:00, 500-family cap)
-- can be run as a specialised event with:
--   * manual approval gate (families register → admin approves → approval
--     email blast on 21 Aug 18:00 with a scannable QR code)
--   * per-child uniform size / needs data captured on the public form
--   * on-the-day scanner that opens a collection sheet and lets stewards
--     tick off which items were actually distributed
-- Supply pledges (money-or-supplies) live in a standalone table because
-- they're inbound goods, not attendance.
--
-- Public forms:   /back-to-school/register, /back-to-school/donate-supplies
-- Steward flow:   /scan/{stewardToken} → scans registration QR → sheet view
-- Admin:          /admin/events/[b2s-event-id] (existing UI extended)
--                 /admin/back-to-school/supplies (new)


-- ============================================
-- 1. EVENTS — approval gate + registration deadline
-- ============================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;

COMMENT ON COLUMN events.requires_approval IS
  'When true, registrations land as pending and only receive their confirmation on manual approval.';
COMMENT ON COLUMN events.registration_deadline IS
  'Hard cutoff for the public registration form. Enforced server-side.';


-- ============================================
-- 2. REGISTRATIONS — pending/approved lifecycle + QR + distribution record
-- ============================================

-- Replace status CHECK constraint to allow the approval + distribution lifecycle.
ALTER TABLE registrations
  DROP CONSTRAINT IF EXISTS registrations_status_check;

ALTER TABLE registrations
  ADD CONSTRAINT registrations_status_check
  CHECK (status IN (
    'confirmed',   -- standard events: auto-confirmed on registration
    'waitlisted',  -- standard events: over capacity
    'cancelled',   -- family withdrew
    'pending',     -- approval-gated events: awaiting review
    'approved',    -- approval-gated events: approved, cleared to receive approval email
    'declined'     -- approval-gated events: rejected by admin
  ));

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS parent_postcode TEXT,
  ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS approval_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS distribution_status TEXT
    CHECK (distribution_status IN ('collected', 'partial', 'no_show')),
  ADD COLUMN IF NOT EXISTS distribution_recorded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS distribution_recorded_by_token_id UUID
    REFERENCES festival_steward_tokens(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_qr_token ON registrations(qr_token);
CREATE INDEX IF NOT EXISTS idx_registrations_distribution_status
  ON registrations(event_id, distribution_status);

-- QR tokens are the secret in the URL — anyone with the URL can look up the
-- registration on the collection sheet. Public read on the qr_token path is
-- gated at the app layer (only the scanner route resolves them, and it lives
-- behind a steward token). Team members retain full access via existing RLS.


-- ============================================
-- 3. REGISTRATION_CHILDREN — uniform size / needs / items given
-- ============================================

ALTER TABLE registration_children
  ADD COLUMN IF NOT EXISTS uniform_size TEXT,
  ADD COLUMN IF NOT EXISTS school TEXT,
  ADD COLUMN IF NOT EXISTS sex TEXT
    CHECK (sex IN ('male', 'female', 'other', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS needs JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS items_given JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN registration_children.uniform_size IS
  'Age-based uniform size label: 4, 4-5, 5, ... 11-12';
COMMENT ON COLUMN registration_children.needs IS
  'Requested categories, e.g. ["uniform","stationery","bag"]';
COMMENT ON COLUMN registration_children.items_given IS
  'Distribution record set by steward on the day: {"uniform":true,"stationery":false,"bag":true}';


-- ============================================
-- 4. BACK TO SCHOOL SUPPLY PLEDGES
-- ============================================

CREATE TABLE IF NOT EXISTS back_to_school_supply_pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  donor_phone TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  delivery_method TEXT NOT NULL
    CHECK (delivery_method IN ('drop_off', 'collection')),
  collection_address TEXT,
  collection_postcode TEXT,
  preferred_window TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'received', 'cancelled')),
  admin_notes TEXT,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN back_to_school_supply_pledges.items IS
  'Array of {item: string, size: string|null, qty: number}';

CREATE INDEX IF NOT EXISTS idx_b2s_supply_pledges_status
  ON back_to_school_supply_pledges(status);
CREATE INDEX IF NOT EXISTS idx_b2s_supply_pledges_created_at
  ON back_to_school_supply_pledges(created_at DESC);

ALTER TABLE back_to_school_supply_pledges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can pledge supplies"
  ON back_to_school_supply_pledges FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Team members can view supply pledges"
  ON back_to_school_supply_pledges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Team members can manage supply pledges"
  ON back_to_school_supply_pledges FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Team members can delete supply pledges"
  ON back_to_school_supply_pledges FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

CREATE TRIGGER update_b2s_supply_pledges_updated_at
  BEFORE UPDATE ON back_to_school_supply_pledges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 5. SEED — Back to School Drive 2026 event row
-- ============================================
-- Idempotent: uses ON CONFLICT (slug) to update the row rather than duplicate.
-- If the row already exists (e.g. re-running the migration), the details are
-- refreshed but existing registrations are preserved.

INSERT INTO events (
  slug,
  title,
  short_description,
  full_description,
  category,
  date,
  start_time,
  end_time,
  venue_name,
  venue_address,
  age_group,
  cost,
  what_to_bring,
  accessibility_info,
  total_slots,
  waitlist_slots,
  max_children_per_registration,
  registration_status,
  status,
  requires_approval,
  registration_deadline,
  send_reminder_24h,
  send_reminder_1h
) VALUES (
  'back-to-school-drive-2026',
  'Back to School Drive 2026',
  'Free school uniforms, stationery and bags for 500 children across Medway. Register your children, get an approval email with a QR code, and come to Sunlight Centre in Gillingham on Sat 22 Aug 12–3PM.',
  'Every year Evolution Impact Initiative helps families start the school year with dignity. In 2026 we''re aiming to support 500 children with new school uniforms, stationery and school bags — completely free.\n\n**How it works**\n1. Register each child with their age, uniform size, and what they need.\n2. Registration closes Friday 21 August at 6PM.\n3. We''ll email you an approval on Friday 21 August with a QR code — bring it on the day.\n4. Come to Sunlight Centre, Gillingham on Saturday 22 August between 12PM and 3PM.',
  'support',
  '2026-08-22',
  '12:00',
  '15:00',
  'Sunlight Centre',
  'Richmond Road, Gillingham, ME7 1LX',
  '4–12',
  'FREE',
  'Please bring your approval email (printed or on your phone). ID isn''t required but helps if we need to confirm details.',
  'Ground-floor accessible venue. If you need extra support on the day, reply to your approval email and we''ll help.',
  500,
  0,
  4,
  'auto',
  'published',
  TRUE,
  '2026-08-21 18:00:00+01',
  FALSE,
  FALSE
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  category = EXCLUDED.category,
  date = EXCLUDED.date,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  venue_name = EXCLUDED.venue_name,
  venue_address = EXCLUDED.venue_address,
  age_group = EXCLUDED.age_group,
  cost = EXCLUDED.cost,
  what_to_bring = EXCLUDED.what_to_bring,
  accessibility_info = EXCLUDED.accessibility_info,
  total_slots = EXCLUDED.total_slots,
  max_children_per_registration = EXCLUDED.max_children_per_registration,
  status = EXCLUDED.status,
  requires_approval = EXCLUDED.requires_approval,
  registration_deadline = EXCLUDED.registration_deadline,
  send_reminder_24h = EXCLUDED.send_reminder_24h,
  send_reminder_1h = EXCLUDED.send_reminder_1h,
  updated_at = NOW();
