using InsureEdge.Application.DTOs.Configuration;

namespace InsureEdge.Application.Interfaces;

public interface IConfigurationRepository
{
    Task<List<ConfigurationListItemDto>> GetListAsync(long clientId, string? search);
    Task<List<ConfigurationValueExportRow>> GetValuesForExportAsync(long id, long clientId);
    Task<ConfigurationDetailDto?> GetDetailAsync(long id, long clientId, string? search, int page, int pageSize);
    Task<bool> SaveAsync(long id, long clientId, long userId, ConfigurationSaveRequestDto request);
}
