using InsureEdge.Application.DTOs.LetterTemplate;

namespace InsureEdge.Application.Interfaces;

public interface ILetterTemplateRepository
{
    Task<List<LetterTemplateListItemDto>> GetListAsync(long clientId, string? search);
    Task<string> GetNextCodeAsync(long clientId);
    Task<long> CreateAsync(long clientId, long userId, CreateTemplateRequestDto request);
    Task<LetterTemplateDetailDto?> GetByIdAsync(long clientId, long id);
    Task UpdateAsync(long clientId, long userId, long id, UpdateTemplateRequestDto request);
}
