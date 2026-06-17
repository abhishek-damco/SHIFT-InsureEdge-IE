# ART-3-009 — Cloud / Infrastructure Architecture
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Architecture Agent
**Phase:** IDEATE
**Date:** 2026-06-17
**Version:** 1.0 — GATE CANDIDATE
**Cloud Platform:** Microsoft Azure

---

## 1. Azure Services Selection

### 1.1 Compute — App Service vs Container Apps vs AKS

| Option | Suitability for 100 Users | Justification |
|---|---|---|
| **Azure App Service (Linux, P2v3)** | **SELECTED** | Fully managed PaaS, no container orchestration overhead, built-in deployment slots (Blue/Green), autoscale rules, managed TLS, VNet integration. Appropriate for a modular monolith at 100-user scale. |
| Azure Container Apps | Deferred | Better for microservices with independent scaling. Over-engineered for a single-application modular monolith. |
| Azure Kubernetes Service (AKS) | Rejected | Requires dedicated ops competency. No benefit at 100-user scale. Cost-prohibitive relative to App Service. |

**Selected tier: App Service Plan — Premium P2v3** (2 vCPU, 8 GB RAM, Linux)
- Supports VNet integration (required for private endpoint connectivity to PostgreSQL)
- Supports deployment slots (Blue/Green for zero-downtime deployments)
- Supports auto-scale (scale out to 3 instances on CPU > 70% — conservative for 100-user scale)
- Supports Managed Identity (required for Key Vault and Blob Storage access)

**ASM-3-ARCH-004:** P2v3 is sized for 100 concurrent users with headroom. If NFR-016 (performance SLA) delivers requirements beyond this, the plan tier can be upgraded without architecture change. Confidence: MEDIUM (no load test data available — QST-2-PM-NFR-001 still blocking).

### 1.2 Azure Static Web Apps — Frontend Hosting

React SPA (Vite build output) deployed to Azure Static Web Apps:
- Global CDN distribution (low-latency delivery to US users)
- Built-in GitHub Actions integration
- Free tier supports the SPA hosting requirement
- Custom domain with automatic TLS
- Routing rules configured for React Router (all paths → `/index.html`)
- API proxying rules configured to route `/api/*` to the App Service

### 1.3 Azure Database for PostgreSQL Flexible Server

**Selected tier: General Purpose — Standard_D4s_v3** (4 vCPU, 16 GB RAM)

| Configuration | Value | Justification |
|---|---|---|
| Version | PostgreSQL 16 | PostGIS 3.4 compatible; latest stable |
| High Availability | Zone-redundant standby (same region) | NFR-017 (availability SLA pending, but insurance = HA required) |
| Storage | 256 GB (expandable auto-grow) | 1.1 GB source + 26 GB RPS raster + growth buffer |
| Backup | Point-in-time restore, 35-day retention | NFR-017 (RPO target pending QST-2-PM-NFR-002) |
| Connection pooling | PgBouncer (built-in) — transaction mode | Reduces connection overhead from ASP.NET Core connection pool |
| Extensions | `postgis`, `pgcrypto`, `uuid-ossp` | PostGIS for RPS (ADR-005); uuid-ossp for UUID generation |
| Private endpoint | Yes — no public internet access | VNet-bound access only |
| Performance tier | Standard_D4s_v3 | Meets RPS TID recommendation (~32 GB RAM ideal; D4s_v3 with 16 GB acceptable for 100-user workload + spatial queries) |

**ASM-3-ARCH-005:** Standard_D4s_v3 with 16 GB RAM is sufficient for the RPS spatial query workload at 100-user scale (single-point lookups, 2–10 ms per TID). If the RPS raster loading causes memory pressure, upgrade to D8s_v3 (32 GB) at no architecture change. Confidence: MEDIUM.

### 1.4 Azure Cache for Redis

**Selected tier: Basic C1** (1 GB cache)

Usage:
- Permission maps: ~1 KB per user × estimated 500 active users = ~500 KB
- Rate table cache: ~2–5 MB for all HBRater tables
- RPS results: ~100 KB (coordinate hash → score)
- Geocoding results: ~500 KB (address hash → lat/lon)
- DisburseCloud tokens: negligible

Total estimated cache usage: < 50 MB. C1 (1 GB) provides 20× headroom.

**Note:** If the Basic C1 tier is insufficient for production workload (no redundancy, single shard), upgrade to Standard C1 (with replication). The application is designed to fall back to database on cache miss — Redis unavailability degrades performance but does not break functionality (except synchronous permission invalidation, which requires Redis availability — see ART-3-005 §8.3).

### 1.5 Azure Blob Storage

**Existing account confirmed** (EV-0-0238, EV-0-0231). Container strategy:

