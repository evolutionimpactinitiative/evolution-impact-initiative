-- ============================================
-- Back to School Drive 2026 — Shopping list reservations
-- ============================================
-- Lets the chair share a single link with donors ("here's what we still need").
-- Donors identify themselves once (name/contact/handover details) then tap
-- items to reserve them. Reservations soft-lock the item so nobody else
-- buys the same thing. When the chair collects the goods, they mark the
-- reservation as received — which posts a positive stock movement.
--
--   Public flow:  /back-to-school/shopping-list?k=<venue key>
--   Admin view:   /admin/back-to-school/shopping-list
--
-- Two tables:
--   * pledgers:     one row per session-authenticated donor
--   * reservations: many rows per pledger (one per SKU+size committed)


-- ============================================
-- 1. PLEDGERS
-- ============================================

CREATE TABLE IF NOT EXISTS back_to_school_shopping_pledgers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  delivery_method TEXT NOT NULL DEFAULT 'collection'
    CHECK (delivery_method IN ('collection', 'drop_off')),
  collection_date DATE,
  collection_time TEXT,      -- freeform ("morning", "3pm-5pm", etc)
  collection_address TEXT,
  collection_postcode TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_b2s_shopping_pledgers_email
  ON back_to_school_shopping_pledgers(email)
  WHERE email IS NOT NULL;

COMMENT ON TABLE back_to_school_shopping_pledgers IS
  'One row per donor session on the shopping-list flow. Reservations link to a pledger so we can group "who is bringing what" for pickup coordination.';


-- ============================================
-- 2. RESERVATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS back_to_school_shopping_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pledger_id UUID NOT NULL REFERENCES back_to_school_shopping_pledgers(id) ON DELETE CASCADE,
  category TEXT NOT NULL
    CHECK (category IN ('polo', 'shirt', 'trousers', 'skirt', 'dress', 'shorts')),
  colour TEXT NOT NULL
    CHECK (colour IN ('white', 'blue', 'grey', 'black')),
  sleeve TEXT
    CHECK (sleeve IN ('short', 'long')),
  fit TEXT NOT NULL DEFAULT 'unisex'
    CHECK (fit IN ('boys', 'girls', 'unisex')),
  size TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0),
  status TEXT NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'received', 'cancelled')),
  received_at TIMESTAMPTZ,
  received_stock_movement_id UUID
    REFERENCES back_to_school_stock_movements(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_b2s_shopping_reservations_pledger
  ON back_to_school_shopping_reservations(pledger_id);
CREATE INDEX IF NOT EXISTS idx_b2s_shopping_reservations_status
  ON back_to_school_shopping_reservations(status);
CREATE INDEX IF NOT EXISTS idx_b2s_shopping_reservations_sku
  ON back_to_school_shopping_reservations(category, colour, fit, size, sleeve)
  WHERE status = 'reserved';

COMMENT ON TABLE back_to_school_shopping_reservations IS
  'Soft-lock reservations on the shopping list. status=reserved means "someone is bringing this, do not double-count in the list". status=received posts a stock_movement and unlocks the item in the sense that its need is now fulfilled.';


-- ============================================
-- 3. TRIGGERS
-- ============================================

CREATE TRIGGER update_b2s_shopping_pledgers_updated_at
  BEFORE UPDATE ON back_to_school_shopping_pledgers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_b2s_shopping_reservations_updated_at
  BEFORE UPDATE ON back_to_school_shopping_reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 4. RLS — team members only. Public access goes via server routes.
-- ============================================

ALTER TABLE back_to_school_shopping_pledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE back_to_school_shopping_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team read pledgers"
  ON back_to_school_shopping_pledgers FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));
CREATE POLICY "Team write pledgers"
  ON back_to_school_shopping_pledgers FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Team read reservations"
  ON back_to_school_shopping_reservations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));
CREATE POLICY "Team write reservations"
  ON back_to_school_shopping_reservations FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));
