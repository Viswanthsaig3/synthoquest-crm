-- Migration 017: Create Tasks Table

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'task',
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  
  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by UUID NOT NULL REFERENCES users(id),
  claimed_at TIMESTAMPTZ,
  
  -- Parent task for subtasks
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Dates
  due_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Time tracking
  estimated_hours DECIMAL(4,2),
  actual_hours DECIMAL(4,2),
  progress_percentage INTEGER DEFAULT 0,
  
  -- Metadata
  tags TEXT[],
  attachments JSONB DEFAULT '[]',
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);

-- Constraints
ALTER TABLE tasks ADD CONSTRAINT check_task_status 
  CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'cancelled', 'on_hold'));

ALTER TABLE tasks ADD CONSTRAINT check_task_priority 
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE tasks ADD CONSTRAINT check_task_type 
  CHECK (type IN ('task', 'bug', 'feature', 'maintenance', 'training', 'meeting'));

ALTER TABLE tasks ADD CONSTRAINT check_progress 
  CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

COMMENT ON TABLE tasks IS 'Task management for assignments and tracking';