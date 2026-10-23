// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Distribution Management: Intermediary (brokerage/agency) + Producer (individual agent).
// Field names are snake_case to match Frontend/src/api/distribution.ts's existing payload
// shapes (ViewIntermediaryPage.tsx / AddIntermediaryPage.tsx / ReviewSubmitPage.tsx).
using System.Text.Json.Serialization;

namespace InsureEdge.Application.DTOs.Distribution;

public record IntermediaryListItemDto(
    long Id,
    [property: JsonPropertyName("intermediary_code")] string IntermediaryCode,
    [property: JsonPropertyName("intermediary_name")] string IntermediaryName,
    [property: JsonPropertyName("type_of_intermediary")] string? TypeOfIntermediary,
    [property: JsonPropertyName("federal_tax_id")] string? FederalTaxId,
    [property: JsonPropertyName("residential_state")] string? ResidentialState,
    string Status,
    [property: JsonPropertyName("created_on")] DateTime CreatedOn,
    [property: JsonPropertyName("updated_on")] DateTime? UpdatedOn
);

public record IntermediaryDetailDto(
    long Id,
    [property: JsonPropertyName("intermediary_code")] string IntermediaryCode,
    string Status,
    [property: JsonPropertyName("status_toggle")] bool? StatusToggle,
    [property: JsonPropertyName("intermediary_name")] string IntermediaryName,
    [property: JsonPropertyName("doing_business_as")] string? DoingBusinessAs,
    [property: JsonPropertyName("legal_entity")] string LegalEntity,
    [property: JsonPropertyName("federal_tax_id")] string? FederalTaxId,
    [property: JsonPropertyName("type_of_intermediary")] string? TypeOfIntermediary,
    string? Country,
    [property: JsonPropertyName("residential_state")] string? ResidentialState,
    string? License,
    [property: JsonPropertyName("other_description")] string? OtherDescription,
    [property: JsonPropertyName("allow_full_producer_visibility")] bool? AllowFullProducerVisibility,
    [property: JsonPropertyName("last_step")] int? LastStep,
    [property: JsonPropertyName("commission_disburse_email")] string? CommissionDisburseEmail
);

public record SaveIntermediaryRequest(
    string? Status,
    [property: JsonPropertyName("status_toggle")] bool? StatusToggle,
    [property: JsonPropertyName("intermediary_name")] string? IntermediaryName,
    [property: JsonPropertyName("doing_business_as")] string? DoingBusinessAs,
    [property: JsonPropertyName("legal_entity")] string? LegalEntity,
    [property: JsonPropertyName("federal_tax_id")] string? FederalTaxId,
    [property: JsonPropertyName("type_of_intermediary")] string? TypeOfIntermediary,
    string? Country,
    [property: JsonPropertyName("residential_state")] string? ResidentialState,
    string? License,
    [property: JsonPropertyName("other_description")] string? OtherDescription,
    [property: JsonPropertyName("allow_full_producer_visibility")] bool? AllowFullProducerVisibility,
    [property: JsonPropertyName("commission_disburse_email")] string? CommissionDisburseEmail,
    [property: JsonPropertyName("last_step")] int? LastStep
);

public record ProducerListItemDto(
    long Id,
    [property: JsonPropertyName("intermediary_id")] long IntermediaryId,
    [property: JsonPropertyName("producer_code")] string ProducerCode,
    string Status,
    [property: JsonPropertyName("status_toggle")] bool? StatusToggle,
    [property: JsonPropertyName("first_name")] string FirstName,
    [property: JsonPropertyName("middle_name")] string? MiddleName,
    [property: JsonPropertyName("last_name")] string LastName,
    [property: JsonPropertyName("pc_licence_requirement")] string? PcLicenseRequirement,
    string? Country,
    [property: JsonPropertyName("residential_state")] string? ResidentialState,
    [property: JsonPropertyName("pl_license")] string? PlLicense,
    [property: JsonPropertyName("cl_license")] string? ClLicense,
    [property: JsonPropertyName("plcl_combined_license")] string? PlclCombinedLicense,
    [property: JsonPropertyName("telephone_number_cc")] string TelephoneNumberCC,
    [property: JsonPropertyName("telephone_number")] string TelephoneNumber,
    [property: JsonPropertyName("alt_telephone_number_cc")] string? AltTelephoneNumberCC,
    [property: JsonPropertyName("alt_telephone_number")] string? AltTelephoneNumber,
    string? Email,
    [property: JsonPropertyName("is_manager")] bool? IsManager,
    [property: JsonPropertyName("manager_id")] long? ManagerId,
    int? Extension,
    string? Suffix
);

public record SaveProducerRequest(
    [property: JsonPropertyName("intermediary_id")] long? IntermediaryId,
    // Also accepted for the wizard's pre-review payload (ReviewSubmitPage sends intermediary_id
    // consistently, but the standalone Add Producer modal in ViewIntermediaryPage sends
    // intermediary_db_id — accept both so neither caller 400s).
    [property: JsonPropertyName("intermediary_db_id")] long? IntermediaryDbId,
    string? Status,
    [property: JsonPropertyName("status_toggle")] bool? StatusToggle,
    [property: JsonPropertyName("first_name")] string? FirstName,
    [property: JsonPropertyName("middle_name")] string? MiddleName,
    [property: JsonPropertyName("last_name")] string? LastName,
    [property: JsonPropertyName("pc_licence_requirement")] string? PcLicenseRequirement,
    string? Country,
    [property: JsonPropertyName("residential_state")] string? ResidentialState,
    [property: JsonPropertyName("pl_license")] string? PlLicense,
    [property: JsonPropertyName("cl_license")] string? ClLicense,
    [property: JsonPropertyName("plcl_combined_license")] string? PlclCombinedLicense,
    [property: JsonPropertyName("telephone_number_cc")] string? TelephoneNumberCC,
    [property: JsonPropertyName("telephone_number")] string? TelephoneNumber,
    [property: JsonPropertyName("alt_telephone_number_cc")] string? AltTelephoneNumberCC,
    [property: JsonPropertyName("alt_telephone_number")] string? AltTelephoneNumber,
    string? Email,
    [property: JsonPropertyName("is_manager")] bool? IsManager,
    [property: JsonPropertyName("manager_id")] long? ManagerId,
    int? Extension,
    string? Suffix
);
