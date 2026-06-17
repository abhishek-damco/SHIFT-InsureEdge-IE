# ART-5-006 — Support Runbook
## InsureEdge Application Modernization (INSUREEDGE-2026)

**Status:** AI_GENERATED
**Produced by:** Transfer Agent
**Phase:** TRANSFER
**Date:** 2026-06-17
**Version:** 1.0
**Engagement:** INSUREEDGE-2026 | Customer: Hudson Bailey
**Source:** ART-3-010 (Observability), ART-3-009 (Infrastructure), ART-3-012 (TAD), ART-4-008 (Deployment Specs)

---

## Section 1: System Overview

InsureEdge is a multi-tenant insurance management platform serving the Hudson Bailey writing company (producer: hudsonbaileydemo). It manages the full insurance lifecycle: quoting, policy binding, endorsements, renewals, cancellations, claims, billing, payments, and document generation.

**Architecture summary:**

```
Internet Users
      |
Azure Application Gateway (WAF v2, OWASP 3.2) — SSL termination, L7 routing
      |
      +-- /                   --> Azure Static Web Apps (React 18 SPA, Vite)
      +-- /api/*              --> Azure App Service Linux P2v3 (ASP.NET Core .NET 8)
                                        |
              +------------------------+-----------------+
              |                        |                 |
  Azure PostgreSQL Flexible   Azure Cache for Redis  Azure Blob Storage
  Server (D4s_v3, Zone-HA)    Standard C1            (GRS, 5 containers)
  +-- public schema (ops)     permissions, rate       policy/claim docs,
  +-- system schema (auth)    tables, tokens          logos, uploads
  +-- gis (PostGIS, RPS)
              |
  Azure Key Vault (prod)    Azure App Configuration
  22 named secrets           timer flags, thresholds
              |
  Azure Application Insights
  logs, metrics, availability tests, 14 custom metrics
```

**Key facts for ops:**
- Single Azure region deployment (region TBD — DBT-4-FORGE pending)
- 100 concurrent users at peak (ASM-3-ARCH-001)
- 11 background jobs (Hangfire) run on schedules
- 10 external integrations (TranzPay, LenderDock, HexCat, Plumsail, DisburseCloud, Google Maps, Azure Blob, SMTP, RPS/PostGIS, Azure App Config)
- Row-level tenant isolation: `ClientId` enforced by EF Core global query filters
- All secrets in Azure Key Vault; no hardcoded credentials anywhere

**Repository:** GitHub (see ART-4-001 for structure)
**CI/CD:** 5 GitHub Actions workflows (ci.yml, deploy-dev.yml, deploy-staging.yml, deploy-prod.yml, db-migrate.yml)

---

## Section 2: Monitoring

### 2.1 Azure Application Insights Dashboards

Access: Azure Portal → Application Insights → `ai-insuredge-prod` → Dashboards.

**Primary dashboards to watch:**

| Dashboard / View | What to Monitor | Target |
|---|---|---|
| Live Metrics | Real-time requests/sec, failed requests, server response time, CPU | Baseline established after go-live |
| Performance | P50, P90, P95, P99 response times per endpoint | P95 < 500 ms (ART-3-010; note: final SLA pending NFR-016 resolution) |
| Failures | Exception count, dependency failures, failed requests | Error rate < 1% of requests |
| Availability | Synthetic availability tests from 2 Azure regions | 100% pass rate; alert fires on any failure |
| Custom Metrics | Payment flow, job metrics, integration latency | See §2.2 |

### 2.2 Key Metrics to Watch

