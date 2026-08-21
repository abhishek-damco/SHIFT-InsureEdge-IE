// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Quotes & Policies — register/list view DTOs (nb-quotes, endorsements, renewals, policies).
// Ported from the Node prototype server.js GET /api/:insuredType/{nb-quotes,endorsements,renewals,policies}[/kpis].
namespace InsureEdge.Application.DTOs.QuotesPolicies;

// ─── NB Quotes ──────────────────────────────────────────────────────────────

public record NbQuotesKpiDto(int Uploaded, int Approved, int NotApproved, int Expired);

public record NbQuoteListItemDto(
    string Id,                 // p.quote_number
    string InsuredName,
    string? Lob,
    string? SubProduct,
    string? EffectiveDate,     // MM-dd-yyyy
    decimal? PremiumEstimate,
    string? CreatedAt,         // MM-dd-yyyy
    string? ApprovalStatus,
    string? LastUpdated,       // MM-dd-yyyy
    string? Status,
    string? State,
    string? InsuredType
);

public record NbQuoteListResponse(List<NbQuoteListItemDto> Data, int Total, int Page, int PageSize);

// ─── Endorsements ───────────────────────────────────────────────────────────

public record EndorsementsKpiDto(int Total, int Draft, int Submitted, int Approved, int NotApproved, int Bound);

public record EndorsementListItemDto(
    string Id,                 // p.quote_number
    string? PolicyNumber,
    string InsuredName,
    string? Lob,
    string? PolicyEffectiveDate,
    string? TransactionEffectiveDate,
    decimal PremiumImpact,
    string? CreatedAt,
    string? Status,
    string? InsuredType
);

// ─── Renewals ───────────────────────────────────────────────────────────────

public record RenewalsKpiDto(int Total, int Draft, int Pending, int Declined, int Expired);

public record RenewalListItemDto(
    string Id,                 // p.quote_number
    string? OriginalPolicyNumber,
    string InsuredName,
    string? Lob,
    string? SubProduct,
    string? IntermediaryType,
    string? Intermediary,
    string? ProducerName,
    string? EffectiveDate,
    string? CreatedAt,
    string? ExpirationDate,
    string? RenewalOfferDate,
    decimal? PremiumEstimate,
    string? Status,
    string? InsuredType
);

// ─── Policies ───────────────────────────────────────────────────────────────

public record PoliciesKpiDto(int Total, int Active, int Lapsed, int Expired, int Cancelled);

public record PolicyListItemDto(
    string Id,                 // p.policy_number
    string InsuredName,
    string? Lob,
    string? SubProduct,
    string? EffectiveDate,
    string? Status,
    string? ExpirationDate,
    decimal? PremiumAmount,
    string? LastUpdated,
    string? State,
    string? InsuredType
);

// ─── Policy Transactions (Policy History / Timeline) ───────────────────────────

public record PolicyTransactionDto(
    long Id,
    string PolicyNumber,
    string? EffectiveDate,               // MM-dd-yyyy
    string? ExpirationDate,               // MM-dd-yyyy
    string? TransactionType,              // code, e.g. "CancelPolicy"
    string? TransactionTypeLabel,         // display label, e.g. "Cancellation"
    string? TransactionEffectiveDate,     // MM-dd-yyyy
    string? Status,
    string? RedirectionPolicyNumber       // policy_number of the policy the eye icon should open (null = no drill-down)
);

// ─── Policy Summary (Policy Information / Producer / Financials / Billing / Claims / Contacts) ─

public record PolicySummaryDto(
    string PolicyNumber,
    string? Status,               // p.policy_status
    string? Lob,                  // insurance_product.product_name
    string? SubProduct,           // insurance_sub_product.sub_product_name
    string? EffectiveDate,        // MM-dd-yyyy
    string? ExpirationDate,       // MM-dd-yyyy
    string? FirstName,
    string? MiddleName,
    string? LastName,
    string AvailableForRenewal,   // "Yes"/"No" — derived from !policy.do_not_renew
    List<PolicyProducerDto> Producers,
    PolicyFinancialsDto? Financials,
    PolicyBillingDto? Billing,
    List<PolicyClaimSummaryDto> Claims,
    List<PolicyContactDto> Contacts
);

