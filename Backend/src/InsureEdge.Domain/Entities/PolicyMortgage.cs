// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Mortgage / lienholder record attached to a policy.
namespace InsureEdge.Domain.Entities;

public class PolicyMortgage
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long PolicyId { get; set; }
    public string? MortgageName { get; set; }
    public string? LoanNumber { get; set; }
    public string? MortgageServiceCompany { get; set; }
    public string? TelephoneNumber { get; set; }
    public string? TelephoneNumberCC { get; set; }
    public string? Extension { get; set; }
    public string? AltTelephoneNumber { get; set; }
    public string? AltTelephoneNumberCC { get; set; }
    public string? EmailId { get; set; }
    public string? GoogleAddress { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? Country { get; set; }
    public string? State { get; set; }
    public string? City { get; set; }
    public string? ZipCode { get; set; }
    public string? Latitude { get; set; }
    public string? Longitude { get; set; }
    public string? County { get; set; }
    public bool? IsManual { get; set; }
    public string? LenderType { get; set; }
    public string? LoanType { get; set; }
    public string? CoveredAsset { get; set; }
    public bool? IsNewlyAdded { get; set; }
    public bool? IsEdited { get; set; }
    public bool? IsDeleted { get; set; }
    public int? RecordNumber { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public Policy? Policy { get; set; }
}
