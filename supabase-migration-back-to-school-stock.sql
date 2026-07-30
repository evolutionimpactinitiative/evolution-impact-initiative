-- ============================================
-- Back to School Drive 2026 — stock / inventory
-- ============================================
-- One row per SKU (category + colour + sleeve + fit + size) with a running
-- `quantity`. Every change is written to `back_to_school_stock_movements`
-- so the current quantity is always the SUM of deltas — the row's own
-- `quantity` column is maintained by a trigger for fast reads.
--
-- Demand for a SKU is derived at query time from approved registrations
-- (registration_children.uniform_choices + sex + uniform_size); it is NOT
-- stored here, so approving/cancelling a family updates the "requested"
-- column of the stock matrix automatically.
--
-- Movement reasons:
--   opening_balance — imported from last year's leftover count
--   donation        — supply pledge received
--   purchase        — bought in
--   distributed     — given to a family on the day (negative delta)
--   adjustment      — manual +/- (e.g. found more in a box, spoiled item)
--   correction      — undoing a wrong entry


-- ============================================
-- 1. STOCK — one row per SKU
-- ============================================

CREATE TABLE IF NOT EXISTS back_to_school_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL
    CHECK (category IN ('polo', 'shirt', 'trousers', 'skirt', 'dress', 'shorts')),
  colour TEXT NOT NULL
    CHECK (colour IN ('white', 'blue', 'grey', 'black')),
  sleeve TEXT
    CHECK (sleeve IN ('short', 'long')),
  fit TEXT NOT NULL DEFAULT 'unisex'
    CHECK (fit IN ('boys', 'girls', 'unisex')),
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SKU uniqueness — COALESCE the nullable `sleeve` so PostgreSQL doesn't treat
-- two NULLs as distinct (which would let e.g. two "grey boys trousers, size 7"
-- rows exist).
CREATE UNIQUE INDEX IF NOT EXISTS uq_b2s_stock_sku
  ON back_to_school_stock (category, colour, COALESCE(sleeve, ''), fit, size);

CREATE INDEX IF NOT EXISTS idx_b2s_stock_category
  ON back_to_school_stock(category);

COMMENT ON COLUMN back_to_school_stock.fit IS
  'Which cut this SKU is — matched against child.sex at demand time. "unisex" counts against any child.';
COMMENT ON COLUMN back_to_school_stock.quantity IS
  'Denormalised running total, maintained by trigger from stock movements.';


-- ============================================
-- 2. STOCK MOVEMENTS — append-only ledger
-- ============================================

