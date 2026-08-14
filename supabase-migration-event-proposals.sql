-- ============================================
-- Event proposals — team drafts → board review → approval
-- ============================================
-- Any team member can draft an event proposal via a wizard. Board members
-- comment on it, request more info, then approve or reject. Approval will
-- spawn a linked draft event row (built in a follow-up commit) and unlock
-- a launch playbook.
--
-- Big-shape data (schedule rows, cost lines, risks etc) is stored as
-- JSONB — flexible without a table explosion, and always accessed via
-- the app not raw SQL reports.
--
-- Board discussion lives in event_proposal_comments — a small append-only
-- table indexed by proposal.


-- ============================================
-- 1. PROPOSALS
-- ============================================

CREATE TABLE IF NOT EXISTS event_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Overview
  title TEXT NOT NULL,
  event_types TEXT[] NOT NULL DEFAULT '{}',
    -- multi-select: workshop / community / sports / creative /
    -- educational / family / outreach / other
  event_type_other TEXT,
  summary TEXT,

  -- Timing
  preferred_date DATE,
  alt_date DATE,
  event_start_time TEXT,        -- freeform "12:00" — no need for TIME strictness
  event_end_time TEXT,
  setup_start_time TEXT,
  packdown_end_time TEXT,

  -- Venue
  primary_venue_name TEXT,
  primary_venue_address TEXT,
  primary_venue_type TEXT
    CHECK (primary_venue_type IN ('indoor', 'outdoor', 'both') OR primary_venue_type IS NULL),
  primary_venue_notes TEXT,       -- "why is this venue suitable"
  alt_venue_name TEXT,
  alt_venue_address TEXT,
  alt_venue_type TEXT
    CHECK (alt_venue_type IN ('indoor', 'outdoor', 'both') OR alt_venue_type IS NULL),

  -- Target group
  age_groups TEXT[] NOT NULL DEFAULT '{}',
    -- '0-5' / '6-12' / '13-17' / '18-25' / '26+' / 'mixed'
  expected_participants INTEGER,
  plus_parents_carers BOOLEAN NOT NULL DEFAULT FALSE,
  accessibility_notes TEXT,

  -- Aims + outcomes
  event_aim TEXT,
  objectives JSONB NOT NULL DEFAULT '[]'::jsonb,           -- string[]
  learning_outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,    -- string[]

  -- The plan
  schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{ start: "12:00", duration_min: 15, activity: "Welcome" }]
  activities JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{ activity: "Team relays", achieves: "Teamwork + coordination" }]

  -- Team
  event_planner_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  event_facilitator_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  event_facilitator_external TEXT,   -- for non-team facilitators
  assistant_volunteer_ids UUID[] NOT NULL DEFAULT '{}',
  assistant_volunteers_external TEXT,-- freeform list of external volunteers
  staff_needed JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{ role: "Activity facilitator", count: 3 }]
  ratio_adults INTEGER,              -- "1 adult to N children"
  ratio_children INTEGER,
  safeguarding_practices TEXT[] NOT NULL DEFAULT '{}',
    -- ['dbs_checked','sign_in_out','safeguarding_lead','emergency_contacts',...]
  safeguarding_notes TEXT,

  -- Kit + budget
  equipment JSONB NOT NULL DEFAULT '[]'::jsonb,           -- string[]
  equipment_source TEXT,
  cost_lines JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{ item: "Art supplies", amount_pence: 5000 }]
  funding_pot_ids UUID[] NOT NULL DEFAULT '{}',
    -- references funds(id); multi-fund allowed for split budgets

  -- Risk
  key_risks JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{ risk, likelihood: 'L|M|H', impact: 'L|M|H' }]
  contingency_plan TEXT,

  -- Promotion + registration
  promotion_channels TEXT[] NOT NULL DEFAULT '{}',
    -- ['instagram','facebook','linkedin','tiktok','whatsapp','flyers','word_of_mouth','other']
  registration_method TEXT
    CHECK (registration_method IN ('website_form','google_form','email','walk_in','other')
      OR registration_method IS NULL),
  registration_notes TEXT,

  -- Success measures
  success_measures JSONB NOT NULL DEFAULT '[]'::jsonb,    -- string[]

  -- Consent baseline
  photo_video_consent_default TEXT
    CHECK (photo_video_consent_default IN ('opt_in','opt_out','none')
      OR photo_video_consent_default IS NULL),

  -- Workflow
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'in_review', 'needs_info', 'approved', 'rejected')),
  submitted_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Spawned event link (populated on approval; the event lives in the
  -- existing events table so the public site + registration system all
  -- work as-is).
  spawned_event_id UUID REFERENCES events(id) ON DELETE SET NULL,

  created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_proposals_status
  ON event_proposals(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_proposals_planner
  ON event_proposals(event_planner_id);
CREATE INDEX IF NOT EXISTS idx_event_proposals_created_by
  ON event_proposals(created_by);


-- ============================================
-- 2. BOARD DISCUSSION THREAD
-- ============================================

CREATE TABLE IF NOT EXISTS event_proposal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES event_proposals(id) ON DELETE CASCADE,
  author_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
    -- Reserved for programmatic events ("Status changed to approved",
    -- "Marked ready for review") — shown differently in the UI.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_proposal_comments_proposal
  ON event_proposal_comments(proposal_id, created_at);


-- ============================================
-- 3. TRIGGERS
-- ============================================

CREATE TRIGGER update_event_proposals_updated_at
  BEFORE UPDATE ON event_proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 4. RLS — team members only
-- ============================================

ALTER TABLE event_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_proposal_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team read proposals"
  ON event_proposals FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));
CREATE POLICY "Team write proposals"
  ON event_proposals FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Team read comments"
  ON event_proposal_comments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));
CREATE POLICY "Team write comments"
  ON event_proposal_comments FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));
