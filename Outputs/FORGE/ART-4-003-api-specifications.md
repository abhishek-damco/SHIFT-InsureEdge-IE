# ART-4-003 — API Specifications
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Status:** AI_GENERATED
**Produced by:** Forge Agent
**Phase:** FORGE
**Date:** 2026-06-17
**Version:** 1.0
**Engagement:** INSUREEDGE-2026 | Customer: Hudson Bailey
**Architecture gate:** PASSED (DEC-3-0003, 2026-06-17)
**Primary inputs:** ART-2-003 (Acceptance Criteria), ART-3-005 §10 (API conventions), ART-3-004 §10 (frontend-backend contracts), ART-2-012 §1 (TranzPay contract), ADR-003 (multi-tenancy), ADR-004 (auth), ADR-006 (TranzPay)

> **Multi-tenancy rule (ADR-003):** `ClientId` is NEVER in the request body for any endpoint. It is resolved exclusively from the authenticated JWT claim by `TenantResolutionMiddleware`. Engineers must not add `clientId` as a request parameter.

> **Permission notation:** `[SCREEN_CODE.FLAG]` — e.g., `[POLICY_LIST.Create]` means the caller must have `IsCreatePermission = true` on the `POLICY_LIST` screen for their groups.

> **Response envelope:** All endpoints use the standard envelope format defined in ART-3-005 §10.2:
> ```json
> { "success": true, "data": { ... }, "errors": [], "meta": { "page": 1, "pageSize": 25, "totalCount": 143 } }
> ```

> **Base path:** All routes prefixed `/api/v1/`

---

## Section 1: Identity & Authentication

### 1.1 POST `/api/v1/auth/login`

**Summary:** Authenticate a user and obtain JWT access and refresh tokens.
**Permission:** Public (no auth required)
**Multi-tenancy:** ClientId resolved from User record post-authentication

**Request body:**
```yaml
LoginRequest:
  email:        string (required) — login identifier (FR-D5-001)
  password:     string (required)
  mfaCode:      string (optional) — required for PlatformAdmin and ClientAdmin roles (NFR-013)
```

**Response 200:**
```yaml
LoginResponse:
  accessToken:  string — JWT; 15-minute expiry
  refreshToken: string — 8-hour expiry (ASM-3-ARCH-003); single-use rotation
  user:
    userId:     integer
    userCode:   string — IE00XX format (FR-D5-003)
    email:      string
    role:       string — one of: PlatformAdmin | ClientAdmin | IntermediaryProducer | Adjuster | User
    clientId:   integer
    clientName: string
    clientConfig:
      systemTheme:  string
      language:     string
      dateFormat:   string
  requiresMfaSetup: boolean — true if MFA not yet configured for an MFA-required role
```

**Response 401:** Invalid credentials or MFA code
**Response 403:** Account locked (too many failed attempts)
**Response 422:** Validation errors (missing email/password)

---

### 1.2 POST `/api/v1/auth/refresh`

**Summary:** Obtain a new access token using a valid refresh token.
**Permission:** Public (refresh token is the credential)

**Request body:**
```yaml
RefreshRequest:
  refreshToken: string (required)
```

**Response 200:** `{ accessToken: string }`
**Response 401:** Refresh token invalid, expired, or already used (rotation on use)

---

### 1.3 POST `/api/v1/auth/logout`

**Summary:** Invalidate the current refresh token.
**Permission:** Authenticated

**Request body:**
```yaml
LogoutRequest:
  refreshToken: string (required)
```

**Response 204:** No content — token invalidated

---

### 1.4 GET `/api/v1/auth/permissions`

**Summary:** Load the full permission map for the authenticated user (all screens and flags for all their groups).
**Permission:** Authenticated (any role)
**Caching:** Redis-cached per user; cache invalidated synchronously on group membership change (NFR-006)

**Response 200:**
```yaml
Record<screenCode, PermissionFlags>:
  # Example:
  POLICY_LIST:
    view: true
    create: true
    edit: false
    approveReject: false
    duplicate: false
    upload: true
    download: true
    viewSensitiveInfo: false
    accessSensitiveDoc: false
    allAccess: false
```

