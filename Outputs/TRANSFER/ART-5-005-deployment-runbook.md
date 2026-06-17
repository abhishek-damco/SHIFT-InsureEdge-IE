# ART-5-005 — Deployment Runbook
## InsureEdge Application Modernization (INSUREEDGE-2026)

> ## ⚠ HUMAN_VALIDATION_REQUIRED ⚠
>
> **This document contains step-by-step deployment procedures for a production system handling insurance policy, claims, and financial data. Every step must be reviewed and validated by qualified DevOps, DBA, and technical leads before execution. Steps marked [HUMAN GATE] are destructive or irreversible — they must NEVER be auto-executed.**
>
> **Do NOT treat any step in this document as pre-approved. Each execution requires real-time human decision and confirmation.**

**Status:** AI_GENERATED — HUMAN_VALIDATION_REQUIRED
**Produced by:** Transfer Agent
**Phase:** TRANSFER
**Date:** 2026-06-17
**Version:** 1.0
**Engagement:** INSUREEDGE-2026 | Customer: Hudson Bailey
**Source:** ART-4-008 (Deployment Specs), ART-3-015 (Cutover Strategy), ART-3-012 (TAD), ART-3-009 (Infrastructure), ART-4-006 (Migration Scripts)
**Gate reference:** DEC-4-0001 (FORGE complete, 2026-06-17)

---

## Open Blocking Items at TRANSFER Entry

The following items MUST be resolved before a production deployment can proceed. No deployment runbook step involving production should be executed while these remain open.

| DBT ID | Item | Impact |
|---|---|---|
| DBT-4-FORGE-017 | Production Azure Key Vault URL not resolved | `KEY_VAULT_URL_PROD` placeholder — `deploy-prod.yml` cannot authenticate |
| DBT-4-FORGE-018 | OIDC Federated Credentials not configured | All `azure/login@v2` steps fail |
| DBT-4-FORGE-019 | Static Web Apps resource names not in TAD | Frontend deployment blocked |
| GAP-2-INT-001 | TranzPay production URL unknown | Payment module cannot be tested in production |
| QST-1-INT-004 | HexCat API contract unknown | Risk scoring module cannot be verified |
| QST-1-INT-002 | LenderDock endpoint URL unknown | Mortgage notification cannot be smoke-tested |
| QST-1-INT-003 | Plumsail API key missing | Document generation cannot be smoke-tested |
| QST-3-MIG-001 | Downtime tolerance not confirmed | Maintenance window duration unconfirmed; ASM-3-MIG-001 assumed 4–8 hours |
| DBT-4-FORGE-016 | BankDetail AES encryption re-encryption | Encrypted field format compatibility unknown |
| DBT-4-FORGE-013 | User2 vs Users table ambiguity | Phase 4 migration script may need revision |

**Status: TRANSFER IN PROGRESS. Production deployment is NOT AUTHORIZED until all DBT- and GAP- blocking items above are resolved via human DEC-.**

---

## Section 0: Roles Referenced in This Runbook

| Role | Responsibilities |
|---|---|
| DevOps | GitHub Actions, Azure infrastructure, OIDC, pipeline execution |
| DBA | Database migration execution, validation queries, backup verification |
| Tech Lead | Application configuration, integration smoke tests, go/no-go technical assessment |
| Product Owner | Business smoke tests, final go/no-go APPROVE authority, stakeholder communication |
| Security Lead | Security validation gates (password check, Key Vault, encryption) |

---

## Section 1: Pre-Deployment Prerequisites

### Step 1.1 — Azure Infrastructure Provisioned
**Owner:** DevOps
**Prerequisite:** Terraform scripts reviewed and ready; Azure subscription access confirmed.
**Action:** Run `terraform apply` for the production environment (`infrastructure/terraform/environments/prod/main.tf`). Verify all resources created: App Service Plan (P2v3), App Service + staging slot, Azure Database for PostgreSQL Flexible Server (D4s_v3, Zone-HA), Azure Cache for Redis (Standard C1), Azure Blob Storage containers, Azure Application Gateway + WAF v2, Azure Static Web Apps, Azure Key Vault (`insuredge-kv-prod`), Azure App Configuration, Azure Application Insights.
**Validation gate:** `terraform output` returns all expected resource names and FQDNs. Azure portal confirms all resources in `rg-insuredge-prod` resource group. No resources in "Failed" state.
**Rollback:** `terraform destroy` (requires explicit approval — destructive). Terraform state preserved.