| Metric | Source | Alert Threshold | Severity |
|---|---|---|---|
| API response time P95 | Application Insights requests | > 5,000 ms (threshold pending NFR-016) | High |
| Error rate | `exceptions/count` | > 10 per 5 minutes | Critical |
| Availability | Synthetic test (2 regions) | Any failure | Critical |
| Payment integration failure | Custom: `integration.tranzpay.failure_count` | > 3 per 10 minutes | Critical |
| Timer job failure | Hangfire custom metric: `job.failure_count > 0` for T-01, T-06, T-07, T-08 | > 0 | High |
| PostgreSQL CPU | Azure Monitor DB metric | > 80% sustained 5 min | High |
| DB connection pool saturation | `pg_stat_activity` active connections near max | > 80% of `max_connections` | High |
| Low funds (DisburseCloud) | Custom log alert: `LOW_FUNDS_ERROR` in Application Insights | Any occurrence | Critical |
| Key Vault access failure | Activity log: `SecretGet` 403 from App Service MI | Any occurrence | Critical |
| Blob storage access errors | Azure Monitor storage metric | Consecutive failures > 3 | High |
| Redis unavailability | Application Insights dependency failures for Redis | Any sustained failure | High |

### 2.3 Log Queries (Application Insights / Kusto)

**Find recent errors:**
```kusto
exceptions
| where timestamp > ago(1h)
| summarize count() by type, outerMessage
| order by count_ desc
```

**API endpoint performance:**
```kusto
requests
| where timestamp > ago(1h)
| summarize percentile(duration, 95) by name
| order by percentile_duration_95 desc
```

**Payment failures in last 24h:**
```kusto
customEvents
| where name == "PaymentFailed" and timestamp > ago(24h)
| project timestamp, tostring(customDimensions.PolicyId), tostring(customDimensions.FailReason)
```

**Cross-tenant access audit:**
```kusto
traces
| where message contains "Cross-tenant access"
| project timestamp, tostring(customDimensions.UserId), tostring(customDimensions.TargetClientId), tostring(customDimensions.Action)
```

---

## Section 3: Alert Runbook

For each alert, the following format applies: what triggered it, immediate action, escalation path.

### ALT-001: High Error Rate (Critical)
**Trigger:** `exceptions/count > 10 per 5 minutes` in Application Insights.
**Immediate action:** (1) Open Application Insights Failures blade — identify top exception type and source endpoint. (2) Check if correlated with a recent deployment (check GitHub Actions for recent `deploy-prod.yml` runs). (3) If deployment-related: trigger App Service slot re-swap (see §4.1 API rollback). (4) If not deployment-related: check DB connectivity, Key Vault access, Redis connectivity.
**Escalation:** Tech Lead → if unresolved within 15 min → escalate to Development team.

### ALT-002: Slow Response Time (High)
**Trigger:** P95 response time > 5,000 ms sustained.
**Immediate action:** (1) Check Application Insights Performance → identify slow endpoints. (2) Check PostgreSQL CPU and connection pool. (3) Check if a long-running Hangfire job is consuming DB connections. (4) Check Redis cache hit rate — low hit rate increases DB load.
**Escalation:** Tech Lead → if DB issue → DBA.

### ALT-003: Availability Failure (Critical)
**Trigger:** Synthetic availability test fails from ≥1 region.
**Immediate action:** (1) Check Azure App Service status: `az webapp show --resource-group rg-insuredge-prod --name api-insuredge-prod --query state`. (2) Check Application Gateway health probe. (3) Attempt manual `curl https://api.insuredge.example.com/health`. (4) If App Service is stopped: restart via `az webapp start`.
**Escalation:** DevOps on-call → if infrastructure issue → Azure support.

### ALT-004: Payment Integration Failure (Critical)
**Trigger:** `integration.tranzpay.failure_count > 3 per 10 min`.
**Immediate action:** See §4.1 (Payment processing failure playbook).
**Escalation:** Integration Lead → TranzPay support → escalate to management if prolonged.

### ALT-005: Timer Job Failure (High)
**Trigger:** Hangfire custom metric `job.failure_count > 0` for critical jobs (T-01, T-06, T-07, T-08).
**Immediate action:** See §4.2 (Policy renewal timer failure playbook).
**Escalation:** Tech Lead → Development team if job is consistently failing.

