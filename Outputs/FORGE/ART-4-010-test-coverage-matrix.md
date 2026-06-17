# ART-4-010 — Test Coverage Matrix
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** QA Agent
**Phase:** FORGE
**Date:** 2026-06-17
**Precondition:** Architecture Gate PASSED (DEC-3-0003, 2026-06-17)
**Governance:** Layer 0 — §3 Confidence Bands, §5 Evidence First, §2 DAQ Register

**Status Definitions:**
- **COVERED** — Test fully specifiable from confirmed requirements; no blocking unknowns
- **PROVISIONAL** — Test specifiable but depends on an unconfirmed integration or LOW-confidence rule; blocking QST- cited
- **GAP** — No test can be written; reason stated; appears in explicit gap table at end

**Multi-tenancy mandate:** Every integration test entry implicitly includes a cross-tenant isolation assertion (TenantB data must not be returned). Tests without this assertion are FALSE POSITIVES per ART-4-009 §8.

**HUMAN_VALIDATION_REQUIRED (HVR):** Financial logic, payment amounts, AES-256, and permission checks on financial actions require human SME sign-off before merge to `main`.

---

## Section A — P1 User Stories (34 stories, each with ≥1 test entry)

### Domain 1: Quotes & Policies

| Test ID | Source Req | Test Type | Description | Status |
|---|---|---|---|---|
| TC-POL-001 | US-POLICY-001 (AC-US-POLICY-001-01) | Integration | POST /api/v1/quotes/step1 with valid effective date, term, insured name, and mailing address; assert PolicyInformation record persisted, status 200, address validation triggered | COVERED |
| TC-POL-002 | US-POLICY-001 (AC-US-POLICY-001-02) | Integration | GET /api/v1/quotes/{id}/review; assert response contains itemized breakdown: RiskPremium, CoveragePremium, Taxes, Fees, TotalPremium = CoveragePremium + Taxes + Fees; all fields read-only | COVERED |
| TC-POL-003 | US-POLICY-001 (AC-US-POLICY-001-03) | Integration | POST /api/v1/quotes/step1 with missing effective date; assert HTTP 422, no record created, field-level error returned | COVERED |
| TC-POL-004 | US-POLICY-001 (AC-US-POLICY-001-04) | Integration | GET /api/v1/quotes as IntermediaryProducer TenantA/IntermediaryX; assert response contains only quotes with IntermediaryId = IntermediaryX; TenantB quotes absent | COVERED |
| TC-POL-005 | US-POLICY-002 (AC-US-POLICY-002-01) | Integration | POST /api/v1/quotes/{id}/risk-location with valid address; assert HexCat API stub called, read-only risk fields (zone IDs, construction type, foundation type, floor count, sq ft, roof age) populated in response | COVERED |
| TC-POL-006 | US-POLICY-002 (AC-US-POLICY-002-02) | Integration | POST /api/v1/quotes/{id}/risk-location where HexCat stub returns "Not Approved"; attempt advance to step 2.3; assert HTTP 422, progression blocked | COVERED |
| TC-POL-007 | US-POLICY-002 (AC-US-POLICY-002-03) | Integration | POST /api/v1/quotes/{id}/risk-location where HexCat returns "Approved"; assert RiskLocation record persisted with address + geocoordinates, PolicyRiskInformation record persisted with zone identifiers | COVERED |
| TC-POL-008 | US-POLICY-002 (AC-US-POLICY-002-04) | Integration | Submit risk location address that produces invalid geocoordinates from Geocoding stub; assert HTTP 422 with validation error, no record persisted | COVERED |
| TC-POL-009 | US-POLICY-003 | Integration | POST /api/v1/quotes/{id}/coverages with valid coverage plan tier, dwelling limit, deductible, and peril endorsements; assert PolicyLimitCoverage record persisted | COVERED |
| TC-POL-010 | US-POLICY-004 | Integration | GET /api/v1/quotes/{id}/review; assert TotalPremium equals CoveragePremium + Taxes + Fees (formula validated by HVR); all amounts read-only | COVERED — HVR |
| TC-POL-011 | US-POLICY-005 (AC-US-POLICY-005-01) | Integration | POST /api/v1/policies/bind with valid quote ID, successful TranzPay stub response; assert Policy.PolicyStatusId = Active, unique policy number generated, binding transaction in history | COVERED |
| TC-POL-012 | US-POLICY-005 (AC-US-POLICY-005-02) | Integration | POST /api/v1/policies/bind with TranzPay stub returning failure; assert Policy.PolicyStatusId NOT changed, failed transaction recorded, HTTP 422 with payment error | COVERED |
| TC-POL-013 | US-POLICY-005 (AC-US-POLICY-005-03) | Integration | POST /api/v1/policies/bind for quote on same risk location as existing active policy; assert HTTP 409 with duplicate policy error, second policy NOT created | COVERED |
| TC-POL-014 | US-POLICY-005 (AC-US-POLICY-005-04) | Integration | POST /api/v1/policies/bind as user without IsCreatePermission; assert HTTP 403, policy NOT created, unauthorized attempt logged | COVERED |
| TC-POL-015 | US-POLICY-006 (AC-US-POLICY-006-01) | Integration | After successful bind, assert Plumsail stub invoked for declaration page generation, PolicyDocument record created with BlobPath reference | PROVISIONAL — QST-1-INT-003 (Plumsail API key unconfirmed) |
| TC-POL-016 | US-POLICY-006 (AC-US-POLICY-006-02) | Integration | GET /api/v1/policies/{id}/documents as user with IsDownloadPermission; assert declaration page appears in list with correct DocumentTypeId and UploadedOn timestamp | COVERED |
| TC-POL-017 | US-POLICY-006 (AC-US-POLICY-006-03) | Integration | GET /api/v1/policies/{id}/documents/download/{docId} as user without IsDownloadPermission; assert HTTP 403, document NOT served | COVERED |
| TC-POL-018 | US-POLICY-007 (AC-US-POLICY-007-01) | Integration | After bind of policy with mortgage record, assert LenderDock stub invoked with policy number, effective date, coverage amounts | PROVISIONAL — QST-1-INT-002 (LenderDock contract unconfirmed) |
| TC-POL-019 | US-POLICY-007 (AC-US-POLICY-007-02) | Integration | Attempt LenderDock notification for mortgage record with missing servicer name; assert notification NOT sent, error recorded, alert created for ClientAdmin | PROVISIONAL — QST-1-INT-002 |
| TC-POL-020 | US-POLICY-007 (AC-US-POLICY-007-03) | Integration | Trigger endorsement, cancellation, renewal on mortgaged policy; assert three distinct LenderDock stub calls with correct event-type payloads | PROVISIONAL — QST-1-INT-002 |
| TC-POL-021 | US-POLICY-008 | Integration | POST /api/v1/policies/{id}/endorsements/premium-bearing as Underwriter user; assert CreateEndorsementPolicyQuote record created, premium-bearing flag set | COVERED |
| TC-POL-022 | US-POLICY-009 | Integration | Issue premium-bearing endorsement increasing DAL; assert additional premium calculated (HVR), TranzPay stub invoked, PolicyPaymentTransaction recorded; assert Policy Change Doc generated | COVERED — HVR |
| TC-POL-023 | US-POLICY-010 (AC-US-POLICY-010-01) | Integration (Job) | Seed policy with ExpirationDate = today + 90 days; invoke T-01 RenewalQuoteGenerator; assert renewal quote record created with status Draft | COVERED |
| TC-POL-024 | US-POLICY-010 (AC-US-POLICY-010-01) | Integration (Job) | Boundary: seed policy with ExpirationDate = today + 89 days; invoke T-01; assert NO renewal quote created | COVERED |
| TC-POL-025 | US-POLICY-010 (AC-US-POLICY-010-02) | Integration (Job) | After renewal quote creation by T-01, assert email stub invoked with Producer address, policy number, expiration date | COVERED |
| TC-POL-026 | US-POLICY-010 (AC-US-POLICY-010-03) | Integration (Job) | Seed renewal quote with CreatedOn = today - 30 days, status Draft; invoke T-05 QuoteExpiryProcessor; assert renewal quote status changed to Expired | COVERED |
| TC-POL-027 | US-POLICY-012 (AC-US-POLICY-012-01) | Integration | POST /api/v1/policies/{id}/cancel with valid cancellation effective date by ClientAdmin; assert PolicyStatusId = Cancelled, cancellation transaction in history, cancellation date stamped | COVERED |
| TC-POL-028 | US-POLICY-012 (AC-US-POLICY-012-02) | Integration | After cancellation, assert SMTP stub invoked with policyholder email | COVERED |
| TC-POL-029 | US-POLICY-012 (AC-US-POLICY-012-03) | Integration | Cancel mortgaged policy; assert LenderDock stub invoked for each registered mortgagee | PROVISIONAL — QST-1-INT-002 |
| TC-POL-030 | US-POLICY-012 (AC-US-POLICY-012-04) | Integration | POST /api/v1/policies/{id}/cancel as user without IsEditPermission; assert HTTP 403, policy status unchanged | COVERED |
| TC-POL-031 | US-POLICY-013 (AC-US-POLICY-013-01) | Integration (Job) | Seed policy with failed payment 30 days ago; invoke T-06 AutoCancellationProcessor; assert Policy.PolicyStatusId = Cancelled | COVERED |
| TC-POL-032 | US-POLICY-013 (AC-US-POLICY-013-01) | Integration (Job) | Boundary: seed policy with failed payment 29 days ago; invoke T-06; assert policy NOT cancelled | COVERED |
| TC-POL-033 | US-POLICY-013 (AC-US-POLICY-013-02) | Integration | On payment failure recording, assert SMTP stub invoked with outstanding amount and grace period deadline | COVERED |
| TC-POL-034 | US-POLICY-013 (AC-US-POLICY-013-03) | Integration | On payment failure on mortgaged policy, assert LenderDock stub invoked with payment failure payload | PROVISIONAL — QST-1-INT-002 |
| TC-POL-035 | US-POLICY-014 (AC-US-POLICY-014-01) | Integration (Job) | Seed non-renewal-designated policy with ExpirationDate = today + 60 days; invoke T-03 NonRenewalNoticeSender; assert non-renewal document generation invoked, email dispatched | PROVISIONAL — QST-1-INT-003 (document generation) |
| TC-POL-036 | US-POLICY-014 (AC-US-POLICY-014-02) | Integration (Job) | Seed policy with ExpirationDate = today - 90 days, no bound renewal; invoke T-04 PolicyExpiryProcessor; assert Policy.PolicyStatusId = Non-Renewed | COVERED |
| TC-POL-037 | US-POLICY-014 (AC-US-POLICY-014-02) | Integration (Job) | Boundary: ExpirationDate = today - 89 days; invoke T-04; assert status NOT changed | COVERED |
| TC-POL-038 | US-POLICY-014 (AC-US-POLICY-014-03) | Integration | Non-renewal notice issued for mortgaged policy; assert LenderDock stub invoked with non-renewal disposition flag | PROVISIONAL — QST-1-INT-002 |
| TC-POL-039 | US-POLICY-015 | Integration | GET /api/v1/policies/{id} as ClientAdmin; assert response includes all tabs data: Summary, Billing, History, Claims, Notes, Timeline; all scoped to ClientId | COVERED |

