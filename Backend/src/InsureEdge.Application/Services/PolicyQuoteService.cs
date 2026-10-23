// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Quotes & Policies register/list service — delegates to IPolicyQuoteRepository.
// BR-QP-001: all queries scoped to clientId from session (ADR-010).
using InsureEdge.Application.DTOs.QuotesPolicies;
using InsureEdge.Application.Interfaces;

namespace InsureEdge.Application.Services;

public class PolicyQuoteService
{
    private readonly IPolicyQuoteRepository _repo;
    private readonly ICurrentTenantService _tenant;

    public PolicyQuoteService(IPolicyQuoteRepository repo, ICurrentTenantService tenant)
    {
        _repo = repo;
        _tenant = tenant;
    }

    // ── NB Quotes ───────────────────────────────────────────────────────────
    public Task<NbQuotesKpiDto> GetNbQuotesKpisAsync(string insuredType)
        => _repo.GetNbQuotesKpisAsync(_tenant.ClientId, insuredType);

    public Task<NbQuoteListResponse> GetNbQuotesAsync(PolicyRegisterListQuery query)
        => _repo.GetNbQuotesAsync(_tenant.ClientId, query);

    // ── Endorsements ────────────────────────────────────────────────────────
    public Task<EndorsementsKpiDto> GetEndorsementsKpisAsync(string insuredType)
        => _repo.GetEndorsementsKpisAsync(_tenant.ClientId, insuredType);

    public Task<List<EndorsementListItemDto>> GetEndorsementsAsync(string insuredType, string? search)
        => _repo.GetEndorsementsAsync(_tenant.ClientId, insuredType, search);

    // ── Renewals ────────────────────────────────────────────────────────────
    public Task<RenewalsKpiDto> GetRenewalsKpisAsync(string insuredType)
        => _repo.GetRenewalsKpisAsync(_tenant.ClientId, insuredType);

    public Task<List<RenewalListItemDto>> GetRenewalsAsync(string insuredType, string? search)
        => _repo.GetRenewalsAsync(_tenant.ClientId, insuredType, search);

    // ── Policies ────────────────────────────────────────────────────────────
    public Task<PoliciesKpiDto> GetPoliciesKpisAsync(string insuredType)
        => _repo.GetPoliciesKpisAsync(_tenant.ClientId, insuredType);

    public Task<List<PolicyListItemDto>> GetPoliciesAsync(
        string insuredType, string? search, string? status, string? sortCol, string? sortDir)
        => _repo.GetPoliciesAsync(_tenant.ClientId, insuredType, search, status, sortCol, sortDir);

    // ── Policy History ─────────────────────────────────────────────────────
    public Task<List<PolicyTransactionDto>> GetPolicyHistoryAsync(string policyNumber)
        => _repo.GetPolicyHistoryAsync(_tenant.ClientId, policyNumber);

    // ── Policy Summary ─────────────────────────────────────────────────────
    public Task<PolicySummaryDto?> GetPolicySummaryAsync(string policyNumber)
        => _repo.GetPolicySummaryAsync(_tenant.ClientId, policyNumber);

    // ── Pending Transactions ───────────────────────────────────────────────
    public Task<List<PolicyPendingTransactionDto>> GetPendingTransactionsAsync(string policyNumber)
        => _repo.GetPendingTransactionsAsync(_tenant.ClientId, policyNumber);

    // ── Billing detail ─────────────────────────────────────────────────────
    public Task<PolicyBillingDetailDto?> GetBillingDetailAsync(string policyNumber)
        => _repo.GetBillingDetailAsync(_tenant.ClientId, policyNumber);

    // ── Claims ──────────────────────────────────────────────────────────────
    public Task<List<PolicyClaimRowDto>> GetClaimsAsync(string policyNumber)
        => _repo.GetClaimsAsync(_tenant.ClientId, policyNumber);

    // ── Timeline ────────────────────────────────────────────────────────────
    public Task<List<PolicyTimelineEntryDto>> GetTimelineAsync(string policyNumber)
        => _repo.GetTimelineAsync(_tenant.ClientId, policyNumber);

    // ── Endorse Policy ──────────────────────────────────────────────────────
    public Task<EndorsePolicyResultDto> CreateEndorsementDraftAsync(string policyNumber, EndorsePolicyRequestDto request)
        => _repo.CreateEndorsementDraftAsync(_tenant.ClientId, _tenant.UserId, policyNumber, request);

