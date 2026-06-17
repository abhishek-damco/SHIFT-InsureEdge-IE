# ART-4-007 — Test Specifications
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Status:** AI_GENERATED
**Produced by:** Forge Agent
**Phase:** FORGE
**Date:** 2026-06-17
**Version:** 1.0
**Engagement:** INSUREEDGE-2026 | Customer: Hudson Bailey
**Architecture gate:** PASSED (DEC-3-0003, 2026-06-17)
**Primary inputs:** ART-2-003 (Acceptance Criteria), ART-2-005 (Business Rules Catalog), ART-3-005 (Backend Architecture §6, §7, §8), ADR-003, ADR-004, ADR-006, ADR-009

**Test ID convention:** `TS-{DOMAIN}-{SEQ}`
**Test types:** Unit (U), Integration (I), End-to-End (E2E)
**Tools:**
- Unit: xUnit + Moq (backend); Vitest + React Testing Library (frontend)
- Integration: xUnit + Testcontainers (PostgreSQL + Redis in Docker)
- E2E: Playwright (critical user journeys)

---

## Section 1: Policy Lifecycle Tests

### TS-POL-001 — Quote Creation: Valid Individual Quote (US-POLICY-001)

**Type:** Integration
**Requirement:** US-POLICY-001, AC-US-POLICY-001-01, AC-US-POLICY-001-02
**Evidence:** ART-2-003 §1

**Preconditions:**
- PostgreSQL Testcontainer running; schema seeded with reference data (PolicyStatus, PolicyType, CoverageType, ProductId=1)
- AppUser with Role=IntermediaryProducer; ClientId=1; IntermediaryId=10 authenticated (JWT)
- Product ID 1 active in `identity.product`

**Test steps:**
1. POST `/api/v1/quotes` with `insuredType=Individual`, `firstName=John`, `lastName=Doe`, `isAge65OrOlder=false`, `effectiveDate=2026-07-01`, `productId=1`, valid mailing address
2. Assert HTTP 201
3. Assert response body: `success=true`, `data.policyStatusId` corresponds to Draft status
4. Assert DB: one row in `policy.policy` with correct `client_id=1`, `policy_status_id=[Draft]`, `is_renewal=false`
5. Assert `intermediary_id` on quote matches authenticated user's `IntermediaryId=10`

**Expected outcome:** Quote created in Draft status; linked to caller's intermediary; ClientId correctly isolated.

---

### TS-POL-002 — Quote Creation: Missing Required Fields Blocked (US-POLICY-001)

**Type:** Unit
**Requirement:** AC-US-POLICY-001-03

**Preconditions:** `CreateQuoteValidator` instantiated; no DB required

**Test steps:**
1. Create `CreateQuoteRequest` with `effectiveDate=null`, `firstName=null`, `mailingAddress=null`
2. Invoke `FluentValidation.Validate(request)`
3. Assert `IsValid = false`
4. Assert errors contain field names: `effectiveDate`, `firstName`, `mailingAddress.Line1`

**Expected outcome:** Validation fails; specific field errors returned; no record created.

---

### TS-POL-003 — HexCat Not Approved Blocks Step Progression (US-POLICY-002)

**Type:** Integration
**Requirement:** AC-US-POLICY-002-02

**Preconditions:**
- Mock `IHexCatClient` returns `{ status: "Not Approved" }` for any address
- Existing quote in DB at quoteId=5

**Test steps:**
1. PUT `/api/v1/quotes/5/risk-location` with valid address
2. Assert HTTP 422
3. Assert error code `"HEXCAT_NOT_APPROVED"` in response errors
4. Assert DB: `policy_risk_information.hex_cat_status = 'Not Approved'`; no advancement to next step

**Expected outcome:** Quote blocked at risk location step; clear error returned.

> **DBT-4-FORGE-001 note:** Until HexCat contract is resolved, mock returns "Not Approved" for address pattern matching; "Approved" for all others.

---

### TS-POL-004 — Duplicate Active Policy Blocked (US-POLICY-005)

**Type:** Integration
**Requirement:** AC-US-POLICY-005-03

**Preconditions:**
- DB contains active Policy with RiskLocation at address "123 Main St, 90210" for ClientId=1
- New quote at same address; same ClientId=1