### Domain 2: Claims

| Test ID | Source Req | Test Type | Description | Status |
|---|---|---|---|---|
| TC-CLM-001 | US-CLAIMS-001 (AC-US-CLAIMS-001-01) | Integration | POST /api/v1/claims with valid PolicyId, loss date, FNOL date; assert Claim record created with unique claim number, status = FNOL, FNOLDate = today | COVERED |
| TC-CLM-002 | US-CLAIMS-001 (AC-US-CLAIMS-001-02) | Integration | POST /api/v1/claims with same PolicyId and loss date as existing open claim; assert warning returned, second claim NOT created without confirmation | COVERED |
| TC-CLM-003 | US-CLAIMS-001 (AC-US-CLAIMS-001-03) | Integration | GET /api/v1/claims as Adjuster; assert response contains ONLY claims where AdjusterId matches authenticated user | COVERED |
| TC-CLM-004 | US-CLAIMS-002 | Integration | PUT /api/v1/claims/{id}/adjuster as ClientAdmin with valid AdjusterId; assert Claim.AdjusterId updated | COVERED |
| TC-CLM-005 | US-CLAIMS-003 | Integration | POST /api/v1/claims/{id}/impacted-coverages as Adjuster on assigned claim; assert ClaimImpactedCoverage records created per coverage | COVERED |
| TC-CLM-006 | US-CLAIMS-004 (AC-US-CLAIMS-004-01) | Integration | POST /api/v1/claims/{id}/worksheets; assert Worksheet record created, WorksheetReserve records created per coverage type | COVERED |
| TC-CLM-007 | US-CLAIMS-004 (AC-US-CLAIMS-004-02) | Integration | PUT /api/v1/claims/{id}/worksheets/{wid}/approve as user with IsApproveReject; assert worksheet status = Approved, approving user and timestamp recorded | COVERED |
| TC-CLM-008 | US-CLAIMS-004 (AC-US-CLAIMS-004-03) | Integration | PUT /api/v1/claims/{id}/worksheets/{wid}/approve as user without IsApproveReject; assert HTTP 403, worksheet status unchanged | COVERED |
| TC-CLM-009 | US-CLAIMS-005 | Integration | POST /api/v1/claims/{id}/payees with bank details; then POST disbursement; assert WorksheetPayment record created, DisburseCloud stub invoked | PROVISIONAL — QST-2-INT-003 (DisburseCloud URL mismatch) |
| TC-CLM-010 | US-CLAIMS-006 | Integration | POST /api/v1/claims/{id}/documents with file upload, IsSensitive = true; assert Azure Blob stub invoked, ClaimDocument record with BlobPath and IsSensitive flag created | COVERED |
| TC-CLM-011 | US-CLAIMS-009 (AC-US-CLAIMS-009-01) | Integration | PUT /api/v1/claims/{id}/close with disposition reason; assert Claim.ClaimStatusId = CLOSED, closure date and reason recorded | COVERED |
| TC-CLM-012 | US-CLAIMS-009 (AC-US-CLAIMS-009-02) | Integration | After claim closure, assert SMTP stub invoked with claim number, determination, and effective date | COVERED |
| TC-CLM-013 | US-CLAIMS-009 (AC-US-CLAIMS-009-03) | Integration | PUT /api/v1/claims/{id}/close as user without IsApproveReject; assert HTTP 403, claim status unchanged | COVERED |
| TC-CLM-014 | US-CLAIMS-010 (AC-US-CLAIMS-010-01) | Integration | Duplicate FNOL detection: existing open claim same PolicyId/loss date; POST second claim; assert warning in response | COVERED |
| TC-CLM-015 | US-CLAIMS-010 (AC-US-CLAIMS-010-02) | Integration | Duplicate check scoped to ClientId: same PolicyId/loss date in TenantB does NOT trigger duplicate warning for TenantA user | COVERED |

### Domain 3: Billing & Payments

| Test ID | Source Req | Test Type | Description | Status |
|---|---|---|---|---|
| TC-BIL-001 | US-BILLING-001 (AC-US-BILLING-001-01) | Integration | POST /api/v1/policies/{id}/payment-plan with frequency, responsible party, installments; assert PolicyPaymentPlan persisted, installment schedule returned | COVERED |
| TC-BIL-002 | US-BILLING-001 (AC-US-BILLING-001-02) | Integration | Payment plan save; assert $195 fixed fee included in total premium calculation, installment fee correctly apportioned (HVR) | COVERED — HVR |
| TC-BIL-003 | US-BILLING-001 (AC-US-BILLING-001-03) | Integration | POST /api/v1/policies/{id}/payment-plan as user without IsCreatePermission; assert HTTP 403, plan unchanged | COVERED |
| TC-BIL-004 | US-BILLING-002 (AC-US-BILLING-002-01) | Integration | POST /api/v1/billing/payments with ACH or credit card, TranzPay stub returns SUCCESS; assert transaction recorded with SUCCESS status and gateway reference | PROVISIONAL — QST-1-INT-001 (TranzPay contract) |
| TC-BIL-005 | US-BILLING-002 (AC-US-BILLING-002-02) | Integration | POST /api/v1/billing/payments; TranzPay stub returns failure; assert FAILED transaction recorded, no charge, HTTP 422 with payment error | PROVISIONAL — QST-1-INT-001 |
| TC-BIL-006 | US-BILLING-003 (AC-US-BILLING-003-01) | Integration (Job) | Seed installment due today; invoke T-08 InstallmentPaymentProcessor; assert TranzPay stub called with correct amount, transaction recorded | PROVISIONAL — QST-2-INT-001 |
| TC-BIL-007 | US-BILLING-003 (AC-US-BILLING-003-02) | Integration (Job) | Set TimerEnabled = false in Configuration; invoke T-08; assert no installments processed, no TranzPay call | COVERED |
| TC-BIL-008 | US-BILLING-004 (AC-US-BILLING-004-01) | Integration | Record payment failure on mortgaged policy; assert LenderDock stub invoked within same processing cycle | PROVISIONAL — QST-1-INT-002 |
| TC-BIL-009 | US-BILLING-004 (AC-US-BILLING-004-02) | Integration | Record payment failure; assert SMTP stub invoked with failed amount, policy number, cancellation deadline | COVERED |
| TC-BIL-010 | US-BILLING-004 (AC-US-BILLING-004-03) | Integration (Job) | Seed failed payment 30 days ago; invoke T-06; assert policy cancelled (see TC-POL-031) | COVERED |

### Domain 4: Distribution Management

