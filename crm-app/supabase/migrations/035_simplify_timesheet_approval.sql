-- Migration 035: Simplify Timesheet Approval to Entry-Level
-- Move approval from timesheet-level to individual entry-level

-- Add approval fields to timesheet_entries
ALTER TABLE timesheet_entries
  ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN approved_by UUID REFERENCES users(id),
  ADD COLUMN approved_at TIMESTAMPTZ,
  ADD COLUMN rejected_by UUID REFERENCES users(id),
  ADD COLUMN rejected_at TIMESTAMPTZ,
  ADD COLUMN rejection_reason TEXT;

-- Create index for filtering by approval status
CREATE INDEX idx_timesheet_entries_approval_status ON timesheet_entries(approval_status);

-- Migrate existing data: approved timesheets → approved entries
UPDATE timesheet_entries SET 
  approval_status = 'approved',
  approved_by = (SELECT approved_by FROM timesheets WHERE timesheets.id = timesheet_entries.timesheet_id),
  approved_at = (SELECT approved_at FROM timesheets WHERE timesheets.id = timesheet_entries.timesheet_id)
WHERE timesheet_id IN (SELECT id FROM timesheets WHERE status = 'approved');

-- Migrate rejected entries
UPDATE timesheet_entries SET 
  approval_status = 'rejected',
  rejected_by = (SELECT rejected_by FROM timesheets WHERE timesheets.id = timesheet_entries.timesheet_id),
  rejected_at = (SELECT rejected_at FROM timesheets WHERE timesheets.id = timesheet_entries.timesheet_id),
  rejection_reason = (SELECT rejection_reason FROM timesheets WHERE timesheets.id = timesheet_entries.timesheet_id)
WHERE timesheet_id IN (SELECT id FROM timesheets WHERE status = 'rejected');

-- Draft/submitted entries remain as 'pending' (default)

-- Keep timesheet status columns for now (for audit/transition period)
-- They can be dropped later: ALTER TABLE timesheets DROP COLUMN status, submitted_at, ...

COMMENT ON COLUMN timesheet_entries.approval_status IS 'Entry approval status: pending (default), approved, or rejected';
COMMENT ON COLUMN timesheet_entries.approved_by IS 'User who approved this entry';
COMMENT ON COLUMN timesheet_entries.rejected_by IS 'User who rejected this entry';
