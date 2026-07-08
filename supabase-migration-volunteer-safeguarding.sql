-- Volunteer safeguarding, DBS, and parental consent fields
-- Adds columns to festival_volunteers so the apply form can capture:
--   * DBS check status and level
--   * Safeguarding training status and provider notes
--   * Parental/guardian consent for under-18 volunteers
--
-- All new columns are nullable so existing rows remain valid.
-- The application form enforces required fields (DOB always, parental block when age < 18).

BEGIN;

-- DBS
ALTER TABLE festival_volunteers
  ADD COLUMN IF NOT EXISTS has_dbs BOOLEAN,
  ADD COLUMN IF NOT EXISTS dbs_level TEXT
    CHECK (
      dbs_level IS NULL OR dbs_level IN (
        'basic',
        'standard',
        'enhanced',
        'enhanced_child_barred',
        'enhanced_adult_barred',
        'enhanced_both_barred'
      )
    );

-- Safeguarding training
ALTER TABLE festival_volunteers
  ADD COLUMN IF NOT EXISTS has_safeguarding_training BOOLEAN,
  ADD COLUMN IF NOT EXISTS safeguarding_training_notes TEXT;

-- Parental / guardian consent (only populated when volunteer is under 18)
ALTER TABLE festival_volunteers
  ADD COLUMN IF NOT EXISTS parent_guardian_name TEXT,
  ADD COLUMN IF NOT EXISTS parent_guardian_phone TEXT,
  ADD COLUMN IF NOT EXISTS parent_guardian_email TEXT,
  ADD COLUMN IF NOT EXISTS parent_guardian_relationship TEXT,
  ADD COLUMN IF NOT EXISTS parental_consent_confirmed BOOLEAN;

-- Helpful for admin filters (e.g. surface under-18s to the safeguarding lead first)
CREATE INDEX IF NOT EXISTS idx_festival_volunteers_dob
  ON festival_volunteers(date_of_birth);

COMMIT;
