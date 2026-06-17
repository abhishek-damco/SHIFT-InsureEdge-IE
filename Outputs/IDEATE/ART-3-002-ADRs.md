# ART-3-002 — Architecture Decision Records (ADRs)
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Architecture Agent
**Phase:** IDEATE
**Date:** 2026-06-17
**Version:** 1.0 — GATE CANDIDATE
**Engagement:** INSUREEDGE-2026 | Customer: Hudson Bailey | Writing Company: Sierra Specialty Insurance Company

> **ARCHITECTURE GATE STATUS: OPEN — Awaiting Human APPROVE / REJECT / CONDITIONS**
> No agent may self-approve this gate. The Chief Orchestrator must present this document to the human for an explicit decision before FORGE begins.

---

## ADR Summary Table

| ADR ID | Title | Status | Primary PRD Ref |
|--------|-------|--------|----------------|
| ADR-001 | Application Deployment Architecture — Modular Monolith | PROPOSED | NFR-018, FR-D1-001 |
| ADR-002 | Database Engine — PostgreSQL Migration from SQL Server | PROPOSED | NFR-010, NFR-011, NFR-012 |
| ADR-003 | Multi-Tenancy Pattern — Row-Level with ClientId Middleware | PROPOSED | NFR-001, NFR-018 |
| ADR-004 | Authentication & Authorization — ASP.NET Core Identity + JWT | PROPOSED | NFR-002, NFR-003, NFR-004, FR-D5-003 |
| ADR-005 | RPS/PostGIS Integration — Native PostgreSQL Extension on Azure | PROPOSED | FR-D1-003, REQ-2-RPS-001 |
| ADR-006 | TranzPay Integration — Hosted Redirect Only, PCI Scope Reduction | PROPOSED | FR-D3-001, NFR-009 |
| ADR-007 | Frontend Architecture — React SPA with React Query + Zustand | PROPOSED | NFR-002, FR-D1-001 through FR-D7-003 |
| ADR-008 | API Routing — Direct ASP.NET Core Routing, No API Gateway at Launch | PROPOSED | NFR-016, NFR-019 |
| ADR-009 | Async Processing — .NET Worker Services + Hangfire | PROPOSED | NFR-015, FR-D1-015, FR-D3-004 |
| ADR-010 | Secret Management — Azure Key Vault for All Secrets | PROPOSED | NFR-007, NFR-014 |

---

## ADR-001: Application Deployment Architecture — Modular Monolith

**Status:** PROPOSED

**Context:**
InsureEdge supports 100 concurrent users across 7 functional domains with 27 capability clusters, 2,049 application functions, and 11 background jobs. The source system is a multi-module OutSystems O11 monolith with clear domain boundaries: Policy, Claims, Billing, Distribution, Identity & Access, Documents, System Administration. PRD Gate passed with MRS 85.5. Technology stack confirmed as .NET/C# + React + PostgreSQL + Azure.

Three deployment architecture options exist: (1) Full microservices — each domain as an independently deployed service; (2) Modular monolith — single deployed application with strong internal module boundaries; (3) Big-ball-of-mud monolith — no internal structure.

**Decision:**
Adopt a **Modular Monolith** architecture. The solution is deployed as a single ASP.NET Core Web API application composed of 7 domain modules plus a shared infrastructure layer. Each module owns its own controllers, services, repositories, and internal models. Cross-module communication occurs through well-defined internal interfaces, not HTTP calls. The single application is deployed to Azure App Service.

**Rationale:**
- **Scale does not justify microservices complexity:** 100 concurrent users is well within the capacity of a single well-optimized ASP.NET Core instance. Microservices would add distributed systems overhead (service discovery, inter-service auth, distributed tracing, eventual consistency) with no scale benefit at this user count.
- **Domain boundaries are clear from the OutSystems module structure:** The BL/CS two-layer domain pattern (ART-2-012 §4) maps directly to modular monolith modules. The domain separation is already encoded in the source architecture.
- **Operational simplicity:** Insurance platforms operated by small teams benefit from a single deployment artifact, single database connection pool, and unified observability rather than 7+ independently deployed services.
- **Preserves modularity for future extraction:** If scale demands microservice extraction in the future (e.g., Claims or Policy grows independently), the module boundaries enable that extraction without a redesign. Clean internal interfaces now prevent the big-ball-of-mud outcome.
- **Team size:** A single development team working on a single codebase benefits from shared compilation, unified integration testing, and simpler CI/CD.

**Alternatives Considered:**
- **Full microservices:** Rejected. Over-engineering for 100 users. Introduces distributed transaction complexity for policy binding (which spans Policy, Billing, Documents, LenderDock in a single workflow). 
- **Feature-Sliced Architecture (no module boundaries):** Rejected. Would replicate the OutSystems coupling problem in .NET.

**Consequences:**
- Positive: Simpler deployment, debugging, and transaction management. Single database connection pool. Unified structured logging.
- Positive: All 27 domain capabilities testable in a single integration test harness.
- Negative: All modules scale together — if one domain needs 10× more compute than another, the entire application must be scaled. Acceptable at 100-user scale.
- Negative: A defect in one module can theoretically crash the shared process. Mitigated by domain-level exception handling and circuit-breaker patterns on external calls.
- Risk: Module coupling must be enforced by code review and architecture fitness functions (no cross-module direct repository access — only service interfaces).

**Assumption:** ASM-3-ARCH-001 — 100 concurrent users is the confirmed peak load ceiling for IDEATE architecture sizing. If this grows significantly (>500 concurrent), architecture should be re-evaluated. (NFR-016, QST-2-PM-NFR-001 still blocking for precise SLA targets.)

**PRD Requirement Ref:** NFR-018 (scalability), FR-D1-001 through FR-D7-003 (all functional domains), DEC-3-0001 (stack confirmation)

---

## ADR-002: Database Engine — PostgreSQL Migration from SQL Server

**Status:** PROPOSED

