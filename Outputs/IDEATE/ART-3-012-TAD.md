# ART-3-012 — Technical Architecture Document (TAD)
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Architecture Agent
**Phase:** IDEATE
**Date:** 2026-06-17
**Version:** 1.0 — ARCHITECTURE GATE CANDIDATE
**Engagement:** INSUREEDGE-2026 | Customer: Hudson Bailey | Writing Company: Sierra Specialty Insurance Company

> ## ARCHITECTURE GATE STATUS: OPEN
>
> **This document is the primary gate deliverable for the IDEATE → FORGE phase transition.**
> No agent may self-approve this gate. The Chief Orchestrator must present this document to the human for an explicit decision.
>
> **Required action:** Human must provide one of:
> - **APPROVE** — Architecture Gate PASSED; FORGE phase may begin
> - **REJECT** — FORGE is blocked; specify which decisions to revisit
> - **CONDITIONS** — Gate passes subject to listed conditions being met before FORGE start

---

## Table of Contents

1. Architecture Overview
2. Technology Stack
3. Architecture Decision Records — Summary
4. Container Diagram
5. Domain Service Map
6. Integration Architecture
7. Security Architecture Summary
8. Data Architecture Summary
9. Infrastructure Architecture Summary
10. Observability Summary
11. CI/CD Summary
12. Architecture Gate Checklist
13. Open Items for FORGE

---

## 1. Architecture Overview

InsureEdge is being modernized from an OutSystems O11 multi-module platform to a cloud-native, API-first insurance management system on the Azure stack confirmed in DEC-3-0001. The target architecture is a **Modular Monolith** — a single ASP.NET Core Web API application composed of 7 domain modules, served to a React SPA, backed by Azure Database for PostgreSQL Flexible Server, and deployed on Azure App Service with a full Azure services complement.

### Core Architectural Principles

1. **API-first:** All business logic exposed through versioned REST endpoints. No server-side rendering. React SPA is a pure API consumer.
2. **Tenant-first:** Every data operation is scoped to `ClientId`. EF Core global query filters enforce this at the ORM layer. Tenant resolution in middleware, not in application code.
3. **Security-by-design:** 10 security risks from ART-1-003 are addressed by architecture, not by operational procedure. Permission enforcement at API serialization. Credentials in Key Vault. PCI scope minimized to SAQ A.
4. **Evidence-grounded:** Every ADR traces to ≥1 PRD requirement. No design decision without a cited justification.
5. **Forge-ready:** All 11 timer jobs named and mapped to Hangfire. All 10 integrations mapped to target implementation. All schema typos corrected in EF Core configuration. Architecture Gate provides FORGE with a complete, decided blueprint.

### Scale Context

- **100 concurrent users** — sizing confirmed in engagement preconditions
- **118+ tables** migrated to single PostgreSQL database (two schemas)
- **65 user-facing screens** across 7 domains
- **11 background jobs** replicated with Hangfire
- **10 external integrations** mapped to target clients
- **5 roles** with group-based 10-flag per-screen permission model
- **Multi-tenant:** Row-level ClientId isolation; EF Core global query filters

---

## 2. Technology Stack

**Reference:** DEC-3-0001 (confirmed at PRD Gate 2026-06-17)

