# ART-3-015 — Cutover Strategy
## InsureEdge Application Modernization (INSUREEDGE-2026)

**Produced by:** Migration Agent
**Phase:** IDEATE
**Date:** 2026-06-17
**PRD Gate:** PASSED (DEC-2-0005, 2026-06-17)
**Confidence:** HIGH for procedural steps; ASM-3-MIG-001 governs downtime window assumption.

**Evidence consumed:**
- ART-3-013: Data Migration Architecture (entity inventory, special cases)
- ART-3-014: Migration Strategy (pattern selection, phase definitions)
- ART-2-009: NFR Catalog (availability, integrity, security requirements)
- ART-2-005: Business Rules Catalog (background jobs, integrations)

**Governance compliance:**
- No cutover date committed — requires human DEC-
- QST-3-MIG-001 (downtime tolerance) must be answered before this document is finalised
- All Go/No-Go decisions require explicit human APPROVE
- SHIFT never self-approves a cutover

---

## Section 1: Pre-Cutover Checklist

All items in this checklist must be marked COMPLETE before the maintenance window opens. Any FAIL or PENDING item is a blocker unless explicitly waived by the customer with a documented DEC-.

### 1.1 Schema and Data Readiness

| # | Check | Owner | Pass Criteria | Status |
|---|---|---|---|---|
| PC-01 | Target PostgreSQL schema fully deployed (all 7 domain schemas, all 153+ tables, all FKs) | DBA | Zero schema deployment errors; all FK constraints present including Claim→Policy, Worksheet→Claim | PENDING |
| PC-02 | Schema typo renames applied (WrittingCompany, ComissionPercentage, OraganisationType, PoilcyId) | DBA | Column names match NFR-012 mapping; no residual typo column names in target DDL | PENDING |
| PC-03 | Reserved word renames applied (User2→app_user, Group_Table→user_group, GroupUser_Table→user_group_member) | DBA | Target table names conform to PostgreSQL reserved word rules | PENDING |
| PC-04 | Binary pre-extraction complete and validated | Data Migration Engineer | Extraction manifest row count = total varbinary records in source; all blobs accessible in Azure Blob Storage | PENDING |
| PC-05 | ORM-managed table DDL obtained and deployed (QST-3-MIG-007) | DBA | UserSystemNotifications, OS_UserConfigurations, GridDefaultLayouts present in target schema | PENDING |
| PC-06 | PaymentCallbackResponses table status confirmed (QST-3-MIG-001) | Data Migration Engineer | Table either exists in source and ETL script is ready, OR target-only creation confirmed | PENDING |
| PC-07 | Legacy mapping table classification confirmed (QST-3-MIG-005) | Business Lead | Each of 6 legacy tables classified as ARCHIVE or MIGRATE-TRANSFORM | PENDING |

### 1.2 Test Migration Passed

| # | Check | Owner | Pass Criteria | Status |
|---|---|---|---|---|
| PC-08 | Full migration dry-run completed on production data copy | Data Migration Engineer | All 8 phases completed without error; total time recorded and within maintenance window budget | PENDING |
| PC-09 | Dry-run row count reconciliation passed | Data Migration Engineer | Source vs target row counts match for all tables within 0.01% tolerance | PENDING |
| PC-10 | Dry-run financial total validation passed | Business Lead | Sum of PolicyPaymentTransaction amounts per policy matches PolicyPremium totals; zero variance | PENDING |
| PC-11 | Dry-run orphan record scan passed | Data Migration Engineer | Zero orphan claims, worksheets, or worksheet payments in migrated data | PENDING |
| PC-12 | Dry-run sentinel date check passed | Data Migration Engineer | Zero 1900-01-01 values in any datetime column in target database | PENDING |
| PC-13 | Dry-run User2.Password migration security check passed | Security Lead | Zero rows in identity.app_user with non-NULL password_hash; all rows have requires_password_reset = TRUE | PENDING |
| PC-14 | Dry-run migration completed within planned maintenance window budget | Migration Lead | Actual time ≤ 80% of allocated maintenance window duration | PENDING |

