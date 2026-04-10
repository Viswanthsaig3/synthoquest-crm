-- Migration 039: Create Leaves System
-- Complete leave management with monthly customizable balances

-- ============================================
-- LEAVES TABLE
-- ============================================
CREATE TABLE leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Leave details
  type VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  
  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  
  -- Approval workflow
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Cancellation support
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason TEXT,
  
  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT check_leave_type CHECK (type IN ('sick', 'casual', 'paid')),
  CONSTRAINT check_leave_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  CONSTRAINT check_date_range CHECK (end_date >= start_date),
  CONSTRAINT check_days_positive CHECK (days >= 1)
);

-- Indexes for leaves
CREATE INDEX idx_leaves_employee ON leaves(employee_id);
CREATE INDEX idx_leaves_status ON leaves(status);
CREATE INDEX idx_leaves_type ON leaves(type);
CREATE INDEX idx_leaves_start_date ON leaves(start_date);
CREATE INDEX idx_leaves_end_date ON leaves(end_date);
CREATE INDEX idx_leaves_approved_by ON leaves(approved_by);
CREATE INDEX idx_leaves_deleted_at ON leaves(deleted_at);
CREATE INDEX idx_leaves_created_at ON leaves(created_at);
CREATE INDEX idx_leaves_employee_status ON leaves(employee_id, status);

COMMENT ON TABLE leaves IS 'Employee leave requests and approvals';

-- ============================================
-- LEAVE BALANCES TABLE
-- ============================================
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Monthly allocation (customizable by admin/HR)
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  month INTEGER NOT NULL DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
  
  -- Sick leave
  sick_allocated INTEGER NOT NULL DEFAULT 0,
  sick_used INTEGER NOT NULL DEFAULT 0,
  sick_remaining INTEGER GENERATED ALWAYS AS (sick_allocated - sick_used) STORED,
  
  -- Casual leave
  casual_allocated INTEGER NOT NULL DEFAULT 0,
  casual_used INTEGER NOT NULL DEFAULT 0,
  casual_remaining INTEGER GENERATED ALWAYS AS (casual_allocated - casual_used) STORED,
  
  -- Paid leave
  paid_allocated INTEGER NOT NULL DEFAULT 0,
  paid_used INTEGER NOT NULL DEFAULT 0,
  paid_remaining INTEGER GENERATED ALWAYS AS (paid_allocated - paid_used) STORED,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT unique_employee_month UNIQUE(employee_id, year, month),
  CONSTRAINT check_sick_positive CHECK (sick_allocated >= 0 AND sick_used >= 0),
  CONSTRAINT check_casual_positive CHECK (casual_allocated >= 0 AND casual_used >= 0),
  CONSTRAINT check_paid_positive CHECK (paid_allocated >= 0 AND paid_used >= 0),
  CONSTRAINT check_month_range CHECK (month >= 1 AND month <= 12)
);

-- Indexes for leave_balances
CREATE INDEX idx_leave_balances_employee ON leave_balances(employee_id);
CREATE INDEX idx_leave_balances_year_month ON leave_balances(year, month);
CREATE INDEX idx_leave_balances_employee_month ON leave_balances(employee_id, year, month);

COMMENT ON TABLE leave_balances IS 'Monthly leave balance allocation and tracking';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

-- Policies for leaves - SELECT
CREATE POLICY "Employees can view own leaves"
  ON leaves FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Admins and HR can view all leaves"
  ON leaves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
      AND (role = 'admin' OR role = 'hr')
    )
  );

CREATE POLICY "Team leads can view team leaves"
  ON leaves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users team_member
      WHERE team_member.id = leaves.employee_id
      AND team_member.managed_by = auth.uid()
      AND team_member.deleted_at IS NULL
    )
  );

-- Policies for leaves - INSERT
CREATE POLICY "Employees can create own leaves"
  ON leaves FOR INSERT
  WITH CHECK (
    employee_id = auth.uid() 
    AND status = 'pending'
    AND created_by = auth.uid()
  );

-- Policies for leaves - UPDATE
CREATE POLICY "Admins and HR can update leaves"
  ON leaves FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
      AND (role = 'admin' OR role = 'hr')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
      AND (role = 'admin' OR role = 'hr')
    )
  );

CREATE POLICY "Team leads can update team leaves"
  ON leaves FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users team_member
      WHERE team_member.id = leaves.employee_id
      AND team_member.managed_by = auth.uid()
      AND team_member.deleted_at IS NULL
    )
  );

-- Policies for leave_balances - SELECT
CREATE POLICY "Employees can view own balances"
  ON leave_balances FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Admins and HR can view all balances"
  ON leave_balances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
      AND (role = 'admin' OR role = 'hr')
    )
  );

-- Policies for leave_balances - ALL
CREATE POLICY "Admins and HR can manage balances"
  ON leave_balances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
      AND (role = 'admin' OR role = 'hr')
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_leaves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leaves_updated_at
  BEFORE UPDATE ON leaves
  FOR EACH ROW
  EXECUTE FUNCTION update_leaves_updated_at();

CREATE OR REPLACE FUNCTION update_leave_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leave_balances_updated_at
  BEFORE UPDATE ON leave_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_balances_updated_at();

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION calculate_leave_days(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN (end_date - start_date) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;