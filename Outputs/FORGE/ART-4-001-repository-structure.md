# ART-4-001 — Repository Structure
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Status:** AI_GENERATED
**Produced by:** Forge Agent
**Phase:** FORGE
**Date:** 2026-06-17
**Version:** 1.0
**Engagement:** INSUREEDGE-2026 | Customer: Hudson Bailey
**Architecture gate:** PASSED (DEC-3-0003, 2026-06-17)
**Primary inputs:** ART-3-005 (backend architecture), ART-3-004 (frontend architecture), ART-3-012 (TAD), ADR-001 (Modular Monolith)

---

## Purpose

This document defines the complete repository folder layout and project structure for the InsureEdge .NET 8 Modular Monolith solution. Every engineer implementing a new file should use this structure as the authoritative map. No architectural decisions are made here — all structure derives from ART-3-005 §1 and ADR-001.

---

## 1. Repository Root Layout

```
InsureEdge/                               ← Git repository root
├── InsureEdge.sln                        ← Visual Studio solution file (all projects)
├── .editorconfig                         ← C# code style enforcement
├── .gitignore                            ← Standard .NET + Node + Terraform ignores
├── .gitattributes                        ← Line endings, binary file markers
├── Directory.Build.props                 ← Shared MSBuild properties (TargetFramework, Nullable, TreatWarningsAsErrors)
├── Directory.Packages.props              ← Central NuGet package version management
├── global.json                           ← .NET SDK version pin (8.0.x)
├── README.md                             ← Project bootstrap guide
│
├── src/                                  ← All production source projects
│   ├── InsureEdge.API/
│   ├── InsureEdge.Domain/
│   ├── InsureEdge.Application/
│   ├── InsureEdge.Infrastructure/
│   └── InsureEdge.Workers/
│
├── tests/                                ← All test projects
│   ├── InsureEdge.Domain.Tests/
│   ├── InsureEdge.Application.Tests/
│   ├── InsureEdge.Infrastructure.Tests/
│   └── InsureEdge.API.Tests/
│
├── frontend/
│   └── insure-edge-app/                  ← React (TypeScript) SPA
│
├── infrastructure/
│   └── terraform/                        ← Azure IaC
│
├── migrations/
│   └── scripts/                          ← Data migration SQL and C# worker
│
└── .github/
    └── workflows/                        ← GitHub Actions CI/CD pipelines
```

---

## 2. Backend Source Projects

### 2.1 `src/InsureEdge.API/`

**Purpose:** ASP.NET Core Web API host. Entry point. Controllers, middleware, startup configuration, Hangfire dashboard. References Application, Infrastructure, Domain, Workers.

**Naming convention:** Controllers named `{Domain}Controller.cs` (e.g., `PolicyController.cs`). Webhook controllers in `Webhooks/` subfolder.

