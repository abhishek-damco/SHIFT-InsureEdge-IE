// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Read-only in FNOL Step 2 — sourced from policy admin.
namespace InsureEdge.Domain.Entities;

public class RiskLocation
{
    public long Id { get; set; }
    public long PolicyId { get; set; }
    public string? PropertyLocation { get; set; }
    public string? Latitude { get; set; }
    public string? Longitude { get; set; }
    public string? OccupancyType { get; set; }
    public string? ConstructionType { get; set; }
    public string? AgeOfProperty { get; set; }
    public string? LengthOfOccupancy { get; set; }
    public string? RoofType { get; set; }
    public string? FireProtectionClass { get; set; }
    public long ClientId { get; set; }

    public Policy? Policy { get; set; }
}
