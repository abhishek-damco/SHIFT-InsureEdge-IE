// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Policy transaction log — backs the Policy History / Timeline sections of the
// Policy Summary screen. Ported from OutSystems "PolicyTransactions" entity (module IE_Policy_CS).
namespace InsureEdge.Domain.Entities;

public class PolicyTransaction
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public DateOnly? EffectiveDate { get; set; }
    public DateOnly? ExpirationDate { get; set; }
    public string? TransactionType { get; set; }
    public DateOnly? TransactionEffectiveDate { get; set; }
    public string? Status { get; set; }
    public long MainPolicyId { get; set; }
    public long? RedirectionPolicyId { get; set; }
    public bool IsShowInTimeline { get; set; } = true;
    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public Policy? MainPolicy { get; set; }
    public Policy? RedirectionPolicy { get; set; }
    public PolicyTransactionType? TransactionTypeRef { get; set; }
}