**Context:**
The source system uses SQL Server 2019 across two databases: InsureEdge_DEV (92+ tables) and InsureEdge_System_DEV (26+ tables). The confirmed target database is Azure Database for PostgreSQL Flexible Server (DEC-3-0001). The migration must preserve all business logic encoded in SQL while correcting four schema typos (NFR-012) and eliminating sentinel date values (NFR-011). The two-database coupling (FND-1-DATA-001) means cross-database joins exist in the source that must be resolved in the target.

Key SQL Server → PostgreSQL compatibility considerations:
- `UNIQUEIDENTIFIER` → `uuid` (built-in)
- `NVARCHAR(MAX)` → `text`
- `DATETIME` → `timestamptz` (with timezone awareness)
- `BIT` → `boolean`
- `IDENTITY(1,1)` → `SERIAL` or `GENERATED ALWAYS AS IDENTITY`
- `NOLOCK` hints → eliminated (PostgreSQL MVCC makes them unnecessary)
- Cross-database `USE` / three-part name references → eliminated by consolidating into a single PostgreSQL database with schema separation

**Decision:**
Migrate to a **single PostgreSQL database** with **two schemas** (`public` for operational entities, `system` for tenant/configuration entities — mirroring the two SQL Server databases). Use EF Core 8 with PostgreSQL provider (Npgsql) as the ORM. PostGIS extension enabled on the same Azure Database for PostgreSQL Flexible Server instance to support the RPS geospatial lookup (see ADR-005).

**Rationale:**
- **Single database consolidates the two-DB coupling:** The InsureEdge_ext / InsureedgeSYS_ext runtime string-resolution pattern (FND-1-DATA-001) is eliminated. Schema separation (`public` / `system`) preserves the logical boundary without cross-database SQL.
- **EF Core with Npgsql:** Provides strongly-typed entities, migration tooling, and LINQ queries. Supports PostgreSQL-specific types (uuid, jsonb, arrays). Code-first migrations enable the pipeline-integrated migration strategy (ART-3-011).
- **PostGIS on the same server:** Azure Database for PostgreSQL Flexible Server supports the PostGIS extension natively. This allows RPS spatial queries to run against the same server as operational data, eliminating a separate infrastructure dependency (see ADR-005).
- **Azure Database for PostgreSQL Flexible Server:** Zone-redundant HA, automated backups, point-in-time restore, built-in connection pooling (PgBouncer), and PostGIS support — all required by the NFRs.

**Schema typo corrections (NFR-012):**
| Source Typo | Corrected Name | Affected Tables |
|---|---|---|
| `WrittingCompany` | `WritingCompany` | Policy, WritingCompany |
| `ComissionPercentage` | `CommissionPercentage` | PolicyCommission |
| `OraganisationType` | `OrganisationType` | AdditionalOrganisation |
| `PoilcyId` | `PolicyId` | Any column with this typo |

**Alternatives Considered:**
- **Keep SQL Server (Azure SQL):** Rejected per DEC-3-0001 stack confirmation. PostgreSQL is the customer-confirmed target.
- **Two separate PostgreSQL databases:** Rejected. Replicates the two-DB coupling problem. Schema separation within one database solves the logical boundary without distributed joins.
- **Dapper over EF Core:** Considered (see also ADR discussion in ART-3-005). EF Core chosen for migration management and type safety; Dapper used for performance-critical raw SQL (rate table reads, RPS queries).

**Consequences:**
- Positive: PostGIS available on the same server — resolves RPS coupling (ADR-005).
- Positive: Four schema typos corrected before any code is written.
- Positive: Sentinel date (1900-01-01) → null conversion is an EF Core migration step, applied programmatically.
- Positive: DB FK constraints added for Claim→Policy and Worksheet→Claim (NFR-010) — enforced by PostgreSQL not application code.
- Negative: SQL Server-specific T-SQL syntax in stored procedures (if any) must be rewritten.
- Negative: `DATETIME` timezone handling requires care — all timestamps stored as `timestamptz` (UTC), converted to display timezone in application.
- Risk: Cross-database runtime SQL joins (FND-1-DATA-001) must all be identified and refactored before migration. This is an explicit migration agent task.

**ASM-3-ARCH-002:** The two SQL Server databases contain no stored procedures critical to business logic; all business rules are in the OutSystems application layer. Confidence: HIGH (no stored procs identified in DDL evidence). If stored procs are found during FORGE, rewrite in C# service methods.

**PRD Requirement Ref:** NFR-010 (referential integrity), NFR-011 (sentinel dates), NFR-012 (typo correction), DEC-3-0001 (PostgreSQL confirmed)

---

## ADR-003: Multi-Tenancy Pattern — Row-Level with ClientId Middleware

**Status:** PROPOSED

**Context:**
InsureEdge is a multi-tenant SaaS platform. All tenant-owned entities carry a `ClientId` column (FND-1-DATA-001, ART-1-001). The confirmed pattern from the source system is row-level isolation: every query for non-PlatformAdmin users includes `WHERE ClientId = @ClientId`. Three multi-tenancy patterns exist: (1) Separate database per tenant; (2) Schema-per-tenant; (3) Row-level with shared schema.

NFR-001 mandates zero cross-tenant data leakage. RSK-1-SEC-008 identifies the risk of `ClientId = 0` leakage when the tenant resolution function returns 0 for null UserId.

**Decision:**
**Row-level isolation with ClientId** is the confirmed pattern (per engagement preconditions). Implementation:
1. **Tenant resolution middleware:** Resolves `ClientId` from the authenticated JWT claims at request entry. Raises a 401 if `ClientId` cannot be resolved. Never returns 0 — throws an exception for null/unauthenticated callers (fixes RSK-1-SEC-008).
2. **ITenantContext service:** Injected into all domain services and repositories. Carries `ClientId`, `UserId`, `Role`, and scope identifiers (`IntermediaryId`, `AdjusterId` where applicable).
3. **EF Core global query filters:** Applied at DbContext level for all tenant-scoped entities — `modelBuilder.Entity<T>().HasQueryFilter(e => e.ClientId == _tenantContext.ClientId)`. Filters cannot be bypassed by accident.
4. **PlatformAdmin bypass:** `ITenantContext` exposes `IsPlatformAdmin` — global query filters are disabled for PlatformAdmin role. All PlatformAdmin cross-tenant access is audit-logged (NFR-008).
5. **Adjuster and Intermediary scope filters:** Applied in domain service layer (not EF Core global filters) as they are secondary scope dimensions, not primary tenant isolation.

