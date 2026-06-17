# ART-3-011 — CI/CD Architecture
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Architecture Agent
**Phase:** IDEATE
**Date:** 2026-06-17
**Version:** 1.0 — GATE CANDIDATE
**Platform:** GitHub Actions + Azure

---

## 1. Repository and Branch Strategy

### 1.1 Branch Model (GitFlow Simplified)

```
main                ← Production-ready code. Protected. Deploys to Prod on tag.
├── develop         ← Integration branch. Deploys to Dev on push.
├── feature/*       ← Feature branches. PRs → develop. CI on PR.
├── release/x.y.z   ← Release candidates. Deploys to QA then UAT. PRs → main.
└── hotfix/*        ← Production hotfixes. PRs → main + develop.
```

**Branch protection rules (GitHub):**
- `main`: Require PR with 2 approvals; require status checks (CI build, tests) to pass; no force push
- `develop`: Require PR with 1 approval; require status checks to pass

### 1.2 Versioning

Semantic versioning: `MAJOR.MINOR.PATCH`. Tag format: `v1.2.3`.
Database migration versions align with application versions. EF Core migration names include the version prefix: `20260617_v1_0_AddRpsValueColumn`.

---

## 2. GitHub Actions Pipeline Structure

### 2.1 Pipeline Overview

```
Trigger              Pipeline                     Targets
─────────────        ──────────────────────────   ──────────────────
PR to develop   →    ci-pr.yml (CI only)          No deployment
Push to develop →    ci-cd-dev.yml                → Dev environment
Push to release →    ci-cd-qa.yml                 → QA environment
Manual trigger  →    ci-cd-uat.yml                → UAT environment (manual gate)
Tag v*.*.*      →    ci-cd-prod.yml               → Prod environment (manual approval required)
```

### 2.2 CI Pull Request Pipeline (`ci-pr.yml`)

```yaml
name: CI — Pull Request

on:
  pull_request:
    branches: [develop, main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET 8
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'

      - name: Restore NuGet packages
        run: dotnet restore InsureEdge.sln

      - name: Build (no warnings as errors in PR — only in release)
        run: dotnet build InsureEdge.sln --configuration Release --no-restore

      - name: Run unit tests
        run: dotnet test tests/InsureEdge.Domain.Tests --configuration Release --no-build --logger "trx;LogFileName=unit-results.trx" --collect:"XPlat Code Coverage"

      - name: Run application tests
        run: dotnet test tests/InsureEdge.Application.Tests --configuration Release --no-build --logger "trx;LogFileName=app-results.trx"

      - name: Architecture fitness tests
        run: dotnet test tests/InsureEdge.Architecture.Tests --configuration Release --no-build
        # Enforces: Application layer has no Infrastructure refs; Domain has no external refs

      - name: Publish test results
        uses: dorny/test-reporter@v1
        with:
          name: Test Results
          path: '**/*.trx'
          reporter: dotnet-trx

      - name: Code coverage gate (minimum 60%)
        uses: irongut/CodeCoverageSummary@v1.3.0
        with:
          filename: '**/coverage.cobertura.xml'
          fail_below_min: true
          thresholds: '60 80'

      - name: Setup Node.js for frontend
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install frontend dependencies
        run: npm ci
        working-directory: src/InsureEdge.Frontend

      - name: TypeScript type check
        run: npm run type-check
        working-directory: src/InsureEdge.Frontend

      - name: Frontend unit tests
        run: npm run test:ci
        working-directory: src/InsureEdge.Frontend

      - name: Frontend build
        run: npm run build
        working-directory: src/InsureEdge.Frontend
```

### 2.3 Dev Deployment Pipeline (`ci-cd-dev.yml`)