```
InsureEdge.API/
├── InsureEdge.API.csproj
├── Program.cs                            ← Host builder, service registration, middleware pipeline
├── appsettings.json                      ← Non-secret config (logging, CORS, rate-limiting)
├── appsettings.Development.json          ← Dev overrides (no secrets)
│
├── Controllers/
│   ├── Policy/
│   │   ├── QuoteController.cs            ← POST /api/v1/quotes, GET, PUT, DELETE
│   │   ├── PolicyController.cs           ← GET /api/v1/policies, bind, renew, cancel, endorse
│   │   └── BulkUploadController.cs       ← POST /api/v1/policies/bulk-upload
│   ├── Claims/
│   │   ├── ClaimsController.cs           ← FNOL, claim CRUD, status transitions
│   │   └── WorksheetController.cs        ← Worksheet and payment management
│   ├── Billing/
│   │   └── BillingController.cs          ← Payment plan, payment initiation, refunds
│   ├── Distribution/
│   │   ├── IntermediaryController.cs
│   │   └── ProducerController.cs
│   ├── Identity/
│   │   ├── AuthController.cs             ← Login, refresh, logout, permissions
│   │   └── UsersController.cs
│   ├── Groups/
│   │   └── GroupsController.cs
│   ├── Documents/
│   │   └── DocumentsController.cs
│   ├── Administration/
│   │   ├── TenantsController.cs
│   │   ├── ProductsController.cs
│   │   └── ConfigurationController.cs
│   ├── Geocoding/
│   │   └── GeocodingController.cs        ← POST /api/v1/geocoding/resolve (server-side proxy)
│   └── Webhooks/
│       ├── TranzPayWebhookController.cs  ← POST /api/webhooks/tranzpay/callback
│       └── DisburseWebhookController.cs  ← POST /api/webhooks/disburse/callback
│
├── Middleware/
│   ├── TenantResolutionMiddleware.cs     ← Resolves ClientId from JWT; throws 401 on null (ADR-003)
│   ├── PermissionAuthorizationMiddleware.cs ← Evaluates [RequirePermission] attributes (ART-3-005 §6)
│   └── CorrelationIdMiddleware.cs        ← Generates/propagates X-Correlation-Id header
│
├── Filters/
│   ├── GlobalExceptionFilter.cs          ← Maps domain exceptions to HTTP status codes (ART-3-005 §11)
│   └── ValidationFilter.cs              ← FluentValidation integration; returns 422 on validation failure
│
├── Configuration/
│   ├── SwaggerConfiguration.cs           ← OpenAPI 3.0 setup with bearer auth
│   ├── HangfireConfiguration.cs          ← Hangfire server setup; dashboard authorization (ADR-009)
│   ├── CorsConfiguration.cs              ← SPA origin allowlist
│   └── RateLimitingConfiguration.cs      ← ASP.NET Core rate limiting middleware config
│
└── HealthChecks/
    ├── DatabaseHealthCheck.cs            ← EF Core DbContext connectivity check
    ├── RedisHealthCheck.cs               ← Redis connectivity check
    └── KeyVaultHealthCheck.cs            ← Key Vault accessibility check
```

**Key files:**
- `Program.cs` — all service registrations, middleware ordering, Hangfire, Key Vault config provider
- `appsettings.json` — logging sinks (Serilog), CORS origins, rate limits. No secrets.

---

### 2.2 `src/InsureEdge.Domain/`

**Purpose:** Domain entities, value objects, domain events, interfaces, and domain-specific exceptions. No infrastructure references. Referenced by Application and Infrastructure.

**Naming convention:** Entities in `Entities/{Domain}/` namespaces. Value objects in `ValueObjects/`. Domain exceptions in `Exceptions/`.