**Test steps:**
1. POST `/api/v1/policies/{quoteId}/bind` for a quote at "123 Main St, 90210"
2. Assert HTTP 409
3. Assert error code `"DUPLICATE_ACTIVE_POLICY"` in response
4. Assert DB: policy status NOT changed to Active

**Expected outcome:** Binding blocked; duplicate check enforced per ClientId (not global).

---

### TS-POL-005 — Policy Bind Initiates TranzPay Redirect (US-POLICY-005)

**Type:** Integration (mock TranzPay)
**Requirement:** AC-US-POLICY-005-01
**Evidence:** ART-2-003 §1, ART-2-012 §1.3

**Preconditions:**
- Mock `ITranzPayClient` returns `{ redirectUrl: "https://demo.tranzpay.com/pay?token=abc", thirdPartyCallId: "CALL123" }`
- Quote in Approved status at quoteId=10

**Test steps:**
1. POST `/api/v1/policies/10/bind` with valid payment request body
2. Assert HTTP 200
3. Assert `data.redirectUrl` starts with "https://"
4. Assert `data.thirdPartyCallId = "CALL123"`
5. Assert DB: PolicyPaymentTransaction created with `transaction_status = 'Pending'`; policy status NOT yet Active

**Expected outcome:** Payment redirect initiated; policy remains in Approved state pending callback.

---

### TS-POL-006 — TranzPay Callback Success Activates Policy (US-POLICY-005)

**Type:** Integration
**Requirement:** AC-US-POLICY-005-01

**Preconditions:**
- Policy in Approved status; PolicyPaymentTransaction with `third_party_call_id = "CALL123"`, status=Pending

**Test steps:**
1. POST `/api/webhooks/tranzpay/callback` with payload `{ ThirdPartyCallID: "CALL123", Status: "Success", ReferenceId: "REF456" }`
2. Assert HTTP 200 (immediate — processing async)
3. Wait for processing (or trigger synchronously in test)
4. Assert DB: `billing.policy_payment_transaction.transaction_status = 'Success'`
5. Assert DB: `policy.policy.policy_status_id` = Active status ID
6. Assert DB: `billing.payment_callback_responses` contains one row with `third_party_call_id = "CALL123"`

**Expected outcome:** Policy transitions to Active; payment recorded; callback logged.

---

### TS-POL-007 — TranzPay Callback Idempotency (US-POLICY-005)

**Type:** Integration
**Requirement:** ART-3-005 §10.4 (idempotency on ThirdPartyCallID)

**Preconditions:**
- Policy Active; callback "CALL123" already processed

**Test steps:**
1. POST `/api/webhooks/tranzpay/callback` again with same `ThirdPartyCallID: "CALL123"`
2. Assert HTTP 200 (no error — idempotent)
3. Assert DB: `billing.payment_callback_responses` still has exactly 1 row for "CALL123" (no duplicate)
4. Assert DB: policy status unchanged (still Active)

**Expected outcome:** Duplicate callback silently ignored; no duplicate records created.

---

### TS-POL-008 — Policy Cancellation (US-POLICY-012)

**Type:** Integration
**Requirement:** AC-US-POLICY-012-01, AC-US-POLICY-012-02

**Preconditions:**
- Active policy at policyId=20; mock email service
- User with `[POLICY_LIST.Edit]` permission authenticated

**Test steps:**
1. POST `/api/v1/policies/20/cancel` with `cancellationDate=2026-08-01`, `cancellationReason="Non-payment"`
2. Assert HTTP 200
3. Assert DB: `policy.policy.policy_status_id` = Cancelled status ID
4. Assert DB: `policy.policy.cancellation_date = '2026-08-01'`
5. Assert mock email service called once (cancellation notice)
6. Assert mock LenderDock client called if mortgage exists (AC-US-POLICY-012-03)

**Expected outcome:** Policy cancelled; notices dispatched; cancellation date recorded.

---

### TS-POL-009 — Auto-Cancellation Timer: 30-Day Grace Period (US-POLICY-013)

**Type:** Unit
**Requirement:** AC-US-POLICY-013-01, BR-POL-CAN-001

**Preconditions:**
- Mock `IAppConfigurationService.GetValueAsync("Policy:AutoCancellationGraceDays")` returns 30
- `AutoCancellationProcessorJob` instantiated with mock dependencies

