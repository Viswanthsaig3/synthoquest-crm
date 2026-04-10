-- Migration 043: Fix missing adjust_leave_balance_monthly_atomic function
-- SECURITY: CRITICAL FIX - function was called in code but didn't exist in database
-- This fixes runtime failures in leave approval/rejection/cancellation

CREATE OR REPLACE FUNCTION adjust_leave_balance_monthly_atomic(
  p_user_id UUID,
  p_type TEXT,
  p_delta INTEGER,
  p_year INTEGER,
  p_month INTEGER
) RETURNS VOID AS $$
DECLARE
  v_used_col TEXT;
  v_remaining_col TEXT;
BEGIN
  IF p_type NOT IN ('sick', 'casual', 'paid') THEN
    RAISE EXCEPTION 'Invalid leave type: %', p_type;
  END IF;

  IF p_month < 1 OR p_month > 12 THEN
    RAISE EXCEPTION 'Invalid month: % (must be 1-12)', p_month;
  END IF;

  IF p_year < 2000 OR p_year > 2100 THEN
    RAISE EXCEPTION 'Invalid year: %', p_year;
  END IF;

  v_used_col := p_type || '_used';
  v_remaining_col := p_type || '_remaining';

  EXECUTE format(
    'UPDATE leave_balances SET %I = %I + $1, %I = GREATEST(0, %I - $1), updated_at = NOW() WHERE user_id = $2 AND year = $3',
    v_used_col, v_used_col, v_remaining_col, v_remaining_col
  ) USING p_delta, p_user_id, p_year;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No leave balance found for user %s in year %s', p_user_id, p_year;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION adjust_leave_balance_monthly_atomic IS
  'SECURITY CRITICAL: Atomically adjusts leave balance used/remaining with month parameter. Called by approve/reject/cancel operations. Positive delta = consume days, negative delta = revert days. Prevents race conditions.';