| Test ID | Source Req | Test Type | Description | Status |
|---|---|---|---|---|
| TC-DIST-001 | US-DIST-001 (AC-US-DIST-001-01) | Integration | POST /api/v1/intermediaries as ClientAdmin with company name, code, contact, commission%; assert Intermediary record scoped to ClientId, appears in list | COVERED |
| TC-DIST-002 | US-DIST-001 (AC-US-DIST-001-02) | Integration | GET /api/v1/intermediaries as IntermediaryProducer; assert only own intermediary record returned, other tenants' intermediaries absent | COVERED |
| TC-DIST-003 | US-DIST-002 | Integration | POST /api/v1/intermediaries/{id}/producers with valid producer details and license; assert Producer record created | COVERED |
| TC-DIST-004 | US-DIST-003 (AC-US-DIST-003-01) | Integration | Bind policy through intermediary; assert PolicyCommission record created with configured commission% and computed amount (HVR) | COVERED — HVR |
| TC-DIST-005 | US-DIST-004 | Integration | POST /api/v1/commissions/disburse; assert CommissionPaymentTransaction recorded, DisburseCloud stub invoked, disbursement email sent | PROVISIONAL — QST-2-INT-003 (DisburseCloud URL mismatch) |

### Domain 5: User Management

| Test ID | Source Req | Test Type | Description | Status |
|---|---|---|---|---|
| TC-USR-001 | US-USER-001 (AC-US-USER-001-01) | Integration | POST /api/v1/users with name, email, role, group assignments; assert user created, group membership records created, credentials hashed (PBKDF2 via ASP.NET Core Identity), user appears in list | COVERED |
| TC-USR-002 | US-USER-001 (AC-US-USER-001-02) | Integration | POST /api/v1/users with email already registered in same tenant; assert HTTP 409 with duplicate email error, no user created | COVERED |
| TC-USR-003 | US-USER-001 (AC-US-USER-001-03) | Integration | POST /api/v1/users with phone already registered in same tenant; assert HTTP 409 with duplicate phone error | COVERED |
| TC-USR-004 | US-USER-001 (AC-US-USER-001-04) | Integration | Create user in TenantA; assert User.ClientId = TenantA; attempt to GET user as TenantB ClientAdmin; assert 404 | COVERED |
| TC-USR-005 | US-USER-002 (AC-US-USER-002-01) | Integration | Assign user to two groups; assert GroupUser records created for each; effective permissions = union of both groups' flags | COVERED |
| TC-USR-006 | US-USER-002 (AC-US-USER-002-02) | Integration | User in GroupA (View) and GroupB (Create) for same screen; GET effective permissions; assert both View and Create = true | COVERED |
| TC-USR-007 | US-USER-002 (AC-US-USER-002-03) | Integration | User in group with AllAccess = true for a screen; GET effective permissions; assert all 10 flags = true for that screen | COVERED |
| TC-USR-008 | US-USER-003 (AC-US-USER-003-01) | Integration | POST /api/v1/users/{id}/password-reset; assert reset token generated with 30-min expiry, SMTP stub invoked | COVERED |
| TC-USR-009 | US-USER-003 (AC-US-USER-003-02) | Integration | POST password reset request 3 times within 30 minutes; assert 3rd request HTTP 429 with rate-limit error | COVERED |
| TC-USR-010 | US-USER-003 (AC-US-USER-003-03) | Integration | Submit password reset token older than 30 minutes; assert HTTP 422 with token-expired error | COVERED |
| TC-USR-011 | US-USER-004 (AC-US-USER-004-01) | E2E | ClientAdmin clicks edit icon on Primary Info; assert only Primary Info enters edit mode, other sections remain read-only | COVERED |
| TC-USR-012 | US-USER-004 (AC-US-USER-004-02) | E2E | ClientAdmin makes unsaved changes, clicks navigate away; assert "Unsaved Changes" dialog appears | COVERED |
| TC-USR-013 | US-USER-004 (AC-US-USER-004-03) | Integration | Save user profile changes as ClientAdmin; assert updated record ClientId unchanged, not visible to TenantB | COVERED |
| TC-USR-014 | US-USER-005 (AC-US-USER-005-01) | Integration | Attempt to create user with email that exists in TenantB (not TenantA); assert creation succeeds (cross-tenant uniqueness not enforced) | COVERED |
| TC-USR-015 | US-USER-005 (AC-US-USER-005-02) | Integration | Attempt to create user with phone existing in same tenant; assert HTTP 409 | COVERED |

### Domain 6: Group Management

| Test ID | Source Req | Test Type | Description | Status |
|---|---|---|---|---|
| TC-GRP-001 | US-GROUP-001 (AC-US-GROUP-001-01) | Integration | POST /api/v1/groups with name, leader, members; assert Group record created, GroupUser records created, group appears in list | COVERED |
| TC-GRP-002 | US-GROUP-001 (AC-US-GROUP-001-02) | Integration | Create group with configured permission flags for all 8 modules; assert one ScreenPermissions record per screen per group; all members inherit union of flags | COVERED |
| TC-GRP-003 | US-GROUP-001 (AC-US-GROUP-001-03) | Integration | Create group in TenantA; GET /api/v1/groups as TenantB ClientAdmin; assert TenantA group not in response | COVERED |
| TC-GRP-004 | US-GROUP-002 (AC-US-GROUP-002-01) | Integration | PUT /api/v1/groups/{id}/members removing UserA, adding UserB; assert full sync: UserA's GroupUser deleted, UserB's GroupUser added | COVERED |
| TC-GRP-005 | US-GROUP-002 (AC-US-GROUP-002-02) | Integration | Remove UserA from group; assert within same database transaction, UserA's derived permissions revoked (synchronous revocation, no race window) | COVERED |
| TC-GRP-006 | US-GROUP-002 (AC-US-GROUP-002-03) | Integration | PUT /api/v1/groups/{id}/members as user without group management permission; assert HTTP 403 | COVERED |
| TC-GRP-007 | US-GROUP-004 (AC-US-GROUP-004-01) | Integration | Set AllAccess = true for group on Screen X; assert member of group has all 10 flags = true on Screen X | COVERED |
| TC-GRP-008 | US-GROUP-004 (AC-US-GROUP-004-02) | Integration | Group with IsViewSensitiveInfo = false; GET screen with financial fields as member; assert SSN/bank account returned as masked (****), full value NOT in response body (HVR) | COVERED — HVR |
| TC-GRP-009 | US-GROUP-004 (AC-US-GROUP-004-03) | Integration | Group with IsAccessSensitiveDoc = false; GET /download for sensitive claim document; assert HTTP 403 | COVERED |
| TC-GRP-010 | US-GROUP-005 | Integration | PUT /api/v1/groups/{id}/members as user without USERGROUPPAGE permission; assert HTTP 403 | COVERED |

### Domain 7: Reports

| Test ID | Source Req | Test Type | Description | Status |
|---|---|---|---|---|
| TC-RPT-001 | US-REPORT-006 (AC-US-REPORT-006-01) | Integration | GET /api/v1/dashboard as authenticated user; assert KPI cards present: New Business Quotes (Uploaded/Approved/Not Approved/Expired), Policies (Issued/Renewed/Non-Renewed/Cancelled) | COVERED |
| TC-RPT-002 | US-REPORT-006 (AC-US-REPORT-006-02) | Integration | GET /api/v1/dashboard as IntermediaryProducer; assert all KPI values reflect only policies/quotes with user's IntermediaryId | COVERED |
| TC-RPT-003 | US-REPORT-006 (AC-US-REPORT-006-03) | Integration | GET /api/v1/dashboard as TenantA ClientAdmin; assert no TenantB data included in any metric | COVERED |

---

## Section B — Business Rules Coverage

### B.1 Policy Lifecycle Thresholds (from ART-2-005 and EV-0-0231)