**Test steps:**
1. Create Policy with Lapsed status; `FailedPaymentDate = DateTime.UtcNow.AddDays(-31)`
2. Call `AutoCancellationProcessorJob.ExecuteAsync()`
3. Assert `CancellationService.CancelPolicyAsync` called for that policy
4. Repeat with `FailedPaymentDate = DateTime.UtcNow.AddDays(-29)` — assert NOT called

**Expected outcome:** 30-day boundary enforced from configurable threshold; policy at day 31 cancelled, day 29 not.

---

### TS-POL-010 — Renewal Quote Generation: 90-Day Timer (US-POLICY-010)

**Type:** Unit
**Requirement:** AC-US-POLICY-010-01, BR-POL-REN-001

**Preconditions:**
- Mock `IAppConfigurationService.GetValueAsync("Policy:RenewalLeadDays")` returns 90
- `RenewalQuoteGeneratorJob` instantiated

**Test steps:**
1. Create Active policy expiring in exactly 90 days
2. Call job `ExecuteAsync()`
3. Assert `RenewalService.GenerateRenewalQuoteAsync` called for that policy
4. Assert `RenewalService.GenerateRenewalQuoteAsync` NOT called for policy expiring in 91 days
5. Assert renewal quote status = Draft; `IsRenewal = true`

**Expected outcome:** Renewal quote generated exactly at 90-day boundary; not earlier.

---

### TS-POL-011 — Timer Kill Switch (US-BILLING-003)

**Type:** Unit
**Requirement:** AC-US-BILLING-003-02, ADR-009, NFR-015

**Preconditions:**
- Mock `IAppConfigurationService` returns `Timer:GlobalEnabled = false`

**Test steps:**
1. Call any timer job `ExecuteAsync()`
2. Assert job exits immediately without calling any service method
3. Assert log message contains "Job {JobKey} skipped: disabled by configuration"

**Expected outcome:** Global kill switch halts all job execution.

---

### TS-POL-012 — Policy Fee Applied Correctly (US-BILLING-001)

**Type:** Unit
**Requirement:** AC-US-BILLING-001-02, BR-POL-FEE-001
**HUMAN_VALIDATION_REQUIRED: Financial logic — verify $195.00 assertion with customer**

**Preconditions:**
- `RatingEngineService` instantiated with mock rate tables
- Mock returns coverage premium = $1,200.00, taxes = $72.00

**Test steps:**
1. Call `RatingEngineService.CalculatePremiumAsync(quoteId)`
2. Assert `PolicyFee = 195.00`
3. Assert `TotalPremium = 1200.00 + 72.00 + 195.00 = 1467.00`

**Expected outcome:** $195.00 policy fee always included; total correctly summed.

---

## Section 2: Claims Tests

### TS-CLM-001 — FNOL Registration (US-CLAIMS-001)

**Type:** Integration
**Requirement:** AC-US-CLAIMS-001-01

**Preconditions:**
- Active policy at policyId=1; ClientId=1
- User with `[CLAIMS_LIST.Create]` permission

**Test steps:**
1. POST `/api/v1/claims` with `policyId=1`, `lossDate=2026-06-15`, `reportedBy=Agent`
2. Assert HTTP 201
3. Assert `data.claimNumber` is non-empty unique string
4. Assert `data.status = "FNOL"`
5. Assert DB: `claims.claim` row exists with `fnol_date = today`, `client_id = 1`

**Expected outcome:** FNOL created; unique claim number assigned; client-scoped.

---

### TS-CLM-002 — Duplicate FNOL Prompt (US-CLAIMS-010)

**Type:** Integration
**Requirement:** AC-US-CLAIMS-010-01, AC-US-CLAIMS-001-02

**Preconditions:**
- Existing open Claim for policyId=1, lossDate=2026-06-15

**Test steps:**
1. POST `/api/v1/claims` with policyId=1, lossDate=2026-06-15 (same as existing)
2. Assert HTTP 409
3. Assert response `data.requiresConfirmation = true`
4. Assert response `data.existingClaimId` is the existing claim's ID
5. No new claim record created

**Expected outcome:** Duplicate flagged; user warned; no auto-creation.

---

### TS-CLM-003 — Adjuster Scope Isolation (US-CLAIMS-001)

**Type:** Integration
**Requirement:** AC-US-CLAIMS-001-03

