-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Grant the Administrators group (id 1, client 1) full permissions on every screen
-- that has no screen_permissions row yet (screens 63-66 were added by migration 010 —
-- NBQUOTESSCREEN among them — but their permission rows previously existed only
-- ad-hoc in the pre-rebuild database). Idempotent.
INSERT INTO screen_permissions (
    group_id, screen_id, client_id,
    is_view_permission, is_create_permission, is_edit_permission,
    is_duplicate_permission, is_upload_permission, is_download_permission,
    is_view_sensitive_info, is_access_sensitive_doc, is_approve_reject)
SELECT 1, s.id, 1, true, true, true, true, true, true, true, true, true
FROM app_screen s
WHERE NOT EXISTS (
    SELECT 1 FROM screen_permissions sp WHERE sp.screen_id = s.id AND sp.group_id = 1
);
