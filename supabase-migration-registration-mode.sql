-- ============================================
-- events.registration_mode — open / waitlist / closed
-- ============================================
-- Lets us pause active enrolment without closing the form entirely.
-- When set to 'waitlist', new registrations land as status='waitlisted'
-- instead of 'pending' and the family gets a warm "you're on the list"
-- email. Admin can promote individual waitlisted registrations to
-- 'pending' as capacity/supply opens up.
--
-- Modes:
--   open     — normal flow, new registrations go straight to pending
--   waitlist — new registrations land as waitlisted; admin promotes
--   closed   — public form refuses new registrations entirely

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS registration_mode TEXT NOT NULL DEFAULT 'open'
  CHECK (registration_mode IN ('open', 'waitlist', 'closed'));

COMMENT ON COLUMN events.registration_mode IS
  'open: normal flow · waitlist: new sign-ups land as waitlisted, admin promotes · closed: form refuses new sign-ups';

-- Flip the Back to School Drive to waitlist mode.
-- Existing pending/approved rows are NOT touched — only new sign-ups
-- from now on will land as waitlisted.
UPDATE events
  SET registration_mode = 'waitlist'
  WHERE slug = 'back-to-school-drive-2026';
