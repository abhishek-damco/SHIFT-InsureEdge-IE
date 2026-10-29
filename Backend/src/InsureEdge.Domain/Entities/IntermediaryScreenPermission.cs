// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Distribution Management "Assigned Rights": screen-level grant for an Intermediary's
// producers. Same 9 boolean flags as ScreenPermissions (Group-level), independent table.
namespace InsureEdge.Domain.Entities;

public class IntermediaryScreenPermission
{
    public long Id { get; set; }
    public long IntermediaryId { get; set; }
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

    public Intermediary? Intermediary { get; set; }
    public AppScreen? Screen { get; set; }
}
