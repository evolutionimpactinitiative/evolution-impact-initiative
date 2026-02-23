-- Evolution Impact Initiative - Scheduled Publishing Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ADD PUBLISH_AT TO EVENTS TABLE
-- ============================================

-- Add publish_at column to events table
-- When null or in the past, event is live. When in future, event is scheduled.
ALTER TABLE events ADD COLUMN IF NOT EXISTS publish_at TIMESTAMPTZ;

-- Add index for efficient querying of scheduled events
CREATE INDEX IF NOT EXISTS idx_events_publish_at ON events(publish_at) WHERE publish_at IS NOT NULL;


-- ============================================
-- 2. EVENT NOTIFICATIONS TABLE
-- ============================================

-- Table to store "Notify Me" signups
CREATE TABLE IF NOT EXISTS event_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  subscribe_to_newsletter BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate signups for same event
  UNIQUE(event_id, email)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_event_notifications_event_id ON event_notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_pending ON event_notifications(event_id)
  WHERE notified_at IS NULL;


-- ============================================
-- 3. RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE event_notifications ENABLE ROW LEVEL SECURITY;

-- Team members can view all notifications
CREATE POLICY "Team members can view event notifications"
  ON event_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt()->>'email'
    )
  );

-- Team members can manage notifications
CREATE POLICY "Team members can manage event notifications"
  ON event_notifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.jwt()->>'email'
    )
  );

-- Public can sign up for notifications (insert only)
CREATE POLICY "Public can sign up for notifications"
  ON event_notifications FOR INSERT
  TO anon
  WITH CHECK (true);


-- ============================================
-- 4. GRANTS
-- ============================================

GRANT SELECT, INSERT ON event_notifications TO anon;
GRANT ALL ON event_notifications TO authenticated;


-- ============================================
-- DONE
-- ============================================
-- After running this migration:
-- 1. Restart your Next.js dev server
-- 2. Update your TypeScript types