| Layer | Technology | Version | Role |
|---|---|---|---|
| Frontend framework | React | 18 | SPA — all 65 screens |
| Frontend language | TypeScript | 5.x (strict) | Type safety |
| Frontend build | Vite | 5 | Static build → Azure Static Web Apps |
| Frontend routing | React Router | v6 | Client-side routing, route guards |
| Frontend server state | TanStack Query (React Query) | v5 | API data, caching, background sync |
| Frontend client state | Zustand | 4.x | Auth, permissions, UI state |
| Frontend forms | React Hook Form + Zod | v7 + v3 | Multi-step wizards, validation |
| Frontend components | shadcn/ui + Tailwind CSS | latest | Accessible, owned component library |
| Backend framework | ASP.NET Core Web API | .NET 8 | All domain services + controllers |
| Backend language | C# | 12 | — |
| ORM | EF Core 8 + Npgsql | 8.x | Standard CRUD, migrations |
| Raw SQL | Dapper | 2.x | Performance-critical queries (RPS, rating) |
| Background jobs | Hangfire | 1.8.x (PostgreSQL storage) | All 11 timer jobs |
| Caching client | StackExchange.Redis | 2.7.x | Permission cache, rate tables |
| HTTP clients | HttpClientFactory + Polly | — | Retry, circuit breaker |
| Validation | FluentValidation | 11.x | Request DTO validation |
| Logging | Serilog + Application Insights sink | — | Structured logging |
| Testing (backend) | xUnit + Moq + Testcontainers | — | Unit + integration tests |
| Testing (frontend) | Vitest + RTL + Playwright | — | Unit + E2E |
| Database | PostgreSQL | 16 | Azure Database for PostgreSQL Flexible Server |
| Geospatial | PostGIS | 3.4 | RPS raster queries (same Flexible Server) |
| Cache | Azure Cache for Redis | Standard C1 (Prod) | Permission maps, rate tables, geocoding |
| Object storage | Azure Blob Storage | — | Policy/claim documents, uploads |
| Secret management | Azure Key Vault | — | All credentials, encryption key, JWT signing key |
| Runtime config | Azure App Configuration | — | Timer enable/disable, thresholds, feature flags |
| Observability | Azure Application Insights | — | Logs, metrics, tracing, availability |
| Compute | Azure App Service | Linux P2v3 (Prod) | Modular monolith API host |
| CDN / WAF | Azure Application Gateway + WAF v2 | — | L7 routing, OWASP 3.2 rules |
| Frontend hosting | Azure Static Web Apps | — | React SPA hosting + CDN |
| CI/CD | GitHub Actions | — | Build, test, migrate, deploy per environment |
| Source control | GitHub | — | Branching strategy: GitFlow simplified |

---

## 3. Architecture Decision Records — Summary Table

Full ADRs: `ART-3-002-ADRs.md`

| ADR ID | Title | Decision | Status |
|--------|-------|----------|--------|
| ADR-001 | Application Deployment Architecture | **Modular Monolith** (single ASP.NET Core app, 7 domain modules) | PROPOSED |
| ADR-002 | Database Engine | **PostgreSQL** (single DB, two schemas; EF Core + Dapper hybrid; typo corrections) | PROPOSED |
| ADR-003 | Multi-Tenancy Pattern | **Row-level ClientId** (EF Core global filters; tenant middleware; PlatformAdmin bypass with audit) | PROPOSED |
| ADR-004 | Authentication & Authorization | **ASP.NET Core Identity + JWT** (PBKDF2 hashing; refresh tokens; TOTP MFA; sync privilege revocation) | PROPOSED |
| ADR-005 | RPS/PostGIS Integration | **Migrate raster to Azure Flexible Server** (PostGIS extension; separate `gis` DB on same server) | PROPOSED |
| ADR-006 | TranzPay Integration Pattern | **Hosted redirect only** (ThirdParty flow; PCI SAQ A; base URL in Key Vault; BypassRefundResponse gate) | PROPOSED |
| ADR-007 | Frontend Architecture | **React SPA** (Vite; React Query + Zustand; React Hook Form + Zod; shadcn/ui) | PROPOSED |
| ADR-008 | API Routing | **Direct ASP.NET Core** (no API gateway; Azure Application Gateway + WAF) | PROPOSED |
| ADR-009 | Async Processing | **Hangfire** (PostgreSQL storage; all 11 jobs registered; kill switch per job; thresholds in App Configuration) | PROPOSED |
| ADR-010 | Secret Management | **Azure Key Vault** (Managed Identity; per-environment vaults; all 14 secrets catalogued) | PROPOSED |

---

## 4. Container Diagram

Full C4 diagrams: `ART-3-003-C4-diagrams.md`

**Summary of deployable containers:**

