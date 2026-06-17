# ART-3-005 — Backend Architecture
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Architecture Agent
**Phase:** IDEATE
**Date:** 2026-06-17
**Version:** 1.0 — GATE CANDIDATE
**Technology:** .NET 8 / ASP.NET Core Web API / EF Core 8 / Npgsql / Hangfire / StackExchange.Redis

---

## 1. Solution Structure

```
InsureEdge.sln
├── src/
│   ├── InsureEdge.API                     ← ASP.NET Core Web API host (entry point)
│   ├── InsureEdge.Domain                  ← Domain entities, interfaces, business rules (no infrastructure refs)
│   ├── InsureEdge.Application             ← Application services, use-case orchestration, DTOs, validators
│   ├── InsureEdge.Infrastructure          ← EF Core DbContext, repositories, external service clients
│   └── InsureEdge.Workers                 ← Hangfire job definitions and background services
└── tests/
    ├── InsureEdge.Domain.Tests            ← Domain logic unit tests
    ├── InsureEdge.Application.Tests       ← Application service tests (mocked infra)
    ├── InsureEdge.Infrastructure.Tests    ← Repository and client integration tests
    └── InsureEdge.API.Tests               ← Controller/endpoint integration tests (WebApplicationFactory)
```

### 1.1 Layer Dependencies (Clean Architecture)

```
InsureEdge.API          → Application, Infrastructure, Domain
InsureEdge.Application  → Domain only
InsureEdge.Infrastructure → Domain only (EF Core entities, interfaces)
InsureEdge.Domain       → No project dependencies
InsureEdge.Workers      → Application, Infrastructure, Domain
```

**Enforcement:** Roslyn analyzers (NetArchTest or ArchUnitNET) in CI pipeline to prevent cross-layer violations (e.g., `Application` referencing `Infrastructure` directly).

---

## 2. Domain Service Decomposition

### 2.1 Module Map (7 Domains → Projects-within-Projects pattern)

Each domain is a **folder module** within `InsureEdge.Application` and `InsureEdge.Infrastructure`. There are no separate .csproj files per domain — this is a modular monolith, not microservices. Domain boundaries are enforced by namespace conventions and architecture fitness functions.

```
InsureEdge.Application/
├── Policy/
│   ├── Services/            QuoteService, PolicyBindingService, EndorsementService,
│   │                        RenewalService, CancellationService, BulkUploadService
│   ├── DTOs/                QuoteDto, PolicyDto, EndorsementDto, CoverageDto
│   └── Validators/          Zod-equivalent: FluentValidation validators per request
├── Claims/
│   ├── Services/            FnolService, ClaimWorkflowService, WorksheetService,
│   │                        DisbursementService, CatastropheService
│   ├── DTOs/
│   └── Validators/
├── Billing/
│   ├── Services/            PremiumPaymentService, PaymentPlanService,
│   │                        RefundService, FailedPaymentService
│   ├── DTOs/
│   └── Validators/
├── Distribution/
│   ├── Services/            IntermediaryService, ProducerService,
│   │                        CommissionService, DisburseCloudService
│   ├── DTOs/
│   └── Validators/
├── Identity/
│   ├── Services/            UserService, GroupService, PermissionService,
│   │                        AuthenticationService, AuditService
│   ├── DTOs/
│   └── Validators/
├── Documents/
│   ├── Services/            DocumentGenerationService, DocumentStorageService,
│   │                        DocumentAccessService
│   ├── DTOs/
│   └── Validators/
└── Administration/
    ├── Services/             TenantProvisioningService, ProductCatalogService,
    │                         ConfigurationService, TimerControlService
    ├── DTOs/
    └── Validators/
```

### 2.2 Shared Infrastructure Services (cross-domain)

