-- ============================================
-- Back to School Collection Day — Sept 5 2026
-- ============================================
-- A second drive: same physical stock as August, collection-only, 30-min
-- pre-booked slots. Parents pick per-child items straight from what's
-- currently in stock; submission reserves the items via the existing
-- pick_reservations table.
--
-- Key rules:
--   • Max 4 children per family, 4 items each (shirt/polo/bottom/stationery)
--   • Slots: 12:00, 12:30, 13:00, 13:30, 14:00, 14:30 — 20 parents each
--   • Grace window 15:00-16:00 walk-in only (no advance booking)
--   • Blacklist: missed BOTH drives = permanently banned from all programs
--
-- Stock is not duplicated — the new event's demand reads from the same
-- back_to_school_stock rows, and pick_reservations get created on
-- registration submit so free stock drops immediately.

-- ─── Seed the collection event ────────────────────────────────────
INSERT INTO events (
  slug, title, short_description, full_description, category, event_type,
  date, start_time, end_time, venue_name, venue_address,
  age_group, cost, total_slots, waitlist_slots,
  max_children_per_registration, registration_status, status
)
VALUES (
  'back-to-school-collection-2026',
  'Back to School Collection Day',
  'A follow-on collection day using stock left over from the August drive. Pre-book a 30-minute slot, we pack your bag, you pick up.',
  'A second chance for families who missed our August drive, and for anyone else who needs a hand kitting kids out. Pre-book a slot online, pick which items you need per child from what we have in stock, and turn up in your slot to collect a ready-packed bag.',
  'support',
  'children',
  '2026-09-05',
  '12:00:00',
  '15:00:00',
  'Sunlight Centre',
  'Richmond Road, Gillingham, ME7 1LX',
  'School age (4-12)',
  'FREE',
  120,
  0,
  4,
  'open',
  'published'
)
ON CONFLICT (slug) DO NOTHING;


-- ─── Blacklist ────────────────────────────────────────────────────
-- Auto-populated by the no-show flow: a parent flagged as no-show in
-- BOTH the August drive AND the September drive gets a row here.
-- Also manually addable by the chair (e.g. for behavioural reasons).
-- Match happens at registration form-submit time on email OR phone —
-- either match blocks a fresh signup.

CREATE TABLE IF NOT EXISTS back_to_school_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,                       -- normalised lowercase; nullable
  phone TEXT,                       -- normalised digits-only; nullable
  parent_name TEXT,
  reason TEXT NOT NULL,             -- 'no_show_both_drives', 'behaviour', 'manual', ...
  notes TEXT,
  added_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  released_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  released_at TIMESTAMPTZ,          -- soft-remove; NULL means active
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_b2s_blacklist_email
  ON back_to_school_blacklist(email)
  WHERE email IS NOT NULL AND released_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_b2s_blacklist_phone
  ON back_to_school_blacklist(phone)
  WHERE phone IS NOT NULL AND released_at IS NULL;

ALTER TABLE back_to_school_blacklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team read blacklist"
  ON back_to_school_blacklist FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));
CREATE POLICY "Team write blacklist"
  ON back_to_school_blacklist FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));


-- ─── Registrations: slot column ───────────────────────────────────
-- Slots are stored as an ISO timestamp on the registration row. Six
-- slots per event, capacity 20 each — enforced in the API guard by
-- counting existing regs for the same event + slot.

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS collection_slot TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_registrations_slot
  ON registrations(event_id, collection_slot)
  WHERE collection_slot IS NOT NULL;
