-- Evolution Impact Initiative - Festival 2026 Migration
-- Adds tables for Evolution Fest 2026 (tickets, vendors, sponsors, volunteers, steward tokens)
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. FESTIVAL STEWARD TOKENS
-- Tokenised links for day-of stewards (no login required)
-- ============================================

CREATE TABLE IF NOT EXISTS festival_steward_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  created_by UUID REFERENCES team_members(id),
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_festival_steward_tokens_event_id ON festival_steward_tokens(event_id);
CREATE INDEX IF NOT EXISTS idx_festival_steward_tokens_token ON festival_steward_tokens(token);

ALTER TABLE festival_steward_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage steward tokens"
  ON festival_steward_tokens FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );


-- ============================================
-- 2. FESTIVAL TICKETS
-- One row per attendee (family of 4 = 4 ticket rows)
-- ticket_code is the secret used in QR URL: /ticket/{code}
-- ============================================

CREATE TABLE IF NOT EXISTS festival_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_code TEXT UNIQUE NOT NULL,
  holder_name TEXT,
  holder_type TEXT NOT NULL CHECK (holder_type IN ('lead', 'adult', 'child')),
  display_order INTEGER NOT NULL DEFAULT 1,
  checked_in_at TIMESTAMPTZ,
  checked_in_by_token_id UUID REFERENCES festival_steward_tokens(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_festival_tickets_registration_id ON festival_tickets(registration_id);
CREATE INDEX IF NOT EXISTS idx_festival_tickets_event_id ON festival_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_festival_tickets_ticket_code ON festival_tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_festival_tickets_checked_in ON festival_tickets(event_id, checked_in_at);

ALTER TABLE festival_tickets ENABLE ROW LEVEL SECURITY;

-- Anyone can read a ticket by its code (long random code is the secret)
CREATE POLICY "Public can view tickets"
  ON festival_tickets FOR SELECT
  TO anon, authenticated
  USING (true);

-- Team members can manage all tickets
CREATE POLICY "Team members can manage tickets"
  ON festival_tickets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

-- Service role inserts tickets after registration confirmation
GRANT SELECT ON festival_tickets TO anon;
GRANT ALL ON festival_tickets TO authenticated;


-- ============================================
-- 3. FESTIVAL VENDORS
-- Vendor applications: food, drinks, sweets, retail, community orgs
-- ============================================

CREATE TABLE IF NOT EXISTS festival_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Business / contact
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,

  -- Categorisation
  category TEXT NOT NULL CHECK (category IN ('food', 'drinks', 'sweet_treats', 'retail', 'community_org')),

  -- Pitch details
  description TEXT,
  what_selling TEXT,
  social_handles JSONB DEFAULT '{}',
  website TEXT,
  power_needed BOOLEAN DEFAULT FALSE,
  power_notes TEXT,
  gazebo_size TEXT,

  -- Declared compliance (docs emailed separately)
  has_public_liability BOOLEAN DEFAULT FALSE,
  has_food_hygiene_rating BOOLEAN DEFAULT FALSE,
  food_hygiene_score INTEGER,
  has_risk_assessment BOOLEAN DEFAULT FALSE,

  -- Status & payment
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'pending_review', 'approved', 'rejected', 'cancelled', 'waitlisted')),
  contribution_amount INTEGER NOT NULL DEFAULT 0, -- in pence (0 for community orgs)
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,

  -- Admin review
  reviewed_by UUID REFERENCES team_members(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_festival_vendors_event_id ON festival_vendors(event_id);
CREATE INDEX IF NOT EXISTS idx_festival_vendors_status ON festival_vendors(status);
CREATE INDEX IF NOT EXISTS idx_festival_vendors_category ON festival_vendors(category);
CREATE INDEX IF NOT EXISTS idx_festival_vendors_email ON festival_vendors(email);

ALTER TABLE festival_vendors ENABLE ROW LEVEL SECURITY;

-- Public can submit applications
CREATE POLICY "Public can apply as vendor"
  ON festival_vendors FOR INSERT
  TO anon
  WITH CHECK (true);

-- Team members can view and manage
CREATE POLICY "Team members can view vendors"
  ON festival_vendors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Team members can manage vendors"
  ON festival_vendors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

GRANT INSERT ON festival_vendors TO anon;
GRANT ALL ON festival_vendors TO authenticated;


-- ============================================
-- 4. FESTIVAL SPONSORS
-- Three paths: premium tiers, community ladder, activity zones, custom
-- ============================================

CREATE TABLE IF NOT EXISTS festival_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Organisation / contact
  organisation_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,

  -- Path & tier (tier_key validated app-side against catalog)
  -- Premium:   title_partner | community_impact | b2s_champion
  -- Community: family_fun | gold | silver | bronze | friend
  -- Activity:  activity_childrens_zone | activity_ice_cream | activity_arts_crafts | activity_sports | activity_face_painting
  -- Custom:    custom
  path TEXT NOT NULL CHECK (path IN ('premium', 'community', 'activity', 'custom')),
  tier_key TEXT NOT NULL,

  -- Display
  display_name TEXT,
  logo_url TEXT,
  website TEXT,
  message TEXT,

  -- Amount & payment
  amount_pledged INTEGER NOT NULL DEFAULT 0, -- in pence
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'pending_review', 'confirmed', 'cancelled', 'refunded')),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,

  -- Admin review
  reviewed_by UUID REFERENCES team_members(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_festival_sponsors_event_id ON festival_sponsors(event_id);
CREATE INDEX IF NOT EXISTS idx_festival_sponsors_status ON festival_sponsors(status);
CREATE INDEX IF NOT EXISTS idx_festival_sponsors_tier_key ON festival_sponsors(tier_key);
CREATE INDEX IF NOT EXISTS idx_festival_sponsors_path ON festival_sponsors(path);

ALTER TABLE festival_sponsors ENABLE ROW LEVEL SECURITY;

-- Public can submit sponsor inquiries
CREATE POLICY "Public can apply as sponsor"
  ON festival_sponsors FOR INSERT
  TO anon
  WITH CHECK (true);

-- Public can view CONFIRMED sponsors only (for the logo wall on the festival page)
CREATE POLICY "Public can view confirmed sponsors"
  ON festival_sponsors FOR SELECT
  TO anon
  USING (status = 'confirmed');

-- Team members can view and manage all
CREATE POLICY "Team members can view all sponsors"
  ON festival_sponsors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Team members can manage sponsors"
  ON festival_sponsors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

GRANT SELECT, INSERT ON festival_sponsors TO anon;
GRANT ALL ON festival_sponsors TO authenticated;


-- ============================================
-- 5. FESTIVAL VOLUNTEERS
-- ============================================

CREATE TABLE IF NOT EXISTS festival_volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Personal info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_over_18 BOOLEAN NOT NULL DEFAULT TRUE,
  date_of_birth DATE,

  -- Availability (jsonb shape: { setup: bool, am: bool, pm: bool, packdown: bool })
  availability JSONB NOT NULL DEFAULT '{}',

  -- Logistics
  t_shirt_size TEXT CHECK (t_shirt_size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  dietary_requirements TEXT,
  accessibility_needs TEXT,

  -- Skills
  skills TEXT,
  prior_experience TEXT,

  -- Safety
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  consent_to_contact BOOLEAN NOT NULL DEFAULT FALSE,

  -- Status (team allocates assigned_role free-text after talking to them)
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'assigned', 'declined', 'cancelled')),
  assigned_role TEXT,

  -- Admin review
  reviewed_by UUID REFERENCES team_members(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_festival_volunteers_event_id ON festival_volunteers(event_id);
CREATE INDEX IF NOT EXISTS idx_festival_volunteers_status ON festival_volunteers(status);
CREATE INDEX IF NOT EXISTS idx_festival_volunteers_email ON festival_volunteers(email);

ALTER TABLE festival_volunteers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can apply as volunteer"
  ON festival_volunteers FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Team members can view volunteers"
  ON festival_volunteers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Team members can manage volunteers"
  ON festival_volunteers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

GRANT INSERT ON festival_volunteers TO anon;
GRANT ALL ON festival_volunteers TO authenticated;


-- ============================================
-- 6. UPDATED_AT TRIGGERS
-- Reuses existing update_updated_at_column() function
-- ============================================

DROP TRIGGER IF EXISTS update_festival_vendors_updated_at ON festival_vendors;
CREATE TRIGGER update_festival_vendors_updated_at
  BEFORE UPDATE ON festival_vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_festival_sponsors_updated_at ON festival_sponsors;
CREATE TRIGGER update_festival_sponsors_updated_at
  BEFORE UPDATE ON festival_sponsors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_festival_volunteers_updated_at ON festival_volunteers;
CREATE TRIGGER update_festival_volunteers_updated_at
  BEFORE UPDATE ON festival_volunteers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Count festival headcount (sum of tickets, not registrations) for capacity tracking
CREATE OR REPLACE FUNCTION get_festival_headcount(p_event_id UUID)
RETURNS TABLE (
  total_tickets INTEGER,
  checked_in INTEGER,
  pending INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_tickets,
    COUNT(*) FILTER (WHERE checked_in_at IS NOT NULL)::INTEGER AS checked_in,
    COUNT(*) FILTER (WHERE checked_in_at IS NULL)::INTEGER AS pending
  FROM festival_tickets
  WHERE event_id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Count vendor applications by category & status for capacity gating
CREATE OR REPLACE FUNCTION get_festival_vendor_counts(p_event_id UUID)
RETURNS TABLE (
  category TEXT,
  pending_payment INTEGER,
  pending_review INTEGER,
  approved INTEGER,
  active_total INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.category::TEXT,
    COUNT(*) FILTER (WHERE v.status = 'pending_payment')::INTEGER AS pending_payment,
    COUNT(*) FILTER (WHERE v.status = 'pending_review')::INTEGER AS pending_review,
    COUNT(*) FILTER (WHERE v.status = 'approved')::INTEGER AS approved,
    COUNT(*) FILTER (WHERE v.status IN ('pending_payment', 'pending_review', 'approved'))::INTEGER AS active_total
  FROM festival_vendors v
  WHERE v.event_id = p_event_id
  GROUP BY v.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 8. SEED FESTIVAL EVENT
-- Creates the Evolution Fest 2026 event row in 'draft' status.
-- Publish via the admin panel when ready.
-- ============================================

INSERT INTO events (
  slug,
  title,
  short_description,
  full_description,
  category,
  event_type,
  date,
  arrival_time,
  start_time,
  end_time,
  venue_name,
  venue_address,
  age_group,
  cost,
  total_slots,
  waitlist_slots,
  max_children_per_registration,
  max_attendees_per_registration,
  registration_status,
  status,
  send_reminder_24h,
  send_reminder_1h
) VALUES (
  'evolution-fest-2026',
  'Evolution Fest 2026',
  'Celebrating one year of impact — a free family festival for all of Medway.',
  'Join us on Saturday 25 July 2026 from 12pm to 6pm at Strood Youth Centre for Evolution Fest 2026. A free, family day out celebrating one year of Evolution Impact Initiative — with food, games, arts & crafts, live entertainment, and community stalls. Every visit helps fund our Back to School campaign supporting 500 children across Medway.',
  'family',
  'mixed',
  '2026-07-25',
  '11:45',
  '12:00',
  '18:00',
  'Strood Youth Centre',
  'Strood, Medway',
  'All ages',
  'FREE',
  150,
  0,
  4,
  6,
  'auto',
  'draft',
  TRUE,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;


-- ============================================
-- DONE
-- ============================================
-- After running this migration:
-- 1. Restart your Next.js dev server
-- 2. Update lib/supabase/types.ts with the new tables
-- 3. The festival event is seeded as 'draft' — publish via admin when ready
