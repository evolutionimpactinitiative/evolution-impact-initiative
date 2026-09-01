-- ============================================
-- Growing Together — enriched child profile
-- ============================================
-- Adds the fields that let staff genuinely know each child before they walk in:
-- how they like to be greeted, what they love, what helps when they're overwhelmed,
-- and the practical health/accessibility details that keep them safe at sessions.
--
-- All new columns are nullable so families can share at their own pace.
-- Array columns default to empty for easy chip-picker binding.

ALTER TABLE children
  ADD COLUMN IF NOT EXISTS nickname TEXT,
  ADD COLUMN IF NOT EXISTS pronouns TEXT,
  ADD COLUMN IF NOT EXISTS favourite_song TEXT,
  ADD COLUMN IF NOT EXISTS favourite_story TEXT,
  ADD COLUMN IF NOT EXISTS favourite_colour TEXT,
  ADD COLUMN IF NOT EXISTS home_languages TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS dietary_preferences TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS sensory_sensitivities TEXT,
  ADD COLUMN IF NOT EXISTS comfort_item TEXT,
  ADD COLUMN IF NOT EXISTS soothing_strategies TEXT,
  ADD COLUMN IF NOT EXISTS fears TEXT,
  ADD COLUMN IF NOT EXISTS medical_notes TEXT,
  ADD COLUMN IF NOT EXISTS typical_rest_window TEXT;
