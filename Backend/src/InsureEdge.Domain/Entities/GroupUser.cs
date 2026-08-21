// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// US-005/US-011: Membership record. NOT NULL on GroupId+UserId (corrective — source had nullable FKs).
// Deleting this record is how privilege revocation works (ADR-004, BR-014).
namespace InsureEdge.Domain.Entities;

public class GroupUser
{
    public long GroupId { get; set; }
    public long UserId { get; set; }
    public long ClientId { get; set; }
    public Group? Group { get; set; }
    public User? User { get; set; }
}
