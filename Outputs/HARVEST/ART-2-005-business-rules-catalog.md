# ART-2-005 — Business Rules Catalog
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Business Analyst Agent
**Phase:** HARVEST
**Date:** 2026-06-17
**Source:** ART-1-002 (Logic & Workflow Catalogue), ART-1-003 (Security Catalogue), ART-1-001 (Data Catalogue)

**WHAT/HOW Firewall:** All rules are stated in technology-neutral language. No source platform, database, or implementation technology is referenced.

**Confidence Notation:**
- HIGH — confirmed from site properties or direct evidence (EV-0-0231)
- MEDIUM — inferred from function names or logic index (EV-0-0003 through EV-0-0020)
- PROVISIONAL — inferred from analogy or data model; requires confirmation

**Rule ID Convention:** BR-{DOMAIN}-{CATEGORY}-{SEQ}

---

## Section 1: Policy Lifecycle Rules

### 1.1 Quote Expiry Rules

| Rule ID | Statement | Threshold | Confidence | Evidence |
|---------|-----------|-----------|-----------|---------|
| BR-POL-QE-001 | A new business quote that is not acted upon within 90 days of creation must be automatically transitioned to Expired status. | 90 days | HIGH | EV-0-0231 (BR-POL-T06) |
| BR-POL-QE-002 | A renewal quote that is not bound within 30 days of generation must be automatically transitioned to Expired status. | 30 days | HIGH | EV-0-0231 (BR-POL-T07) |
| BR-POL-QE-003 | An endorsement quote that is not acted upon within 90 days of creation must be automatically transitioned to Expired status. | 90 days | HIGH | EV-0-0231 (BR-POL-T08) |

---

### 1.2 Policy Fee Rule

| Rule ID | Statement | Value | Confidence | Evidence |
|---------|-----------|-------|-----------|---------|
| BR-POL-FEE-001 | A fixed policy administration fee of $195 must be applied to every policy, regardless of coverage level, premium amount, or policy type. | $195 | HIGH | EV-0-0231 (BR-POL-T09) |

---

### 1.3 Renewal Rules

| Rule ID | Statement | Threshold | Confidence | Evidence |
|---------|-----------|-----------|-----------|---------|
| BR-POL-REN-001 | The system must automatically generate a renewal quote for each eligible policy 90 days before the policy expiration date. | 90 days before expiry | HIGH | EV-0-0231 (BR-POL-T01) |
| BR-POL-REN-002 | A renewal notification must be dispatched to the assigned producer when the renewal quote is generated. | At renewal quote creation | HIGH | ART-1-002 §5 (AutomaticRenewalNotificationEmail) |
| BR-POL-REN-003 | A renewal draft reminder must be dispatched to the assigned producer before the renewal quote expires, to prompt action on the pending renewal. | Within the renewal quote window | MEDIUM | ART-1-002 §5 (SendRenewalDraftProducerEmailViaTimer) |
| BR-POL-REN-004 | If no renewal is bound within 90 days after the policy expiration date, the policy must be transitioned to Non-Renewed status. | 90 days after expiry | HIGH | EV-0-0231 (BR-POL-T04) |

---

### 1.4 Non-Renewal Notice Rules

| Rule ID | Statement | Threshold | Confidence | Evidence |
|---------|-----------|-----------|-----------|---------|
| BR-POL-NRN-001 | A formal notice of non-renewal must be generated and dispatched to the policyholder 60 days before the policy expiration date when a non-renewal disposition has been set. | 60 days before expiry | HIGH | EV-0-0231 (BR-POL-T05) |
| BR-POL-NRN-002 | When a non-renewal notice is issued for a policy with a registered mortgage, a corresponding notification must be dispatched to the mortgagee. | At non-renewal notice dispatch | HIGH | ART-1-002 §2.1 (NotifyLenderDockForRenewal with non-renewal flag) |

---

### 1.5 Policy Expiry and Lapse Rules