```
InsureEdge.Infrastructure/
├── Persistence/
│   ├── InsureEdgeDbContext.cs          ← EF Core DbContext (operational schema)
│   ├── InsureEdgeSystemDbContext.cs    ← EF Core DbContext (system/tenant schema)
│   ├── Repositories/                  ← One IRepository<T> per aggregate root
│   └── Migrations/                    ← EF Core migrations (code-first)
├── ExternalServices/
│   ├── TranzPay/                      ← TranzPayClient.cs, TranzPayOptions.cs
│   ├── LenderDock/                    ← LenderDockClient.cs, LenderDockOptions.cs
│   ├── Plumsail/                      ← PlumsailClient.cs, PlumsailOptions.cs
│   ├── DisburseCloud/                 ← DisburseCloudClient.cs, token cache, webhook handler
│   ├── HexCat/                        ← HexCatClient.cs
│   ├── Geocoding/                     ← GoogleGeocodingClient.cs
│   ├── Rps/                           ← RpsRepository.cs (raw Npgsql, PostGIS query)
│   ├── Email/                         ← SmtpEmailClient.cs, EmailTemplateService.cs
│   └── BlobStorage/                   ← AzureBlobStorageService.cs
├── Security/
│   ├── EncryptionService.cs           ← AES-256-CBC + HMAC-256
│   └── PermissionCacheService.cs      ← Redis-backed permission cache
├── Caching/
│   └── RedisCacheService.cs           ← Wrapper for StackExchange.Redis
├── Configuration/
│   └── AppConfigurationService.cs     ← Azure App Configuration integration
└── Audit/
    └── AuditRepository.cs             ← Direct insert to AuditLog table (no EF tracking)
```

---

## 3. Repository Pattern for PostgreSQL

### 3.1 EF Core + Dapper Hybrid

**Decision (per ADR-002):**
- **EF Core 8 (Npgsql provider):** All standard CRUD operations, entity tracking, migrations, global query filters (tenant scoping, soft deletes).
- **Dapper:** Performance-critical raw SQL paths: HBRater rate table queries (rating engine reads), RPS PostGIS spatial queries, reporting aggregates, bulk migration queries.

**Rationale:** EF Core handles the 95% case with type safety and migration management. Dapper is used surgically where EF Core's query translation adds unnecessary overhead (spatial queries with PostGIS functions, complex multi-join aggregate reports).

### 3.2 DbContext Design

```csharp
public class InsureEdgeDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;

    // Operational DB entities (public schema)
    public DbSet<Policy> Policies { get; set; }
    public DbSet<PolicyPremium> PolicyPremiums { get; set; }
    public DbSet<PolicyPaymentTransaction> PolicyPaymentTransactions { get; set; }
    public DbSet<Claim> Claims { get; set; }
    public DbSet<Worksheet> Worksheets { get; set; }
    public DbSet<Intermediary> Intermediaries { get; set; }
    public DbSet<PolicyDocument> PolicyDocuments { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    // ... all 92+ operational tables

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Global query filter: tenant isolation for ALL tenant-scoped entities
        modelBuilder.Entity<Policy>()
            .HasQueryFilter(p => p.ClientId == _tenantContext.ClientId
                                 || _tenantContext.IsPlatformAdmin);

        // Add FK constraints missing from source (NFR-010)
        modelBuilder.Entity<Claim>()
            .HasOne(c => c.Policy)
            .WithMany(p => p.Claims)
            .HasForeignKey(c => c.PolicyId);

        modelBuilder.Entity<Worksheet>()
            .HasOne(w => w.Claim)
            .WithMany(c => c.Worksheets)
            .HasForeignKey(w => w.ClaimId);

        // Schema typo corrections (NFR-012): corrected names in EF config map to corrected DB columns
        modelBuilder.Entity<WritingCompany>().ToTable("WritingCompany"); // was WrittingCompany
        modelBuilder.Entity<PolicyCommission>()
            .Property(pc => pc.CommissionPercentage)
            .HasColumnName("CommissionPercentage"); // was ComissionPercentage
    }
}
```

### 3.3 Repository Interface Pattern

