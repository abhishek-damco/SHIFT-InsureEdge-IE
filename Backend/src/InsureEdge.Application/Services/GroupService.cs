// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Implements US-001 through US-014 business logic.
using InsureEdge.Application.DTOs.Group;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Domain.Enums;

namespace InsureEdge.Application.Services;

public class GroupService
{
    private readonly IGroupRepository _repo;
    private readonly ICurrentTenantService _tenant;

    public GroupService(IGroupRepository repo, ICurrentTenantService tenant)
    {
        _repo = repo;
        _tenant = tenant;
    }

    // US-001: Paginated group list with live member counts (BR-007)
    public Task<(List<GroupListDto> Items, int Total, int ActiveCount, int InactiveCount)> GetGroupListAsync(
        string? search, string? statusFilter, string? sortBy, string sortOrder, int page, int pageSize)
        => _repo.GetGroupListAsync(_tenant.ClientId, search, statusFilter, sortBy, sortOrder, page, pageSize);

    // US-003: Full group detail
    public Task<GroupDetailDto?> GetGroupByIdAsync(long id)
        => _repo.GetGroupByIdAsync(id, _tenant.ClientId);

    // US-002: Create group with atomic member + permission save
    // BR-001: GroupCode is sequential 4-digit zero-padded integer
    public async Task<long> CreateGroupAsync(CreateGroupRequest req)
    {
        ValidateGroupInfo(req.GroupName, req.GroupLeader, req.GroupEmailId, req.GroupDesc);

        var seq = await _repo.GetNextGroupSequenceAsync(_tenant.ClientId);
        var code = seq.ToString("D4");  // BR-001: zero-padded 4-digit

        var group = Group.Create(
            code, req.GroupName, req.GroupEmailId,
            req.GroupLeader, req.GroupDesc, req.IsDepartment,
            _tenant.ClientId, _tenant.UserId);

        if (req.IsInactive)
            group.UpdateInfo(req.GroupName, req.GroupEmailId, req.GroupLeader,
                req.GroupDesc, GroupStatus.Inactive, _tenant.UserId);

        var saved = await _repo.CreateAsync(group, req.MemberIds, req.Permissions);
        return saved.Id;
    }

    // US-004/US-007: Edit group info (including status toggle for inactivation)
    public async Task UpdateGroupInfoAsync(long id, UpdateGroupInfoRequest req)
    {
        ValidateGroupInfo(req.GroupName, req.GroupLeader, req.GroupEmailId, req.GroupDesc);
        if (!await _repo.ExistsAsync(id, _tenant.ClientId))
            throw new KeyNotFoundException($"Group {id} not found.");
        await _repo.UpdateInfoAsync(id, req, _tenant.ClientId, _tenant.UserId);
    }

    // US-005/US-011: Full-replace member sync (BR-005)
    // ADR-004/BR-014: Synchronous privilege revocation — deleting GroupUser rows is atomic.
    public async Task SyncMembersAsync(long groupId, List<long> memberIds)
    {
        if (!await _repo.ExistsAsync(groupId, _tenant.ClientId))
            throw new KeyNotFoundException($"Group {groupId} not found.");
        await _repo.SyncMembersAsync(groupId, memberIds, _tenant.ClientId);
    }

    // US-006/US-012: Save group-level permissions (BR-011)
    public async Task SavePermissionsAsync(long groupId, List<ScreenPermissionSaveDto> permissions)
    {
        if (!await _repo.ExistsAsync(groupId, _tenant.ClientId))
            throw new KeyNotFoundException($"Group {groupId} not found.");
        await _repo.SavePermissionsAsync(groupId, permissions, _tenant.ClientId);
    }

    // US-008/US-009: Export (format: pdf|csv|xlsx|txt; selectedIds = null means all)
    public Task<byte[]> ExportAsync(string format, string? search, string? statusFilter, List<long>? selectedIds)
        => _repo.ExportAsync(_tenant.ClientId, format, search, statusFilter, selectedIds);

    // VR-001/VR-002/VR-003/VR-004
    private static void ValidateGroupInfo(string groupName, long groupLeader, string? groupEmailId, string? groupDesc)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(groupName)) errors.Add("Group Name is required.");
        if (groupName?.Length > 200) errors.Add("Group Name must not exceed 200 characters.");
        if (groupLeader <= 0) errors.Add("Group Leader is required.");
        if (!string.IsNullOrEmpty(groupEmailId) && !IsValidEmail(groupEmailId))
            errors.Add("Group Email must be a valid email address.");
        if (groupDesc?.Length > 500) errors.Add("Group Description must not exceed 500 characters.");
        if (errors.Count > 0) throw new ValidationException(errors);
    }

    private static bool IsValidEmail(string email)
    {
        try { var _ = new System.Net.Mail.MailAddress(email); return true; }
        catch { return false; }
    }
}

public class ValidationException : Exception
{
    public IReadOnlyList<string> Errors { get; }
    public ValidationException(List<string> errors) : base(string.Join("; ", errors)) => Errors = errors;
}