### 1.3 Application Readiness

| # | Check | Owner | Pass Criteria | Status |
|---|---|---|---|---|
| PC-15 | Target application deployed and pointing to PostgreSQL | Application Lead | Application starts and connects to PostgreSQL target without errors | PENDING |
| PC-16 | All schema typo references updated in application code | Forge Agent | Zero references to WrittingCompany, ComissionPercentage, OraganisationType, PoilcyId in application codebase | PENDING |
| PC-17 | All cross-DB SQL rewritten (IESYSDBName pattern eliminated) | Forge Agent | Zero OutSystems Advanced SQL actions containing IESYSDBName(); all queries reference schema-qualified table names | PENDING |
| PC-18 | All integration credentials migrated to Azure Key Vault | Security Lead | Zero plaintext credentials in application configuration; all secrets retrieved from Key Vault at runtime | PENDING |
| PC-19 | BypassRefundResponse flag confirmed FALSE in target environment | Technical Lead | Configuration for target environment explicitly sets BypassRefundResponse = FALSE (NFR-009) | PENDING |
| PC-20 | 11 background jobs (timers) configured in target environment | Application Lead | All 11 jobs registered; threshold values loaded from external config; KillTimer = FALSE | PENDING |
| PC-21 | TranzPay production URL configured (GAP-2-INT-001) | Integration Lead | Production TranzPay base URL confirmed and configured; NOT demo.tranzpay.com | PENDING |

### 1.4 Rollback Readiness

| # | Check | Owner | Pass Criteria | Status |
|---|---|---|---|---|
| PC-22 | Rollback procedure tested and timed | DBA + Application Lead | Source SQL Server re-activation tested end-to-end; time confirmed < 30 minutes | PENDING |
| PC-23 | Source SQL Server databases in read-only mode confirmed | DBA | SSMS or SQL query confirms source DBs are in single-user/read-only mode at maintenance window start | PENDING |
| PC-24 | Source application shutdown confirmed | Application Lead | OutSystems application confirmed stopped; no active sessions | PENDING |
| PC-25 | Rollback decision authority confirmed | Customer Sponsor | Named individual with authority to call rollback confirmed and available during maintenance window | PENDING |

### 1.5 Communication Readiness

| # | Check | Owner | Pass Criteria | Status |
|---|---|---|---|---|
| PC-26 | User communication sent (password reset notice) | Business Lead | All existing users notified via email that they must reset their password on first login to the new system; sent ≥ 48 hours before cutover | PENDING |
| PC-27 | Maintenance window announcement sent | Project Manager | All stakeholders notified of maintenance window date/time and expected duration ≥ 5 business days in advance | PENDING |
| PC-28 | War room established | Migration Lead | Communication channel (Teams/Slack) active; all team members joined; escalation contacts confirmed | PENDING |

---

## Section 2: Cutover Sequence

This section defines the step-by-step execution sequence during the maintenance window. All times are relative to T=0 (maintenance window start).

**Prerequisites at T=0:**
- Source application stopped and confirmed offline
- Source SQL Server databases set to read-only
- War room active
- All pre-cutover checklist items COMPLETE

