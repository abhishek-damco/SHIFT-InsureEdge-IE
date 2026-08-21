// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
using InsureEdge.Application.DTOs.Group;
using InsureEdge.Domain.Entities;

namespace InsureEdge.Application.Interfaces;

public interface IGroupRepository
{
    Task<(List<GroupListDto> Items, int Total, int ActiveCount, int InactiveCount)> GetGroupListAsync(
        long clientId, string? search, string? statusFilter,
        string? sortBy, string sortOrder, int page, int pageSize);

    Task<GroupDetailDto?> GetGroupByIdAsync(long id, long clientId);

    Task<int> GetNextGroupSequenceAsync(long clientId);

    Task<Group> CreateAsync(Group group, List<long> memberIds, List<ScreenPermissionSaveDto> permissions);

    Task UpdateInfoAsync(long id, UpdateGroupInfoRequest req, long clientId, long updatedBy);

    // BR-005/ADR-004: Full-replace sync. Privilege revocation is synchronous — deleting
    // GroupUser rows immediately removes them from permission resolution queries.
    Task SyncMembersAsync(long groupId, List<long> memberIds, long clientId);

    Task SavePermissionsAsync(long groupId, List<ScreenPermissionSaveDto> permissions, long clientId);

    Task<byte[]> ExportAsync(long clientId, string format, string? search, string? statusFilter, List<long>? selectedIds);

    Task<bool> ExistsAsync(long id, long clientId);
}