| Rule ID | Statement | Threshold | Confidence | Evidence |
|---------|-----------|-----------|-----------|---------|
| BR-POL-EXP-001 | A policy must be automatically transitioned to Expired status 1 day after its expiration date if it has not been renewed, cancelled, or non-renewed. | 1 day after ExpirationDate | HIGH | EV-0-0231 (BR-POL-T02) |
| BR-POL-EXP-002 | A policy must be automatically transitioned to Lapsed status when a scheduled installment payment has failed and the cancellation grace period has been triggered. | After payment failure + grace period | HIGH | ART-1-002 §5 (UpdatePolicyStatusToLapsed) |

---

### 1.6 Cancellation Rules

| Rule ID | Statement | Threshold | Confidence | Evidence |
|---------|-----------|-----------|-----------|---------|
| BR-POL-CAN-001 | If a premium installment payment fails and the outstanding amount remains unpaid for 30 calendar days, the policy must be automatically cancelled for non-payment. | 30 days from payment failure | HIGH | EV-0-0231 (BR-POL-T03, CancellationDueToNoPayment) |
| BR-POL-CAN-002 | When a policy is cancelled, a cancellation notice must be automatically dispatched to the policyholder. | At cancellation | HIGH | ART-1-002 §2.1 (SendPolicyCancellationMail) |
| BR-POL-CAN-003 | When a policy with a registered mortgage is cancelled, a cancellation notification must be dispatched to each registered mortgagee. | At cancellation | HIGH | ART-1-002 §2.1 (NotifyLenderDockForCancelledPolicy) |
| BR-POL-CAN-004 | A cancelled policy may be immediately rewritten — the cancellation and a new bound policy are processed as a single atomic transaction (Cancel/Rewrite). | At cancel/rewrite | MEDIUM | ART-1-002 §2.1 (CreateCancelRewritePolicy) |

---

### 1.7 Policy Status State Machine

The policy lifecycle state machine defines the allowed transitions:

| Current State | Allowed Transitions | Trigger |
|--------------|--------------------|---------| 
| Draft (Quote) | → Approved | Risk rating approval and all validations pass |
| Draft (Quote) | → Not Approved | Risk rating returns "Not Approved" status |
| Draft (Quote) | → Expired | Quote expiry threshold reached (BR-POL-QE-001/003) |
| Approved | → Active | Binding confirmed and initial payment collected |
| Active | → Cancelled | Manual cancellation or non-payment cancellation (BR-POL-CAN-001) |
| Active | → Lapsed | Missed payment — grace period entered |
| Active | → Expired | Term ended without renewal (BR-POL-EXP-001) |
| Active | → Non-Renewed | Non-renewal disposition set and 90-day window elapsed (BR-POL-REN-004) |
| Cancelled | → (terminal) | Except: Cancel/Rewrite creates a new Draft simultaneously |

**Evidence:** ART-1-002 §4 (Policy Status State Machine), EV-0-0006 (HIGH)

---

### 1.8 Endorsement Rules

| Rule ID | Statement | Confidence | Evidence |
|---------|-----------|-----------|---------|
| BR-POL-END-001 | An endorsement on an active policy may result in an additional premium charge, a return premium refund, or no premium change, depending on the coverage changes made. | MEDIUM | ART-1-002 §2.1 (IssueEndorsementAnual, IssueEndorsementMonthlyRefunds, IssueEndorsementNoChangePremium) |
| BR-POL-END-002 | Commission adjustments must be recalculated and recorded for each endorsement transaction. | MEDIUM | ART-1-002 §2.1 (CommissionsDetails_ENdorsements) |
| BR-POL-END-003 | When an endorsement is applied to a policy with a registered mortgage, the mortgagee must be notified of the coverage change. | MEDIUM | ART-1-002 §2.1 (NotifyLenderDockForEndorsement) |
| BR-POL-END-004 | A policy document package must be generated for each endorsement and made available for download. | MEDIUM | ART-1-002 §2.1 (InitiateProcess_QuoteProposalPackage) |

