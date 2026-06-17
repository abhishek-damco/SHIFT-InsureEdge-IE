# ART-2-002 — User Stories
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Business Analyst Agent
**Phase:** HARVEST
**Date:** 2026-06-17
**Confidence:** Per story (see individual entries)

**WHAT/HOW Firewall:** No implementation technology is named in any story. Stories describe business capabilities only.

**Evidence Key:**
- EV-0-0218 = Q&P PRD (Quotes & Policies); EV-0-0222 = User Management PRD; EV-0-0048 = Group Management/Permissions PRD
- EV-0-0226 = Roles & Permissions catalogue; EV-0-0003 = Logic module index
- ART-1-001 = Data Catalogue; ART-1-002 = Logic Catalogue; ART-1-003 = Security Catalogue; ART-1-004 = Integration Catalogue; ART-1-005 = Screen Catalogue

**Priority Definitions:**
- P1 = Core — blocking functionality; must be present at go-live.
- P2 = Important — significant operational value; should be present at go-live.
- P3 = Desirable — operational efficiency; may be deferred to subsequent release.

---

## Domain 1: Quotes & Policies

### US-POLICY-001
**Title:** Submit a new individual property insurance quote
**Role:** Producer / Intermediary (IntermediaryProducer)
**Story:** As a Producer, I want to submit a new individual property insurance quote through a guided multi-step form, so that I can initiate coverage for a policyholder and receive a premium estimate.
**Priority:** P1
**Domain Cross-References:** UI (ART-1-005 §1.2 — New Submission Wizard Steps 1–3), Logic (ART-1-002 §2.1 — Draft Quote flow), Data (ART-1-001 — Policy, RiskLocation, PolicyLimitCoverage), Integration (ART-1-004 INT-003 Geocoding, INT-007 HexCat)
**Confidence:** HIGH (EV-0-0218 — wizard fully evidenced through Step 3)

---

### US-POLICY-002
**Title:** Capture risk location and retrieve catastrophe zone rating
**Role:** Producer / Intermediary (IntermediaryProducer), ClientAdmin
**Story:** As a Producer, I want the system to automatically retrieve risk rating data for a property address, so that I can understand whether the property is eligible for coverage before proceeding with the quote.
**Priority:** P1
**Domain Cross-References:** UI (ART-1-005 §1.2 — Step 2.2 Risk Information), Logic (ART-1-002 §2.1 — HexCat status gates progression), Integration (ART-1-004 INT-007 HexCat), Data (ART-1-001 — PolicyRiskInformation, RiskLocation)
**Confidence:** HIGH (EV-0-0218 — HexCat step fully evidenced)
**Note:** HexCat "Not Approved" status blocks progression. Business rule BR-POLICY-HEXCAT-GATE (ART-1-002 §2.1).

---

### US-POLICY-003
**Title:** Select coverage levels, limits, and peril endorsements
**Role:** Producer / Intermediary (IntermediaryProducer), ClientAdmin
**Story:** As a Producer, I want to select a coverage plan tier, dwelling limit, deductible, and optional peril endorsements, so that I can tailor the policy to the policyholder's risk profile.
**Priority:** P1
**Domain Cross-References:** UI (ART-1-005 §1.2 — Steps 2.3 Limits & Coverages, 2.4 Plans Overview), Logic (ART-1-002 §3 — IsLimitsAndCoverageValid), Data (ART-1-001 — PolicyLimitCoverage)
**Confidence:** HIGH (EV-0-0218)

---

### US-POLICY-004
**Title:** Review and finalize a quote before binding
**Role:** Producer / Intermediary (IntermediaryProducer), ClientAdmin
**Story:** As a Producer, I want to review the total estimated premium (risk premium, coverage premium, taxes, fees) in a structured summary before finalizing the quote, so that I can confirm accuracy and present the quote to the policyholder.
**Priority:** P1
**Domain Cross-References:** UI (ART-1-005 §1.2 — Step 3 Quote Review), Logic (ART-1-002 §2.1 — TotalPremium = CoveragePremium + Taxes + Fees), Data (ART-1-001 — Policy.TotalPremium)
**Confidence:** HIGH (EV-0-0218)

---

### US-POLICY-005
**Title:** Bind a quote and issue a new policy
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to bind an approved quote and collect the initial premium payment, so that a policy is formally issued and becomes active.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.1 — CreatePolicies2, FirstPaymentTransaction), Data (ART-1-001 — Policy.PolicyStatusId → ACTIVE), Integration (ART-1-004 INT-001 TranzPay — PROVISIONAL)
**Confidence:** HIGH for binding flow; MEDIUM for payment gateway (TranzPay placeholder)
**Note (ASM-BA-001):** The "so that" assumes payment is collected at binding. This is evidenced by `FirstPaymentTransaction` but the TranzPay contract is pending (QST-1-INT-001).

---

