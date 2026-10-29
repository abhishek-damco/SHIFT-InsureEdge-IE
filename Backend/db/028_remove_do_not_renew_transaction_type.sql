-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Adds the "RemoveDoNotRenew" transaction type code, used by RemoveDoNotRenewAsync's
-- Policy History row when a Do Not Renew status is reverted back to Active.
INSERT INTO policy_transaction_type (code, label, sort_order) VALUES
    ('RemoveDoNotRenew', 'Do Not Renew Removed', 21)
ON CONFLICT (code) DO NOTHING;
