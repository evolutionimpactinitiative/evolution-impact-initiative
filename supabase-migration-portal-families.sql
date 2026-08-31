-- ============================================
-- Parent Portal — families, parent_carers, children
-- ============================================
-- First public account system on this database. Introduces a household
-- model:
--
--   families           1 ── N  parent_carers  ── 1  auth.users
--                      1 ── N  children
--
-- A parent signs up with email + password (see project_growing_together
-- decision #1). Their auth.users row links to a parent_carers row, which
-- belongs to a families row. Multiple parents can share one family so
-- both can log in independently and see the same children (household
-- model — decision #3).
--
-- Registration to a Growing Together session materialises the existing
-- `registrations` + `registration_children` rows *from* these persistent
-- children — the per-event tables stay untouched so admin/attendance/QR
-- flows keep working. (children.id ← registration_children.child_id
-- backlink is added in Slice 3.)
--
-- RLS: a parent sees only their own family. Team members (any row in
-- team_members) see all families for admin/reporting.


-- ============================================
-- families
-- ============================================
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postcode TEXT,
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'sms', 'whatsapp')),
  preferred_language TEXT,
  how_heard_about_gt TEXT,
  accessibility_requirements TEXT,
  interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  support_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
  photo_video_consent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- parent_carers
-- ============================================
-- Deletion of the auth.users row deletes the parent_carer link but does
-- NOT delete the family or children — historical registrations must
-- remain for reporting. If a family wants full deletion they go through
-- the account-deletion workflow (Phase 2), not a raw auth deletion.
CREATE TABLE IF NOT EXISTS parent_carers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  relationship_to_child TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one *primary* parent per family. (Non-primary partners can still
-- be added; the primary is who created the family.)
CREATE UNIQUE INDEX IF NOT EXISTS ux_parent_carers_family_primary
  ON parent_carers (family_id)
  WHERE is_primary = TRUE;

-- Email is unique across all parent_carers so no two portal accounts
-- can claim the same address.
CREATE UNIQUE INDEX IF NOT EXISTS ux_parent_carers_email
  ON parent_carers (lower(email));

CREATE INDEX IF NOT EXISTS idx_parent_carers_family_id
  ON parent_carers (family_id);


-- ============================================
-- children
-- ============================================
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  sex_at_birth TEXT CHECK (sex_at_birth IS NULL OR sex_at_birth IN ('male', 'female', 'other', 'prefer_not_to_say')),
  interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  accessibility_requirements TEXT,
  communication_notes TEXT,
  allergies TEXT,
  support_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
  parent_notes TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_children_family_id
  ON children (family_id);

-- Age-band queries for programme-eligibility filtering (e.g. 0–5 for GT).
CREATE INDEX IF NOT EXISTS idx_children_date_of_birth
  ON children (date_of_birth)
  WHERE archived_at IS NULL;


-- ============================================
-- Triggers: keep updated_at fresh
-- ============================================
DROP TRIGGER IF EXISTS update_families_updated_at ON families;
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parent_carers_updated_at ON parent_carers;
CREATE TRIGGER update_parent_carers_updated_at BEFORE UPDATE ON parent_carers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_children_updated_at ON children;
CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- RLS
-- ============================================
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_carers ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;


-- ---- families ----

-- Parent can read families they belong to.
DROP POLICY IF EXISTS "Parent can view own family" ON families;
CREATE POLICY "Parent can view own family"
  ON families FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT family_id FROM parent_carers WHERE user_id = auth.uid()
    )
  );

-- Parent can update their own family record.
DROP POLICY IF EXISTS "Parent can update own family" ON families;
CREATE POLICY "Parent can update own family"
  ON families FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT family_id FROM parent_carers WHERE user_id = auth.uid()
    )
  );

-- Any authenticated user can create a family (they're creating their
-- own household on signup). The parent_carers insert that follows binds
-- it to their auth.uid().
DROP POLICY IF EXISTS "Authenticated can create family" ON families;
CREATE POLICY "Authenticated can create family"
  ON families FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Team members can view + manage all families (admin/reporting).
DROP POLICY IF EXISTS "Team can view all families" ON families;
CREATE POLICY "Team can view all families"
  ON families FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );

DROP POLICY IF EXISTS "Team can manage families" ON families;
CREATE POLICY "Team can manage families"
  ON families FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );


-- ---- parent_carers ----

-- Parent can read all parent_carers in their own family (so a household
-- can see the partner they added). Uses a self-join via auth.uid().
DROP POLICY IF EXISTS "Parent can view own household carers" ON parent_carers;
CREATE POLICY "Parent can view own household carers"
  ON parent_carers FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM parent_carers pc WHERE pc.user_id = auth.uid()
    )
  );

-- Parent can update only their own row.
DROP POLICY IF EXISTS "Parent can update own carer row" ON parent_carers;
CREATE POLICY "Parent can update own carer row"
  ON parent_carers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Authenticated user can insert a parent_carer row where user_id is
-- their own uid — used at signup (creating self) and later for adding
-- a partner (the partner does their own signup + link).
DROP POLICY IF EXISTS "Authenticated can insert own carer row" ON parent_carers;
CREATE POLICY "Authenticated can insert own carer row"
  ON parent_carers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Team members can view + manage all parent_carers.
DROP POLICY IF EXISTS "Team can view all parent carers" ON parent_carers;
CREATE POLICY "Team can view all parent carers"
  ON parent_carers FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );

DROP POLICY IF EXISTS "Team can manage parent carers" ON parent_carers;
CREATE POLICY "Team can manage parent carers"
  ON parent_carers FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );


-- ---- children ----

-- Parent can CRUD children in their own family.
DROP POLICY IF EXISTS "Parent can view own children" ON children;
CREATE POLICY "Parent can view own children"
  ON children FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM parent_carers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Parent can insert own children" ON children;
CREATE POLICY "Parent can insert own children"
  ON children FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM parent_carers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Parent can update own children" ON children;
CREATE POLICY "Parent can update own children"
  ON children FOR UPDATE
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM parent_carers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Parent can delete own children" ON children;
CREATE POLICY "Parent can delete own children"
  ON children FOR DELETE
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM parent_carers WHERE user_id = auth.uid()
    )
  );

-- Team members can view + manage all children.
DROP POLICY IF EXISTS "Team can view all children" ON children;
CREATE POLICY "Team can view all children"
  ON children FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );

DROP POLICY IF EXISTS "Team can manage children" ON children;
CREATE POLICY "Team can manage children"
  ON children FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );
