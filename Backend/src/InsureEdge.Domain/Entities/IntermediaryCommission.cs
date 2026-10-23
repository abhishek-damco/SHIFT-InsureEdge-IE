namespace InsureEdge.Domain.Entities;

// Default commission terms for an intermediary's product and state combination.
public class IntermediaryCommission
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long IntermediaryId { get; set; }
    public long CompanyId { get; set; }
    public long ProductId { get; set; }
    public long SubProductId { get; set; }
    public string InsuranceType { get; set; } = string.Empty;
    public string JuridictionState { get; set; } = string.Empty;
    public DateOnly EffectiveDate { get; set; }
    public decimal NewBusinessCommission { get; set; }
    public decimal RenewalCommission { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public Intermediary? Intermediary { get; set; }
    public InsuranceProduct? Product { get; set; }
    public InsuranceSubProduct? SubProduct { get; set; }
}
