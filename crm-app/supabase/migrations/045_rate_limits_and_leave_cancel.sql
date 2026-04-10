-- Migration 045: Persistent login rate limiting + leaves.cancel role assignment
-- SECURITY: CRIT-07 — Replaces in-memory LRUCache with DB-backed rate limiting
-- SECURITY: CRIT-08 — Assign leaves.cancel permission to admin and hr roles

-- =========================================================================
-- CRIT-07: Persistent login rate limiting table
-- =========================================================================
CREATE TABLE IF NOT EXISTS login_rate_limits (
  ip_address VARCHAR(45) PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RPC for atomic check-and-increment (prevents TOCTOU race conditions)
CREATE OR REPLACE FUNCTION check_login_rate_limit(p_ip VARCHAR(45))
RETURNS TABLE(allowed BOOLEAN, attempts_count INTEGER, locked_until_ts TIMESTAMPTZ) AS $$
DECLARE
  v_row login_rate_limits%ROWTYPE;
  v_window_start TIMESTAMPTZ := NOW() - INTERVAL '15 minutes';
BEGIN
  -- Upsert: create or get existing entry
  INSERT INTO login_rate_limits (ip_address, attempts, first_attempt_at, updated_at)
  VALUES (p_ip, 0, NOW(), NOW())
  ON CONFLICT (ip_address) DO NOTHING;

  SELECT * INTO v_row FROM login_rate_limits WHERE ip_address = p_ip FOR UPDATE;

  -- If locked and lock is still active
  IF v_row.locked_until IS NOT NULL AND v_row.locked_until > NOW() THEN
    RETURN QUERY SELECT FALSE, v_row.attempts, v_row.locked_until;
    RETURN;
  END IF;

  -- If window expired, reset
  IF v_row.first_attempt_at < v_window_start THEN
    UPDATE login_rate_limits
    SET attempts = 1, first_attempt_at = NOW(), locked_until = NULL, updated_at = NOW()
    WHERE ip_address = p_ip;
    RETURN QUERY SELECT TRUE, 1, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Increment attempts
  UPDATE login_rate_limits
  SET attempts = v_row.attempts + 1, updated_at = NOW()
  WHERE ip_address = p_ip;

  -- Check if exceeded threshold (10 attempts → lock for 30 min)
  IF v_row.attempts + 1 > 10 THEN
    UPDATE login_rate_limits
    SET locked_until = NOW() + INTERVAL '30 minutes', updated_at = NOW()
    WHERE ip_address = p_ip;
    RETURN QUERY SELECT FALSE, v_row.attempts + 1, (NOW() + INTERVAL '30 minutes')::TIMESTAMPTZ;
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, v_row.attempts + 1, NULL::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to reset on successful login
CREATE OR REPLACE FUNCTION reset_login_rate_limit(p_ip VARCHAR(45))
RETURNS VOID AS $$
BEGIN
  DELETE FROM login_rate_limits WHERE ip_address = p_ip;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Periodic cleanup index
CREATE INDEX IF NOT EXISTS idx_login_rate_limits_updated
  ON login_rate_limits(updated_at);

-- Enable RLS (deny by default for anon, service role bypasses)
ALTER TABLE login_rate_limits ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- CRIT-08: Assign leaves.cancel permission to admin and hr roles
-- =========================================================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.key IN ('admin', 'hr') AND p.key = 'leaves.cancel'
ON CONFLICT (role_id, permission_id) DO NOTHING;
