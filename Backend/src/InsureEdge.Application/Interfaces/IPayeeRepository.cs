using InsureEdge.Application.DTOs.Payee;

namespace InsureEdge.Application.Interfaces;

public interface IPayeeRepository
{
    Task<List<PayeeListItemDto>> GetListAsync(long clientId);
    Task<List<PayeeListItemDto>> GetListByClaimAsync(long clientId, long claimId);
    Task<PayeeStatusKpiDto>      GetStatusKpiAsync(long clientId, long? claimId);
    Task<long>                   CreateAsync(long clientId, long userId, CreatePayeeRequest req);
    Task                         UpdateBankingAsync(long clientId, long userId, long payeeId, CreateBankDetailRequest req);
    Task                         SendForApprovalAsync(long clientId, long payeeId);
}
