-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- DisburseCloud commission-disbursement support — ported from OutSystems
-- "IntermediaryContact" / "IntermediaryProducerAddress" entities, used by
-- IntermediaryCommissionDisburseCloud (GetIntermediariesByClientId join).

CREATE TABLE IF NOT EXISTS intermediary_contact (
    id                          bigserial     PRIMARY KEY,
    client_id                   bigint        NOT NULL REFERENCES client(id),
    intermediary_id             bigint        NOT NULL REFERENCES intermediary(id) ON DELETE CASCADE,
    name                        varchar(100),
    title                       varchar(50),
    telephone_number_cc         varchar(10),
    telephone_number            varchar(20),
    alt_telephone_number_cc     varchar(10),
    alt_telephone_number        varchar(20),
    email                       varchar(100),
    is_primary                  boolean       NOT NULL DEFAULT false,
    extension                   varchar(10),
    suffix                      varchar(10),
    created_by                  bigint        REFERENCES "user"(id),
    created_on                  timestamptz   NOT NULL DEFAULT now(),
    updated_by                  bigint        REFERENCES "user"(id),
    updated_on                  timestamptz
);
CREATE INDEX IF NOT EXISTS idx_intermediarycontact_intermediaryid ON intermediary_contact(intermediary_id);
CREATE INDEX IF NOT EXISTS idx_intermediarycontact_clientid ON intermediary_contact(client_id);

CREATE TABLE IF NOT EXISTS intermediary_producer_address (
    id                          bigserial     PRIMARY KEY,
    client_id                   bigint        NOT NULL REFERENCES client(id),
    intermediary_id             bigint        NOT NULL REFERENCES intermediary(id) ON DELETE CASCADE,
    producer_id                 bigint        REFERENCES producer(id),
    address_line1               varchar(200),
    address_line2               varchar(200),
    country                     varchar(50),
    state                       varchar(50),
    city                        varchar(100),
    zip_code                    varchar(20),
    latitude                    varchar(50),
    longitude                   varchar(50),
    county                      varchar(100),
    is_same_as_intermediary     boolean,
    is_manual                   boolean,
    created_by                  bigint        REFERENCES "user"(id),
    created_on                  timestamptz   NOT NULL DEFAULT now(),
    updated_by                  bigint        REFERENCES "user"(id),
    updated_on                  timestamptz
);
CREATE INDEX IF NOT EXISTS idx_ipaddress_intermediaryid ON intermediary_producer_address(intermediary_id);
CREATE INDEX IF NOT EXISTS idx_ipaddress_producerid ON intermediary_producer_address(producer_id);
CREATE INDEX IF NOT EXISTS idx_ipaddress_clientid ON intermediary_producer_address(client_id);
