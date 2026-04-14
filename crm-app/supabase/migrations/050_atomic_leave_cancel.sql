-- Migration 050: Atomic Leave Cancellation
-- FIX: Prevents silent balance restoration failure
-- Ensures leave cancellation and balance restore happen atomically

CREATE OR REPLACE FUNCTION cancel_leave_atomic(
  p_leave_id UUID,
  p_cancelled_by UUID
) RETURNS JSONB AS $$
DECLARE
  v_leave RECORD;
  v_balance_year INTEGER;
  v_balance_month INTEGER;
  v_used_col TEXT;
BEGIN
  -- Lock the leave row to prevent concurrent modifications
  SELECT * INTO v_leave
  FROM leaves
  WHERE id = p_leave_id
    AND deleted_at IS NULL
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'LEAVE_NOT_FOUND');
  END IF;
  
  -- Can only cancel approved leaves
  IF v_leave.status != 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_APPROVED', 'message', 'Only approved leaves can be cancelled');
  END IF;
  
  -- Get balance month/year (use stored values or derive from start_date)
  v_balance_year := v_leave.balance_year;
  v_balance_month := v_leave.balance_month;
  
  IF v_balance_year IS NULL OR v_balance_month IS NULL THEN
    v_balance_year := EXTRACT(YEAR FROM v_leave.start_date);
    v_balance_month := EXTRACT(MONTH FROM v_leave.start_date);
  END IF;
  
  -- Step 1: Update leave status to cancelled
  UPDATE leaves SET
    status = 'cancelled',
    cancelled_by = p_cancelled_by,
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE id = p_leave_id;
  
  -- Step 2: Restore the balance (reduce *_used by days)
  v_used_col := v_leave.type || '_used';
  
  EXECUTE format(
    'UPDATE leave_balances SET %I = GREATEST(0, %I - $1), updated_at = NOW()
     WHERE user_id = $2 AND year = $3 AND month = $4 AND deleted_at IS NULL',
    v_used_col, v_used_col
  ) USING v_leave.days, v_leave.user_id, v_balance_year, v_balance_month;
  
  IF NOT FOUND THEN
    -- Leave cancelled but no balance record found
    -- This can happen if balance was deleted or never created
    -- Still return success but include a warning
    RETURN jsonb_build_object(
      'success', true,
      'warning', 'BALANCE_NOT_FOUND',
      'message', format('Leave cancelled but no balance record found for %s/%s to restore', v_balance_month, v_balance_year)
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'leave_id', p_leave_id,
    'days_restored', v_leave.days
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cancel_leave_atomic IS
  'Atomically cancels an approved leave and restores the balance. Prevents data corruption from partial failures.';

GRANT EXECUTE ON FUNCTION cancel_leave_atomic TO authenticated;