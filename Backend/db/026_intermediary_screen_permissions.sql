-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Distribution Management "Assigned Rights" tab (ViewIntermediaryPage.tsx RightsTab):
-- lets staff configure which screens an Intermediary's producers can access, and at
-- what level (None / Read Only / All Access). Mirrors screen_permissions (used by User
-- Groups Management) but keyed by intermediary_id instead of group_id — these are two
-- independent grants; producer login effective permission = the "Producers" group grant
-- OR the producer's own intermediary's grant here (see PermissionResolver.ResolveAsync).
-- Run AFTER 025_producer_login.sql

CREATE TABLE IF NOT EXISTS intermediary_screen_permissions (
    id                       bigserial   PRIMARY KEY,
    intermediary_id          bigint      NOT NULL REFERENCES intermediary(id) ON DELETE CASCADE,
    screen_id                 bigint      NOT NULL REFERENCES app_screen(id),
    client_id                 bigint      NOT NULL REFERENCES client(id),
    is_view_permission        boolean     NOT NULL DEFAULT false,
    is_create_permission      boolean     NOT NULL DEFAULT false,
    is_edit_permission        boolean     NOT NULL DEFAULT false,
    is_duplicate_permission   boolean     NOT NULL DEFAULT false,
    is_upload_permission      boolean     NOT NULL DEFAULT false,
    is_download_permission    boolean     NOT NULL DEFAULT false,
    is_view_sensitive_info    boolean     NOT NULL DEFAULT false,
    is_access_sensitive_doc   boolean     NOT NULL DEFAULT false,
    is_approve_reject         boolean     NOT NULL DEFAULT false,
    UNIQUE (intermediary_id, screen_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_intermediaryscreenperm_intermediaryid ON intermediary_screen_permissions(intermediary_id);