---

### 1.5 POST `/api/v1/auth/forgot-password`

**Summary:** Request a password reset token (30-minute expiry, max 2 valid tokens per 30-minute window).
**Permission:** Public

**Request body:**
```yaml
ForgotPasswordRequest:
  email: string (required)
```

**Response 202:** Accepted (token dispatched via email — always returns 202 regardless of email existence to prevent enumeration)

---

### 1.6 POST `/api/v1/auth/reset-password`

**Summary:** Reset password using the emailed token code + new password.
**Permission:** Public

**Request body:**
```yaml
ResetPasswordRequest:
  email:       string (required)
  tokenCode:   string (required) — must match AND not be expired (NFR-004, RSK-1-SEC-002)
  newPassword: string (required) — min 8 chars, complexity rules
```

**Response 200:** Password reset successful
**Response 400:** Token invalid, expired, or code mismatch
**Response 422:** Validation errors

---

### 1.7 POST `/api/v1/auth/mfa/setup`

**Summary:** Generate a TOTP QR code and secret for MFA enrollment.
**Permission:** Authenticated (MFA-required roles only)

**Response 200:**
```yaml
MfaSetupResponse:
  qrCodeUri:   string — otpauth:// URI for QR display
  manualCode:  string — base32 secret for manual entry
```

---

### 1.8 POST `/api/v1/auth/mfa/verify`

**Summary:** Verify a TOTP code to complete MFA enrollment.
**Permission:** Authenticated

**Request body:**
```yaml
MfaVerifyRequest:
  code: string (required) — 6-digit TOTP
```

**Response 200:** MFA enabled
**Response 400:** Invalid code

---

## Section 2: User Management

### 2.1 GET `/api/v1/users`

**Permission:** `[USER_LIST.View]`
**Pagination:** `?page=1&pageSize=25`
**Filters:** `?search=string&role=string&isActive=bool`

**Response 200:** Paginated list of `UserSummaryDto` (userId, userCode, email, firstName, lastName, role, isActive, groupCount)

---

### 2.2 GET `/api/v1/users/{userId}`

**Permission:** `[USER_LIST.View]`

**Response 200:** Full `UserDto` including group memberships
**Response 404:** User not found in tenant

---

### 2.3 POST `/api/v1/users`

**Summary:** Create a new user. System generates UserCode (IE00XX).
**Permission:** `[USER_LIST.Create]`

**Request body:**
```yaml
CreateUserRequest:
  email:          string (required, unique per ClientId)
  firstName:      string (required)
  lastName:       string (required)
  phone:          string (optional)
  role:           string (required)
  intermediaryId: integer (required if role = IntermediaryProducer)
  adjusterId:     integer (required if role = Adjuster)
```

**Response 201:** Created `UserDto` with generated UserCode
**Response 409:** Email already exists for this tenant
**Response 422:** Validation errors (missing required fields, invalid role)

---

### 2.4 PUT `/api/v1/users/{userId}`

**Permission:** `[USER_LIST.Edit]`

**Request body:** `UpdateUserRequest` (same fields as CreateUserRequest; email and role changes require special handling)

**Response 200:** Updated `UserDto`

---

### 2.5 DELETE `/api/v1/users/{userId}`

**Summary:** Soft-delete (sets IsActive = false). Does not hard-delete for audit trail integrity (NFR-008).
**Permission:** `[USER_LIST.Edit]`

**Response 204:** User deactivated

---

## Section 3: Group Management

### 3.1 GET `/api/v1/groups`

**Permission:** `[USER_GROUP_PAGE.View]`

**Response 200:** Paginated list of groups for the tenant

---

### 3.2 GET `/api/v1/groups/{groupId}`

**Permission:** `[USER_GROUP_PAGE.View]`

**Response 200:** `GroupDto` including members and screen permissions (10-flag matrix)

---

### 3.3 POST `/api/v1/groups`

**Permission:** `[USER_GROUP_PAGE.Create]`

**Request body:**
```yaml
CreateGroupRequest:
  groupName:    string (required)
  groupEmail:   string (optional)
  groupLeaderId: integer (optional)
```

**Response 201:** Created `GroupDto`