---

### 1.9 Duplicate Policy Prevention

| Rule ID | Statement | Confidence | Evidence |
|---------|-----------|-----------|---------|
| BR-POL-DUP-001 | The system must prevent the creation of a second active bound policy for the same risk location.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,, within the same tenant. If a bound policy already exists for the risk, the new binding attempt must be blocked with an explicit warning. | MEDIUM | ART-1-002 §3 (CheckIfAnyBoundPolicyExists) |

---

### 1.10 HexCat Risk Eligibility Gate

| Rule ID | Statement | Confidence | Evidence |
|---------|-----------|-----------|---------|
| BR-POL-RISK-001 | A quote may not advance past the Risk Information step if the external risk rating service returns a "Not Approved" status for the risk location. Only an "Approved" status permits continuation. | HIGH | EV-0-0218 (Step 2.2 HexCat gate), ART-1-002 §2.1 |
| BR-POL-RISK-002 | Risk rating data fields returned by the external risk rating service (zone identifiers, construction type, foundation type, stories, square footage, roof characteristics) are read-only and must not be manually overridden by users. | HIGH | EV-0-0218 (Step 2.2 — read-only fields) |

---

## Section 2: Claims Rules

### 2.1 FNOL and Claims Registration Rules

| Rule ID | Statement | Confidence | Evidence |
|---------|-----------|-----------|---------|
| BR-CLM-FNOL-001 | A First Notice of Loss must be registered against an existing, identified policy. A claim cannot be created without a corresponding policy record. | MEDIUM | ART-1-002 §2.2, ART-1-001 (Claim.PolicyId — logical FK) |
| BR-CLM-FNOL-002 | The system must check for an existing claim on the same policy with the same loss date before creating a new FNOL. If a potential duplicate is detected, user confirmation is required before proceeding. | MEDIUM | ART-1-002 §3 (CheckDuplicateClaim) |
| BR-CLM-FNOL-003 | The FNOL date must be recorded as the date the First Notice of Loss was received, which may differ from the loss date. | MEDIUM | ART-1-001 (Claim.FNOLDate, Claim.LossDate — separate fields) |

---

### 2.2 Adjuster Scope Rules

| Rule ID | Statement | Confidence | Evidence |
|---------|-----------|-----------|---------|
| BR-CLM-ADJ-001 | An adjuster may only view and act on claims that are explicitly assigned to them. Claims assigned to other adjusters within the same tenant are not accessible to an adjuster. | HIGH | ART-1-003 §2.3 (AdjusterId scope filter), EV-0-0226 |
| BR-CLM-ADJ-002 | Claim approval and rejection actions (worksheet approval, claim disposition) are gated by the IsApproveReject permission flag. Users without this flag may not perform approval or rejection actions. | HIGH | ART-1-003 §2.1 (IsApproveReject flag), EV-0-0226 |

---

### 2.3 Document Sensitivity Rules

| Rule ID | Statement | Confidence | Evidence |
|---------|-----------|-----------|---------|
| BR-CLM-DOC-001 | Claim documents may be individually designated as sensitive. Access to sensitive claim documents requires the IsAccessSensitiveDoc permission flag on the user's group assignment. | HIGH | ART-1-003 §2.1, ART-1-001 (ClaimDocument.IsSensitive), EV-0-0226 |
| BR-CLM-DOC-002 | Non-sensitive claim documents require only the IsDownloadPermission flag to download. | HIGH | ART-1-003 §2.1, EV-0-0226 |

---

### 2.4 Claim Financial Rules

| Rule ID | Statement | Confidence | Evidence |
|---------|-----------|-----------|---------|
| BR-CLM-FIN-001 | Reserves and paid amounts must be tracked at the individual coverage type level within each claim worksheet. | MEDIUM | ART-1-001 (WorksheetReserve.CoverageTypeId, ClaimCoverage.ReserveAmount, PaidAmount) |
| BR-CLM-FIN-002 | A disbursement to a claimant payee may only be processed after a valid payee record with banking details has been established for the claim. | MEDIUM | ART-1-002 §2.2 (Payee management before disbursement), ART-1-001 (Payee, BankDetail) |

