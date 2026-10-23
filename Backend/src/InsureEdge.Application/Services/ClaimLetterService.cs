using InsureEdge.Application.DTOs.ClaimLetter;
using InsureEdge.Application.Interfaces;

namespace InsureEdge.Application.Services;

public class ClaimLetterService
{
    private readonly IClaimLetterRepository _repo;
    private readonly ICurrentTenantService  _tenant;

    public ClaimLetterService(IClaimLetterRepository repo, ICurrentTenantService tenant)
    {
        _repo   = repo;
        _tenant = tenant;
    }

    public Task<List<ClaimLetterListItemDto>> GetListAsync(long claimId)
        => _repo.GetListAsync(claimId, _tenant.ClientId);

    public Task<ClaimLetterDetailDto?> GetByIdAsync(long letterId)
        => _repo.GetByIdAsync(letterId, _tenant.ClientId);

    public Task<long> SaveAsync(SaveClaimLetterRequest req)
        => _repo.SaveAsync(req, _tenant.ClientId, _tenant.UserId);

    public Task<bool> SendAsync(long letterId)
        => _repo.SendAsync(letterId, _tenant.ClientId, _tenant.UserId);

    public Task<bool> DeleteAsync(long letterId)
        => _repo.DeleteAsync(letterId, _tenant.ClientId);
}
