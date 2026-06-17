# ART-1-002 — Logic & Workflow Catalogue
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Logic Agent
**Phase:** SCAN
**Date:** 2026-06-16
**Confidence:** MEDIUM — Logic markdown files are MEDIUM confidence (derived from source, not raw OML)

**Evidence consumed:** EV-0-0003 through EV-0-0020 (Logic\00_INDEX.md through Logic\17_LogEngine.md)

---

## 1. Module Summary

| # | Module | Functions | BL | CS | Other | Key Responsibilities |
|---|--------|-----------|----|----|-------|---------------------|
| 01 | Clients | 93 | 54 | 39 | — | Client/policyholder CRUD, address management, contact management, duplicate detection. ClientId-scoped throughout. |
| 02 | Accounts | 29 | 14 | 15 | — | Account grouping above policy level. Account creation, retrieval, status management. |
| 03 | Policy | **569** | 352 | 213 | 4 (Lib) | Quote-to-policy full lifecycle: submission, binding, issuance, endorsement, renewal, cancellation, non-renewal. Payment processing (TranzPay), commission management, LenderDock notifications, document generation, bulk upload. Largest module. |
| 04 | Claims | **467** | 225 | 242 | — | FNOL-to-close lifecycle: intake, adjuster assignment, worksheet management, reserve tracking, payee management, claim letters, disbursements, escalation, litigation, CAT events. Second largest module. |
| 05 | Billing | 13 | 6 | 7 | — | Payment plan management, billing transaction tracking. Thin module — most billing logic lives in Policy (payment transactions). |
| 06 | Distribution | 144 | 101 | 43 | — | Intermediary/producer onboarding, commission configuration, geocoding for producer addresses, DisburseCloud URL generation, commission disbursement. |
| 07 | Groups | 55 | 31 | 24 | — | Group CRUD, group membership sync, permission matrix management, privilege cleanup (async). |
| 08 | User Management | 52 | 29 | 23 | — | User CRUD, role assignment, password management, email validation, ClientId-scoped queries. |
| 09 | Common | **467** | 121 | 346 | — | Shared utilities: AES crypto, Azure Blob, geocoding, email, audit logging, tenant resolution, client lookups, payment method restrictions. Cross-cutting foundation layer. |
| 10 | Reports | 33 | — | — | 33 | Report management — 33 functions in ReportManagement module. |
| 11 | HexCat Audit Data | 13 | — | — | 13 | CAT audit data management. |
| 12 | Rating Engine | 43 | — | — | 43 | Premium rating calculations. Separate OutSystems module (IERatingEngine). |
| 13 | Product Management | 12 | 6 | 6 | — | Insurance product catalog — PlatformAdmin-only. |
| 14 | Portal | 42 | — | — | 42 | Global portal: Dashboard KPIs, View Profile, Recent Activity, Global Search. |
| 15 | Emails | 5 | — | — | 5 | Transactional email templates and dispatch (InsureEdgeEmails). |
| 16 | Document Generator | 5 | — | — | 5 | HTTP-based document generation (IEDocumentGenerator). |
| 17 | Log Engine | 7 | — | — | 7 | Logging infrastructure (IELogEngine). |
| **TOTAL** | | **2,049** | **930** | **962** | **157** | |

---

## 2. Core Workflows

### 2.1 Quote-to-Policy Lifecycle

**Source:** EV-0-0006 (03_Policy.md), EV-0-0218

