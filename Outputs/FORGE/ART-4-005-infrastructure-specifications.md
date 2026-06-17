# ART-4-005 — Infrastructure Specifications
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Status:** AI_GENERATED
**Produced by:** Forge Agent
**Phase:** FORGE
**Date:** 2026-06-17
**Version:** 1.0
**Engagement:** INSUREEDGE-2026 | Customer: Hudson Bailey
**Architecture gate:** PASSED (DEC-3-0003, 2026-06-17)
**Primary inputs:** ART-3-012 TAD §9 (Infrastructure Architecture), ART-3-002 ADR-008, ADR-009, ADR-010, ART-3-005 §8 (caching)

> This document provides structured Terraform resource specifications — not full HCL code. Engineers implement from these specifications. All resource names follow the pattern `insuredge-{resource}-{env}` unless noted. Environment abbreviations: `dev`, `qa`, `uat`, `prod`.

> **HUMAN_VALIDATION_REQUIRED:** All Azure SKUs, storage capacities, and network CIDR blocks must be reviewed by the Infrastructure Lead and Customer's IT representative before provisioning any production resources.

---

## Section 1: Resource Organization

### 1.1 Azure Resource Groups

| Resource Group | Purpose | Environment |
|---|---|---|
| `rg-insuredge-dev` | All Dev resources | Dev |
| `rg-insuredge-qa` | All QA resources | QA |
| `rg-insuredge-uat` | All UAT resources | UAT |
| `rg-insuredge-prod` | All Production resources | Prod |

**Terraform module:** `modules/resource-group/`

```
resource "azurerm_resource_group" {
  name     = "rg-insuredge-{env}"
  location = var.azure_region         # e.g., "East US 2"
  tags = {
    environment = var.environment
    project     = "InsureEdge"
    owner       = "INSUREEDGE-2026"
    managed_by  = "Terraform"
  }
}
```

---

## Section 2: Networking

### 2.1 Virtual Network

**Terraform module:** `modules/networking/`

```
VNet: vnet-insuredge-{env}
  Address space: 10.{env_octet}.0.0/16
    Dev:  10.10.0.0/16
    QA:   10.11.0.0/16
    UAT:  10.12.0.0/16
    Prod: 10.13.0.0/16
```

### 2.2 Subnets

| Subnet | Purpose | CIDR |
|---|---|---|
| `snet-appservice` | App Service VNet integration | `.0.0/24` |
| `snet-agw` | Application Gateway | `.1.0/24` |
| `snet-postgres` | PostgreSQL Flexible Server | `.2.0/24` |
| `snet-redis` | Redis Cache private endpoint | `.3.0/24` |
| `snet-keyvault` | Key Vault private endpoint | `.4.0/24` |
| `snet-storage` | Blob Storage private endpoint | `.5.0/24` |
| `snet-monitoring` | App Insights, Log Analytics | `.6.0/24` |

**Delegation required:** `snet-appservice` → `Microsoft.Web/serverFarms` (App Service VNet integration)

### 2.3 Private Endpoints

All data-plane services (PostgreSQL, Redis, Key Vault, Blob Storage) have private endpoints — no public internet exposure for data plane (TAD §9).

| Service | Private Endpoint Name | Subnet |
|---|---|---|
| PostgreSQL Flexible Server | `pe-postgres-insuredge-{env}` | `snet-postgres` |
| Redis Cache | `pe-redis-insuredge-{env}` | `snet-redis` |
| Key Vault | `pe-kv-insuredge-{env}` | `snet-keyvault` |
| Blob Storage | `pe-blob-insuredge-{env}` | `snet-storage` |

---

## Section 3: Azure Application Gateway + WAF

**Terraform module:** `modules/app-gateway/`