### ALT-006: PostgreSQL CPU > 80% (High)
**Trigger:** Azure Monitor DB CPU alert.
**Immediate action:** (1) Connect to PostgreSQL and run `SELECT pid, query, state, wait_event_type FROM pg_stat_activity WHERE state != 'idle';` to find long-running queries. (2) Kill blocking queries if necessary: `SELECT pg_terminate_backend(pid) WHERE ...`. (3) Check if a Hangfire bulk job (e.g., T-01 renewal generator on large dataset) is the cause. (4) If sustained: consider scaling up to D8s_v3.
**Escalation:** DBA → Tech Lead.

### ALT-007: Low Funds (DisburseCloud) (Critical)
**Trigger:** `LOW_FUNDS_ERROR` string in Application Insights logs.
**Immediate action:** (1) Notify Finance team immediately. (2) Check DisburseCloud account balance. (3) Pause disbursement Hangfire jobs (T-07, T-08) via kill switch in Azure App Configuration (`timer:DisburseCloud:KillTimer = true`) until funds are topped up. (4) Re-enable jobs after top-up.
**Escalation:** Finance team → DisburseCloud account manager.

### ALT-008: Key Vault Access Failure (Critical)
**Trigger:** `SecretGet` 403 from App Service Managed Identity.
**Immediate action:** (1) Verify App Service Managed Identity is assigned to `insuredge-kv-prod` access policy. (2) Check if Key Vault access policy was accidentally modified. (3) If deleted: re-add Managed Identity with `Get`, `List` permissions. (4) Restart App Service to refresh credentials.
**Escalation:** DevOps → Security Lead.

---

## Section 4: Incident Response Playbooks

### 4.1 Payment Processing Failure (TranzPay Callback Not Received)

**Symptoms:** Payment initiation succeeds (redirect URL returned) but no callback received within expected window. `billing.payment_callback_responses` table shows no matching `third_party_call_id` record. Customer reports payment "stuck."

**Investigation steps:**
1. Query: `SELECT * FROM billing.payment_callback_responses WHERE third_party_call_id = '{id}' ORDER BY received_on DESC LIMIT 5;`
2. Check Application Insights for `PaymentFailed` or `PaymentCallbackTimeout` events with the policy/call ID.
3. Verify PostBackUrl is reachable from TranzPay: confirm `BypassRefundResponse = FALSE` in App Configuration.
4. Check TranzPay sandbox/production status page (contact TranzPay support if callback not received after 30 minutes).
5. If TranzPay has confirmed payment but callback was lost: manually insert callback record and trigger reprocessing (requires DBA + Tech Lead approval).

**Production URL note:** Confirm `TranzPay--BaseUrl` in `insuredge-kv-prod` is the production URL — NOT `demo.tranzpay.com` (GAP-2-INT-001).

**Resolution:** If TranzPay confirms transaction success and callback was missed: create manual `payment_callback_responses` record with status `Success` after confirming with customer and Tech Lead sign-off. Log the manual override in AuditLog.

**Escalation:** Integration Lead → TranzPay support → Tech Lead for manual override decision.

---

### 4.2 Policy Renewal Timer Failure (Hangfire Job Missed)

**Symptoms:** Expected renewal quotes not generated for policies with expiry in 90 days. Hangfire dashboard shows failed jobs for T-01 (`RenewalQuoteGenerator`).

**Investigation steps:**
1. Access Hangfire dashboard: `https://api.insuredge.example.com/hangfire` (PlatformAdmin credentials required).
2. Navigate to "Failed" jobs → find T-01 failures → expand exception details.
3. Common causes:
   - DB connectivity: check PostgreSQL health.
   - Integration failure: HexCat call failed (policy requires risk scoring at renewal) — check `integration.hexcat.failure_count` metric.
   - Data issue: orphan policy or invalid PolicyStatusId preventing query.