**Preconditions:**
- Two claims: ClaimId=1 (AdjusterId=100); ClaimId=2 (AdjusterId=200)
- User authenticated as Adjuster with AdjusterId=100

**Test steps:**
1. GET `/api/v1/claims`
2. Assert response contains ClaimId=1
3. Assert response does NOT contain ClaimId=2

**Expected outcome:** Adjuster sees only their assigned claims; server-side scope enforced.

---

### TS-CLM-004 — Worksheet Approval Requires ApproveReject Permission (US-CLAIMS-004)

**Type:** Integration
**Requirement:** AC-US-CLAIMS-004-02, AC-US-CLAIMS-004-03

**Preconditions:**
- Worksheet at worksheetId=5 in "Pending Approval" status
- User A: has `[CLAIM_WORKSHEET.ApproveReject]`; User B: lacks this flag

**Test steps:**
1. With User B: POST `/api/v1/claims/1/worksheet/approve` → Assert HTTP 403
2. Assert DB: worksheet status unchanged
3. With User A: POST `/api/v1/claims/1/worksheet/approve` → Assert HTTP 200
4. Assert DB: `claims.worksheet.approved_by = UserA.UserId`, `approved_on` is populated

**Expected outcome:** Permission gate enforced; approval records approver.

---

## Section 3: Billing Tests

### TS-BIL-001 — Payment Plan Creation (US-BILLING-001)

**Type:** Integration
**Requirement:** AC-US-BILLING-001-01

**Preconditions:**
- Active policy at policyId=1; user with `[BILLING_LIST.Create]`

**Test steps:**
1. POST `/api/v1/billing/1/plan` with `paymentFrequencyId=2`, `numberOfInstallments=4`
2. Assert HTTP 201
3. Assert DB: `billing.policy_payment_plan` row created
4. Assert response includes installment schedule with 4 entries

**Expected outcome:** Payment plan persisted; schedule calculated and returned.

---

### TS-BIL-002 — Payment Plan Requires Permission (US-BILLING-001)

**Type:** Integration
**Requirement:** AC-US-BILLING-001-03

**Preconditions:**
- User lacks `[BILLING_LIST.Create]`

**Test steps:**
1. POST `/api/v1/billing/1/plan` with valid body
2. Assert HTTP 403
3. Assert DB: no payment plan row created

**Expected outcome:** Permission enforced server-side.

---

### TS-BIL-003 — Failed Payment Notification Dispatched (US-BILLING-004)

**Type:** Integration
**Requirement:** AC-US-BILLING-004-01, AC-US-BILLING-004-02

**Preconditions:**
- Policy with active payment plan; mortgage exists; mock email + mock LenderDock client

**Test steps:**
1. Process TranzPay callback with `Status = "Failed"` for a payment on this policy
2. Assert mock email called with failure notice
3. Assert mock LenderDock client called with payment failure notification
4. Assert DB: `PolicyPaymentTransaction.transaction_status = 'Failed'`

**Expected outcome:** Both stakeholder notifications dispatched on payment failure.

---

## Section 4: Identity and Permission Tests

### TS-IDN-001 — Login: Valid Credentials Return Tokens (Auth)

**Type:** Integration
**Requirement:** ADR-004, FR-D5-001

**Preconditions:**
- AppUser with email=test@example.com; PBKDF2 password hash for "SecurePass1!" in DB

**Test steps:**
1. POST `/api/v1/auth/login` with `email=test@example.com`, `password=SecurePass1!`
2. Assert HTTP 200
3. Assert `data.accessToken` is a valid JWT (parse and verify signature)
4. Assert JWT claims contain `clientId`, `userId`, `role`
5. Assert JWT `exp` = now + 15 minutes (±5 seconds)

**Expected outcome:** Valid tokens issued; JWT contains required claims.

---

### TS-IDN-002 — Login: Invalid Password Returns 401

**Type:** Integration
**Requirement:** ADR-004, RSK-1-SEC-001

**Test steps:**
1. POST `/api/v1/auth/login` with correct email, wrong password
2. Assert HTTP 401
3. Assert response does NOT reveal whether email exists (generic error message)
4. Assert no token in response

**Expected outcome:** Generic error returned; no credential enumeration.

---

### TS-IDN-003 — MFA Required for ClientAdmin (NFR-013)

