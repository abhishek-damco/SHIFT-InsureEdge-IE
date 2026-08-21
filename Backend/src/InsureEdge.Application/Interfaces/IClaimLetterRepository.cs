using InsureEdge.Application.DTOs.ClaimLetter;

namespace InsureEdge.Application.Interfaces;

public interface IClaimLetterRepository
{
    Task<List<ClaimLetterListItemDto>> GetListAsync(long claimId, long clientId);
    Task<ClaimLetterDetailDto?> GetByIdAsync(long letterId, long clientId);
    Task<long> SaveAsync(SaveClaimLetterRequest req, long clientId, long userId);
    Task<bool> SendAsync(long letterId, long clientId, long userId);
    Task<bool> DeleteAsync(long letterId, long clientId);
}
