-- ============================================
-- Expense submissions
-- ============================================
-- Team + volunteers submit receipts (reimburse-me) or supplier invoices
-- (pay-this) through the dashboard. The chair reviews + approves; the
-- treasurer marks paid, which posts a double-entry transaction into the
-- existing accounting system.
--
-- Dual-approval: any submission ≥ £500 needs BOTH the chair (admin role)
-- and the treasurer (is_treasurer flag) to sign off before the treasurer
-- can mark it paid. Enforced in the API, not by a DB constraint, because
-- the £500 threshold is a business rule that may be tuned per-org later.

-- ── Treasurer flag on team_members ───────────────────────────────
-- Chairs are already identified by role='admin'. Treasurer is a
-- separate hat (Blessing today) and needs its own flag because a person
-- shouldn't have to be an admin to sign off payments.

ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS is_treasurer BOOLEAN NOT NULL DEFAULT FALSE;

-- Seed the current treasurer. Update via /admin/settings when that changes.
UPDATE team_members
   SET is_treasurer = TRUE
 WHERE email = 'blessing@evolutionimpactinitiative.co.uk';


-- ── Submissions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What kind of ask this is. Just changes the copy + which fields
  -- matter; the workflow + approval rules are the same either way.
  kind TEXT NOT NULL CHECK (kind IN ('reimbursement', 'invoice')),

  -- Who
  submitted_by UUID NOT NULL REFERENCES team_members(id) ON DELETE RESTRICT,
  payee_name TEXT NOT NULL,      -- 'Me (Macram)' / 'Kwame Coaching Ltd'
  payee_notes TEXT,              -- freeform for bank details, IBAN, etc

  -- What
  description TEXT NOT NULL,
  amount_pence INTEGER NOT NULL CHECK (amount_pence > 0),
  incurred_on DATE NOT NULL,
  fund_id UUID REFERENCES funds(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,

  -- Docs
  receipt_url TEXT,
  receipt_filename TEXT,

  -- Urgency flag — submissions default to the weekly Friday run;
  -- ticking this asks the treasurer to try to pay outside the run
  -- (no same-day guarantee — communicated in the UI).
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  urgent_reason TEXT,

  -- Workflow
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'chair_approved', 'paid', 'rejected')),
  chair_approved_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  chair_approved_at TIMESTAMPTZ,
  -- Only required (business rule) for ≥£500 submissions
  treasurer_approved_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  treasurer_approved_at TIMESTAMPTZ,
  paid_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,            -- treasurer's note: 'Sent BACS ref XYZ'
  rejection_reason TEXT,
  -- Once posted to the ledger we save the tx id so we can link both ways
  posted_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_status
  ON expense_submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_submitted_by
  ON expense_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_expenses_event
  ON expense_submissions(event_id);

CREATE TRIGGER update_expense_submissions_updated_at
  BEFORE UPDATE ON expense_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ── RLS: team-members only ───────────────────────────────────────
ALTER TABLE expense_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team read expenses"
  ON expense_submissions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Team write expenses"
  ON expense_submissions FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));


-- ── Storage bucket for receipts ──────────────────────────────────
-- Private bucket — receipts include financial info. Team-only reads via
-- signed URLs; upload via authenticated inserts.

INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', FALSE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Team read receipts" ON storage.objects;
DROP POLICY IF EXISTS "Team upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Team delete receipts" ON storage.objects;

CREATE POLICY "Team read receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'expense-receipts' AND
    EXISTS (
      SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Team upload receipts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'expense-receipts' AND
    EXISTS (
      SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Team delete receipts" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'expense-receipts' AND
    EXISTS (
      SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );
