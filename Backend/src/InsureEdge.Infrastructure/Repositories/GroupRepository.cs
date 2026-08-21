// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// BR-007 Corrective: MemberCount always computed via live COUNT aggregate — no stored column.
// BR-005 / ADR-004: SyncMembersAsync uses full-replace in a single transaction.
// RSK-SEC-003 Corrective: Deleting GroupUser rows IS the synchronous revocation.
using InsureEdge.Application.DTOs.Group;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Domain.Enums;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace InsureEdge.Infrastructure.Repositories;

public class GroupRepository : IGroupRepository
{
    private readonly InsureEdgeDbContext _db;

    public GroupRepository(InsureEdgeDbContext db) => _db = db;

    public async Task<(List<GroupListDto> Items, int Total, int ActiveCount, int InactiveCount)> GetGroupListAsync(
        long clientId, string? search, string? statusFilter,
        string? sortBy, string sortOrder, int page, int pageSize)
    {
        var query = _db.Groups
            .Where(g => g.ClientId == clientId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(g =>
                g.GroupName.ToLower().Contains(search) ||
                g.GroupCode.ToLower().Contains(search) ||
                (g.GroupEmailId != null && g.GroupEmailId.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(statusFilter) && Enum.TryParse<GroupStatus>(statusFilter, out var sf))
            query = query.Where(g => g.Status == sf);

        // Counts from full query (before pagination)
        var activeCount = await query.CountAsync(g => g.Status == GroupStatus.Active);
        var inactiveCount = await query.CountAsync(g => g.Status == GroupStatus.Inactive);
        var total = activeCount + inactiveCount;

        // Join for leader name and created-by name, live member count
        var raw = await query
            .Select(g => new
            {
                g.Id, g.GroupCode, g.GroupName, g.GroupEmailId, g.GroupDesc,
                g.Status, g.CreatedOn, g.IsDepartment,
                GroupLeaderName = _db.Users.Where(u => u.Id == g.GroupLeader).Select(u => u.FirstName + " " + u.LastName).FirstOrDefault(),
                CreatedByName = _db.Users.Where(u => u.Id == g.CreatedBy).Select(u => u.FirstName + " " + u.LastName).FirstOrDefault(),
                MemberCount = _db.GroupUsers.Count(gu => gu.GroupId == g.Id) // BR-007: live count
            })
            .ToListAsync();

        // Sort in memory (small pages)
        raw = sortBy switch
        {
            "groupCode"    => sortOrder == "desc" ? raw.OrderByDescending(x => x.GroupCode).ToList()    : raw.OrderBy(x => x.GroupCode).ToList(),
            "groupName"    => sortOrder == "desc" ? raw.OrderByDescending(x => x.GroupName).ToList()    : raw.OrderBy(x => x.GroupName).ToList(),
            "memberCount"  => sortOrder == "desc" ? raw.OrderByDescending(x => x.MemberCount).ToList()  : raw.OrderBy(x => x.MemberCount).ToList(),
            "status"       => sortOrder == "desc" ? raw.OrderByDescending(x => x.Status).ToList()       : raw.OrderBy(x => x.Status).ToList(),
            "createdOn"    => sortOrder == "desc" ? raw.OrderByDescending(x => x.CreatedOn).ToList()    : raw.OrderBy(x => x.CreatedOn).ToList(),
            _              => raw.OrderBy(x => x.GroupCode).ToList()
        };

        var items = raw
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new GroupListDto(
                x.Id, x.GroupCode, x.GroupName, x.GroupEmailId,
                x.GroupLeaderName, x.MemberCount, x.CreatedByName ?? "",
                x.CreatedOn, x.GroupDesc, x.Status.ToString()))
            .ToList();

        return (items, total, activeCount, inactiveCount);
    }

    public async Task<GroupDetailDto?> GetGroupByIdAsync(long id, long clientId)
    {
        var g = await _db.Groups
            .Where(x => x.Id == id && x.ClientId == clientId)
            .FirstOrDefaultAsync();
        if (g == null) return null;

        var leaderName = g.GroupLeader > 0
            ? await _db.Users.Where(u => u.Id == g.GroupLeader).Select(u => u.FirstName + " " + u.LastName).FirstOrDefaultAsync()
            : null;
        var createdByName = await _db.Users.Where(u => u.Id == g.CreatedBy).Select(u => u.FirstName + " " + u.LastName).FirstOrDefaultAsync() ?? "";

        var members = await _db.GroupUsers
            .Where(gu => gu.GroupId == id)
            .Join(_db.Users, gu => gu.UserId, u => u.Id, (gu, u) => new MemberDto(
                u.Id, u.FirstName + " " + u.LastName, u.Email,
                (u.FirstName.Length > 0 ? u.FirstName.Substring(0, 1) : "") +
                (u.LastName.Length > 0 ? u.LastName.Substring(0, 1) : "")))
            .ToListAsync();

        var permissions = await _db.ScreenPermissions
            .Where(sp => sp.GroupId == id && sp.ClientId == clientId)
            .Join(_db.AppScreens, sp => sp.ScreenId, s => s.Id, (sp, s) => new { sp, s })
            .Join(_db.Modules, x => x.s.ModuleId, m => m.Id, (x, m) => new ScreenPermissionDto(
                x.s.Id, x.s.ScreenCode, x.s.ScreenName, m.Id, m.ModuleName,
                x.sp.IsViewPermission, x.sp.IsCreatePermission, x.sp.IsEditPermission,
                x.sp.IsDuplicatePermission, x.sp.IsUploadPermission, x.sp.IsDownloadPermission,
                x.sp.IsViewSensitiveInfo, x.sp.IsAccessSensitiveDoc, x.sp.IsApproveReject))
            .ToListAsync();

        return new GroupDetailDto(
            g.Id, g.GroupCode, g.GroupName, g.GroupEmailId, g.GroupLeader, leaderName,
            g.GroupDesc, g.Status.ToString(), g.IsDepartment, g.CreatedOn, createdByName,
            members, permissions);
    }

    public async Task<Group> CreateAsync(Group group, List<long> memberIds, List<ScreenPermissionSaveDto> permissions)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();
        _db.Groups.Add(group);
        await _db.SaveChangesAsync();

        if (memberIds.Any())
        {
            var gu = memberIds.Select(uid => new GroupUser { GroupId = group.Id, UserId = uid, ClientId = group.ClientId }).ToList();
            _db.GroupUsers.AddRange(gu);
        }

        if (permissions.Any())
        {
            var sp = permissions.Select(p => new ScreenPermissions
            {
                GroupId = group.Id, ScreenId = p.ScreenId, ClientId = group.ClientId,
                IsViewPermission = p.IsViewPermission, IsCreatePermission = p.IsCreatePermission,
                IsEditPermission = p.IsEditPermission, IsDuplicatePermission = p.IsDuplicatePermission,
                IsUploadPermission = p.IsUploadPermission, IsDownloadPermission = p.IsDownloadPermission,
                IsViewSensitiveInfo = p.IsViewSensitiveInfo, IsAccessSensitiveDoc = p.IsAccessSensitiveDoc,
                IsApproveReject = p.IsApproveReject
            }).ToList();
            _db.ScreenPermissions.AddRange(sp);
        }

        await _db.SaveChangesAsync();
        await tx.CommitAsync();
        return group;
    }