```yaml
name: CI/CD — Dev

on:
  push:
    branches: [develop]

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4
      - name: Setup .NET 8
        uses: actions/setup-dotnet@v4
      - name: Build and publish API
        run: dotnet publish src/InsureEdge.API -c Release -o ./publish/api
      - name: Build frontend
        run: |
          cd src/InsureEdge.Frontend
          npm ci && npm run build
      - name: Upload API artifact
        uses: actions/upload-artifact@v4
        with:
          name: api-publish
          path: ./publish/api
      - name: Upload frontend artifact
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: src/InsureEdge.Frontend/dist

  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run all tests
        run: dotnet test InsureEdge.sln -c Release --no-build

  migrate-dev:
    needs: test
    runs-on: ubuntu-latest
    environment: dev
    steps:
      - uses: actions/checkout@v4
      - name: Setup .NET 8 tools
        run: dotnet tool install --global dotnet-ef
      - name: Get DB connection string from Key Vault
        uses: Azure/get-keyvault-secrets@v1
        with:
          keyvault: insuredge-kv-dev
          secrets: 'Database--ConnectionString'
        env:
          AZURE_CREDENTIALS: ${{ secrets.AZURE_DEV_CREDENTIALS }}
      - name: Apply EF Core migrations
        run: |
          dotnet ef database update \
            --project src/InsureEdge.Infrastructure \
            --startup-project src/InsureEdge.API \
            --connection "${{ env.DATABASE__CONNECTIONSTRING }}"
        # If migration fails: pipeline stops; deployment does not proceed

  deploy-api-dev:
    needs: migrate-dev
    runs-on: ubuntu-latest
    environment: dev
    steps:
      - name: Download API artifact
        uses: actions/download-artifact@v4
        with:
          name: api-publish
          path: ./publish/api
      - name: Deploy to App Service (Dev slot)
        uses: Azure/webapps-deploy@v3
        with:
          app-name: insuredge-api-dev
          publish-profile: ${{ secrets.AZURE_DEV_APP_PUBLISH_PROFILE }}
          package: ./publish/api

  deploy-frontend-dev:
    needs: build
    runs-on: ubuntu-latest
    environment: dev
    steps:
      - name: Download frontend artifact
        uses: actions/download-artifact@v4
        with:
          name: frontend-dist
          path: ./dist
      - name: Deploy to Azure Static Web Apps (Dev)
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_DEV_SWA_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: upload
          app_location: ./dist
          skip_app_build: true
```

### 2.4 QA and UAT Pipelines

QA (`ci-cd-qa.yml`): Triggered by push to `release/*`. Identical job structure to Dev but targets QA resources and requires all tests pass including integration tests.

UAT (`ci-cd-uat.yml`): Requires `environment: uat` with required reviewer approval in GitHub Environments configuration. This is the human UAT gate. Pipeline does not proceed without explicit approval.

### 2.5 Production Deployment Pipeline (`ci-cd-prod.yml`)

```yaml
name: CI/CD — Production

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  # ... same build and test jobs as dev ...

  migrate-prod:
    needs: test
    runs-on: ubuntu-latest
    environment: prod  # Requires 2 approvals (GitHub Environment protection rule)
    steps:
      - name: Pre-migration backup check
        # Verify a PostgreSQL backup was taken in the last 2 hours before proceeding
        run: az postgres flexible-server backup list --resource-group insuredge-rg --name insuredge-db-prod --query "[?backupType=='Full'].[completionTime]" | head -1

      - name: Check BypassRefundResponse flag
        # CRITICAL: Verify BypassRefundResponse is FALSE in Prod App Configuration before deploy
        run: |
          FLAG=$(az appconfig kv show --name insuredge-config-prod --key "TranzPay:BypassRefundResponse" --query "value" -o tsv)
          if [ "$FLAG" != "false" ]; then
            echo "DEPLOYMENT BLOCKED: BypassRefundResponse is not false in Prod configuration"
            exit 1
          fi

      - name: Apply EF Core migrations to Prod
        run: |
          dotnet ef database update \
            --project src/InsureEdge.Infrastructure \
            --startup-project src/InsureEdge.API \
            --connection "${{ env.DATABASE__CONNECTIONSTRING }}"

  deploy-api-prod:
    needs: migrate-prod
    runs-on: ubuntu-latest
    environment: prod
    steps:
      - name: Deploy to App Service Staging Slot
        uses: Azure/webapps-deploy@v3
        with:
          app-name: insuredge-api-prod
          slot-name: staging
          publish-profile: ${{ secrets.AZURE_PROD_APP_STAGING_PUBLISH_PROFILE }}
          package: ./publish/api

      - name: Run smoke tests against staging slot
        run: |
          curl -f https://insuredge-api-prod-staging.azurewebsites.net/health/ready
          # Run critical path smoke tests

      - name: Swap staging to production
        run: |
          az webapp deployment slot swap \
            --resource-group insuredge-rg \
            --name insuredge-api-prod \
            --slot staging \
            --target-slot production
```

