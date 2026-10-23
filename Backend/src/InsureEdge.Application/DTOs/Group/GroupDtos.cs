// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
namespace InsureEdge.Application.DTOs.Group;

// US-001: Landing page grid row
public record GroupListDto(
    long Id,
    string GroupCode,
    string GroupName,
    string? GroupEmailId,
    string? GroupLeaderName,
    int MemberCount,        // BR-007: always computed live — never from a stored column
    string CreatedByName,
    DateTime CreatedOn,
    string? GroupDesc,
    string Status           // BR-003: title case "Active"/"Inactive"
);

// US-001: Stat cards + pagination envelope
public record GroupListResponse(
    List<GroupListDto> Items,
    int Total,
    int ActiveCount,
    int InactiveCount
);

// US-003: Full group detail (all three panels)
public record GroupDetailDto(
    long Id,
    string GroupCode,
    string GroupName,
    string? GroupEmailId,
    long? GroupLeader,
    string? GroupLeaderName,
    string? GroupDesc,
    string Status,
    bool IsDepartment,
    DateTime CreatedOn,
    string CreatedByName,
    List<MemberDto> Members,        // BR-015: all members regardless of profile image
    List<ScreenPermissionDto> Permissions
);

// US-003/US-010: Member display
public record MemberDto(
    long UserId,
    string FullName,
    string Email,
    string Initials         // first char FirstName + first char LastName, uppercase
);

// US-003/US-012: Permission row display
public record ScreenPermissionDto(
    long ScreenId,
    string ScreenCode,
    string ScreenName,
    long ModuleId,
    string ModuleName,
    bool IsViewPermission,
    bool IsCreatePermission,
    bool IsEditPermission,
    bool IsDuplicatePermission,
    bool IsUploadPermission,
    bool IsDownloadPermission,
    bool IsViewSensitiveInfo,
    bool IsAccessSensitiveDoc,
    bool IsApproveReject
);

// US-002/US-006/US-012: Permission save payload
public record ScreenPermissionSaveDto(
    long ScreenId,
    bool IsViewPermission,
    bool IsCreatePermission,
    bool IsEditPermission,
    bool IsDuplicatePermission,
    bool IsUploadPermission,
    bool IsDownloadPermission,
    bool IsViewSensitiveInfo,
    bool IsAccessSensitiveDoc,
    bool IsApproveReject
);

// US-002: Group creation request
public record CreateGroupRequest(
    string GroupName,           // VR-001: required, max 200
    long GroupLeader,           // VR-002: required
    string? GroupEmailId,       // VR-003: optional, email format
    string? GroupDesc,          // VR-004: optional, max 500
    bool IsDepartment,
    bool IsInactive,
    List<long> MemberIds,
    List<ScreenPermissionSaveDto> Permissions
);

// US-004/US-007: Group info update
public record UpdateGroupInfoRequest(
    string GroupName,
    long GroupLeader,
    string? GroupEmailId,
    string? GroupDesc,
    string Status               // "Active" or "Inactive"
);

// US-005/US-011: Member sync (full-replace — BR-005)
public record SyncMembersRequest(List<long> MemberIds);

// US-006/US-012: Permission save
public record SavePermissionsRequest(List<ScreenPermissionSaveDto> Permissions);