### Step 1.2 — Key Vault Secrets Loaded
**Owner:** DevOps + Security Lead
**Prerequisite:** Step 1.1 complete. All 22 secret values confirmed by integration owners (TranzPay, SMTP, LenderDock, HexCat, Plumsail, Google Maps, AES-256 key, DisburseCloud, RPS connection, JWT signing key).
**Action:** Load all 22 named secrets into `insuredge-kv-prod` via Azure CLI or Azure Portal. Reference list: ART-4-005 §9.3. Critical secrets: `TranzPay--BaseUrl` (production URL — GAP-2-INT-001 must be resolved), `Encryption--AesKey`, `Jwt--SigningKey`, `Smtp--Password`, `Db--ConnectionString--Production`.
**Validation gate:** `az keyvault secret list --vault-name insuredge-kv-prod` returns all 22 secret names. `az keyvault secret show --vault-name insuredge-kv-prod --name TranzPay--BaseUrl` returns a non-placeholder value.
**Rollback:** Delete incorrectly loaded secrets; reload with correct values.

### Step 1.3 — GitHub Actions OIDC Configured
**Owner:** DevOps
**Prerequisite:** Azure service principal created for production GitHub Actions. GitHub environment `production` exists with 2-reviewer protection.
**Action:** Configure federated credentials on the Azure service principal for the `production` GitHub environment. Set GitHub environment secrets: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `KEY_VAULT_URL_PROD`. Verify environment protection rules: 2 reviewers required (project lead + Damco representative).
**Validation gate:** Trigger `db-migrate.yml` in dry-run mode against production — the OIDC login step must succeed. GitHub Actions logs show `az login` succeeded with federated credential.
**Rollback:** Re-create or reconfigure federated credential.

### Step 1.4 — Branch and Artifact Readiness
**Owner:** Tech Lead
**Prerequisite:** All P1 bugs in the release milestone are closed. Release branch `release/v{X.Y}` created from `develop`. CI pipeline (`ci.yml`) has passed on this branch.
**Action:** Confirm CI pipeline passes for the release branch: `ci/build-backend`, `ci/build-frontend`, `ci/integration-tests` all green. Merge release branch to `main`. Verify the `deploy-prod.yml` trigger fires.
**Validation gate:** GitHub Actions shows `deploy-prod.yml` triggered. All CI jobs passed. No pending P1 bugs in the release milestone.
**Rollback:** Do not merge to `main`; fix failing checks first.

### Step 1.5 — Maintenance Window Communication Sent
**Owner:** Product Owner
**Prerequisite:** Maintenance window date and time confirmed (QST-3-CUT-001 must be answered). All tenant users notified.
**Action:** Send maintenance window announcement to all InsureEdge tenant users ≥5 business days in advance. Send password reset notice to all users ≥48 hours before cutover. Confirm war room channel (Teams) active with all team members.
**Validation gate:** Email dispatch confirmed. War room channel active. Named rollback decision authority confirmed and available (QST-3-CUT-002).
**Rollback:** Postpone maintenance window if pre-conditions are not met.

---

## Section 2: Database Migration Sequence

**Timing reference:** Based on ART-3-015 Section 2 cutover sequence and ART-4-006 phase definitions.
**Tool:** `db-migrate.yml` (manual dispatch, `workflow_dispatch`) + pgloader for bulk data phases.
**Governance:** Always run `dry_run=true` first; review generated SQL; then re-run `dry_run=false`.