### US-POLICY-006
**Title:** Generate and deliver the policy declaration page
**Role:** System (automated, triggered by ClientAdmin action)
**Story:** As a ClientAdmin, I want the system to automatically generate the policy declaration page upon binding, so that the policyholder receives their coverage confirmation documents immediately.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.1 — InitiateProcess_NewBusinessPolicyPackage), Integration (ART-1-004 INT-006 Plumsail, INT-008 Azure Blob Storage), Data (ART-1-001 — PolicyDocument)
**Confidence:** HIGH (EV-0-0006, EV-0-0019)

---

### US-POLICY-007
**Title:** Notify the mortgage lender when a policy is issued
**Role:** System (automated)
**Story:** As a ClientAdmin, I want the system to automatically notify the mortgagee/lender when a policy involving a mortgage is bound, so that lienholder records are kept current.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.1 — Notify_Mortgage_LenderDock), Integration (ART-1-004 INT-002 LenderDock), Data (ART-1-001 — PolicyMortgage)
**Confidence:** HIGH (EV-0-0006, EV-0-0228)

---

### US-POLICY-008
**Title:** Endorse an active policy mid-term
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to initiate an endorsement on an active policy to change coverage terms, so that the policy reflects the policyholder's updated risk or coverage needs.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.1 — CreateEndorsementPolicyQuote, IssueEndorsementAnual), Data (ART-1-001 — Policy, PolicyLimitCoverage), Integration (ART-1-004 INT-002 LenderDock, INT-006 Plumsail)
**Confidence:** HIGH (EV-0-0006)

---

### US-POLICY-009
**Title:** Process endorsement premium adjustment (additional or return premium)
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want the system to calculate and collect or refund the premium difference when a policy is endorsed, so that billing accurately reflects the changed coverage.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.1 — IssueEndorsementAnual, IssueEndorsementMonthlyRefunds, IssueEndorsementNoChangePremium), Data (ART-1-001 — PolicyPaymentTransaction), Integration (ART-1-004 INT-001 TranzPay — PROVISIONAL)
**Confidence:** HIGH for flow; MEDIUM for payment step

---

### US-POLICY-010
**Title:** Automatically generate renewal quotes 90 days before policy expiry
**Role:** System (scheduled)
**Story:** As a ClientAdmin, I want the system to automatically generate a renewal quote 90 days before a policy's expiration date, so that producers have sufficient lead time to present renewal terms to policyholders.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §5 — Timer: Automatic Renewal, BR-POL-T01: 90 days), Data (ART-1-001 — Policy.ExpirationDate), Security (ART-1-003 — ClientAdmin, IntermediaryProducer scope)
**Confidence:** HIGH (EV-0-0231, confirmed site property `RenewalQuoteDaysThreshold = 90`)

---

### US-POLICY-011
**Title:** Manually initiate a policy renewal
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to manually trigger a renewal for a specific policy, so that I can process renewal outside the automated schedule when required.
**Priority:** P2
**Domain Cross-References:** UI (ART-1-005 §1.2 — Tools: Renew Manually), Logic (ART-1-002 §2.1 — GenerateRenewalPolicyQuotesForManually), Data (ART-1-001 — Policy)
**Confidence:** HIGH (EV-0-0218)

---

### US-POLICY-012
**Title:** Cancel a policy and notify all stakeholders
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to cancel an active policy and automatically notify the policyholder, producers, and mortgage lenders, so that all parties are informed of the cancellation and coverage ceases appropriately.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.1 — CreateCancelRewritePolicy, SendPolicyCancellationMail, NotifyLenderDockForCancelledPolicy), Data (ART-1-001 — Policy.PolicyStatusId → CANCELLED), Integration (ART-1-004 INT-002 LenderDock, INT-005 Email)
**Confidence:** HIGH (EV-0-0006)

---

### US-POLICY-013
**Title:** Automatically cancel a policy after non-payment grace period
**Role:** System (scheduled)
**Story:** As a ClientAdmin, I want the system to automatically cancel a policy when a payment remains outstanding beyond a 30-day grace period, so that lapsed coverage is managed consistently without manual intervention.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §5 — Timer: Policy lapse, BR-POL-T03: 30 days, CancellationDueToNoPayment_BL), Data (ART-1-001 — PolicyPaymentTransaction.TransactionStatus, Policy.PolicyStatusId), Integration (ART-1-004 INT-005 Email)
**Confidence:** HIGH (EV-0-0231, confirmed `CancellationThresholdDays = 30`)

---

### US-POLICY-014
**Title:** Issue a notice of non-renewal and set non-renewal status
**Role:** ClientAdmin, System (scheduled)
**Story:** As a ClientAdmin, I want the system to issue a formal notice of non-renewal 60 days before expiry and mark the policy as non-renewed if no renewal is bound within 90 days, so that regulatory notice obligations are met and the policy portfolio is accurately maintained.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §5 — BR-POL-T04: 90 days, BR-POL-T05: 60 days, GenerateNoticeOfNonRenewalDocument, UpdatePolicyStatusToNonRenewed), Data (ART-1-001 — Policy), Integration (ART-1-004 INT-006 Plumsail, INT-005 Email)
**Confidence:** HIGH (EV-0-0231)

