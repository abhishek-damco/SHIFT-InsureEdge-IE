-- Migration 009: Client Management Module
-- Expands the client table and adds company, address, contact, office,
-- product/LOB, and jurisdiction tables matching the SHIFT_Insureedge_SYSTEM_DEV schema.

-- ── Extend client table ───────────────────────────────────────────────────────
ALTER TABLE client
    ADD COLUMN IF NOT EXISTS client_code         varchar(50),
    ADD COLUMN IF NOT EXISTS status              varchar(50)  NOT NULL DEFAULT 'Active',
    ADD COLUMN IF NOT EXISTS client_onboarding_date date,
    ADD COLUMN IF NOT EXISTS type_of_company     varchar(50),
    ADD COLUMN IF NOT EXISTS naic_code           varchar(50),
    ADD COLUMN IF NOT EXISTS registered_trade_mark varchar(500),
    ADD COLUMN IF NOT EXISTS client_registration_date date,
    ADD COLUMN IF NOT EXISTS domicile_country    varchar(50),
    ADD COLUMN IF NOT EXISTS state_of_domicile   varchar(50),
    ADD COLUMN IF NOT EXISTS state_allowed_to_operate text,
    ADD COLUMN IF NOT EXISTS federal_tax_id      varchar(50),
    ADD COLUMN IF NOT EXISTS owned_by            varchar(50),
    ADD COLUMN IF NOT EXISTS number_of_employees varchar(10),
    ADD COLUMN IF NOT EXISTS est_direct_written_premium varchar(50),
    ADD COLUMN IF NOT EXISTS year_business_started varchar(50),
    ADD COLUMN IF NOT EXISTS business_description varchar(1000),
    ADD COLUMN IF NOT EXISTS email_id            varchar(255),
    ADD COLUMN IF NOT EXISTS telephone_number    varchar(50),
    ADD COLUMN IF NOT EXISTS telephone_number_cc varchar(10),
    ADD COLUMN IF NOT EXISTS extension           int,
    ADD COLUMN IF NOT EXISTS client_url          varchar(500),
    ADD COLUMN IF NOT EXISTS logo_file_name      varchar(255),
    ADD COLUMN IF NOT EXISTS logo_content_type   varchar(50),
    ADD COLUMN IF NOT EXISTS logo_data           bytea,
    ADD COLUMN IF NOT EXISTS created_by          bigint REFERENCES "user"(id),
    ADD COLUMN IF NOT EXISTS updated_by          bigint REFERENCES "user"(id),
    ADD COLUMN IF NOT EXISTS updated_on          timestamptz;

-- Rename client_name → company_name (keep backward compat via default)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='client' AND column_name='client_name') THEN
        ALTER TABLE client RENAME COLUMN client_name TO company_name;
    END IF;
END$$;