```csharp
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default);
    Task<T> AddAsync(T entity, CancellationToken ct = default);
    Task UpdateAsync(T entity, CancellationToken ct = default);
    Task DeleteAsync(T entity, CancellationToken ct = default);
}

// Domain-specific extensions
public interface IPolicyRepository : IRepository<Policy>
{
    Task<bool> HasActivePolicyAtRiskLocationAsync(int riskLocationId, int clientId, CancellationToken ct = default);
    Task<IReadOnlyList<Policy>> GetPoliciesExpiringWithinDaysAsync(int days, CancellationToken ct = default);
    Task<Policy?> GetWithPremiumAndTransactionsAsync(int policyId, CancellationToken ct = default);
}
```

### 3.4 Unit of Work

A lightweight `IUnitOfWork` wraps `InsureEdgeDbContext.SaveChangesAsync()`. Services call `_unitOfWork.SaveAsync()` at the end of a write operation — they never call `SaveChanges` directly. This enables testable, mock-injectable repositories.

---

## 4. Multi-Tenancy Middleware

### 4.1 Tenant Resolution Pipeline

```
HTTP Request
    │
    ▼
JWT Authentication Middleware
    │ Validates Bearer token signature; populates HttpContext.User
    ▼
TenantResolutionMiddleware
    │ Reads UserId from ClaimTypes.NameIdentifier
    │ Reads ClientId, Role, IntermediaryId, AdjusterId from JWT custom claims
    │ Constructs TenantContext; validates ClientId ≠ 0 (throws 401 if null)
    │ Registers ITenantContext (scoped) in DI container for this request
    ▼
PermissionAuthorizationMiddleware (on protected routes)
    │ Reads [RequirePermission(screenCode, flag)] attribute from controller action
    │ Calls PermissionEvaluationService.HasPermissionAsync(userId, screenCode, flag)
    │ Returns 403 Forbidden if flag is false
    ▼
Controller Action
```

### 4.2 `ITenantContext` Interface

```csharp
public interface ITenantContext
{
    int ClientId { get; }
    int UserId { get; }
    string Role { get; }
    int? IntermediaryId { get; }
    int? AdjusterId { get; }
    bool IsPlatformAdmin { get; }
    int? TargetClientId { get; }  // PlatformAdmin cross-tenant operations — from X-Target-Client-Id header
}
```

### 4.3 EF Core Global Filter with PlatformAdmin Bypass

The EF Core global filter checks `_tenantContext.IsPlatformAdmin`. When true, the filter returns all records (no ClientId restriction). All PlatformAdmin unscoped queries are preceded by an audit log write via `AuditService.LogCrossTenantAccessAsync()`.

---

## 5. Background Job Strategy — All 11 Timer Jobs

### 5.1 Hangfire Configuration

```csharp
// Startup
services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(hangfireConnectionString));

services.AddHangfireServer(options =>
{
    options.WorkerCount = 5;  // Conservative for 100-user scale
    options.Queues = new[] { "critical", "default", "background" };
});
```

### 5.2 Timer Job Registry — All 11 Jobs

