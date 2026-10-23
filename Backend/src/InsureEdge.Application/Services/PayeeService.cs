using InsureEdge.Application.DTOs.Payee;
using InsureEdge.Application.Interfaces;

namespace InsureEdge.Application.Services;

public class PayeeService
{
    private readonly IPayeeRepository    _repo;
    private readonly ICurrentTenantService _tenant;

    public PayeeService(IPayeeRepository repo, ICurrentTenantService tenant)
    {
        _repo   = repo;
        _tenant = tenant;
    }

    public Task<List<PayeeListItemDto>> GetListAsync()
        => _repo.GetListAsync(_tenant.ClientId);

    public Task<List<PayeeListItemDto>> GetListByClaimAsync(long claimId)
        => _repo.GetListByClaimAsync(_tenant.ClientId, claimId);

    public Task<PayeeStatusKpiDto> GetStatusKpiAsync(long? claimId = null)
        => _repo.GetStatusKpiAsync(_tenant.ClientId, claimId);

    public Task<long> CreateAsync(CreatePayeeRequest req)
        => _repo.CreateAsync(_tenant.ClientId, _tenant.UserId, req);

    public Task UpdateBankingAsync(long payeeId, CreateBankDetailRequest req)
        => _repo.UpdateBankingAsync(_tenant.ClientId, _tenant.UserId, payeeId, req);

    public Task SendForApprovalAsync(long payeeId)
        => _repo.SendForApprovalAsync(_tenant.ClientId, payeeId);
}
