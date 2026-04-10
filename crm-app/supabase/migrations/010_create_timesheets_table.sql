-- Phase 3: Timesheets
-- Migration 010: Create Timesheets Table

CREATE TABLE IF NOT EXISTS timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_hours DECIMAL(5,2) DEFAULT 0,
  regular_hours DECIMAL(5,2) DEFAULT 0,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_timesheets_employee_id ON timesheets(employee_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_status ON timesheets(status);
CREATE INDEX IF NOT EXISTS idx_timesheets_week_start ON timesheets(week_start_date);
CREATE INDEX IF NOT EXISTS idx_timesheets_employee_week ON timesheets(employee_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_timesheets_deleted_at ON timesheets(deleted_at);

-- Add constraints
ALTER TABLE timesheets ADD CONSTRAINT check_week_dates 
  CHECK (week_end_date = week_start_date + 6);

ALTER TABLE timesheets ADD CONSTRAINT check_status 
  CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'));

-- Add unique constraint for employee + week (allowing soft deletes)
CREATE UNIQUE INDEX IF NOT EXISTS idx_timesheets_unique ON timesheets(employee_id, week_start_date) 
  WHERE deleted_at IS NULL;

COMMENT ON TABLE timesheets IS 'Weekly timesheet records for employees';
COMMENT ON COLUMN timesheets.status IS 'Timesheet status: draft, submitted, approved, rejected';
