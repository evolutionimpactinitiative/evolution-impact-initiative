-- ============================================
-- Event launch playbook
-- ============================================
-- Once a proposal is approved and a draft event is spawned, the team runs
-- through a fixed launch playbook: ping the designer for artwork → upload
-- the 3 artwork slots → publish → send announcement email → post on socials
-- → (post-event: survey + debrief, added in a later migration).
--
-- We keep the state as a JSONB blob on the events table because it's a
-- small, event-scoped checklist that never gets queried in aggregate.
-- Adding new steps is a code change, no migration needed.
--
-- Shape (all keys optional):
-- {
--   designer_pinged_at: "2026-08-14T12:00:00Z",
--   published_at:       "2026-08-15T09:30:00Z",   -- set on Publish via playbook
--   announcement_sent_at: "…",                   -- set when compose is opened
--   socials_posted: {
--     instagram: "…", linkedin: "…", facebook: "…", tiktok: "…"
--   },
--   survey_sent_at: "…",       -- Commit 4
--   debrief_at:      "…"        -- Commit 4
-- }
--
-- Artwork status is derived from event columns:
--   card_image_url    → website card
--   hero_image_url    → website hero
--   social_image_url  → social media design (new column below)

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS social_image_url TEXT;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS playbook_state JSONB NOT NULL DEFAULT '{}'::jsonb;

-- No new indexes — playbook_state is only ever read/written per event.
