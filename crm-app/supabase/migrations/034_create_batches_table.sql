-- Batches for training cohorts (lead conversion, student enrollment)

CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  instructor_name VARCHAR(255),
  mode VARCHAR(20) NOT NULL DEFAULT 'online',
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming',
  start_date DATE,
  end_date DATE,
  max_capacity INTEGER NOT NULL DEFAULT 30,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_batches_course_name ON batches (course_name);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches (status);
CREATE INDEX IF NOT EXISTS idx_batches_deleted_at ON batches (deleted_at);

ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_client_access ON batches;
CREATE POLICY deny_client_access ON batches FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