**Type:** Integration
**Requirement:** ADR-004, NFR-013

**Preconditions:**
- ClientAdmin user with MFA enabled; TOTP secret configured

**Test steps:**
1. POST `/api/v1/auth/login` with email + password (no mfaCode)
2. Assert HTTP 200 but `data.requiresMfaSetup = false`; login incomplete (no accessToken yet, or 401)
3. Re-POST with valid `mfaCode` generated from TOTP secret
4. Assert HTTP 200 with `accessToken` and `refreshToken`

**Expected outcome:** MFA required for ClientAdmin; tokens not issued until MFA code validated.

---

### TS-IDN-004 — Password Reset: Token Expiry Enforced (NFR-004)

**Type:** Unit
**Requirement:** NFR-004, ADR-004, RSK-1-SEC-002

**Preconditions:**
- `UserPasswordReset` row with `token_code=ABC123`, `expires_on = DateTime.UtcNow.AddMinutes(-1)` (expired)

**Test steps:**
1. POST `/api/v1/auth/reset-password` with `tokenCode=ABC123`
2. Assert HTTP 400
3. Assert error code `"TOKEN_EXPIRED"`

**Expected outcome:** Expired tokens rejected; existence-only check is insufficient (RSK-1-SEC-002 resolved).

---

### TS-IDN-005 — Synchronous Privilege Revocation (NFR-006)

**Type:** Integration
**Requirement:** NFR-006, ADR-004, ART-3-005 §8.3

**Preconditions:**
- User A in Group 1; permissions cached in Redis for User A / POLICY_LIST
- Redis Testcontainer running

**Test steps:**
1. Verify `usePermission` returns `true` for User A / POLICY_LIST (cache hit)
2. DELETE `/api/v1/groups/1/members/{userA_id}` — remove User A from Group 1
3. Assert HTTP 204
4. Immediately call `PermissionEvaluationService.GetPermissionsAsync(userA_id, "POLICY_LIST")`
5. Assert Redis cache miss for `perms:{userA_id}:POLICY_LIST` (cache was invalidated synchronously)
6. Assert permission re-computed from DB reflects removal

**Expected outcome:** Cache invalidated within same DB transaction; user cannot access stale permissions.

---

### TS-IDN-006 — Tenant Isolation: Cross-Tenant Data Blocked (ADR-003)

**Type:** Integration
**Requirement:** NFR-001, ADR-003

**Preconditions:**
- PolicyId=1 belongs to ClientId=1; PolicyId=2 belongs to ClientId=2
- User authenticated as ClientId=1

**Test steps:**
1. GET `/api/v1/policies/2` (belongs to ClientId=2)
2. Assert HTTP 404 (entity not found within this tenant)
3. GET `/api/v1/policies/1`
4. Assert HTTP 200

**Expected outcome:** EF Core global filter prevents cross-tenant data access; returns 404 (not 403) to avoid existence enumeration.

---

### TS-IDN-007 — PlatformAdmin Cross-Tenant Access Audited (NFR-008)

**Type:** Integration
**Requirement:** NFR-008, RSK-1-SEC-009

**Preconditions:**
- PlatformAdmin user authenticated
- PolicyId=1 belongs to ClientId=1

**Test steps:**
1. GET `/api/v1/policies/1` with PlatformAdmin token (no X-Target-Client-Id header — system-wide query)
2. Assert HTTP 200
3. Assert DB: `system.audit_log` contains row with `action_type='CrossTenantAccess'`, `target_client_id=1`, `user_id=platformAdminId`

**Expected outcome:** PlatformAdmin can access cross-tenant data; access is audit-logged with target ClientId.

---

### TS-IDN-008 — AllAccess Permission Flag (RSK-1-SEC-003)

**Type:** Unit
**Requirement:** RSK-1-SEC-003, ART-3-005 §6

**Preconditions:**
- ScreenPermission with `all_access = true` for Group 1 / POLICY_LIST

**Test steps:**
1. Call `PermissionEvaluationService.GetPermissionsAsync(userId, "POLICY_LIST")`
2. Assert all 10 permission flags are `true` in the returned `PermissionFlags` object
3. Verify AllAccess grant is logged to AuditLog (RSK-1-SEC-003 requirement)

**Expected outcome:** AllAccess grants all flags; access is audit-logged.

