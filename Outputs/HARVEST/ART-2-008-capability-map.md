# ART-2-008 — Business Capability Map
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Product Manager Agent
**Phase:** HARVEST
**Date:** 2026-06-17
**Confidence:** MEDIUM-HIGH (Policy and User/Group domains HIGH from text PRD evidence; Claims, Billing, Distribution MEDIUM from function index + permission model)

**WHAT/HOW neutrality:** All HOW language from SCAN sources has been rewritten. Rewrites logged in Section 8.

---

## Domain Overview

| # | Domain | Capability Clusters | Priority Band |
|---|--------|--------------------|-|
| D1 | Policy Lifecycle Management | 6 clusters | Primarily P1 |
| D2 | Claims Management | 5 clusters | Primarily P1 |
| D3 | Billing & Payments | 4 clusters | P1–P2 |
| D4 | Distribution Management | 3 clusters | P1–P2 |
| D5 | Identity & Access Management | 4 clusters | P1 |
| D6 | Document Management | 2 clusters | P1–P2 |
| D7 | System Administration | 3 clusters | P2 |

---

## D1 — Policy Lifecycle Management

### D1-C1: Quote Creation & Submission
**Description:** The platform must allow authorized producers and administrators to create new insurance quote submissions for individual and commercial insureds. A submission captures policyholder information, mailing address (geocoding-resolved), risk location(s), coverage selections, and premium computation. The quote must progress through a structured multi-step wizard and be assigned a status that reflects its current stage in the underwriting process.

**Key Business Rules:**
- A quote may be for an individual or commercial insured type.
- The "Are you 65 or older?" indicator is required for individual submissions and is a rating/eligibility factor.
- Risk location address must be geocoding-resolved to latitude/longitude coordinates before progressing.
- A risk assessment service must be called for each risk location to return property characteristics and an acceptance status. A "Not Approved" acceptance status blocks further progression.
- Coverage selections include dwelling asset limit, physical damage deductible, coverage level (Basic / Standard / Preferred), liability amount, and optional peril endorsements (Sinkhole, Earthquake, Flood, Wind & Hail, Wildfire).
- New business quotes expire after 90 days of inactivity. (BR-POL-T06, EV-0-0231)
- The platform must prevent a duplicate active policy for the same risk location. (FND-1-LOGIC, EV-0-0006)
- Policy fee of $195 applies to all policies. (BR-POL-T09, EV-0-0231)
- Total premium = coverage premium + taxes + fees.

**Integrations Touched:** Address geocoding service (INT-003), risk assessment and catastrophe rating service (INT-007)
**Roles Involved:** Client Admin, Intermediary/Producer
**Priority:** P1 — Core revenue-origination function. Evidence HIGH (EV-0-0218). Failure = no new business.

---

### D1-C2: Policy Binding & Issuance
**Description:** Following quote approval, the platform must bind the quote into an active policy. Binding triggers payment collection, policy number generation, declaration page document generation, and mortgage lienholder notification where applicable. The bound policy must be assigned an Active status and become visible in the policy registry.

**Key Business Rules:**
- Payment must be successfully collected before a policy is marked Active.
- Policy number follows the format `001-00004-NNNNNNN-NN` (ClientId, IntermediaryId, sequential number, version).
- If the insured has a mortgagee/lienholder, the mortgage lienholder notification service must be called at binding.
- A declaration page document package must be generated and stored at binding.
- Duplicate active policy check must pass before binding proceeds. (FND-1-LOGIC, EV-0-0006)

**Integrations Touched:** Payment gateway service (INT-001, PROVISIONAL), mortgage lienholder notification service (INT-002), document generation service (INT-006), binary document storage service (INT-008)
**Roles Involved:** Client Admin, Intermediary/Producer
**Priority:** P1 — Core revenue function. Evidence HIGH (EV-0-0218, EV-0-0006). Failure = no policies issued.

---

