-- Evolution Impact Initiative — Final-Release flag
-- Adds a manual toggle on events for "this is the final release of tickets"
-- so the festival page (and any other event) can surface scarcity copy
-- without it being derived from capacity.
-- Run this in the Supabase SQL Editor.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS final_release boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN events.final_release IS
  'When true, the public event page shows "final release" scarcity messaging.';
