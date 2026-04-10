-- Auto-checkout system with heartbeat and admin adjustments

-- Step 1: Add columns to attendance_records for auto-checkout tracking
ALTER TABLE attendance_records 
ADD COLUMN last_activity TIMESTAMPTZ,
ADD COLUMN auto_checkout BOOLEAN DEFAULT FALSE,
ADD COLUMN auto_checkout_reason VARCHAR(50);

-- Add index for last_activity lookups (for cron job)
CREATE INDEX idx_attendance_last_activity_open 
ON attendance_records(last_activity) 
WHERE check_out_time IS NULL;

CREATE INDEX idx_attendance_auto_checkout 
ON attendance_records(auto_checkout) 
WHERE auto_checkout = TRUE;

-- Step 2: Add inactivity timeout setting to organization_settings
ALTER TABLE organization_settings
ADD COLUMN inactivity_timeout_minutes INTEGER DEFAULT 30,
ADD COLUMN auto_checkout_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN heartbeat_interval_minutes INTEGER DEFAULT 5;

COMMENT ON COLUMN organization_settings.inactivity_timeout_minutes IS 
  'Minutes of inactivity before auto-checkout triggers. Default 30 min.';
COMMENT ON COLUMN organization_settings.auto_checkout_enabled IS 
  'Enable/disable auto-checkout feature globally.';
COMMENT ON COLUMN organization_settings.heartbeat_interval_minutes IS 
  'How often client sends heartbeat pings. Default 5 min.';

-- Update default org settings
UPDATE organization_settings 
SET inactivity_timeout_minutes = 30, 
    auto_checkout_enabled = TRUE,
    heartbeat_interval_minutes = 5;

-- Step 3: Create attendance adjustments audit table
CREATE TABLE attendance_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_record_id UUID REFERENCES attendance_records(id) NOT NULL,
  
  -- Who made the adjustment
  adjusted_by UUID REFERENCES users(id) NOT NULL,
  
  -- What was changed
  field_name VARCHAR(50) NOT NULL, -- 'check_in_time', 'check_out_time', 'total_hours', 'status'
  old_value TEXT,
  new_value TEXT,
  
  -- Reason for adjustment
  adjustment_reason TEXT NOT NULL,
  adjustment_type VARCHAR(30) NOT NULL, -- 'manual_correction', 'auto_checkout_reversal', 'time_added', 'time_removed'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Optional: Employee request reference
  employee_request_id UUID, -- Future: link to adjustment requests table
  
  CONSTRAINT valid_adjustment_type CHECK (
    adjustment_type IN ('manual_correction', 'auto_checkout_reversal', 'time_added', 'time_removed', 'status_change')
  )
);

CREATE INDEX idx_attendance_adjustments_record 
ON attendance_adjustments(attendance_record_id);

CREATE INDEX idx_attendance_adjustments_by 
ON attendance_adjustments(adjusted_by);

CREATE INDEX idx_attendance_adjustments_date 
ON attendance_adjustments(created_at DESC);

-- RLS for adjustments table
ALTER TABLE attendance_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and HR can view all adjustments"
  ON attendance_adjustments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Admins and HR can create adjustments"
  ON attendance_adjustments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'hr')
    )
  );

-- Step 4: Create function to auto-checkout inactive sessions
CREATE OR REPLACE FUNCTION auto_checkout_inactive_sessions()
RETURNS TABLE (
  record_id UUID,
  user_id UUID,
  check_in_time TIMESTAMPTZ,
  auto_checkout_time TIMESTAMPTZ,
  reason VARCHAR(50)
) AS $$
DECLARE
  timeout_minutes INTEGER;
  enabled BOOLEAN;
BEGIN
  -- Get org settings
  SELECT 
    COALESCE(inactivity_timeout_minutes, 30),
    COALESCE(auto_checkout_enabled, TRUE)
  INTO timeout_minutes, enabled
  FROM organization_settings 
  LIMIT 1;

  -- Skip if disabled
  IF NOT enabled THEN
    RETURN;
  END IF;

  -- SCENARIO A: Sessions with no activity for X minutes (heartbeat stopped)
  RETURN QUERY
  UPDATE attendance_records
  SET 
    check_out_time = last_activity,
    total_hours = ROUND(EXTRACT(EPOCH FROM (last_activity - check_in_time))/3600, 2),
    auto_checkout = TRUE,
    auto_checkout_reason = 'inactivity_timeout',
    notes = COALESCE(notes, '') || ' [Auto-checkout: ' || timeout_minutes || ' min inactivity]',
    updated_at = NOW()
  WHERE check_out_time IS NULL
    AND last_activity IS NOT NULL
    AND last_activity < NOW() - (timeout_minutes || ' minutes')::interval
    AND check_in_time < NOW() - (timeout_minutes || ' minutes')::interval
  RETURNING 
    attendance_records.id,
    attendance_records.user_id,
    attendance_records.check_in_time,
    attendance_records.check_out_time,
    attendance_records.auto_checkout_reason;

  -- SCENARIO B: Sessions with no heartbeat ever (browser closed immediately after check-in)
  -- Wait at least 2x timeout before auto-checkout to give user time to start heartbeat
  RETURN QUERY
  UPDATE attendance_records
  SET 
    check_out_time = check_in_time + (timeout_minutes || ' minutes')::interval,
    total_hours = timeout_minutes / 60.0,
    auto_checkout = TRUE,
    auto_checkout_reason = 'no_heartbeat',
    notes = COALESCE(notes, '') || ' [Auto-checkout: no activity detected]',
    updated_at = NOW()
  WHERE check_out_time IS NULL
    AND last_activity IS NULL
    AND check_in_time < NOW() - (2 * timeout_minutes || ' minutes')::interval
  RETURNING 
    attendance_records.id,
    attendance_records.user_id,
    attendance_records.check_in_time,
    attendance_records.check_out_time,
    attendance_records.auto_checkout_reason;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create function to auto-checkout sessions that exceeded max hours
