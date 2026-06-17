# ART-4-009 — Test Strategy
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** QA Agent
**Phase:** FORGE
**Date:** 2026-06-17
**Precondition:** Architecture Gate PASSED (DEC-3-0003, 2026-06-17)
**Governance:** Layer 0 — §3 Confidence Bands, §5 Evidence First, §2 DAQ Register
**Companion artifact:** ART-4-010 — Test Coverage Matrix

---

## 1. Purpose and Scope

This Test Strategy defines the approach, tooling, environments, coverage targets, and special policies for automated and manual testing of the InsureEdge modernized platform. It applies to the ASP.NET Core (.NET 8) backend, React (TypeScript) frontend, PostgreSQL database, Hangfire background jobs, and all Azure-hosted integration endpoints.

The strategy is derived from:
- ART-2-003 (Acceptance Criteria — 115 Given/When/Then criteria)
- ART-2-005 (Business Rules Catalog — 9 confirmed timer thresholds + all policy lifecycle rules)
- ART-2-002 (User Stories — 34 P1 stories, 19 P2 stories)
- ART-3-002 (Architecture Decision Records — defines test boundaries and tooling stack)
- ART-1-003 (Security Roles Catalogue — 10-flag permission model, role matrix)
- ART-2-011 (Logic Supplement — rating engine formula, endorsement rules, 22 new business rules)

---

## 2. What Is In Scope for Automated Testing

| Area | In Scope | Notes |
|---|---|---|
| Domain services and business logic | YES | All 7 domain modules: Policy, Claims, Billing, Distribution, User, Group, Reports |
| Permission enforcement (10 flags) | YES | All 10 flags tested per domain module |
| Multi-tenancy ClientId isolation | YES | Mandatory in every integration test |
| All 11 Hangfire background jobs | YES | Timer threshold values + trigger conditions |
| Rating engine premium calculation | YES — HUMAN_VALIDATION_REQUIRED | Financial logic; all outputs require human sign-off |
| Endorsement premium calculation | YES — HUMAN_VALIDATION_REQUIRED | Financial logic; all outputs require human sign-off |
| JWT authentication and refresh | YES | Access token lifetime, refresh token rotation |
| AES-256 encrypt/decrypt round-trip | YES — HUMAN_VALIDATION_REQUIRED | Security-critical |
| TranzPay callback endpoint | YES | PostBackUrl webhook receiver; real gateway PROVISIONAL |
| LenderDock notification dispatch | PROVISIONAL | QST-1-INT-002 blocking |
| Plumsail document generation | PROVISIONAL | QST-1-INT-003 blocking |
| DisburseCloud vendor registration | PROVISIONAL | QST-2-INT-003 URL mismatch |
| Azure Blob upload/download | YES | Round-trip in integration environment |
| Google Maps geocoding | YES | Smoke test against live endpoint in QA |
| SMTP email dispatch | YES | Verified via test mailbox in CI/QA |
| Migration data validation | YES | SQL count-comparison and orphan detection |
| UI component rendering | YES | Jest component tests |
| End-to-end browser flows | YES — key journeys | Playwright; not exhaustive |
| Load profile (100-user baseline) | YES | k6 against QA environment |
| OWASP ZAP security scan | YES | GitHub Actions pipeline step |

---

## 3. What Is Out of Scope for Automated Testing

| Area | Reason |
|---|---|
| TranzPay hosted redirect payment UI (live card transactions) | Third-party hosted page; cannot be automated without TranzPay test sandbox credentials (QST-1-INT-001). Manual UAT required. |
| LenderDock live mortgagee notification delivery confirmation | Integration not yet contractually confirmed (QST-1-INT-002). Test stubs used; live verification is manual UAT. |
| Plumsail document visual fidelity (pixel-level formatting) | Document generation output quality is a manual review item. Automated tests confirm API call and storage; not PDF layout. |
| DisburseCloud live ACH/check disbursement | Production URL mismatch (QST-2-INT-003); live test deferred pending URL confirmation. |
| State surplus lines tax rates correctness (all 50 states) | Rating formula test covers the computation pattern; rate table values are verified by a financial auditor (HUMAN_VALIDATION_REQUIRED). |
| Regulatory compliance filings (NAIC, state forms) | Outside platform boundary; not automated. |
| RPS PostGIS raster data accuracy | Geospatial dataset accuracy is a data quality matter; automated test confirms API call returns a result. |
| Penetration testing | OWASP ZAP automated scan is in scope; manual pen test is a TRANSFER phase item. |

