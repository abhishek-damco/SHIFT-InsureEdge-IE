# ART-3-014 — Migration Strategy
## InsureEdge Application Modernization (INSUREEDGE-2026)

**Produced by:** Migration Agent
**Phase:** IDEATE
**Date:** 2026-06-17
**PRD Gate:** PASSED (DEC-2-0005, 2026-06-17)
**Confidence:** HIGH for evidence-based recommendations; ASM- marked for assumptions.

**Evidence consumed:**
- ART-1-001: Data Catalogue (total size ~1.6 GB across two DBs)
- ART-2-009: NFR Catalog (data integrity, availability requirements)
- ART-2-012: Integration Architecture Supplement (cross-DB coupling, binary storage)
- ART-3-013: Data Migration Architecture (entity inventory, consolidation plan)

**Governance compliance:**
- Pattern recommendation marked ASM-3-MIG-001 (downtime tolerance not confirmed)
- QST-3-MIG-001 raised for downtime window
- No cutover date committed — requires human DEC-

---

## Section 1: Pattern Recommendation

### 1.1 Decision Factors

| Factor | Value | Source |
|---|---|---|
| Total data volume | ~1.6 GB (InsureEdge_DEV ~1.1 GB MDF + InsureEdge_System_DEV ~530 MB MDF) | ART-1-001 §1 |
| Concurrent user scale | 100 concurrent users | Project context |
| Domain criticality | Insurance — financial transactions, regulatory compliance | ART-2-005, ART-2-009 |
| Downtime tolerance | **NOT SPECIFIED** — QST-3-MIG-001 raised | Project context |
| Binary content | varbinary(max) across 10+ tables — requires parallel extraction | ART-3-013 §3.3 |
| Cross-DB coupling | Two databases with runtime cross-joins | ART-1-001 §1, ART-2-012 §4.2 |
| Azure tooling available | Azure Database Migration Service, Azure Blob, Azure Key Vault | Project context |
| Business rules impacted | 11 scheduled background jobs, payment callbacks, mortgagee notifications | ART-2-005, ART-2-012 |

### 1.2 Pattern Comparison

| Pattern | Pros | Cons | Fit for InsureEdge |
|---|---|---|---|
| **Big-Bang** | Simplest execution; single cutover event; no dual-write complexity; full validation in one window | Requires planned downtime window; if migration fails, rollback is the only option | VIABLE if downtime window of 4–8 hours is acceptable |
| **Phased** | Lower risk per phase; each phase independently validated; partial rollback possible | Requires schema compatibility across phases; some tables must be kept in sync during multi-phase period | VIABLE for the reference/lookup data phases; less viable for transactional data |
| **Parallel-Run** | Near-zero downtime; source and target run simultaneously; rollback by re-pointing connection | Requires dual-write to both DBs or CDC; doubles infra cost during transition; complex with cross-DB joins | VIABLE but high complexity — cross-DB coupling makes CDC setup non-trivial |
| **CDC (Change Data Capture)** | Continuous replication; minimises downtime to minutes; ideal for large DBs | Requires CDC tooling (Debezium, AWS DMS change-track, Azure DMS); SQL Server CDC requires agent access; ~1.6 GB is small enough that CDC is over-engineered | LOW FIT — data volume does not justify CDC complexity; 1.6 GB migrates in under 1 hour |

### 1.3 Recommended Pattern: Phased Big-Bang with Binary Pre-extraction

**ASM-3-MIG-001:** In the absence of a confirmed downtime tolerance (QST-3-MIG-001 raised), this strategy assumes a planned maintenance window of **4–8 hours** is acceptable. This is the default for an insurance platform of this scale (~1.6 GB, 100 users) migrating from a single-tenant-per-environment OutSystems deployment. If the customer requires downtime under 30 minutes, a Parallel-Run pattern must be adopted (significantly higher complexity and cost — see Section 1.4 for the alternate path).

**Selected Pattern: Phased Big-Bang**

Definition: The migration is executed in a defined sequence of phases during a single planned maintenance window. Binary content (varbinary) is pre-extracted to Azure Blob in the days before cutover, outside the maintenance window, to reduce the cutover window duration.

