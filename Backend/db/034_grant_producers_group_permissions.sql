-- Grant Edit permission to Producers group for NBQUOTESSCREEN
-- Allows producer users to save/update submissions

INSERT INTO screen_permissions (
    group_id,
    screen_id,
    client_id,
    is_view_permission,
    is_create_permission,
    is_edit_permission,
    is_duplicate_permission,
    is_upload_permission,
    is_download_permission,
    is_view_sensitive_info,
    is_access_sensitive_doc,
    is_approve_reject
)
SELECT
    g.id,
    s.id,
    g.client_id,
    true,   -- View
    true,   -- Create (for New Submission button)
    true,   -- Edit (for Save/Save & Next)
    false,
    true,   -- Upload (for Bulk Upload)
    true,   -- Download
    false,
    false,
    false
FROM "group" g
CROSS JOIN app_screen s
WHERE g.group_name = 'Producers'
  AND s.screen_code = 'NBQUOTESSCREEN'
  AND NOT EXISTS (
    SELECT 1 FROM screen_permissions sp
    WHERE sp.group_id = g.id
    AND sp.screen_id = s.id
    AND sp.client_id = g.client_id
  );
