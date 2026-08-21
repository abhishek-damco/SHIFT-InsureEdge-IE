// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
namespace InsureEdge.Application.DTOs.Client;

// ── List / landing ─────────────────────────────────────────────────────────────
public record ClientListItemDto(
    long Id,
    string ClientCode,
    string CompanyName,
    string Status,
    string TypeOfCompany,
    string? NaicCode,
    string? EmailId,
    string? TelephoneNumber,
    string? DomicileCountry,
    string? StateOfDomicile,
    string CreatedOn
);

// ── Address ────────────────────────────────────────────────────────────────────
public record AddressDto(
    long? Id,
    string AddressType,
    string? AddressLine1,
    string? AddressLine2,
    string? Country,
    string? State,
    string? City,
    string? County,
    string? ZipCode,
    string? Latitude,
    string? Longitude,
    bool IsManual
);

// ── Contact ────────────────────────────────────────────────────────────────────
public record ContactDto(
    long? Id,
    string ContactType,
    string? Name,
    string? Suffix,
    string? Title,
    string? EmailId,
    string? TelephoneNumber,
    string? TelephoneNumberCc,
    int? Extension,
    string? AltTelephoneNumber,
    string? AltTelephoneNumberCc
);

// ── Office ─────────────────────────────────────────────────────────────────────
public record OfficeDto(
    long? Id,
    string OfficeName,
    string? OfficeType,
    string? AddressLine1,
    string? AddressLine2,
    string? Country,
    string? State,
    string? City,
    string? County,
    string? ZipCode,
    string? Latitude,
    string? Longitude,
    string? ContactName,
    string? ContactSuffix,
    string? ContactTitle,
    string? ContactEmail,
    string? ContactPhone,
    string? ContactPhoneCc,
    int? ContactExt,
    string? ContactAltPhone,
    string? ContactAltPhoneCc
);

// ── Company (subsidiary) ───────────────────────────────────────────────────────
public record CompanyDto(
    long Id,
    string CompanyCode,
    string CompanyName,
    string Status,
    string? DomicileCountry,
    string? StateOfDomicile,
    string? NaicCode,
    string? EmailId,
    string? TelephoneNumber,
    string? TelephoneNumberCc,
    int? Extension,
    string? FederalTaxId,
    string? Url,
    string? BusinessDescription,
    string? LogoBase64,
    string? LogoContentType,
    AddressDto? LegalAddress,
    AddressDto? MailingAddress,
    ContactDto? PrimaryContact,
    string CreatedOn,
    string? UpdatedOn
);

// ── Product/LOB ────────────────────────────────────────────────────────────────
public record ProductDto(long Id, string ProductName, string Category);
public record SubProductDto(long Id, string SubProductName, bool IsSelected);

public record ProductAccessDto(
    long ProductId,
    string ProductName,
    string Category,
    int SelectedSubProductCount,
    int JurisdictionCount,
    List<SubProductDto> SubProducts,
    List<JurisdictionDto> Jurisdictions
);

public record JurisdictionDto(string StateCode, string StateName);

// ── Full client detail ─────────────────────────────────────────────────────────
public record ClientDetailDto(
    long Id,
    string ClientCode,
    string CompanyName,
    string Status,
    string? TypeOfCompany,
    string? NaicCode,
    string? RegisteredTradeMark,
    string? DomicileCountry,
    string? StateOfDomicile,
    string? StateAllowedToOperate,
    string? FederalTaxId,
    string? OwnedBy,
    string? NumberOfEmployees,
    string? EstDirectWrittenPremium,
    string? YearBusinessStarted,
    string? BusinessDescription,
    string? EmailId,
    string? TelephoneNumber,
    string? TelephoneNumberCc,
    int? Extension,
    string? ClientUrl,
    string? ClientOnboardingDate,
    string? ClientRegistrationDate,
    string? LogoBase64,
    string? LogoContentType,
    AddressDto? LegalAddress,
    AddressDto? MailingAddress,
    ContactDto? PrimaryContact,
    List<OfficeDto> Offices,
    List<CompanyDto> Companies,
    string CreatedOn,
    string? UpdatedOn
);

// ── Save requests ──────────────────────────────────────────────────────────────
public record SaveClientInfoRequest(
    string CompanyName,
    string? TypeOfCompany,
    string? NaicCode,
    string? RegisteredTradeMark,
    string? DomicileCountry,
    string? StateOfDomicile,
    string? StateAllowedToOperate,
    string? FederalTaxId,
    string? OwnedBy,
    string? NumberOfEmployees,
    string? EstDirectWrittenPremium,
    string? YearBusinessStarted,
    string? BusinessDescription,
    string? EmailId,
    string? TelephoneNumber,
    string? TelephoneNumberCc,
    int? Extension,
    string? ClientUrl,
    string? ClientOnboardingDate,
    string? Status,
    string? LogoBase64,
    string? LogoContentType,
    string? LogoFileName
);

public record SaveAddressRequest(
    string AddressType,
    string? AddressLine1,
    string? AddressLine2,
    string? Country,
    string? State,
    string? City,
    string? County,
    string? ZipCode,
    string? Latitude,
    string? Longitude,
    bool IsManual
);

public record SaveContactRequest(
    string? Name,
    string? Suffix,
    string? Title,
    string? EmailId,
    string? TelephoneNumber,
    string? TelephoneNumberCc,
    int? Extension,
    string? AltTelephoneNumber,
    string? AltTelephoneNumberCc
);

public record SaveOfficeRequest(
    long? Id,
    string OfficeName,
    string? OfficeType,
    string? AddressLine1,
    string? AddressLine2,
    string? Country,
    string? State,
    string? City,
    string? County,
    string? ZipCode,
    string? Latitude,
    string? Longitude,
    string? ContactName,
    string? ContactSuffix,
    string? ContactTitle,
    string? ContactEmail,
    string? ContactPhone,
    string? ContactPhoneCc,
    int? ContactExt,
    string? ContactAltPhone,
    string? ContactAltPhoneCc
);

public record SaveCompanyRequest(
    long? Id,
    string CompanyName,
    string? DomicileCountry,
    string? StateOfDomicile,
    string? NaicCode,
    string? EmailId,
    string? TelephoneNumber,
    string? TelephoneNumberCc,
    int? Extension,
    string? FederalTaxId,
    string? Url,
    string? BusinessDescription,
    string? Status,
    string? LogoBase64,
    string? LogoContentType,
    string? LogoFileName,
    SaveAddressRequest? LegalAddress,
    SaveAddressRequest? MailingAddress,
    SaveContactRequest? PrimaryContact
);

public record SaveProductAccessRequest(
    long ProductId,
    List<long> SubProductIds,
    List<JurisdictionDto> Jurisdictions
);
