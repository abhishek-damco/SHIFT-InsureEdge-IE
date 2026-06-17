# ART-5-009 — Decommission Checklist
## InsureEdge Application Modernization (INSUREEDGE-2026)

> ## ⚠ HUMAN_VALIDATION_REQUIRED ⚠
>
> **This document defines the decommission procedure for the legacy OutSystems O11 InsureEdge system. EVERY step in this document has a [HUMAN GATE] and must NEVER be auto-executed.**
>
> **This document does NOT authorize decommissioning. Decommission authority rests solely with Hudson Bailey (the customer). SHIFT does not and must not self-approve any decommission action.**
>
> **Insurance regulatory requirement: All policy, claims, and financial records must be retained for a minimum of 7 years and remain accessible (not just backed up) for regulatory audit purposes. This requirement governs all archive and decommission decisions.**

**Status:** AI_GENERATED — HUMAN_VALIDATION_REQUIRED
**Produced by:** Transfer Agent
**Phase:** TRANSFER
**Date:** 2026-06-17
**Version:** 1.0
**Engagement:** INSUREEDGE-2026 | Customer: Hudson Bailey
**Source:** ART-3-015 (Cutover Strategy), ART-3-012 (TAD), DAQ-REGISTER
**Gate reference:** DEC-4-0001 (FORGE complete, 2026-06-17)

---

## Pre-Conditions: ALL Must Be True Before Any Decommission Step

**No decommission step may begin until EVERY item below is confirmed true and signed off.**

| # | Pre-Condition | Verification Method | Status | Sign-Off |
|---|---|---|---|---|
| PC-D-01 | Target system live in production ≥ 30 days | Production deployment date confirmed in go-live record | [ ] PENDING | __________ |
| PC-D-02 | All 10 FORGE AI_GENERATED artifacts marked ENGINEER_IMPLEMENTED | Sign-off sheet in ART-5-008 §3 fully completed | [ ] PENDING | __________ |
| PC-D-03 | All migration validation queries passed (ART-4-006 §7) | Validation query results report on file, signed by DBA | [ ] PENDING | __________ |
| PC-D-04 | No open P1 defects in target system | Current sprint/release defect tracker shows zero P1 bugs | [ ] PENDING | __________ |
| PC-D-05 | Customer has signed off on data completeness | Business Lead + Finance Lead signed reconciliation report | [ ] PENDING | __________ |
| PC-D-06 | 33 provisional tests resolved and finalized | ART-4-010 updated with no PROVISIONAL entries remaining | [ ] PENDING | __________ |
| PC-D-07 | 14 test gaps addressed or formally accepted | Each gap has a documented acceptance DEC- from customer | [ ] PENDING | __________ |
| PC-D-08 | All 10 blocking DBT-4-FORGE items resolved | DBT register shows all 10 items CLOSED | [ ] PENDING | __________ |
| PC-D-09 | Insurance regulatory archive plan confirmed | Legal/compliance have confirmed 7-year accessible archive requirements | [ ] PENDING | __________ |
| PC-D-10 | Named decommission authority designated | Customer has designated the individual with authority to approve each [HUMAN GATE] | [ ] PENDING | __________ |

---

## Decommission Steps

Each step requires:
- [HUMAN GATE]: explicit human APPROVE before action is taken
- Owner: the role responsible for execution
- Validation: how to confirm the step succeeded
- Rollback window: how long the step remains reversible (if applicable)

---

### Step D-01: Disable OutSystems Timer Jobs

[HUMAN GATE] — REQUIRED BEFORE EXECUTION