public record PolicyProducerDto(
    string Producer,              // producer.first_name + last_name, "-" if none
    string? Agency,                // intermediary.intermediary_name
    decimal? CommissionPercentage, // policy_commission.commission_percentage
    decimal? CoveragePremium,      // policy_commission.total_coverage_premium
    decimal? TotalCommission,      // policy_commission.annual_commission
    decimal CommissionPaid,        // SUM(commission_amount_due) WHERE is_paid
    decimal EarnedCommission       // SUM(commission_amount_due) WHERE transaction_status <> 'Cancelled'
);

public record PolicyFinancialsDto(
    decimal? CoveragePremium,     // policy_premium.total_coverage_premium
    decimal? Taxes,               // policy_premium.total_tax
    decimal? Fees,                // policy_premium.policy_fees
    decimal? TotalPremium         // policy_premium.total_premium_with_installment_fee
);

public record PolicyBillingDto(
    string? PaymentFrequency,     // policy_premium.payment_frequency
    string? ResponsibleParty,     // policy_premium.responsible_party
    decimal WrittenPremium,       // policy_premium.total_premium_without_installment_fee
    decimal TotalBilled,          // SUM(policy_payment_transaction.amount_due)
    decimal AmountPaid,           // SUM(amount_due) WHERE is_paid
    decimal AmountDue,            // SUM(amount_due) WHERE NOT is_paid
    decimal UnbilledPremium       // total_premium_with_installment_fee - TotalBilled (floor 0)
);

public record PolicyClaimSummaryDto(string ClaimNumber, string? Status);

// ─── Claims screen ──────────────────────────────────────────────────────────────
// Ported from the given SQL: ClaimName is a deduped, comma-joined union of the policy's
// insured (account) name and any third-party claimant names; TotalIncurred = paid +
// reserve; TotalPaid = paid only; excludes claims with Status = 'DRAFT'.

public record PolicyClaimRowDto(
    string ClaimNumber,
    string ClaimantName,     // union of account name + claimant names, comma-joined
    string? DateOfLoss,      // MM-dd-yyyy
    string? CauseOfLoss,     // claim.main_cause_of_loss
    decimal IncurredAmount,  // SUM(worksheet_payment.payment_amount) + SUM(worksheet_reserve.reserve_amount)
    decimal PaidAmount,      // SUM(worksheet_payment.payment_amount)
    string? Status
);

// ─── Pending Transactions ───────────────────────────────────────────────────────
// Ported from OutSystems GetAllPendingTransactions: sibling policy rows sharing the
// same policy_number but sitting in policy_status = 'DRAFT' (an in-progress
// endorsement/renewal/etc. not yet finalized).

public record PolicyPendingTransactionDto(
    long PolicyId,                    // draft policy row's own id
    string PolicyNumber,
    string? TransactionType,          // label, with "Quote" suffix for Endorsement/Renewal
    string? QuoteNumber,
    string? TransactionEffectiveDate, // MM-dd-yyyy
    string AssignedUser,              // creator's name, or "System"
    string? Status,
    string? ScreenCode                // policy.policy_type
);

public record PolicyContactDto(string Name, string? Phone, string? Email, string? Address);

// ─── Billing detail screen (Premium Payment Details / Payment Schedule / Premium
// Breakdown / Commission Details) ───────────────────────────────────────────────
// Premium Breakdown ported from OutSystems GetPolicyRefundBilling_BL: Written = sum of
// policy_payment_transaction_extended across installments; Unearned = the correlated
// cancellation_payment_transaction row's value if that installment is paid, else the
// full Written amount; Earned = Written − Unearned if paid, else 0.

