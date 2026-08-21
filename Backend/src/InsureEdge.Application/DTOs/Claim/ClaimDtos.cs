// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Claims Enquiry DTOs — sourced from ClaimsEnquiry.md + 04_Claims.md
// BR-CLM-001: DRAFT excluded from enquiry list
// BR-CLM-003/004/005: PolicyHolder, ClaimEstimate, Aging computed fields
// BR-CLM-006: search across 16 fields

namespace InsureEdge.Application.DTOs.Claim;

// ─── Enquiry List ─────────────────────────────────────────────────────────────

/// <summary>One row in the Claims Enquiry grid (CS-148).</summary>
public record ClaimEnquiryDto(
    long Id,
    string ClaimNumber,
    string PolicyNumber,
    string PolicyHolder,       // BR-CLM-003: LegalBusinessName when FirstName blank
    string ClaimantName,       // comma-separated first+last of all claimants
    string ClaimStatus,
    string Lob,
    string SubLob,
    string DateOfLoss,         // formatted MM-dd-yyyy; empty when null
    string SubmissionDate,     // Claim.CreatedOn formatted MM-dd-yyyy
    string ClaimType,
    string AssignedTo,         // full name of assigned user; empty when unassigned
    int Aging,                 // BR-CLM-005: DiffDays(today, CreatedOn)
    string EstimateAmount,     // BR-CLM-004: "{Currency} {Amount}" or empty
    string ClaimInitiationChannel,
    string MainCauseOfLoss,
    string ConsequencesOfLoss,
    string ClaimReimbursementType,
    string CatastrophicEvent,
    bool InspectionRequired,
    bool IsThirdPartyDamage,
    string ReporterName,
    string ReporterEmail,
    string LossLocation,
    string ClosureDate,
    string CreatedByName,
    bool IsAssigned,
    string ApprovedAmount,
    string AdjusterAssigned,
    string ClaimReferred,
    string ReferredDept,
    string FraudIndicator
);

public record ClaimEnquiryResponse(
    List<ClaimEnquiryDto> Items,
    int Total,
    int OpenCount,
    int UnassignedCount,
    int PendingCount,
    int ReferredCount
);

// ─── Policy Search (Step 1) ───────────────────────────────────────────────────

public record PolicySearchDto(
    long Id,
    string PolicyNumber,
    string InsuredName,
    string Address,
    string EffectiveDate,
    string Lob,
    string Status
);

public record PolicySearchResponse(List<PolicySearchDto> Items, int Total);

// ─── In-Progress / Existing Claims for Policy Modal (Step 1 → Modal) ─────────

public record InProgressClaimDto(
    long Id,
    string? ClaimNumber,
    string DateOfLoss,
    string InsuredName,
    string Lob,
    short LastStepNumber
);

public record ExistingClaimDto(
    long Id,
    string ClaimNumber,
    string DateOfLoss,
    string InsuredName,
    string ClaimantName,
    string Lob,
    string ClaimStatus
);

public record PolicyClaimsModalDto(
    List<InProgressClaimDto> InProgress,
    List<ExistingClaimDto> Existing
);

// ─── Policy Information (Step 2) ─────────────────────────────────────────────

public record InsuredDetailsDto(
    string? CustomerId,
    string? FirstName,
    string? MiddleName,
    string? LastName,
    string? AddressLine1,
    string? AddressLine2,
    string? Country,
    string? State,
    string? City,
    string? County,
    string? ZipCode,
    string? Telephone,
    string? TelephoneExt,
    string? AlternateTelephone,
    string? Email
);

public record AdditionalInsuredDetailsDto(
    long Id,
    string? FirstName,
    string? MiddleName,
    string? LastName,
    string? Relationship,
    string? TelephoneNumber,
    string? AlternateTelephoneNumber,
    string? Email,
    string? InsuredType,
    string? DbaName
);

public record AdditionalOrganisationDetailsDto(
    long Id,
    string? OrganisationName,
    string? OrganisationType,
    string? TelephoneNumber,
    int? Extension,
    string? AlternateTelephoneNumber,
    string? Email,
    string? FirstName,
    string? MiddleName,
    string? LastName
);

