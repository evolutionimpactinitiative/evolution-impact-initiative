-- ============================================
-- events.strand — Creative Connections sub-category
-- ============================================
-- Creative Connections (National Lottery Awards for All grant) runs
-- three parallel strands: Youth (13–18), Men's, Women's. We tag each
-- event with its strand so admin/reporting can slice by sub-cohort.
-- Nullable; populated only when programme = 'creative_connections'.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS strand TEXT
    CHECK (strand IN ('youth', 'mens', 'womens'));

CREATE INDEX IF NOT EXISTS idx_events_strand
  ON events (strand)
  WHERE strand IS NOT NULL;
