using InsureEdge.Application.DTOs.ClaimLetter;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Repositories;

public class ClaimLetterRepository : IClaimLetterRepository
{
    private readonly InsureEdgeDbContext _db;

    public ClaimLetterRepository(InsureEdgeDbContext db) => _db = db;

    public async Task<List<ClaimLetterListItemDto>> GetListAsync(long claimId, long clientId)
    {
        var letters = await _db.ClaimLetters
            .Where(l => l.ClaimId == claimId && l.ClientId == clientId)
            .Include(l => l.CreatedByUser)
            .OrderByDescending(l => l.Id)
            .ToListAsync();

        return letters.Select(l => new ClaimLetterListItemDto(
            l.Id,
            l.LetterCode,
            l.LetterType,
            l.LetterDate.HasValue ? l.LetterDate.Value.ToString("MM/dd/yyyy") : null,
            l.SendDate.HasValue  ? l.SendDate.Value.ToString("MM/dd/yyyy")   : null,
            l.RecipientName,
            l.RecipientRole,
            l.RecipientEmail,
            l.Priority,
            l.Status,
            l.CreatedByUser != null ? l.CreatedByUser.FullName : null,
            l.CreatedOn.ToString("MM/dd/yyyy")
        )).ToList();
    }

    public async Task<ClaimLetterDetailDto?> GetByIdAsync(long letterId, long clientId)
    {
        var l = await _db.ClaimLetters
            .Where(x => x.Id == letterId && x.ClientId == clientId)
            .Include(x => x.CreatedByUser)
            .Include(x => x.UpdatedByUser)
            .FirstOrDefaultAsync();

        if (l == null) return null;

        return new ClaimLetterDetailDto(
            l.Id,
            l.LetterCode,
            l.LetterType,
            l.LetterDate.HasValue ? l.LetterDate.Value.ToString("MM/dd/yyyy") : null,
            l.Subject,
            l.LetterBody,
            l.RecipientRole,
            l.RecipientName,
            l.DeliveryMethod,
            l.RecipientEmail,
            l.RecipientAddress,
            l.Priority,
            l.FollowUp,
            l.Status,
            l.SendDate.HasValue ? l.SendDate.Value.ToString("MM/dd/yyyy") : null,
            l.CreatedByUser != null ? l.CreatedByUser.FullName : null,
            l.CreatedOn.ToString("MM/dd/yyyy"),
            l.UpdatedByUser != null ? l.UpdatedByUser.FullName : null,
            l.UpdatedOn.HasValue ? l.UpdatedOn.Value.ToString("MM/dd/yyyy") : null
        );
    }

    public async Task<long> SaveAsync(SaveClaimLetterRequest req, long clientId, long userId)
    {
        DateTimeOffset? ParseDate(string? s) =>
            DateTimeOffset.TryParse(s, out var d) ? d : null;

        if (req.Id.HasValue && req.Id.Value > 0)
        {
            var existing = await _db.ClaimLetters
                .FirstOrDefaultAsync(l => l.Id == req.Id.Value && l.ClientId == clientId)
                ?? throw new InvalidOperationException("Letter not found.");

            existing.LetterType       = req.LetterType;
            existing.LetterDate       = ParseDate(req.LetterDate);
            existing.Subject          = req.Subject;
            existing.LetterBody       = req.LetterBody;
            existing.RecipientRole    = req.RecipientRole;
            existing.RecipientName    = req.RecipientName;
            existing.DeliveryMethod   = req.DeliveryMethod;
            existing.RecipientEmail   = req.RecipientEmail;
            existing.RecipientAddress = req.RecipientAddress;
            existing.Priority         = req.Priority;
            existing.FollowUp         = req.FollowUp;
            existing.UpdatedBy        = userId;
            existing.UpdatedOn        = DateTimeOffset.UtcNow;

            await _db.SaveChangesAsync();
            return existing.Id;
        }
        else
        {
            var count = await _db.ClaimLetters.CountAsync(l => l.ClientId == clientId) + 1;
            var letter = new ClaimLetter
            {
                ClaimId         = req.ClaimId,
                ClientId        = clientId,
                LetterCode      = $"LTR-{count:D4}",
                LetterType      = req.LetterType,
                LetterDate      = ParseDate(req.LetterDate),
                Subject         = req.Subject,
                LetterBody      = req.LetterBody,
                RecipientRole   = req.RecipientRole,
                RecipientName   = req.RecipientName,
                DeliveryMethod  = req.DeliveryMethod,
                RecipientEmail  = req.RecipientEmail,
                RecipientAddress= req.RecipientAddress,
                Priority        = req.Priority,
                FollowUp        = req.FollowUp,
                Status          = "Draft",
                CreatedBy       = userId,
                CreatedOn       = DateTimeOffset.UtcNow
            };

            _db.ClaimLetters.Add(letter);
            await _db.SaveChangesAsync();
            return letter.Id;
        }
    }

    public async Task<bool> SendAsync(long letterId, long clientId, long userId)
    {
        var letter = await _db.ClaimLetters
            .FirstOrDefaultAsync(l => l.Id == letterId && l.ClientId == clientId);

        if (letter == null) return false;

        letter.Status    = "Sent";
        letter.SendDate  = DateTimeOffset.UtcNow;
        letter.UpdatedBy = userId;
        letter.UpdatedOn = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(long letterId, long clientId)
    {
        var letter = await _db.ClaimLetters
            .FirstOrDefaultAsync(l => l.Id == letterId && l.ClientId == clientId);

        if (letter == null) return false;

        _db.ClaimLetters.Remove(letter);
        await _db.SaveChangesAsync();
        return true;
    }
}
