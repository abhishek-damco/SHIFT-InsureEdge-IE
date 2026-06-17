# ART-5-007 — Knowledge Transfer Package
## InsureEdge Application Modernization (INSUREEDGE-2026)

**Status:** AI_GENERATED
**Produced by:** Transfer Agent
**Phase:** TRANSFER
**Date:** 2026-06-17
**Version:** 1.0
**Engagement:** INSUREEDGE-2026 | Customer: Hudson Bailey
**Source:** ART-3-012 (TAD), ART-3-009 (Infrastructure), ART-2-005 (Business Rules), ART-3-002 (ADRs), ART-4-001 (Repository Structure), DAQ-REGISTER

---

## Section 1: Application Overview

InsureEdge is a multi-tenant, cloud-native insurance management platform modernized from OutSystems O11 to a modular monolith on ASP.NET Core (.NET 8) + React (TypeScript) + PostgreSQL (Azure Flexible Server), hosted on Azure.

**What the system does:**
- Full insurance policy lifecycle: quoting, binding, endorsements, renewals, cancellations
- Claims management: FNOL, adjuster workflow, worksheets, disbursements
- Billing and payments: premium collection, payment plans, auto-debit, refunds via TranzPay
- Distribution: intermediary/producer management, commission tracking and disbursement via DisburseCloud
- Identity and access: multi-tenant user management, group-based permissions, MFA
- Document management: generation via Plumsail, storage in Azure Blob
- System administration: tenant provisioning, product catalog, background job management

**Scale:** 100 concurrent users, ~65 user-facing screens, 11 background jobs, 10 external integrations.

**Customer:** Hudson Bailey (producer `hudsonbaileydemo`), writing company: Sierra Specialty Insurance Company.

**Source system:** OutSystems O11 on SQL Server 2019 (2 databases: `InsureEdge_DEV`, `InsureEdge_System_DEV`).

---

## Section 2: Architecture Summary

### 2.1 Modular Monolith Pattern

The system is a single ASP.NET Core Web API application divided into 7 domain modules. Each domain has its own controllers, application services, domain services, repositories, and EF Core domain context. The modules communicate in-process (not via HTTP or message bus). This is a deliberate trade-off: simpler deployment and operations at 100-user scale, with the ability to extract microservices later if scale demands.

**Decision reference:** ADR-001.

### 2.2 Architecture Decision Records (ADRs) — Summary

All 10 ADRs are in `ART-3-002-ADRs.md`. Key decisions every developer must know:

| ADR | Decision | Why it matters |
|---|---|---|
| ADR-001 | Modular Monolith (single ASP.NET Core app, 7 domain modules) | Single deployment, simpler ops at 100-user scale |
| ADR-002 | PostgreSQL 16, single DB, two schemas (public + system); EF Core + Dapper hybrid; schema typos corrected | Source had two SQL Server DBs with cross-DB joins — these are eliminated in target |
| ADR-003 | Row-level ClientId tenant isolation; EF Core global query filters; PlatformAdmin bypass with full audit | Every query is tenant-scoped unless you explicitly call `IgnoreQueryFilters()` — understand this before writing any query |
| ADR-004 | ASP.NET Core Identity + JWT; PBKDF2 hashing; refresh tokens; TOTP MFA; synchronous Redis cache invalidation for privilege revocation | No plaintext passwords; MFA required for admin roles; privilege changes take effect before next request |
| ADR-005 | RPS raster data migrated to Azure PostgreSQL Flexible Server (PostGIS); separate `gis` database | 26 GB raster dataset on same server — monitor PostgreSQL memory and CPU after RPS queries |
| ADR-006 | TranzPay hosted redirect only (ThirdParty flow); PCI SAQ A; `AddCustomerCCCharge` is PROHIBITED | Never implement direct card charge on InsureEdge servers — violates PCI scope. `BypassRefundResponse` must always be FALSE in non-dev environments |
| ADR-007 | React 18 SPA; Vite; TanStack Query; Zustand; React Hook Form + Zod; shadcn/ui | All 65 screens are pure API consumers; no server-side rendering |
| ADR-008 | No API Gateway (Azure Application Gateway + WAF v2 for L7); direct ASP.NET Core routing | Simple routing — no APIM overhead at 100-user scale |
| ADR-009 | Hangfire for all 11 background jobs; PostgreSQL storage; kill switch per job via Azure App Configuration | Kill switches allow emergency job disablement without deployment |
| ADR-010 | Azure Key Vault via Managed Identity for ALL secrets; no plaintext credentials anywhere | Any credential found outside Key Vault is a security violation |