### Step 2.1 — Final Source Backup and Read-Only Lock
[HUMAN GATE]
**Owner:** DBA
**Prerequisite:** Source application (OutSystems) confirmed stopped. All active sessions terminated.
**Action:** Take a final full backup of both source SQL Server databases: `InsureEdge_DEV` and `InsureEdge_System_DEV`. Set both databases to read-only mode. Confirm with SQL query: `SELECT name, is_read_only FROM sys.databases WHERE name IN ('InsureEdge_DEV', 'InsureEdge_System_DEV');` — both must return `is_read_only = 1`.
**Validation gate:** Backup files confirmed on backup media with verified checksum. SQL query confirms read-only state. Time-stamped confirmation recorded in war room.
**Rollback:** Remove read-only: `ALTER DATABASE InsureEdge_DEV SET READ_WRITE;`. Restart OutSystems.

### Step 2.2 — Phase 1: Schema Creation
**Owner:** DBA
**Prerequisite:** Step 2.1 complete. Target PostgreSQL Flexible Server accessible. EF Core CLI installed in pipeline.
**Action:** Trigger `db-migrate.yml` with `environment=production`, `dry_run=true`. Review generated SQL script artifact in GitHub Actions. Re-trigger with `dry_run=false` after DBA review. This runs EF Core migrations, creates all 7 domain schemas (`policy`, `claims`, `billing`, `distribution`, `rating`, `identity`, `system`, `archive`), installs extensions (`uuid-ossp`, `pg_trgm`, `pgcrypto`, `postgis`).
**Validation gate:** Run schema validation from ART-4-006 §1.3. Table count per schema matches expected totals. FK constraints `fk_claim_policy` and `fk_worksheet_claim` present (both must return 2 rows). Extensions installed (4 rows). Zero schema deployment errors in migration log.
**Rollback:** `dotnet ef database drop` + re-run (schema only at this point — no data loss risk).

### Step 2.3 — Phase 2: Reference Data Migration
**Owner:** DBA
**Prerequisite:** Step 2.2 complete (schema validated).
**Action:** Execute pgloader commands for all reference/lookup tables: `PolicyStatus`, `PolicyType`, `CoverageType`, `DeductibleType`, `PerilType`, `PaymentFrequency`, `PaymentMethod`, `DocumentType`, `ClaimStatus`, `ClaimType`, `AdjusterStatus`, `IntermediaryType`, `ProducerStatus`, `WrittingCompany` (→ `writing_company`, NFR-012 typo corrected). Execute AppScreen, Module, Product inserts from `InsureEdge_System_DEV`. Reference ART-4-006 §2.
**Validation gate:** Row counts match source for each reference table. `policy.writing_company` count matches `InsureEdge_DEV.dbo.[WrittingCompany]`. AppScreen rows match source Module table.
**Rollback:** `TRUNCATE TABLE {schema}.{table} CASCADE;` for each reference table loaded. Re-run phase.

### Step 2.4 — Phase 3: Rating Engine Data Migration (HBRater Tables)
**Owner:** DBA
**Prerequisite:** Step 2.3 complete.
**Action:** Execute pgloader commands for HBRater tables: `HBRater_LRHexzones`, `HBRater_HRHexzone`, `HBRater_StateTaxSheet`, `HBRater_ExcessFloodCoverage`, `Rating_Wildfire`. Apply column rename: `ALTER TABLE rating.hbrater_state_tax_sheet RENAME COLUMN abbriviation TO abbreviation;` (QST-3-MIG-002 — typo correction). Reference ART-4-006 §3.
**Validation gate:** Run row count validation from ART-4-006 §3.2 against all 5 rating tables. Each count must match source exactly. Spot-check: known zone ID returns expected rate value.
**Rollback:** `TRUNCATE TABLE rating.{table} CASCADE;` for each rating table. Re-run phase.

