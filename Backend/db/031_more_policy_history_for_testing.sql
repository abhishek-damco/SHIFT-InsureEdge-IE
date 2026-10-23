-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Dev/test seed: bring HB-2024-00001's Policy History up to 5+ rows so the
-- Policy Summary page's "View All" (shown only when history.length > 3) can
-- be exercised end-to-end.

INSERT INTO policy_transaction (client_id, policy_number, effective_date, expiration_date, transaction_type, transaction_effective_date, status, main_policy_id, redirection_policy_id, is_show_in_timeline)
SELECT p.client_id, p.policy_number, p.effective_date, p.expiry_date, 'RenewalIndividual', p.effective_date + interval '365 days', 'Active', p.id, p.id, true
FROM policy p WHERE p.policy_number = 'HB-2024-00001' AND p.policy_status <> 'Draft'
ON CONFLICT DO NOTHING;

INSERT INTO policy_transaction (client_id, policy_number, effective_date, expiration_date, transaction_type, transaction_effective_date, status, main_policy_id, redirection_policy_id, is_show_in_timeline)
SELECT p.client_id, p.policy_number, p.effective_date, p.expiry_date, 'EndorsementIndividual', p.effective_date + interval '60 days', 'Inactive', p.id, p.id, true
FROM policy p WHERE p.policy_number = 'HB-2024-00001' AND p.policy_status <> 'Draft'
ON CONFLICT DO NOTHING;

INSERT INTO policy_transaction (client_id, policy_number, effective_date, expiration_date, transaction_type, transaction_effective_date, status, main_policy_id, redirection_policy_id, is_show_in_timeline)
SELECT p.client_id, p.policy_number, p.effective_date, p.expiry_date, 'EndorsementIndividual', p.effective_date + interval '90 days', 'Inactive', p.id, p.id, true
FROM policy p WHERE p.policy_number = 'HB-2024-00001' AND p.policy_status <> 'Draft'
ON CONFLICT DO NOTHING;