CREATE TABLE IF NOT EXISTS back_to_school_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES back_to_school_stock(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL
    CHECK (reason IN (
      'opening_balance',
      'donation',
      'purchase',
      'distributed',
      'adjustment',
      'correction'
    )),
  pledge_id UUID REFERENCES back_to_school_supply_pledges(id) ON DELETE SET NULL,
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  child_id UUID REFERENCES registration_children(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_b2s_stock_movements_stock
  ON back_to_school_stock_movements(stock_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_b2s_stock_movements_reason
  ON back_to_school_stock_movements(reason);
CREATE INDEX IF NOT EXISTS idx_b2s_stock_movements_pledge
  ON back_to_school_stock_movements(pledge_id)
  WHERE pledge_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_b2s_stock_movements_child
  ON back_to_school_stock_movements(child_id)
  WHERE child_id IS NOT NULL;

COMMENT ON TABLE back_to_school_stock_movements IS
  'Append-only ledger. Never UPDATE or DELETE — record a "correction" delta instead.';


-- ============================================
-- 3. TRIGGER — keep stock.quantity in sync
-- ============================================

CREATE OR REPLACE FUNCTION apply_b2s_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE back_to_school_stock
    SET quantity = quantity + NEW.delta,
        updated_at = NOW()
    WHERE id = NEW.stock_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_apply_b2s_stock_movement
  ON back_to_school_stock_movements;
CREATE TRIGGER trg_apply_b2s_stock_movement
  AFTER INSERT ON back_to_school_stock_movements
  FOR EACH ROW EXECUTE FUNCTION apply_b2s_stock_movement();


-- ============================================
-- 4. RLS — team-members only
-- ============================================

ALTER TABLE back_to_school_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE back_to_school_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members read stock"
  ON back_to_school_stock FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Team members write stock"
  ON back_to_school_stock FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Team members read stock movements"
  ON back_to_school_stock_movements FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Team members write stock movements"
  ON back_to_school_stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));

CREATE TRIGGER update_b2s_stock_updated_at
  BEFORE UPDATE ON back_to_school_stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 5. SEED — 2025 leftover stock (opening balance)
-- ============================================
-- Import of "Stock count - B2S Drive.xlsx" — 231 items across 13 SKUs.
-- Safe to re-run: uses ON CONFLICT DO NOTHING on the SKU unique index and
-- skips seeding movements if any opening_balance already exists.

DO $$
DECLARE
  already_seeded BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM back_to_school_stock_movements WHERE reason = 'opening_balance'
  ) INTO already_seeded;

  IF already_seeded THEN
    RAISE NOTICE 'Opening balance already seeded — skipping.';
    RETURN;
  END IF;

  -- Ensure SKU rows exist for every non-zero cell (idempotent).
  INSERT INTO back_to_school_stock (category, colour, sleeve, fit, size, quantity, notes) VALUES
    -- Blue Polo (unisex short sleeve)
    ('polo', 'blue', 'short', 'unisex', '4-5',  0, '2025 leftover'),
    ('polo', 'blue', 'short', 'unisex', '5-6',  0, '2025 leftover'),
    ('polo', 'blue', 'short', 'unisex', '6',    0, '2025 leftover'),
    ('polo', 'blue', 'short', 'unisex', '6-7',  0, '2025 leftover'),
    ('polo', 'blue', 'short', 'unisex', '9-10', 0, '2025 leftover'),
    ('polo', 'blue', 'short', 'unisex', '11',   0, '2025 leftover'),
    -- White Polo (Boys, short sleeve)
    ('polo', 'white', 'short', 'boys', '3-4', 0, '2025 leftover'),
    ('polo', 'white', 'short', 'boys', '4',   0, '2025 leftover'),
    ('polo', 'white', 'short', 'boys', '4-5', 0, '2025 leftover'),
    ('polo', 'white', 'short', 'boys', '8',   0, '2025 leftover'),
    ('polo', 'white', 'short', 'boys', '8-9', 0, '2025 leftover'),
    -- White Polo long sleeve (unisex)
    ('polo', 'white', 'long', 'unisex', '6-7',  0, '2025 leftover'),
    ('polo', 'white', 'long', 'unisex', '9-10', 0, '2025 leftover'),
    -- White Polo (Girls, short sleeve)
    ('polo', 'white', 'short', 'girls', '4-5', 0, '2025 leftover'),
    ('polo', 'white', 'short', 'girls', '5-6', 0, '2025 leftover'),
    ('polo', 'white', 'short', 'girls', '6-7', 0, '2025 leftover'),
    ('polo', 'white', 'short', 'girls', '7',   0, '2025 leftover'),
    -- Boys White Shirt (short sleeve)
    ('shirt', 'white', 'short', 'boys', '5-6',   0, '2025 leftover'),
    ('shirt', 'white', 'short', 'boys', '6',     0, '2025 leftover'),
    ('shirt', 'white', 'short', 'boys', '6-7',   0, '2025 leftover'),
    ('shirt', 'white', 'short', 'boys', '7-8',   0, '2025 leftover'),
    ('shirt', 'white', 'short', 'boys', '8-9',   0, '2025 leftover'),
    ('shirt', 'white', 'short', 'boys', '10-11', 0, '2025 leftover'),
    -- Boys White Shirt (long sleeve)
    ('shirt', 'white', 'long', 'boys', '5-6', 0, '2025 leftover'),
    ('shirt', 'white', 'long', 'boys', '6',   0, '2025 leftover'),
    ('shirt', 'white', 'long', 'boys', '7',   0, '2025 leftover'),
    ('shirt', 'white', 'long', 'boys', '11',  0, '2025 leftover'),
    -- Girls White Shirt (short sleeve)
    ('shirt', 'white', 'short', 'girls', '7',   0, '2025 leftover'),
    ('shirt', 'white', 'short', 'girls', '7-8', 0, '2025 leftover'),
    ('shirt', 'white', 'short', 'girls', '8',   0, '2025 leftover'),
    -- Girls White Shirt (long sleeve)
    ('shirt', 'white', 'long', 'girls', '5-6',  0, '2025 leftover'),
    ('shirt', 'white', 'long', 'girls', '6-7',  0, '2025 leftover'),
    ('shirt', 'white', 'long', 'girls', '8',    0, '2025 leftover'),
    ('shirt', 'white', 'long', 'girls', '9-10', 0, '2025 leftover'),
    ('shirt', 'white', 'long', 'girls', '10',   0, '2025 leftover'),
    -- Grey Trouser (Boys)
    ('trousers', 'grey', NULL, 'boys', '4',     0, '2025 leftover'),
    ('trousers', 'grey', NULL, 'boys', '4-5',   0, '2025 leftover'),
    ('trousers', 'grey', NULL, 'boys', '5-6',   0, '2025 leftover'),
    ('trousers', 'grey', NULL, 'boys', '6',     0, '2025 leftover'),
    ('trousers', 'grey', NULL, 'boys', '6-7',   0, '2025 leftover'),
    ('trousers', 'grey', NULL, 'boys', '7',     0, '2025 leftover'),
    ('trousers', 'grey', NULL, 'boys', '7-8',   0, '2025 leftover'),
    ('trousers', 'grey', NULL, 'boys', '8-9',   0, '2025 leftover'),
    ('trousers', 'grey', NULL, 'boys', '9-10',  0, '2025 leftover'),
    ('trousers', 'grey', NULL, 'boys', '10-11', 0, '2025 leftover'),
    ('trousers', 'grey', NULL, 'boys', '11-12', 0, '2025 leftover'),
    ('trousers', 'grey', NULL, 'boys', '12-13', 0, '2025 leftover'),
    -- Grey Trouser (Girls)
    ('trousers', 'grey', NULL, 'girls', '3-4', 0, '2025 leftover'),
    ('trousers', 'grey', NULL, 'girls', '4-5', 0, '2025 leftover'),
    ('trousers', 'grey', NULL, 'girls', '5',   0, '2025 leftover'),
    ('trousers', 'grey', NULL, 'girls', '5-6', 0, '2025 leftover'),
    ('trousers', 'grey', NULL, 'girls', '6-7', 0, '2025 leftover'),
    ('trousers', 'grey', NULL, 'girls', '7',   0, '2025 leftover'),
    ('trousers', 'grey', NULL, 'girls', '7-8', 0, '2025 leftover'),
    -- Grey Skirts (Girls)
    ('skirt', 'grey', NULL, 'girls', '3-4', 0, '2025 leftover'),
    ('skirt', 'grey', NULL, 'girls', '6-7', 0, '2025 leftover'),
    -- Black Skirts (Girls)
    ('skirt', 'black', NULL, 'girls', '8-9', 0, '2025 leftover'),
    -- Blue Skirts (Girls)
    ('skirt', 'blue', NULL, 'girls', '7-8',   0, '2025 leftover'),
    ('skirt', 'blue', NULL, 'girls', '8-9',   0, '2025 leftover'),
    ('skirt', 'blue', NULL, 'girls', '9-10',  0, '2025 leftover'),
    ('skirt', 'blue', NULL, 'girls', '10-11', 0, '2025 leftover')
  ON CONFLICT DO NOTHING;

  -- Post the opening-balance movements. The trigger updates
  -- back_to_school_stock.quantity for each row.
  -- Blue Polo (unisex short)
  INSERT INTO back_to_school_stock_movements (stock_id, delta, reason, notes)
  SELECT id, v.qty, 'opening_balance', '2025 leftover stock (Excel import)' FROM (VALUES
    ('polo','blue','short','unisex','4-5',13),
    ('polo','blue','short','unisex','5-6', 3),
    ('polo','blue','short','unisex','6',   1),
    ('polo','blue','short','unisex','6-7', 2),
    ('polo','blue','short','unisex','9-10',1),
    ('polo','blue','short','unisex','11',  2),
    ('polo','white','short','boys','3-4',  1),
    ('polo','white','short','boys','4',    2),
    ('polo','white','short','boys','4-5', 11),
    ('polo','white','short','boys','8',    1),
    ('polo','white','short','boys','8-9',  1),
    ('polo','white','long','unisex','6-7', 1),
    ('polo','white','long','unisex','9-10',6),
    ('polo','white','short','girls','4-5', 2),
    ('polo','white','short','girls','5-6', 1),
    ('polo','white','short','girls','6-7', 4),
    ('polo','white','short','girls','7',   1),
    ('shirt','white','short','boys','5-6', 3),
    ('shirt','white','short','boys','6',   6),
    ('shirt','white','short','boys','6-7', 5),
    ('shirt','white','short','boys','7-8', 2),
    ('shirt','white','short','boys','8-9', 1),
    ('shirt','white','short','boys','10-11',1),
    ('shirt','white','long','boys','5-6',  6),
    ('shirt','white','long','boys','6',    3),
    ('shirt','white','long','boys','7',    4),
    ('shirt','white','long','boys','11',   3),
    ('shirt','white','short','girls','7',  3),
    ('shirt','white','short','girls','7-8',2),
    ('shirt','white','short','girls','8', 12),
    ('shirt','white','long','girls','5-6',16),
    ('shirt','white','long','girls','6-7', 2),
    ('shirt','white','long','girls','8',   7),
    ('shirt','white','long','girls','9-10',3),
    ('shirt','white','long','girls','10',  1),
    ('trousers','grey',NULL,'boys','4',    4),
    ('trousers','grey',NULL,'boys','4-5',  4),
    ('trousers','grey',NULL,'boys','5-6',  4),
    ('trousers','grey',NULL,'boys','6',    5),
    ('trousers','grey',NULL,'boys','6-7',  7),
    ('trousers','grey',NULL,'boys','7',    2),
    ('trousers','grey',NULL,'boys','7-8',  3),
    ('trousers','grey',NULL,'boys','8-9',  6),
    ('trousers','grey',NULL,'boys','9-10', 1),
    ('trousers','grey',NULL,'boys','10-11',1),
    ('trousers','grey',NULL,'boys','11-12',2),
    ('trousers','grey',NULL,'boys','12-13',1),
    ('trousers','grey',NULL,'girls','3-4', 2),
    ('trousers','grey',NULL,'girls','4-5', 6),
    ('trousers','grey',NULL,'girls','5',   4),
    ('trousers','grey',NULL,'girls','5-6', 5),
    ('trousers','grey',NULL,'girls','6-7',19),
    ('trousers','grey',NULL,'girls','7',   2),
    ('trousers','grey',NULL,'girls','7-8', 2),
    ('skirt','grey',NULL,'girls','3-4',    2),
    ('skirt','grey',NULL,'girls','6-7',    2),
    ('skirt','black',NULL,'girls','8-9',   4),
    ('skirt','blue',NULL,'girls','7-8',    1),
    ('skirt','blue',NULL,'girls','8-9',    3),
    ('skirt','blue',NULL,'girls','9-10',   3),
    ('skirt','blue',NULL,'girls','10-11',  3)
  ) AS v(category, colour, sleeve, fit, size, qty)
  JOIN back_to_school_stock s
    ON s.category = v.category
   AND s.colour   = v.colour
   AND COALESCE(s.sleeve, '') = COALESCE(v.sleeve, '')
   AND s.fit      = v.fit
   AND s.size     = v.size;
END $$;