| Container | Technology | Hosting | Purpose |
|---|---|---|---|
| React SPA | React 18 / TypeScript / Vite | Azure Static Web Apps | All 65 user-facing screens |
| ASP.NET Core Web API | .NET 8 / Modular Monolith | Azure App Service Linux P2v3 | All business logic, domain services, repositories |
| PostgreSQL (operational) | PostgreSQL 16 | Azure Flexible Server (public schema) | 92+ operational tables: policies, claims, billing, users |
| PostgreSQL (system) | PostgreSQL 16 | Azure Flexible Server (system schema) | 26+ system tables: tenants, config, users, permissions |
| PostgreSQL (GIS) | PostgreSQL 16 + PostGIS 3.4 | Azure Flexible Server (gis database) | RPS 26 GB raster dataset |
| Redis Cache | Redis 7 | Azure Cache for Redis Standard C1 | Permissions, rate tables, geocoding cache |
| Azure Blob Storage | Azure Blob | Existing account | Policy/claim/report binary documents |
| Azure Key Vault | — | Per-environment vault | 14 named secrets: credentials, keys |
| Azure App Configuration | — | Shared per environment | Timer flags, thresholds, feature flags |
| Azure Application Insights | — | Log Analytics workspace | Structured logs, metrics, availability |
| Azure Application Gateway + WAF | WAF v2 | Dedicated subnet | WAF, SSL termination, L7 routing |

---

## 5. Domain Service Map

| Domain | Application Services | Key External Integrations |
|---|---|---|
| D1 Policy Lifecycle | QuoteService, PolicyBindingService, EndorsementService, RenewalService, CancellationService, BulkUploadService, RatingEngineService | HexCat (risk scoring), Google Geocoding (address resolution), TranzPay (payment), LenderDock (lienholder notification), Plumsail (document generation), Azure Blob (document storage) |
| D2 Claims Management | FnolService, ClaimWorkflowService, WorksheetService, DisbursementService, CatastropheService | DisburseCloud (claims disbursement), Plumsail (claim letters), Azure Blob (claim documents), Email (disbursement notification) |
| D3 Billing & Payments | PremiumPaymentService, PaymentPlanService, RefundService, FailedPaymentService | TranzPay (all payment operations + webhook), Email (failed payment notification), LenderDock (failed payment notification) |
| D4 Distribution | IntermediaryService, ProducerService, CommissionService, DisburseCloudService | DisburseCloud (commission disbursement + webhook), Google Geocoding (intermediary address), Email (disbursement notification) |
| D5 Identity & Access | UserService, GroupService, PermissionService, AuthenticationService, AuditService | Email (password reset, onboarding), Redis (permission cache) |
| D6 Document Management | DocumentGenerationService, DocumentStorageService, DocumentAccessService | Plumsail (generation), Azure Blob (storage/retrieval), RPS PostGIS (N/A — storage only) |
| D7 System Administration | TenantProvisioningService, ProductCatalogService, ConfigurationService, TimerControlService | Azure App Configuration (threshold/flag management), Hangfire (timer control) |

**Shared Infrastructure Services (cross-domain):**
`TenantContext`, `PermissionEvaluationService`, `EncryptionService (AES-256)`, `AuditService`, `EmailService`, `GeocodingService`, `RpsService`, `AzureBlobStorageService`

---

## 6. Integration Architecture

Full integration detail: `ART-2-012-integration-architecture-supplement.md`