### Step 2.5 — Phase 4: System and Tenant Data Migration
[HUMAN GATE — Security-critical: password field exclusion must be verified]
**Owner:** DBA + Security Lead
**Prerequisite:** Step 2.4 complete. Security Lead present.
**Action:** Execute migrations in order: (1) `identity.client` from `InsureEdge_System_DEV.dbo.Client`; (2) `identity.app_user` from `InsureEdge_System_DEV.dbo.User2` — **password_hash intentionally NULL, requires_password_reset = TRUE for ALL rows** (RSK-1-SEC-001, NFR-003); (3) `identity.user_group` from `Group_Table`; (4) `identity.user_group_member` from `GroupUser_Table`; (5) `identity.screen_permission` from `ScreenPermissions`. Reference ART-4-006 §4.
**Validation gate (mandatory security checks):**
- `SELECT COUNT(*) FROM identity.app_user WHERE password_hash IS NOT NULL;` — MUST return 0. If > 0: STOP, investigate immediately.
- `SELECT COUNT(*) FROM identity.app_user WHERE requires_password_reset = FALSE;` — MUST return 0.
- Client count matches source. Group and permission counts match source.
**Rollback:** `TRUNCATE TABLE identity.screen_permission, identity.user_group_member, identity.user_group, identity.app_user, identity.client CASCADE;`. Re-run phase.

### Step 2.6 — Phase 5: Operational Data Migration (Accounts, Intermediaries, Policies)
**Owner:** DBA
**Prerequisite:** Step 2.5 complete and security checks passed.
**Action:** Execute in order: (1) `policy.account`; (2) `distribution.intermediary` (source column `ComissionPercentage` → target `commission_percentage`, NFR-012); (3) `policy.policy` with sentinel date conversion (`COALESCE(NULLIF(date_col, '1900-01-01'), NULL)`); (4) `billing.policy_premium`; (5) `policy.policy_risk_information` (new `rps_value` column = NULL); (6) `policy.risk_location`; (7) `policy.policy_mortgage`. Reference ART-4-006 §5. Note: policy_fee must be verified as $195 per BR-POL-FEE-001.
**Validation gate:** Policy count matches source. Zero sentinel dates (`1900-01-01`) in any datetime column (run ART-4-006 §7.3). Zero orphan policies (no policy with client_id referencing non-existent client). Financial amounts spot-checked against source.
**Rollback:** `TRUNCATE TABLE policy.policy_mortgage, policy.risk_location, policy.policy_risk_information, billing.policy_premium, policy.policy, distribution.intermediary, policy.account CASCADE;`

### Step 2.7 — Phase 6: Claims and Financial Data Migration
[HUMAN GATE — Financial data. DBA and Business Lead must be present and sign off.]
**Owner:** DBA + Business Lead (financial sign-off)
**Prerequisite:** Step 2.6 complete. Pre-phase orphan check must PASS (both queries return 0) before loading begins (ART-4-006 §6.1).
**Action:** (1) Run pre-phase orphan check against SOURCE — zero claim orphans, zero worksheet orphans required. (2) Migrate `claims.claim`. (3) Migrate `claims.worksheet`. (4) Migrate `claims.worksheet_payment` (HVR: all amounts verified). (5) Migrate `billing.policy_payment_transaction` (HVR: financial totals). (6) Migrate `billing.bank_detail` — **note: re-encryption required if source AES format differs from target (DBT-4-FORGE-016)**. Reference ART-4-006 §6.
**Validation gate:** Zero orphan claims in target (ART-4-006 §7.2). Zero orphan worksheets. Zero orphan worksheet payments. Financial totals spot-check: sum of PolicyPaymentTransaction amounts per ClientId compared against source (ART-4-006 §7.5). Business Lead confirms financial totals are within tolerance.
**Rollback:** `TRUNCATE TABLE billing.bank_detail, billing.policy_payment_transaction, claims.worksheet_payment, claims.worksheet, claims.claim CASCADE;`