---

### US-POLICY-015
**Title:** View the full policy 360 detail
**Role:** ClientAdmin, IntermediaryProducer
**Story:** As a ClientAdmin, I want to view a complete policy record across all tabs (Summary, Contacts, Billing, Pending Transactions, Policy History, Claims, Notes, Timeline), so that I have a single authoritative view of policy status and history.
**Priority:** P1
**Domain Cross-References:** UI (ART-1-005 §1.2 — Policy 360), Data (ART-1-001 — Policy, PolicyPaymentTransaction, Claim), Security (ART-1-003 — ClientId scoping)
**Confidence:** HIGH (EV-0-0218)

---

### US-POLICY-016
**Title:** Expire quotes that are not acted upon within the allowed window
**Role:** System (scheduled)
**Story:** As a ClientAdmin, I want quotes to automatically expire after their allowed window (90 days for new business, 30 days for renewal, 90 days for endorsement), so that the quote inventory reflects only actionable opportunities.
**Priority:** P2
**Domain Cross-References:** Logic (ART-1-002 §5 — BR-POL-T06, BR-POL-T07, BR-POL-T08), Data (ART-1-001 — Policy.PolicyStatusId), Security (ART-1-003 — ClientAdmin, IntermediaryProducer)
**Confidence:** HIGH (EV-0-0231)

---

### US-POLICY-017
**Title:** Manage additional named insureds on a policy
**Role:** ClientAdmin, IntermediaryProducer
**Story:** As a Producer, I want to add additional named insureds and additional organizations to a policy submission, so that all covered parties are formally recorded on the policy.
**Priority:** P2
**Domain Cross-References:** Logic (ART-1-002 §3 — IsAdditionalInsuredValid, IsAdditionalOrgValid), Data (ART-1-001 — AdditionalInsured, AdditionalOrganisation), UI (ART-1-005 §1.2 — Step 1 Policy Information)
**Confidence:** MEDIUM (EV-0-0218 references additional insured; form not fully captured)

---

### US-POLICY-018
**Title:** Bulk-upload multiple policy records
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to upload a batch file of policy records, so that large volumes of policies can be migrated or imported without manual entry.
**Priority:** P2
**Domain Cross-References:** Logic (ART-1-002 §5 — Timer: Bulk upload processing, BulkUploadTimerEnable), Data (ART-1-001 — Policy), Security (ART-1-003 — IsUploadPermission)
**Confidence:** MEDIUM (EV-0-0006, EV-0-0231; upload UI not fully evidenced — DBT-1-0001)

---

### US-POLICY-019
**Title:** Cancel and rewrite a policy
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to cancel an existing policy and immediately create a new policy in its place, so that significant coverage changes that cannot be handled as endorsements are processed correctly.
**Priority:** P2
**Domain Cross-References:** Logic (ART-1-002 §2.1 — CreateCancelRewritePolicy), Data (ART-1-001 — Policy), UI (ART-1-005 §1.2 — Tools: Cancel/Rewrite)
**Confidence:** MEDIUM (entry point confirmed; wizard content LOW)

---

## Domain 2: Claims

### US-CLAIMS-001
**Title:** Register a First Notice of Loss (FNOL)
**Role:** ClientAdmin, Adjuster
**Story:** As a ClientAdmin, I want to register a First Notice of Loss against a policy, so that the claims handling process begins as soon as a loss event is reported.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.2 — NewClaim, FNOL intake), Data (ART-1-001 — Claim, Claim.FNOLDate, Claim.LossDate), Security (ART-1-003 — ClientAdmin Full, Adjuster Full for assigned)
**Confidence:** MEDIUM — FNOL flow confirmed; form fields not fully evidenced (DBT-1-UI-003)

---

### US-CLAIMS-002
**Title:** Assign an adjuster to a claim
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to assign a licensed adjuster to an open claim, so that a responsible party is accountable for investigation and resolution.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.2 — Adjuster Assignment), Data (ART-1-001 — Claim.AdjusterId, Adjuster), Security (ART-1-003 — Adjuster scope filter)
**Confidence:** MEDIUM (EV-0-0007; adjuster assignment confirmed by function index)

---

### US-CLAIMS-003
**Title:** Record loss information and impacted coverages
**Role:** Adjuster, ClientAdmin
**Story:** As an Adjuster, I want to record the details of the loss event and identify which coverages are impacted, so that the claim is documented accurately for reserve-setting and settlement.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.2 — ClaimImpactedCoverage), Data (ART-1-001 — ClaimImpactedCoverage, ClaimImpactedCoverageAsset), Security (ART-1-003 — Adjuster scope: assigned claims only)
**Confidence:** MEDIUM (EV-0-0007)

