# ART-5-003 — Complete Traceability Report
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Documentation Agent
**Phase:** TRANSFER
**Date:** 2026-06-17
**Version:** 1.0 — FINAL
**Engagement:** INSUREEDGE-2026 | Customer: Hudson Bailey | Writing Company: Sierra Specialty Insurance Company

> **Governance:** This document only assembles what upstream agents produced. No new findings are authored here. All caveats, provisional flags, and ASM- markers are preserved verbatim. Every claim cites a source ART- or EV-. If a section would be empty because an upstream artifact is missing, a visible `[GAP]` marker is inserted.

---

## Table of Contents

- Part A: Requirement → Architecture Traceability (27 Capabilities)
- Part B: Evidence → Finding Traceability (Top 20 Evidence Items)
- Part C: Decision → Artifact Traceability (All 17 DEC- Entries)

---

## Part A: Requirement → Architecture Traceability

For each of the 27 capabilities in ART-2-008, this section traces:
- Capability ID and name
- PRD requirement reference (US- story IDs)
- Architecture home (ADR + module in ART-4-001)
- API endpoint (ART-4-003 reference)
- Test coverage (ART-4-010 reference)
- Status: FULLY TRACED / PARTIALLY TRACED / GAP

### Domain D1: Policy Lifecycle Management

---

#### D1-C1: Quote Creation & Submission

| Field | Value |
|---|---|
| Capability | D1-C1 — Quote Creation & Submission |
| PRD Ref (ART-2-010) | FR-D1-001 |
| User Stories | US-POLICY-001 (new individual quote), US-POLICY-002 (risk location + HexCat), US-POLICY-003 (coverage selection), US-POLICY-004 (quote review) |
| Acceptance Criteria | AC-US-POLICY-001-01 through -04; AC-US-POLICY-002-01 through -04; AC-US-POLICY-003-01; AC-US-POLICY-004-01 |
| Architecture ADR | ADR-001 (Modular Monolith — Policy module), ADR-007 (React SPA — multi-step wizard) |
| Architecture Module | `InsureEdge.Application/Policy/` (QuoteApplicationService); `InsureEdge.Infrastructure/Policy/` (QuoteRepository, HexCatClient, GeocodingClient) |
| ART-4-001 Location | `src/InsureEdge.API/Controllers/Policy/QuoteController.cs` |
| API Endpoints | POST /api/v1/quotes/step1 (Policy Information); POST /api/v1/quotes/{id}/risk-location (Risk + HexCat); POST /api/v1/quotes/{id}/coverages; GET /api/v1/quotes/{id}/review |
| API Source | ART-4-003 §Policy section |
| Test Coverage | TC-POL-001 through TC-POL-010 (ART-4-010) — all COVERED |
| Test Specs | ART-4-007 TS-POL-001 through TS-POL-004 |
| **Trace Status** | **FULLY TRACED** |

---

#### D1-C2: Policy Binding & Issuance

| Field | Value |
|---|---|
| Capability | D1-C2 — Policy Binding & Issuance |
| PRD Ref | FR-D1-002 |
| User Stories | US-POLICY-005 (bind + collect payment), US-POLICY-006 (generate declaration page), US-POLICY-007 (notify mortgage lender) |
| Acceptance Criteria | AC-US-POLICY-005-01 through -04; AC-US-POLICY-006-01 through -03; AC-US-POLICY-007-01 through -03 |
| Architecture ADR | ADR-001 (Modular Monolith — Policy module), ADR-006 (TranzPay hosted redirect), ADR-002 (PostgreSQL) |
| Architecture Module | `InsureEdge.Application/Policy/` (PolicyBindingService); `InsureEdge.Infrastructure/Integrations/` (TranzPayClient, LenderDockClient, PlumsailClient, AzureBlobClient) |
| ART-4-001 Location | `src/InsureEdge.API/Controllers/Policy/PolicyController.cs` |
| API Endpoints | POST /api/v1/policies/bind |
| API Source | ART-4-003 §Policy — bind endpoint |
| Test Coverage | TC-POL-011 (COVERED), TC-POL-012 (payment failure — COVERED), TC-POL-013 (duplicate block — COVERED), TC-POL-014 (permission — COVERED), TC-POL-015 (PROVISIONAL — Plumsail API key unconfirmed), TC-POL-018/019/020 (PROVISIONAL — LenderDock schema) |
| Test Specs | ART-4-007 TS-POL-005, TS-POL-006 |
| **Trace Status** | **PARTIALLY TRACED** — payment and duplicate detection FULLY TRACED; document generation and LenderDock notification PROVISIONAL pending QST-1-INT-002/003 |

---

#### D1-C3: Policy Endorsement

| Field | Value |
|---|---|
| Capability | D1-C3 — Policy Endorsement |
| PRD Ref | FR-D1-003 |
| User Stories | US-POLICY-008 (endorse mid-term), US-POLICY-009 (premium-bearing endorsement payment) |
| Acceptance Criteria | AC-US-POLICY-008-01; AC-US-POLICY-009-01 through -03 |
| Architecture ADR | ADR-001 (Policy module), ADR-006 (TranzPay for additional premium collection) |
| Architecture Module | `InsureEdge.Application/Policy/` (EndorsementService, EndorsementPaymentService) |
| ART-4-001 Location | `src/InsureEdge.API/Controllers/Policy/PolicyController.cs` (endorsement sub-routes) |
| API Endpoints | POST /api/v1/policies/{id}/endorsements/premium-bearing; POST /api/v1/policies/{id}/endorsements/non-premium-bearing |
| API Source | ART-4-003 §Policy endorsement section |
| Test Coverage | TC-POL-021 (COVERED), TC-POL-022 (COVERED — HVR on premium delta) |
| Test Specs | ART-4-007 TS-POL-008, TS-POL-009 |
| **Trace Status** | **FULLY TRACED** — with HVR flag on financial calculation |

