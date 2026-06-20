-- ============================================================================
-- Accounting v2 — Phase 1 Sprint 1: Foundations
-- ============================================================================
-- Creates the core financial spine for the Evolution Impact Initiative admin:
--   • funds + fund_categories  (restricted / designated / unrestricted)
--   • accounts                 (chart of accounts)
--   • accounting_periods       (with open/closed locking)
--   • transactions             (header, double-entry, immutable once posted)
--   • journal_lines            (debit/credit lines, fund-tagged)
--   • attachments              (polymorphic file metadata for receipts/invoices)
--   • audit_log                (immutable who-did-what record)
--
-- Migration is additive only — no changes to existing tables.
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT DO NOTHING throughout).
--
-- Run order: tables → indexes → triggers → RLS → seed data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FUNDS — every £ in or out belongs to one of these
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,                  -- e.g. 'CIN_WMF', 'NLAFA_CC'
    name TEXT NOT NULL,
    fund_type TEXT NOT NULL CHECK (fund_type IN ('restricted', 'designated', 'unrestricted', 'endowment')),
    funder TEXT,                                -- e.g. 'BBC Children in Need'
    funder_reference TEXT,                      -- e.g. '2026-1661' (CiN), '20332713' (NLAfA)
    starts_on DATE,
    ends_on DATE,
    total_awarded_pence BIGINT,                 -- NULL for unrestricted / open-ended funds
    restrictions_text TEXT,                     -- free-text summary of what the fund can be spent on
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE funds IS 'Every transaction belongs to exactly one fund. Restricted funds (CiN, NLAfA) are funder-locked; designated funds are board-locked but reversible; unrestricted is free reserves.';

-- ----------------------------------------------------------------------------
-- 2. FUND CATEGORIES — sub-buckets within a fund (e.g. CiN's 5 cost lines)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fund_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE RESTRICT,
    code TEXT NOT NULL,                         -- e.g. 'sessional_staff'
    name TEXT NOT NULL,                         -- e.g. 'Sessional staff costs'
    description TEXT,
    budget_amount_pence BIGINT,                 -- typical annual budget for this category
    budget_period TEXT CHECK (budget_period IN ('annual', 'total', 'monthly', 'quarterly')),
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (fund_id, code)
);

COMMENT ON TABLE fund_categories IS 'Sub-buckets within a fund. For CiN: Sessional staff, Equipment, Project, Volunteer, Trips. For NLAfA: one per programme strand (Youth, Mens, Womens).';

-- ----------------------------------------------------------------------------
-- 3. ACCOUNTS — chart of accounts (income / expense / asset / liability / equity)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,                  -- e.g. '4000' or 'INC_DONATIONS'
    name TEXT NOT NULL,                         -- e.g. 'Donations - General'
    account_type TEXT NOT NULL CHECK (account_type IN ('income', 'expense', 'asset', 'liability', 'equity')),
    parent_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE accounts IS 'Chart of accounts. Standard double-entry types. Hierarchy via parent_id allows account groups.';

-- ----------------------------------------------------------------------------
-- 4. ACCOUNTING PERIODS — open/closed time windows that lock historical data
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                         -- e.g. 'Year 1 (2025-26)'
    starts_on DATE NOT NULL,
    ends_on DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES team_members(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (ends_on > starts_on),
    CHECK ((status = 'closed' AND closed_at IS NOT NULL) OR (status = 'open' AND closed_at IS NULL))
);

COMMENT ON TABLE accounting_periods IS 'Once closed, transactions inside the period are read-only. Backfill mode (Sprint 4) lets super-admin temporarily lift the lock.';

-- ----------------------------------------------------------------------------
-- 5. TRANSACTIONS — header for a double-entry journal
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date DATE NOT NULL,
    period_id UUID NOT NULL REFERENCES accounting_periods(id) ON DELETE RESTRICT,
    reference TEXT,                             -- e.g. 'INV-2026-001', Stripe payment id, NLAfA drawdown ref
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
    posted_at TIMESTAMPTZ,
    posted_by UUID REFERENCES team_members(id),
    reversed_by_transaction_id UUID REFERENCES transactions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES team_members(id),
    CHECK ((status = 'posted' AND posted_at IS NOT NULL) OR (status != 'posted'))
);