```
InsureEdge.Domain/
├── InsureEdge.Domain.csproj
│
├── Entities/
│   ├── Policy/
│   │   ├── Policy.cs
│   │   ├── PolicyProduct.cs
│   │   ├── PolicyLimitCoverage.cs
│   │   ├── PolicyRiskInformation.cs
│   │   ├── PolicyMortgage.cs
│   │   ├── PolicyPremium.cs
│   │   ├── PolicyPaymentPlan.cs
│   │   ├── RiskLocation.cs
│   │   ├── AdditionalInsured.cs
│   │   ├── AdditionalOrganisation.cs
│   │   ├── PolicyCommission.cs
│   │   ├── PolicyDocument.cs
│   │   └── PolicyAccount.cs             ← M:N junction entity (RSK-2-DATA-001)
│   ├── Claims/
│   │   ├── Claim.cs
│   │   ├── ClaimCoverage.cs
│   │   ├── Worksheet.cs
│   │   ├── WorksheetPayment.cs
│   │   ├── WorksheetReserve.cs
│   │   ├── Adjuster.cs
│   │   └── ClaimDocument.cs
│   ├── Billing/
│   │   ├── PolicyPaymentTransaction.cs
│   │   ├── CommissionPaymentTransaction.cs
│   │   ├── PaymentCallbackResponse.cs
│   │   ├── Payee.cs
│   │   └── BankDetail.cs
│   ├── Distribution/
│   │   ├── Intermediary.cs
│   │   └── Producer.cs
│   ├── Identity/
│   │   ├── AppUser.cs                   ← Renamed from User2 (ART-3-013 §1.13)
│   │   ├── Client.cs
│   │   ├── UserGroup.cs                 ← Renamed from Group_Table
│   │   ├── UserGroupMember.cs           ← Renamed from GroupUser_Table
│   │   └── ScreenPermission.cs
│   ├── Administration/
│   │   ├── AppScreen.cs
│   │   ├── Module.cs
│   │   └── Configuration.cs
│   └── Shared/
│       └── AuditLog.cs
│
├── ValueObjects/
│   ├── Money.cs                         ← Amount + Currency; immutable
│   ├── PolicyNumber.cs                  ← Format validation
│   ├── UserCode.cs                      ← IE00XX format (FR-D5-003)
│   └── Address.cs                       ← AddressLine1, City, State, ZipCode
│
├── Interfaces/
│   ├── Repositories/
│   │   ├── IPolicyRepository.cs
│   │   ├── IClaimRepository.cs
│   │   ├── IBillingRepository.cs
│   │   ├── IDistributionRepository.cs
│   │   ├── IIdentityRepository.cs
│   │   └── IRepository.cs              ← Generic base interface
│   └── Services/
│       ├── IEncryptionService.cs
│       ├── ITenantContext.cs
│       ├── IPermissionEvaluationService.cs
│       └── IAuditService.cs
│
├── Exceptions/
│   ├── EntityNotFoundException.cs
│   ├── TenantAccessDeniedException.cs
│   ├── PermissionDeniedException.cs
│   ├── DuplicatePolicyException.cs
│   ├── ValidationException.cs
│   ├── IntegrationException.cs
│   └── TenantResolutionException.cs    ← Thrown when ClientId cannot be resolved (RSK-1-SEC-008)
│
└── Events/
    ├── PolicyBoundEvent.cs
    ├── PolicyCancelledEvent.cs
    ├── ClaimCreatedEvent.cs
    └── PaymentFailedEvent.cs
```

---

### 2.3 `src/InsureEdge.Application/`

**Purpose:** Use-case orchestration (Application Services), DTOs, FluentValidation validators. References Domain only. No infrastructure references.

**Naming convention:** Services in `{Domain}/Services/`. DTOs in `{Domain}/DTOs/`. Validators in `{Domain}/Validators/`. Named `{Action}Request.cs` / `{Action}Response.cs`.

