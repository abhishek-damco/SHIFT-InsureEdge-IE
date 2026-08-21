-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Bulk Upload (Quotes & Policies module) — audit/history table.
-- Run AFTER 010_quotes_policies_schema.sql / 011_quotes_policies_lifecycle_columns.sql.
--
-- Tracks each bulk-upload attempt (file, module, progress, status) so the UI's
-- "Previously Uploaded Files" table can render history and offer an error-file
-- download for rows that failed validation/creation.

CREATE TABLE IF NOT EXISTS bulk_upload_audit (
    id                bigserial     PRIMARY KEY,
    client_id         bigint        NOT NULL REFERENCES client(id),
    module            varchar(50)   NOT NULL,
    file_name         varchar(500)  NOT NULL,
    total_records     integer       NOT NULL DEFAULT 0,
    processed_records integer       NOT NULL DEFAULT 0,
    status            varchar(20)   NOT NULL DEFAULT 'Processing',
    error_file        bytea         NULL,
    created_by        bigint        REFERENCES "user"(id),
    created_on        timestamptz   NOT NULL DEFAULT now(),
    updated_on        timestamptz
);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_audit_clientid ON bulk_upload_audit(client_id);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_audit_module ON bulk_upload_audit(module);
