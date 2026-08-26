-- ============================================
-- August drive cleanup + archive
-- ============================================
-- Runs on 26 Aug 2026, the day after the physical stock count. Retires
-- everything from the August drive so the Collection Day register page
-- shows the true post-count free stock.
--
-- Guiding principles:
--   • Nothing is deleted. Every August row stays in the DB.
--   • Statuses flip so live queries stop counting stale demand.
--   • Allocations get a soft-archive column so we can still browse the
--     substitutions the team made without them affecting stock math.
--
-- Rerunning this is safe — every UPDATE is idempotent (only touches
-- rows that haven't already been flipped).

BEGIN;

-- ─── 1. Soft-archive substitutions (allocations) ─────────────────
-- Add the column if it isn't already there, then mark every existing
-- allocation as archived (they were all created during August prep).
ALTER TABLE back_to_school_stock_allocations
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

UPDATE back_to_school_stock_allocations
   SET archived_at = NOW()
 WHERE archived_at IS NULL;


-- ─── 2. Release August pick reservations ────────────────────────
-- Every reservation currently in 'reserved' state is tied to an August
-- registration (Collection Day hasn't started booking yet — this SQL
-- runs before those come in). Flip them all to 'released' so the
-- effective-cell math stops subtracting them from free stock.
UPDATE back_to_school_pick_reservations
   SET status = 'released',
       released_at = NOW(),
       note = COALESCE(note, '') || E'\nAugust drive closed 26 Aug 2026'
 WHERE status = 'reserved'
   AND registration_id IN (
     SELECT r.id
       FROM registrations r
       JOIN events e ON e.id = r.event_id
      WHERE e.slug = 'back-to-school-drive-2026'
   );


-- ─── 3. Cancel unattended August approved registrations ─────────
-- 170 parents were approved but never marked attended. Their kids'
-- uniform_choices are still being counted as "demand" by the register
-- page. Flip them to 'cancelled' with an admin_notes tag so we can
-- still find them (the archive page filters on it too).
UPDATE registrations
   SET status = 'cancelled',
       cancelled_at = NOW(),
       cancellation_reason = 'august_no_show',
       admin_notes = COALESCE(admin_notes || E'\n', '')
                     || 'August drive: did not attend — automatically cancelled 26 Aug 2026 so demand stops eating collection stock. See archive.'
 WHERE status IN ('approved', 'walk_in')
   AND (attended IS NULL OR attended <> 'yes')
   AND event_id IN (
     SELECT id FROM events WHERE slug = 'back-to-school-drive-2026'
   );

COMMIT;

-- ─── Verify (view the summary — no writes below) ────────────────
SELECT 'allocations archived' AS metric, COUNT(*) AS n
  FROM back_to_school_stock_allocations WHERE archived_at IS NOT NULL
UNION ALL
SELECT 'reservations released', COUNT(*)
  FROM back_to_school_pick_reservations WHERE status = 'released'
UNION ALL
SELECT 'august regs cancelled', COUNT(*)
  FROM registrations
 WHERE cancellation_reason = 'august_no_show'
UNION ALL
SELECT 'august regs attended', COUNT(*)
  FROM registrations r
  JOIN events e ON e.id = r.event_id
 WHERE e.slug = 'back-to-school-drive-2026'
   AND r.attended = 'yes';
