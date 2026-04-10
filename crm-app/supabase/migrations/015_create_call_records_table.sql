-- Migration 015: Create Call Records Table

CREATE TABLE IF NOT EXISTS call_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  called_by UUID NOT NULL REFERENCES users(id),
  phone_number VARCHAR(50) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration INTEGER DEFAULT 0,
  outcome VARCHAR(50) NOT NULL,
  recording_url TEXT,
  remarks TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_call_records_lead_id ON call_records(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_records_called_by ON call_records(called_by);
CREATE INDEX IF NOT EXISTS idx_call_records_outcome ON call_records(outcome);
CREATE INDEX IF NOT EXISTS idx_call_records_started_at ON call_records(started_at);

-- Constraint
ALTER TABLE call_records ADD CONSTRAINT check_call_outcome 
  CHECK (outcome IN ('answered', 'no_answer', 'busy', 'voicemail', 'wrong_number'));

COMMENT ON TABLE call_records IS 'Call tracking for leads';