### 2.3 How Requests Flow

1. User browser → Azure Application Gateway (WAF v2, SSL termination)
2. Static files → Azure Static Web Apps (React SPA)
3. API calls (`/api/*`) → Azure App Service (ASP.NET Core)
4. Middleware pipeline: Correlation ID injection → Tenant resolution (`TenantMiddleware`) → Authentication (JWT) → Authorization (`[RequirePermission]` attribute) → Controller → Application Service → Domain Service → Repository → EF Core → PostgreSQL
5. All outbound HTTP (integrations): via `IHttpClientFactory` + Polly (retry/circuit breaker)
6. Background jobs: Hangfire server (same App Service process) → PostgreSQL job store → executes scheduled jobs

---

## Section 3: Domain Guide

### Domain 1: Policy Lifecycle (D1)

**Key entities:** `policy.policy`, `policy.account`, `policy.risk_location`, `policy.policy_risk_information`, `policy.policy_mortgage`, `policy.policy_limit_coverage`, `policy.policy_document`, `policy.writing_company`

**Key business rules:**
- Policy fee: $195 fixed on every policy (BR-POL-FEE-001)
- Renewal quote generated 90 days before expiry (BR-POL-REN-001)
- Quote expiry: new business 90 days, renewal 30 days, endorsement 90 days (BR-POL-QE-001/002/003)
- HexCat risk gate: "Not Approved" status blocks progression past risk information step (BR-POL-RISK-001)
- Duplicate policy check: one active bound policy per risk location per tenant (BR-POL-DUP-001)
- Policy status machine: Draft → Approved → Active → Cancelled/Lapsed/Expired/Non-Renewed (ART-2-005 §1.7)

**Key workflows:** Quote creation (5-step wizard: info, risk location, coverages, review, bind), endorsement, renewal, cancellation, cancel/rewrite.

**Hangfire jobs owned:** T-01 (RenewalQuoteGenerator), T-02 (PolicyExpiryProcessor), T-03 (NonRenewalNoticeSender), T-04 (NonRenewalStatusProcessor), T-05 (QuoteExpiryProcessor), T-11 (BulkUploadProcessor)

**Integrations used:** HexCat (risk scoring), Google Geocoding (address), TranzPay (binding payment), LenderDock (mortgagee notification), Plumsail (document generation), Azure Blob (document storage)

---

### Domain 2: Claims Management (D2)

**Key entities:** `claims.claim`, `claims.worksheet`, `claims.worksheet_reserve`, `claims.worksheet_payment`, `claims.claim_document`, `claims.claim_impacted_coverage`

**Key business rules:**
- Claim must be registered against an existing policy (BR-CLM-FNOL-001)
- Duplicate claim check by same policy + loss date (BR-CLM-FNOL-002)
- Adjuster scope: can only view claims assigned to them (BR-CLM-ADJ-001)
- Worksheet approval requires `IsApproveReject` permission (BR-CLM-ADJ-002)
- Sensitive documents require `IsAccessSensitiveDoc` flag (BR-CLM-DOC-001)
- Disbursement requires a valid payee with banking details (BR-CLM-FIN-002)

**Key workflows:** FNOL registration, adjuster assignment, coverage impact recording, worksheet creation and approval, disbursement.

**Hangfire jobs owned:** T-08 (ClaimsDisbursementProcessor)

**Integrations used:** DisburseCloud (disbursement), Plumsail (claim letters), Azure Blob (claim documents)

---

### Domain 3: Billing and Payments (D3)

**Key entities:** `billing.policy_premium`, `billing.policy_payment_transaction`, `billing.payment_callback_responses`, `billing.payment_plan`, `billing.installment_schedule`, `billing.bank_detail` (AES-256 encrypted fields)

