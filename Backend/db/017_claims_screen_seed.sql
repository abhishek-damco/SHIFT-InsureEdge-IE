-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Dev seed: worksheet payment/reserve rows so the Policy Summary "Claims" screen has
-- non-zero Incurred/Paid amounts to display for claim CLM-2024-00001 (policy HB-2024-00001).
-- Run AFTER 016_fix_billing_extended_tables.sql

INSERT INTO worksheet_payment (worksheet_id, client_id, coverage, cause_of_loss_description, payee_type, payee_name, payment_amount)
SELECT cw.id, cw.client_id, 'Dwelling', 'Fire', 'Insured', 'Joseph Mid TLast', 1500.00
FROM claim_worksheet cw
JOIN claim c ON c.id = cw.claim_id
WHERE c.claim_number = 'CLM-2024-00001';

INSERT INTO worksheet_reserve (worksheet_id, client_id, coverage, reserve_amount)
SELECT cw.id, cw.client_id, 'Dwelling', 500.00
FROM claim_worksheet cw
JOIN claim c ON c.id = cw.claim_id
WHERE c.claim_number = 'CLM-2024-00001';
