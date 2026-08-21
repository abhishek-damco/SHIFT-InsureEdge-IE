-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Dev seed: a few more fully-populated ACTIVE policies (individual + business) so
-- Endorse Policy / Cancel Policy / Cancel-Rewrite can be exercised repeatedly without
-- running into "already has an open endorsement" conflicts from prior test runs.
-- Run AFTER 028_remove_do_not_renew_transaction_type.sql

DO $$
DECLARE
    v_client_id      bigint := 1;
    v_intermediary_id bigint;
    v_producer_id    bigint;
    v_account_id     bigint;
    v_policy_id      bigint;
    v_premium_id     bigint;
    v_commission_id  bigint;
BEGIN
    -- ── Policy 1: Individual, HB-2024-00010 ─────────────────────────────────
    IF NOT EXISTS (SELECT 1 FROM policy WHERE policy_number = 'HB-2024-00010') THEN
        INSERT INTO intermediary (client_id, intermediary_code, status, intermediary_name, legal_entity)
        VALUES (v_client_id, 'INT0010', 'Active', 'Summit Underwriters LLC', 'LLC')
        RETURNING id INTO v_intermediary_id;

        INSERT INTO producer (client_id, intermediary_id, producer_code, status, first_name, last_name, telephone_number_cc, telephone_number, email)
        VALUES (v_client_id, v_intermediary_id, 'PC0010', 'Active', 'Rachel', 'Ortiz', '+1', '2035557712', 'rachel.ortiz@summitunderwriters.com')
        RETURNING id INTO v_producer_id;

        INSERT INTO account (client_id, account_type, first_name, middle_name, last_name, producer_id, intermediary_id, status)
        VALUES (v_client_id, 'individual', 'Daniel', NULL, 'Reyes', v_producer_id, v_intermediary_id, 'Active')
        RETURNING id INTO v_account_id;

        INSERT INTO policy (client_id, policy_number, insured_name, lob, sub_product, effective_date, status, producer_id, intermediary_id, account_id, policy_type, policy_status, do_not_renew, expiry_date)
        VALUES (v_client_id, 'HB-2024-00010', 'Daniel Reyes', 'E&S Homeowners', 'SuperPerils', '2024-05-01', 'Active', v_producer_id, v_intermediary_id, v_account_id, 'POLICY', 'Active', false, '2025-05-01')
        RETURNING id INTO v_policy_id;

        INSERT INTO policy_product (client_id, policy_id, product_id, sub_product_id, state)
        VALUES (v_client_id, v_policy_id, 13, 18, 'Connecticut');

        INSERT INTO policy_premium (client_id, policy_id, payment_frequency, responsible_party, total_coverage_premium, total_tax, policy_fees, total_premium_without_installment_fee, total_premium_with_installment_fee)
        VALUES (v_client_id, v_policy_id, 'Annual', 'Insured', 2100.00, 72.00, 195.00, 2367.00, 2367.00)
        RETURNING id INTO v_premium_id;

        INSERT INTO policy_payment_transaction (client_id, policy_premium_id, amount_due, invoice_date, due_date, transaction_payment_date, is_paid, transaction_status)
        VALUES (v_client_id, v_premium_id, 2367.00, '2024-05-01', '2024-05-01', '2024-05-01', true, 'Paid');

        INSERT INTO policy_commission (client_id, policy_id, intermediary_id, producer_id, commission_percentage, installment_commission, annual_commission, total_coverage_premium, payment_frequency)
        VALUES (v_client_id, v_policy_id, v_intermediary_id, v_producer_id, 12.00, 252.00, 252.00, 2100.00, 'Annual')
        RETURNING id INTO v_commission_id;

        INSERT INTO commission_payment_transaction (client_id, policy_commission_id, commission_amount_due, invoice_date, due_date, is_paid)
        VALUES (v_client_id, v_commission_id, 252.00, '2024-05-01', '2024-06-01', false);

        INSERT INTO additional_insured (client_id, policy_id, first_name, middle_name, last_name, relationship, telephone_number_cc, telephone_number, email, insured_type)
        VALUES (v_client_id, v_policy_id, 'Daniel', NULL, 'Reyes', 'Primary Insured', '+1', '2035557712', 'daniel.reyes@test.com', 'Primary');

        INSERT INTO risk_address (client_id, policy_id, address_type, address_line1, country, state, city, county, zip_code, is_active)
        VALUES (v_client_id, v_policy_id, 'Risk', '77 Ridgeline Way', 'United States', 'Connecticut', 'Danbury', 'Fairfield County', '06810', true);
    END IF;

    -- ── Policy 2: Business, HB-2024-00011 ────────────────────────────────────
    IF NOT EXISTS (SELECT 1 FROM policy WHERE policy_number = 'HB-2024-00011') THEN
        INSERT INTO intermediary (client_id, intermediary_code, status, intermediary_name, legal_entity)
        VALUES (v_client_id, 'INT0011', 'Active', 'Harborline Insurance Group', 'LLC')
        RETURNING id INTO v_intermediary_id;

        INSERT INTO producer (client_id, intermediary_id, producer_code, status, first_name, last_name, telephone_number_cc, telephone_number, email)
        VALUES (v_client_id, v_intermediary_id, 'PC0011', 'Active', 'Marcus', 'Bellweather', '+1', '2035558821', 'marcus.bellweather@harborline.com')
        RETURNING id INTO v_producer_id;

        INSERT INTO account (client_id, account_type, legal_business_name, doing_business_as, producer_id, intermediary_id, status)
        VALUES (v_client_id, 'business', 'Ridgewood Holdings LLC', 'Ridgewood Properties', v_producer_id, v_intermediary_id, 'Active')
        RETURNING id INTO v_account_id;

        INSERT INTO policy (client_id, policy_number, insured_name, lob, sub_product, effective_date, status, producer_id, intermediary_id, account_id, policy_type, policy_status, do_not_renew, expiry_date)
        VALUES (v_client_id, 'HB-2024-00011', 'Ridgewood Holdings LLC', 'E&S Homeowners', 'SuperPerils', '2024-06-15', 'Active', v_producer_id, v_intermediary_id, v_account_id, 'POLICY', 'Active', false, '2025-06-15')
        RETURNING id INTO v_policy_id;

        INSERT INTO policy_product (client_id, policy_id, product_id, sub_product_id, state)
        VALUES (v_client_id, v_policy_id, 13, 18, 'New Hampshire');

        INSERT INTO policy_premium (client_id, policy_id, payment_frequency, responsible_party, total_coverage_premium, total_tax, policy_fees, total_premium_without_installment_fee, total_premium_with_installment_fee)
        VALUES (v_client_id, v_policy_id, 'Annual', 'Insured', 3150.00, 108.00, 195.00, 3453.00, 3453.00)
        RETURNING id INTO v_premium_id;

        INSERT INTO policy_payment_transaction (client_id, policy_premium_id, amount_due, invoice_date, due_date, transaction_payment_date, is_paid, transaction_status)
        VALUES (v_client_id, v_premium_id, 3453.00, '2024-06-15', '2024-06-15', '2024-06-15', true, 'Paid');

        INSERT INTO policy_commission (client_id, policy_id, intermediary_id, producer_id, commission_percentage, installment_commission, annual_commission, total_coverage_premium, payment_frequency)
        VALUES (v_client_id, v_policy_id, v_intermediary_id, v_producer_id, 12.00, 378.00, 378.00, 3150.00, 'Annual')
        RETURNING id INTO v_commission_id;

        INSERT INTO commission_payment_transaction (client_id, policy_commission_id, commission_amount_due, invoice_date, due_date, is_paid)
        VALUES (v_client_id, v_commission_id, 378.00, '2024-06-15', '2024-07-15', false);

        INSERT INTO additional_insured (client_id, policy_id, first_name, middle_name, last_name, relationship, telephone_number_cc, telephone_number, email, insured_type)
        VALUES (v_client_id, v_policy_id, 'Ridgewood', NULL, 'Holdings LLC', 'Primary Insured', '+1', '2035558821', 'contact@ridgewoodholdings.com', 'Primary');

        INSERT INTO risk_address (client_id, policy_id, address_type, address_line1, country, state, city, county, zip_code, is_active)
        VALUES (v_client_id, v_policy_id, 'Risk', '14 Harborview Terrace', 'United States', 'New Hampshire', 'Portsmouth', 'Rockingham County', '03801', true);
    END IF;
END $$;
