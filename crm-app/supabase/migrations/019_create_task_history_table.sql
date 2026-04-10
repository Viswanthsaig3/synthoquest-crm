-- Migration 019: Create Task History Table

CREATE TABLE IF NOT EXISTS task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_user_id ON task_history(user_id);
CREATE INDEX IF NOT EXISTS idx_task_history_action ON task_history(action);
CREATE INDEX IF NOT EXISTS idx_task_history_created_at ON task_history(created_at);

-- Constraint
ALTER TABLE task_history ADD CONSTRAINT check_history_action 
  CHECK (action IN ('created', 'assigned', 'reassigned', 'status_changed', 'priority_changed', 
                    'due_date_changed', 'completed', 'cancelled', 'comment_added', 'started'));

COMMENT ON TABLE task_history IS 'Audit trail for task changes';