**Owner:** Hudson Bailey Tech Lead + OutSystems Administrator
**Prerequisite:** All pre-conditions (PC-D-01 through PC-D-10) confirmed. Target system verified stable for ≥ 30 days.
**Action:** In OutSystems LifeTime or Service Center, set the site property `KillTimer = TRUE` for all 11 background timer jobs. Alternatively, disable each timer individually in Service Center → Processes. This prevents any new automated job runs in the legacy system while preserving all existing data.
**Validation:** OutSystems Service Center → Processes shows all 11 timers as disabled or KillTimer confirmed TRUE via site property read. No new timer executions visible in process logs.
**Rollback window:** Reversible — re-enable timers at any time before D-02.
**Human gate sign-off:** Name: _________________ Date: _________________ Action: APPROVE / REJECT

---

### Step D-02: Set OutSystems to Read-Only Mode

[HUMAN GATE] — REQUIRED BEFORE EXECUTION

**Owner:** Hudson Bailey Tech Lead + OutSystems Administrator
**Prerequisite:** D-01 complete. Target system confirmed fully operational. All active workflows in legacy system have completed (no in-flight transactions).
**Action:** Disable user-facing write operations in OutSystems. Options: (a) Enable maintenance mode in OutSystems LifeTime for the InsureEdge application; or (b) set all write-operation site properties to disabled state; or (c) remove OutSystems application role assignments to prevent logins. The goal is to prevent any new data writes to `InsureEdge_DEV` or `InsureEdge_System_DEV` SQL Server databases.
**Validation:** Attempt to login to legacy OutSystems InsureEdge application — application should be in maintenance mode or return access denied. DBA confirms no new writes to source DBs: `SELECT MAX(created_on) FROM InsureEdge_DEV.dbo.Policy` — timestamp should be ≥ D-02 execution time.
**Rollback window:** Reversible — re-enable application mode.
**Human gate sign-off:** Name: _________________ Date: _________________ Action: APPROVE / REJECT

---

### Step D-03: Final Data Sync Validation

[HUMAN GATE] — REQUIRED BEFORE EXECUTION

**Owner:** DBA + Business Lead
**Prerequisite:** D-02 complete. Source confirmed read-only.
**Action:** Run a final reconciliation between source SQL Server and target PostgreSQL. Execute row count comparison queries from ART-4-006 §7.1 one final time. Execute financial spot-check queries from ART-4-006 §7.5. Verify blob reconciliation (MigrationManifest count vs target BlobPath non-NULL count). Generate and file a formal Final Reconciliation Report.
**Validation:** Final Reconciliation Report shows:
- Row count variance ≤ 0.01% for all migrated tables.
- Financial totals match source within tolerance (zero variance for active policy premiums).
- Blob match rate ≥ 99.9%.
- Zero sentinel dates in target.
- Zero `password_hash` values in target.
Report must be signed by DBA, Business Lead, and Finance Lead.
**Rollback window:** If discrepancies found — DO NOT proceed. Investigate and resolve before continuing.
**Human gate sign-off:** Name: _________________ Date: _________________ Action: APPROVE / REJECT

---

### Step D-04: Revoke User Access to Legacy OutSystems System

[HUMAN GATE] — REQUIRED BEFORE EXECUTION

**Owner:** Hudson Bailey IT Administrator
**Prerequisite:** D-03 Final Reconciliation Report signed. All users confirmed to be operating on target system (no active users still on legacy system).
**Action:** Deactivate all user accounts in OutSystems LifeTime. Remove or expire OutSystems user credentials for all InsureEdge users. Send final notification to all users confirming the legacy system is no longer accessible.
**Validation:** Attempt login with a previously active user account — access must be denied. OutSystems LifeTime user list shows all users deactivated.
**Rollback window:** User accounts can be re-activated until D-05.
**Human gate sign-off:** Name: _________________ Date: _________________ Action: APPROVE / REJECT

---

### Step D-05: Export and Archive OutSystems OML Files and OAP Packages

[HUMAN GATE] — REQUIRED BEFORE EXECUTION

