-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- InsureEdge PostgreSQL 16 schema (ADR-005)
-- Stack: React 18 + ASP.NET Core 8 + PostgreSQL 16

-- ────────────────────────────────────────────────────────────────────────────
-- TENANTS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE client (
    id          bigserial   PRIMARY KEY,
    name        varchar(200) NOT NULL,
    created_on  timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- USERS
-- Passwords: BCrypt hash (ADR-002). No plaintext ever.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE "user" (
    id              bigserial    PRIMARY KEY,
    first_name      varchar(100) NOT NULL,
    last_name       varchar(100) NOT NULL,
    email           varchar(200) NOT NULL,
    password_hash   varchar(200),
    is_active       boolean      NOT NULL DEFAULT true,
    client_id       bigint       NOT NULL REFERENCES client(id),
    created_on      timestamptz  NOT NULL DEFAULT now(),
    UNIQUE (email, client_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- GROUPS
-- CORRECTIVE (BUG-001 / BR-007): NO member_count column.
-- Member count is always computed live via COUNT(group_user) — never stored.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE "group" (
    id              bigserial    PRIMARY KEY,
    group_code      varchar(50),                         -- BR-001: auto-generated, sequential 4-digit zero-padded
    group_name      varchar(200) NOT NULL,               -- VR-001: required, max 200
    group_email_id  varchar(100),                        -- VR-003: optional, email format
    group_leader    bigint       REFERENCES "user"(id),  -- VR-002: required
    group_desc      varchar(1000),                       -- VR-004: optional, max 500 (stored up to 1000)
    status          varchar(20)  NOT NULL DEFAULT 'ACTIVE',  -- BR-003: display normalized to title case
    is_department   boolean      NOT NULL DEFAULT false,     -- BR-006: dept flag
    client_id       bigint       NOT NULL REFERENCES client(id),  -- ADR-010: tenant isolation
    created_by      bigint       REFERENCES "user"(id),
    created_on      timestamptz  NOT NULL DEFAULT now(),
    updated_by      bigint       REFERENCES "user"(id),
    updated_on      timestamptz
    -- NO member_count column (corrective BUG-001)
);

-- ────────────────────────────────────────────────────────────────────────────
-- GROUP MEMBERSHIP
-- CORRECTIVE: group_id and user_id are NOT NULL (source had nullable FKs).
-- Deleting a row here IS the privilege revocation (ADR-004, BR-014).
-- No background job or deferred cleanup — synchronous by design.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE group_user (
    id          bigserial PRIMARY KEY,
    group_id    bigint NOT NULL REFERENCES "group"(id),  -- NOT NULL: corrective
    user_id     bigint NOT NULL REFERENCES "user"(id),   -- NOT NULL: corrective
    client_id   bigint NOT NULL REFERENCES client(id),
    UNIQUE (group_id, user_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- MODULES (8 modules)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE module (
    id          bigserial    PRIMARY KEY,
    module_name varchar(200) NOT NULL,
    sort_order  int          NOT NULL DEFAULT 0
);

-- ────────────────────────────────────────────────────────────────────────────
-- APP SCREENS (51 rows)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE app_screen (
    id          bigserial    PRIMARY KEY,
    screen_code varchar(100) NOT NULL UNIQUE,
    screen_name varchar(200) NOT NULL,
    module_id   bigint       NOT NULL REFERENCES module(id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- PERMISSIONS
-- US-012: 9 permission types, all enforced server-side (ADR-003 / DBT-SEC-002 corrective).
-- BR-008: effective permissions = OR across all active groups user belongs to.
-- BR-011: stored at group level — no per-user records.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE screen_permissions (
    id                      bigserial PRIMARY KEY,
    group_id                bigint NOT NULL REFERENCES "group"(id),
    screen_id               bigint NOT NULL REFERENCES app_screen(id),
    client_id               bigint NOT NULL REFERENCES client(id),
    is_view_permission      boolean NOT NULL DEFAULT false,
    is_create_permission    boolean NOT NULL DEFAULT false,
    is_edit_permission      boolean NOT NULL DEFAULT false,
    is_duplicate_permission boolean NOT NULL DEFAULT false,
    is_upload_permission    boolean NOT NULL DEFAULT false,
    is_download_permission  boolean NOT NULL DEFAULT false,
    is_view_sensitive_info  boolean NOT NULL DEFAULT false,
    is_access_sensitive_doc boolean NOT NULL DEFAULT false,
    is_approve_reject       boolean NOT NULL DEFAULT false,
    UNIQUE (group_id, screen_id, client_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- PASSWORD RESET TOKENS
-- CORRECTIVE (RSK-SEC-004): code stores SHA-256 hex hash — NEVER plaintext.
-- CORRECTIVE (US-017/DBT-SEC-004): is_onboarding flag; 24h vs 30min expiry.
-- VR-006/VR-007: validation requires exists AND not-expired AND hash-matches.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE user_password_reset (
    id              bigserial    PRIMARY KEY,
    user_id         bigint       NOT NULL REFERENCES "user"(id),
    username        varchar(200) NOT NULL,
    code            varchar(64)  NOT NULL,   -- SHA-256 hex (64 chars) — NOT plaintext
    is_onboarding   boolean      NOT NULL DEFAULT false,
    created_on      timestamptz  NOT NULL DEFAULT now()
    -- expiry: created_on + 30min (standard) | created_on + 24h (onboarding)
    -- computed in application code — not stored as a column
);

-- ────────────────────────────────────────────────────────────────────────────
-- INDEXES (ADR-005 performance requirements)
-- ────────────────────────────────────────────────────────────────────────────
CREATE INDEX idx_group_clientid_status        ON "group"(client_id, status);
CREATE INDEX idx_groupuser_userid_clientid    ON group_user(user_id, client_id);
CREATE INDEX idx_groupuser_groupid            ON group_user(group_id);
CREATE INDEX idx_screenperm_groupid           ON screen_permissions(group_id);
CREATE INDEX idx_screenperm_screenid_group    ON screen_permissions(screen_id, group_id);
CREATE INDEX idx_screenperm_clientid          ON screen_permissions(client_id);
CREATE INDEX idx_userpassreset_username       ON user_password_reset(username);
CREATE INDEX idx_userpassreset_userid         ON user_password_reset(user_id);
CREATE INDEX idx_user_clientid                ON "user"(client_id);
CREATE INDEX idx_appscreen_moduleid           ON app_screen(module_id);
