-- Producers are an allowed Dashboard persona in the source application. Grant view-only
-- Dashboard access to existing Producers groups without broadening any other permission.

INSERT INTO screen_permissions
    (group_id, screen_id, client_id, is_view_permission, is_create_permission,
     is_edit_permission, is_duplicate_permission, is_upload_permission,
     is_download_permission, is_view_sensitive_info, is_access_sensitive_doc,
     is_approve_reject)
SELECT g.id, s.id, g.client_id, true, false, false, false, false, false, false, false, false
FROM "group" g
JOIN app_screen s ON s.screen_code = 'DASHBOARD'
WHERE lower(g.group_name) = 'producers'
  AND NOT EXISTS (
      SELECT 1
      FROM screen_permissions sp
      WHERE sp.group_id = g.id AND sp.screen_id = s.id AND sp.client_id = g.client_id
  );