public record PolicyPaymentScheduleRowDto(
    string? InstallmentDueDate,       // MM-dd-yyyy
    decimal InstallmentFee,           // policy_premium.total_installment_fee / number_of_installments
    decimal InstallmentPremiumAmount, // policy_payment_transaction.amount_due
    decimal AmountDue,                // policy_payment_transaction.amount_due
    string Status                     // "Paid" / "Unpaid"
);

public record PolicyPremiumBreakdownRowDto(
    string Label,      // "Coverage Premium" | "Surplus Lines Tax" | "Fire Premium Tax" | "Stamping Fee" | "Policy Fee"
    decimal Written,
    decimal Earned,
    decimal Unearned
);

public record PolicyBillingDetailDto(
    string? PaymentFrequency,      // policy_premium.payment_frequency
    string? ResponsibleParty,      // policy_premium.responsible_party
    string? ModeOfPayment,         // policy_premium.mode_of_payment_to_use
    int NumberOfInstallments,      // policy_premium.number_of_installments
    decimal InstallmentFee,        // policy_premium.total_installment_fee
    string IsFullyPaid,            // "Yes"/"No" — policy_premium.is_policy_fully_paid
    List<PolicyPaymentScheduleRowDto> PaymentSchedule,
    decimal TotalPendingAmount,    // SUM(amount_due) WHERE NOT is_paid
    string? CancellationEffectiveDate, // MM-dd-yyyy, null unless policy is Cancelled
    List<PolicyPremiumBreakdownRowDto> PremiumBreakdown, // empty unless Cancelled
    List<PolicyProducerDto> Commissions                  // empty unless Cancelled
);

// ─── Timeline screen ────────────────────────────────────────────────────────────
// Ported from OutSystems SummaryBlock GetAuditsByTransactions: audits joined to the
// policy's transactions (filtered to is_show_in_timeline), grouped by day on the frontend.

public record PolicyTimelineEntryDto(
    string ActivityDescription,  // literal free-text label, e.g. "New Business Issuance"
    string? CreatedByName,       // "user".first_name + last_name, or "System" if none
    string CreatedDate,          // MM-dd-yyyy — used to group entries under one date pill
    string CreatedTime           // HH:mm
);

// ─── Endorse Policy (deep-clone into a new Draft policy) ─────────────────────

public record EndorsePolicyRequestDto(
    DateOnly? TransactionEffectiveDate,
    string? SummaryOfChanges
);

public record EndorsePolicyResultDto(
    long NewPolicyId,
    string PolicyNumber,
    string QuoteNumber
);

// ─── Endorsement Quote Review — "Review/Compare Updated Information" ────────
// One row per field that differs between the open endorsement draft and the
// prior (Active/Bound) policy it was drafted against. Empty list = no changes.
public record EndorsementFieldChangeDto(
    string Panel,
    string Field,
    string? PriorValue,
    string? UpdatedValue
);

// ─── Endorsement draft → wizard FormState hydration ──────────────────────────
// CreateEndorsementDraftAsync clones the FULL policy graph (account, risk address,
// risk info, limit coverages, additional insureds, mortgages) into new rows — but the
// wizard's Submission JSON blob only ever gets whatever the frontend chooses to seed it
// with (see PolicySummaryPage.tsx's endorse handler). This DTO is the bridge: it reads
// that cloned draft back out shaped exactly like NewSubmission.tsx's FormState/
// LocationItem/MortgageItem/AdditionalInsuredItem/AdditionalOrgItem, so the frontend can
// use it verbatim as the Submission's initial "form"/"locations"/"mortgages"/
// "additionalInsureds"/"additionalOrgs" payload instead of a hand-built 15-field stub.
public record EndorsementDraftFormDto(
    Dictionary<string, object?> Form,
    List<Dictionary<string, object?>> Locations,
    List<Dictionary<string, object?>> Mortgages,
    List<Dictionary<string, object?>> AdditionalInsureds,
    List<Dictionary<string, object?>> AdditionalOrgs
);