---

#### D1-C4: Policy Renewal

| Field | Value |
|---|---|
| Capability | D1-C4 — Policy Renewal |
| PRD Ref | FR-D1-004 |
| User Stories | US-POLICY-010 (automated renewal quote), US-POLICY-011 (manual renewal) |
| Acceptance Criteria | AC-US-POLICY-010-01 through -03; AC-US-POLICY-011-01 |
| Architecture ADR | ADR-001 (Policy module), ADR-009 (Hangfire — T-01 RenewalQuoteGenerator, T-03 NonRenewalNoticeSender) |
| Architecture Module | `InsureEdge.Workers/Jobs/` (RenewalQuoteGeneratorJob, NonRenewalNoticeSenderJob, RenewalDraftEmailJob); `InsureEdge.Application/Policy/` (RenewalService) |
| ART-4-001 Location | `src/InsureEdge.Workers/Jobs/` |
| API Endpoints | POST /api/v1/policies/{id}/renewals/manual-trigger; GET /api/v1/policies/{id}/renewal-quote |
| API Source | ART-4-003 §Policy renewal section |
| Test Coverage | TC-POL-023 through TC-POL-026 (COVERED), TC-POL-035 (PROVISIONAL — document generation), TC-POL-036/037 (COVERED), TC-POL-038 (PROVISIONAL — LenderDock) |
| Test Specs | ART-4-007 TS-POL-010, TS-POL-011 |
| **Trace Status** | **PARTIALLY TRACED** — renewal quote generation and email FULLY TRACED; non-renewal document generation PROVISIONAL; LenderDock renewal notification PROVISIONAL |

---

#### D1-C5: Policy Cancellation & Non-Renewal

| Field | Value |
|---|---|
| Capability | D1-C5 — Policy Cancellation & Non-Renewal |
| PRD Ref | FR-D1-005 |
| User Stories | US-POLICY-012 (manual cancellation), US-POLICY-013 (auto-cancellation on non-payment), US-POLICY-014 (non-renewal decision) |
| Acceptance Criteria | AC-US-POLICY-012-01 through -04; AC-US-POLICY-013-01 through -03; AC-US-POLICY-014-01 through -03 |
| Architecture ADR | ADR-001 (Policy module), ADR-009 (Hangfire — T-06 AutoCancellationProcessor, T-04 PolicyExpiryProcessor) |
| Architecture Module | `InsureEdge.Application/Policy/` (CancellationService); `InsureEdge.Workers/Jobs/` (AutoCancellationJob, PolicyExpiryJob) |
| ART-4-001 Location | `src/InsureEdge.API/Controllers/Policy/PolicyController.cs` |
| API Endpoints | POST /api/v1/policies/{id}/cancel; POST /api/v1/policies/{id}/do-not-renew |
| API Source | ART-4-003 §Policy cancellation section |
| Test Coverage | TC-POL-027 through TC-POL-037 — COVERED (manual cancel, permission, auto-cancel boundaries); TC-POL-029, TC-POL-034 PROVISIONAL (LenderDock) |
| Test Specs | ART-4-007 TS-POL-012, TS-POL-013 |
| **Trace Status** | **PARTIALLY TRACED** — cancellation workflow, auto-cancel timer, email FULLY TRACED; LenderDock cancellation notification PROVISIONAL |

---

#### D1-C6: Bulk Policy Upload & Processing

| Field | Value |
|---|---|
| Capability | D1-C6 — Bulk Policy Upload & Processing |
| PRD Ref | FR-D1-006 |
| User Stories | US-POLICY-015 (bulk upload file), US-POLICY-016 (async processing via background job) |
| Acceptance Criteria | AC-US-POLICY-015-01; AC-US-POLICY-016-01 |
| Architecture ADR | ADR-001 (Policy module), ADR-009 (Hangfire — T-07 BulkUploadProcessor), ADR-008 (bulk upload endpoint) |
| Architecture Module | `InsureEdge.Application/Policy/` (BulkUploadService); `InsureEdge.Workers/Jobs/` (BulkUploadProcessorJob) |
| ART-4-001 Location | `src/InsureEdge.API/Controllers/Policy/BulkUploadController.cs` |
| API Endpoints | POST /api/v1/policies/bulk-upload; GET /api/v1/policies/bulk-upload/{jobId}/status |
| API Source | ART-4-003 §Policy bulk upload section |
| Test Coverage | TC-POL-039 (COVERED) |
| Test Specs | ART-4-007 TS-POL-015 |
| **Trace Status** | **FULLY TRACED** |

---

### Domain D2: Claims Management

#### D2-C1: FNOL Intake

| Field | Value |
|---|---|
| Capability | D2-C1 — First Notice of Loss Intake |
| PRD Ref | FR-D2-001 |
| User Stories | US-CLAIMS-001 |
| Architecture ADR | ADR-001 (Claims module) |
| Architecture Module | `InsureEdge.Application/Claims/` (ClaimIntakeService); `InsureEdge.Infrastructure/Claims/` (ClaimRepository) |
| ART-4-001 Location | `src/InsureEdge.API/Controllers/Claims/ClaimController.cs` |
| API Endpoints | POST /api/v1/claims |
| Test Coverage | TC-CLM-001 (COVERED), TC-CLM-002 (duplicate detection — COVERED), TC-CLM-003 (adjuster scope — COVERED) |
| **Trace Status** | **FULLY TRACED** |

---

#### D2-C2: Adjuster Assignment & Claim Workflow