### D1-C3: Policy Endorsement
**Description:** The platform must allow mid-term changes to an active policy. An endorsement recalculates the premium difference, applies any additional payment or refund, updates coverage terms, and generates an endorsement document package. Mortgage lienholders must be notified of coverage changes.

**Key Business Rules:**
- Endorsement creates a new transaction record linked to the original policy.
- Premium difference computation: positive difference = collect additional premium; negative = issue refund.
- Commission details must be recalculated for the endorsement transaction.
- Mortgage lienholder notification required if mortgagee data is present.
- Endorsement quotes expire after 90 days. (BR-POL-T08, EV-0-0231)

**Integrations Touched:** Payment gateway service (INT-001, PROVISIONAL), mortgage lienholder notification service (INT-002), document generation service (INT-006), binary document storage service (INT-008)
**Roles Involved:** Client Admin
**Priority:** P1 — Required for policy mid-term servicing. Evidence HIGH (EV-0-0006). Failure = no in-force policy management.

---

### D1-C4: Policy Renewal
**Description:** The platform must generate renewal quotes automatically 90 days before policy expiration and support both automatic and manually-triggered renewal binding. Renewal notifications must be sent to producers. Non-renewal notices must be issued 60 days before expiry when applicable. Mortgage lienholders must receive renewal notifications.

**Key Business Rules:**
- Renewal quote generated 90 days before policy expiry. (BR-POL-T01, EV-0-0231)
- Automatic renewal notification email sent at renewal quote generation.
- Producer email notification sent for draft renewal quotes via scheduled background job.
- Non-renewal notice email sent 60 days before expiry. (BR-POL-T05, EV-0-0231)
- Policy marked Non-Renewed 90 days after expiry if no renewal is bound. (BR-POL-T04, EV-0-0231)
- Renewal quotes expire after 30 days. (BR-POL-T07, EV-0-0231)
- Mortgage lienholder must be notified of renewal.
- Manual renewal trigger available for Client Admins.

**Integrations Touched:** Mortgage lienholder notification service (INT-002), outbound email service (INT-005), document generation service (INT-006)
**Roles Involved:** Client Admin; automated via scheduled background job
**Priority:** P1 — Core policy continuity function. Evidence HIGH (EV-0-0231). Failure = revenue loss and compliance risk.

---

### D1-C5: Policy Cancellation & Non-Renewal
**Description:** The platform must support voluntary policy cancellation initiated by the policyholder or administrator, automatic cancellation due to non-payment, cancel/rewrite transactions, and non-renewal decisions. Cancellation triggers refund processing, lienholder notification, and cancellation document generation.

**Key Business Rules:**
- Auto-cancellation fires 30 days after a failed payment cycle. (BR-POL-T03, EV-0-0231)
- Policy Expiry status is set 1 day after the expiration date. (BR-POL-T02, EV-0-0231)
- Cancellation triggers refund calculation and reverse payment.
- Mortgage lienholder must be notified of cancellation.
- Cancel/Rewrite creates a new draft quote linked to the cancelled policy.
- Cancellation notice document must be generated and stored.

**Integrations Touched:** Payment gateway service (INT-001, PROVISIONAL), mortgage lienholder notification service (INT-002), outbound email service (INT-005), document generation service (INT-006)
**Roles Involved:** Client Admin; scheduled background job (auto-cancellation)
**Priority:** P1 — Mandatory for policy lifecycle compliance. Evidence HIGH (EV-0-0006, EV-0-0231).

---

### D1-C6: Bulk Policy Upload & Processing
**Description:** The platform must accept batch submissions of policy data through a file-based upload mechanism, validated and processed by a background job.

**Key Business Rules:**
- Bulk upload timer is enabled by default. (BR-EV-0-0231)
- Uploaded records must pass the same validation rules as individual submissions.
- Errors in individual records must not abort the full batch — partial success with error reporting required.

**Integrations Touched:** Binary document storage service (INT-008) for upload file staging
**Roles Involved:** Client Admin (per upload permission)
**Priority:** P2 — Operational efficiency capability. Evidence MEDIUM (EV-0-0003, EV-0-0006 function names).