**Key business rules:**
- Payment via ACH or credit card (TranzPay hosted redirect only — ADR-006)
- Every transaction recorded (BR-BIL-PAY-002)
- Refund against original payment method (BR-BIL-PAY-003)
- Payment failure notification to policyholder + mortgagees (BR-BIL-PAY-004)
- Non-payment cancellation after 30 days (BR-BIL-NPC-001)
- `BypassRefundResponse` MUST be FALSE in production (NFR-009)
- ACH/routing numbers encrypted with AES-256 (RSK-1-SEC-007, ADR-010)

**Key workflows:** Payment initiation (TranzPay redirect), callback processing, refund, payment plan setup, auto-debit.

**Hangfire jobs owned:** T-06 (AutoCancellationProcessor), T-09 (AutoDebitProcessor), T-10 (FailedPaymentNotificationProcessor)

**Integrations used:** TranzPay (all payment operations + webhook), SMTP (failed payment email), LenderDock (failed payment mortgagee notification)

---

### Domain 4: Distribution (D4)

**Key entities:** `distribution.intermediary`, `distribution.producer`, `distribution.commission`, `distribution.disbursement`

**Key business rules:**
- Every policy must have an associated intermediary (BR-DIST-COM-004)
- Commission percentage tracked per intermediary (BR-DIST-COM-001)
- Commission recalculated on endorsements (BR-DIST-COM-002)
- Disbursement generates notification to intermediary (BR-DIST-COM-003)

**Hangfire jobs owned:** T-07 (CommissionDisbursementProcessor)

**Integrations used:** DisburseCloud (commission disbursement + webhook), Google Geocoding (intermediary address), SMTP (disbursement notification)

---

### Domain 5: Identity and Access (D5)

**Key entities:** `identity.app_user`, `identity.user_group`, `identity.user_group_member`, `identity.screen_permission`, `identity.client`, `identity.module`, `identity.app_screen`

**Key design decisions:**
- 5 roles: PlatformAdmin, ClientAdmin, IntermediaryProducer, Adjuster, User (Base)
- 10-flag per-screen permission model (see Section 6 below)
- Group-based inheritance: user effective permissions = union of all group flags
- AllAccess flag = all 10 permissions for that screen
- Synchronous Redis cache invalidation when user is removed from group (ADR-004, RSK-1-SEC-004)
- All users migrated with `requires_password_reset = TRUE` (no passwords migrated)

**Hangfire jobs:** None directly, but `AuditService` writes to `system.audit_log` on all domain events.

**Integrations:** SMTP (password reset, onboarding emails), Redis (permission cache)

---

### Domain 6: Document Management (D6)

**Key entities:** `policy.policy_document`, `claims.claim_document`, `system.document_type`

**Key design:**
- All document generation via Plumsail (INT-006): JSON payload → Plumsail template → document blob → Azure Blob
- Blob path convention: `{ClientCode}/{Module}/{RecordId}/{Filename}`
- SAS tokens for time-limited user downloads (not permanent URLs)
- Sensitive documents require `IsAccessSensitiveDoc` flag

**Integrations:** Plumsail (generation), Azure Blob (storage/retrieval)

---

### Domain 7: System Administration (D7)

**Key entities:** `system.tenant`, `system.product`, `system.insurance_product`, `system.configuration`, `system.timer_control`

**Key design:**
- Tenant provisioning: PlatformAdmin creates new `identity.client` records
- Product catalog: PlatformAdmin manages insurance products activated per tenant
- Timer kill switches: `Azure App Configuration` keys `timer:{JobId}:KillTimer` — real-time without deployment
- Feature flags: also in Azure App Configuration

---

## Section 4: Integration Guide

All 10 active integrations (plus 1 internal pattern). Full detail in ART-3-012 §6. All credentials in Azure Key Vault.

