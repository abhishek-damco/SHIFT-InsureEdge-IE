// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// IERatingEngine: high-risk hex-zone catastrophe rates (Hurricane per 1000 / Tornado /
// Hail by H3 hex-zone id). No Wildfire column here by design — see HbRaterRatingWildfire
// (db/015_hb_rater_hr_hexzone.sql).
namespace InsureEdge.Domain.Entities;

public class HbRaterHrHexzone
{
    public long Id { get; set; }
    public string? HrHexzones { get; set; }
    public decimal? Hurricanerateper1000 { get; set; }
    public decimal? Tornado { get; set; }
    public decimal? Hail { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime? CreatedOn { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
}