```
DRAFT QUOTE
    ├─ Step 1: Policy Information captured (effective date, insured, mailing address)
    ├─ Step 2.1: Risk Location added (geocoded via GetGeoCodeFromAddress)
    ├─ Step 2.2: Risk Information — HexCat called (GetHexcodeFromLatLng → DataActionGetHexCatStatus)
    │           HexCatStatus gates progression ("Not Approved" blocks)
    ├─ Step 2.3: Limits & Coverages selected
    ├─ Step 2.4: Plans Overview — coverage level chosen
    ├─ Step 3: Quote Review — TotalPremium displayed (CoveragePremium + Taxes + Fees)
    ├─ Step 4: Finalize Quote (content not captured in UI — see DBT-1-0001 in Browser Agent)
    └─ Step 5: Documents
           ↓
BOUND POLICY
    ├─ CreatePolicies2 / CreatePolicyNumber_HB / GenerateNewBusinessHBISPolicyNumber
    ├─ FirstPaymentTransaction → MakeTranzpayPayment / AddCustomerACHDebit / AddCustomerCCCharge
    ├─ InitiateProcess_NewBusinessPolicyPackage → IEDocumentGenerator (declaration page)
    ├─ Notify_Mortgage_LenderDock (if mortgagee)
    └─ PolicyStatus → ACTIVE
           ↓
ENDORSEMENT
    ├─ CreateEndorsementPolicyQuote → CreateEndorsementPaymentTransactionAnualPayNow
    ├─ IssueEndorsementAnual / IssueEndorsementMonthlyRefunds / IssueEndorsementNoChangePremium
    ├─ CommissionsDetails_ENdorsements / CreateorUpdateHBIScommissiondetailsEndorsements_BL
    ├─ NotifyLenderDockForEndorsement (if mortgagee)
    └─ InitiateProcess_QuoteProposalPackage (endorsement documents)
           ↓
RENEWAL
    ├─ GenerateRenewalPolicyQuotes_New / GenerateRenewalPolicyQuotes_ByPolicyID / GenerateRenewalPolicyQuotesSingle
    ├─ GenerateRenewalPolicyQuotesForManually (manual trigger)
    ├─ Timer: SendRenewalDraftProducerEmailViaTimer → RenewalDraftProducerNotificationEmail
    ├─ AutomaticRenewalNotificationEmail
    ├─ NotifyLenderDockForRenewal
    └─ InitiateProcess_RenewalPolicyPackage
           ↓
CANCELLATION
    ├─ CreateCancelRewritePolicy (Cancel + Rewrite variant)
    ├─ CancellationDueToNoPayment_BL (auto-cancel on failed payment)
    ├─ NotifyLenderDockForCancelledPolicy
    ├─ SendPolicyCancellationMail
    └─ PolicyStatus → CANCELLED
           ↓
NON-RENEWAL
    ├─ UpdatePolicyStatusToNonRenewed
    ├─ GenerateNoticeOfNonRenewalDocument
    ├─ NoticeOfNonRenewalEmail / SendNoticeOfNonRenewalEmail
    └─ NotifyLenderDockForRenewal (with non-renewal flag)
           ↓
EXPIRY / LAPSE
    ├─ UpdatePolicyStatusToExpired (timer-driven)
    ├─ UpdatePolicyStatusToLapsed (failed payment / missed renewal)
    └─ UpdateEndorsementQuoteStatusToExpired
```

### 2.2 Claims Lifecycle

**Source:** EV-0-0007 (04_Claims.md)

```
FNOL REGISTRATION
    ├─ 225 BL + 242 CS functions implement the full lifecycle
    ├─ NewClaim / FNOL intake (fields not fully evidenced — see DBT-1-UI-003)
    └─ ClaimStatus → FNOL/OPEN
           ↓
ADJUSTER ASSIGNMENT
    ├─ AdjusterList management (Create, Get, Update Adjuster)
    ├─ Assignment to claim via AdjusterId
    └─ Scope filter applied: Adjuster sees only assigned claims
           ↓
CLAIM REVIEW & WORKSHEET
    ├─ Worksheet creation, reserve tracking per coverage (WorksheetReserve)
    ├─ IsApproveReject permission gates worksheet approval actions
    ├─ ClaimCoverage: per-coverage reserve and paid amounts
    ├─ Claims escalation, litigation flag, referral tracking
    └─ CAT event association (CatastrophicEvents)
           ↓
DISBURSEMENT
    ├─ Payee management (ClaimsPayee → Payee entity)
    ├─ WorksheetPayment creation per payee
    ├─ SendDisbursementEmail / SendClaimLetterEmail via InsureEdgeEmails
    └─ DisburseCloud URL generation (commission disbursement path)
           ↓
CLOSE
    └─ ClaimStatus → CLOSED / DENIED
```

### 2.3 Payment Flow

**Source:** EV-0-0006 (03_Policy.md), EV-0-0008 (05_Billing.md)

```
PREMIUM CHARGE
    ├─ FirstPaymentTransaction → MakeTranzpayPayment (ACH or CC)
    ├─ CreateOrUpdatePaymentPlans → installment schedule created
    ├─ PolicyPaymentTransaction: TransactionStatus = 'SUCCESS' / 'FAILED'
    ├─ GatewayTransactionId captured from TranzPay response
    └─ PaymentTransactionforEndorsement (endorsement payment)
           ↓
AUTO-DEBIT (recurring)
    └─ AutoDebitPaymentTranzpay → scheduled via OutSystems Timer
           ↓
FAILURE PATH
    ├─ EmailFailedTransaction
    ├─ FailedNotificationLenderdock / FailedNotificationLenderdock2
    └─ CancellationDueToNoPayment_BL (after N failed attempts)
           ↓
REFUND / REVERSAL
    ├─ ACHRefund / ACHRefundCancellation
    ├─ CreditCardRefund / CreditCardRefundCancellation
    ├─ RetrunFundsInsured [note: typo in function name]
    └─ GetAlreadyPaidTransactionValues (prior payment lookup)
```

