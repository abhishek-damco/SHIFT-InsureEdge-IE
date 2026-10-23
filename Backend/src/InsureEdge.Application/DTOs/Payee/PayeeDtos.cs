namespace InsureEdge.Application.DTOs.Payee;

public record PayeeListItemDto(
    long   Id,
    string Initials,
    string AvatarColor,
    string PayeeName,
    string PayeeType,
    string ClaimId,
    string PolicyId,
    string PaymentMethod,
    string ComplianceCheck,
    string DateOfLoss,
    string LossType,
    string Amount,
    string Status
);

// Status-based KPI (what the Payee screen KPI cards show)
public record PayeeStatusKpiDto(int Total, int Draft, int Pending, int Approved, int Rejected);

public record CreatePayeeRequest(
    long?   ClaimId,
    string? ClaimPayeeType,
    string? FirstName,
    string? MiddleName,
    string? LastName,
    string? BusinessName,
    string? NationalId,
    string? SocialSecurityNumber,
    string? TinId,
    string? PayeeType,
    string? Relationship,
    string? TelephoneNumberCC,
    string? TelephoneNumber,
    string? Email,
    CreateBankDetailRequest? BankDetail,
    CreateAddressRequest?    Address
);

public record CreateAddressRequest(
    string? GoogleAddress,
    bool    IsManual,
    string? AddressLine1,
    string? AddressLine2,
    string? Country,
    string? State,
    string? City,
    string? County,
    string? ZipCode,
    string? Latitude,
    string? Longitude
);

public record CreateBankDetailRequest(
    string? PaymentMethod,
    string? BankName,
    string? AccountHolderName,
    string? AccountNumber,
    string? AccountType,
    string? AbaRoutingNumber,
    string? BusinessName,
    string? FederalTaxClassification,
    string? EmployerIdentificationNumber,
    string? Type1099,
    bool    W9FormOnFile
);