**Rationale:**
1. **Data volume is small-medium:** ~1.6 GB migrates in under 1 hour with Azure Database Migration Service (ADMS) or pgloader. The cutover window is dominated by validation and switchover, not data transfer.
2. **Binary pre-extraction decouples the longest operation:** varbinary extraction to Azure Blob can run 24–48 hours before cutover without affecting the source database.
3. **Insurance domain requires guaranteed consistency:** CDC and parallel-run patterns create dual-write windows where a transaction written to one DB may not yet be reflected in the other. For an insurance platform processing payments, this creates financial reconciliation risk.
4. **Cross-DB coupling is cleanly broken:** A single consolidation event (both source databases shut down simultaneously for cutover) eliminates the `IESYSDBName` coupling without a transitional period where some queries hit the old pattern and others use the new.
5. **Rollback is clean:** If the migration fails during the cutover window, the original SQL Server databases are unchanged and can be re-activated within 30 minutes (rollback procedure in ART-3-015).

**QST-3-MIG-001 (MAJOR):** What is the maximum acceptable downtime window for the InsureEdge cutover? The recommended pattern assumes 4–8 hours. If the business requires under 30 minutes, a Parallel-Run with CDC replication must be designed — this adds 3–4 weeks of implementation complexity and requires SQL Server CDC agent access to the source. The customer must confirm this before the Cutover Strategy (ART-3-015) is finalised.

### 1.4 Alternate Pattern (If Downtime < 30 Minutes Required)

If QST-3-MIG-001 answer is "under 30 minutes" or "no planned downtime," the following alternate pattern is recommended:

**Alternate Pattern: Parallel-Run with Logical Replication**

1. Set up the target PostgreSQL schema in advance
2. Use Azure Database Migration Service (ADMS) online migration mode to establish continuous replication from SQL Server to PostgreSQL
3. Run both systems in parallel (read traffic only on target during validation)
4. When target is validated, switch write traffic to PostgreSQL with a brief connection-string cutover (1–5 minutes)
5. Decommission SQL Server source after validation period (typically 1–2 weeks)

**Constraints for this alternate pattern:**
- SQL Server CDC must be enabled on both source databases (requires DBA access and SQL Server Agent running)
- ADMS online mode for SQL Server → PostgreSQL is in preview/GA depending on region — verify availability
- Cross-DB join replication requires custom CDC logic (ADMS does not natively replicate cross-DB queries)
- Dual-write period requires business rules to route new transactions to target only — application change required before data migration

**This alternate pattern is NOT the default recommendation. ASM-3-MIG-001 applies.**

---

## Section 2: Migration Tooling

### 2.1 Schema Translation

**Recommended tool: Manual + EF Core Migration (or Flyway/Liquibase)**

| Option | Assessment |
|---|---|
| pgloader (schema mode) | Translates SQL Server DDL to PostgreSQL. Handles most type conversions automatically. Does NOT handle custom renames (typos, reserved words, domain schema namespacing). Requires post-processing for InsureEdge's 7 known renames and domain schema layout. |
| AWS SCT (Schema Conversion Tool) | Comprehensive SQL Server → PostgreSQL translation. Produces detailed assessment reports. However, this is an AWS tool; in an Azure context it introduces a tool dependency with no native Azure equivalent. |
| Azure Database Migration Service — Schema migration | ADMS includes a schema assessment and migration component for SQL Server → PostgreSQL. Preview feature for Flexible Server. Native Azure tooling — preferred for Azure-native deployment. |
| Manual DDL with EF Core Migrations | Full control; enforces domain schema layout, correct naming, FKs, indexes. Highest effort but most accurate for complex migrations with 7 renames, 7 domain schemas, and 153+ entities. |

**Recommendation:** Use **Azure Database Migration Service (ADMS)** for initial schema assessment and automated type-conversion scaffolding, then **manually review and correct** every table DDL against the ART-3-013 entity inventory before applying. EF Core Migrations (or Flyway) manages the version-controlled schema creation in target environments.

**Justification:** ADMS provides the automated starting point; manual review is required because:
- 7 domain schemas must be applied (ADMS produces flat `dbo` by default)
- 7+ table/column renames must be applied (NFR-012, reserved words)
- AccountBinary MIGRATE-SPLIT requires manual decomposition
- ORM-managed tables are absent from DDL source and must be added manually

### 2.2 Data Transfer

**Recommended tool: Azure Database Migration Service (ADMS) + pgloader for specific tables**

