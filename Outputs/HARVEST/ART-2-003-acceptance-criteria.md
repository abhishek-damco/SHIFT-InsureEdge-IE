# ART-2-003 — Acceptance Criteria
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Business Analyst Agent
**Phase:** HARVEST
**Date:** 2026-06-17
**Confidence:** Per criterion — HIGH or MEDIUM. LOW/PROVISIONAL noted explicitly.

**WHAT/HOW Firewall:** All criteria are technology-neutral. No implementation specifics named.

**Criterion Format:** Given [precondition] / When [trigger] / Then [observable outcome]

**Coverage:** All P1 stories from ART-2-002 receive ≥3 criteria. P2 stories receive ≥1 criterion.

---

## Domain 1: Quotes & Policies

### US-POLICY-001 — Submit a new individual property insurance quote

**AC-US-POLICY-001-01** (HIGH — EV-0-0218)
Given a Producer is authenticated and has access to the new submission feature,
When the Producer completes Step 1 by providing the effective date, policy term, primary insured name, and mailing address,
Then the system saves the Policy Information record, validates that the address is resolvable, and advances the user to Step 2.1 Risk Location.

**AC-US-POLICY-001-02** (HIGH — EV-0-0218)
Given a Producer has reached Step 3 Quote Review with all required fields completed,
When the Quote Review screen is displayed,
Then the system presents an itemized premium breakdown showing Risk Premium, Coverage Premium, Taxes, and Fees, with the Total Premium = Coverage Premium + Taxes + Fees, and all values are read-only.

**AC-US-POLICY-001-03** (HIGH — ART-1-002 §3 IsContactInfoValid, IsAddressValid)
Given a Producer attempts to advance from Step 1 without supplying all required fields (effective date, insured name, mailing address),
When the Producer clicks Next,
Then the system prevents advancement, highlights the missing fields, and displays an actionable error message — no partial record is saved.

**AC-US-POLICY-001-04** (MEDIUM — ART-1-003 §1 IntermediaryProducer scope filter)
Given a Producer with an assigned IntermediaryId is authenticated,
When the Producer views the quote list,
Then the system returns only quotes associated with their IntermediaryId; quotes belonging to other intermediaries are not returned or displayed.

---

### US-POLICY-002 — Capture risk location and retrieve catastrophe zone rating

**AC-US-POLICY-002-01** (HIGH — EV-0-0218, ART-1-002 §2.1 HexCat gate)
Given a Producer has entered a risk property address in Step 2.1,
When the address is submitted,
Then the system automatically retrieves the risk rating status for that location and populates the read-only fields on Step 2.2 (zone identifiers, construction type, foundation type, floor count, square footage, roof age).

**AC-US-POLICY-002-02** (HIGH — EV-0-0218, ART-1-002 §2.1 "Not Approved" blocks)
Given a risk location address has been evaluated and the returned status is "Not Approved",
When the Producer attempts to advance from Step 2.2 to Step 2.3,
Then the system blocks progression, displays a clear message indicating the property is ineligible for coverage at this location, and prevents the quote from advancing.

**AC-US-POLICY-002-03** (HIGH — EV-0-0218, ART-1-001 — PolicyRiskInformation, RiskLocation)
Given a risk location has received an "Approved" status,
When the Producer advances past Step 2.2,
Then the system persists the risk location record (address, geocoordinates) and the risk information record (zone identifiers, construction details) linked to the quote.

**AC-US-POLICY-002-04** (HIGH — ART-1-002 §3 ValidateLatLong)
Given a manually entered property location that produces invalid geocoordinates,
When the system attempts to compute risk zone data,
Then the system rejects the location with a validation error and prompts the Producer to re-enter or correct the address before proceeding.

---

### US-POLICY-005 — Bind a quote and issue a new policy

**AC-US-POLICY-005-01** (HIGH — ART-1-002 §2.1 CreatePolicies2, UpdatePolicyStatusToActive)
Given a quote has passed all validation checks (address, limits, HexCat approval) and a first payment is collected successfully,
When the Finalize action is confirmed,
Then the system transitions the policy record's status to Active, generates a unique policy number, and records the binding transaction in the policy history.

**AC-US-POLICY-005-02** (HIGH — ART-1-002 §2.1 CheckandUpdateBoundPaymentTransaction; ART-1-001 PolicyPaymentTransaction)
Given a payment attempt during binding fails,
When the system receives a payment failure response,
Then the system does not activate the policy, records the failed transaction, and presents the user with an actionable error indicating payment was not collected.

