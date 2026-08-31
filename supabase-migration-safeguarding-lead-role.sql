-- ============================================
-- Add 'safeguarding_lead' as a valid team_members.role
-- ============================================
-- Slice 6 introduces the Safeguarding Lead role. Its main job (scoping
-- safeguarding-only fields on session evaluations + observation logs)
-- lands in Phase 2 alongside those features — here we just widen the
-- CHECK so admin can assign the role today.

DO $$
BEGIN
  ALTER TABLE team_members
    DROP CONSTRAINT IF EXISTS team_members_role_check;

  ALTER TABLE team_members
    ADD CONSTRAINT team_members_role_check
    CHECK (role IN ('admin', 'editor', 'treasurer', 'safeguarding_lead'));
END $$;
