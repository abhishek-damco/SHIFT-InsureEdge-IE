// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Refund/cancellation transaction for a policy — one-to-many per policy (not tied to a
// specific installment). Ported from OutSystems CancellationPaymentTransaction entity.
// Populated by the cancellation workflow (out of scope here); this app only reads it.
// Backs the Billing screen's Premium Breakdown Earned/Unearned columns.
namespace InsureEdge.Domain.Entities;

public class CancellationPaymentTransaction
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long PolicyId { get; set; }
    public decimal? RefundAmount { get; set; }
    public DateOnly? TransactionPaymentDate { get; set; }
    public string? TransactionStatus { get; set; }
    public string? TransactionId { get; set; }
    public string? PaymentMethod { get; set; }
    public string? ResponseCode { get; set; }
    public string? ResponseJson { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public decimal CoveragePremium { get; set; }
    public decimal SurplusLinesTax { get; set; }
    public decimal FirePremiumTax { get; set; }
    public decimal StampingFee { get; set; }
    public decimal PolicyFee { get; set; }

    public Policy? Policy { get; set; }
}
