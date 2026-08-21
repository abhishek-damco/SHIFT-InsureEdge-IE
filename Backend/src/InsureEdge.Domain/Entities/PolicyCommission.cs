// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Commission terms for a policy, tied to the writing intermediary/producer.
namespace InsureEdge.Domain.Entities;

public class PolicyCommission
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long PolicyId { get; set; }
    public long IntermediaryId { get; set; }
    public long? ProducerId { get; set; }
    public decimal? CommissionPercentage { get; set; }
    public decimal? InstallmentCommission { get; set; }
    public decimal? AnnualCommission { get; set; }
    public decimal? TotalCoveragePremium { get; set; }
    public bool? IsCancelled { get; set; }
    public DateOnly? CancelledOn { get; set; }
    public string PaymentFrequency { get; set; } = "MONTHLY";
    public int NumberOfInstallments { get; set; } = 12;

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public Policy? Policy { get; set; }
    public Intermediary? Intermediary { get; set; }
    public Producer? Producer { get; set; }
    public ICollection<CommissionPaymentTransaction> Transactions { get; set; } = new List<CommissionPaymentTransaction>();
}