**Rationale:**
- Row-level is the source-confirmed pattern. Schema-per-tenant would require 118+ schema clones and adds significant provisioning complexity with no benefit at current tenant count.
- EF Core global query filters enforce tenant scoping at the data access layer — not just at the controller layer. This is the most robust defense against accidental cross-tenant data exposure.
- Centralizing tenant resolution in middleware ensures consistent enforcement. There is no per-controller tenant injection that could be forgotten.
- PlatformAdmin bypass via explicit flag is safer than conditional filter removal — the flag must be explicitly set, not simply absent.

**Alternatives Considered:**
- **Schema-per-tenant:** Rejected. 118+ tables × N tenants = multiplicative schema complexity. Provisioning a new tenant requires schema creation, migration application, and connection string management. Row-level is simpler and scales to dozens of tenants.
- **Separate database per tenant:** Rejected. Incompatible with a single-application modular monolith. Would require per-tenant DbContext factories and per-tenant connection strings managed at runtime.

**Consequences:**
- Positive: New tenant provisioning is a single `INSERT INTO Client` — no schema changes, no infrastructure changes.
- Positive: EF Core global filters provide a safety net that survives developer error.
- Negative: All tenant-scoped queries carry a `WHERE ClientId = @ClientId` predicate — PostgreSQL index design must include `ClientId` as a leading key on high-volume tables (Policy, Claim, PolicyPaymentTransaction).
- Risk: PlatformAdmin actions that bypass tenant filters must always write to AuditLog with explicit `TargetClientId` — must be enforced in code review.

**PRD Requirement Ref:** NFR-001 (tenant isolation), NFR-008 (audit), FR-D7-001 (tenant provisioning), RSK-1-SEC-008 (ClientId=0 leak)

---

## ADR-004: Authentication & Authorization — ASP.NET Core Identity + JWT

**Status:** PROPOSED

**Context:**
The source system uses OutSystems session-based authentication. The target is an API-first ASP.NET Core backend serving a React SPA. Authentication options are: (1) ASP.NET Core Identity with JWT; (2) External Identity Provider (Azure AD B2C, Auth0, Okta); (3) Custom authentication.

Requirements: email-as-login-identifier (FR-D5-001), system-generated user codes format IE00XX (FR-D5-003), bcrypt/PBKDF2 password hashing (NFR-003), 30-min standard / 24-hr onboarding token expiry (NFR-004), 2-token rate limit (FR-D5-008), synchronous privilege revocation (NFR-006), group-based 10-flag permission model (NFR-002), MFA for PlatformAdmin and ClientAdmin (NFR-013).

**Decision:**
Use **ASP.NET Core Identity** with **JWT Bearer tokens** (access token + refresh token pattern). No external IdP at launch. MFA implemented via ASP.NET Core Identity's built-in TOTP support (RFC 6238).

- **Identity store:** Custom `ApplicationUser` extending `IdentityUser`, stored in PostgreSQL. The `UserCode` (IE00XX format) is a separate column on the user entity, generated on creation.
- **JWT access tokens:** Short-lived (15 minutes). Claims include: `UserId`, `ClientId`, `Role`, `IntermediaryId` (if applicable), `AdjusterId` (if applicable), `IsPlatformAdmin`.
- **Refresh tokens:** Long-lived (8 hours — ASM-3-ARCH-003 pending QST-2-PM-SEC-001 session timeout). Stored in database with rotation-on-use pattern. Single-use; old token invalidated on refresh.
- **Permission evaluation:** NOT stored in JWT (too large — 10 flags × 65+ screens). Computed at request time from `ScreenPermissions` table (served via Redis-cached permission lookup — see ART-3-005).
- **Password hashing:** PBKDF2 via ASP.NET Core Identity's default `PasswordHasher<T>` (SHA-512, 600,000 iterations per NIST SP 800-63B). Eliminates source system's proprietary `EncryptPassword` and the default `[REDACTED-BOOTSTRAP-CREDENTIAL]` credential (NFR-003, RSK-1-SEC-001).
- **Password reset tokens:** Generated via `UserManager.GeneratePasswordResetTokenAsync`. Validated by code match + expiry (NFR-004, RSK-1-SEC-002). Rate-limited: max 2 valid tokens per user per 30-minute window enforced in the reset service.
- **Onboarding tokens:** Same validation path as standard reset — existence + code + expiry. Eliminates the existence-only bypass (RSK-1-SEC-002).
- **MFA:** TOTP (Google Authenticator compatible) for PlatformAdmin and ClientAdmin roles. Enforced at login for those roles — cannot be bypassed (NFR-013).
- **Privilege revocation:** On group membership removal, the permission cache for the affected user is invalidated synchronously within the same database transaction (NFR-006, RSK-1-SEC-004).

**Rationale:**
- ASP.NET Core Identity is the natural fit for the confirmed .NET stack. It provides password hashing, token management, TOTP MFA, and lockout policies out of the box.
- JWT with refresh tokens is the standard pattern for React SPAs. Avoids server-side session state (enables horizontal scale if needed).
- No external IdP at launch: the InsureEdge user model (group-based permissions, tenant scoping, IE00XX user codes) is custom enough that mapping it to an external IdP claims model would add complexity without benefit at this scale. Azure AD B2C remains an option for a future phase if SSO integration is required.