**Owner:** Hudson Bailey Tech Lead + OutSystems Administrator
**Prerequisite:** D-04 complete.
**Action:** Export all OutSystems OML files for every module in the InsureEdge application from OutSystems LifeTime or Service Studio. Export OAP solution packages for the full application. Store these in a secure, long-term archive location (e.g., Azure Blob Storage `insuredge-legacy-archive` container, or equivalent). Document the archive location and access method.
**Archive contents:** All OML files (approximately 20 modules based on evidence pool), all OAP packages, OutSystems LifeTime deployment plan exports, service property exports (site properties).
**Validation:** Archive manifest lists all exported files with checksums. Files are retrievable from archive location. Archive location is documented in project decommission record.
**Retention:** No specific minimum for OML/OAP files — retain per customer policy (recommended ≥ 3 years for reference).
**Rollback window:** N/A — this is an additive preservation step.
**Human gate sign-off:** Name: _________________ Date: _________________ Action: APPROVE / REJECT

---

### Step D-06: Archive SQL Server Databases — INSURANCE REGULATORY COMPLIANCE

[HUMAN GATE] — REQUIRED BEFORE EXECUTION

**Owner:** DBA + Legal/Compliance representative
**Prerequisite:** D-05 complete. Insurance regulatory archive requirements confirmed with legal/compliance team.
**Action:** Take full SQL Server backups of both source databases:
- `InsureEdge_DEV` (92+ tables — all policy, claims, financial, billing data)
- `InsureEdge_System_DEV` (26+ tables — tenant, user, permission data)

Archive format: SQL Server full backup files (`.bak`) with verified checksums. Store in:
- Primary archive: Azure Blob Storage `insuredge-regulatory-archive` container (WORM/immutable storage strongly recommended)
- Secondary archive: Offline/cold storage (per customer policy)

Document: archive date, backup file locations, checksum verification, restore procedure.

**Insurance regulatory retention requirement:** All policy, claims, and financial records must be retained for a minimum of **7 years** from the date of each record's creation/transaction. The archive must be **accessible** (not just stored) — a restore procedure must exist and be tested.

**Validation:**
- Backup files created with confirmed checksums.
- Test restore to a non-production SQL Server instance confirms backup is valid and readable.
- Archive location documented and accessible to authorized personnel.
- Restore procedure documented and tested.
**Rollback window:** N/A — additive step; SQL Server instances remain intact until D-07.
**Human gate sign-off:** Name: _________________ Date: _________________ Action: APPROVE / REJECT

---

### Step D-07: Decommission OutSystems Environment

[HUMAN GATE] — THIS STEP IS IRREVERSIBLE

**Owner:** Hudson Bailey OutSystems Administrator + authorized Hudson Bailey executive
**Prerequisite:** D-06 complete and verified. Archive confirmed readable. Legal/compliance confirmed. Minimum 30-day post-go-live stability period elapsed. All pre-conditions confirmed.
**Action:** In OutSystems LifeTime, remove/decommission the InsureEdge application from the OutSystems PaaS environment. This is a LifeTime-level decommission action. The OutSystems application, all modules, and all server-side state will be removed from the OutSystems PaaS platform.
**WARNING: This action is IRREVERSIBLE in terms of the live OutSystems environment. Data is preserved in SQL Server databases and the OML archives from D-05. However, the running OutSystems application cannot be restored without full re-deployment from OML files.**
**Validation:** OutSystems LifeTime shows InsureEdge application as removed. No active requests to OutSystems application endpoints.
**Rollback window:** NONE after this step. The SQL Server databases (D-08) and archive (D-06) remain until decommissioned in subsequent steps.
**Human gate sign-off:** Name: _________________ Date: _________________ Action: APPROVE / REJECT
**Additional authorization required:** Hudson Bailey executive sign-off (name and title): _______________________

---

### Step D-08: Decommission SQL Server Instances

[HUMAN GATE] — THIS STEP IS IRREVERSIBLE

