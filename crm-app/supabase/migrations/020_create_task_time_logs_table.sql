-- Migration 020: Create Task Time Logs Table

CREATE TABLE IF NOT EXISTS task_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_time_logs_task_id ON task_time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_user_id ON task_time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_started_at ON task_time_logs(started_at);

-- Constraint
ALTER TABLE task_time_logs ADD CONSTRAINT check_time_log 
  CHECK (ended_at IS NULL OR ended_at > started_at);

COMMENT ON TABLE task_time_logs IS 'Time tracking logs for tasks (separate from timesheets)';