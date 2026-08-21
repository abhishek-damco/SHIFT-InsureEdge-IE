// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Register/list views over the "policy" table, filtered by policy_type + account_type
// (insuredType route segment in the prototype), mirroring server.js:
//   GET /api/:insuredType/nb-quotes/kpis        -> NEWBUSINESS
//   GET /api/:insuredType/nb-quotes             -> NEWBUSINESS
//   GET /api/:insuredType/endorsements/kpis     -> ENDORSEMENT
//   GET /api/:insuredType/endorsements          -> ENDORSEMENT
//   GET /api/:insuredType/renewals/kpis         -> RENEWAL
//   GET /api/:insuredType/renewals              -> RENEWAL
//   GET /api/:insuredType/policies/kpis         -> POLICY
//   GET /api/:insuredType/policies              -> POLICY
using InsureEdge.Application.DTOs.QuotesPolicies;
using InsureEdge.Domain.Entities;

namespace InsureEdge.Application.Interfaces;

public interface IPolicyQuoteRepository
{
    Task<NbQuotesKpiDto> GetNbQuotesKpisAsync(long clientId, string insuredType);
    Task<NbQuoteListResponse> GetNbQuotesAsync(long clientId, PolicyRegisterListQuery query);

    Task<EndorsementsKpiDto> GetEndorsementsKpisAsync(long clientId, string insuredType);
    Task<List<EndorsementListItemDto>> GetEndorsementsAsync(long clientId, string insuredType, string? search);

    Task<RenewalsKpiDto> GetRenewalsKpisAsync(long clientId, string insuredType);
    Task<List<RenewalListItemDto>> GetRenewalsAsync(long clientId, string insuredType, string? search);

    Task<PoliciesKpiDto> GetPoliciesKpisAsync(long clientId, string insuredType);
    Task<List<PolicyListItemDto>> GetPoliciesAsync(
        long clientId, string insuredType, string? search, string? status, string? sortCol, string? sortDir);

    Task<List<PolicyTransactionDto>> GetPolicyHistoryAsync(long clientId, string policyNumber);

    Task<PolicySummaryDto?> GetPolicySummaryAsync(long clientId, string policyNumber);

    Task<List<PolicyPendingTransactionDto>> GetPendingTransactionsAsync(long clientId, string policyNumber);

    Task<PolicyBillingDetailDto?> GetBillingDetailAsync(long clientId, string policyNumber);

    Task<List<PolicyClaimRowDto>> GetClaimsAsync(long clientId, string policyNumber);

    Task<List<PolicyTimelineEntryDto>> GetTimelineAsync(long clientId, string policyNumber);

    // ── Endorse Policy (deep-clone into new Draft) ─────────────────────────
    Task<EndorsePolicyResultDto> CreateEndorsementDraftAsync(
        long clientId, long userId, string policyNumber, EndorsePolicyRequestDto request);

    // Quote Review "Review/Compare Updated Information" — diff the open endorsement
    // draft against the prior policy it was drafted against.
    Task<List<EndorsementFieldChangeDto>> GetEndorsementChangesAsync(long clientId, string policyNumber);

    // Hydrates the wizard's FormState from the open endorsement draft's real cloned
    // data (see EndorsementDraftFormDto) — null if there's no open draft to hydrate from.
    Task<EndorsementDraftFormDto?> GetEndorsementDraftFormAsync(long clientId, string policyNumber);

    // Finalize Quote's Summary "Previous Amount" column — the prior policy's raw premium
    // inputs (see EndorsementPriorPremiumFormDto), null if there's no open draft or no
    // prior policy on record.
    Task<EndorsementPriorPremiumFormDto?> GetEndorsementPriorPremiumFormAsync(long clientId, string policyNumber);

    // ── Cancel Policy ───────────────────────────────────────────────────────
    Task<List<RequestedByOptionDto>> GetRequestedByOptionsAsync();
    List<string> GetReasonOfCancellationOptions(string requestedByCode);
    Task<PolicyCancellationPreviewDto?> GetCancellationPreviewAsync(
        long clientId, string policyNumber, DateOnly cancellationEffectiveDate);
    Task<CancelPolicyResultDto> SubmitCancellationAsync(
        long clientId, long userId, string policyNumber, CancelPolicyRequestDto request);

    // ── Cancel / Rewrite Policy ─────────────────────────────────────────────
    List<string> GetReasonForRewritingOptions();
    Task<CancelRewritePreviewDto?> GetCancelRewritePreviewAsync(
        long clientId, string policyNumber, DateOnly cancellationEffectiveDate);
    Task<CancelRewriteResultDto> SubmitCancelRewriteAsync(
        long clientId, long userId, string policyNumber, CancelRewriteRequestDto request);

    // ── Do Not Renew ─────────────────────────────────────────────────────────
    Task<NoticeOfNonRenewalInfoDto?> GetNoticeOfNonRenewalInfoAsync(long clientId, string policyNumber);
    Task<DoNotRenewResultDto> SubmitDoNotRenewAsync(
        long clientId, long userId, string policyNumber, DoNotRenewRequestDto request);
    Task<DoNotRenewResultDto> RemoveDoNotRenewAsync(long clientId, long userId, string policyNumber);

    // ── Notes ─────────────────────────────────────────────────────────────────
    Task<List<NoteDto>> GetNotesAsync(long clientId, string policyNumber);
    Task<NoteDto> CreateNoteAsync(long clientId, long userId, string policyNumber, CreateNoteRequestDto request);
    Task<NoteDto?> UpdateNoteAsync(long clientId, long userId, string policyNumber, long noteId, UpdateNoteRequestDto request);
    Task<bool> DeleteNoteAsync(long clientId, string policyNumber, long noteId);
    Task<NoteFile?> GetNoteFileAsync(long clientId, string policyNumber, long fileId);
}