| INT ID | Integration | Direction | Pattern | Key Vault Secret Name | Known Risks |
|---|---|---|---|---|---|
| INT-001 | TranzPay Payment Gateway | Outbound + webhook | Typed `HttpClient` + Polly; ThirdParty hosted flow only | `TranzPay--BaseUrl`, `TranzPay--PostBackUrl` | GAP-2-INT-001: Production URL unconfirmed |
| INT-002 | LenderDock Mortgage Notification | Outbound | Typed `HttpClient`; Basic Auth; 10 notification types; retry table | `LenderDock--BaseUrl`, `LenderDock--Username`, `LenderDock--Password` | QST-1-INT-002: endpoint URL unconfirmed |
| INT-003 | Google Geocoding / Maps | Outbound | Typed `HttpClient`; Redis 30-day geocoding cache | `GoogleMaps--GeocodingApiKey`, `GoogleMaps--DisplayApiKey` | Keys must have origin restriction (NFR-020) |
| INT-004 | AES-256 Encryption | Internal | `AesEncryptionService`; AES-256-CBC + HMAC-256 | `Encryption--AesKey` | Key rotation requires data re-encryption (see ART-5-006 §5.2) |
| INT-005 | SMTP / Office365 Email | Outbound | `SmtpEmailClient`; smtp.office365.com:587/TLS; 17+ trigger points | `Smtp--Username`, `Smtp--Password`, `Smtp--FromAddress` | — |
| INT-006 | Plumsail Document Generator | Outbound | Typed `HttpClient`; JSON payload → blob | `Plumsail--ApiKey`, `Plumsail--BaseUrl` | QST-1-INT-003: API key unconfirmed |
| INT-007 | HexCat Risk Scoring | Outbound | Typed `HttpClient`; lat/lon in → risk data out; `HexCat_RiskInfo_Audit` table | `HexCat--ApiKey`, `HexCat--BaseUrl` | QST-1-INT-004: full API contract unknown |
| INT-008 | Azure Blob Storage | Bidirectional | `Azure.Storage.Blobs` SDK; Managed Identity; SAS tokens | (Managed Identity — no secret) | — |
| INT-009 | DisburseCloud Commission Disbursement | Outbound + webhook | Typed `HttpClient`; v1.2.1 REST; Bearer JWT (1-hour, Redis-cached) | `DisburseCloud--BaseUrl`, `DisburseCloud--ClientId`, `DisburseCloud--ClientSecret` | RSK-2-INT-004: old version vs v1.2.1 mismatch risk |
| INT-010 | Generic HTTP pattern | Internal | `IHttpClientFactory` + Polly (retry: 3 attempts exp backoff, circuit breaker: 5 failures/30s → open 60s) | N/A | All outbound clients inherit this pattern |
| INT-011 | RPS PostGIS Spatial Lookup | Outbound | Direct Npgsql raw SQL to `gis.rps_raster_5070` | `Rps--ConnectionString` | DBT-3-ARCH-001: raster transferability risk |

**Dead-letter table:** Critical notifications (LenderDock, SMTP) write to `billing.failed_notifications` on all-retries-exhausted. Operations should monitor this table weekly.

---

## Section 5: Permission Model

**Reference:** ART-1-003 §2, ART-2-005 §6.

InsureEdge uses a **10-flag per-screen, group-based permission model**.

### 5.1 The 10 Permission Flags

| Flag | Description |
|---|---|
| `IsViewPermission` | Can view/read the screen |
| `IsCreatePermission` | Can create new records |
| `IsEditPermission` | Can modify existing records |
| `IsApproveReject` | Can approve or reject (claims worksheets, etc.) |
| `IsDuplicatePermission` | Can duplicate records |
| `IsUploadPermission` | Can upload files |
| `IsDownloadPermission` | Can download files/documents |
| `IsViewSensitiveInfo` | Can unmask sensitive fields (ACH account numbers, etc.) |
| `IsAccessSensitiveDoc` | Can access sensitive documents |
| `AllAccess` | All 10 flags = TRUE for this screen (overrides individual flags) |

### 5.2 Group Inheritance

- A user's effective permissions = **logical OR** across all groups they belong to.
- If ANY group has `AllAccess = TRUE` for a screen, the user has full access to that screen.
- **Important:** `AllAccess` does NOT bypass tenant, intermediary, or adjuster scope filters.

### 5.3 Role Hierarchy

