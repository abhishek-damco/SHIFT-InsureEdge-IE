// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Risk/property characteristics (construction, roof, flood zone, etc.) tied to a risk_address.
namespace InsureEdge.Domain.Entities;

public class PolicyRiskInformation
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long PolicyId { get; set; }
    public long? RiskAddressId { get; set; }
    public string? BuildingFloodElevation { get; set; }
    public string? BuildingType { get; set; }
    public string? BuildingDecription { get; set; }
    public string? HexZoneLowerResolution { get; set; }
    public string? HexZoneHigerResolution { get; set; }
    public string? FloodZone { get; set; }
    public string? ConstructionType { get; set; }
    public string? NumberOfStories { get; set; }
    public string? SquareFootage { get; set; }
    public int? RoofYear { get; set; }
    public string? RoofShape { get; set; }
    public string? RoofCovering { get; set; }
    public string? PresenceOfBasement { get; set; }
    public string? Status { get; set; }
    public DateTime? StatusTimeStamp { get; set; }
    public int? ApprovalCounter { get; set; }
    public DateOnly? ApprovalExpirationDate { get; set; }
    public string? WritingCompany { get; set; }
    public int? YearBuilt { get; set; }
    public int NotApprovedCounter { get; set; }
    public string? ResidenceType { get; set; }
    public int? RoofAge { get; set; }
    public string? RoofArchitectureType { get; set; }
    public string? FoundationType { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public Policy? Policy { get; set; }
    public RiskAddress? RiskAddress { get; set; }
}