---

## Section 3: Billing and Payment Rules

### 3.1 Payment Processing Rules

| Rule ID | Statement | Confidence | Evidence |
|---------|-----------|-----------|---------|
| BR-BIL-PAY-001 | Premium payments must be accepted via ACH bank debit or credit card. Both payment methods must be supported for initial and recurring payments. | MEDIUM (PROVISIONAL — TranzPay) | ART-1-002 §2.3 (AddCustomerACHDebit, AddCustomerCCCharge) |
| BR-BIL-PAY-002 | Every payment transaction, whether successful or failed, must be recorded with the gateway transaction reference, amount, payment method, transaction date, and resulting status. | MEDIUM | ART-1-001 (PolicyPaymentTransaction: GatewayTransactionId, TransactionStatus) |
| BR-BIL-PAY-003 | A refund or payment reversal must be processed against the original payment method used for the transaction being reversed. | MEDIUM (PROVISIONAL — TranzPay) | ART-1-002 §2.3 (ACHRefund, CreditCardRefund, ACHRefundCancellation, CreditCardRefundCancellation) |
| BR-BIL-PAY-004 | When a payment failure is recorded, the policyholder and any registered mortgagees must each receive a notification within the same processing cycle as the failure. | HIGH | ART-1-002 §2.3 (EmailFailedTransaction, FailedNotificationLenderdock) |

---

### 3.2 Payment Plan Rules

| Rule ID | Statement | Confidence | Evidence |
|---------|-----------|-----------|---------|
| BR-BIL-PLAN-001 | A payment plan must specify the payment frequency, the responsible party, and the number of installments. | HIGH | ART-1-001 (PolicyPaymentPlan: PaymentFrequencyId, NumberOfInstallments), EV-0-0218 |
| BR-BIL-PLAN-002 | The installment fee and installment schedule must be calculated automatically from the total premium, payment frequency, and number of installments when the payment plan is configured. | MEDIUM | ART-1-001 (PolicyPaymentPlan.InstallmentFee), ART-1-002 §2.3 (CreateOrUpdatePaymentPlans) |
| BR-BIL-PLAN-003 | Recurring premium installments must be automatically debited on the scheduled due dates for policies on a payment plan. | HIGH | ART-1-002 §5 (Timer: Auto-debit), EV-0-0231 |

---

### 3.3 Non-Payment Cancellation Rule

| Rule ID | Statement | Threshold | Confidence | Evidence |
|---------|-----------|-----------|-----------|---------|
| BR-BIL-NPC-001 | If a premium installment remains unpaid for 30 calendar days following the payment due date, the policy must be automatically cancelled for non-payment. The 30-day grace period begins on the day of the failed payment. | 30 days | HIGH | EV-0-0231 (BR-POL-T03), ART-1-002 §5 (CancellationDueToNoPayment_BL) |

---

## Section 4: Commission and Distribution Rules

| Rule ID | Statement | Confidence | Evidence |
|---------|-----------|-----------|---------|
| BR-DIST-COM-001 | Each policy must have a commission record associating the producing intermediary with a commission percentage and a computed commission amount. | MEDIUM | ART-1-001 (PolicyCommission: IntermediaryId, CommissionPercentage, CommissionAmount) |
| BR-DIST-COM-002 | Commission amounts must be recalculated and recorded for each endorsement transaction on a policy. | MEDIUM | ART-1-002 §2.1 (CommissionsDetails_ENdorsements) |
| BR-DIST-COM-003 | Commission disbursements to intermediaries must generate a disbursement notification to the receiving intermediary. | MEDIUM | ART-1-002 §1 (SendDisbursementEmail_New) |
| BR-DIST-COM-004 | When a policy is bound, the producing intermediary must be associated with the policy via the IntermediaryId. Policies must not be issued without an identified producer. | MEDIUM | ART-1-001 (Policy.IntermediaryId — FK present), ART-1-002 §2.1 |