| Role | Tenant Scope | Additional Scope | MFA |
|---|---|---|---|
| PlatformAdmin | All tenants (bypass) | None — bypasses ALL screen permission checks (full access + full audit) | Required (TOTP) |
| ClientAdmin | Own ClientId only | None | Required (TOTP) |
| IntermediaryProducer | Own ClientId | + IntermediaryId filter on policies | No |
| Adjuster | Own ClientId | + AdjusterId filter on claims | No |
| User (Base) | Own ClientId | Per group permission flags | No |

### 5.4 ClientId Tenant Isolation (Critical)

Every EF Core `DbSet<T>` for tenant-scoped entities has a **global query filter** applied: `.HasQueryFilter(e => e.ClientId == _tenantContext.ClientId)`. This means:
- **You never need to manually add `WHERE ClientId = ?` in any LINQ query** — it is automatic.
- **Never call `IgnoreQueryFilters()` without an explicit technical justification and code review.**
- PlatformAdmin bypass: `TenantContext.IsPlatformAdmin = true` causes the filter to be `true` for all rows (no ClientId restriction), and ALL such operations are written to `system.audit_log` with `TargetClientId`.

### 5.5 Example: Checking Permissions in Code

```csharp
// In controller or application service:
_permissionEvaluationService.RequirePermission(ScreenCode.POLICY_BIND, PermissionFlag.IsCreatePermission);
// Throws PermissionDeniedException (→ HTTP 403) if the current user lacks the flag.
// PermissionEvaluationService checks Redis cache first, then falls back to DB.
```

---

## Section 6: Business Rules Reference

**All 9 confirmed timer thresholds (HIGH confidence, EV-0-0231):**

| Rule ID | Rule | Value |
|---|---|---|
| BR-POL-REN-001 | Renewal quote generated before expiry | 90 days |
| BR-POL-EXP-001 | Policy expires after ExpirationDate | 1 day after |
| BR-POL-CAN-001 / BR-BIL-NPC-001 | Cancellation after payment failure | 30 days |
| BR-POL-REN-004 | Non-renewed if no bound renewal | 90 days after expiry |
| BR-POL-NRN-001 | Non-renewal notice before expiry | 60 days |
| BR-POL-QE-001 | New business quote expiry | 90 days |
| BR-POL-QE-002 | Renewal quote expiry | 30 days |
| BR-POL-QE-003 | Endorsement quote expiry | 90 days |
| BR-POL-FEE-001 | Fixed policy fee | $195 |

**Password reset thresholds:**
- Token expiry: 30 minutes (BR-USR-PWD-001)
- Rate limit: max 2 tokens per 30-minute window per user (BR-USR-PWD-002)

**Financial safety controls:**
- `BypassRefundResponse` MUST be FALSE in production (NFR-009). Any TRUE value in production is a P0 incident.
- AES-256 encrypted fields (BankDetail): account number and routing number never returned in API responses without `ViewSensitiveInfo` permission.

**Policy lifecycle state machine:** Draft → Approved → Active → Cancelled / Lapsed / Expired / Non-Renewed. Allowed transitions are enforced in `PolicyBindingService` and background jobs. Direct status updates from outside application logic are not permitted.

---

## Section 7: Data Model Summary

**Source:** ART-1-001 (Data Catalogue), ART-3-013 (Data Migration Architecture)

### 7.1 Seven PostgreSQL Schemas

| Schema | Purpose | Approximate Table Count |
|---|---|---|
| `policy` | Policies, accounts, risk locations, coverages, documents | ~30 tables |
| `claims` | Claims, worksheets, disbursements, claim documents | ~20 tables |
| `billing` | Premiums, payment transactions, payment plans, bank details | ~10 tables |
| `distribution` | Intermediaries, producers, commissions | ~5 tables |
| `rating` | HBRater rate tables (5 tables), wildfire rating | ~5 tables |
| `identity` | Users, groups, permissions, clients, modules, screens | ~20 tables |
| `system` | Audit log, notifications, configuration | ~10 tables |
| `archive` | Legacy mapping tables (classification pending QST-3-MIG-005) | TBD |
| `gis` (separate DB) | RPS raster data (`rps_raster_5070`), PostGIS | 1 table + index |

