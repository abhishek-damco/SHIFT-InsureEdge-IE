-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Dev seed: populate the underwriting tables (producer/intermediary/account/policy_product/
-- policy_premium/policy_commission/commission_payment_transaction/policy_payment_transaction/
-- additional_insured/risk_address) for policy HB-2024-00001, so the Policy Summary screen
-- (Policy Information/Producer/Financials/Billing/Contacts/Claims) has real data to render
-- end-to-end instead of every section being empty.
-- Run AFTER 012_policy_transactions.sql

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
    SELECT id, client_id INTO v_policy_id, v_client_id FROM policy WHERE policy_number = 'HB-2024-00001';
    IF v_policy_id IS NULL THEN
        RAISE NOTICE 'Policy HB-2024-00001 not found, skipping seed';
        RETURN;
    END IF;

    INSERT INTO intermediary (client_id, intermediary_code, status, intermediary_name, legal_entity)
    VALUES (v_client_id, 'INT0001', 'Active', 'Juniper RE LLC', 'LLC')
    RETURNING id INTO v_intermediary_id;

    INSERT INTO producer (client_id, intermediary_id, producer_code, status, first_name, last_name, telephone_number_cc, telephone_number, email)
    VALUES (v_client_id, v_intermediary_id, 'PC0001', 'Active', 'Adam', 'Wyan', '+1', '2165551111', 'adam.wyan@juniperre.com')
    RETURNING id INTO v_producer_id;

    INSERT INTO account (client_id, account_type, first_name, middle_name, last_name, producer_id, intermediary_id, status)
    VALUES (v_client_id, 'individual', 'Joseph', 'Mid', 'TLast', v_producer_id, v_intermediary_id, 'Active')
    RETURNING id INTO v_account_id;

    UPDATE policy
    SET producer_id = v_producer_id,
        intermediary_id = v_intermediary_id,
        account_id = v_account_id,
        policy_type = 'POLICY',
        policy_status = 'Cancelled',
        do_not_renew = true,
        expiry_date = COALESCE(expiry_date, effective_date + interval '1 year')
    WHERE id = v_policy_id;

    INSERT INTO policy_product (client_id, policy_id, product_id, sub_product_id, state)
    VALUES (v_client_id, v_policy_id, 13, 18, 'California');

    INSERT INTO policy_premium (client_id, policy_id, payment_frequency, responsible_party, total_coverage_premium, total_tax, policy_fees, total_premium_without_installment_fee, total_premium_with_installment_fee)
    VALUES (v_client_id, v_policy_id, 'Annual', 'Insured', 1761.00, 58.79, 198.52, 2018.31, 2018.31)
    RETURNING id INTO v_premium_id;

    INSERT INTO policy_payment_transaction (client_id, policy_premium_id, amount_due, invoice_date, due_date, transaction_payment_date, is_paid, transaction_status)
    VALUES (v_client_id, v_premium_id, 2018.31, '2024-01-15', '2024-01-15', '2024-01-15', true, 'Paid');

    INSERT INTO policy_commission (client_id, policy_id, intermediary_id, producer_id, commission_percentage, annual_commission, total_coverage_premium, payment_frequency)
    VALUES (v_client_id, v_policy_id, v_intermediary_id, v_producer_id, 12.00, 211.32, 1761.00, 'Annual')
    RETURNING id INTO v_commission_id;

    INSERT INTO commission_payment_transaction (client_id, policy_commission_id, commission_amount_due, invoice_date, due_date, is_paid)
    VALUES (v_client_id, v_commission_id, 211.32, '2024-01-15', '2024-02-15', false);

    INSERT INTO additional_insured (client_id, policy_id, first_name, middle_name, last_name, relationship, telephone_number_cc, telephone_number, email, insured_type)
    VALUES
        (v_client_id, v_policy_id, 'Joseph', 'Mid', 'TLast', 'Primary Insured', '+1', '2165551111', 'chandrashekharm1@damcogroup.com', 'Primary'),
        (v_client_id, v_policy_id, 'Anthony', 'Junior', 'Mac', 'Spouse', '+1', '2125551234', 'ana@test.com', 'Additional'),
        (v_client_id, v_policy_id, 'Sunny', 'Mark', 'One', 'Other', '+1', '2125551111', 'boeingavi1@test.com', 'Additional');

    INSERT INTO risk_address (client_id, policy_id, address_type, address_line1, address_line2, country, state, city, county, zip_code, is_active)
    VALUES (v_client_id, v_policy_id, 'Risk', '10111 Morgan Lane', 'Suite # 205', 'United States', 'California', 'Plainsboro', 'Middlesex County', '85364', true);
END $$;
