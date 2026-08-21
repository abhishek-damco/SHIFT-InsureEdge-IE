// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Submission (quote wizard draft) CRUD DTOs. Ported from prototype server.js
// POST/GET/PUT/DELETE /api/submissions/:id.
// The wizard payload is treated as an opaque JSON document (matching the prototype's
// "data jsonb" blob store) — Data is passed through as a raw JSON string.
namespace InsureEdge.Application.DTOs.QuotesPolicies;

public record SubmissionDto(
    string Id,
    string Status,
    DateTime CreatedAt,
    string DataJson // raw JSON payload (wizard "form"/additionalInsureds/additionalOrgs/etc.)
);

public record CreateSubmissionRequest(string DataJson);

public record UpdateSubmissionRequest(string? Status, string DataJson);

// ─── Commission (GET /api/submissions/:id/commission) ───────────────────────

public record SubmissionCommissionDto(
    decimal? CommissionPercentage,
    decimal? InstallmentCommission,
    decimal? AnnualCommission,
    decimal? TotalCoveragePremium,
    string? PaymentFrequency,
    int? NumberOfInstallments,
    string? Brokerage,
    string? ProducerName
);

// ─── Payment plan (SaveOnClick / GetPolicyDetails on Finalize Quote) ─────────

public record SavePaymentPlanRequest(
    string? PaymentFrequency,
    string? ResponsibleParty,
    bool? FeesFullyPaidFirstInstallment,
    bool? PaymentRequiredToBind,
    string? ModeOfPayment,
    decimal? CoveragePremium,
    decimal? TotalTax,
    decimal? StampingFee,
    decimal? PolicyFee,
    decimal? SurplusLinesTax,
    decimal? FirePremiumTax,
    decimal? SlRate,
    decimal? FireRate
);

public record PaymentPlanDto(
    string PaymentFrequency,
    string ResponsibleParty,
    int NumberOfInstallments,
    string? ModeOfPayment,
    bool? IsPaymentRequiredToBind,
    bool IsPolicyFullyPaid,
    decimal? TotalCoveragePremium,
    decimal? TotalTax,
    decimal PolicyFees,
    decimal? StampingFee,
    decimal TotalPremiumWithInstallmentFee
);

public record InstallmentDto(
    long Id,
    decimal AmountDue,
    string DueDate,
    bool IsPaid,
    string Status,
    decimal SurplusLineTax,
    decimal FireTax,
    decimal CoveragePremium,
    decimal TotalTax,
    decimal InstallmentFee
);

public record PaymentPlanResponse(PaymentPlanDto? PaymentPlan, List<InstallmentDto> Installments);

// ─── Share Quote (Finalize Quote → Document → Share Quote) ───────────────────

public record ShareQuoteRequest(string ToEmail, string? ToName, string? Subject, string Html);

// Email Compose Modal
public record SendEmailRequest(string FromEmail, string ToEmail, string? CcEmail, string? BccEmail, string Subject, string HtmlBody, string? DocumentName = null, string? DocumentSource = null, string? AttachmentBase64 = null);

// ─── Issue Policy (IssueOnClick → IssuePolicyHB_BL) ──────────────────────────

public record IssuePolicyResponse(
    bool IsSuccess,
    string? PolicyNumber,
    string? PolicyStatus,
    string? PolicyType,   // POLICYINDIVIDUAL | POLICYBUSINESS
    string Message
);
