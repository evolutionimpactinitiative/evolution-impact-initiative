-- ============================================
-- Back to School — manual stock count sessions
-- ============================================
-- Before the drive we box up every SKU into labelled clear boxes ("3-4
-- white polo boys" etc). As each item goes in the box, someone taps
-- +1 on the app. When we've boxed everything we compare the tally
-- against the system stock and apply the truth. Deltas are logged as
-- ordinary stock movements so we keep an audit trail.

CREATE TABLE IF NOT EXISTS back_to_school_count_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                  -- "Boxing day count 21 Aug 2026"
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'cancelled')),
  started_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  closed_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  closed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_b2s_count_session_status
  ON back_to_school_count_sessions(status, started_at DESC);

-- Only one open session at a time — simpler mental model and matches
-- our operational reality (one boxing day, one running tally).
CREATE UNIQUE INDEX IF NOT EXISTS idx_b2s_count_only_one_open
  ON back_to_school_count_sessions(status)
  WHERE status = 'open';


-- One tally row per SKU per session. UPSERT on increment/decrement.
CREATE TABLE IF NOT EXISTS back_to_school_count_tallies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES back_to_school_count_sessions(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  colour TEXT NOT NULL,
  sleeve TEXT,                         -- NULL for non-sleeved categories
  fit TEXT NOT NULL,
  size TEXT NOT NULL,
  counted INTEGER NOT NULL DEFAULT 0 CHECK (counted >= 0),
  notes TEXT,
  updated_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uniqueness with a nullable sleeve column — use COALESCE so NULL and
-- '' collapse to the same key, otherwise Postgres treats every NULL
-- sleeve as unique and we'd get duplicate SKU rows per session.
CREATE UNIQUE INDEX IF NOT EXISTS idx_b2s_count_tally_uniq
  ON back_to_school_count_tallies(
    session_id, category, colour, COALESCE(sleeve, ''), fit, size
  );

CREATE INDEX IF NOT EXISTS idx_b2s_count_tally_session
  ON back_to_school_count_tallies(session_id);


-- Trigger to auto-bump updated_at on tally writes (reuses existing helper).
CREATE TRIGGER update_b2s_count_tallies_updated_at
  BEFORE UPDATE ON back_to_school_count_tallies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─── RLS: team-only ────────────────────────────────────────────
ALTER TABLE back_to_school_count_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE back_to_school_count_tallies  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team read count sessions"
  ON back_to_school_count_sessions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));
CREATE POLICY "Team write count sessions"
  ON back_to_school_count_sessions FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Team read count tallies"
  ON back_to_school_count_tallies FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));
CREATE POLICY "Team write count tallies"
  ON back_to_school_count_tallies FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));