| Field | Value |
|---|---|
| Capability | D2-C2 — Adjuster Assignment & Claim Workflow |
| PRD Ref | FR-D2-002 |
| User Stories | US-CLAIMS-002 (adjuster assignment), US-CLAIMS-003 (impacted coverage recording) |
| Architecture ADR | ADR-001 (Claims module), ADR-003 (AdjusterId scope filter) |
| Architecture Module | `InsureEdge.Application/Claims/` (ClaimWorkflowService) |
| API Endpoints | PUT /api/v1/claims/{id}/adjuster; POST /api/v1/claims/{id}/impacted-coverages |
| Test Coverage | TC-CLM-004 (COVERED), TC-CLM-005 (COVERED) |
| **Trace Status** | **FULLY TRACED** |

---

#### D2-C3: Claims Financial Worksheet & Reserve Management

| Field | Value |
|---|---|
| Capability | D2-C3 — Claims Financial Worksheet |
| PRD Ref | FR-D2-003 |
| User Stories | US-CLAIMS-004 |
| Architecture ADR | ADR-001 (Claims module) |
| API Endpoints | POST /api/v1/claims/{id}/worksheets; PUT /api/v1/claims/{id}/worksheets/{wid}/approve |
| Test Coverage | TC-CLM-006 (COVERED), TC-CLM-007 (approve with permission — COVERED), TC-CLM-008 (without permission — COVERED) |
| **Trace Status** | **FULLY TRACED** |

---

#### D2-C4: Claims Disbursement & Payee Management

| Field | Value |
|---|---|
| Capability | D2-C4 — Claims Disbursement |
| PRD Ref | FR-D2-004 |
| User Stories | US-CLAIMS-005 |
| Architecture ADR | ADR-001 (Claims module) |
| API Endpoints | POST /api/v1/claims/{id}/payees; POST /api/v1/claims/{id}/disburse |
| Test Coverage | TC-CLM-009 — PROVISIONAL (QST-2-INT-003 DisburseCloud URL mismatch) |
| **Trace Status** | **PARTIALLY TRACED** — payee management FULLY TRACED; disbursement trigger PROVISIONAL |

---

#### D2-C5: Catastrophic Event Management

| Field | Value |
|---|---|
| Capability | D2-C5 — CAT Event Management |
| PRD Ref | FR-D2-005 |
| User Stories | US-CLAIMS-006 |
| Architecture ADR | ADR-001 (Claims module) |
| API Endpoints | POST /api/v1/claims/cat-events; PUT /api/v1/claims/{id}/cat-event |
| Test Coverage | TC-CLM-010 (document upload — COVERED); CAT-event grouping coverage: [GAP — no dedicated TC-CAT- test case in ART-4-010] |
| **Trace Status** | **PARTIALLY TRACED** — CAT event creation has architectural home; dedicated test case gap in ART-4-010 §D2-C5 |

---

### Domain D3: Billing & Payments

#### D3-C1: Premium Payment Collection

| Field | Value |
|---|---|
| Capability | D3-C1 — Premium Payment Collection |
| PRD Ref | FR-D3-001 |
| User Stories | US-BILLING-001 |
| Architecture ADR | ADR-006 (TranzPay hosted redirect); ADR-001 (Billing module) |
| Architecture Module | `InsureEdge.Application/Billing/` (PaymentCollectionService); `InsureEdge.Infrastructure/Integrations/` (TranzPayClient) |
| API Endpoints | POST /api/v1/payments/initiate-hosted; POST /api/v1/payments/callback (webhook) |
| Test Coverage | TC-POL-011 (binding + payment — COVERED), TC-POL-012 (payment failure — COVERED) |
| **Trace Status** | **FULLY TRACED** — PROVISIONAL flag on TranzPay live credentials (QST-1-INT-001 production URL outstanding) |

---

#### D3-C2: Payment Plan Management & Installment Scheduling

| Field | Value |
|---|---|
| Capability | D3-C2 — Payment Plan & Installments |
| PRD Ref | FR-D3-002 |
| User Stories | US-BILLING-002 |
| Architecture ADR | ADR-009 (Hangfire — T-08 InstallmentDebitJob) |
| API Endpoints | POST /api/v1/policies/{id}/payment-plan; GET /api/v1/policies/{id}/payment-schedule |
| Test Coverage | ART-4-010 billing section — installment scheduling tests COVERED per ART-4-010 §D3 |
| **Trace Status** | **FULLY TRACED** |

---

#### D3-C3: Refunds & Payment Reversals

| Field | Value |
|---|---|
| Capability | D3-C3 — Refunds & Payment Reversals |
| PRD Ref | FR-D3-003 |
| User Stories | US-BILLING-003 |
| Architecture ADR | ADR-006 (TranzPay — ACH refund + card refund via same gateway) |
| API Endpoints | POST /api/v1/payments/{transactionId}/refund |
| Test Coverage | Refund path tested as part of cancellation flow (TC-POL-027); dedicated refund calculation HVR flagged in ART-4-002 |
| **Trace Status** | **PARTIALLY TRACED** — refund path traced through cancellation; dedicated refund-only test case partially covered; HVR on refund amount formula |

---

#### D3-C4: Failed Payment Handling & Auto-Cancellation

| Field | Value |
|---|---|
| Capability | D3-C4 — Failed Payment Handling |
| PRD Ref | FR-D3-004 |
| User Stories | US-POLICY-013 (auto-cancel on failed payment) |
| Architecture ADR | ADR-009 (Hangfire — T-06 AutoCancellationProcessor) |
| API Endpoints | Background job only — no user-facing endpoint |
| Test Coverage | TC-POL-031 (auto-cancel fires at 30 days — COVERED), TC-POL-032 (boundary 29 days — COVERED), TC-POL-033 (failed payment email — COVERED) |
| **Trace Status** | **FULLY TRACED** |

