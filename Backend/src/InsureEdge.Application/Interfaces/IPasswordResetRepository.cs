// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
using InsureEdge.Domain.Entities;

namespace InsureEdge.Application.Interfaces;

public interface IPasswordResetRepository
{
    Task<UserPasswordReset> CreateTokenAsync(long userId, string username, string codeHash, bool isOnboarding);
    // VR-006/VR-007: look up by username AND hash — existence-only lookup is prohibited (US-017 corrective)
    Task<UserPasswordReset?> GetByUsernameAndHashAsync(string username, string codeHash);
    // VR-009: count non-expired tokens for rate limiting (US-016)
    Task<int> CountActiveTokensAsync(string username);
    Task DeleteAllForUserAsync(string username);
    Task DeleteByIdAsync(long id);
}