### Step 2.8 — Phase 6b: Binary Extraction to Azure Blob Storage
**Owner:** DBA + DevOps (runs T-48h before maintenance window, not during)
**Prerequisite:** Azure Blob Storage containers created. Managed Identity from the migration Worker Service configured. Pre-cutover — this phase runs BEFORE the maintenance window opens.
**Action:** Execute the BlobExtractor Worker Service (`migrations/tools/BlobExtractor/`) against the source SQL Server. Tables: `AccountBinary`, `Policy_Extended_Binary`, `ClientCompanyLogos`, `UserBinary`, `NoteFile`, `EmailAttachment`. Blob path convention: `{ClientCode}/{Module}/{RecordId}/{Filename}`. Extraction is idempotent — safe to re-run. After extraction, run BlobPath UPDATE statements against target PostgreSQL tables. Reference ART-4-006 §6.6.
**Validation gate:** MigrationManifest row count = source binary record count. `az storage blob list --container-name insureedge-documents` returns expected count. Blob path reconciliation: source manifest count vs target BlobPath column non-NULL count — match rate must be ≥ 99.9%. Spot-check: randomly selected blob is retrievable.
**Rollback:** Blobs in Azure Blob are preserved even on rollback — no rollback action required for this phase. BlobPath columns in target can be re-populated from manifest on retry.

### Step 2.9 — Phase 7: Validation Queries (All Must Pass Before Proceeding)
[HUMAN GATE — No application deployment proceeds until all validation queries pass]
**Owner:** DBA + Business Lead + Security Lead
**Prerequisite:** All migration phases (Steps 2.2–2.8) complete.
**Action:** Execute all validation queries from ART-4-006 §7:
1. Row count comparison: source vs target for all 9 core tables — variance must be ≤ 0.01%.
2. Orphan detection: zero orphan claims, worksheets, worksheet payments, payment transactions.
3. Sentinel date audit: zero `1900-01-01` values in any datetime column.
4. Security validation: `app_user.password_hash IS NULL` (0 rows with password), `requires_password_reset = TRUE` (all rows).
5. Tenant isolation: zero policy records without a valid client_id.
6. Financial spot-check: sum of payment transactions per client vs source totals.
7. Blob path reconciliation: ≥99.9% match rate.
**Validation gate:** All 7 check categories return PASS. DBA, Business Lead, and Security Lead each sign off in war room log. Any FAIL is a NO-GO for Step 3.
**Rollback:** Investigate and remediate the failing validation. Do not proceed to application deployment until all checks pass.

---

## Section 3: Application Deployment

### Step 3.1 — Production Deployment Approval (GitHub Environment Gate)
[HUMAN GATE — 2 reviewers required]
**Owner:** Project Lead + Damco Representative
**Prerequisite:** Section 2 (all database validations) passed. Section 1 prerequisites complete.
**Action:** The `deploy-prod.yml` workflow requires 2 reviewers to approve the `production` GitHub environment. Project Lead and Damco Representative must each review and approve in the GitHub Actions UI within the 24-hour approval window.
**Validation gate:** GitHub Actions shows `await-approval` job passed with 2 approvals recorded. Reviewer names visible in GitHub Actions logs.
**Rollback:** Reject the deployment in GitHub UI; workflow does not proceed.

### Step 3.2 — Pre-Deploy Smoke Tests
**Owner:** DevOps / Tech Lead
**Prerequisite:** Step 3.1 approved.
**Action:** GitHub Actions runs `pre-deploy-smoke` job automatically: `dotnet test tests/InsureEdge.SmokeTests/`. This validates: config availability, Key Vault connectivity, secrets resolution. No database writes are made.
**Validation gate:** All smoke tests in `InsureEdge.SmokeTests` pass. No Key Vault access errors. Pipeline proceeds to `deploy-api-prod`.
**Rollback:** Fix failing configuration or Key Vault access issue; re-trigger workflow.

### Step 3.3 — API Deployment (Blue-Green Slot Swap)
**Owner:** DevOps (automated via GitHub Actions)
**Prerequisite:** Step 3.2 passed.
**Action:** `deploy-api-prod` job: builds API (Release), deploys to `staging` slot of `api-insuredge-prod` App Service. Runs health check against staging slot (`https://api-prod-staging.insuredge.example.com/health`) with 5 retries (30-second intervals). If all health checks pass, performs slot swap: `az webapp deployment slot swap --slot staging --target-slot production`. Runs health check against production slot with 3 retries. If post-swap health check fails: automatic rollback re-swap restores previous version from staging slot.
**Validation gate:** Production slot health check returns HTTP 200. Application Insights shows no spike in error rate within 5 minutes of swap. Deployment summary in GitHub Step Summary shows slot swap status = success.
**Rollback (automatic):** `az webapp deployment slot swap --slot production --target-slot staging` (executed automatically by pipeline on health check failure). Previous version restored.

