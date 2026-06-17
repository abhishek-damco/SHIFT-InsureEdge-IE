# ART-4-008 — Deployment Specifications
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Status:** AI_GENERATED
**Produced by:** Forge Agent
**Phase:** FORGE
**Date:** 2026-06-17
**Version:** 1.0
**Engagement:** INSUREEDGE-2026 | Customer: Hudson Bailey
**Architecture gate:** PASSED (DEC-3-0003, 2026-06-17)
**Primary inputs:** ART-3-005 (Backend Architecture), ART-3-011 (DevOps architecture reference), ART-3-012 (TAD §7 CI/CD), ADR-008 (No APIM), ADR-010 (Key Vault)

**Note to engineers:** This document specifies workflow structure, jobs, steps, and logic in structured prose and pseudocode. Engineers must translate each workflow outline into final YAML using the project's agreed GitHub Actions conventions. Full YAML is marked AI_GENERATED-SKELETON in this document and requires ENGINEER_IMPLEMENTED review.

---

## Section 1: Overview

Five GitHub Actions workflows govern all build, test, and deployment activity:

| Workflow | File | Trigger |
|---|---|---|
| `ci.yml` | `.github/workflows/ci.yml` | Push to any branch; PR to `develop` or `main` |
| `deploy-dev.yml` | `.github/workflows/deploy-dev.yml` | Merge to `develop` |
| `deploy-staging.yml` | `.github/workflows/deploy-staging.yml` | Merge to `release/*` |
| `deploy-prod.yml` | `.github/workflows/deploy-prod.yml` | Merge to `main` (manual approval gate required) |
| `db-migrate.yml` | `.github/workflows/db-migrate.yml` | Manual dispatch only (`workflow_dispatch`) |

### Environment Protection Rules

| GitHub Environment | Reviewers required | Secret scope |
|---|---|---|
| `development` | None | Dev Key Vault |
| `staging` | 1 reviewer (any team member) | UAT Key Vault |
| `production` | 2 reviewers (project lead + Damco) | Prod Key Vault |

**Governance (ADR-010):** All secrets fetched from Azure Key Vault via OIDC (no secrets stored in GitHub repository secrets or environment variables, except OIDC client/tenant IDs and Key Vault URL).

---

## Section 2: CI Workflow (`ci.yml`)

### Purpose
Build and test every code change before any deployment. Mandatory pass before any PR can merge.

### Trigger
```
on:
  push:
    branches: ['**']
  pull_request:
    branches: [develop, main]
```

### Jobs

#### Job: `build-backend`
**Runner:** `ubuntu-latest`
**Steps:**

1. **Checkout** — `actions/checkout@v4`; fetch depth 1
2. **Setup .NET 8** — `actions/setup-dotnet@v4` with `dotnet-version: 8.x`
3. **Restore packages** — `dotnet restore src/InsureEdge.sln`
4. **Build (release)** — `dotnet build src/InsureEdge.sln --configuration Release --no-restore`
5. **Run unit tests** — `dotnet test tests/InsureEdge.UnitTests/ --configuration Release --no-build --collect:"XPlat Code Coverage" --results-directory ./coverage`
6. **Upload coverage report** — `actions/upload-artifact@v4` with path `./coverage`
7. **Code coverage gate** — `reportgenerator` action; fail if line coverage < 80%

#### Job: `build-frontend`
**Runner:** `ubuntu-latest`
**Steps:**

1. **Checkout** — `actions/checkout@v4`
2. **Setup Node 20** — `actions/setup-node@v4` with `node-version: 20`
3. **Install dependencies** — `npm ci` in `frontend/`
4. **Type check** — `npx tsc --noEmit` in `frontend/`
5. **Lint** — `npm run lint` (ESLint; warn-on-error not block)
6. **Run unit tests** — `npm run test -- --run` (Vitest); fail if any test fails
7. **Build** — `npm run build`; assert `dist/` directory created
8. **Upload dist artifact** — `actions/upload-artifact@v4` with path `frontend/dist/`

#### Job: `integration-tests`
**Runner:** `ubuntu-latest`
**Depends on:** `build-backend`
**Services:** PostgreSQL 16 container, Redis 7 container (for Testcontainers-based integration tests)

**Steps:**