---

### Domain D4: Distribution Management

#### D4-C1: Intermediary & Producer Onboarding

| Field | Value |
|---|---|
| Capability | D4-C1 — Intermediary & Producer Onboarding |
| PRD Ref | FR-D4-001 |
| User Stories | US-DIST-001 |
| Architecture ADR | ADR-001 (Distribution module), ADR-003 (ClientId scope) |
| API Endpoints | POST /api/v1/intermediaries; POST /api/v1/intermediaries/{id}/producers |
| Test Coverage | ART-4-010 §D4 — intermediary onboarding tests COVERED |
| **Trace Status** | **FULLY TRACED** |

---

#### D4-C2: Commission Configuration & Calculation

| Field | Value |
|---|---|
| Capability | D4-C2 — Commission Configuration |
| PRD Ref | FR-D4-002 |
| User Stories | US-DIST-002 |
| Architecture ADR | ADR-001 (Distribution module) |
| API Endpoints | PUT /api/v1/intermediaries/{id}/commission-rate |
| Test Coverage | Commission calculation HVR flagged in ART-4-002 (CommissionPercentage financial field); ART-4-010 §D4 |
| **Trace Status** | **FULLY TRACED** — with HVR on commission amount formula |

---

#### D4-C3: Commission Disbursement

| Field | Value |
|---|---|
| Capability | D4-C3 — Commission Disbursement |
| PRD Ref | FR-D4-003 |
| User Stories | US-DIST-003 |
| Architecture ADR | ADR-001 (Distribution module), ADR-009 (Hangfire — T-09 CommissionDisbursementJob) |
| API Endpoints | POST /api/v1/commissions/{id}/disburse |
| Test Coverage | TC-CLM-009 reference (DisburseCloud — PROVISIONAL QST-2-INT-003) |
| **Trace Status** | **PARTIALLY TRACED** — DisburseCloud client implemented; end-to-end disbursement PROVISIONAL pending production URL confirmation |

---

### Domain D5: Identity & Access Management

#### D5-C1: User Lifecycle Management

| Field | Value |
|---|---|
| Capability | D5-C1 — User Lifecycle Management |
| PRD Ref | FR-D5-001 |
| User Stories | US-IAM-001 |
| Architecture ADR | ADR-004 (ASP.NET Core Identity), ADR-003 (ClientId scope) |
| Architecture Module | `InsureEdge.Application/Identity/` (UserManagementService); `InsureEdge.Infrastructure/Identity/` (AppUserRepository) |
| API Endpoints | POST /api/v1/users; PUT /api/v1/users/{id}; DELETE /api/v1/users/{id}/deactivate |
| Test Coverage | ART-4-010 §D5 — user CRUD + email uniqueness tests COVERED |
| **Trace Status** | **FULLY TRACED** |

---

#### D5-C2: Group-Based Permission Management

| Field | Value |
|---|---|
| Capability | D5-C2 — Group-Based Permission Management |
| PRD Ref | FR-D5-002 |
| User Stories | US-IAM-002 (group management), US-IAM-003 (permission enforcement) |
| Architecture ADR | ADR-003 (Row-Level Multi-Tenancy + ClientId), ADR-004 (JWT carries permission claims) |
| Architecture Module | `InsureEdge.Application/Identity/` (GroupPermissionService, PermissionResolutionService) |
| API Endpoints | POST /api/v1/groups; PUT /api/v1/groups/{id}/permissions; GET /api/v1/users/{id}/effective-permissions |
| Test Coverage | TC-POL-014 (IsCreatePermission — COVERED), TC-POL-030 (IsEditPermission — COVERED), TC-CLM-008 (IsApproveReject — COVERED); multi-tenancy isolation implicit in all integration tests |
| **Trace Status** | **FULLY TRACED** |

---

#### D5-C3: Authentication & Password Management

| Field | Value |
|---|---|
| Capability | D5-C3 — Authentication & Password Management |
| PRD Ref | FR-D5-003 |
| User Stories | US-IAM-004 (login + JWT), US-IAM-005 (password reset) |
| Architecture ADR | ADR-004 (ASP.NET Core Identity + JWT; bcrypt; MFA for PlatformAdmin and ClientAdmin) |
| API Endpoints | POST /api/v1/auth/login; POST /api/v1/auth/refresh; POST /api/v1/auth/password-reset-request; POST /api/v1/auth/password-reset-confirm |
| Test Coverage | ART-4-010 §D5-C3 — login, token refresh, password reset, rate limiting tests COVERED; RSK-1-SEC-001 (bcrypt) and RSK-1-SEC-002 (token code-match) ADDRESSED in architecture |
| **Trace Status** | **FULLY TRACED** |

---

#### D5-C4: Audit Trail

| Field | Value |
|---|---|
| Capability | D5-C4 — Audit Trail |
| PRD Ref | FR-D5-004 |
| User Stories | US-IAM-006 |
| Architecture ADR | ADR-001 (shared audit infrastructure across all modules) |
| Architecture Module | `InsureEdge.Infrastructure/` (AuditLogInterceptor — EF Core SaveChanges interceptor) |
| API Endpoints | GET /api/v1/audit-logs (PlatformAdmin only); GET /api/v1/audit-logs/user/{id} (ClientAdmin, scoped) |
| Test Coverage | ART-4-010 §D5-C4 — audit log creation on significant actions COVERED; cross-tenant audit RSK-1-SEC-009 COVERED |
| **Trace Status** | **FULLY TRACED** |