| Job ID | Class Name | Cron Schedule | Queue | Config Key | Business Trigger |
|--------|-----------|---------------|-------|-----------|-----------------|
| T-01 | `RenewalQuoteGeneratorJob` | `0 2 * * *` (2 AM daily) | critical | `Timer:RenewalQuoteGeneratorEnabled` | 90 days before policy expiry |
| T-02 | `RenewalNotificationSenderJob` | `0 3 * * *` (3 AM daily) | default | `Timer:RenewalNotificationSenderEnabled` | Draft renewal quotes pending producer email |
| T-03 | `NonRenewalNoticeSenderJob` | `0 4 * * *` (4 AM daily) | default | `Timer:NonRenewalNoticeSenderEnabled` | 60 days before expiry, non-renewal decision |
| T-04 | `PolicyExpiryProcessorJob` | `0 1 * * *` (1 AM daily) | critical | `Timer:PolicyExpiryProcessorEnabled` | Mark Non-Renewed 90 days post-expiry |
| T-05 | `QuoteExpiryProcessorJob` | `0 5 * * *` (5 AM daily) | default | `Timer:QuoteExpiryProcessorEnabled` | Expire draft quotes past threshold (30/90 days) |
| T-06 | `AutoCancellationProcessorJob` | `0 6 * * *` (6 AM daily) | critical | `Timer:AutoCancellationProcessorEnabled` | 30 days after missed payment |
| T-07 | `PolicyExpiredStatusUpdaterJob` | `0 0 * * *` (midnight) | critical | `Timer:PolicyExpiredStatusUpdaterEnabled` | Mark Expired 1 day after ExpirationDate |
| T-08 | `InstallmentPaymentProcessorJob` | `0 8 * * *` (8 AM daily) | critical | `Timer:InstallmentPaymentProcessorEnabled` | Recurring installment collections via TranzPay |
| T-09 | `TranzPayCallbackReconcilerJob` | `0 */4 * * *` (every 4 hours) | critical | `Timer:TranzPayCallbackReconcilerEnabled` | Poll for unresolved Pending transactions |
| T-10 | `BulkUploadProcessorJob` | `0 7 * * *` (7 AM daily) | background | `Timer:BulkUploadProcessorEnabled` | Process pending BulkUploadDump records |
| T-11 | `CommissionDisbursementProcessorJob` | `0 9 * * 1` (9 AM Monday) | default | `Timer:CommissionDisbursementProcessorEnabled` | Weekly commission disbursement to DisburseCloud |

**Note:** All schedules are initial design values. Actual schedules must be confirmed with the customer (QST open). Cron expressions are stored in Hangfire configuration, not hardcoded.

### 5.3 Kill Switch Implementation

All job execute methods begin with:
```csharp
public async Task ExecuteAsync(CancellationToken ct)
{
    var globalEnabled = await _config.GetValueAsync<bool>("Timer:GlobalEnabled", ct);
    var jobEnabled = await _config.GetValueAsync<bool>($"Timer:{JobKey}Enabled", ct);

    if (!globalEnabled || !jobEnabled)
    {
        _logger.LogInformation("Job {JobKey} skipped: disabled by configuration.", JobKey);
        return;
    }
    // ... actual job logic
}
```

Configuration values read from Azure App Configuration at execution time — changes take effect on next run without redeployment.

### 5.4 Threshold Values (All Configurable)

| Threshold | Config Key | Default | Source |
|-----------|-----------|---------|--------|
| Renewal quote lead days | `Policy:RenewalLeadDays` | 90 | BR-POL-T01 |
| Non-renewal notice lead days | `Policy:NonRenewalNoticeDays` | 60 | BR-POL-T05 |
| Mark non-renewed after expiry days | `Policy:MarkNonRenewedAfterDays` | 90 | BR-POL-T04 |
| New business quote expiry days | `Policy:NewBusinessQuoteExpiryDays` | 90 | BR-POL-T06 |
| Endorsement quote expiry days | `Policy:EndorsementQuoteExpiryDays` | 90 | BR-POL-T08 |
| Renewal quote expiry days | `Policy:RenewalQuoteExpiryDays` | 30 | BR-POL-T07 |
| Auto-cancellation grace days | `Policy:AutoCancellationGraceDays` | 30 | FR-D1-021 |
| Policy expired transition delay days | `Policy:ExpiredTransitionDays` | 1 | FR-D1-022 |
| Policy fee | `Policy:PolicyFee` | 195.00 | BR-POL-T09 |
| TranzPay callback reconcile timeout (hours) | `TranzPay:CallbackTimeoutHours` | 4 | ART-2-012 §1.6 |

---

## 6. Permission Evaluation Service

### 6.1 Design

Permissions are NOT embedded in the JWT (too large for 65+ screens × 10 flags × N groups). They are loaded once at login and cached in Redis per user.