---

## Section 5: User Management Rules

### 5.1 User Identity Uniqueness Rules

| Rule ID | Statement | Confidence | Evidence |
|---------|-----------|-----------|---------|
| BR-USR-ID-001 | Within a tenant, each user must have a unique email address. The system must reject creation of a user with an email already registered to another user in the same tenant. | HIGH | ART-1-002 §2.4 (Check_Email_IsDuplicateOrNot), ART-1-001 (User2) |
| BR-USR-ID-002 | Within a tenant, each user must have a unique phone number. The system must reject creation of a user with a phone already registered to another user in the same tenant. | HIGH | ART-1-002 §2.4 (CheckDuplicateUser by ClientId) |
| BR-USR-ID-003 | Uniqueness constraints for email and phone apply within a single tenant only — the same email or phone may be registered in a different tenant without conflict. | HIGH | ART-1-002 §2.4 (ClientId-scoped duplicate checks) |

---

### 5.2 Password Reset Rules

| Rule ID | Statement | Threshold | Confidence | Evidence |
|---------|-----------|-----------|-----------|---------|
| BR-USR-PWD-001 | Password reset tokens issued through the standard reset flow expire 30 minutes after creation. A token presented after its expiry must be rejected. | 30 minutes | HIGH | ART-1-002 §2.4 (BR-COM-RESET), ART-1-001 (UserPasswordReset.ExpiresOn) |
| BR-USR-PWD-002 | No more than 2 active password reset tokens may be generated for a single user within any 30-minute window. Additional reset requests within the same window must be rejected with a rate-limit response. | Max 2 per 30 min | HIGH | ART-1-002 §2.4 (BR-COM-RATE, ResendResetLink) |
| BR-USR-PWD-003 | Password reset tokens must be invalidated (deleted from the token store) immediately after successful use. A used token must not be reusable. | Immediate | MEDIUM | ART-1-002 §2.4 (DeleteResetPasswordToken) |

---

### 5.3 Sensitive Data Masking Rules

| Rule ID | Statement | Confidence | Evidence |
|---------|-----------|-----------|---------|
| BR-USR-MASK-001 | Personally sensitive fields (including financial account numbers, routing numbers, and identity numbers) must be displayed as masked values by default for all users. | HIGH | ART-1-003 §4, EV-0-0226 |
| BR-USR-MASK-002 | Unmasking of sensitive fields requires the IsViewSensitiveInfo permission flag to be explicitly granted on the screen for the user's group. | HIGH | ART-1-003 §2.1, §4, EV-0-0226 |
| BR-USR-MASK-003 | Sensitive field masking must be enforced at the data response layer — masked values must not be transmitted to the client even if not displayed. | HIGH | ART-1-003 §4 (RSK-1-SEC-005 target requirement) |

---

## Section 6: Group and Permission Rules

| Rule ID | Statement | Confidence | Evidence |
|---------|-----------|-----------|---------|
| BR-GRP-PERM-001 | A user's effective permissions for any given screen are the union (logical OR) of all permission flags across all groups to which the user is assigned. | HIGH | ART-1-003 §2.2, EV-0-0226 |
| BR-GRP-PERM-002 | If any group to which a user belongs has AllAccess = true for a screen, the user has full access to all 10 permission actions on that screen, regardless of individual flag settings. Scope filters (tenant, intermediary, adjuster) continue to apply. | HIGH | ART-1-003 §2.2, EV-0-0226 |
| BR-GRP-PERM-003 | When a user is added to a group, their effective permissions must be updated to include the union of the new group's flags before the user's next access. | HIGH | ART-1-002 §2.4 (CreatePrivilegesforGroupUsers) |
| BR-GRP-PERM-004 | When a user is removed from a group, permissions derived exclusively from that group must be revoked. The revocation must be complete before the user's next authenticated session. | HIGH | ART-1-002 §2.4 (DeleteGroupUser, privilege cleanup); ART-1-003 RSK-1-SEC-004 (target must implement synchronously) |
| BR-GRP-PERM-005 | Modifications to group membership (adding or removing members) require the user performing the action to hold the group management permission. | MEDIUM | ART-1-002 §2.4 (UpdateGroupsUsers gated by USERGROUPPAGE) |
| BR-GRP-PERM-006 | A user with PlatformAdmin role bypasses all screen-level permission checks. No permission flag evaluation applies to PlatformAdmin. Tenant scope filters continue to be bypassed as well. | HIGH | ART-1-003 §2.3 (permission evaluation flow — PlatformAdmin shortcut) |