```
InsureEdge.Application/
├── InsureEdge.Application.csproj
│
├── Policy/
│   ├── Services/
│   │   ├── QuoteService.cs             ← Create/update/retrieve quotes; wizard step orchestration
│   │   ├── PolicyBindingService.cs     ← Bind a quote; duplicate check; TranzPay initiation
│   │   ├── EndorsementService.cs       ← Mid-term endorsement; premium diff; LenderDock notify
│   │   ├── RenewalService.cs           ← Manual and automatic renewal processing
│   │   ├── CancellationService.cs      ← Manual and auto-cancellation; LenderDock notify
│   │   ├── BulkUploadService.cs        ← Parse and queue bulk upload files
│   │   └── RatingEngineService.cs      ← Rate table query (via Redis cache; Dapper fallback)
│   ├── DTOs/
│   │   ├── CreateQuoteRequest.cs
│   │   ├── QuoteResponse.cs
│   │   ├── BindPolicyRequest.cs
│   │   ├── PolicyResponse.cs
│   │   ├── EndorsementRequest.cs
│   │   ├── CancellationRequest.cs
│   │   └── BulkUploadRequest.cs
│   └── Validators/
│       ├── CreateQuoteValidator.cs
│       ├── BindPolicyValidator.cs
│       └── EndorsementValidator.cs
│
├── Claims/
│   ├── Services/
│   │   ├── FnolService.cs             ← FNOL intake; duplicate check; claim number generation
│   │   ├── ClaimWorkflowService.cs    ← Status transitions; adjuster assignment
│   │   ├── WorksheetService.cs        ← Reserve allocation; worksheet approval
│   │   ├── DisbursementService.cs     ← DisburseCloud claim payment initiation
│   │   └── CatastropheService.cs      ← CAT event grouping
│   ├── DTOs/
│   └── Validators/
│
├── Billing/
│   ├── Services/
│   │   ├── PremiumPaymentService.cs   ← TranzPay hosted redirect initiation; callback processing
│   │   ├── PaymentPlanService.cs      ← Payment plan configuration; installment schedule
│   │   ├── RefundService.cs           ← ACH/CC refund via TranzPay (HUMAN_VALIDATION_REQUIRED — financial)
│   │   └── FailedPaymentService.cs    ← Grace period tracking; cancellation trigger
│   ├── DTOs/
│   └── Validators/
│
├── Distribution/
│   ├── Services/
│   │   ├── IntermediaryService.cs
│   │   ├── ProducerService.cs
│   │   ├── CommissionService.cs       ← Commission calculation (HUMAN_VALIDATION_REQUIRED — financial)
│   │   └── DisburseCloudService.cs    ← Commission disbursement to DisburseCloud API
│   ├── DTOs/
│   └── Validators/
│
├── Identity/
│   ├── Services/
│   │   ├── AuthenticationService.cs   ← Login, JWT issuance, refresh, TOTP MFA (ADR-004)
│   │   ├── UserService.cs             ← User CRUD; UserCode generation (IE00XX)
│   │   ├── GroupService.cs            ← Group CRUD; synchronous privilege revocation (NFR-006)
│   │   ├── PermissionService.cs       ← Screen permission assignment per group
│   │   └── AuditService.cs            ← Audit log writes; PlatformAdmin cross-tenant tagging
│   ├── DTOs/
│   └── Validators/
│
├── Documents/
│   ├── Services/
│   │   ├── DocumentGenerationService.cs  ← Plumsail JSON payload builder + API call
│   │   ├── DocumentStorageService.cs     ← Azure Blob upload; SAS token generation
│   │   └── DocumentAccessService.cs     ← Download gate: IsSensitive + AccessSensitiveDoc check
│   ├── DTOs/
│   └── Validators/
│
└── Administration/
    ├── Services/
    │   ├── TenantProvisioningService.cs   ← Client INSERT; no schema changes needed (ADR-003)
    │   ├── ProductCatalogService.cs
    │   ├── ConfigurationService.cs        ← Azure App Configuration reads/writes
    │   └── TimerControlService.cs         ← Kill switch per timer (NFR-015)
    ├── DTOs/
    └── Validators/
```

---

### 2.4 `src/InsureEdge.Infrastructure/`

**Purpose:** EF Core DbContext, repositories, external service clients, caching, encryption, audit. References Domain only.