| Container | Purpose | Access Level | Auth Pattern |
|---|---|---|---|
| `insureedge-documents` | Policy and claim documents, generated PDFs | Private | Managed Identity from App Service; SAS tokens for time-limited user downloads |
| `insureedge-uploads` | User-uploaded files, bulk upload CSVs | Private | Managed Identity |
| `insureedge-reports` | System-generated reports | Private | Managed Identity |
| `insureedge-logos` | Intermediary logos, client branding assets | Private | Managed Identity; long-lived SAS for display |
| `insureedge-static` | System default content, templates | Private | Managed Identity |

**Migration note:** Existing blobs in the source environment follow the path convention `ClientCode/ModuleName/BinRecordId/Filename` (EV-0-0238). This convention is preserved in the target — no blob renaming required during migration.

**Managed Identity transition:** Source system uses a connection string for Blob (RSK-1-INT-004). Target uses Managed Identity via `DefaultAzureCredential` — connection string removed from all configuration, stored as Key Vault secret during transition period only.

### 1.6 Azure Key Vault

One Key Vault per environment (Dev, QA, UAT, Prod):
- `insuredge-kv-dev`
- `insuredge-kv-qa`
- `insuredge-kv-uat`
- `insuredge-kv-prod`

Access policy:
- App Service Managed Identity: `Get`, `List` secrets (read-only)
- GitHub Actions service principal: `Set` secrets (CI/CD secret injection only)
- DevOps team: `Get`, `List`, `Set` (development only — not production)
- Production Key Vault: access restricted to App Service Managed Identity + break-glass account

**TranzPay production URL gate:** `insuredge-kv-uat` and `insuredge-kv-prod` will have `TranzPay--BaseUrl` set to a placeholder until GAP-2-INT-001 (production URL) is resolved. UAT deployment is blocked until this secret is populated with the confirmed production URL.

### 1.7 Azure Application Insights

Single Application Insights workspace per environment, connected to the App Service and Azure Static Web Apps:
- Structured logging via `ILogger<T>` → Application Insights sink
- Request telemetry (latency, success rate, response code distribution)
- Dependency telemetry (outbound HTTP calls to TranzPay, LenderDock, Plumsail, DisburseCloud, HexCat, Google Maps)
- Custom metrics: Hangfire job execution time, record count, error rate
- Availability tests: synthetic HTTP requests to `/health` every 5 minutes from two Azure regions
- Alert rules: P95 latency > 3s (threshold placeholder — update when NFR-016 resolved), error rate > 2%

---

## 2. Network Topology

### 2.1 VNet Architecture

```
Azure Virtual Network: insuredge-vnet (10.0.0.0/16)
├── Subnet: app-subnet (10.0.1.0/24)
│   └── App Service VNet Integration (outbound from App Service)
├── Subnet: db-subnet (10.0.2.0/24)
│   └── PostgreSQL Flexible Server Private Endpoint
├── Subnet: redis-subnet (10.0.3.0/24)
│   └── Azure Cache for Redis Private Endpoint
├── Subnet: appgw-subnet (10.0.4.0/24)
│   └── Azure Application Gateway (WAF v2)
└── Subnet: pe-subnet (10.0.5.0/24)
    └── Private Endpoints: Key Vault, Blob Storage, App Configuration
```

### 2.2 Network Security Groups (NSGs)

| NSG | Inbound Allow | Inbound Deny | Outbound Allow |
|---|---|---|---|
| `appgw-nsg` | 443 from Internet; 65200-65535 (AppGW infra) | All other | To app-subnet:443 |
| `app-nsg` | 443 from appgw-subnet | All from Internet | To db-subnet:5432; to redis-subnet:6380; to pe-subnet:443; to Internet:443 (external APIs) |
| `db-nsg` | 5432 from app-subnet | All from Internet | None |
| `redis-nsg` | 6380 from app-subnet | All from Internet | None |

### 2.3 DNS Configuration

- Private DNS zones linked to VNet for private endpoint DNS resolution:
  - `privatelink.postgres.database.azure.com`
  - `privatelink.redis.cache.windows.net`
  - `privatelink.vaultcore.azure.net`
  - `privatelink.blob.core.windows.net`
  - `privatelink.azconfig.io`

External integrations (TranzPay, LenderDock, etc.) accessed from the App Service over public internet via the `app-subnet` NSG outbound rule.

---

## 3. PostGIS for RPS — Confirmation

**Azure Database for PostgreSQL Flexible Server supports PostGIS.** This is the resolution of the RPS coupling issue per ADR-005.

Setup steps (to be executed during infrastructure provisioning in FORGE):
```sql
-- Connect to PostgreSQL Flexible Server as admin
CREATE DATABASE gis;
\c gis
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_raster;
-- raster2pgsql load:
-- raster2pgsql -s 5070 -t 2000x2000 rps_conus.tif public.rps_raster_5070 | psql -h <server> -U <admin> -d gis
-- SRID correction (if needed):
SELECT UpdateRasterSRID('public', 'rps_raster_5070', 'rast', 5070);
-- Spatial index:
CREATE INDEX rast_gist ON public.rps_raster_5070 USING GIST (ST_ConvexHull(rast));
```