### Step 3.4 — Frontend Deployment
**Owner:** DevOps (automated via GitHub Actions)
**Prerequisite:** Step 3.3 (API healthy in production slot).
**Action:** `deploy-frontend-prod` job downloads built React SPA `dist` artifact and deploys to Azure Static Web Apps (production environment) via `azure/static-web-apps-deploy@v1`.
**Validation gate:** Static Web Apps deployment completes successfully. Application is accessible at the frontend URL with no build/routing errors.
**Rollback:** Reactivate prior Static Web Apps deployment via `az staticwebapp environment list`.

### Step 3.5 — Post-Deploy Validation (E2E Smoke)
**Owner:** DevOps / QA Lead (automated + manual)
**Prerequisite:** Steps 3.3 and 3.4 complete.
**Action:** `post-deploy-validation` job runs: `npx playwright test tests/smoke/` against production URL (read-only flows: login, policy list, claim list). Asserts Application Insights alert rules are active (`az monitor alert-rule list`). Writes deployment summary to GitHub Step Summary.
**Validation gate:** All E2E smoke tests pass. Alert rules confirmed active. Deployment summary written.
**Rollback:** If E2E tests fail: proceed to Section 4 (Smoke Tests) for full investigation before DNS cutover.

---

## Section 4: Application Smoke Tests

All smoke tests from ART-3-015 §5.1 must pass on the PostgreSQL target before DNS cutover is approved.

### Step 4.1 — Key User Journey Smoke Tests (10 Tests)
**Owner:** QA Lead + Product Owner
**Prerequisite:** Application deployed (Steps 3.3–3.4). Database fully migrated (Section 2 validated).

| Test | Journey | Pass Criteria |
|---|---|---|
| SMK-01 | Login: ClientAdmin user logs in | Successful login; dashboard loads; no tenant data leakage |
| SMK-02 | Policy list: View all active policies for a tenant | Policy list returns correct count; all policies have correct status |
| SMK-03 | Policy detail: Open a policy record | All tabs (Coverage, Documents, Timeline) render correctly |
| SMK-04 | Claims list: View claims for a tenant | Claims list loads; claim-to-policy link functional |
| SMK-05 | Create test quote (Draft only — do NOT bind) | Quote wizard completes; HexCat risk call succeeds; quote saved as Draft |
| SMK-06 | User management: List users for a tenant | User list returns; no plaintext passwords visible |
| SMK-07 | Password reset: Trigger reset for a test user | Reset token generated; email sent; token expires at 30 minutes |
| SMK-08 | Group permissions: Confirm a group's screen permissions | Permission flags load correctly; AllAccess = TRUE override check passes |
| SMK-09 | Document download: Download a policy document | Document retrieves from Azure Blob; download completes |
| SMK-10 | Audit log: Confirm an action is logged | After SMK-05, AuditLog has entry for the create-quote action |

**Validation gate:** All 10 smoke tests PASS. Any failure is a blocker for DNS cutover.
**Rollback:** Investigate failing smoke test; fix or escalate. Do not proceed to DNS cutover until all 10 pass.

### Step 4.2 — Integration Smoke Tests
**Owner:** Tech Lead / Integration Lead

| Test | Integration | Pass Criteria |
|---|---|---|
| INT-SMK-01 | Azure Blob Storage | Upload test file; retrieve with SAS token; download completes |
| INT-SMK-02 | TranzPay (sandbox) | Hosted payment redirect URL returned; PostBackUrl reachable — PROVISIONAL: requires production URL (GAP-2-INT-001) |
| INT-SMK-03 | HexCat geocoding | Test address submitted; risk data returned; PolicyRiskInformation updated — PROVISIONAL: QST-1-INT-004 |
| INT-SMK-04 | LenderDock | Test mortgagee notification; NotifyLenderdock record created — PROVISIONAL: QST-1-INT-002 |
| INT-SMK-05 | Azure Key Vault | Application reads credentials from Key Vault; no plaintext secrets in config logs |