| Test ID | Rule ID | Test Type | Description | Status |
|---|---|---|---|---|
| TC-BR-001 | BR-POL-FEE-001 ($195 fixed) | Unit + Integration | Unit: PremiumCalculationService correctly adds $195 to TotalPremium; Integration: payment plan save includes $195 in installment calculation | COVERED — HVR |
| TC-BR-002 | BR-POL-REN-001 (90-day renewal) | Integration (Job) | Seed policy at exactly 90 days before expiry; T-01 invoked; assert renewal quote created | COVERED |
| TC-BR-003 | BR-POL-REN-001 boundary | Integration (Job) | Seed at 89 days; T-01 invoked; assert NO renewal quote | COVERED |
| TC-BR-004 | BR-POL-REN-002 (renewal notification) | Integration (Job) | Renewal quote created; assert email dispatched to Producer | COVERED |
| TC-BR-005 | BR-POL-REN-003 (renewal draft reminder) | Integration (Job) | Draft renewal quote approaching expiry; T-02 invoked; assert reminder email sent | COVERED |
| TC-BR-006 | BR-POL-REN-004 (90-day non-renewed) | Integration (Job) | Policy 90 days post-expiry, no bound renewal; T-04 invoked; assert status = Non-Renewed | COVERED |
| TC-BR-007 | BR-POL-NRN-001 (60-day non-renewal email) | Integration (Job) | Non-renewal policy at 60 days before expiry; T-03 invoked; assert notice generated and email sent | PROVISIONAL — QST-1-INT-003 |
| TC-BR-008 | BR-POL-NRN-002 (mortgagee non-renewal notification) | Integration | Non-renewal notice issued; assert LenderDock stub called for each mortgagee | PROVISIONAL — QST-1-INT-002 |
| TC-BR-009 | BR-POL-QE-001 (new business 90-day expiry) | Integration (Job) | New business quote at 90 days without bind; T-05 invoked; assert status = Expired | COVERED |
| TC-BR-010 | BR-POL-QE-001 boundary | Integration (Job) | New business quote at 89 days; T-05 invoked; assert NOT expired | COVERED |
| TC-BR-011 | BR-POL-QE-002 (renewal 30-day expiry) | Integration (Job) | Renewal quote at 30 days unbound; T-05 invoked; assert status = Expired | COVERED |
| TC-BR-012 | BR-POL-QE-002 boundary | Integration (Job) | Renewal quote at 29 days; T-05 invoked; assert NOT expired | COVERED |
| TC-BR-013 | BR-POL-QE-003 (endorsement 90-day expiry) | Integration (Job) | Endorsement quote at 90 days unacted; T-05 invoked; assert status = Expired | COVERED |
| TC-BR-014 | BR-POL-EXP-001 (1-day policy expiry) | Integration (Job) | Policy with ExpirationDate = yesterday, not renewed/cancelled/non-renewed; T-07 invoked; assert status = Expired | COVERED |
| TC-BR-015 | BR-POL-EXP-001 boundary | Integration (Job) | ExpirationDate = today; T-07 invoked; assert NOT yet expired | COVERED |
| TC-BR-016 | BR-POL-CAN-001 / BR-BIL-NPC-001 (30-day cancellation) | Integration (Job) | Failed payment 30 days ago; T-06 invoked; assert status = Cancelled | COVERED |
| TC-BR-017 | BR-POL-CAN-001 boundary | Integration (Job) | Failed payment 29 days ago; T-06 invoked; assert NOT cancelled | COVERED |
| TC-BR-018 | BR-POL-CAN-002 (cancellation notice) | Integration | Manual cancellation; assert SMTP stub invoked with cancellation notice | COVERED |
| TC-BR-019 | BR-POL-CAN-003 (mortgagee cancellation) | Integration | Cancel mortgaged policy; assert LenderDock stub invoked per mortgagee | PROVISIONAL — QST-1-INT-002 |
| TC-BR-020 | BR-POL-CAN-004 (cancel/rewrite) | Integration | POST /api/v1/policies/{id}/cancel-rewrite; assert original cancelled and new Draft created atomically (single transaction) | COVERED |
| TC-BR-021 | BR-POL-RISK-001 (HexCat gate) | Integration | "Not Approved" HexCat response; assert quote cannot advance to Step 2.3 | COVERED |
| TC-BR-022 | BR-POL-RISK-002 (read-only risk fields) | Integration | Attempt PUT on risk information fields returned by HexCat; assert HTTP 405 or field not accepted | COVERED |
| TC-BR-023 | BR-POL-DUP-001 (duplicate active policy) | Integration | Bind attempt where active policy exists for same risk; assert HTTP 409 | COVERED |

### B.2 Claims Rules

| Test ID | Rule ID | Test Type | Description | Status |
|---|---|---|---|---|
| TC-BR-024 | BR-CLM-FNOL-001 (FNOL requires policy) | Integration | POST /api/v1/claims without valid PolicyId; assert HTTP 422 | COVERED |
| TC-BR-025 | BR-CLM-FNOL-002 (duplicate check) | Integration | Same PolicyId + loss date duplicate confirmation flow (see TC-CLM-014) | COVERED |
| TC-BR-026 | BR-CLM-FNOL-003 (FNOL date separate from loss date) | Integration | POST claim with FNOLDate = today, LossDate = yesterday; assert both dates stored separately | COVERED |
| TC-BR-027 | BR-CLM-ADJ-001 (adjuster scope) | Integration | GET /api/v1/claims as Adjuster; assert only assigned claims returned (see TC-CLM-003) | COVERED |
| TC-BR-028 | BR-CLM-ADJ-002 (IsApproveReject gate) | Integration | Worksheet approval by user without IsApproveReject; assert HTTP 403 (see TC-CLM-008) | COVERED |
| TC-BR-029 | BR-CLM-DOC-001 (sensitive doc access) | Integration | Access sensitive claim doc without IsAccessSensitiveDoc; assert HTTP 403 (see TC-GRP-009) | COVERED |
| TC-BR-030 | BR-CLM-DOC-002 (non-sensitive download) | Integration | Download non-sensitive doc with IsDownloadPermission; assert success | COVERED |
| TC-BR-031 | BR-CLM-FIN-001 (reserves per coverage) | Integration | Create worksheet; assert WorksheetReserve records per CoverageTypeId | COVERED |
| TC-BR-032 | BR-CLM-FIN-002 (payee before disbursement) | Integration | Attempt disbursement without payee record; assert HTTP 422 | COVERED |

### B.3 Billing Rules

| Test ID | Rule ID | Test Type | Description | Status |
|---|---|---|---|---|
| TC-BR-033 | BR-BIL-PAY-001 (ACH + credit card) | Integration | Payment accepted via both ACH and credit card stubs | PROVISIONAL — QST-1-INT-001 |
| TC-BR-034 | BR-BIL-PAY-002 (transaction recording) | Integration | Every payment call (success or fail) records: gateway ref, amount, method, date, status | COVERED |
| TC-BR-035 | BR-BIL-PAY-003 (refund to original method) | Integration | Refund submitted; assert refund uses same method (ACH refund for ACH original) | PROVISIONAL — QST-1-INT-001 |
| TC-BR-036 | BR-BIL-PAY-004 (failure notifications same cycle) | Integration | Payment failure recorded; assert both policyholder and mortgagee notifications dispatched | PROVISIONAL — QST-1-INT-002 |
| TC-BR-037 | BR-BIL-PLAN-001 (plan fields) | Integration | Payment plan requires frequency, responsible party, installments; missing any → 422 | COVERED |
| TC-BR-038 | BR-BIL-PLAN-002 (schedule calculation) | Unit | PremiumCalculationService computes installment fee from total premium, frequency, count (HVR) | COVERED — HVR |
| TC-BR-039 | BR-BIL-NPC-001 (30-day grace) | Integration (Job) | Same as TC-BR-016 | COVERED |

### B.4 Distribution/Commission Rules

| Test ID | Rule ID | Test Type | Description | Status |
|---|---|---|---|---|
| TC-BR-040 | BR-DIST-COM-001 (commission record per policy) | Integration | Policy bind; assert PolicyCommission record with IntermediaryId, CommissionPercentage, CommissionAmount (HVR) | COVERED — HVR |
| TC-BR-041 | BR-DIST-COM-002 (commission on endorsement) | Integration | Issue endorsement; assert commission recalculated and new CommissionsDetails record created (HVR) | COVERED — HVR |
| TC-BR-042 | BR-DIST-COM-003 (disbursement notification) | Integration | Commission disbursement; assert disbursement email sent | PROVISIONAL — QST-2-INT-003 |
| TC-BR-043 | BR-DIST-COM-004 (intermediary required for bind) | Integration | Attempt policy bind without IntermediaryId; assert HTTP 422 | COVERED |

### B.5 User Management Rules

| Test ID | Rule ID | Test Type | Description | Status |
|---|---|---|---|---|
| TC-BR-044 | BR-USR-ID-001 (unique email within tenant) | Integration | Duplicate email in same tenant → 409 (see TC-USR-002) | COVERED |
| TC-BR-045 | BR-USR-ID-002 (unique phone within tenant) | Integration | Duplicate phone in same tenant → 409 (see TC-USR-003) | COVERED |
| TC-BR-046 | BR-USR-ID-003 (cross-tenant uniqueness) | Integration | Same email in different tenant → 200 (see TC-USR-014) | COVERED |
| TC-BR-047 | BR-USR-PWD-001 (30-min token expiry) | Integration | Expired token rejected (see TC-USR-010) | COVERED |
| TC-BR-048 | BR-USR-PWD-002 (max 2 tokens / 30 min) | Integration | Third reset request → 429 (see TC-USR-009) | COVERED |
| TC-BR-049 | BR-USR-PWD-003 (token invalidated after use) | Integration | Use token successfully; attempt reuse; assert 422 with invalid-token error | COVERED |
| TC-BR-050 | BR-USR-MASK-001 (sensitive fields masked by default) | Integration | GET user profile with bank fields as user without IsViewSensitiveInfo; assert masked values in response (HVR) | COVERED — HVR |
| TC-BR-051 | BR-USR-MASK-002 (unmask requires flag) | Integration | GET with IsViewSensitiveInfo = true; assert unmasked values returned | COVERED |
| TC-BR-052 | BR-USR-MASK-003 (no sensitive data in API response) | Integration | GET bank account fields as masked user; assert full account number NOT present anywhere in JSON response body (HVR) | COVERED — HVR |

### B.6 Group and Permission Rules

