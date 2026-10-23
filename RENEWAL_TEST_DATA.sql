-- ═══════════════════════════════════════════════════════════════════════════════════
-- RENEWAL QUOTE TESTING - DUMMY DATA SETUP
-- ═══════════════════════════════════════════════════════════════════════════════════
-- This script creates a complete test policy that can be used for renewal testing
--
-- Prerequisites:
-- - Must have at least one Client in the database
-- - Must have at least one Intermediary
-- - Must have at least one Producer
-- - Must have at least one Account
--
-- After running this script, you can test:
-- 1. Premium Paid Validation (premium_paid = true)
-- 2. Grace Period Support (expiry_date set to future date)
-- 3. Renewal Notice Generation (policy qualifies for renewal)
-- ═══════════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────────────
-- STEP 1: Verify existing data (use existing client, intermediary, producer, account)
-- ──────────────────────────────────────────────────────────────────────────────────
-- Check for existing client (assumes client_id = 1)
SELECT id, client_name FROM client LIMIT 1;

-- Check for existing intermediary
SELECT id, intermediary_name FROM intermediary LIMIT 1;

-- Check for existing producer
SELECT id, first_name, last_name FROM producer LIMIT 1;

-- Check for existing account
SELECT id, account_name FROM account LIMIT 1;


-- ──────────────────────────────────────────────────────────────────────────────────
-- STEP 2: INSERT TEST POLICY (Active policy that will be used for renewal testing)
-- ──────────────────────────────────────────────────────────────────────────────────

-- Variables (adjust these based on your data):
-- SET @client_id = 1;              -- Your client ID
-- SET @intermediary_id = 1;        -- Your intermediary ID
-- SET @producer_id = 1;            -- Your producer ID
-- SET @account_id = 1;             -- Your account ID

-- INSERT TEST POLICY
INSERT INTO policy (
    client_id,
    policy_number,
    account_id,
    intermediary_id,
    producer_id,
    intermediary_type,
    producer_name,
    intermediary_name,
    status,                          -- MUST be "Active"
    policy_stage,
    policy_type,                      -- MUST be "POLICY" (not RENEWAL)
    insurance_type,
    lob,
    sub_product,
    quote_number,
    effective_date,
    expiry_date,                      -- Set to ~60 days from today for renewal window
    approval_status,
    quote_creation_date,
    created_by,
    created_on,
    updated_by,
    updated_on
) VALUES (
    1,                               -- client_id (adjust to your client)
    'TEST-POL-' || CURRENT_DATE,    -- policy_number (unique)
    1,                               -- account_id (adjust to your account)
    1,                               -- intermediary_id (adjust to your intermediary)
    1,                               -- producer_id (adjust to your producer)
    'Agent',                          -- intermediary_type
    'Test Producer',                  -- producer_name
    'Test Intermediary',              -- intermediary_name
    'Active',                         -- status (REQUIRED for renewal)
    'Quote Received',                 -- policy_stage
    'POLICY',                         -- policy_type (REQUIRED - must be POLICY, not RENEWAL)
    'Individual',                     -- insurance_type
    'Homeowners',                     -- lob
    'SuperPerils',                    -- sub_product
    'TEST-QUOTE-' || CURRENT_DATE,   -- quote_number
    CURRENT_DATE - INTERVAL '30 day', -- effective_date (30 days ago)
    CURRENT_DATE + INTERVAL '60 day', -- expiry_date (60 days from today - within renewal window)
    'Approved',                       -- approval_status
    CURRENT_DATE,                     -- quote_creation_date
    1,                               -- created_by (user_id)
    CURRENT_TIMESTAMP,               -- created_on
    1,                               -- updated_by
    CURRENT_TIMESTAMP                -- updated_on
);

-- Get the policy ID we just created
SELECT @policy_id := id, policy_number FROM policy
WHERE policy_number LIKE 'TEST-POL-%'
ORDER BY created_on DESC LIMIT 1;


-- ──────────────────────────────────────────────────────────────────────────────────
-- STEP 3: INSERT POLICY PREMIUM (required for renewal)
-- ──────────────────────────────────────────────────────────────────────────────────

INSERT INTO policy_premium (
    client_id,
    policy_id,
    coverage_premium,
    taxes_and_fees,
    total_premium,
    billing_frequency,
    responsible_party,      -- "Agency", "Insurer", or "Insured"
    payment_frequency,
    payment_method,
    created_by,
    created_on
) VALUES (
    1,                      -- client_id
    @policy_id,            -- policy_id (from previous insert)
    1500.00,               -- coverage_premium
    195.00,                -- taxes_and_fees
    1695.00,               -- total_premium
    'Annual',              -- billing_frequency
    'Agency',              -- responsible_party (non-insured = auto-approved)
    'Annual',              -- payment_frequency
    'Check',               -- payment_method
    1,                     -- created_by
    CURRENT_TIMESTAMP      -- created_on
);

-- Get the premium ID
SELECT @premium_id := id FROM policy_premium
WHERE policy_id = @policy_id LIMIT 1;