    public async Task UpdateInfoAsync(long id, UpdateGroupInfoRequest req, long clientId, long updatedBy)
    {
        var g = await _db.Groups.FirstOrDefaultAsync(x => x.Id == id && x.ClientId == clientId)
            ?? throw new KeyNotFoundException();
        var status = Enum.Parse<GroupStatus>(req.Status);
        g.UpdateInfo(req.GroupName, req.GroupEmailId, req.GroupLeader, req.GroupDesc, status, updatedBy);
        await _db.SaveChangesAsync();
    }

    // BR-005: Full-replace in one transaction. ADR-004: synchronous revocation.
    public async Task SyncMembersAsync(long groupId, List<long> memberIds, long clientId)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();
        var existing = await _db.GroupUsers.Where(x => x.GroupId == groupId).ToListAsync();
        _db.GroupUsers.RemoveRange(existing); // synchronous privilege revocation
        if (memberIds.Any())
            _db.GroupUsers.AddRange(memberIds.Select(uid => new GroupUser { GroupId = groupId, UserId = uid, ClientId = clientId }));
        await _db.SaveChangesAsync();
        await tx.CommitAsync();
    }

    // BR-011: Upsert — delete existing for group+client, insert new set
    public async Task SavePermissionsAsync(long groupId, List<ScreenPermissionSaveDto> permissions, long clientId)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();
        var existing = await _db.ScreenPermissions.Where(x => x.GroupId == groupId && x.ClientId == clientId).ToListAsync();
        _db.ScreenPermissions.RemoveRange(existing);
        if (permissions.Any())
        {
            _db.ScreenPermissions.AddRange(permissions.Select(p => new ScreenPermissions
            {
                GroupId = groupId, ScreenId = p.ScreenId, ClientId = clientId,
                IsViewPermission = p.IsViewPermission, IsCreatePermission = p.IsCreatePermission,
                IsEditPermission = p.IsEditPermission, IsDuplicatePermission = p.IsDuplicatePermission,
                IsUploadPermission = p.IsUploadPermission, IsDownloadPermission = p.IsDownloadPermission,
                IsViewSensitiveInfo = p.IsViewSensitiveInfo, IsAccessSensitiveDoc = p.IsAccessSensitiveDoc,
                IsApproveReject = p.IsApproveReject
            }));
        }
        await _db.SaveChangesAsync();
        await tx.CommitAsync();
    }

    public async Task<bool> ExistsAsync(long id, long clientId)
        => await _db.Groups.AnyAsync(g => g.Id == id && g.ClientId == clientId);

    public async Task<int> GetNextGroupSequenceAsync(long clientId)
    {
        var maxCode = await _db.Groups
            .Where(g => g.ClientId == clientId)
            .Select(g => g.GroupCode)
            .ToListAsync();
        if (!maxCode.Any()) return 1;
        var max = maxCode.Select(c => int.TryParse(c, out var n) ? n : 0).Max();
        return max + 1;
    }

    public async Task<byte[]> ExportAsync(long clientId, string format,
        string? search, string? statusFilter, List<long>? selectedIds)
    {
        var query = _db.Groups.Where(g => g.ClientId == clientId).AsQueryable();
        if (selectedIds != null && selectedIds.Any())
            query = query.Where(g => selectedIds.Contains(g.Id));
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(g => g.GroupName.ToLower().Contains(s) || g.GroupCode.ToLower().Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(statusFilter) && Enum.TryParse<GroupStatus>(statusFilter, out var sf))
            query = query.Where(g => g.Status == sf);

        var rows = await query
            .Select(g => new
            {
                g.GroupCode, g.GroupName, g.GroupEmailId, g.GroupDesc, g.Status,
                MemberCount = _db.GroupUsers.Count(gu => gu.GroupId == g.Id),
                LeaderName = _db.Users.Where(u => u.Id == g.GroupLeader).Select(u => u.FirstName + " " + u.LastName).FirstOrDefault()
            }).ToListAsync();

        // US-008/US-009: Supported formats — CSV only in this implementation
        // PDF/XLSX/TXT stubs return CSV; replace with actual library in production
        var sb = new StringBuilder();
        sb.AppendLine("Group Code,Group Name,Group Email,Leader,Members,Status,Description");
        foreach (var r in rows)
            sb.AppendLine($"\"{r.GroupCode}\",\"{r.GroupName}\",\"{r.GroupEmailId}\",\"{r.LeaderName}\",{r.MemberCount},\"{r.Status}\",\"{r.GroupDesc}\"");
        return Encoding.UTF8.GetBytes(sb.ToString());
    }
}