1. **Checkout** — `actions/checkout@v4`
2. **Setup .NET 8** — same as above
3. **Run integration tests** — `dotnet test tests/InsureEdge.IntegrationTests/ --configuration Release --logger "trx;LogFileName=integration-results.trx"`
4. **Upload test results** — `actions/upload-artifact@v4` path `**/integration-results.trx`

**Note:** Integration tests use Testcontainers; Docker daemon is available on `ubuntu-latest`. No connection to Azure services in CI; all external dependencies mocked.

---

## Section 3: Deploy to Dev (`deploy-dev.yml`)

### Purpose
Automatic deployment of the latest `develop` branch to the Development environment on every merge.

### Trigger
```
on:
  push:
    branches: [develop]
```

### Prerequisites
- GitHub Environment `development` must exist
- Federated OIDC credential configured on the Azure service principal for the `development` environment (per ADR-010)
- Key Vault reference: `kv-insuredge-dev`

### Jobs

#### Job: `deploy-api`
**Runner:** `ubuntu-latest`
**Environment:** `development`
**Steps:**

1. **Checkout** — `actions/checkout@v4`
2. **Setup .NET 8**
3. **Build API (Release)** — `dotnet publish src/InsureEdge.API/ -c Release -o ./publish/api`
4. **Azure OIDC Login** — `azure/login@v2` with `client-id`, `tenant-id`, `subscription-id` (from GitHub environment secrets; not from Key Vault — these are identity tokens, not application secrets)
5. **Fetch deploy secrets from Key Vault** — `azure/get-keyvault-secrets@v1` with `keyvault: kv-insuredge-dev`; fetch `AppService-PublishProfile-Dev`
6. **Deploy to App Service** — `azure/webapps-deploy@v3`; slot: `production` (dev has no staging slot); package `./publish/api`
7. **Health check** — `curl -f https://api-dev.insuredge.example.com/health` (retry 3 times, 15-second intervals); fail pipeline if health check fails after retries

#### Job: `deploy-frontend`
**Runner:** `ubuntu-latest`
**Environment:** `development`
**Depends on:** `build-frontend` from CI (uses uploaded `dist` artifact)

**Steps:**

1. **Download dist artifact** — `actions/download-artifact@v4` artifact name `frontend-dist`
2. **Azure OIDC Login**
3. **Deploy to Static Web Apps** — `azure/static-web-apps-deploy@v1`; environment `development`; app location `./frontend-dist`; output location empty

#### Job: `run-migrations-dev`
**Runner:** `ubuntu-latest`
**Environment:** `development`
**Depends on:** (none — migrations run before API deploy; use `needs: []` with manual ordering if required)

**Note:** See Section 7 (`db-migrate.yml`) for migration execution. In Dev, migrations run as part of deploy pipeline automatically. In production, `db-migrate.yml` is triggered manually (separately) before `deploy-prod.yml`.

---

## Section 4: Deploy to Staging (`deploy-staging.yml`)

### Purpose
Deploy to QA and UAT environments when a release branch is ready. Staging requires one reviewer approval.

### Trigger
```
on:
  push:
    branches: ['release/**']
```

### GitHub Environment
`staging` (requires 1 reviewer approval)

### Jobs

#### Job: `deploy-api-staging`
**Runner:** `ubuntu-latest`
**Environment:** `staging`
**Steps:**

1. **Checkout**
2. **Setup .NET 8**
3. **Build API (Release)** — publish to `./publish/api`
4. **Azure OIDC Login**
5. **Fetch staging Key Vault secrets** — `kv-insuredge-uat`; fetch `AppService-PublishProfile-UAT`
6. **Deploy to staging slot** — `azure/webapps-deploy@v3`; slot: `staging` (not production slot yet)
7. **Health check on staging slot** — `curl -f https://api-uat-staging.insuredge.example.com/health`
8. **Swap slots** — `azure/CLI@v2` run: `az webapp deployment slot swap --resource-group rg-insuredge-uat --name api-insuredge-uat --slot staging --target-slot production`
9. **Health check on production slot (UAT)** — `curl -f https://api-uat.insuredge.example.com/health`

#### Job: `deploy-frontend-staging`
**Runner:** `ubuntu-latest`
**Environment:** `staging`
**Steps:**

