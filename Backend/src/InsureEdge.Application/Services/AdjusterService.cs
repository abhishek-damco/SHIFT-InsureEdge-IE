using InsureEdge.Application.DTOs.Adjuster;
using InsureEdge.Application.Interfaces;

namespace InsureEdge.Application.Services;

public class AdjusterService
{
    private readonly IAdjusterRepository _repo;
    private readonly ICurrentTenantService _tenant;

    public AdjusterService(IAdjusterRepository repo, ICurrentTenantService tenant)
    {
        _repo = repo;
        _tenant = tenant;
    }

    public Task<List<TempAdjusterDto>> GetAllAsync() => _repo.GetAllAsync(_tenant.ClientId);
    public Task<TempAdjusterDto?> GetByIdAsync(long id) => _repo.GetByIdAsync(id, _tenant.ClientId);
    public Task<TempAdjusterDto> CreateAsync(UpsertTempAdjusterRequest req) => _repo.CreateAsync(req, _tenant.ClientId, _tenant.UserId);
    public Task<TempAdjusterDto> UpdateAsync(long id, UpsertTempAdjusterRequest req) => _repo.UpdateAsync(id, req, _tenant.ClientId, _tenant.UserId);
}