---

### 3.4 POST `/api/v1/groups/{groupId}/members`

**Summary:** Add a user to a group.
**Permission:** `[USER_GROUP_PAGE.Edit]`

**Request body:**
```yaml
AddMemberRequest:
  userId: integer (required)
```

**Response 201:** Member added
**Response 409:** User already in group

---

### 3.5 DELETE `/api/v1/groups/{groupId}/members/{userId}`

**Summary:** Remove a user from a group. Triggers synchronous Redis permission cache invalidation (NFR-006, ADR-004).
**Permission:** `[USER_GROUP_PAGE.Edit]`

**Response 204:** Member removed; permissions immediately revoked

---

### 3.6 PUT `/api/v1/groups/{groupId}/permissions`

**Summary:** Set the 10-flag screen permission matrix for this group.
**Permission:** `[USER_GROUP_PAGE.Edit]`

**Request body:**
```yaml
UpdateGroupPermissionsRequest:
  permissions:
    - screenCode:          string (required)
      isViewPermission:    boolean
      isCreatePermission:  boolean
      isEditPermission:    boolean
      isApproveReject:     boolean
      isDuplicatePermission: boolean
      isUploadPermission:  boolean
      isDownloadPermission: boolean
      isViewSensitiveInfo: boolean
      isAccessSensitiveDoc: boolean
      allAccess:           boolean
```

**Response 200:** Updated permission matrix

---

## Section 4: Policy — Quotes

### 4.1 POST `/api/v1/quotes`

**Summary:** Create a new quote (wizard Step 1 — Policy Information).
**Permission:** `[POLICY_LIST.Create]`

**Request body:**
```yaml
CreateQuoteRequest:
  effectiveDate:     string (ISO 8601 date, required)
  policyTermMonths:  integer (required, 12 or 6)
  insuredType:       string (required) — "Individual" | "Commercial"
  firstName:         string (required if Individual)
  lastName:          string (required if Individual)
  companyName:       string (required if Commercial)
  mailingAddress:    AddressDto (required)
  isAge65OrOlder:    boolean (required if Individual)
  intermediaryId:    integer (optional — defaults to caller's IntermediaryId)
  productId:         integer (required)
```

**Response 201:** `QuoteDto` (quoteId, policyNumber, status: "Draft", step: 1)
**Response 409:** Duplicate active policy at risk location (if pre-checked)
**Response 422:** Validation errors

---

### 4.2 PUT `/api/v1/quotes/{quoteId}/risk-location`

**Summary:** Submit risk location (Step 2 — triggers geocoding + HexCat evaluation).
**Permission:** `[POLICY_LIST.Create]`

**Request body:**
```yaml
RiskLocationRequest:
  addressLine1:  string (required)
  addressLine2:  string (optional)
  city:          string (required)
  state:         string (required, 2-char)
  zipCode:       string (required)
```

**Response 200:** `RiskLocationResult` (riskLocationId, latitude, longitude, hexCatStatus, hexZoneIdLower, hexZoneIdHigher, constructionType — read-only HexCat data)
**Response 422:** HexCat returned "Not Approved" — blocks progression (AC-US-POLICY-002-02)

> **DBT-4-FORGE-001 applies:** HexCat client is a stub until QST-1-INT-004 is resolved.

---

### 4.3 PUT `/api/v1/quotes/{quoteId}/coverage`

**Summary:** Set coverage limits and deductibles (Step 3).
**Permission:** `[POLICY_LIST.Create]`

**Request body:**
```yaml
CoverageRequest:
  dwellingLimit:        decimal (required) — HUMAN_VALIDATION_REQUIRED
  deductibleTypeId:     integer (required)
  coverageLevel:        string (required)
  additionalCoverages:  array of CoverageItemDto
  mortgagees:           array of MortgageeDto (optional)
  additionalInsureds:   array of AdditionalInsuredDto (optional)
```

**Response 200:** Updated quote with calculated `PremiumBreakdownDto` (riskPremium, coveragePremium, taxes, policyFee: 195.00, totalPremium)

---

### 4.4 GET `/api/v1/quotes`