---

## 4. Test Types, Tooling, and Rationale

### 4.1 Unit Tests

**Tooling:**
- Backend: **xUnit** (.NET 8) with FluentAssertions and Moq
- Frontend: **Jest** with React Testing Library (TypeScript)

**Scope:**
- All domain service classes (pure business logic with mocked repositories)
- Rating engine premium calculation per-peril formula (HUMAN_VALIDATION_REQUIRED)
- Permission evaluation logic (union of flags, AllAccess override)
- Endorsement premium/return premium calculation (HUMAN_VALIDATION_REQUIRED)
- Password reset token generation and expiry
- Quote expiry date arithmetic (all 3 thresholds)
- All 22 business rules from ART-2-011 §7 (BR-LOGIC-SUPP-001 through BR-LOGIC-SUPP-022)
- React components: form validation (Zod schemas), permission gate rendering, multi-step wizard state

**Coverage target:** 80% line coverage for all domain service classes. 70% for React components. Domain service coverage is measured by the CI gate; builds fail below 80%.

**Tag:** Financial logic unit tests (rating, endorsement, policy fee) are tagged `[HumanValidation]` in xUnit and must be reviewed by a business SME before merge to `main`.

### 4.2 Integration Tests

**Tooling:**
- **xUnit** + **Testcontainers for .NET** (PostgreSQL 15 in a Docker container)
- **ASP.NET Core TestServer** (Microsoft.AspNetCore.Mvc.Testing)
- Real EF Core DbContext against the Testcontainer database; no mocks at the repository layer

**Scope:**
- All API endpoints: request → controller → service → repository → database → response
- EF Core global query filters: verify ClientId isolation at the database layer
- Permission enforcement middleware: all 10 flags against all domain screens
- Tenant resolution middleware: ClientId resolved from JWT claims; invalid JWT returns 401
- Hangfire job execution: invoke job method directly against test database and assert state transitions
- All migration validation queries (Section 9)

**Multi-tenancy mandatory pattern:**
Every integration test that touches a domain entity MUST:
1. Seed two tenant records (TenantA and TenantB) in the Testcontainer database
2. Authenticate as a user belonging to TenantA
3. Assert that the response contains ONLY TenantA records
4. Assert that a direct database query for TenantB records returns the expected count (unchanged)

A test that passes without asserting cross-tenant isolation is classified as a FALSE POSITIVE and must be rejected in code review.

**AES-256 round-trip test (HUMAN_VALIDATION_REQUIRED):**
Integration test encrypts a known plaintext using the `Encryption:Base64Key` loaded from test secrets, decrypts the ciphertext, and asserts round-trip equality. Tagged `[HumanValidation]`.

### 4.3 End-to-End Tests (E2E)

**Tooling:** **Playwright** (TypeScript, Chromium + Firefox + WebKit)

**Scope — key journeys only (not exhaustive):**
1. New quote → bind policy → verify declaration page appears in policy document list
2. Login as TenantA user → verify dashboard KPIs contain only TenantA data
3. Create user group → assign permissions → verify member inherits effective permissions
4. Initiate password reset → use token within 30 minutes → verify success; use expired token → verify rejection
5. FNOL registration → worksheet creation → claim close → verify claim letter dispatched (mock SMTP)
6. Permission enforcement smoke: user without Create permission attempts binding → verify 403 redirect

**Environment:** E2E tests run against a deployed QA environment with seeded test data. They do not run against the Testcontainer environment.

**Out of scope for Playwright:** Payment flows using the TranzPay hosted redirect page (third-party; cannot be automated). Manual UAT script provided separately.

### 4.4 Load Tests

**Tooling:** **k6** (open-source, JavaScript-based)

**Scenario — 100-user baseline:**
- 100 virtual users (VUs) ramp up over 2 minutes
- Steady state: 100 concurrent VUs for 10 minutes
- Workload mix: 40% policy list/read, 20% new quote wizard, 20% claims read, 10% billing read, 10% report dashboard
- Thresholds: p95 response time ≤ 2,000 ms; error rate ≤ 1%; no 5xx errors