### 2.4 User & Group Management Flow

**Source:** EV-0-0011 (08_UserManagement.md), EV-0-0010 (07_Groups.md)

```
USER CREATION
    ├─ Check_Email_IsDuplicateOrNot (uniqueness on [User].Username)
    ├─ CheckDuplicateUser (phone uniqueness by ClientId)
    ├─ CreateUser → OutSystems [User] record + User2 extended record
    ├─ EncryptPassword via RsseSpaceUsers.MssEncryptPassword
    └─ User assigned to Groups → CreateGroupsUsers → CreatePrivilegesforGroupUsers
           ↓
GROUP ASSIGNMENT
    ├─ CreateGroupsUsers (full sync — deletes old, adds new members)
    ├─ UpdateGroupsUsers (USERGROUPPAGE permission gate)
    └─ DeleteGroupUser → LaunchDeleteUserGroupPrivelagesUpdated (ASYNC privilege cleanup)
           ↓
PASSWORD RESET
    ├─ RequestResetPassword → UserPasswordReset record (30-min expiry)
    ├─ IsResetPasswordTokenValid (standard: code match + expiry)
    ├─ IsResetPasswordTokenValid_ClientOnboarding (24-hr: existence only — RSK-1-SEC-002)
    ├─ ResendResetLink (rate limit: max 2 active tokens in 30 min)
    └─ DeleteResetPasswordToken (cleanup after use)
```

---

## 3. Business Rules Catalogue

### Policy Module Business Rules

| Function | Module | Inferred Purpose | Confidence |
|---|---|---|---|
| `IsAdditionalInsuredValid` | Policy CS | Validate additional insured data completeness | MEDIUM |
| `IsAdditionalOrgValid` | Policy CS | Validate additional organisation data | MEDIUM |
| `IsAddressValid` | Policy CS | Address completeness validation | MEDIUM |
| `IsContactInfoValid` | Policy CS | Contact info completeness validation | MEDIUM |
| `IsLimitsAndCoverageValid` | Policy CS | Limits & coverages completeness before binding | MEDIUM |
| `IsMortgageValid` | Policy CS | Mortgage/lienholder data validation before LenderDock notify | MEDIUM |
| `ValidatePreviousPolicy` | Policy CS | Prior policy validation for rewrite/renewal | MEDIUM |
| `ValidateLatLong` | Policy CS | Geocoordinates within valid range | MEDIUM |
| `ValidateMortgageName` | Policy CS | LenderDock name format validation | MEDIUM |
| `ValidateMortgageservicecompany` | Policy CS | LenderDock servicer validation | MEDIUM |
| `CheckIfAnyBoundPolicyExists` | Policy CS | Prevent duplicate active policy for same risk | MEDIUM |
| `CheckandUpdateBoundPaymentTransaction` | Policy CS | Verify payment status before binding | MEDIUM |
| `GetLimitsandCoverages` | Policy CS | Retrieve configured limits for rate calculation | MEDIUM |
| `GetPolicyProductInformation` | Policy CS | Retrieve product configuration for the selected product | MEDIUM |
| `IsAdditionalInsuredValid` | Policy CS | Additional insured data validation | MEDIUM |

### Claims Module Business Rules

| Function | Module | Inferred Purpose | Confidence |
|---|---|---|---|
| `ValidateClaim*` (pattern) | Claims CS | Claim completeness and eligibility checks | MEDIUM |
| `CheckDuplicateClaim` | Claims CS | Prevent duplicate FNOL for same loss event | MEDIUM |
| `IsClaimApproveRejectValid` | Claims CS | Approval/rejection eligibility check | MEDIUM |

### Common Module Business Rules

