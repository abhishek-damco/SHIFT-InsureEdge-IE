// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// WorksheetService — thin application-layer delegate.
// Follows same pattern as ClaimService: service in Application delegates to repository in Infrastructure.
using InsureEdge.Application.DTOs.Claim;
using InsureEdge.Application.Interfaces;

namespace InsureEdge.Application.Services;

// Interface the infrastructure repository must implement
public interface IWorksheetRepository
{
    Task<WorksheetMatrixDto> GetMatrixAsync(long claimId, long clientId);
    Task<WorksheetDto?> GetWorksheetAsync(long worksheetId, long clientId);
    Task<WorksheetDto> SaveAsync(long claimId, long clientId, long userId, SaveWorksheetRequest req);
    Task<WorksheetDto> ApproveAsync(long worksheetId, long clientId, long userId);
    Task<WorksheetDto> DenyAsync(long worksheetId, long clientId, long userId);
    Task<WorksheetDto> EscalateAsync(long worksheetId, long escalateTo, long clientId, long userId);
}

public class WorksheetService(IWorksheetRepository repo, ICurrentTenantService tenant)
{
    public Task<WorksheetMatrixDto> GetMatrixAsync(long claimId)
        => repo.GetMatrixAsync(claimId, tenant.ClientId);

    public Task<WorksheetDto?> GetWorksheetAsync(long worksheetId)
        => repo.GetWorksheetAsync(worksheetId, tenant.ClientId);

    public Task<WorksheetDto> SaveAsync(long claimId, SaveWorksheetRequest req)
        => repo.SaveAsync(claimId, tenant.ClientId, tenant.UserId, req);

    public Task<WorksheetDto> ApproveAsync(long worksheetId)
        => repo.ApproveAsync(worksheetId, tenant.ClientId, tenant.UserId);

    public Task<WorksheetDto> DenyAsync(long worksheetId)
        => repo.DenyAsync(worksheetId, tenant.ClientId, tenant.UserId);

    public Task<WorksheetDto> EscalateAsync(long worksheetId, long escalateTo)
        => repo.EscalateAsync(worksheetId, escalateTo, tenant.ClientId, tenant.UserId);
}