1. **Download dist artifact**
2. **Azure OIDC Login**
3. **Deploy to Static Web Apps (UAT environment)**

---

## Section 5: Deploy to Production (`deploy-prod.yml`)

### Purpose
Controlled production deployment with mandatory two-reviewer approval, blue-green slot swap via App Service deployment slots, and automatic rollback on health check failure.

### Trigger
```
on:
  push:
    branches: [main]
```

### GitHub Environment
`production` (requires 2 reviewer approvals: project lead + Damco representative; 24-hour approval window)

### Pre-deployment checklist (enforced as job-level conditions)
Engineers must verify each item before triggering:
1. `db-migrate.yml` successfully completed against the production PostgreSQL instance
2. All P1 bugs in the current release milestone are closed
3. Maintenance window communication sent to all tenants (per ART-3-014 §3 ASM-3-MIG-001 pattern)
4. Rollback plan documented in the release PR

### Jobs

#### Job: `await-approval`
**Runner:** `ubuntu-latest`
**Environment:** `production` (environment protection rules enforce 2-reviewer approval)
This job exists to trigger the environment protection gate. It performs no steps; all subsequent jobs depend on it.

#### Job: `pre-deploy-smoke`
**Runner:** `ubuntu-latest`
**Depends on:** `await-approval`
**Steps:**

1. **Checkout**
2. **Run smoke test suite** — `dotnet test tests/InsureEdge.SmokeTests/ --configuration Release` (lightweight; no DB writes; validates config, secrets availability, Key Vault connectivity)

#### Job: `deploy-api-prod`
**Runner:** `ubuntu-latest`
**Environment:** `production`
**Depends on:** `pre-deploy-smoke`
**Steps:**

1. **Checkout**
2. **Setup .NET 8**
3. **Build API (Release)** — publish to `./publish/api`
4. **Azure OIDC Login** (production OIDC federated credential)
5. **Fetch Prod Key Vault secrets** — `kv-insuredge-prod`; fetch `AppService-PublishProfile-Prod`
6. **Deploy to staging slot** — `azure/webapps-deploy@v3`; slot: `staging`
7. **Health check on staging slot** — `curl -f https://api-prod-staging.insuredge.example.com/health`
   - Retry 5 times, 30-second intervals
   - If any retry fails: exit 1 (deploy fails; production slot untouched — no rollback needed)
8. **Swap slots (blue-green)** — `az webapp deployment slot swap --slot staging --target-slot production`
9. **Health check on production slot** — `curl -f https://api.insuredge.example.com/health`
   - Retry 3 times, 30-second intervals
   - If health check fails post-swap: trigger rollback (Step 10)
10. **Automatic rollback on failure** — `az webapp deployment slot swap --slot production --target-slot staging` (re-swaps to restore previous version)
    - Send rollback notification via GitHub Step Summary + email (use `gh` CLI with repo notification)

#### Job: `deploy-frontend-prod`
**Runner:** `ubuntu-latest`
**Environment:** `production`
**Depends on:** `deploy-api-prod` (ensures API is healthy before routing SPA traffic to new version)
**Steps:**

1. **Download dist artifact**
2. **Azure OIDC Login**
3. **Deploy to Static Web Apps (production environment)**

#### Job: `post-deploy-validation`
**Runner:** `ubuntu-latest`
**Depends on:** `deploy-api-prod`, `deploy-frontend-prod`
**Steps:**

1. **Run E2E smoke tests** — `npx playwright test tests/smoke/` against production URL (read-only flows only: login, policy list, claim list)
2. **Assert Application Insights alert rules are active** — `az monitor alert-rule list --resource-group rg-insuredge-prod` (validates alert configuration not inadvertently disabled)
3. **Write deployment summary** to `$GITHUB_STEP_SUMMARY`: version deployed, commit SHA, deployment timestamp, slot swap status, smoke test pass/fail

---

## Section 6: Database Migration (`db-migrate.yml`)

### Purpose
Run EF Core database migrations against a target environment. Triggered manually (separately from application deployment) to allow independent control, review, and rollback.

### Trigger
```
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options: [development, staging, production]
      dry_run:
        description: 'Dry run (generate SQL script only; do not apply)'
        required: true
        type: boolean
        default: true
```

