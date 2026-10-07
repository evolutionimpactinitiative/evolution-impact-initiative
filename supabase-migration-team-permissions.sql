-- ============================================
-- team_members.permissions
-- ============================================
-- Fine-grained permissions on top of the role presets. The admin UI
-- (/admin/settings/team) uses this to add extras beyond what a role
-- grants by default. Role still governs the baseline so swapping
-- someone's role is a quick way to bulk-set permissions.
--
-- Shape: TEXT[] of permission keys defined in lib/permissions-registry.ts
-- (e.g. 'events.create', 'donations.view'). Validation lives in the
-- app, not the DB — permissions evolve too often to want a DB-side
-- enum constraint. Empty array = no extras beyond the role preset.

ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS permissions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS idx_team_members_permissions
  ON team_members USING GIN (permissions);