---

### US-CLAIMS-004
**Title:** Create and manage a financial worksheet with reserves per coverage
**Role:** Adjuster, ClientAdmin (with IsApproveReject permission)
**Story:** As an Adjuster, I want to create a financial worksheet that tracks reserves and payments per coverage type, so that the financial exposure of each claim is accurately recorded and authorized.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.2 — Worksheet creation, IsApproveReject gates worksheet approval), Data (ART-1-001 — Worksheet, WorksheetReserve, ClaimCoverage), Security (ART-1-003 — IsApproveReject flag)
**Confidence:** MEDIUM (EV-0-0007, EV-0-0048)

---

### US-CLAIMS-005
**Title:** Manage payees and process claim disbursements
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to record claimant payees and process settlement payments to them, so that claim funds are disbursed to the correct parties with full audit trail.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.2 — WorksheetPayment, SendDisbursementEmail), Data (ART-1-001 — Payee, WorksheetPayment, BankDetail), Integration (ART-1-004 INT-009 DisburseCloud), Security (ART-1-003 — IsViewSensitiveInfo for bank details)
**Confidence:** MEDIUM (EV-0-0007, EV-0-0009)

---

### US-CLAIMS-006
**Title:** Upload and manage sensitive claim documents
**Role:** Adjuster, ClientAdmin
**Story:** As an Adjuster, I want to upload supporting documents to a claim and flag sensitive documents, so that claim evidence is securely stored and access-controlled.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.2 — ClaimDocument, IsSensitive flag), Data (ART-1-001 — ClaimDocument.IsSensitive, BlobPath), Integration (ART-1-004 INT-008 Azure Blob Storage), Security (ART-1-003 — IsUploadPermission, IsAccessSensitiveDoc)
**Confidence:** MEDIUM (EV-0-0007, EV-0-0226)

---

### US-CLAIMS-007
**Title:** Track claim escalation, litigation, and referral
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to flag a claim for escalation, litigation, or external referral, so that complex or disputed claims receive appropriate handling and oversight.
**Priority:** P2
**Domain Cross-References:** Logic (ART-1-002 §2.2 — escalation, litigation flag, referral tracking), Data (ART-1-001 — Claim), Security (ART-1-003 — ClientAdmin scope)
**Confidence:** MEDIUM (EV-0-0007; UI LOW)

---

### US-CLAIMS-008
**Title:** Associate a claim with a catastrophic event
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to associate one or more claims with a declared catastrophic event, so that CAT losses are grouped for portfolio-level analysis and regulatory reporting.
**Priority:** P2
**Domain Cross-References:** Logic (ART-1-002 §2.2 — CAT event association), Data (ART-1-001 — Claim), Security (ART-1-003 — ClientAdmin)
**Confidence:** MEDIUM (EV-0-0007; UI LOW)

---

### US-CLAIMS-009
**Title:** Close or deny a claim and generate claim correspondence
**Role:** ClientAdmin, Adjuster
**Story:** As a ClientAdmin, I want to mark a claim as closed or denied and generate the appropriate claim letter for the policyholder, so that the claim lifecycle is formally concluded with documented communication.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.2 — ClaimStatus → CLOSED/DENIED, SendClaimLetterEmail), Data (ART-1-001 — Claim.ClaimStatusId), Integration (ART-1-004 INT-005 Email), Security (ART-1-003 — IsApproveReject)
**Confidence:** MEDIUM (EV-0-0007)

---

### US-CLAIMS-010
**Title:** Prevent duplicate FNOL registration for the same loss event
**Role:** System (validation)
**Story:** As a ClientAdmin, I want the system to prevent submission of a duplicate FNOL for the same loss event on the same policy, so that claim records remain accurate and free from duplication.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §3 — CheckDuplicateClaim), Data (ART-1-001 — Claim), Security (ART-1-003 — ClientId scope)
**Confidence:** MEDIUM (EV-0-0007)

---

### US-CLAIMS-011 [PROVISIONAL]
**Title:** Bulk-upload batch claims
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to upload a batch file of claim records, so that high-volume CAT events can be processed efficiently.
**Priority:** P3
**Domain Cross-References:** UI (ART-1-005 §1.3 — Bulk Claim Upload, LOW confidence), Security (ART-1-003 — IsUploadPermission)
**Confidence:** LOW — UI inferred from permission model only (DBT-1-UI-003)
**Note (QST-BA-001 PROVISIONAL):** Bulk claim upload is inferred from the permission model. Confirm whether this feature exists as a separate upload flow or is integrated into the FNOL form. (ASM-BA-002)

---

## Domain 3: Billing & Payments

### US-BILLING-001
**Title:** Configure a payment plan for a policy
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to configure the payment frequency, responsible party, and number of installments for a policy, so that the policyholder's premium is collected according to their preferred payment arrangement.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.3 — CreateOrUpdatePaymentPlans), Data (ART-1-001 — PolicyPaymentPlan: PaymentFrequencyId, NumberOfInstallments, InstallmentFee), UI (ART-1-005 §1.2 — Policy 360 Billing tab)
**Confidence:** HIGH (EV-0-0218 — billing tab fields fully evidenced)

