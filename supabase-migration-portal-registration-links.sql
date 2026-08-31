-- ============================================
-- Portal → registration backlinks
-- ============================================
-- Slice 3: when a portal parent registers a family for a Growing Together
-- session, we still materialise the existing registrations + registration_children
-- rows so the admin / attendance / QR / reminder stack keeps working. But
-- we also backlink the rows to the persistent portal records so we can
-- (a) show a parent their session history without matching on email,
-- (b) roll up per-family attendance, feedback and outcomes,
-- (c) let admin see which registrations came via the portal.
--
-- Anonymous event registrations continue to have NULL for all three
-- columns — nothing else changes.

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id) ON DELETE SET NULL;

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS registered_by_parent_carer_id UUID REFERENCES parent_carers(id) ON DELETE SET NULL;

ALTER TABLE registration_children
  ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES children(id) ON DELETE SET NULL;

-- Family history + admin family drill-ins query by family_id.
CREATE INDEX IF NOT EXISTS idx_registrations_family_id
  ON registrations (family_id)
  WHERE family_id IS NOT NULL;

-- Attendance rollups per persistent child.
CREATE INDEX IF NOT EXISTS idx_registration_children_child_id
  ON registration_children (child_id)
  WHERE child_id IS NOT NULL;

-- Parent RLS: let a logged-in parent read + cancel their own family's
-- registrations directly (existing team-scoped policies still apply on
-- top). Insert stays on the anon policy — portal registrations are
-- created via the service-role API route where the parent's session
-- has been verified, not directly from a browser row insert.

DROP POLICY IF EXISTS "Parent can view own family registrations" ON registrations;
CREATE POLICY "Parent can view own family registrations"
  ON registrations FOR SELECT
  TO authenticated
  USING (
    family_id IS NOT NULL
    AND family_id IN (
      SELECT family_id FROM parent_carers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Parent can cancel own family registrations" ON registrations;
CREATE POLICY "Parent can cancel own family registrations"
  ON registrations FOR UPDATE
  TO authenticated
  USING (
    family_id IS NOT NULL
    AND family_id IN (
      SELECT family_id FROM parent_carers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Parent can view own family registration children" ON registration_children;
CREATE POLICY "Parent can view own family registration children"
  ON registration_children FOR SELECT
  TO authenticated
  USING (
    registration_id IN (
      SELECT id FROM registrations
      WHERE family_id IS NOT NULL
        AND family_id IN (
          SELECT family_id FROM parent_carers WHERE user_id = auth.uid()
        )
    )
  );