### 7.2 Key Tables per Domain

**Policy domain:** `policy.policy` (core record), `policy.risk_location` (geocoordinates), `policy.policy_risk_information` (HexCat + RPS scores), `policy.policy_mortgage` (multiple per policy), `policy.writing_company` (typo corrected from `WrittingCompany`)

**Claims domain:** `claims.claim` → `claims.worksheet` → `claims.worksheet_payment` (FK chain enforced by target — missing in source). All three must maintain referential integrity.

**Billing domain:** `billing.policy_premium` is an **intermediate entity** (RSK-2-DATA-002). The chain is: `policy` → `billing.policy_premium` → `billing.policy_payment_transaction`. Do not link transactions directly to policies.

**Identity domain:** `identity.app_user` (all `password_hash` = NULL; `requires_password_reset` = TRUE after migration), `identity.screen_permission` (10-flag model per group per screen)

### 7.3 Notable Design Decisions

- **PolicyAccount M:N junction (RSK-2-DATA-001):** A policy may belong to multiple accounts. Use `policy.policy_account` junction table — do not assume 1:1 policy-to-account.
- **AccountBinary → Blob paths (RSK-2-DATA-005):** The polymorphic `AccountBinary` table from source is replaced by entity-specific `BlobPath` columns on each entity. Each entity type has its own Blob path.
- **Schema typos corrected (NFR-012):** `WrittingCompany` → `writing_company`, `ComissionPercentage` → `commission_percentage`, `OraganisationType` → `organisation_type`, `PoilcyId` → `policy_id`. All source code and EF Core configuration uses the corrected names.
- **Sentinel dates (NFR-011):** All `1900-01-01` values converted to NULL during migration. Do not insert `1900-01-01` as a "null" date — use PostgreSQL `NULL` directly.
- **HBRater tables:** Embedded in `rating` schema alongside operational data. `RatingEngineService` reads and caches in Redis. Do not modify rating tables without a formal rate change process.

---

## Section 8: Open Risks

All RSK- items from the DAQ Register that carry to the target system:

| Risk ID | Category | Statement | Mitigation Status |
|---|---|---|---|
| RSK-1-SEC-001 | Security | Default password `[REDACTED-BOOTSTRAP-CREDENTIAL]` in plaintext (source) | Resolved: PBKDF2 hashing, no password migrated, all users reset on first login |
| RSK-1-SEC-002 | Security | Onboarding token: existence-only validation (source) | Resolved: code match + expiry validation enforced |
| RSK-1-SEC-003 | Security | AllAccess group = single-point escalation | Resolved: AllAccess grant is audit-logged; scope filters still apply |
| RSK-1-SEC-004 | Security | Async privilege revocation race window (source) | Resolved: synchronous Redis cache invalidation within DB transaction |
| RSK-1-SEC-005 | Security | Sensitive field masking: display-layer only (source) | Resolved: `[SensitiveField]` attribute redacts at API serialization layer |
| RSK-1-SEC-007 | Security | AES key in OutSystems site property (source) | Resolved: AES-256 key in Azure Key Vault; Managed Identity only |
| RSK-1-SEC-008 | Security | `GetClientIdByUserId_CS` returns 0 for null (source) | Resolved: `ITenantContext` throws `TenantResolutionException` on null |
| RSK-2-DATA-001 | Data | PolicyAccount M:N assumption (one policy = one account) | Resolved: junction table in target |
| RSK-2-DATA-002 | Data | PolicyPremium intermediate entity missing in source model | Resolved: `billing.policy_premium` added as explicit entity |
| RSK-2-DATA-005 | Data | AccountBinary polymorphic FK | Resolved: entity-specific BlobPath columns |
| RSK-2-INT-004 | Integration | DisburseCloud old version vs v1.2.1 mismatch | Open: target implements v1.2.1; confirm with DisburseCloud that old endpoint is not required |
| DBT-3-ARCH-001 | Architecture | RPS raster file transferability unknown | Open: if raster not transferable to Azure, fallback to external RPS API required |
| GAP-2-INT-001 | Integration | TranzPay production URL unknown | Open: blocks production payment testing |

---

## Section 9: Decision History

