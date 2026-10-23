// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// ADR-010: ClientId always from tenant context — never trusts request parameters.
using InsureEdge.Application.DTOs.Auth;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly InsureEdgeDbContext _db;

    public UserRepository(InsureEdgeDbContext db) => _db = db;

    public async Task<List<UserSelectDto>> GetActiveUsersAsync(long clientId)
        => await _db.Users
            .Where(u => u.ClientId == clientId && u.IsActive)
            .OrderBy(u => u.FirstName).ThenBy(u => u.LastName)
            .Select(u => new UserSelectDto(
                u.Id,
                u.FirstName + " " + u.LastName,
                u.Email,
                (u.FirstName.Length > 0 ? u.FirstName.Substring(0, 1) : "") +
                (u.LastName.Length > 0 ? u.LastName.Substring(0, 1) : "")))
            .ToListAsync();

    public async Task<User?> GetByEmailAsync(string email, long clientId)
        => await _db.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.ClientId == clientId);

    public async Task<User?> GetByIdAsync(long id, long clientId)
        => await _db.Users.FirstOrDefaultAsync(u => u.Id == id && u.ClientId == clientId);


    public async Task<User> CreateAsync(User user)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }

    public async Task UpdatePasswordAsync(long userId, string passwordHash)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException($"User {userId} not found.");
        user.PasswordHash = passwordHash;
        await _db.SaveChangesAsync();
        // My Profile "Password last changed" (db/022_user_last_login.sql).
        await _db.Database.ExecuteSqlInterpolatedAsync(
            $@"UPDATE ""user"" SET password_updated_on = now() WHERE id = {userId}");
    }
}