**AC-US-POLICY-005-03** (HIGH — ART-1-002 §3 CheckIfAnyBoundPolicyExists)
Given a quote is being bound,
When the system detects an existing active policy for the same risk location within the same client tenant,
Then the system prevents binding and alerts the user that a duplicate active policy exists for this risk.

**AC-US-POLICY-005-04** (MEDIUM — ART-1-003 §1 IsCreatePermission; ART-1-003 §2.3 permission evaluation)
Given a user without the Create permission on the policy binding screen attempts to finalize a quote,
When the binding action is triggered,
Then the system denies the action, redirects to the invalid permissions screen, and logs the unauthorized attempt.

---

### US-POLICY-006 — Generate and deliver the policy declaration page

**AC-US-POLICY-006-01** (HIGH — ART-1-002 §2.1 InitiateProcess_NewBusinessPolicyPackage; ART-1-004 INT-006)
Given a policy has been successfully bound and its status is Active,
When the binding process completes,
Then the system automatically initiates generation of the policy declaration page document and stores the resulting document in the configured document storage with a reference path recorded in the policy document record.

**AC-US-POLICY-006-02** (HIGH — ART-1-001 — PolicyDocument: DocumentTypeId, UploadedOn, UploadedBy)
Given a declaration page has been generated,
When a user with the Download permission accesses the policy document list,
Then the document appears in the list with the correct document type, upload timestamp, and is downloadable.

**AC-US-POLICY-006-03** (MEDIUM — ART-1-003 §4 IsDownloadPermission; ART-1-001 PolicyDocument)
Given a user without the Download permission attempts to retrieve a policy document,
When the download action is triggered,
Then the system denies the request and does not serve the document.

---

### US-POLICY-007 — Notify the mortgage lender when a policy is issued

**AC-US-POLICY-007-01** (HIGH — ART-1-002 §2.1 Notify_Mortgage_LenderDock; ART-1-001 PolicyMortgage)
Given a bound policy has one or more lienholder/mortgage records,
When the policy status transitions to Active,
Then the system automatically dispatches a notification to each registered mortgagee with the policy details (policy number, effective date, coverage amounts).

**AC-US-POLICY-007-02** (HIGH — ART-1-002 §3 IsMortgageValid; ART-1-004 INT-002 LenderDock)
Given a mortgage record fails validation (missing required name or servicer data),
When the system attempts to send the mortgagee notification,
Then the system rejects the notification attempt, records the error, and surfaces an alert to the ClientAdmin so the mortgage data can be corrected before notification is resent.

**AC-US-POLICY-007-03** (HIGH — ART-1-002 §2.1 NotifyLenderDockForEndorsement, NotifyLenderDockForCancelledPolicy, NotifyLenderDockForRenewal)
Given an active policy with a mortgage undergoes an endorsement, cancellation, or renewal,
When each lifecycle event is committed,
Then the system dispatches the appropriate mortgagee notification corresponding to the event type — distinct notifications are sent for each event type.

---

### US-POLICY-010 — Automatically generate renewal quotes 90 days before policy expiry

**AC-US-POLICY-010-01** (HIGH — EV-0-0231, BR-POL-T01 RenewalQuoteDaysThreshold = 90 days)
Given a policy with an approaching expiration date,
When the daily renewal processing run executes and the expiration date is exactly 90 days from today,
Then the system generates a renewal quote record linked to the originating policy and sets the renewal quote status to Draft.

**AC-US-POLICY-010-02** (HIGH — ART-1-002 §5 AutomaticRenewalNotificationEmail; ART-1-004 INT-005 Email)
Given a renewal quote has been generated,
When the renewal quote is created,
Then the system dispatches a renewal draft notification to the assigned Producer, referencing the policy number and expiration date.

**AC-US-POLICY-010-03** (HIGH — EV-0-0231, BR-POL-T07 RenewalQuotesExpiredAfterDays = 30 days)
Given a renewal quote has been generated and is in Draft status,
When 30 days pass without the renewal quote being bound,
Then the system transitions the renewal quote status to Expired.

---

### US-POLICY-012 — Cancel a policy and notify all stakeholders

**AC-US-POLICY-012-01** (HIGH — ART-1-002 §2.1 CreateCancelRewritePolicy; ART-1-001 Policy.PolicyStatusId)
Given a ClientAdmin initiates a policy cancellation for an active policy,
When the cancellation is confirmed with a cancellation effective date,
Then the system transitions the policy status to Cancelled, records the cancellation transaction in the policy history, and stamps the cancellation effective date.

