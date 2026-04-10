-- Migration: Add auto_checkout_on_logout setting to organization_settings
-- Purpose: Allow admins to configure automatic checkout when user logs out

-- Add column to organization_settings table
ALTER TABLE organization_settings
ADD COLUMN IF NOT EXISTS auto_checkout_on_logout BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN organization_settings.auto_checkout_on_logout IS
'When true, users with open attendance sessions are automatically checked out when they log out of the application';

-- Update any existing rows that might not have this column set
UPDATE organization_settings
SET auto_checkout_on_logout = true
WHERE auto_checkout_on_logout IS NULL;