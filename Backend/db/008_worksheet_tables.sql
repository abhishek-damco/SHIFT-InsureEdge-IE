-- Financial Worksheet tables
CREATE SEQUENCE IF NOT EXISTS ws_number_seq START 142 INCREMENT 1;

CREATE TABLE IF NOT EXISTS claim_worksheet (
    id             bigserial    PRIMARY KEY,
    claim_id       bigint       NOT NULL REFERENCES claim(id) ON DELETE CASCADE,
    client_id      bigint       NOT NULL REFERENCES client(id),
    ws_number      varchar(30)  NOT NULL,
    status         varchar(20)  NOT NULL DEFAULT 'Open',
    close_manually boolean      NOT NULL DEFAULT false,
    comments       text,
    approved_by    bigint       REFERENCES "user"(id),
    escalated_to   bigint       REFERENCES "user"(id),
    created_by     bigint       REFERENCES "user"(id),
    created_on     timestamptz  NOT NULL DEFAULT now(),
    updated_by     bigint       REFERENCES "user"(id),
    updated_on     timestamptz
);
CREATE INDEX IF NOT EXISTS idx_ws_claim_client ON claim_worksheet(claim_id, client_id);

CREATE TABLE IF NOT EXISTS worksheet_reserve (
    id                           bigserial      PRIMARY KEY,
    worksheet_id                 bigint         NOT NULL REFERENCES claim_worksheet(id) ON DELETE CASCADE,
    client_id                    bigint         NOT NULL REFERENCES client(id),
    coverage                     varchar(200),
    coverage_limit               numeric(18,2),
    cause_of_loss_description    varchar(200),
    cause_of_loss_code           varchar(50),
    cause_of_loss_limit          numeric(18,2),
    liability_claim_description  varchar(200),
    liability_claim_code         varchar(50),
    liability_limit              numeric(18,2),
    superseding_limit            numeric(18,2),
    reserve_amount               numeric(18,2)  NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_wsreserve_ws ON worksheet_reserve(worksheet_id);

CREATE TABLE IF NOT EXISTS worksheet_payment (
    id                          bigserial      PRIMARY KEY,
    worksheet_id                bigint         NOT NULL REFERENCES claim_worksheet(id) ON DELETE CASCADE,
    client_id                   bigint         NOT NULL REFERENCES client(id),
    coverage                    varchar(200),
    cause_of_loss_description   varchar(200),
    payee_type                  varchar(100),
    payee_name                  varchar(200),
    liability_claim             varchar(200),
    payment_amount              numeric(18,2)  NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_wspayment_ws ON worksheet_payment(worksheet_id);

-- Seed one open worksheet for claim 1
INSERT INTO claim_worksheet (claim_id, client_id, ws_number, status, created_by, created_on)
VALUES (1, 1, lpad(nextval('ws_number_seq')::text, 9, '0'), 'Open', 1, now())
ON CONFLICT DO NOTHING;