```
InsureEdge.Infrastructure/
├── InsureEdge.Infrastructure.csproj
│
├── Persistence/
│   ├── InsureEdgeDbContext.cs           ← EF Core DbContext (operational schema: policy, claims, billing, distribution, rating)
│   ├── InsureEdgeSystemDbContext.cs     ← EF Core DbContext (identity + system schemas)
│   ├── Configurations/                  ← IEntityTypeConfiguration<T> per entity (table names, columns, FKs, global filters)
│   │   ├── Policy/
│   │   │   ├── PolicyConfiguration.cs
│   │   │   ├── ClaimConfiguration.cs
│   │   │   └── ...
│   │   └── Identity/
│   │       ├── AppUserConfiguration.cs
│   │       └── ...
│   ├── Repositories/
│   │   ├── PolicyRepository.cs
│   │   ├── ClaimRepository.cs
│   │   ├── BillingRepository.cs
│   │   ├── DistributionRepository.cs
│   │   ├── IdentityRepository.cs
│   │   └── BaseRepository.cs           ← Generic IRepository<T> implementation
│   ├── Migrations/                      ← EF Core code-first migration files (auto-generated + manual)
│   └── UnitOfWork.cs                   ← IUnitOfWork wrapping SaveChangesAsync
│
├── ExternalServices/
│   ├── TranzPay/
│   │   ├── TranzPayClient.cs           ← Typed HttpClient; ThirdParty + ACHDebit only (ADR-006)
│   │   ├── TranzPayOptions.cs          ← Bound from Key Vault: BaseUrl, UserName, Password, ProducerId
│   │   └── TranzPayWebhookValidator.cs ← Idempotency check on ThirdPartyCallID
│   ├── LenderDock/
│   │   ├── LenderDockClient.cs         ← Basic Auth; 10 notification types; retry table integration
│   │   └── LenderDockOptions.cs        ← AuthorizationHeader, ProviderId from Key Vault
│   ├── Plumsail/
│   │   ├── PlumsailClient.cs           ← JSON payload → document blob
│   │   └── PlumsailOptions.cs          ← ApiKey, ApiUrl from Key Vault (QST-1-INT-003 placeholder)
│   ├── DisburseCloud/
│   │   ├── DisburseCloudClient.cs      ← Bearer JWT; token cached in Redis 55 min; v1.2.1 contract (EV-0-0236)
│   │   ├── DisburseCloudOptions.cs     ← BaseUrl, SecretKey, EncryptionKey from Key Vault
│   │   └── DisburseCloudWebhookValidator.cs
│   ├── HexCat/
│   │   ├── HexCatClient.cs             ← DBT-4-FORGE-001: PLACEHOLDER pending QST-1-INT-004
│   │   └── HexCatOptions.cs            ← ApiKey from Key Vault (TBD)
│   ├── Geocoding/
│   │   ├── GoogleGeocodingClient.cs    ← Server-side proxy; results cached in Redis 30 days (ADR-010)
│   │   └── GeocodingOptions.cs         ← GeocodingApiKey, MapsApiKey from Key Vault (NFR-020)
│   ├── Rps/
│   │   └── RpsRepository.cs            ← Raw Npgsql; ST_Value/ST_Transform/ST_Intersects query (ADR-005)
│   ├── Email/
│   │   ├── SmtpEmailClient.cs          ← SmtpClient; 17+ trigger points; template-based
│   │   ├── EmailTemplateService.cs
│   │   └── SmtpOptions.cs              ← Host, Port, User, Password from Key Vault
│   └── BlobStorage/
│       ├── AzureBlobStorageService.cs  ← Azure.Storage.Blobs SDK; Managed Identity; SAS token generation
│       └── BlobStorageOptions.cs       ← ContainerName from Key Vault; connection string via Managed Identity
│
├── Security/
│   ├── AesEncryptionService.cs         ← AES-256-CBC + HMAC-SHA256 (IEncryptionService) (ART-3-005 §7)
│   ├── PermissionCacheService.cs       ← Redis-backed permission lookup + invalidation (ART-3-005 §6)
│   └── TenantContextAccessor.cs        ← ITenantContext implementation; reads from HttpContext
│
├── Caching/
│   └── RedisCacheService.cs            ← StackExchange.Redis wrapper; GetAsync/SetAsync/DeletePatternAsync
│
├── Configuration/
│   └── AppConfigurationService.cs      ← Azure App Configuration; timer flags, thresholds
│
└── Audit/
    └── AuditRepository.cs              ← Direct Dapper INSERT to audit_log; no EF tracking (NFR-008)
```

---

### 2.5 `src/InsureEdge.Workers/`

**Purpose:** All 11 Hangfire background job classes plus `BackgroundService` types. References Application, Infrastructure, Domain.