**Permission:** `[POLICY_LIST.View]`
**Filters:** `?status=Draft&page=1&pageSize=25`
**Scope:** IntermediaryProducer sees only quotes for their IntermediaryId (AC-US-POLICY-001-04)

**Response 200:** Paginated `QuoteSummaryDto` list

---

### 4.5 GET `/api/v1/quotes/{quoteId}`

**Permission:** `[POLICY_LIST.View]`

**Response 200:** Full `QuoteDto` with all step data

---

## Section 5: Policy — Lifecycle

### 5.1 POST `/api/v1/policies/{policyId}/bind`

**Summary:** Bind a quote. Initiates TranzPay hosted payment redirect. Policy transitions to Active upon payment callback success.
**Permission:** `[POLICY_LIST.Create]`

**Request body:**
```yaml
BindPolicyRequest:
  paymentMethodType: string (required) — "ACH" | "CC"
  billingAddress:    AddressDto (required)
  billingName:       string (required)
  email:             string (required)
  phone:             string (required)
  vaultCustomerId:   string (optional) — existing vault token for returning payer
```

**Response 200:**
```yaml
BindInitiatedResponse:
  redirectUrl:      string — TranzPay hosted page URL (PLACEHOLDER — key vault secret, ADR-006)
  thirdPartyCallId: string — correlation ID for callback polling
  status:           "PendingPayment"
```

**Response 409:** Duplicate active policy at same risk location (AC-US-POLICY-005-03)
**Response 422:** Validation errors; required fields missing

> **HUMAN_VALIDATION_REQUIRED:** Payment initiation logic; TranzPay URL from Key Vault (GAP-2-INT-001 — production URL is a FORGE blocker).

---

### 5.2 GET `/api/v1/policies`

**Permission:** `[POLICY_LIST.View]`
**Filters:** `?status=Active&intermediaryId=n&page=1&pageSize=25`
**Scope:** IntermediaryProducer scoped to their IntermediaryId

**Response 200:** Paginated `PolicySummaryDto` list

---

### 5.3 GET `/api/v1/policies/{policyId}`

**Permission:** `[POLICY_LIST.View]`

**Response 200:** Full `PolicyDto` with coverage, premium, mortgages, risk location, transaction history

---

### 5.4 POST `/api/v1/policies/{policyId}/endorse`

**Summary:** Create a mid-term endorsement.
**Permission:** `[POLICY_LIST.Edit]`

**Request body:**
```yaml
EndorsementRequest:
  endorsementTypeId:    integer (required)
  effectiveDate:        string (ISO 8601, required)
  changedFields:        object (field name → new value)
  endorsementReason:    string (optional)
```

**Response 200:** `EndorsementDto` (endorsementQuoteId, premiumDiff, effectiveDate)

---

### 5.5 POST `/api/v1/policies/{policyId}/cancel`

**Summary:** Cancel a policy manually.
**Permission:** `[POLICY_LIST.Edit]`

**Request body:**
```yaml
CancellationRequest:
  cancellationDate:   string (ISO 8601, required)
  cancellationReason: string (required)
  isRewrite:          boolean (default false) — if true, initiates Cancel/Rewrite (BR-POL-CAN-004)
```

**Response 200:** `PolicyDto` with updated status: "Cancelled"
**Response 422:** Policy not in Active/Lapsed state; cannot cancel

---

### 5.6 POST `/api/v1/policies/{policyId}/renew`

**Summary:** Manually trigger renewal for a policy.
**Permission:** `[POLICY_LIST.Edit]`

**Response 201:** `PolicyDto` for the new renewal quote (status: "Draft", IsRenewal: true)

---

### 5.7 POST `/api/v1/policies/bulk-upload`

**Summary:** Upload a bulk policy file for batch processing.
**Permission:** `[POLICY_LIST.Upload]`

**Request body:** `multipart/form-data` with file field `uploadFile`

**Response 202:** `{ bulkUploadId: integer, status: "Queued", fileName: string }`

---

### 5.8 GET `/api/v1/policies/bulk-upload/{uploadId}/status`

**Permission:** `[POLICY_LIST.View]`

**Response 200:** `BulkUploadStatusDto` (processed, failed, pending, errors)

