-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Relax UNIQUE(policy_number, client_id) on "policy" — DRAFT pending-transaction rows
-- (endorsements/renewals in progress) share the SAME policy_number as the issued policy
-- they're drafted against (see OutSystems GetAllPendingTransactions), so multiple policy
-- rows with an identical policy_number must be able to coexist per client.
-- Replaced with a non-unique index to keep policy_number lookups fast.
-- Run AFTER 013_policy_summary_seed.sql

ALTER TABLE policy DROP CONSTRAINT IF EXISTS policy_policy_number_client_id_key;

CREATE INDEX IF NOT EXISTS idx_policy_policynumber_clientid ON policy(policy_number, client_id);