| Step | Time | Activity | Owner | Expected Duration | Go/No-Go |
|---|---|---|---|---|---|
| C-01 | T+0 | Confirm source application is stopped; confirm all active user sessions terminated; take final SQL Server backup | DBA | 15 min | REQUIRED before C-02 |
| C-02 | T+15 | Execute Phase 1: Schema validation (verify target schema exactly matches ART-3-013 entity inventory) | DBA | 30 min | REQUIRED before C-03 |
| C-03 | T+45 | Execute Phase 2: Reference and lookup data migration | Data Migration Engineer | 30 min | REQUIRED before C-04 |
| C-04 | T+75 | Execute Phase 3: Rating engine data migration (HBRater tables) | Data Migration Engineer | 30 min | REQUIRED before C-05 |
| C-05 | T+105 | Execute Phase 4: Tenant and identity data migration (InsureEdge_System_DEV) | Data Migration Engineer | 30 min | REQUIRED before C-06 |
| C-06 | T+135 | Security check: confirm identity.app_user has zero password_hash values, all requires_password_reset = TRUE | Security Lead | 10 min | REQUIRED before C-07 |
| C-07 | T+145 | Execute Phase 5: Historical policy data migration | Data Migration Engineer | 60 min | REQUIRED before C-08 |
| C-08 | T+205 | Execute Phase 6: Active policy and transaction data migration (highest criticality) | Data Migration Engineer | 60 min | REQUIRED before C-09 |
| C-09 | T+265 | Execute Phase 7: Blob path reconciliation (verify extraction manifest against target BlobPath columns) | Data Migration Engineer | 30 min | REQUIRED before C-10 |
| C-10 | T+295 | Full row count reconciliation: all tables; source vs target count comparison report generated | Data Migration Engineer | 20 min | REQUIRED — no variance > 0.01% |
| C-11 | T+315 | Financial total validation: sum PolicyPaymentTransaction per policy vs PolicyPremium totals | Business Lead | 20 min | REQUIRED — zero variance |
| C-12 | T+335 | Application smoke tests (10 key user journeys — see Section 5) | QA Lead | 30 min | REQUIRED — all journeys pass |
| C-13 | T+365 | Integration smoke tests (TranzPay, DisburseCloud, LenderDock, HexCat, Azure Blob — see Section 5) | Integration Lead | 20 min | REQUIRED — all pass |
| C-14 | T+385 | Background job validation: confirm all 11 timers registered; BypassRefundResponse = FALSE confirmed | Application Lead | 10 min | REQUIRED |
| C-15 | T+395 | **FINAL GO/NO-GO DECISION** by human approver — customer sponsor reviews all validation results | Customer Sponsor | 15 min | EXPLICIT APPROVE required — SHIFT never self-approves |
| C-16 | T+410 | DNS update / connection string switch to PostgreSQL target (if parallel-run variant: traffic shift) | Infrastructure Lead | 10 min | After APPROVE from C-15 |
| C-17 | T+420 | Post-switch validation: login, policy list, create test quote; confirm application functional on PostgreSQL | QA Lead + Business Lead | 15 min | REQUIRED — confirm no regression |
| C-18 | T+435 | Notify stakeholders: cutover complete; send user password reset instructions | Project Manager | 10 min | After C-17 passes |
| C-19 | T+445 | Begin post-cutover monitoring period (4 hours minimum) | Application Lead | 240 min | Ongoing |
| C-20 | T+685 | Formal cutover sign-off if no critical issues found during monitoring | Customer Sponsor | 15 min | Closes maintenance window |

**Total estimated maintenance window: 7–8 hours**
**Buffer:** 45–60 minutes built into above schedule for minor issues

---

## Section 3: Go/No-Go Criteria

### Critical Go/No-Go Gates (any FAIL = ABORT)

