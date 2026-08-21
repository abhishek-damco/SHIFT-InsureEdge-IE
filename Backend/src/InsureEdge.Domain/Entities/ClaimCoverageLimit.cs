// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Coverage limits per coverage/COL entry — defines asset types, claim codes, and plan-tier limits.
namespace InsureEdge.Domain.Entities;

public class ClaimCoverageLimit
{
    public long Id { get; set; }
    public long? ClaimCoverageId { get; set; }
    public string? AssetType { get; set; }
    public string? BasicClaimCode { get; set; }
    public string? BasicLimit { get; set; }
    public string? BasicAggregateLimit { get; set; }
    public string? BasicDeductible { get; set; }
    public string? StandardClaimCode { get; set; }
    public string? StandardLimit { get; set; }
    public string? StandardAggregateLimit { get; set; }
    public string? StandardDeductible { get; set; }
    public string? PreferredClaimCode { get; set; }
    public string? PreferredLimit { get; set; }
    public string? PreferredAggregateLimit { get; set; }
    public string? PreferredDeductible { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public long CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
    public bool? BasicIsPercentile { get; set; }
    public decimal? BasicMaxLimit { get; set; }
    public decimal? BasicPercentileValue { get; set; }
    public bool? StandardPercentile { get; set; }
    public decimal? StandardMaxLimit { get; set; }
    public decimal? StandardPercentileValue { get; set; }
    public bool? PreferredIsPercentile { get; set; }
    public decimal? PreferredMaxLimit { get; set; }
    public decimal? PreferredPercentileValue { get; set; }
    public long? BasicPercentileOfClaimCoverageId { get; set; }
    public long? StandardPercentileOfClaimCoverageId { get; set; }
    public long? PreferredPercentileOfClaimCoverageId { get; set; }

    public ClaimCoverage? ClaimCoverage { get; set; }
}
