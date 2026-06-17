# ART-3-010 — Observability Architecture
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Architecture Agent
**Phase:** IDEATE
**Date:** 2026-06-17
**Version:** 1.0 — GATE CANDIDATE

---

## 1. Logging Strategy

### 1.1 Structured Logging

All application logging uses `Microsoft.Extensions.Logging` with structured (semantic) logging via **Serilog** configured with:
- **Console sink** (development): human-readable output
- **Azure Application Insights sink** (all environments): `Serilog.Sinks.ApplicationInsights`
- **File sink** (optional fallback): rolling daily file, retained 7 days

**Log levels by environment:**

| Environment | Minimum Level | Details |
|---|---|---|
| Dev | Debug | Full diagnostic output |
| QA | Information | All business events and warnings |
| UAT | Warning | Warnings and errors only (reduces noise) |
| Prod | Warning | Warnings and errors; specific Information emitters for business events |

### 1.2 Log Enrichment

All log entries automatically enriched with:
```
{
  "Timestamp": "2026-06-17T10:23:44.123Z",
  "Level": "Information",
  "Message": "Policy bound successfully",
  "Environment": "Production",
  "ApplicationVersion": "1.2.3",
  "ClientId": 7,
  "UserId": 142,
  "Role": "ClientAdmin",
  "CorrelationId": "abc-123-def-456",   ← from X-Correlation-ID header or generated
  "RequestPath": "/api/v1/policies/bind",
  "PolicyId": 9834,
  "TransactionType": "Binding"
}
```

Sensitive fields (SSN, card numbers, passwords) are **never** logged. Log scrubbing via a Serilog destructuring policy.

### 1.3 Key Business Event Log Points

| Log Point | Level | Structured Fields |
|---|---|---|
| Quote created | Info | `quoteId`, `insuredType`, `clientId`, `producerId` |
| Risk location geocoded | Info | `riskLocationId`, `lat`, `lon`, `geocodingService` |
| HexCat result received | Info | `policyId`, `hexCatStatus`, `latencyMs` |
| RPS score retrieved | Info | `riskLocationId`, `rpsValue` (or `OutOfCoverage`) |
| Policy bound | Info | `policyId`, `policyNumber`, `premiumAmount`, `clientId` |
| Payment initiated | Info | `policyId`, `thirdPartyCallId`, `paymentType`, `amount` |
| Payment callback received | Info | `thirdPartyCallId`, `status`, `responseCode` |
| Payment failed | Warning | `policyId`, `thirdPartyCallId`, `responseCode`, `failReason` |
| Endorsement applied | Info | `policyId`, `endorsementId`, `premiumDelta` |
| Policy cancelled | Info | `policyId`, `cancellationType`, `refundAmount` |
| FNOL registered | Info | `claimId`, `claimNumber`, `policyId`, `lossDate` |
| Claim disbursement sent | Info | `claimId`, `disbursementId`, `amount`, `payeeType` |
| Timer job started | Info | `jobName`, `jobId`, `scheduledAt` |
| Timer job completed | Info | `jobName`, `jobId`, `durationMs`, `recordsProcessed`, `errorsCount` |
| Timer job disabled by kill switch | Warning | `jobName`, `configKey` |
| Integration call failed | Warning | `integration`, `endpoint`, `statusCode`, `attempt`, `errorMessage` |
| Integration circuit open | Error | `integration`, `openedAt`, `failureCount` |
| Cross-tenant access (PlatformAdmin) | Info | `userId`, `targetClientId`, `action`, `entityType`, `entityId` |
| Permission denied | Warning | `userId`, `screenCode`, `requiredFlag`, `requestPath` |

---

## 2. Audit Trail Architecture

### 2.1 Audit Log Design

The source system has an `AuditLog` table (ART-1-001 §3). The target improves on this with:
- **Immutable writes only:** `AuditLog` table has no UPDATE or DELETE permissions for any application role. INSERT only. PlatformAdmin can query but not modify.
- **Dedicated `AuditRepository`:** Direct `DbContext.Database.ExecuteSqlRawAsync` insert — bypasses EF Core change tracking (no accidental update risk).
- **Cross-tenant audit entry:** PlatformAdmin actions on a specific tenant's data include `TargetClientId` in the audit record (RSK-1-SEC-009 remediation).

### 2.2 `AuditLog` Target Schema

```sql
CREATE TABLE system.audit_log (
    audit_log_id    BIGSERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    client_id       INTEGER,              -- null for truly global operations
    target_client_id INTEGER,             -- non-null when PlatformAdmin operates cross-tenant
    action_type     VARCHAR(100) NOT NULL, -- CREATE, UPDATE, DELETE, VIEW_SENSITIVE, LOGIN, etc.
    entity_type     VARCHAR(100) NOT NULL,
    entity_id       VARCHAR(100) NOT NULL,
    session_id      VARCHAR(200),
    module_name     VARCHAR(100),
    correlation_id  VARCHAR(100),
    ip_address      VARCHAR(50),
    user_agent      VARCHAR(500),
    old_values      JSONB,                -- snapshot before change (sensitive fields omitted)
    new_values      JSONB,                -- snapshot after change (sensitive fields omitted)
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_audit_log_user_ts ON system.audit_log (user_id, timestamp DESC);
CREATE INDEX ix_audit_log_entity ON system.audit_log (entity_type, entity_id);
CREATE INDEX ix_audit_log_client_ts ON system.audit_log (client_id, timestamp DESC);
```

### 2.3 Audit Events Required (NFR-008)