---

### US-BILLING-002
**Title:** Process premium payment via ACH or credit card
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to process a premium payment via bank debit or credit card, so that the policy remains in force and the transaction is recorded with the gateway's confirmation reference.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.3 — MakeTranzpayPayment, AddCustomerACHDebit, AddCustomerCCCharge), Data (ART-1-001 — PolicyPaymentTransaction.GatewayTransactionId), Integration (ART-1-004 INT-001 TranzPay — PROVISIONAL), Security (ART-1-003 — IsCreatePermission on MakePayment)
**Confidence:** HIGH for flow; MEDIUM for TranzPay (placeholder — QST-1-INT-001)
**Note [PROVISIONAL]:** The specific payment gateway is TranzPay, which is a contract placeholder. Story is written assuming a payment gateway interface. (ASM-1-INT-001)

---

### US-BILLING-003
**Title:** Execute automatic recurring premium debits on schedule
**Role:** System (scheduled)
**Story:** As a ClientAdmin, I want the system to automatically debit installment premiums on schedule, so that policyholders on payment plans are charged without requiring manual action each period.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §5 — Timer: Auto-debit payment, AutoDebitPaymentTranzpay), Data (ART-1-001 — PolicyPaymentPlan, PolicyPaymentTransaction), Integration (ART-1-004 INT-001 TranzPay — PROVISIONAL)
**Confidence:** HIGH for timer; MEDIUM for TranzPay (placeholder)

---

### US-BILLING-004
**Title:** Handle a failed payment and notify stakeholders
**Role:** System (automated)
**Story:** As a ClientAdmin, I want the system to detect a failed premium payment, notify the policyholder and mortgage lender, and begin the grace period countdown, so that payment failures are handled consistently and transparently.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.3 — EmailFailedTransaction, FailedNotificationLenderdock, CancellationDueToNoPayment_BL), Data (ART-1-001 — PolicyPaymentTransaction.TransactionStatus = 'FAILED'), Integration (ART-1-004 INT-005 Email, INT-002 LenderDock)
**Confidence:** HIGH (EV-0-0006)

---

### US-BILLING-005
**Title:** Process a refund or payment reversal
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to process a refund or reverse a payment transaction, so that overpayments or cancellation credits are returned to the policyholder correctly.
**Priority:** P2
**Domain Cross-References:** Logic (ART-1-002 §2.3 — ACHRefund, ACHRefundCancellation, CreditCardRefund, CreditCardRefundCancellation), Data (ART-1-001 — PolicyPaymentTransaction), Integration (ART-1-004 INT-001 TranzPay — PROVISIONAL)
**Confidence:** HIGH for flow; MEDIUM for TranzPay (placeholder)

---

### US-BILLING-006
**Title:** View billing history and payment schedule for a policy
**Role:** ClientAdmin, IntermediaryProducer
**Story:** As a ClientAdmin, I want to view the complete billing history and scheduled installment payments for a policy, so that I can answer policyholder billing inquiries accurately.
**Priority:** P2
**Domain Cross-References:** UI (ART-1-005 §1.2 — Policy 360 Billing tab, Pending Transactions tab), Data (ART-1-001 — PolicyPaymentTransaction, PolicyPaymentPlan), Security (ART-1-003 — ClientId scoping)
**Confidence:** HIGH (EV-0-0218)

---

## Domain 4: Distribution Management

### US-DIST-001
**Title:** Onboard a new intermediary (agency)
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to onboard a new intermediary by capturing their company details, contact information, and commission configuration, so that the agency can begin submitting business on behalf of policyholders.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §1 — Distribution module, 144 functions), Data (ART-1-001 — Intermediary: CompanyName, IntermediaryCode, CommissionPercentage), Integration (ART-1-004 INT-003 Geocoding for address), Security (ART-1-003 — ClientAdmin Full, IntermediaryProducer own-only)
**Confidence:** MEDIUM (EV-0-0003, EV-0-0044 not read; function index confirms onboarding logic)

---

### US-DIST-002
**Title:** Manage producers within an intermediary
**Role:** ClientAdmin, IntermediaryProducer
**Story:** As a ClientAdmin, I want to add and manage individual producers under an intermediary, so that each licensed producer's details and state licenses are on file.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §1 — Distribution), Data (ART-1-001 — Producer: FirstName, LastName, LicenseNumber, StateCode), Security (ART-1-003 — ClientAdmin Full, Intermediary own-only)
**Confidence:** MEDIUM (EV-0-0003)

---

