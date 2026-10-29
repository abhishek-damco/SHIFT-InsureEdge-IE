-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Dev seed: 1 tenant, 2 users, 1 sample group
-- BCrypt hashes below are for password "DevPass@123!" — replace before any non-dev use.

INSERT INTO client (id, name) VALUES (1, 'Hudson Bailey');

-- Admin user (password: DevPass@123!)
INSERT INTO "user" (id, first_name, last_name, email, password_hash, is_active, client_id)
VALUES (1, 'Alex', 'Mercer', 'alex.mercer@hudsonbailey.com',
        '$2a$11$br.FC7x9YHPpbcVD5dJ4MeFZFtlckqO8trNkm/qgDCe3LzRwvCj76', true, 1);

-- Standard user (password: DevPass@123!)
INSERT INTO "user" (id, first_name, last_name, email, password_hash, is_active, client_id)
VALUES (2, 'Riley', 'Thompson', 'riley.thompson@hudsonbailey.com',
        '$2a$11$br.FC7x9YHPpbcVD5dJ4MeFZFtlckqO8trNkm/qgDCe3LzRwvCj76', true, 1);

-- Sample group — status must be 'Active' (title case) to match EF enum string conversion
INSERT INTO "group" (id, group_code, group_name, group_leader, status, client_id, created_by)
VALUES (1, '0001', 'Administrators', 1, 'Active', 1, 1);

-- Admin is a member of Administrators group
INSERT INTO group_user (group_id, user_id, client_id) VALUES (1, 1, 1);

-- Grant full permissions on ALL screens to Administrators group
INSERT INTO screen_permissions (
    group_id, screen_id, client_id,
    is_view_permission, is_create_permission, is_edit_permission,
    is_duplicate_permission, is_upload_permission, is_download_permission,
    is_view_sensitive_info, is_access_sensitive_doc, is_approve_reject
)
SELECT 1, id, 1, true, true, true, true, true, true, true, true, true
FROM app_screen
ON CONFLICT (group_id, screen_id, client_id) DO NOTHING;