**Alternatives Considered:**
- **Azure AD B2C:** Rejected for launch. Custom permission model (10-flag, group-based) does not map cleanly to Azure AD roles/claims. Would require complex custom claims transformation. Re-evaluate if enterprise SSO is requested in a future phase.
- **Cookie-based session (replicating OutSystems pattern):** Rejected. Incompatible with API-first architecture and React SPA. JWT is the standard for SPA + API patterns.
- **Custom auth without ASP.NET Core Identity:** Rejected. Identity provides battle-tested password hashing, token generation, and lockout policies. Custom reimplementation introduces risk.

**Consequences:**
- Positive: Eliminates all 10 source security risks related to authentication (RSK-1-SEC-001, RSK-1-SEC-002, RSK-1-SEC-003, RSK-1-SEC-004, RSK-1-SEC-006).
- Positive: JWT claims carry tenant context — no database round-trip on every request for tenant resolution.
- Negative: JWT token revocation requires a short access token lifetime (15 min) and a refresh token rotation mechanism. This adds client-side token management complexity.
- Risk: Permission cache invalidation must be synchronous and reliable. If Redis is unavailable, fall back to direct DB query (never fail open). ASM-3-ARCH-003.

**ASM-3-ARCH-003:** Session timeout requirement is 8 hours (refresh token lifetime) pending QST-2-PM-SEC-001 confirmation.

**PRD Requirement Ref:** NFR-002, NFR-003, NFR-004, NFR-006, NFR-013, FR-D5-001, FR-D5-003, FR-D5-007, FR-D5-008, RSK-1-SEC-001, RSK-1-SEC-002

---

## ADR-005: RPS/PostGIS Integration — Native PostgreSQL Extension on Azure

**Status:** PROPOSED

**Context:**
The RPS (Risk to Potential Structures) integration is a direct PostgreSQL/PostGIS database query against a 26 GB GeoTIFF raster dataset hosted on Damco's internal network (FND-2-INT-003, ART-2-012 §3). The source integration uses OutSystems Integration Studio's direct DB connection pattern — not a REST API. The target must preserve this geospatial lookup capability.

Three options for target architecture:
1. **Keep the Damco-internal PostgreSQL/PostGIS server:** The target ASP.NET Core application makes a direct PostgreSQL connection to the existing RPS server. No data migration of the 26 GB raster.
2. **Migrate raster to Azure Database for PostgreSQL Flexible Server:** Load the GeoTIFF into the same Flexible Server instance as the operational database, using PostGIS extension. Single database server for all data.
3. **Wrap in a REST microservice:** Deploy a thin REST API on top of the existing PostgreSQL/PostGIS server.

**Critical fact:** Azure Database for PostgreSQL Flexible Server supports the PostGIS extension natively. This resolves the coupling issue by enabling Option 2.

**Decision:**
**Migrate the RPS raster dataset to Azure Database for PostgreSQL Flexible Server** as a separate PostGIS-enabled database (`gis`) on the same Flexible Server instance as the operational InsureEdge database. The ASP.NET Core application queries the RPS raster via Npgsql with raw SQL (not EF Core — PostGIS spatial types require either NetTopologySuite or raw SQL). Add `RpsValue` column to `PolicyRiskInformation` (as per ASM-2-ARCH-005).

Implementation:
- PostGIS extension enabled on the Flexible Server: `CREATE EXTENSION postgis;`
- `gis` database created on the same server
- `public.rps_raster_5070` table loaded via `raster2pgsql` tool from the GeoTIFF source
- SRID corrected to EPSG 5070 (NAD83/Conus Albers)
- GiST spatial index (`rast_gist`) recreated
- Application uses a dedicated `IRpsRepository` that executes the `ST_Value` / `ST_Transform` / `ST_Intersects` query via Npgsql raw SQL
- Null result (out of coverage) returns a specific `RpsResult.OutOfCoverage` value — never silently returns zero

**Rationale:**
- **PostGIS on Azure Flexible Server is confirmed supported.** This removes the need to maintain a separate on-premises Damco server for production operation.
- **Single server, multiple databases:** The operational and GIS databases share the same Flexible Server instance, reducing infrastructure cost and networking complexity. Private endpoint protects both.
- **Eliminates Damco-network dependency:** The source architecture requires network access from the application server to Damco's internal PostgreSQL instance. Moving the raster to Azure removes this dependency, which is critical for a production Azure deployment.
- **Performance acceptable:** Spatial query latency is 2–10 ms per the TID (EV-0-0237). Single-point lookup per policy intake event — not a bulk operation. Azure Flexible Server with 32 GB RAM tier meets the TID's hardware recommendation.
- **26 GB raster migration is a one-time operation:** Plan as a migration artifact alongside application data migration.

**Open Question:** QST-2-INT-011-001 (who hosts the RPS server) and QST-2-INT-011-002 (is RPS live in production?) are still open. **If RPS is confirmed as Damco-internal infrastructure not transferable to the client**, Option 3 (REST microservice wrapper) becomes the fallback. This ADR assumes Option 2 is viable — must be confirmed before FORGE.

**DBT-3-ARCH-001:** If QST-2-INT-011-001 is answered as "RPS is Damco-internal and not transferable," the RPS architecture decision must be revisited. Fallback is a REST endpoint exposed by Damco's PostGIS server, consumed by InsureEdge via HTTP.

**Alternatives Considered:**
- **Keep Damco-internal server (Option 1):** Rejected for production. Creates a runtime dependency on Damco's internal network from an Azure-hosted application. Unsuitable for a client-owned production deployment.
- **REST microservice wrapper (Option 3):** Retained as fallback (DBT-3-ARCH-001). Adds network hop but avoids raster migration if ownership is unclear.
- **Replace RPS with a third-party geospatial API:** Not in scope. The RPS dataset is a specific USDA licensed dataset with a specific scoring model. It cannot be substituted without a business decision.

