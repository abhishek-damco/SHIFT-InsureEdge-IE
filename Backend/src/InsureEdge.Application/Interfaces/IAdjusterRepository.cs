using InsureEdge.Application.DTOs.Adjuster;

namespace InsureEdge.Application.Interfaces;

public interface IAdjusterRepository
{
    Task<List<TempAdjusterDto>> GetAllAsync(long clientId);
    Task<TempAdjusterDto?> GetByIdAsync(long id, long clientId);
    Task<TempAdjusterDto> CreateAsync(UpsertTempAdjusterRequest req, long clientId, long userId);
    Task<TempAdjusterDto> UpdateAsync(long id, UpsertTempAdjusterRequest req, long clientId, long userId);
}