| Option | Assessment |
|---|---|
| Azure Database Migration Service | Native Azure tooling for SQL Server → PostgreSQL Flexible Server. Offline (big-bang) mode supports full table migration. Handles most SQL Server to PostgreSQL data type mappings. Native integration with Azure networking (VNet, Private Endpoint). |
| pgloader | Open source; powerful transformation rules via LOAD DSL; handles sentinel date conversion natively (`WHEN NULL = '1900-01-01'`); ideal for tables needing custom transformation. Best for the MIGRATE-TRANSFORM tables where sentinel dates and type conversions are needed. |
| SSIS | SQL Server Integration Services — available but introduces a Windows SQL Server dependency that conflicts with the Azure-native approach. Not recommended for the primary migration path. |
| Bespoke .NET scripts | Custom ETL scripts give maximum control for complex transformations (AccountBinary split, binary extraction). Appropriate for the MIGRATE-SPLIT and binary extraction cases; not for bulk table migration. |

**Recommendation:**
- **ADMS (offline mode):** Primary migration engine for all MIGRATE-DIRECT and standard MIGRATE-TRANSFORM tables (bulk of the ~131 tables)
- **pgloader:** Used for tables with sentinel date conversion requirements and custom column mappings not supported natively by ADMS
- **Bespoke .NET migration script:** Specifically for AccountBinary MIGRATE-SPLIT (splitting into entity-specific tables) and for any tables where ADMS mapping fails validation
- All tools operate against a validated target schema (see Section 3 Phase 1)

### 2.3 Binary Extraction (varbinary → Azure Blob)

**Recommended tool: Custom .NET 8 Worker Service**

| Option | Assessment |
|---|---|
| SSIS Binary extractor | SSIS can extract varbinary to files, but requires SQL Server SSIS infrastructure; file naming and Azure Blob upload require custom SSIS script tasks. Complex to maintain. |
| Custom .NET script | A .NET 8 Console App or Worker Service connecting to SQL Server via `SqlClient`, reading varbinary in chunks, uploading to Azure Blob via `Azure.Storage.Blobs` SDK. Full control over blob path naming convention (`{ClientCode}/{ModuleName}/{RecordId}/{Filename}`). Can be parallelized across tables. Easiest to test and re-run. |
| Azure Data Factory | ADF supports binary copy activities; can be configured for varbinary → Blob. Requires ADF pipeline setup; cost per activity run. |

**Recommendation:** Custom **.NET 8 Worker Service** with the following characteristics:
- Reads source table in batches of 1000 rows (configurable)
- For each row with non-NULL varbinary content:
  - Generates blob path: `{ClientCode}/{Module}/{RecordId}/{OriginalFilename or GeneratedName}`
  - Uploads to Azure Blob Storage container `insure-edge-documents`
  - Updates source table tracking: records target blob path in a migration staging table (does NOT modify source varbinary columns — source remains unchanged)
- Runs in pre-cutover window (24–48 hours before cutover)
- Produces extraction manifest (table, record ID, blob path, byte count, checksum) for reconciliation
- Idempotent: safe to re-run; skips already-extracted records

**Tables requiring binary extraction:**
1. `AccountBinary` (primary polymorphic binary store)
2. `Policy_Extended_Binary` (EndorsementSummary, UWSpecificChange)
3. `ClaimLetter.EmailBody` (nvarbinary — pending QST-3-MIG-004 for treatment)
4. `ClientCompanyLogos`
5. `UserBinary`
6. `NoteFile` (binary attachments)
7. `Email.Message` (pending QST-3-MIG-004)
8. `EmailAttachment`

### 2.4 Tooling Summary

| Step | Tool | Rationale |
|---|---|---|
| Schema translation | ADMS assessment + Manual DDL review → Flyway/EF Core migrations | Azure-native; manual correction required for renames and schema namespacing |
| Reference/lookup data | pgloader or ADMS | Small tables; fast; minimal transformation |
| Tenant/system data (SYSTEM_DEV tables) | ADMS (offline) | Bulk migration; standard type mappings |
| Transactional data (DEV tables) | ADMS (offline) + pgloader for sentinel date tables | Primary migration engine |
| Binary extraction | Custom .NET 8 Worker Service | Pre-cutover; produces extraction manifest |
| Post-migration validation | Custom SQL validation scripts | Row counts, FK integrity, sentinel date checks |

