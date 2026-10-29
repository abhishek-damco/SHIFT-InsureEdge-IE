-- QA User Management UM-07 – UM-10: bring the Rights accordions in line with OutSystems.
--   * Each management module has a single "Landing Page" row (View / Add / Edit on one row).
--   * Quotes & Policies drops the Business rows and gains "Policy Summary".
-- Rows are hidden (is_visible = false), never deleted: screen codes stay valid for
-- existing references, and their grants are merged into the landing row first.
-- Idempotent — safe to re-run.

BEGIN;

ALTER TABLE app_screen ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

-- ─── Merge hidden Add/View grants into the landing row ────────────────────────
CREATE TEMP TABLE rights_merge (hidden_code varchar(100), landing_code varchar(100)) ON COMMIT DROP;
INSERT INTO rights_merge VALUES
  ('USERGROUP_ADD',         'USERGROUPPAGE'),
  ('USERGROUP_VIEW',        'USERGROUPPAGE'),
  ('USERMGMT_ADDUSER',      'USERMNGTPAGE'),
  ('USERMGMT_VIEWUSER',     'USERMNGTPAGE'),
  ('DIST_ADDINTERMEDIARY',  'DISTRIBUTIONLANDINGPAGE'),
  ('DIST_VIEWINTERMEDIARY', 'DISTRIBUTIONLANDINGPAGE');

INSERT INTO screen_permissions (group_id, screen_id, client_id,
    is_view_permission, is_create_permission, is_edit_permission, is_duplicate_permission,
    is_upload_permission, is_download_permission, is_view_sensitive_info,
    is_access_sensitive_doc, is_approve_reject)
SELECT sp.group_id, landing.id, sp.client_id,
       bool_or(sp.is_view_permission), bool_or(sp.is_create_permission), bool_or(sp.is_edit_permission),
       bool_or(sp.is_duplicate_permission), bool_or(sp.is_upload_permission), bool_or(sp.is_download_permission),
       bool_or(sp.is_view_sensitive_info), bool_or(sp.is_access_sensitive_doc), bool_or(sp.is_approve_reject)
FROM screen_permissions sp
JOIN app_screen hidden  ON hidden.id = sp.screen_id
JOIN rights_merge m     ON m.hidden_code = hidden.screen_code
JOIN app_screen landing ON landing.screen_code = m.landing_code
GROUP BY sp.group_id, landing.id, sp.client_id
ON CONFLICT (group_id, screen_id, client_id) DO UPDATE SET
  is_view_permission      = screen_permissions.is_view_permission      OR EXCLUDED.is_view_permission,
  is_create_permission    = screen_permissions.is_create_permission    OR EXCLUDED.is_create_permission,
  is_edit_permission      = screen_permissions.is_edit_permission      OR EXCLUDED.is_edit_permission,
  is_duplicate_permission = screen_permissions.is_duplicate_permission OR EXCLUDED.is_duplicate_permission,
  is_upload_permission    = screen_permissions.is_upload_permission    OR EXCLUDED.is_upload_permission,
  is_download_permission  = screen_permissions.is_download_permission  OR EXCLUDED.is_download_permission,
  is_view_sensitive_info  = screen_permissions.is_view_sensitive_info  OR EXCLUDED.is_view_sensitive_info,
  is_access_sensitive_doc = screen_permissions.is_access_sensitive_doc OR EXCLUDED.is_access_sensitive_doc,
  is_approve_reject       = screen_permissions.is_approve_reject       OR EXCLUDED.is_approve_reject;

INSERT INTO intermediary_screen_permissions (intermediary_id, screen_id, client_id,
    is_view_permission, is_create_permission, is_edit_permission, is_duplicate_permission,
    is_upload_permission, is_download_permission, is_view_sensitive_info,
    is_access_sensitive_doc, is_approve_reject)
SELECT ip.intermediary_id, landing.id, ip.client_id,
       bool_or(ip.is_view_permission), bool_or(ip.is_create_permission), bool_or(ip.is_edit_permission),
       bool_or(ip.is_duplicate_permission), bool_or(ip.is_upload_permission), bool_or(ip.is_download_permission),
       bool_or(ip.is_view_sensitive_info), bool_or(ip.is_access_sensitive_doc), bool_or(ip.is_approve_reject)