| INT ID | Integration | Direction | Target Pattern | Status | Risk |
|--------|-------------|-----------|----------------|--------|------|
| INT-001 | TranzPay Payment Gateway | Outbound + webhook callback | Typed `HttpClient` (Polly retry/circuit-breaker); `ThirdParty` hosted flow ONLY; base URL in Key Vault | CONTRACT RESOLVED (EV-0-0232) | GAP-2-INT-001: Production URL unknown — FORGE BLOCKER |
| INT-002 | LenderDock Mortgage Notification | Outbound | Typed `HttpClient` (Basic Auth); 10 notification types; `NotifyLenderdock` retry table | Partial — endpoint URL unknown (QST-1-INT-002) | QST-1-INT-002 open |
| INT-003 | Google Geocoding / Maps | Outbound | Typed `HttpClient`; two separate API keys; geocoding results cached in Redis 30 days | API keys confirmed (EV-0-0231) | NFR-020: key origin restriction required |
| INT-004 | AES-256 Encryption | Internal | Native .NET `AesEncryptionService` (AES-256-CBC + HMAC-256 Encrypt-then-MAC); key in Key Vault | Algorithm confirmed | Key migration from site property to Key Vault required before FORGE |
| INT-005 | SMTP / Office365 Email | Outbound | `SmtpEmailClient` via Serilog sink pattern; 17+ trigger points; template-based | Server/port confirmed (EV-0-0231) | Production credentials needed |
| INT-006 | Plumsail Document Generator | Outbound | Typed `HttpClient`; JSON payload → document blob → store in Azure Blob | Endpoint confirmed (EV-0-0231) | API key not in site properties — QST-1-INT-003 |
| INT-007 | HexCat Risk Scoring | Outbound | Typed `HttpClient`; lat/lon in → risk data + acceptance status out; `HexCat_RiskInfo_Audit` table | Function confirmed (EV-0-0006) | Full API contract unknown — QST-1-INT-004 BLOCKING |
| INT-008 | Azure Blob Storage | Bidirectional | `Azure.Storage.Blobs` SDK; Managed Identity; SAS tokens for time-limited downloads; path convention `ClientCode/Module/RecordId/Filename` | Contract confirmed (EV-0-0238) | Must migrate to Managed Identity from connection string |
| INT-009 | DisburseCloud Commission Disbursement | Outbound + webhook | Typed `HttpClient`; v1.2.1 REST; Bearer JWT with 1-hour expiry (cached in Redis); webhook receiver endpoint | v1.2.1 contract resolved (EV-0-0236) | RSK-2-INT-004: current integration likely on old version; full reimplementation required |
| INT-010 | Generic HTTP Client (architectural pattern) | Internal | `IHttpClientFactory` + Polly (retry, circuit-breaker) applied to ALL outbound HTTP clients | Pattern confirmed | Not an external integration — internal architectural pattern |
| INT-011 | RPS PostGIS Spatial Lookup | Outbound | Direct Npgsql raw SQL to `gis.rps_raster_5070`; RPS dataset migrated to Azure Flexible Server (ADR-005) | Architecture decided | DBT-3-ARCH-001: FORK if raster not transferable |

**DisburseCloud URL mismatch risk (FND-2-INT-001):** The existing `DisbursementBaseURL` site property (`/Vendors/RegisterVendor`) does not match any endpoint in the v1.2.1 API. The target system will implement the full v1.2.1 REST contract (not reverse-engineer the old endpoint). This is flagged as a configuration risk — confirmed in ART-2-012. Must be reviewed with the customer before DisburseCloud FORGE work begins.

**Integration Resilience Pattern (all INT-001 through INT-011):**
- Retry: 3 attempts, exponential backoff (1s, 2s, 4s), jitter
- Circuit breaker: 5 failures / 30 seconds → open 60 seconds
- Dead-letter: critical notifications (LenderDock, Email) write to `FailedNotification` table on all-retries-exhausted
- Idempotency: webhook receivers keyed on provider-supplied correlation ID before processing

---

## 7. Security Architecture Summary

**Reference:** ART-1-003 (Security & Roles Catalogue). Full security architecture: ART-3-001 (Security Agent deliverable — running in parallel).

### 7.1 Security Risk Resolution

All 10 source security risks from ART-1-003 §7 are addressed by architecture:

| Risk ID | Severity | Source Finding | Architectural Resolution |
|---------|----------|---------------|-------------------------|
| RSK-1-SEC-001 | CRITICAL | Default password `[REDACTED-BOOTSTRAP-CREDENTIAL]` in plaintext | PBKDF2 hashing via ASP.NET Core Identity; default bootstrap credential eliminated; no plaintext password column in target |
| RSK-1-SEC-002 | HIGH | Onboarding token: existence-only validation | Code match + expiry validation enforced on ALL token flows; no existence-only path |
| RSK-1-SEC-003 | HIGH | AllAccess group = single-point escalation | AllAccess grant in JWT audit-logged; `AllAccess` does not bypass tenant/intermediary/adjuster scope filters |
| RSK-1-SEC-004 | HIGH | Async privilege revocation race window | Synchronous Redis cache invalidation within DB transaction before group removal commits |
| RSK-1-SEC-005 | HIGH | Sensitive field masking: display-layer only | `[SensitiveField]` attribute on entity properties → custom JSON converter redacts at API serialization layer |
| RSK-1-SEC-006 | MEDIUM | No MFA | TOTP MFA required for PlatformAdmin and ClientAdmin at login (ASP.NET Core Identity TOTP) |
| RSK-1-SEC-007 | MEDIUM | AES key in OutSystems site property | AES-256 key in Azure Key Vault; Managed Identity access only |
| RSK-1-SEC-008 | MEDIUM | `GetClientIdByUserId_CS` returns 0 for null | `ITenantContext` throws `TenantResolutionException` on null UserId — never returns 0 |
| RSK-1-SEC-009 | MEDIUM | No audit log for PlatformAdmin cross-tenant | `AuditLog.TargetClientId` field; all PlatformAdmin unscoped operations audit-logged |
| RSK-1-SEC-010 | LOW | Google Maps key exposed client-side | Both geocoding API keys in Key Vault; server-side geocoding proxy; map display key origin-restricted in Google Console (NFR-020) |

