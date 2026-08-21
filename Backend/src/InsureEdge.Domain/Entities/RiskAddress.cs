// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Risk location address for a policy (HO rater property detail).
namespace InsureEdge.Domain.Entities;

public class RiskAddress
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long PolicyId { get; set; }
    public string? AddressType { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? Country { get; set; }
    public string? State { get; set; }
    public string? City { get; set; }
    public string? ZipCode { get; set; }
    public string? Latitude { get; set; }
    public string? Longitude { get; set; }
    public string? County { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsManual { get; set; }
    public string? GoogleAddress { get; set; }
    public int? LocationNumber { get; set; }
    public bool? IsAddedFromAccount { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public Policy? Policy { get; set; }
    public ICollection<PolicyRiskInformation> RiskInformation { get; set; } = new List<PolicyRiskInformation>();
}