    public Task<List<EndorsementFieldChangeDto>> GetEndorsementChangesAsync(string policyNumber)
        => _repo.GetEndorsementChangesAsync(_tenant.ClientId, policyNumber);

    public Task<EndorsementDraftFormDto?> GetEndorsementDraftFormAsync(string policyNumber)
        => _repo.GetEndorsementDraftFormAsync(_tenant.ClientId, policyNumber);

    public Task<EndorsementPriorPremiumFormDto?> GetEndorsementPriorPremiumFormAsync(string policyNumber)
        => _repo.GetEndorsementPriorPremiumFormAsync(_tenant.ClientId, policyNumber);

    // ── Cancel Policy ───────────────────────────────────────────────────────
    public Task<List<RequestedByOptionDto>> GetRequestedByOptionsAsync()
        => _repo.GetRequestedByOptionsAsync();

    public List<string> GetReasonOfCancellationOptions(string requestedByCode)
        => _repo.GetReasonOfCancellationOptions(requestedByCode);

    public Task<PolicyCancellationPreviewDto?> GetCancellationPreviewAsync(string policyNumber, DateOnly cancellationEffectiveDate)
        => _repo.GetCancellationPreviewAsync(_tenant.ClientId, policyNumber, cancellationEffectiveDate);

    public Task<CancelPolicyResultDto> SubmitCancellationAsync(string policyNumber, CancelPolicyRequestDto request)
        => _repo.SubmitCancellationAsync(_tenant.ClientId, _tenant.UserId, policyNumber, request);

    // ── Cancel / Rewrite Policy ─────────────────────────────────────────────
    public List<string> GetReasonForRewritingOptions()
        => _repo.GetReasonForRewritingOptions();

    public Task<CancelRewritePreviewDto?> GetCancelRewritePreviewAsync(string policyNumber, DateOnly cancellationEffectiveDate)
        => _repo.GetCancelRewritePreviewAsync(_tenant.ClientId, policyNumber, cancellationEffectiveDate);

    public Task<CancelRewriteResultDto> SubmitCancelRewriteAsync(string policyNumber, CancelRewriteRequestDto request)
        => _repo.SubmitCancelRewriteAsync(_tenant.ClientId, _tenant.UserId, policyNumber, request);

    // ── Do Not Renew ────────────────────────────────────────────────────────
    public Task<NoticeOfNonRenewalInfoDto?> GetNoticeOfNonRenewalInfoAsync(string policyNumber)
        => _repo.GetNoticeOfNonRenewalInfoAsync(_tenant.ClientId, policyNumber);

    public Task<DoNotRenewResultDto> SubmitDoNotRenewAsync(string policyNumber, DoNotRenewRequestDto request)
        => _repo.SubmitDoNotRenewAsync(_tenant.ClientId, _tenant.UserId, policyNumber, request);

    public Task<DoNotRenewResultDto> RemoveDoNotRenewAsync(string policyNumber)
        => _repo.RemoveDoNotRenewAsync(_tenant.ClientId, _tenant.UserId, policyNumber);

    // ── Notes ───────────────────────────────────────────────────────────────
    public Task<List<NoteDto>> GetNotesAsync(string policyNumber)
        => _repo.GetNotesAsync(_tenant.ClientId, policyNumber);

    public Task<NoteDto> CreateNoteAsync(string policyNumber, CreateNoteRequestDto request)
        => _repo.CreateNoteAsync(_tenant.ClientId, _tenant.UserId, policyNumber, request);

    public Task<NoteDto?> UpdateNoteAsync(string policyNumber, long noteId, UpdateNoteRequestDto request)
        => _repo.UpdateNoteAsync(_tenant.ClientId, _tenant.UserId, policyNumber, noteId, request);

    public Task<bool> DeleteNoteAsync(string policyNumber, long noteId)
        => _repo.DeleteNoteAsync(_tenant.ClientId, policyNumber, noteId);

    public Task<Domain.Entities.NoteFile?> GetNoteFileAsync(string policyNumber, long fileId)
        => _repo.GetNoteFileAsync(_tenant.ClientId, policyNumber, fileId);
}
