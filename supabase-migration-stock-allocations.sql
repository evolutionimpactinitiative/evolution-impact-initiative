-- ============================================
-- Stock allocations — cover a shortfall with another SKU's surplus
-- ============================================
-- After registrations close, the team walks the stock matrix looking at
-- shortages vs surpluses. Often a shortage in size 5 girls' blue polo
-- can be covered by a size 5-6 girls' blue polo the drive already has.
-- An allocation records that decision: N units of the FROM sku are
-- earmarked to cover the TO sku's demand.
--
-- Effect on displayed numbers (computed at read time, no triggers):
--   TO   sku: shortfall drops by qty   (demand covered by substitute)
--   FROM sku: surplus  drops by qty    (stock earmarked)
--   shopping list: "still to buy" drops by qty for the TO sku
--
-- Scope: FROM + TO must share `category` (a polo can only cover a polo).
-- Everything else (colour, fit, sleeve, size) is free — the team judges
-- what's an acceptable substitute.

CREATE TABLE IF NOT EXISTS back_to_school_stock_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Both sides live in the same category (polo, shirt, trousers, …)
  -- but colour/fit/sleeve/size can differ.
  category TEXT NOT NULL,

  from_colour TEXT NOT NULL,
  from_sleeve TEXT,
  from_fit    TEXT NOT NULL,
  from_size   TEXT NOT NULL,

  to_colour TEXT NOT NULL,
  to_sleeve TEXT,
  to_fit    TEXT NOT NULL,
  to_size   TEXT NOT NULL,

  qty INTEGER NOT NULL CHECK (qty > 0),
  note TEXT,

  created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_b2s_alloc_from
  ON back_to_school_stock_allocations(category, from_colour, from_fit, from_size);
CREATE INDEX IF NOT EXISTS idx_b2s_alloc_to
  ON back_to_school_stock_allocations(category, to_colour, to_fit, to_size);

ALTER TABLE back_to_school_stock_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team read allocations"
  ON back_to_school_stock_allocations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Team write allocations"
  ON back_to_school_stock_allocations FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));
