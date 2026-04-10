-- Migration 044: Secure admin password
-- SECURITY: CRITICAL FIX - Remove hardcoded default password
-- 
-- The old password (Admin@123) was documented in migration 004 and is widely known.
-- This migration replaces it with a cryptographically secure password.
--
-- IMPORTANT: Store the new password securely and communicate it only through
-- secure channels to authorized administrators.
-- 
-- New admin password: SqAdm1n@93b2b50b
-- This password should be changed immediately after first login.

UPDATE users 
SET password_hash = '$2b$12$aeBy2DE1hJNJESAM8smdK.Ik4fzBgmDZaaTw.yjowUq5eEjZwxtL.',
    updated_at = NOW()
WHERE email = 'admin@synthoquest.com'
AND role = 'admin';

-- Add a comment for security documentation
COMMENT ON TABLE users IS 
'SECURITY: Default admin password must be changed immediately after deployment. 
Admin accounts should enforce password rotation every 90 days.
The password hash in migration 004 is replaced by migration 044.';

-- Log the security update
INSERT INTO audit_log (action, table_name, record_id, new_values, created_at)
SELECT 
  'SECURITY_UPDATE' as action,
  'users' as table_name,
  id as record_id,
  jsonb_build_object('password_rotated', true, 'reason', 'critical_security_fix') as new_values,
  NOW() as created_at
FROM users 
WHERE email = 'admin@synthoquest.com' 
AND role = 'admin'
ON CONFLICT DO NOTHING;