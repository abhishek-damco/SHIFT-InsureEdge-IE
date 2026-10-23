-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Generic audit log — ported from OutSystems "Audits" entity. Backs the Policy Summary
-- "Timeline" screen: SummaryBlock's GetAuditsByTransactions joins Audits to policy
-- transactions and groups entries by day.
-- TransactionId is modeled as a real FK to policy_transaction(id) here (source entity had
-- it as free text) — ties each audit row to the transaction it logs, consistent with the
-- rest of this schema's FK conventions.
-- Run AFTER 017_claims_screen_seed.sql

CREATE TABLE IF NOT EXISTS audits (
    id                     bigserial     PRIMARY KEY,
    client_id              bigint        NOT NULL REFERENCES client(id),
    transaction_id         bigint        REFERENCES policy_transaction(id) ON DELETE CASCADE,
    activity_type          varchar(50),
    record_id              bigint,
    activity_description   varchar(500),
    module                 varchar(50),
    created_date_time      timestamptz   NOT NULL DEFAULT now(),
    created_by             bigint        REFERENCES "user"(id),
    audit_bin              bytea,
    table_name             varchar(100)
);
CREATE INDEX IF NOT EXISTS idx_audits_clientid ON audits(client_id);
CREATE INDEX IF NOT EXISTS idx_audits_transactionid ON audits(transaction_id);

-- ─── Dev seed: one audit row per HB-2024-00001 policy_transaction, spread across a few
-- days so the Timeline screen shows more than one date pill ──────────────────────────
INSERT INTO audits (client_id, transaction_id, activity_type, record_id, activity_description, module, created_date_time, created_by, table_name)
SELECT pt.client_id, pt.id, 'INSERT', pt.main_policy_id, 'New Business Issuance', 'Policy', pt.created_on, 1, 'policy_transaction'
FROM policy_transaction pt
WHERE pt.policy_number = 'HB-2024-00001' AND pt.transaction_type = 'NewBusiness';

INSERT INTO audits (client_id, transaction_id, activity_type, record_id, activity_description, module, created_date_time, created_by, table_name)
SELECT pt.client_id, pt.id, 'INSERT', pt.main_policy_id, 'Endorsement Issuance', 'Policy', pt.created_on + interval '2 days', 1, 'policy_transaction'
FROM policy_transaction pt
WHERE pt.policy_number = 'HB-2024-00001' AND pt.transaction_type = 'EndorsementIndividual';

INSERT INTO audits (client_id, transaction_id, activity_type, record_id, activity_description, module, created_date_time, created_by, table_name)
SELECT pt.client_id, pt.id, 'UPDATE', pt.main_policy_id, 'Cancellation Processed', 'Policy', pt.created_on + interval '5 days', 1, 'policy_transaction'
FROM policy_transaction pt
WHERE pt.policy_number = 'HB-2024-00001' AND pt.transaction_type = 'CancelPolicy';