---

## Section 7: Multi-Tenancy Rules

| Rule ID | Statement | Confidence | Evidence |
|---------|-----------|-----------|---------|
| BR-TENANT-001 | Every operational data record (policy, claim, account, user, group, intermediary, producer, document) must be scoped to a single tenant (ClientId). Cross-tenant data access is prohibited for all non-PlatformAdmin roles. | HIGH | ART-1-001 §5, ART-1-003 §3, EV-0-0226 |
| BR-TENANT-002 | The tenant identity of an authenticated session must be resolved from the user's identity to their assigned tenant record at login. If the user identity cannot be resolved to a tenant, no operational data may be returned. | HIGH | ART-1-001 §5, ART-1-003 §3, ART-1-002 §2.4 (GetClientIdByUserId_CS), ART-1-003 RSK-1-SEC-008 |
| BR-TENANT-003 | Reference/lookup data (insurance products, coverage types, writing companies, screen registry) is intentionally global and not scoped to any tenant. Only PlatformAdmin may modify this data. | HIGH | ART-1-001 §3 (Product, Module, AppScreen), ART-1-003 §1 ROLE-001 |
| BR-TENANT-004 | An intermediary scoped user (IntermediaryProducer) must have all policy and quote data further filtered by their IntermediaryId, within their tenant. | HIGH | ART-1-003 §2.3, EV-0-0226 |
| BR-TENANT-005 | An adjuster scoped user must have all claims data further filtered to claims assigned to their AdjusterId, within their tenant. | HIGH | ART-1-003 §2.3, EV-0-0226 |

---

## Section 8: Mortgagee / Lender Notification Rules

| Rule ID | Statement | Confidence | Evidence |
|---------|-----------|-----------|---------|
| BR-MORT-001 | When a policy with a registered mortgagee is newly issued, the mortgagee must be notified with the policy details. | HIGH | ART-1-002 §2.1 (Notify_Mortgage_LenderDock), ART-1-004 INT-002 |
| BR-MORT-002 | Mortgagee name and servicing company must be validated before notification dispatch. Notifications with invalid or incomplete mortgagee data must be blocked. | MEDIUM | ART-1-002 §3 (ValidateMortgageName, ValidateMortgageservicecompany) |
| BR-MORT-003 | A separate mortgagee notification must be dispatched for each of the following lifecycle events: policy issuance, endorsement, cancellation, non-renewal, and payment failure. | HIGH | ART-1-002 §2.1 (10 LenderDock notification variants), ART-1-004 INT-002 |
| BR-MORT-004 | A policy may have multiple lienholder/mortgagee records. Notifications must be dispatched to all registered mortgagees on the policy, not only the primary. | MEDIUM | ART-1-001 (PolicyMortgage — multiple records per PolicyId) |

---

## Section 9: Document Generation Rules

