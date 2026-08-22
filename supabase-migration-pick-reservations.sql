-- ============================================
-- Station 2 pick reservations
-- ============================================
-- When a steward scans a family's QR at Station 2 they land on a prep
-- screen that checks stock availability per requested item. As they
-- accept exact matches or substitutes, we insert reservation rows —
-- one per (child, chosen SKU). These earmark stock so a second steward
-- prepping at the same moment sees the reduced free count.
--
-- Lifecycle: reserved → consumed (handout scan) OR released (parent
-- no-show / substitution changed). "Consumed" is the terminal state
-- that also generates a real stock movement (–1) via the handout API
-- in a follow-up commit.

CREATE TABLE IF NOT EXISTS back_to_school_pick_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who this is for
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES registration_children(id) ON DELETE CASCADE,

  -- The CHOSEN SKU (what will actually be picked & put in the bag)
  category TEXT NOT NULL,
  colour TEXT NOT NULL,
  sleeve TEXT,
  fit TEXT NOT NULL,
  size TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0),

  -- The ORIGINAL SKU the child asked for (only populated if the chosen
  -- SKU is a substitute, so labels can print "size 7 substituting for
  -- size 7-8" cleanly).
  original_category TEXT,
  original_colour TEXT,
  original_sleeve TEXT,
  original_fit TEXT,
  original_size TEXT,

  status TEXT NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'consumed', 'released')),

  reserved_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  consumed_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  consumed_at TIMESTAMPTZ,
  released_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  released_at TIMESTAMPTZ,
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_b2s_pick_res_child
  ON back_to_school_pick_reservations(child_id, status);
CREATE INDEX IF NOT EXISTS idx_b2s_pick_res_sku
  ON back_to_school_pick_reservations(category, colour, fit, size, status);
CREATE INDEX IF NOT EXISTS idx_b2s_pick_res_status
  ON back_to_school_pick_reservations(status, reserved_at DESC);

-- RLS: team members + service role. Stewards use a steward-token auth
-- pattern in the API layer, so RLS just needs to cover the admin UI.
ALTER TABLE back_to_school_pick_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team read pick reservations"
  ON back_to_school_pick_reservations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));
CREATE POLICY "Team write pick reservations"
  ON back_to_school_pick_reservations FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));
