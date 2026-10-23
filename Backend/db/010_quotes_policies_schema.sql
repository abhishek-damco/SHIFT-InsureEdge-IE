-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Quotes & Policies (Underwriting) module schema — PostgreSQL 16
-- Source: prototype schema.sql (Node.js server.js) — ported to InsureEdge conventions.
-- Run AFTER 009_client_management_tables.sql
--
-- Reuses EXISTING tables (does not redefine):
--   policy                (004_claims_schema.sql) — extended below with underwriting columns
--   insured                (004_claims_schema.sql)
--   insurance_product       (002_seed_modules_screens.sql) — LOB (Auto, Homeowners, ...)
--   insurance_sub_product   (009_client_management_tables.sql) — FK -> insurance_product
--   client, "user", "group", screen_permissions, app_screen, module — unchanged
--
-- Net-new tables (from prototype, adapted to snake_case / bigserial / client_id / audit cols):
--   account, intermediary, producer, policy_extended, policy_product, policy_limit_coverage,
--   policy_premium, policy_payment_transaction, policy_accounts, policy_commission,
--   commission_payment_transaction, policy_mortgage, policy_document, policy_risk_information,
--   risk_address, additional_insured, additional_organisation, hb_rater_state_tax_sheet,
--   submissions

-- ─── Extend existing "policy" table with underwriting columns ─────────────────
ALTER TABLE policy
    ADD COLUMN IF NOT EXISTS quote_number            varchar(50),
    ADD COLUMN IF NOT EXISTS intermediary_id          bigint,
    ADD COLUMN IF NOT EXISTS producer_id              bigint,
    ADD COLUMN IF NOT EXISTS account_id               bigint,
    ADD COLUMN IF NOT EXISTS policy_stage             varchar(50),
    ADD COLUMN IF NOT EXISTS policy_term              varchar(50),
    ADD COLUMN IF NOT EXISTS approval_status          varchar(50),
    ADD COLUMN IF NOT EXISTS lock_submission          boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS last_step                numeric(4,1),
    ADD COLUMN IF NOT EXISTS do_not_renew             boolean,
    ADD COLUMN IF NOT EXISTS policy_issued_on         timestamptz,
    ADD COLUMN IF NOT EXISTS locked_submission_date   date,
    ADD COLUMN IF NOT EXISTS writing_company          varchar(50),
    ADD COLUMN IF NOT EXISTS insurance_type           varchar(50),
    ADD COLUMN IF NOT EXISTS country                  varchar(50),
    ADD COLUMN IF NOT EXISTS state_province           varchar(50),
    ADD COLUMN IF NOT EXISTS is_single_policy         boolean,
    ADD COLUMN IF NOT EXISTS is_quick_quote           boolean,
    ADD COLUMN IF NOT EXISTS quote_creation_date      date;

-- ─── Distribution: Intermediary / Producer ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS intermediary (
    id                              bigserial     PRIMARY KEY,
    client_id                       bigint        NOT NULL REFERENCES client(id),
    intermediary_code               varchar(10)   NOT NULL,
    status                          varchar(10)   NOT NULL DEFAULT 'Active',
    intermediary_name               varchar(50)   NOT NULL,
    doing_business_as               varchar(50),
    legal_entity                    varchar(50)   NOT NULL DEFAULT 'LLC',
    federal_tax_id                  varchar(10),
    type_of_intermediary            varchar(50),
    country                         varchar(50),
    residential_state               varchar(50),
    license                         varchar(10),
    other_description               varchar(500),
    allow_full_producer_visibility  boolean,
    last_step                       integer,
    commission_disburse_email       varchar(100),
    status_toggle                   boolean,
    created_by                      bigint        REFERENCES "user"(id),
    created_on                      timestamptz   NOT NULL DEFAULT now(),
    updated_by                      bigint        REFERENCES "user"(id),
    updated_on                      timestamptz,
    CONSTRAINT uq_intermediary_code UNIQUE (client_id, intermediary_code)
);
CREATE INDEX IF NOT EXISTS idx_intermediary_clientid ON intermediary(client_id);

