// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
using InsureEdge.Application.DTOs.Distribution;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Services;

public class IntermediaryScreenPermissionService(InsureEdgeDbContext db, ICurrentTenantService tenant)
{
    public async Task<List<ScreenListItemDto>> GetAllScreensAsync()
        => await db.AppScreens
            .Include(s => s.Module)
            .OrderBy(s => s.Module!.ModuleName).ThenBy(s => s.ScreenName)
            .Select(s => new ScreenListItemDto(s.Id, s.ScreenCode, s.ScreenName, s.ModuleId, s.Module!.ModuleName))
            .ToListAsync();

    public async Task<List<IntermediaryScreenPermissionDto>?> GetByIntermediaryAsync(long intermediaryId)
    {
        var exists = await db.Intermediaries.AnyAsync(i => i.Id == intermediaryId && i.ClientId == tenant.ClientId);
        if (!exists) return null;

        var rows = await db.IntermediaryScreenPermissions
            .Where(p => p.IntermediaryId == intermediaryId && p.ClientId == tenant.ClientId)
            .ToListAsync();

        return rows.Select(p => new IntermediaryScreenPermissionDto(
            p.ScreenId, p.IsViewPermission, p.IsCreatePermission, p.IsEditPermission,
            p.IsDuplicatePermission, p.IsUploadPermission, p.IsDownloadPermission,
            p.IsViewSensitiveInfo, p.IsAccessSensitiveDoc, p.IsApproveReject,
            AllAccess: p.IsViewPermission && p.IsCreatePermission && p.IsEditPermission &&
                       p.IsDuplicatePermission && p.IsUploadPermission && p.IsDownloadPermission &&
                       p.IsViewSensitiveInfo && p.IsAccessSensitiveDoc && p.IsApproveReject))
            .ToList();
    }

    // Full-replace, mirrors GroupRepository.SavePermissionsAsync's pattern for the
    // analogous Group-level grant — delete existing rows for this intermediary, then
    // insert exactly what was sent (empty/omitted screens => no access, not "unchanged").
    public async Task<bool> SaveByIntermediaryAsync(long intermediaryId, List<SaveIntermediaryScreenPermissionRequest> permissions)
    {
        var exists = await db.Intermediaries.AnyAsync(i => i.Id == intermediaryId && i.ClientId == tenant.ClientId);
        if (!exists) return false;

        await using var tx = await db.Database.BeginTransactionAsync();

        var existing = await db.IntermediaryScreenPermissions
            .Where(p => p.IntermediaryId == intermediaryId && p.ClientId == tenant.ClientId)
            .ToListAsync();
        db.IntermediaryScreenPermissions.RemoveRange(existing);

        var rowsToKeep = permissions.Where(p =>
            p.IsViewPermission || p.IsCreatePermission || p.IsEditPermission || p.IsDuplicatePermission ||
            p.IsUploadPermission || p.IsDownloadPermission || p.IsViewSensitiveInfo || p.IsAccessSensitiveDoc ||
            p.IsApproveReject);

        db.IntermediaryScreenPermissions.AddRange(rowsToKeep.Select(p => new IntermediaryScreenPermission
        {
            IntermediaryId = intermediaryId,
            ScreenId = p.ScreenId,
            ClientId = tenant.ClientId,
            IsViewPermission = p.IsViewPermission,
            IsCreatePermission = p.IsCreatePermission,
            IsEditPermission = p.IsEditPermission,
            IsDuplicatePermission = p.IsDuplicatePermission,
            IsUploadPermission = p.IsUploadPermission,
            IsDownloadPermission = p.IsDownloadPermission,
            IsViewSensitiveInfo = p.IsViewSensitiveInfo,
            IsAccessSensitiveDoc = p.IsAccessSensitiveDoc,
            IsApproveReject = p.IsApproveReject,
        }));

        await db.SaveChangesAsync();
        await tx.CommitAsync();
        return true;
    }
}
