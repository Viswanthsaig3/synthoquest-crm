-- Migration 014: Create Lead Activities Table

CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at);

-- Constraint
ALTER TABLE lead_activities ADD CONSTRAINT check_activity_type 
  CHECK (type IN ('created', 'claimed', 'contacted', 'follow_up', 'converted', 'lost', 'note', 'call', 'status_change', 'type_change'));

COMMENT ON TABLE lead_activities IS 'Activity timeline for leads';