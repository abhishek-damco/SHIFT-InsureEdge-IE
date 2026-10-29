-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Backfill screen_permissions for any app_screen that a group has no row for at all.
--
-- Root cause: 003_dev_seed.sql grants full permissions to the Administrators group by
-- selecting every row currently in app_screen — but it runs BEFORE later migrations
-- (010_quotes_policies_schema.sql, etc.) insert new screens (NBQUOTESSCREEN,
-- ENDORSEMENTSSCREEN, RENEWALSSCREEN, POLICIESSCREEN, ...). Those screens end up with
-- ZERO screen_permissions rows for ANY group on a fresh clone, which the permission
-- resolver treats as "deny everything" (View included, not just Download) — every new
-- screen added after 003_dev_seed silently locks every group out until someone notices.
--
-- This migration is idempotent and generic: run it again after adding any future screen
-- and it will backfill full permissions for every existing group with no manual step.
INSERT INTO screen_permissions (
    group_id, screen_id, client_id,
    is_view_permission, is_create_permission, is_edit_permission,
    is_duplicate_permission, is_upload_permission, is_download_permission,
    is_view_sensitive_info, is_access_sensitive_doc, is_approve_reject
)
SELECT g.id, s.id, g.client_id, true, true, true, true, true, true, true, true, true
FROM "group" g
CROSS JOIN app_screen s
WHERE NOT EXISTS (
    SELECT 1 FROM screen_permissions sp
    WHERE sp.group_id = g.id AND sp.screen_id = s.id AND sp.client_id = g.client_id
)
ON CONFLICT (group_id, screen_id, client_id) DO NOTHING;