```
Resource: azurerm_application_gateway
Name:     agw-insuredge-{env}
SKU:
  name:     WAF_v2
  tier:     WAF_v2
  capacity: 2 (Prod); 1 (Dev/QA/UAT)

WAF Policy:
  mode:        Prevention (Prod/UAT); Detection (Dev/QA)
  rule_set:    OWASP 3.2
  custom_rules: none at launch (review post-UAT)

Listeners:
  - name: https-listener; protocol: HTTPS; port: 443; ssl_cert: insuredge-{env}-cert
  - name: http-redirect; protocol: HTTP; port: 80 → redirect to HTTPS

Routing Rules:
  - Path /api/*     → Backend Pool: app-service-pool (App Service)
  - Path /          → Backend Pool: static-web-app-pool (Static Web App)
  - Path /hangfire* → Backend Pool: app-service-pool; IP allowlist: PlatformAdmin IP ranges

Backend Settings:
  - App Service backend: protocol HTTPS; host header from backend address; health probe: /health/ready; interval 30s; timeout 30s
  - Cookie-based affinity: disabled (stateless API)

SSL:
  - Certificate stored in Key Vault; Application Gateway references Key Vault via Managed Identity
  - Minimum TLS: 1.2

Health Probe:
  - Path: /health/ready
  - Interval: 30 seconds
  - Threshold: 3 failures → unhealthy
```

---

## Section 4: Compute — Azure App Service

**Terraform module:** `modules/app-service/`

### 4.1 App Service Plan

```
Resource: azurerm_service_plan
Name: asp-insuredge-{env}

Prod:
  os_type: Linux
  sku_name: P2v3
  (2 vCores, 8 GB RAM — ASM-3-ARCH-004: verify in UAT load test)

Dev/QA/UAT:
  os_type: Linux
  sku_name: B2 (Dev/QA) | P1v3 (UAT)
```

### 4.2 App Service

```
Resource: azurerm_linux_web_app
Name: app-insuredge-api-{env}
service_plan_id: asp-insuredge-{env}

Runtime stack:
  application_stack:
    dotnet_version: "8.0"

site_config:
  always_on: true (Prod/UAT); false (Dev/QA)
  health_check_path: /health/ready
  health_check_eviction_time_in_min: 2

app_settings:
  ASPNETCORE_ENVIRONMENT:   "Production" (Prod) | "Staging" (UAT) | "Development" (Dev)
  ASPNETCORE_URLS:          "http://+:8080"
  KeyVaultUri:              "https://kv-insuredge-{env}.vault.azure.net/"
  AppConfigurationEndpoint: "https://appcs-insuredge-{env}.azconfig.io"
  ApplicationInsightsConnectionString: (from App Insights resource)
  HANGFIRE_DASHBOARD_ENABLED: "true" (all envs; auth enforced)

identity:
  type: SystemAssigned   ← Managed Identity for Key Vault and App Configuration access

sticky_settings:
  ASPNETCORE_ENVIRONMENT  ← slot-specific; not swapped

Deployment slot:
  name: staging
  Purpose: Blue/green deployment — swap to production for zero-downtime deploy (ART-3-011)
  slot_setting: ASPNETCORE_ENVIRONMENT = "Staging"
```

**Outbound VNet integration:** App Service integrated to `snet-appservice` for private access to PostgreSQL, Redis, Key Vault, Blob.

---

## Section 5: Azure Static Web Apps (Frontend)

**Terraform module:** `modules/static-web-app/`

```
Resource: azurerm_static_web_app
Name: stapp-insuredge-{env}

sku_tier: Standard (Prod/UAT); Free (Dev/QA)

Configuration:
  - Build output: frontend/insure-edge-app/dist (Vite build output)
  - API backend: linked to App Service (for auth pass-through if needed)
  - Custom domain: insuredge-{env}.customer-domain.com (HUMAN_VALIDATION_REQUIRED — domain name TBC)
  - Routing: staticwebapp.config.json with fallback route to index.html (SPA navigation)

CORS: Not applicable — SPA served from same domain as API via Application Gateway routing
```

---

## Section 6: Azure Database for PostgreSQL Flexible Server

**Terraform module:** `modules/postgresql/`

### 6.1 Flexible Server

