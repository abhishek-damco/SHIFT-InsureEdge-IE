-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Completes the one-to-one user_extended profile used by User Management.
-- The base "user" table remains the authentication/tenant identity record.

BEGIN;

CREATE TABLE IF NOT EXISTS user_extended (
    id         bigint PRIMARY KEY,
    user_id    bigint NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    created_on timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_extended
    ADD COLUMN IF NOT EXISTS user_code                 varchar(50),
    ADD COLUMN IF NOT EXISTS status                    varchar(20),
    ADD COLUMN IF NOT EXISTS status_toggle             boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS first_name                varchar(100),
    ADD COLUMN IF NOT EXISTS middle_name               varchar(100),
    ADD COLUMN IF NOT EXISTS last_name                 varchar(100),
    ADD COLUMN IF NOT EXISTS suffix                    varchar(30),
    ADD COLUMN IF NOT EXISTS date_of_birth             date,
    ADD COLUMN IF NOT EXISTS gender                    varchar(20),
    ADD COLUMN IF NOT EXISTS is_remote_working         boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_manager                boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS office_location           varchar(100),
    ADD COLUMN IF NOT EXISTS department                varchar(100),
    ADD COLUMN IF NOT EXISTS reports_to                bigint REFERENCES "user"(id),
    ADD COLUMN IF NOT EXISTS address_line1             varchar(500),
    ADD COLUMN IF NOT EXISTS address_line2             varchar(500),
    ADD COLUMN IF NOT EXISTS country_code              varchar(10),
    ADD COLUMN IF NOT EXISTS state_code                varchar(10),
    ADD COLUMN IF NOT EXISTS city                      varchar(100),
    ADD COLUMN IF NOT EXISTS county                    varchar(100),
    ADD COLUMN IF NOT EXISTS zip_code                  varchar(20),
    ADD COLUMN IF NOT EXISTS latitude                  numeric(10,7),
    ADD COLUMN IF NOT EXISTS longitude                 numeric(10,7),
    ADD COLUMN IF NOT EXISTS telephone_number          varchar(30),
    ADD COLUMN IF NOT EXISTS telephone_number_cc       varchar(10),
    ADD COLUMN IF NOT EXISTS alt_telephone_number      varchar(30),
    ADD COLUMN IF NOT EXISTS alt_telephone_number_cc   varchar(10),
    ADD COLUMN IF NOT EXISTS extension                 varchar(20),
    ADD COLUMN IF NOT EXISTS bio                       text,
    ADD COLUMN IF NOT EXISTS updated_on                timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_extended_user_code
    ON user_extended(user_code) WHERE user_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_user_extended_reports_to ON user_extended(reports_to);
CREATE INDEX IF NOT EXISTS ix_user_extended_status ON user_extended(status);

-- Every base identity gets a matching extension row. Existing profile values win.
INSERT INTO user_extended (
    id, user_id, status, status_toggle, first_name, last_name, created_on
)
SELECT
    u.id,
    u.id,
    CASE WHEN u.is_active THEN 'Active' ELSE 'Inactive' END,
    u.is_active,
    u.first_name,
    u.last_name,
    u.created_on
FROM "user" u
ON CONFLICT (user_id) DO UPDATE SET
    status        = COALESCE(user_extended.status, EXCLUDED.status),
    first_name    = COALESCE(user_extended.first_name, EXCLUDED.first_name),
    last_name     = COALESCE(user_extended.last_name, EXCLUDED.last_name),
    status_toggle = COALESCE(user_extended.status_toggle, EXCLUDED.status_toggle);

CREATE TABLE IF NOT EXISTS country (
    code              varchar(10) PRIMARY KEY,
    name              varchar(100) NOT NULL,
    country_dial_code varchar(10)
);

INSERT INTO country (code, name, country_dial_code)
VALUES ('US', 'United States', '+1')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    country_dial_code = EXCLUDED.country_dial_code;

-- Per-user permission overrides used by the User Management form. Group-level
-- permissions remain in screen_permissions and are not changed by this table.
CREATE TABLE IF NOT EXISTS user_screen (
    id                      bigserial PRIMARY KEY,
    user_id                 bigint NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    screen_id               bigint NOT NULL REFERENCES app_screen(id) ON DELETE CASCADE,
    is_view_permission      boolean NOT NULL DEFAULT false,
    is_create_permission    boolean NOT NULL DEFAULT false,
    is_edit_permission      boolean NOT NULL DEFAULT false,
    is_duplicate_permission boolean NOT NULL DEFAULT false,
    is_upload_permission    boolean NOT NULL DEFAULT false,
    is_download_permission  boolean NOT NULL DEFAULT false,
    is_view_sensitive_info  boolean NOT NULL DEFAULT false,
    is_access_sensitive_doc boolean NOT NULL DEFAULT false,
    is_approve_reject       boolean NOT NULL DEFAULT false,
    all_access              boolean NOT NULL DEFAULT false,
    UNIQUE (user_id, screen_id)
);

CREATE INDEX IF NOT EXISTS ix_user_screen_user_id ON user_screen(user_id);
CREATE INDEX IF NOT EXISTS ix_user_screen_screen_id ON user_screen(screen_id);

-- The original hand-written schema named this SHA-256 field "code", while the
-- EF model and repository consistently use "code_hash". Rename it in place so
-- existing token data and constraints are preserved.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_password_reset'
          AND column_name = 'code'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_password_reset'
          AND column_name = 'code_hash'
    ) THEN
        ALTER TABLE user_password_reset RENAME COLUMN code TO code_hash;
    END IF;
END $$;

COMMIT;
