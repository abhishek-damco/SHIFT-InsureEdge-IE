// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Commission disbursement transaction rows under a policy_commission record.
namespace InsureEdge.Domain.Entities;

public class CommissionPaymentTransaction
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long PolicyCommissionId { get; set; }
    public decimal CommissionAmountDue { get; set; }
    public DateOnly InvoiceDate { get; set; }
    public DateOnly DueDate { get; set; }
    public DateOnly? TransactionPaymentDate { get; set; }
    public bool? IsPaid { get; set; }
    public string? TransactionStatus { get; set; }
    public string? TransactionId { get; set; }
    public string? CustomerReferenceId { get; set; }
    public string? PaymentMethod { get; set; }
    public string? ResponseCode { get; set; }
    public string? ResponseJson { get; set; }
    public DateOnly? CancelledOn { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public PolicyCommission? PolicyCommission { get; set; }
}