---

## Section 3: Migration Phases

The following sequence defines the migration execution order within the planned maintenance window, plus pre-cutover activities.

### Pre-Cutover Activities (T-2 days to T-0)

| Activity | Timing | Tool | Description |
|---|---|---|---|
| Binary pre-extraction | T-48h | .NET Worker Service | Extract all varbinary(max) content to Azure Blob; generate extraction manifest |
| Target schema creation | T-24h | Flyway / EF Core Migrations | Create all 7 domain schemas and all target tables in PostgreSQL (empty) |
| Migration dry-run | T-24h | ADMS + pgloader | Full migration rehearsal on a copy of source data; measure actual time taken |
| Rollback rehearsal | T-24h | See ART-3-015 | Confirm rollback procedure works in under 30 minutes |
| Pre-migration data quality checks | T-24h | SQL scripts | Execute all Section 4 checks from ART-3-013; resolve any blocking issues |

### Phase 1: Schema Validation and Target Schema Creation (T+0 to T+30 min)

**Activities:**
1. Execute Flyway/EF Core migration scripts to create all schemas and tables in target PostgreSQL
2. Validate all 153 tables created with correct columns, types, and constraints
3. Validate all FK constraints are in place (including the new Claim→Policy and Worksheet→Claim FKs)
4. Validate all domain schemas exist: `policy`, `claims`, `billing`, `distribution`, `rating`, `identity`, `system`
5. Verify PostgreSQL extensions installed: `uuid-ossp`, `pg_trgm`, `pgcrypto`
6. **Go/No-Go checkpoint:** Schema validation passes 100% before proceeding to Phase 2

**Owner:** DBA / Infrastructure Engineer
**Estimated time:** 30 minutes
**Rollback:** Drop all schemas and tables; restore from schema creation scripts

### Phase 2: Reference and Lookup Data Migration (T+30 to T+60 min)

**Tables (all MIGRATE-DIRECT):**
- All 15 reference/lookup tables (PolicyStatus, PolicyType, CoverageType, etc.)
- Country, State (global reference)
- Product, InsuranceProduct (global product catalog)
- AppScreen, Module (screen registry)

**Source:** InsureEdge_DEV and InsureEdge_System_DEV
**Target:** `policy`, `identity`, `system` schemas

**Activities:**
1. Load reference tables via pgloader or ADMS — these are small tables (typically < 1000 rows each)
2. Validate row counts match source counts exactly
3. Validate lookup values used in transactional FK columns exist in reference tables
4. **Go/No-Go checkpoint:** All reference tables loaded; row count validation passes

**Owner:** Data Migration Engineer
**Estimated time:** 30 minutes
**Rollback:** TRUNCATE all reference tables in target; reload if needed

### Phase 3: Rating Engine Data Migration (T+60 to T+90 min)

**Tables:**
- `HBRater_LRHexzones` (~103,739 rows)
- `HBRater_HRHexzone`
- `HBRater_StateTaxSheet`
- `HBRater_ExcessFloodCoverage`
- `Rating_Wildfire`

**Source:** InsureEdge_DEV
**Target:** `rating` schema

**Activities:**
1. Load all HBRater tables via pgloader with column lowercasing transformation
2. Apply `Abbriviation` → `abbreviation` rename on StateTaxSheet (pending QST-3-MIG-002 confirmation)
3. Create GIN/B-tree indexes on zone/state lookup columns
4. Validate row counts match source; spot-check 10 representative rate lookups
5. **Go/No-Go checkpoint:** All rating tables loaded; row count validates; sample rate lookups return expected values

**Owner:** Data Migration Engineer
**Estimated time:** 30 minutes
**Rollback:** TRUNCATE all rating tables; reload from source

### Phase 4: Tenant and Identity Data Migration (T+90 to T+120 min)

**Source:** InsureEdge_System_DEV (26 tables)
**Target:** `identity` and `system` schemas

