// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
using InsureEdge.Application.DTOs.Claim;

namespace InsureEdge.Application.Interfaces;

public interface IClaimRepository
{
    // Enquiry list — excludes DRAFT (BR-CLM-001); scoped by client (BR-CLM-002)
    Task<(List<ClaimEnquiryDto> Items, int Total, int OpenCount, int UnassignedCount, int PendingCount, int ReferredCount)>
        GetEnquiryListAsync(long clientId, string? searchText);

    // Policy search (Step 1)
    Task<(List<PolicySearchDto> Items, int Total)> SearchPoliciesAsync(
        long clientId, string? search, string? searchField, int page, int pageSize);

    // Policy claims modal (Step 1 → Modal)
    Task<PolicyClaimsModalDto> GetPolicyClaimsAsync(long policyId, long clientId);

    // Policy details for Step 2 display
    Task<PolicyDetailsDto?> GetPolicyDetailsAsync(long policyId, long clientId);

    // Full claim detail (resume FNOL or view summary)
    Task<ClaimDetailDto?> GetClaimByIdAsync(long claimId, long clientId);

    // Create or update claim (Step 3 Next persists; BR-CLM-007 auto-populate)
    Task<long> CreateOrUpdateAsync(CreateOrUpdateClaimRequest req, long clientId, long userId);

    // Delete a DRAFT claim (in-progress FNOL)
    Task DeleteDraftAsync(long claimId, long clientId);

    // Export enquiry list
    Task<byte[]> ExportAsync(long clientId, string format, string? search, List<long>? selectedIds);


    // Claim workflow assignment
    Task<ClaimAssignmentDto> UpdateAssignmentAsync(long claimId, UpdateClaimAssignmentRequest req, long clientId, long userId);

    // Claim workflow documents
    Task<List<ClaimDocumentDto>> GetDocumentsAsync(long claimId, long clientId);
    Task<ClaimDocumentDto> AddDocumentAsync(long claimId, CreateClaimDocumentRequest req, long clientId, long userId);
    Task<ClaimDocumentFileDto?> GetDocumentFileAsync(long claimId, long documentId, long clientId);
    Task DeleteDocumentAsync(long claimId, long documentId, long clientId);

    // Temporary workflow records
    Task<List<TempClaimReportDto>> GetTempClaimReportsAsync(long claimId, long clientId);
    Task<TempClaimReportDto> UpsertTempClaimReportAsync(long claimId, UpsertTempClaimReportRequest req, long clientId, long userId);
    Task DeleteTempClaimReportAsync(long claimId, long id, long clientId);

    Task<List<TempClaimPartyDto>> GetTempClaimPartiesAsync(long claimId, long clientId);
    Task<TempClaimPartyDto> UpsertTempClaimPartyAsync(long claimId, UpsertTempClaimPartyRequest req, long clientId, long userId);
    Task DeleteTempClaimPartyAsync(long claimId, long id, long clientId);

    Task<List<TempClaimWitnessDto>> GetTempClaimWitnessesAsync(long claimId, long clientId);
    Task<TempClaimWitnessDto> UpsertTempClaimWitnessAsync(long claimId, UpsertTempClaimWitnessRequest req, long clientId, long userId);
    Task DeleteTempClaimWitnessAsync(long claimId, long id, long clientId);
    Task<List<LossExposureDto>> GetLossExposuresAsync(long claimId, long clientId);
    Task<LossExposureFormDataDto> GetLossExposureFormDataAsync(long claimId, long clientId);
    Task<LossExposureDto> CreateLossExposureAsync(long claimId, CreateLossExposureRequest req, long clientId, long userId);
    Task DeleteLossExposureAsync(long claimId, long id, long clientId);
    // Reference data
    Task<ClaimReferenceDataDto> GetReferenceDataAsync();
    Task<List<string>> GetImpactedAssetsForCoverageAsync(long coverageId);
    Task<string?> GetCoverageLimitAsync(long coverageId);
    Task<(decimal? Limit, string? Code)> GetColLossLimitAsync(long colId);
    Task<(decimal? Limit, string? Code)> GetAssetDetailAsync(long coverageId, string assetType);

    // Assignable users for Claim Assignment modal
    Task<List<AssignableUserDto>> GetAssignableUsersAsync(long clientId, string? search);

    // Claims Authority list
    Task<List<ClaimAuthorityDto>> GetAuthorityListAsync(long clientId, string? search);

    // Single authority detail
    Task<ClaimAuthorityDetailDto?> GetAuthorityDetailAsync(long clientId, long id);

    // Authority create / edit / approve / revoke
    Task<long> CreateAuthorityAsync(long clientId, CreateClaimAuthorityRequest req, long createdByUserId);
    Task<bool> UpdateAuthorityAsync(long clientId, long id, UpdateClaimAuthorityRequest req, long updatedByUserId);
    Task<bool> ApproveAuthorityAsync(long clientId, long id, long approvedByUserId);
    Task<bool> RevokeAuthorityAsync(long clientId, long id, long updatedByUserId);

    // Users available for Claims Authority selection (Department = Claims)
    Task<List<ClaimAuthorityUserSelectionDto>> GetUsersForAuthoritySelectionAsync(long clientId, string? searchKeyword, string? searchParameter);

    // Insured & Policy workflow screen
    Task<InsuredPolicyViewDto?> GetInsuredPolicyViewAsync(long claimId, long clientId);
}