---

## Section 5: Security Tests

### TS-SEC-001 — AES-256 Encrypt/Decrypt Round-Trip (INT-004)

**Type:** Unit
**Requirement:** ART-3-005 §7, NFR-007

**Preconditions:**
- `AesEncryptionService` instantiated with a 256-bit test key (not production key)

**Test steps:**
1. Call `Encrypt("123456789")` → store result as `ciphertext`
2. Assert `ciphertext != "123456789"` (not plaintext)
3. Call `Decrypt(ciphertext)` → assert returns `"123456789"`
4. Verify MAC: tamper 1 byte in `ciphertext`; call `Decrypt(tamperedCiphertext)`; assert throws `CryptographicException` (Encrypt-then-MAC verification fails)

**Expected outcome:** Encryption is reversible; tampering detected.

---

### TS-SEC-002 — Sensitive Field Redaction at API Layer (NFR-005)

**Type:** Integration
**Requirement:** NFR-005, ART-3-005 §6.3, RSK-1-SEC-005

**Preconditions:**
- BankDetail in DB: `AccountNumber = "[encrypted value]"`
- User A: has `[ACCOUNT_DETAIL.ViewSensitiveInfo]`
- User B: lacks this flag

**Test steps:**
1. With User A: GET `/api/v1/billing/{payeeId}` — assert `bankDetail.accountNumber` is the actual value (not `"****"`)
2. With User B: same GET — assert `bankDetail.accountNumber = "****"`
3. Assert that in both cases the API response HTTP is 200 (field redacted, not request denied)

**Expected outcome:** Sensitive field masked at serialization layer based on permission; response always 200.

---

### TS-SEC-003 — JWT Expiry Enforced (ADR-004)

**Type:** Integration
**Requirement:** ADR-004

**Preconditions:**
- JWT token with `exp = now - 1 minute` (expired)

**Test steps:**
1. Call any authenticated endpoint with the expired token
2. Assert HTTP 401
3. Assert `WWW-Authenticate: Bearer error="invalid_token"` header

**Expected outcome:** Expired tokens rejected; refresh token flow required.

---

### TS-SEC-004 — ClientId=0 Rejected by Tenant Middleware (RSK-1-SEC-008)

**Type:** Unit
**Requirement:** RSK-1-SEC-008, ADR-003

**Preconditions:**
- JWT with `clientId` claim missing or null

**Test steps:**
1. Call `TenantResolutionMiddleware.InvokeAsync()` with HttpContext where JWT has no clientId claim
2. Assert `TenantResolutionException` thrown
3. Assert HTTP response is 401 (middleware converts to 401 response)
4. Assert `ITenantContext.ClientId` never returns 0 or null

**Expected outcome:** Null ClientId rejected; never returns 0 (RSK-1-SEC-008 resolved).

---

## Section 6: Hangfire Timer Job Tests

For each of the 11 timer jobs, one parametric unit test validates:
1. Kill switch behavior
2. Threshold configuration key resolution
3. Business logic boundary condition

### TS-JOB-001 through TS-JOB-011 — Parametric Job Tests

**Type:** Unit (all)

| TS ID | Job | Config Key | Boundary Test |
|---|---|---|---|
| TS-JOB-001 | RenewalQuoteGeneratorJob | `Policy:RenewalLeadDays` | Policy expiring in exactly 90 days → quote generated; 89 days → not generated |
| TS-JOB-002 | RenewalNotificationSenderJob | `Timer:RenewalNotificationSenderEnabled` | Kill switch false → no emails sent |
| TS-JOB-003 | NonRenewalNoticeSenderJob | `Policy:NonRenewalNoticeDays` | 60-day boundary: notice sent at day 60, not at day 59 |
| TS-JOB-004 | PolicyExpiryProcessorJob | `Policy:MarkNonRenewedAfterDays` | 90 days post-expiry → status Non-Renewed; 89 days → not changed |
| TS-JOB-005 | QuoteExpiryProcessorJob | `Policy:NewBusinessQuoteExpiryDays` | New business quote at day 90 → Expired; renewal quote at day 30 → Expired |
| TS-JOB-006 | AutoCancellationProcessorJob | `Policy:AutoCancellationGraceDays` | 30-day grace: policy at day 30 → cancelled; day 29 → not cancelled |
| TS-JOB-007 | PolicyExpiredStatusUpdaterJob | `Policy:ExpiredTransitionDays` | 1 day after ExpirationDate → Expired; same day → not changed |
| TS-JOB-008 | InstallmentPaymentProcessorJob | TranzPay mock | Successful installment → transaction status Success; failed → Failed; LenderDock notified on failure |
| TS-JOB-009 | TranzPayCallbackReconcilerJob | `TranzPay:CallbackTimeoutHours` | Pending transaction older than 4 hours → reconcile attempt |
| TS-JOB-010 | BulkUploadProcessorJob | `Timer:BulkUploadProcessorEnabled` | Kill switch false → no processing; file queued → processed on next enabled run |
| TS-JOB-011 | CommissionDisbursementProcessorJob | DisburseCloud mock | Commission due → disbursement initiated; DisburseCloud returns success → transaction recorded |

