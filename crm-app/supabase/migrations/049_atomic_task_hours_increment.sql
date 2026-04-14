-- Migration 049: Atomic Task Hours Increment
-- FIX: Prevents race condition in time logging
-- Two concurrent logs could read same actual_hours, both add, one is lost

CREATE OR REPLACE FUNCTION increment_task_hours(
  p_task_id UUID,
  p_hours NUMERIC
) RETURNS VOID AS $$
BEGIN
  IF p_hours IS NULL OR p_hours <= 0 THEN
    RETURN;
  END IF;

  UPDATE tasks
  SET actual_hours = COALESCE(actual_hours, 0) + p_hours,
      updated_at = NOW()
  WHERE id = p_task_id
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_task_hours IS
  'Atomically increments task.actual_hours. Prevents race conditions from concurrent time logs.';

GRANT EXECUTE ON FUNCTION increment_task_hours TO authenticated;