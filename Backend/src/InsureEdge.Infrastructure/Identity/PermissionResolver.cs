// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// ADR-003: Request-time permission resolution across ScreenPermissions+GroupUser+Group(Active only).
// DBT-SEC-002 Corrective: All 9 permission types enforced server-side on every protected request.
// BR-013: Inactive groups do NOT contribute permissions.
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Domain.Enums;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Identity;

public class PermissionResolver : IPermissionResolver
{
    private readonly InsureEdgeDbContext _db;
    private readonly ICurrentTenantService _tenant;

    public PermissionResolver(InsureEdgeDbContext db, ICurrentTenantService tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    public async Task<EffectivePermissions> ResolveAsync(long userId, long clientId, string screenCode)
    {
        // Aggregate OR across all active groups the user belongs to (BR-013)
        var perms = await _db.ScreenPermissions
            .Where(sp =>
                sp.ClientId == clientId &&
                sp.Screen.ScreenCode == screenCode &&
                _db.GroupUsers.Any(gu =>
                    gu.UserId == userId &&
                    gu.GroupId == sp.GroupId &&
                    sp.Group.Status == GroupStatus.Active &&
                    sp.Group.ClientId == clientId))
            .ToListAsync();

        // Producer self-service login: effective permission = the "Producers" group grant
        // (above) OR the producer's own intermediary's "Assigned Rights" grant (db/026 —
        // intermediary_screen_permissions). Only applies to the requesting user's own
        // session (ProducerScope), never resolved for a different userId, so a producer
        // can never inherit another producer's intermediary's rights.
        List<IntermediaryScreenPermission> intermediaryPerms = [];
        if (userId == _tenant.UserId)
        {
            var scope = ProducerScope.FromTenant(_tenant);
            if (scope != null)
                intermediaryPerms = await _db.IntermediaryScreenPermissions
                    .Where(isp =>
                        isp.ClientId == clientId &&
                        isp.IntermediaryId == scope.IntermediaryId &&
                        isp.Screen.ScreenCode == screenCode)
                    .ToListAsync();
        }

        if (!perms.Any() && !intermediaryPerms.Any())
            return new EffectivePermissions(false, false, false, false, false, false, false, false, false);

        return new EffectivePermissions(
            View:               perms.Any(p => p.IsViewPermission)        || intermediaryPerms.Any(p => p.IsViewPermission),
            Add:                perms.Any(p => p.IsCreatePermission)      || intermediaryPerms.Any(p => p.IsCreatePermission),
            Edit:               perms.Any(p => p.IsEditPermission)        || intermediaryPerms.Any(p => p.IsEditPermission),
            Duplicate:          perms.Any(p => p.IsDuplicatePermission)   || intermediaryPerms.Any(p => p.IsDuplicatePermission),
            Upload:             perms.Any(p => p.IsUploadPermission)      || intermediaryPerms.Any(p => p.IsUploadPermission),
            Download:           perms.Any(p => p.IsDownloadPermission)    || intermediaryPerms.Any(p => p.IsDownloadPermission),
            SensitiveData:      perms.Any(p => p.IsViewSensitiveInfo)     || intermediaryPerms.Any(p => p.IsViewSensitiveInfo),
            SensitiveDocuments: perms.Any(p => p.IsAccessSensitiveDoc)    || intermediaryPerms.Any(p => p.IsAccessSensitiveDoc),
            ApproveReject:      perms.Any(p => p.IsApproveReject)         || intermediaryPerms.Any(p => p.IsApproveReject)
        );
    }
}