---

## D2 — Claims Management

### D2-C1: First Notice of Loss (FNOL) Intake
**Description:** The platform must allow authorized users to register a first notice of loss against an active policy. FNOL captures loss event details, creates a claim record, and assigns an initial claim status.

**Key Business Rules:**
- A claim must be linked to an active policy.
- Duplicate FNOL for the same loss event must be detected and prevented.
- FNOL date, loss date, and initial claim status must be captured.
- Claim number must be system-generated.

**Integrations Touched:** None (internal only)
**Roles Involved:** Client Admin, Adjuster
**Priority:** P1 — Core claims initiation function. Evidence MEDIUM (EV-0-0007, function index). Claims UI evidence is LOW (DBT-1-0003).

---

### D2-C2: Adjuster Assignment & Claim Workflow
**Description:** The platform must support adjuster assignment to a claim and provide a structured workflow for claim review, with adjusters scoped to only their assigned claims.

**Key Business Rules:**
- Adjuster scope: an adjuster may only view and act on claims assigned to them.
- Claims workflow includes: FNOL → Open → In Review → Closed / Denied / Escalated.
- Approval/rejection of worksheet steps requires `IsApproveReject` permission.
- Escalation, litigation flag, and referral tracking are supported workflow states.
- Task assignment within a claim is supported.

**Integrations Touched:** None (internal)
**Roles Involved:** Client Admin, Adjuster
**Priority:** P1 — Core claims processing function. Evidence MEDIUM (EV-0-0007, EV-0-0226).

---

### D2-C3: Claims Financial Worksheet & Reserve Management
**Description:** The platform must support financial worksheet management within a claim, including reserve allocation per coverage type, reserve updates, and paid amounts tracking.

**Key Business Rules:**
- A worksheet is linked to a claim; reserves are allocated per coverage type.
- Total reserve and total paid are tracked at the worksheet level.
- Worksheet approval requires `IsApproveReject` permission.
- Reserve amounts must not be reduced below amounts already paid.

**Integrations Touched:** None (internal)
**Roles Involved:** Client Admin, Adjuster (per IsApproveReject)
**Priority:** P1 — Financial integrity of claims. Evidence MEDIUM (EV-0-0007, ART-1-001).

---

### D2-C4: Claims Disbursement & Payee Management
**Description:** The platform must manage payees for claim payments and support disbursement of claim settlement amounts. Disbursement generates payment records and triggers email notifications.

**Key Business Rules:**
- A claim may have multiple payees.
- Each payee disbursement creates a worksheet payment record.
- Disbursement email notification must be sent per payee.
- Disbursement to intermediaries may use the commission disbursement service.

**Integrations Touched:** Outbound email service (INT-005), commission disbursement service (INT-009)
**Roles Involved:** Client Admin
**Priority:** P1 — Core claims settlement function. Evidence MEDIUM (EV-0-0007).

---

### D2-C5: Catastrophic Event Management
**Description:** The platform must support associating multiple claims with a catastrophic event record (CAT event) for aggregate reporting and management.

**Key Business Rules:**
- A CAT event groups claims by a shared triggering event.
- Claims may be associated to a CAT event from the claim workflow.

**Integrations Touched:** Risk rating and catastrophe data service (INT-007) for HexCat zone data
**Roles Involved:** Client Admin
**Priority:** P2 — Important for large-loss event management. Evidence MEDIUM (EV-0-0007, EV-0-0003 function count).

---

## D3 — Billing & Payments

### D3-C1: Premium Payment Collection
**Description:** The platform must collect the initial policy premium at binding and support both one-time (annual) and installment (monthly) payment modes via ACH bank debit and credit card charge methods.

**Key Business Rules:**
- First payment must succeed before policy is activated.
- Payment method: ACH debit or credit card charge.
- Payment gateway transaction ID must be captured and stored against the policy payment transaction record.
- Transaction status values: SUCCESS / FAILED.
- `BypassRefundResponse` flag must be FALSE in production. (CRITICAL, EV-0-0231)

