// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// US-001–US-009: Core group entity. No MemberCount column (BUG-001 corrective, BR-007).
using InsureEdge.Domain.Enums;

namespace InsureEdge.Domain.Entities;

public class Group
{
    public long Id { get; set; }
    public string GroupCode { get; private set; } = string.Empty;   // BR-001: auto-generated, read-only
    public string GroupName { get; private set; } = string.Empty;   // VR-001: required, max 200
    public string? GroupEmailId { get; private set; }               // VR-003: optional, email format
    public long GroupLeader { get; private set; }                   // VR-002: required FK → User
    public string? GroupDesc { get; private set; }                  // VR-004: optional, max 500
    public GroupStatus Status { get; private set; }
    public bool IsDepartment { get; private set; }                  // BR-006: dept flag
    public long ClientId { get; private set; }                      // ADR-010: tenant — from session, never from input
    public long CreatedBy { get; private set; }
    public DateTime CreatedOn { get; private set; }
    public long? UpdatedBy { get; private set; }
    public DateTime? UpdatedOn { get; private set; }

    public Client? Client { get; private set; }
    public ICollection<GroupUser> GroupUsers { get; private set; } = new List<GroupUser>();
    public ICollection<ScreenPermissions> GroupPermissions { get; private set; } = new List<ScreenPermissions>();

    private Group() { }

    public static Group Create(
        string groupCode, string groupName, string? groupEmailId,
        long groupLeader, string? groupDesc, bool isDepartment,
        long clientId, long createdBy)
    {
        return new Group
        {
            GroupCode = groupCode,
            GroupName = groupName,
            GroupEmailId = groupEmailId,
            GroupLeader = groupLeader,
            GroupDesc = groupDesc,
            Status = GroupStatus.Active,
            IsDepartment = isDepartment,
            ClientId = clientId,
            CreatedBy = createdBy,
            CreatedOn = DateTime.UtcNow
        };
    }

    public void UpdateInfo(
        string groupName, string? groupEmailId,
        long groupLeader, string? groupDesc,
        GroupStatus status, long updatedBy)
    {
        GroupName = groupName;
        GroupEmailId = groupEmailId;
        GroupLeader = groupLeader;
        GroupDesc = groupDesc;
        Status = status;
        UpdatedBy = updatedBy;
        UpdatedOn = DateTime.UtcNow;
    }
}