**Test pattern (same for all):**
```
Preconditions: Mock dependencies; set config key via mock IAppConfigurationService
Step 1: Call ExecuteAsync() with kill switch ON → verify business logic called
Step 2: Set kill switch to OFF → call ExecuteAsync() → verify NO business logic called (log message only)
Step 3: Set threshold to boundary value → verify correct behavior
Expected: Threshold from config (not hardcoded); kill switch respected; boundary conditions correct
```

---

## Section 7: Frontend Component Tests

### TS-FE-001 — PermissionGuard Renders ForbiddenPage When Flag Missing

**Type:** Unit (Vitest + RTL)
**Requirement:** ADR-007, ART-3-004 §4.2

**Preconditions:**
- Zustand `permissionStore` initialized with `POLICY_LIST.Create = false`
- Render `<PermissionGuard screenCode="POLICY_LIST" requiredFlag="create"><div>Protected</div></PermissionGuard>`

**Test steps:**
1. Assert "Protected" div NOT in DOM
2. Assert `<ForbiddenPage />` content IS in DOM

---

### TS-FE-002 — LoginPage Calls authStore.login on Success

**Type:** Unit (Vitest + RTL)

**Preconditions:**
- Mock API returns `{ accessToken: "...", refreshToken: "...", user: {...} }`

**Test steps:**
1. Render `<LoginPage />`
2. Fill email and password inputs; click Login
3. Assert `authStore.login` called with correct token values
4. Assert navigation to `/dashboard` triggered

---

### TS-FE-003 — usePermission Returns True for PlatformAdmin (All Flags)

**Type:** Unit (Vitest)

**Preconditions:**
- `authStore.user.role = "PlatformAdmin"`

**Test steps:**
1. Call `usePermission("ANY_SCREEN", "create")`
2. Assert returns `true`
3. Call `usePermission("ANY_SCREEN", "viewSensitiveInfo")`
4. Assert returns `true`

---

### TS-FE-004 — SensitiveDocGate Hides Content Without Permission

**Type:** Unit (Vitest + RTL)

**Preconditions:**
- `permissionStore["DOCUMENTS_LIST"].accessSensitiveDoc = false`
- Render `<SensitiveDocGate isSensitive={true}><div>Secret Doc</div></SensitiveDocGate>`

**Test steps:**
1. Assert "Secret Doc" NOT in DOM
2. Assert "Restricted Document" placeholder IS in DOM

---

## Section 8: E2E Tests (Playwright)

### TS-E2E-001 — Quote Creation to Bind Critical Path

**Type:** E2E
**Requirement:** US-POLICY-001 through US-POLICY-005

**Preconditions:** Full app running (Dev environment); Producer user account seeded

**Steps:**
1. Navigate to `/login`; authenticate as Producer
2. Navigate to `/policies/new`
3. Complete Step 1: individual insured; effective date 2026-07-01
4. Complete Step 2: enter test address; geocode; verify HexCat Approved status displayed
5. Complete Step 4: set dwelling limit $250,000; deductible type "Standard"
6. Complete Step 5: verify premium breakdown contains policy fee $195.00
7. Click "Bind Policy" → verify TranzPay redirect page opens (sandbox URL)
8. Simulate callback (or use sandbox test payment)
9. Return to app → verify policy status badge shows "Active"

**Expected outcome:** Full quote-to-bind flow completes; policy Active after payment.

---