### Governance rule
Running against `production` requires `dry_run=false` AND a separate explicit confirmation input to prevent accidental execution. Engineers should run `dry_run=true` first, review generated SQL, then re-run with `dry_run=false` only after human review.

### Jobs

#### Job: `generate-migration-script`
**Runner:** `ubuntu-latest`
**Environment:** `{inputs.environment}` (environment protection rules apply — production needs 2 reviewers)
**Steps:**

1. **Checkout**
2. **Setup .NET 8**
3. **Install EF Core CLI** — `dotnet tool install --global dotnet-ef`
4. **Azure OIDC Login**
5. **Fetch DB connection string from Key Vault** — `kv-insuredge-{environment}`; secret: `Db-ConnectionString-{Environment}`
6. **Generate SQL migration script** — `dotnet ef migrations script --idempotent --output ./migrations/pending.sql --project src/InsureEdge.Infrastructure/ --startup-project src/InsureEdge.API/`
7. **Upload SQL script as artifact** — `actions/upload-artifact@v4` path `./migrations/pending.sql`
8. **Print script to Step Summary** for engineer review in GitHub Actions UI

#### Job: `apply-migrations` (conditional)
**Runner:** `ubuntu-latest`
**Depends on:** `generate-migration-script`
**Condition:** `inputs.dry_run == false`
**Steps:**

1. **Download migration script artifact**
2. **Azure OIDC Login**
3. **Fetch DB connection string from Key Vault**
4. **Pre-migration backup** (production only):
   - `az postgres flexible-server backup create --resource-group rg-insuredge-prod --name psql-insuredge-prod --backup-name pre-migration-$(date +%Y%m%d-%H%M%S)`
   - Wait for backup completion (or assert recent automatic backup exists within last 2 hours)
5. **Apply migrations** — `dotnet ef database update --project src/InsureEdge.Infrastructure/ --startup-project src/InsureEdge.API/`
   - Connection string injected via environment variable `INSUREDGE_DB_CONNECTIONSTRING` from Key Vault fetch
6. **Verify migration applied** — `dotnet ef migrations list --project src/InsureEdge.Infrastructure/ --startup-project src/InsureEdge.API/` — assert latest migration is marked as Applied
7. **Row count validation** — Execute row count queries from ART-4-006 §7.1 validation table; write results to Step Summary
8. **Write migration log** to `$GITHUB_STEP_SUMMARY`: migrations applied, environment, timestamp, row counts

---

## Section 7: Secrets Strategy (ADR-010)

No application secrets are stored in GitHub repository secrets or in `appsettings.json`. The only values stored in GitHub are:
- `AZURE_CLIENT_ID` — OIDC application client ID
- `AZURE_TENANT_ID` — Azure tenant ID
- `AZURE_SUBSCRIPTION_ID` — Azure subscription ID
- `KEY_VAULT_URL_{ENV}` — URL of the environment's Key Vault (not a secret; a configuration value)

At runtime, the workflows fetch secrets using `azure/get-keyvault-secrets@v1` or Azure CLI. Application configuration reads secrets via `AddAzureKeyVault` on startup (ADR-010, `ManagedIdentityCredential`).

**22 named Key Vault secrets** (documented in ART-4-005 §9.3) are referenced by workflows. No workflow YAML ever contains a secret value — only the name (reference).

---

## Section 8: Branch and Merge Strategy

```
feature/* ──── PR review ──→ develop ──── PR review ──→ release/vX.Y ──── approval ──→ main
                               │                              │                          │
                            deploy-dev                  deploy-staging               deploy-prod
```

**Branch protection rules:**

| Branch | Required checks | Required approvals | Restrict push |
|---|---|---|---|
| `main` | `ci/build-backend`, `ci/build-frontend`, `ci/integration-tests` | 2 (project lead + Damco) | Team leads only |
| `develop` | `ci/build-backend`, `ci/build-frontend` | 1 (any team member) | No |
| `release/*` | `ci/build-backend`, `ci/integration-tests` | 1 | No |

---

## Section 9: Rollback Procedures