**Owner:** DBA + Hudson Bailey Cloud/Infrastructure Administrator
**Prerequisite:** D-07 complete. D-06 archive confirmed readable and accessible. Mandatory confirmation that the archive restored successfully in Step D-06 test.
**Action:** Decommission the SQL Server 2019 instances hosting `InsureEdge_DEV` and `InsureEdge_System_DEV`. Options depending on hosting:
- If Azure SQL / VM-hosted: deallocate and delete the Azure SQL instance or Azure VM.
- If on-premises: shut down and decommission the server per customer IT procedures.

Before deleting, confirm: archive backup files are in place (D-06) and the restore test was successful.
**WARNING: This action deletes the live source databases. The archive from D-06 is the only copy after this step. Ensure archive is confirmed BEFORE proceeding.**
**Validation:** SQL Server instances no longer accessible. Azure portal (if Azure-hosted) shows resources deleted or decommissioned. DBA confirms no remaining references to old SQL Server connection strings in target application.
**Rollback window:** NONE after deletion. Archive is the sole remaining copy.
**Human gate sign-off:** Name: _________________ Date: _________________ Action: APPROVE / REJECT

---

### Step D-09: Cancel OutSystems PaaS Subscription

[HUMAN GATE] — FINANCIAL AND CONTRACTUAL — IRREVERSIBLE

**Owner:** Hudson Bailey contract/procurement representative
**Prerequisite:** D-07 and D-08 complete. Confirm no other applications or tenants on the same OutSystems PaaS subscription.
**Action:** Cancel the OutSystems PaaS subscription. Before cancellation:
1. Confirm with OutSystems account manager that no other customer tenants or applications share this subscription.
2. Obtain final invoice and confirm billing is up to date.
3. Obtain any applicable data deletion confirmations from OutSystems per contractual data protection obligations.
**WARNING: Cancellation terminates the OutSystems PaaS contract. Any remaining OutSystems environments on this subscription will be deleted.**
**Validation:** OutSystems account manager confirms cancellation. Final invoice received. Data deletion confirmation received (if applicable under DPA).
**Rollback window:** NONE after subscription cancellation.
**Human gate sign-off:** Name: _________________ Date: _________________ Action: APPROVE / REJECT
**Procurement authorization:** Name and title: _______________________

---

### Step D-10: Close Superseded Third-Party Service Accounts

[HUMAN GATE] — CONFIRM PER INTEGRATION BEFORE CLOSING

**Owner:** Integration Lead + Hudson Bailey contract representative
**Prerequisite:** D-09 complete. Confirm for EACH integration whether the account is superseded (being replaced by a new account in the target system) or retained.

For each integration, assess and decide:

| Integration | Legacy Account | Target Account | Action | Approved By |
|---|---|---|---|---|
| TranzPay | Demo/sandbox account used by legacy | Production account confirmed for target | Close demo account after target payment flow verified | __________ |
| LenderDock | Legacy test account | Target account (contract pending QST-1-INT-002) | Close legacy test account when target confirmed | __________ |
| HexCat | Legacy API key | Target contract (QST-1-INT-004) | Close legacy key when target confirmed | __________ |
| Plumsail | Legacy API key | Target key (QST-1-INT-003) | Close legacy key when target confirmed | __________ |
| DisburseCloud | Legacy sandbox | Target production account | Close legacy account when target v1.2.1 confirmed | __________ |
| Google Maps | Legacy API keys (two) | Target keys (origin-restricted per NFR-020) | Close legacy keys when target confirmed | __________ |
| Office365 SMTP | Legacy SMTP credentials | Same or new credentials | Close/rotate legacy credentials when target confirmed | __________ |
| Azure Blob Storage | Legacy connection string | Managed Identity (no string) | Remove legacy connection string from all configs | __________ |

**Validation:** Each closed account confirmed with the vendor. No active traffic to legacy account endpoints. Target system smoke tests confirm all integrations functional after account closure.
**Rollback window:** Varies per vendor — typically accounts can be re-activated within 30 days of closure. Confirm per vendor before closing.
**Human gate sign-off (per integration):** See table above.

