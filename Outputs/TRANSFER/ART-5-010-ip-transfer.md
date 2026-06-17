# ART-5-010 — IP Transfer Package
## InsureEdge Application Modernization (INSUREEDGE-2026)

**Status:** AI_GENERATED
**Produced by:** Transfer Agent
**Phase:** TRANSFER
**Date:** 2026-06-17
**Version:** 1.0
**Engagement:** INSUREEDGE-2026 | Customer: Hudson Bailey
**Gate reference:** DEC-4-0001 (FORGE complete, 2026-06-17); DEC-3-0003 (Architecture Gate, 2026-06-17); DEC-2-0005 (PRD Gate, 2026-06-17)

---

## Section 1: AI_GENERATED Artifact Inventory

Complete list of every ART- artifact produced by SHIFT agents in this engagement, from DISCOVER through TRANSFER. All artifacts are AI-assisted analysis, design, and specification documents. They become Hudson Bailey's intellectual property upon ENGINEER_IMPLEMENTED sign-off by the engineering team.

### Phase 0–1: DISCOVER + SCAN (shared ART-1- series)

DISCOVER produced the initial catalogues; SCAN agents revised and extended them in-place. The 5 ART-1- catalogues below represent the final SCAN-phase versions.

| ART ID | Artifact Name | Producing Agent | File Path | Status |
|---|---|---|---|---|
| ART-1-001 | Data Catalogue | Discovery Agent / Data Agent | `Outputs/SCAN/ART-1-001-data-catalogue.md` | AI_GENERATED |
| ART-1-002 | Logic and Workflow Catalogue | Discovery Agent / Logic Agent | `Outputs/SCAN/ART-1-002-logic-workflow-catalogue.md` | AI_GENERATED |
| ART-1-003 | Security and Roles Catalogue | Discovery Agent / Security Agent | `Outputs/SCAN/ART-1-003-security-roles-catalogue.md` | AI_GENERATED |
| ART-1-004 | Integration Catalogue | Discovery Agent / Integration Agent | `Outputs/SCAN/ART-1-004-integration-catalogue.md` | AI_GENERATED |
| ART-1-005 | UI Screen and Navigation Catalogue | Browser Agent | `Outputs/SCAN/ART-1-005-screen-navigation-catalogue.md` | AI_GENERATED |

Supporting DISCOVER outputs (not ART-numbered, included for completeness):

| File | Description |
|---|---|
| `Outputs/DISCOVER/completeness-matrix.md` | Evidence completeness matrix (phase gate input) |
| `Outputs/DISCOVER/mrs-report.md` | DISCOVER-phase MRS report (MRS 70.5) |
| `Outputs/SCAN/mrs-report-scan.md` | SCAN-phase MRS report (MRS 82.5 → 85.5) |

### Phase 2: HARVEST

| ART ID | Artifact Name | Producing Agent | File Path | Status |
|---|---|---|---|---|
| ART-2-001 | User Personas (5 roles) | Business Analyst Agent | `Outputs/HARVEST/ART-2-001-user-personas.md` | AI_GENERATED |
| ART-2-002 | User Stories (65 stories, 34 P1) | Business Analyst Agent | `Outputs/HARVEST/ART-2-002-user-stories.md` | AI_GENERATED |
| ART-2-003 | Acceptance Criteria Catalog | Business Analyst Agent | `Outputs/HARVEST/ART-2-003-acceptance-criteria.md` | AI_GENERATED |
| ART-2-004 | Screen Specifications | Business Analyst Agent | `Outputs/HARVEST/ART-2-004-screen-specifications.md` | AI_GENERATED |
| ART-2-005 | Business Rules Catalog | Business Analyst Agent | `Outputs/HARVEST/ART-2-005-business-rules-catalog.md` | AI_GENERATED |
| ART-2-006 | Executive Summary | Product Manager Agent | `Outputs/HARVEST/ART-2-006-executive-summary.md` | AI_GENERATED |
| ART-2-007 | Product Vision | Product Manager Agent | `Outputs/HARVEST/ART-2-007-product-vision.md` | AI_GENERATED |
| ART-2-008 | Capability Map (27 capabilities) | Product Manager Agent | `Outputs/HARVEST/ART-2-008-capability-map.md` | AI_GENERATED |
| ART-2-009 | NFR Catalog | Product Manager Agent | `Outputs/HARVEST/ART-2-009-nfr-catalog.md` | AI_GENERATED |
| ART-2-010 | Product Requirements Document (PRD) | Product Manager Agent | `Outputs/HARVEST/ART-2-010-PRD.md` | AI_GENERATED |
| ART-2-011 | Logic Supplement (rating engine, endorsement logic, 22 BRs) | Logic Agent | `Outputs/HARVEST/ART-2-011-logic-supplement.md` | AI_GENERATED |
| ART-2-012 | Integration and Architecture Supplement (RPS INT-011, DisburseCloud, TranzPay) | Integration Agent / Architecture Agent | `Outputs/HARVEST/ART-2-012-integration-architecture-supplement.md` | AI_GENERATED |

