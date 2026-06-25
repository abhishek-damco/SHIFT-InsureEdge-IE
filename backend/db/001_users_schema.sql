-- ─────────────────────────────────────────────────────────────────────────────
-- User Management Schema  (targets existing insuredge database)
-- Run AFTER the group-management 001_initial_schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- COUNTRY reference
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS country (
    id                bigserial    PRIMARY KEY,
    code              varchar(10)  NOT NULL UNIQUE,   -- ISO 3166-1 alpha-2 e.g. 'US'
    name              varchar(200) NOT NULL,
    country_dial_code varchar(10)  NOT NULL            -- e.g. '+1'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- STATE reference
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS state (
    id           bigserial   PRIMARY KEY,
    country_code varchar(10) NOT NULL REFERENCES country(code),
    code         varchar(20) NOT NULL,                -- e.g. 'CA', 'MH'
    name         varchar(200) NOT NULL,
    abbreviation varchar(10),
    UNIQUE (country_code, code)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS3  — full user profile (User Management module)
-- Links to existing "user" table via user_id (auth record)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users3 (
    id                     bigserial    PRIMARY KEY,
    -- auth link (optional — NULL until onboarding completes)
    user_id                bigint       REFERENCES "user"(id) ON DELETE SET NULL,
    client_id              bigint       REFERENCES client(id),
    -- identity
    user_code              varchar(50)  NOT NULL UNIQUE,   -- auto-generated e.g. IE1234
    os_user_id             varchar(100),                   -- OutSystems login username
    status                 varchar(20)  NOT NULL DEFAULT 'Active',
    status_toggle          boolean      NOT NULL DEFAULT true,
    -- name
    first_name             varchar(100) NOT NULL,
    middle_name            varchar(100),
    last_name              varchar(100) NOT NULL,
    suffix                 varchar(20),
    -- personal
    date_of_birth          date,
    gender                 varchar(20),
    bio                    text,
    -- work
    is_remote_working      boolean      NOT NULL DEFAULT false,
    office_location        varchar(300),
    department             varchar(200),
    is_manager             boolean      NOT NULL DEFAULT false,
    reports_to             bigint       REFERENCES users3(id) ON DELETE SET NULL,
    -- address
    address_line1          varchar(300),
    address_line2          varchar(300),
    country_code           varchar(10)  REFERENCES country(code),
    state_code             varchar(20),
    city                   varchar(200),
    county                 varchar(200),
    zip_code               varchar(20),
    latitude               numeric(10,7),
    longitude              numeric(10,7),
    -- contact
    telephone_number       varchar(30),
    telephone_number_cc    varchar(10),   -- country dial code e.g. '+1'
    alt_telephone_number   varchar(30),
    alt_telephone_number_cc varchar(10),
    email                  varchar(200) NOT NULL UNIQUE,
    extension              varchar(20),
    -- audit
    created_by             bigint,
    created_on             timestamptz  NOT NULL DEFAULT now(),
    updated_by             bigint,
    updated_on             timestamptz
);

-- ─────────────────────────────────────────────────────────────────────────────
-- USER_SCREEN  — per-user screen permissions (overrides group-level)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_screen (
    id                      bigserial PRIMARY KEY,
    user_id                 bigint NOT NULL REFERENCES users3(id) ON DELETE CASCADE,
    screen_id               bigint NOT NULL REFERENCES app_screen(id),
    client_id               bigint REFERENCES client(id),
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

-- ─────────────────────────────────────────────────────────────────────────────
-- USER_GROUP  — links users3 to existing "group" table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_group (
    id         bigserial PRIMARY KEY,
    user_id    bigint NOT NULL REFERENCES users3(id) ON DELETE CASCADE,
    group_id   bigint NOT NULL REFERENCES "group"(id) ON DELETE CASCADE,
    client_id  bigint REFERENCES client(id),
    UNIQUE (user_id, group_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users3_email          ON users3(email);
CREATE INDEX IF NOT EXISTS idx_users3_status         ON users3(status);
CREATE INDEX IF NOT EXISTS idx_users3_client_id      ON users3(client_id);
CREATE INDEX IF NOT EXISTS idx_users3_reports_to     ON users3(reports_to);
CREATE INDEX IF NOT EXISTS idx_user_screen_user_id   ON user_screen(user_id);
CREATE INDEX IF NOT EXISTS idx_user_screen_screen_id ON user_screen(screen_id);
CREATE INDEX IF NOT EXISTS idx_user_group_user_id    ON user_group(user_id);
CREATE INDEX IF NOT EXISTS idx_user_group_group_id   ON user_group(group_id);
CREATE INDEX IF NOT EXISTS idx_state_country_code    ON state(country_code);