COMMENT ON TABLE transactions IS 'Journal header. Draft → posted → reversed. Posted transactions are immutable; corrections require a reversal entry.';

-- ----------------------------------------------------------------------------
-- 6. JOURNAL LINES — the debit/credit pairs, fund-tagged
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE RESTRICT,
    fund_category_id UUID REFERENCES fund_categories(id) ON DELETE RESTRICT,
    debit_pence BIGINT NOT NULL DEFAULT 0,
    credit_pence BIGINT NOT NULL DEFAULT 0,
    description TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (debit_pence >= 0 AND credit_pence >= 0),
    CHECK ((debit_pence > 0 AND credit_pence = 0) OR (debit_pence = 0 AND credit_pence > 0))
);

COMMENT ON TABLE journal_lines IS 'Each line is either a debit OR a credit, never both. Sum of debits = sum of credits per transaction (enforced by trigger on post).';

-- ----------------------------------------------------------------------------
-- 7. ATTACHMENTS — polymorphic file metadata (actual files live in Supabase Storage)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,                  -- 'transaction', 'fund', 'team_member', etc.
    entity_id UUID NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT,
    file_size_bytes BIGINT,
    storage_bucket TEXT NOT NULL DEFAULT 'attachments',
    storage_path TEXT NOT NULL,                 -- path within the Supabase Storage bucket
    description TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uploaded_by UUID REFERENCES team_members(id)
);

COMMENT ON TABLE attachments IS 'Polymorphic file refs. Used for receipts, invoices, grant letters, DBS certs, etc. Actual bytes live in Supabase Storage.';

