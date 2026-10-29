-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Claims module schema — PostgreSQL 16
-- Source: ClaimsEnquiry.md (PRD) + 04_Claims.md (function catalog)
-- Run AFTER 003_dev_seed.sql

-- ─── Reference / Lookup Tables ────────────────────────────────────────────────

-- Claim initiation channels (BR-CLM-005)
-- Sourced from PRD Section 6: Phone, Email, Mobile App
CREATE TABLE claim_initiation_channel (
    id    smallserial  PRIMARY KEY,
    name  varchar(50)  NOT NULL UNIQUE
);

-- Cause of loss (~68 controlled values from PRD Section 6)
CREATE TABLE cause_of_loss (
    id    serial       PRIMARY KEY,
    name  varchar(200) NOT NULL UNIQUE
);

-- Consequences of loss (from PRD Section 6)
CREATE TABLE consequence_of_loss (
    id    serial       PRIMARY KEY,
    name  varchar(200) NOT NULL UNIQUE
);

-- Coverage types — LOB-dependent (BR-CLM-001)
CREATE TABLE coverage_type (
    id    serial       PRIMARY KEY,
    name  varchar(200) NOT NULL
);

-- Impacted asset descriptions (multi-select per coverage row)
CREATE TABLE impacted_asset (
    id    serial       PRIMARY KEY,
    name  varchar(200) NOT NULL UNIQUE
);

-- ─── Core Policy / Insured (lightweight stubs; real data from policy admin) ───

-- Stub policy table — in InsureEdge the real policies live in the policy admin system.
-- We store a minimal record to anchor FNOL claims; full details fetched via "View Details".
CREATE TABLE policy (
    id              bigserial     PRIMARY KEY,
    policy_number   varchar(100)  NOT NULL,
    insured_name    varchar(300),
    address         varchar(500),
    effective_date  date,
    lob             varchar(100),
    sub_product     varchar(100),
    status          varchar(50)   NOT NULL DEFAULT 'Active',
    client_id       bigint        NOT NULL REFERENCES client(id),
    created_on      timestamptz   NOT NULL DEFAULT now(),
    UNIQUE (policy_number, client_id)
);

CREATE INDEX idx_policy_clientid         ON policy(client_id);
CREATE INDEX idx_policy_number_clientid  ON policy(policy_number, client_id);

-- Insured / Account details (read-only display in FNOL Step 2; sourced from policy admin)
CREATE TABLE insured (
    id                  bigserial    PRIMARY KEY,
    policy_id           bigint       NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    customer_id         varchar(50),
    first_name          varchar(100),
    last_name           varchar(100),
    address_line1       varchar(200),
    address_line2       varchar(200),
    country             varchar(100),
    state               varchar(100),
    city                varchar(100),
    county              varchar(100),
    zip_code            varchar(20),
    telephone           varchar(30),
    telephone_ext       varchar(10),
    alternate_telephone varchar(30),
    email               varchar(255),
    client_id           bigint       NOT NULL REFERENCES client(id)
);

-- Risk location for a policy (read-only in Step 2)
CREATE TABLE risk_location (
    id                      bigserial    PRIMARY KEY,
    policy_id               bigint       NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    property_location       varchar(500),
    latitude                varchar(30),
    longitude               varchar(30),
    occupancy_type          varchar(100),
    construction_type       varchar(100),
    age_of_property         varchar(50),
    length_of_occupancy     varchar(50),
    roof_type               varchar(100),
    fire_protection_class   varchar(50),
    client_id               bigint       NOT NULL REFERENCES client(id)
);

-- ─── Claims ───────────────────────────────────────────────────────────────────

