-- Migration: Community Engagement Features
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. MAILING LIST TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS mailing_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  source TEXT DEFAULT 'footer' CHECK (source IN ('footer', 'registration', 'event', 'manual')),
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_mailing_list_email ON mailing_list(email);
CREATE INDEX IF NOT EXISTS idx_mailing_list_status ON mailing_list(status);

-- RLS policies
ALTER TABLE mailing_list ENABLE ROW LEVEL SECURITY;

-- Team members can view all subscribers
CREATE POLICY "Team members can view mailing list"
  ON mailing_list FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt()->>'email'
    )
  );

-- Team members can manage subscribers
CREATE POLICY "Team members can manage mailing list"
  ON mailing_list FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt()->>'email'
    )
  );

-- Anyone can subscribe (public insert)
CREATE POLICY "Public can subscribe"
  ON mailing_list FOR INSERT
  TO anon
  WITH CHECK (true);

-- ============================================
-- 2. SURVEYS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  survey_type TEXT DEFAULT 'event_feedback' CHECK (survey_type IN ('event_feedback', 'activity_interest', 'general')),
  questions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_surveys_event_id ON surveys(event_id);
CREATE INDEX IF NOT EXISTS idx_surveys_type ON surveys(survey_type);
CREATE INDEX IF NOT EXISTS idx_surveys_active ON surveys(is_active);

-- RLS policies
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- Team members can manage surveys
CREATE POLICY "Team members can manage surveys"
  ON surveys FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt()->>'email'
    )
  );

-- Public can view active surveys (for filling out)
CREATE POLICY "Public can view active surveys"
  ON surveys FOR SELECT
  TO anon
  USING (is_active = true);

-- ============================================
-- 3. SURVEY RESPONSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  respondent_email TEXT NOT NULL,
  respondent_name TEXT,
  answers JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'partial'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_event_id ON survey_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_email ON survey_responses(respondent_email);

-- RLS policies
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Team members can view all responses
CREATE POLICY "Team members can view survey responses"
  ON survey_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt()->>'email'
    )
  );

-- Public can submit responses
CREATE POLICY "Public can submit survey responses"
  ON survey_responses FOR INSERT
  TO anon
  WITH CHECK (true);

-- ============================================
-- 4. ADD PHOTO_ALBUM_URL TO EVENTS TABLE
-- ============================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS photo_album_url TEXT;

-- ============================================
-- 5. UPDATED_AT TRIGGER FOR SURVEYS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_surveys_updated_at ON surveys;
CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT ON mailing_list TO anon;
GRANT ALL ON mailing_list TO authenticated;

GRANT SELECT ON surveys TO anon;
GRANT ALL ON surveys TO authenticated;

GRANT INSERT ON survey_responses TO anon;
GRANT ALL ON survey_responses TO authenticated;