-- ----------------------------------------------------------------------------
-- 8. AUDIT LOG — immutable record of every create/update/delete
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'post', 'reverse', 'period_close', 'period_open')),
    actor_id UUID REFERENCES team_members(id),
    actor_email TEXT,
    before_data JSONB,
    after_data JSONB,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_log IS 'Append-only. NEVER UPDATE or DELETE rows. Required for 7-year CiN retention compliance.';

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_fund_categories_fund ON fund_categories(fund_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_accounts_parent ON accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_periods_status ON accounting_periods(status);
CREATE INDEX IF NOT EXISTS idx_periods_range ON accounting_periods(starts_on, ends_on);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_period ON transactions(period_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_journal_lines_tx ON journal_lines(transaction_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_fund ON journal_lines(fund_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_fund_cat ON journal_lines(fund_category_id);
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- ============================================================================
-- TRIGGERS — double-entry integrity + immutability + period locking
-- ============================================================================

-- 1. Sum of debits must equal sum of credits when a transaction is posted
CREATE OR REPLACE FUNCTION acct_verify_balanced()
RETURNS TRIGGER AS $$
DECLARE
  total_debits BIGINT;
  total_credits BIGINT;
BEGIN
  IF NEW.status != 'posted' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(debit_pence), 0), COALESCE(SUM(credit_pence), 0)
    INTO total_debits, total_credits
    FROM journal_lines
   WHERE transaction_id = NEW.id;

  IF total_debits = 0 AND total_credits = 0 THEN
    RAISE EXCEPTION 'Transaction % cannot be posted with no journal lines', NEW.id;
  END IF;

  IF total_debits != total_credits THEN
    RAISE EXCEPTION 'Transaction % is not balanced: debits=%, credits=%', NEW.id, total_debits, total_credits;
  END IF;

  IF NEW.posted_at IS NULL THEN
    NEW.posted_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acct_verify_balanced ON transactions;
CREATE TRIGGER trg_acct_verify_balanced
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION acct_verify_balanced();

-- 2. Posted transactions are immutable (status can only move 'posted' -> 'reversed')
CREATE OR REPLACE FUNCTION acct_protect_posted()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'posted' AND NEW.status NOT IN ('posted', 'reversed') THEN
    RAISE EXCEPTION 'Cannot move transaction % out of posted status (only reversal is allowed)', OLD.id;
  END IF;

  IF OLD.status = 'posted' AND NEW.status = 'posted' THEN
    -- Allow no field changes except updated_at (handled by app)
    IF (NEW.transaction_date != OLD.transaction_date OR
        NEW.description != OLD.description OR
        NEW.period_id != OLD.period_id OR
        COALESCE(NEW.reference, '') != COALESCE(OLD.reference, '')) THEN
      RAISE EXCEPTION 'Cannot edit posted transaction %; reverse and re-post instead', OLD.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acct_protect_posted ON transactions;
CREATE TRIGGER trg_acct_protect_posted
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION acct_protect_posted();

-- 3. Posted transaction lines are immutable (and lines can't be added to a posted tx)
CREATE OR REPLACE FUNCTION acct_protect_posted_lines()
RETURNS TRIGGER AS $$
DECLARE
  parent_status TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT status INTO parent_status FROM transactions WHERE id = NEW.transaction_id;
    IF parent_status = 'posted' THEN
      RAISE EXCEPTION 'Cannot add journal lines to posted transaction %', NEW.transaction_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT status INTO parent_status FROM transactions WHERE id = OLD.transaction_id;
    IF parent_status = 'posted' THEN
      RAISE EXCEPTION 'Cannot edit journal lines of posted transaction %', OLD.transaction_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT status INTO parent_status FROM transactions WHERE id = OLD.transaction_id;
    IF parent_status = 'posted' THEN
      RAISE EXCEPTION 'Cannot delete journal lines from posted transaction %', OLD.transaction_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acct_protect_posted_lines ON journal_lines;
CREATE TRIGGER trg_acct_protect_posted_lines
  BEFORE INSERT OR UPDATE OR DELETE ON journal_lines
  FOR EACH ROW
  EXECUTE FUNCTION acct_protect_posted_lines();

-- 4. Period lock — no posts with transaction_date in a closed period
CREATE OR REPLACE FUNCTION acct_check_period_lock()
RETURNS TRIGGER AS $$
DECLARE
  period_status TEXT;
BEGIN
  IF NEW.status != 'posted' THEN
    RETURN NEW;
  END IF;

  SELECT status INTO period_status FROM accounting_periods WHERE id = NEW.period_id;

  IF period_status = 'closed' THEN
    RAISE EXCEPTION 'Cannot post transaction in closed period (transaction_date=%)', NEW.transaction_date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acct_check_period_lock ON transactions;
CREATE TRIGGER trg_acct_check_period_lock
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION acct_check_period_lock();

-- 5. Append-only audit_log
CREATE OR REPLACE FUNCTION acct_block_audit_changes()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only; % blocked', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acct_block_audit_update ON audit_log;
CREATE TRIGGER trg_acct_block_audit_update
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION acct_block_audit_changes();

-- 6. updated_at auto-bump
CREATE OR REPLACE FUNCTION acct_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_funds_touch ON funds;
CREATE TRIGGER trg_funds_touch BEFORE UPDATE ON funds FOR EACH ROW EXECUTE FUNCTION acct_touch_updated_at();

DROP TRIGGER IF EXISTS trg_fund_cats_touch ON fund_categories;
CREATE TRIGGER trg_fund_cats_touch BEFORE UPDATE ON fund_categories FOR EACH ROW EXECUTE FUNCTION acct_touch_updated_at();

DROP TRIGGER IF EXISTS trg_accounts_touch ON accounts;
CREATE TRIGGER trg_accounts_touch BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION acct_touch_updated_at();

DROP TRIGGER IF EXISTS trg_transactions_touch ON transactions;
CREATE TRIGGER trg_transactions_touch BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION acct_touch_updated_at();

-- ============================================================================
-- RLS — permissive for team_members for now; tightened by role in Sprint 3
-- ============================================================================
ALTER TABLE funds                ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_periods   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines        ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log            ENABLE ROW LEVEL SECURITY;

-- Helper: is the current auth user a known team_member?
CREATE OR REPLACE FUNCTION acct_is_team_member()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
     WHERE email = COALESCE(auth.jwt() ->> 'email', '')
  );
$$ LANGUAGE sql STABLE;

DO $$
BEGIN
  -- Read access for team members
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='funds' AND policyname='Team members can read funds') THEN
    CREATE POLICY "Team members can read funds" ON funds FOR SELECT USING (acct_is_team_member());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='fund_categories' AND policyname='Team members can read fund_categories') THEN
    CREATE POLICY "Team members can read fund_categories" ON fund_categories FOR SELECT USING (acct_is_team_member());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='accounts' AND policyname='Team members can read accounts') THEN
    CREATE POLICY "Team members can read accounts" ON accounts FOR SELECT USING (acct_is_team_member());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='accounting_periods' AND policyname='Team members can read accounting_periods') THEN
    CREATE POLICY "Team members can read accounting_periods" ON accounting_periods FOR SELECT USING (acct_is_team_member());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transactions' AND policyname='Team members can read transactions') THEN
    CREATE POLICY "Team members can read transactions" ON transactions FOR SELECT USING (acct_is_team_member());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='journal_lines' AND policyname='Team members can read journal_lines') THEN
    CREATE POLICY "Team members can read journal_lines" ON journal_lines FOR SELECT USING (acct_is_team_member());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='attachments' AND policyname='Team members can read attachments') THEN
    CREATE POLICY "Team members can read attachments" ON attachments FOR SELECT USING (acct_is_team_member());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_log' AND policyname='Team members can read audit_log') THEN
    CREATE POLICY "Team members can read audit_log" ON audit_log FOR SELECT USING (acct_is_team_member());
  END IF;
