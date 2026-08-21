-- User extended profile table for My Profile screen
-- Stores extended user information (middle name, date of birth, gender, bio, etc)
-- LEFT JOINed from base "user" table in profile queries

CREATE TABLE IF NOT EXISTS user_extended (
    id              bigserial    PRIMARY KEY,
    user_id         bigint       NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    user_code       varchar(50),
    status          varchar(50),
    first_name      varchar(100),
    middle_name     varchar(100),
    last_name       varchar(100),
    date_of_birth   date,
    gender          varchar(20),
    bio             text,
    created_on      timestamptz  NOT NULL DEFAULT now(),
    updated_on      timestamptz
);

CREATE INDEX IF NOT EXISTS idx_user_extended_user_id ON user_extended(user_id);
