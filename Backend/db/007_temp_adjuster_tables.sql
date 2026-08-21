CREATE TABLE IF NOT EXISTS temp_adjuster (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    user_code VARCHAR(30) NOT NULL,
    first_name VARCHAR(100),
    middle_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth VARCHAR(30),
    ssn VARCHAR(80),
    tax_id VARCHAR(80),
    role VARCHAR(100),
    adjuster_type VARCHAR(100),
    status VARCHAR(40),
    claim_types_handled VARCHAR(200),
    territory_type VARCHAR(100),
    territories_assigned VARCHAR(300),
    preferred_communication VARCHAR(100),
    telephone_number VARCHAR(40),
    extension VARCHAR(20),
    alternative_telephone_number VARCHAR(40),
    email_id VARCHAR(255),
    registered_address_line1 VARCHAR(255),
    registered_address_line2 VARCHAR(255),
    registered_country VARCHAR(100),
    registered_state VARCHAR(100),
    registered_city VARCHAR(100),
    registered_county VARCHAR(100),
    registered_zip_code VARCHAR(20),
    registered_latitude VARCHAR(60),
    registered_longitude VARCHAR(60),
    mailing_address_line1 VARCHAR(255),
    mailing_address_line2 VARCHAR(255),
    mailing_country VARCHAR(100),
    mailing_state VARCHAR(100),
    mailing_city VARCHAR(100),
    mailing_county VARCHAR(100),
    mailing_zip_code VARCHAR(20),
    mailing_latitude VARCHAR(60),
    mailing_longitude VARCHAR(60),
    payment_method VARCHAR(100),
    rate_per_hour VARCHAR(50),
    compliance_flag VARCHAR(100),
    access_json TEXT,
    created_by BIGINT,
    created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by BIGINT,
    updated_on TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_temp_adjuster_client_id ON temp_adjuster(client_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_temp_adjuster_client_user_code ON temp_adjuster(client_id, user_code);

CREATE TABLE IF NOT EXISTS temp_adjuster_license (
    id BIGSERIAL PRIMARY KEY,
    adjuster_id BIGINT NOT NULL REFERENCES temp_adjuster(id) ON DELETE CASCADE,
    licensed_state VARCHAR(100),
    license_number VARCHAR(120),
    license_start_date VARCHAR(30),
    license_expiration_date VARCHAR(30)
);

CREATE INDEX IF NOT EXISTS ix_temp_adjuster_license_adjuster_id ON temp_adjuster_license(adjuster_id);
