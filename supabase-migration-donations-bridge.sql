-- ============================================================================
-- Accounting v2 — Phase 2: donations → accounting bridge
-- ============================================================================
-- Wires the existing public.donations table (festival Stripe flow) into the
-- accounting spine. Each completed donation gets a posted transaction with:
--   • DEBIT  1500 Stripe balance              (asset)
--   • CREDIT 4000 Donations – General         (income)
-- …tagged to a fund + category derived from donation.campaign.
--
-- Campaign → Fund mapping (initial):
--   'general' / NULL / ''     → fund GENERAL  / category 'general'
--   'back-to-school-*'        → fund B2S      / category 'b2s_general'
--   'back_to_school'          → fund B2S      / category 'b2s_general'
--   anything else             → fund GENERAL  / category 'general'  (catch-all)
--
-- The mapping is data-driven via a new lookup table so it can be extended
-- without code changes. Server-side action does the actual posting and uses
-- this table to resolve fund + category.
--
-- This migration is additive — no destructive changes to donations table.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Link column: which accounting transaction did this donation post?
-- ----------------------------------------------------------------------------
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS accounting_transaction_id UUID
    REFERENCES transactions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_donations_accounting_tx
  ON donations(accounting_transaction_id);

CREATE INDEX IF NOT EXISTS idx_donations_status_completed
  ON donations(status) WHERE status = 'completed';

COMMENT ON COLUMN donations.accounting_transaction_id IS
  'When non-NULL, this donation has been posted to the accounting ledger. NULL means either pending/failed/refunded OR completed-but-not-yet-bridged.';

-- ----------------------------------------------------------------------------
-- 2. Campaign → fund mapping table
-- ----------------------------------------------------------------------------
-- Each row says: "donations whose campaign matches this LIKE pattern should
-- post to (fund, category)". Patterns are evaluated in display_order; the
-- first match wins. The final NULL/'%' fallback row routes everything else
-- to the unrestricted fund.
CREATE TABLE IF NOT EXISTS donation_campaign_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_pattern TEXT NOT NULL,
    fund_code TEXT NOT NULL REFERENCES funds(code) ON UPDATE CASCADE,
    fund_category_code TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (fund_code, fund_category_code, campaign_pattern)
);

COMMENT ON TABLE donation_campaign_mappings IS
  'Lookup used by the donations-bridge server action. Pattern is matched with ILIKE so wildcards work (e.g. "back-to-school-%" matches back-to-school-2026).';

CREATE INDEX IF NOT EXISTS idx_donation_campaign_mappings_order
  ON donation_campaign_mappings(display_order)
  WHERE is_active = TRUE;

-- ----------------------------------------------------------------------------
-- 3. RLS — admins manage; everyone can read
-- ----------------------------------------------------------------------------
ALTER TABLE donation_campaign_mappings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname='public'
       AND tablename='donation_campaign_mappings'
       AND policyname='Team members can read donation_campaign_mappings'
  ) THEN
    CREATE POLICY "Team members can read donation_campaign_mappings"
      ON donation_campaign_mappings
      FOR SELECT USING (acct_is_team_member());
  END IF;
END $$;

DROP POLICY IF EXISTS "Admins can write donation_campaign_mappings"
  ON donation_campaign_mappings;
CREATE POLICY "Admins can write donation_campaign_mappings"
  ON donation_campaign_mappings
  FOR ALL TO authenticated
  USING (acct_is_admin())
  WITH CHECK (acct_is_admin());

-- ----------------------------------------------------------------------------
-- 4. Seed default mappings
-- ----------------------------------------------------------------------------
-- More specific patterns first; the GENERAL '%' catch-all is last.
INSERT INTO donation_campaign_mappings (campaign_pattern, fund_code, fund_category_code, display_order, notes)
VALUES
  ('back-to-school-%', 'B2S', 'b2s_general', 10, 'Year-tagged Back to School donations (e.g. back-to-school-2026)'),
  ('back_to_school',   'B2S', 'b2s_general', 11, 'Legacy underscore form'),
  ('b2s',              'B2S', 'b2s_general', 12, 'Short alias'),
  ('general',          'GENERAL', 'general', 90, 'Default/general donations'),
  ('%',                'GENERAL', 'general', 100, 'Catch-all — any campaign falls back to unrestricted')
ON CONFLICT (fund_code, fund_category_code, campaign_pattern) DO NOTHING;

-- ============================================================================
-- Notes:
-- • The bridge action itself lives in lib/accounting/donations-bridge.ts and
--   uses the service-role client (RLS is bypassed for the system-write path).
-- • If the funds or categories named here are renamed in the future, update
--   the seed rows — the table FKs on fund_code (text) not fund_id (uuid) so
--   the seed survives fund_id changes.
-- • Idempotency: postDonationToAccounting() checks donation.accounting_transaction_id
--   before doing anything. Safe to re-run.
-- ============================================================================
