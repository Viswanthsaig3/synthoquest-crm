-- Migration 033: Attendance geofence, home locations, and warning events

-- 1) Per-user home location (single canonical point)
CREATE TABLE IF NOT EXISTS user_home_locations (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 300,
  label VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_user_home_locations_lat'
  ) THEN
    ALTER TABLE user_home_locations
      ADD CONSTRAINT check_user_home_locations_lat
      CHECK (latitude >= -90 AND latitude <= 90);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_user_home_locations_lng'
  ) THEN
    ALTER TABLE user_home_locations
      ADD CONSTRAINT check_user_home_locations_lng
      CHECK (longitude >= -180 AND longitude <= 180);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_user_home_locations_radius'
  ) THEN
    ALTER TABLE user_home_locations
      ADD CONSTRAINT check_user_home_locations_radius
      CHECK (radius_meters >= 50 AND radius_meters <= 10000);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_home_locations_deleted_at ON user_home_locations(deleted_at);

DROP TRIGGER IF EXISTS update_user_home_locations_updated_at ON user_home_locations;
CREATE TRIGGER update_user_home_locations_updated_at
  BEFORE UPDATE ON user_home_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2) Extend attendance records with geofence evaluation result
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS check_in_nearest_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS check_in_distance_meters INTEGER,
  ADD COLUMN IF NOT EXISTS check_in_radius_meters INTEGER,
  ADD COLUMN IF NOT EXISTS check_in_in_radius BOOLEAN,
  ADD COLUMN IF NOT EXISTS check_out_nearest_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS check_out_distance_meters INTEGER,
  ADD COLUMN IF NOT EXISTS check_out_radius_meters INTEGER,
  ADD COLUMN IF NOT EXISTS check_out_in_radius BOOLEAN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_attendance_check_in_nearest_type'
  ) THEN
    ALTER TABLE attendance_records
      ADD CONSTRAINT check_attendance_check_in_nearest_type
      CHECK (check_in_nearest_type IS NULL OR check_in_nearest_type IN ('office', 'home', 'none'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_attendance_check_out_nearest_type'
  ) THEN
    ALTER TABLE attendance_records
      ADD CONSTRAINT check_attendance_check_out_nearest_type
      CHECK (check_out_nearest_type IS NULL OR check_out_nearest_type IN ('office', 'home', 'none'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_attendance_check_in_in_radius ON attendance_records(check_in_in_radius);
CREATE INDEX IF NOT EXISTS idx_attendance_check_out_in_radius ON attendance_records(check_out_in_radius);

-- 3) Warning events for out-of-radius actions
CREATE TABLE IF NOT EXISTS attendance_geofence_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_record_id UUID REFERENCES attendance_records(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL, -- check_in | check_out
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  nearest_type VARCHAR(20) NOT NULL DEFAULT 'none', -- office | home | none
  distance_meters INTEGER,
  allowed_radius_meters INTEGER,
  warning_reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- open | reviewed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  review_note TEXT
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_attendance_warning_event_type'
  ) THEN
    ALTER TABLE attendance_geofence_warnings
      ADD CONSTRAINT check_attendance_warning_event_type
      CHECK (event_type IN ('check_in', 'check_out'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_attendance_warning_nearest_type'
  ) THEN
    ALTER TABLE attendance_geofence_warnings
      ADD CONSTRAINT check_attendance_warning_nearest_type
      CHECK (nearest_type IN ('office', 'home', 'none'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_attendance_warning_status'
  ) THEN
    ALTER TABLE attendance_geofence_warnings
      ADD CONSTRAINT check_attendance_warning_status
      CHECK (status IN ('open', 'reviewed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_attendance_warning_user_date ON attendance_geofence_warnings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_warning_status_date ON attendance_geofence_warnings(status, created_at DESC);

-- 4) New permission catalog entries
INSERT INTO permissions (key, name, description, resource, action) VALUES
  ('attendance.manage_office_location', 'Manage Office Location', 'Manage office geofence location and radius', 'attendance', 'manage_office_location'),
  ('attendance.manage_home_location_self', 'Manage Own Home Location', 'Manage own home geofence location', 'attendance', 'manage_home_location_self'),
  ('attendance.manage_home_location_all', 'Manage All Home Locations', 'Manage home geofence locations for all users', 'attendance', 'manage_home_location_all'),
  ('attendance.view_warnings', 'View Attendance Warnings', 'View attendance out-of-radius warning events', 'attendance', 'view_warnings')
ON CONFLICT (key) DO NOTHING;

-- 5) Role-permission mappings
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN (
  'attendance.manage_office_location',
  'attendance.manage_home_location_all',
  'attendance.view_warnings'
)
WHERE r.key = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN (
  'attendance.manage_office_location',
  'attendance.manage_home_location_all',
  'attendance.view_warnings'
)
WHERE r.key = 'hr'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN (
  'attendance.manage_home_location_self'
)
WHERE r.key IN ('employee', 'intern')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 6) RLS lock-down for new tables (service role access via backend only)
DO $$
BEGIN
  EXECUTE 'ALTER TABLE IF EXISTS public.user_home_locations ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS public.user_home_locations FORCE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS deny_client_access ON public.user_home_locations';
  EXECUTE
    'CREATE POLICY deny_client_access ON public.user_home_locations FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)';

  EXECUTE 'ALTER TABLE IF EXISTS public.attendance_geofence_warnings ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS public.attendance_geofence_warnings FORCE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS deny_client_access ON public.attendance_geofence_warnings';
  EXECUTE
    'CREATE POLICY deny_client_access ON public.attendance_geofence_warnings FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)';
END $$;