**Consequences:**
- Positive: No Damco-network dependency in production. Self-contained Azure architecture.
- Positive: PostGIS queries run within the same VNet as the application — minimal latency.
- Negative: 26 GB raster transfer must be planned as a discrete migration task. One-time cost.
- Negative: `raster2pgsql` load process must be re-executed and spatial indexes re-created. Documented in migration runbook.
- Risk: QST-2-INT-011-001 and QST-2-INT-011-002 must be resolved before FORGE. If RPS is not live in production, the schema extension for `RpsValue` is still required but the query infrastructure can be implemented as a stub.

**PRD Requirement Ref:** FR-D1-003 (risk assessment service), REQ-2-RPS-001, REQ-2-RPS-002, REQ-2-RPS-003 (ART-2-012 §3)

---

## ADR-006: TranzPay Integration Pattern — Hosted Redirect Only, PCI Scope Reduction

**Status:** PROPOSED

**Context:**
TranzPay supports two card payment flows: (1) `ThirdParty` (hosted payment redirect) — user is redirected to TranzPay's hosted page, card data never touches InsureEdge servers; (2) `AddCustomerCCCharge` — raw PAN (card number, CVV) transmitted directly through InsureEdge servers (RSK-2-INT-002). ACH debit uses `AddCustomerACHDebit` with account/routing numbers.

PCI-DSS scope: if InsureEdge servers process, store, or transmit raw card data, SAQ D compliance applies (most complex/expensive). Using hosted redirect (`ThirdParty`) reduces scope to SAQ A (least complex).

**Critical gaps (GAP-2-INT-001, GAP-2-INT-002):** Production TranzPay URL not documented. Refund API contract not in TID.

The `BypassRefundResponse_ToBeFalseInPROD` flag is currently `TRUE` in DEV, bypassing real gateway responses (NFR-009, CRITICAL).

**Decision:**
1. **Use ONLY the `ThirdParty` hosted redirect flow for all card payments.** Direct card charge (`AddCustomerCCCharge`) is PROHIBITED in target system for PCI scope reasons.
2. **ACH debit** (`AddCustomerACHDebit`) continues as the second payment method — ACH data (account/routing numbers) is already encrypted via INT-004 and stored in `BankDetail` with AES-256 encryption.
3. **All TranzPay credentials** (`UserName`, `Password`, `ProducerID`) stored in Azure Key Vault — never in application configuration files or source code.
4. **Base URL is a Key Vault secret:** `TranzPay:BaseUrl` stored in Key Vault, not in `appsettings.json`. Sandbox (`demo.tranzpay.com`) and production URLs are environment-specific Key Vault values. This resolves GAP-2-INT-001 — when the production URL is obtained, it is inserted into the production Key Vault without code deployment.
5. **Callback endpoint (PostBackUrl):** A dedicated webhook controller (`/api/webhooks/tranzpay/callback`) validates the incoming payload, persists to `PaymentCallbackResponses` audit table, then processes the status update. Idempotent — duplicate callbacks are detected by `ThirdPartyCallID`.
6. **`BypassRefundResponse` equivalent flag:** Controlled by an environment-specific feature flag stored in Azure App Configuration (not Key Vault). Must be `false` in QA, UAT, and Prod. Deployment checklist item (NFR-009).
7. **Refund operations:** Implemented per ASM-2-ARCH-001 pattern (same endpoint, `ApiName` = `ACHRefund` / `CreditCardRefund`). Final contract confirmed with TranzPay before FORGE (GAP-2-INT-002).
8. **Vault tokenization (`AddVault: "Y"`):** Enabled for all hosted redirect flows. `CustomerID` (vault key) stored against policyholder record for recurring payments.

**Rationale:**
- Hosted redirect eliminates raw PAN from InsureEdge servers, reducing PCI scope from SAQ D to SAQ A. This is a material compliance and cost reduction.
- Key Vault secret for base URL is the correct pattern for any URL that differs between environments (sandbox vs production) — the same pattern used for all integration credentials (NFR-014).
- Vault tokenization enables recurring installment payments (FR-D3-004) without requiring policyholders to re-enter card data — the source system already uses this (`AddVault: "Y"` confirmed in EV-0-0232).

**DBT-3-ARCH-002:** Refund operations (`ACHRefund`, `CreditCardRefund`) API contract must be confirmed with TranzPay before FORGE. If the contract differs materially from ASM-2-ARCH-001, the refund service must be redesigned.

**Alternatives Considered:**
- **Allow `AddCustomerCCCharge` for edge cases:** Rejected. Any use of direct card charge places InsureEdge servers in PCI scope for raw cardholder data. The risk is disproportionate to any convenience benefit.
- **Stripe or Braintree substitution:** Out of scope. TranzPay is the customer-confirmed payment gateway. Substitution requires a business decision.

**Consequences:**
- Positive: InsureEdge servers never receive raw card numbers. PCI scope minimized.
- Positive: Production URL swap (sandbox → production) requires only a Key Vault secret update — no code deployment.
- Positive: `BypassRefundResponse` risk eliminated by environment-specific flag defaulting to `false`.
- Negative: Hosted redirect introduces a browser redirect in the payment flow — requires the React frontend to handle redirect and callback polling or redirect return.
- Negative: Production URL is a FORGE blocker (GAP-2-INT-001 — TranzPay must supply this before FORGE delivery of the payment module).

**PRD Requirement Ref:** FR-D3-001 (premium payment collection), FR-D3-005 (refunds), NFR-009 (bypass flag), NFR-014 (credential externalization), RSK-2-INT-001, RSK-2-INT-002

---

## ADR-007: Frontend Architecture — React SPA with React Query + Zustand

**Status:** PROPOSED

**Context:**
The confirmed frontend technology is React (TypeScript) (DEC-3-0001). The application has approximately 65 user-facing screens across 7 domains, heavy form usage, complex permission enforcement (10 flags per screen), multi-step wizards (policy quote), and role-based navigation. Options include: (1) Pure SPA with client-side routing; (2) SSR (Next.js); (3) Hybrid (Next.js with selective SSR).