**Table load sequence** (order matters for FK resolution):
1. `identity.client` (Client — tenant root)
2. `identity.client_config`, `identity.client_subscription`, `identity.client_office`
3. `identity.company`, `identity.insurance_product`, `identity.product`
4. `identity.company_product`, `identity.company_products_jurisdiction`
5. `identity.app_user` (User2 rename; Password field set NULL, requires_password_reset = TRUE)
6. `identity.user_group` (Group_Table rename)
7. `identity.user_group_member` (GroupUser_Table rename)
8. `identity.app_screen`, `identity.module`
9. `identity.screen_permission`, `identity.client_screen`, `identity.user_screen`
10. `identity.user_password_reset`, `identity.user_binary` (BlobPath populated from extraction manifest)
11. `identity.contact`, `identity.address`, `identity.client_company_logos` (BlobPath from extraction manifest)
12. `system.country`, `system.state`
13. `system.audit_log` (historical audit trail)
14. ORM-managed tables: `system.user_system_notifications`, `system.os_user_configurations`, `system.grid_default_layouts` (pending QST-3-MIG-007)

**Special handling:**
- `identity.app_user.password_hash` = NULL for all rows
- `identity.app_user.requires_password_reset` = TRUE for all rows
- `identity.module.module_code` column dropped per designer annotation (ART-2-012 §5.3)
- ClientId NULL audit from Section 4.4 of ART-3-013 must pass before this phase starts

**Activities:**
1. Load all System DB tables in FK sequence above
2. Validate row counts
3. Validate all ClientId values reference a valid `identity.client.client_id`
4. Validate `identity.app_user` has no password_hash values (security check)
5. **Go/No-Go checkpoint:** All identity tables loaded; ClientId FK validation passes; password security check passes

**Owner:** Data Migration Engineer + Security Lead
**Estimated time:** 30 minutes
**Rollback:** TRUNCATE all identity and system schema tables; reload from source

### Phase 5: Historical Policy Data Migration (T+120 to T+180 min)

**Scope:** Non-active, non-current-term policies and associated child records.

**Definition of "historical":** Policies with `PolicyStatusId` IN (Expired, Cancelled, Non-Renewed) where `ExpirationDate` < current date - 90 days (configurable threshold).

**Table load sequence:**
1. `policy.account`, `policy.account_extended`
2. `distribution.intermediary`, `distribution.producer`
3. `policy.policy` (historical subset)
4. `policy.policy_account` (junction table — historical policies)
5. `policy.policy_product`, `policy.policy_limit_coverage`
6. `policy.policy_risk_information`, `policy.risk_location`
7. `policy.additional_insured`, `policy.additional_organisation`
8. `policy.policy_commission`
9. `billing.commission_payment_transaction`
10. `billing.policy_payment_plan`, `billing.policy_premium`
11. `billing.policy_payment_transaction`, `billing.policy_payment_transaction_extended`
12. `billing.cancellation_payment_transaction`
13. `policy.policy_mortgage`
14. Policy document metadata (BlobPaths already in source; no varbinary in PolicyDocument)
15. `policy.policy_extended`, `policy.policy_extended_binary` (BlobPaths from extraction manifest)
16. Legacy mapping tables → `archive` schema (if QST-3-MIG-005 confirms archive classification)

**Activities:**
1. Apply sentinel date conversion (1900-01-01 → NULL) on all datetime columns
2. Apply schema typo renames per NFR-012 mapping
3. Validate row counts against source subset counts
4. Validate no orphan records (Claim→Policy FK check against this subset)
5. **Go/No-Go checkpoint:** Historical policy subset loads without FK violations; row counts match; sentinel dates confirmed NULL

**Owner:** Data Migration Engineer
**Estimated time:** 60 minutes (larger data volume)
**Rollback:** TRUNCATE policy/billing/distribution schema tables; reload from source

### Phase 6: Active Policy and Transaction Data Migration (T+180 to T+240 min)

**Scope:** Active, in-force policies and all associated transactions. This is the highest-criticality phase.

**Definition of "active":** Policies with `PolicyStatusId` IN (Active, Lapsed, Approved, Draft) plus any policy with transactions in the current term.