**Integrations Touched:** Payment gateway service (INT-001, PROVISIONAL)
**Roles Involved:** Client Admin
**Priority:** P1 — Revenue collection; no policy without it. Evidence MEDIUM (EV-0-0006). Payment gateway contract is PROVISIONAL — see QST-1-INT-001.

---

### D3-C2: Payment Plan Management & Installment Scheduling
**Description:** The platform must allow configuration of installment payment plans, generate an installment schedule, and process recurring payments according to the schedule via a scheduled background job.

**Key Business Rules:**
- Payment frequency: annual or monthly.
- Number of installments and installment fee are configured per plan.
- Automatic debit runs on the installment schedule via a background job.
- Failed payment triggers email notification and lienholder notification. (EV-0-0006)

**Integrations Touched:** Payment gateway service (INT-001, PROVISIONAL), outbound email service (INT-005), mortgage lienholder notification service (INT-002)
**Roles Involved:** Client Admin; scheduled background job
**Priority:** P1 — Required for monthly payers. Evidence MEDIUM (EV-0-0008, EV-0-0006).

---

### D3-C3: Refunds & Payment Reversals
**Description:** The platform must support ACH refunds and credit card refunds for cancellations, endorsement premium reductions, and other scenarios requiring return of funds.

**Key Business Rules:**
- Refund type must match original payment method (ACH refund for ACH charge; card refund for card charge).
- Prior paid amounts must be looked up before computing refund amount.
- Refund creates a reversal transaction record linked to the original.
- `BypassRefundResponse` must be FALSE in production (CRITICAL — EV-0-0231).

**Integrations Touched:** Payment gateway service (INT-001, PROVISIONAL)
**Roles Involved:** Client Admin
**Priority:** P1 — Mandatory for cancellations. Evidence MEDIUM (EV-0-0006). PROVISIONAL — dependent on QST-1-INT-001.

---

### D3-C4: Failed Payment Handling & Auto-Cancellation
**Description:** The platform must detect payment failures, send notifications, notify lienholders, and trigger auto-cancellation after the grace period expires.

**Key Business Rules:**
- Auto-cancellation fires 30 days after a missed payment. (BR-POL-T03, EV-0-0231)
- Failed payment email notification must be sent to the policyholder.
- Mortgage lienholder must be notified of failed payment.
- Auto-cancellation triggers the full cancellation flow (D1-C5).

**Integrations Touched:** Payment gateway service (INT-001, PROVISIONAL), outbound email service (INT-005), mortgage lienholder notification service (INT-002)
**Roles Involved:** Scheduled background job
**Priority:** P1 — Compliance and financial protection function. Evidence HIGH (EV-0-0231).

---

## D4 — Distribution Management

### D4-C1: Intermediary & Producer Onboarding
**Description:** The platform must support onboarding of insurance intermediaries (agencies) and individual producers, including profile management, license tracking, and geocoding-resolved address capture.

**Key Business Rules:**
- Intermediary is a company-level entity; producer is an individual within an intermediary.
- Each intermediary is assigned an intermediary code and a default commission percentage.
- Producer license numbers and state codes must be captured.
- Address must be geocoding-resolved.

**Integrations Touched:** Address geocoding service (INT-003)
**Roles Involved:** Client Admin
**Priority:** P1 — Required for any policy origination. Evidence MEDIUM (EV-0-0009, EV-0-0003). Distribution UI evidence LOW (DBT-1-0004).

---

### D4-C2: Commission Configuration & Calculation
**Description:** The platform must configure commission rates per intermediary and compute commission amounts for new business, endorsements, and renewals. Commission payments must be tracked.

**Key Business Rules:**
- Commission percentage is set per intermediary.
- Commission amount = premium × commission percentage.
- Commission is recalculated on endorsement transactions.
- Commission payment transaction records track disbursement status.
- Source schema typo `ComissionPercentage` must be corrected in target (RSK-1-DATA-004).

