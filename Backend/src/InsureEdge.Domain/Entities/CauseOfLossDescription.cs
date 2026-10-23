// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Deductible-reduction descriptions for a cause-of-loss entry.
namespace InsureEdge.Domain.Entities;

public class CauseOfLossDescription
{
    public long Id { get; set; }
    public long ClaimCoverageId { get; set; }
    public string? ReducingDeductibleDescription { get; set; }
    public bool? IsPercentile { get; set; }
    public decimal? MaxLimit { get; set; }
    public decimal? PercentileValue { get; set; }
    public decimal? ReducedDeductible { get; set; }
    public long CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
    public long? PercentileOfClaimCoverageId { get; set; }

    public ClaimCoverage? ClaimCoverage { get; set; }
}
