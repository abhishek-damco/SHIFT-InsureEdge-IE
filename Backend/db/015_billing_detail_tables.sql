-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Premium Breakdown (Written/Earned/Unearned) support for the Billing detail screen.
-- Ported from OutSystems GetPolicyRefundBilling_BL / GetWrittenPremium SQL + assignment
-- logic: per-installment breakdown lives on PolicyPaymentTransaction_Extended (1:1 with
-- policy_payment_transaction), and the "unearned" snapshot at cancellation time lives on
-- CancellationPaymentTransaction (1:1 with the specific installment transaction it offsets).
-- These are populated by the (out-of-scope) cancellation workflow; we only need the
-- schema + read logic here.
-- Run AFTER 014_relax_policy_number_uniqueness.sql

CREATE TABLE IF NOT EXISTS policy_payment_transaction_extended (
    id                                   bigserial     PRIMARY KEY,
    client_id                            bigint        NOT NULL REFERENCES client(id),
    policy_payment_transaction_id        bigint        NOT NULL UNIQUE REFERENCES policy_payment_transaction(id) ON DELETE CASCADE,
    coverage_premium                     numeric(18,2) NOT NULL DEFAULT 0,
    surplus_line_tax_installment_amount  numeric(18,2) NOT NULL DEFAULT 0,
    fire_premium_tax_installment_amount  numeric(18,2) NOT NULL DEFAULT 0,
    installment_fee                      numeric(18,2) NOT NULL DEFAULT 0,
    created_on                           timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ppte_clientid ON policy_payment_transaction_extended(client_id);

CREATE TABLE IF NOT EXISTS cancellation_payment_transaction (
    id                             bigserial     PRIMARY KEY,
    client_id                      bigint        NOT NULL REFERENCES client(id),
    policy_id                      bigint        NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    policy_payment_transaction_id  bigint        NOT NULL REFERENCES policy_payment_transaction(id) ON DELETE CASCADE,
    coverage_premium                numeric(18,2) NOT NULL DEFAULT 0,
    surplus_lines_tax                numeric(18,2) NOT NULL DEFAULT 0,
    fire_premium_tax                 numeric(18,2) NOT NULL DEFAULT 0,
    stamping_fee                     numeric(18,2) NOT NULL DEFAULT 0,
    policy_fee                       numeric(18,2) NOT NULL DEFAULT 0,
    created_on                      timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cpt_clientid ON cancellation_payment_transaction(client_id);
CREATE INDEX IF NOT EXISTS idx_cpt_policyid ON cancellation_payment_transaction(policy_id);

-- ─── Dev seed: split the flat policy_fees into policy_fee + stamping_fee, matching the
-- example (Coverage 1761.00 + Surplus 58.79 + Fire 0.00 + Stamping 3.52 + Policy Fee 195.00
-- = Total 2018.31), and seed the per-installment breakdown + fully-earned cancellation
-- snapshot for the one paid installment on HB-2024-00001.
UPDATE policy_premium
SET stamping_fee = 3.52, policy_fees = 195.00
WHERE policy_id = (SELECT id FROM policy WHERE policy_number = 'HB-2024-00001' AND policy_status = 'Cancelled');

INSERT INTO policy_payment_transaction_extended (client_id, policy_payment_transaction_id, coverage_premium, surplus_line_tax_installment_amount, fire_premium_tax_installment_amount, installment_fee)
SELECT ppt.client_id, ppt.id, 1761.00, 58.79, 0.00, 0.00
FROM policy_payment_transaction ppt
JOIN policy_premium pp ON pp.id = ppt.policy_premium_id
JOIN policy p ON p.id = pp.policy_id
WHERE p.policy_number = 'HB-2024-00001' AND p.policy_status = 'Cancelled'
ON CONFLICT (policy_payment_transaction_id) DO NOTHING;

INSERT INTO cancellation_payment_transaction (client_id, policy_id, policy_payment_transaction_id, coverage_premium, surplus_lines_tax, fire_premium_tax, stamping_fee, policy_fee)
SELECT ppt.client_id, p.id, ppt.id, 0.00, 0.00, 0.00, 0.00, 0.00
FROM policy_payment_transaction ppt
JOIN policy_premium pp ON pp.id = ppt.policy_premium_id
JOIN policy p ON p.id = pp.policy_id
WHERE p.policy_number = 'HB-2024-00001' AND p.policy_status = 'Cancelled';

-- Cancellation Details section needs policy_extended.cancellation_effective_date on the
-- cancelled policy itself (only had it seeded earlier on the unrelated DRAFT sibling row).
INSERT INTO policy_extended (policy_id, client_id, cancellation_effective_date)
SELECT id, client_id, '2024-06-24'
FROM policy WHERE policy_number = 'HB-2024-00001' AND policy_status = 'Cancelled'
ON CONFLICT (policy_id) DO UPDATE SET cancellation_effective_date = EXCLUDED.cancellation_effective_date;
