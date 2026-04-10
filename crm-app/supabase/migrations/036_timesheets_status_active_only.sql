-- Timesheets: drop legacy workflow column semantics. Approval is per entry only.
-- Single fixed value for timesheets.status keeps the column for compatibility without draft/submitted UX.
--
-- Drop check_status BEFORE updating rows to 'active': legacy constraint only allowed
-- draft/submitted/approved/rejected, so UPDATE ... 'active' would fail otherwise.

BEGIN;

ALTER TABLE timesheets DROP CONSTRAINT IF EXISTS check_status;

UPDATE timesheets SET status = 'active';

ALTER TABLE timesheets ALTER COLUMN status SET DEFAULT 'active';

ALTER TABLE timesheets ADD CONSTRAINT check_status CHECK (status IN ('active'));

COMMENT ON COLUMN timesheets.status IS 'Fixed value; use timesheet_entries.approval_status for workflow.';

COMMIT;