---

## Section 6: Claims

### 6.1 POST `/api/v1/claims`

**Summary:** Register a First Notice of Loss (FNOL).
**Permission:** `[CLAIMS_LIST.Create]`

**Request body:**
```yaml
CreateClaimRequest:
  policyId:     integer (required)
  claimTypeId:  integer (required)
  lossDate:     string (ISO 8601, required)
  reportedBy:   string (required)
  description:  string (optional)
```

**Response 201:** `ClaimDto` (claimId, claimNumber, status: "FNOL", fnolDate)
**Response 409:** Potential duplicate — existing open claim for same policy + loss date (AC-US-CLAIMS-001-02); returns `{ requiresConfirmation: true, existingClaimId: n }`
**Response 422:** PolicyId not found or not Active

---

### 6.2 GET `/api/v1/claims`

**Permission:** `[CLAIMS_LIST.View]`
**Scope:** Adjuster role sees only their assigned claims (AC-US-CLAIMS-001-03)
**Filters:** `?status=Open&adjusterId=n&page=1&pageSize=25`

**Response 200:** Paginated `ClaimSummaryDto` list

---

### 6.3 GET `/api/v1/claims/{claimId}`

**Permission:** `[CLAIMS_LIST.View]`

**Response 200:** Full `ClaimDto` with coverages, worksheets, documents

---

### 6.4 PUT `/api/v1/claims/{claimId}/assign-adjuster`

**Permission:** `[CLAIMS_LIST.Edit]`

**Request body:**
```yaml
AssignAdjusterRequest:
  adjusterId: integer (required)
```

**Response 200:** Updated `ClaimDto`

---

### 6.5 PUT `/api/v1/claims/{claimId}/status`

**Summary:** Transition claim status (Close, Deny, Reopen).
**Permission:** `[CLAIMS_LIST.ApproveReject]`

**Request body:**
```yaml
UpdateClaimStatusRequest:
  status:             string (required) — "Closed" | "Denied" | "Open"
  dispositionReason:  string (required if Closed or Denied)
```

**Response 200:** Updated `ClaimDto`
**Response 422:** Invalid status transition

---

### 6.6 GET `/api/v1/claims/{claimId}/worksheet`

**Permission:** `[CLAIM_WORKSHEET.View]`

**Response 200:** `WorksheetDto` (reserves per coverage, total, status, payments)

---

### 6.7 POST `/api/v1/claims/{claimId}/worksheet`

**Permission:** `[CLAIM_WORKSHEET.Create]`

**Request body:**
```yaml
CreateWorksheetRequest:
  reserves:
    - coverageTypeId: integer
      reserveAmount:  decimal  — HUMAN_VALIDATION_REQUIRED
```

**Response 201:** Created `WorksheetDto`

---

### 6.8 POST `/api/v1/claims/{claimId}/worksheet/approve`

**Permission:** `[CLAIM_WORKSHEET.ApproveReject]`

**Response 200:** Worksheet status updated to "Approved"; approvedBy and approvedOn populated

---

### 6.9 POST `/api/v1/claims/{claimId}/worksheet/payments`

**Summary:** Add a disbursement payment to the worksheet.
**Permission:** `[CLAIM_WORKSHEET.Create]`

**Request body:**
```yaml
WorksheetPaymentRequest:
  payeeId:         integer (required)
  amount:          decimal (required) — HUMAN_VALIDATION_REQUIRED
  paymentMethodId: integer (required)
```

**Response 201:** `WorksheetPaymentDto`; DisburseCloud disbursement initiated if disbursement method

---

## Section 7: Billing & Payments

### 7.1 GET `/api/v1/billing/{policyId}/plan`

**Permission:** `[BILLING_LIST.View]`

**Response 200:** `PaymentPlanDto` (frequency, installments, schedule, outstanding balance)

---

### 7.2 POST `/api/v1/billing/{policyId}/plan`

**Permission:** `[BILLING_LIST.Create]`

**Request body:**
```yaml
CreatePaymentPlanRequest:
  paymentFrequencyId:    integer (required)
  numberOfInstallments:  integer (required)
  responsibleParty:      string (optional)
```