**Targets tested:**
- Policy list endpoint (tenant-scoped, paginated)
- New quote Step 1–3 API calls
- Claims list endpoint (adjuster-scoped)
- Dashboard KPI aggregation endpoint
- JWT refresh endpoint

**Environment:** k6 runs against QA environment. Load tests are not run against production.

**Escalation path:** If any threshold fails, the load test result is escalated as a blocking defect before TRANSFER phase.

### 4.5 Security Tests

**Tooling:** **OWASP ZAP** (Zed Attack Proxy) in CI/CD GitHub Actions pipeline

**Scan type:** Active scan (ZAP Baseline + Active Scan) against the deployed QA environment

**Scope:**
- All API endpoints under `/api/v1/`
- JWT token handling (injection, replay)
- CORS configuration
- SQL injection (EF Core parameterized queries are the primary mitigation; ZAP verifies)
- XSS in React SPA (Content-Security-Policy headers)
- Sensitive data exposure in API responses (verify masked fields are not transmitted)

**Pipeline step:** ZAP scan runs as a GitHub Actions step after QA deployment. Scan results are uploaded as a GitHub Actions artifact. High-severity findings block the deployment pipeline.

**Scope limitation:** ZAP cannot test behind TranzPay's hosted redirect page. Payment channel security testing is a manual pen test item (TRANSFER phase).

---

## 5. Test Environments

| Environment | Unit | Integration | E2E | Load | Security | Notes |
|---|---|---|---|---|---|---|
| Developer workstation | YES | YES (Testcontainer) | NO | NO | NO | No cloud infra needed; Testcontainer spins up PostgreSQL locally |
| CI (GitHub Actions) | YES | YES (Testcontainer) | NO | NO | YES (ZAP) | Every pull request triggers unit + integration + ZAP |
| QA | YES (regression gate) | YES (QA PostgreSQL) | YES (Playwright) | YES (k6) | YES (ZAP) | Seeded test data; reset before each test run |
| UAT | NO automated | NO automated | MANUAL scripts | NO | NO automated | Human acceptance testing only |
| Production | NO automated | NO automated | SMOKE ONLY | NO | NO automated | 5-minute smoke test post-deployment |

**Production smoke test:** A minimal Playwright script (separate from QA E2E suite) verifies login, dashboard load, and policy list load against production. No write operations. Run as a post-deployment gate step.

---

## 6. Coverage Targets

| Category | Minimum Target | Measurement Method |
|---|---|---|
| Domain service unit coverage (line) | 80% | xUnit + Coverlet; reported in CI |
| React component coverage (line) | 70% | Jest --coverage; reported in CI |
| P1 acceptance criteria covered by tests | 100% | Manual traceability in ART-4-010 |
| Business rules (all BR- IDs) | 100% (COVERED or PROVISIONAL with reason) | ART-4-010 matrix |
| Security permission flags (all 10) | 100% | Integration test per flag per domain |
| Hangfire jobs (all 11) | 100% | Integration test per job |
| Integration contracts (all external) | 100% (COVERED or PROVISIONAL with reason) | ART-4-010 matrix |

---

## 7. Financial and Security Logic Policy — HUMAN_VALIDATION_REQUIRED

The following categories of tests MUST be tagged `[HumanValidation]` in xUnit and `@human-validation` in Jest/Playwright. Tests in these categories may not be merged to `main` without explicit sign-off from a business SME or security officer (documented in the pull request description):

1. **Payment amounts and premium calculations:** Any test asserting a specific dollar value (policy fee $195, installment amounts, commission amounts, endorsement additional/return premium, surplus lines tax).
2. **Permission checks:** Any test asserting that a specific permission flag allows or denies access to a financial action (MakePayment, refund, commission disbursement).
3. **AES-256 encryption/decryption:** Round-trip tests for the `Encryption:Base64Key` secret; tests verifying bank account numbers and routing numbers are masked in API responses.
4. **Rating engine outputs:** Tests asserting per-peril premium values derived from the hexzone rate table.
5. **TranzPay callback processing:** Tests asserting that a payment callback correctly updates PolicyPaymentTransaction status.

**Rationale:** These categories carry financial or security liability. A test defect in these areas could mask a production miscalculation or data exposure. Human review provides a second line of defence beyond automated assertion.

---

## 8. Multi-Tenancy Test Policy

