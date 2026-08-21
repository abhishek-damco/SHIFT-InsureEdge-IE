namespace InsureEdge.Domain.Entities;

public class ClaimTask
{
    public long Id { get; set; }
    public long ClaimId { get; set; }
    public long ClientId { get; set; }
    public string TaskCode { get; set; } = string.Empty;   // auto-generated, e.g. "TASK-0001"
    public string? TaskType { get; set; }                  // Claim Escalation | Risk Survey | etc.
    public string? TaskHeading { get; set; }
    public string? TaskDescription { get; set; }
    public string Status { get; set; } = "New";            // New | Open - In Progress | Open - On Hold | Open - Escalated | Closed | Re-Opened
    public string? TaskPriority { get; set; }              // Low | Medium | High
    public DateTimeOffset? TaskDueDate { get; set; }
    public DateTimeOffset? CompletionDate { get; set; }
    public DateTimeOffset? FollowUpDate { get; set; }
    public long? AssignedTo { get; set; }                  // FK → User.Id
    public string? Comments { get; set; }
    public long? CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; } = DateTimeOffset.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedOn { get; set; }

    public User? AssignedToUser { get; set; }
    public ICollection<ClaimTaskDocument> Documents { get; set; } = [];
    public ICollection<ClaimTaskAuditLog> AuditLogs { get; set; } = [];
}