### US-DIST-003
**Title:** Configure and view commission rates for an intermediary
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to configure the commission percentage for an intermediary and view the commission amounts earned per policy, so that producer compensation is accurately calculated and tracked.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §1 — Commission configuration, CommissionsDetails_ENdorsements), Data (ART-1-001 — PolicyCommission, CommissionPaymentTransaction, Intermediary.CommissionPercentage), Security (ART-1-003 — IsViewSensitiveInfo may apply to financial data)
**Confidence:** MEDIUM (EV-0-0006, EV-0-0003)

---

### US-DIST-004
**Title:** Disburse commissions to intermediaries
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to disburse earned commissions to intermediaries, so that producers receive timely payment for their business production.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.3 — DisperseMonthlyCommission, SendDisbursementEmail_New), Integration (ART-1-004 INT-009 DisburseCloud), Data (ART-1-001 — CommissionPaymentTransaction), Security (ART-1-003 — IsCreatePermission)
**Confidence:** MEDIUM (EV-0-0009)

---

### US-DIST-005
**Title:** Geocode intermediary office addresses
**Role:** System (automated, triggered on save)
**Story:** As a ClientAdmin, I want intermediary office addresses to be automatically geocoded when saved, so that location data is accurate and consistent for mapping and reporting.
**Priority:** P3
**Domain Cross-References:** Logic (ART-1-002 §1 — Geocoding for producer addresses), Integration (ART-1-004 INT-003 Google Geocoding), Data (ART-1-001 — Intermediary)
**Confidence:** MEDIUM (EV-0-0003, EV-0-0009)

---

## Domain 5: User Management

### US-USER-001
**Title:** Create a new user account
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to create a new user account with full profile details, address, and contact information, so that the new team member can access the platform with their assigned permissions.
**Priority:** P1
**Domain Cross-References:** UI (ART-1-005 §1.7 — Add User), Logic (ART-1-002 §2.4 — CreateUser, Check_Email_IsDuplicateOrNot, CheckDuplicateUser, EncryptPassword), Data (ART-1-001 — User2, UserPasswordReset), Security (ART-1-003 — ClientAdmin Full, ClientId-scoped)
**Confidence:** HIGH (EV-0-0222)

---

### US-USER-002
**Title:** Assign a user to groups to grant permissions
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to assign a user to one or more groups when creating or editing their profile, so that the user automatically inherits the correct screen-level permissions for their role.
**Priority:** P1
**Domain Cross-References:** UI (ART-1-005 §1.7 — Edit User User-Rights), Logic (ART-1-002 §2.4 — CreateGroupsUsers, CreatePrivilegesforGroupUsers), Data (ART-1-001 — GroupUser_Table, ScreenPermissions), Security (ART-1-003 — group-based permission inheritance §2.2)
**Confidence:** HIGH (EV-0-0222, EV-0-0048)

---

### US-USER-003
**Title:** Send a password reset link to a user
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to send a password reset link to a user from their profile, so that locked-out or compromised accounts can be recovered securely.
**Priority:** P1
**Domain Cross-References:** UI (ART-1-005 §1.7 — Reset Password Modal), Logic (ART-1-002 §2.4 — RequestResetPassword, IsResetPasswordTokenValid, 30-minute token expiry BR-COM-RESET), Data (ART-1-001 — UserPasswordReset), Integration (ART-1-004 INT-005 Email)
**Confidence:** HIGH (EV-0-0222, EV-0-0012)

---

### US-USER-004
**Title:** View and edit a user's profile and permissions
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to view and inline-edit all sections of a user's profile (personal info, address, contact details, access rights), so that user records remain accurate without requiring full record recreation.
**Priority:** P1
**Domain Cross-References:** UI (ART-1-005 §1.7 — View User, Edit User inline sections), Logic (ART-1-002 §2.4 — Update user functions), Data (ART-1-001 — User2), Security (ART-1-003 — ClientAdmin Full, ClientId-scoped)
**Confidence:** HIGH (EV-0-0222)

---

### US-USER-005
**Title:** Prevent duplicate user accounts by email and phone
**Role:** System (validation)
**Story:** As a ClientAdmin, I want the system to prevent creating a user with a duplicate email address or phone number within the same tenant, so that each user has a unique, unambiguous identity.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.4 — Check_Email_IsDuplicateOrNot, CheckDuplicateUser by ClientId), Data (ART-1-001 — User2), Security (ART-1-003 — ClientId scope)
**Confidence:** HIGH (EV-0-0011, EV-0-0012)

---

### US-USER-006
**Title:** View a user's permission rights across all modules
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to view the full permission matrix (8 modules, 10 flags) for any user, so that I can audit and verify what actions a user can perform across the platform.
**Priority:** P2
**Domain Cross-References:** UI (ART-1-005 §1.7 — View User with User-Rights accordions), Data (ART-1-001 — ScreenPermissions, GroupUser_Table), Security (ART-1-003 — §2.1 10 flags)
**Confidence:** HIGH (EV-0-0222)

---