**Server requirement check:** Standard_D4s_v3 (4 vCPU, 16 GB RAM) is below the TID's recommended 32 GB. Monitor RPS query performance after loading; if query time exceeds 100 ms under load, upgrade to D8s_v3. The private endpoint ensures the spatial query does not traverse the public internet.

---

## 4. Environment Strategy

### 4.1 Environments

| Environment | Purpose | App Service Plan | PostgreSQL Tier | Redis | Key Vault |
|---|---|---|---|---|---|
| Dev | Active development; feature branches | B2 (dev/test) | Burstable B2ms | Basic C0 (shared dev) | `insuredge-kv-dev` |
| QA | Integration testing; automated test suite | B2 (dev/test) | Burstable B2ms | Basic C0 | `insuredge-kv-qa` |
| UAT | User acceptance testing; performance validation | P1v3 | General Purpose D2s_v3 | Basic C1 | `insuredge-kv-uat` |
| Prod | Production | P2v3 (auto-scale 1–3) | General Purpose D4s_v3 (Zone HA) | Standard C1 | `insuredge-kv-prod` |

**Note:** Dev and QA use lower-tier services to control cost. UAT mirrors production configuration to provide realistic performance testing. Prod is the final size.

### 4.2 Deployment Slots

Production App Service uses two slots:
- **production** — live traffic
- **staging** — new release deployed here; warm-up period; then slot swap (zero-downtime)

Slot swap procedure:
1. Deploy to staging slot
2. Run smoke tests against staging slot
3. Swap slots (Azure App Service swap — zero downtime)
4. Old code now in staging slot — rollback by swapping back

### 4.3 Environment Promotion Path

```
Dev → QA (automated CI merge gate) → UAT (manual promotion gate) → Prod (Architecture Gate + manual approval)
```

See ART-3-011 for CI/CD pipeline detail.

---

## 5. Disaster Recovery and Business Continuity

### 5.1 Backup Strategy (pending NFR-017 resolution)

| Component | Backup Method | Retention |
|---|---|---|
| PostgreSQL Flexible Server | Automated backup (Azure-managed), point-in-time restore | 35 days (configurable) |
| Azure Blob Storage | Geo-redundant storage (GRS) — data replicated to paired region | Continuous |
| Key Vault | Soft-delete enabled, purge protection enabled | 90-day recovery window |
| App Service | Deployment artifacts in GitHub — re-deployable from source | Not applicable |
| Redis | Basic/Standard tier: daily snapshots available on Standard C1 and above | 1–7 days (when Standard tier used) |

**ASM-3-ARCH-006:** RPO and RTO targets are provisional pending QST-2-PM-NFR-002. The above backup configuration achieves an RPO of < 1 minute (GRS Blob) to < 5 minutes (PostgreSQL). RTO is estimated at 30–60 minutes for a full recovery from a regional outage. If the customer requires RTO < 4 hours, these are sufficient. If sub-hour RTO is required, a hot standby in a second region must be added.

### 5.2 High Availability

- PostgreSQL Flexible Server: Zone-redundant HA (standby in different AZ, same region). Automatic failover ~60 seconds.
- App Service: Auto-scale across AZs within the region.
- Redis Standard C1: Replicated within the region (Basic C1 has no replication — production should use Standard C1).

---

## 6. Cost Estimate (Preliminary — Azure East US region, 2026 pricing)

| Service | Tier | Est. Monthly Cost (USD) |
|---|---|---|
| App Service (Prod) | P2v3, 1 instance (auto-scale avg 1.2) | ~$280 |
| Azure Static Web Apps | Free tier | $0 |
| PostgreSQL Flexible Server | D4s_v3, Zone HA, 256 GB | ~$650 |
| Azure Cache for Redis (Prod) | Standard C1 | ~$55 |
| Azure Blob Storage | GRS, est. 100 GB | ~$5 |
| Azure Key Vault (Prod) | Standard, est. 10K operations/day | ~$5 |
| Azure Application Gateway + WAF | WAF v2, 1 unit | ~$250 |
| Azure App Configuration | Standard | ~$1.50 |
| Azure Application Insights | Pay-as-you-go, est. 5 GB/month | ~$12 |
| **Total Prod Monthly** | | **~$1,260** |

**Note:** Dev + QA + UAT environments add approximately 30–40% of the production cost. Rough total monthly (all environments): ~$1,800–$2,000 USD.

---

*End of ART-3-009 — Cloud / Infrastructure Architecture | INSUREEDGE-2026 | IDEATE Phase | 2026-06-17*