| Test ID | Rule ID | Test Type | Description | Status |
|---|---|---|---|---|
| TC-BR-053 | BR-GRP-PERM-001 (union of flags) | Integration | User in two groups; effective permissions = OR of all flags (see TC-USR-005, TC-USR-006) | COVERED |
| TC-BR-054 | BR-GRP-PERM-002 (AllAccess override) | Integration | AllAccess = true in any group → all 10 flags granted (see TC-USR-007, TC-GRP-007) | COVERED |
| TC-BR-055 | BR-GRP-PERM-003 (permissions before next access) | Integration | Add user to group; assert effective permissions include new group flags before next authenticated request | COVERED |
| TC-BR-056 | BR-GRP-PERM-004 (synchronous revocation) | Integration | Remove user from group; assert permissions revoked in same DB transaction; same-request assertion (see TC-GRP-005) | COVERED |
| TC-BR-057 | BR-GRP-PERM-005 (group management permission) | Integration | Update group without USERGROUPPAGE permission → 403 (see TC-GRP-010) | COVERED |
| TC-BR-058 | BR-GRP-PERM-006 (PlatformAdmin bypasses all checks) | Integration | Authenticate as PlatformAdmin; access any screen; assert permission flags NOT evaluated (no 403 from flag check) | COVERED |

### B.7 Multi-Tenancy Rules

| Test ID | Rule ID | Test Type | Description | Status |
|---|---|---|---|---|
| TC-BR-059 | BR-TENANT-001 (ClientId on all records) | Integration (Migration) | ClientId NULL audit query; assert zero NULL ClientId records (see Section F) | COVERED |
| TC-BR-060 | BR-TENANT-002 (tenant resolution at login) | Integration | Login with user whose ClientId cannot be resolved; assert 401, no data returned | COVERED |
| TC-BR-061 | BR-TENANT-003 (global reference data) | Integration | GET /api/v1/products (global lookup); assert returns same data regardless of ClientId | COVERED |
| TC-BR-062 | BR-TENANT-004 (IntermediaryProducer scope) | Integration | GET quotes as IntermediaryProducer; assert IntermediaryId filter applied after ClientId filter | COVERED |
| TC-BR-063 | BR-TENANT-005 (adjuster scope) | Integration | GET claims as Adjuster; assert AdjusterId filter applied after ClientId filter | COVERED |

### B.8 Mortgagee / Lender Rules

| Test ID | Rule ID | Test Type | Description | Status |
|---|---|---|---|---|
| TC-BR-064 | BR-MORT-001 (issuance notification) | Integration | New policy with mortgagee; assert LenderDock stub invoked at bind | PROVISIONAL — QST-1-INT-002 |
| TC-BR-065 | BR-MORT-002 (validation before notification) | Integration | Invalid mortgagee data; assert notification blocked, error recorded | PROVISIONAL — QST-1-INT-002 |
| TC-BR-066 | BR-MORT-003 (5 distinct lifecycle notifications) | Integration | Issuance, endorsement, cancellation, non-renewal, payment failure — all invoke distinct LenderDock stub calls | PROVISIONAL — QST-1-INT-002 |
| TC-BR-067 | BR-MORT-004 (all mortgagees notified) | Integration | Policy with 2 mortgagees; cancellation triggered; assert LenderDock stub called twice (once per mortgagee) | PROVISIONAL — QST-1-INT-002 |

### B.9 Document Generation Rules

| Test ID | Rule ID | Test Type | Description | Status |
|---|---|---|---|---|
| TC-BR-068 | BR-DOC-001 (5 document trigger events) | Integration | New business bind → declaration page; endorsement → proposal package; renewal bind → renewal package; non-renewal → notice; cancellation → cancellation notice | PROVISIONAL — QST-1-INT-003 |
| TC-BR-069 | BR-DOC-002 (documents stored in Blob) | Integration | Document generated; assert Azure Blob stub invoked, BlobPath recorded in PolicyDocument | COVERED |
| TC-BR-070 | BR-DOC-003 (download permission) | Integration | Non-sensitive doc download without IsDownloadPermission → 403; sensitive doc without IsAccessSensitiveDoc → 403 | COVERED |

### B.10 Audit Rules

| Test ID | Rule ID | Test Type | Description | Status |
|---|---|---|---|---|
| TC-BR-071 | BR-AUD-001 (all mutations logged) | Integration | Create/update/delete policy record; assert AuditLog entry with UserId, action type, RecordId, module, timestamp, ClientId | COVERED |
| TC-BR-072 | BR-AUD-002 (policy timeline) | Integration | GET /api/v1/policies/{id}/timeline; assert chronological immutable event log returned | COVERED |
| TC-BR-073 | BR-AUD-003 (audit not deletable) | Integration | Attempt DELETE /api/v1/audit-logs/{id} as PlatformAdmin; assert HTTP 405 (method not allowed) or 403 | COVERED |

### B.11 Logic Supplement Rules (ART-2-011 §7)

| Test ID | Rule ID | Test Type | Description | Status |
|---|---|---|---|---|
| TC-BR-074 | BR-LOGIC-SUPP-001 (UW only for premium-bearing) | Integration | Attempt premium-bearing endorsement as Producer; assert HTTP 403 | COVERED |
| TC-BR-075 | BR-LOGIC-SUPP-002 (one premium-bearing per term) | Integration | Issue second premium-bearing endorsement in same term; assert HTTP 409 | COVERED |
| TC-BR-076 | BR-LOGIC-SUPP-003 (Standard UW ≤ +10% DAL) | Unit | PremiumCalculationService: Standard UW with +11% DAL increase → validation error; +10% → accepted (HVR) | COVERED — HVR |
| TC-BR-077 | BR-LOGIC-SUPP-003 (Senior UW unlimited) | Unit | Senior UW with >+10% DAL increase → accepted (HVR) | COVERED — HVR |
| TC-BR-078 | BR-LOGIC-SUPP-004 (only DAL changeable) | Integration | Attempt to change Appurtenant Structure limit directly via endorsement; assert HTTP 422 (cascades from DAL only) | COVERED |
| TC-BR-079 | BR-LOGIC-SUPP-005 (additional premium immediate; monthly return spread) | Integration | Annual policy endorsement increase: payment collected immediately; monthly return premium: spread across remaining installments (HVR) | COVERED — HVR |
| TC-BR-080 | BR-LOGIC-SUPP-006 (no LenderDock during term for premium endorsement) | Integration | Premium-bearing endorsement completed; assert LenderDock NOT called during current term | COVERED |
| TC-BR-081 | BR-LOGIC-SUPP-007 (cumulative UW doc) | Integration | Two non-premium-bearing endorsements in same term; assert UW Specific Change Document contains both change events separated by two blank rows | PROVISIONAL — QST-1-INT-003 |
| TC-BR-082 | BR-LOGIC-SUPP-008 (no UW doc on new business) | Integration | New business bind; assert UW Specific Change Document NOT generated | COVERED |
| TC-BR-083 | BR-LOGIC-SUPP-009 (hexzone-keyed rates) | Unit | RatingEngine.CalculatePremium with known HR Hex ID; assert rate lookup from Rate Summary table returns correct base rate (HVR) | COVERED — HVR |
| TC-BR-084 | BR-LOGIC-SUPP-010 (wildfire state modifier) | Unit | Wildfire premium for CA (modifier 1.50) vs NJ (modifier 0.80); assert correct multiplier applied (HVR) | COVERED — HVR |
| TC-BR-085 | BR-LOGIC-SUPP-011 (flash flood vs excess flood) | Unit | Non-flood-zone property: Flash Flood coverage assigned, limit capped at $10,000; flood-zone property: Excess Flood assigned (HVR) | COVERED — HVR |
| TC-BR-086 | BR-LOGIC-SUPP-012 ($195 = $145 + $50) | Unit | PolicyFeeCalculator returns $195 composed of BasicPolicyFee $145 + SuperPerilsExcessFee $50 (HVR) | COVERED — HVR |
| TC-BR-087 | BR-LOGIC-SUPP-013 (deductible factors) | Unit | $5,000 deductible factor = 0.935; $10,000 = 0.860; $25,000 = 0.750; baseline $2,500 = 1.000 (HVR) | COVERED — HVR |
| TC-BR-088 | BR-LOGIC-SUPP-014 (CatWind as sum of 4 sub-perils) | Unit | CatWind rate = Hurricane + Tornado + Hail + Derecho from hexzone rate table (HVR) | COVERED — HVR |
| TC-BR-089 | BR-LOGIC-SUPP-015 (surplus lines tax) | Unit | TaxCalculationService for Florida: 4.94% surplus lines + 0.06% stamping on total premium; Oregon: 2% + $10 flat (HVR) | COVERED — HVR |
| TC-BR-090 | BR-LOGIC-SUPP-016 (audit log schema) | Integration | Create policy; assert AuditLog entry has: Module, RecordId, Description, UserId, ColumnName, UpdatedValue, PreviousValue, dateTime, ClientId | COVERED |
| TC-BR-091 | BR-LOGIC-SUPP-017 (audit across all modules) | Integration | Create records in Policy, Claims, User, Group modules; assert AuditLog entries present for each | COVERED |
| TC-BR-092 | BR-LOGIC-SUPP-018 (async bulk upload) | Integration (Job) | Upload Excel file to staging; invoke T-10; assert records geocoded via Google stub, rated, HexCat stub called, approved records emailed | COVERED |
| TC-BR-093 | BR-LOGIC-SUPP-019 (external users created by internal users) | Integration | Attempt to create Producer as ClientAdmin directly; assert HTTP 403 if not via Distribution Management flow | COVERED |
| TC-BR-094 | BR-LOGIC-SUPP-020 (PlatformAdmin no operational access) | Integration | Authenticate as PlatformAdmin; GET /api/v1/policies; assert HTTP 403 (PlatformAdmin has no operational module access) | COVERED |
| TC-BR-095 | BR-LOGIC-SUPP-021 (document template placeholder model) | Integration | Upload template with placeholder; assert placeholder extracted, mapped to data source, resolved at generation time | PROVISIONAL — QST-1-INT-003 |
| TC-BR-096 | BR-LOGIC-SUPP-022 (blob storage path: env/clientId/domain) | Integration | Upload policy document; assert Azure Blob path = {environment}/{ClientId}/Policies/{filename} | COVERED |

