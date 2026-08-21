// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
using InsureEdge.Application.DTOs.Client;
using InsureEdge.Application.Interfaces;

namespace InsureEdge.Application.Services;

public class ClientService(IClientRepository repo, ICurrentTenantService tenant)
{
    public Task<(List<ClientListItemDto> Items, int Total)> GetListAsync(string? search, int page, int pageSize)
        => repo.GetListAsync(tenant.ClientId, search, page, pageSize);

    public Task<ClientDetailDto?> GetDetailAsync()
        => repo.GetDetailAsync(tenant.ClientId);

    public Task<ClientDetailDto?> GetDetailByIdAsync(long id)
        => repo.GetDetailAsync(id);

    public Task UpdateInfoAsync(SaveClientInfoRequest req)
        => repo.UpdateInfoAsync(tenant.ClientId, req, tenant.UserId);

    public Task SaveAddressAsync(SaveAddressRequest req)
        => repo.SaveAddressAsync(tenant.ClientId, req, tenant.UserId);

    public Task SaveContactAsync(SaveContactRequest req)
        => repo.SaveContactAsync(tenant.ClientId, req, tenant.UserId);

    public Task<long> SaveOfficeAsync(SaveOfficeRequest req)
        => repo.SaveOfficeAsync(tenant.ClientId, req, tenant.UserId);

    public Task DeleteOfficeAsync(long officeId)
        => repo.DeleteOfficeAsync(tenant.ClientId, officeId);

    public Task<long> SaveCompanyAsync(SaveCompanyRequest req)
        => repo.SaveCompanyAsync(tenant.ClientId, req, tenant.UserId);

    public Task DeleteCompanyAsync(long companyId)
        => repo.DeleteCompanyAsync(tenant.ClientId, companyId);

    public Task SaveCompanyAddressAsync(long companyId, SaveAddressRequest req)
        => repo.SaveCompanyAddressAsync(companyId, req);

    public Task SaveCompanyContactAsync(long companyId, SaveContactRequest req)
        => repo.SaveCompanyContactAsync(companyId, req);

    public Task<List<ProductAccessDto>> GetProductAccessAsync(long companyId)
        => repo.GetProductAccessAsync(companyId);

    public Task SaveProductAccessAsync(long companyId, SaveProductAccessRequest req)
        => repo.SaveProductAccessAsync(companyId, req);

    public Task<List<ProductDto>> GetAllProductsAsync()
        => repo.GetAllProductsAsync();
}