CREATE TABLE IF NOT EXISTS producer (
    id                       bigserial     PRIMARY KEY,
    client_id                bigint        NOT NULL REFERENCES client(id),
    intermediary_id          bigint        NOT NULL REFERENCES intermediary(id) ON DELETE CASCADE,
    producer_code            varchar(10)   NOT NULL DEFAULT 'PC001',
    status                   varchar(10)   NOT NULL DEFAULT 'Active',
    status_toggle            boolean,
    first_name               varchar(50)   NOT NULL,
    middle_name              varchar(50),
    last_name                varchar(50)   NOT NULL,
    pc_license_requirement   varchar(10),
    country                  varchar(50),
    residential_state        varchar(50),
    pl_license               varchar(10),
    cl_license               varchar(10),
    plcl_combined_license    varchar(10),
    telephone_number_cc      varchar(10)   NOT NULL DEFAULT '+1',
    telephone_number         varchar(20)   NOT NULL DEFAULT '0000000000',
    alt_telephone_number_cc  varchar(10),
    alt_telephone_number     varchar(20),
    email                    varchar(50),
    is_manager               boolean,
    manager_id               bigint REFERENCES producer(id),
    extension                integer,
    suffix                   varchar(4),
    gender                   varchar(50),
    personal_bio             varchar(1000),
    date_of_birth            date,
    created_by               bigint        REFERENCES "user"(id),
    created_on               timestamptz   NOT NULL DEFAULT now(),
    updated_by               bigint        REFERENCES "user"(id),
    updated_on               timestamptz
);
CREATE INDEX IF NOT EXISTS idx_producer_clientid ON producer(client_id);
CREATE INDEX IF NOT EXISTS idx_producer_intermediaryid ON producer(intermediary_id);

-- Add FKs on policy now that intermediary/producer exist
ALTER TABLE policy
    ADD CONSTRAINT fk_policy_intermediary FOREIGN KEY (intermediary_id) REFERENCES intermediary(id),
    ADD CONSTRAINT fk_policy_producer     FOREIGN KEY (producer_id)     REFERENCES producer(id);

-- ─── Account (policyholder / prospect) ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS account (
    id                      bigserial     PRIMARY KEY,
    client_id                bigint        NOT NULL REFERENCES client(id),
    account_code             varchar(50),
    status                   varchar(10),
    account_type             varchar(50),
    first_name               varchar(50),
    middle_name              varchar(50),
    last_name                varchar(50),
    date_of_birth            date,
    gender                   varchar(50),
    producer_type            varchar(50),
    intermediary_id          bigint        REFERENCES intermediary(id),
    producer_id              bigint        REFERENCES producer(id),
    legal_business_name      varchar(75),
    doing_business_as        varchar(50),
    legal_entity_type        varchar(50),
    date_business_started    date,
    industry_type            varchar(50),
    is_draft                 boolean,
    suffix                   varchar(4),
    created_by               bigint        REFERENCES "user"(id),
    created_on               timestamptz   NOT NULL DEFAULT now(),
    updated_by               bigint        REFERENCES "user"(id),
    updated_on               timestamptz
);
CREATE INDEX IF NOT EXISTS idx_account_clientid ON account(client_id);

-- FK now that account exists
ALTER TABLE policy
    ADD CONSTRAINT fk_policy_account FOREIGN KEY (account_id) REFERENCES account(id);