**Response 201:** `PaymentPlanDto` with installment schedule — HUMAN_VALIDATION_REQUIRED (financial calculation)

---

### 7.3 POST `/api/v1/billing/{policyId}/payment/initiate`

**Summary:** Initiate TranzPay hosted payment redirect.
**Permission:** `[BILLING_LIST.Create]`

**Request body:**
```yaml
InitiatePaymentRequest:
  amount:            decimal (required) — HUMAN_VALIDATION_REQUIRED
  paymentType:       string (required) — "ACH" | "CC"
  billingNameFirst:  string (required)
  billingNameLast:   string (required)
  billingAddress:    AddressDto (required)
  email:             string (required)
  phoneNumber:       string (required)
  vaultCustomerId:   string (optional)
```

**Response 200:**
```yaml
PaymentInitiatedResponse:
  redirectUrl:      string — TranzPay hosted page URL (from Key Vault, ADR-006)
  thirdPartyCallId: string — polling correlation ID
```

> **HUMAN_VALIDATION_REQUIRED — TranzPay integration. Production URL is GAP-2-INT-001 FORGE blocker.**

---

### 7.4 GET `/api/v1/billing/payment/status/{thirdPartyCallId}`

**Summary:** Poll for TranzPay callback result after hosted redirect.
**Permission:** Authenticated

**Response 200:** `{ status: "Pending" | "Success" | "Failed", transactionId: integer? }`

---

### 7.5 POST `/api/webhooks/tranzpay/callback`

**Summary:** TranzPay asynchronous callback endpoint (PostBackUrl). Idempotent on `ThirdPartyCallID`.
**Permission:** None — validated by IP allowlist and payload structure (ADR-006)

**Request body:** TranzPay callback payload (per EV-0-0232 contract — ThirdPartyCallID, Status, ReferenceId, etc.)

**Response 200:** Always 200 to prevent provider retries. Processing is asynchronous.

---

### 7.6 GET `/api/v1/billing/{policyId}/transactions`

**Permission:** `[BILLING_LIST.View]`

**Response 200:** Paginated `TransactionDto` list

---

### 7.7 POST `/api/v1/billing/{policyId}/refund`

**Summary:** Initiate a refund via TranzPay.
**Permission:** `[BILLING_LIST.ApproveReject]`

> **HUMAN_VALIDATION_REQUIRED — Financial. TranzPay refund API contract pending confirmation (GAP-2-INT-002, DBT-3-ARCH-002).**

**Request body:**
```yaml
RefundRequest:
  transactionId:  integer (required)
  amount:         decimal (required) — HUMAN_VALIDATION_REQUIRED
  reason:         string (required)
```

**Response 202:** Refund request submitted; status returned asynchronously via callback

---

## Section 8: Distribution Management

### 8.1 GET `/api/v1/distribution/intermediaries`

**Permission:** `[DISTRIBUTION.View]`
**Scope:** IntermediaryProducer sees only their own Intermediary

**Response 200:** Paginated `IntermediarySummaryDto` list

---

### 8.2 GET `/api/v1/distribution/intermediaries/{intermediaryId}`

**Permission:** `[DISTRIBUTION.View]`

**Response 200:** Full `IntermediaryDto` with producers and commission rates — HUMAN_VALIDATION_REQUIRED (CommissionPercentage)

---

### 8.3 POST `/api/v1/distribution/intermediaries`

**Permission:** `[DISTRIBUTION.Create]`

**Request body:**
```yaml
CreateIntermediaryRequest:
  intermediaryCode:     string (required)
  companyName:          string (required)
  contactName:          string (optional)
  email:                string (optional)
  phone:                string (optional)
  intermediaryTypeId:   integer (optional)
  commissionPercentage: decimal (optional) — HUMAN_VALIDATION_REQUIRED
```

**Response 201:** Created `IntermediaryDto`

---

### 8.4 PUT `/api/v1/distribution/intermediaries/{intermediaryId}`

**Permission:** `[DISTRIBUTION.Edit]`

**Response 200:** Updated `IntermediaryDto`

---

### 8.5 POST `/api/v1/distribution/intermediaries/{intermediaryId}/producers`