### 7.2 PCI Scope

- **Scope:** SAQ A (hosted payment redirect only)
- **Direct card charge (`AddCustomerCCCharge`) is PROHIBITED** by ADR-006
- InsureEdge servers never receive raw PAN
- ACH account/routing numbers encrypted at rest (AES-256) and never returned in API responses without `ViewSensitiveInfo` permission

### 7.3 5 Roles

| Role | Auth Scope | Multi-Tenant Access | MFA Required |
|------|-----------|--------------------|----|
| PlatformAdmin | System-wide (all tenants) | Yes — with full audit | Yes (TOTP) |
| ClientAdmin | Single tenant | No — own ClientId only | Yes (TOTP) |
| IntermediaryProducer | Tenant + IntermediaryId | No | No |
| Adjuster | Tenant + AdjusterId | No | No |
| User (Base) | Per-group permissions | No | No |

---

## 8. Data Architecture Summary

**Reference:** ART-1-001 (Data Catalogue), ART-2-012 §5 (ERD Delta). Full migration: ART-3-013 (Migration Agent deliverable).

### 8.1 Migration Approach

- **Source:** SQL Server 2019 — 2 databases (InsureEdge_DEV: 92+ tables; InsureEdge_System_DEV: 26+ tables)
- **Target:** PostgreSQL 16 — single database, two schemas (`public` for operational, `system` for tenant/config)
- **Two-DB coupling resolution (FND-1-DATA-001):** Schema separation within one PostgreSQL instance eliminates runtime string-resolved cross-DB joins
- **Migration tool:** EF Core code-first migrations for schema; custom data migration scripts (Dapper) for bulk data transformation

### 8.2 Data Quality Corrections Applied at Migration

| Correction | NFR | Scope |
|---|---|---|
| Schema typos corrected (WrittingCompany, ComissionPercentage, OraganisationType, PoilcyId) | NFR-012 | 4 columns; all code references updated |
| Sentinel date `1900-01-01` → NULL | NFR-011 | All date columns with sentinel evidence |
| FK constraints added (Claim→Policy, Worksheet→Claim) | NFR-010 | 2 critical missing FKs |
| Orphan record analysis (Claim→Policy, Worksheet→Claim) | NFR-010 | Pre-migration data quality check |
| `PolicyAccount` M:N junction table | RSK-2-DATA-001 | Replaces simple FK assumption |
| `PolicyPremium` intermediate entity | RSK-2-DATA-002 | Payment chain corrected |
| `AccountBinary` polymorphic FK → entity-specific Blob paths | RSK-2-DATA-005 | Cleaner normalized design |
| Password field: plaintext → PBKDF2 hash | NFR-003 | All user records |

### 8.3 HBRater Rate Tables

The 5 HBRater rate tables (`HBRater_LRHexzones`, `HBRater_HRHexzone`, `HBRater_StateTaxSheet`, `HBRater_ExcessFloodCoverage`, `Rating_Wildfire`) are embedded in the operational database (FND-2-INT-004). They migrate to the `public` schema in PostgreSQL alongside all other operational tables. The `RatingEngineService` reads them via EF Core (cached in Redis — see ART-3-005 §8.2).

### 8.4 RPS Schema Extension

`PolicyRiskInformation` requires a new `rps_value` column (decimal, nullable) per ASM-2-ARCH-005. EF Core migration adds this column. NULL indicates the value has not been retrieved (existing records) or the location is out of coverage.

---

## 9. Infrastructure Architecture Summary

