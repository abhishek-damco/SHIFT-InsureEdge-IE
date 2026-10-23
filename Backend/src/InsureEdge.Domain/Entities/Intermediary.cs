// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Distribution: intermediary (brokerage/agency). Ported from prototype schema.sql "intermediary".
namespace InsureEdge.Domain.Entities;

public class Intermediary
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public string IntermediaryCode { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public string IntermediaryName { get; set; } = string.Empty;
    public string? DoingBusinessAs { get; set; }
    public string LegalEntity { get; set; } = "LLC";
    public string? FederalTaxId { get; set; }
    public string? TypeOfIntermediary { get; set; }
    public string? Country { get; set; }
    public string? ResidentialState { get; set; }
    public string? License { get; set; }
    public string? OtherDescription { get; set; }
    public bool? AllowFullProducerVisibility { get; set; }
    public int? LastStep { get; set; }
    public string? CommissionDisburseEmail { get; set; }
    public bool? StatusToggle { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public ICollection<Producer> Producers { get; set; } = new List<Producer>();
}
