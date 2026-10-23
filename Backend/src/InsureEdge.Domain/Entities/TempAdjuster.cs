namespace InsureEdge.Domain.Entities;

public class TempAdjuster
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public string UserCode { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? DateOfBirth { get; set; }
    public string? Ssn { get; set; }
    public string? TaxId { get; set; }
    public string? Role { get; set; }
    public string? AdjusterType { get; set; }
    public string? Status { get; set; }
    public string? ClaimTypesHandled { get; set; }
    public string? TerritoryType { get; set; }
    public string? TerritoriesAssigned { get; set; }
    public string? PreferredCommunication { get; set; }
    public string? TelephoneNumber { get; set; }
    public string? Extension { get; set; }
    public string? AlternativeTelephoneNumber { get; set; }
    public string? EmailId { get; set; }
    public string? RegisteredAddressLine1 { get; set; }
    public string? RegisteredAddressLine2 { get; set; }
    public string? RegisteredCountry { get; set; }
    public string? RegisteredState { get; set; }
    public string? RegisteredCity { get; set; }
    public string? RegisteredCounty { get; set; }
    public string? RegisteredZipCode { get; set; }
    public string? RegisteredLatitude { get; set; }
    public string? RegisteredLongitude { get; set; }
    public string? MailingAddressLine1 { get; set; }
    public string? MailingAddressLine2 { get; set; }
    public string? MailingCountry { get; set; }
    public string? MailingState { get; set; }
    public string? MailingCity { get; set; }
    public string? MailingCounty { get; set; }
    public string? MailingZipCode { get; set; }
    public string? MailingLatitude { get; set; }
    public string? MailingLongitude { get; set; }
    public string? PaymentMethod { get; set; }
    public string? RatePerHour { get; set; }
    public string? ComplianceFlag { get; set; }
    public string? AccessJson { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
    public List<TempAdjusterLicense> Licenses { get; set; } = new();
}
