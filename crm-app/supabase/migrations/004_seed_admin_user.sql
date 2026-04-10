-- Phase 1: Authentication & Employee Tracking
-- Migration 004: Seed Admin User
--
-- SECURITY WARNING: 
-- The password hash in this file is a PLACEHOLDER ONLY.
-- It is replaced by migration 044 with a secure password.
-- DO NOT use the placeholder password for authentication.
-- The actual admin credentials are set securely via migration 044.

INSERT INTO users (email, password_hash, name, phone, role, department, status)
VALUES (
  'admin@synthoquest.com',
  '$2b$12$placeholder-replaced-by-migration-044',
  'Admin User',
  '+91 9876543210',
  'admin',
  'training',
  'active'
)
ON CONFLICT (email) DO NOTHING;