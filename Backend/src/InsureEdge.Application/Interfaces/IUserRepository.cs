// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
using InsureEdge.Application.DTOs.Auth;
using InsureEdge.Domain.Entities;

namespace InsureEdge.Application.Interfaces;

public interface IUserRepository
{
    Task<List<UserSelectDto>> GetActiveUsersAsync(long clientId);
    Task<User?> GetByEmailAsync(string email, long clientId);
    Task<User?> GetByIdAsync(long id, long clientId);
    Task<User> CreateAsync(User user);
    Task UpdatePasswordAsync(long userId, string passwordHash);
}