Full detail: `ART-3-009-infrastructure-architecture.md`

```
Internet Users
      │
      ▼
Azure Application Gateway (WAF v2, OWASP 3.2)
      │
      ├── /                    → Azure Static Web Apps (React SPA)
      └── /api/*               → Azure App Service Linux P2v3 (ASP.NET Core API)
                                      │
               ┌───────────────────────┼─────────────────────┐
               ▼                       ▼                     ▼
  Azure PostgreSQL          Azure Cache for Redis     Azure Blob Storage
  Flexible Server           Standard C1               (GRS)
  (D4s_v3, Zone HA)         (permissions, caches)     (documents)
  ├── public schema
  ├── system schema
  └── gis (PostGIS + RPS)
               │
               ▼
      Azure Key Vault          Azure App Configuration
      (all secrets)            (flags, thresholds)
               │
               ▼
      Azure Application Insights
      (logs, metrics, tracing)
```

All components within a single Azure VNet. PostgreSQL, Redis, Key Vault, and Blob Storage accessed via private endpoints — no public internet exposure for data plane.

---

## 10. Observability Summary

Full detail: `ART-3-010-observability.md`

- **Logging:** Serilog → Application Insights. Structured logs with `ClientId`, `UserId`, `CorrelationId` enrichment.
- **Audit trail:** Immutable `AuditLog` table (INSERT-only). PlatformAdmin cross-tenant access tagged with `TargetClientId`. MediatR pipeline behavior for automatic audit event capture.
- **Health checks:** `/health` (liveness), `/health/ready` (readiness with dependency checks), `/health/detail` (ops-only)
- **Hangfire dashboard:** `/hangfire` (PlatformAdmin only) — job history, failed jobs, retry queue
- **Alerting:** Azure Monitor alerts for error rate, latency, availability, payment integration failure, timer job failure, low-funds (DisburseCloud)
- **Custom metrics:** 14 business and integration metrics in Application Insights

---

## 11. CI/CD Summary

Full detail: `ART-3-011-cicd.md`

- **Branching:** GitFlow simplified — `main` / `develop` / `feature/*` / `release/*` / `hotfix/*`
- **Pipelines:** 5 GitHub Actions workflows — CI (PR), Dev, QA, UAT, Prod
- **Promotion gates:** Dev (automatic) → QA (automatic on release branch) → UAT (manual 1-approval) → Prod (manual 2-approval + BypassRefundResponse gate + DB backup verification)
- **Database migrations:** EF Core code-first, applied in pipeline BEFORE deployment; forward-only in production
- **Zero-downtime deployment:** Azure App Service staging slot + slot swap
- **Secret injection:** Azure Key Vault via Managed Identity (runtime); GitHub OIDC federated identity (pipeline — no static secrets)

---

## 12. Architecture Gate Checklist

The following checklist is used to determine whether the Architecture Gate should be APPROVED, REJECTED, or APPROVED WITH CONDITIONS.