### US-USER-007
**Title:** Filter and search the user list
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to filter the user list by column conditions and values and search by keyword, so that I can quickly locate specific users in large directories.
**Priority:** P2
**Domain Cross-References:** UI (ART-1-005 §1.7 — Column Filter Panel with 9 operators, Column Picker with 9 columns, keyword search), Data (ART-1-001 — User2), Security (ART-1-003 — ClientId scoping)
**Confidence:** HIGH (EV-0-0222)

---

### US-USER-008
**Title:** Manage user's own profile via View Profile
**Role:** All authenticated roles (UserRole, IntermediaryProducer, Adjuster, ClientAdmin, PlatformAdmin)
**Story:** As an authenticated user, I want to view and edit my own profile across Personal, Professional, Banking Details, Security, Activity, Preferences, Access, and Documents tabs, so that my contact and professional information is always current.
**Priority:** P2
**Domain Cross-References:** UI (ART-1-005 §1.1 — View Profile, 8 tabs), Data (ART-1-001 — User2, BankDetail), Security (ART-1-003 — IsViewSensitiveInfo for banking)
**Confidence:** MEDIUM (EV-0-0222 — tab list confirmed; tab content not fully captured)

---

## Domain 6: Group Management

### US-GROUP-001
**Title:** Create a user group with permissions
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to create a named user group with a group leader, member list, and a permission matrix covering all 8 modules and all 10 permission flags, so that I can efficiently manage access rights for sets of users who share the same responsibilities.
**Priority:** P1
**Domain Cross-References:** UI (ART-1-005 §1.6 — Add User Group), Logic (ART-1-002 §2.4 — CreateGroupsUsers, CreatePrivilegesforGroupUsers), Data (ART-1-001 — Group_Table, GroupUser_Table, ScreenPermissions), Security (ART-1-003 — §2.2 group-based permission inheritance)
**Confidence:** HIGH (EV-0-0048)

---

### US-GROUP-002
**Title:** Update group membership and synchronize permissions
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to add or remove members from a user group and have their permissions updated immediately, so that access changes take effect promptly when staff roles change.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.4 — CreateGroupsUsers full sync, UpdateGroupsUsers, DeleteGroupUser, LaunchDeleteUserGroupPrivelagesUpdated), Data (ART-1-001 — GroupUser_Table), Security (ART-1-003 — RSK-1-SEC-004: async cleanup race condition — flag for target)
**Confidence:** HIGH (EV-0-0048, EV-0-0010)
**Note:** Asynchronous privilege cleanup after removal creates a brief window where removed user may retain access. Target must implement synchronous revocation. (RSK-1-SEC-004)

---

### US-GROUP-003
**Title:** Browse groups and export group directory
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to browse all user groups with summary KPI cards and export the group list in multiple formats, so that I can audit group assignments and share them with stakeholders.
**Priority:** P2
**Domain Cross-References:** UI (ART-1-005 §1.6 — Group Management Landing: KPI cards, Download PDF/CSV/Excel/TXT), Data (ART-1-001 — Group_Table), Security (ART-1-003 — ClientAdmin Full, client-scoped)
**Confidence:** HIGH (EV-0-0048)

---

### US-GROUP-004
**Title:** Configure per-screen permission flags for a group
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to configure each of the 10 permission flags (View, Create, Edit, Approve/Reject, Clone, Upload, Download, Sensitive Data, Sensitive Documents, All Access) individually per screen per group, so that access control is as granular as the business requires.
**Priority:** P1
**Domain Cross-References:** UI (ART-1-005 §1.6 — Group Rights permission accordions, 8 modules, 51 rows), Data (ART-1-001 — ScreenPermissions — 10 flag columns), Security (ART-1-003 — §2.1 The 10 Permission Flags)
**Confidence:** HIGH (EV-0-0048, EV-0-0226)

---

### US-GROUP-005
**Title:** Prevent unauthorized group permission changes
**Role:** System (authorization check)
**Story:** As a ClientAdmin, I want the system to require the USERGROUPPAGE permission before allowing group membership updates, so that only authorized administrators can modify group access rights.
**Priority:** P1
**Domain Cross-References:** Logic (ART-1-002 §2.4 — UpdateGroupsUsers gated by USERGROUPPAGE permission), Security (ART-1-003 — §2.3 permission evaluation flow), Data (ART-1-001 — ScreenPermissions)
**Confidence:** MEDIUM (EV-0-0010 — permission gate evidenced; exact permission definition unclear — QST-1-LOGIC-003)

---

## Domain 7: Reports

### US-REPORT-001
**Title:** View production and premium reports
**Role:** ClientAdmin, IntermediaryProducer (scoped)
**Story:** As a ClientAdmin, I want to view reports on new business issuance counts, total written premium by coverage level, and transaction type breakdowns, so that I can monitor portfolio performance.
**Priority:** P2
**Domain Cross-References:** UI (ART-1-005 §1.8 — Policy New Business Issuance Report, New Business Premium Report, No. of Policies by Transaction Type), Data (ART-1-001 — Policy, PolicyPaymentTransaction), Security (ART-1-003 — ClientAdmin scoped, IntermediaryProducer scoped)
**Confidence:** LOW — report list confirmed; report content inferred from permission model (EV-0-0048)

