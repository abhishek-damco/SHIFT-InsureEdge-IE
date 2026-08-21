// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// ClaimCoverage — master catalog of coverage types and cause-of-loss entries.
// Refactored from per-claim transaction row to shared reference entity (see 022_claim_coverage_master.sql).
// Rows with Coverage != null = coverage options; rows with CauseOfLoss != null = cause-of-loss options.
namespace InsureEdge.Domain.Entities;

public class ClaimCoverage
{
    public long Id { get; set; }
    public long? ClientId { get; set; }
    public string? Coverage { get; set; }
    public string? CauseOfLoss { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
    public string? CoverageLimit { get; set; }
    public bool? IsHoPhyscialDamage { get; set; }   // typo preserved from original OutSystems entity
    public bool? IsHoPersonalLiability { get; set; }

    public ICollection<ClaimCoverageLimit> CoverageLimits { get; set; } = new List<ClaimCoverageLimit>();
}

// Kept for DB compatibility; orphaned per user decision — see 022_claim_coverage_master.sql
public class ClaimCoverageAsset
{
    public long Id { get; set; }
    public long ClaimCoverageId { get; set; }
    public string AssetName { get; set; } = string.Empty;
}