| # | Criterion | Status | Notes |
|---|---|---|---|
| **Completeness** | | | |
| C-01 | All 10 ADRs produced with context, decision, rationale, consequences, and PRD trace | PASS | ART-3-002 |
| C-02 | C4 L1, L2, L3 diagrams produced | PASS | ART-3-003 |
| C-03 | Frontend architecture defined for all 7 domains | PASS | ART-3-004 |
| C-04 | Backend architecture defined: solution structure, services, repositories, middleware | PASS | ART-3-005 |
| C-05 | Infrastructure architecture defined: all Azure services justified | PASS | ART-3-009 |
| C-06 | Observability architecture defined: logging, audit, health, alerting | PASS | ART-3-010 |
| C-07 | CI/CD architecture defined: pipeline, branch strategy, secrets, gates | PASS | ART-3-011 |
| C-08 | All 11 timer jobs named and mapped to Hangfire jobs | PASS | ART-3-005 §5 |
| C-09 | All 10 integrations mapped to target implementation pattern | PASS | §6 above |
| **Security** | | | |
| S-01 | All 10 source security risks architecturally resolved | PASS | §7.1 |
| S-02 | TranzPay direct card charge prohibited; PCI scope minimized | PASS | ADR-006 |
| S-03 | BypassRefundResponse deployment gate defined | PASS | ART-3-011 §2.5 |
| S-04 | All credentials in Key Vault with Managed Identity | PASS | ADR-010 |
| S-05 | AES-256 encryption service designed with Encrypt-then-MAC | PASS | ART-3-005 §7 |
| S-06 | Sensitive field redaction at API serialization layer | PASS | ART-3-005 §6.3 |
| S-07 | Synchronous privilege revocation within DB transaction | PASS | ADR-004, ART-3-005 §8.3 |
| **NFR Coverage** | | | |
| N-01 | NFR-001 (tenant isolation) — EF Core global filters + tenant middleware | PASS | ADR-003 |
| N-02 | NFR-002 (10-flag permission model) — PermissionEvaluationService + attribute | PASS | ART-3-005 §6 |
| N-03 | NFR-003 (password hashing PBKDF2) | PASS | ADR-004 |
| N-04 | NFR-004 (token validation: code match + expiry) | PASS | ADR-004 |
| N-05 | NFR-005 (sensitive field redaction at API layer) | PASS | ART-3-005 §6.3 |
| N-06 | NFR-006 (synchronous privilege revocation) | PASS | ADR-004, ART-3-005 §8.3 |
| N-07 | NFR-007 (AES-256 key in Key Vault) | PASS | ADR-010, ART-3-005 §7 |
| N-08 | NFR-008 (immutable audit trail with PlatformAdmin cross-tenant) | PASS | ART-3-010 §2 |
| N-09 | NFR-009 (BypassRefundResponse = false in non-dev) | PASS | ADR-006, ART-3-011 §2.5 |
| N-10 | NFR-010 (FK constraints for Claim→Policy, Worksheet→Claim) | PASS | ADR-002 |
| N-11 | NFR-011 (sentinel date → null migration) | PASS | ADR-002, §8 |
| N-12 | NFR-012 (schema typo corrections) | PASS | ADR-002, §8 |
| N-13 | NFR-014 (all integration credentials in Key Vault) | PASS | ADR-010 |
| N-14 | NFR-015 (all 11 background jobs replicated with kill switch) | PASS | ART-3-005 §5 |
| N-15 | NFR-016 (performance SLA) | PROVISIONAL | QST-2-PM-NFR-001 still open; architecture sized for 100 users per confirmed scale |
| N-16 | NFR-017 (availability SLA, RTO, RPO) | PROVISIONAL | QST-2-PM-NFR-002 still open; Zone-HA PostgreSQL + Standard C1 Redis designed in |
| N-17 | NFR-018 (scalability) | PROVISIONAL | QST-2-PM-NFR-003 still open; modular monolith + auto-scale designed for growth |
| N-18 | NFR-019 (structured logging, health checks, integration metrics) | PASS | ART-3-010 |
| N-19 | NFR-020 (geocoding key origin restriction) | PASS (deployment item) | ART-3-009 §1.7, deployment checklist |
| **Governance** | | | |
| G-01 | Every ADR traces to ≥1 PRD requirement | PASS | ART-3-002 |
| G-02 | All assumptions marked ASM-3-ARCH-{seq} | PASS | 6 assumptions recorded |
| G-03 | No implementation code in IDEATE deliverables | PASS | Design-only throughout |
| G-04 | Architecture Gate not self-approved | PASS | This document awaits human decision |
| G-05 | DBT- items raised for unresolved decisions | PASS | 3 DBT items raised |
| **Unresolved Blockers** | | | |
| B-01 | TranzPay production URL (GAP-2-INT-001) | OPEN — FORGE BLOCKER | Cannot complete payment module in FORGE without this |
| B-02 | HexCat API contract (QST-1-INT-004) | OPEN — FORGE BLOCKER | Cannot implement risk scoring without contract |
| B-03 | LenderDock endpoint URL (QST-1-INT-002) | OPEN — FORGE BLOCKER | Cannot implement mortgage notification without endpoint |
| B-04 | RPS infrastructure ownership (QST-2-INT-011-001) | OPEN — ARCHITECTURE RISK | Determines if ADR-005 Option 2 or fallback (DBT-3-ARCH-001) applies |
| B-05 | Plumsail API key (QST-1-INT-003) | OPEN — FORGE BLOCKER | Cannot authenticate to Plumsail without API key |