| Gate | Condition | Decision |
|---|---|---|
| GNG-01: Source backup confirmed | Final SQL Server backup completed before migration starts | GO if backup exists and is verified; NO-GO if backup missing |
| GNG-02: Schema validation complete | All 153+ target tables exist with correct columns and FKs | GO if zero schema errors; NO-GO if any table or FK missing |
| GNG-03: Orphan record scan passes | Zero orphan claims or worksheets in migrated data | GO if zero orphans; NO-GO if any orphan found |
| GNG-04: Row count reconciliation | Source vs target row count within 0.01% for all tables | GO if all within tolerance; NO-GO if any table exceeds tolerance |
| GNG-05: Financial total validation | Zero variance between policy premium totals and payment transaction sums | GO if zero variance; NO-GO if any financial discrepancy |
| GNG-06: Password security check | Zero password_hash values in app_user; all requires_password_reset = TRUE | GO if check passes; NO-GO if any password found — SECURITY CRITICAL |
| GNG-07: Application smoke tests | All 10 smoke test journeys pass on PostgreSQL target | GO if all pass; NO-GO if any critical journey fails |
| GNG-08: Integration smoke tests | All integrations respond correctly on target environment | GO if all pass; NO-GO if payment or document storage integration fails |
| GNG-09: BypassRefundResponse = FALSE | Configuration confirmed FALSE in production environment | GO if FALSE; NO-GO if TRUE — FINANCIAL INTEGRITY CRITICAL |
| GNG-10: Human APPROVE | Customer sponsor explicitly approves cutover | GO if explicit APPROVE; NO-GO if not approved or no decision reached |

### Warning-Level Criteria (escalate but do not automatically abort)

| Warning | Condition | Action |
|---|---|---|
| W-01: Row count delta 0.01–0.1% | Row count mismatch is above tolerance but below 0.1% | Escalate to Customer Sponsor; investigate before APPROVE; document if proceeding |
| W-02: Blob match rate 99.5–99.9% | Some blobs missing from path reconciliation but > 99.5% match | Identify missing blobs; confirm they are for non-active records; document if proceeding |
| W-03: Non-critical integration failure | DisburseCloud or HexCat smoke test fails but payment (TranzPay) and document storage (Azure Blob) pass | Escalate; assess business impact; can proceed with workaround plan if customer accepts risk |
| W-04: Maintenance window overrun | Actual time exceeds planned window by > 1 hour | Escalate; assess whether to continue or rollback; Customer Sponsor decides |

---

## Section 4: Rollback Decision Point and Procedure

### Rollback Decision Authority

- **Rollback trigger:** Any FAIL at a critical Go/No-Go gate (GNG-01 through GNG-10)
- **Decision authority:** Customer Sponsor (named in PC-25)
- **Decision window:** If rollback is not explicitly called within 15 minutes of a gate failure, Migration Lead calls rollback by default
- **SHIFT never calls GO unilaterally:** The Cutover Strategy defines gate criteria, but only the human approver may authorise proceeding past a failed gate

### Rollback Procedure

**Trigger:** Any critical Go/No-Go gate fails; or Customer Sponsor calls rollback.

| Step | Activity | Owner | Estimated Time |
|---|---|---|---|
| R-01 | Announce rollback decision to war room | Migration Lead | 2 min |
| R-02 | Stop target application (if started) | Application Lead | 5 min |
| R-03 | Remove source SQL Server from read-only mode | DBA | 2 min |
| R-04 | Re-point application connection strings to SQL Server source (InsureEdge_ext, InsureedgeSYS_ext) | Application Lead | 5 min |
| R-05 | Restart OutSystems application services | Application Lead | 5 min |
| R-06 | Verify source application is functional: login, policy list | QA Lead | 5 min |
| R-07 | Confirm no data was modified in source SQL Server during maintenance window | DBA | 3 min |
| R-08 | Notify stakeholders: rollback complete; system restored | Project Manager | 3 min |
| R-09 | Retain PostgreSQL target (DO NOT DROP) — required for post-mortem | DBA | — |
| R-10 | Schedule post-mortem within 24 hours | Migration Lead | — |

**Total estimated rollback time: 25–30 minutes**

**Post-rollback:** The target PostgreSQL database is preserved for post-mortem analysis. A new maintenance window must be scheduled after root cause is identified and remediated. The pre-cutover binary extraction is still valid and does not need to be re-run (blobs remain in Azure Blob Storage).

---

## Section 5: Post-Cutover Validation Gates

### 5.1 Application Smoke Tests (10 Key User Journeys)

These 10 smoke tests must pass on the PostgreSQL target before cutover is approved.

