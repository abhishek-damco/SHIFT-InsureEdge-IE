// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// State tax/fee lookup used by the HBIS rating engine (surplus lines, stamping fee,
// fire premium tax). Only hb_rater_* table actually queried by the prototype server.js.
namespace InsureEdge.Domain.Entities;

public class HbRaterStateTaxSheet
{
    public long Id { get; set; }
    public string? State { get; set; }
    public decimal? SurplusLines { get; set; }
    public decimal? StampingFee { get; set; }
    public decimal? FirePremiumTax { get; set; }
    public string? Abbreviation { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
}