```
Resource: azurerm_postgresql_flexible_server
Name: psql-insuredge-{env}

Prod:
  sku_name: D4s_v3 (4 vCores, 16 GB RAM — ASM-3-ARCH-005: verify after RPS raster load)
  storage_mb: 131072 (128 GB; review after binary migration volume estimate)
  backup_retention_days: 35
  geo_redundant_backup_enabled: true (Prod); false (Dev/QA/UAT)
  high_availability:
    mode: ZoneRedundant (Prod); Disabled (Dev/QA/UAT)  ← Zone-HA per ART-3-012 §9
  zone: 1 (primary)
  standby_availability_zone: 2 (Prod only)

Dev/QA:
  sku_name: B2ms (2 vCores, 8 GB RAM)
  storage_mb: 32768 (32 GB)
  high_availability: disabled

UAT:
  sku_name: D2s_v3 (2 vCores, 8 GB RAM)
  storage_mb: 65536 (64 GB)

PostgreSQL version: 16
  (PostGIS extension requires server-level enable — see §6.2)

Authentication:
  administrator_login: (loaded from Key Vault — HUMAN_VALIDATION_REQUIRED)
  password_auth_enabled: true (initial; move to Azure AD auth post-launch if required)
  azure_active_directory_auth_enabled: false (initial)

Networking:
  delegated_subnet_id: snet-postgres
  private_dns_zone_id: (private DNS zone for postgres.database.azure.com)
  public_network_access_enabled: false  ← private endpoint only
```

### 6.2 Extensions

```
Extensions to enable (azurerm_postgresql_flexible_server_configuration):
  - postgis       ← RPS geospatial queries (ADR-005)
  - uuid-ossp     ← UUID generation
  - pg_trgm       ← Full-text search (trigram similarity)
  - pgcrypto      ← Encryption functions
  - pgbouncer     ← Built-in connection pooling (transaction mode)
```

### 6.3 Databases

```
Databases on the Flexible Server:
  - insure_edge      ← Primary operational + system data (all 7 domain schemas)
  - gis              ← PostGIS + RPS raster dataset (ADR-005; separate DB on same server)
  - hangfire         ← Hangfire job storage (ADR-009; may be same as insure_edge schema — TBD)
```

### 6.4 Firewall / Connectivity

All connectivity via private endpoint in `snet-postgres`. No public IP rules. App Service access via VNet integration → private endpoint.

---

## Section 7: Azure Cache for Redis

**Terraform module:** `modules/redis/`

```
Resource: azurerm_redis_cache
Name: redis-insuredge-{env}

Prod:
  sku_name: Standard
  family:   C
  capacity: 1 (1 GB — Standard C1, per TAD §2; HUMAN_VALIDATION_REQUIRED for sizing under RPS/rate-table load)
  minimum_tls_version: 1.2
  enable_non_ssl_port: false
  redis_configuration:
    maxmemory_policy: allkeys-lru   ← evict least-recently-used when memory full
    maxmemory_reserved: 50 (%)      ← headroom for non-cache operations

Dev/QA:
  sku_name: Basic; family: C; capacity: 0 (250 MB)

UAT:
  sku_name: Standard; family: C; capacity: 0 (250 MB)

Networking:
  private_endpoint: pe-redis-insuredge-{env} in snet-redis
  public_network_access: false

Cache categories and TTLs:
  perms:{userId}:{screenCode}          TTL: 15 min
  rater:lr-hexzones, rater:hr-hexzone  TTL: 24 hours
  rater:state-tax, rater:flood, rater:wildfire  TTL: 24 hours
  rps:{lat}:{lon}                      TTL: 7 days
  geo:{addressHash}                    TTL: 30 days
  lookup:{type}:{clientId}             TTL: 1 hour
  disburse:token:{clientId}            TTL: 55 minutes
```

---

## Section 8: Azure Key Vault

**Terraform module:** `modules/keyvault/`

### 8.1 Key Vault Resource

```
Resource: azurerm_key_vault
Name: kv-insuredge-{env}

sku_name: standard (all envs)
soft_delete_retention_days: 90
purge_protection_enabled: true (Prod/UAT); false (Dev/QA)
enable_rbac_authorization: true

Networking:
  public_network_access_enabled: false
  private_endpoint: pe-kv-insuredge-{env} in snet-keyvault

RBAC Assignments:
  - App Service Managed Identity → "Key Vault Secrets User" role (runtime secret reads)
  - GitHub Actions OIDC Identity → "Key Vault Secrets User" role (pipeline — CI/CD only for reading deploy configs)
  - DevOps team AAD group → "Key Vault Secrets Officer" role (secret management)
```

### 8.2 Secret Names to Provision

> **HUMAN_VALIDATION_REQUIRED — Secret VALUES must be populated by human operator. This list provides the KEY NAMES only. No values are present in this document or in any source control artifact.**