| Test | User Journey | Pass Criteria |
|---|---|---|
| SMK-01 | Login: ClientAdmin user logs in | Successful login; dashboard loads; no tenant data leakage |
| SMK-02 | Policy list: View all active policies for a tenant | Policy list returns correct count; all policies have correct status |
| SMK-03 | Policy detail: Open a policy record | Policy detail loads; all tabs (Coverage, Documents, Timeline) render correctly |
| SMK-04 | Claims list: View claims for a tenant | Claims list loads; claim-to-policy link functional |
| SMK-05 | Create test quote (Draft only — do NOT bind in production) | Quote creation wizard completes; HexCat risk call succeeds; quote saved as Draft |
| SMK-06 | User management: List users for a tenant | User list returns; no plaintext passwords visible |
| SMK-07 | Password reset: Trigger password reset for a test user | Reset token generated; email sent; token expires at 30 minutes |
| SMK-08 | Group permissions: Confirm a group's screen permissions | Permission flags load correctly; AllAccess = TRUE overrides check passes |
| SMK-09 | Document download: Download a policy document | Document retrieves from Azure Blob; download completes |
| SMK-10 | Audit log: Confirm an action is logged | After SMK-05, confirm AuditLog has entry for the create-quote action |

### 5.2 Integration Smoke Tests

| Test | Integration | Pass Criteria |
|---|---|---|
| INT-SMK-01 | Azure Blob Storage | Upload a test file; retrieve with SAS token; confirm download |
| INT-SMK-02 | TranzPay (sandbox) | Initiate a ThirdParty hosted payment redirect; confirm redirect URL returned; confirm PostBackUrl reachable |
| INT-SMK-03 | HexCat geocoding | Submit a test address; confirm risk data returned; confirm PolicyRiskInformation updated |
| INT-SMK-04 | LenderDock | Trigger a test mortgagee notification for a policy with a mortgage record; confirm NotifyLenderdock record created |
| INT-SMK-05 | Azure Key Vault | Confirm application reads credentials from Key Vault; no plaintext secrets in config logs |

### 5.3 Background Job Validation

| Check | Pass Criteria |
|---|---|
| All 11 timers registered | Timer management interface shows all 11 jobs with correct schedules |
| KillTimer = FALSE | Confirmed in production configuration |
| BypassRefundResponse = FALSE | Confirmed in production configuration (NFR-009) |
| Payment reconciliation job | Confirm scheduler is configured for TranzPay pending transaction polling |

### 5.4 Record Count Reconciliation Report

A formal reconciliation report must be generated and approved before cutover sign-off. The report must include:

| Report Element | Content |
|---|---|
| Table count | Total tables migrated |
| Source total rows | Sum of all rows across all migrated tables in source |
| Target total rows | Sum of all rows across all migrated tables in target |
| Variance | Source total - Target total (must be ≤ 0.01% or zero) |
| Per-table delta | Row count comparison for each table; flag any with delta > 0 |
| Sentinel date count | Zero `1900-01-01` in any datetime column in target (NFR-011) |
| Orphan record count | Zero orphan claims, worksheets in target (NFR-010) |
| Blob reconciliation | Total blobs extracted vs total BlobPath references in target; match rate |
| Password security | Zero password_hash values in identity.app_user |

---

## Section 6: Communication Plan

### Pre-Cutover Communications

| Communication | Recipient | Timing | Owner | Channel |
|---|---|---|---|---|
| Maintenance window announcement | All tenant users; customer business stakeholders | T-5 business days | Project Manager | Email |
| Password reset notice | All InsureEdge users | T-48 hours | Customer Business Lead | Email (from customer domain) |
| Technical team briefing | Migration team, DBA, Application Lead, Security Lead, Integration Lead | T-24 hours | Migration Lead | Teams/Video call |
| War room invite | All team members | T-2 hours | Migration Lead | Teams channel |
| Maintenance window start notice | Customer Sponsor, Business Lead | T+0 (when window opens) | Migration Lead | Teams |