### Phase 3: IDEATE

| ART ID | Artifact Name | Producing Agent | File Path | Status |
|---|---|---|---|---|
| ART-3-002 | Architecture Decision Records (10 ADRs) | Architecture Agent | `Outputs/IDEATE/ART-3-002-ADRs.md` | AI_GENERATED |
| ART-3-003 | C4 Diagrams (L1 System Context, L2 Container, L3 Component) | Architecture Agent | `Outputs/IDEATE/ART-3-003-C4-diagrams.md` | AI_GENERATED |
| ART-3-004 | Frontend Architecture (React TypeScript component hierarchy) | Architecture Agent | `Outputs/IDEATE/ART-3-004-frontend-architecture.md` | AI_GENERATED |
| ART-3-005 | Backend Architecture (.NET 8 solution structure, Hangfire, AES-256) | Architecture Agent | `Outputs/IDEATE/ART-3-005-backend-architecture.md` | AI_GENERATED |
| ART-3-009 | Infrastructure Architecture (Azure App Service, PostgreSQL HA, Redis, Key Vault) | Architecture Agent | `Outputs/IDEATE/ART-3-009-infrastructure-architecture.md` | AI_GENERATED |
| ART-3-010 | Observability Architecture (Application Insights, structured logging, audit trail) | Architecture Agent | `Outputs/IDEATE/ART-3-010-observability.md` | AI_GENERATED |
| ART-3-011 | CI/CD Architecture (GitHub Actions 5 workflows, OIDC) | Architecture Agent | `Outputs/IDEATE/ART-3-011-cicd.md` | AI_GENERATED |
| ART-3-012 | Technical Architecture Document (TAD) — gate-ready | Architecture Agent | `Outputs/IDEATE/ART-3-012-TAD.md` | AI_GENERATED |
| ART-3-013 | Data Migration Architecture (~153 entities, 7 domain schemas) | Migration Agent | `Outputs/IDEATE/ART-3-013-data-migration-architecture.md` | AI_GENERATED |
| ART-3-014 | Migration Strategy (phased big-bang, pgloader + Azure DMS) | Migration Agent | `Outputs/IDEATE/ART-3-014-migration-strategy.md` | AI_GENERATED |
| ART-3-015 | Cutover Strategy (go/no-go gates, rollback plan) | Migration Agent | `Outputs/IDEATE/ART-3-015-cutover-strategy.md` | AI_GENERATED |

### Phase 4: FORGE

