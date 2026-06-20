-- ============================================================================
-- Outcomes v1 — Phase 3 Sprint 1
-- ============================================================================
-- Outcomes measurement using free, well-established instruments:
--   • ONS4    — 4 ONS Personal Well-being questions, 0-10 scale
--   • SWEMWBS — 7-item Short Warwick-Edinburgh Mental Well-Being Scale,
--               5-point Likert. Standard population mean ≈25.
--
-- Schema:
--   outcome_instruments         — definitions (ONS4, SWEMWBS) + scoring rules
--   outcome_participants        — humans who respond to surveys
--   outcome_invitations         — token-gated one-shot invitations
--   outcome_responses           — one row per completed instrument, scored
--   outcome_response_items      — per-question answers (for re-scoring)
--
-- Existing `surveys` / `survey_responses` tables are LEFT ALONE — they're
-- event-feedback shaped (ad-hoc questions, no participant identity, no
-- scoring). Outcomes is a different beast.
--
-- Additive only. Safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Instruments — ONS4, SWEMWBS, etc.
-- ----------------------------------------------------------------------------
-- The `items` JSONB column holds an array of question objects:
--   [{ "id": "ons4_1", "text": "How satisfied with your life…", "scale": "0-10",
--      "scale_labels": { "0": "Not at all", "10": "Completely" } }, …]
--
-- `scoring` JSONB holds the algorithm:
--   { "method": "sum"|"average"|"swemwbs_transformed", "item_ids": [...] }
CREATE TABLE IF NOT EXISTS outcome_instruments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,                  -- 'ONS4', 'SWEMWBS', 'WEMWBS_14'
    name TEXT NOT NULL,
    short_description TEXT,
    source TEXT,                                -- citation / URL
    items JSONB NOT NULL,                       -- ordered list of questions
    scoring JSONB NOT NULL,                     -- how to compute the score
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE outcome_instruments IS
  'Catalog of well-being / outcome measurement instruments. ONS4 + SWEMWBS seeded; add more without code changes.';

-- ----------------------------------------------------------------------------
-- 2. Participants — the humans who fill in surveys
-- ----------------------------------------------------------------------------
-- Identified by email primarily; can be optionally linked to existing
-- donors / registrations / team_members for cross-system tracking.
CREATE TABLE IF NOT EXISTS outcome_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    name TEXT,
    notes TEXT,
    -- optional links to existing records (any may be NULL)
    donor_id UUID REFERENCES donors(id) ON DELETE SET NULL,
    registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
    team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE outcome_participants IS
  'People who respond to outcome surveys. Same person across baseline/follow-up = same participant row. Soft-identified by email.';

CREATE INDEX IF NOT EXISTS idx_outcome_participants_email
  ON outcome_participants(LOWER(email)) WHERE email IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 3. Invitations — token-gated single-use survey links