public record PolicyDetailsDto(
    long Id,
    string PolicyNumber,
    string? Lob,
    string? SubProduct,
    string? InsuredName,
    string? Address,
    string? EffectiveDate,
    string? ExpiryDate,
    string Status,
    string? InsuranceType,
    string? CoverageLevel,
    string? Deductible,
    InsuredDetailsDto? Insured,
    RiskLocationDetailsDto? RiskLocation,
    List<AdditionalInsuredDetailsDto> AdditionalInsureds,
    List<AdditionalOrganisationDetailsDto> AdditionalOrganisations
);

public record RiskLocationDetailsDto(
    long? Id,
    string? PropertyLocation,
    string? Latitude,
    string? Longitude,
    string? OccupancyType,
    string? ConstructionType,
    string? AgeOfProperty,
    string? LengthOfOccupancy,
    string? RoofType,
    string? FireProtectionClass
);

// ─── Coverage row (Step 3) ────────────────────────────────────────────────────

public record ClaimCoverageDto(
    long Id,
    long? CoverageId,
    string? CoverageName,
    long? CauseOfLossId,
    string? CauseOfLossName,
    string? AssetType
);

public record ClaimCoverageSaveDto(
    long? Id,
    long? CoverageId,
    long? CauseOfLossId,
    string? AssetType
);

// ─── Claimant (Step 3 conditional) ───────────────────────────────────────────

public record ClaimantDto(
    long Id,
    string PartyType,
    string? FirstName,
    string? MiddleName,
    string? LastName,
    string? RelationshipWithInsured,
    string? Telephone,
    string? TelephoneCC,
    string? AlternateTelephone,
    string? Email,
    string? AddressLine1,
    string? AddressLine2,
    string? Country,
    string? State,
    string? City,
    string? County,
    string? ZipCode,
    string? Latitude,
    string? Longitude,
    string? ListOfDamages
);

public record ClaimantSaveDto(
    long? Id,
    string PartyType,
    string FirstName,
    string? MiddleName,
    string LastName,
    string RelationshipWithInsured,
    string Telephone,
    string? TelephoneCC,
    string? AlternateTelephone,
    string Email,
    string? AddressLine1,
    string? AddressLine2,
    string? Country,
    string? State,
    string? City,
    string? County,
    string? ZipCode,
    string? Latitude,
    string? Longitude,
    string? ListOfDamages
);

// ─── Document list (Step 4) ───────────────────────────────────────────────────

public record ClaimDocumentDto(
    long Id,
    string FileName,
    string? ContentType,
    long? FileSize,
    string? NotifyToName,    // BR-CLM-012: NotifyTo resolved to FirstName+LastName
    string? Comment,
    string CreatedOn         // BR-CLM-013: formatted MM-dd-yyyy
);

// ─── Full claim detail (for FNOL resume + claim summary view) ─────────────────

public record ClaimDetailDto(
    long Id,
    string? ClaimNumber,
    long PolicyId,
    string PolicyNumber,
    long ClientId,
    string Status,
    short LastStepNumber,
    bool IsClaimReportedByInsured,

    // Reporter
    string? ReporterFirstName,
    string? ReporterLastName,
    string? ReporterRelationship,
    string? ReporterTelephone,
    string? ReporterEmail,

    // Loss
    string? DateOfLoss,
    string? TimeOfLoss,
    string? ClaimInitiationChannel,
    string? ClaimType,
    string? MainCauseOfLoss,
    string? ConsequencesOfLoss,
    bool InspectionRequired,
    string? ClaimReimbursementType,
    string? CatastrophicEvent,
    string? LossDescription,
    string? ListOfDamageFirstParty,
    bool? PhysicalDamage,
    bool? ClaimOnlyThirdParty,
    bool IsThirdPartyDamage,

    // Loss location
    string? LossAddressLine1,
    string? LossAddressLine2,
    string? LossCountry,
    string? LossState,
    string? LossCity,
    string? LossCounty,
    string? LossZipCode,
    string? LossLatitude,
    string? LossLongitude,

    // Step 4
    string? ClaimEstimate,
    string? Comment,

    List<ClaimCoverageDto> Coverages,
    List<ClaimantDto> Claimants,
    List<ClaimDocumentDto> Documents,

    PolicyDetailsDto? PolicyDetails,

    // Workflow display
    string? AssignedToName,
    string CreatedOn
);

// ─── Create / Update Requests ─────────────────────────────────────────────────