**Table load sequence** (same as Phase 5 but for active subset, plus claims and worksheets):
1. Active policy records and all child tables (same sequence as Phase 5)
2. `claims.adjuster`, `claims.adjuster_license`
3. `claims.claim` (with orphan pre-check — must be clean)
4. All claim child tables: `claim_coverage`, `claim_impacted_coverage`, `claim_impacted_coverage_asset`
5. `claims.worksheet`, `claims.worksheet_payment`, `claims.worksheet_reserve`
6. `claims.claimant`, `claims.witness`
7. `claims.loss_exposure`, `claims.loss_exposure_service_detail`, `claims.loss_exposure_damage`
8. `claims.claim_escalation`, `claims.claim_authority`, `claims.claim_mortgage`
9. Claim document metadata
10. `billing.commission_disbursement_audit`
11. `billing.payment_callback_responses` (if QST-3-MIG-001 confirms existence)
12. Cross-module tables: `system.email` (metadata), `system.task`, `system.comment`
13. `system.notify_lenderdock`, `system.hexcat_risk_info_audit`
14. Configuration tables: `system.configuration`, `system.configuration_values`
15. `policy.state_specific_data`, UI configuration tables

**Special handling:**
- Claims orphan scan MUST pass before loading `claims.claim`
- `BankDetail` encrypted fields: verify AES-256 re-encryption with new key stored in Azure Key Vault (NFR-007, NFR-014)
- Active policy FK chain: `Policy` → `PolicyPremium` → `PolicyPaymentTransaction` must be validated end-to-end
- All `bit` → `boolean` conversions applied

**Activities:**
1. Load all active policy and claims data in FK sequence
2. Validate all FK constraints — no FK violations tolerated
3. Spot-check 20 representative policies end-to-end: policy → premium → transactions → claims → worksheets
4. Validate financial totals: sum of PolicyPaymentTransaction.Amount per policy should match PolicyPremium.TotalCoveragePremium + fees
5. **Go/No-Go checkpoint:** Active data loads without FK violations; end-to-end spot checks pass; financial total validation passes

**Owner:** Data Migration Engineer + Business Lead
**Estimated time:** 60 minutes
**Rollback:** TRUNCATE all transactional data from claims/policy schemas; reload from source (identity and rating data intact)

### Phase 7: Binary Document Path Reconciliation (T+240 to T+270 min)

**Scope:** Reconcile blob paths in migrated records against the extraction manifest from pre-cutover extraction.

**Activities:**
1. Load extraction manifest (CSV of table, RecordId, BlobPath, checksum) into a migration staging table
2. For each record in target tables with a BlobPath column: verify the blob path exists in Azure Blob Storage
3. Verify extraction manifest row count matches target table blob-path-populated row count
4. Flag any discrepancies (records with NULL BlobPath that should have content) for manual review
5. Run spot-check download of 10 random blobs per entity type (policy document, claim document, user image)
6. **Go/No-Go checkpoint:** Blob reconciliation > 99.9% match rate; zero missing blobs for active policies

**Owner:** Data Migration Engineer + Infrastructure Lead
**Estimated time:** 30 minutes
**Rollback:** Not required for this phase alone — blob extraction already succeeded; re-run reconciliation if path mapping fails

### Phase 8: Cutover Validation (T+270 to T+360 min)

Defined in ART-3-015 (Cutover Strategy). Summary:
1. Row count reconciliation (source vs target, all tables)
2. Application smoke tests (10 key user journeys)
3. Integration smoke tests (TranzPay, DisburseCloud, LenderDock, HexCat, Azure Blob)
4. Background job validation (confirm all 11 timers are registered and ready)
5. Security validation (confirm User2.Password not migrated; requires_password_reset = TRUE for all users)
6. **Final Go/No-Go decision** by human approver before DNS/connection string switch

---

## Section 4: Rollback Plan

### Rollback Philosophy

The source SQL Server databases are treated as read-only from the moment the maintenance window opens. They are NOT modified during migration. This means rollback at any phase is: stop migration, fix issue, restart from beginning of the failed phase (or from Phase 1 for schema issues), or abort and reactivate source application.

The maximum rollback time from any phase is estimated at 30 minutes (re-point application connection strings to SQL Server source and restart OutSystems).

### Phase-by-Phase Rollback