```
InsureEdge.Workers/
├── InsureEdge.Workers.csproj
│
├── Jobs/
│   ├── RenewalQuoteGeneratorJob.cs          ← T-01: Daily 2 AM; 90-day renewal window (BR-POL-REN-001)
│   ├── RenewalNotificationSenderJob.cs      ← T-02: Daily 3 AM; draft renewal emails (BR-POL-REN-002)
│   ├── NonRenewalNoticeSenderJob.cs         ← T-03: Daily 4 AM; 60-day non-renewal notice (BR-POL-NRN-001)
│   ├── PolicyExpiryProcessorJob.cs          ← T-04: Daily 1 AM; mark Non-Renewed 90 days post-expiry (BR-POL-REN-004)
│   ├── QuoteExpiryProcessorJob.cs           ← T-05: Daily 5 AM; expire draft quotes (BR-POL-QE-001/002/003)
│   ├── AutoCancellationProcessorJob.cs      ← T-06: Daily 6 AM; 30-day cancellation after non-payment (BR-POL-CAN-001)
│   ├── PolicyExpiredStatusUpdaterJob.cs     ← T-07: Midnight; mark Expired 1 day after ExpirationDate (BR-POL-EXP-001)
│   ├── InstallmentPaymentProcessorJob.cs    ← T-08: Daily 8 AM; TranzPay installment collections (FR-D3-004)
│   ├── TranzPayCallbackReconcilerJob.cs     ← T-09: Every 4 hours; unresolved pending transactions
│   ├── BulkUploadProcessorJob.cs           ← T-10: Daily 7 AM; process BulkUploadDump records
│   └── CommissionDisbursementProcessorJob.cs ← T-11: Monday 9 AM; DisburseCloud commission disbursement
│
├── Base/
│   └── BaseJob.cs                          ← Kill-switch check pattern (ART-3-005 §5.3); logging scaffold
│
└── Registration/
    └── HangfireJobRegistration.cs          ← Registers all 11 recurring jobs with cron expressions at startup
```

**Kill-switch pattern (all jobs):** Each job inherits `BaseJob.cs` which checks `Timer:GlobalEnabled` and `Timer:{JobKey}Enabled` from Azure App Configuration before executing any business logic. Configuration read at execution time — changes take effect without redeployment (ADR-009, NFR-015).

---

## 3. Test Projects

### 3.1 `tests/InsureEdge.Domain.Tests/`

Unit tests for domain entities, value objects, and domain-level invariants. No infrastructure dependencies.

```
InsureEdge.Domain.Tests/
├── Entities/
│   ├── PolicyTests.cs            ← State machine transitions, validation rules
│   ├── ClaimTests.cs
│   └── MoneyTests.cs             ← Value object arithmetic
└── ValueObjects/
    └── PolicyNumberTests.cs
```

### 3.2 `tests/InsureEdge.Application.Tests/`

Unit tests for application services. All infrastructure dependencies mocked (Moq). Tests map to acceptance criteria in ART-2-003.

```
InsureEdge.Application.Tests/
├── Policy/
│   ├── QuoteServiceTests.cs
│   ├── PolicyBindingServiceTests.cs
│   └── CancellationServiceTests.cs
├── Claims/
│   ├── FnolServiceTests.cs
│   └── WorksheetServiceTests.cs
├── Billing/
│   └── PremiumPaymentServiceTests.cs
├── Identity/
│   ├── AuthenticationServiceTests.cs
│   ├── GroupServiceTests.cs         ← Synchronous privilege revocation tests (NFR-006)
│   └── PermissionServiceTests.cs
└── Timer/
    └── JobThresholdTests.cs         ← Validates threshold config keys resolve correctly
```

### 3.3 `tests/InsureEdge.Infrastructure.Tests/`

Integration tests using Testcontainers (PostgreSQL + Redis spun up in Docker for each test run).

```
InsureEdge.Infrastructure.Tests/
├── Repositories/
│   ├── PolicyRepositoryTests.cs     ← EF Core global filter validation (ADR-003)
│   └── ClaimRepositoryTests.cs
├── Security/
│   ├── AesEncryptionServiceTests.cs ← Round-trip encrypt/decrypt; migrated-value compat
│   └── PermissionCacheServiceTests.cs
└── ExternalServices/
    ├── TranzPayClientTests.cs        ← Contract validation (mock server)
    └── DisburseCloudClientTests.cs
```

### 3.4 `tests/InsureEdge.API.Tests/`

End-to-end API tests using `WebApplicationFactory<Program>`. Validates controllers, middleware, permission enforcement.

