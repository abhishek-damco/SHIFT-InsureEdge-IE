-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Policy Summary "Notes" tab — ported from OutSystems "Notes2" + "NoteFile" entities.
-- Run AFTER 012_policy_transactions.sql (references policy(id)).

CREATE TABLE IF NOT EXISTS note (
    id                              bigserial     PRIMARY KEY,
    client_id                       bigint        NOT NULL REFERENCES client(id),
    notes_text                      text          NOT NULL,
    note_display_text               varchar(500),
    access_type                     varchar(20)   NOT NULL DEFAULT 'Internal', -- Diary | Internal | External
    account_id                      bigint        REFERENCES account(id) ON DELETE SET NULL,
    policy_id                       bigint        REFERENCES policy(id) ON DELETE CASCADE,
    module                          varchar(50)   NOT NULL DEFAULT 'Policy',
    total_number_of_attachments     integer       NOT NULL DEFAULT 0,
    created_by                      bigint        REFERENCES "user"(id),
    created_on                      timestamptz   NOT NULL DEFAULT now(),
    updated_by                      bigint        REFERENCES "user"(id),
    updated_on                      timestamptz,
    created_for                     bigint        REFERENCES "user"(id)
);
CREATE INDEX IF NOT EXISTS idx_note_clientid  ON note(client_id);
CREATE INDEX IF NOT EXISTS idx_note_policyid  ON note(policy_id);
CREATE INDEX IF NOT EXISTS idx_note_accountid ON note(account_id);

CREATE TABLE IF NOT EXISTS note_file (
    id          bigserial     PRIMARY KEY,
    client_id   bigint        NOT NULL REFERENCES client(id),
    notes_id    bigint        NOT NULL REFERENCES note(id) ON DELETE CASCADE,
    file_name   varchar(255)  NOT NULL,
    file_type   varchar(100),
    file_data   bytea         NOT NULL,
    module      varchar(50)   NOT NULL DEFAULT 'Policy',
    created_by  bigint        REFERENCES "user"(id),
    created_on  timestamptz   NOT NULL DEFAULT now(),
    updated_by  bigint        REFERENCES "user"(id),
    updated_on  timestamptz
);
CREATE INDEX IF NOT EXISTS idx_notefile_notesid ON note_file(notes_id);
