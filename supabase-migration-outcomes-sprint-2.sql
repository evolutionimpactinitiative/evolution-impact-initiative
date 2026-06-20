-- ============================================================================
-- Outcomes Phase 3 Sprint 2 — programme strand tagging + email-sent flag
-- ============================================================================
-- • Adds programme_strand TEXT column to outcome_invitations and
--   outcome_responses so each measurement can be attached to a specific
--   programme strand (CiN Early Years, NLAfA Youth, NLAfA Mens, etc.).
-- • Adds email_sent_at + recipient_email to outcome_invitations so the
--   admin UI can track which invitations have been sent.
--
-- Free-text rather than an enum so admins can introduce new strands without
-- a migration. Common values: "cin_early_years", "nlafa_youth",
-- "nlafa_mens", "nlafa_womens", "general".
--
-- Additive only. Safe to re-run.
-- ============================================================================

ALTER TABLE outcome_invitations
  ADD COLUMN IF NOT EXISTS programme_strand TEXT,
  ADD COLUMN IF NOT EXISTS recipient_email  TEXT,
  ADD COLUMN IF NOT EXISTS email_sent_at    TIMESTAMPTZ;

ALTER TABLE outcome_responses
  ADD COLUMN IF NOT EXISTS programme_strand TEXT;

CREATE INDEX IF NOT EXISTS idx_outcome_invitations_strand
  ON outcome_invitations(programme_strand)
  WHERE programme_strand IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_outcome_responses_strand
  ON outcome_responses(programme_strand)
  WHERE programme_strand IS NOT NULL;

COMMENT ON COLUMN outcome_invitations.programme_strand IS
  'Optional free-text strand tag. Common values: cin_early_years, nlafa_youth, nlafa_mens, nlafa_womens, general.';
COMMENT ON COLUMN outcome_responses.programme_strand IS
  'Copied from the invitation at response time so historical strand attribution survives invitation deletion.';
COMMENT ON COLUMN outcome_invitations.recipient_email IS
  'Email the invitation was (or will be) sent to. Stored separately from the participant in case the participant is anonymous.';
COMMENT ON COLUMN outcome_invitations.email_sent_at IS
  'NULL until the invitation email has been sent. Used by the admin UI to filter sent/unsent.';