| Secret Name | Description | Environment Variation |
|---|---|---|
| `TranzPay--BaseUrl` | TranzPay API base URL | Dev/QA: sandbox URL; UAT/Prod: production URL (GAP-2-INT-001 BLOCKER) |
| `TranzPay--UserName` | TranzPay credential | Per-environment |
| `TranzPay--Password` | TranzPay credential | Per-environment |
| `TranzPay--ProducerId` | TranzPay ProducerID | Per-environment |
| `LenderDock--AuthorizationHeader` | LenderDock Basic Auth header (Base64) | Per-environment (QST-1-INT-002 BLOCKER) |
| `LenderDock--ProviderId` | LenderDock provider ID | Per-environment |
| `Plumsail--ApiKey` | Plumsail API key | All envs (QST-1-INT-003 BLOCKER — value unknown) |
| `Plumsail--ApiUrl` | Plumsail API base URL | Per-environment |
| `DisburseCloud--BaseUrl` | DisburseCloud v1.2.1 base URL | Per-environment |
| `DisburseCloud--SecretKey` | DisburseCloud API secret key | Per-environment |
| `DisburseCloud--EncryptionKey` | DisburseCloud encryption key (QST-2-INT-004) | Per-environment |
| `AzureBlob--ConnectionString` | Storage account connection string (or replaced by Managed Identity) | All envs; Managed Identity preferred (INT-008) |
| `AzureBlob--ContainerName` | Blob container name (e.g., `insuredgedev`) | Per-environment |
| `GoogleMaps--ApiKey` | Google Maps display API key (origin-restricted — NFR-020) | Shared (Google Console restriction per domain) |
| `Geocoding--ApiKey` | Google Geocoding server-side API key (not exposed to client) | Shared |
| `HexCat--ApiKey` | HexCat risk scoring API key | All envs (QST-1-INT-004 BLOCKER) |
| `Encryption--Base64Key` | AES-256 encryption master key (migrate from OutSystems site property, NFR-007) | Per-environment; must match source for migrated encrypted data |
| `Smtp--Host` | SMTP server host | Per-environment |
| `Smtp--Port` | SMTP server port | Per-environment |
| `Smtp--User` | SMTP authentication user | Per-environment |
| `Smtp--Password` | SMTP password | Per-environment |
| `Jwt--SigningKey` | JWT signing key (new — not in OutSystems) | Per-environment; min 256-bit |
| `Database--ConnectionString` | PostgreSQL connection string | Per-environment |
| `Hangfire--ConnectionString` | Hangfire PostgreSQL connection string (may be same as Database) | Per-environment |

**Secret naming convention:** Double-dash `--` in Key Vault name maps to colon `:` in ASP.NET Core configuration hierarchy (e.g., `TranzPay--BaseUrl` → `TranzPay:BaseUrl` in options binding).

---

## Section 9: Azure App Configuration

**Terraform module:** `modules/app-configuration/`

```
Resource: azurerm_app_configuration
Name: appcs-insuredge-{env}

sku: standard (Prod/UAT); free (Dev/QA)

Authentication:
  - App Service Managed Identity → "App Configuration Data Reader" role

Key-value pairs to provision (values configurable at runtime — no restart required):
```

