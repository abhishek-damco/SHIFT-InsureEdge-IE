// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Claims Enquiry service — delegates to IClaimRepository.
// BR-CLM-001: DRAFT excluded from enquiry list.
// BR-CLM-002: all queries scoped to clientId from session.
// BR-CLM-006: search is cross-field (repository applies it).
using InsureEdge.Application.DTOs.Claim;
using InsureEdge.Application.Interfaces;

namespace InsureEdge.Application.Services;

public class ClaimService
{
    private readonly IClaimRepository _repo;
    private readonly ICurrentTenantService _tenant;

    public ClaimService(IClaimRepository repo, ICurrentTenantService tenant)
    {
        _repo = repo;
        _tenant = tenant;
    }

    // CS-148: GetClaimEnquiryList — non-DRAFT, client-scoped, optional search
    public Task<(List<ClaimEnquiryDto> Items, int Total, int OpenCount, int UnassignedCount, int PendingCount, int ReferredCount)>
        GetEnquiryListAsync(string? searchText)
        => _repo.GetEnquiryListAsync(_tenant.ClientId, searchText);

    // Step 1: policy search
    public Task<(List<PolicySearchDto> Items, int Total)> SearchPoliciesAsync(
        string? search, string? searchField, int page, int pageSize)
        => _repo.SearchPoliciesAsync(_tenant.ClientId, search, searchField, page, pageSize);

    // Step 1 → Modal: in-progress + existing claims for a policy
    public Task<PolicyClaimsModalDto> GetPolicyClaimsAsync(long policyId)
        => _repo.GetPolicyClaimsAsync(policyId, _tenant.ClientId);

    // Step 2: policy details accordion
    public Task<PolicyDetailsDto?> GetPolicyDetailsAsync(long policyId)
        => _repo.GetPolicyDetailsAsync(policyId, _tenant.ClientId);

    // Get full claim (resume FNOL or view)
    public Task<ClaimDetailDto?> GetClaimByIdAsync(long claimId)
        => _repo.GetClaimByIdAsync(claimId, _tenant.ClientId);

    // CS-19: Create or update claim (Step 3 Next persists)
    public Task<long> CreateOrUpdateAsync(CreateOrUpdateClaimRequest req)
        => _repo.CreateOrUpdateAsync(req, _tenant.ClientId, _tenant.UserId);

    // Delete DRAFT (in-progress FNOL modal)
    public Task DeleteDraftAsync(long claimId)
        => _repo.DeleteDraftAsync(claimId, _tenant.ClientId);

    // Export enquiry list (CSV-backed, matching group list behavior)
    public Task<byte[]> ExportAsync(string format, string? searchText, List<long>? selectedIds)
        => _repo.ExportAsync(_tenant.ClientId, format, searchText, selectedIds);


    public Task<ClaimAssignmentDto> UpdateAssignmentAsync(long claimId, UpdateClaimAssignmentRequest req)
        => _repo.UpdateAssignmentAsync(claimId, req, _tenant.ClientId, _tenant.UserId);

    public Task<List<ClaimDocumentDto>> GetDocumentsAsync(long claimId)
        => _repo.GetDocumentsAsync(claimId, _tenant.ClientId);

    public Task<ClaimDocumentDto> AddDocumentAsync(long claimId, CreateClaimDocumentRequest req)
        => _repo.AddDocumentAsync(claimId, req, _tenant.ClientId, _tenant.UserId);

    public Task<ClaimDocumentFileDto?> GetDocumentFileAsync(long claimId, long documentId)
        => _repo.GetDocumentFileAsync(claimId, documentId, _tenant.ClientId);

    public Task DeleteDocumentAsync(long claimId, long documentId)
        => _repo.DeleteDocumentAsync(claimId, documentId, _tenant.ClientId);

    public Task<List<TempClaimReportDto>> GetTempClaimReportsAsync(long claimId)
        => _repo.GetTempClaimReportsAsync(claimId, _tenant.ClientId);

    public Task<TempClaimReportDto> UpsertTempClaimReportAsync(long claimId, UpsertTempClaimReportRequest req)
        => _repo.UpsertTempClaimReportAsync(claimId, req, _tenant.ClientId, _tenant.UserId);

    public Task DeleteTempClaimReportAsync(long claimId, long id)
        => _repo.DeleteTempClaimReportAsync(claimId, id, _tenant.ClientId);

    public Task<List<TempClaimPartyDto>> GetTempClaimPartiesAsync(long claimId)
        => _repo.GetTempClaimPartiesAsync(claimId, _tenant.ClientId);