| Phase | Rollback Trigger Condition | Rollback Action | Estimated Rollback Time |
|---|---|---|---|
| Pre-Cutover: Binary Extraction | Extraction manifest shows > 0.1% blob upload failures after retry | Re-run extraction for failed records; extend pre-cutover window. Do NOT proceed to cutover until 100% extraction confirmed. | 2–4 hours (re-extraction for failed blobs) |
| Phase 1: Schema Creation | Any schema validation failure; missing table; wrong column type | DROP CASCADE all schemas; fix Flyway/EF Core migration scripts; re-run Phase 1 | 15 minutes |
| Phase 2: Reference Data | Row count mismatch > 0; FK validation fails | TRUNCATE reference tables; investigate source data; re-load | 15 minutes |
| Phase 3: Rating Data | Row count mismatch; sample rate lookup returns wrong value | TRUNCATE rating schema; investigate transformation; re-load | 15 minutes |
| Phase 4: Tenant/Identity | FK violation on ClientId; security check finds password hash present | TRUNCATE identity and system schemas; investigate ETL; fix; reload from Phase 4 | 20 minutes |
| Phase 5: Historical Policy | FK violation; row count mismatch > 0.01%; financial total variance | TRUNCATE policy/billing/distribution schemas; investigate; reload from Phase 5 | 30 minutes |
| Phase 6: Active Policy/Claims | Any FK violation; financial total variance > $0.01; orphan record detected | **ABORT MIGRATION**; re-activate source SQL Server application; schedule new maintenance window | 30 minutes (source re-activation) |
| Phase 7: Blob Reconciliation | Blob match rate < 99.9%; missing blobs for active policies | Re-run blob extraction for missing records; do not proceed to cutover | 1–2 hours |
| Phase 8: Cutover Validation | Any smoke test fails; integration test fails; row count mismatch | **ABORT CUTOVER**; keep source SQL Server application active; investigate failures before rescheduling | 30 minutes (source remains active throughout) |

### Source Re-Activation Procedure (Emergency Rollback)

If migration is aborted after Phase 6 begins:
1. Confirm source SQL Server databases are online and unchanged (no modifications were made)
2. Re-point OutSystems connection strings (`InsureEdge_ext`, `InsureedgeSYS_ext`) to source SQL Server
3. Restart OutSystems application services
4. Verify application is functional (login, policy list, dashboard)
5. Notify stakeholders of rollback — see ART-3-015 Communication Plan
6. Retain PostgreSQL target database for investigation (do NOT drop — data is needed for post-mortem)
7. Schedule post-mortem and revised migration plan

**Estimated source re-activation time: 15–30 minutes**

---

## Assumptions Register (this document)

| ASM ID | Statement | Confidence | Implication |
|---|---|---|---|
| ASM-3-MIG-001 | Customer accepts a planned maintenance window of 4–8 hours for the big-bang cutover. If downtime < 30 minutes is required, the Parallel-Run pattern must be adopted, increasing implementation complexity by 3–4 weeks. | MEDIUM — downtime tolerance not confirmed. QST-3-MIG-001 raised. | Entire migration strategy changes if assumption is invalidated. |
| ASM-3-MIG-002 | Full consolidation to single PostgreSQL database is the correct target architecture for eliminating cross-DB coupling. | HIGH | No alternative architectural assumption for this. |
| ASM-3-MIG-003 | InsureEdge_ext and InsureedgeSYS_ext OutSystems connections replaced by a single connection to consolidated PostgreSQL database. | HIGH | Application migration dependency — Forge Agent must implement. |
| ASM-3-MIG-004 | Azure Database Migration Service (offline mode) for SQL Server → PostgreSQL Flexible Server is available in the target Azure region. | HIGH — ADMS is GA for this migration path as of 2026. | If unavailable, pgloader replaces ADMS for bulk data transfer. |
| ASM-3-MIG-005 | The 4–8 hour maintenance window can be scheduled during a low-activity period (e.g., overnight or weekend) to minimise business impact. | MEDIUM — business hours and user impact not confirmed. | Requires business scheduling confirmation. |

---

## Open Questions Register (this document)

| QST ID | Priority | Question | Blocking For |
|---|---|---|---|
| QST-3-MIG-001 | CRITICAL | What is the maximum acceptable downtime window for the InsureEdge cutover? This determines whether the Phased Big-Bang (4–8 hours) or Parallel-Run (< 30 minutes) pattern is used. The entire migration strategy depends on this answer. | Migration strategy finalisation; ART-3-015 Cutover Strategy |

---

*End of ART-3-014 — Migration Strategy | INSUREEDGE-2026 | IDEATE Phase | 2026-06-17*
*Pattern recommendation: Phased Big-Bang with binary pre-extraction. Marked ASM-3-MIG-001 pending downtime tolerance confirmation (QST-3-MIG-001).*
*Layer 0 §5: All evidence cited. No cutover date committed. Human gate required (DEC-).*
