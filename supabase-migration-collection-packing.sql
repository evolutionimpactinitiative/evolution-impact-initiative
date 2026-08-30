-- ============================================
-- Back to School Collection Day — Packing flow
-- ============================================
-- The chair pre-packs one bag per child ahead of the drive. Each child
-- gets their own printed label (already in place) and is walked
-- through a per-child "pack sheet" in the admin dashboard. The
-- steward:
--   • ticks off items as they go into the bag
--   • can substitute an item if stock was miscounted
--   • hits "Packed and ready for collection" when the bag is done
--
-- On "packed":
--   • every active pick_reservation for the child flips reserved → consumed
--   • back_to_school_stock.quantity decrements for each consumed row
--   • registration_children.packed_at + packed_by are stamped
--   • parent gets an email
--
-- On substitute:
--   • the original reservation flips reserved → released
--   • a new reserved row is inserted with original_* fields preserved
--   • parent gets an email

ALTER TABLE registration_children
  ADD COLUMN IF NOT EXISTS packed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS packed_by UUID REFERENCES team_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_registration_children_packed_at
  ON registration_children(packed_at)
  WHERE packed_at IS NOT NULL;
