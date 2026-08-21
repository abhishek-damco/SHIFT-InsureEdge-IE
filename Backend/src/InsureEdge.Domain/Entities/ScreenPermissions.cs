// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// US-006/US-012: Group-level permission grants. 9 types, all enforced server-side (ADR-003).
// BR-008: effective user permissions = OR across all active groups the user belongs to.
// BR-011: stored at group level; no per-user records.
namespace InsureEdge.Domain.Entities;

public class ScreenPermissions
{
    public long Id { get; set; }
    public long GroupId { get; set; }
    public long ScreenId { get; set; }
    public long ClientId { get; set; }
    public bool IsViewPermission { get; set; }
    public bool IsCreatePermission { get; set; }
    public bool IsEditPermission { get; set; }
    public bool IsDuplicatePermission { get; set; }
    public bool IsUploadPermission { get; set; }
    public bool IsDownloadPermission { get; set; }
    public bool IsViewSensitiveInfo { get; set; }
    public bool IsAccessSensitiveDoc { get; set; }
    public bool IsApproveReject { get; set; }
    public Group? Group { get; set; }
    public AppScreen? Screen { get; set; }
}
