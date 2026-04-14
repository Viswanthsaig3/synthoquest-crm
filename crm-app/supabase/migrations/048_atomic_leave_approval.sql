-- Migration 048: Atomic Leave Approval
-- SECURITY: CRITICAL FIX - Prevents race condition in leave approval
-- Two concurrent approvals could both pass balance check before either deducts

CREATE OR REPLACE FUNCTION approve_leave_atomic(
  p_leave_id UUID,
  p_approved_by UUID
) RETURNS JSONB AS $$
DECLARE
  v_leave RECORD;
  v_balance RECORD;
  v_remaining INTEGER;
  v_used_col TEXT;
  v_balance_month INTEGER;
  v_balance_year INTEGER;
BEGIN
  -- Lock the leave row first to prevent concurrent processing
  SELECT * INTO v_leave
  FROM leaves
  WHERE id = p_leave_id
    AND deleted_at IS NULL
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'LEAVE_NOT_FOUND');
  END IF;
  
  -- Check if already processed
  IF v_leave.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_PROCESSED');
  END IF;
  
  -- Self-approval check
  IF v_leave.user_id = p_approved_by THEN
    RETURN jsonb_build_object('success', false, 'error', 'SELF_APPROVAL_NOT_ALLOWED');
  END IF;
  
  -- Calculate balance month/year from leave start date
  v_balance_year := EXTRACT(YEAR FROM v_leave.start_date);
  v_balance_month := EXTRACT(MONTH FROM v_leave.start_date);
  
  -- Lock the balance row and check availability
  SELECT * INTO v_balance
  FROM leave_balances
  WHERE user_id = v_leave.user_id
    AND year = v_balance_year
    AND month = v_balance_month
    AND deleted_at IS NULL
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'NO_BALANCE_FOUND',
      'message', format('No leave balance found for %s/%s. Please allocate balance first.', v_balance_month, v_balance_year)
    );
  END IF;
  
  -- Get remaining balance for the leave type
  CASE v_leave.type
    WHEN 'sick' THEN v_remaining := v_balance.sick_remaining;
    WHEN 'casual' THEN v_remaining := v_balance.casual_remaining;
    WHEN 'paid' THEN v_remaining := v_balance.paid_remaining;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'INVALID_LEAVE_TYPE');
  END CASE;
  
  -- Check if sufficient balance
  IF v_remaining < v_leave.days THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'INSUFFICIENT_BALANCE',
      'message', format('Insufficient %s leave balance. Available: %s days, Requested: %s days', 
        v_leave.type, v_remaining, v_leave.days)
    );
  END IF;
  
  -- ALL CHECKS PASSED - Perform atomic update
  
  -- Update leave status
  UPDATE leaves SET
    status = 'approved',
    approved_by = p_approved_by,
    approved_at = NOW(),
    balance_year = v_balance_year,
    balance_month = v_balance_month,
    updated_at = NOW()
  WHERE id = p_leave_id;
  
  -- Deduct from balance
  v_used_col := v_leave.type || '_used';
  
  EXECUTE format(
    'UPDATE leave_balances SET %I = %I + $1, updated_at = NOW() WHERE id = $2',
    v_used_col, v_used_col
  ) USING v_leave.days, v_balance.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'leave_id', p_leave_id,
    'days_approved', v_leave.days,
    'balance_remaining', v_remaining - v_leave.days
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION approve_leave_atomic IS
  'Atomically approves a leave request with balance validation. Uses row-level locking to prevent race conditions. Returns {success: boolean, error?: string}';

-- Grant execute to authenticated users (will be further restricted by RLS)
GRANT EXECUTE ON FUNCTION approve_leave_atomic TO authenticated;