### Step 4.3 — Background Job Validation
**Owner:** Tech Lead
**Action:** Access `/hangfire` dashboard (PlatformAdmin credential required). Confirm all 11 timer jobs are registered and scheduled. Confirm `KillTimer = FALSE` in App Configuration. Confirm `BypassRefundResponse = FALSE` (NFR-009, production safety gate).

**Validation gate:** All 11 jobs visible in Hangfire dashboard. Kill switch = FALSE. BypassRefundResponse = FALSE.

---

## Section 5: DNS Cutover

[HUMAN GATE — Irreversible without rollback procedure]
**Owner:** DevOps + Product Owner (APPROVE required)
**Prerequisite:** ALL of the following must be true:
- Section 2 validation queries: all PASS
- Section 4 smoke tests: all 10 PASS (INT-SMK tests: all PASS or risk accepted and documented by Product Owner)
- Background job validation: PASS
- BypassRefundResponse confirmed FALSE
- Customer Sponsor has been briefed and is available for Go/No-Go

**Action:**
1. Customer Sponsor reviews all validation results in war room.
2. Customer Sponsor issues explicit APPROVE for cutover (GNG-10 from ART-3-015 §3). SHIFT does not self-approve.
3. After APPROVE: Update DNS records to point to the Azure Application Gateway IP / Azure Static Web Apps hostname for the production environment.
4. For parallel-run variant (if ASM-3-MIG-001 is resolved to parallel-run): perform traffic shift percentage increase.

**Validation gate:** DNS propagation confirmed (`nslookup app.insuredge.example.com` returns production gateway IP). Application accessible at production URL. Login from external network succeeds.
**Rollback:** Revert DNS to previous records (source system). Estimated rollback time: 15–30 minutes (TTL dependent). Source system must still be accessible (Step 2.1 read-only mode must NOT have deleted source data).

---

## Section 6: Legacy System Access Lock

[HUMAN GATE — Must NOT be executed until monitoring period confirms system stability]
**Owner:** Product Owner + Tech Lead
**Prerequisite:** DNS cutover complete. Post-deployment monitoring window (Section 7) complete with no P1 issues. Formal Go/No-Go decision (Section 8) issued as APPROVED.
**Action:** Disable user access to legacy OutSystems system. Optionally: set OutSystems to maintenance mode. Notify all users that the legacy system is no longer active and all operations must use the new system.
**Validation gate:** Legacy system login page shows maintenance message. No active sessions in legacy system confirmed.
**Rollback:** Re-enable legacy system access. Revert DNS if rollback required.

Note: Full decommission procedure is separate — see ART-5-009 (Decommission Checklist). Legacy system access lock is NOT decommission.

---

## Section 7: Post-Deployment Monitoring Window (4 Hours Minimum)

**Owner:** Tech Lead + Product Owner (monitoring leads)
**Start:** Immediately after DNS cutover (Step 5) completes.
**Duration:** Minimum 4 hours (ART-3-015 §2, C-19).

### Monitoring Checks Every 30 Minutes:
- Azure Application Insights: error rate (baseline: < 1% of requests, alert threshold: > 10 exceptions / 5 minutes)
- P95 response time (baseline: < 2,000 ms per ART-4-005 §13)
- Payment flow error count (baseline: 0 TranzPay errors)
- Active Hangfire timer jobs: all 11 enabled, none in failed state
- PostgreSQL CPU (alert if > 80% sustained)
- Redis cache hit rate (degraded but not critical if cache miss)
- Azure Blob Storage access errors
- Key Vault access failures