```csharp
public class PermissionEvaluationService : IPermissionEvaluationService
{
    private readonly IRedisCache _cache;
    private readonly InsureEdgeSystemDbContext _systemDb;

    public async Task<PermissionFlags> GetPermissionsAsync(
        int userId, string screenCode, CancellationToken ct = default)
    {
        // 1. Try Redis cache (TTL: 15 minutes)
        var cacheKey = $"perms:{userId}:{screenCode}";
        var cached = await _cache.GetAsync<PermissionFlags>(cacheKey, ct);
        if (cached is not null) return cached;

        // 2. Cache miss: compute from ScreenPermissions table
        // Union of all permission flags across all groups the user belongs to
        var permissions = await _systemDb.ScreenPermissions
            .Where(sp => sp.ClientId == _tenantCtx.ClientId
                         && sp.Screen.ScreenCode == screenCode
                         && _systemDb.GroupUser_Table
                             .Any(gu => gu.UserId == userId && gu.GroupId == sp.GroupId))
            .Select(sp => new PermissionFlags { ... })
            .ToListAsync(ct);

        var effective = permissions.Aggregate(PermissionFlags.None, (acc, p) => acc.Union(p));

        // 3. Cache result
        await _cache.SetAsync(cacheKey, effective, TimeSpan.FromMinutes(15), ct);
        return effective;
    }

    public async Task InvalidateUserPermissionsAsync(int userId, CancellationToken ct = default)
    {
        // Called synchronously on group membership change (NFR-006)
        var pattern = $"perms:{userId}:*";
        await _cache.DeletePatternAsync(pattern, ct);
    }
}
```

### 6.2 Permission Attribute

```csharp
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequirePermissionAttribute : Attribute
{
    public string ScreenCode { get; }
    public PermissionFlag Flag { get; }
    public RequirePermissionAttribute(string screenCode, PermissionFlag flag) { ... }
}

// Usage on controller actions:
[HttpPost("bind")]
[RequirePermission("POLICY_LIST", PermissionFlag.Create)]
public async Task<IActionResult> BindPolicy([FromBody] BindPolicyRequest request) { ... }
```

### 6.3 API-Layer Sensitive Field Redaction (NFR-005)

Sensitive fields are redacted at the serialization layer using a custom JSON converter, not at the application logic layer:

```csharp
[SensitiveField("ACCOUNT_DETAIL", PermissionFlag.ViewSensitiveInfo)]
public string? SocialSecurityNumber { get; set; }

// SensitiveFieldJsonConverter reads the attribute, checks ITenantContext.EffectivePermissions,
// and replaces the value with "****" if the user lacks the permission.
```

This ensures that even if a developer forgets to filter a field in a service method, the serialization layer enforces the redaction.

---

## 7. Encryption Service (AES-256 Equivalent)

### 7.1 Design

The source system uses `RssExtensionCryptoAPI` (OutSystems extension implementing AES-256-CBC + HMAC-256 Encrypt-then-MAC). The target implements the same algorithm natively in .NET to ensure encrypted values migrated from the source can be decrypted.

```csharp
public interface IEncryptionService
{
    string Encrypt(string plaintext);
    string Decrypt(string ciphertext);
    bool CanDecryptMigratedValue(string sourceCiphertext);  // Compatibility for migrated data
}

public class AesEncryptionService : IEncryptionService
{
    // Algorithm: AES-256-CBC + HMAC-SHA256 (Encrypt-then-MAC)
    // Padding: PKCS7
    // Key: retrieved from Azure Key Vault (Encryption:Base64Key)
    // IV: generated randomly per encrypt call, prepended to output
    // MAC: computed over (IV || Ciphertext), appended after ciphertext
    // Storage format (Base64): IV (16 bytes) + Ciphertext (N bytes) + HMAC (32 bytes)

    public string Encrypt(string plaintext)
    {
        using var aes = Aes.Create();
        aes.KeySize = 256;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;
        aes.Key = _key;  // From Key Vault
        aes.GenerateIV();

        // Encrypt
        using var encryptor = aes.CreateEncryptor();
        var ciphertext = encryptor.TransformFinalBlock(Encoding.UTF8.GetBytes(plaintext), 0, plaintext.Length);

        // Compute HMAC-SHA256 over IV || ciphertext
        using var hmac = new HMACSHA256(_key);
        var mac = hmac.ComputeHash(aes.IV.Concat(ciphertext).ToArray());

        // Return Base64(IV || ciphertext || MAC)
        return Convert.ToBase64String(aes.IV.Concat(ciphertext).Concat(mac).ToArray());
    }

    public string Decrypt(string ciphertext) { /* Reverse of above, verify MAC before decrypt */ }
}
```