| Rule ID | Statement | Evidence |
|---|---|---|
| BR-COM-A03 | AES-256 CBC + HMAC-256 (Encrypt-then-MAC, PKCS7) for all encrypted fields | EV-0-0012 |
| BR-COM-PWD | Passwords encrypted via OutSystems Users extension `EncryptPassword` | EV-0-0011, EV-0-0012 |
| BR-COM-RESET | Password reset tokens expire in 30 minutes for standard flow; 24 hours for client onboarding | EV-0-0012 |
| BR-COM-RATE | Resend password reset limited to < 2 active tokens per 30 minutes | EV-0-0012 |
| BR-COM-TENANT | `GetClientIdByUserId_CS` returns `ClientId = 0` for null UserId — callers must guard | EV-0-0012 |

### Policy Lifecycle Thresholds (HIGH confidence — EV-0-0231)

| Rule ID | Threshold | Value | Business Meaning |
|---|---|---|---|
| BR-POL-T01 | `RenewalQuoteDaysThreshold` | **90 days** | Renewal quote generated 90 days before policy expiry |
| BR-POL-T02 | `PolicyExpiredAfterDays` | **1 day** | Policy status set to Expired 1 day after ExpirationDate |
| BR-POL-T03 | `CancellationThresholdDays` | **30 days** | Grace period before cancellation fires for non-payment |
| BR-POL-T04 | `PolicyNonRenewedAfterDays` | **90 days** | Policy marked Non-Renewed if no renewal bound within 90 days |
| BR-POL-T05 | `SendNonRenewalEmailBeforeExpiryDays` | **60 days** | Non-renewal notice email sent 60 days before expiry |
| BR-POL-T06 | `QuoteExpiredAfterDays` | **90 days** | New business quote expires after 90 days |
| BR-POL-T07 | `RenewalQuotesExpiredAfterDays` | **30 days** | Renewal quote expires after 30 days |
| BR-POL-T08 | `EndorsementQuotesExpiredAfterDays` | **90 days** | Endorsement quote expires after 90 days |
| BR-POL-T09 | `PolicyFee` | **$195** | Fixed policy fee applied to all policies |

---

## 4. State Machines

### Policy Status State Machine

```
DRAFT (Quote submitted)
    ├─ → APPROVED (HexCat OK, all validations pass)
    ├─ → NOT APPROVED (HexCat status = Not Approved)
    └─ → EXPIRED (quote not acted on — UpdateEndorsementQuoteStatusToExpired)

APPROVED
    └─ → ACTIVE (Finalize + Payment — UpdatePolicyStatusToActive)

ACTIVE
    ├─ → CANCELLED (CancellationDueToNoPayment_BL, manual cancel)
    ├─ → LAPSED (missed payment — UpdatePolicyStatusToLapsed)
    ├─ → EXPIRED (term ended — UpdatePolicyStatusToExpired)
    └─ → NON-RENEWED (UpdatePolicyStatusToNonRenewed)

CANCELLED
    └─ (terminal — except Cancel/Rewrite path creates new DRAFT)

Evidence: UpdatePolicyStatusToActive, UpdatePolicyStatusToExpired, UpdatePolicyStatusToLapsed,
          UpdatePolicyStatusToNonRenewed, UpdatePolicyType [EV-0-0006]
```

### Claim Status State Machine (inferred from function names)

```
FNOL → OPEN → IN_REVIEW → CLOSED / DENIED / ESCALATED
```
*(Exact transitions not fully evidenced — MEDIUM confidence)*

---

## 5. Timer / Scheduled Jobs

**Confidence: HIGH** — thresholds confirmed from site properties (EV-0-0231). QST-1-LOGIC-002 and QST-1-LOGIC-004 **ANSWERED**.

| Timer | Module | Schedule | Threshold Source | Action |
|---|---|---|---|---|
| Automatic Renewal Notification | Policy | `RenewalQuoteDaysThreshold = 90` days before expiry | `RenewalTimerEnable = TRUE` | `AutomaticRenewalNotificationEmail` — generates renewal quote and notifies |
| Renewal Draft Producer Email | Policy | Before renewal quote expiry | Inferred: within `RenewalQuoteDaysThreshold` window | `SendRenewalDraftProducerEmailViaTimer` → `RenewalDraftProducerNotificationEmail` |
| Auto-debit payment | Policy | Per payment plan installment schedule | OutSystems Timer | `AutoDebitPaymentTranzpay` |
| Policy status expiry | Policy | `PolicyExpiredAfterDays = 1` day after ExpirationDate | Daily timer | `UpdatePolicyStatusToExpired` |
| Policy lapse | Policy | `CancellationThresholdDays = 30` days after missed payment | `CancellationDueToNoPayment_BL` | `UpdatePolicyStatusToLapsed` |
| Policy non-renewal | Policy | `PolicyNonRenewedAfterDays = 90` days | Daily timer | Sets Non-Renewed status if no renewal bound |
| Notice of Non-Renewal email | Policy | `SendNonRenewalEmailBeforeExpiryDays = 60` days before expiry | Site property | `SendNoticeOfNonRenewalEmail` |
| Endorsement quote expiry | Policy | `EndorsementQuotesExpiredAfterDays = 90` days | Daily timer | `UpdateEndorsementQuoteStatusToExpired` |
| New business quote expiry | Policy | `QuoteExpiredAfterDays = 90` days | Daily timer | Quote status → Expired |
| Renewal quote expiry | Policy | `RenewalQuotesExpiredAfterDays = 30` days | Daily timer | Renewal quote status → Expired |
| Bulk upload processing | Policy | Background timer | `BulkUploadTimerEnable = TRUE` | Processes bulk-uploaded policy records |