**AC-US-POLICY-012-02** (HIGH — ART-1-002 §2.1 SendPolicyCancellationMail; ART-1-004 INT-005 Email)
Given a policy has been cancelled,
When the cancellation is committed,
Then the system automatically sends a cancellation notice to the policyholder's registered email address.

**AC-US-POLICY-012-03** (HIGH — ART-1-002 §2.1 NotifyLenderDockForCancelledPolicy; ART-1-001 PolicyMortgage)
Given a cancelled policy has associated mortgage records,
When the cancellation is committed,
Then the system automatically dispatches a cancellation notification to each registered mortgagee.

**AC-US-POLICY-012-04** (MEDIUM — ART-1-003 §2.1 IsEditPermission on cancel action)
Given a user without the required permission for the cancellation action,
When the user attempts to cancel a policy,
Then the system denies the action and does not change the policy status.

---

### US-POLICY-013 — Automatically cancel a policy after non-payment grace period

**AC-US-POLICY-013-01** (HIGH — EV-0-0231, BR-POL-T03 CancellationThresholdDays = 30; ART-1-002 §5 CancellationDueToNoPayment_BL)
Given a policy has an outstanding installment that has not been paid,
When 30 calendar days have elapsed from the payment due date without a successful payment,
Then the system automatically cancels the policy (status → Cancelled) via the scheduled non-payment cancellation process.

**AC-US-POLICY-013-02** (HIGH — ART-1-002 §2.3 EmailFailedTransaction; ART-1-004 INT-005 Email)
Given a policy is approaching the cancellation threshold due to non-payment,
When the failed payment is recorded,
Then the system sends a payment failure notification to the policyholder, informing them of the outstanding amount and the grace period deadline.

**AC-US-POLICY-013-03** (HIGH — ART-1-002 §2.1 FailedNotificationLenderdock; ART-1-004 INT-002 LenderDock)
Given a payment failure has occurred on a mortgaged policy,
When the payment failure is recorded,
Then the system dispatches a payment failure notification to the registered mortgagee(s).

---

### US-POLICY-014 — Issue a notice of non-renewal and set non-renewal status

**AC-US-POLICY-014-01** (HIGH — EV-0-0231, BR-POL-T05 SendNonRenewalEmailBeforeExpiryDays = 60; ART-1-002 §5)
Given a policy is designated for non-renewal,
When the scheduled process determines the policy expiration date is 60 days from today,
Then the system generates a formal notice of non-renewal document and dispatches it to the policyholder.

**AC-US-POLICY-014-02** (HIGH — EV-0-0231, BR-POL-T04 PolicyNonRenewedAfterDays = 90; ART-1-002 §5 UpdatePolicyStatusToNonRenewed)
Given a policy has passed its expiration date and no renewal has been bound,
When 90 days have elapsed since the expiration date without a bound renewal,
Then the system transitions the policy status to Non-Renewed.

**AC-US-POLICY-014-03** (HIGH — ART-1-002 §2.1 NotifyLenderDockForRenewal with non-renewal flag; ART-1-004 INT-002)
Given a non-renewal notice has been issued for a mortgaged policy,
When the non-renewal notice is generated,
Then the system dispatches a corresponding notification to the registered mortgagee(s) indicating non-renewal disposition.

---

## Domain 2: Claims

### US-CLAIMS-001 — Register a First Notice of Loss (FNOL)

**AC-US-CLAIMS-001-01** (MEDIUM — ART-1-002 §2.2 NewClaim; ART-1-001 Claim: FNOLDate, LossDate, ClaimStatusId)
Given a ClientAdmin or Adjuster is authenticated and selects an existing active policy,
When a FNOL is registered with a valid loss date, date of FNOL, and reported-by information,
Then the system creates a Claim record linked to the policy, assigns a unique claim number, sets the claim status to FNOL, and records the FNOL date as today.

**AC-US-CLAIMS-001-02** (MEDIUM — ART-1-002 §3 CheckDuplicateClaim; ART-1-001 Claim)
Given a FNOL is being submitted,
When the system detects an existing open claim for the same policy with the same loss date,
Then the system warns the user of a potential duplicate and requires confirmation before creating a second claim record.

