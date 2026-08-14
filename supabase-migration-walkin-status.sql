-- ============================================
-- Add walk_in status to registrations
-- ============================================
-- Walk-in families register on the day at the venue (via a QR code at
-- Station 1) rather than in advance. They're served from 3-4pm from
-- whatever stock remains after registered families have collected.
--
-- Status semantics:
--   walk_in — registered on the day at the venue; served FIFO after 3pm
--             if stock remains. Never emailed (they're already at the venue).

ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_status_check;

ALTER TABLE registrations
  ADD CONSTRAINT registrations_status_check
  CHECK (status IN (
    'confirmed',
    'waitlisted',
    'cancelled',
    'pending',
    'approved',
    'declined',
    'walk_in'
  ));