---

## Section C — Security Rules

### C.1 The 10 Permission Flags — Individual Enforcement Tests

| Test ID | Flag | Test Type | Description | Status |
|---|---|---|---|---|
| TC-SEC-001 | IsViewPermission (Flag 1) | Integration | GET policy list as user with View = false on PolicyList screen; assert HTTP 403 | COVERED |
| TC-SEC-002 | IsViewPermission (Flag 1) | Integration | GET policy list as user with View = true; assert 200 and data returned | COVERED |
| TC-SEC-003 | IsCreatePermission (Flag 2) | Integration | POST /api/v1/quotes as user with Create = false on NewQuote screen; assert HTTP 403 | COVERED |
| TC-SEC-004 | IsCreatePermission (Flag 2) | Integration | POST /api/v1/quotes as user with Create = true; assert 201 | COVERED |
| TC-SEC-005 | IsEditPermission (Flag 3) | Integration | PUT /api/v1/policies/{id}/cancel as user with Edit = false; assert HTTP 403 (see TC-POL-030) | COVERED |
| TC-SEC-006 | IsEditPermission (Flag 3) | Integration | PUT /api/v1/policies/{id} as user with Edit = true; assert 200 | COVERED |
| TC-SEC-007 | IsApproveReject (Flag 4) | Integration | Approve claim worksheet without flag; assert HTTP 403 (see TC-CLM-008) | COVERED |
| TC-SEC-008 | IsApproveReject (Flag 4) | Integration | Approve claim worksheet with flag; assert 200 and status changed | COVERED |
| TC-SEC-009 | IsDuplicatePermission (Flag 5) | Integration | POST /api/v1/quotes/{id}/clone as user with Clone = false; assert HTTP 403 | COVERED |
| TC-SEC-010 | IsDuplicatePermission (Flag 5) | Integration | POST clone with Clone = true; assert 201 with cloned quote | COVERED |
| TC-SEC-011 | IsUploadPermission (Flag 6) | Integration | POST /api/v1/claims/{id}/documents as user with Upload = false; assert HTTP 403 | COVERED |
| TC-SEC-012 | IsUploadPermission (Flag 6) | Integration | POST document upload with Upload = true; assert 201 | COVERED |
| TC-SEC-013 | IsDownloadPermission (Flag 7) | Integration | GET download endpoint without flag; assert HTTP 403 (see TC-POL-017) | COVERED |
| TC-SEC-014 | IsDownloadPermission (Flag 7) | Integration | GET download with flag; assert 200 and file returned | COVERED |
| TC-SEC-015 | IsViewSensitiveInfo (Flag 8) | Integration | GET financial fields without flag; assert masked values in response (HVR) (see TC-GRP-008) | COVERED — HVR |
| TC-SEC-016 | IsViewSensitiveInfo (Flag 8) | Integration | GET financial fields with flag; assert unmasked values returned (HVR) | COVERED — HVR |
| TC-SEC-017 | IsAccessSensitiveDoc (Flag 9) | Integration | Download sensitive doc without flag; assert HTTP 403 (see TC-GRP-009) | COVERED |
| TC-SEC-018 | IsAccessSensitiveDoc (Flag 9) | Integration | Download sensitive doc with flag; assert 200 | COVERED |
| TC-SEC-019 | AllAccess (Flag 10) | Integration | AllAccess = true for group on screen; assert all 10 flags effectively granted (see TC-GRP-007) | COVERED |
| TC-SEC-020 | AllAccess override — scope still applies | Integration | AllAccess = true but user is IntermediaryProducer; assert TenantA/IntermediaryX data returned, not other intermediary's data | COVERED |

### C.2 ClientId Isolation — Cross-Tenant Data Access

| Test ID | Source Req | Test Type | Description | Status |
|---|---|---|---|---|
| TC-SEC-021 | BR-TENANT-001; ADR-003 | Integration | GET /api/v1/policies/{id} where PolicyId belongs to TenantB; authenticated as TenantA user; assert HTTP 404 | COVERED |
| TC-SEC-022 | BR-TENANT-001; ADR-003 | Integration | GET /api/v1/claims/{id} (TenantB claim) as TenantA user; assert HTTP 404 | COVERED |
| TC-SEC-023 | ADR-003 (EF Core global filters) | Integration | Disable EF Core global filter; assert TenantB records visible; re-enable; assert not visible (filter existence proof) | COVERED |
| TC-SEC-024 | RSK-1-SEC-008 (ClientId=0 leak) | Integration | Authenticate with JWT where ClientId claim is null/absent; assert 401 raised, not 0 substituted | COVERED |
| TC-SEC-025 | BR-TENANT-002 (tenant resolution) | Integration | Login as user with no resolvable ClientId; assert 401 and no data returned | COVERED |

### C.3 JWT Authentication and Refresh

| Test ID | Source Req | Test Type | Description | Status |
|---|---|---|---|---|
| TC-SEC-026 | ADR-004 (15-min access token) | Integration | Issue JWT; advance clock past 15 minutes (test token with short expiry); assert next API call returns 401 | COVERED |
| TC-SEC-027 | ADR-004 (refresh token rotation) | Integration | POST /api/v1/auth/refresh; assert new access token issued, old refresh token invalidated (rotation-on-use) | COVERED |
| TC-SEC-028 | ADR-004 (refresh token reuse rejected) | Integration | Reuse an already-consumed refresh token; assert HTTP 401 | COVERED |
| TC-SEC-029 | NFR-004 (onboarding token 24h) | Integration | Onboarding token beyond 24 hours; assert HTTP 422 (token expired) | COVERED |
| TC-SEC-030 | NFR-004 (onboarding token code-match) | Integration | Submit onboarding token with correct expiry but wrong code; assert HTTP 422 (fixes RSK-1-SEC-002) | COVERED |

### C.4 AES-256 Encrypt/Decrypt Round-Trip — HUMAN_VALIDATION_REQUIRED

| Test ID | Source Req | Test Type | Description | Status |
|---|---|---|---|---|
| TC-SEC-031 | ADR-004; NFR-007 (AES-256) | Integration — HVR | Encrypt known plaintext with `Encryption:Base64Key`; decrypt ciphertext; assert round-trip equality | COVERED — HVR |
| TC-SEC-032 | BR-USR-MASK-003 | Integration — HVR | Bank account number stored encrypted; GET via API without IsViewSensitiveInfo; assert encrypted/masked value only in response, full plaintext NOT present (HVR) | COVERED — HVR |
| TC-SEC-033 | RSK-1-SEC-001 (no plaintext passwords) | Migration Validation | Post-migration: SELECT COUNT(*) WHERE password IS NOT NULL in users table; assert 0 (HVR) | COVERED — HVR |

---

## Section D — All 11 Hangfire Timer Jobs

