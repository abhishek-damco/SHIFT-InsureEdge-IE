-- Setup test data for Producer testing
-- This script deletes existing intermediaries and creates new ones with producers and users

-- Step 1: Delete existing intermediaries (cascades to producers)
DELETE FROM producer WHERE client_id = 1;
DELETE FROM intermediary WHERE client_id = 1;

-- Step 2: Create 1 Intermediary with all details
INSERT INTO intermediary (
    client_id, intermediary_code, status, status_toggle,
    intermediary_name, doing_business_as, legal_entity,
    federal_tax_id, type_of_intermediary, country, residential_state,
    license, allow_full_producer_visibility, created_by, created_on
)
VALUES (
    1, 'INT0001', 'Active', true,
    'Acme Brokerage Inc', 'Acme Insurance', 'LLC',
    '12-3456789', 'Brokerage', 'United States', 'New York',
    'LIC123456', false, 1, NOW()
);

-- Get the intermediary ID (should be auto-incremented)
-- For this example, assuming it's the latest insert, we'll use a subquery

-- Step 3: Create 2 Producers for the Intermediary
INSERT INTO producer (
    client_id, intermediary_id, producer_code, status, status_toggle,
    first_name, last_name, middle_name, country, residential_state,
    pc_license_requirement, pl_license, cl_license, plcl_combined_license,
    telephone_number_cc, telephone_number, email, created_by, created_on
)
SELECT
    1, id, 'PROD0001', 'Active', true,
    'John', 'Smith', 'Michael', 'United States', 'New York',
    'Required', 'PL123456', 'CL789012', null,
    '+1', '2125551234', 'john.smith@acmebroker.com', 1, NOW()
FROM intermediary
WHERE client_id = 1 AND intermediary_code = 'INT0001'
LIMIT 1;

INSERT INTO producer (
    client_id, intermediary_id, producer_code, status, status_toggle,
    first_name, last_name, middle_name, country, residential_state,
    pc_license_requirement, pl_license, cl_license, plcl_combined_license,
    telephone_number_cc, telephone_number, email, created_by, created_on
)
SELECT
    1, id, 'PROD0002', 'Active', true,
    'Sarah', 'Johnson', 'Elizabeth', 'United States', 'New York',
    'Required', 'PL345678', 'CL901234', null,
    '+1', '2125555678', 'sarah.johnson@acmebroker.com', 1, NOW()
FROM intermediary
WHERE client_id = 1 AND intermediary_code = 'INT0001'
LIMIT 1;

-- Step 4: Create 1 Client User (Non-Producer)
-- Password: ClientPass@123! (BCrypt hash)
INSERT INTO "user" (
    first_name, last_name, email, password_hash, is_active, client_id, created_on
)
VALUES (
    'Emily', 'Davis', 'emily.davis@hudsonbailey.com',
    '$2a$11$br.FC7x9YHPpbcVD5dJ4MeFZFtlckqO8trNkm/qgDCe3LzRwvCj76',
    true, 1, NOW()
) ON CONFLICT DO NOTHING;

-- Step 5: Create 2 Producer Users and Map to Producers
-- Producer 1 User: john.producer@hudsonbailey.com (Password: ProducerPass@123!)
INSERT INTO "user" (
    first_name, last_name, email, password_hash, is_active, client_id, producer_id, created_on
)
SELECT
    p.first_name, p.last_name, 'john.producer@hudsonbailey.com',
    '$2a$11$br.FC7x9YHPpbcVD5dJ4MeFZFtlckqO8trNkm/qgDCe3LzRwvCj76',
    true, 1, p.id, NOW()
FROM producer p
WHERE p.client_id = 1 AND p.producer_code = 'PROD0001'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Producer 2 User: sarah.producer@hudsonbailey.com (Password: ProducerPass@123!)
INSERT INTO "user" (
    first_name, last_name, email, password_hash, is_active, client_id, producer_id, created_on
)
SELECT
    p.first_name, p.last_name, 'sarah.producer@hudsonbailey.com',
    '$2a$11$br.FC7x9YHPpbcVD5dJ4MeFZFtlckqO8trNkm/qgDCe3LzRwvCj76',
    true, 1, p.id, NOW()
FROM producer p
WHERE p.client_id = 1 AND p.producer_code = 'PROD0002'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Verify data
SELECT '=== INTERMEDIARY ===' as section;
SELECT id, intermediary_code, intermediary_name, type_of_intermediary, status FROM intermediary WHERE client_id = 1;

SELECT '=== PRODUCERS ===' as section;
SELECT id, producer_code, first_name, last_name, status FROM producer WHERE client_id = 1;

SELECT '=== USERS ===' as section;
SELECT id, email, first_name, last_name, producer_id, is_active FROM "user" WHERE client_id = 1;
