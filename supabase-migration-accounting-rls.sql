-- ============================================================================
-- Accounting v2 — Phase 1 Sprint 3: RLS hardening
-- ============================================================================
-- Tightens row-level security on the accounting tables created in Sprint 1.
-- Up to now writes only worked because the server actions use the service-role
-- client (which bypasses RLS). This migration adds *defence in depth* so any
-- direct anon-key write path is gated by role.
--
-- Policy summary:
--   • Funds, fund_categories, accounts, accounting_periods → admin-only writes
--   • Transactions:
--       - team members can INSERT a draft they own
--       - authors can UPDATE/DELETE only their own draft
--       - transition draft → posted: admin OR treasurer
--       - transition posted → reversed: admin only
--   • Journal lines: writeable only while parent tx is a draft owned by you
--                    (or you are admin/treasurer)
--   • Attachments: any team member can INSERT; only admin can DELETE
--   • Audit log: INSERT-only (no UPDATE/DELETE policies → effectively append-only)
--
-- Also introduces a new 'treasurer' role on team_members so Blessing has a
-- distinct identity for the dual-control workflow that lands in a later sprint.
--
-- Service role continues to bypass RLS entirely — existing server actions are
-- unaffected. This migration is additive and idempotent.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Add 'treasurer' to the team_members.role CHECK constraint
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Drop the existing role check (its name is auto-generated from the column)
  IF EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'team_members'::regclass
       AND conname  = 'team_members_role_check'
  ) THEN
    ALTER TABLE team_members DROP CONSTRAINT team_members_role_check;
  END IF;

  ALTER TABLE team_members
    ADD CONSTRAINT team_members_role_check
    CHECK (role IN ('admin', 'editor', 'treasurer'));
END $$;

-- ----------------------------------------------------------------------------
-- 2. Role helper functions
-- ----------------------------------------------------------------------------
-- Returns the current authenticated user's role on team_members, or NULL.
CREATE OR REPLACE FUNCTION acct_team_role()
RETURNS TEXT AS $$
  SELECT role
    FROM team_members
   WHERE email = COALESCE(auth.jwt() ->> 'email', '')
   LIMIT 1;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION acct_is_admin()
RETURNS BOOLEAN AS $$
  SELECT acct_team_role() = 'admin';
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION acct_is_admin_or_treasurer()
RETURNS BOOLEAN AS $$
  SELECT acct_team_role() IN ('admin', 'treasurer');
$$ LANGUAGE sql STABLE;

-- Resolves the current user to a team_members.id (for created_by ownership)
CREATE OR REPLACE FUNCTION acct_current_team_member_id()
RETURNS UUID AS $$
  SELECT id
    FROM team_members
   WHERE email = COALESCE(auth.jwt() ->> 'email', '')
   LIMIT 1;
$$ LANGUAGE sql STABLE;

-- ----------------------------------------------------------------------------
-- 3. Funds, fund_categories, accounts, accounting_periods — admin-only writes
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can write funds"               ON funds;
DROP POLICY IF EXISTS "Admins can write fund_categories"     ON fund_categories;
DROP POLICY IF EXISTS "Admins can write accounts"            ON accounts;
DROP POLICY IF EXISTS "Admins can write accounting_periods"  ON accounting_periods;

CREATE POLICY "Admins can write funds" ON funds
  FOR ALL TO authenticated
  USING (acct_is_admin())
  WITH CHECK (acct_is_admin());

CREATE POLICY "Admins can write fund_categories" ON fund_categories
  FOR ALL TO authenticated
  USING (acct_is_admin())
  WITH CHECK (acct_is_admin());

CREATE POLICY "Admins can write accounts" ON accounts
  FOR ALL TO authenticated
  USING (acct_is_admin())
  WITH CHECK (acct_is_admin());

CREATE POLICY "Admins can write accounting_periods" ON accounting_periods
  FOR ALL TO authenticated
  USING (acct_is_admin())
  WITH CHECK (acct_is_admin());

-- ----------------------------------------------------------------------------
-- 4. Transactions — INSERT drafts, UPDATE/DELETE own drafts, transition guards
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Team members can insert draft transactions" ON transactions;
DROP POLICY IF EXISTS "Authors can update own draft transactions"  ON transactions;
DROP POLICY IF EXISTS "Authors can delete own draft transactions"  ON transactions;

