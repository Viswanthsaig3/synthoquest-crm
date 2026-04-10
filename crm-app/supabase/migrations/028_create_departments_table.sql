-- Migration 028: Departments catalog (DB-driven; users.department stores key string)

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT departments_key_format CHECK (key ~* '^[a-z_]+$')
);

CREATE INDEX IF NOT EXISTS idx_departments_key ON departments(key);
CREATE INDEX IF NOT EXISTS idx_departments_sort ON departments(sort_order);
CREATE INDEX IF NOT EXISTS idx_departments_archived_at ON departments(archived_at);

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE departments IS 'Organizational departments; users.department references key';

INSERT INTO departments (key, name, sort_order) VALUES
  ('sales', 'Sales', 1),
  ('training', 'Training', 2),
  ('marketing', 'Marketing', 3)
ON CONFLICT (key) DO NOTHING;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE IF EXISTS public.departments ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS public.departments FORCE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS deny_client_access ON public.departments';
  EXECUTE
    'CREATE POLICY deny_client_access ON public.departments FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)';
END $$;
