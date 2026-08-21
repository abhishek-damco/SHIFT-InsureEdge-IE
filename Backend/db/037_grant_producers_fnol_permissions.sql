-- Producer self-service FNOL access.
-- Row-level policy and claim visibility is enforced by ClaimRepository using ProducerScope.
-- Safe to re-run: the Producers grant is inserted or promoted to View/Create/Edit.

INSERT INTO screen_permissions (
    group_id,
    screen_id,
    client_id,
    is_view_permission,
    is_create_permission,
    is_edit_permission
)
SELECT
    g.id,
    s.id,
    g.client_id,
    true,
    true,
    true
FROM "group" g
JOIN app_screen s ON s.screen_code = 'FNOLREGSCREEN'
WHERE g.group_name = 'Producers'
  AND g.status = 'Active'
ON CONFLICT (group_id, screen_id, client_id) DO UPDATE SET
    is_view_permission = true,
    is_create_permission = true,
    is_edit_permission = true;

-- Older producer-created quotes/policies predate automatic ownership stamping. Restore
-- their producer and intermediary ownership from the authenticated creator relationship.
UPDATE policy pol
SET producer_id = usr.producer_id,
    intermediary_id = prod.intermediary_id,
    updated_on = CURRENT_TIMESTAMP
FROM "user" usr
JOIN producer prod ON prod.id = usr.producer_id
WHERE pol.created_by = usr.id
  AND pol.client_id = usr.client_id
  AND usr.producer_id IS NOT NULL
  AND (pol.producer_id IS NULL OR pol.intermediary_id IS NULL);
