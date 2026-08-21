// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Distribution Management "Assigned Rights" tab (ViewIntermediaryPage.tsx RightsTab) —
// reuses the same PermissionsGrid component + PermissionInput shape (Frontend/src/types/User.ts)
// as User Management's "User Rights" (ViewUser/UserForm), so field names are camelCase
// (screenId, isViewPermission, ...) matching that existing contract, not the Distribution
// module's usual snake_case (Intermediary/Producer DTOs) — this tab is a different UI family.
// No global JSON naming policy is configured (confirmed against Program.cs), so camelCase
// needs explicit [JsonPropertyName] here just like the snake_case DTOs elsewhere use it.
using System.Text.Json.Serialization;

namespace InsureEdge.Application.DTOs.Distribution;

public record ModuleListItemDto(
    long Id,
    [property: JsonPropertyName("module_name")] string ModuleName
);

public record ScreenListItemDto(
    long Id,
    [property: JsonPropertyName("screen_code")] string? ScreenCode,
    [property: JsonPropertyName("screen_name")] string ScreenName,
    [property: JsonPropertyName("module_id")] long ModuleId,
    [property: JsonPropertyName("module_name")] string? ModuleName
);

public record IntermediaryScreenPermissionDto(
    [property: JsonPropertyName("screenId")] long ScreenId,
    [property: JsonPropertyName("isViewPermission")] bool IsViewPermission,
    [property: JsonPropertyName("isCreatePermission")] bool IsCreatePermission,
    [property: JsonPropertyName("isEditPermission")] bool IsEditPermission,
    [property: JsonPropertyName("isDuplicatePermission")] bool IsDuplicatePermission,
    [property: JsonPropertyName("isUploadPermission")] bool IsUploadPermission,
    [property: JsonPropertyName("isDownloadPermission")] bool IsDownloadPermission,
    [property: JsonPropertyName("isViewSensitiveInfo")] bool IsViewSensitiveInfo,
    [property: JsonPropertyName("isAccessSensitiveDoc")] bool IsAccessSensitiveDoc,
    [property: JsonPropertyName("isApproveReject")] bool IsApproveReject,
    [property: JsonPropertyName("allAccess")] bool AllAccess
);

public record SaveIntermediaryScreenPermissionRequest(
    [property: JsonPropertyName("screenId")] long ScreenId,
    [property: JsonPropertyName("isViewPermission")] bool IsViewPermission,
    [property: JsonPropertyName("isCreatePermission")] bool IsCreatePermission,
    [property: JsonPropertyName("isEditPermission")] bool IsEditPermission,
    [property: JsonPropertyName("isDuplicatePermission")] bool IsDuplicatePermission,
    [property: JsonPropertyName("isUploadPermission")] bool IsUploadPermission,
    [property: JsonPropertyName("isDownloadPermission")] bool IsDownloadPermission,
    [property: JsonPropertyName("isViewSensitiveInfo")] bool IsViewSensitiveInfo,
    [property: JsonPropertyName("isAccessSensitiveDoc")] bool IsAccessSensitiveDoc,
    [property: JsonPropertyName("isApproveReject")] bool IsApproveReject
);
