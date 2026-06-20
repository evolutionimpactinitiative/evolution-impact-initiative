-- ============================================================================
-- Accounting v2 — Phase 1 Sprint 2: Private attachments storage bucket
-- ============================================================================
-- Receipts, invoices, grant letters, DBS certs etc. are sensitive — they
-- contain personal addresses, bank details, beneficiary info. They MUST NOT
-- be served via public URLs. This bucket is private; access is via signed
-- URLs minted server-side, gated by team-membership.
-- ============================================================================

-- 1. Create the bucket (private, 10 MB max, common business doc types)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. RLS policies on storage.objects scoped to the attachments bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Team members can upload attachments'
  ) THEN
    CREATE POLICY "Team members can upload attachments"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'attachments' AND acct_is_team_member());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Team members can read attachments'
  ) THEN
    CREATE POLICY "Team members can read attachments"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'attachments' AND acct_is_team_member());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Team members can delete attachments'
  ) THEN
    CREATE POLICY "Team members can delete attachments"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'attachments' AND acct_is_team_member());
  END IF;
END $$;
