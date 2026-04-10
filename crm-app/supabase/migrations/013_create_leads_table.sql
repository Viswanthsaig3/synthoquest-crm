-- Migration 013: Create Leads Table

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  alternate_phone VARCHAR(50),
  
  -- Lead Type System
  type_id UUID REFERENCES lead_types(id) ON DELETE SET NULL,
  type_status VARCHAR(50) DEFAULT 'new',
  type_source VARCHAR(50),
  custom_fields JSONB DEFAULT '{}',
  
  -- Legacy fields
  course_interested VARCHAR(255),
  source VARCHAR(50) DEFAULT 'organic',
  status VARCHAR(50) DEFAULT 'new',
  priority VARCHAR(20) DEFAULT 'warm',
  
  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  
  -- Call tracking summary
  total_calls INTEGER DEFAULT 0,
  last_call_outcome VARCHAR(50),
  
  -- Conversion
  converted_at TIMESTAMPTZ,
  converted_by UUID REFERENCES users(id),
  conversion_target_id UUID,
  conversion_target_type VARCHAR(50),
  loss_reason TEXT,
  
  -- Approval (for intern/job leads)
  approval_status VARCHAR(20),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_type_id ON leads(type_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_deleted_at ON leads(deleted_at);

-- Constraints
ALTER TABLE leads ADD CONSTRAINT check_status 
  CHECK (status IN ('new', 'contacted', 'follow_up', 'qualified', 'converted', 'lost'));

ALTER TABLE leads ADD CONSTRAINT check_priority 
  CHECK (priority IN ('hot', 'warm', 'cold'));

ALTER TABLE leads ADD CONSTRAINT check_source 
  CHECK (source IN ('ads', 'referral', 'organic'));

COMMENT ON TABLE leads IS 'Lead management for all lead types';