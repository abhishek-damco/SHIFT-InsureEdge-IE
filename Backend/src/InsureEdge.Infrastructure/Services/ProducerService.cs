// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
using InsureEdge.Application.DTOs.Distribution;
using InsureEdge.Application.Interfaces;
using InsureEdge.Application.Services;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace InsureEdge.Infrastructure.Services;

public class ProducerService(
    InsureEdgeDbContext db, ICurrentTenantService tenant, PasswordResetService passwordReset,
    ILogger<ProducerService> logger, IConfiguration config)
{
    public async Task<List<ProducerListItemDto>> GetByIntermediaryAsync(long intermediaryId)
    {
        var producers = await db.Producers
            .Where(p => p.ClientId == tenant.ClientId && p.IntermediaryId == intermediaryId)
            .OrderByDescending(p => p.CreatedOn)
            .ToListAsync();
        return producers.Select(Map).ToList();
    }

    public async Task<ProducerListItemDto?> GetByIdAsync(long id)
    {
        var p = await db.Producers.FirstOrDefaultAsync(x => x.Id == id && x.ClientId == tenant.ClientId);
        return p == null ? null : Map(p);
    }

    public async Task<(bool Success, string? Error, ProducerListItemDto? Producer)> CreateAsync(SaveProducerRequest req)
    {
        var intermediaryId = req.IntermediaryId ?? req.IntermediaryDbId;
        if (!intermediaryId.HasValue)
            return (false, "intermediary_id is required.", null);
        if (string.IsNullOrWhiteSpace(req.FirstName) || string.IsNullOrWhiteSpace(req.LastName))
            return (false, "First name and last name are required.", null);

        var intermediaryExists = await db.Intermediaries.AnyAsync(i => i.Id == intermediaryId.Value && i.ClientId == tenant.ClientId);
        if (!intermediaryExists)
            return (false, "Intermediary not found.", null);

        var producer = new Producer
        {
            ClientId = tenant.ClientId,
            IntermediaryId = intermediaryId.Value,
            ProducerCode = await NextCodeAsync(),
            Status = req.Status ?? "Active",
            StatusToggle = req.StatusToggle ?? true,
            FirstName = req.FirstName!,
            MiddleName = req.MiddleName,
            LastName = req.LastName!,
            PcLicenseRequirement = req.PcLicenseRequirement,
            Country = req.Country,
            ResidentialState = req.ResidentialState,
            PlLicense = req.PlLicense,
            ClLicense = req.ClLicense,
            PlclCombinedLicense = req.PlclCombinedLicense,
            TelephoneNumberCC = req.TelephoneNumberCC ?? "+1",
            TelephoneNumber = string.IsNullOrWhiteSpace(req.TelephoneNumber) ? "0000000000" : req.TelephoneNumber,
            AltTelephoneNumberCC = req.AltTelephoneNumberCC,
            AltTelephoneNumber = req.AltTelephoneNumber,
            Email = req.Email,
            IsManager = req.IsManager,
            ManagerId = req.ManagerId,
            Extension = req.Extension,
            Suffix = req.Suffix,
            CreatedBy = tenant.UserId,
        };
        db.Producers.Add(producer);
        await db.SaveChangesAsync();

        // Every Producer gets a linked external-user login automatically — no separate
        // "invite" step. Only requires an email on file (Producer can be created without
        // one and invited later via InviteAsync). The user row gets a default password
        // immediately (see CreateLinkedUserAsync), so login works even before/without the
        // onboarding email — any failure here is a missed email notification, not a
        // blocked login, so it's only logged, not surfaced to the caller.
        if (!string.IsNullOrWhiteSpace(producer.Email))
        {
            var (linked, linkError) = await CreateLinkedUserAsync(producer);
            if (!linked)
                logger.LogWarning(
                    "Producer {ProducerId} created without a linked user login: {Error}",
                    producer.Id, linkError);
        }

        return (true, null, Map(producer));
    }

    public async Task<(bool Success, string? Error, ProducerListItemDto? Producer)> UpdateAsync(long id, SaveProducerRequest req)
    {
        var p = await db.Producers.FirstOrDefaultAsync(x => x.Id == id && x.ClientId == tenant.ClientId);
        if (p == null) return (false, "Producer not found.", null);

        if (req.Status != null) p.Status = req.Status;
        if (req.StatusToggle.HasValue) p.StatusToggle = req.StatusToggle;
        if (req.FirstName != null) p.FirstName = req.FirstName;
        p.MiddleName = req.MiddleName;
        if (req.LastName != null) p.LastName = req.LastName;
        p.PcLicenseRequirement = req.PcLicenseRequirement;
        p.Country = req.Country;
        p.ResidentialState = req.ResidentialState;
        p.PlLicense = req.PlLicense;
        p.ClLicense = req.ClLicense;
        p.PlclCombinedLicense = req.PlclCombinedLicense;
        if (req.TelephoneNumberCC != null) p.TelephoneNumberCC = req.TelephoneNumberCC;
        if (req.TelephoneNumber != null) p.TelephoneNumber = req.TelephoneNumber;
        p.AltTelephoneNumberCC = req.AltTelephoneNumberCC;
        p.AltTelephoneNumber = req.AltTelephoneNumber;
        p.Email = req.Email;
        p.IsManager = req.IsManager;
        p.ManagerId = req.ManagerId;
        p.Extension = req.Extension;
        p.Suffix = req.Suffix;
        p.UpdatedBy = tenant.UserId;
        p.UpdatedOn = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return (true, null, Map(p));
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var p = await db.Producers.FirstOrDefaultAsync(x => x.Id == id && x.ClientId == tenant.ClientId);
        if (p == null) return false;
        db.Producers.Remove(p);
        await db.SaveChangesAsync();
        return true;
    }

    // Producer self-service login: invite this Producer to the portal. Recovery path for
    // a Producer created without an email on file (CreateAsync skips auto-creation in that
    // case) or whose auto-created user's onboarding email failed to send — both leave the
    // Producer with no linked "user" row, which this fills in on demand.
    public async Task<(bool Success, string? Error)> InviteAsync(long producerId)
    {
        var producer = await db.Producers.FirstOrDefaultAsync(p => p.Id == producerId && p.ClientId == tenant.ClientId);
        if (producer == null) return (false, "Producer not found.");
        if (string.IsNullOrWhiteSpace(producer.Email)) return (false, "Producer has no email on file.");

        var existing = await db.Users.FirstOrDefaultAsync(u => u.ProducerId == producerId);
        if (existing != null) return (false, "This producer has already been invited.");

        return await CreateLinkedUserAsync(producer);
    }

    // Creates the Producer's linked external-user login: a "user" row seeded with the
    // PRODUCER_DEFAULT_PASSWORD (so the Producer can log in immediately even if the
    // onboarding email below never arrives — e.g. SMTP not configured in this
    // environment), linked via ProducerId, and assigned the "Producers" group.
    // Deliberately no user_code, so it stays excluded from UsersController.GetAll (the same
    // filter staff/producer accounts both satisfy today for a different reason —
    // belt-and-braces with producer_id IS NULL).
    // Not transactional on email failure: unlike the old onboarding-only flow, the user row
    // is already usable (has a real password) the moment it's created, so a failed
    // onboarding email is just a missed "here's your account" notification, not a stuck
    // half-invited state — nothing to roll back.
    private async Task<(bool Success, string? Error)> CreateLinkedUserAsync(Producer producer)
    {
        var group = await db.Groups.FirstOrDefaultAsync(g => g.GroupName == "Producers" && g.ClientId == tenant.ClientId);
        if (group == null) return (false, "\"Producers\" permission group is not set up for this client.");

        var defaultPassword = config["PRODUCER_DEFAULT_PASSWORD"] ?? "Producer@123";

        var fullName = $"{producer.FirstName} {producer.LastName}".Trim();
        var user = new User
        {
            ClientId = tenant.ClientId,
            ProducerId = producer.Id,
            FirstName = producer.FirstName,
            LastName = producer.LastName,
            Email = producer.Email!,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(defaultPassword),
            IsActive = true,
            CreatedOn = DateTime.UtcNow,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        db.GroupUsers.Add(new GroupUser { UserId = user.Id, GroupId = group.Id, ClientId = tenant.ClientId });
        await db.SaveChangesAsync();

        try
        {
            var admin = await db.Users.FirstOrDefaultAsync(u => u.Id == tenant.UserId);
            await passwordReset.GenerateOnboardingTokenAsync(
                user.Id, user.Email, user.Email, fullName, adminEmail: admin?.Email ?? "");
        }
        catch (Exception ex)
        {
            // Email failed, but the user row (with its default password) already stands —
            // log and report, don't roll back.
            logger.LogWarning(ex,
                "Producer {ProducerId} user login created, but onboarding email failed to send.",
                producer.Id);
            return (true, $"User created with the default password, but the invitation email could not be sent: {ex.Message}");
        }

        return (true, null);
    }

    private async Task<string> NextCodeAsync()
    {
        var count = await db.Producers.CountAsync(p => p.ClientId == tenant.ClientId);
        return $"PC{(count + 1):D3}";
    }

    private static ProducerListItemDto Map(Producer p) => new(
        p.Id, p.IntermediaryId, p.ProducerCode, p.Status, p.StatusToggle,
        p.FirstName, p.MiddleName, p.LastName, p.PcLicenseRequirement, p.Country,
        p.ResidentialState, p.PlLicense, p.ClLicense, p.PlclCombinedLicense,
        p.TelephoneNumberCC, p.TelephoneNumber, p.AltTelephoneNumberCC, p.AltTelephoneNumber,
        p.Email, p.IsManager, p.ManagerId, p.Extension, p.Suffix);
}
