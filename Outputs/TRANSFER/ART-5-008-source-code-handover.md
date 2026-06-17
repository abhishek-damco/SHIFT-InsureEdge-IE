# ART-5-008 — Source Code Handover Package
## InsureEdge Application Modernization (INSUREEDGE-2026)

**Status:** AI_GENERATED
**Produced by:** Transfer Agent
**Phase:** TRANSFER
**Date:** 2026-06-17
**Version:** 1.0
**Engagement:** INSUREEDGE-2026 | Customer: Hudson Bailey
**Source:** ART-4-001 (Repository Structure), ART-4-008 (Deployment Specs), ART-3-012 (TAD)

---

## Section 1: Repository Checklist

The following items must be present in the GitHub repository before handover is complete. Each item requires an engineer to verify and check off.

### 1.1 Repository Structure (from ART-4-001)

| Item | Required Content | Engineer Check |
|---|---|---|
| `src/InsureEdge.API/` | Entry point: controllers, middleware, `Program.cs`, health checks, Hangfire configuration | [ ] |
| `src/InsureEdge.Domain/` | Domain entities, value objects, domain services, interfaces | [ ] |
| `src/InsureEdge.Application/` | Application services, MediatR commands/queries, validators (FluentValidation) | [ ] |
| `src/InsureEdge.Infrastructure/` | EF Core DbContexts (one per domain), repositories, EF Core migrations, Dapper raw queries | [ ] |
| `src/InsureEdge.Integrations/` | Typed `HttpClient` implementations for all 10 external integrations + Polly policies | [ ] |
| `src/InsureEdge.BackgroundJobs/` | All 11 Hangfire job implementations with kill switch pattern | [ ] |
| `src/InsureEdge.Shared/` | `TenantContext`, `PermissionEvaluationService`, `AesEncryptionService`, `AuditService`, `EmailService`, common exceptions | [ ] |
| `frontend/` | React 18 SPA: all 65 screens across 7 domains; Vite build config; TypeScript strict mode | [ ] |
| `tests/InsureEdge.UnitTests/` | Unit tests (xUnit + Moq) | [ ] |
| `tests/InsureEdge.IntegrationTests/` | Integration tests (Testcontainers — PostgreSQL + Redis) | [ ] |
| `tests/InsureEdge.SmokeTests/` | Lightweight smoke tests used in CI pre-deploy check | [ ] |
| `tests/playwright/tests/smoke/` | E2E smoke tests (Playwright) for post-deploy validation | [ ] |
| `migrations/tools/BlobExtractor/` | .NET Worker Service for binary extraction from source SQL Server | [ ] |
| `infrastructure/terraform/environments/` | Terraform configs for dev, uat, prod environments | [ ] |
| `.github/workflows/ci.yml` | CI workflow: build-backend, build-frontend, integration-tests | [ ] |
| `.github/workflows/deploy-dev.yml` | Auto-deploy to dev on develop branch merge | [ ] |
| `.github/workflows/deploy-staging.yml` | Deploy to staging on release/* branch | [ ] |
| `.github/workflows/deploy-prod.yml` | Production deploy with 2-reviewer gate and slot swap | [ ] |
| `.github/workflows/db-migrate.yml` | Manual database migration workflow with dry-run option | [ ] |
| `README.md` | Project overview, setup instructions, architecture summary | [ ] |
| `.gitignore` | Excludes: `bin/`, `obj/`, `.env`, `appsettings.*.json` (except `.Development`), `node_modules/`, `*.user`, Terraform state files | [ ] |
| `InsureEdge.sln` | Solution file referencing all backend projects | [ ] |

### 1.2 Required Configuration Files (Do NOT contain secrets)

| File | Content | Engineer Check |
|---|---|---|
| `src/InsureEdge.API/appsettings.json` | Non-secret config: logging levels, Hangfire config, EF Core migration assembly references | [ ] |
| `src/InsureEdge.API/appsettings.Development.json` | Dev-only overrides: local Docker PostgreSQL connection, Redis connection — NOT real credentials | [ ] |
| `frontend/.env.example` | Example environment variable names — no values. Actual values in Azure Static Web Apps config. | [ ] |
| `infrastructure/terraform/variables.tf` | Terraform variable definitions (no default values for secrets) | [ ] |

---

## Section 2: AI_GENERATED Artifact Inventory

**Status of all 10 FORGE artifacts: AI_GENERATED. None have been ENGINEER_IMPLEMENTED.**

All artifacts below are AI-assisted analysis and specification documents. They provide the foundation for implementation but must be reviewed, tested, and validated by qualified engineers before production use. The `ENGINEER_IMPLEMENTED` tag is set by the engineering team after:
1. Code has been written/reviewed based on the specification.
2. Tests pass against the specification.
3. The section/artifact has been validated by a human SME.

| ART ID | Artifact Name | Phase | Producing Agent | File Path | Status Tag |
|---|---|---|---|---|---|
| ART-4-001 | Repository Structure | FORGE | Forge Agent | `Outputs/FORGE/ART-4-001-repository-structure.md` | AI_GENERATED |
| ART-4-002 | Domain Models | FORGE | Forge Agent | `Outputs/FORGE/ART-4-002-domain-models.md` | AI_GENERATED |
| ART-4-003 | API Specifications | FORGE | Forge Agent | `Outputs/FORGE/ART-4-003-api-specifications.md` | AI_GENERATED |
| ART-4-004 | Component Specifications | FORGE | Forge Agent | `Outputs/FORGE/ART-4-004-component-specifications.md` | AI_GENERATED |
| ART-4-005 | Infrastructure Specifications | FORGE | Forge Agent | `Outputs/FORGE/ART-4-005-infrastructure-specifications.md` | AI_GENERATED |
| ART-4-006 | Migration Scripts | FORGE | Forge Agent | `Outputs/FORGE/ART-4-006-migration-scripts.md` | AI_GENERATED — HUMAN_VALIDATION_REQUIRED |
| ART-4-007 | Test Specifications | FORGE | QA Agent | `Outputs/FORGE/ART-4-007-test-specifications.md` | AI_GENERATED |
| ART-4-008 | Deployment Specifications | FORGE | Forge Agent | `Outputs/FORGE/ART-4-008-deployment-specifications.md` | AI_GENERATED |
| ART-4-009 | Test Strategy | FORGE | QA Agent | `Outputs/FORGE/ART-4-009-test-strategy.md` | AI_GENERATED |
| ART-4-010 | Test Coverage Matrix | FORGE | QA Agent | `Outputs/FORGE/ART-4-010-test-coverage-matrix.md` | AI_GENERATED |

**No FORGE artifact has been marked ENGINEER_IMPLEMENTED. Only the engineering team can set this tag.**

---

## Section 3: HUMAN_VALIDATION_REQUIRED Sign-Off Sheet

27 sections across the FORGE artifacts are tagged HUMAN_VALIDATION_REQUIRED. Each section must be reviewed, validated, and signed off by the appropriate engineering or SME role before the corresponding implementation is used in production.

| # | Artifact | Section Description | Risk if Used Without Review | Reviewer Role | Sign-Off | Date |
|---|---|---|---|---|---|---|
| 1 | ART-4-006 §1 | Schema Creation (DDL patterns, EF Core migration output) | Database schema errors, missing FKs, extension failures | DBA | ___________ | ______ |
| 2 | ART-4-006 §1.3 | Schema validation queries — must pass before proceeding | Migration may proceed on incomplete schema | DBA | ___________ | ______ |
| 3 | ART-4-006 §2 | Reference data migration (pgloader commands) | Reference data mismatch, lookup table corruption | DBA | ___________ | ______ |
| 4 | ART-4-006 §2.2 | WritingCompany typo correction (WrittingCompany → writing_company) | Schema typo not corrected; NFR-012 violation | DBA + Tech Lead | ___________ | ______ |
| 5 | ART-4-006 §3 | HBRater rating engine table migration | Incorrect rate data; pricing errors | DBA + Business Lead | ___________ | ______ |
| 6 | ART-4-006 §4 | System and tenant data migration — SECURITY CRITICAL | Password migration, permission errors | DBA + Security Lead | ___________ | ______ |
| 7 | ART-4-006 §4.2 | AppUser migration — password_hash NULL, requires_password_reset TRUE | Password leak; security violation (RSK-1-SEC-001) | Security Lead | ___________ | ______ |
| 8 | ART-4-006 §5 | Operational data (accounts, intermediaries, policies) | Financial data errors, orphan records | DBA + Business Lead | ___________ | ______ |
| 9 | ART-4-006 §5.2 | Sentinel date conversion (1900-01-01 → NULL) | Invalid dates in production; NFR-011 violation | DBA | ___________ | ______ |
| 10 | ART-4-006 §5.3 | Policy migration — $195 fee universal application | Incorrect policy fees; BR-POL-FEE-001 violation | Business Lead | ___________ | ______ |
| 11 | ART-4-006 §5.4 | PolicyPremium intermediate entity | Financial calculation chain broken | DBA + Business Lead | ___________ | ______ |
| 12 | ART-4-006 §6 | Claims and financial data migration — FINANCIAL CRITICAL | Claims data errors, payment history loss | DBA + Business Lead + Finance | ___________ | ______ |
| 13 | ART-4-006 §6.1 | Pre-phase orphan check — must return 0 before claims load | Orphan claims in target; data integrity failure | DBA | ___________ | ______ |
| 14 | ART-4-006 §6.3 | WorksheetPayment amounts | Financial amounts incorrect | DBA + Finance Lead | ___________ | ______ |
| 15 | ART-4-006 §6.4 | PolicyPaymentTransaction financial totals | Payment history incorrect; reconciliation failure | DBA + Finance Lead | ___________ | ______ |
| 16 | ART-4-006 §6.5 | BankDetail encrypted fields — re-encryption required | ACH data not decryptable in target (DBT-4-FORGE-016) | Security Lead + DBA | ___________ | ______ |
| 17 | ART-4-006 §6.6 | Binary extraction to Azure Blob (BlobExtractor Worker) | Documents lost or inaccessible | DBA + Tech Lead | ___________ | ______ |
| 18 | ART-4-006 §7 | All validation queries — must all pass before cutover | Cutover proceeds on invalid data | DBA + Business Lead + Security Lead | ___________ | ______ |
| 19 | ART-4-006 §7.5 | Financial spot-check queries | Financial totals not verified | Finance Lead | ___________ | ______ |
| 20 | ART-4-008 (full) | GitHub Actions workflow structure and YAML | CI/CD pipeline fails; deployment fails; security misconfiguration | DevOps + Tech Lead | ___________ | ______ |
| 21 | ART-4-008 §7 | Secrets strategy (Key Vault names, OIDC configuration) | Secrets exposed or inaccessible | Security Lead + DevOps | ___________ | ______ |
| 22 | ART-4-005 §9.3 | 22 named Key Vault secrets — all values must be loaded | Application cannot start (missing credentials) | DevOps + Security Lead | ___________ | ______ |
| 23 | ART-4-003 (full) | API endpoint specifications (OpenAPI) | API contract mismatches; client integration breaks | Tech Lead | ___________ | ______ |
| 24 | ART-4-002 (full) | Domain entity models and EF Core configuration | ORM configuration errors; data model inconsistencies | Tech Lead + DBA | ___________ | ______ |
| 25 | ART-4-004 §payment | Payment service component (TranzPay integration) | Payment flow broken; PCI scope violation if AddCCCharge implemented | Tech Lead + Security Lead | ___________ | ______ |
| 26 | ART-4-010 (full) | Test coverage matrix — 33 PROVISIONAL tests, 14 GAPs | Tests provide false assurance; gaps in coverage | QA Lead + Tech Lead | ___________ | ______ |
| 27 | ART-5-005 (full) | Deployment runbook — all [HUMAN GATE] steps | Production deployment proceeds without validation | DevOps + DBA + Tech Lead + Product Owner | ___________ | ______ |

**Sign-off legend:** Sign with name, role, and date. Leave blank if section has not yet been reviewed.

---

## Section 4: Environment Configuration Checklist

For each environment, confirm the following before deployment.

### Development Environment

| Item | Required Value | Configured |
|---|---|---|
| GitHub Environment | `development` created | [ ] |
| OIDC Federated Credential | Configured for `development` environment | [ ] |
| Key Vault | `insuredge-kv-dev` created | [ ] |
| Key Vault Secrets | Dev-equivalent values loaded (not production credentials) | [ ] |
| `AZURE_CLIENT_ID` (GitHub secret) | Populated | [ ] |
| `AZURE_TENANT_ID` (GitHub secret) | Populated | [ ] |
| `AZURE_SUBSCRIPTION_ID` (GitHub secret) | Populated | [ ] |
| `KEY_VAULT_URL_DEV` (GitHub secret) | Populated | [ ] |
| App Service | `api-insuredge-dev` (B2 tier) | [ ] |
| Static Web Apps | Dev environment | [ ] |
| PostgreSQL | `psql-insuredge-dev` (Burstable B2ms) | [ ] |
| Redis | `redis-insuredge-dev` (Basic C0) | [ ] |
| App Configuration | `appconfig-insuredge-dev` with timer kill switches | [ ] |

### QA Environment

| Item | Required Value | Configured |
|---|---|---|
| GitHub Environment | `qa` created | [ ] |
| OIDC Federated Credential | Configured for `qa` environment | [ ] |
| Key Vault | `insuredge-kv-qa` created | [ ] |
| All Key Vault secrets | QA test values loaded | [ ] |
| All GitHub secrets | `AZURE_*`, `KEY_VAULT_URL_QA` | [ ] |
| App Service | `api-insuredge-qa` (B2 tier) | [ ] |

### UAT Environment

| Item | Required Value | Configured |
|---|---|---|
| GitHub Environment | `staging` with 1-reviewer protection | [ ] |
| OIDC Federated Credential | Configured for `staging` | [ ] |
| Key Vault | `insuredge-kv-uat` with confirmed integration credentials | [ ] |
| TranzPay sandbox URL | Loaded in `insuredge-kv-uat` — NOT production URL until go-live | [ ] |
| All GitHub secrets | `AZURE_*`, `KEY_VAULT_URL_UAT` | [ ] |
| App Service | `api-insuredge-uat` (P1v3) with staging slot | [ ] |
| PostgreSQL | `psql-insuredge-uat` (D2s_v3) | [ ] |
| Redis | `redis-insuredge-uat` (Basic C1) | [ ] |
| BypassRefundResponse | FALSE confirmed in App Configuration | [ ] |

### Production Environment

| Item | Required Value | Configured |
|---|---|---|
| GitHub Environment | `production` with 2-reviewer protection (project lead + Damco) | [ ] |
| OIDC Federated Credential | Configured for `production` — DBT-4-FORGE-018 | [ ] |
| Key Vault | `insuredge-kv-prod` with ALL 22 production credentials | [ ] |
| TranzPay production URL | Loaded — NOT placeholder — GAP-2-INT-001 | [ ] |
| AES-256 key | Production-grade key loaded in `insuredge-kv-prod` | [ ] |
| `KEY_VAULT_URL_PROD` | Populated — DBT-4-FORGE-017 | [ ] |
| All GitHub secrets | `AZURE_*`, `KEY_VAULT_URL_PROD` | [ ] |
| App Service | `api-insuredge-prod` (P2v3 auto-scale 1–3) with staging slot | [ ] |
| PostgreSQL | `psql-insuredge-prod` (D4s_v3, Zone-HA) | [ ] |
| Redis | `redis-insuredge-prod` (Standard C1) | [ ] |
| Azure Application Gateway + WAF | Configured with OWASP 3.2 rules | [ ] |
| BypassRefundResponse | FALSE confirmed — NFR-009 | [ ] |
| App Configuration | All timer kill switches set to FALSE | [ ] |
| Application Insights | Alert rules active (8 alert rules per ART-3-010 §4.1) | [ ] |
| Availability tests | Synthetic tests from 2 regions configured | [ ] |

---

## Section 5: Access Transfer Checklist

The following access grants must be transferred to the Hudson Bailey engineering/ops team before handover is complete.

### GitHub Repository Access

| Access Item | Current Owner | Transfer To | Transferred |
|---|---|---|---|
| GitHub Organization / Repository admin access | Damco (SHIFT team) | Hudson Bailey Tech Lead | [ ] |
| `main` branch protection: required approvals | SHIFT team + Damco | Hudson Bailey Tech Lead + designated approver | [ ] |
| GitHub environment `production` reviewers | SHIFT project lead + Damco | Hudson Bailey designated approvers | [ ] |
| GitHub Actions secrets (OIDC, Key Vault URLs) | Damco DevOps | Hudson Bailey DevOps | [ ] |

### Azure Access

| Access Item | Current Owner | Transfer To | Transferred |
|---|---|---|---|
| Azure subscription owner / contributor | Damco (SHIFT team) | Hudson Bailey cloud admin | [ ] |
| Production Key Vault access (break-glass) | Damco Security Lead | Hudson Bailey Security Lead | [ ] |
| App Service Managed Identity (auto) | Azure-managed | No transfer needed — bound to App Service | N/A |
| Azure App Configuration write access | Damco DevOps | Hudson Bailey DevOps | [ ] |
| PostgreSQL admin credentials | Damco DBA | Hudson Bailey DBA | [ ] |
| Application Insights workspace admin | Damco | Hudson Bailey ops team | [ ] |

### Third-Party Service Accounts

| Service | Account Type | Owner to Transfer | Notes |
|---|---|---|---|
| TranzPay | Demo/sandbox account | TranzPay production account owned by Hudson Bailey | GAP-2-INT-001 — production URL required |
| LenderDock | Test account | LenderDock production account | QST-1-INT-002 open |
| HexCat | (unknown — QST-1-INT-004 open) | Hudson Bailey | Contract must be established |
| Plumsail | API key | Hudson Bailey | QST-1-INT-003 — key not yet obtained |
| DisburseCloud | Sandbox account | DisburseCloud production account | RSK-2-INT-004 — v1.2.1 contract |
| Google Maps / Geocoding | API keys (from site properties) | Hudson Bailey Google Cloud project | Keys must have origin restriction (NFR-020) |
| Office365 SMTP | InsureEdge email account | Hudson Bailey IT | Credentials in Key Vault |
| Azure Blob Storage | Existing insureedgeieapplication account | Hudson Bailey Azure subscription | Managed Identity transition complete |

---

*End of ART-5-008 — Source Code Handover Package | INSUREEDGE-2026 | TRANSFER Phase | 2026-06-17*
*Status: AI_GENERATED. Contains: repository checklist (20+ items), AI_GENERATED artifact inventory (10 FORGE artifacts), 27-section HUMAN_VALIDATION_REQUIRED sign-off sheet, per-environment configuration checklist (Dev/QA/UAT/Prod), access transfer checklist (GitHub, Azure, 8 third-party services). All placeholder sign-off fields to be completed by engineering team.*