For state management: Redux, Zustand, React Query, or combinations thereof.

**Decision:**
**Pure React SPA** (Vite build tool, React 18, TypeScript strict mode) with:
- **React Router v6** for client-side routing with route guards
- **React Query (TanStack Query v5)** for all server-state (API data fetching, caching, invalidation)
- **Zustand** for client-side UI state (navigation, modals, permission context, tenant context)
- **React Hook Form** with Zod validation for all form screens
- **shadcn/ui** (Tailwind CSS-based) as the component library
- **Permission context:** A `PermissionProvider` wraps the authenticated app, loading the current user's permissions at login. Individual components use `usePermission(screenCode, flagName)` hook.

**Rationale:**
- **SSR rejected:** InsureEdge is a B2B line-of-business application, not a public-facing marketing site. SEO is not a requirement. SSR (Next.js) adds deployment complexity (Node.js server required) with no benefit for an authenticated business application.
- **React Query for server state:** The application is data-heavy (policy lists, claims grids, billing history). React Query provides caching, background refresh, optimistic updates, and automatic cache invalidation — all needed for real-time policy/claims data. Eliminates manual `useEffect` data-fetching.
- **Zustand for client state:** Lighter than Redux. The application needs to share: (a) current user/tenant context, (b) permission map, (c) UI navigation state. Zustand handles this with minimal boilerplate. Redux would be over-engineered for this scope.
- **React Hook Form + Zod:** The policy quote wizard, claims FNOL, and billing forms are heavily validated multi-step forms. React Hook Form is the industry standard for complex React forms — performant (uncontrolled components), type-safe with Zod schema validation.
- **shadcn/ui:** Accessible, Tailwind-based, unstyled-by-default component library that can be themed to match InsureEdge's existing visual identity. No vendor lock-in — components are copied into the project and owned.

**Alternatives Considered:**
- **Redux Toolkit:** Rejected. React Query already handles the majority of state (server data). Adding Redux for the small remaining client-side state creates unnecessary boilerplate.
- **Next.js SSR:** Rejected. No SEO requirement. Adds server infrastructure complexity. The SPA deployment to Azure Static Web Apps is simpler.
- **Formik instead of React Hook Form:** Rejected. React Hook Form is more performant for large forms (uncontrolled inputs). Industry preference has shifted decisively to RHF.
- **Material UI (MUI):** Considered. shadcn/ui preferred because it avoids the MUI theming system's complexity and produces smaller bundle sizes with Tailwind purging.