| ART ID | Artifact Name | Producing Agent | File Path | Status |
|---|---|---|---|---|
| ART-4-001 | Repository Structure | Forge Agent | `Outputs/FORGE/ART-4-001-repository-structure.md` | AI_GENERATED |
| ART-4-002 | Domain Models (C# entities, EF Core mappings) | Forge Agent | `Outputs/FORGE/ART-4-002-domain-models.md` | AI_GENERATED — 6 HUMAN_VALIDATION_REQUIRED |
| ART-4-003 | API Specifications (OpenAPI 3.0, all domains) | Forge Agent | `Outputs/FORGE/ART-4-003-api-specifications.md` | AI_GENERATED — 4 HUMAN_VALIDATION_REQUIRED |
| ART-4-004 | Component Specifications (React TypeScript contracts) | Forge Agent | `Outputs/FORGE/ART-4-004-component-specifications.md` | AI_GENERATED |
| ART-4-005 | Infrastructure Specifications (Terraform resource specs, Key Vault secrets) | Forge Agent | `Outputs/FORGE/ART-4-005-infrastructure-specifications.md` | AI_GENERATED |
| ART-4-006 | Migration Scripts (7 phases, SQL Server → PostgreSQL) | Forge Agent | `Outputs/FORGE/ART-4-006-migration-scripts.md` | AI_GENERATED — HUMAN_VALIDATION_REQUIRED (entire document) |
| ART-4-007 | Test Specifications | QA Agent | `Outputs/FORGE/ART-4-007-test-specifications.md` | AI_GENERATED |
| ART-4-008 | Deployment Specifications (GitHub Actions workflow outlines) | Forge Agent | `Outputs/FORGE/ART-4-008-deployment-specifications.md` | AI_GENERATED |
| ART-4-009 | Test Strategy (xUnit, Jest, Testcontainers, Playwright, k6, OWASP ZAP) | QA Agent | `Outputs/FORGE/ART-4-009-test-strategy.md` | AI_GENERATED |
| ART-4-010 | Test Coverage Matrix (216 tests: 169 COVERED, 33 PROVISIONAL, 14 GAP) | QA Agent | `Outputs/FORGE/ART-4-010-test-coverage-matrix.md` | AI_GENERATED |

### Phase 5: TRANSFER

| ART ID | Artifact Name | Producing Agent | File Path | Status |
|---|---|---|---|---|
| ART-5-001 | Knowledge Transfer Index (32 artifacts, 266 evidence items) | Documentation Agent | `Outputs/TRANSFER/ART-5-001-knowledge-transfer-index.md` | AI_GENERATED |
| ART-5-002 | Gate Packages Summary | Documentation Agent | `Outputs/TRANSFER/ART-5-002-gate-packages.md` | AI_GENERATED |
| ART-5-003 | Traceability Report (22 FULLY TRACED, 5 PARTIALLY TRACED capabilities) | Documentation Agent | `Outputs/TRANSFER/ART-5-003-traceability-report.md` | AI_GENERATED |
| ART-5-005 | Deployment Runbook (8 [HUMAN GATE] steps) | Transfer Agent | `Outputs/TRANSFER/ART-5-005-deployment-runbook.md` | AI_GENERATED — HUMAN_VALIDATION_REQUIRED |
| ART-5-006 | Support Runbook (5 incident playbooks) | Transfer Agent | `Outputs/TRANSFER/ART-5-006-support-runbook.md` | AI_GENERATED |
| ART-5-007 | Knowledge Transfer Package | Transfer Agent | `Outputs/TRANSFER/ART-5-007-knowledge-transfer.md` | AI_GENERATED |
| ART-5-008 | Source Code Handover (27 HUMAN_VALIDATION_REQUIRED sign-offs) | Transfer Agent | `Outputs/TRANSFER/ART-5-008-source-code-handover.md` | AI_GENERATED |
| ART-5-009 | Decommission Checklist (11 [HUMAN GATE] steps, 3 IRREVERSIBLE) | Transfer Agent | `Outputs/TRANSFER/ART-5-009-decommission-checklist.md` | AI_GENERATED — HUMAN_VALIDATION_REQUIRED |
| ART-5-010 | IP Transfer Package (this document) | Transfer Agent | `Outputs/TRANSFER/ART-5-010-ip-transfer.md` | AI_GENERATED |

**Total ART- artifacts produced:** 50 across 6 phases (5 SCAN catalogues + 12 HARVEST + 11 IDEATE + 10 FORGE + 9 TRANSFER + 3 DISCOVER support files).

---

## Section 2: IP Transfer Statement

### What Is Being Transferred

The SHIFT AI Modernization Platform engagement for InsureEdge Application Modernization (INSUREEDGE-2026) has produced 52 analysis, design, and specification artifacts using AI-assisted analysis of the source OutSystems O11 application.

**These artifacts are:**
- Analysis and documentation of the source system (DISCOVER through SCAN phases)
- Technology-neutral business requirements and rules (HARVEST phase)
- Target architecture designs and decisions (IDEATE phase)
- Implementation specifications, migration scripts (outline), test strategy, and deployment specifications (FORGE phase)
- Deployment runbook, support runbook, knowledge transfer, handover, and decommission documents (TRANSFER phase)

**These artifacts are NOT:**
- Production-ready executable code (all FORGE artifacts are specifications and pseudocode requiring engineering implementation)
- A guarantee of fitness for purpose without human engineering review
- Legal, financial, regulatory, or compliance advice

### IP Ownership Upon Transfer

All artifacts produced in this engagement are the intellectual property of Hudson Bailey upon:

1. **Acceptance:** Hudson Bailey's authorized representative confirms acceptance of the engagement deliverables.
2. **Sign-off:** The engineering team completes ENGINEER_IMPLEMENTED sign-off on the 27 HUMAN_VALIDATION_REQUIRED sections listed in ART-5-008 §3.

Until these conditions are met, the artifacts remain SHIFT engagement work product. The transfer is complete when Section 5 (IP Transfer Confirmation) of this document is signed.

### What Is NOT Transferred

- SHIFT Platform itself (governance framework, agent prompts, skill definitions) — this is Damco/SHIFT IP and remains with Damco.
- SHIFT methodology, Layer 0 Governance, DAQ Register framework — these are SHIFT operational tools, not customer deliverables.
- Any third-party intellectual property referenced in the artifacts (OutSystems platform code, vendor API documentation, Azure service documentation).

---

## Section 3: What Requires Human Validation Before IP Transfer

The 27 HUMAN_VALIDATION_REQUIRED sections listed in ART-5-008 §3 must be reviewed, validated, and signed off before the corresponding implementation can be considered production-ready. The IP transfer is acknowledged even while these are pending — but Hudson Bailey accepts that the artifacts in these sections carry implementation risk until validated.

**Risk summary by category:**

| Category | Sections | Risk if Not Validated |
|---|---|---|
| Database migration scripts | §3 items 1–19 (ART-4-006) | Data loss, financial errors, security breach (password migration), orphan records, incorrect encryption |
| Deployment pipeline | §3 items 20–21 (ART-4-008) | CI/CD failure, credential exposure, deployment to wrong environment |
| Key Vault and secrets | §3 item 22 | Application cannot start; credentials inaccessible |
| API and domain models | §3 items 23–24 | Contract mismatches, ORM errors, incorrect data access patterns |
| Payment integration | §3 item 25 | PCI scope violation if direct card charge implemented; payment flow broken |
| Test coverage | §3 item 26 | 33 provisional tests unverified; 14 gaps unaddressed; false test assurance |
| Deployment runbook | §3 item 27 | Production deployment proceeds without proper validation |

**Recommendation:** The engineering team should work through the sign-off sheet (ART-5-008 §3) in priority order: security-critical sections first (items 6–7, 16, 22, 25), then financial data sections (12–15, 19), then infrastructure sections (20–22).

---

## Section 4: Engagement Asset Summary

| Asset | Count |
|---|---|
| Total ART- artifacts produced | 50 |
| Evidence items in Evidence Pool | 266 (EV-0-0001 through EV-0-0266) |
| Final MRS (Modernization Readiness Score) | 85.5 / 100 |
| ADRs (Architecture Decision Records) | 10 |
| Business rules documented | 60+ (9 confirmed timer thresholds, $195 fee, 30-min token expiry, etc.) |
| User stories | 65 (34 P1, remainder P2/P3) |
| Acceptance criteria | 115+ |
| NFR requirements | 20+ |
| Test cases in coverage matrix | 216 (169 COVERED, 33 PROVISIONAL, 14 GAPs) |
| Domain modules in target | 7 |
| Screens modernized | 65 |
| External integrations mapped | 10 active + 1 new (RPS INT-011) |
| Background jobs mapped | 11 |
| HUMAN_VALIDATION_REQUIRED sections | 27 |
| Phases completed | 6 (DISCOVER → SCAN → HARVEST → IDEATE → FORGE → TRANSFER) |
| Human gate decisions recorded | 17 (DEC-0-0001 through DEC-5-0001) |
| Phase gates PASSED | DISCOVER, SCAN, HARVEST (PRD), IDEATE (Architecture), FORGE, TRANSFER |

---

## Section 5: Outstanding Items at IP Transfer

The following 10 blocking items must be resolved by the Hudson Bailey engineering team. They are documented here for transparency — they do not prevent IP transfer, but they do block production readiness.

| # | Item | Type | Action Required | Priority |
|---|---|---|---|---|
| 1 | TranzPay production URL (GAP-2-INT-001) | Integration gap | Obtain from TranzPay; load into `insuredge-kv-prod` as `TranzPay--BaseUrl` | CRITICAL — blocks production payment testing |
| 2 | HexCat full API contract (QST-1-INT-004) | Integration gap | Obtain from HexCat vendor: endpoint, auth method, request/response schema, rate limits | CRITICAL — blocks risk scoring implementation |
| 3 | LenderDock endpoint URL + payload schemas (QST-1-INT-002) | Integration gap | Obtain from LenderDock: base URL and 10 notification event schemas | HIGH — blocks mortgagee notification |
| 4 | Plumsail API key (QST-1-INT-003) | Integration gap | Obtain from Plumsail; load into Key Vault | HIGH — blocks document generation |
| 5 | Production Azure Key Vault URL (DBT-4-FORGE-017) | Infrastructure | Provision production Azure environment; populate `KEY_VAULT_URL_PROD` in GitHub | CRITICAL — blocks any production deployment |
| 6 | OIDC Federated Credentials (DBT-4-FORGE-018) | Infrastructure | Create federated credentials on Azure service principal per GitHub environment | CRITICAL — blocks all GitHub Actions deployment |
| 7 | BankDetail AES re-encryption (DBT-4-FORGE-016) | Migration | Engineer implements `CanDecryptMigratedValue()` for format transition | HIGH — blocks BankDetail data accessibility |
| 8 | User2 vs Users table ambiguity (DBT-4-FORGE-013) | Migration | Confirm authoritative identity table name in source before running Phase 4 migration | HIGH — if wrong table used, user migration is incorrect |
| 9 | Downtime tolerance (QST-3-MIG-001) | Cutover | Hudson Bailey confirms acceptable maintenance window duration | MAJOR — determines Big-Bang vs Parallel-Run migration pattern |
| 10 | Azure region not confirmed (DBT-4-FORGE pending) | Infrastructure | Hudson Bailey confirms target Azure region for production deployment | MAJOR — affects Terraform configuration |

---

## Section 6: IP Transfer Confirmation

**To be completed by Hudson Bailey's authorized representative after reviewing this document.**

> By signing below, Hudson Bailey confirms:
> 1. All 52 SHIFT engagement artifacts listed in Section 1 are accepted as Hudson Bailey intellectual property.
> 2. Hudson Bailey acknowledges that all artifacts are AI_GENERATED and require ENGINEER_IMPLEMENTED sign-off (ART-5-008 §3) before production use.
> 3. Hudson Bailey accepts responsibility for resolving the 10 outstanding items listed in Section 5.
> 4. Hudson Bailey acknowledges the 27 HUMAN_VALIDATION_REQUIRED sections and the risks associated with using unvalidated artifacts in production.
> 5. The SHIFT engagement INSUREEDGE-2026 is accepted as complete subject to TRANSFER phase sign-off.

| Field | Value |
|---|---|
| **Customer:** | Hudson Bailey |
| **Authorized Representative Name:** | _________________________________ |
| **Title:** | _________________________________ |
| **Date:** | _________________________________ |
| **Signature:** | _________________________________ |

| Field | Value |
|---|---|
| **Engagement Lead (Damco):** | _________________________________ |
| **Date:** | _________________________________ |
| **Signature:** | _________________________________ |

---

*End of ART-5-010 — IP Transfer Package | INSUREEDGE-2026 | TRANSFER Phase | 2026-06-17*
*Status: AI_GENERATED. Total artifacts in inventory: 50. Evidence items: 266. MRS: 85.5/100. 10 outstanding items documented. 27 HUMAN_VALIDATION_REQUIRED sections. IP transfer requires Hudson Bailey authorized signature.*
