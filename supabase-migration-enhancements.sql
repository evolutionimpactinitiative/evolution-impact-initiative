-- Evolution Impact Initiative - Database Enhancement Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- EVENTS TABLE ENHANCEMENTS
-- ============================================

-- Add arrival time field
ALTER TABLE events ADD COLUMN IF NOT EXISTS arrival_time TIME;

-- Add event type field (children, adults, mixed)
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'children'
  CHECK (event_type IN ('children', 'adults', 'mixed'));

-- Add max attendees per registration (for adult events)
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_attendees_per_registration INTEGER DEFAULT 2;

-- Add custom fields JSON column for dynamic registration forms
ALTER TABLE events ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]';

-- Update category constraint to include new categories
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check;
ALTER TABLE events ADD CONSTRAINT events_category_check
  CHECK (category IN ('creative', 'sport', 'support', 'community', 'workshop', 'social', 'training', 'family'));


-- ============================================
-- REGISTRATIONS TABLE ENHANCEMENTS
-- ============================================

-- Add photo/video consent field
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS photo_video_consent BOOLEAN DEFAULT FALSE;

-- Add terms accepted timestamp
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Add custom responses JSON column for dynamic form responses
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS custom_responses JSONB DEFAULT '{}';


-- ============================================
-- REGISTRATION ATTENDEES TABLE (for adult events)
-- ============================================

-- Create new table for adult attendees (similar to registration_children)
CREATE TABLE IF NOT EXISTS registration_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT,
  attendee_phone TEXT,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for registration_attendees
CREATE INDEX IF NOT EXISTS idx_registration_attendees_registration_id
  ON registration_attendees(registration_id);

-- Enable RLS on registration_attendees
ALTER TABLE registration_attendees ENABLE ROW LEVEL SECURITY;

-- Team members can view registration attendees
CREATE POLICY "Team members can view registration attendees" ON registration_attendees
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt() ->> 'email')
  );

-- Public can insert registration attendees
CREATE POLICY "Public can add attendees to registration" ON registration_attendees
  FOR INSERT WITH CHECK (true);


-- ============================================
-- DONE
-- ============================================
-- After running this migration, restart your Next.js dev server
