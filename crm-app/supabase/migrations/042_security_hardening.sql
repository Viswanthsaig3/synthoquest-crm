-- Migration 042: Security hardening — structural fixes
-- Covers: CRIT-04, CRIT-01, HIGH-03, HIGH-04

-- =========================================================================
-- CRIT-04: Prevent race condition — only ONE open session per user
-- =========================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_one_open_session_per_user
  ON attendance_records (user_id)
  WHERE check_out_time IS NULL AND deleted_at IS NULL;

COMMENT ON INDEX idx_attendance_one_open_session_per_user IS
  'SECURITY: Enforces at most one open attendance session per user. Prevents TOCTOU race conditions in concurrent check-in requests.';

-- =========================================================================
-- CRIT-01: GPS spoofing detection — store IP-derived location for audit
-- =========================================================================
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS ip_derived_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS ip_derived_lng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS ip_gps_distance_km NUMERIC(10, 2);

COMMENT ON COLUMN attendance_records.ip_derived_lat IS 'Latitude derived from server-side IP geolocation at check-in time';
COMMENT ON COLUMN attendance_records.ip_derived_lng IS 'Longitude derived from server-side IP geolocation at check-in time';
COMMENT ON COLUMN attendance_records.ip_gps_distance_km IS 'Distance in km between IP-derived location and client-claimed GPS coordinates';

-- =========================================================================
-- HIGH-03: Atomic leave balance updates — no more read-modify-write race
-- =========================================================================
CREATE OR REPLACE FUNCTION adjust_leave_balance_atomic(
  p_user_id UUID,
  p_type TEXT,
  p_delta INTEGER,
  p_year INTEGER
) RETURNS VOID AS $$
DECLARE
  v_used_col TEXT;
  v_remaining_col TEXT;
BEGIN
  -- Validate type
  IF p_type NOT IN ('sick', 'casual', 'paid') THEN
    RAISE EXCEPTION 'Invalid leave type: %', p_type;
  END IF;

  v_used_col := p_type || '_used';
  v_remaining_col := p_type || '_remaining';

  -- Atomic update — no read-modify-write race condition
  EXECUTE format(
    'UPDATE leave_balances SET %I = %I + $1, %I = GREATEST(0, %I - $1), updated_at = NOW() WHERE user_id = $2 AND year = $3',
    v_used_col, v_used_col, v_remaining_col, v_remaining_col
  ) USING p_delta, p_user_id, p_year;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No leave balance found for user % in year %', p_user_id, p_year;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION adjust_leave_balance_atomic IS
  'SECURITY: Atomically adjusts leave balance used/remaining. Positive delta = consume days, negative delta = revert days. Prevents race conditions.';

-- =========================================================================
-- HIGH-04: Refresh token family tracking — detect token reuse/theft
-- =========================================================================
ALTER TABLE refresh_tokens
  ADD COLUMN IF NOT EXISTS family_id UUID DEFAULT gen_random_uuid();

-- Index for fast family lookups during revocation
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family_id
  ON refresh_tokens(family_id);

-- Index for finding ANY token (including revoked) by hash — needed for reuse detection
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash_all
  ON refresh_tokens(token_hash);

COMMENT ON COLUMN refresh_tokens.family_id IS
  'Token family ID. All refresh tokens in a rotation chain share the same family_id. When a revoked token is replayed, the entire family is invalidated.';

-- Function to revoke an entire token family (called when reuse is detected)
CREATE OR REPLACE FUNCTION revoke_token_family(p_family_id UUID)
RETURNS INTEGER AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  UPDATE refresh_tokens
  SET revoked_at = NOW()
  WHERE family_id = p_family_id
    AND revoked_at IS NULL;
  
  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  RETURN revoked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- HIGH-01: Heartbeat IP tracking — store check-in IP for session comparison
-- =========================================================================
-- ip_address column may already exist — add unique_ips_count for session tracking
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS check_in_ip VARCHAR(45),
  ADD COLUMN IF NOT EXISTS unique_ip_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS ip_change_detected BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN attendance_records.check_in_ip IS 'IP address at check-in time, used to detect IP changes during session via heartbeat';
COMMENT ON COLUMN attendance_records.unique_ip_count IS 'Number of unique IPs seen during this session (from heartbeats)';
COMMENT ON COLUMN attendance_records.ip_change_detected IS 'True if IP changed during active session (potential spoofing indicator)';

-- =========================================================================
-- Ensure new columns are covered by RLS deny-by-default (already forced)
-- =========================================================================
-- No new tables created, so existing RLS policies on attendance_records
-- and refresh_tokens already cover these new columns.