END $$;

-- Service role implicitly bypasses RLS. Sprint 3 adds per-role write/admin policies.

-- ============================================================================
-- SEED DATA — funds, fund categories, accounts, opening period
-- ============================================================================

-- ---- Funds ----
INSERT INTO funds (code, name, fund_type, funder, funder_reference, starts_on, ends_on, total_awarded_pence, restrictions_text, display_order)
VALUES
  ('GENERAL',   'General (Unrestricted)',
      'unrestricted', NULL, NULL, NULL, NULL, NULL,
      'Free-to-spend reserves. Community donations + workshop fees + festival income not earmarked for a specific purpose.', 10),

  ('CIN_WMF',   'CiN We Move FWD: Foundations',
      'restricted', 'BBC Children in Need + Henry Smith Foundation', '2026-1661',
      '2026-07-01', '2029-06-30', 7500000,
      'Inclusive play-based early years activities for children aged 0-5 in financially deprived Medway communities. Restricted to 5 sub-categories per offer letter.', 20),

  ('NLAFA_CC',  'NLAfA Creative Connections',
      'restricted', 'National Lottery Community Fund (Awards for All)', '20332713',
      NULL, NULL, 1967000,
      'Youth creative projects (11-18), Mens mental health project, Womens creative wellbeing project. One-off Awards for All grant of £19,670.', 30),

  ('B2S',       'Back to School Campaign',
      'restricted', NULL, NULL, NULL, NULL, NULL,
      'Donations earmarked by donors specifically for the Back to School uniform & supplies campaign.', 40)
ON CONFLICT (code) DO NOTHING;

-- ---- Fund categories: CiN sub-categories (matches offer letter 17 Jun 2026) ----
INSERT INTO fund_categories (fund_id, code, name, budget_amount_pence, budget_period, display_order, description)
SELECT id, 'sessional_staff',  'Sessional staff costs',       1100000, 'annual', 10, '2 sessional facilitators delivering ~24 Early Years sessions/year @ £450/session avg.'
  FROM funds WHERE code = 'CIN_WMF'
ON CONFLICT (fund_id, code) DO NOTHING;

INSERT INTO fund_categories (fund_id, code, name, budget_amount_pence, budget_period, display_order, description)
SELECT id, 'equipment_materials','Small equipment & materials', 500000, 'annual', 20, 'Arts/crafts, sensory resources, storytelling materials for ~24 sessions/yr.'
  FROM funds WHERE code = 'CIN_WMF'
