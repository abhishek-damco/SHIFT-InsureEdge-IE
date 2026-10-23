// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Submission (quote wizard draft/JSON) CRUD, ported from server.js POST/GET/PUT/DELETE
// /api/submissions/:id plus GET /api/submissions/:id/commission.
using InsureEdge.Application.DTOs.QuotesPolicies;

namespace InsureEdge.Application.Interfaces;

public interface ISubmissionRepository
{
    Task<SubmissionDto> CreateAsync(long clientId, long userId, CreateSubmissionRequest req);
    Task<SubmissionDto?> GetByIdAsync(long clientId, string id);

    // Endorsement/Renewal registers list rows keyed by the Policy's QuoteNumber (see
    // EndorsementListItemDto/RenewalListItemDto's "p.quote_number" comment), which is NOT
    // the Submission's own Id for those flows (unlike New Business, where they're equal by
    // construction). Resolves the real Submission Id so the wizard opens the correct draft
    // instead of 404'ing and silently minting a new blank Submission on save.
    Task<string?> GetSubmissionIdByQuoteNumberAsync(long clientId, string quoteNumber);

    Task<SubmissionDto> UpsertAsync(long clientId, long userId, string id, UpdateSubmissionRequest req);
    Task<bool> DeleteAsync(long clientId, string id);

    // Equivalent to IE_Policy_BL.GetCommissiondetails — resolves via policy_commission first,
    // falling back to the intermediary's default commission rate (see server.js).
    Task<SubmissionCommissionDto?> GetCommissionAsync(long clientId, string id);

    // Finalize Quote payment plan (OutSystems SaveOnClick / GetPolicyDetails):
    // upserts policy_premium and regenerates the unpaid installment schedule.
    Task<PaymentPlanResponse?> GetPaymentPlanAsync(long clientId, string id);
    Task<PaymentPlanResponse> SavePaymentPlanAsync(long clientId, long userId, string id, SavePaymentPlanRequest req);

    // BindOnClick → UpdatePolicyStatus_BL: sets the policy status to Bound.
    Task<IssuePolicyResponse> BindPolicyAsync(long clientId, long userId, string id);

    // IssueOnClick → IssuePolicyHB_BL: converts the quote to a policy (policy number
    // generation, status transition, payment/commission transactions, cancel-rewrite check).
    Task<IssuePolicyResponse> IssuePolicyAsync(long clientId, long userId, string id);

    // IssueEndorsementOnClick: converts an endorsement draft to the policy's new Active
    // record (same PolicyNumber), unconditionally cancelling the prior policy it was
    // drafted against.
    Task<IssuePolicyResponse> IssueEndorsementAsync(long clientId, long userId, string id);
}