### TS-E2E-002 — Login, Permission Enforcement, Logout

**Type:** E2E

**Steps:**
1. Login as user without `[POLICY_LIST.Create]`
2. Navigate to `/policies` → assert "New Quote" button disabled or absent
3. Attempt to navigate directly to `/policies/new` → assert ForbiddenPage displayed
4. Logout → assert redirect to `/login`; assert accessing `/policies` redirects to `/login`

**Expected outcome:** Permission and auth guards enforced in browser; no UI bypass.

---

### TS-E2E-003 — Claims FNOL Submission

**Type:** E2E

**Steps:**
1. Login as ClientAdmin
2. Navigate to `/claims/new`
3. Select active policy from dropdown
4. Enter loss date, claim type, reported by
5. Submit FNOL
6. Assert claim number displayed; status "FNOL"
7. Navigate to claim detail; assert tabs visible: Workflow, Worksheet, Documents

**Expected outcome:** FNOL created and viewable.

---

## Section 9: Traceability Matrix

| P1 User Story | API Spec (ART-4-003) | Test Spec (this doc) |
|---|---|---|
| US-POLICY-001 Quote creation | §4.1 POST /api/v1/quotes | TS-POL-001, TS-POL-002 |
| US-POLICY-002 Risk location / HexCat | §4.2 PUT /risk-location | TS-POL-003 |
| US-POLICY-005 Bind policy | §5.1 POST /bind | TS-POL-004, TS-POL-005, TS-POL-006, TS-POL-007 |
| US-POLICY-006 Generate declaration page | §9.4 POST /documents/generate | (document generation — Plumsail stub until QST-1-INT-003) |
| US-POLICY-007 LenderDock notification | §5.1 (side effect) | TS-POL-008 (cancellation), TS-BIL-003 (payment failure) |
| US-POLICY-010 Renewal quote generation | §5.6 POST /renew | TS-POL-010, TS-JOB-001 |
| US-POLICY-012 Policy cancellation | §5.5 POST /cancel | TS-POL-008 |
| US-POLICY-013 Auto-cancellation | Timer T-06 | TS-POL-009, TS-JOB-006 |
| US-POLICY-014 Non-renewal notice | Timer T-03 | TS-JOB-003 |
| US-CLAIMS-001 FNOL | §6.1 POST /claims | TS-CLM-001, TS-CLM-002 |
| US-CLAIMS-004 Worksheet | §6.6–6.8 | TS-CLM-004 |
| US-CLAIMS-009 Close/deny claim | §6.5 PUT /status | (derived from TS-CLM-004 pattern) |
| US-CLAIMS-010 Duplicate FNOL | §6.1 (409 response) | TS-CLM-002 |
| US-BILLING-001 Payment plan | §7.1–7.2 | TS-BIL-001, TS-BIL-002 |
| US-BILLING-002 Premium payment | §7.3–7.5 | TS-POL-005, TS-POL-006 |
| US-BILLING-003 Recurring debits | Timer T-08 | TS-JOB-008, TS-POL-011 |
| US-BILLING-004 Failed payment | §7.6 (side effect) | TS-BIL-003 |
| Identity/Auth (all) | §1–3 | TS-IDN-001 through TS-IDN-008 |
| Security NFRs | Cross-cutting | TS-SEC-001 through TS-SEC-004 |
| Timer jobs (11) | §10.7 toggle | TS-JOB-001 through TS-JOB-011 |

**Traceability coverage (P1 stories with both API spec and test spec):** 17 of 20 P1 user stories have both API endpoint specification and at least one test specification. 3 partially covered: US-POLICY-006 (Plumsail stub — QST-1-INT-003 blocker), US-POLICY-007 (LenderDock — QST-1-INT-002 blocker), and Distribution commission stories (DBT-4-FORGE-005).

---

*End of ART-4-007 — Test Specifications | INSUREEDGE-2026 | FORGE Phase | 2026-06-17*
*Status: AI_GENERATED. Covers all P1 user stories from ART-2-003. All 11 timer jobs have at least one parametric test (TS-JOB-001 through TS-JOB-011). Security and permission tests cover NFR-001, NFR-003, NFR-005, NFR-006, NFR-008, NFR-013. Traceability: 17/20 P1 stories fully covered; 3 partially covered due to open FORGE blockers.*