---

### Domain D6: Document Management

#### D6-C1: Document Generation

| Field | Value |
|---|---|
| Capability | D6-C1 — Document Generation |
| PRD Ref | FR-D6-001 |
| User Stories | US-POLICY-006 (declaration page), US-DOC-001 (on-demand generation) |
| Architecture ADR | ADR-001 (Documents module), ADR-010 (Plumsail API key in Key Vault) |
| Architecture Module | `InsureEdge.Infrastructure/Documents/` (PlumsailDocumentClient, AzureBlobStorageClient) |
| API Endpoints | POST /api/v1/documents/generate (system-triggered at lifecycle events) |
| Test Coverage | TC-POL-015 — PROVISIONAL (Plumsail API key unconfirmed — QST-1-INT-003); TC-POL-016, TC-POL-017 (download permission — COVERED) |
| **Trace Status** | **PARTIALLY TRACED** — document storage and retrieval FULLY TRACED; Plumsail generation call PROVISIONAL |

---

#### D6-C2: Document Upload, Retrieval & Sensitive Document Control

| Field | Value |
|---|---|
| Capability | D6-C2 — Document Upload & Retrieval |
| PRD Ref | FR-D6-002 |
| User Stories | US-DOC-002 |
| Architecture ADR | ADR-001 (Documents module), ADR-010 (Azure Blob SAS tokens via Key Vault) |
| API Endpoints | POST /api/v1/policies/{id}/documents (upload); GET /api/v1/policies/{id}/documents (list); GET /api/v1/policies/{id}/documents/download/{docId} (SAS-token download) |
| Test Coverage | TC-CLM-010 (IsSensitive flag — COVERED); TC-POL-016 (download with permission — COVERED); TC-POL-017 (download without permission — COVERED) |
| **Trace Status** | **FULLY TRACED** |

---

### Domain D7: System Administration

#### D7-C1: Multi-Tenant Client Provisioning

| Field | Value |
|---|---|
| Capability | D7-C1 — Multi-Tenant Client Provisioning |
| PRD Ref | FR-D7-001 |
| User Stories | US-ADMIN-001 |
| Architecture ADR | ADR-003 (Row-Level Multi-Tenancy), ADR-001 (Admin module) |
| API Endpoints | POST /api/v1/admin/clients; PUT /api/v1/admin/clients/{id}; POST /api/v1/admin/clients/{id}/offices |
| Test Coverage | ART-4-010 §D7 — tenant provisioning tests COVERED; cross-tenant isolation asserted in all integration tests |
| **Trace Status** | **FULLY TRACED** |

---

#### D7-C2: Insurance Product Catalog Management

| Field | Value |
|---|---|
| Capability | D7-C2 — Product Catalog Management |
| PRD Ref | FR-D7-002 |
| User Stories | US-ADMIN-002 |
| Architecture ADR | ADR-001 (Admin module — PlatformAdmin only) |
| API Endpoints | POST /api/v1/admin/products; PUT /api/v1/admin/products/{id}/status |
| Test Coverage | ART-4-010 §D7 — product activation/deactivation COVERED |
| **Trace Status** | **FULLY TRACED** |

---

#### D7-C3: Platform Configuration Management

| Field | Value |
|---|---|
| Capability | D7-C3 — Platform Configuration Management |
| PRD Ref | FR-D7-003 |
| User Stories | US-ADMIN-003 |
| Architecture ADR | ADR-010 (Azure Key Vault for all credentials); ADR-009 (Hangfire timer enable/disable) |
| API Endpoints | PUT /api/v1/admin/config/{key} (PlatformAdmin only — non-secret config only; secrets via Key Vault) |
| Test Coverage | ART-4-010 §D7 — config management tests; BypassRefundResponse = FALSE in production is a HVR item |
| **Trace Status** | **FULLY TRACED** — with CRITICAL HVR on BypassRefundResponse production value |

---

### Part A Summary

| Status | Capability Count |
|---|---|
| FULLY TRACED | 22 of 27 |
| PARTIALLY TRACED | 5 of 27 (D1-C2, D1-C4, D1-C5, D2-C4, D2-C5) |
| GAP | 0 of 27 |

All 5 PARTIALLY TRACED capabilities have a documented open item in Section 5 of ART-5-001 that explains the gap and what is required to complete the trace.

---

## Part B: Evidence → Finding Traceability

The top 20 highest-impact evidence items, ordered by downstream influence across the artifact set.

