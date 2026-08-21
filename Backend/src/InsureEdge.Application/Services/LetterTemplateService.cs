using InsureEdge.Application.DTOs.LetterTemplate;
using InsureEdge.Application.Interfaces;

namespace InsureEdge.Application.Services;

public class LetterTemplateService
{
    private readonly ILetterTemplateRepository _repo;
    private readonly ICurrentTenantService _tenant;

    public LetterTemplateService(ILetterTemplateRepository repo, ICurrentTenantService tenant)
    {
        _repo = repo;
        _tenant = tenant;
    }

    public Task<List<LetterTemplateListItemDto>> GetListAsync(string? search) =>
        _repo.GetListAsync(_tenant.ClientId, search);

    public Task<string> GetNextCodeAsync() =>
        _repo.GetNextCodeAsync(_tenant.ClientId);

    public Task<long> CreateAsync(CreateTemplateRequestDto request) =>
        _repo.CreateAsync(_tenant.ClientId, _tenant.UserId, request);

    public Task<LetterTemplateDetailDto?> GetByIdAsync(long id) =>
        _repo.GetByIdAsync(_tenant.ClientId, id);

    public Task UpdateAsync(long id, UpdateTemplateRequestDto request) =>
        _repo.UpdateAsync(_tenant.ClientId, _tenant.UserId, id, request);
}
