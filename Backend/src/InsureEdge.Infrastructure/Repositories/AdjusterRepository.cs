using InsureEdge.Application.DTOs.Adjuster;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Repositories;

public class AdjusterRepository : IAdjusterRepository
{
    private readonly InsureEdgeDbContext _db;

    public AdjusterRepository(InsureEdgeDbContext db) => _db = db;

    public async Task<List<TempAdjusterDto>> GetAllAsync(long clientId)
    {
        return await _db.TempAdjusters
            .Include(x => x.Licenses)
            .Where(x => x.ClientId == clientId)
            .OrderByDescending(x => x.CreatedOn)
            .Select(x => Map(x))
            .ToListAsync();
    }

    public async Task<TempAdjusterDto?> GetByIdAsync(long id, long clientId)
    {
        var adjuster = await _db.TempAdjusters
            .Include(x => x.Licenses)
            .FirstOrDefaultAsync(x => x.Id == id && x.ClientId == clientId);
        return adjuster == null ? null : Map(adjuster);
    }

    public async Task<TempAdjusterDto> CreateAsync(UpsertTempAdjusterRequest req, long clientId, long userId)
    {
        var row = new TempAdjuster
        {
            ClientId = clientId,
            UserCode = await NextUserCodeAsync(clientId),
            CreatedBy = userId,
            CreatedOn = DateTime.UtcNow
        };
        Apply(row, req);
        ReplaceLicenses(row, req.Licenses);
        _db.TempAdjusters.Add(row);
        await _db.SaveChangesAsync();
        return Map(row);
    }

    public async Task<TempAdjusterDto> UpdateAsync(long id, UpsertTempAdjusterRequest req, long clientId, long userId)
    {
        var row = await _db.TempAdjusters
            .Include(x => x.Licenses)
            .FirstOrDefaultAsync(x => x.Id == id && x.ClientId == clientId)
            ?? throw new KeyNotFoundException($"Adjuster {id} not found.");

        Apply(row, req);
        row.UpdatedBy = userId;
        row.UpdatedOn = DateTime.UtcNow;
        ReplaceLicenses(row, req.Licenses);
        await _db.SaveChangesAsync();
        return Map(row);
    }

    private async Task<string> NextUserCodeAsync(long clientId)
    {
        var count = await _db.TempAdjusters.CountAsync(x => x.ClientId == clientId);
        return $"ADJ-{count + 1:000}";
    }

    private void ReplaceLicenses(TempAdjuster row, List<TempAdjusterLicenseDto>? licenses)
    {
        if (licenses == null) return;
        row.Licenses.Clear();
        foreach (var license in licenses)
        {
            row.Licenses.Add(new TempAdjusterLicense
            {
                LicensedState = license.LicensedState,
                LicenseNumber = license.LicenseNumber,
                LicenseStartDate = license.LicenseStartDate,
                LicenseExpirationDate = license.LicenseExpirationDate
            });
        }
    }

    private static void Apply(TempAdjuster row, UpsertTempAdjusterRequest req)
    {
        row.FirstName = req.FirstName;
        row.MiddleName = req.MiddleName;
        row.LastName = req.LastName;
        row.DateOfBirth = req.DateOfBirth;
        row.Ssn = req.Ssn;
        row.TaxId = req.TaxId;
        row.Role = req.Role;
        row.AdjusterType = req.AdjusterType;
        row.Status = req.Status;
        row.ClaimTypesHandled = req.ClaimTypesHandled;
        row.TerritoryType = req.TerritoryType;
        row.TerritoriesAssigned = req.TerritoriesAssigned;
        row.PreferredCommunication = req.PreferredCommunication;
        row.TelephoneNumber = req.TelephoneNumber;
        row.Extension = req.Extension;
        row.AlternativeTelephoneNumber = req.AlternativeTelephoneNumber;
        row.EmailId = req.EmailId;
        row.RegisteredAddressLine1 = req.RegisteredAddressLine1;
        row.RegisteredAddressLine2 = req.RegisteredAddressLine2;
        row.RegisteredCountry = req.RegisteredCountry;
        row.RegisteredState = req.RegisteredState;
        row.RegisteredCity = req.RegisteredCity;
        row.RegisteredCounty = req.RegisteredCounty;
        row.RegisteredZipCode = req.RegisteredZipCode;
        row.RegisteredLatitude = req.RegisteredLatitude;
        row.RegisteredLongitude = req.RegisteredLongitude;
        row.MailingAddressLine1 = req.MailingAddressLine1;
        row.MailingAddressLine2 = req.MailingAddressLine2;
        row.MailingCountry = req.MailingCountry;
        row.MailingState = req.MailingState;
        row.MailingCity = req.MailingCity;
        row.MailingCounty = req.MailingCounty;
        row.MailingZipCode = req.MailingZipCode;
        row.MailingLatitude = req.MailingLatitude;
        row.MailingLongitude = req.MailingLongitude;
        row.PaymentMethod = req.PaymentMethod;
        row.RatePerHour = req.RatePerHour;
        row.ComplianceFlag = req.ComplianceFlag;
        row.AccessJson = req.AccessJson;
    }

    private static TempAdjusterDto Map(TempAdjuster x) => new(
        x.Id, x.UserCode, x.FirstName, x.MiddleName, x.LastName, x.DateOfBirth, x.Ssn, x.TaxId,
        x.Role, x.AdjusterType, x.Status, x.ClaimTypesHandled, x.TerritoryType, x.TerritoriesAssigned,
        x.PreferredCommunication, x.TelephoneNumber, x.Extension, x.AlternativeTelephoneNumber, x.EmailId,
        x.RegisteredAddressLine1, x.RegisteredAddressLine2, x.RegisteredCountry, x.RegisteredState,
        x.RegisteredCity, x.RegisteredCounty, x.RegisteredZipCode, x.RegisteredLatitude, x.RegisteredLongitude,
        x.MailingAddressLine1, x.MailingAddressLine2, x.MailingCountry, x.MailingState, x.MailingCity,
        x.MailingCounty, x.MailingZipCode, x.MailingLatitude, x.MailingLongitude, x.PaymentMethod,
        x.RatePerHour, x.ComplianceFlag, x.AccessJson,
        x.Licenses.Select(l => new TempAdjusterLicenseDto(l.Id, l.LicensedState, l.LicenseNumber, l.LicenseStartDate, l.LicenseExpirationDate)).ToList(),
        x.CreatedOn.ToString("MM-dd-yyyy"));
}
