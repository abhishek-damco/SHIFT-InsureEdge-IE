// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// IERatingEngine OutDoc §3.3: excess flood coverage P-values by type / building /
// flood zone / base flood elevation (db/014_hb_rater_excess_flood_coverage.sql).
namespace InsureEdge.Domain.Entities;

public class HbRaterExcessFloodCoverage
{
    public long Id { get; set; }
    public string? Type { get; set; }
    public string? TypeOfBuilding { get; set; }
    public string? BuildingDescription { get; set; }
    public int? BaseFloodElevation { get; set; }
    public string? FloodZone { get; set; }
    public decimal? PValue { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
}
