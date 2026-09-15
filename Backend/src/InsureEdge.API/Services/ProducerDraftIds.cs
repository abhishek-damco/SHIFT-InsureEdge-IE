using System.Globalization;
using System.Security.Cryptography;
using System.Text.Json;
using InsureEdge.Infrastructure.Data;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.API.Services;

// Reservations consume the producer table's existing BIGSERIAL sequence, never a
// count/max-derived number. Cancelled drafts intentionally leave sequence gaps.
public sealed class ProducerDraftIds(InsureEdgeDbContext db, IDataProtectionProvider protection)
{
    private readonly IDataProtector _protector = protection.CreateProtector("Distribution.ProducerDraftId.v1");

    public async Task<ProducerDraftReservation> ReserveAsync(long clientId, long userId, long intermediaryId)
    {
        while (true)
        {
            var id = await db.Database.SqlQuery<long>(
                $"SELECT nextval(pg_get_serial_sequence('producer', 'id')) AS \"Value\"").SingleAsync();
            var code = FormatCode(id);
            // Also respect legacy/imported values if they predate the sequence.
            if (await db.Producers.AnyAsync(p => p.Id == id || p.ProducerCode == code)) continue;
            return new ProducerDraftReservation(code, Protect(id, clientId, userId, intermediaryId));
        }
    }

    public static string FormatCode(long id)
    {
        if (id is < 1 or > 99999999)
            throw new InvalidOperationException("The eight-digit producer number range is exhausted. No ID has been reused.");
        return "PR" + id.ToString("D8", CultureInfo.InvariantCulture);
    }

    public string Protect(long id, long clientId, long userId, long intermediaryId)
    {
        _ = FormatCode(id);
        return _protector.Protect(JsonSerializer.Serialize(new ReservedProducerId(id, clientId, userId, intermediaryId)));
    }

    public bool TryRead(string token, long clientId, long userId, long intermediaryId, out ReservedProducerId? reservation)
    {
        reservation = null;
        try
        {
            var value = JsonSerializer.Deserialize<ReservedProducerId>(_protector.Unprotect(token));
            if (value is null || value.Id is < 1 or > 99999999 || value.ClientId != clientId ||
                value.UserId != userId || value.IntermediaryId != intermediaryId) return false;
            reservation = value;
            return true;
        }
        catch (Exception error) when (error is CryptographicException or JsonException or ArgumentException)
        {
            return false;
        }
    }
}

public sealed record ReservedProducerId(long Id, long ClientId, long UserId, long IntermediaryId);
public sealed record ProducerDraftReservation(
    [property: System.Text.Json.Serialization.JsonPropertyName("producer_code")] string ProducerCode,
    [property: System.Text.Json.Serialization.JsonPropertyName("producer_draft_token")] string Token);
