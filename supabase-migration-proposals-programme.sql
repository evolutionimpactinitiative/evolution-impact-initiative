-- ============================================
-- event_proposals.programme + strand
-- ============================================
-- Mirror the columns we added to the events table so a proposal can
-- declare its programme at the start of the wizard and the spawn flow
-- can carry those through to the created event. Nullable: a draft
-- proposal doesn't need programme set yet; general-event proposals
-- stay with programme=NULL.

ALTER TABLE event_proposals
  ADD COLUMN IF NOT EXISTS programme TEXT;

-- Allow NULL (admin hasn't picked yet), one of the two grant-funded
-- programmes, or the explicit "general" pick (which maps to NULL on
-- the spawned event — events.programme uses NULL to mean "no
-- programme tag").
ALTER TABLE event_proposals
  DROP CONSTRAINT IF EXISTS event_proposals_programme_check;
ALTER TABLE event_proposals
  ADD CONSTRAINT event_proposals_programme_check
  CHECK (programme IS NULL OR programme IN ('growing_together', 'creative_connections', 'general'));

ALTER TABLE event_proposals
  ADD COLUMN IF NOT EXISTS strand TEXT
    CHECK (strand IS NULL OR strand IN ('youth', 'mens', 'womens'));

CREATE INDEX IF NOT EXISTS idx_event_proposals_programme
  ON event_proposals (programme)
  WHERE programme IS NOT NULL;