**Permission:** `[DISTRIBUTION.Create]`

**Request body:**
```yaml
CreateProducerRequest:
  firstName:     string (required)
  lastName:      string (required)
  licenseNumber: string (optional)
  stateCode:     string (optional)
  email:         string (optional)
```

**Response 201:** Created `ProducerDto`

---

### 8.6 GET `/api/v1/distribution/commissions`

**Permission:** `[DISTRIBUTION.View]`

**Response 200:** Paginated `CommissionDto` list (policy, intermediary, rate, amount)

---

### 8.7 GET `/api/v1/distribution/disbursements`

**Permission:** `[DISTRIBUTION.View]`

**Response 200:** Paginated `DisbursementDto` list with DisburseCloud status

---

## Section 9: Document Management

### 9.1 GET `/api/v1/documents`

**Permission:** `[DOCUMENTS_LIST.View]`
**Filters:** `?policyId=n&claimId=n&documentTypeId=n`

**Response 200:** Paginated `DocumentSummaryDto` list (documentId, type, name, uploadedOn, isSensitive)

---

### 9.2 GET `/api/v1/documents/{documentId}/download`

**Summary:** Generate time-limited SAS token for document download.
**Permission:** `[DOCUMENTS_LIST.Download]` AND if `IsSensitive = true`: `[DOCUMENTS_LIST.AccessSensitiveDoc]`

**Response 200:**
```yaml
DownloadResponse:
  sasUrl:    string — Azure Blob SAS URL (15-minute expiry, ART-3-004 §10)
  fileName:  string
  expiresAt: string (ISO 8601)
```

**Response 403:** Insufficient permission (missing Download or AccessSensitiveDoc flag)

---

### 9.3 POST `/api/v1/documents/upload`

**Permission:** `[DOCUMENTS_LIST.Upload]`
**Content-Type:** `multipart/form-data`

**Form fields:**
```yaml
documentTypeId: integer (required)
policyId:       integer (optional — either policyId or claimId required)
claimId:        integer (optional)
file:           binary (required)
```

**Response 201:** `DocumentDto` with blobPath

---

### 9.4 POST `/api/v1/documents/generate`

**Summary:** Trigger Plumsail document generation (e.g., policy declaration page).
**Permission:** `[DOCUMENTS_LIST.Create]`

> **Note:** Plumsail API key is QST-1-INT-003 placeholder. This endpoint will return 503 until key is provisioned.

**Request body:**
```yaml
GenerateDocumentRequest:
  templateId:       string (required) — Plumsail template ID
  policyId:         integer (optional)
  claimId:          integer (optional)
  documentTypeId:   integer (required)
```

**Response 202:** Document generation initiated; available in documents list when complete

---

## Section 10: Administration

### 10.1 GET `/api/v1/admin/tenants`

**Permission:** PlatformAdmin role only
**Summary:** List all client tenants.

**Response 200:** Paginated `ClientSummaryDto` list

---

### 10.2 POST `/api/v1/admin/tenants`

**Permission:** PlatformAdmin role only

**Request body:**
```yaml
CreateTenantRequest:
  clientName:     string (required)
  clientCode:     string (required, unique)
  typeOfCompany:  string (optional)
  naicCode:       string (optional)
  systemTheme:    string (optional)
```

**Response 201:** Created `ClientDto` — provisioning is a single INSERT (ADR-003; no schema changes)

---

### 10.3 GET `/api/v1/admin/products`

**Permission:** PlatformAdmin role only

**Response 200:** List of all insurance products with active/inactive status

---

### 10.4 PUT `/api/v1/admin/products/{productId}/toggle`

**Permission:** PlatformAdmin role only

**Response 200:** Updated product IsActive state

---

### 10.5 GET `/api/v1/admin/configuration`

**Permission:** PlatformAdmin role only
**Summary:** Read all timer thresholds and feature flags from Azure App Configuration.

**Response 200:** Key-value map of all configuration entries

---

### 10.6 PUT `/api/v1/admin/configuration/{key}`

**Permission:** PlatformAdmin role only

**Request body:**
```yaml
UpdateConfigRequest:
  value: string (required)
```

