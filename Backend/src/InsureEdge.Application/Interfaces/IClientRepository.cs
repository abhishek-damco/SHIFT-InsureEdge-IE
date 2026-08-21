// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
using InsureEdge.Application.DTOs.Client;

namespace InsureEdge.Application.Interfaces;

public interface IClientRepository
{
    Task<(List<ClientListItemDto> Items, int Total)> GetListAsync(long clientId, string? search, int page, int pageSize);
    Task<ClientDetailDto?> GetDetailAsync(long clientId);
    Task UpdateInfoAsync(long clientId, SaveClientInfoRequest req, long userId);
    Task SaveAddressAsync(long clientId, SaveAddressRequest req, long userId);
    Task SaveContactAsync(long clientId, SaveContactRequest req, long userId);
    Task<long> SaveOfficeAsync(long clientId, SaveOfficeRequest req, long userId);
    Task DeleteOfficeAsync(long clientId, long officeId);
    Task<long> SaveCompanyAsync(long clientId, SaveCompanyRequest req, long userId);
    Task DeleteCompanyAsync(long clientId, long companyId);
    Task SaveCompanyAddressAsync(long companyId, SaveAddressRequest req);
    Task SaveCompanyContactAsync(long companyId, SaveContactRequest req);
    Task<List<ProductAccessDto>> GetProductAccessAsync(long companyId);
    Task SaveProductAccessAsync(long companyId, SaveProductAccessRequest req);
    Task<List<ProductDto>> GetAllProductsAsync();
}
