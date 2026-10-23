-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Client Management QA fixes (CM-05, CM-08, CM-12):
--   * client_contact can now hold Secondary Contact 1, 2, … alongside the Primary contact
--   * client_office_contact holds an office's secondary contacts (primary stays on client_office)
--   * client_address.is_same_as_legal remembers the Mailing "Same as Home Office" checkbox

ALTER TABLE client_contact
    ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

DROP INDEX IF EXISTS uix_client_contact_type;
CREATE UNIQUE INDEX IF NOT EXISTS uix_client_contact_type_order
    ON client_contact(client_id, contact_type, sort_order);

CREATE TABLE IF NOT EXISTS client_office_contact (
    id                      bigserial PRIMARY KEY,
    office_id               bigint NOT NULL REFERENCES client_office(id) ON DELETE CASCADE,
    sort_order              int NOT NULL DEFAULT 0,
    name                    varchar(150),
    suffix                  varchar(10),
    title                   varchar(50),
    email_id                varchar(255),
    telephone_number        varchar(30),
    telephone_number_cc     varchar(10),
    extension               int,
    alt_telephone_number    varchar(30),
    alt_telephone_number_cc varchar(10)
);
CREATE INDEX IF NOT EXISTS ix_client_office_contact_office ON client_office_contact(office_id);

ALTER TABLE client_address
    ADD COLUMN IF NOT EXISTS is_same_as_legal boolean NOT NULL DEFAULT false;