```
InsureEdge.API.Tests/
├── Policy/
│   └── PolicyEndpointTests.cs
├── Claims/
│   └── ClaimsEndpointTests.cs
├── Auth/
│   ├── AuthEndpointTests.cs         ← Login, JWT expiry, refresh rotation
│   └── TenantIsolationTests.cs      ← Cross-tenant data isolation (NFR-001)
└── Webhooks/
    └── TranzPayWebhookTests.cs      ← Idempotency; duplicate callback handling
```

---

## 4. Frontend: `frontend/insure-edge-app/`

React 18 / TypeScript / Vite SPA. Full hierarchy defined in ART-3-004.

```
frontend/insure-edge-app/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── index.html
│
└── src/
    ├── main.tsx                    ← Entry; StrictMode; QueryClient; RouterProvider
    ├── App.tsx                     ← Root outlet; AuthGuard
    ├── router/
    │   ├── routes.tsx
    │   └── AuthGuard.tsx
    ├── store/
    │   ├── authStore.ts
    │   ├── permissionStore.ts
    │   └── uiStore.ts
    ├── api/
    │   ├── axiosClient.ts
    │   └── queryClient.ts
    ├── hooks/
    │   ├── usePermission.ts
    │   ├── useTenant.ts
    │   └── useCurrentUser.ts
    ├── components/
    │   ├── ui/                     ← shadcn/ui owned components
    │   └── shared/                 ← DataTable, PageHeader, ConfirmDialog, LoadingSpinner
    ├── domains/
    │   ├── policy/
    │   ├── claims/
    │   ├── billing/
    │   ├── distribution/
    │   ├── identity/
    │   ├── documents/
    │   └── admin/
    └── lib/
        ├── permissions.ts
        └── constants.ts
```

Refer to ART-3-004 §3 for the full per-domain component hierarchy.

---

## 5. Infrastructure: `infrastructure/terraform/`

Terraform-managed Azure resources. Full resource specifications in ART-4-005.

```
infrastructure/terraform/
├── main.tf                         ← Provider config; backend (Azure Blob remote state)
├── variables.tf                    ← All environment-parameterized values
├── outputs.tf                      ← Key resource IDs and URLs
├── terraform.tfvars.example        ← Template (never committed with real values)
│
├── modules/
│   ├── app-service/                ← App Service Plan + App Service; staging slot
│   ├── postgresql/                 ← Flexible Server; zone HA; PostGIS extension
│   ├── redis/                      ← Azure Cache for Redis Standard C1
│   ├── keyvault/                   ← Key Vault per environment; Managed Identity RBAC
│   ├── storage/                    ← Blob Storage; GRS; containers
│   ├── networking/                 ← VNet; subnets; private endpoints; NSGs
│   ├── app-gateway/                ← Application Gateway WAF v2; OWASP 3.2
│   ├── static-web-app/             ← Azure Static Web Apps (React SPA)
│   ├── app-configuration/          ← Azure App Configuration (timer flags, thresholds)
│   ├── monitoring/                 ← Application Insights; Log Analytics Workspace; alerts
│   └── keyvault-secrets/           ← Secret name placeholders (values loaded separately)
│
└── environments/
    ├── dev.tfvars
    ├── qa.tfvars
    ├── uat.tfvars
    └── prod.tfvars
```

---

## 6. Migrations: `migrations/scripts/`

Data migration artifacts. Full specifications in ART-4-006.

```
migrations/
├── scripts/
│   ├── 00-pre-migration-checks/    ← SQL validation scripts (orphan scan, sentinel audit)
│   ├── 01-schema-creation/         ← EF Core migration files + manual DDL patches
│   ├── 02-reference-data/          ← pgloader scripts for lookup tables
│   ├── 03-rating-data/             ← pgloader for HBRater tables
│   ├── 04-identity-data/           ← SQL for Client, AppUser, UserGroup migration
│   ├── 05-operational-data/        ← SQL for Policy, Claims, Billing migration
│   ├── 06-financial-data/          ← SQL for payments and commissions
│   └── 07-validation-queries/      ← Row count, orphan detection, sentinel date checks
│
└── tools/
    └── BlobExtractor/              ← .NET 8 Worker Service for varbinary → Azure Blob extraction
        ├── BlobExtractor.csproj
        ├── Program.cs
        ├── Workers/
        │   ├── AccountBinaryExtractor.cs
        │   └── PolicyBinaryExtractor.cs
        └── Manifest/
            └── ExtractionManifest.cs
```

