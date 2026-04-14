-- Migration 052: Attendance verification hardening
-- Fixes GPS spoofing bypass vulnerabilities

-- Add verification tracking columns to attendance_records
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS location_verification_failed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS spoofing_detected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS spoofing_reason TEXT;

COMMENT ON COLUMN attendance_records.location_verification_failed IS 'TRUE if IP geolocation failed during check-in (verification bypass indicator)';
COMMENT ON COLUMN attendance_records.spoofing_detected IS 'TRUE if GPS spoofing indicators detected (impossible precision or IP-GPS mismatch)';
COMMENT ON COLUMN attendance_records.spoofing_reason IS 'Detailed reason for spoofing detection flag';

-- Add verification tracking to user_home_locations
ALTER TABLE user_home_locations
  ADD COLUMN IF NOT EXISTS verification_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS verification_confidence INTEGER,
  ADD COLUMN IF NOT EXISTS verification_ip VARCHAR(45),
  ADD COLUMN IF NOT EXISTS verification_distance_km NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN user_home_locations.verification_method IS 'Method used to verify location: ip_geolocation, admin_override, manual';
COMMENT ON COLUMN user_home_locations.verification_confidence IS 'Confidence score (0-100) of location verification';
COMMENT ON COLUMN user_home_locations.verification_ip IS 'IP address used for verification';
COMMENT ON COLUMN user_home_locations.verification_distance_km IS 'Distance between claimed location and IP-derived location';
COMMENT ON COLUMN user_home_locations.is_verified IS 'TRUE if location was verified by server-side IP geolocation or admin';

-- Add enforcement policy to organization_settings
ALTER TABLE organization_settings
  ADD COLUMN IF NOT EXISTS geofence_enforcement_level VARCHAR(20) DEFAULT 'block_first',
  ADD COLUMN IF NOT EXISTS max_ip_gps_distance_km INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS min_gps_precision_meters INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS block_on_verification_failure BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN organization_settings.geofence_enforcement_level IS 'Enforcement mode: warn_only (audit), block_first (block first violation), strict (block all)';
COMMENT ON COLUMN organization_settings.max_ip_gps_distance_km IS 'Maximum allowed distance between IP and GPS locations before flagging as impossible travel';
COMMENT ON COLUMN organization_settings.min_gps_precision_meters IS 'Minimum GPS precision threshold - values below this indicate spoofing';
COMMENT ON COLUMN organization_settings.block_on_verification_failure IS 'TRUE = block check-in if IP verification fails; FALSE = allow with warning';

-- Add indexes for anomaly detection queries
CREATE INDEX IF NOT EXISTS idx_attendance_spoofing_detected ON attendance_records(spoofing_detected) WHERE spoofing_detected = TRUE;
CREATE INDEX IF NOT EXISTS idx_attendance_verification_failed ON attendance_records(location_verification_failed) WHERE location_verification_failed = TRUE;
CREATE INDEX IF NOT EXISTS idx_attendance_ip_gps_distance ON attendance_records(ip_gps_distance_km) WHERE ip_gps_distance_km > 50;
CREATE INDEX IF NOT EXISTS idx_attendance_distance_precision ON attendance_records(check_in_distance_meters) WHERE check_in_distance_meters < 5;

-- Add index for self-updated home locations
CREATE INDEX IF NOT EXISTS idx_home_location_self_updated ON user_home_locations(user_id, updated_by) WHERE deleted_at IS NULL AND user_id = updated_by;

-- Function to flag suspicious check-ins retroactively
CREATE OR REPLACE FUNCTION flag_suspicious_attendance_records()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Flag records with impossible precision (<5m from reference point)
  UPDATE attendance_records
  SET 
    spoofing_detected = TRUE,
    spoofing_reason = 'GPS spoofing suspected: Position is ' || check_in_distance_meters || 'm from reference point (below 5m threshold)'
  WHERE check_in_distance_meters < 5
    AND check_in_distance_meters IS NOT NULL
    AND check_in_in_radius = TRUE
    AND spoofing_detected = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Flag records with null IP verification (verification bypass)
  UPDATE attendance_records
  SET 
    location_verification_failed = TRUE,
    spoofing_reason = COALESCE(spoofing_reason, '') || ' | IP geolocation verification failed (NULL ip_derived columns)'
  WHERE ip_derived_lat IS NULL 
    AND ip_derived_lng IS NULL
    AND ip_address IS NOT NULL
    AND ip_address != '127.0.0.1'
    AND ip_address != 'unknown'
    AND location_verification_failed = FALSE;
  
  GET DIAGNOSTICS updated_count = updated_count + ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION flag_suspicious_attendance_records IS 'Retroactively flags suspicious attendance records based on spoofing indicators';

-- Add permission for viewing anomalies
INSERT INTO permissions (key, name, description, resource, action) VALUES
  ('attendance.view_anomalies', 'View Attendance Anomalies', 'View location verification anomalies and spoofing indicators', 'attendance', 'view_anomalies')
ON CONFLICT (key) DO NOTHING;

-- Grant to admin and hr
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key = 'attendance.view_anomalies'
WHERE r.key IN ('admin', 'hr')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create trigger to create warning on spoofing detection
CREATE OR REPLACE FUNCTION create_spoofing_warning()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.spoofing_detected = TRUE AND OLD.spoofing_detected = FALSE THEN
    INSERT INTO attendance_geofence_warnings (
      attendance_record_id,
      user_id,
      event_type,
      latitude,
      longitude,
      nearest_type,
      distance_meters,
      allowed_radius_meters,
      warning_reason,
      status
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'check_in',
      NEW.check_in_lat,
      NEW.check_in_lng,
      NEW.check_in_nearest_type,
      NEW.check_in_distance_meters,
      NEW.check_in_radius_meters,
      NEW.spoofing_reason,
      'open'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_spoofing_warning ON attendance_records;
CREATE TRIGGER trigger_spoofing_warning
  AFTER UPDATE ON attendance_records
  FOR EACH ROW
  WHEN (NEW.spoofing_detected = TRUE AND OLD.spoofing_detected = FALSE)
  EXECUTE FUNCTION create_spoofing_warning();