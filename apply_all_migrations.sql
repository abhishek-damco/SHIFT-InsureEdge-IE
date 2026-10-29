-- Comprehensive Migration Application Script
-- This script applies all critical migrations to ensure database schema is complete

-- Check current schema state
SELECT 'Checking user table schema...' AS status;

SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user'
ORDER BY ordinal_position;

-- Verify producer_id column exists
SELECT COUNT(*) as producer_id_exists
FROM information_schema.columns
WHERE table_name = 'user' AND column_name = 'producer_id';

-- Apply migration 022: Add audit columns to user table
ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS last_login_on timestamptz,
    ADD COLUMN IF NOT EXISTS password_updated_on timestamptz;

-- Backfill password_updated_on with created_on for existing records
UPDATE "user" SET password_updated_on = created_on WHERE password_updated_on IS NULL;

-- Apply migration 025: Add producer_id to user table
ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS producer_id bigint REFERENCES producer(id);

-- Create "Producers" group if it doesn't exist
INSERT INTO "group" (group_code, group_name, group_desc, status, is_department, client_id, group_leader, created_by)
SELECT 'PROD01', 'Producers', 'Producer self-service login — quote creation only.', 'Active', false, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "group" WHERE group_name = 'Producers' AND client_id = 1);

-- Create screen permissions for Producers group on New Business Quotes screen
INSERT INTO screen_permissions (group_id, screen_id, client_id, is_view_permission, is_create_permission)
SELECT g.id, s.id, 1, true, true
FROM "group" g
JOIN app_screen s ON s.screen_code = 'NBQUOTESSCREEN'
WHERE g.group_name = 'Producers' AND g.client_id = 1
  AND NOT EXISTS (
      SELECT 1 FROM screen_permissions sp
      WHERE sp.group_id = g.id AND sp.screen_id = s.id AND sp.client_id = 1
  );

-- Verify all columns now exist
SELECT 'Final verification - User table columns:' AS status;
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user'
ORDER BY ordinal_position;

SELECT 'Migration application complete!' AS status;
