-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Correct policy_payment_transaction_extended / cancellation_payment_transaction to match
-- the real OutSystems entities (PolicyPaymentTransaction_Extended / CancellationPaymentTransaction),
-- which the guessed schema in 015 got wrong on a few columns.
-- Run AFTER 015_billing_detail_tables.sql

-- ─── PolicyPaymentTransaction_Extended ─────────────────────────────────────────
-- Real entity: PolicyPaymentTransactionId (PK/FK), SurplusLinePremiumTax,
-- SurplusLineTaxPercentile, SurplusLineTaxInstallmentAmount, FirePremiumTax,
-- FirePremiumTaxPercentile, FirePremiumTaxInstallmentAmount, CoveragePremium,
-- TotalInstalmentTaxes, InstallmentFee. No surrogate Id, no CreatedOn.
ALTER TABLE policy_payment_transaction_extended
    ADD COLUMN IF NOT EXISTS surplus_line_premium_tax     numeric(18,2),
    ADD COLUMN IF NOT EXISTS surplus_line_tax_percentile   numeric(9,4),
    ADD COLUMN IF NOT EXISTS fire_premium_tax               numeric(18,2),
    ADD COLUMN IF NOT EXISTS fire_premium_tax_percentile    numeric(9,4),
    ADD COLUMN IF NOT EXISTS total_instalment_taxes         numeric(18,2);

ALTER TABLE policy_payment_transaction_extended DROP CONSTRAINT IF EXISTS policy_payment_transaction_extended_pkey;
ALTER TABLE policy_payment_transaction_extended ADD PRIMARY KEY (policy_payment_transaction_id);
ALTER TABLE policy_payment_transaction_extended DROP COLUMN IF EXISTS id;
ALTER TABLE policy_payment_transaction_extended DROP COLUMN IF EXISTS created_on;

-- ─── CancellationPaymentTransaction ─────────────────────────────────────────────
-- Real entity: Id, PolicyId (FK, one-to-many — NOT tied to a specific installment),
-- RefundAmount, TransactionPaymentDate, TransactionStatus, TransactionId,
-- PaymentMethod, ResponseCode, ResponseJSON, CreatedOn, CoveragePremium,
-- SurplusLinesTax, FirePremiumTax, StampingFee, PolicyFee.
ALTER TABLE cancellation_payment_transaction
    DROP CONSTRAINT IF EXISTS cancellation_payment_transaction_policy_payment_transaction_id_fkey,
    DROP COLUMN IF EXISTS policy_payment_transaction_id,
    ADD COLUMN IF NOT EXISTS refund_amount            numeric(18,2),
    ADD COLUMN IF NOT EXISTS transaction_payment_date  date,
    ADD COLUMN IF NOT EXISTS transaction_status        varchar(50),
    ADD COLUMN IF NOT EXISTS transaction_id            varchar(50),
    ADD COLUMN IF NOT EXISTS payment_method            varchar(50),
    ADD COLUMN IF NOT EXISTS response_code             varchar(50),
    ADD COLUMN IF NOT EXISTS response_json             varchar(2000);

-- ─── Dev seed fix-up: refresh HB-2024-00001 seed rows for the corrected shape ──
UPDATE policy_payment_transaction_extended ppte
SET surplus_line_premium_tax = 58.79, surplus_line_tax_percentile = 3.34, fire_premium_tax = 0.00, fire_premium_tax_percentile = 0.00, total_instalment_taxes = 58.79
FROM policy_payment_transaction ppt
JOIN policy_premium pp ON pp.id = ppt.policy_premium_id
JOIN policy p ON p.id = pp.policy_id
WHERE ppte.policy_payment_transaction_id = ppt.id AND p.policy_number = 'HB-2024-00001' AND p.policy_status = 'Cancelled';

UPDATE cancellation_payment_transaction cpt
SET refund_amount = 0.00, transaction_payment_date = '2024-06-24', transaction_status = 'Cancelled'
FROM policy p
WHERE cpt.policy_id = p.id AND p.policy_number = 'HB-2024-00001' AND p.policy_status = 'Cancelled';