**Consequences:**
- Positive: Vite build produces a static artifact deployable to Azure Static Web Apps — no server infrastructure for the frontend.
- Positive: React Query cache eliminates redundant API calls as users navigate between screens.
- Positive: Zod validation schemas are shared between frontend and can inform OpenAPI schema validation in the backend.
- Negative: Permission map loaded at login (all screens for the user's groups) — this could be a large payload for users in many groups. Must be evaluated against the 65-screen × 10-flag × N-groups cardinality. Cached in Zustand store after load.
- Negative: No SSR means the initial HTML is a blank shell — acceptable for a B2B authenticated application where SEO and first-paint time are not KPIs.

**PRD Requirement Ref:** NFR-002 (permission model), NFR-001 (tenant isolation in UI), FR-D1-001 through FR-D7-003 (all screen-bearing capabilities)

---

## ADR-008: API Routing — Direct ASP.NET Core Routing, No API Gateway at Launch

**Status:** PROPOSED

**Context:**
The target architecture is a single ASP.NET Core Web API deployed to Azure App Service. Options: (1) No API gateway — direct routing through App Service; (2) Azure API Management (APIM) in front of the App Service; (3) Azure Application Gateway only (for WAF).

**Decision:**
**No API gateway at launch.** Use Azure Application Gateway with WAF (Web Application Firewall) in front of the App Service for security. APIM deferred to post-launch if needed.

Direct routing:
- React SPA → Azure Application Gateway (WAF) → App Service (ASP.NET Core API)
- All API routes prefixed `/api/v1/`
- CORS configured to allow only the SPA origin
- Rate limiting via ASP.NET Core rate limiting middleware (not APIM)

**Rationale:**
- APIM is valuable for multi-API scenarios, third-party developer access, monetization, and complex routing. InsureEdge has a single backend consumed by a single frontend — APIM adds cost ($~150-300/month for Developer tier) and latency without providing functionality that ASP.NET Core middleware cannot deliver.
- Azure Application Gateway provides L7 load balancing and WAF (OWASP 3.2 rules) — appropriate for an insurance application handling PII and financial data.
- Rate limiting, request validation, and API versioning are handled in ASP.NET Core middleware layer.
- If a mobile app or third-party API access requirement emerges post-launch, APIM can be added in front of the existing App Service without code changes.

**DBT-3-ARCH-003:** If a mobile app or partner API integration is added in a future phase, APIM should be re-evaluated.

**Alternatives Considered:**
- **Azure API Management:** Deferred. Cost and complexity not justified at launch for a single-frontend, single-backend architecture.
- **No Application Gateway (direct App Service with WAF on App Service plan):** Considered. App Service has built-in WAF in Premium tier. Application Gateway chosen for more flexible routing rules and dedicated WAF configuration, which is more appropriate for an insurance platform.

**Consequences:**
- Positive: Simpler architecture, lower cost, lower latency (no APIM hop).
- Positive: Easier local development (no APIM mocking layer required).
- Negative: No built-in API portal, developer documentation hosting, or subscription management. Acceptable for a closed enterprise application.
- Risk: If the platform grows to expose APIs to third parties (mortgage lienholders, regulators), API gateway will be required. Architecture must be APIM-ready (API versioning, clean controller interfaces).

**PRD Requirement Ref:** NFR-019 (observability), NFR-016 (performance — no unnecessary hops), DEC-3-0001 (Azure stack)

---

## ADR-009: Async Processing — .NET Worker Services + Hangfire

**Status:** PROPOSED

**Context:**
The source system has 11 confirmed scheduled background jobs (timers) with configurable thresholds (EV-0-0231, NFR-015). These jobs perform time-critical business operations: renewal quote generation, auto-cancellation, expiry processing, payment installment collection, and TranzPay callback reconciliation. A `KillTimer` site property provides an emergency disable for all timers.

In .NET, background job options include: (1) `IHostedService` / `BackgroundService` (built-in, no persistence); (2) Hangfire (persistent job queue, dashboard, retry); (3) Azure Functions (Timer trigger); (4) Azure Logic Apps.

The 11 confirmed timers are:

| # | Timer Name (Source) | Business Function | Schedule |
|---|---|---|---|
| T-01 | RenewalQuoteGenerator | Generate renewal quotes 90 days before expiry | Daily |
| T-02 | RenewalNotificationSender | Send renewal notification emails for draft renewals | Daily |
| T-03 | NonRenewalNoticeSender | Send non-renewal notices 60 days before expiry | Daily |
| T-04 | PolicyExpiryProcessor | Mark policies Non-Renewed 90 days post-expiry | Daily |
| T-05 | QuoteExpiryProcessor | Expire draft/renewal quotes past their expiry threshold | Daily |
| T-06 | AutoCancellationProcessor | Trigger auto-cancellation 30 days after missed payment | Daily |
| T-07 | PolicyExpiredStatusUpdater | Mark policies Expired 1 day after expiration date | Daily |
| T-08 | InstallmentPaymentProcessor | Collect recurring installment payments via TranzPay | Daily |
| T-09 | TranzPayCallbackReconciler | Poll TranzPay for unresolved pending transactions | Every 4 hours |
| T-10 | BulkUploadProcessor | Process batch policy upload files | On-demand / Scheduled |
| T-11 | CommissionDisbursementProcessor | Generate commission disbursement records via DisburseCloud | Weekly / configurable |

**Decision:**
Use **Hangfire** (with PostgreSQL storage) for all 11 timer jobs, supplemented by `BackgroundService` for long-running system services (e.g., webhook inbox processor).

- Hangfire provides: job persistence (survives restarts), retry on failure, dashboard (at `/hangfire` — protected by PlatformAdmin role), cron scheduling, job history.
- All 11 timer schedules are defined as Hangfire recurring jobs with cron expressions.
- All threshold values (90-day renewal window, 30-day cancellation grace, 30/60/90-day expiry windows) are stored in the `Configuration` table (runtime-configurable without redeployment — NFR-015, FR-D7-003).
- **Emergency kill switch (FR-D7-004):** A `TimerEnabled` configuration flag (per-timer and global) stored in the `Configuration` table. Hangfire job execution checks this flag at the start of each run. PlatformAdmin can toggle via System Administration UI.
- **BypassRefundResponse equivalent:** Not a Hangfire concern — this is an App Configuration feature flag checked by the payment service before any refund call.

**Rationale:**
- Pure `BackgroundService` (built-in .NET) has no persistence — a restart loses any in-flight job state and scheduled run history. For insurance-critical jobs (auto-cancellation, renewal), this is unacceptable.
- Azure Functions (Timer trigger) would fragment the deployment — 11 separate functions to deploy, version, and monitor. Hangfire keeps all jobs in the single application, sharing the same EF Core DbContext and business service layer.
- Hangfire's PostgreSQL storage integrates cleanly with the existing Flexible Server instance — no additional infrastructure (no Redis or Azure Service Bus required for job persistence).
- Hangfire dashboard provides operational visibility into job runs, failures, and retry counts — addressing NFR-019.

**Alternatives Considered:**
- **Azure Functions Timer trigger:** Rejected. Fragments the deployment model. Each function is a separate deployment unit, complicating the shared service layer access.
- **Pure `BackgroundService` (no Hangfire):** Rejected. No persistence, no retry, no dashboard. Insurance-critical timer jobs require these capabilities.
- **Azure Logic Apps:** Rejected. No code reuse of the .NET service layer from Logic Apps without an HTTP call. Adds unnecessary indirection.

**Consequences:**
- Positive: All 11 timers persistent, monitorable via Hangfire dashboard.
- Positive: Kill switch per timer without application redeployment.
- Positive: Failed jobs automatically retried with exponential backoff.
- Negative: Hangfire adds a dependency (~1 MB NuGet package + PostgreSQL storage tables). Acceptable given the value it provides.
- Negative: Hangfire dashboard must be secured (PlatformAdmin only). Default dashboard has no auth — must be configured explicitly.

**PRD Requirement Ref:** NFR-015 (11 timers replicated), FR-D1-015 (renewal generation), FR-D3-004 (installment payments), FR-D7-004 (emergency disable), US-POL-005, US-POL-015 through US-POL-019

---

## ADR-010: Secret Management — Azure Key Vault for All Secrets

**Status:** PROPOSED

**Context:**
The source system stores all integration credentials, encryption keys, and configuration values as OutSystems site properties in plaintext (RSK-1-INT-003, RSK-1-INT-004, RSK-1-SEC-007 — all HIGH severity). Secrets identified for migration:

| Secret | Source Location | Target Key Vault Secret Name |
|---|---|---|
| TranzPay UserName, Password, ProducerID | Site property | `TranzPay--UserName`, `TranzPay--Password`, `TranzPay--ProducerID` |
| TranzPay BaseUrl (env-specific) | Site property | `TranzPay--BaseUrl` |
| AES-256 encryption key (`Base64Key`) | Site property | `Encryption--Base64Key` |
| Azure Blob Storage connection string | Site property | `AzureBlob--ConnectionString` |
| LenderDock Basic Auth credentials | Site property | `LenderDock--Username`, `LenderDock--Password` |
| Plumsail API key | Site property (absent — QST-1-INT-003) | `Plumsail--ApiKey` |
| DisburseCloud API key (`DisbursementCompanySecrectKey`) | Site property | `DisburseCloud--ApiKey` |
| DisburseCloud BaseUrl (env-specific) | Site property | `DisburseCloud--BaseUrl` |
| HexCat API credentials | Unknown (QST-1-INT-004) | `HexCat--ApiKey` (TBD) |
| Google Maps API key (display) | Site property | `Google--MapsApiKey` |
| Google Geocoding API key | Site property | `Google--GeocodingApiKey` |
| JWT signing key | New | `Jwt--SigningKey` |
| Database connection string | New | `Database--ConnectionString` |
| Hangfire connection string | New | `Hangfire--ConnectionString` |

**Decision:**
All secrets stored in **Azure Key Vault**. Application accesses Key Vault via **Managed Identity** (no connection string or credential for Key Vault itself — eliminates the circular secret problem).

- **ASP.NET Core configuration provider:** `AddAzureKeyVault` added to `IHostBuilder.ConfigureAppConfiguration`. Secrets auto-loaded at startup and bound to strongly-typed options classes (`TranzPayOptions`, `DisburseCloudOptions`, etc.).
- **Managed Identity:** App Service System-Assigned Managed Identity granted `Key Vault Secrets User` role on the Key Vault. No credential files or environment variables.
- **Secret naming convention:** `{Integration}--{Property}` maps to `{Integration}:{Property}` in ASP.NET Core configuration (double-dash is the Key Vault key hierarchy separator).
- **Environment-specific Key Vaults:** Each environment (Dev, QA, UAT, Prod) has its own Key Vault. Secrets may differ (TranzPay sandbox URL in Dev/QA, production URL in UAT/Prod once confirmed).
- **Key rotation:** AES-256 encryption key rotation supported via Key Vault key versioning. The active version is always used by the application. A separate key rotation runbook is required (TRANSFER phase item).
- **Geocoding key origin restriction (NFR-020):** Google API keys restricted by domain origin in Google Cloud Console — this is a Google-side configuration, not a Key Vault concern. Documented in deployment checklist.

**Rationale:**
- Azure Key Vault with Managed Identity eliminates ALL 10 identified credential exposure risks in a single architectural decision. No credentials in application code, configuration files, or version control.
- Managed Identity removes the circular dependency of "how do I secure the Key Vault credential?" — Azure handles it at the platform level.
- `AddAzureKeyVault` configuration provider means secrets are loaded as standard ASP.NET Core configuration — no code changes required to consume secrets beyond the options binding pattern.
- Environment-specific Key Vaults ensure development secrets cannot leak into production and production secrets are never accessible in development environments.

**Alternatives Considered:**
- **Azure App Configuration (without Key Vault):** Rejected for secrets. App Configuration is appropriate for non-sensitive feature flags and thresholds (timer kill switch, bypass flag). Key Vault is required for credentials and encryption keys.
- **Dockerfile / environment variables:** Rejected. Environment variable secrets are visible in process listings and deployment logs.
- **GitHub Secrets (for CI/CD):** Used for CI/CD pipeline authentication to Key Vault, not for runtime application secrets.

**Consequences:**
- Positive: Eliminates RSK-1-INT-003, RSK-1-INT-004, RSK-1-SEC-007 in one decision.
- Positive: Secret rotation (encryption key, TranzPay credentials) does not require application redeployment — only Key Vault update + application restart.
- Negative: App startup requires Key Vault connectivity. If Key Vault is unavailable during startup, the application will not start. Mitigated by Key Vault's 99.9% SLA and startup retry.
- Negative: Secret loading adds ~200-500ms to cold start. Acceptable.
- Risk: TranzPay production URL (GAP-2-INT-001) must be loaded into the Prod Key Vault before UAT/Prod deployments. This is a deployment gate item, not a code change.

**PRD Requirement Ref:** NFR-007 (encryption key externalization), NFR-014 (credential externalization), NFR-009 (bypass flag control), RSK-1-INT-003, RSK-1-INT-004, RSK-1-SEC-007, FR-D7-003 (configuration management)

---

## Open Doubts (DBT-) Raised in This Document

| DBT ID | Severity | Statement | Impact |
|--------|----------|-----------|--------|
| DBT-3-ARCH-001 | HIGH | If RPS PostgreSQL/PostGIS server is Damco-internal and not transferable to client infrastructure, ADR-005 Option 2 (migrate raster to Azure) may not be viable without licensing clarification. Fallback is Option 3 (REST microservice). | ADR-005 finalization blocked. Must resolve QST-2-INT-011-001 before FORGE. |
| DBT-3-ARCH-002 | HIGH | TranzPay refund API contract (ACHRefund, CreditCardRefund) not documented in TID. If ASM-2-ARCH-001 is incorrect, the refund service design in FORGE must change. | Refund service FORGE risk. Must confirm with TranzPay. |
| DBT-3-ARCH-003 | LOW | If a mobile app or partner API integration is added post-launch, Azure API Management should be introduced. The current ADR-008 architecture must remain APIM-ready. | Future phase consideration. No FORGE impact. |

---

## Assumptions Register (ADR-level)

| ASM ID | Statement | Confidence | ADR |
|--------|-----------|-----------|-----|
| ASM-3-ARCH-001 | 100 concurrent users is the confirmed peak load ceiling for architecture sizing. | HIGH (per engagement preconditions) | ADR-001 |
| ASM-3-ARCH-002 | No stored procedures critical to business logic exist in either SQL Server database. All business logic is in the OutSystems application layer. | HIGH | ADR-002 |
| ASM-3-ARCH-003 | Session timeout / refresh token lifetime is 8 hours, pending QST-2-PM-SEC-001 confirmation. | MEDIUM | ADR-004 |

---

*End of ART-3-002 — Architecture Decision Records | INSUREEDGE-2026 | IDEATE Phase | 2026-06-17*
*10 ADRs produced. All trace to ≥1 PRD requirement. 3 DBT- items raised. No ADR self-approves the Architecture Gate.*
