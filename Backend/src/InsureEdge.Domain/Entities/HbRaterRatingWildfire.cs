// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// IERatingEngine: per-state wildfire modification factor (K8), read by
// WildfireModificationValue(StateAbb) (db/017_hb_rater_rating_wildfire.sql).
namespace InsureEdge.Domain.Entities;

public class HbRaterRatingWildfire
{
    public long Id { get; set; }
    public string? State { get; set; }
    public decimal? K8 { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime? CreatedOn { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
}
