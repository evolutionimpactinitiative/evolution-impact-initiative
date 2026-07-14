-- ============================================
-- Back to School Drive 2026 — sponsor inquiries
-- ============================================
-- Captures inbound sponsorship interest from local businesses. The tiers
-- mirror the sponsorship booklet ladder (Friend £50 → Title Partner £3,000).
-- Actual payments flow through the existing donations pipeline tagged with
-- campaign = 'back-to-school-2026' so the £10,000 progress bar stays a
-- single source of truth across donors, sponsors and pledges.

CREATE TABLE IF NOT EXISTS back_to_school_sponsor_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_role TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN (
    'friend', 'bronze', 'silver', 'gold', 'family',
    'champion', 'major', 'title', 'custom', 'undecided'
  )),
  amount_gbp INTEGER, -- pounds, indicative if the sponsor named a figure
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'contacted', 'confirmed', 'declined', 'cancelled')),
  admin_notes TEXT,
  followed_up_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_b2s_sponsor_inquiries_status
  ON back_to_school_sponsor_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_b2s_sponsor_inquiries_created_at
  ON back_to_school_sponsor_inquiries(created_at DESC);

ALTER TABLE back_to_school_sponsor_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can inquire about sponsorship"
  ON back_to_school_sponsor_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Team members can view sponsor inquiries"
  ON back_to_school_sponsor_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Team members can manage sponsor inquiries"
  ON back_to_school_sponsor_inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Team members can delete sponsor inquiries"
  ON back_to_school_sponsor_inquiries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

CREATE TRIGGER update_b2s_sponsor_inquiries_updated_at
  BEFORE UPDATE ON back_to_school_sponsor_inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
