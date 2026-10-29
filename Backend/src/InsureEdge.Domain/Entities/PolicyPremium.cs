// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Premium / billing plan detail — one row per policy (unique policy_id).
namespace InsureEdge.Domain.Entities;

public class PolicyPremium
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long PolicyId { get; set; }
    public string PaymentFrequency { get; set; } = "MONTHLY";
    public string ResponsibleParty { get; set; } = "";
    public int NumberOfInstallments { get; set; } = 12;
    public decimal TotalInstallmentFee { get; set; }
    public decimal? StampingFee { get; set; }
    public decimal PolicyFees { get; set; }
    public bool IsPolicyFullyPaid { get; set; }
    public bool? IsPaymentRequiredToBind { get; set; }
    public DateOnly? FirstPaymentDate { get; set; }
    public decimal? TotalTax { get; set; }
    public decimal TotalPremiumWithoutInstallmentFee { get; set; }
    public decimal TotalPremiumWithInstallmentFee { get; set; }
    public string? ModeOfPaymentToUse { get; set; }
    public bool? IsCancelled { get; set; }
    public DateOnly? CancelledOn { get; set; }
    public decimal? TotalCoveragePremium { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public Policy? Policy { get; set; }
    public ICollection<PolicyPaymentTransaction> Transactions { get; set; } = new List<PolicyPaymentTransaction>();
}