| Configuration Key | Default Value | Description |
|---|---|---|
| `Policy:RenewalLeadDays` | 90 | Days before expiry to generate renewal quote (BR-POL-REN-001) |
| `Policy:NonRenewalNoticeDays` | 60 | Days before expiry to send non-renewal notice (BR-POL-NRN-001) |
| `Policy:MarkNonRenewedAfterDays` | 90 | Days post-expiry before Non-Renewed status (BR-POL-REN-004) |
| `Policy:NewBusinessQuoteExpiryDays` | 90 | New business quote expiry window (BR-POL-QE-001) |
| `Policy:EndorsementQuoteExpiryDays` | 90 | Endorsement quote expiry window (BR-POL-QE-003) |
| `Policy:RenewalQuoteExpiryDays` | 30 | Renewal quote expiry window (BR-POL-QE-002) |
| `Policy:AutoCancellationGraceDays` | 30 | Grace days after missed payment before auto-cancel (BR-POL-CAN-001) |
| `Policy:ExpiredTransitionDays` | 1 | Days after ExpirationDate before Expired status (BR-POL-EXP-001) |
| `Policy:PolicyFee` | 195.00 | Fixed policy administration fee (BR-POL-FEE-001) — HUMAN_VALIDATION_REQUIRED |
| `TranzPay:CallbackTimeoutHours` | 4 | Hours before pending callback flagged for reconciliation |
| `Timer:GlobalEnabled` | true | Master kill switch for all Hangfire jobs |
| `Timer:RenewalQuoteGeneratorEnabled` | true | Per-timer kill switch: T-01 |
| `Timer:RenewalNotificationSenderEnabled` | true | T-02 |
| `Timer:NonRenewalNoticeSenderEnabled` | true | T-03 |
| `Timer:PolicyExpiryProcessorEnabled` | true | T-04 |
| `Timer:QuoteExpiryProcessorEnabled` | true | T-05 |
| `Timer:AutoCancellationProcessorEnabled` | true | T-06 |
| `Timer:PolicyExpiredStatusUpdaterEnabled` | true | T-07 |
| `Timer:InstallmentPaymentProcessorEnabled` | true | T-08 |
| `Timer:TranzPayCallbackReconcilerEnabled` | true | T-09 |
| `Timer:BulkUploadProcessorEnabled` | true | T-10 |
| `Timer:CommissionDisbursementProcessorEnabled` | true | T-11 |
| `Feature:BypassRefundResponse` | false | Must be `false` in QA/UAT/Prod (NFR-009, ADR-006). `true` allowed ONLY in Dev. **Deployment gate checks this value before Prod deploy.** |

---

## Section 10: Azure Blob Storage

**Terraform module:** `modules/storage/`

```
Resource: azurerm_storage_account
Name: (existing account: insureedgeieapplication per project context)
  OR: stinsuredge{env} (new account per environment if separate storage per env)

Account configuration:
  account_kind:     StorageV2
  account_tier:     Standard
  replication_type: GRS (Prod); LRS (Dev/QA/UAT)
  min_tls_version: TLS1_2
  allow_nested_items_to_be_public: false
  public_network_access_enabled: false (private endpoint only)

Containers to create:
  - name: insuredge-documents (existing: insuredgedev per project context)
    access: private (no public blob access)

Blob path convention:
  {ClientCode}/{Module}/{RecordId}/{Filename}
  e.g., HB001/policy/12345/declaration_2026.pdf
  e.g., HB001/claims/98765/claim_photo_1.jpg

Access pattern:
  - Managed Identity for App Service → Storage Blob Data Contributor role
  - Time-limited SAS tokens for download (15-minute expiry) generated server-side
  - No connection string in appsettings.json — Managed Identity preferred (INT-008)

Lifecycle management policy:
  - Archive documents older than 7 years to Cool tier (insurance retention requirement — HUMAN_VALIDATION_REQUIRED: confirm regulatory retention period)
```

---

## Section 11: Azure Application Insights + Log Analytics

**Terraform module:** `modules/monitoring/`

```
Log Analytics Workspace:
  Resource: azurerm_log_analytics_workspace
  Name: law-insuredge-{env}
  sku:  PerGB2018
  retention_in_days: 90 (Prod); 30 (Dev/QA/UAT)

Application Insights:
  Resource: azurerm_application_insights
  Name: ai-insuredge-{env}
  application_type: web
  workspace_id: law-insuredge-{env}
  sampling_percentage: 100 (Dev/QA); 20 (UAT/Prod — reduce volume)

Custom metrics to provision (14 metrics per ART-3-012 §10):
  - payment_initiation_count, payment_success_count, payment_failure_count
  - tranzpay_callback_latency_ms, tranzpay_callback_timeout_count
  - disbursecloud_disbursement_count, disbursecloud_failure_count
  - lenderdock_notification_count, lenderdock_failure_count
  - hexcat_request_count, hexcat_not_approved_count
  - timer_job_execution_count, timer_job_failure_count
  - cross_tenant_access_count (PlatformAdmin audit metric)

Alerts (Azure Monitor):
  - Error rate > 1% over 5 minutes → Severity 2 (P2)
  - P95 latency > 2 seconds → Severity 3 (P3)
  - Payment integration failure (tranzpay_failure_count > 0 in 15 min) → Severity 1 (P1)
  - Timer job failure → Severity 2 (P2)
  - DisburseCloud low-funds alert (via webhook callback payload inspection)
  - Availability (ping test /health) < 99% over 5 minutes → Severity 1 (P1)

Action groups:
  - ops-alerts: Email to ops team
  - critical-alerts: Email + SMS to on-call (Prod P1 only)
```

