-- Migration 051: API rate limiting for refresh tokens and payroll
-- SECURITY: General-purpose API rate limiting function

CREATE TABLE IF NOT EXISTS api_rate_limits (
  key VARCHAR(50) NOT NULL,
  identifier VARCHAR(100) NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (key, identifier)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_updated
  ON api_rate_limits(updated_at);

ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION check_api_rate_limit(
  p_key VARCHAR(50),
  p_identifier VARCHAR(100),
  p_max_attempts INTEGER DEFAULT 5,
  p_window_seconds INTEGER DEFAULT 60,
  p_lockout_seconds INTEGER DEFAULT 300
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_at_ts TIMESTAMPTZ) AS $$
DECLARE
  v_attempts INTEGER;
  v_locked_until TIMESTAMPTZ;
  v_window_start TIMESTAMPTZ := NOW() - (p_window_seconds || ' seconds')::interval;
BEGIN
  -- Upsert: create or get existing entry
  INSERT INTO api_rate_limits (key, identifier, attempts, first_attempt_at, updated_at)
  VALUES (p_key, p_identifier, 0, NOW(), NOW())
  ON CONFLICT (key, identifier) DO NOTHING;

  SELECT l.attempts, l.locked_until INTO v_attempts, v_locked_until
  FROM api_rate_limits l
  WHERE l.key = p_key AND l.identifier = p_identifier
  FOR UPDATE;

  -- If locked and lock is still active
  IF v_locked_until IS NOT NULL AND v_locked_until > NOW() THEN
    RETURN QUERY SELECT FALSE, 0, v_locked_until;
    RETURN;
  END IF;

  -- If window expired, reset
  IF (SELECT first_attempt_at FROM api_rate_limits WHERE key = p_key AND identifier = p_identifier) < v_window_start THEN
    UPDATE api_rate_limits
    SET attempts = 1, first_attempt_at = NOW(), locked_until = NULL, updated_at = NOW()
    WHERE key = p_key AND identifier = p_identifier;
    RETURN QUERY SELECT TRUE, p_max_attempts - 1, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Increment attempts
  UPDATE api_rate_limits
  SET attempts = v_attempts + 1, updated_at = NOW()
  WHERE key = p_key AND identifier = p_identifier;

  -- Check if exceeded threshold
  IF v_attempts + 1 > p_max_attempts THEN
    UPDATE api_rate_limits
    SET locked_until = NOW() + (p_lockout_seconds || ' seconds')::interval, updated_at = NOW()
    WHERE key = p_key AND identifier = p_identifier;
    RETURN QUERY SELECT FALSE, 0, (NOW() + (p_lockout_seconds || ' seconds')::interval)::TIMESTAMPTZ;
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, p_max_attempts - (v_attempts + 1), NULL::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reset_api_rate_limit(
  p_key VARCHAR(50),
  p_identifier VARCHAR(100)
)
RETURNS VOID AS $$
BEGIN
  DELETE FROM api_rate_limits WHERE key = p_key AND identifier = p_identifier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_api_rate_limit IS
  'General-purpose API rate limiting. Returns allowed status, remaining attempts, and reset timestamp.';