**AC-US-CLAIMS-001-03** (MEDIUM — ART-1-003 §1 ROLE-004 Adjuster scope; ART-1-003 §2.3)
Given an Adjuster is authenticated,
When the Adjuster views the claims list,
Then the system returns only claims assigned to that Adjuster's AdjusterId; claims assigned to other adjusters are not shown.

---

### US-CLAIMS-004 — Create and manage a financial worksheet with reserves per coverage

**AC-US-CLAIMS-004-01** (MEDIUM — ART-1-002 §2.2 Worksheet, WorksheetReserve; ART-1-001 Worksheet, WorksheetReserve)
Given an Adjuster or ClientAdmin is viewing an open claim,
When a worksheet is created,
Then the system creates a Worksheet record linked to the claim and allows the user to record reserve amounts for each impacted coverage type.

**AC-US-CLAIMS-004-02** (MEDIUM — ART-1-003 §2.1 IsApproveReject flag; ART-1-002 §2.2 IsClaimApproveRejectValid)
Given a worksheet has been completed and requires approval,
When a user with the IsApproveReject permission approves the worksheet,
Then the system updates the worksheet status to reflect the approval and records the approving user and timestamp.

**AC-US-CLAIMS-004-03** (MEDIUM — ART-1-003 §2.1 IsApproveReject = false)
Given a user does not have the IsApproveReject permission,
When the user attempts to approve or reject a claim worksheet,
Then the system denies the action and the worksheet status remains unchanged.

---

### US-CLAIMS-009 — Close or deny a claim and generate claim correspondence

**AC-US-CLAIMS-009-01** (MEDIUM — ART-1-002 §2.2 ClaimStatus → CLOSED/DENIED; ART-1-001 Claim.ClaimStatusId)
Given a ClientAdmin or Adjuster with appropriate permissions is reviewing an open claim,
When the claim is marked as Closed or Denied with a disposition reason,
Then the system updates the claim status to the selected terminal state and records the closure date and reason.

**AC-US-CLAIMS-009-02** (MEDIUM — ART-1-002 §2.2 SendClaimLetterEmail; ART-1-004 INT-005 Email)
Given a claim has been closed or denied,
When the terminal status is committed,
Then the system dispatches a claim determination letter to the claimant's registered contact with the claim number, determination, and effective date.

**AC-US-CLAIMS-009-03** (MEDIUM — ART-1-003 §2.1 IsApproveReject; ART-1-001 Claim)
Given a user without IsApproveReject permission attempts to close or deny a claim,
When the action is triggered,
Then the system denies the action and the claim status remains unchanged.

---

### US-CLAIMS-010 — Prevent duplicate FNOL registration

**AC-US-CLAIMS-010-01** (MEDIUM — ART-1-002 §3 CheckDuplicateClaim; ART-1-001 Claim)
Given an open claim exists for a given policy with a specific loss date,
When a second FNOL is submitted for the same policy and the same loss date,
Then the system identifies the potential duplicate, presents a warning to the user, and requires explicit confirmation before allowing a second claim record to be created.

**AC-US-CLAIMS-010-02** (MEDIUM — ART-1-001 Claim; ART-1-003 ClientId scope)
Given the duplicate check is performed,
When the check is executed,
Then the scope of the duplicate search is limited to claims within the same tenant (ClientId), ensuring cross-tenant claims do not trigger false positives.

---

## Domain 3: Billing & Payments

### US-BILLING-001 — Configure a payment plan for a policy

**AC-US-BILLING-001-01** (HIGH — EV-0-0218 Billing tab; ART-1-001 PolicyPaymentPlan)
Given a ClientAdmin is viewing the Billing tab of a policy,
When a payment frequency, responsible party, and number of installments are selected and saved,
Then the system persists the payment plan configuration and displays the installment schedule with calculated installment amounts.

**AC-US-BILLING-001-02** (HIGH — ART-1-001 PolicyPaymentPlan.InstallmentFee; ART-1-002 BR-POL-T09)
Given a payment plan is configured with installments,
When the plan is saved,
Then the system applies the fixed policy fee of $195 to the total premium calculation, and the installment fee is correctly apportioned across the payment schedule.

**AC-US-BILLING-001-03** (MEDIUM — ART-1-003 §2.1 IsCreatePermission on MakePayment)
Given a user without the Create permission on the billing/payment screen,
When the user attempts to configure or modify a payment plan,
Then the system denies the action and retains the existing payment plan configuration unchanged.

---

### US-BILLING-002 — Process premium payment via ACH or credit card [PROVISIONAL]