Multi-tenancy isolation is not optional in integration tests. The following policy is MANDATORY:

### 8.1 Dual-Tenant Seed Requirement
Every integration test fixture (TestServer or Testcontainer) MUST be bootstrapped with at least two distinct tenant records. Test data for the subject-under-test belongs to TenantA. TenantB data exists to prove isolation.

### 8.2 Isolation Assertion Requirement
For every API endpoint that returns a collection or a single record:
- The test MUST authenticate as a TenantA user
- The test MUST assert that the returned collection contains ONLY TenantA records
- The test MUST assert that TenantB records are NOT present in the response
- A separate test case MUST attempt to access a specific TenantB record ID as a TenantA user and assert HTTP 403 or 404

### 8.3 False Positive Definition
A test that asserts correct data is returned WITHOUT asserting that TenantB data is excluded is a FALSE POSITIVE. Such tests must be rejected in pull request review and reclassified as PROVISIONAL in ART-4-010 until the cross-tenant assertion is added.

### 8.4 EF Core Global Query Filter Verification
A dedicated integration test suite (`TenantIsolationTests`) MUST verify that EF Core global query filters are active by:
1. Disabling the filter explicitly (EF Core `IgnoreQueryFilters()`)
2. Asserting that TenantB records ARE returned when filters are disabled
3. Re-enabling the filter and asserting TenantB records are NOT returned

This test proves the filter exists and is effective, not merely that a specific query happened to return correct results.

---

## 9. Hangfire Job Testing Approach

All 11 Hangfire background jobs are tested using integration tests that invoke the job's `Execute()` method directly against the Testcontainer PostgreSQL database.

### 9.1 Test Pattern for Each Job

```
GIVEN: Database seeded with records in the triggering state
       (e.g., policy with ExpirationDate = today - 90 days for T-01)
WHEN:  Job Execute() method invoked
THEN:  Assert database state change (policy status, quote status, email queue entry, etc.)
       Assert Hangfire job history shows "Succeeded"
       Assert no unintended records in OTHER tenants were modified (isolation check)
```

### 9.2 Timer Threshold Test Requirements

Each timer test MUST verify the threshold boundary condition in addition to the normal case:

| Job | Boundary Condition Required |
|---|---|
| T-01 RenewalQuoteGenerator | Policy at exactly day 90 triggers; policy at day 89 does NOT trigger |
| T-02 RenewalNotificationSender | Renewal quote at Draft status triggers; already Expired does NOT trigger |
| T-03 NonRenewalNoticeSender | Policy with non-renewal flag at exactly day 60 triggers |
| T-04 PolicyExpiryProcessor | Policy at exactly 90 days post-expiry changes to Non-Renewed |
| T-05 QuoteExpiryProcessor | New business quote at day 90, renewal at day 30, endorsement at day 90 — all trigger; day N-1 does NOT |
| T-06 AutoCancellationProcessor | Missed payment at exactly day 30 cancels; day 29 does NOT cancel |
| T-07 PolicyExpiredStatusUpdater | Policy at exactly 1 day post-ExpirationDate changes to Expired |
| T-08 InstallmentPaymentProcessor | Due-date installment submits to TranzPay (stubbed); non-due installment does NOT |
| T-09 TranzPayCallbackReconciler | Pending transaction reconciled; already-resolved transaction skipped |
| T-10 BulkUploadProcessor | Staged record processed; already-processed record skipped |
| T-11 CommissionDisbursementProcessor | Eligible commission disbursed; already-disbursed skipped |

### 9.3 Kill Switch Test

A dedicated test case MUST verify that setting `TimerEnabled = false` in the Configuration table causes the job to exit immediately without processing any records. This test applies to ALL 11 jobs.

### 9.4 TranzPay Dependency in Timer Tests

T-08 (InstallmentPaymentProcessor) and T-09 (TranzPayCallbackReconciler) depend on the TranzPay integration. In the Testcontainer environment, TranzPay is replaced with an **HTTP stub** (WireMock.Net) that returns predefined success/failure responses. These tests are tagged PROVISIONAL pending confirmation of TranzPay sandbox credentials (QST-2-INT-001).

---

## 10. Migration Validation Tests

Migration validation tests complement the migration runbook (ART-4-006 Phase 7). They are SQL-level assertion queries run against the target PostgreSQL database immediately after migration to confirm data integrity.