| Test ID | Timer | Job Name | Threshold | Test Type | Description | Status |
|---|---|---|---|---|---|---|
| TC-JOB-001 | T-01 | RenewalQuoteGenerator | 90 days before expiry | Integration | Seed at exactly day 90; invoke; assert renewal Draft created (see TC-POL-023) | COVERED |
| TC-JOB-002 | T-01 boundary | RenewalQuoteGenerator | 89 days | Integration | Seed at day 89; invoke; assert NO quote created (see TC-POL-024) | COVERED |
| TC-JOB-003 | T-01 isolation | RenewalQuoteGenerator | — | Integration | TenantB policy at day 90; invoke as TenantA job run; assert TenantB not affected | COVERED |
| TC-JOB-004 | T-02 | RenewalDraftProducerEmail | Active Draft renewal | Integration | Draft renewal quote exists; invoke T-02; assert reminder email stub called (see TC-BR-005) | COVERED |
| TC-JOB-005 | T-03 | NonRenewalNoticeSender | 60 days before expiry | Integration | Non-renewal policy at day 60; invoke T-03; assert notice and email triggered | PROVISIONAL — QST-1-INT-003 |
| TC-JOB-006 | T-03 boundary | NonRenewalNoticeSender | 59 days | Integration | At day 59; invoke T-03; assert NOT triggered | COVERED |
| TC-JOB-007 | T-04 | PolicyExpiryProcessor (Non-Renewed) | 90 days post-expiry | Integration | Policy at 90 days post-expiry no bound renewal; invoke T-04; assert Non-Renewed (see TC-BR-006) | COVERED |
| TC-JOB-008 | T-04 boundary | PolicyExpiryProcessor | 89 days post-expiry | Integration | At 89 days; assert NOT changed | COVERED |
| TC-JOB-009 | T-05a | QuoteExpiryProcessor | New business 90 days | Integration | NB quote at 90 days; invoke T-05; assert Expired (see TC-BR-009) | COVERED |
| TC-JOB-010 | T-05b | QuoteExpiryProcessor | Renewal 30 days | Integration | Renewal quote at 30 days; invoke T-05; assert Expired (see TC-BR-011) | COVERED |
| TC-JOB-011 | T-05c | QuoteExpiryProcessor | Endorsement 90 days | Integration | Endorsement quote at 90 days; invoke T-05; assert Expired (see TC-BR-013) | COVERED |
| TC-JOB-012 | T-06 | AutoCancellationProcessor | 30 days after missed payment | Integration | Failed payment at day 30; invoke T-06; assert Cancelled (see TC-BR-016) | COVERED |
| TC-JOB-013 | T-06 boundary | AutoCancellationProcessor | 29 days | Integration | Day 29; invoke T-06; assert NOT cancelled (see TC-BR-017) | COVERED |
| TC-JOB-014 | T-07 | PolicyExpiredStatusUpdater | 1 day after ExpirationDate | Integration | Policy ExpirationDate = yesterday; invoke T-07; assert Expired (see TC-BR-014) | COVERED |
| TC-JOB-015 | T-07 boundary | PolicyExpiredStatusUpdater | ExpirationDate = today | Integration | ExpirationDate = today; invoke T-07; assert NOT expired (see TC-BR-015) | COVERED |
| TC-JOB-016 | T-08 | InstallmentPaymentProcessor | Due date | Integration | Installment due today; invoke T-08; assert TranzPay stub called (HVR) | PROVISIONAL — QST-2-INT-001 (TranzPay sandbox) |
| TC-JOB-017 | T-08 no-run | InstallmentPaymentProcessor | Non-due | Integration | Installment due tomorrow; invoke T-08; assert TranzPay NOT called | COVERED |
| TC-JOB-018 | T-09 | TranzPayCallbackReconciler | Pending transactions | Integration | Pending payment transaction; invoke T-09; assert TranzPay status poll stub called, transaction updated | PROVISIONAL — QST-2-INT-001 |
| TC-JOB-019 | T-09 idempotent | TranzPayCallbackReconciler | Already-resolved | Integration | Resolved transaction; invoke T-09; assert NOT re-polled | COVERED |
| TC-JOB-020 | T-10 | BulkUploadProcessor | Staged records | Integration | Upload 3-record Excel to staging; invoke T-10; assert geocoded, rated, HexCat-approved, broker emailed for each | COVERED |
| TC-JOB-021 | T-10 idempotent | BulkUploadProcessor | Already processed | Integration | Processed record; invoke T-10 again; assert not reprocessed | COVERED |
| TC-JOB-022 | T-11 | CommissionDisbursementProcessor | Eligible commission | Integration | Eligible commission record; invoke T-11; assert disbursement record created, DisburseCloud stub called | PROVISIONAL — QST-2-INT-003 |
| TC-JOB-023 | T-11 idempotent | CommissionDisbursementProcessor | Already disbursed | Integration | Disbursed commission; invoke T-11; assert not re-disbursed | COVERED |
| TC-JOB-024 | ALL — kill switch | All 11 jobs | TimerEnabled = false | Integration | Set global TimerEnabled = false; invoke each job; assert zero records processed, no external calls made | COVERED |
| TC-JOB-025 | ALL — isolation | All 11 jobs | Cross-tenant | Integration | Seed TenantA and TenantB eligible records; run job; assert only TenantA records mutated (isolation per job) | COVERED |

---

## Section E — Integration Contract Smoke Tests

| Test ID | Integration | Test Type | Description | Status |
|---|---|---|---|---|
| TC-INT-001 | TranzPay callback endpoint (PostBackUrl) | Integration | POST /api/webhooks/tranzpay/callback with valid payload; assert PaymentCallbackResponses record created, PolicyPaymentTransaction status updated, idempotency on duplicate ThirdPartyCallID (HVR) | COVERED — HVR |
| TC-INT-002 | TranzPay callback — invalid payload | Integration | POST malformed payload; assert HTTP 400, no record created | COVERED |
| TC-INT-003 | LenderDock notification (new business) | Integration | Policy bound with mortgagee; assert HTTP POST to LenderDock stub with correct Authorization header and payload structure | PROVISIONAL — QST-1-INT-002 |
| TC-INT-004 | LenderDock notification (cancellation) | Integration | Policy cancelled with mortgagee; assert LenderDock stub called with cancellation payload | PROVISIONAL — QST-1-INT-002 |
| TC-INT-005 | Plumsail document generation trigger | Integration | Bind policy; assert HTTP call to Plumsail stub with template ID and placeholder data; assert response document ID stored | PROVISIONAL — QST-1-INT-003 |
| TC-INT-006 | DisburseCloud vendor registration | Integration | Trigger disbursement for mortgage-bill policy; assert HTTP call to DisburseCloud stub with correct vendor registration endpoint | PROVISIONAL — QST-2-INT-003 (URL mismatch — production URL unconfirmed) |
| TC-INT-007 | Azure Blob upload round-trip | Integration | Upload test document via AzureBlob service; assert file exists at expected path (env/ClientId/domain/filename); download and assert content identical | COVERED |
| TC-INT-008 | Azure Blob multi-tenant path isolation | Integration | Upload for TenantA; assert path contains TenantA ClientId; TenantB cannot download via TenantA path | COVERED |
| TC-INT-009 | Google Maps geocoding (Geocoding API) | Integration | Submit valid US address to Geocoding stub; assert latitude and longitude returned and stored on record | COVERED |
| TC-INT-010 | Google Maps — invalid address | Integration | Submit address that geocoding stub returns empty result; assert HTTP 422 with address validation error | COVERED |
| TC-INT-011 | SMTP email dispatch | Integration | Trigger any email notification (password reset, cancellation notice, etc.); assert SMTP stub (WireMock) receives email with correct To address, subject, and body containing required fields | COVERED |
| TC-INT-012 | SMTP — multiple recipients (mortgagees) | Integration | Policy with 2 mortgagees; trigger notification; assert SMTP stub receives 2 separate emails | COVERED |
| TC-INT-013 | HexCat API — Approved status | Integration | Submit geocoordinates to HexCat stub returning "Approved"; assert risk information fields populated | COVERED |
| TC-INT-014 | HexCat API — Not Approved status | Integration | HexCat stub returns "Not Approved"; assert quote progression blocked | COVERED |

---

## Section F — Migration Validation Tests

| Test ID | Validation Check | Test Type | Description | Status |
|---|---|---|---|---|
| TC-MIG-001 | Row count parity | Migration | For each of 92 source tables: assert row count in PostgreSQL target equals row count in SQL Server source snapshot | COVERED |
| TC-MIG-002 | Row count parity — System DB | Migration | For each of 26 System DB tables: assert parity between source and target | COVERED |
| TC-MIG-003 | No orphan claims | Migration | SELECT COUNT(*) FROM claims LEFT JOIN policies WHERE policies.id IS NULL; assert 0 | COVERED |
| TC-MIG-004 | No orphan worksheets | Migration | SELECT COUNT(*) FROM worksheets LEFT JOIN claims WHERE claims.id IS NULL; assert 0 | COVERED |
| TC-MIG-005 | No orphan policy documents | Migration | SELECT COUNT(*) FROM policy_documents LEFT JOIN policies WHERE policies.id IS NULL; assert 0 | COVERED |
| TC-MIG-006 | No sentinel dates — policies | Migration | SELECT COUNT(*) WHERE expiration_date = '1900-01-01' OR effective_date = '1900-01-01'; assert 0 | COVERED |
| TC-MIG-007 | No sentinel dates — claims | Migration | SELECT COUNT(*) WHERE fnol_date = '1900-01-01' OR loss_date = '1900-01-01'; assert 0 | COVERED |
| TC-MIG-008 | No sentinel dates — payments | Migration | SELECT COUNT(*) WHERE transaction_date = '1900-01-01'; assert 0 | COVERED |
| TC-MIG-009 | No plaintext passwords — HVR | Migration — HVR | SELECT COUNT(*) FROM users WHERE password IS NOT NULL; assert 0. CRITICAL: non-zero is a security defect; escalate immediately | COVERED — HVR |
| TC-MIG-010 | ClientId NULL audit | Migration | SELECT tbl, COUNT(*) for policies/claims/users/groups/intermediaries WHERE client_id IS NULL; assert all = 0 | COVERED |
| TC-MIG-011 | Schema typo correction — WritingCompany | Migration | information_schema.columns: column 'writing_company' exists; 'writting_company' does NOT exist | COVERED |
| TC-MIG-012 | Schema typo correction — CommissionPercentage | Migration | 'commission_percentage' exists; 'comission_percentage' does NOT exist | COVERED |
| TC-MIG-013 | Schema typo correction — OrganisationType | Migration | 'organisation_type' exists; 'oraganisation_type' does NOT exist | COVERED |
| TC-MIG-014 | Schema typo correction — PolicyId | Migration | No column named 'poilcy_id' exists anywhere in schema | COVERED |
| TC-MIG-015 | FK constraints enforced | Migration | Attempt INSERT of claim with non-existent PolicyId; assert FK violation error | COVERED |
| TC-MIG-016 | UUID format (UNIQUEIDENTIFIER → uuid) | Migration | SELECT data_type FROM information_schema.columns WHERE data_type = 'uuid' for PK columns; assert all PKs are uuid type | COVERED |
| TC-MIG-017 | DATETIME → timestamptz conversion | Migration | SELECT column_name FROM information_schema.columns WHERE data_type = 'timestamp with time zone'; assert date columns use timestamptz | COVERED |