4. Run manual job trigger from Hangfire dashboard (see §6 for instructions).
5. If HexCat is down: job will retry per Polly policy (3 attempts, exponential backoff). If all retries exhausted: job writes to `FailedNotification` table.

**Resolution:** Fix root cause → manually re-trigger from Hangfire dashboard. Confirm renewal quotes generated: `SELECT COUNT(*) FROM policy.policy WHERE policy_status_id = (SELECT policy_status_id FROM policy.policy_status WHERE status_name = 'Draft') AND created_on > NOW() - INTERVAL '1 day';`

**Escalation:** Tech Lead → if HexCat integration down → Integration Lead → HexCat vendor support.

---

### 4.3 Database Connectivity Loss

**Symptoms:** Application Insights shows spike in dependency failures for PostgreSQL. `/health/ready` endpoint returns 503 (critical dependency check fails for `postgresql`).

**Investigation steps:**
1. Check Azure Portal → PostgreSQL Flexible Server resource → Overview → Server status.
2. If "Zone-redundant standby failover in progress": wait up to 60 seconds for automatic failover. Application will reconnect after failover.
3. If server is stopped: restart via Azure Portal or `az postgres flexible-server start --resource-group rg-insuredge-prod --name psql-insuredge-prod`.
4. Check VNet connectivity: confirm App Service VNet integration is active and `db-subnet` NSG rules have not been modified.
5. Check connection pool saturation: `SELECT count(*), state FROM pg_stat_activity GROUP BY state;` — if `idle` connections are high, consider restarting App Service to release idle pool.

**Resolution:** Restore server connectivity. If App Service connection pool is stale: restart App Service (`az webapp restart`).

**Escalation:** DBA → Azure support (if PaaS issue) → DevOps for NSG investigation.

---

### 4.4 Blob Storage Unavailability

**Symptoms:** Document download/upload failures. Application Insights shows Azure Blob Storage dependency failures. `/health/ready` returns 503 or degraded.

**Investigation steps:**
1. Check Azure Portal → Storage Account → Overview → Status.
2. Check Azure Service Health dashboard for Blob Storage outage in the deployment region.
3. Verify Managed Identity permissions: `az role assignment list --assignee {app-service-mi-object-id}` — should include `Storage Blob Data Contributor` role on the storage account.
4. Test connectivity: attempt to list containers via `az storage blob list --account-name {account} --auth-mode login`.
5. If GRS failover required (regional outage): follow Azure Blob Storage GRS failover process via Azure Portal. Note: this is a manual operation and takes time.

**Resolution:** Restore storage access. If permissions issue: re-assign role. If regional outage: wait for Azure recovery or initiate GRS failover after customer DEC-.

**Escalation:** DevOps → Azure support.

---

### 4.5 Cross-Tenant Data Leak — CRITICAL ESCALATION REQUIRED

**Symptoms:** A user from Tenant A is able to see data belonging to Tenant B. User reports seeing policies, claims, or user records that do not belong to their organization.

**CRITICAL: This is a P0 incident. Immediate action is required.**

**Immediate steps:**
1. **Immediately suspend the affected user account** (disable in `identity.app_user`): `UPDATE identity.app_user SET is_active = FALSE WHERE user_id = {id};` — requires DBA.
2. **Immediately alert Security Lead and Tech Lead.**
3. Capture: the affected user's `UserId`, `ClientId`, the data they accessed (entity type, entity ID), and the `ClientId` the data belongs to.
4. Pull Application Insights cross-tenant access logs: `traces | where message contains "Cross-tenant" and customDimensions.UserId == '{id}'`
5. Review EF Core global query filter logs to identify how the `ClientId` filter was bypassed.
6. Do NOT attempt to fix the vulnerability while the investigation is in progress — preserve all logs.

**Resolution:** Tech Lead + Security Lead must identify the vulnerability (likely a missing `IgnoreQueryFilters()` call or a PlatformAdmin bypass without audit). Fix must be reviewed, tested, and deployed with a hotfix pipeline.