---

### Step D-11: Final IP Transfer Confirmation

[HUMAN GATE] — CONTRACTUAL AND LEGAL

**Owner:** Hudson Bailey authorized executive + Damco project lead
**Prerequisite:** All previous decommission steps (D-01 through D-10) complete.
**Action:** Hudson Bailey's authorized representative reviews and signs the IP Transfer Package (ART-5-010). This confirms that:
1. All AI_GENERATED SHIFT artifacts are accepted by Hudson Bailey as customer IP.
2. All ENGINEER_IMPLEMENTED sign-offs on the 27 HUMAN_VALIDATION_REQUIRED sections are complete.
3. Hudson Bailey assumes full ownership and responsibility for the InsureEdge target system.
4. The SHIFT engagement is formally closed.

**Validation:** Signed IP transfer agreement on file. All ART-5-010 inventory items acknowledged. SHIFT engagement record updated as COMPLETE.
**Rollback window:** N/A — final contractual closure.
**Human gate sign-off:** Name: _________________ Date: _________________ Action: APPROVE / REJECT
**Customer executive authorization:** Name and title: _______________________

---

## Retention Summary

| Data Type | Retention Requirement | Archive Method | Archive Location |
|---|---|---|---|
| Policy records | ≥ 7 years (insurance regulatory) | SQL Server .bak archive + Azure Blob WORM | See D-06 |
| Claims records | ≥ 7 years (insurance regulatory) | SQL Server .bak archive + Azure Blob WORM | See D-06 |
| Financial/payment records | ≥ 7 years (insurance regulatory) | SQL Server .bak archive + Azure Blob WORM | See D-06 |
| Audit logs | ≥ 7 years (regulatory, QST-BA-008) | SQL Server .bak + target PostgreSQL audit_log | See D-06 + target |
| Policy/claim documents (Blob) | ≥ 7 years (regulatory) | Azure Blob GRS — existing retention | Target Azure Blob |
| OML / OAP source files | ≥ 3 years recommended | Azure Blob archive container | See D-05 |
| SHIFT engagement artifacts (all ART- files) | Customer discretion | This OneDrive engagement folder | Customer to decide |

---

## Decommission Sign-Off Summary

| Step | Description | Sign-Off | Date |
|---|---|---|---|
| D-01 | Disable OutSystems timer jobs | _________________ | ______ |
| D-02 | Set OutSystems to read-only | _________________ | ______ |
| D-03 | Final data sync validation | _________________ | ______ |
| D-04 | Revoke user access to legacy system | _________________ | ______ |
| D-05 | Export and archive OML/OAP files | _________________ | ______ |
| D-06 | Archive SQL Server databases (7-year retention) | _________________ | ______ |
| D-07 | Decommission OutSystems environment (IRREVERSIBLE) | _________________ | ______ |
| D-08 | Decommission SQL Server instances (IRREVERSIBLE) | _________________ | ______ |
| D-09 | Cancel OutSystems PaaS subscription (IRREVERSIBLE) | _________________ | ______ |
| D-10 | Close superseded third-party accounts | _________________ | ______ |
| D-11 | Final IP transfer confirmation | _________________ | ______ |

---

*End of ART-5-009 — Decommission Checklist | INSUREEDGE-2026 | TRANSFER Phase | 2026-06-17*
*Status: AI_GENERATED — HUMAN_VALIDATION_REQUIRED. [HUMAN GATE] count: 11 gates (one per decommission step). Pre-conditions: 10 required (all PENDING). Steps D-07, D-08, D-09 are explicitly marked IRREVERSIBLE. Insurance regulatory 7-year retention requirement applies to Steps D-06, D-08. SHIFT does not authorize decommissioning — all decisions rest with Hudson Bailey.*
