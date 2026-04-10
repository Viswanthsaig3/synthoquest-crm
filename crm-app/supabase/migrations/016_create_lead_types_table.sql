-- Migration 016: Create Lead Types Table

CREATE TABLE IF NOT EXISTS lead_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  slug VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  fields JSONB DEFAULT '[]',
  statuses JSONB DEFAULT '[]',
  sources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_types_slug ON lead_types(slug);
CREATE INDEX IF NOT EXISTS idx_lead_types_is_active ON lead_types(is_active);
CREATE INDEX IF NOT EXISTS idx_lead_types_deleted_at ON lead_types(deleted_at);

COMMENT ON TABLE lead_types IS 'Types of leads (Student, Intern, Job, etc.)';

-- Insert default lead types
INSERT INTO lead_types (name, description, slug, fields, statuses, sources) VALUES
('Student Lead', 'Students interested in courses', 'student',
 '[{"name":"course","label":"Course Interested","type":"select","options":["Ethical Hacking","Cyber Security Fundamentals","Advanced Penetration Testing","Network Security","Cloud Security"]},{"name":"batch_pref","label":"Batch Preference","type":"select","options":["weekday","weekend","online"]},{"name":"experience","label":"Years of Experience","type":"select","options":["0","1-2","3-5","5+"]}]',
 '["new","contacted","follow_up","qualified","converted","lost"]',
 '["ads","referral","organic","website","social_media"]'),
('Intern Lead', 'Internship applications', 'intern',
 '[{"name":"skills","label":"Skills","type":"text"},{"name":"education","label":"Education","type":"text"},{"name":"duration","label":"Duration","type":"select","options":["3 months","6 months","12 months"]}]',
 '["new","under_review","interview_scheduled","selected","rejected"]',
 '["portal","referral","direct","campus"]')
ON CONFLICT (slug) DO NOTHING;