-- Daily Time Entry System (Upwork-style)
-- Each entry is a work log with time range and description

-- Time entries table
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  
  -- Date and time
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hours DECIMAL(4, 2) NOT NULL,
  
  -- Work details
  description TEXT NOT NULL,
  task_id UUID, -- Optional link to tasks table
  project_id UUID, -- Optional link to projects table (if exists)
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Approval
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_hours CHECK (hours > 0 AND hours <= 24)
);

-- Indexes for performance
CREATE INDEX idx_time_entries_user_date ON time_entries(user_id, date);
CREATE INDEX idx_time_entries_status ON time_entries(status);
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_time_entries_user_status ON time_entries(user_id, status);

-- Attendance table (simplified - for check-in/out tracking)
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  date DATE NOT NULL,
  
  -- Check-in/out
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  
  -- Location
  check_in_lat DECIMAL(10, 8),
  check_in_lng DECIMAL(11, 8),
  check_out_lat DECIMAL(10, 8),
  check_out_lng DECIMAL(11, 8),
  
  -- Calculated hours
  total_hours DECIMAL(4, 2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'absent', -- present, late, absent, half_day
  is_late BOOLEAN DEFAULT FALSE,
  late_by_minutes INTEGER DEFAULT 0,
  
  -- Manual entry
  is_manual BOOLEAN DEFAULT FALSE,
  manual_entry_by UUID REFERENCES users(id),
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(user_id, date)
);

CREATE INDEX idx_attendance_user_date ON attendance_records(user_id, date);
CREATE INDEX idx_attendance_status ON attendance_records(status);

-- Work schedules (per-employee timing)
CREATE TABLE work_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
  
  work_start_time TIME DEFAULT '09:00:00',
  work_end_time TIME DEFAULT '18:00:00',
  late_threshold_minutes INTEGER DEFAULT 0,
  
  lunch_break_minutes INTEGER DEFAULT 60,
  
  work_days VARCHAR(20) DEFAULT '1,2,3,4,5', -- Mon-Fri (0=Sun, 6=Sat)
  
  effective_from DATE DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Organization settings
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Work hours
  default_work_start_time TIME DEFAULT '09:00:00',
  default_work_end_time TIME DEFAULT '18:00:00',
  default_late_threshold_minutes INTEGER DEFAULT 0,
  
  -- Time entry settings
  min_entry_minutes INTEGER DEFAULT 15, -- Minimum 15 minutes per entry
  max_hours_per_day DECIMAL(3, 1) DEFAULT 12.0,
  require_description BOOLEAN DEFAULT TRUE,
  min_description_length INTEGER DEFAULT 10,
  
  -- Approval settings
  auto_approve BOOLEAN DEFAULT FALSE,
  approval_required BOOLEAN DEFAULT TRUE,
  
  -- Location
  require_geolocation BOOLEAN DEFAULT FALSE,
  office_lat DECIMAL(10, 8),
  office_lng DECIMAL(11, 8),
  allowed_radius_meters INTEGER DEFAULT 500,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Insert default org settings
INSERT INTO organization_settings DEFAULT VALUES;

-- Row Level Security
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Policies for time_entries
CREATE POLICY "Users can view own time entries"
  ON time_entries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own time entries"
  ON time_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending entries"
  ON time_entries FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Users can delete own pending entries"
  ON time_entries FOR DELETE
  USING (user_id = auth.uid() AND status = 'pending');

-- Policies for attendance_records
CREATE POLICY "Users can view own attendance"
  ON attendance_records FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own attendance"
  ON attendance_records FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own attendance"
  ON attendance_records FOR UPDATE
  USING (user_id = auth.uid());

-- Policies for work_schedules
CREATE POLICY "All authenticated users can view work schedules"
  ON work_schedules FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own work schedule"
  ON work_schedules FOR ALL
  USING (user_id = auth.uid());

-- Policies for organization_settings
CREATE POLICY "No direct client access to org settings"
  ON organization_settings FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Function to calculate hours from time range
CREATE OR REPLACE FUNCTION calculate_hours(start_time TIME, end_time TIME)
RETURNS DECIMAL(4, 2) AS $$
BEGIN
  RETURN ROUND((EXTRACT(EPOCH FROM (end_time - start_time)) / 3600)::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate hours on insert/update
CREATE OR REPLACE FUNCTION auto_calculate_hours()
RETURNS TRIGGER AS $$
BEGIN
  NEW.hours := calculate_hours(NEW.start_time, NEW.end_time);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER time_entries_calculate_hours
  BEFORE INSERT OR UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_hours();