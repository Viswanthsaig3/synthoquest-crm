-- Migration 013 (deprecated)
-- This migration previously switched timesheets to a daily schema.
-- MVP now standardizes on weekly timesheets (migrations 010-012).
-- Intentionally no-op to preserve a single consistent schema path.

SELECT 1;