All gate decisions made during the engagement (from DAQ-REGISTER):

| DEC ID | Phase | Decision | Date |
|---|---|---|---|
| DEC-0-0002 | DISCOVER | DISCOVER gate PASSED. MRS 61.4 → 70.5. | 2026-06-16 |
| DEC-0-0003 | DISCOVER | Runtime logs and environment configs out of scope. | 2026-06-16 |
| DEC-0-0004 | DISCOVER | Database files confirmed as SQL DDL scripts (SQL Server, 118 CREATE TABLE). | 2026-06-16 |
| DEC-1-0001 | SCAN | SCAN gate PASSED. MRS 79.2. | 2026-06-16 |
| DEC-1-0002 | SCAN | Site properties supplied — resolves LenderDock auth, Plumsail = IEDocumentGenerator, DisburseCloud URL, SMTP = Office365, Azure Blob confirmed, timer thresholds confirmed. | 2026-06-16 |
| DEC-2-0001 | HARVEST | SCAN gate APPROVED by human. Phase → HARVEST. | 2026-06-17 |
| DEC-2-0005 | HARVEST | PRD Gate APPROVED. TranzPay prod URL deferred. RPS = Azure-hosted. Performance SLA = 100 concurrent users. Azure confirmed as deployment platform. Phase → IDEATE. | 2026-06-17 |
| DEC-3-0001 | IDEATE | Technology stack confirmed: .NET/C#, React TypeScript, PostgreSQL Azure, GitHub Actions, Azure. | 2026-06-17 |
| DEC-3-0003 | IDEATE | Architecture Gate APPROVED. All 10 ADRs approved. Phase → FORGE. | 2026-06-17 |
| DEC-4-0001 | FORGE | FORGE complete. 10 ART- deliverables. 19 DBT- items (10 blocking). 27 HUMAN_VALIDATION_REQUIRED sections. Phase → TRANSFER. | 2026-06-17 |

---

## Section 10: Known Gaps

### 10.1 Blocking DBT-4-FORGE Items (10 open)

| DBT ID | Item | Action Required |
|---|---|---|
| DBT-4-FORGE-017 | Production Azure Key Vault URL | Provision production Azure environment; populate `KEY_VAULT_URL_PROD` in GitHub |
| DBT-4-FORGE-018 | OIDC Federated Credentials not configured | Create federated credentials per GitHub environment on Azure service principal |
| DBT-4-FORGE-019 | Static Web Apps resource name unknown | Resolve during infrastructure provisioning |
| GAP-2-INT-001 | TranzPay production URL | Contact TranzPay; load into Key Vault |
| QST-1-INT-004 | HexCat full API contract | Obtain from HexCat vendor |
| QST-1-INT-002 | LenderDock endpoint URL + payload schemas | Obtain from LenderDock |
| QST-1-INT-003 | Plumsail API key | Obtain from Plumsail; load into Key Vault |
| QST-3-MIG-001 | Downtime tolerance | Customer must confirm acceptable maintenance window |
| DBT-4-FORGE-016 | BankDetail AES re-encryption | Engineer must implement `CanDecryptMigratedValue()` for migration transition |
| DBT-4-FORGE-013 | User2 vs Users table ambiguity | Confirm authoritative identity table name in source |

### 10.2 Test Gaps (14 explicit gaps)

**Reference:** ART-4-010 test coverage matrix GAP section. 14 tests could not be written due to unknown integration contracts or unconfirmed business rules. These gaps are concentrated in:
- TranzPay refund flow (GAP-2-INT-001/002)
- HexCat edge cases (QST-1-INT-004)
- LenderDock notification payloads (QST-1-INT-002)
- Plumsail document generation (QST-1-INT-003)
- DisburseCloud old vs v1.2.1 webhook (QST-2-INT-003)

Engineering team must write and execute these tests after the relevant contracts/keys are confirmed.

### 10.3 Provisional Tests (33 tests)

33 tests in the test coverage matrix are marked PROVISIONAL (blocked on 5 QST- IDs above). These tests have been written with stub assumptions — they must be reviewed and finalized once the integration contracts are confirmed. See ART-4-010 for the full list with QST- citations.