---

### US-REPORT-002
**Title:** View commission reports for intermediaries
**Role:** ClientAdmin, IntermediaryProducer (scoped)
**Story:** As a ClientAdmin, I want to view commission earned and paid reports for each intermediary, so that I can reconcile producer compensation and identify outstanding commission balances.
**Priority:** P2
**Domain Cross-References:** UI (ART-1-005 §1.8 — Commissions Reports), Data (ART-1-001 — PolicyCommission, CommissionPaymentTransaction), Security (ART-1-003 — ClientAdmin Full, IntermediaryProducer scoped to own)
**Confidence:** LOW — report existence confirmed (EV-0-0048); content inferred

---

### US-REPORT-003
**Title:** View claims management and financial reports
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to view claims status reports, claims financial summaries, and loss & exposure analyses, so that the claims portfolio is visible for operational management and reserving decisions.
**Priority:** P2
**Domain Cross-References:** UI (ART-1-005 §1.8 — Claims Management Reports, Claim Financial Reports, Loss & Exposure Reports), Data (ART-1-001 — Claim, ClaimCoverage, Worksheet), Security (ART-1-003 — IsApproveReject permission includes Reports access)
**Confidence:** LOW — report existence confirmed (EV-0-0048); content inferred

---

### US-REPORT-004
**Title:** View bordereaux report for MGA-to-issuer reconciliation
**Role:** ClientAdmin, IntermediaryProducer (scoped)
**Story:** As a ClientAdmin, I want to view and export a bordereaux report covering all policies in force, so that I can provide required submission data to the issuing carrier.
**Priority:** P2
**Domain Cross-References:** UI (ART-1-005 §1.8 — Bordereaux MGA to Issuer), Data (ART-1-001 — Policy, WritingCompany), Security (ART-1-003 — ClientAdmin, IntermediaryProducer scoped)
**Confidence:** LOW — report type confirmed (EV-0-0048); format not evidenced

---

### US-REPORT-005
**Title:** View compliance and regulatory reports
**Role:** ClientAdmin
**Story:** As a ClientAdmin, I want to view compliance and regulatory reports, so that the tenant can meet state filing and regulatory obligations.
**Priority:** P2
**Domain Cross-References:** UI (ART-1-005 §1.8 — Compliance/Regulatory Reports, Reinsurance/CAT Reports), Data (ART-1-001 — Policy, Claim), Security (ART-1-003 — ClientAdmin scoped)
**Confidence:** LOW — report types confirmed (EV-0-0048); content not evidenced
**Note (QST-BA-002):** Specific regulatory requirements (state filings, NAIC formats, reinsurance treaty data elements) are not evidenced. Mark report specifications as PROVISIONAL until clarified. (ASM-BA-003)

---

### US-REPORT-006
**Title:** Dashboard KPI view for real-time portfolio metrics
**Role:** All authenticated roles (scoped)
**Story:** As an authenticated user, I want to see KPI cards on my dashboard showing key counts (quotes uploaded/approved/not approved/expired, policies issued/renewed/cancelled/non-renewed) and a premium chart by coverage level, so that I have an at-a-glance view of portfolio status relevant to my role.
**Priority:** P1
**Domain Cross-References:** UI (ART-1-005 §1.1 — Global Dashboard), Logic (ART-1-002 §1 — Portal module, 42 functions), Data (ART-1-001 — Policy, Claim), Security (ART-1-003 — all roles scoped by ClientId, IntermediaryId, or AdjusterId)
**Confidence:** HIGH (EV-0-0218)

---

## Story Count Summary

| Domain | P1 | P2 | P3 | Total |
|--------|----|----|-----|-------|
| Quotes & Policies | 10 | 6 | 1 | **17** (US-POLICY-001 through US-POLICY-019, 17 incl. provisional) |
| Claims | 7 | 2 | 1 | **10** |
| Billing & Payments | 4 | 2 | 0 | **6** |
| Distribution Management | 3 | 0 | 1 | **5** (incl. DIST-004 as P1) |
| User Management | 5 | 3 | 0 | **8** |
| Group Management | 4 | 1 | 0 | **5** |
| Reports | 1 | 5 | 0 | **6** |
| **TOTAL** | **34** | **19** | **3** | **65** |

---

*End of ART-2-002 — User Stories | INSUREEDGE-2026 | HARVEST Phase | 2026-06-17*
*Stories at HIGH or MEDIUM confidence except where explicitly marked LOW or PROVISIONAL.*
*TranzPay-dependent stories flagged PROVISIONAL per engagement instruction. Claims UI stories marked MEDIUM/LOW due to LOW UI coverage (DBT-1-0003).*