**AC-US-BILLING-002-01** [PROVISIONAL] (MEDIUM — ART-1-002 §2.3 AddCustomerACHDebit, AddCustomerCCCharge; ART-1-004 INT-001 TranzPay placeholder)
Given a ClientAdmin initiates a payment for a policy and selects ACH or credit card as the payment method,
When the payment is submitted to the payment gateway,
Then the system receives a confirmation reference from the gateway, records the transaction with status SUCCESS, and stores the gateway transaction reference on the payment record.

**AC-US-BILLING-002-02** [PROVISIONAL] (MEDIUM — ART-1-002 §2.3 EmailFailedTransaction; ART-1-004 INT-001)
Given a payment gateway transaction fails (decline, network error, or invalid credentials),
When the failure response is received,
Then the system records the transaction with status FAILED, does not charge the policyholder, and surfaces an actionable error to the ClientAdmin.

**Note:** Payment gateway (TranzPay) is a PLACEHOLDER. Criteria above assume a standard payment gateway interface. Final acceptance criteria depend on TranzPay contract details. (QST-1-INT-001, ASM-1-INT-001)

---

### US-BILLING-003 — Execute automatic recurring premium debits [PROVISIONAL]

**AC-US-BILLING-003-01** [PROVISIONAL] (HIGH — ART-1-002 §5 AutoDebitPaymentTranzpay; EV-0-0231)
Given a policy has an active payment plan with scheduled installments,
When the scheduled processing run executes on the installment due date,
Then the system submits the installment amount for debit against the registered payment method and records the resulting transaction (SUCCESS or FAILED).

**AC-US-BILLING-003-02** (HIGH — ART-1-002 §5 Timer kill switch; EV-0-0231 KillTimer)
Given the scheduled payment processing is enabled,
When the kill switch configuration is set to halt all timers,
Then the system suspends all scheduled payment jobs without affecting the current status of any policy or payment record.

---

### US-BILLING-004 — Handle a failed payment and notify stakeholders

**AC-US-BILLING-004-01** (HIGH — ART-1-002 §2.3 FailedNotificationLenderdock; ART-1-004 INT-002 LenderDock)
Given a payment failure has occurred on a policy with an associated mortgage,
When the payment failure is recorded,
Then the system dispatches a payment failure notification to the registered mortgagee within the same processing cycle.

**AC-US-BILLING-004-02** (HIGH — ART-1-002 §2.3 EmailFailedTransaction; ART-1-004 INT-005 Email)
Given a payment failure has occurred,
When the failure is recorded,
Then the system sends a payment failure notice to the policyholder's registered email containing the failed amount, the policy number, and the deadline by which payment must be received to avoid cancellation.

**AC-US-BILLING-004-03** (HIGH — ART-1-002 §5 BR-POL-T03 CancellationThresholdDays = 30; ART-1-001 Policy)
Given a payment failure notification has been sent,
When 30 calendar days elapse without a successful payment,
Then the system initiates the cancellation process (US-POLICY-013) and transitions the policy to Cancelled status.

---

## Domain 4: Distribution Management

### US-DIST-001 — Onboard a new intermediary

**AC-US-DIST-001-01** (MEDIUM — ART-1-001 Intermediary: IntermediaryCode, CompanyName, CommissionPercentage; ART-1-002 §1 Distribution)
Given a ClientAdmin creates a new intermediary record with company name, intermediary code, contact details, and default commission percentage,
When the record is saved,
Then the system persists the intermediary record scoped to the ClientAdmin's tenant and the intermediary appears in the intermediary list.

**AC-US-DIST-001-02** (MEDIUM — ART-1-003 §2.3 IntermediaryProducer scope; ART-1-001 Intermediary.ClientId)
Given a Producer who belongs to an intermediary is authenticated,
When the Producer views the intermediary list,
Then the system returns only the Producer's own intermediary record; other tenant intermediaries are not accessible.

---

### US-DIST-003 — Configure and view commission rates

**AC-US-DIST-003-01** (MEDIUM — ART-1-001 PolicyCommission, Intermediary.CommissionPercentage; ART-1-002 §1 Commission)
Given a ClientAdmin sets the commission percentage for an intermediary,
When a policy is bound through that intermediary,
Then the system calculates the commission amount based on the configured percentage and records it in the commission record linked to the policy.

---

## Domain 5: User Management

### US-USER-001 — Create a new user account