### API Rollback (Production)
1. If health check fails post-slot-swap: automatic rollback via `deploy-prod.yml` Step 10 (re-swap)
2. If health check passes but functional issue is discovered post-deploy: manual swap via `az webapp deployment slot swap` (swap back; previous version still in staging slot for 48 hours per App Service retention)
3. If slot is no longer available: re-trigger `deploy-prod.yml` from the previous commit SHA (use `git revert` + merge to `main`)

### Database Rollback
There is no automatic database rollback. Migration scripts are designed to be forward-only (additive).
For destructive migrations: down migrations must be written explicitly and applied via `db-migrate.yml` with `dry_run=true` → review → `dry_run=false`.
For data corruption: restore from the pre-migration backup created in `db-migrate.yml` Step 4 (Production only).

### Frontend Rollback
Azure Static Web Apps maintains previous deployment history. Use Azure CLI: `az staticwebapp environment list` → `az staticwebapp functions delete` to reactivate a prior deployment.

---

## Section 10: DBT-4-FORGE Items (Deployment-Specific)

### DBT-4-FORGE-017 — Prod Key Vault URL Not Resolved
**Raised:** 2026-06-17
**Impact:** `deploy-prod.yml` cannot reference the correct Key Vault URL until the production Azure environment is provisioned.
**Placeholder:** `KEY_VAULT_URL_PROD` is used throughout; must be populated in the `production` GitHub environment before first production deployment.
**Blocking:** Yes — production deployment cannot run without this value.

### DBT-4-FORGE-018 — OIDC Federated Credentials Not Yet Configured
**Raised:** 2026-06-17
**Impact:** Azure service principal federated credentials must be created for each GitHub environment (`development`, `staging`, `production`) before any workflow can authenticate via OIDC.
**Placeholder:** `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` in each GitHub environment.
**Blocking:** Yes — all `azure/login@v2` steps fail without this.

### DBT-4-FORGE-019 — Static Web Apps Configuration Naming
**Raised:** 2026-06-17
**Impact:** Azure Static Web Apps resource names for each environment are not in the TAD. The `azure/static-web-apps-deploy@v1` action requires the deployment token or resource name.
**Placeholder:** `STATIC_WEB_APP_NAME_{ENV}` throughout.
**Blocking:** No — can be resolved during infrastructure provisioning; does not block API deployment.

---

## Section 11: Infrastructure-as-Code Integration

The GitHub Actions workflows assume that Azure infrastructure is provisioned via Terraform before any application deployment. Terraform state is managed in an Azure Storage Account backend (not included in this document — see ART-4-005 §2 for resource group and networking specifications).

**Terraform workflow** (not a FORGE artifact; engineer-created):
- `infrastructure/terraform/environments/{dev,uat,prod}/main.tf` contains environment-specific variable overrides
- `terraform apply` is run manually before the first deployment to an environment
- All subsequent deployments use the pre-provisioned infrastructure

**Terraform outputs** consumed by GitHub Actions:
- `app_service_name` — consumed by `azure/webapps-deploy@v3`
- `static_web_app_name` — consumed by `azure/static-web-apps-deploy@v1`
- `key_vault_url` — consumed by `azure/get-keyvault-secrets@v1`
- `postgresql_fqdn` — consumed by `db-migrate.yml` (injected into connection string template)

---

## Section 12: Monitoring Integration (Post-Deploy)

After each production deployment, the following Application Insights dashboards should be verified manually (30 minutes post-deploy):
- Error rate (baseline: < 1% of requests)
- P99 response time (baseline: < 2,000 ms per ART-4-005 §13)
- Payment flow error count (baseline: 0 errors)
- Active timer jobs (baseline: all 11 enabled unless explicitly disabled)

Alert rules are configured in ART-4-005 §13.2. Alerts fire to the Application Insights Action Group (email + Teams webhook — teams webhook URL is a HUMAN_VALIDATION_REQUIRED placeholder in ART-4-005).

---

*End of ART-4-008 — Deployment Specifications | INSUREEDGE-2026 | FORGE Phase | 2026-06-17*
*Status: AI_GENERATED. Covers 5 GitHub Actions workflows. 3 DBT-4-FORGE items raised (DBT-4-FORGE-017 through DBT-4-FORGE-019). Production deployment requires 2 reviewers and manual slot-swap approval. Database migrations are always separated from application deployment (manual dispatch). Secret injection via OIDC + Key Vault; no secrets in GitHub repository.*
