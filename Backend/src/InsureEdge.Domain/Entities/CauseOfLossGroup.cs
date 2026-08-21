// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// AND/OR grouping of cause-of-loss deductible reduction rules.
namespace InsureEdge.Domain.Entities;

public class CauseOfLossGroup
{
    public long Id { get; set; }
    public long ClaimCoverageId { get; set; }
    public string? GroupType { get; set; }    // 'AND' | 'OR'
    public bool? IsPercentile { get; set; }
    public decimal? PercentileValue { get; set; }
    public decimal? MaxLimit { get; set; }
    public decimal? ReducedGroupDeductibles { get; set; }
    public long CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
    public long? PercentileOfClaimCoverageId { get; set; }

    public ClaimCoverage? ClaimCoverage { get; set; }
    public ICollection<CauseOfLossGroupDescription> GroupDescriptions { get; set; } = new List<CauseOfLossGroupDescription>();
}

public class CauseOfLossGroupDescription
{
    public long Id { get; set; }
    public long? CauseOfLossGroupId { get; set; }
    public long? CauseOfLossDescriptionId { get; set; }

    public CauseOfLossGroup? CauseOfLossGroup { get; set; }
    public CauseOfLossDescription? CauseOfLossDescription { get; set; }
}
