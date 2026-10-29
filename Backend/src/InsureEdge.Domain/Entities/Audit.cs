// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Generic audit log entry. Ported from OutSystems "Audits" entity. Backs the Policy
// Summary "Timeline" screen (SummaryBlock's GetAuditsByTransactions).
namespace InsureEdge.Domain.Entities;

public class Audit
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long? TransactionId { get; set; }
    public string? ActivityType { get; set; }
    public long? RecordId { get; set; }
    public string? ActivityDescription { get; set; }
    public string? Module { get; set; }
    public DateTime CreatedDateTime { get; set; } = DateTime.UtcNow;
    public long? CreatedBy { get; set; }
    public byte[]? AuditBin { get; set; }
    public string? TableName { get; set; }

    public PolicyTransaction? Transaction { get; set; }
}