### 10.1 Row Count Parity Tests

For each of the 92 tables migrated from InsureEdge_DEV (SQL Server) to InsureEdge (PostgreSQL):

```sql
-- Pattern: run against both source (SQL Server via linked server or snapshot)
-- and target (PostgreSQL), compare counts
SELECT COUNT(*) FROM [source_table];   -- SQL Server
SELECT COUNT(*) FROM target_table;     -- PostgreSQL
-- ASSERT: counts are equal within acceptable tolerance (0 for exact match)
```

Acceptable tolerance is 0 (exact match) for all tables. Any discrepancy is a migration defect requiring investigation before TRANSFER.

### 10.2 Orphan Detection Tests

```sql
-- No orphan claims (ClaimId with no matching PolicyId)
SELECT COUNT(*) FROM claims c
LEFT JOIN policies p ON c.policy_id = p.id
WHERE p.id IS NULL;
-- ASSERT: result = 0

-- No orphan worksheets (WorksheetId with no matching ClaimId)
SELECT COUNT(*) FROM worksheets w
LEFT JOIN claims c ON w.claim_id = c.id
WHERE c.id IS NULL;
-- ASSERT: result = 0

-- No orphan policy documents (PolicyDocumentId with no matching PolicyId)
SELECT COUNT(*) FROM policy_documents pd
LEFT JOIN policies p ON pd.policy_id = p.id
WHERE p.id IS NULL;
-- ASSERT: result = 0
```

### 10.3 Sentinel Date Elimination Tests

```sql
-- No sentinel dates (1900-01-01) surviving migration
SELECT COUNT(*) FROM policies
WHERE expiration_date = '1900-01-01'
   OR effective_date = '1900-01-01';
-- ASSERT: result = 0

-- Same check on claims, payments
SELECT COUNT(*) FROM claims WHERE fnol_date = '1900-01-01' OR loss_date = '1900-01-01';
SELECT COUNT(*) FROM policy_payment_transactions WHERE transaction_date = '1900-01-01';
-- ASSERT: all = 0
```

### 10.4 Plaintext Password Elimination Test — HUMAN_VALIDATION_REQUIRED

```sql
-- No plaintext passwords surviving migration
-- User2.Password column must be NULL in target (passwords migrated to ASP.NET Core Identity)
SELECT COUNT(*) FROM users WHERE password IS NOT NULL;
-- ASSERT: result = 0
```

This test is tagged HUMAN_VALIDATION_REQUIRED. A non-zero result is a CRITICAL security defect. The finding must be escalated immediately to the security officer before the TRANSFER phase begins.

### 10.5 ClientId NULL Audit Test

```sql
-- No tenant-scoped records with NULL ClientId
SELECT 'policies' AS tbl, COUNT(*) AS cnt FROM policies WHERE client_id IS NULL
UNION ALL
SELECT 'claims', COUNT(*) FROM claims WHERE client_id IS NULL
UNION ALL
SELECT 'users', COUNT(*) FROM users WHERE client_id IS NULL
UNION ALL
SELECT 'groups', COUNT(*) FROM group_table WHERE client_id IS NULL
UNION ALL
SELECT 'intermediaries', COUNT(*) FROM intermediaries WHERE client_id IS NULL;
-- ASSERT: all cnt = 0
```

### 10.6 Schema Typo Correction Verification Tests

```sql
-- Confirm the four typos from ADR-002 are corrected in target schema
SELECT column_name FROM information_schema.columns
WHERE table_name = 'writing_company' AND column_name = 'writing_company'; -- not 'writting_company'

SELECT column_name FROM information_schema.columns
WHERE table_name = 'policy_commission' AND column_name = 'commission_percentage'; -- not 'comission_percentage'
-- ASSERT: corrected names found, legacy typo names NOT found
```

---

## 11. Test Data Strategy

### 11.1 Seeded Test Data

All integration and E2E test environments are seeded with deterministic, version-controlled test data. Seed scripts are checked into the repository under `/tests/seed/`. Seed data includes:
- Two tenants (TenantA, TenantB) with realistic but non-PII identifiers
- One user per role per tenant (ClientAdmin, IntermediaryProducer, Adjuster, UserRole)
- One group per tenant with each of the 10 permission flags tested individually
- One active policy per tenant with associated payment plan, mortgagee, and documents
- One open claim per tenant with worksheet and one sensitive document

