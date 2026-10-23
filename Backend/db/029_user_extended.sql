-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- My Profile / My Producer (AuthController.GetMyProfile/UpdateMyProfile) expects a
-- "user_extended" table joined via user_extended.user_id -> "user".id, with
-- user_extended.id itself equal to "user".id (its own code comment: "UsersController/
-- user_screen/group_user... all key off user_extended.id, not user.id"). No migration
-- for this table existed anywhere in this repo — the endpoints that reference it would
-- 500 with "relation does not exist" until this is applied. id is NOT a generated
-- sequence: it's set explicitly to match "user".id (both in the backfill below and in
-- any future insert), which is what makes user_extended.id usable everywhere group_user/
-- user_screen currently join on "user".id today (they are NOT changed by this migration —
-- see note at the bottom).
-- User Management profile fields are completed by 036_user_management_schema.sql.
-- This migration only establishes the one-to-one table and backfills columns that are
-- guaranteed to exist on the base authentication table.
CREATE TABLE IF NOT EXISTS user_extended (
    id             bigint       PRIMARY KEY,
    user_id        bigint       NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    user_code      varchar(50),
    status         varchar(20),
    first_name     varchar(100),
    middle_name    varchar(100),
    last_name      varchar(100),
    date_of_birth  date,
    gender         varchar(20),
    bio            text,
    created_on     timestamptz  NOT NULL DEFAULT now(),
    updated_on     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_userextended_userid ON user_extended(user_id);

-- Backfill one user_extended row per existing "user" row, id = user_id, so
-- LEFT JOIN user_extended ue ON ue.user_id = u.id never misses an existing user, and
-- ue.id is immediately usable as a "user".id-equivalent for any future consumer.
INSERT INTO user_extended (id, user_id, status, first_name, last_name)
SELECT u.id, u.id,
       CASE WHEN u.is_active THEN 'Active' ELSE 'Inactive' END,
       u.first_name, u.last_name
FROM "user" u
ON CONFLICT (id) DO NOTHING;

-- NOTE: group_user.user_id and user_screen.user_id both have real FK constraints to
-- "user"(id) today (confirmed against the live schema) — NOT to user_extended, despite
-- AuthController.cs's LoadMyProfileAsync joining "group_user gu ON gu.user_id = ue.id".
-- Because this migration makes user_extended.id == "user".id for every row, that join
-- still returns the correct group membership as a side effect, without requiring any
-- change to group_user/user_screen's actual foreign keys. Re-pointing those FKs to
-- user_extended.id instead is a separate, larger decision — out of scope here.