**Notification:** Customer must be notified of the potential data exposure per applicable insurance data protection requirements. Legal/compliance team must be involved.

**Escalation:** Security Lead → Tech Lead → Engineering Manager → Customer → Legal/Compliance (mandatory).

---

## Section 5: Key Vault Secret Rotation Procedure

**Reference:** ADR-010. All secrets in `insuredge-kv-prod`. App Service uses Managed Identity — no static credentials.

### 5.1 Rotation Overview

| Secret Category | Rotation Frequency | Risk on Rotation | Notes |
|---|---|---|---|
| JWT Signing Key (`Jwt--SigningKey`) | Annually or on compromise | All active JWT tokens invalidated (users logged out) | Rotate during low-traffic window |
| AES-256 Encryption Key (`Encryption--AesKey`) | On compromise only | CRITICAL: requires re-encryption of all AES-encrypted fields | See §5.2 |
| TranzPay credentials | Per TranzPay policy | Payment flow temporarily disrupted during rotation | Coordinate with TranzPay |
| SMTP credentials | Per Office365 policy | Email sending fails during rotation window | Rotate outside business hours |
| LenderDock, HexCat, Plumsail, DisburseCloud API keys | Per vendor policy | Integration calls fail during rotation window | Rotate outside business hours |
| Google Maps API keys | Per Google policy | Geocoding fails during rotation | Cached results in Redis buffer impact |
| Database connection string (`Db--ConnectionString--*`) | On credential change | App fails to connect | Update secret before restarting App Service |

### 5.2 AES-256 Key Rotation (Special Procedure)

**Warning: AES key rotation requires data re-encryption. This is a complex operation.**

1. Generate a new AES-256 key (256-bit random key, base64-encoded).
2. Load the new key into Key Vault as `Encryption--AesKey--New` (do not overwrite `Encryption--AesKey` yet).
3. Run the re-encryption migration job (engineer must implement — not a SHIFT-generated artifact):
   - For each encrypted field in `billing.bank_detail` (`account_number`, `routing_number`):
     - Decrypt with OLD key.
     - Re-encrypt with NEW key.
     - Update the record.
4. After all records re-encrypted successfully: rename `Encryption--AesKey--New` → `Encryption--AesKey` in Key Vault (delete old, create new with same name).
5. Restart App Service to pick up new secret value.
6. Verify: spot-check a BankDetail record — decrypt with new key succeeds.

**Note on DBT-4-FORGE-016:** If the source encryption format (OutSystems `RssExtensionCryptoAPI`) differs from target (AES-256-CBC + HMAC-256), the initial migration may require `CanDecryptMigratedValue()` dual-format handling. Resolve with Engineering before first rotation.

### 5.3 Standard Secret Rotation Procedure

1. Generate new credential value.
2. Load into Key Vault: `az keyvault secret set --vault-name insuredge-kv-prod --name {SecretName} --value {NewValue}`.
3. App Service automatically picks up new secret values on next startup (configured via `AddAzureKeyVault` with periodic refresh — 5 minutes by default) or immediately after restart.
4. For zero-downtime rotation: load new value, then swap staging slot (forces fresh config read) to production.
5. Verify the integration works with new credentials (integration smoke test).

---

## Section 6: Hangfire Dashboard

### 6.1 Access
- **URL:** `https://api.insuredge.example.com/hangfire`
- **Credentials:** PlatformAdmin role required (custom `IDashboardAuthorizationFilter`)
- **Available to:** Operations team with PlatformAdmin credentials only

### 6.2 What to Look For

