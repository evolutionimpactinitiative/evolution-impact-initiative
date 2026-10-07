-- ============================================
-- Portal notifications + per-carer email prefs
-- ============================================
-- When something new lands for a parent (right now: a published Village
-- post) we insert one `notifications` row per carer so each person has
-- their own unread state and bell badge in the portal nav.
--
-- Email delivery is decoupled: parents choose `village_email_pref` on
-- parent_carers (per_post | daily_digest | never). The fan-out code uses
-- that to decide whether to send immediately or defer to the daily
-- digest cron. The `digest_sent_at` column stops duplicate sends if a
-- parent switches preference mid-day.
--
-- Only service-role writes allowed — fan-out runs with the admin
-- client. Parents can SELECT and UPDATE (mark-read) their own rows.


-- ============================================
-- parent_carers.village_email_pref
-- ============================================
ALTER TABLE parent_carers
  ADD COLUMN IF NOT EXISTS village_email_pref TEXT NOT NULL DEFAULT 'daily_digest'
    CHECK (village_email_pref IN ('per_post', 'daily_digest', 'never'));


-- ============================================
-- notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('village_post', 'event_launch')),
  title TEXT NOT NULL,
  body TEXT,
  link_url TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  digest_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial index for the "unread badge" query — tiny and fast.
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id)
  WHERE read_at IS NULL;

-- Covers the digest cron's lookup: "unseen-by-email notifications for
-- this user ordered by created_at".
CREATE INDEX IF NOT EXISTS idx_notifications_digest_pending
  ON notifications (user_id, created_at)
  WHERE digest_sent_at IS NULL;

-- Full notification list on /portal/notifications, newest first.
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);


-- ============================================
-- RLS
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Parents see only their own notifications.
DROP POLICY IF EXISTS "Carer can view own notifications" ON notifications;
CREATE POLICY "Carer can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Parents can mark their own notifications read (UPDATE read_at). The
-- WITH CHECK stops them changing user_id to someone else's row.
DROP POLICY IF EXISTS "Carer can mark own notifications read" ON notifications;
CREATE POLICY "Carer can mark own notifications read"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Team members can view notifications across the board for support/debugging.
DROP POLICY IF EXISTS "Team can view all notifications" ON notifications;
CREATE POLICY "Team can view all notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );

-- No INSERT policy for authenticated role: all inserts run through the
-- service-role fan-out helper. Parents can't create notifications.
