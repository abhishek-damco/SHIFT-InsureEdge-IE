// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Per-claim coverage selection row (FNOL Step 3 grid). Stores adjuster's coverage/COL/asset selections
// by FK reference to the master claim_coverage catalog.
namespace InsureEdge.Domain.Entities;

public class ClaimImpactedCoverage
{
    public long Id { get; set; }
    public long ClaimId { get; set; }
    public long? CoverageId { get; set; }        // FK → claim_coverage (coverage rows)
    public long? CauseOfLossId { get; set; }     // FK → claim_coverage (COL rows)
    public string? AssetType { get; set; }        // from claim_coverage_limit.asset_type
    public long ClientId { get; set; }

    public Claim? Claim { get; set; }
    public ClaimCoverage? Coverage { get; set; }
    public ClaimCoverage? CauseOfLoss { get; set; }
}
