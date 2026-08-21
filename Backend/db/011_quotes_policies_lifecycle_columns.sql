-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Quotes & Policies (Underwriting) — follow-up patch to 010_quotes_policies_schema.sql
-- Run AFTER 010_quotes_policies_schema.sql
--
-- Gap found while porting the register/list repositories: the prototype's server.js
-- (GET .../nb-quotes/kpis, .../endorsements/kpis, .../renewals/kpis, .../policies/kpis,
-- and the corresponding list endpoints) filters/sorts on p.policy_type, p.policy_status
-- and p.expiry_date, and joins on p.intermediary_type — none of which were added by
-- 010 (which only extended "policy" with the underwriting detail columns, reusing the
-- existing claims "status" column instead of the prototype's separate "policy_status").
--
-- We deliberately do NOT rename/reuse the existing "status" column (varchar(50) NOT
-- NULL DEFAULT 'Active') — it is load-bearing for the Claims module (see Policy.cs /
-- ClaimRepository.cs, Policy.Status). "policy_status" below is the distinct
-- underwriting lifecycle status (Draft/Submitted/Bound/Active/Cancelled/...), matching
-- the prototype's separate column of the same name.

-- Also add the standard audit columns (created_by/updated_by/updated_on) that the original
-- 004_claims_schema.sql "policy" table lacked (it only had created_on) — needed now that
-- Policy.cs carries full audit fields per convention for the underwriting write paths
-- (SubmissionRepository.SyncPolicyFromSubmissionAsync sets UpdatedBy/UpdatedOn).
ALTER TABLE policy
    ADD COLUMN IF NOT EXISTS policy_type        varchar(50),
    ADD COLUMN IF NOT EXISTS policy_status       varchar(50),
    ADD COLUMN IF NOT EXISTS expiry_date         date,
    ADD COLUMN IF NOT EXISTS intermediary_type   varchar(50),
    ADD COLUMN IF NOT EXISTS created_by          bigint REFERENCES "user"(id),
    ADD COLUMN IF NOT EXISTS updated_by          bigint REFERENCES "user"(id),
    ADD COLUMN IF NOT EXISTS updated_on          timestamptz;

CREATE INDEX IF NOT EXISTS idx_policy_policytype   ON policy(policy_type);
CREATE INDEX IF NOT EXISTS idx_policy_policystatus ON policy(policy_status);

-- policy_extended.prior_policy_id already FKs to policy(id) (see 010). The prototype
-- additionally displayed a free-text "prior_policy_number" (renewals list / snapshot);
-- rather than duplicate that as a redundant string column, repositories resolve it via
-- a join to policy_extended.prior_policy_id -> policy.policy_number.