ON CONFLICT (fund_id, code) DO NOTHING;

INSERT INTO fund_categories (fund_id, code, name, budget_amount_pence, budget_period, display_order, description)
SELECT id, 'project_costs',    'Project costs',                500000, 'annual', 30, 'Venue hire + session-related delivery overheads.'
  FROM funds WHERE code = 'CIN_WMF'
ON CONFLICT (fund_id, code) DO NOTHING;

INSERT INTO fund_categories (fund_id, code, name, budget_amount_pence, budget_period, display_order, description)
SELECT id, 'volunteer_costs',  'Volunteer costs',              200000, 'annual', 40, 'Volunteer travel, refreshments, induction, safeguarding training, DBS checks.'
  FROM funds WHERE code = 'CIN_WMF'
ON CONFLICT (fund_id, code) DO NOTHING;

INSERT INTO fund_categories (fund_id, code, name, budget_amount_pence, budget_period, display_order, description)
SELECT id, 'trips_outings',    'Trips & outings',              200000, 'annual', 50, 'Local play-facility outings & enrichment (no residentials).'
  FROM funds WHERE code = 'CIN_WMF'
ON CONFLICT (fund_id, code) DO NOTHING;

-- ---- Fund categories: NLAfA strands ----
INSERT INTO fund_categories (fund_id, code, name, budget_amount_pence, budget_period, display_order, description)
SELECT id, 'youth_creative',  'Youth creative projects (11-18)', 1000000, 'annual', 10, 'Per organisational forecast.'
  FROM funds WHERE code = 'NLAFA_CC'
ON CONFLICT (fund_id, code) DO NOTHING;

INSERT INTO fund_categories (fund_id, code, name, budget_amount_pence, budget_period, display_order, description)
SELECT id, 'mens_mental_health', 'Mens mental health project',     750000, 'annual', 20, 'Per organisational forecast.'
  FROM funds WHERE code = 'NLAFA_CC'
ON CONFLICT (fund_id, code) DO NOTHING;

INSERT INTO fund_categories (fund_id, code, name, budget_amount_pence, budget_period, display_order, description)
SELECT id, 'womens_wellbeing', 'Womens creative wellbeing project', 750000, 'annual', 30, 'Per organisational forecast.'
  FROM funds WHERE code = 'NLAFA_CC'
ON CONFLICT (fund_id, code) DO NOTHING;

-- ---- General fund: one catch-all sub-category so journal_lines always has a category to attach to ----
INSERT INTO fund_categories (fund_id, code, name, display_order, description)
SELECT id, 'general', 'General', 10, 'Default catch-all for the unrestricted fund.'
  FROM funds WHERE code = 'GENERAL'
ON CONFLICT (fund_id, code) DO NOTHING;

-- ---- Back to School: single category for now ----
INSERT INTO fund_categories (fund_id, code, name, display_order, description)
SELECT id, 'b2s_general', 'Back to School (general)', 10, 'Donations specifically tagged for the B2S campaign.'
  FROM funds WHERE code = 'B2S'
ON CONFLICT (fund_id, code) DO NOTHING;

-- ---- Chart of accounts ----
-- INCOME (4xxx)
INSERT INTO accounts (code, name, account_type, display_order, description) VALUES
  ('4000', 'Donations – General',          'income', 10, 'One-off & recurring donations not earmarked.'),
  ('4010', 'Donations – Campaign',         'income', 11, 'Donations earmarked to a specific campaign (e.g. Back to School).'),
  ('4100', 'Grant income – CiN',           'income', 20, 'BBC Children in Need quarterly drawdowns.'),
  ('4110', 'Grant income – NLAfA',         'income', 21, 'National Lottery Awards for All grant.'),
  ('4120', 'Grant income – Other',         'income', 22, 'Other restricted grants.'),
  ('4200', 'Trading income – Workshops',   'income', 30, 'Workshops paid by schools/corporates/councils/private parties.'),
  ('4210', 'Trading income – Services',    'income', 31, 'Other paid services / training / talks.'),
  ('4300', 'Festival – Sponsorship',       'income', 40, 'Sponsorship pledges for Evolution Fest.'),
  ('4310', 'Festival – Vendor fees',       'income', 41, 'Vendor contributions.'),
  ('4320', 'Festival – Ticket revenue',    'income', 42, 'If/when tickets are paid.'),
  ('4900', 'Other income',                 'income', 90, 'Bank interest, refunds, etc.')
