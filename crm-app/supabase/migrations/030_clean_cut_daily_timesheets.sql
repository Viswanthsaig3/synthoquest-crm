-- Phase 3: Timesheets (clean-cut daily model)
-- Migration 030: Replace weekly period columns with work_date

BEGIN;

-- 1) Add new canonical daily field
ALTER TABLE timesheets
  ADD COLUMN IF NOT EXISTS work_date DATE;

-- 2) Backfill from existing weekly start (dev-safe)
UPDATE timesheets
SET work_date = week_start_date
WHERE work_date IS NULL;

-- 3) Enforce NOT NULL after backfill
ALTER TABLE timesheets
  ALTER COLUMN work_date SET NOT NULL;

-- 4) Drop weekly-only constraints/indexes
ALTER TABLE timesheets DROP CONSTRAINT IF EXISTS check_week_dates;
DROP INDEX IF EXISTS idx_timesheets_unique;
DROP INDEX IF EXISTS idx_timesheets_week_start;
DROP INDEX IF EXISTS idx_timesheets_employee_week;

-- 5) Add daily indexes/uniqueness
CREATE INDEX IF NOT EXISTS idx_timesheets_work_date ON timesheets(work_date);
CREATE INDEX IF NOT EXISTS idx_timesheets_employee_date ON timesheets(employee_id, work_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_timesheets_unique_employee_day
  ON timesheets(employee_id, work_date)
  WHERE deleted_at IS NULL;

-- 6) Drop legacy weekly fields
ALTER TABLE timesheets DROP COLUMN IF EXISTS week_start_date;
ALTER TABLE timesheets DROP COLUMN IF EXISTS week_end_date;

COMMENT ON TABLE timesheets IS 'Daily timesheet records for employees';

COMMIT;