**AC-US-USER-001-01** (HIGH — EV-0-0222; ART-1-002 §2.4 CreateUser, EncryptPassword)
Given a ClientAdmin completes the Add User form with all required fields (name, email, role, group assignments),
When the form is saved,
Then the system creates a user account, assigns the user to the specified groups, hashes the user's credentials, and the user appears in the user management list.

**AC-US-USER-001-02** (HIGH — ART-1-002 §2.4 Check_Email_IsDuplicateOrNot; ART-1-001 User2)
Given a ClientAdmin attempts to create a user with an email address already registered to another user in the same tenant,
When the save action is triggered,
Then the system rejects the creation with a duplicate email error and does not create the user record.

**AC-US-USER-001-03** (HIGH — ART-1-002 §2.4 CheckDuplicateUser; ART-1-001 User2)
Given a ClientAdmin attempts to create a user with a phone number already registered to another user in the same tenant,
When the save action is triggered,
Then the system rejects the creation with a duplicate phone error and does not create the user record.

**AC-US-USER-001-04** (HIGH — ART-1-003 §3 ClientId scoping; ART-1-001 User2.ClientId)
Given a user account is created,
When the account is persisted,
Then the user record is scoped to the creating ClientAdmin's tenant (ClientId) and cannot be accessed by users in other tenants.

---

### US-USER-002 — Assign a user to groups to grant permissions

**AC-US-USER-002-01** (HIGH — EV-0-0222; ART-1-002 §2.4 CreateGroupsUsers, CreatePrivilegesforGroupUsers)
Given a ClientAdmin assigns a user to one or more groups during user creation,
When the form is saved,
Then the system creates group membership records for each selected group and generates the user's effective permission set by union of all assigned group flags.

**AC-US-USER-002-02** (HIGH — ART-1-003 §2.2 union of flags; ART-1-001 ScreenPermissions)
Given a user belongs to two groups where Group A grants View permission on a screen and Group B grants Create permission on the same screen,
When the user accesses that screen,
Then the user's effective permissions include both View and Create (union of flags), enabling both actions.

**AC-US-USER-002-03** (HIGH — ART-1-003 §2.2 AllAccess override; ART-1-001 ScreenPermissions.AllAccess)
Given a user belongs to a group with AllAccess = true for a specific screen,
When the user accesses that screen,
Then all 10 permission flags are effectively granted to the user for that screen, regardless of individual flag settings on other group assignments.

---

### US-USER-003 — Send a password reset link to a user

**AC-US-USER-003-01** (HIGH — EV-0-0222; ART-1-002 §2.4 RequestResetPassword, 30-minute expiry BR-COM-RESET)
Given a ClientAdmin initiates a password reset from the user's profile,
When the Reset Password action is confirmed in the modal,
Then the system generates a password reset token with a 30-minute expiry, stores it in the reset token store, and dispatches a password reset email to the user's registered address.

**AC-US-USER-003-02** (HIGH — ART-1-002 §2.4 ResendResetLink, BR-COM-RATE: max 2 active tokens in 30 min)
Given a password reset email has already been sent twice within the past 30 minutes,
When a third reset request is submitted,
Then the system rejects the request with a rate-limit message and does not generate a new reset token.

**AC-US-USER-003-03** (HIGH — ART-1-002 §2.4 IsResetPasswordTokenValid; ART-1-001 UserPasswordReset.ExpiresOn)
Given a user attempts to use a password reset token that has expired (older than 30 minutes),
When the token is submitted,
Then the system rejects the reset attempt, informs the user that the link has expired, and prompts them to request a new reset.

---

### US-USER-004 — View and edit a user's profile and permissions

**AC-US-USER-004-01** (HIGH — EV-0-0222; ART-1-005 §1.7 View User / Edit User inline)
Given a ClientAdmin views a user's profile,
When the ClientAdmin clicks the edit icon for the Primary Info section,
Then the Primary Info section enters inline edit mode while other sections remain in read-only display mode.

**AC-US-USER-004-02** (HIGH — EV-0-0222; ART-1-005 §1.7 Unsaved Changes Modal)
Given a ClientAdmin has made unsaved changes to a user's profile,
When the ClientAdmin attempts to navigate away from the profile,
Then the system presents an "Unsaved Changes" confirmation dialog before discarding the changes.

**AC-US-USER-004-03** (HIGH — ART-1-003 §3 ClientId scoping)
Given a ClientAdmin edits a user's profile,
When the changes are saved,
Then the updated user record remains scoped to the ClientAdmin's tenant and the changes are not visible to users of other tenants.