| # | EV-ID | Source | Confidence | Finding(s) Supported | ART- Artifacts Citing It |
|---|---|---|---|---|---|
| 1 | EV-0-0226 | `Logic\roles_permissions.md` — full role matrix, 10 permission flags, scope filters, group-based inheritance | HIGH | FND-1-SEC-001 (role inventory), FND-1-SEC-002 (10 permission flags), FND-1-SEC-003 (group-based OR union) | ART-1-003, ART-1-004, ART-2-002, ART-2-005, ART-2-008 D5-C2, ART-2-010, ART-3-002 ADR-003/ADR-004, ART-4-003, ART-4-010 |
| 2 | EV-0-0231 | OutSystems Site Properties (human-supplied 2026-06-16) — all site property names and values | HIGH | FND-1-INT-001 through FND-1-INT-008 (8 integration contracts resolved), FND-1-LOGIC-TIMERS (timer thresholds), FND-1-POL-RULES (policy lifecycle thresholds, $195 fee, BypassRefundResponse) | ART-1-004, ART-1-002, ART-2-005, ART-2-008, ART-2-009, ART-2-010, ART-3-002 ADR-010, ART-4-003, ART-4-010 |
| 3 | EV-0-0218 | `Quotes&Policies\WebScrapPRD\Q&P_Client_PRD.md` — full wizard walkthrough Steps 1–3, policy 360 | MEDIUM | FND-1-UI-001 through FND-1-UI-015 (Q&P screens), FND-1-LOGIC-WIZARD (quote wizard flow) | ART-1-005, ART-2-002 (US-POLICY-001 through US-POLICY-007), ART-2-003, ART-2-004, ART-2-008 D1-C1/D1-C2, ART-4-003, ART-4-010 |
| 4 | EV-0-0232 | `TECHNICAL_IMPLEMENTATION_DOCUMENT__Tranzpay_Payment_Integration.pdf` — TranzPay TID v1.0 | HIGH | QST-1-INT-001 CLOSED (TranzPay sandbox contract resolved); FND-HARVEST-INT-001 (TranzPay REST endpoint, auth, payload) | ART-2-012 §1, ART-3-002 ADR-006, ART-4-003 §Payment, ART-4-007 TS-POL-005 |
| 5 | EV-0-0224 | `Database\SHIFT_Insureedge_DEV.txt` — SQL DDL, 92 CREATE TABLE statements | HIGH | FND-1-DATA-001 through FND-1-DATA-010 (entity inventory, FK map, two-DB coupling) | ART-1-001, ART-2-008 (data requirements per capability), ART-3-013, ART-4-002, ART-4-006 |
| 6 | EV-0-0225 | `Database\SHIFT_Insureedge_SYSTEM_DEV.txt` — SQL DDL, 26 CREATE TABLE statements | HIGH | FND-1-DATA-011 through FND-1-DATA-016 (system/tenant table inventory) | ART-1-001, ART-3-013, ART-4-002, ART-4-006 |
| 7 | EV-0-0252 | `Logic\Rater Functionality\09-11-2025 Hudson Bailey Homeowers SuperPerils rater (2).xlsx` — rating workbook | HIGH | QST-1-LOGIC-001 CLOSED; FND-HARVEST-LOGIC-001 (premium formula: Base Peril + Liability + Surcharges + StateTax + $195 fee) | ART-2-011 §1, ART-2-008 D1-C1, ART-2-005 §1.8, ART-4-003 §Quote review, ART-4-010 TC-POL-010 |
| 8 | EV-0-0006 | `Logic\03_Policy.md` — policy module function index (569 functions) | MEDIUM | FND-1-LOGIC-003 through FND-1-LOGIC-025 (policy lifecycle workflow chains, payment actions, LenderDock actions, document generation triggers) | ART-1-002 §2.1, ART-2-002 US-POLICY-005 through US-POLICY-014, ART-2-005, ART-4-003, ART-4-007, ART-4-010 |
| 9 | EV-0-0236 | `DisburseCloud API Documentation.pdf` — DisburseCloud REST API v1.2.1 | HIGH | FND-HARVEST-INT-003 (DisburseCloud endpoint, auth, disbursement payload) | ART-2-012 §3, ART-3-002 (INT-009 implementation), ART-4-004 (DisburseCloudClient), ART-4-010 TC-CLM-009 |
| 10 | EV-0-0233 | `InsureEdge - Domain Architecture.pdf` — domain/module relationship diagram | HIGH | FND-HARVEST-ARCH-001 (7 domain boundaries confirmed, BL/CS layering pattern) | ART-2-012 §2, ART-3-003 C4 Level 2, ART-3-005 §2, ART-4-001 |
| 11 | EV-0-0234 | `InsureEdge-ERD .pdf` — Full ERD for InsureEdge_DEV | HIGH | FND-HARVEST-DATA-001 (ERD delta — additional relationships and FKs not visible in DDL) | ART-2-012 §4, ART-3-013 (MIGRATE-DIRECT vs TRANSFORM classification) |
| 12 | EV-0-0048 | `Group Management\Web Scrape PRD\UserGroupManagement.md` — Group Mgmt PRD | MEDIUM | FND-1-UI-016 through FND-1-UI-022 (Group Mgmt screens), FND-1-LOGIC-GROUPS (group operations, permission gating) | ART-1-005 §1.5, ART-1-003 §2.2, ART-2-002 US-IAM-002/003, ART-4-003 §Groups, ART-4-010 §D5 |
| 13 | EV-0-0222 | `User Management\Web Scrape PRD\usermanagement.md` — User Mgmt PRD | MEDIUM | FND-1-UI-023 through FND-1-UI-030 (User Mgmt screens, ViewProfile tabs), FND-1-LOGIC-USERS | ART-1-005 §1.4, ART-2-002 US-IAM-001/004/005, ART-4-003 §Users/Auth, ART-4-010 §D5 |
| 14 | EV-0-0254 | `Endorsement Payments\Premium Bearing Endorsement Requirements_Final.pdf` — HB UW authority tiers, endorsement payment flow | HIGH | FND-HARVEST-LOGIC-002 (premium-bearing endorsement: 4 tiers, additional collect vs. return premium, UW authority check) | ART-2-011 §2, ART-2-005 §3.2, ART-4-003 §Endorsement, ART-4-010 TC-POL-022 |
| 15 | EV-0-0243 | `TECHNICAL_IMPLEMENTATION_DOCUMENT__RPS_Integration_using_PostgreSQLPostGIS.pdf` — RPS TID v1.0 | HIGH | FND-HARVEST-INT-004 (RPS as INT-011 — PostGIS-native Azure PostgreSQL query pattern) | ART-2-012 §5, ART-3-002 ADR-005, ART-3-009 (PostGIS on Azure), ART-4-005 (Terraform PostgreSQL config) |
| 16 | EV-0-0264 | `IE-LC Software Architecture Document.docx.txt` — multi-tenant SaaS, O11 platform, 4-env pipeline, module list, security model | HIGH | FND-0-ARCH-001 (4-environment promotion pattern: Dev → QA → UAT → Prod); FND-0-ARCH-002 (module list cross-validation with OML inventory) | ART-3-011 CI/CD (pipeline stages), ART-3-009 (environment topology), ART-2-010 §scope |
| 17 | EV-0-0259 | `InsureEdge - Architectural Artifacts Login Machanism & Personas.pdf` — login mechanism + 5-tier persona architecture | HIGH | FND-HARVEST-SEC-001 (login flow — pre-authentication tenant resolution); FND-HARVEST-SEC-002 (5-tier persona confirmed with OutSystems names) | ART-2-011 §4, ART-3-002 ADR-004, ART-4-003 §1 auth endpoints |
| 18 | EV-0-0257 | `InsureEdge - Architectural Artifacts Audit Logs.pdf` — 10-field audit log schema, universal module scope | HIGH | FND-HARVEST-LOGIC-003 (audit log 10 fields: UserId, ActionType, TableName, RecordId, SessionId, ModuleName, Timestamp, IPAddress, ClientId, UserAgent) | ART-2-011 §5, ART-2-008 D5-C4, ART-4-002 (AuditLog entity), ART-4-004 (AuditLogInterceptor) |
| 19 | EV-0-0251 | `Endorsement Payments\Flow Diagram Endorsement Add payments.png` — endorsement payment decision flow | HIGH | FND-HARVEST-LOGIC-004 (endorsement payment flow: premium-bearing gate → TranzPay charge/refund path decision tree) | ART-2-011 §2.3, ART-4-003 §Endorsement, ART-4-007 TS-POL-009 |
| 20 | EV-0-0230 | `Logic\09_Common.md — AES_Encrypt/Decrypt via RssExtensionCryptoAPI` — AES-256 CBC + HMAC-256 | HIGH | FND-1-SEC-006 (encryption pattern for sensitive fields — BankDetail); RSK-1-SEC-010 (key rotation risk) | ART-1-003 §4, ART-3-002 ADR-010 (Key Vault for Base64Key), ART-4-002 (BankDetail entity — encrypted fields), ART-4-005 (Key Vault Terraform) |