-- ── Client address ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_address (
    id              bigserial PRIMARY KEY,
    client_id       bigint NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    address_type    varchar(20) NOT NULL DEFAULT 'Legal',  -- Legal | Mailing
    address_line1   varchar(500),
    address_line2   varchar(500),
    country         varchar(100),
    state           varchar(100),
    city            varchar(100),
    county          varchar(100),
    zip_code        varchar(20),
    latitude        varchar(60),
    longitude       varchar(60),
    is_manual       boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX IF NOT EXISTS uix_client_address_type ON client_address(client_id, address_type);

-- ── Client primary contact ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_contact (
    id              bigserial PRIMARY KEY,
    client_id       bigint NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    contact_type    varchar(20) NOT NULL DEFAULT 'Primary',
    name            varchar(150),
    suffix          varchar(10),
    title           varchar(50),
    email_id        varchar(255),
    telephone_number varchar(30),
    telephone_number_cc varchar(10),
    extension       int,
    alt_telephone_number varchar(30),
    alt_telephone_number_cc varchar(10)
);
CREATE UNIQUE INDEX IF NOT EXISTS uix_client_contact_type ON client_contact(client_id, contact_type);

-- ── Client office locations ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_office (
    id              bigserial PRIMARY KEY,
    client_id       bigint NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    office_name     varchar(75) NOT NULL,
    office_type     varchar(50),
    address_line1   varchar(500),
    address_line2   varchar(500),
    country         varchar(100),
    state           varchar(100),
    city            varchar(100),
    county          varchar(100),
    zip_code        varchar(20),
    latitude        varchar(60),
    longitude       varchar(60),
    -- contact
    contact_name    varchar(150),
    contact_suffix  varchar(10),
    contact_title   varchar(50),
    contact_email   varchar(255),
    contact_phone   varchar(30),
    contact_phone_cc varchar(10),
    contact_ext     int,
    contact_alt_phone varchar(30),
    contact_alt_phone_cc varchar(10),
    created_by      bigint REFERENCES "user"(id),
    created_on      timestamptz NOT NULL DEFAULT now(),
    updated_by      bigint REFERENCES "user"(id),
    updated_on      timestamptz
);

-- ── Client company (subsidiary) ────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS company_code_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS client_company (
    id              bigserial PRIMARY KEY,
    client_id       bigint NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    company_code    varchar(10) NOT NULL,           -- zero-padded 5-digit e.g. "00026"
    company_name    varchar(75) NOT NULL,
    status          varchar(10) NOT NULL DEFAULT 'Active',
    domicile_country varchar(50),
    state_of_domicile varchar(50),
    naic_code       varchar(50),
    email_id        varchar(255),
    telephone_number varchar(50),
    telephone_number_cc varchar(10),
    extension       int,
    federal_tax_id  varchar(50),
    url             varchar(500),
    business_description text,
    logo_file_name  varchar(255),
    logo_content_type varchar(50),
    logo_data       bytea,
    created_by      bigint REFERENCES "user"(id),
    created_on      timestamptz NOT NULL DEFAULT now(),
    updated_by      bigint REFERENCES "user"(id),
    updated_on      timestamptz,
    CONSTRAINT uix_company_code UNIQUE (client_id, company_code)
);

-- ── Company address ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_address (
    id              bigserial PRIMARY KEY,
    company_id      bigint NOT NULL REFERENCES client_company(id) ON DELETE CASCADE,
    address_type    varchar(20) NOT NULL DEFAULT 'Legal',
    address_line1   varchar(500),
    address_line2   varchar(500),
    country         varchar(100),
    state           varchar(100),
    city            varchar(100),
    county          varchar(100),
    zip_code        varchar(20),
    latitude        varchar(60),
    longitude       varchar(60),
    is_manual       boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX IF NOT EXISTS uix_company_address_type ON company_address(company_id, address_type);

-- ── Company contact ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_contact (
    id              bigserial PRIMARY KEY,
    company_id      bigint NOT NULL REFERENCES client_company(id) ON DELETE CASCADE,
    contact_type    varchar(20) NOT NULL DEFAULT 'Primary',
    name            varchar(150),
    suffix          varchar(10),
    title           varchar(50),
    email_id        varchar(255),
    telephone_number varchar(30),
    telephone_number_cc varchar(10),
    extension       int,
    alt_telephone_number varchar(30),
    alt_telephone_number_cc varchar(10)
);
CREATE UNIQUE INDEX IF NOT EXISTS uix_company_contact_type ON company_contact(company_id, contact_type);

-- ── Insurance products / LOB (system reference data) ──────────────────────────
CREATE TABLE IF NOT EXISTS insurance_product (
    id              bigserial PRIMARY KEY,
    product_name    varchar(75) NOT NULL,
    category        varchar(30) NOT NULL,  -- Personal | Commercial | Specialty
    is_active       boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX IF NOT EXISTS uix_product_name_cat ON insurance_product(product_name, category);

CREATE TABLE IF NOT EXISTS insurance_sub_product (
    id              bigserial PRIMARY KEY,
    product_id      bigint NOT NULL REFERENCES insurance_product(id) ON DELETE CASCADE,
    sub_product_name varchar(75) NOT NULL
);

-- ── Company product access (company × product × sub-product × jurisdictions) ──
CREATE TABLE IF NOT EXISTS company_product_access (
    id              bigserial PRIMARY KEY,
    company_id      bigint NOT NULL REFERENCES client_company(id) ON DELETE CASCADE,
    product_id      bigint NOT NULL REFERENCES insurance_product(id),
    CONSTRAINT uix_company_product UNIQUE (company_id, product_id)
);

CREATE TABLE IF NOT EXISTS company_product_sub_product (
    id              bigserial PRIMARY KEY,
    access_id       bigint NOT NULL REFERENCES company_product_access(id) ON DELETE CASCADE,
    sub_product_id  bigint NOT NULL REFERENCES insurance_sub_product(id),
    CONSTRAINT uix_access_subproduct UNIQUE (access_id, sub_product_id)
);

CREATE TABLE IF NOT EXISTS company_product_jurisdiction (
    id              bigserial PRIMARY KEY,
    access_id       bigint NOT NULL REFERENCES company_product_access(id) ON DELETE CASCADE,
    state_code      varchar(5) NOT NULL,
    state_name      varchar(50) NOT NULL,
    CONSTRAINT uix_access_state UNIQUE (access_id, state_code)
);

-- ── Seed: insurance products ──────────────────────────────────────────────────
INSERT INTO insurance_product (product_name, category) VALUES
    ('Auto', 'Personal'),
    ('Dwelling Fire', 'Personal'),
    ('Homeowners', 'Personal'),
    ('Inland Marine', 'Personal'),
    ('Umbrella', 'Personal'),
    ('Auto', 'Commercial'),
    ('Business Owners', 'Commercial'),
    ('General Liability', 'Commercial'),
    ('Inland Marine', 'Commercial'),
    ('Property', 'Commercial'),
    ('Umbrella', 'Commercial'),
    ('Workmen Compensation', 'Commercial'),
    ('E&S Homeowners', 'Specialty')
ON CONFLICT DO NOTHING;

INSERT INTO insurance_sub_product (product_id, sub_product_name)
SELECT p.id, s.name FROM insurance_product p
JOIN (VALUES
    ('Auto','Personal','Assigned Risk'),
    ('Auto','Personal','Standard Auto'),
    ('Dwelling Fire','Personal','Basic Form'),
    ('Dwelling Fire','Personal','Broad Form'),
    ('Homeowners','Personal','HO-3'),
    ('Homeowners','Personal','HO-5'),
    ('Inland Marine','Personal','Floater'),
    ('Umbrella','Personal','Personal Umbrella'),
    ('Auto','Commercial','Auto Dealers'),
    ('Auto','Commercial','Business Auto'),
    ('Auto','Commercial','Garagekeepers'),
    ('Business Owners','Commercial','BOP Standard'),
    ('General Liability','Commercial','CGL'),
    ('Inland Marine','Commercial','Commercial Floater'),
    ('Property','Commercial','Commercial Property'),
    ('Umbrella','Commercial','Commercial Umbrella'),
    ('Workmen Compensation','Commercial','WC Standard'),
    ('E&S Homeowners','Specialty','SuperPerils')
) AS s(pname, cat, name) ON p.product_name = s.pname AND p.category = s.cat
ON CONFLICT DO NOTHING;

-- ── Seed: update existing client (id=1) with full profile data ─────────────────
UPDATE client SET
    client_code = 'HBI-001',
    status = 'Active',
    type_of_company = 'MGA',
    naic_code = '12345',
    domicile_country = 'United States',
    state_of_domicile = 'California',
    federal_tax_id = '23-4567890',
    business_description = 'Hudson Bailey Insurance - Primary tenant',
    email_id = 'admin@hudsonbailey.com',
    telephone_number = '5551234567',
    telephone_number_cc = '+1',
    client_onboarding_date = '2024-01-01',
    client_url = 'https://hudsonbailey.com'
WHERE id = 1;

-- Seed legal address for client 1
INSERT INTO client_address (client_id, address_type, address_line1, country, state, city, county, zip_code, latitude, longitude)
VALUES (1, 'Legal', '100 Main Street', 'United States', 'California', 'San Francisco', 'San Francisco County', '94102', '37.7749', '-122.4194')
ON CONFLICT DO NOTHING;

INSERT INTO client_address (client_id, address_type, address_line1, country, state, city, county, zip_code, latitude, longitude)
VALUES (1, 'Mailing', '100 Main Street', 'United States', 'California', 'San Francisco', 'San Francisco County', '94102', '37.7749', '-122.4194')
ON CONFLICT DO NOTHING;

-- Seed primary contact for client 1
INSERT INTO client_contact (client_id, contact_type, name, title, email_id, telephone_number, telephone_number_cc)
VALUES (1, 'Primary', 'Alex Mercer', 'Platform Admin', 'alex.mercer@hudsonbailey.com', '5551234567', '+1')
ON CONFLICT DO NOTHING;