**Integrations Touched:** None (internal calculation)
**Roles Involved:** Client Admin, Intermediary/Producer (view own commissions)
**Priority:** P2 — Required for producer compensation. Evidence MEDIUM (EV-0-0006, EV-0-0009).

---

### D4-C3: Commission Disbursement
**Description:** The platform must generate disbursement records and transfer commission funds to producers and intermediaries via the external commission disbursement service.

**Key Business Rules:**
- Disbursement URL is generated via the commission disbursement service API.
- Monthly commission disbursement is a scheduled background job.
- Email notification is sent per disbursement.

**Integrations Touched:** Commission disbursement service (INT-009), outbound email service (INT-005)
**Roles Involved:** Client Admin; scheduled background job
**Priority:** P2 — Producer payment function. Evidence MEDIUM (EV-0-0009, EV-0-0006).

---

## D5 — Identity & Access Management

### D5-C1: User Lifecycle Management
**Description:** The platform must support user creation, profile management, status management (active/inactive), and deactivation. User identifiers are system-generated. Email address serves as the unique login credential and may not be changed after creation.

**Key Business Rules:**
- Email address is the unique login identifier and is immutable after creation.
- Duplicate email detection must be enforced globally (across tenants for login uniqueness) and phone uniqueness must be enforced per tenant.
- User ID is system-generated (format IE00XX).
- User must be assigned to a tenant (ClientId) at creation.

**Integrations Touched:** Outbound email service (INT-005) for onboarding and password reset emails
**Roles Involved:** Client Admin (manages users within tenant); Platform Admin (manages all tenants)
**Priority:** P1 — Required for system access. Evidence HIGH (EV-0-0222, EV-0-0011).

---

### D5-C2: Group-Based Permission Management
**Description:** The platform must enforce a group-based access model where every user's permissions are derived from the union of their group memberships. Each group has a per-screen permission record carrying 10 flags. The AllAccess flag overrides all individual flags for that screen.

**Key Business Rules:**
- Users belong to one or more groups via a membership join record.
- Each group has one permission record per screen, carrying 10 flags: View, Create, Edit, ApproveReject, Duplicate, Upload, Download, ViewSensitiveInfo, AccessSensitiveDoc, AllAccess.
- Effective permission = logical OR across all user groups for each flag.
- If any group grants AllAccess for a screen, the user has full access to that screen.
- AllAccess does NOT bypass scope filters (ClientId, IntermediaryId, AdjusterId).
- Privilege cleanup on group membership removal must occur synchronously (RSK-1-SEC-004 mitigation required).
- Group membership change requiring re-evaluation must be gated by the USERGROUPPAGE permission. (EV-0-0010)

**Integrations Touched:** None
**Roles Involved:** Client Admin (group management); Platform Admin (cross-tenant)
**Priority:** P1 — Foundational access control. Evidence HIGH (EV-0-0048, EV-0-0226).

---

### D5-C3: Authentication & Password Management
**Description:** The platform must authenticate users via username/email and password. Password reset tokens must expire within 30 minutes (standard flow). Onboarding tokens must be validated by code match (not existence only) and expire within 24 hours. A rate limit of fewer than 2 active reset tokens per 30-minute window must be enforced.

**Key Business Rules:**
- Standard password reset token: code match + expiry check; expires in 30 minutes. (EV-0-0012)
- Onboarding (client onboarding) password token: must be validated by code match AND expiry; 24-hour window. (RSK-1-SEC-002 REQUIRES FIX — currently existence-only)
- Rate limit: no more than 2 active reset tokens per user per 30 minutes. (EV-0-0012)
- Password must be stored using a one-way cryptographic hash; no plaintext storage. (RSK-1-SEC-001 REQUIRES FIX)
- Session authentication must be enforced for all protected endpoints.
- Session timeout must be configured (current duration unknown — QST-2-PM-001).

