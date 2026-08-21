-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Policy Transactions (Policy History) — ported from OutSystems "PolicyTransactions" +
-- "PolicyConfigurationsTransactionType" (static entity) in module IE_Policy_CS.
-- Run AFTER 011_quotes_policies_lifecycle_columns.sql
--
-- Replaces the OutSystems GetPolicyHistory_HB action, which derived history by
-- re-querying Policy2/Policy_Extended and grouping by a policy-number string
-- convention not present in this codebase. Here Policy History is instead backed
-- by a purpose-built log table, written whenever a policy transaction occurs
-- (new business / endorsement / renewal / cancellation / reinstate / ...).

-- ─── Static reference: transaction type code -> display label ─────────────────
CREATE TABLE IF NOT EXISTS policy_transaction_type (
    code        varchar(50)  PRIMARY KEY,
    label       varchar(100) NOT NULL,
    sort_order  integer      NOT NULL DEFAULT 0
);

INSERT INTO policy_transaction_type (code, label, sort_order) VALUES
    ('NewBusiness',            'New Business',            10),
    ('NewBusinessIndividual',  'New Business',            11),
    ('BusinessPolicy',         'New Business',            12),
    ('IndividualPolicy',       'New Business',            13),
    ('EndorsementIndividual',  'Endorsement',              20),
    ('EndorsementBusiness',    'Endorsement',              21),
    ('RenewalIndividual',      'Renewal',                  30),
    ('RenewalBusiness',        'Renewal',                  31),
    ('DoNotRenew',             'Non-Renewed',              40),
    ('CancelPolicy',           'Cancellation',             50),
    ('Cancel_Rewrite',         'Cancel / Rewrite',         51),
    ('DeclineQuote',           'Declined',                 60),
    ('ReinstatePolicy',        'Reinstatement',            70)
ON CONFLICT (code) DO NOTHING;

-- ─── Policy transaction log (Policy History / Timeline source) ────────────────
CREATE TABLE IF NOT EXISTS policy_transaction (
    id                          bigserial     PRIMARY KEY,
    client_id                   bigint        NOT NULL REFERENCES client(id),
    policy_number               varchar(100)  NOT NULL,
    effective_date              date,
    expiration_date             date,
    transaction_type            varchar(50)   REFERENCES policy_transaction_type(code),
    transaction_effective_date  date,
    status                      varchar(50),
    main_policy_id              bigint        NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    redirection_policy_id       bigint        REFERENCES policy(id),
    is_show_in_timeline         boolean       NOT NULL DEFAULT true,
    created_by                  bigint        REFERENCES "user"(id),
    created_on                  timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_policytransaction_clientid       ON policy_transaction(client_id);
CREATE INDEX IF NOT EXISTS idx_policytransaction_mainpolicyid   ON policy_transaction(main_policy_id);
CREATE INDEX IF NOT EXISTS idx_policytransaction_redirectionid  ON policy_transaction(redirection_policy_id);

-- ─── Dev seed: sample history for the 3 policies seeded in 001-003 ────────────
INSERT INTO policy_transaction (client_id, policy_number, effective_date, expiration_date, transaction_type, transaction_effective_date, status, main_policy_id, redirection_policy_id, is_show_in_timeline)
SELECT p.client_id, p.policy_number, p.effective_date, p.expiry_date, 'NewBusiness', p.effective_date, 'Active', p.id, p.id, true
FROM policy p WHERE p.policy_number = 'HB-2024-00001'
ON CONFLICT DO NOTHING;

INSERT INTO policy_transaction (client_id, policy_number, effective_date, expiration_date, transaction_type, transaction_effective_date, status, main_policy_id, redirection_policy_id, is_show_in_timeline)
SELECT p.client_id, p.policy_number, p.effective_date, p.expiry_date, 'EndorsementIndividual', p.effective_date + interval '30 days', 'Active', p.id, p.id, true
FROM policy p WHERE p.policy_number = 'HB-2024-00001'
ON CONFLICT DO NOTHING;

INSERT INTO policy_transaction (client_id, policy_number, effective_date, expiration_date, transaction_type, transaction_effective_date, status, main_policy_id, redirection_policy_id, is_show_in_timeline)
SELECT p.client_id, p.policy_number, p.effective_date, p.expiry_date, 'CancelPolicy', p.effective_date + interval '60 days', 'Cancelled', p.id, p.id, true
FROM policy p WHERE p.policy_number = 'HB-2024-00001'
ON CONFLICT DO NOTHING;
