-- ============================================
-- email_logs.survey_id
-- ============================================
-- Added so the "email survey to attendees" admin action can tag each
-- send with the survey it broadcast, and the admin UI can count prior
-- broadcasts to warn before a repeat send.

ALTER TABLE email_logs
  ADD COLUMN IF NOT EXISTS survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_email_logs_survey_id
  ON email_logs (survey_id);