-- ----------------------------------------------------------------------------
-- Each invitation = "this participant, this instrument, this token, expires X".
-- Participant fills in via /outcomes/[token].
CREATE TABLE IF NOT EXISTS outcome_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL UNIQUE,                 -- URL-safe random string
    instrument_id UUID NOT NULL REFERENCES outcome_instruments(id) ON DELETE RESTRICT,
    participant_id UUID REFERENCES outcome_participants(id) ON DELETE SET NULL,
    -- "what does this measurement attach to?" — free-text label for now
    -- (Sprint 2 will introduce a programmes table)
    context_label TEXT,
    -- baseline / follow-up tagging
    timepoint TEXT NOT NULL DEFAULT 'baseline'
      CHECK (timepoint IN ('baseline', 'midpoint', 'follow_up', 'one_off')),
    expires_at TIMESTAMPTZ,
    response_id UUID,                           -- populated when filled in (FK added below)
    created_by UUID REFERENCES team_members(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE outcome_invitations IS
  'Token-gated single-use links to specific outcome instruments. token goes in the URL /outcomes/[token].';

CREATE INDEX IF NOT EXISTS idx_outcome_invitations_participant
  ON outcome_invitations(participant_id) WHERE participant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outcome_invitations_instrument
  ON outcome_invitations(instrument_id);
CREATE INDEX IF NOT EXISTS idx_outcome_invitations_open
  ON outcome_invitations(created_at DESC) WHERE response_id IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Responses — one row per completed instrument; auto-scored
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outcome_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID REFERENCES outcome_invitations(id) ON DELETE SET NULL,
    instrument_id UUID NOT NULL REFERENCES outcome_instruments(id) ON DELETE RESTRICT,
    participant_id UUID REFERENCES outcome_participants(id) ON DELETE SET NULL,
    context_label TEXT,
    timepoint TEXT NOT NULL DEFAULT 'one_off',
    -- numeric score per the instrument's scoring rule
    score_raw NUMERIC,                          -- raw computed score
    score_transformed NUMERIC,                  -- e.g. SWEMWBS metric-conversion score
    score_band TEXT,                            -- e.g. 'low', 'average', 'high'
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_from_ip INET,                     -- for spam/duplication checks
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE outcome_responses IS
  'One completed instrument = one row. Score columns are populated at submit time by the server action.';

CREATE INDEX IF NOT EXISTS idx_outcome_responses_instrument
  ON outcome_responses(instrument_id);
CREATE INDEX IF NOT EXISTS idx_outcome_responses_participant
  ON outcome_responses(participant_id) WHERE participant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outcome_responses_submitted_at
  ON outcome_responses(submitted_at DESC);

-- Backfill FK on invitations now that responses table exists
ALTER TABLE outcome_invitations
  DROP CONSTRAINT IF EXISTS outcome_invitations_response_id_fkey;
ALTER TABLE outcome_invitations
  ADD CONSTRAINT outcome_invitations_response_id_fkey
  FOREIGN KEY (response_id) REFERENCES outcome_responses(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 5. Per-question answers — store individual items so we can re-score later
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outcome_response_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES outcome_responses(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,                      -- matches an `id` in instrument.items
    value_numeric NUMERIC,
    value_text TEXT,                            -- for free-text follow-up fields if any
    UNIQUE (response_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_outcome_response_items_response
  ON outcome_response_items(response_id);

-- ----------------------------------------------------------------------------
-- 6. Updated-at triggers (re-use the helper from accounting)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_outcome_instruments_touch ON outcome_instruments;
CREATE TRIGGER trg_outcome_instruments_touch BEFORE UPDATE ON outcome_instruments
  FOR EACH ROW EXECUTE FUNCTION acct_touch_updated_at();

DROP TRIGGER IF EXISTS trg_outcome_participants_touch ON outcome_participants;
CREATE TRIGGER trg_outcome_participants_touch BEFORE UPDATE ON outcome_participants
  FOR EACH ROW EXECUTE FUNCTION acct_touch_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE outcome_instruments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_participants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_invitations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_responses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_response_items   ENABLE ROW LEVEL SECURITY;

-- Public can READ active instruments (so the survey page can render questions)
DROP POLICY IF EXISTS "Public can read active outcome_instruments" ON outcome_instruments;
CREATE POLICY "Public can read active outcome_instruments"
  ON outcome_instruments FOR SELECT TO anon, authenticated
  USING (is_active = TRUE);

-- Public can READ an invitation if they hold the token (server checks token)
-- We can't enforce token-in-WHERE via RLS, so we allow anon SELECT on any
-- non-expired invitation. The server query MUST filter by token.
-- (Token is high-entropy random — guessing it is impractical.)
DROP POLICY IF EXISTS "Public can read non-expired outcome_invitations" ON outcome_invitations;
CREATE POLICY "Public can read non-expired outcome_invitations"
  ON outcome_invitations FOR SELECT TO anon, authenticated
  USING (expires_at IS NULL OR expires_at > NOW());

-- Public can INSERT participants (anon survey-takers can self-identify by email)
DROP POLICY IF EXISTS "Public can insert outcome_participants" ON outcome_participants;
CREATE POLICY "Public can insert outcome_participants"
  ON outcome_participants FOR INSERT TO anon, authenticated
  WITH CHECK (TRUE);

-- Public can INSERT responses + response_items (the survey submit path)
DROP POLICY IF EXISTS "Public can insert outcome_responses" ON outcome_responses;
CREATE POLICY "Public can insert outcome_responses"
  ON outcome_responses FOR INSERT TO anon, authenticated
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Public can insert outcome_response_items" ON outcome_response_items;
CREATE POLICY "Public can insert outcome_response_items"
  ON outcome_response_items FOR INSERT TO anon, authenticated
  WITH CHECK (TRUE);

-- Team members can read EVERYTHING
DROP POLICY IF EXISTS "Team members can read outcome_instruments"    ON outcome_instruments;
DROP POLICY IF EXISTS "Team members can read outcome_participants"   ON outcome_participants;
DROP POLICY IF EXISTS "Team members can read outcome_invitations"    ON outcome_invitations;
DROP POLICY IF EXISTS "Team members can read outcome_responses"      ON outcome_responses;
DROP POLICY IF EXISTS "Team members can read outcome_response_items" ON outcome_response_items;

CREATE POLICY "Team members can read outcome_instruments"    ON outcome_instruments    FOR SELECT TO authenticated USING (acct_is_team_member());
CREATE POLICY "Team members can read outcome_participants"   ON outcome_participants   FOR SELECT TO authenticated USING (acct_is_team_member());
CREATE POLICY "Team members can read outcome_invitations"    ON outcome_invitations    FOR SELECT TO authenticated USING (acct_is_team_member());
CREATE POLICY "Team members can read outcome_responses"      ON outcome_responses      FOR SELECT TO authenticated USING (acct_is_team_member());
CREATE POLICY "Team members can read outcome_response_items" ON outcome_response_items FOR SELECT TO authenticated USING (acct_is_team_member());

-- Admins can WRITE instruments + participants + invitations
DROP POLICY IF EXISTS "Admins can write outcome_instruments"  ON outcome_instruments;
CREATE POLICY "Admins can write outcome_instruments"
  ON outcome_instruments FOR ALL TO authenticated
  USING (acct_is_admin()) WITH CHECK (acct_is_admin());

DROP POLICY IF EXISTS "Team members can write outcome_participants" ON outcome_participants;
CREATE POLICY "Team members can write outcome_participants"
  ON outcome_participants FOR ALL TO authenticated
  USING (acct_is_team_member()) WITH CHECK (acct_is_team_member());

DROP POLICY IF EXISTS "Team members can write outcome_invitations" ON outcome_invitations;
CREATE POLICY "Team members can write outcome_invitations"
  ON outcome_invitations FOR ALL TO authenticated
  USING (acct_is_team_member()) WITH CHECK (acct_is_team_member());

-- ============================================================================
-- SEED: ONS4
-- ============================================================================
INSERT INTO outcome_instruments (code, name, short_description, source, items, scoring, display_order)
VALUES
  ('ONS4',
   'ONS Personal Well-being (ONS4)',
   '4 standard ONS questions used by UK government statistics. Each scored 0-10.',
   'https://www.ons.gov.uk/peoplepopulationandcommunity/wellbeing',
   '[
     { "id": "ons4_life_satisfaction",  "text": "Overall, how satisfied are you with your life nowadays?",                         "scale": "0-10", "scale_labels": {"0": "Not at all", "10": "Completely"} },
     { "id": "ons4_worthwhile",         "text": "Overall, to what extent do you feel the things you do in your life are worthwhile?", "scale": "0-10", "scale_labels": {"0": "Not at all", "10": "Completely"} },
     { "id": "ons4_happiness",          "text": "Overall, how happy did you feel yesterday?",                                      "scale": "0-10", "scale_labels": {"0": "Not at all", "10": "Completely"} },
     { "id": "ons4_anxiety",            "text": "Overall, how anxious did you feel yesterday?",                                    "scale": "0-10", "scale_labels": {"0": "Not at all", "10": "Completely"}, "reverse": true }
   ]'::jsonb,
   '{
     "method": "ons4",
     "item_ids": ["ons4_life_satisfaction", "ons4_worthwhile", "ons4_happiness", "ons4_anxiety"]
   }'::jsonb,
   10)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SEED: SWEMWBS (7-item Short Warwick-Edinburgh Mental Well-Being Scale)
-- ============================================================================
-- Scoring: sum 7 items (each 1-5) → 7-35 raw → metric-converted via standard
-- SWEMWBS conversion table. The server action does the transform.
INSERT INTO outcome_instruments (code, name, short_description, source, items, scoring, display_order)
VALUES
  ('SWEMWBS',
   'Short Warwick-Edinburgh Mental Well-Being Scale',
   '7 items, 5-point Likert. Population mean ≈ 25 (transformed score).',
   'https://warwick.ac.uk/fac/sci/med/research/platform/wemwbs/',
   '[
     { "id": "swemwbs_optimistic",        "text": "I''ve been feeling optimistic about the future",      "scale": "1-5", "scale_labels": {"1": "None of the time", "2": "Rarely", "3": "Some of the time", "4": "Often", "5": "All of the time"} },
     { "id": "swemwbs_useful",            "text": "I''ve been feeling useful",                          "scale": "1-5", "scale_labels": {"1": "None of the time", "2": "Rarely", "3": "Some of the time", "4": "Often", "5": "All of the time"} },
     { "id": "swemwbs_relaxed",           "text": "I''ve been feeling relaxed",                         "scale": "1-5", "scale_labels": {"1": "None of the time", "2": "Rarely", "3": "Some of the time", "4": "Often", "5": "All of the time"} },
     { "id": "swemwbs_dealing_with_probs","text": "I''ve been dealing with problems well",              "scale": "1-5", "scale_labels": {"1": "None of the time", "2": "Rarely", "3": "Some of the time", "4": "Often", "5": "All of the time"} },
     { "id": "swemwbs_thinking_clearly",  "text": "I''ve been thinking clearly",                        "scale": "1-5", "scale_labels": {"1": "None of the time", "2": "Rarely", "3": "Some of the time", "4": "Often", "5": "All of the time"} },
     { "id": "swemwbs_close_to_others",   "text": "I''ve been feeling close to other people",           "scale": "1-5", "scale_labels": {"1": "None of the time", "2": "Rarely", "3": "Some of the time", "4": "Often", "5": "All of the time"} },
     { "id": "swemwbs_able_to_decide",    "text": "I''ve been able to make up my own mind about things","scale": "1-5", "scale_labels": {"1": "None of the time", "2": "Rarely", "3": "Some of the time", "4": "Often", "5": "All of the time"} }
   ]'::jsonb,
   '{
     "method": "swemwbs",
     "item_ids": ["swemwbs_optimistic", "swemwbs_useful", "swemwbs_relaxed", "swemwbs_dealing_with_probs", "swemwbs_thinking_clearly", "swemwbs_close_to_others", "swemwbs_able_to_decide"]
   }'::jsonb,
   20)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Notes:
-- • SWEMWBS metric conversion is a standard lookup (Warwick-Edinburgh) — done
--   in lib/outcomes/scoring.ts at submit time, NOT in SQL, so we can update
--   the table without a migration if needed.
-- • Sprint 2 will add: programme strands taxonomy, admin invitation UI +
--   email send, aggregate dashboards, full 14-item WEMWBS.
-- ============================================================================
