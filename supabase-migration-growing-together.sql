-- ============================================
-- Growing Together — programme flag on events
-- ============================================
-- Growing Together is our BBC Children in Need "We Move Fwd: Foundations"
-- early years programme (0–5, funded £75k/3yr). Rather than a parallel
-- growing_together_sessions table, we mark existing events as part of the
-- programme so the whole registration / waitlist / attendance / QR stack
-- keeps working unchanged.
--
-- `programme`          — nullable text. 'growing_together' identifies a GT
--                        session. Nullable so all non-GT events remain
--                        untouched and the value space stays open for
--                        future strands.
-- `primary_difference` — which of GT's three outcome pillars the session
--                        primarily supports. See spec §6.
-- `cycle_number`       — 1..4, which of the four three-month cycles the
--                        session belongs to. Nullable so a session can be
--                        outside a cycle (e.g. a launch or celebration).
-- `what_to_expect`     — short-form parent-facing description of the
--                        session shape. Distinct from full_description
--                        (which is the marketing body).

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS programme TEXT;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS primary_difference TEXT
  CHECK (primary_difference IS NULL OR primary_difference IN ('confidence', 'connection', 'belonging'));

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS cycle_number INTEGER
  CHECK (cycle_number IS NULL OR cycle_number BETWEEN 1 AND 4);

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS what_to_expect TEXT;

-- Programme-scoped queries (public GT page, admin GT dashboard) filter on
-- programme + status + date, so a partial index keeps that hot path cheap
-- without indexing the (much larger) non-GT event set.
CREATE INDEX IF NOT EXISTS idx_events_programme
  ON events (programme, date)
  WHERE programme IS NOT NULL;
