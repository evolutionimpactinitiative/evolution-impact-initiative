-- ============================================
-- Back to School Drive 2026 — uniform choices per child
-- ============================================
-- Adds a JSONB column on registration_children that captures each family's
-- preferred uniform items (bottom garment + optional polo + optional shirt).
-- Only populated when the family ticked "uniform" in the needs array.
--
-- Shape:
--   {
--     "bottom": { "type": "trousers"|"skirt"|"dress"|"shorts",
--                 "colour": "grey"|"black"|"blue" },
--     "polo":   { "colour": "white"|"blue",
--                 "sleeve": "short"|"long" } | null,
--     "shirt":  { "sleeve": "short"|"long" } | null
--   }
--
-- Steward tick-offs on the day still live in `items_given` (existing column).
-- We extend the semantics of the keys there to include uniform sub-items:
--   uniform_bottom, uniform_polo, uniform_shirt (in addition to the existing
--   stationery, bag keys). No schema change needed for that — it's JSONB.

ALTER TABLE registration_children
  ADD COLUMN IF NOT EXISTS uniform_choices JSONB;

COMMENT ON COLUMN registration_children.uniform_choices IS
  'Uniform request captured at registration when needs includes "uniform". Shape: {bottom:{type,colour}, polo:{colour,sleeve}|null, shirt:{sleeve}|null}';