-- ──────────────────────────────────────────────────────────────────────────────────
-- STEP 4: INSERT POLICY PAYMENT TRANSACTION (marks premium as PAID)
-- ──────────────────────────────────────────────────────────────────────────────────
-- This is CRITICAL for Fix #1 (Premium Paid Validation)

INSERT INTO policy_payment_transaction (
    client_id,
    policy_premium_id,
    amount_due,
    invoice_date,
    due_date,
    transaction_payment_date,   -- Set to today (marks as PAID)
    is_paid,                    -- MUST be true
    transaction_status,         -- "Approved"
    payment_method,
    created_by,
    created_on
) VALUES (
    1,                          -- client_id
    @premium_id,               -- policy_premium_id
    1695.00,                   -- amount_due
    CURRENT_DATE,              -- invoice_date
    CURRENT_DATE + INTERVAL '30 day', -- due_date
    CURRENT_DATE,              -- transaction_payment_date (today = PAID)
    true,                      -- is_paid (CRITICAL - must be TRUE)
    'Approved',                -- transaction_status
    'Check',                   -- payment_method
    1,                         -- created_by
    CURRENT_TIMESTAMP          -- created_on
);


-- ──────────────────────────────────────────────────────────────────────────────────
-- STEP 5: INSERT POLICY PRODUCT (for renewal to copy products from)
-- ──────────────────────────────────────────────────────────────────────────────────

INSERT INTO policy_product (
    client_id,
    policy_id,
    product_id,
    sub_product_id,
    state,
    created_by,
    created_on
) VALUES (
    1,                      -- client_id
    @policy_id,            -- policy_id
    1,                     -- product_id (adjust to your product)
    1,                     -- sub_product_id (adjust to your sub-product)
    'CA',                  -- state
    1,                     -- created_by
    CURRENT_TIMESTAMP      -- created_on
);


-- ──────────────────────────────────────────────────────────────────────────────────
-- STEP 6: INSERT POLICY LIMIT COVERAGE (for renewal to copy coverages from)
-- ──────────────────────────────────────────────────────────────────────────────────

INSERT INTO policy_limit_coverage (
    client_id,
    policy_id,
    limit_id,
    coverage_id,
    calculated_premium,
    total_premium_with_fee,
    deductible,
    created_by,
    created_on
) VALUES (
    1,                      -- client_id
    @policy_id,            -- policy_id
    1,                     -- limit_id (adjust to your limit)
    1,                     -- coverage_id (adjust to your coverage)
    1500.00,               -- calculated_premium
    1695.00,               -- total_premium_with_fee
    1000,                  -- deductible
    1,                     -- created_by
    CURRENT_TIMESTAMP      -- created_on
);


-- ══════════════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ══════════════════════════════════════════════════════════════════════════════════

-- Verify policy was created correctly
SELECT
    p.id,
    p.policy_number,
    p.status,
    p.effective_date,
    p.expiry_date,
    DATEDIFF(DAY, CURRENT_DATE, p.expiry_date) as days_to_expiry
FROM policy p
WHERE p.policy_number LIKE 'TEST-POL-%'
ORDER BY p.created_on DESC LIMIT 1;

-- Verify premium exists and is paid
SELECT
    pp.id,
    pp.policy_id,
    pp.total_premium,
    ppt.is_paid,
    ppt.transaction_status
FROM policy_premium pp
LEFT JOIN policy_payment_transaction ppt ON pp.id = ppt.policy_premium_id
WHERE pp.policy_id = @policy_id;

-- Verify products and coverages copied
SELECT
    pp.id,
    pp.policy_id,
    pp.product_id,
    COUNT(*) as product_count
FROM policy_product pp
WHERE pp.policy_id = @policy_id
GROUP BY pp.policy_id;

SELECT
    plc.id,
    plc.policy_id,
    plc.coverage_id,
    plc.calculated_premium,
    COUNT(*) as coverage_count
FROM policy_limit_coverage plc
WHERE plc.policy_id = @policy_id
GROUP BY plc.policy_id;


-- ══════════════════════════════════════════════════════════════════════════════════
-- TEST DATA SUMMARY
-- ══════════════════════════════════════════════════════════════════════════════════
-- This creates a test policy with:
-- ✅ Status = "Active" (FIX #1: Premium Paid Validation requirement)
-- ✅ Premium = PAID (FIX #1: Critical requirement)
-- ✅ Expiry date = 60 days from today (FIX #2: Grace Period + Renewal Window)
-- ✅ Products & Coverages (for renewal to copy)
-- ✅ Payment Transaction (tracks paid premium)
--
-- Now you can test:
-- 1. Timer Job: Run at 2 AM to see renewal creation
-- 2. Renewal Notices: Check if notices generated at 30/15/7 days
-- 3. Renewal Quotes: Should be created automatically
-- 4. Grace Period: Test with expired policy within 30 days
-- 5. Premium Validation: Only paid premiums renewed
-- ══════════════════════════════════════════════════════════════════════════════════