| Rule ID | Statement | Confidence | Evidence |
|---------|-----------|-----------|---------|
| BR-DOC-001 | The following document packages must be automatically generated on the corresponding lifecycle events: New Business Policy Package (at binding), Quote Proposal Package (at endorsement quote), Renewal Policy Package (at renewal binding), Notice of Non-Renewal (at non-renewal designation), Notice of Cancellation (at cancellation). | HIGH | ART-1-002 §2.1 (InitiateProcess_* functions), ART-1-004 INT-006 |
| BR-DOC-002 | All generated documents must be stored in the configured document storage system with a path reference recorded on the corresponding policy or claim record. | HIGH | ART-1-001 (PolicyDocument.BlobPath, ClaimDocument.BlobPath), ART-1-004 INT-008 |
| BR-DOC-003 | Document download access must be controlled by the IsDownloadPermission flag for the screen. Sensitive documents additionally require IsAccessSensitiveDoc. | HIGH | ART-1-003 §2.1, §4, EV-0-0226 |

---

## Section 10: Audit and Traceability Rules

| Rule ID | Statement | Confidence | Evidence |
|---------|-----------|-----------|---------|
| BR-AUD-001 | All material data changes — creation, modification, approval, and deletion of policy, claim, payment, and user records — must be captured in an audit log with: user identity, action type, affected record, session identifier, module name, and timestamp. | HIGH | ART-1-001 (AuditLog table), ART-1-002 §1 (Common module) |
| BR-AUD-002 | The policy Timeline tab must present a chronological, immutable event log showing every lifecycle transition, transaction, and user action on the policy. | HIGH | EV-0-0218 (Policy 360 Timeline tab), ART-1-001 (AuditLog) |
| BR-AUD-003 | Audit records must not be modifiable or deletable by any user role, including PlatformAdmin. | MEDIUM (governance requirement — inferred from audit intent) | ART-1-001 (AuditLog — no delete function evidenced in index) |

---

## Summary: Confirmed Policy Lifecycle Thresholds

| Rule | Threshold | Value | Confidence |
|------|-----------|-------|-----------|
| BR-POL-REN-001 | Renewal quote generated before expiry | 90 days | HIGH (EV-0-0231) |
| BR-POL-EXP-001 | Policy expired after ExpirationDate | 1 day | HIGH (EV-0-0231) |
| BR-POL-CAN-001 / BR-BIL-NPC-001 | Cancellation grace period after payment failure | 30 days | HIGH (EV-0-0231) |
| BR-POL-REN-004 | Policy Non-Renewed if no renewal bound | 90 days after expiry | HIGH (EV-0-0231) |
| BR-POL-NRN-001 | Non-renewal notice email before expiry | 60 days | HIGH (EV-0-0231) |
| BR-POL-QE-001 | New business quote expiry | 90 days | HIGH (EV-0-0231) |
| BR-POL-QE-002 | Renewal quote expiry | 30 days | HIGH (EV-0-0231) |
| BR-POL-QE-003 | Endorsement quote expiry | 90 days | HIGH (EV-0-0231) |
| BR-POL-FEE-001 | Fixed policy fee | $195 | HIGH (EV-0-0231) |

---

## Open Questions Raised During Rule Composition

| QST ID | Priority | Question | Raised For |
|--------|----------|----------|------------|
| QST-BA-006 | HIGH | What is the exact premium rating formula for the Rating Engine? Which inputs (risk zone, coverage level, property attributes, peril endorsements) determine the base premium? BR-POL-FEE-001 confirms $195 fee; base premium formula is unconfirmed. | ART-1-002 §7 (QST-1-LOGIC-001) |
| QST-BA-007 | MEDIUM | What is the exact definition and source of the "USERGROUPPAGE" permission string referenced in the group membership update gate (BR-GRP-PERM-005)? | ART-1-002 §7 (QST-1-LOGIC-003) |
| QST-BA-008 | MEDIUM | What are the exact retention and immutability requirements for the audit log (BR-AUD-003)? Is there a regulatory retention period (e.g., 7 years)? | Governance/compliance requirement |

---

*End of ART-2-005 — Business Rules Catalog | INSUREEDGE-2026 | HARVEST Phase | 2026-06-17*
*Section 1 thresholds (all 9 policy lifecycle values): HIGH confidence from confirmed site properties (EV-0-0231).*
*All rules technology-neutral. No source platform referenced. PROVISIONAL items flagged.*