### 11.2 No Production Data in Tests

Test data MUST NOT contain real PII, real financial account numbers, or real policy numbers from the source SQL Server. Migration validation queries run against a snapshot, not the live production source.

### 11.3 Test Data Reset

The QA environment test database is reset to the seeded baseline before each E2E test suite run. Integration tests using Testcontainers are stateless by design (each test class gets a fresh container or a transaction that is rolled back).

---

## 12. CI/CD Pipeline Integration

### 12.1 Pull Request Gate (every PR)
1. `dotnet build` — build must succeed
2. `dotnet test --filter Category!=E2E` — all unit and integration tests must pass
3. Jest — all component tests must pass
4. Coverlet coverage report — domain service coverage must be ≥ 80%
5. OWASP ZAP baseline scan — no High findings allowed

### 12.2 QA Deployment Gate (merge to `main`)
1. All PR gates above
2. Playwright E2E suite against QA environment — all tests must pass
3. k6 load test — all threshold assertions must pass
4. Human review of all `[HumanValidation]` tagged test results

### 12.3 UAT Deployment Gate (release candidate)
1. All QA gates above
2. Manual UAT execution against UAT environment
3. Business SME sign-off on HUMAN_VALIDATION_REQUIRED test results

### 12.4 Production Deployment Gate
1. All UAT gates above
2. Migration validation queries executed and all assertions pass
3. Production smoke test passes (5-minute Playwright smoke suite)

---

## 13. Defect Classification

| Severity | Definition | Resolution SLA |
|---|---|---|
| CRITICAL | Test failure in HUMAN_VALIDATION_REQUIRED category; migration validation failure; cross-tenant data leak | Block deployment; escalate to security/financial officer within 2 hours |
| HIGH | P1 acceptance criterion failing; all-tenants-visible data defect; Hangfire job not triggering on correct threshold | Block merge to main; fix before next sprint |
| MEDIUM | P2 acceptance criterion failing; non-blocking permission defect; PROVISIONAL test newly unblocked by QST resolution | Target next sprint |
| LOW | Code coverage drop; P3 story failing; cosmetic | Backlog item |

---

## 14. Roles and Responsibilities

| Role | Responsibility |
|---|---|
| Developer | Write unit and integration tests for all code they author; tag HUMAN_VALIDATION_REQUIRED tests correctly; maintain ≥ 80% coverage |
| QA Engineer | Own Playwright E2E suite; own k6 load test scripts; maintain ART-4-010 matrix as tests are implemented |
| Security Officer | Review and sign off all `[HumanValidation]` tagged security tests; escalate ZAP findings |
| Business SME | Review and sign off all `[HumanValidation]` tagged financial logic tests; validate migration validation query results |
| DevOps | Maintain GitHub Actions pipeline; configure ZAP scan step; ensure QA environment reset before E2E runs |

---

## 15. Tools Summary

| Tool | Version | Purpose |
|---|---|---|
| xUnit | 2.7+ | .NET unit and integration test runner |
| FluentAssertions | 6.x | Readable assertion library for xUnit |
| Moq | 4.x | Mocking framework for unit tests |
| Testcontainers for .NET | 3.x | PostgreSQL Docker container for integration tests |
| Microsoft.AspNetCore.Mvc.Testing | 8.x | ASP.NET Core TestServer |
| WireMock.Net | 1.x | HTTP stub server (TranzPay, LenderDock, Plumsail stubs) |
| Coverlet | 6.x | .NET code coverage collection |
| Jest | 29.x | React/TypeScript unit test runner |
| React Testing Library | 14.x | React component testing utilities |
| Playwright | 1.4x | Browser-based E2E test automation |
| k6 | 0.49+ | Load and performance testing |
| OWASP ZAP | 2.14+ | Automated security scanning |
| GitHub Actions | — | CI/CD pipeline orchestration |

---

*End of ART-4-009 — Test Strategy | INSUREEDGE-2026 | FORGE Phase | 2026-06-17*
*Governance: Layer 0 §3 (Confidence), §5 (Evidence First), §2 (DAQ Register)*
*All PROVISIONAL tests cite blocking QST-. All HUMAN_VALIDATION_REQUIRED tests tagged for SME review.*