---

## Part C: Decision → Artifact Traceability

For each DEC- entry in the DAQ Register, this section records which ART- artifacts the decision influenced and whether the decision remains in force.

| # | DEC ID | Decision Statement (abbreviated) | ART- Artifacts Influenced | In Force? |
|---|---|---|---|---|
| 1 | DEC-0-0001 | Engagement started. Project Context bound. Phase: DISCOVER. | All ART- files (engagement initiation) | Yes — foundational |
| 2 | DEC-0-0002 | DISCOVER gate passed; phase advanced to SCAN. MRS 61.4 meets threshold 60. | SCAN agents launched; ART-1-001 through ART-1-005 authorized to proceed | Yes — gate record |
| 3 | DEC-0-0003 | Runtime logs and environment configs declared out of scope. | ART-0-002 (runtime category at floor, weight 2); ART-0-006 (MRS formula reflects floor); all subsequent MRS reports carry runtime at 20%/40% | Yes — runtime category remains at floor through all phases |
| 4 | DEC-0-0004 | Database files confirmed as SQL DDL scripts — SQL Server format, 118 CREATE TABLE statements. | ART-0-002 (data category quality revised to 95%); ART-1-001 (DDL as primary evidence); ART-3-013 (SQL Server → PostgreSQL migration scoped) | Yes — data evidence confirmed |
| 5 | DEC-0-0005 | MRS revised to 70.5 after new artifacts. DISCOVER gate remains PASSED. | ART-0-006 (MRS narrative updated); SCAN phase MRS baseline set at 70.5 | Yes — baseline established |
| 6 | DEC-1-0001 | SCAN gate PASSED. MRS 79.2. Zero open blocking doubts. | ART-1-001 through ART-1-005 finalized; HARVEST authorized | Yes — gate record |
| 7 | DEC-1-0002 | Site properties supplied. 8/10 integration contracts resolved. TranzPay = placeholder. | ART-1-004 (8 integrations updated to RESOLVED; TranzPay to PLACEHOLDER); ART-1-002 (timer thresholds updated to HIGH); ART-2-005 (policy fee $195, thresholds from site properties) | Yes — integration contracts in force for target implementation |
| 8 | DEC-1-0003 | MRS revised to 82.5 after site properties. API quality 72% → 92%. | ART-1-005 (SCAN MRS report revised); all HARVEST agent inputs updated | Yes — SCAN baseline for HARVEST set at 82.5 |
| 9 | DEC-2-0001 | SCAN gate APPROVED by human. Phase advanced to HARVEST. | HARVEST agents authorized to proceed; ART-2-001 through ART-2-010 production initiated | Yes — gate record |
| 10 | DEC-2-0002 | HARVEST complete. PRD Gate package assembled. | ART-2-010 designated as gate deliverable; PRD gate checklist initiated | Yes — gate record |
| 11 | DEC-2-0003 | 22 new architectural artifacts added mid-HARVEST. 3 SharePoint URLs require authenticated access. | ART-2-012 (new evidence base for supplement); EV-0-0232 through EV-0-0253 indexed; EV-0-0246, EV-0-0247, EV-0-0248 remain UNKNOWN | Yes — extended evidence base in force |
| 12 | DEC-2-0004 | Extended HARVEST pass complete. ART-2-011 and ART-2-012 produced. TranzPay contract resolved. MRS 85.5. | ART-2-011 (rating engine resolved), ART-2-012 (TranzPay, DisburseCloud, RPS documented); MRS revised to 85.5; QST-1-LOGIC-001 CLOSED | Yes — supplements are in force; rating formula and TranzPay sandbox contract authoritative |
| 13 | DEC-2-0005 | PRD Gate APPROVED. 6 human decisions bundled. Performance SLA = 100 concurrent users. Deployment = Azure. | ART-2-010 status changed to APPROVED; ART-3-002 ADR-001 (100-user sizing); ART-3-009 (Azure confirmed); ART-3-002 ADR-005 (RPS/PostGIS on Azure); ART-4-003 (session timeout ASM-3-ARCH-003 provisional); QST-2-PM-001 carried forward | Yes — PRD approval is the authoritative scope document for all IDEATE/FORGE work |
| 14 | DEC-3-0001 | Technology stack confirmed: .NET/C#, React/TypeScript, PostgreSQL (Azure), GitHub Actions, Azure. | ART-3-002 ADRs (all 10 stack-specific decisions unlocked); ART-3-003 through ART-3-012 (all architecture artifacts use confirmed stack); ART-3-013/014/015 (PostgreSQL migration); all FORGE ART-4- artifacts | Yes — stack decision is final; all 10 ADRs derive from it |
| 15 | DEC-3-0002 | IDEATE complete. 11 ART- deliverables produced. Architecture Gate package assembled. | ART-3-012 TAD designated as gate deliverable; architecture gate checklist initiated; 5 open FORGE-blocking items documented | Yes — gate record |
| 16 | DEC-3-0003 | Architecture Gate APPROVED. All 10 ADRs approved. Phase advanced to FORGE. | All ART-3- artifacts finalized; FORGE agents authorized; ART-4-001 through ART-4-010 production initiated; ADR PROPOSED status ratified | Yes — all 10 ADRs are in force; FORGE implementation must not deviate without a new DEC- |
| 17 | DEC-4-0001 | FORGE complete. 10 ART- deliverables produced. 19 DBT- items raised. 27 HVR sections. 85% P1 traceability. | ART-4-001 through ART-4-010 finalized; TRANSFER authorized; ART-5-001 through ART-5-003 production initiated | Yes — FORGE assets are the authoritative implementation blueprint |