| Event Category | Examples |
|---|---|
| Authentication | Login, logout, login failure, MFA challenge, password change |
| User management | User created, role changed, group added/removed, user deactivated |
| Permission changes | Group permission updated, AllAccess flag set |
| Policy lifecycle | Quote created, policy bound, endorsement applied, renewal bound, cancellation |
| Financial | Payment collected, refund issued, disbursement created, installment processed |
| Document access | Document downloaded, sensitive document accessed |
| Claims | FNOL registered, claim status changed, worksheet approved/rejected, disbursement |
| Administration | Tenant provisioned, product activated/deactivated, configuration value changed, timer enabled/disabled |
| PlatformAdmin cross-tenant | Any operation where `TargetClientId != null` |
| Security events | Permission denied, suspicious cross-tenant attempt, token refresh failure |

### 2.4 `AuditService` Design

```csharp
public interface IAuditService
{
    Task LogAsync(AuditEvent auditEvent, CancellationToken ct = default);
}

// Called via MediatR pipeline behavior on all command handlers:
public class AuditBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, ...)
    {
        var response = await next();
        if (request is IAuditableCommand auditable)
            await _auditService.LogAsync(auditable.ToAuditEvent(_tenantContext), ct);
        return response;
    }
}
```

---

## 3. Health Checks

### 3.1 Health Check Endpoints

| Endpoint | Purpose | Exposed To |
|---|---|---|
| `GET /health` | Liveness probe — is the process alive? | Azure App Service, Application Gateway health probe |
| `GET /health/ready` | Readiness probe — is the app ready to serve traffic? | Deployment slot swap check, Load balancer |
| `GET /health/detail` | Detailed health including dependencies | Ops team only (restricted by IP/auth) |

### 3.2 Readiness Check Components

```csharp
services.AddHealthChecks()
    .AddNpgSql(connectionString, name: "postgresql", tags: ["critical"])
    .AddRedis(redisConnectionString, name: "redis", tags: ["non-critical"])
    .AddAzureBlobStorage(blobOptions, name: "blob-storage", tags: ["critical"])
    .AddHangfire(options => { options.MinimumAvailableServers = 1; }, name: "hangfire", tags: ["non-critical"])
    .AddCheck<KeyVaultHealthCheck>("keyvault", tags: ["critical"]);
```

Readiness: `critical` checks failing → returns 503 (App Service removes from rotation).
Non-critical checks failing → returns 200 with degraded status (app continues serving).

### 3.3 Hangfire Dashboard

Available at `/hangfire` (PlatformAdmin role required — custom `IDashboardAuthorizationFilter`). Shows:
- Job execution history (24 hours)
- Failed jobs queue with exception details
- Timer job run times and record counts
- Per-queue concurrency

---

## 4. Alerting

### 4.1 Alert Rules (Azure Monitor)

| Alert | Condition | Severity | Action Group |
|---|---|---|---|
| High error rate | `exceptions/count > 10 per 5 minutes` | Critical | PagerDuty / email ops team |
| Slow responses | `requests/duration P95 > 5000ms` (threshold pending NFR-016) | High | Email ops team |
| Availability failure | Synthetic test from 2 regions failing | Critical | PagerDuty |
| Payment integration failure | Custom metric `integration.tranzpay.failure_count > 3 per 10 min` | Critical | PagerDuty + email ops |
| Timer job failure | Hangfire custom metric `job.failure_count > 0` for T-01, T-06, T-07, T-08 (critical jobs) | High | Email ops team |
| PostgreSQL CPU > 80% | Azure Monitor DB metric | High | Email ops team |
| Low funds (DisburseCloud) | Custom log alert: `"LOW_FUNDS_ERROR"` in Application Insights | Critical | Email finance team |
| Key Vault access failure | Activity log alert: Key Vault `SecretGet` 403 from App Service MI | Critical | PagerDuty |

### 4.2 Custom Metrics (Application Insights)

| Metric Name | What It Measures |
|---|---|
| `policy.quotes.created` | Quote creation rate |
| `policy.bindings.completed` | Policy binding success rate |
| `payment.tranzpay.latency_ms` | TranzPay hosted redirect response time |
| `payment.tranzpay.callback_delay_ms` | Time from initiate to callback receipt |
| `integration.lenderdock.retry_count` | LenderDock notification retry rate |
| `job.{jobName}.duration_ms` | Per-timer job execution duration |
| `job.{jobName}.records_processed` | Records affected per job run |
| `job.{jobName}.errors` | Errors per job run |
| `rps.query.latency_ms` | RPS PostGIS query latency |
| `geocoding.latency_ms` | Google Geocoding API response time |

---

## 5. Integration Observability

All external integration calls instrumented via Application Insights Dependency Telemetry (automatic via `HttpClient` + Application Insights SDK). Custom properties added to dependency telemetry:

```csharp
using var operation = _telemetryClient.StartOperation<DependencyTelemetry>("TranzPay.InitiatePayment");
operation.Telemetry.Type = "HTTP";
operation.Telemetry.Target = "tranzpay.com";
operation.Telemetry.Properties["PolicyId"] = policyId.ToString();
operation.Telemetry.Properties["PaymentType"] = paymentType;
// ... make HTTP call ...
operation.Telemetry.Success = response.IsSuccessStatusCode;
```

This enables per-integration failure dashboards in Application Insights.

---

*End of ART-3-010 — Observability Architecture | INSUREEDGE-2026 | IDEATE Phase | 2026-06-17*
