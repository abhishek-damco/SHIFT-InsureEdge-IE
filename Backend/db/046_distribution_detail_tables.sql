-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- QA D1-32 / D1-33: Distribution Management view mode showed "Non-resident states could not
-- be loaded." and no saved address/email, because these tables were only ever defined in the
-- EF migration 20260921000000_AddDistributionDetailPersistence — which is never applied (the
-- schema is provisioned from these SQL scripts; see README). Every read returned 500.
--
-- Column names/types match the EF model (InsureEdgeDbContext, snake_case naming).
-- intermediary_contact already exists from 042 with DisburseCloud's column names (email,
-- alt_telephone_number); the EF mapping now points at those columns instead of adding
-- duplicates, so only lengths are widened here to match the EF limits.

CREATE TABLE IF NOT EXISTS intermediary_address (
    id              bigserial     PRIMARY KEY,
    client_id       bigint        NOT NULL,
    intermediary_id bigint        NOT NULL REFERENCES intermediary(id) ON DELETE CASCADE,
    address_line1   varchar(250),
    address_line2   varchar(250),
    country         varchar(100),
    state           varchar(100),
    city            varchar(100),
    county          varchar(100),
    zip_code        varchar(30),
    latitude        varchar(50),
    longitude       varchar(50),
    created_by      bigint,
    created_on      timestamptz   NOT NULL DEFAULT now(),
    updated_by      bigint,
    updated_on      timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_intermediary_address_client_id_intermediary_id
    ON intermediary_address(client_id, intermediary_id);

CREATE TABLE IF NOT EXISTS producer_address (
    id              bigserial     PRIMARY KEY,
    client_id       bigint        NOT NULL,
    producer_id     bigint        NOT NULL REFERENCES producer(id) ON DELETE CASCADE,
    address_line1   varchar(250),
    address_line2   varchar(250),
    country         varchar(100),
    state           varchar(100),
    city            varchar(100),
    county          varchar(100),
    zip_code        varchar(30),
    latitude        varchar(50),
    longitude       varchar(50),
    created_by      bigint,
    created_on      timestamptz   NOT NULL DEFAULT now(),
    updated_by      bigint,
    updated_on      timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_producer_address_client_id_producer_id
    ON producer_address(client_id, producer_id);

CREATE TABLE IF NOT EXISTS intermediary_nr_state (
    id                     bigserial     PRIMARY KEY,
    client_id              bigint        NOT NULL,
    intermediary_id        bigint        NOT NULL REFERENCES intermediary(id) ON DELETE CASCADE,
    state                  varchar(100)  NOT NULL,
    license                varchar(100),
    is_available_in_search boolean       NOT NULL DEFAULT false,
    created_by             bigint,
    created_on             timestamptz   NOT NULL DEFAULT now(),
    updated_by             bigint,
    updated_on             timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_intermediary_nr_state_client_id_intermediary_id_state
    ON intermediary_nr_state(client_id, intermediary_id, state);

CREATE TABLE IF NOT EXISTS producer_nr_state (
    id                     bigserial     PRIMARY KEY,
    client_id              bigint        NOT NULL,
    producer_id            bigint        NOT NULL REFERENCES producer(id) ON DELETE CASCADE,
    state                  varchar(100)  NOT NULL,
    license_number         varchar(100),
    is_available_in_search boolean       NOT NULL DEFAULT false,
    created_by             bigint,
    created_on             timestamptz   NOT NULL DEFAULT now(),
    updated_by             bigint,
    updated_on             timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_producer_nr_state_client_id_producer_id_state
    ON producer_nr_state(client_id, producer_id, state);

-- intermediary_contact (from 042): widen to the EF limits so saves don't fail on length.
ALTER TABLE intermediary_contact ALTER COLUMN name                 TYPE varchar(200);
ALTER TABLE intermediary_contact ALTER COLUMN title                TYPE varchar(200);
ALTER TABLE intermediary_contact ALTER COLUMN email                TYPE varchar(255);
ALTER TABLE intermediary_contact ALTER COLUMN telephone_number     TYPE varchar(50);
ALTER TABLE intermediary_contact ALTER COLUMN alt_telephone_number TYPE varchar(50);
ALTER TABLE intermediary_contact ALTER COLUMN extension            TYPE varchar(30);