**Fields requiring encryption (from ART-1-001):**
- `BankDetail.AccountNumber`
- `BankDetail.RoutingNumber`
- `Account.SocialSecurityNumber` (SSN/TIN where present)
- URL parameters containing UserId, GroupId (for safe sharing)

### 7.2 Key Rotation Strategy

- Key stored in Azure Key Vault with version history.
- Active version used for all new encryptions.
- Decrypt accepts any valid key version (Key Vault key version history preserved).
- Rotation runbook: generate new key version → update Key Vault → restart application (picks up new version) → background job re-encrypts all stored values with new key version.
- Key rotation is a TRANSFER-phase deliverable item.

---

## 8. Caching Strategy

### 8.1 Redis Cache Usage

| Cache Category | Key Pattern | TTL | Invalidation Trigger |
|---|---|---|---|
| Permission map per user/screen | `perms:{userId}:{screenCode}` | 15 min | Group membership change (synchronous) |
| HBRater rate tables (all 5) | `rater:lr-hexzones`, `rater:hr-hexzone`, `rater:state-tax`, `rater:flood`, `rater:wildfire` | 24 hours | Admin rate table update |
| RPS query results | `rps:{lat:4dp}:{lon:4dp}` | 7 days (raster is static) | Manual cache clear only |
| Geocoding results | `geo:{addressHash}` | 30 days | Not needed — addresses are immutable once geocoded |
| Lookup/reference data | `lookup:{type}:{clientId}` | 1 hour | Admin update to reference data |
| DisburseCloud auth token | `disburse:token:{clientId}` | 55 min (expires_in - 5 min) | Token expiry (auto-refresh) |

### 8.2 Cache-Aside Pattern for Rate Tables

HBRater rate tables are read-heavy (every quote calculation) and write-once (rate updates are infrequent admin operations). The `RatingEngineService` loads all rate tables into Redis on startup and on admin-triggered refresh. Cache misses fall back to DB read.

### 8.3 Cache-First Permission Read with Synchronous Invalidation (NFR-006)

Permission cache invalidation for a user on group removal is synchronous within the database transaction:

```csharp
// In GroupService.RemoveUserFromGroupAsync()
await using var transaction = await _unitOfWork.BeginTransactionAsync();
try {
    await _groupRepo.RemoveUserAsync(groupId, userId);
    await _permissionCache.InvalidateUserPermissionsAsync(userId);  // Redis DEL before commit
    await _unitOfWork.SaveAsync();
    await transaction.CommitAsync();
} catch {
    await transaction.RollbackAsync();
    throw;
}
```

If Redis DEL fails, the transaction rolls back (group removal does not occur). This ensures privilege revocation and group removal are atomic — the removed user never has a window of retained access.

---

## 9. Integration Clients — Design Patterns

### 9.1 HTTP Client Patterns (All Outbound REST Integrations)

All outbound REST clients use `IHttpClientFactory` with typed clients:

```csharp
services.AddHttpClient<TranzPayClient>(client => {
    client.BaseAddress = new Uri(keyVault["TranzPay:BaseUrl"]);
    client.Timeout = TimeSpan.FromSeconds(30);
})
.AddPolicyHandler(GetRetryPolicy())       // Polly: 3 retries, exponential backoff
.AddPolicyHandler(GetCircuitBreakerPolicy()); // Polly: 5 failures in 30s → open circuit 60s
```