    public Task<TempClaimPartyDto> UpsertTempClaimPartyAsync(long claimId, UpsertTempClaimPartyRequest req)
        => _repo.UpsertTempClaimPartyAsync(claimId, req, _tenant.ClientId, _tenant.UserId);

    public Task DeleteTempClaimPartyAsync(long claimId, long id)
        => _repo.DeleteTempClaimPartyAsync(claimId, id, _tenant.ClientId);

    public Task<List<TempClaimWitnessDto>> GetTempClaimWitnessesAsync(long claimId)
        => _repo.GetTempClaimWitnessesAsync(claimId, _tenant.ClientId);

    public Task<TempClaimWitnessDto> UpsertTempClaimWitnessAsync(long claimId, UpsertTempClaimWitnessRequest req)
        => _repo.UpsertTempClaimWitnessAsync(claimId, req, _tenant.ClientId, _tenant.UserId);

    public Task DeleteTempClaimWitnessAsync(long claimId, long id)
        => _repo.DeleteTempClaimWitnessAsync(claimId, id, _tenant.ClientId);
    public Task<List<LossExposureDto>> GetLossExposuresAsync(long claimId)
        => _repo.GetLossExposuresAsync(claimId, _tenant.ClientId);
    public Task<LossExposureFormDataDto> GetLossExposureFormDataAsync(long claimId)
        => _repo.GetLossExposureFormDataAsync(claimId, _tenant.ClientId);
    public Task<LossExposureDto> CreateLossExposureAsync(long claimId, CreateLossExposureRequest req)
        => _repo.CreateLossExposureAsync(claimId, req, _tenant.ClientId, _tenant.UserId);
    public Task DeleteLossExposureAsync(long claimId, long id)
        => _repo.DeleteLossExposureAsync(claimId, id, _tenant.ClientId);
    // Reference data (channels, cause-of-loss, coverage types, etc.)
    public Task<ClaimReferenceDataDto> GetReferenceDataAsync()
        => _repo.GetReferenceDataAsync();

    public Task<List<string>> GetImpactedAssetsForCoverageAsync(long coverageId)
        => _repo.GetImpactedAssetsForCoverageAsync(coverageId);

    public Task<string?> GetCoverageLimitAsync(long coverageId)
        => _repo.GetCoverageLimitAsync(coverageId);

    public Task<(decimal? Limit, string? Code)> GetColLossLimitAsync(long colId)
        => _repo.GetColLossLimitAsync(colId);

    public Task<(decimal? Limit, string? Code)> GetAssetDetailAsync(long coverageId, string assetType)
        => _repo.GetAssetDetailAsync(coverageId, assetType);

    // Assignable users for Claim Assignment modal
    public Task<List<AssignableUserDto>> GetAssignableUsersAsync(string? search)
        => _repo.GetAssignableUsersAsync(_tenant.ClientId, search);

    // Claims Authority list
    public Task<List<ClaimAuthorityDto>> GetAuthorityListAsync(string? search)
        => _repo.GetAuthorityListAsync(_tenant.ClientId, search);

    // Single authority detail
    public Task<ClaimAuthorityDetailDto?> GetAuthorityDetailAsync(long id)
        => _repo.GetAuthorityDetailAsync(_tenant.ClientId, id);

    // Authority create / edit / approve / revoke
    public Task<long> CreateAuthorityAsync(CreateClaimAuthorityRequest req, long userId)
        => _repo.CreateAuthorityAsync(_tenant.ClientId, req, userId);

    public Task<bool> UpdateAuthorityAsync(long id, UpdateClaimAuthorityRequest req, long userId)
        => _repo.UpdateAuthorityAsync(_tenant.ClientId, id, req, userId);

    public Task<bool> ApproveAuthorityAsync(long id, long userId)
        => _repo.ApproveAuthorityAsync(_tenant.ClientId, id, userId);

    public Task<bool> RevokeAuthorityAsync(long id, long userId)
        => _repo.RevokeAuthorityAsync(_tenant.ClientId, id, userId);

    // Users available for Claims Authority selection
    public Task<List<ClaimAuthorityUserSelectionDto>> GetUsersForAuthoritySelectionAsync(string? searchKeyword, string? searchParameter)
        => _repo.GetUsersForAuthoritySelectionAsync(_tenant.ClientId, searchKeyword, searchParameter);

    // Insured & Policy workflow screen
    public Task<InsuredPolicyViewDto?> GetInsuredPolicyViewAsync(long claimId)
        => _repo.GetInsuredPolicyViewAsync(claimId, _tenant.ClientId);
}


