-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Producer self-service login (Path 1: Producer = User + producer_id link).
-- A Producer who needs to log in and create quotes gets a "user" row with
-- producer_id set, is assigned to the "Producers" group below, and never
-- appears in User Management (UsersController.GetAll excludes producer_id
-- IS NOT NULL rows). Run AFTER 024_widen_producer_license_columns.sql

ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS producer_id bigint REFERENCES producer(id);

-- "Producers" group: View + Add on New Business Quotes only. Screen-level
-- permission model is reused as-is (PermissionResolver/PermissionAttribute) —
-- no new auth code path, just a new group with a narrower grant than staff.
-- status must be the Group.cs GroupStatus enum's string name ("Active", not
-- "ACTIVE" — HasConversion<string>() stores the C# enum member name verbatim).
-- group_leader/created_by reference the seeded admin (id 1, see 003_dev_seed.sql)
-- since both are NOT NULL on "group" and no other user is guaranteed to exist yet.
INSERT INTO "group" (group_code, group_name, group_desc, status, is_department, client_id, group_leader, created_by)
SELECT 'PROD01', 'Producers', 'Producer self-service login — quote creation only.', 'Active', false, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "group" WHERE group_name = 'Producers' AND client_id = 1);

INSERT INTO screen_permissions (group_id, screen_id, client_id, is_view_permission, is_create_permission)
SELECT g.id, s.id, 1, true, true
FROM "group" g
JOIN app_screen s ON s.screen_code = 'NBQUOTESSCREEN'
WHERE g.group_name = 'Producers' AND g.client_id = 1
  AND NOT EXISTS (
      SELECT 1 FROM screen_permissions sp WHERE sp.group_id = g.id AND sp.screen_id = s.id AND sp.client_id = 1
  );