---

## 3. Environment Promotion Gates

| Promotion | Gate Type | Requirements |
|---|---|---|
| Feature → Develop | PR review | 1 approval; CI (build + unit tests) passing |
| Develop → Dev | Automatic | All CI checks pass |
| Develop → Release | PR review | 2 approvals; all tests pass including integration |
| Release → QA | Automatic on release branch push | All tests pass |
| QA → UAT | Manual GitHub Environment approval | QA sign-off (1 approver from test team) |
| UAT → Prod | Manual GitHub Environment approval | Architecture Gate PASSED (this document) + 2 approvals (customer + tech lead) |
| Prod deployment | Automated checks | BypassRefundResponse = false; DB backup verified; smoke tests pass before slot swap |

---

## 4. Database Migration Strategy

### 4.1 EF Core Migrations

Code-first EF Core migrations managed in `InsureEdge.Infrastructure/Migrations/`.

**Naming convention:** `{timestamp}_{version}_{description}.cs`
Example: `20260617_v1_0_InitialSchema.cs`, `20260618_v1_0_AddRpsValueColumn.cs`

**Migration rules:**
1. Migrations are **forward-only** in production. Rollback is a new migration, not a revert.
2. Each migration must be tested in Dev and QA before UAT promotion.
3. Destructive migrations (DROP COLUMN, DROP TABLE) require an explicit `--force` flag in the pipeline and a second human approval in the UAT gate.
4. `HasData()` seed migrations for lookup tables (PolicyStatus, CoverageType, etc.) are separated from schema migrations.

### 4.2 Sentinel Date Migration

A dedicated data migration step (outside EF Core schema migrations) converts sentinel dates:
```sql
UPDATE policy SET expiration_date = NULL WHERE expiration_date = '1900-01-01';
UPDATE claim SET loss_date = NULL WHERE loss_date = '1900-01-01';
-- Applied to all date columns confirmed to use sentinel pattern (NFR-011)
```
This step runs ONCE during the initial data migration from SQL Server → PostgreSQL (Migration Agent's scope). The EF Core schema migration enforces NULL for these columns going forward.

### 4.3 Schema Typo Corrections in Migrations

The EF Core initial migration creates all tables with corrected names. The `HasColumnName("...")` EF Core mapping ensures the PostgreSQL column name is the corrected spelling. This is applied at the source-to-target migration step, not as a separate column rename:
```csharp
// In OnModelCreating for existing typo-affected entities
modelBuilder.Entity<PolicyCommission>()
    .Property(p => p.CommissionPercentage)
    .HasColumnName("CommissionPercentage");  // Target column — no typo
```

---

## 5. Secret Injection Pattern

Secrets are NEVER stored in GitHub Actions environment variables or secrets as static values (except service principal credentials for Key Vault access). At runtime:

1. **App Service** loads secrets directly from Key Vault via Managed Identity at startup (`AddAzureKeyVault` in `Program.cs`).
2. **CI/CD pipeline** uses GitHub OIDC to authenticate to Azure and retrieve deployment credentials (never long-lived service principal secrets stored in GitHub).
3. **Database connection string** in the migration step is retrieved from Key Vault using a federated identity credential — not from a GitHub secret.

```yaml
# GitHub OIDC authentication to Azure (no static credentials)
- name: Authenticate to Azure
  uses: Azure/login@v2
  with:
    client-id: ${{ vars.AZURE_CLIENT_ID }}
    tenant-id: ${{ vars.AZURE_TENANT_ID }}
    subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

---

*End of ART-3-011 — CI/CD Architecture | INSUREEDGE-2026 | IDEATE Phase | 2026-06-17*
