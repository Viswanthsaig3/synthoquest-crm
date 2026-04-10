-- Phase 3: Timesheets
-- Migration 012: Create Timesheet Approvals Table

CREATE TABLE IF NOT EXISTS timesheet_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(20) NOT NULL,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_timesheet_approvals_timesheet_id ON timesheet_approvals(timesheet_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_approvals_approver_id ON timesheet_approvals(approver_id);

-- Add constraints
ALTER TABLE timesheet_approvals ADD CONSTRAINT check_action 
  CHECK (action IN ('approved', 'rejected'));

COMMENT ON TABLE timesheet_approvals IS 'Audit trail for timesheet approvals/rejections';