FROM intermediary_screen_permissions ip
JOIN app_screen hidden  ON hidden.id = ip.screen_id
JOIN rights_merge m     ON m.hidden_code = hidden.screen_code
JOIN app_screen landing ON landing.screen_code = m.landing_code
GROUP BY ip.intermediary_id, landing.id, ip.client_id
ON CONFLICT (intermediary_id, screen_id, client_id) DO UPDATE SET
  is_view_permission      = intermediary_screen_permissions.is_view_permission      OR EXCLUDED.is_view_permission,
  is_create_permission    = intermediary_screen_permissions.is_create_permission    OR EXCLUDED.is_create_permission,
  is_edit_permission      = intermediary_screen_permissions.is_edit_permission      OR EXCLUDED.is_edit_permission,
  is_duplicate_permission = intermediary_screen_permissions.is_duplicate_permission OR EXCLUDED.is_duplicate_permission,
  is_upload_permission    = intermediary_screen_permissions.is_upload_permission    OR EXCLUDED.is_upload_permission,
  is_download_permission  = intermediary_screen_permissions.is_download_permission  OR EXCLUDED.is_download_permission,
  is_view_sensitive_info  = intermediary_screen_permissions.is_view_sensitive_info  OR EXCLUDED.is_view_sensitive_info,
  is_access_sensitive_doc = intermediary_screen_permissions.is_access_sensitive_doc OR EXCLUDED.is_access_sensitive_doc,
  is_approve_reject       = intermediary_screen_permissions.is_approve_reject       OR EXCLUDED.is_approve_reject;

-- ─── Hide the extra rows ──────────────────────────────────────────────────────
UPDATE app_screen SET is_visible = false
WHERE screen_code IN (
  'USERGROUP_ADD', 'USERGROUP_VIEW',
  'USERMGMT_ADDUSER', 'USERMGMT_VIEWUSER',
  'DIST_ADDINTERMEDIARY', 'DIST_VIEWINTERMEDIARY',
  -- D1-16: Business is not used in H&B
  'NEWBUSINESS', 'ENDORSEMENTBUSINESS', 'RENEWALBUSINESS', 'POLICIESBUSINESS');

UPDATE app_screen SET screen_name = 'Landing Page'
WHERE screen_code IN ('USERGROUPPAGE', 'USERMNGTPAGE', 'DISTRIBUTIONLANDINGPAGE');

-- ─── Quotes & Policies: Policy Summary ────────────────────────────────────────
INSERT INTO app_screen (screen_code, screen_name, module_id)
SELECT 'POLICYSUMMARY', 'Policy Summary', 4
WHERE NOT EXISTS (SELECT 1 FROM app_screen WHERE screen_code = 'POLICYSUMMARY');

-- A screen with no permission row is "deny everything" (see README). Start Policy
-- Summary with the same grants each group / intermediary already has on Policies.
INSERT INTO screen_permissions (group_id, screen_id, client_id,
    is_view_permission, is_create_permission, is_edit_permission, is_duplicate_permission,
    is_upload_permission, is_download_permission, is_view_sensitive_info,
    is_access_sensitive_doc, is_approve_reject)
SELECT sp.group_id, summary.id, sp.client_id,
       sp.is_view_permission, sp.is_create_permission, sp.is_edit_permission, sp.is_duplicate_permission,
       sp.is_upload_permission, sp.is_download_permission, sp.is_view_sensitive_info,
       sp.is_access_sensitive_doc, sp.is_approve_reject
FROM screen_permissions sp
JOIN app_screen policies ON policies.id = sp.screen_id AND policies.screen_code = 'POLICIESINDIVIDUAL'
JOIN app_screen summary  ON summary.screen_code = 'POLICYSUMMARY'
ON CONFLICT (group_id, screen_id, client_id) DO NOTHING;

INSERT INTO intermediary_screen_permissions (intermediary_id, screen_id, client_id,
    is_view_permission, is_create_permission, is_edit_permission, is_duplicate_permission,
    is_upload_permission, is_download_permission, is_view_sensitive_info,
    is_access_sensitive_doc, is_approve_reject)
SELECT ip.intermediary_id, summary.id, ip.client_id,
       ip.is_view_permission, ip.is_create_permission, ip.is_edit_permission, ip.is_duplicate_permission,
       ip.is_upload_permission, ip.is_download_permission, ip.is_view_sensitive_info,
       ip.is_access_sensitive_doc, ip.is_approve_reject
FROM intermediary_screen_permissions ip
JOIN app_screen policies ON policies.id = ip.screen_id AND policies.screen_code = 'POLICIESINDIVIDUAL'
JOIN app_screen summary  ON summary.screen_code = 'POLICYSUMMARY'
ON CONFLICT (intermediary_id, screen_id, client_id) DO NOTHING;

COMMIT;