// ─── Endorsement Finalize Quote "Previous Amount" comparison ─────────────────
// Finalize Quote's Summary cards (Coverage Premium/Taxes/Fees/Total Premium) need the
// PRIOR policy's premium too, to show Previous/Change/Updated per card. The premium
// formula itself (calculatePlanAmounts/STATE_TAX/getCoveragePremiums) only exists on the
// frontend (NewSubmission.tsx) — rather than port that whole tax table + plan-tier
// calculation into C#, this returns just the prior policy's raw inputs (coverage level,
// state, deductible, endorsement flags, policy fee) shaped like a FormState subset, so
// the frontend can run its own existing calculatePlanAmounts() against them exactly like
// it already does for the current draft.
public record EndorsementPriorPremiumFormDto(Dictionary<string, object?> Form);

// ─── Cancel Policy ────────────────────────────────────────────────────────────

public record RequestedByOptionDto(string Code, string Label);

public record CancellationPremiumBreakdownRowDto(string Label, decimal PaidAmount, decimal RefundAmount);

public record CancellationCommissionEffectRowDto(string Intermediary, decimal LastCommissionPaid, decimal ChangeInCommission);

public record PolicyCancellationPreviewDto(
    List<CancellationPremiumBreakdownRowDto> PremiumBreakdown,
    decimal TotalPaidAmount,
    decimal TotalRefundAmount,
    List<CancellationCommissionEffectRowDto> CommissionEffect,
    bool IsPolicyPaid
);

public record CancelPolicyRequestDto(
    DateOnly CancellationEffectiveDate,
    string ProrationBasis,
    string RequestedBy,
    string ReasonOfCancellation,
    string? OtherReason,
    bool AdjustCommissions,
    string? Comments
);

public record CancelPolicyResultDto(string PolicyNumber, string PolicyStatus);

// ─── Cancel / Rewrite Policy ──────────────────────────────────────────────────

public record CancelRewriteRequestDto(
    DateOnly CancellationEffectiveDate,
    DateOnly RewriteEffectiveDate,
    string ProrationBasis,
    string ReasonForRewritingPolicy,
    string? OtherReason,
    bool AdjustCommissions,
    string? Comments
);

public record CancelRewriteResultDto(
    string OriginalPolicyNumber,
    long NewPolicyId,
    string NewPolicyNumber,
    string NewQuoteNumber
);

public record CancelRewritePreviewDto(
    List<CancellationPremiumBreakdownRowDto> PremiumBreakdown,
    decimal TotalPaidAmount,
    decimal TotalRefundAmount,
    bool IsPolicyPaid
);

// ─── Do Not Renew ─────────────────────────────────────────────────────────────

public record NoticeOfNonRenewalInfoDto(
    string NamedInsured,
    string Brokerage,
    string NamedInsuredAddressLine,
    string BrokerAddressLine,
    string NamedInsuredAddressCity,
    string BrokerAddressCity,
    string NamedInsuredAddressState,
    string BrokerAddressState,
    string NamedInsuredZip,
    string BrokerAddressZip,
    string PrimaryContactName,
    string BrokerAddressPhone,
    string PrimaryContactEmail,
    string BrokerId,
    string PrimaryContactPhone,
    string PolicyNo,
    string PolEffDt,
    string SystemDt,
    string PolExpDt,
    string NonRenewEffDt
);

public record DoNotRenewRequestDto(
    bool CheckBoxYourNonRenewal,
    List<bool> Attributes // 65 items, Attribute1..65
);

public record DoNotRenewResultDto(string PolicyNumber, string PolicyStatus);

// ─── Query params (shared) ───────────────────────────────────────────────────

public record PolicyRegisterListQuery(
    string InsuredType,
    string? Search,
    string? ApprovalStatus,
    string? Lob,
    string? Status,
    string? SortCol,
    string? SortDir,
    int Page = 1,
    int PageSize = 10
);