public record CreateOrUpdateClaimRequest(
    long? Id,
    long PolicyId,
    long? RiskLocationId,
    string Status,
    short LastStepNumber,
    bool IsClaimReportedByInsured,

    string? ReporterFirstName,
    string? ReporterLastName,
    string? ReporterRelationship,
    string? ReporterTelephone,
    string? ReporterTelephoneCC,
    string? ReporterEmail,

    string? DateOfLoss,
    string? TimeOfLoss,
    string? ClaimInitiationChannel,
    string? ClaimType,
    string? MainCauseOfLoss,
    string? ConsequencesOfLoss,
    bool InspectionRequired,
    string? ClaimReimbursementType,
    string? CatastrophicEvent,
    string? LossDescription,
    string? ListOfDamageFirstParty,
    bool? PhysicalDamage,
    bool? ClaimOnlyThirdParty,
    bool IsThirdPartyDamage,

    string? LossAddressLine1,
    string? LossAddressLine2,
    string? LossCountry,
    string? LossState,
    string? LossCity,
    string? LossCounty,
    string? LossZipCode,
    string? LossLatitude,
    string? LossLongitude,

    string? ClaimEstimate,
    string? Comment,

    List<ClaimCoverageSaveDto> Coverages,
    List<ClaimantSaveDto> Claimants
);

public record DeleteClaimRequest(long ClaimId);

// ─── Reference data responses ─────────────────────────────────────────────────

public record CoverageOptionDto(long Id, string Name);

public record ClaimReferenceDataDto(
    List<string> InitiationChannels,
    List<CoverageOptionDto> CausesOfLoss,              // from master claim_coverage (cause_of_loss rows)
    List<string> ConsequencesOfLoss,
    List<CoverageOptionDto> CoverageTypes,             // HO Physical Damage coverage options from master
    List<CoverageOptionDto> PersonalLiabilityCoverageTypes, // HO Personal Liability coverage options from master
    List<string> ImpactedAssets,                       // kept as strings for worksheet legacy use
    List<string> RelationshipTypes
);


public record ClaimAssignmentDto(
    long? AssignedTo,
    string? AssignedToName
);

public record AssignableUserDto(
    long Id,
    string Name,
    string UserCode,
    string PaymentApprovalLimit,
    string ReserveApprovalLimit
);

public record UpdateClaimAssignmentRequest(
    long? AssignedTo,
    string? AssignedToName
);

public record CreateClaimDocumentRequest(
    string FileName,
    string? ContentType,
    long? FileSize,
    string? FileContentBase64,
    string? NotifyToName,
    string? Comment
);

public record ClaimDocumentFileDto(
    long Id,
    string FileName,
    string? ContentType,
    byte[]? Content
);

public record TempClaimReportDto(
    long Id,
    long ClaimId,
    string? ReportType,
    string? ReportNumber,
    string? ReportFilingDate,
    string? PrecinctName,
    string? CaseStatus,
    string? NumberOfWitness,
    string? Description,
    bool NotifyDocumentUpload,
    string? NotifyToName,
    string? Comment,
    string? ContactFirstName,
    string? ContactLastName,
    string? IdentityDocument,
    string? TelephoneNumber,
    string? Extension,
    string? AlternateTelephoneNumber,
    string? EmailId,
    string? ReferenceDocumentName,
    string CreatedOn
);

public record UpsertTempClaimReportRequest(
    long? Id,
    string? ReportType,
    string? ReportNumber,
    string? ReportFilingDate,
    string? PrecinctName,
    string? CaseStatus,
    string? NumberOfWitness,
    string? Description,
    bool NotifyDocumentUpload,
    string? NotifyToName,
    string? Comment,
    string? ContactFirstName,
    string? ContactLastName,
    string? IdentityDocument,
    string? TelephoneNumber,
    string? Extension,
    string? AlternateTelephoneNumber,
    string? EmailId,
    string? ReferenceDocumentName
);

public record LossExposureDto(
    long Id,
    long ClaimId,
    string LossParty,
    string? ClaimantReference,
    string ClaimantName,
    string ClaimantType,
    long? LossExposureTypeId,
    string LossType,
    string? CoverageLimit,
    string Severity,
    long? CauseOfLossId,
    string CauseOfLoss,
    decimal? PercentageAllocation,
    bool PropertyUsable,
    bool ContractorsInvolved,
    bool MoldSuspected,
    bool AdditionalLivingExpenseRequired,
    bool ContentDamage,
    bool SprinklerAlarmInstalled,
    bool LienholderInvolved,
    bool AttorneyInvolved,
    string? DescriptionOfLoss,
    List<LossExposureDamageDto> DamageDetails,
    bool AdditionalServicesRequired,
    string LossConsequences,
    decimal LossEstimate,
    string Currency,
    string? Notes,
    string CreatedOn
);

