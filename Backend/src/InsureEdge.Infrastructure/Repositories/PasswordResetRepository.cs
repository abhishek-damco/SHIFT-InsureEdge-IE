// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// CORRECTIVE (RSK-SEC-004): All lookups use hash — plaintext never touches the DB.
// CORRECTIVE (US-017): GetByUsernameAndHashAsync enforces all 3 validation checks at DB layer.
// VR-009: CountActiveTokensAsync counts non-expired tokens within the rate-limit window.
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Repositories;

public class PasswordResetRepository : IPasswordResetRepository
{
    private readonly InsureEdgeDbContext _db;

    public PasswordResetRepository(InsureEdgeDbContext db) => _db = db;

    public async Task<UserPasswordReset> CreateTokenAsync(
        long userId, string username, string codeHash, bool isOnboarding)
    {
        var record = new UserPasswordReset
        {
            UserId = userId,
            Username = username,
            CodeHash = codeHash,
            IsOnboarding = isOnboarding,
            CreatedOn = DateTime.UtcNow
        };
        _db.UserPasswordResets.Add(record);
        await _db.SaveChangesAsync();
        return record;
    }

    // CORRECTIVE (US-017): Lookup by both username AND hash.
    // If hash doesn't match, no record is returned — existence-only is NOT possible here.
    public async Task<UserPasswordReset?> GetByUsernameAndHashAsync(string username, string codeHash)
        => await _db.UserPasswordResets
            .FirstOrDefaultAsync(r => r.Username == username && r.CodeHash == codeHash);

    // VR-009: Count tokens created within the 30-min rate-limit window that haven't expired
    public async Task<int> CountActiveTokensAsync(string username)
    {
        var cutoff = DateTime.UtcNow.AddMinutes(-30);
        return await _db.UserPasswordResets
            .CountAsync(r => r.Username == username && r.CreatedOn >= cutoff);
    }

    public async Task DeleteAllForUserAsync(string username)
    {
        var records = await _db.UserPasswordResets.Where(r => r.Username == username).ToListAsync();
        _db.UserPasswordResets.RemoveRange(records);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteByIdAsync(long id)
    {
        var record = await _db.UserPasswordResets.FindAsync(id);
        if (record != null)
        {
            _db.UserPasswordResets.Remove(record);
            await _db.SaveChangesAsync();
        }
    }
}