### Alert Actions:
- Any Payment Integration failure: immediate escalation to Tech Lead and Integration Lead.
- Any cross-tenant data leak suspicion: CRITICAL — immediate system shutdown and Security Lead escalation.
- Error rate > 2% sustained for 10 minutes: escalate to Tech Lead; assess rollback.
- P95 latency > 5,000 ms sustained: escalate to Tech Lead; investigate before rollback.

**Validation gate:** 4-hour monitoring period completes with no P1 or P2 issues. Error rate, latency, and payment metrics all within baselines.

---

## Section 8: Go/No-Go Decision Point

[HUMAN GATE — Required by Layer 0 Governance]
**Owner:** Customer Sponsor (Go/No-Go authority) + Product Owner
**Prerequisite:** 4-hour monitoring window (Section 7) complete.
**Timing:** ART-3-015 §2, Step C-20 (T+685 from maintenance window open).

**Decision criteria:**
- No P1 defects identified during monitoring period.
- Error rate, latency, and payment metrics within baseline.
- All 11 background jobs have run at least one cycle without failure.
- Business Lead confirms data completeness.
- Customer Sponsor explicitly records APPROVE or calls rollback.

**If APPROVE:** Formal cutover sign-off. Notify all stakeholders. Send user password reset instructions. Proceed to Section 6 (Legacy Access Lock) on the scheduled date.
**If NO-GO:** Proceed to Section 9 (Rollback).

---

## Section 9: Rollback Procedure

**Trigger:** Any critical Go/No-Go gate failure (Sections 4–8), or explicit rollback call by Customer Sponsor.
**Rollback authority:** Customer Sponsor (or Migration Lead by default if no decision within 15 minutes of gate failure).

| Step | Activity | Owner | Estimated Time |
|---|---|---|---|
| R-01 | Announce rollback decision to war room | Migration Lead | 2 min |
| R-02 | Stop target application: Azure App Service `az webapp stop` | DevOps | 5 min |
| R-03 | Remove source SQL Server from read-only mode: `ALTER DATABASE InsureEdge_DEV SET READ_WRITE;` | DBA | 2 min |
| R-04 | Revert DNS to source system | DevOps | 5 min (+ TTL propagation) |
| R-05 | Restart OutSystems application services | Tech Lead | 5 min |
| R-06 | Verify source application functional: login, policy list | QA Lead | 5 min |
| R-07 | Confirm no data modified in source SQL Server during maintenance window | DBA | 3 min |
| R-08 | Notify stakeholders: rollback complete; system restored; new maintenance window to be scheduled | Product Owner | 3 min |
| R-09 | Retain PostgreSQL target — DO NOT DROP — required for post-mortem | DBA | — |
| R-10 | Schedule post-mortem within 24 hours | Migration Lead | — |

**Total estimated rollback time: 25–30 minutes**

**API Rollback (application only, not database):** If database is valid but application has an issue post-swap, re-swap App Service slots: `az webapp deployment slot swap --slot production --target-slot staging`. Previous version restores within 2 minutes.

**Database Rollback:** No automatic database rollback. Migrations are forward-only. For data corruption: restore from pre-migration backup created in Step 2.2 (`pre-migration-{timestamp}` backup). DBA must execute; requires explicit human DEC-.

---

## Sign-Off Sheet

| Role | Name | Sign-Off (Pre-Deployment) | Date |
|---|---|---|---|
| DevOps Lead | _________________ | _______________ | ________ |
| DBA | _________________ | _______________ | ________ |
| Tech Lead | _________________ | _______________ | ________ |
| Security Lead | _________________ | _______________ | ________ |
| Product Owner | _________________ | _______________ | ________ |
| Customer Sponsor (Go/No-Go) | _________________ | _______________ | ________ |

---

*End of ART-5-005 — Deployment Runbook | INSUREEDGE-2026 | TRANSFER Phase | 2026-06-17*
*Status: AI_GENERATED — HUMAN_VALIDATION_REQUIRED. 10 blocking open items documented. [HUMAN GATE] count: 7 gates (Steps 2.1, 2.5, 2.7, 2.9, 3.1, 5, 6, 8). Rollback procedure: 10 steps, estimated 25–30 minutes.*
