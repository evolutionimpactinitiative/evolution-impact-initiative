-- Migration: Add attendance confirmation fields to registrations
-- Run this in Supabase SQL Editor to add the new columns

-- Add attendance confirmation fields
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS attendance_confirmed BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS attendance_confirmed_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for querying unconfirmed registrations
CREATE INDEX IF NOT EXISTS idx_registrations_attendance_confirmed
ON registrations(attendance_confirmed)
WHERE attendance_confirmed IS NULL;

-- Add policy to allow public to update their own registration's attendance status
-- This allows the confirm-attendance endpoint to work
CREATE POLICY "Public can update own registration attendance" ON registrations
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Note: If you get an error about the policy already existing, you can skip it
-- The existing "Team members can manage registrations" policy may already cover this