public record CreateLossExposureRequest(
    string LossParty,
    string? ClaimantReference,
    string ClaimantName,
    long LossExposureTypeId,
    string LossType,
    string? CoverageLimit,
    string Severity,
    long? CauseOfLossId,
    string CauseOfLoss,
    decimal? PercentageAllocation,
    bool PropertyUsable,
    bool ContractorsInvolved,
    bool MoldSuspected,
    bool AdditionalLivingExpenseRequired,
    bool ContentDamage,
    bool SprinklerAlarmInstalled,
    bool LienholderInvolved,
    bool AttorneyInvolved,
    string? DescriptionOfLoss,
    List<LossExposureDamageRequest> DamageDetails,
    bool AdditionalServicesRequired,
    decimal LossEstimate,
    string? Currency,
    string? Notes
);

public record LossExposureImageDto(string FileName, string? ContentType, string ContentBase64);
public record LossExposureDamageDto(string Section, string? MaterialType, decimal? PercentageOfDamage, List<LossExposureImageDto> Images);
public record LossExposureImageRequest(string FileName, string? ContentType, string ContentBase64);
public record LossExposureDamageRequest(string Section, string? MaterialType, decimal? PercentageOfDamage, List<LossExposureImageRequest> Images);

public record LossExposureRiskDetailsDto(
    string? OccupancyType,
    string? ConstructionType,
    string? AgeOfProperty,
    string? LengthOfOccupancy,
    string? RoofType,
    string? FireProtectionClass
);

public record LossExposureClaimantOptionDto(string Reference, string Name, string LossParty);
public record LossExposureTypeOptionDto(long Id, string Name, string LossParty, string? Limit);
public record LossExposureDamageSectionDto(string Name, List<string> Materials);
public record LossExposureFormDataDto(
    LossExposureRiskDetailsDto RiskDetails,
    List<string> LossParties,
    List<LossExposureClaimantOptionDto> Claimants,
    List<LossExposureTypeOptionDto> ExposureTypes,
    List<string> Severities,
    List<CoverageOptionDto> CausesOfLoss,
    List<LossExposureDamageSectionDto> DamageSections
);

public record TempClaimPartyDto(
    long Id,
    long ClaimId,
    string? PartyType,
    string? PartyCategory,
    string? BusinessName,
    string? TinId,
    string? FirstName,
    string? MiddleName,
    string? LastName,
    string? DateOfBirth,
    string? Gender,
    string? SocialSecurityNumber,
    string? RelationshipWithInsured,
    string? AddressLine1,
    string? AddressLine2,
    string? Country,
    string? State,
    string? City,
    string? County,
    string? ZipCode,
    string? Latitude,
    string? Longitude,
    string? TelephoneNumber,
    string? Extension,
    string? AlternateTelephoneNumber,
    string? EmailId,
    string? Description,
    string? ProfileImageName,
    string? IdProofName,
    string CreatedOn
);

public record UpsertTempClaimPartyRequest(
    long? Id,
    string? PartyType,
    string? PartyCategory,
    string? BusinessName,
    string? TinId,
    string? FirstName,
    string? MiddleName,
    string? LastName,
    string? DateOfBirth,
    string? Gender,
    string? SocialSecurityNumber,
    string? RelationshipWithInsured,
    string? AddressLine1,
    string? AddressLine2,
    string? Country,
    string? State,
    string? City,
    string? County,
    string? ZipCode,
    string? Latitude,
    string? Longitude,
    string? TelephoneNumber,
    string? Extension,
    string? AlternateTelephoneNumber,
    string? EmailId,
    string? Description,
    string? ProfileImageName,
    string? IdProofName
);

// ─── Insured & Policy workflow screen ────────────────────────────────────────

public record NamedInsuredRowDto(
    long Id,
    string? Name,
    string? Relationship,
    string? TelephoneNumber,
    string? AlternateTelephoneNumber,
    string? EmailId,
    string? InsuredType,
    string? DbaName
);

public record OrganizationRowDto(
    long Id,
    string? OrgName,
    string? OrgType,
    string? TelephoneNumber,
    string? Extension,
    string? AlternateTelephoneNumber,
    string? EmailId,
    string? ContactName
);