**Retry policy (all integrations):** 3 retries, exponential backoff (1s, 2s, 4s), jitter, on `HttpRequestException` or 5xx responses.

**Circuit breaker (all integrations):** Opens after 5 consecutive failures within 30 seconds; half-open after 60 seconds.

**Dead-letter pattern (LenderDock, Email):** Critical notifications that fail all retries are written to a `FailedNotification` table and retried by the `TranzPayCallbackReconcilerJob` (for payment) or a dedicated retry pass in each timer job.

### 9.2 DisburseCloud Token Management

DisburseCloud uses a 3600-second Bearer token. The `DisburseCloudClient` uses a `CachedTokenProvider`:
- Token stored in Redis (`disburse:token:{clientId}`) with TTL = 3595 seconds (5-second buffer before expiry)
- Each API call checks the cache; on miss, re-authenticates and caches new token
- Long-running disbursement batches (T-11) check token freshness before each payee creation call

### 9.3 LenderDock Notification Retry Tracking

The `NotifyLenderdock` table (confirmed in ERD — EV-0-0234) tracks retry state. The `LenderDockService` writes a retry record on first failure and increments `RetryCounter`. The nightly retry sweep (embedded in T-11 or a separate pass within T-04/T-06 depending on notification type) re-processes notifications where `RetryCounter < MaxRetries` and `ResponseCode` is not success.

---

## 10. API Design Conventions

### 10.1 Versioning

All routes prefixed `/api/v1/`. Version via URL prefix (not header). When a breaking change is required, `/api/v2/` is introduced.

### 10.2 Response Format

```json
{
  "success": true,
  "data": { ... },
  "errors": [],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "totalCount": 143
  }
}
```

Error response:
```json
{
  "success": false,
  "data": null,
  "errors": [
    { "code": "DUPLICATE_POLICY", "message": "An active policy already exists for this risk location.", "field": "riskLocationId" }
  ]
}
```

### 10.3 Pagination

All list endpoints paginated: `?page=1&pageSize=25`. Default page size: 25. Maximum: 100.

### 10.4 Webhook Endpoints

| Endpoint | Source | Idempotency Key |
|---|---|---|
| `POST /api/webhooks/tranzpay/callback` | TranzPay | `ThirdPartyCallID` |
| `POST /api/webhooks/disburse/callback` | DisburseCloud | `disbursement_uuid` + event type |

Both webhook handlers:
1. Validate payload signature/origin (IP allowlist where provider supports it)
2. Persist raw payload to audit table BEFORE processing
3. Return `200 OK` immediately to prevent provider retries on processing delay
4. Process asynchronously via internal queue (MediatR notification or Hangfire enqueue)

---

## 11. Error Handling and Validation

### 11.1 Global Exception Handler

`UseExceptionHandler` middleware catches all unhandled exceptions. Maps domain exceptions to HTTP status codes:

| Exception Type | HTTP Status | Notes |
|---|---|---|
| `EntityNotFoundException` | 404 | Resource not found |
| `TenantAccessDeniedException` | 403 | Cross-tenant access attempt |
| `PermissionDeniedException` | 403 | Insufficient permission flag |
| `DuplicatePolicyException` | 409 | Duplicate active policy at risk location |
| `ValidationException` | 422 | FluentValidation failures with field details |
| `IntegrationException` | 502 | External service unavailable (TranzPay, etc.) |
| `Exception` (unhandled) | 500 | Logged to Application Insights; sanitized response returned |

### 11.2 FluentValidation

All request DTOs validated with FluentValidation before reaching the service layer. Registered in DI as `services.AddValidatorsFromAssemblyContaining<QuoteRequest>()`. Executed via MediatR pipeline behavior or ASP.NET Core model validation.

---

*End of ART-3-005 — Backend Architecture | INSUREEDGE-2026 | IDEATE Phase | 2026-06-17*
