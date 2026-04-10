-- Phase 3: Timesheets
-- Migration 011: Create Timesheet Entries Table

CREATE TABLE IF NOT EXISTS timesheet_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  task_id UUID,
  description TEXT,
  start_time TIME,
  end_time TIME,
  break_minutes INTEGER DEFAULT 0,
  total_hours DECIMAL(4,2) NOT NULL,
  billable BOOLEAN DEFAULT true,
  location VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_timesheet_id ON timesheet_entries(timesheet_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_date ON timesheet_entries(date);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_task_id ON timesheet_entries(task_id);

-- Add constraints
ALTER TABLE timesheet_entries ADD CONSTRAINT check_total_hours 
  CHECK (total_hours > 0 AND total_hours <= 24);

COMMENT ON TABLE timesheet_entries IS 'Individual time entries within timesheets';