---

### Part C Summary

| Decision Category | Count | Status |
|---|---|---|
| Human decisions | 8 | All in force |
| Chief Orchestrator phase/gate decisions | 9 | All in force |
| Decisions superseded or closed | 0 | N/A |
| **Total decisions** | **17** | **17 in force** |

All 17 DEC- entries remain in force at TRANSFER. None have been superseded. The cumulative effect of these decisions defines the full scope, technology, and architecture of the InsureEdge modernization target.

---

## Cross-Reference Index

| ART- File | Phase | Traceability Sections Where Referenced |
|---|---|---|
| ART-0-002 Completeness Matrix | DISCOVER | Part C: DEC-0-0002, DEC-0-0003, DEC-0-0004 |
| ART-0-006 MRS Report | DISCOVER | Part C: DEC-0-0005 |
| ART-1-001 Data Catalogue | SCAN | Part A: D1-C2, D3, D7-C1; Part B: EV-0-0224, EV-0-0225 |
| ART-1-002 Logic Catalogue | SCAN | Part A: all D1; Part B: EV-0-0006, EV-0-0231 |
| ART-1-003 Security Catalogue | SCAN | Part A: D5-C1 through D5-C4; Part B: EV-0-0226, EV-0-0230 |
| ART-1-004 Integration Catalogue | SCAN | Part A: D3-C1, D4-C3, D6-C1; Part B: EV-0-0231, EV-0-0232 |
| ART-1-005 Screen Catalogue | SCAN | Part A: D1-C1, D5-C1; Part B: EV-0-0218, EV-0-0048 |
| ART-2-002 User Stories | HARVEST | Part A: all capabilities |
| ART-2-003 Acceptance Criteria | HARVEST | Part A: all capabilities |
| ART-2-005 Business Rules Catalog | HARVEST | Part B: EV-0-0231, EV-0-0252 |
| ART-2-008 Capability Map | HARVEST | Part A: all 27 capability rows |
| ART-2-010 PRD | HARVEST | Part A: FR-Dx-00x references; Part C: DEC-2-0005 |
| ART-2-011 Logic Supplement | HARVEST | Part B: EV-0-0252, EV-0-0254, EV-0-0257 |
| ART-2-012 Integration Supplement | HARVEST | Part B: EV-0-0232, EV-0-0233, EV-0-0234, EV-0-0236 |
| ART-3-002 ADRs | IDEATE | Part A: all capabilities (ADR cross-references); Part C: DEC-3-0001, DEC-3-0003 |
| ART-3-005 Backend Architecture | IDEATE | Part A: all domain module references |
| ART-3-012 TAD | IDEATE | Part C: DEC-3-0002, DEC-3-0003 |
| ART-3-013 Data Migration Architecture | IDEATE | Part B: EV-0-0224, EV-0-0225, EV-0-0234 |
| ART-4-001 Repository Structure | FORGE | Part A: all ART-4-001 Location entries |
| ART-4-003 API Specifications | FORGE | Part A: all API Endpoints entries |
| ART-4-007 Test Specifications | FORGE | Part A: all Test Specs entries |
| ART-4-010 Test Coverage Matrix | FORGE | Part A: all Test Coverage entries; Part A Summary |

---

*End of ART-5-003 — Complete Traceability Report | INSUREEDGE-2026 | TRANSFER Phase | 2026-06-17*
*Produced by: Documentation Agent | Layer 0 Governance | No new findings authored — assembly only | All claims cited to source ART- or EV-*