-- INSERT: any team member, but only with status='draft' (no shortcuts to posted)
CREATE POLICY "Team members can insert draft transactions" ON transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    acct_is_team_member()
    AND status = 'draft'
    AND created_by = acct_current_team_member_id()
  );

-- UPDATE: authors can edit their own draft; transitions to posted require
-- admin/treasurer; transitions to reversed require admin.
CREATE POLICY "Authors can update own draft transactions" ON transactions
  FOR UPDATE TO authenticated
  USING (
    -- visible for editing: own draft, OR admin/treasurer can update any
    (status = 'draft' AND created_by = acct_current_team_member_id())
    OR acct_is_admin_or_treasurer()
  )
  WITH CHECK (
    -- transition rules on the resulting row
    CASE
      WHEN status = 'draft'    THEN created_by = acct_current_team_member_id()
                                    OR acct_is_admin_or_treasurer()
      WHEN status = 'posted'   THEN acct_is_admin_or_treasurer()
      WHEN status = 'reversed' THEN acct_is_admin()
      ELSE FALSE
    END
  );

-- DELETE: only the author, only while draft
CREATE POLICY "Authors can delete own draft transactions" ON transactions
  FOR DELETE TO authenticated
  USING (
    status = 'draft'
    AND created_by = acct_current_team_member_id()
  );

-- ----------------------------------------------------------------------------
-- 5. Journal lines — writeable only while parent tx is a draft you own
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Team members can insert journal_lines on own drafts" ON journal_lines;
DROP POLICY IF EXISTS "Team members can update journal_lines on own drafts" ON journal_lines;
DROP POLICY IF EXISTS "Team members can delete journal_lines on own drafts" ON journal_lines;

CREATE POLICY "Team members can insert journal_lines on own drafts" ON journal_lines
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions t
       WHERE t.id     = journal_lines.transaction_id
         AND t.status = 'draft'
         AND (t.created_by = acct_current_team_member_id()
              OR acct_is_admin_or_treasurer())
    )
  );

CREATE POLICY "Team members can update journal_lines on own drafts" ON journal_lines
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
       WHERE t.id     = journal_lines.transaction_id
         AND t.status = 'draft'
         AND (t.created_by = acct_current_team_member_id()
              OR acct_is_admin_or_treasurer())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions t
       WHERE t.id     = journal_lines.transaction_id
         AND t.status = 'draft'
         AND (t.created_by = acct_current_team_member_id()
              OR acct_is_admin_or_treasurer())
    )
  );

CREATE POLICY "Team members can delete journal_lines on own drafts" ON journal_lines
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
       WHERE t.id     = journal_lines.transaction_id
         AND t.status = 'draft'
         AND (t.created_by = acct_current_team_member_id()
              OR acct_is_admin_or_treasurer())
    )
  );

-- ----------------------------------------------------------------------------
-- 6. Attachments — any team member can INSERT; only admin can DELETE
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Team members can insert attachments" ON attachments;
DROP POLICY IF EXISTS "Admins can delete attachments"       ON attachments;

CREATE POLICY "Team members can insert attachments" ON attachments
  FOR INSERT TO authenticated
  WITH CHECK (acct_is_team_member());

CREATE POLICY "Admins can delete attachments" ON attachments
  FOR DELETE TO authenticated
  USING (acct_is_admin());

-- ----------------------------------------------------------------------------
-- 7. Audit log — append-only
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Team members can insert audit_log" ON audit_log;

CREATE POLICY "Team members can insert audit_log" ON audit_log
  FOR INSERT TO authenticated
  WITH CHECK (acct_is_team_member());

-- Deliberately NO UPDATE / DELETE policies on audit_log — RLS denies by default,
-- so the table is effectively append-only for non-service-role connections.

-- ============================================================================
-- Notes for future sprints:
-- ----------------------------------------------------------------------------
-- • Today the server actions in lib/accounting/actions.ts use the service-role
--   client, which bypasses RLS. These policies kick in only when an action
--   moves to the user-scoped client (planned for the dual-control flow).
-- • Posting + reversing currently happen inside the same transaction as the
--   draft creation. When dual-approval lands, the approver will be on a
--   separate request and the WITH CHECK clause above will quietly enforce that
--   only an admin/treasurer can flip status to 'posted'.
-- • If you need to grant additional roles, extend the helper functions —
--   the policies will pick the change up automatically.
-- ============================================================================
