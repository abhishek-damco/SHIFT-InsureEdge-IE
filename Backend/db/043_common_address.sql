-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- "common_address" — mapped in InsureEdgeDbContext (CommonAddress entity, shared across
-- Account/Policy/Claim/Claimant/Adjuster/Payee/BankingDetail/Witness via nullable FKs) but
-- never had a migration script until now. First real consumer: the inbound LenderDock
-- search/search_details endpoints, which read an Account's mailing address from here.

CREATE TABLE IF NOT EXISTS common_address (
    id                       bigserial     PRIMARY KEY,
    account_id               bigint        REFERENCES account(id) ON DELETE CASCADE,
    is_legal_same_as_mailing boolean       NOT NULL DEFAULT false,
    address_type             varchar(50),
    address_line1            varchar(200),
    address_line2            varchar(200),
    country                  varchar(100),
    state                    varchar(100),
    city                     varchar(100),
    zip_code                 varchar(20),
    latitude                 varchar(50),
    longitude                varchar(50),
    county                   varchar(100),
    is_active                boolean       NOT NULL DEFAULT true,
    is_manual                boolean       NOT NULL DEFAULT false,
    google_address           varchar(500),
    policy_id                bigint        REFERENCES policy(id) ON DELETE CASCADE,
    claim_id                 bigint        REFERENCES claim(id) ON DELETE CASCADE,
    claimant_id              bigint        REFERENCES claimant(id) ON DELETE CASCADE,
    adjuster_id              bigint,
    payee_id                 bigint,  -- no FK: "payee" table doesn't exist locally at time of writing
    banking_detail_id        bigint,
    witness_id               bigint,
    created_by               bigint        REFERENCES "user"(id),
    created_on               timestamptz   NOT NULL DEFAULT now(),
    updated_by               bigint        REFERENCES "user"(id),
    updated_on                timestamptz
);
CREATE INDEX IF NOT EXISTS idx_commonaddress_accountid ON common_address(account_id);
CREATE INDEX IF NOT EXISTS idx_commonaddress_policyid ON common_address(policy_id);
CREATE INDEX IF NOT EXISTS idx_commonaddress_payeeid ON common_address(payee_id);