**Response 200:** Updated configuration entry

---

### 10.7 POST `/api/v1/admin/timers/{timerKey}/toggle`

**Summary:** Enable or disable a specific Hangfire timer (kill switch per timer — NFR-015, ADR-009).
**Permission:** PlatformAdmin role only

**Request body:**
```yaml
ToggleTimerRequest:
  enabled: boolean (required)
```

**Response 200:** `{ timerKey: string, enabled: boolean, lastRun: string? }`

---

## Section 11: Geocoding Proxy

### 11.1 POST `/api/v1/geocoding/resolve`

**Summary:** Server-side geocoding proxy. Resolves address to coordinates. Google API key never exposed to client (ADR-010, NFR-020, RSK-1-SEC-010).
**Permission:** Authenticated

**Request body:**
```yaml
GeocodeRequest:
  addressLine1: string (required)
  city:         string (required)
  state:        string (required)
  zipCode:      string (required)
```

**Response 200:**
```yaml
GeocodeResponse:
  latitude:          decimal (9,6)
  longitude:         decimal (9,6)
  formattedAddress:  string
  isValid:           boolean
```

**Caching:** Results cached in Redis 30 days keyed on address hash (ART-3-005 §8.1)

---

## Section 12: DisburseCloud Webhook

### 12.1 POST `/api/webhooks/disburse/callback`

**Summary:** DisburseCloud disbursement result webhook.
**Permission:** None — idempotent on `disbursement_uuid` + event type (EV-0-0236, ADR-009)

**Response 200:** Always 200; processing asynchronous

---

## Standard Error Response

All error responses use the standard envelope:

```yaml
ErrorResponse:
  success: false
  data: null
  errors:
    - code:    string — machine-readable error code (e.g., "DUPLICATE_POLICY", "PERMISSION_DENIED")
      message: string — human-readable explanation
      field:   string? — field name if validation error
```

**HTTP Status Code Map:**

| Status | Usage |
|---|---|
| 400 | Bad request (malformed token, invalid state transition) |
| 401 | Unauthenticated (missing/expired/invalid JWT) |
| 403 | Authenticated but insufficient permission |
| 404 | Entity not found within tenant |
| 409 | Conflict (duplicate policy, duplicate claim, duplicate group member) |
| 422 | Validation error (FluentValidation failures) |
| 500 | Unhandled server error (sanitized — no stack trace exposed) |
| 502 | Integration failure (TranzPay, DisburseCloud unavailable after retries) |
| 503 | Service unavailable (Key Vault unreachable, Redis unreachable) |

---

## Open Doubts (DBT-4-FORGE) Raised in This Document

| DBT ID | Severity | Statement | Affected Endpoints |
|--------|----------|-----------|-------------------|
| DBT-4-FORGE-001 | HIGH | HexCat API contract unknown (QST-1-INT-004). `PUT /api/v1/quotes/{quoteId}/risk-location` response includes HexCat-populated fields but the actual API call is a stub. | §4.2 |
| DBT-4-FORGE-004 | HIGH | TranzPay production URL is a FORGE blocker (GAP-2-INT-001). All payment endpoints function in sandbox/Dev but cannot be completed for UAT/Prod until the production URL is loaded into Key Vault. | §7.1–7.7 |
| DBT-4-FORGE-005 | MEDIUM | LenderDock endpoint URL and payload schema unknown (QST-1-INT-002). Mortgagee notification is triggered by policy bind, cancel, and endorse flows but the LenderDock client is a stub. | §5.1, §5.5, §6.9 |
| DBT-4-FORGE-006 | MEDIUM | Plumsail API key unknown (QST-1-INT-003). Document generation endpoint returns 503 until key is provisioned in Key Vault. | §9.4 |

---

*End of ART-4-003 — API Specifications | INSUREEDGE-2026 | FORGE Phase | 2026-06-17*
*Status: AI_GENERATED. All P1 user stories from ART-2-003 covered. HUMAN_VALIDATION_REQUIRED applied to all financial endpoints. 4 DBT-4-FORGE items raised. ClientId injection pattern (from JWT, not request body) enforced throughout.*
