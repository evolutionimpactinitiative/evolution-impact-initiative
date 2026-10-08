-- ============================================
-- Public (anonymous) Growing Together registration
-- ============================================
-- Previously a parent had to create an account before registering for a
-- GT session. This friction cost us registrations, so we now let them
-- register anonymously and *then* nudge them toward an account.
--
-- A "shadow" parent_carer row is created with user_id = NULL. Later,
-- when the parent clicks the claim link in their confirmation email,
-- we bind the newly-created auth user to that same parent_carers row
-- so their registration + children stay attached.
--
-- claim_token: single-use URL token (random, URL-safe). We mint a fresh
-- one on each anonymous registration — the latest one wins if a parent
-- registers for multiple sessions before claiming.


ALTER TABLE parent_carers
  ADD COLUMN IF NOT EXISTS claim_token TEXT,
  ADD COLUMN IF NOT EXISTS claim_token_expires_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS ux_parent_carers_claim_token
  ON parent_carers (claim_token)
  WHERE claim_token IS NOT NULL;