---

## Section 12: Per-Environment Variable Matrix

| Configuration Item | Dev | QA | UAT | Prod |
|---|---|---|---|---|
| App Service SKU | B2 | B2 | P1v3 | P2v3 |
| PostgreSQL SKU | B2ms | B2ms | D2s_v3 | D4s_v3 |
| PostgreSQL Zone-HA | No | No | No | Yes |
| PostgreSQL Storage | 32 GB | 32 GB | 64 GB | 128 GB |
| PostgreSQL Geo-redundant backup | No | No | No | Yes |
| Redis SKU | Basic C0 | Basic C0 | Standard C0 | Standard C1 |
| Redis Private Endpoint | No | No | Yes | Yes |
| Key Vault Purge Protection | No | No | Yes | Yes |
| WAF Mode | Detection | Detection | Prevention | Prevention |
| Application Insights Sampling | 100% | 100% | 20% | 20% |
| Log Retention (days) | 30 | 30 | 30 | 90 |
| Static Web App SKU | Free | Free | Standard | Standard |
| `BypassRefundResponse` flag | **true** (allowed) | **false** | **false** | **false** |
| TranzPay URL | Sandbox | Sandbox | Prod (GAP-2-INT-001) | Prod (GAP-2-INT-001) |
| Alert notifications | Email only | Email only | Email only | Email + SMS (P1) |

---

## Section 13: Deployment Prerequisites Checklist

> **HUMAN_VALIDATION_REQUIRED — This checklist must be completed and signed off by the Infrastructure Lead before any production Terraform apply.**

- [ ] Azure subscription confirmed; resource quotas verified (P2v3 App Service, D4s_v3 PostgreSQL)
- [ ] Azure region selected and confirmed with customer
- [ ] Managed Identity RBAC roles assigned (Key Vault, App Configuration, Blob Storage, App Insights)
- [ ] All 22 Key Vault secrets loaded with actual values (not placeholders)
- [ ] TranzPay production URL loaded into `kv-insuredge-uat` and `kv-insuredge-prod` (GAP-2-INT-001)
- [ ] HexCat API key loaded (QST-1-INT-004)
- [ ] LenderDock credentials loaded (QST-1-INT-002)
- [ ] Plumsail API key loaded (QST-1-INT-003)
- [ ] AES-256 encryption key migrated from OutSystems site property to Key Vault (`Encryption--Base64Key`)
- [ ] Google API keys loaded; origin restriction configured in Google Cloud Console (NFR-020)
- [ ] Custom domain DNS records configured and SSL certificate in Key Vault
- [ ] `Feature:BypassRefundResponse = false` confirmed in UAT and Prod App Configuration
- [ ] PostgreSQL admin password set; password rotation schedule documented
- [ ] Private DNS zones created for all private endpoint services
- [ ] Network Security Groups reviewed (outbound rules for SMTP, TranzPay, DisburseCloud, Plumsail, HexCat, LenderDock, Google)

---

## Open Doubts (DBT-4-FORGE) Raised in This Document

| DBT ID | Severity | Statement | Section |
|--------|----------|-----------|---------|
| DBT-4-FORGE-009 | MEDIUM | Azure region not confirmed. All CIDR blocks and SKU availability depend on the target region. Engineer must confirm region availability for all specified SKUs (especially D4s_v3 PostgreSQL with Zone-HA). | §1.1 |
| DBT-4-FORGE-010 | LOW | Blob Storage account name `insureedgeieapplication` is the existing account per project context. If new per-environment accounts are required, naming and lifecycle policies need revision. | §10 |
| DBT-4-FORGE-011 | MEDIUM | Insurance document retention regulatory requirement not confirmed. 7-year lifecycle policy assumed but must be confirmed against applicable state insurance regulations before implementation. | §10 |

---

*End of ART-4-005 — Infrastructure Specifications | INSUREEDGE-2026 | FORGE Phase | 2026-06-17*
*Status: AI_GENERATED. HUMAN_VALIDATION_REQUIRED applied to all production SKUs, financial configuration values, and secret values. 3 DBT-4-FORGE items raised. 22 Key Vault secret names documented (no values).*