---

## 13. Open Items for FORGE

The following items are unresolved at Architecture Gate and must be addressed before or during FORGE:

### 13.1 Blocking for FORGE Start (All Resolved Before FORGE)

| Item | ID | Owner | Action Required |
|------|-----|-------|----------------|
| TranzPay production URL | GAP-2-INT-001 | Customer / TranzPay | Obtain production base URL; load into `insuredge-kv-uat` and `insuredge-kv-prod` |
| HexCat full API contract | QST-1-INT-004 | Customer / HexCat vendor | Obtain API documentation: endpoint, auth method, request/response schema, rate limits |
| LenderDock endpoint URL and payload schema | QST-1-INT-002 | Customer / LenderDock | Obtain base URL and 10 notification event payload schemas |
| Plumsail API key | QST-1-INT-003 | Customer / Plumsail | Obtain API key for target environment; load into Key Vault |

### 13.2 Resolved During FORGE (Not Blocking Start)

| Item | ID | FORGE Impact |
|------|-----|-------------|
| TranzPay refund API contract | GAP-2-INT-002 | Refund service implementation may need adjustment |
| DisburseCloud old vs v1.2.1 confirmation | QST-2-INT-003 | Commission disbursement service must implement v1.2.1 (not old version) |
| `DisbursementEncryptionKey` purpose | QST-2-INT-004 | May affect DisburseCloud request signing |
| RPS infrastructure ownership | QST-2-INT-011-001 | Determines ADR-005 final path; affects FORGE infrastructure tasks |
| RPS live vs under development | QST-2-INT-011-002 | Determines if RPS stub or full implementation for FORGE |
| `PaymentCallbackResponses` table existence | QST-2-INT-007 | Schema migration must include this table if not yet created in source |
| Session timeout requirements | QST-2-PM-SEC-001 | Refresh token TTL in ADR-004 |
| Performance SLA targets | QST-2-PM-NFR-001 | Alert threshold configuration in ART-3-010 |

### 13.3 Assumptions to Verify in FORGE

| ASM ID | Statement | Verification Method |
|--------|-----------|---------------------|
| ASM-3-ARCH-001 | 100 concurrent users is the confirmed peak | Confirm with customer |
| ASM-3-ARCH-002 | No stored procedures in either SQL Server DB | Full DDL review by Migration Agent |
| ASM-3-ARCH-003 | Session/refresh token lifetime = 8 hours | Confirm with customer (QST-2-PM-SEC-001) |
| ASM-3-ARCH-004 | P2v3 App Service sufficient for 100-user load | Load test in UAT |
| ASM-3-ARCH-005 | D4s_v3 PostgreSQL handles RPS spatial queries | Performance test after raster load |
| ASM-3-ARCH-006 | Zone-HA PostgreSQL meets availability requirements | Confirm when NFR-017 resolved |
| ASM-2-ARCH-001 (inherited) | TranzPay refund uses same endpoint as charge | Confirm with TranzPay |
| ASM-2-ARCH-002 (inherited) | DisburseCloud secret key maps to API key | Confirm with DisburseCloud |
| ASM-2-ARCH-005 (inherited) | `PolicyRiskInformation` needs `RpsValue` column | Schema extension required — Migration Agent to add |

---

## Architecture Gate Decision

> **This section is for the human reviewer to complete.**
>
> | Gate Decision | [ ] APPROVE | [ ] REJECT | [ ] CONDITIONS |
> |---|---|---|---|
> | **Decision date:** | | | |
> | **Decision maker:** | | | |
> | **Notes / Conditions:** | | | |
>
> If APPROVE: FORGE phase may begin. Migration Agent (ART-3-013) may proceed in parallel.
> If REJECT: Specify which ADRs require revision.
> If CONDITIONS: List conditions; gate is contingent on conditions being met and acknowledged by Architecture Agent before FORGE start.

---

*End of ART-3-012 — Technical Architecture Document | INSUREEDGE-2026 | IDEATE Phase | 2026-06-17*
*Architecture Agent deliverables complete. 7 ART- files produced. 10 ADRs. 3 DBT- items raised. 5 FORGE-blocking open items documented. Gate awaits human decision.*
