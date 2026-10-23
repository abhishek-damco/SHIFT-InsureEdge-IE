-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Dev seed: 5 more fully-populated ACTIVE individual policies, purely so Endorse Policy
-- (and Cancel/Cancel-Rewrite) can be tested repeatedly across multiple clean policies
-- without running into "already has an open endorsement" conflicts from prior runs.
-- Run AFTER 029_more_active_policies_for_testing.sql

DO $$
DECLARE
    v_client_id      bigint := 1;
    v_intermediary_id bigint;
    v_producer_id    bigint;
    v_account_id     bigint;
    v_policy_id      bigint;
    v_premium_id     bigint;
    v_commission_id  bigint;
    v_policy_number  text;
    v_first_name     text;
    v_last_name      text;
    v_email          text;
    v_effective      date;
    v_premium_amt    numeric;
    v_state          text;
    v_city           text;
    v_zip            text;
    v_addr           text;
    v_county         text;
    v_idx            int;
BEGIN
    FOR v_idx IN 12..16 LOOP
        v_policy_number := 'HB-2024-000' || v_idx;
        CONTINUE WHEN EXISTS (SELECT 1 FROM policy WHERE policy_number = v_policy_number);

        CASE v_idx
            WHEN 12 THEN v_first_name := 'Owen';    v_last_name := 'Whitfield'; v_email := 'owen.whitfield@test.com';   v_effective := '2024-02-01'; v_premium_amt := 1890.00; v_state := 'Texas';        v_city := 'Austin';       v_zip := '73301'; v_addr := '412 Cedar Ridge Ln';    v_county := 'Travis County';
            WHEN 13 THEN v_first_name := 'Maya';     v_last_name := 'Lindqvist'; v_email := 'maya.lindqvist@test.com';  v_effective := '2024-04-10'; v_premium_amt := 2240.00; v_state := 'Georgia';      v_city := 'Savannah';     v_zip := '31401'; v_addr := '89 Moss Oak Ct';        v_county := 'Chatham County';
            WHEN 14 THEN v_first_name := 'Elias';    v_last_name := 'Nakamura';  v_email := 'elias.nakamura@test.com';  v_effective := '2024-05-22'; v_premium_amt := 1675.00; v_state := 'Oregon';       v_city := 'Bend';         v_zip := '97701'; v_addr := '210 Timberline Dr';     v_county := 'Deschutes County';
            WHEN 15 THEN v_first_name := 'Priscilla'; v_last_name := 'Okafor';    v_email := 'priscilla.okafor@test.com'; v_effective := '2024-07-03'; v_premium_amt := 1980.00; v_state := 'Arizona';      v_city := 'Tucson';       v_zip := '85701'; v_addr := '56 Desert Willow Rd';   v_county := 'Pima County';
            WHEN 16 THEN v_first_name := 'Gabriel';   v_last_name := 'Moreno';    v_email := 'gabriel.moreno@test.com';  v_effective := '2024-08-19'; v_premium_amt := 2350.00; v_state := 'Colorado';     v_city := 'Boulder';      v_zip := '80301'; v_addr := '33 Flatiron Vista Way'; v_county := 'Boulder County';
        END CASE;

        INSERT INTO intermediary (client_id, intermediary_code, status, intermediary_name, legal_entity)
        VALUES (v_client_id, 'INT0' || v_idx, 'Active', v_first_name || ' ' || v_last_name || ' Agency', 'LLC')
        RETURNING id INTO v_intermediary_id;

        INSERT INTO producer (client_id, intermediary_id, producer_code, status, first_name, last_name, telephone_number_cc, telephone_number, email)
        VALUES (v_client_id, v_intermediary_id, 'PC0' || v_idx, 'Active', 'Producer', v_last_name, '+1', '203555' || (7000 + v_idx)::text, 'producer' || v_idx || '@testagency.com')
        RETURNING id INTO v_producer_id;

        INSERT INTO account (client_id, account_type, first_name, last_name, producer_id, intermediary_id, status)
        VALUES (v_client_id, 'individual', v_first_name, v_last_name, v_producer_id, v_intermediary_id, 'Active')
        RETURNING id INTO v_account_id;

        INSERT INTO policy (client_id, policy_number, insured_name, lob, sub_product, effective_date, status, producer_id, intermediary_id, account_id, policy_type, policy_status, do_not_renew, expiry_date)
        VALUES (v_client_id, v_policy_number, v_first_name || ' ' || v_last_name, 'E&S Homeowners', 'SuperPerils', v_effective, 'Active', v_producer_id, v_intermediary_id, v_account_id, 'POLICY', 'Active', false, v_effective + interval '1 year')
        RETURNING id INTO v_policy_id;

        INSERT INTO policy_product (client_id, policy_id, product_id, sub_product_id, state)
        VALUES (v_client_id, v_policy_id, 13, 18, v_state);

        INSERT INTO policy_premium (client_id, policy_id, payment_frequency, responsible_party, total_coverage_premium, total_tax, policy_fees, total_premium_without_installment_fee, total_premium_with_installment_fee)
        VALUES (v_client_id, v_policy_id, 'Annual', 'Insured', v_premium_amt, round(v_premium_amt * 0.034, 2), 195.00, v_premium_amt + round(v_premium_amt * 0.034, 2) + 195.00, v_premium_amt + round(v_premium_amt * 0.034, 2) + 195.00)
        RETURNING id INTO v_premium_id;

        INSERT INTO policy_payment_transaction (client_id, policy_premium_id, amount_due, invoice_date, due_date, transaction_payment_date, is_paid, transaction_status)
        VALUES (v_client_id, v_premium_id, v_premium_amt + round(v_premium_amt * 0.034, 2) + 195.00, v_effective, v_effective, v_effective, true, 'Paid');

        INSERT INTO policy_commission (client_id, policy_id, intermediary_id, producer_id, commission_percentage, installment_commission, annual_commission, total_coverage_premium, payment_frequency)
        VALUES (v_client_id, v_policy_id, v_intermediary_id, v_producer_id, 12.00, round(v_premium_amt * 0.12, 2), round(v_premium_amt * 0.12, 2), v_premium_amt, 'Annual')
        RETURNING id INTO v_commission_id;

        INSERT INTO commission_payment_transaction (client_id, policy_commission_id, commission_amount_due, invoice_date, due_date, is_paid)
        VALUES (v_client_id, v_commission_id, round(v_premium_amt * 0.12, 2), v_effective, v_effective + interval '1 month', false);

        INSERT INTO additional_insured (client_id, policy_id, first_name, last_name, relationship, telephone_number_cc, telephone_number, email, insured_type)
        VALUES (v_client_id, v_policy_id, v_first_name, v_last_name, 'Primary Insured', '+1', '203555' || (7000 + v_idx)::text, v_email, 'Primary');

        INSERT INTO risk_address (client_id, policy_id, address_type, address_line1, country, state, city, county, zip_code, is_active)
        VALUES (v_client_id, v_policy_id, 'Risk', v_addr, 'United States', v_state, v_city, v_county, v_zip, true);
    END LOOP;
END $$;
