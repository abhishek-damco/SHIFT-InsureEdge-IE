namespace InsureEdge.Domain.Entities;

public class ClaimTaskAuditLog
{
    public long Id { get; set; }
    public long ClaimTaskId { get; set; }
    public long ClaimId { get; set; }
    public long ClientId { get; set; }
    public string? ActivityType { get; set; }
    public string? Description { get; set; }
    public long? UserId { get; set; }
    public DateTimeOffset CreatedOn { get; set; } = DateTimeOffset.UtcNow;

    public ClaimTask? ClaimTask { get; set; }
    public User? User { get; set; }
}
