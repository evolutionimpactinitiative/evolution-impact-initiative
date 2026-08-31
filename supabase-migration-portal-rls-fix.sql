-- ============================================
-- Fix: parent_carers RLS self-recursion
-- ============================================
-- The initial portal-families migration referenced parent_carers from
-- inside parent_carers' own SELECT policy:
--
--   USING (family_id IN (SELECT family_id FROM parent_carers WHERE user_id = auth.uid()))
--
-- Postgres detects this as "infinite recursion detected in policy for
-- relation parent_carers" and refuses the query — so a logged-in
-- parent reading their own carer row via the session client silently
-- gets zero rows and the dashboard/family screens fall through to the
-- 'no family record' branch.
--
-- Fix: extract the "which families does this uid belong to?" check into
-- a SECURITY DEFINER function that bypasses RLS for that internal
-- lookup. All portal-scoped policies now call it instead of doing the
-- subquery inline. This mirrors the standard Postgres RLS pattern for
-- self-referential membership checks.

CREATE OR REPLACE FUNCTION portal_current_family_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id
    FROM parent_carers
   WHERE user_id = auth.uid();
$$;

-- Only authenticated callers should be able to invoke this — it doesn't
-- take a UUID argument so there's no way to pivot to another family's
-- IDs, but tighten anyway.
REVOKE ALL ON FUNCTION portal_current_family_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION portal_current_family_ids() TO authenticated;


-- ============================================
-- families — replace subquery policies with helper
-- ============================================
DROP POLICY IF EXISTS "Parent can view own family" ON families;
CREATE POLICY "Parent can view own family"
  ON families FOR SELECT
  TO authenticated
  USING (id IN (SELECT portal_current_family_ids()));

DROP POLICY IF EXISTS "Parent can update own family" ON families;
CREATE POLICY "Parent can update own family"
  ON families FOR UPDATE
  TO authenticated
  USING (id IN (SELECT portal_current_family_ids()));


-- ============================================
-- parent_carers — replace subquery policies with helper
-- ============================================
DROP POLICY IF EXISTS "Parent can view own household carers" ON parent_carers;
CREATE POLICY "Parent can view own household carers"
  ON parent_carers FOR SELECT
  TO authenticated
  USING (family_id IN (SELECT portal_current_family_ids()));


-- ============================================
-- children — replace subquery policies with helper
-- ============================================
DROP POLICY IF EXISTS "Parent can view own children" ON children;
CREATE POLICY "Parent can view own children"
  ON children FOR SELECT
  TO authenticated
  USING (family_id IN (SELECT portal_current_family_ids()));

DROP POLICY IF EXISTS "Parent can insert own children" ON children;
CREATE POLICY "Parent can insert own children"
  ON children FOR INSERT
  TO authenticated
  WITH CHECK (family_id IN (SELECT portal_current_family_ids()));

DROP POLICY IF EXISTS "Parent can update own children" ON children;
CREATE POLICY "Parent can update own children"
  ON children FOR UPDATE
  TO authenticated
  USING (family_id IN (SELECT portal_current_family_ids()));

DROP POLICY IF EXISTS "Parent can delete own children" ON children;
CREATE POLICY "Parent can delete own children"
  ON children FOR DELETE
  TO authenticated
  USING (family_id IN (SELECT portal_current_family_ids()));


-- ============================================
-- registrations — replace subquery policies with helper
-- ============================================
DROP POLICY IF EXISTS "Parent can view own family registrations" ON registrations;
CREATE POLICY "Parent can view own family registrations"
  ON registrations FOR SELECT
  TO authenticated
  USING (
    family_id IS NOT NULL
    AND family_id IN (SELECT portal_current_family_ids())
  );

DROP POLICY IF EXISTS "Parent can cancel own family registrations" ON registrations;
CREATE POLICY "Parent can cancel own family registrations"
  ON registrations FOR UPDATE
  TO authenticated
  USING (
    family_id IS NOT NULL
    AND family_id IN (SELECT portal_current_family_ids())
  );


-- ============================================
-- registration_children — replace subquery policies with helper
-- ============================================
DROP POLICY IF EXISTS "Parent can view own family registration children" ON registration_children;
CREATE POLICY "Parent can view own family registration children"
  ON registration_children FOR SELECT
  TO authenticated
  USING (
    registration_id IN (
      SELECT id FROM registrations
       WHERE family_id IS NOT NULL
         AND family_id IN (SELECT portal_current_family_ids())
    )
  );
