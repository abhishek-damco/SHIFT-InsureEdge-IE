-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- My Profile screen (header "View Profile"): last-login timestamp (set on every
-- successful login) and password-last-changed timestamp (set on account creation
-- and every successful password change/reset confirm).
-- Run AFTER 015_drop_endorsement_workflow.sql

ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS last_login_on timestamptz,
    ADD COLUMN IF NOT EXISTS password_updated_on timestamptz;

-- Backfill existing rows so the Security tab has a value instead of blank.
UPDATE "user" SET password_updated_on = created_on WHERE password_updated_on IS NULL;