---

## 7. CI/CD: `.github/workflows/`

Full specifications in ART-4-008.

```
.github/workflows/
├── ci.yml                          ← Build + unit test on every push / PR
├── deploy-dev.yml                  ← Deploy to Dev on merge to develop
├── deploy-staging.yml              ← Deploy to QA/UAT on merge to release/*
├── deploy-prod.yml                 ← Deploy to Prod on merge to main (2-approval gate)
└── db-migrate.yml                  ← EF Core migration runner (triggered before app deploy)
```

---

## 8. Naming Conventions

### 8.1 C# Naming

| Element | Convention | Example |
|---|---|---|
| Classes, Interfaces, Enums | PascalCase | `PolicyBindingService`, `IPolicyRepository` |
| Properties | PascalCase | `CommissionPercentage` (NOT `ComissionPercentage` — typo corrected per NFR-012) |
| Methods | PascalCase | `BindPolicyAsync` |
| Private fields | `_camelCase` | `_policyRepository` |
| Local variables | camelCase | `policy`, `clientId` |
| Constants | UPPER_SNAKE | `DEFAULT_POLICY_FEE` |
| Async methods | Suffix `Async` | `GetPolicyAsync`, `SaveChangesAsync` |

### 8.2 PostgreSQL Naming (per ADR-002)

| Element | Convention | Example |
|---|---|---|
| Table names | snake_case | `policy_payment_transaction` |
| Column names | snake_case | `commission_percentage` (corrected from `ComissionPercentage`) |
| Schema names | snake_case | `policy`, `claims`, `billing`, `identity` |
| Index names | `ix_{table}_{columns}` | `ix_policy_client_id` |
| FK constraint names | `fk_{table}_{ref_table}` | `fk_claim_policy` |

### 8.3 IE_ Prefix Convention

The OutSystems source used `IE_` prefix on external action names. In the target, this prefix is carried forward on:
- Configuration keys: `IE_RENEWAL_LEAD_DAYS` → `Policy:RenewalLeadDays` (normalized to ASP.NET Core config hierarchy)
- Hangfire job names: not prefixed (job class name suffices)
- API route segments: not prefixed (domain-first: `/api/v1/policies`, not `/api/v1/ie-policies`)

### 8.4 BL/CS Layer Convention

The OutSystems two-layer module structure (BL = Business Logic, CS = Core Services) maps to:
- **BL layer** → `InsureEdge.Application/{Domain}/Services/` (business orchestration)
- **CS layer** → `InsureEdge.Infrastructure/ExternalServices/` + `InsureEdge.Infrastructure/Persistence/Repositories/` (data access and external calls)

This mapping is noted for traceability when OutSystems logic references are used as evidence in FORGE implementation work.

---

## 9. Open Doubts (DBT-4-FORGE) Raised in This Document

| DBT ID | Severity | Statement | Placeholder Location |
|--------|----------|-----------|----------------------|
| DBT-4-FORGE-001 | HIGH | HexCat API contract is unknown (QST-1-INT-004 BLOCKING). `HexCatClient.cs` and `HexCatOptions.cs` are placeholder stubs. The actual HTTP method, authentication, request schema, and response schema cannot be implemented until the contract is received from the customer/HexCat vendor. | `InsureEdge.Infrastructure/ExternalServices/HexCat/HexCatClient.cs` |

---

*End of ART-4-001 — Repository Structure | INSUREEDGE-2026 | FORGE Phase | 2026-06-17*
*Status: AI_GENERATED. Based on ART-3-005 §1, ART-3-004 §2-3, ADR-001, ADR-009. 1 DBT-4-FORGE raised.*
