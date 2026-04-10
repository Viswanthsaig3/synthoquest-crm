-- Migration 031: Workforce core intern backend + minimal compensation model

-- 1) Users: minimal compensation metadata
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS compensation_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS compensation_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS compensation_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS compensation_updated_by UUID REFERENCES users(id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_users_compensation_type'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT check_users_compensation_type
      CHECK (compensation_type IN ('paid', 'unpaid'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_users_compensation_amount'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT check_users_compensation_amount
      CHECK (compensation_amount IS NULL OR compensation_amount >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_compensation_type ON users(compensation_type);
CREATE INDEX IF NOT EXISTS idx_users_compensation_updated_at ON users(compensation_updated_at);

UPDATE users
SET
  compensation_type = CASE WHEN COALESCE(salary, 0) > 0 THEN 'paid' ELSE 'unpaid' END,
  compensation_amount = CASE WHEN COALESCE(salary, 0) > 0 THEN salary ELSE NULL END,
  compensation_updated_at = COALESCE(compensation_updated_at, NOW())
WHERE compensation_type IS NULL;

-- 2) Compensation history audit
CREATE TABLE IF NOT EXISTS compensation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  previous_compensation_type VARCHAR(20),
  new_compensation_type VARCHAR(20) NOT NULL,
  previous_compensation_amount DECIMAL(10, 2),
  new_compensation_amount DECIMAL(10, 2),
  reason TEXT,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_compensation_history_prev_type'
  ) THEN
    ALTER TABLE compensation_history
      ADD CONSTRAINT check_compensation_history_prev_type
      CHECK (
        previous_compensation_type IS NULL
        OR previous_compensation_type IN ('paid', 'unpaid')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_compensation_history_new_type'
  ) THEN
    ALTER TABLE compensation_history
      ADD CONSTRAINT check_compensation_history_new_type
      CHECK (new_compensation_type IN ('paid', 'unpaid'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comp_history_user_id ON compensation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_comp_history_changed_at ON compensation_history(changed_at);

-- Atomic compensation updater: keeps users + history consistent in one transaction
CREATE OR REPLACE FUNCTION public.update_user_compensation_atomic(
  p_user_id UUID,
  p_compensation_type VARCHAR,
  p_compensation_amount DECIMAL(10, 2),
  p_changed_by UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_previous_type VARCHAR(20);
  v_previous_amount DECIMAL(10, 2);
  v_next_amount DECIMAL(10, 2);
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF p_compensation_type NOT IN ('paid', 'unpaid') THEN
    RAISE EXCEPTION 'Invalid compensation type: %', p_compensation_type;
  END IF;

  SELECT
    COALESCE(compensation_type, CASE WHEN COALESCE(salary, 0) > 0 THEN 'paid' ELSE 'unpaid' END),
    COALESCE(compensation_amount, salary)
  INTO v_previous_type, v_previous_amount
  FROM users
  WHERE id = p_user_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  v_next_amount := CASE
    WHEN p_compensation_type = 'unpaid' THEN NULL
    ELSE COALESCE(p_compensation_amount, v_previous_amount)
  END;

  UPDATE users
  SET
    compensation_type = p_compensation_type,
    compensation_amount = v_next_amount,
    compensation_updated_at = v_now,
    compensation_updated_by = p_changed_by,
    salary = CASE WHEN p_compensation_type = 'paid' THEN v_next_amount ELSE NULL END,
    updated_at = v_now
  WHERE id = p_user_id;

  IF v_previous_type IS DISTINCT FROM p_compensation_type
     OR v_previous_amount IS DISTINCT FROM v_next_amount THEN
    INSERT INTO compensation_history (
      user_id,
      previous_compensation_type,
      new_compensation_type,
      previous_compensation_amount,
      new_compensation_amount,
      reason,
      changed_by,
      changed_at
    ) VALUES (
      p_user_id,
      v_previous_type,
      p_compensation_type,
      v_previous_amount,
      v_next_amount,
      p_reason,
      p_changed_by,
      v_now
    );
  END IF;

  RETURN TRUE;
END;
$$;

-- 3) Intern profiles (user is source of identity/auth)
CREATE TABLE IF NOT EXISTS intern_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  alternate_phone VARCHAR(20),
  internship_type VARCHAR(20) NOT NULL DEFAULT 'unpaid',
  duration VARCHAR(20) NOT NULL DEFAULT '3_months',
  college VARCHAR(255) NOT NULL DEFAULT '',
  degree VARCHAR(255) NOT NULL DEFAULT '',
  academic_year VARCHAR(50) NOT NULL DEFAULT '',
  skills TEXT[] NOT NULL DEFAULT '{}',
  resume_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  intern_status VARCHAR(30) NOT NULL DEFAULT 'applied',
  source VARCHAR(100) NOT NULL DEFAULT 'website',
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  converted_from VARCHAR(100),
  converted_at TIMESTAMPTZ,
  converted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  performance_rating INTEGER,
  feedback TEXT,
  stipend DECIMAL(10, 2),
  notes TEXT NOT NULL DEFAULT '',
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_intern_profiles_type'
  ) THEN
    ALTER TABLE intern_profiles
      ADD CONSTRAINT check_intern_profiles_type
      CHECK (internship_type IN ('paid', 'unpaid'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_intern_profiles_duration'
  ) THEN
    ALTER TABLE intern_profiles
      ADD CONSTRAINT check_intern_profiles_duration
      CHECK (duration IN ('1_month', '2_months', '3_months'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_intern_profiles_status'
  ) THEN
    ALTER TABLE intern_profiles
      ADD CONSTRAINT check_intern_profiles_status
      CHECK (intern_status IN ('applied', 'shortlisted', 'offered', 'active', 'completed', 'dropped', 'rejected'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_intern_profiles_approval_status'
  ) THEN
    ALTER TABLE intern_profiles
      ADD CONSTRAINT check_intern_profiles_approval_status
      CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_intern_profiles_rating'
  ) THEN
    ALTER TABLE intern_profiles
      ADD CONSTRAINT check_intern_profiles_rating
      CHECK (performance_rating IS NULL OR (performance_rating >= 1 AND performance_rating <= 5));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_intern_profiles_stipend'
  ) THEN
    ALTER TABLE intern_profiles
      ADD CONSTRAINT check_intern_profiles_stipend
      CHECK (stipend IS NULL OR stipend >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_intern_profiles_status ON intern_profiles(intern_status);
CREATE INDEX IF NOT EXISTS idx_intern_profiles_approval_status ON intern_profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_intern_profiles_supervisor_id ON intern_profiles(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_intern_profiles_deleted_at ON intern_profiles(deleted_at);

DROP TRIGGER IF EXISTS update_intern_profiles_updated_at ON intern_profiles;
CREATE TRIGGER update_intern_profiles_updated_at
  BEFORE UPDATE ON intern_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create intern profiles for existing intern users if missing
INSERT INTO intern_profiles (user_id)
SELECT u.id
FROM users u
LEFT JOIN intern_profiles ip ON ip.user_id = u.id
WHERE u.role = 'intern'
  AND u.deleted_at IS NULL
  AND ip.user_id IS NULL;

-- 4) Permission catalog additions
INSERT INTO permissions (key, name, description, resource, action) VALUES
  ('employees.manage_assigned', 'Manage Assigned Employees', 'Manage profile updates for assigned employees', 'employees', 'manage_assigned'),
  ('interns.manage_all', 'Manage All Interns', 'Create, edit, and delete all intern records', 'interns', 'manage_all'),
  ('interns.manage_assigned', 'Manage Assigned Interns', 'Manage intern records assigned to the current manager', 'interns', 'manage_assigned'),
  ('compensation.manage', 'Manage Compensation', 'Update paid/unpaid and compensation amount metadata', 'compensation', 'manage')
ON CONFLICT (key) DO NOTHING;

-- Role mappings for new permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN (
  'employees.manage_assigned',
  'interns.manage_all',
  'interns.manage_assigned',
  'compensation.manage'
)
WHERE r.key = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN (
  'employees.manage',
  'interns.manage_all',
  'compensation.manage'
)
WHERE r.key = 'hr'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN (
  'employees.manage_assigned',
  'interns.view_assigned',
  'interns.manage_assigned'
)
WHERE r.key = 'team_lead'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 5) RLS lock-down for new tables
DO $$
BEGIN
  EXECUTE 'ALTER TABLE IF EXISTS public.intern_profiles ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS public.intern_profiles FORCE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS deny_client_access ON public.intern_profiles';
  EXECUTE
    'CREATE POLICY deny_client_access ON public.intern_profiles FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)';

  EXECUTE 'ALTER TABLE IF EXISTS public.compensation_history ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS public.compensation_history FORCE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS deny_client_access ON public.compensation_history';
  EXECUTE
    'CREATE POLICY deny_client_access ON public.compensation_history FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)';
END $$;