---

### US-USER-005 — Prevent duplicate user accounts

**AC-US-USER-005-01** (HIGH — ART-1-002 §2.4 Check_Email_IsDuplicateOrNot; ART-1-001 User2)
Given two users with the same email address exist in different tenants,
When a ClientAdmin in Tenant A creates a user with an email already registered in Tenant B,
Then the system allows the creation, because the duplicate check is scoped to the ClientAdmin's tenant (ClientId) only.

**AC-US-USER-005-02** (HIGH — ART-1-002 §2.4 CheckDuplicateUser by ClientId; ART-1-001 User2.ClientId)
Given a user with a given phone number already exists in the same tenant,
When a ClientAdmin attempts to create a second user with the same phone number in the same tenant,
Then the system rejects the creation with a duplicate phone error.

---

## Domain 6: Group Management

### US-GROUP-001 — Create a user group with permissions

**AC-US-GROUP-001-01** (HIGH — EV-0-0048; ART-1-005 §1.6 Add User Group)
Given a ClientAdmin accesses the Add User Group form,
When the form is completed with a group name, group leader, and at least one group member, and saved,
Then the system creates the group record, assigns the group leader, links all specified members, and the group appears in the group list.

**AC-US-GROUP-001-02** (HIGH — ART-1-001 ScreenPermissions; ART-1-003 §2.1 10 flags)
Given a ClientAdmin configures permission flags for a group across all 8 modules,
When the group is saved,
Then the system persists one ScreenPermissions record per screen per group with the configured flag values, and all members of the group immediately inherit the union of the new group's flags.

**AC-US-GROUP-001-03** (HIGH — ART-1-001 Group_Table.ClientId; ART-1-003 §3 ClientId scoping)
Given a new group is created,
When the group is persisted,
Then the group is scoped to the creating ClientAdmin's tenant and is not visible to users in other tenants.

---

### US-GROUP-002 — Update group membership and synchronize permissions

**AC-US-GROUP-002-01** (HIGH — ART-1-002 §2.4 CreateGroupsUsers full sync; ART-1-001 GroupUser_Table)
Given a ClientAdmin updates the member list of a group by removing one user and adding another,
When the membership change is saved,
Then the system performs a full membership sync: removes the outgoing user's membership record and adds the new user's membership record.

**AC-US-GROUP-002-02** (HIGH — ART-1-002 §2.4 LaunchDeleteUserGroupPrivelagesUpdated; ART-1-003 RSK-1-SEC-004)
Given a user is removed from a group,
When the removal is committed,
Then the system initiates the privilege cleanup process for the removed user to revoke group-derived permissions; the target implementation must ensure this cleanup completes before the user's next session to eliminate the privilege race window (RSK-1-SEC-004 remediation requirement).

**AC-US-GROUP-002-03** (MEDIUM — ART-1-003 §2.2; ART-1-002 §2.4 UpdateGroupsUsers gated by USERGROUPPAGE)
Given a user without the required group management permission attempts to update group membership,
When the update action is triggered,
Then the system rejects the action with an insufficient permission response.

---

### US-GROUP-004 — Configure per-screen permission flags

**AC-US-GROUP-004-01** (HIGH — EV-0-0048; ART-1-001 ScreenPermissions.AllAccess)
Given a ClientAdmin sets AllAccess = true for a group on a specific screen,
When a member of that group accesses the screen,
Then the system grants the user all 10 permission actions on that screen, regardless of individual flag settings.

**AC-US-GROUP-004-02** (HIGH — ART-1-003 §2.3 IsViewSensitiveInfo; ART-1-001 ScreenPermissions.IsViewSensitiveInfo)
Given a group has IsViewSensitiveInfo = false for a screen displaying financial fields,
When a member of that group views the screen,
Then sensitive fields (such as financial account numbers and identity fields) are masked and the unmasked values are not transmitted to the client.

**AC-US-GROUP-004-03** (HIGH — ART-1-003 §4; ART-1-001 ClaimDocument.IsSensitive)
Given a group has IsAccessSensitiveDoc = false,
When a member of that group attempts to open or download a document tagged as sensitive,
Then the system denies the document access request and does not serve the document content.

---

## Domain 7: Reports

### US-REPORT-006 — Dashboard KPI view