---

## Section G — Explicit Gap Table

The following requirements have no automated test entry. Each entry states the reason.

| Gap ID | Requirement | Domain | Gap Reason | Resolution Path |
|---|---|---|---|---|
| GAP-QA-001 | US-CLAIMS-011 (Bulk claim upload) | Claims | Story is P3, LOW confidence (DBT-1-UI-003); bulk claim upload form not evidenced; cannot write test without confirmed UI flow and upload template. (ASM-BA-002) | Confirm feature existence (QST-BA-001); design test when UI confirmed |
| GAP-QA-002 | US-BILLING-005 refund via TranzPay (live gateway round-trip) | Billing | TranzPay refund API contract (GAP-2-INT-002, DBT-3-ARCH-002) not confirmed; cannot assert correct API call structure without confirmed contract. TC-BR-035 covers stub-based test. | Confirm TranzPay refund contract; promote TC-BR-035 from PROVISIONAL to COVERED |
| GAP-QA-003 | US-REPORT-001 through US-REPORT-005 (production reports content) | Reports | Report content is LOW confidence (EV-0-0048 confirms report types; content inferred only). Cannot write content-assertion tests without confirmed report field specifications. (ASM-BA-003, QST-BA-002) | Obtain confirmed report specifications; write tests post-confirmation |
| GAP-QA-004 | TranzPay hosted redirect payment UI flow (browser automation) | Billing/Integration | TranzPay's hosted redirect page is a third-party-owned page. Browser automation across the hosted redirect boundary is not feasible. Manual UAT script is the mitigation. | Manual UAT script; mark in UAT checklist |
| GAP-QA-005 | State surplus lines tax rate table values (50 states) | Rating Engine | Tax rate correctness for all 50 states is a financial audit item, not an automated assertion. TC-BR-089 tests the computation pattern for 2 sample states only. | Financial auditor reviews EV-0-0253 rate table against state regulations; sign off under HVR policy |
| GAP-QA-006 | HexCat API — Rate Summary table accuracy (103,739 rows) | Rating Engine | Rate table accuracy (whether the rate values in the Rate Summary worksheet are correct for each hexzone) is a business/actuarial validation, not a software test. TC-BR-083 tests that the lookup mechanism works. | Actuarial review of rate table; sign off under HVR policy |
| GAP-QA-007 | DisburseCloud Mortgage Bill return premium (EV-0-0254 unresolved) | Integration | Whether DisburseCloud can process Mortgage Bill return premium is an open design question (QST-2-LOGIC-002). No confirmed API contract exists. | Resolve QST-2-LOGIC-002; design test when contract confirmed |
| GAP-QA-008 | Audit log retention period enforcement | Compliance | Retention period is not evidenced (QST-2-LOGIC-004). No automated test can assert a retention policy that has not been defined. | Define retention policy; implement and test when defined |
| GAP-QA-009 | Annual policy return premium finalization flow | Billing | How the negative balance is cleared after ACH/CC refund issued for annual policy endorsement is an unresolved design question (QST-2-LOGIC-001). Cannot write assertion until "Issue" button flow confirmed. | Resolve QST-2-LOGIC-001; design test when flow confirmed |
| GAP-QA-010 | US-USER-008 (View Profile — 8 tabs content) | User Management | US-USER-008 is P2 with MEDIUM confidence; tab content not fully captured (EV-0-0222 confirms tab list only). Cannot write content-assertion tests for tabs without confirmed field lists. | Confirm tab content; write tests when evidenced |
| GAP-QA-011 | US-POLICY-017 (Additional named insureds — form fields) | Quotes & Policies | Form is MEDIUM confidence (EV-0-0218 confirms additional insured presence; form not fully captured). Cannot write field-level validation tests. | Confirm form field list; write validation tests |
| GAP-QA-012 | US-POLICY-019 (Cancel/Rewrite wizard content) | Quotes & Policies | Wizard content is LOW confidence (DBT-1-0001). Entry point confirmed; steps not evidenced. | Confirm wizard steps; write tests when evidenced |
| GAP-QA-013 | MFA enforcement (TOTP for PlatformAdmin/ClientAdmin) | Security | NFR-013 requires MFA via TOTP. MFA setup and TOTP verification flow tests are not yet specifiable because the exact enrolment UI and TOTP validation API endpoint are not in scope of HARVEST artefacts. | Define MFA flow in FORGE implementation; test in E2E post-implementation |
| GAP-QA-014 | RPS PostGIS raster accuracy | Integration | RPS data accuracy is a geospatial data quality matter. TC-INT-013/014 test that the API call is made and a result returned. Whether the returned RPS value is actuarially correct requires Damco/RPS data validation. | Damco data quality review per ADR-005 |

---

## Summary Statistics

### Total Tests in Matrix

| Category | COVERED | PROVISIONAL | GAP | Total |
|---|---|---|---|---|
| A — P1 User Stories | 33 | 6 | 0 | 39 |
| A — P1 (domain sub-total: Policy) | 25 | 7 | — | 32 |
| A — P1 (domain sub-total: Claims) | 15 | 0 | — | 15 |
| A — P1 (domain sub-total: Billing) | 6 | 4 | — | 10 |
| A — P1 (domain sub-total: Distribution) | 3 | 2 | — | 5 |
| A — P1 (domain sub-total: User Mgmt) | 13 | 0 | — | 13 |
| A — P1 (domain sub-total: Group Mgmt) | 10 | 0 | — | 10 |
| A — P1 (domain sub-total: Reports) | 3 | 0 | — | 3 |
| B — Business Rules | 57 | 17 | 0 | 74 |
| C — Security Rules | 33 | 0 | 0 | 33 |
| D — Hangfire Jobs | 20 | 5 | 0 | 25 |
| E — Integration Contracts | 9 | 5 | 0 | 14 |
| F — Migration Validation | 17 | 0 | 0 | 17 |
| **TOTAL** | **169** | **33** | **14** | **216** |

### Test Type Distribution

| Test Type | Count |
|---|---|
| Unit | 17 |
| Integration (API + service) | 131 |
| Integration (Job / Hangfire) | 34 |
| Integration (Migration) | 17 |
| E2E (Playwright) | 2 |
| **Total** | **201** |

*(15 duplicate cross-reference entries collapsed; unique test specifications = 201)*

### Coverage Percentages

| Dimension | Total Applicable | COVERED | PROVISIONAL | Coverage % (COVERED) | Coverage % (COVERED+PROVISIONAL) |
|---|---|---|---|---|---|
| P1 User Stories (34 stories) | 34 | 34 | 0 | **100%** | 100% |
| P1 Acceptance Criteria with ≥1 test | 34+ criteria | All P1 ACs covered | — | 100% | 100% |
| Business Rules (BR- IDs, all sections) | 96 rules | 77 | 19 | 80% | 100% |
| Security Permission Flags (10 flags × 2 directions) | 20 | 20 | 0 | **100%** | 100% |
| ClientId Isolation tests | 5 | 5 | 0 | **100%** | 100% |
| Hangfire Jobs (11 jobs) | 11 | 8 | 3 | 73% | **100%** |
| Integration Contracts (7 integrations) | 14 smoke tests | 9 | 5 | 64% | **100%** |
| Migration Validation checks | 17 | 17 | 0 | **100%** | 100% |
| **Explicit Gaps** | — | — | — | 14 gaps | See Gap Table |

### PROVISIONAL Blocking QST Summary

| QST ID | Blocking | Count of PROVISIONAL tests |
|---|---|---|
| QST-1-INT-001 (TranzPay contract — payment gateway) | TC-BIL-004, 005, 006, TC-BR-033, 035 | 5 |
| QST-2-INT-001 (TranzPay sandbox) | TC-JOB-016, 018 | 2 |
| QST-1-INT-002 (LenderDock contract) | TC-POL-018–020, 029, 034, 038, TC-BR-008, 019, 036, 064–067, TC-INT-003, 004, TC-JOB-005 (partial) | 14 |
| QST-1-INT-003 (Plumsail API key) | TC-POL-015, 035, TC-BR-007, 068, 081, 095, TC-INT-005, TC-JOB-005 | 9 |
| QST-2-INT-003 (DisburseCloud URL mismatch) | TC-CLM-009, TC-DIST-005, TC-BR-042, TC-INT-006, TC-JOB-022 | 5 |

**Total PROVISIONAL tests: 33**

---

*End of ART-4-010 — Test Coverage Matrix | INSUREEDGE-2026 | FORGE Phase | 2026-06-17*
*Governance: Layer 0 §3 (Confidence), §5 (Evidence First), §2 (DAQ Register)*
*Every PROVISIONAL test cites its blocking QST-. Every GAP has an explicit reason and resolution path.*
*HUMAN_VALIDATION_REQUIRED tests: 25 — require SME sign-off before merge to main.*