| Dashboard Section | Normal State | Action if Abnormal |
|---|---|---|
| Servers | 1 server connected (App Service instance) | If 0 servers: App Service may be down |
| Jobs → Succeeded | Growing count; recent jobs in last 24h | If empty for >24h: jobs may be disabled |
| Jobs → Failed | 0 (or very low, <5 persistent) | Investigate any failed jobs (see §4.2) |
| Jobs → Processing | 0 (or very brief) | If stuck in "Processing" > 1h: possible deadlock |
| Queues → default | Count = 0 (no backlog) | If growing: jobs may be slow or failing |
| Recurring Jobs | 11 jobs visible, each with "Last execution" within expected interval | If "Never" or very old: check KillTimer config |

### 6.3 Timer Job Reference

| Job ID | Job Name | Schedule | Domain | Kill Switch Key |
|---|---|---|---|---|
| T-01 | RenewalQuoteGenerator | Daily | D1 Policy | `timer:T01:KillTimer` |
| T-02 | PolicyExpiryProcessor | Daily | D1 Policy | `timer:T02:KillTimer` |
| T-03 | NonRenewalNoticeSender | Daily | D1 Policy | `timer:T03:KillTimer` |
| T-04 | NonRenewalStatusProcessor | Daily | D1 Policy | `timer:T04:KillTimer` |
| T-05 | QuoteExpiryProcessor | Daily | D1 Policy | `timer:T05:KillTimer` |
| T-06 | AutoCancellationProcessor | Daily | D3 Billing | `timer:T06:KillTimer` |
| T-07 | CommissionDisbursementProcessor | Weekly | D4 Distribution | `timer:T07:KillTimer` |
| T-08 | ClaimsDisbursementProcessor | On-demand + schedule | D2 Claims | `timer:T08:KillTimer` |
| T-09 | AutoDebitProcessor | Per payment plan schedule | D3 Billing | `timer:T09:KillTimer` |
| T-10 | FailedPaymentNotificationProcessor | Daily | D3 Billing | `timer:T10:KillTimer` |
| T-11 | BulkUploadProcessor | On-demand | D1 Policy | `timer:T11:KillTimer` |

### 6.4 Manually Re-Trigger a Failed Job

1. Navigate to Hangfire Dashboard → Jobs → Failed.
2. Click the failed job to expand details.
3. Click "Requeue" to re-add the job to the default queue.
4. Monitor Jobs → Processing for the job to complete.
5. Check Jobs → Succeeded to confirm completion.
6. If the job fails again immediately: investigate root cause before requeuing (see §4.2).

### 6.5 Disable a Timer (Kill Switch)

To disable a specific timer without code change:
1. Azure Portal → App Configuration (`appconfig-insuredge-prod`).
2. Find key `timer:{JobId}:KillTimer` (e.g., `timer:T07:KillTimer`).
3. Set value to `true`.
4. App Configuration change is picked up within the refresh interval (default: 30 seconds via sentinel key pattern).
5. Hangfire recurring job scheduler checks this flag at the start of each run and skips execution if `true`.
6. Re-enable: set back to `false`.

---

## Section 7: Backup and Recovery

### 7.1 PostgreSQL Backup

- **Method:** Azure-managed automated backups (Azure Database for PostgreSQL Flexible Server).
- **Retention:** 35 days point-in-time restore.
- **RPO:** < 5 minutes (WAL-based continuous backup).
- **RTO:** 30–60 minutes for full restore to new server instance.

**Point-in-time restore procedure:**
1. Azure Portal → PostgreSQL Flexible Server → Restore.
2. Select restore point (timestamp within 35-day window).
3. Choose restore to: New server (recommended — do not overwrite production without DEC-).
4. After restore completes: update `Db--ConnectionString--Production` in Key Vault to point to restored server.
5. Restart App Service.
6. Validate with health check and row count verification.

**Manual backup (before risky operations):**
```bash
az postgres flexible-server backup create \
  --resource-group rg-insuredge-prod \
  --name psql-insuredge-prod \
  --backup-name manual-backup-$(date +%Y%m%d-%H%M%S)
```

### 7.2 Azure Blob Storage Redundancy

