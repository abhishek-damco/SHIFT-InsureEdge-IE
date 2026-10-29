-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- "Test Group" (id=2) had zero screen_permissions rows, so every listing screen
-- (Groups, Policy module registers, etc.) 403'd for its members and rendered as
-- an empty list with no error message. Grants view-only access on every screen —
-- a read-only tester role, distinct from Administrators' full access.
-- Run AFTER 016_user_last_login.sql

INSERT INTO screen_permissions (group_id, screen_id, client_id, is_view_permission)
SELECT 2, s.id, 1, true
FROM app_screen s
WHERE NOT EXISTS (
    SELECT 1 FROM screen_permissions sp WHERE sp.group_id = 2 AND sp.screen_id = s.id
);