**Integrations Touched:** Outbound email service (INT-005) for reset link delivery
**Roles Involved:** All roles
**Priority:** P1 — Authentication is foundational. Evidence HIGH (EV-0-0222, EV-0-0012, EV-0-0226).

---

### D5-C4: Audit Trail
**Description:** The platform must record an audit log entry for all significant user actions, capturing the user, action type, affected record, session, module, and timestamp.

**Key Business Rules:**
- AuditLog records: UserId, ActionType, TableName, RecordId, SessionId, ModuleName, Timestamp.
- Recent activity feed is displayed per module.
- Platform Admin cross-tenant actions must be included in the audit log with ClientId context. (RSK-1-SEC-009 REQUIRES FIX)
- Audit records must not be deletable by non-Platform Admin users.

**Integrations Touched:** None
**Roles Involved:** All roles (events written); Platform Admin (full read)
**Priority:** P1 — Regulatory and security requirement. Evidence HIGH (EV-0-0012, ART-1-001).

---

## D6 — Document Management

### D6-C1: Document Generation
**Description:** The platform must generate structured insurance documents — including declaration pages, quote proposal packages, renewal packages, endorsement documents, notice of cancellation, notice of policy change, notice of non-renewal, and underwriter-specific documents — by submitting structured data payloads to a document generation service and receiving output documents in portable format.

**Key Business Rules:**
- Document generation is triggered at specific lifecycle events: binding, endorsement, renewal, cancellation, non-renewal.
- Each document type has a defined JSON data schema (payload) that must be maintained in the target system.
- Generated documents are stored in the binary document storage service and linked to the policy or claim record via a stored path reference.
- Document generation must be atomic with the triggering lifecycle event — failure must be surfaced and retried.

**Integrations Touched:** Document generation service / cloud document rendering service (INT-006), binary document storage service (INT-008)
**Roles Involved:** System-triggered; Client Admin may request on-demand
**Priority:** P1 — Required for policy issuance. Evidence HIGH (EV-0-0019, EV-0-0006).

---

### D6-C2: Document Upload, Retrieval & Sensitive Document Control
**Description:** The platform must allow users with appropriate permissions to upload, store, and retrieve policy and claim documents. Certain documents may be flagged as sensitive; access to sensitive documents requires the AccessSensitiveDoc permission flag.

**Key Business Rules:**
- Documents are linked to a policy or claim record.
- Upload requires `IsUploadPermission`; download requires `IsDownloadPermission`.
- Sensitive document flag (`IsSensitive`) controls access via `IsAccessSensitiveDoc` permission.
- Time-limited access tokens (short-duration URLs) are used for document download to prevent unrestricted exposure.
- Document types are drawn from the DocumentType reference table.

**Integrations Touched:** Binary document storage service (INT-008)
**Roles Involved:** Client Admin, Adjuster (per upload/download permission)
**Priority:** P2 — Required for claims and compliance. Evidence HIGH (EV-0-0006, EV-0-0007, ART-1-001).

---

## D7 — System Administration

### D7-C1: Multi-Tenant Client Provisioning
**Description:** The platform must support provisioning of new tenant clients by Platform Administrators, including client registration, office location configuration, and assignment of Platform Admin-managed products.

**Key Business Rules:**
- Client entity is the tenant root; all tenant-owned data is scoped to it.
- Client provisioning is Platform Admin only — no client-facing self-registration.
- Client office locations are managed as child records.
- Tenant ID must be resolved from the authenticated user's session for all data operations.

**Integrations Touched:** None
**Roles Involved:** Platform Admin only
**Priority:** P2 — Required to add new customers; not a day-to-day function. Evidence HIGH (ART-1-001, EV-0-0226).

---

### D7-C2: Insurance Product Catalog Management
**Description:** The platform must allow Platform Administrators to manage the catalog of insurance products available for underwriting, including activation and deactivation of products.

