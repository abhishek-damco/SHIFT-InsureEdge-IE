using InsureEdge.Application.DTOs.Configuration;
using InsureEdge.Application.Interfaces;

namespace InsureEdge.Application.Services;

public class ConfigurationService
{
    private readonly IConfigurationRepository _repo;
    private readonly ICurrentTenantService _tenant;

    public ConfigurationService(IConfigurationRepository repo, ICurrentTenantService tenant)
    {
        _repo = repo;
        _tenant = tenant;
    }

    public Task<List<ConfigurationListItemDto>> GetListAsync(string? search) =>
        _repo.GetListAsync(_tenant.ClientId, search);

    public Task<List<ConfigurationValueExportRow>> GetValuesForExportAsync(long id) =>
        _repo.GetValuesForExportAsync(id, _tenant.ClientId);

    public Task<ConfigurationDetailDto?> GetDetailAsync(long id, string? search, int page, int pageSize) =>
        _repo.GetDetailAsync(id, _tenant.ClientId, search, page, pageSize);

    public Task<bool> SaveAsync(long id, ConfigurationSaveRequestDto request) =>
        _repo.SaveAsync(id, _tenant.ClientId, _tenant.UserId, request);
}