CREATE OR REPLACE FUNCTION auto_checkout_max_hours_sessions()
RETURNS TABLE (
  record_id UUID,
  user_id UUID,
  check_in_time TIMESTAMPTZ,
  auto_checkout_time TIMESTAMPTZ
) AS $$
DECLARE
  max_hours NUMERIC;
BEGIN
  -- Get max hours from org settings
  SELECT COALESCE(max_hours_per_day, 12) INTO max_hours
  FROM organization_settings 
  LIMIT 1;

  RETURN QUERY
  UPDATE attendance_records
  SET 
    check_out_time = check_in_time + (max_hours || ' hours')::interval,
    total_hours = max_hours,
    auto_checkout = TRUE,
    auto_checkout_reason = 'exceeded_max_hours',
    notes = COALESCE(notes, '') || ' [Auto-checkout: exceeded ' || max_hours || ' hours]',
    status = CASE WHEN status = 'absent' THEN 'present' ELSE status END,
    updated_at = NOW()
  WHERE check_out_time IS NULL
    AND auto_checkout = FALSE
    AND check_in_time < NOW() - (max_hours || ' hours')::interval
  RETURNING 
    attendance_records.id,
    attendance_records.user_id,
    attendance_records.check_in_time,
    attendance_records.check_out_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Schedule pg_cron jobs (if extension is enabled)
-- Note: pg_cron extension must be enabled in Supabase dashboard first
-- Run these commands manually or through Supabase SQL editor:

-- SELECT cron.schedule(
--   'auto-checkout-inactivity',
--   '*/5 * * * *',  -- Every 5 minutes
--   'SELECT auto_checkout_inactive_sessions();'
-- );

-- SELECT cron.schedule(
--   'auto-checkout-max-hours',
--   '0 */1 * * *',  -- Every hour
--   'SELECT auto_checkout_max_hours_sessions();'
-- );

-- Step 7: Add new permissions for attendance adjustment
INSERT INTO permissions (name, description, category) VALUES
  ('attendance.adjust_records', 'Adjust employee attendance records (add/remove hours, correct times)', 'attendance'),
  ('attendance.view_adjustments', 'View attendance adjustment history', 'attendance')
ON CONFLICT (name) DO NOTHING;

-- Grant to admin and hr roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name IN ('admin', 'hr') 
  AND p.name IN ('attendance.adjust_records', 'attendance.view_adjustments')
ON CONFLICT DO NOTHING;

-- Grant view_adjustments to team_lead as well
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'team_lead' 
  AND p.name = 'attendance.view_adjustments'
ON CONFLICT DO NOTHING;

-- Step 8: Update RLS policy for attendance_records to allow admin/HR updates
-- Note: Existing policy only allows users to update own attendance
-- We need to allow admins/HR to update any attendance record for adjustments

CREATE POLICY "Admins and HR can update any attendance record"
  ON attendance_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'hr')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'hr')
    )
  );

-- Step 9: Function to get auto-checkout settings
CREATE OR REPLACE FUNCTION get_auto_checkout_settings()
RETURNS TABLE (
  inactivity_timeout_minutes INTEGER,
  auto_checkout_enabled BOOLEAN,
  heartbeat_interval_minutes INTEGER,
  max_hours_per_day NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(inactivity_timeout_minutes, 30),
    COALESCE(auto_checkout_enabled, TRUE),
    COALESCE(heartbeat_interval_minutes, 5),
    COALESCE(max_hours_per_day, 12)
  FROM organization_settings 
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Function to update auto-checkout settings (admin only)
CREATE OR REPLACE FUNCTION update_auto_checkout_settings(
  p_inactivity_timeout_minutes INTEGER,
  p_auto_checkout_enabled BOOLEAN,
  p_heartbeat_interval_minutes INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE organization_settings
  SET 
    inactivity_timeout_minutes = p_inactivity_timeout_minutes,
    auto_checkout_enabled = p_auto_checkout_enabled,
    heartbeat_interval_minutes = p_heartbeat_interval_minutes,
    updated_at = NOW()
  WHERE id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_checkout_inactive_sessions() IS 
  'Auto-checkout sessions with no heartbeat for X minutes. Run via pg_cron every 5 min.';
COMMENT ON FUNCTION auto_checkout_max_hours_sessions() IS 
  'Auto-checkout sessions exceeding max_hours_per_day. Run via pg_cron hourly.';