CREATE TABLE claim (
    id                          bigserial     PRIMARY KEY,
    claim_number                varchar(50),                                   -- auto-generated; null until Step 3 Next
    policy_id                   bigint        NOT NULL REFERENCES policy(id),
    risk_location_id            bigint        REFERENCES risk_location(id),
    client_id                   bigint        NOT NULL REFERENCES client(id),
    status                      varchar(30)   NOT NULL DEFAULT 'DRAFT',        -- DRAFT | OPEN | CLOSED | DENIED | APPROVED | PENDING (BR-CLM-001/010)
    last_step_number            smallint      NOT NULL DEFAULT 1,              -- wizard step persistence
    is_claim_reported_by_insured boolean      NOT NULL DEFAULT false,

    -- Reporter contact (auto-populated from policy when reported_by_insured; BR-CLM-007)
    reporter_first_name         varchar(100),
    reporter_last_name          varchar(100),
    reporter_relationship       varchar(100),
    reporter_telephone          varchar(30),
    reporter_telephone_cc       varchar(10),
    reporter_email              varchar(255),

    -- Loss details (Step 3)
    date_of_loss                date,
    time_of_loss                time,
    claim_initiation_channel    varchar(50),
    claim_type                  varchar(100),
    main_cause_of_loss          varchar(200),
    consequences_of_loss        varchar(200),
    inspection_required         boolean       NOT NULL DEFAULT false,
    claim_reimbursement_type    varchar(100),
    catastrophic_event          varchar(200),
    loss_description            text,
    list_of_damage_first_party  text,
    physical_damage             boolean,
    claim_only_third_party      boolean,
    is_third_party_damage       boolean       NOT NULL DEFAULT false,

    -- Loss location (Step 3 — can differ from risk location; manual override)
    loss_address_line1          varchar(200),
    loss_address_line2          varchar(200),
    loss_country                varchar(100),
    loss_state                  varchar(100),
    loss_city                   varchar(100),
    loss_county                 varchar(100),
    loss_zip_code               varchar(20),
    loss_latitude               varchar(30),
    loss_longitude              varchar(30),

    -- Step 4
    claim_estimate              varchar(50),                                   -- stored as string (BR-CLM-004)
    comment                     text,
    claim_closure_date          date,                                          -- BR-CLM-017: set by close operation only

    -- Assignment
    assigned_to                 bigint        REFERENCES "user"(id),
    adjuster_id                 bigint,                                        -- external adjuster; not FK (BR-CLM-009)

    -- Audit
    created_by                  bigint        REFERENCES "user"(id),
    created_on                  timestamptz   NOT NULL DEFAULT now(),
    updated_by                  bigint        REFERENCES "user"(id),
    updated_on                  timestamptz
);

CREATE INDEX idx_claim_clientid_status   ON claim(client_id, status);
CREATE INDEX idx_claim_policyid          ON claim(policy_id);
CREATE INDEX idx_claim_number            ON claim(claim_number);
CREATE INDEX idx_claim_createdon         ON claim(created_on DESC);

-- ─── Coverage Rows (one-to-many per claim; Step 3 grid) ───────────────────────
CREATE TABLE claim_coverage (
    id                  bigserial     PRIMARY KEY,
    claim_id            bigint        NOT NULL REFERENCES claim(id) ON DELETE CASCADE,
    coverage            varchar(200),
    cause_of_loss       varchar(200),
    client_id           bigint        NOT NULL REFERENCES client(id)
);

CREATE INDEX idx_claimcoverage_claimid ON claim_coverage(claim_id);

-- Impacted assets per coverage row (multi-select; BR-CLM-003)
CREATE TABLE claim_coverage_asset (
    id                  bigserial    PRIMARY KEY,
    claim_coverage_id   bigint       NOT NULL REFERENCES claim_coverage(id) ON DELETE CASCADE,
    asset_name          varchar(200) NOT NULL
);

-- ─── Third-Party Claimants (conditional; Step 3) ─────────────────────────────
CREATE TABLE claimant (
    id                      bigserial     PRIMARY KEY,
    claim_id                bigint        NOT NULL REFERENCES claim(id) ON DELETE CASCADE,
    client_id               bigint        NOT NULL REFERENCES client(id),
    party_type              varchar(20)   NOT NULL DEFAULT 'Individual',   -- Individual | Business
    first_name              varchar(100),
    middle_name             varchar(100),
    last_name               varchar(100),
    relationship_with_insured varchar(100),
    telephone               varchar(30),
    telephone_cc            varchar(10),
    alternate_telephone     varchar(30),
    email                   varchar(255),
    address_line1           varchar(200),
    address_line2           varchar(200),
    country                 varchar(100),
    state                   varchar(100),
    city                    varchar(100),
    county                  varchar(100),
    zip_code                varchar(20),
    latitude                varchar(30),
    longitude               varchar(30),
    list_of_damages         text,
    created_on              timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_claimant_claimid ON claimant(claim_id);

-- ─── Claim Documents (Step 4 attachments) ─────────────────────────────────────
-- Binary content stored as bytea; not returned in list queries (BR-CLM-011)
CREATE TABLE claim_document (
    id              bigserial     PRIMARY KEY,
    claim_id        bigint        NOT NULL REFERENCES claim(id) ON DELETE CASCADE,
    client_id       bigint        NOT NULL REFERENCES client(id),
    file_name       varchar(255)  NOT NULL,
    content_type    varchar(100),
    file_size       bigint,
    document_file   bytea,                   -- BR-CLM-011: not returned in list mode
    notify_to       bigint        REFERENCES "user"(id),
    created_by      bigint        REFERENCES "user"(id),
    created_on      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_claimdoc_claimid ON claim_document(claim_id);

-- ─── Activity Log (audit trail per claim) ─────────────────────────────────────
CREATE TABLE claim_activity_log (
    id          bigserial     PRIMARY KEY,
    claim_id    bigint        NOT NULL REFERENCES claim(id) ON DELETE CASCADE,
    client_id   bigint        NOT NULL REFERENCES client(id),
    action      varchar(200)  NOT NULL,
    performed_by bigint       REFERENCES "user"(id),
    performed_on timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_claimlog_claimid ON claim_activity_log(claim_id);