---

## Section 11: Developer Onboarding

### 11.1 Repository Structure (Reference: ART-4-001)

```
insure-edge/
  src/
    InsureEdge.API/                   ← Entry point: controllers, middleware, program.cs
    InsureEdge.Domain/                ← Domain entities, domain services, interfaces
    InsureEdge.Application/           ← Application services, MediatR commands/queries
    InsureEdge.Infrastructure/        ← EF Core DbContext, repositories, migrations
    InsureEdge.Integrations/          ← All external HTTP clients (TranzPay, LenderDock, etc.)
    InsureEdge.BackgroundJobs/        ← Hangfire job implementations (11 jobs)
    InsureEdge.Shared/                ← Cross-cutting: permissions, audit, encryption, tenant
  frontend/                           ← React 18 / TypeScript / Vite SPA
    src/
      domains/                        ← One folder per domain (7 domains)
      shared/                         ← Shared components, hooks, API client
  tests/
    InsureEdge.UnitTests/
    InsureEdge.IntegrationTests/      ← Uses Testcontainers (PostgreSQL + Redis containers)
    InsureEdge.SmokeTests/            ← Lightweight — used in CI pre-deploy check
  migrations/
    tools/
      BlobExtractor/                  ← .NET Worker Service for binary extraction
  infrastructure/
    terraform/
      environments/{dev,uat,prod}/    ← Per-environment Terraform configs
  .github/
    workflows/                        ← 5 GitHub Actions workflows
```

### 11.2 Naming Conventions

- **Backend:** Controllers: `{Domain}Controller` (e.g., `PolicyController`). Application services: `{Entity}Service`. Domain services: `{Domain}DomainService`. Repositories: `{Entity}Repository`. Commands: `{Action}{Entity}Command`. Queries: `Get{Entity}Query`.
- **Frontend:** Components: PascalCase (`PolicyList.tsx`). Hooks: `use{Domain}{Action}` (`usePolicyBind`). API client: auto-generated from OpenAPI spec.
- **Database:** snake_case for all table and column names. Schema prefix: `{domain}.{table_name}` (e.g., `policy.policy`, `identity.app_user`).
- **Environment variables:** Never use directly — always via Key Vault reference or Azure App Configuration.

### 11.3 Branch Strategy

```
feature/{ticket-id}-{description} → develop (PR, 1 approval)
develop → release/v{X.Y} (auto-deploys to staging/UAT)
release/v{X.Y} → main (2 approvals: project lead + Damco)
hotfix/{description} → main + back-merge to develop
```

### 11.4 How to Run Locally

1. Clone repository.
2. Install: .NET 8 SDK, Node 20, Docker Desktop.
3. Start local dependencies: `docker-compose up` (PostgreSQL 16 + Redis 7 containers).
4. Configure user secrets: `dotnet user-secrets set "Db:ConnectionString" "Host=localhost;Database=insure_edge;..."` (do not use appsettings for secrets).
5. Run migrations: `dotnet ef database update --project src/InsureEdge.Infrastructure --startup-project src/InsureEdge.API`.
6. Start API: `dotnet run --project src/InsureEdge.API`.
7. Start frontend: `cd frontend && npm install && npm run dev`.
8. Integration stubs are mocked for local development (TranzPay, HexCat, etc. — see test project configuration).

### 11.5 How to Deploy

- **Dev:** Merge to `develop` — `deploy-dev.yml` runs automatically.
- **Staging/UAT:** Create `release/v{X.Y}` branch — `deploy-staging.yml` runs automatically.
- **Production:** Merge release branch to `main` — `deploy-prod.yml` requires 2 reviewers.
- **Database migrations:** Always run `db-migrate.yml` manually (separate from application deployment) before `deploy-prod.yml` for production.

---

*End of ART-5-007 — Knowledge Transfer Package | INSUREEDGE-2026 | TRANSFER Phase | 2026-06-17*
*Status: AI_GENERATED. Covers 7 domains, 10 ADRs, 11 integrations, permission model, 9 confirmed business rule thresholds, data model, 10 open blocking items, 33 provisional tests, 14 test gaps, and developer onboarding guidance.*