**Key Business Rules:**
- Products are intentionally global (not ClientId-scoped).
- Product activation/deactivation affects all tenants.
- Products are linked to policy records at the product selection step.

**Integrations Touched:** None
**Roles Involved:** Platform Admin only
**Priority:** P2 — Platform configuration function. Evidence MEDIUM (EV-0-0003, EV-0-0226).

---

### D7-C3: Platform Configuration Management
**Description:** The platform must provide an administrative interface for managing system-wide configuration values — including policy lifecycle thresholds, timer enable/disable flags, financial flags, and integration credentials — without requiring application redeployment.

**Key Business Rules:**
- All business thresholds (renewal days, cancellation days, expiry days, policy fee) must be configurable without code changes.
- Timer enable/disable and emergency kill-switch must be accessible to Platform Admins.
- Integration credentials must be stored in a secure externalized secret store — not as plain configuration values. (RSK-1-INT-003, RSK-1-INT-004)
- `BypassRefundResponse` must be set to FALSE in all non-development environments. (CRITICAL, EV-0-0231)

**Integrations Touched:** Secure externalized secret management (architectural requirement)
**Roles Involved:** Platform Admin only
**Priority:** P2 — Operational control function. Evidence HIGH (EV-0-0231).

---

## 8. WHAT/HOW Neutrality Rewrite Log

The following HOW-language terms from SCAN source files were rewritten to WHAT-language in this document:

| Source HOW Term | Rewritten WHAT Term | Location |
|----------------|---------------------|----------|
| "OutSystems timer" | "scheduled background job" | All scheduling references |
| "SQL Server FK" | "referential integrity constraint" | (not used — avoided entirely) |
| "Azure Blob Storage" | "binary document storage service" | D6-C1, D6-C2 |
| "LenderDock" | "mortgage lienholder notification service" | All D1, D3 references |
| "Plumsail API" / "IEDocumentGenerator" | "document generation service / cloud document rendering service" | D6-C1 |
| "SMTP" / "Office365" | "outbound email service" | All email references |
| "bcrypt" / "EncryptPassword" | "one-way cryptographic hash" | D5-C3 |
| "AES-256" / "RssExtensionCryptoAPI" | "symmetric encryption service" / "one-way cryptographic hash" | D5-C3 |
| "TranzPay" | "payment gateway service" | All D3 references |
| "DisburseCloud" | "commission disbursement service" | D4-C3 |
| "Google Maps / Geocoding API" | "address geocoding service" | D1-C1, D4-C1 |
| "HexCat" | "risk assessment and catastrophe rating service" | D1-C1, D2-C5 |
| "OutSystems ORM" | "data access layer" | (not used — avoided entirely) |
| "Azure Key Vault" | "secure externalized secret store" | D7-C3 |
| "SAS token" | "time-limited access token" | D6-C2 |

---

## 9. Capability Count Summary

| Domain | P1 Clusters | P2 Clusters | P3 Clusters | Total |
|--------|------------|------------|------------|-------|
| D1: Policy Lifecycle | 5 | 1 | 0 | 6 |
| D2: Claims Management | 4 | 1 | 0 | 5 |
| D3: Billing & Payments | 4 | 0 | 0 | 4 |
| D4: Distribution Management | 1 | 2 | 0 | 3 |
| D5: Identity & Access Management | 4 | 0 | 0 | 4 |
| D6: Document Management | 1 | 1 | 0 | 2 |
| D7: System Administration | 0 | 3 | 0 | 3 |
| **TOTAL** | **19** | **8** | **0** | **27** |

---

*End of ART-2-008 — Business Capability Map | INSUREEDGE-2026 | HARVEST Phase | 2026-06-17*
*Evidence citations: EV-0-0218, EV-0-0222, EV-0-0048, EV-0-0226, EV-0-0006, EV-0-0007, EV-0-0009, EV-0-0010, EV-0-0011, EV-0-0012, EV-0-0019, EV-0-0231, ART-1-001, ART-1-002, ART-1-003, ART-1-004, ART-1-005*