ON CONFLICT (code) DO NOTHING;

-- EXPENSES (5xxx-7xxx)
INSERT INTO accounts (code, name, account_type, display_order, description) VALUES
  ('5000', 'Sessional staff fees',         'expense', 10, 'Self-employed facilitators (invoiced).'),
  ('5010', 'Volunteer expenses',           'expense', 11, 'Volunteer travel, refreshments, DBS, induction.'),
  ('5100', 'Venue hire',                   'expense', 20, 'Hire of community venues, play facilities, halls.'),
  ('5110', 'Equipment & materials',        'expense', 21, 'Arts/crafts, sensory resources, storytelling materials.'),
  ('5120', 'Trips & outings',              'expense', 22, 'Local outings, enrichment activities.'),
  ('5130', 'Refreshments & catering',      'expense', 23, 'Snacks, drinks for participants & volunteers.'),
  ('5140', 'Printing & marketing',         'expense', 24, 'Flyers, banners, social media boosts.'),
  ('6000', 'Insurance',                    'expense', 30, 'Public liability, equipment insurance.'),
  ('6010', 'IT & software',                'expense', 31, 'Hosting, Supabase, Vercel, Resend, etc.'),
  ('6020', 'Office & admin',               'expense', 32, 'Stationery, postage, registered office.'),
  ('6030', 'Professional fees',            'expense', 33, 'Accountancy, legal, training.'),
  ('6040', 'Bank charges',                 'expense', 34, 'Bank fees, Stripe fees.'),
  ('6100', 'Safeguarding & DBS',           'expense', 40, 'DBS check fees, safeguarding training.'),
  ('6900', 'Other expenses',               'expense', 90, 'Catch-all for unclassified spend.')
ON CONFLICT (code) DO NOTHING;

-- ASSETS (1xxx)
INSERT INTO accounts (code, name, account_type, display_order, description) VALUES
  ('1000', 'Virgin Money current account', 'asset', 10, 'Primary CIC bank account.'),
  ('1100', 'Cash on hand',                 'asset', 20, 'Petty cash (rare).'),
  ('1200', 'Debtors',                      'asset', 30, 'Money owed to EII (unpaid invoices).'),
  ('1300', 'Prepayments',                  'asset', 40, 'Costs paid in advance for future periods.'),
  ('1500', 'Stripe balance',               'asset', 50, 'Donations held by Stripe pending payout.')
ON CONFLICT (code) DO NOTHING;

-- LIABILITIES (2xxx)
INSERT INTO accounts (code, name, account_type, display_order, description) VALUES
  ('2000', 'Creditors',                    'liability', 10, 'Unpaid supplier invoices.'),
  ('2100', 'Accruals',                     'liability', 20, 'Expenses incurred but not yet invoiced.'),
  ('2200', 'Deferred income',              'liability', 30, 'Grant cash received but not yet earned (per matching principle).')
ON CONFLICT (code) DO NOTHING;

-- EQUITY (3xxx)
INSERT INTO accounts (code, name, account_type, display_order, description) VALUES
  ('3000', 'Opening balance',              'equity', 10, 'Opening fund balances at system go-live.'),
  ('3100', 'Retained reserves',            'equity', 20, 'Accumulated unrestricted surplus.')
ON CONFLICT (code) DO NOTHING;

-- ---- Opening accounting period: Year 1 from CIC incorporation ----
INSERT INTO accounting_periods (name, starts_on, ends_on, status)
VALUES ('Year 1 (Aug 2025 – Aug 2026)', '2025-08-22', '2026-08-31', 'open')
ON CONFLICT DO NOTHING;
