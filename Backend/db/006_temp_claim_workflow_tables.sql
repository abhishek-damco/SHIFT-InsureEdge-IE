-- Temporary claim workflow persistence for UI flows without a finalized domain table.

ALTER TABLE claim_document
    ADD COLUMN IF NOT EXISTS comment TEXT;

CREATE TABLE IF NOT EXISTS temp_claim_report (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL REFERENCES claim(id) ON DELETE CASCADE,
    client_id BIGINT NOT NULL REFERENCES client(id),
    report_type VARCHAR(100),
    report_number VARCHAR(100),
    report_filing_date VARCHAR(30),
    precinct_name VARCHAR(200),
    case_status VARCHAR(80),
    number_of_witness VARCHAR(30),
    description TEXT,
    notify_document_upload BOOLEAN NOT NULL DEFAULT FALSE,
    notify_to_name VARCHAR(200),
    comment TEXT,
    contact_first_name VARCHAR(100),
    contact_last_name VARCHAR(100),
    identity_document VARCHAR(100),
    telephone_number VARCHAR(40),
    extension VARCHAR(20),
    alternate_telephone_number VARCHAR(40),
    email_id VARCHAR(255),
    reference_document_name VARCHAR(255),
    created_by BIGINT REFERENCES "user"(id),
    created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by BIGINT REFERENCES "user"(id),
    updated_on TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_temp_claim_report_claim_client
    ON temp_claim_report(claim_id, client_id);

CREATE TABLE IF NOT EXISTS temp_claim_party (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL REFERENCES claim(id) ON DELETE CASCADE,
    client_id BIGINT NOT NULL REFERENCES client(id),
    party_type VARCHAR(80),
    party_category VARCHAR(120),
    business_name VARCHAR(200),
    tin_id VARCHAR(80),
    first_name VARCHAR(100),
    middle_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth VARCHAR(30),
    gender VARCHAR(40),
    social_security_number VARCHAR(80),
    relationship_with_insured VARCHAR(120),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    country VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    county VARCHAR(100),
    zip_code VARCHAR(20),
    latitude VARCHAR(60),
    longitude VARCHAR(60),
    telephone_number VARCHAR(40),
    extension VARCHAR(20),
    alternate_telephone_number VARCHAR(40),
    email_id VARCHAR(255),
    description TEXT,
    profile_image_name VARCHAR(255),
    id_proof_name VARCHAR(255),
    created_by BIGINT REFERENCES "user"(id),
    created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by BIGINT REFERENCES "user"(id),
    updated_on TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_temp_claim_party_claim_client
    ON temp_claim_party(claim_id, client_id);

CREATE TABLE IF NOT EXISTS temp_claim_witness (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL REFERENCES claim(id) ON DELETE CASCADE,
    client_id BIGINT NOT NULL REFERENCES client(id),
    first_name VARCHAR(100),
    middle_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth VARCHAR(30),
    gender VARCHAR(40),
    social_security_number VARCHAR(80),
    relationship_with_insured VARCHAR(120),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    country VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    county VARCHAR(100),
    zip_code VARCHAR(20),
    latitude VARCHAR(60),
    longitude VARCHAR(60),
    telephone_number VARCHAR(40),
    extension VARCHAR(20),
    alternate_telephone_number VARCHAR(40),
    email_id VARCHAR(255),
    description TEXT,
    profile_image_name VARCHAR(255),
    id_proof_name VARCHAR(255),
    created_by BIGINT REFERENCES "user"(id),
    created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by BIGINT REFERENCES "user"(id),
    updated_on TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_temp_claim_witness_claim_client
    ON temp_claim_witness(claim_id, client_id);