**AC-US-REPORT-006-01** (HIGH — EV-0-0218; ART-1-005 §1.1 Global Dashboard)
Given any authenticated user lands on the dashboard,
When the dashboard loads,
Then the system displays KPI cards for: New Business Quotes (Uploaded, Approved, Not Approved, Expired) and Policies (New Business Issued, Renewed, Non-Renewed, Cancelled), with values scoped to the user's role and tenant.

**AC-US-REPORT-006-02** (HIGH — ART-1-003 §1 IntermediaryProducer scope; ART-1-003 §2.3)
Given a Producer is authenticated,
When the dashboard loads,
Then all KPI values reflect only the policies and quotes associated with the Producer's IntermediaryId — no other intermediary's data is included.

**AC-US-REPORT-006-03** (HIGH — ART-1-001 Policy.ClientId; ART-1-003 §3 multi-tenancy)
Given a ClientAdmin from Tenant A is authenticated,
When the dashboard loads,
Then all displayed metrics are computed exclusively from the ClientAdmin's tenant (ClientId) data — no data from other tenants appears.

---

## P2 Stories — Single Criterion Each

### US-POLICY-011 — Manually initiate a policy renewal

**AC-US-POLICY-011-01** (HIGH — EV-0-0218 Tools: Renew Manually; ART-1-002 §2.1 GenerateRenewalPolicyQuotesForManually)
Given a ClientAdmin selects "Renew Manually" from the policy tools for an active policy,
When the action is confirmed,
Then the system generates a renewal quote in Draft status linked to the originating policy, records the manual renewal transaction in the policy history, and notifies the assigned Producer.

---

### US-POLICY-016 — Expire quotes automatically

**AC-US-POLICY-016-01** (HIGH — EV-0-0231, BR-POL-T06/T07/T08; ART-1-002 §5)
Given a new business quote has remained in Draft or Approved status for more than 90 days without being bound,
When the daily expiry processing run executes,
Then the system transitions the quote status to Expired and records the expiry date; the same applies to renewal quotes at 30 days and endorsement quotes at 90 days.

---

### US-BILLING-005 — Process a refund or reversal

**AC-US-BILLING-005-01** [PROVISIONAL] (MEDIUM — ART-1-002 §2.3 ACHRefund, CreditCardRefund; ART-1-004 INT-001 TranzPay)
Given a ClientAdmin initiates a refund for a previously successful payment,
When the refund is submitted,
Then the system submits the reversal to the payment gateway and records the resulting transaction as a refund with the gateway reference, reducing the outstanding balance on the policy.

---

### US-DIST-005 — Geocode intermediary office addresses

**AC-US-DIST-005-01** (MEDIUM — ART-1-002 §1 geocoding in Distribution; ART-1-004 INT-003 Google Geocoding)
Given a ClientAdmin saves an intermediary address,
When the address is persisted,
Then the system automatically resolves the address to geocoordinates using the configured geocoding service and stores the latitude and longitude on the intermediary record.

---

### US-USER-006 — View user permission rights

**AC-US-USER-006-01** (HIGH — EV-0-0222; ART-1-005 §1.7 View User with User-Rights accordions)
Given a ClientAdmin views a user's profile,
When the User-Rights section is displayed,
Then the system presents the effective permission matrix across all 8 modules and all 10 flags, showing the union of all group-assigned permissions for that user.

---

### US-GROUP-003 — Browse groups and export

**AC-US-GROUP-003-01** (HIGH — EV-0-0048; ART-1-005 §1.6 Download PDF/CSV/Excel/TXT)
Given a ClientAdmin is on the Group Management landing page,
When the Download button is clicked and a format (PDF, CSV, Excel, or TXT) is selected,
Then the system generates and returns an export file containing the full group list visible to the user in the selected format.

---

### US-REPORT-001 — View production and premium reports

**AC-US-REPORT-001-01** (LOW — EV-0-0048 report types confirmed; content inferred) [PROVISIONAL]
Given a ClientAdmin navigates to the production reports,
When the New Business Issuance Report is loaded for a selected date range,
Then the system returns a data set showing policy count and written premium totals for new business policies issued in that period, scoped to the ClientAdmin's tenant.

---

*End of ART-2-003 — Acceptance Criteria | INSUREEDGE-2026 | HARVEST Phase | 2026-06-17*
*P1 stories: 34 stories, each with ≥3 criteria. P2 stories: 19 stories, each with ≥1 criterion.*
*PROVISIONAL criteria flagged for TranzPay-dependent stories. Claims module criteria at MEDIUM (LOW UI coverage — DBT-1-0003).*