**Kill switch:** `KillTimer = FALSE` — emergency site property to halt all timers. Must remain FALSE in production unless incident response requires it.

**Evidence:** EV-0-0231 (site properties) + EV-0-0049–0155 (timer screenshots). Thresholds at HIGH confidence from explicit site property values.

---

## 6. Key Validations by Module

| Module | Validation Functions |
|---|---|
| Policy | IsAdditionalInsuredValid, IsAdditionalOrgValid, IsAddressValid, IsContactInfoValid, IsLimitsAndCoverageValid, IsMortgageValid, ValidateLatLong, ValidatePreviousPolicy, ValidateMortgageName, ValidateMortgageservicecompany, CheckIfAnyBoundPolicyExists |
| Claims | CheckDuplicateClaim, ValidateClaim* pattern |
| Common | Check_Email_IsDuplicateOrNot, CheckDuplicateUser |
| Distribution | Geocoding-based address validation (GetGeoCodeFromAddress + ValidateLatLong) |
| User Mgmt | Check_Email_IsDuplicateOrNot, CheckDuplicateUser (ClientId-scoped) |

---

## 7. Logic Gaps

| Module | Gap | Confidence | Flag |
|---|---|---|---|
| Billing | Only 13 functions — most billing logic lives in Policy module. Billing standalone screens unclear. | LOW | ASM-1-LOGIC-001 |
| Reports | 33 functions — no detailed documentation. Report generation mechanism unknown. | LOW | ASM-1-LOGIC-002 |
| Rating Engine | 43 functions — IERatingEngine module separate. Premium calculation formula not evidenced. | LOW | ASM-1-LOGIC-003 |
| Portal | 42 functions — Dashboard KPIs computation logic not evidenced. | MEDIUM | ASM-1-LOGIC-004 |
| HexCat | 13 functions — CAT audit data management; HexCat API response handling not fully documented. | LOW | ASM-1-LOGIC-005 |
| Emails | 5 functions — email template content and personalization logic unknown. | LOW | ASM-1-LOGIC-006 |
| Document Generator | 5 functions — JSON schema for each document type not documented. | LOW | ASM-1-LOGIC-007 |

---

## 8. SCAN Questions for Clarification Round

| QST ID | Priority | Question |
|--------|----------|----------|
| INSUREEDGE-2026-QST-1-LOGIC-001 | MAJOR | What is the complete premium rating formula for the Rating Engine? Which factors (HexCat zone, coverage level, age-65 flag, peril endorsements) affect the rating? |
| INSUREEDGE-2026-QST-1-LOGIC-002 | MAJOR | ~~What triggers automatic policy cancellation — how many failed payment attempts, and what is the grace period before `CancellationDueToNoPayment_BL` fires?~~ **ANSWERED (EV-0-0231): CancellationThresholdDays = 30 days** |
| INSUREEDGE-2026-QST-1-LOGIC-003 | MINOR | What is the exact USERGROUPPAGE permission string used in `UpdateGroupsUsers` — where is it defined and how is it granted to a user? |
| INSUREEDGE-2026-QST-1-LOGIC-004 | MINOR | ~~What is the renewal notification timeline — how many days before expiry does each timer fire?~~ **ANSWERED (EV-0-0231): Renewal 90d, Non-Renewal notice 60d, Non-Renewed status 90d** |

---

*End of ART-1-002 — Logic & Workflow Catalogue | INSUREEDGE-2026 | SCAN Phase | 2026-06-16*
*All findings at MEDIUM confidence from Logic markdown files. Inferences marked ASM-.*