### During-Cutover Communications (War Room Protocol)

| Event | Communication | Recipient | Owner |
|---|---|---|---|
| Phase completion | Status update posted to war room | All team members | Phase owner |
| Go/No-Go gate result | Pass/Fail announced with rationale | All team members + Customer Sponsor | Migration Lead |
| Any gate failure | Escalation to Customer Sponsor for rollback decision | Customer Sponsor | Migration Lead |
| Rollback decision called | Immediate announcement + rollback start | All team members + Customer Sponsor | Migration Lead |
| Cutover approved (GNG-10) | APPROVE confirmation recorded | All team members | Customer Sponsor |

### Post-Cutover Communications

| Communication | Recipient | Timing | Owner | Channel |
|---|---|---|---|---|
| Cutover complete notice | All tenant users | T+435 (after C-18) | Customer Business Lead | Email (from customer domain) |
| Password reset activation | All users | Same as above | Customer Business Lead | Email — instructs users to log in and reset password |
| Monitoring status (4-hour) | Customer Sponsor, Business Lead | T+685 | Migration Lead | Teams |
| Formal sign-off notification | All stakeholders | After C-20 APPROVE | Project Manager | Email |
| Post-mortem (if rollback occurred) | Technical team + Customer Lead | T+24 hours from rollback | Migration Lead | Teams/Video call |

### Escalation Chain

| Role | Contact | Availability During Window |
|---|---|---|
| Migration Lead | TBD (Project team) | Full window |
| Customer Sponsor | TBD (Customer) | Full window — must be reachable for GNG-10 |
| DBA | TBD | Full window |
| Application Lead | TBD | Full window |
| Security Lead | TBD | Full window for security gates |
| Integration Lead | TBD | Available for INT-SMK tests |

**Note:** Contact details must be confirmed and added to this document before the maintenance window is scheduled. SHIFT does not commit contact details — these are provided by the customer engagement team.

---

## Open Questions Register (this document)

| QST ID | Priority | Question | Blocking For |
|---|---|---|---|
| QST-3-MIG-001 | CRITICAL | What is the maximum acceptable downtime window? This determines whether the 4–8 hour Big-Bang or the Parallel-Run pattern is used. All timing estimates in Section 2 assume 4–8 hours. | Section 2 Cutover Sequence finalisation |
| QST-3-CUT-001 | MAJOR | What is the target maintenance window schedule (date, time, day of week)? This determines pre-cutover communication timing and team availability planning. | Communication plan timing (Section 6) |
| QST-3-CUT-002 | MAJOR | Who is the named Customer Sponsor with authority to approve Go/No-Go at gate GNG-10? This person must be available and reachable for the entire maintenance window. | Go/No-Go Gate GNG-10 |
| QST-3-CUT-003 | MINOR | What is the post-migration monitoring SLA? How long must the system be stable before the maintenance window is formally closed? Currently assumed 4 hours (Step C-19). | C-19 duration |

---

## Governance Notes

- **No self-approval:** SHIFT does not approve its own cutover. Gate GNG-10 requires explicit APPROVE from the Customer Sponsor.
- **No date committed:** This document defines the procedure and sequence. The actual maintenance window date requires a human DEC- after QST-3-MIG-001 and QST-3-CUT-001 are answered.
- **DAQ register:** All QST- items raised in this document are logged to the project DAQ Register.
- **Evidence first:** All gate criteria reference NFR- or ART- findings. No ad-hoc thresholds were invented.

---

*End of ART-3-015 — Cutover Strategy | INSUREEDGE-2026 | IDEATE Phase | 2026-06-17*
*Layer 0 §4: Zero open blocking doubts required to exit IDEATE phase. QST-3-MIG-001 and QST-3-CUT-001/002 are MAJOR — must be answered before cutover is scheduled.*
*Layer 0 §6: All QST- items accumulated here will be surfaced at the next Clarification Round.*
