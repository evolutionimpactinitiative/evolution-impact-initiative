-- Migration: Email Logs and Subscriber Tags
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ADD TAGS COLUMN TO MAILING_LIST
-- ============================================

ALTER TABLE mailing_list ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Index for tag filtering
CREATE INDEX IF NOT EXISTS idx_mailing_list_tags ON mailing_list USING GIN(tags);

-- ============================================
-- 2. EMAIL LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL, -- 'individual', 'bulk', 'automated', 'survey', 'event'
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  sent_by TEXT, -- admin email who sent it
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}' -- extra info like event_id, survey_id, etc.
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- RLS policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Team members can view email logs
CREATE POLICY "Team members can view email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt()->>'email'
    )
  );

-- Team members can insert email logs
CREATE POLICY "Team members can insert email logs"
  ON email_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt()->>'email'
    )
  );

-- Service role can insert (for API routes)
GRANT INSERT ON email_logs TO anon;
GRANT SELECT ON email_logs TO authenticated;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON email_logs TO authenticated;
