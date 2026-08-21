// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// IERatingEngine: low-risk hex-zone rates by H3 zone + state (Derecho per 1000, X-wind
// combined/all other perils, Earthquake, Sinkhole, Liability, Flash flood)
// (db/016_hb_rater_lr_hexzones.sql).
namespace InsureEdge.Domain.Entities;

public class HbRaterLrHexzones
{
    public long Id { get; set; }
    public string? LrHexzones { get; set; }
    public string? StateAbb { get; set; }
    public decimal? Derechorateper1000 { get; set; }
    public decimal? XwindCombinedrateAllotherpe { get; set; }
    public decimal? Earthquakerate { get; set; }
    public decimal? Sinkholerate { get; set; }
    public decimal? Liabilityrates { get; set; }
    public decimal? Flashfloodrates { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime? CreatedOn { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
}