CREATE TABLE IF NOT EXISTS policy_accounts (
    id          bigserial   PRIMARY KEY,
    client_id   bigint      NOT NULL REFERENCES client(id),
    account_id  bigint      NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    policy_id   bigint      NOT NULL REFERENCES policy(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_policyaccounts_clientid ON policy_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_policyaccounts_policyid ON policy_accounts(policy_id);

-- ─── Policy extended detail (endorsement/cancellation/rewrite/renewal metadata) ─

CREATE TABLE IF NOT EXISTS policy_extended (
    policy_id                       bigint        PRIMARY KEY REFERENCES policy(id) ON DELETE CASCADE,
    client_id                       bigint        NOT NULL REFERENCES client(id),
    primary_insured_type            varchar(100),
    internal_reason                 varchar(50),
    explaination_of_letter          varchar(1000),
    cancellation_effective_date     date,
    proration_basis                 varchar(50),
    requested_by                    varchar(50),
    reason_of_cancellation          varchar(500),
    other_reason                    varchar(1000),
    adjust_commissions              boolean,
    comments                        varchar(1000),
    prior_policy_id                 bigint        REFERENCES policy(id),
    renewal_offer_date               date,
    declined_reason                 varchar(100),
    declined_reason_description     varchar(1000),
    endorsement_effective_date      date,
    rewrite_effective_date          date,
    reason_for_rewriting_policy     varchar(500),
    rewrite_other_reason            varchar(500),
    is_premium_bearing_endorsement  boolean,
    created_by                      bigint        REFERENCES "user"(id),
    created_on                      timestamptz   NOT NULL DEFAULT now(),
    updated_by                      bigint        REFERENCES "user"(id),
    updated_on                      timestamptz
);
CREATE INDEX IF NOT EXISTS idx_policyextended_clientid ON policy_extended(client_id);

-- ─── Policy product / LOB association ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS policy_product (
    id              bigserial   PRIMARY KEY,
    client_id       bigint      NOT NULL REFERENCES client(id),
    policy_id       bigint      NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    product_id      bigint      REFERENCES insurance_product(id),
    sub_product_id  bigint      REFERENCES insurance_sub_product(id),
    state           varchar(50)
);
CREATE INDEX IF NOT EXISTS idx_policyproduct_clientid ON policy_product(client_id);
CREATE INDEX IF NOT EXISTS idx_policyproduct_policyid ON policy_product(policy_id);

-- ─── Coverage / limits (HO rater form fields — wide table, kept flat per source) ─

CREATE TABLE IF NOT EXISTS policy_limit_coverage (
    id                                              bigserial     PRIMARY KEY,
    client_id                                       bigint        NOT NULL REFERENCES client(id),
    policy_id                                       bigint        NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    dwelling_asset_limit                            numeric(18,2),
    appurtenant_structure_asset                     numeric(18,2),
    personal_belongings_asset                       numeric(18,2),
    dwelling_occupancy                              numeric(18,2),
    calculated_premium                              numeric(18,2),
    tiv                                             numeric(18,2),
    physical_damage_deductible                      numeric(18,2),
    coverage_level                                  varchar(50),
    liability_coverage                              varchar(50),
    excess_blanket_pl                               varchar(50),
    covered_liability_sir                           varchar(50),
    sinkhole_catastrophic_ground_collapse           varchar(50),
    earthquake                                      varchar(50),
    flood                                           varchar(50),
    wind_hail                                       varchar(50),
    wild_fire                                       varchar(50),
    resident_worker_nfm                             varchar(50),
    small_scale_farming_endorsement                 varchar(50),
    landlord_endorsement                            varchar(50),
    home_office_endorsement                         varchar(50),
    prior_policy_period_premium                     numeric(18,2),
    rate_modification                               numeric(18,3),
    excess_blanket_pl_value                         numeric(18,2),
    sinkhole_catastrophic_ground_collapse_value     numeric(18,2),
    earthquake_value                                numeric(18,2),
    flood_value                                     numeric(18,2),
    wind_hail_value                                 numeric(18,2),
    wild_fire_value                                 numeric(18,2),
    resident_worker_nfm_value                       numeric(18,2),
    small_scale_farming_endorsement_value           numeric(18,2),
    landlord_endorsement_value                      numeric(18,2),
    home_office_endorsement_value                   numeric(18,2),
    base_premium                                    numeric(18,2),
    total_premium_with_fee                          numeric(18,2),
    total_premium_without_rate_modification         numeric(18,2),
    created_by                                      bigint        REFERENCES "user"(id),
    created_on                                      timestamptz   NOT NULL DEFAULT now(),
    updated_by                                      bigint        REFERENCES "user"(id),
    updated_on                                      timestamptz
);
CREATE INDEX IF NOT EXISTS idx_policylimitcoverage_clientid ON policy_limit_coverage(client_id);
CREATE INDEX IF NOT EXISTS idx_policylimitcoverage_policyid ON policy_limit_coverage(policy_id);

-- ─── Premium / Billing ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS policy_premium (
    id                                      bigserial     PRIMARY KEY,
    client_id                               bigint        NOT NULL REFERENCES client(id),
    policy_id                               bigint        NOT NULL UNIQUE REFERENCES policy(id) ON DELETE CASCADE,
    payment_frequency                       varchar(50)   NOT NULL DEFAULT 'MONTHLY',
    responsible_party                       varchar(50)   NOT NULL DEFAULT 'INSURED',
    number_of_installments                  integer       NOT NULL DEFAULT 12,
    total_installment_fee                   numeric(18,2) NOT NULL DEFAULT 0,
    stamping_fee                            numeric(18,2),
    policy_fees                             numeric(18,2) NOT NULL DEFAULT 0,
    is_policy_fully_paid                    boolean       NOT NULL DEFAULT false,
    is_payment_required_to_bind             boolean,
    first_payment_date                      date,
    total_tax                               numeric(18,2),
    total_premium_without_installment_fee   numeric(18,2) NOT NULL DEFAULT 0,
    total_premium_with_installment_fee      numeric(18,2) NOT NULL DEFAULT 0,
    mode_of_payment_to_use                  varchar(20),
    is_cancelled                            boolean,
    cancelled_on                            date,
    total_coverage_premium                  numeric(18,2),
    created_by                              bigint        REFERENCES "user"(id),
    created_on                              timestamptz   NOT NULL DEFAULT now(),
    updated_by                              bigint        REFERENCES "user"(id),
    updated_on                              timestamptz
);
CREATE INDEX IF NOT EXISTS idx_policypremium_clientid ON policy_premium(client_id);
CREATE INDEX IF NOT EXISTS idx_policypremium_policyid ON policy_premium(policy_id);

CREATE TABLE IF NOT EXISTS policy_payment_transaction (
    id                        bigserial     PRIMARY KEY,
    client_id                 bigint        NOT NULL REFERENCES client(id),
    policy_premium_id         bigint        NOT NULL REFERENCES policy_premium(id) ON DELETE CASCADE,
    amount_due                numeric(18,2) NOT NULL,
    invoice_date              date          NOT NULL,
    due_date                  date          NOT NULL,
    transaction_payment_date  date,
    is_paid                   boolean,
    transaction_status        varchar(50),
    transaction_id            varchar(50),
    customer_reference_id     varchar(50),
    payment_method            varchar(50),
    response_code             varchar(50),
    response_json             varchar(2000),
    cancelled_on              date,
    created_by                bigint        REFERENCES "user"(id),
    created_on                timestamptz   NOT NULL DEFAULT now(),
    updated_by                bigint        REFERENCES "user"(id),
    updated_on                timestamptz
);
CREATE INDEX IF NOT EXISTS idx_policypaytxn_clientid ON policy_payment_transaction(client_id);
CREATE INDEX IF NOT EXISTS idx_policypaytxn_premiumid ON policy_payment_transaction(policy_premium_id);

-- ─── Commission ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS policy_commission (
    id                       bigserial     PRIMARY KEY,
    client_id                bigint        NOT NULL REFERENCES client(id),
    policy_id                bigint        NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    intermediary_id          bigint        NOT NULL REFERENCES intermediary(id),
    producer_id              bigint        REFERENCES producer(id),
    commission_percentage    numeric(18,2),
    installment_commission   numeric(18,2),
    annual_commission        numeric(18,2),
    total_coverage_premium   numeric(18,2),
    is_cancelled             boolean,
    cancelled_on             date,
    payment_frequency        varchar(50)   NOT NULL DEFAULT 'MONTHLY',
    number_of_installments   integer       NOT NULL DEFAULT 12,
    created_by               bigint        REFERENCES "user"(id),
    created_on               timestamptz   NOT NULL DEFAULT now(),
    updated_by               bigint        REFERENCES "user"(id),
    updated_on                timestamptz
);
CREATE INDEX IF NOT EXISTS idx_policycommission_clientid ON policy_commission(client_id);
CREATE INDEX IF NOT EXISTS idx_policycommission_policyid ON policy_commission(policy_id);

CREATE TABLE IF NOT EXISTS commission_payment_transaction (
    id                       bigserial     PRIMARY KEY,
    client_id                bigint        NOT NULL REFERENCES client(id),
    policy_commission_id     bigint        NOT NULL REFERENCES policy_commission(id) ON DELETE CASCADE,
    commission_amount_due    numeric(18,2) NOT NULL,
    invoice_date             date          NOT NULL,
    due_date                 date          NOT NULL,
    transaction_payment_date date,
    is_paid                  boolean,
    transaction_status       varchar(50),
    transaction_id           varchar(50),
    customer_reference_id    varchar(50),
    payment_method           varchar(50),
    response_code            varchar(50),
    response_json            varchar(2000),
    cancelled_on             date,
    created_by               bigint        REFERENCES "user"(id),
    created_on               timestamptz   NOT NULL DEFAULT now(),
    updated_by               bigint        REFERENCES "user"(id),
    updated_on               timestamptz
);
CREATE INDEX IF NOT EXISTS idx_commissionpaytxn_clientid ON commission_payment_transaction(client_id);
CREATE INDEX IF NOT EXISTS idx_commissionpaytxn_commissionid ON commission_payment_transaction(policy_commission_id);

-- ─── Mortgage / Lienholder ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS policy_mortgage (
    id                        bigserial     PRIMARY KEY,
    client_id                 bigint        NOT NULL REFERENCES client(id),
    policy_id                 bigint        NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    mortgage_name             varchar(100),
    loan_number               varchar(50),
    mortgage_service_company  varchar(100),
    telephone_number          varchar(50),
    telephone_number_cc       varchar(10),
    extension                 varchar(50),
    alt_telephone_number      varchar(50),
    alt_telephone_number_cc   varchar(10),
    email_id                  varchar(50),
    google_address            varchar(200),
    address_line1             varchar(500),
    address_line2             varchar(500),
    country                   varchar(50),
    state                     varchar(50),
    city                      varchar(50),
    zip_code                  varchar(50),
    latitude                  varchar(50),
    longitude                 varchar(50),
    county                    varchar(50),
    is_manual                 boolean,
    lender_type               varchar(50),
    loan_type                 varchar(50),
    covered_asset             varchar(50),
    is_newly_added            boolean,
    is_edited                 boolean,
    is_deleted                boolean,
    record_number             integer,
    created_by                bigint        REFERENCES "user"(id),
    created_on                timestamptz   NOT NULL DEFAULT now(),
    updated_by                bigint        REFERENCES "user"(id),
    updated_on                timestamptz
);
CREATE INDEX IF NOT EXISTS idx_policymortgage_clientid ON policy_mortgage(client_id);
CREATE INDEX IF NOT EXISTS idx_policymortgage_policyid ON policy_mortgage(policy_id);

-- ─── Policy documents ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS policy_document (
    id                   bigserial     PRIMARY KEY,
    client_id            bigint        NOT NULL REFERENCES client(id),
    policy_id            bigint        NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    blob_path            varchar(500),
    file_name            varchar(500),
    file_type            varchar(50),
    binary_file_temp     bytea,
    product_document_id  bigint,
    transaction_type     varchar(100),
    version              varchar(5),
    created_by           bigint        REFERENCES "user"(id),
    created_on           timestamptz   NOT NULL DEFAULT now(),
    updated_by           bigint        REFERENCES "user"(id),
    updated_on           timestamptz
);
CREATE INDEX IF NOT EXISTS idx_policydocument_clientid ON policy_document(client_id);
CREATE INDEX IF NOT EXISTS idx_policydocument_policyid ON policy_document(policy_id);

-- ─── Risk information / risk address (HO rater property detail) ───────────────

CREATE TABLE IF NOT EXISTS risk_address (
    id                     bigserial     PRIMARY KEY,
    client_id              bigint        NOT NULL REFERENCES client(id),
    policy_id              bigint        NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    address_type           varchar(50),
    address_line1          varchar(500),
    address_line2          varchar(500),
    country                varchar(50),
    state                  varchar(50),
    city                   varchar(50),
    zip_code               varchar(50),
    latitude               varchar(50),
    longitude              varchar(50),
    county                 varchar(50),
    is_active              boolean,
    is_manual              boolean,
    google_address         varchar(200),
    location_number        integer,
    is_added_from_account  boolean,
    created_by             bigint        REFERENCES "user"(id),
    created_on             timestamptz   NOT NULL DEFAULT now(),
    updated_by             bigint        REFERENCES "user"(id),
    updated_on             timestamptz
);
CREATE INDEX IF NOT EXISTS idx_riskaddress_clientid ON risk_address(client_id);
CREATE INDEX IF NOT EXISTS idx_riskaddress_policyid ON risk_address(policy_id);

CREATE TABLE IF NOT EXISTS policy_risk_information (
    id                          bigserial     PRIMARY KEY,
    client_id                   bigint        NOT NULL REFERENCES client(id),
    policy_id                   bigint        NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    risk_address_id             bigint        REFERENCES risk_address(id) ON DELETE CASCADE,
    building_flood_elevation    varchar(50),
    building_type               varchar(50),
    building_decription         varchar(1000),
    hex_zone_lower_resolution   varchar(50),
    hex_zone_higer_resolution   varchar(50),
    flood_zone                  varchar(50),
    construction_type           varchar(50),
    number_of_stories           varchar(50),
    square_footage              varchar(50),
    roof_year                   integer,
    roof_shape                  varchar(50),
    roof_covering                varchar(50),
    presence_of_basement        varchar(50),
    status                       varchar(50),
    status_time_stamp           timestamptz,
    approval_counter            integer,
    approval_expiration_date    date,
    writing_company              varchar(500),
    year_built                  integer,
    not_approved_counter        integer DEFAULT 0,
    residence_type               varchar(100),
    roof_age                    integer,
    roof_architecture_type      varchar(100),
    foundation_type             varchar(100),
    created_by                  bigint        REFERENCES "user"(id),
    created_on                  timestamptz   NOT NULL DEFAULT now(),
    updated_by                  bigint        REFERENCES "user"(id),
    updated_on                  timestamptz
);
CREATE INDEX IF NOT EXISTS idx_policyriskinfo_clientid ON policy_risk_information(client_id);
CREATE INDEX IF NOT EXISTS idx_policyriskinfo_policyid ON policy_risk_information(policy_id);

-- ─── Additional insureds / organisations on a policy ───────────────────────────

CREATE TABLE IF NOT EXISTS additional_insured (
    id                       bigserial     PRIMARY KEY,
    client_id                bigint        NOT NULL REFERENCES client(id),
    policy_id                bigint        NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    first_name               varchar(50),
    middle_name              varchar(50),
    last_name                varchar(50),
    date_of_birth            date,
    relationship             varchar(50),
    telephone_number         varchar(20),
    telephone_number_cc      varchar(10),
    alt_telephone_number     varchar(20),
    alt_telephone_number_cc  varchar(10),
    email                    varchar(50),
    gender                   varchar(50),
    is_manual                boolean,
    insured_type             varchar(50),
    suffix                   varchar(4),
    dba                      varchar(75),
    record_number            integer,
    created_by               bigint        REFERENCES "user"(id),
    created_on               timestamptz   NOT NULL DEFAULT now(),
    updated_by               bigint        REFERENCES "user"(id),
    updated_on               timestamptz
);
CREATE INDEX IF NOT EXISTS idx_additionalinsured_clientid ON additional_insured(client_id);
CREATE INDEX IF NOT EXISTS idx_additionalinsured_policyid ON additional_insured(policy_id);

CREATE TABLE IF NOT EXISTS additional_organisation (
    id                         bigserial     PRIMARY KEY,
    client_id                  bigint        NOT NULL REFERENCES client(id),
    policy_id                  bigint        NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    first_name                 varchar(50),
    middle_name                varchar(50),
    last_name                  varchar(50),
    organisation_name          varchar(75),
    telephone_number           varchar(50),
    telephone_number_cc        varchar(50),
    alt_telephone_number       varchar(50),
    alt_telephone_number_cc    varchar(50),
    email                      varchar(50),
    extension                  integer,
    organisation_type          varchar(50),
    record_number              integer,
    created_by                 bigint        REFERENCES "user"(id),
    created_on                 timestamptz   NOT NULL DEFAULT now(),
    updated_by                 bigint        REFERENCES "user"(id),
    updated_on                 timestamptz
);
CREATE INDEX IF NOT EXISTS idx_additionalorg_clientid ON additional_organisation(client_id);
CREATE INDEX IF NOT EXISTS idx_additionalorg_policyid ON additional_organisation(policy_id);

-- ─── HB Rater reference tables (used by server.js rating logic) ────────────────
-- Only hb_rater_state_tax_sheet is actually queried by the prototype server.js;
-- other hb_rater_* tables in the source dump (hexzone, wildfire, excess flood,
-- lr_hexzones) are not referenced by any live endpoint and are intentionally
-- skipped as unused cruft.

CREATE TABLE IF NOT EXISTS hb_rater_state_tax_sheet (
    id                bigserial     PRIMARY KEY,
    state             varchar(50),
    surplus_lines     numeric(37,8),
    stamping_fee      numeric(37,8),
    fire_premium_tax  numeric(37,8),
    abbreviation      varchar(50),
    created_by        bigint        REFERENCES "user"(id),
    created_on        timestamptz   NOT NULL DEFAULT now(),
    updated_by        bigint        REFERENCES "user"(id),
    updated_on        timestamptz
);
CREATE INDEX IF NOT EXISTS idx_hbraterstatetax_state ON hb_rater_state_tax_sheet(state);

-- ─── Submissions (quote wizard draft/JSON payload store) ───────────────────────
-- Kept as a lightweight app-generated-id + JSONB blob, matching the prototype's
-- usage (server.js reads/writes the whole "data" document per wizard step; the
-- structured tables above are the durable/queryable data once a policy binds).

CREATE TABLE IF NOT EXISTS submissions (
    id          varchar(20)   PRIMARY KEY,
    client_id   bigint        NOT NULL REFERENCES client(id),
    status      varchar(50)   NOT NULL DEFAULT 'Draft',
    data        jsonb         NOT NULL DEFAULT '{}',
    created_by  bigint        REFERENCES "user"(id),
    created_on  timestamptz   NOT NULL DEFAULT now(),
    updated_by  bigint        REFERENCES "user"(id),
    updated_on  timestamptz
);
CREATE INDEX IF NOT EXISTS idx_submissions_clientid ON submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- ─── Screen seeding ─────────────────────────────────────────────────────────────
-- Module id 4 "Quotes & Policies" already exists (see 002_seed_modules_screens.sql).
-- Add 4 new screen codes for the ported quote wizard / policies list views.
-- 003_dev_seed.sql already grants ALL app_screen rows to the Administrators group
-- via "SELECT ... FROM app_screen" — no change needed there; these new rows are
-- picked up automatically the next time that seed runs.

INSERT INTO app_screen (screen_code, screen_name, module_id)
SELECT v.screen_code, v.screen_name, 4
FROM (VALUES
    ('NBQUOTESSCREEN',    'New Business Quotes'),
    ('ENDORSEMENTSSCREEN','Endorsements'),
    ('RENEWALSSCREEN',    'Renewals'),
    ('POLICIESSCREEN',    'Policies')
) AS v(screen_code, screen_name)
WHERE NOT EXISTS (
    SELECT 1 FROM app_screen a WHERE a.screen_code = v.screen_code
);
