-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Dev seed: populate underwriting tables for policy HB-2024-00003 as an ACTIVE
-- individual policy (mirrors 013/019's pattern), so there's an Active/Bound policy
-- under the "individual" insuredType to exercise the Endorse Policy flow against.
-- Run AFTER 019_active_policy_seed.sql

DO $$
DECLARE
    v_policy_id      bigint;
    v_client_id      bigint;
    v_intermediary_id bigint;
    v_producer_id    bigint;
    v_account_id     bigint;
    v_premium_id     bigint;
    v_commission_id  bigint;
BEGIN
    SELECT id, client_id INTO v_policy_id, v_client_id FROM policy WHERE policy_number = 'HB-2024-00003';
    IF v_policy_id IS NULL THEN
        RAISE NOTICE 'Policy HB-2024-00003 not found, skipping seed';
        RETURN;
    END IF;

    INSERT INTO intermediary (client_id, intermediary_code, status, intermediary_name, legal_entity)
    VALUES (v_client_id, 'INT0003', 'Active', 'Vision Tech Insurance', 'LLC')
    RETURNING id INTO v_intermediary_id;

    INSERT INTO producer (client_id, intermediary_id, producer_code, status, first_name, last_name, telephone_number_cc, telephone_number, email)
    VALUES (v_client_id, v_intermediary_id, 'PC0003', 'Active', 'Priya', 'Nadkarni', '+1', '2035559981', 'priya.nadkarni@visiontech.com')
    RETURNING id INTO v_producer_id;

    INSERT INTO account (client_id, account_type, first_name, middle_name, last_name, producer_id, intermediary_id, status)
    VALUES (v_client_id, 'individual', 'Patricia', NULL, 'Williams', v_producer_id, v_intermediary_id, 'Active')
    RETURNING id INTO v_account_id;

    UPDATE policy
    SET producer_id = v_producer_id,
        intermediary_id = v_intermediary_id,
        account_id = v_account_id,
        policy_type = 'POLICY',
        policy_status = 'Active',
        do_not_renew = false,
        expiry_date = COALESCE(expiry_date, effective_date + interval '1 year')
    WHERE id = v_policy_id;

    INSERT INTO policy_product (client_id, policy_id, product_id, sub_product_id, state)
    VALUES (v_client_id, v_policy_id, 13, 18, 'Connecticut');

    INSERT INTO policy_premium (client_id, policy_id, payment_frequency, responsible_party, total_coverage_premium, total_tax, policy_fees, total_premium_without_installment_fee, total_premium_with_installment_fee)
    VALUES (v_client_id, v_policy_id, 'Annual', 'Insured', 1980.00, 68.20, 195.00, 2243.20, 2243.20)
    RETURNING id INTO v_premium_id;

    INSERT INTO policy_payment_transaction (client_id, policy_premium_id, amount_due, invoice_date, due_date, transaction_payment_date, is_paid, transaction_status)
    VALUES (v_client_id, v_premium_id, 2243.20, '2023-11-01', '2023-11-01', '2023-11-01', true, 'Paid');

    INSERT INTO policy_commission (client_id, policy_id, intermediary_id, producer_id, commission_percentage, annual_commission, total_coverage_premium, payment_frequency)
    VALUES (v_client_id, v_policy_id, v_intermediary_id, v_producer_id, 12.00, 237.60, 1980.00, 'Annual')
    RETURNING id INTO v_commission_id;

    INSERT INTO commission_payment_transaction (client_id, policy_commission_id, commission_amount_due, invoice_date, due_date, is_paid)
    VALUES (v_client_id, v_commission_id, 237.60, '2023-11-01', '2023-12-01', false);

    INSERT INTO additional_insured (client_id, policy_id, first_name, middle_name, last_name, relationship, telephone_number_cc, telephone_number, email, insured_type)
    VALUES
        (v_client_id, v_policy_id, 'Patricia', NULL, 'Williams', 'Primary Insured', '+1', '2035559981', 'patricia.williams@test.com', 'Primary');

    INSERT INTO risk_address (client_id, policy_id, address_type, address_line1, address_line2, country, state, city, county, zip_code, is_active)
    VALUES (v_client_id, v_policy_id, 'Risk', '212 Maplewood Court', NULL, 'United States', 'Connecticut', 'Stamford', 'Fairfield County', '06905', true);
END $$;
