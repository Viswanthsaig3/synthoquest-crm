-- Phase 1: Authentication & Employee Tracking
-- Migration 004: Seed Admin User

-- Default admin user
-- Email: admin@synthoquest.com
-- Password: Admin@123 (hashed with bcrypt, cost factor 12)
-- Hash generated: $2b$12$v208AabK4KsXdgtheomRe.ZS0qZsVfmjQNScxonfCSm0LGAkWW3Au

INSERT INTO users (email, password_hash, name, phone, role, department, status)
VALUES (
  'admin@synthoquest.com',
  '$2b$12$v208AabK4KsXdgtheomRe.ZS0qZsVfmjQNScxonfCSm0LGAkWW3Au',
  'Admin User',
  '+91 9876543210',
  'admin',
  'training',
  'active'
)
ON CONFLICT (email) DO NOTHING;