- **Replication:** Geo-Redundant Storage (GRS) — data replicated to Azure paired region.
- **RPO:** < 1 minute.
- **Access in failover:** Read-Access GRS (RA-GRS) provides read access to secondary region during primary outage.
- **Write failover:** Manual account failover via Azure Portal (may result in minor data loss for last few minutes of writes).

Insurance regulatory note: All policy, claims, and financial documents stored in Blob must be retained ≥7 years per insurance regulatory requirements (ART-5-009).

### 7.3 Application Code Recovery

- All application code is in GitHub. Re-deployment from any commit is possible via `deploy-prod.yml`.
- No code artifacts are stored only on Azure App Service — all are reproducible from source.

---

## Section 8: Environment URLs and Access

**Note to engineering team: Replace all placeholder values below before handing to operations.**

| Environment | API URL | Frontend URL | Azure Portal RG | Application Insights |
|---|---|---|---|---|
| Dev | `https://api-dev.insuredge.example.com` | `https://dev.insuredge.example.com` | `rg-insuredge-dev` | `ai-insuredge-dev` |
| QA | `https://api-qa.insuredge.example.com` | `https://qa.insuredge.example.com` | `rg-insuredge-qa` | `ai-insuredge-qa` |
| UAT | `https://api-uat.insuredge.example.com` | `https://uat.insuredge.example.com` | `rg-insuredge-uat` | `ai-insuredge-uat` |
| Prod | `https://api.insuredge.example.com` | `https://app.insuredge.example.com` | `rg-insuredge-prod` | `ai-insuredge-prod` |

| Resource | Name | Access |
|---|---|---|
| Azure Subscription | _________________ | Azure Portal (MFA required) |
| GitHub Repository | _________________ | GitHub (organization SSO) |
| Hangfire Dashboard (Prod) | `https://api.insuredge.example.com/hangfire` | PlatformAdmin credentials |
| Azure Key Vault (Prod) | `insuredge-kv-prod` | Azure Portal (break-glass account) |
| Azure App Configuration (Prod) | `appconfig-insuredge-prod` | Azure Portal |
| PostgreSQL Flexible Server | `psql-insuredge-prod` | Private endpoint only (via VPN or jump host) |

---

## Section 9: Escalation Contacts

**Note to customer: Fill in contact details before go-live. All contacts must be confirmed and reachable before the production deployment window.**

| Role | Name | Contact | Availability | Escalation Tier |
|---|---|---|---|---|
| Tech Lead (Primary On-Call) | _________________ | _________________ | _________________ | Tier 1 |
| DevOps On-Call | _________________ | _________________ | _________________ | Tier 1 |
| DBA On-Call | _________________ | _________________ | _________________ | Tier 1 (DB issues) |
| Security Lead | _________________ | _________________ | Business hours + on-call for P0 | Tier 2 (security) |
| Integration Lead | _________________ | _________________ | Business hours | Tier 2 (integrations) |
| Engineering Manager | _________________ | _________________ | Business hours | Tier 2 escalation |
| Customer Sponsor | _________________ | _________________ | Full window for deployments | Go/No-Go authority |
| TranzPay Support | _________________ | _________________ | _________________ | Vendor |
| LenderDock Support | _________________ | _________________ | _________________ | Vendor |
| HexCat Support | _________________ | _________________ | _________________ | Vendor |
| DisburseCloud Support | _________________ | _________________ | _________________ | Vendor |
| Plumsail Support | _________________ | _________________ | _________________ | Vendor |
| Azure Support | Via Azure Portal | support.microsoft.com | 24/7 (per SLA tier) | Infrastructure |

---

*End of ART-5-006 — Support Runbook | INSUREEDGE-2026 | TRANSFER Phase | 2026-06-17*
*Status: AI_GENERATED. Incident playbooks: 5. Alert runbook entries: 8. Timer job reference: 11 jobs. All placeholder values (URLs, contacts) must be filled by the engineering/customer team before go-live.*