public record InsuredPolicyViewDto(
    InsuredDetailsDto? Insured,
    List<NamedInsuredRowDto> NamedInsureds,
    List<OrganizationRowDto> Organizations,
    PolicyDetailsDto? Policy,
    string? LossLocation
);

public record TempClaimWitnessDto(
    long Id,
    long ClaimId,
    string? FirstName,
    string? MiddleName,
    string? LastName,
    string? DateOfBirth,
    string? Gender,
    string? SocialSecurityNumber,
    string? RelationshipWithInsured,
    string? AddressLine1,
    string? AddressLine2,
    string? Country,
    string? State,
    string? City,
    string? County,
    string? ZipCode,
    string? Latitude,
    string? Longitude,
    string? TelephoneNumber,
    string? Extension,
    string? AlternateTelephoneNumber,
    string? EmailId,
    string? Description,
    string? ProfileImageName,
    string? IdProofName,
    string CreatedOn
);

public record UpsertTempClaimWitnessRequest(
    long? Id,
    string? FirstName,
    string? MiddleName,
    string? LastName,
    string? DateOfBirth,
    string? Gender,
    string? SocialSecurityNumber,
    string? RelationshipWithInsured,
    string? AddressLine1,
    string? AddressLine2,
    string? Country,
    string? State,
    string? City,
    string? County,
    string? ZipCode,
    string? Latitude,
    string? Longitude,
    string? TelephoneNumber,
    string? Extension,
    string? AlternateTelephoneNumber,
    string? EmailId,
    string? Description,
    string? ProfileImageName,
    string? IdProofName
);

// ─── Claims Authority ──────────────────────────────────────────────────────────

public record ClaimAuthorityUserSelectionDto(
    long Id,
    string UserCode,         // "IE{user.Id:D4}"
    string FullName,
    string Initials,
    string Department,
    string Designation,
    string Status            // "Active" | "Inactive"
);

public record ClaimAuthorityDto(
    long Id,
    string UserId,               // "IE{user.Id:D4}"
    string UserName,
    string UserInitials,
    string Department,
    string Designation,
    string ApprovedLob,
    string Currency,
    decimal ReserveLimit,
    decimal IndemnityPaymentLimit,
    decimal FeePaymentLimit,
    decimal ExGratiaPaymentLimit,
    string JurisdictionLocation,
    string AuthorityStatus       // "Active" | "Inactive"
);

public record CreateClaimAuthorityRequest(
    long UserId,
    string InsuranceType,
    string ApprovedLob,
    string Currency,
    decimal ReserveLimit,
    decimal IndemnityPaymentLimit,
    decimal FeePaymentLimit,
    decimal ExGratiaPaymentLimit,
    string PaymentMethodRestrictions,
    string? DateOfAuthorityAssignment,
    bool CanDenyWorksheet,
    string JurisdictionCountry,
    string JurisdictionStates
);

public record UpdateClaimAuthorityRequest(
    string InsuranceType,
    string ApprovedLob,
    string Currency,
    decimal ReserveLimit,
    decimal IndemnityPaymentLimit,
    decimal FeePaymentLimit,
    decimal ExGratiaPaymentLimit,
    string PaymentMethodRestrictions,
    string? DateOfAuthorityAssignment,
    bool CanDenyWorksheet,
    string JurisdictionCountry,
    string JurisdictionStates
);

public record ClaimAuthorityDetailDto(
    long Id,
    // User details
    string UserId,
    string FirstName,
    string? MiddleName,
    string LastName,
    string UserInitials,
    string Department,
    string Designation,
    string AuthorityStatus,
    // Authority details
    string InsuranceType,
    string ApprovedLob,
    string Currency,
    decimal ReserveLimit,
    decimal IndemnityPaymentLimit,
    decimal FeePaymentLimit,
    decimal ExGratiaPaymentLimit,
    string PaymentMethodRestrictions,
    string DateOfAuthorityAssignment,
    bool CanDenyWorksheet,
    // Jurisdiction
    string JurisdictionCountry,
    string JurisdictionStates,
    // Approver details
    string UpdatedByName,
    string UpdatedByInitials,
    string ApprovedByName,
    string ApprovedByInitials,
    // Audit
    string CreatedByName,
    string CreatedByInitials,
    string UpdatedDate,
    string ActionPerformed
);

