// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
using InsureEdge.Application.DTOs.Client;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Repositories;

public class ClientRepository(InsureEdgeDbContext db) : IClientRepository
{
    // ── List ──────────────────────────────────────────────────────────────────
    public async Task<(List<ClientListItemDto> Items, int Total)> GetListAsync(
        long clientId, string? search, int page, int pageSize)
    {
        // In the SHIFT platform the "client management" list is visible only to
        // a platform admin who sees ALL clients (or the current tenant's record).
        // For now we return the single tenant client plus any sub-clients if needed.
        var q = db.Clients.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(c => c.CompanyName.Contains(search) || (c.ClientCode != null && c.ClientCode.Contains(search)));

        var total = await q.CountAsync();
        var items = await q
            .OrderBy(c => c.CompanyName)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(c => new ClientListItemDto(
                c.Id,
                c.ClientCode ?? c.Id.ToString("D5"),
                c.CompanyName,
                c.Status,
                c.TypeOfCompany ?? "-",
                c.NaicCode,
                c.EmailId,
                c.TelephoneNumber,
                c.DomicileCountry,
                c.StateOfDomicile,
                c.CreatedOn.ToString("MM-dd-yyyy")))
            .ToListAsync();
        return (items, total);
    }

    // ── Detail ─────────────────────────────────────────────────────────────────
    public async Task<ClientDetailDto?> GetDetailAsync(long clientId)
    {
        var c = await db.Clients
            .Include(x => x.Addresses)
            .Include(x => x.Contacts)
            .Include(x => x.Offices)
            .Include(x => x.Companies)
                .ThenInclude(co => co.Addresses)
            .Include(x => x.Companies)
                .ThenInclude(co => co.Contacts)
            .FirstOrDefaultAsync(x => x.Id == clientId);

        if (c == null) return null;

        var legal   = c.Addresses.FirstOrDefault(a => a.AddressType == "Legal");
        var mailing = c.Addresses.FirstOrDefault(a => a.AddressType == "Mailing");
        var contact = c.Contacts.FirstOrDefault(ct => ct.ContactType == "Primary");

        return new ClientDetailDto(
            c.Id,
            c.ClientCode ?? c.Id.ToString("D5"),
            c.CompanyName,
            c.Status,
            c.TypeOfCompany,
            c.NaicCode,
            c.RegisteredTradeMark,
            c.DomicileCountry,
            c.StateOfDomicile,
            c.StateAllowedToOperate,
            c.FederalTaxId,
            c.OwnedBy,
            c.NumberOfEmployees,
            c.EstDirectWrittenPremium,
            c.YearBusinessStarted,
            c.BusinessDescription,
            c.EmailId,
            c.TelephoneNumber,
            c.TelephoneNumberCc,
            c.Extension,
            c.ClientUrl,
            c.ClientOnboardingDate?.ToString("MM-dd-yyyy"),
            c.ClientRegistrationDate?.ToString("MM-dd-yyyy"),
            c.LogoData != null ? Convert.ToBase64String(c.LogoData) : null,
            c.LogoContentType,
            MapAddress(legal),
            MapAddress(mailing),
            MapContact(contact),
            c.Offices.Select(MapOffice).ToList(),
            c.Companies.Select(MapCompany).ToList(),
            c.CreatedOn.ToString("MM-dd-yyyy"),
            c.UpdatedOn?.ToString("MM-dd-yyyy")
        );
    }

    // ── Update client info ─────────────────────────────────────────────────────
    public async Task UpdateInfoAsync(long clientId, SaveClientInfoRequest req, long userId)
    {
        var c = await db.Clients.FindAsync(clientId)
            ?? throw new KeyNotFoundException($"Client {clientId} not found.");

        c.CompanyName = req.CompanyName;
        c.TypeOfCompany = req.TypeOfCompany;
        c.NaicCode = req.NaicCode;
        c.RegisteredTradeMark = req.RegisteredTradeMark;
        c.DomicileCountry = req.DomicileCountry;
        c.StateOfDomicile = req.StateOfDomicile;
        c.StateAllowedToOperate = req.StateAllowedToOperate;
        c.FederalTaxId = req.FederalTaxId;
        c.OwnedBy = req.OwnedBy;
        c.NumberOfEmployees = req.NumberOfEmployees;
        c.EstDirectWrittenPremium = req.EstDirectWrittenPremium;
        c.YearBusinessStarted = req.YearBusinessStarted;
        c.BusinessDescription = req.BusinessDescription;
        c.EmailId = req.EmailId;
        c.TelephoneNumber = req.TelephoneNumber;
        c.TelephoneNumberCc = req.TelephoneNumberCc;
        c.Extension = req.Extension;
        c.ClientUrl = req.ClientUrl;
        c.Status = req.Status ?? c.Status;
        if (DateOnly.TryParse(req.ClientOnboardingDate, out var od)) c.ClientOnboardingDate = od;
        if (!string.IsNullOrEmpty(req.LogoBase64))
        {
            c.LogoData = Convert.FromBase64String(req.LogoBase64);
            c.LogoContentType = req.LogoContentType;
            c.LogoFileName = req.LogoFileName;
        }
        c.UpdatedBy = userId;
        c.UpdatedOn = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
    }

    // ── Address ────────────────────────────────────────────────────────────────
    public async Task SaveAddressAsync(long clientId, SaveAddressRequest req, long userId)
    {
        var addr = await db.ClientAddresses
            .FirstOrDefaultAsync(a => a.ClientId == clientId && a.AddressType == req.AddressType);

        if (addr == null)
        {
            addr = new ClientAddress { ClientId = clientId };
            db.ClientAddresses.Add(addr);
        }
        addr.AddressType = req.AddressType;
        addr.AddressLine1 = req.AddressLine1;
        addr.AddressLine2 = req.AddressLine2;
        addr.Country = req.Country;
        addr.State = req.State;
        addr.City = req.City;
        addr.County = req.County;
        addr.ZipCode = req.ZipCode;
        addr.Latitude = req.Latitude;
        addr.Longitude = req.Longitude;
        addr.IsManual = req.IsManual;
        await db.SaveChangesAsync();
    }

    // ── Contact ────────────────────────────────────────────────────────────────
    public async Task SaveContactAsync(long clientId, SaveContactRequest req, long userId)
    {
        var ct = await db.ClientContacts
            .FirstOrDefaultAsync(c => c.ClientId == clientId && c.ContactType == "Primary");

        if (ct == null)
        {
            ct = new ClientContact { ClientId = clientId, ContactType = "Primary" };
            db.ClientContacts.Add(ct);
        }
        ct.Name = req.Name;
        ct.Suffix = req.Suffix;
        ct.Title = req.Title;
        ct.EmailId = req.EmailId;
        ct.TelephoneNumber = req.TelephoneNumber;
        ct.TelephoneNumberCc = req.TelephoneNumberCc;
        ct.Extension = req.Extension;
        ct.AltTelephoneNumber = req.AltTelephoneNumber;
        ct.AltTelephoneNumberCc = req.AltTelephoneNumberCc;
        await db.SaveChangesAsync();
    }

    // ── Office ─────────────────────────────────────────────────────────────────
    public async Task<long> SaveOfficeAsync(long clientId, SaveOfficeRequest req, long userId)
    {
        ClientOffice office;
        if (req.Id.HasValue)
        {
            office = await db.ClientOffices
                .FirstOrDefaultAsync(o => o.Id == req.Id.Value && o.ClientId == clientId)
                ?? throw new KeyNotFoundException("Office not found.");
            office.UpdatedBy = userId;
            office.UpdatedOn = DateTimeOffset.UtcNow;
        }
        else
        {
            office = new ClientOffice { ClientId = clientId, CreatedBy = userId, CreatedOn = DateTimeOffset.UtcNow };
            db.ClientOffices.Add(office);
        }
        office.OfficeName = req.OfficeName;
        office.OfficeType = req.OfficeType;
        office.AddressLine1 = req.AddressLine1;
        office.AddressLine2 = req.AddressLine2;
        office.Country = req.Country;
        office.State = req.State;
        office.City = req.City;
        office.County = req.County;
        office.ZipCode = req.ZipCode;
        office.Latitude = req.Latitude;
        office.Longitude = req.Longitude;
        office.ContactName = req.ContactName;
        office.ContactSuffix = req.ContactSuffix;
        office.ContactTitle = req.ContactTitle;
        office.ContactEmail = req.ContactEmail;
        office.ContactPhone = req.ContactPhone;
        office.ContactPhoneCc = req.ContactPhoneCc;
        office.ContactExt = req.ContactExt;
        office.ContactAltPhone = req.ContactAltPhone;
        office.ContactAltPhoneCc = req.ContactAltPhoneCc;
        await db.SaveChangesAsync();
        return office.Id;
    }

    public async Task DeleteOfficeAsync(long clientId, long officeId)
    {
        var office = await db.ClientOffices
            .FirstOrDefaultAsync(o => o.Id == officeId && o.ClientId == clientId)
            ?? throw new KeyNotFoundException("Office not found.");
        db.ClientOffices.Remove(office);
        await db.SaveChangesAsync();
    }

    // ── Company ────────────────────────────────────────────────────────────────
    public async Task<long> SaveCompanyAsync(long clientId, SaveCompanyRequest req, long userId)
    {
        ClientCompany company;
        if (req.Id.HasValue)
        {
            company = await db.ClientCompanies
                .Include(x => x.Addresses)
                .Include(x => x.Contacts)
                .FirstOrDefaultAsync(c => c.Id == req.Id.Value && c.ClientId == clientId)
                ?? throw new KeyNotFoundException("Company not found.");
            company.UpdatedBy = userId;
            company.UpdatedOn = DateTimeOffset.UtcNow;
        }
        else
        {
            var seq = await db.Database.SqlQueryRaw<long>("SELECT nextval('company_code_seq') AS \"Value\"").FirstAsync();
            company = new ClientCompany
            {
                ClientId = clientId,
                CompanyCode = seq.ToString("D5"),
                CreatedBy = userId,
                CreatedOn = DateTimeOffset.UtcNow
            };
            db.ClientCompanies.Add(company);
        }
        company.CompanyName = req.CompanyName;
        company.DomicileCountry = req.DomicileCountry;
        company.StateOfDomicile = req.StateOfDomicile;
        company.NaicCode = req.NaicCode;
        company.EmailId = req.EmailId;
        company.TelephoneNumber = req.TelephoneNumber;
        company.TelephoneNumberCc = req.TelephoneNumberCc;
        company.Extension = req.Extension;
        company.FederalTaxId = req.FederalTaxId;
        company.Url = req.Url;
        company.BusinessDescription = req.BusinessDescription;
        company.Status = req.Status ?? company.Status;
        if (!string.IsNullOrEmpty(req.LogoBase64))
        {
            company.LogoData = Convert.FromBase64String(req.LogoBase64);
            company.LogoContentType = req.LogoContentType;
            company.LogoFileName = req.LogoFileName;
        }
        await db.SaveChangesAsync();

        if (req.LegalAddress != null) await SaveCompanyAddressAsync(company.Id, req.LegalAddress with { AddressType = "Legal" });
        if (req.MailingAddress != null) await SaveCompanyAddressAsync(company.Id, req.MailingAddress with { AddressType = "Mailing" });
        if (req.PrimaryContact != null) await SaveCompanyContactAsync(company.Id, req.PrimaryContact);

        return company.Id;
    }

    public async Task DeleteCompanyAsync(long clientId, long companyId)
    {
        var company = await db.ClientCompanies
            .FirstOrDefaultAsync(c => c.Id == companyId && c.ClientId == clientId)
            ?? throw new KeyNotFoundException("Company not found.");
        db.ClientCompanies.Remove(company);
        await db.SaveChangesAsync();
    }

    public async Task SaveCompanyAddressAsync(long companyId, SaveAddressRequest req)
    {
        var addr = await db.CompanyAddresses
            .FirstOrDefaultAsync(a => a.CompanyId == companyId && a.AddressType == req.AddressType);

        if (addr == null)
        {
            addr = new CompanyAddress { CompanyId = companyId };
            db.CompanyAddresses.Add(addr);
        }
        addr.AddressType = req.AddressType;
        addr.AddressLine1 = req.AddressLine1;
        addr.AddressLine2 = req.AddressLine2;
        addr.Country = req.Country;
        addr.State = req.State;
        addr.City = req.City;
        addr.County = req.County;
        addr.ZipCode = req.ZipCode;
        addr.Latitude = req.Latitude;
        addr.Longitude = req.Longitude;
        addr.IsManual = req.IsManual;
        await db.SaveChangesAsync();
    }

    public async Task SaveCompanyContactAsync(long companyId, SaveContactRequest req)
    {
        var ct = await db.CompanyContacts
            .FirstOrDefaultAsync(c => c.CompanyId == companyId && c.ContactType == "Primary");

        if (ct == null)
        {
            ct = new CompanyContact { CompanyId = companyId, ContactType = "Primary" };
            db.CompanyContacts.Add(ct);
        }
        ct.Name = req.Name;
        ct.Suffix = req.Suffix;
        ct.Title = req.Title;
        ct.EmailId = req.EmailId;
        ct.TelephoneNumber = req.TelephoneNumber;
        ct.TelephoneNumberCc = req.TelephoneNumberCc;
        ct.Extension = req.Extension;
        ct.AltTelephoneNumber = req.AltTelephoneNumber;
        ct.AltTelephoneNumberCc = req.AltTelephoneNumberCc;
        await db.SaveChangesAsync();
    }

    // ── Products ───────────────────────────────────────────────────────────────
    public async Task<List<ProductDto>> GetAllProductsAsync()
        => await db.InsuranceProducts
            .Where(p => p.IsActive)
            .OrderBy(p => p.Category).ThenBy(p => p.ProductName)
            .Select(p => new ProductDto(p.Id, p.ProductName, p.Category))
            .ToListAsync();

    public async Task<List<ProductAccessDto>> GetProductAccessAsync(long companyId)
    {
        var products = await db.InsuranceProducts
            .Include(p => p.SubProducts)
            .Where(p => p.IsActive)
            .ToListAsync();

        var accessList = await db.CompanyProductAccess
            .Include(a => a.SelectedSubProducts).ThenInclude(sp => sp.SubProduct)
            .Include(a => a.Jurisdictions)
            .Where(a => a.CompanyId == companyId)
            .ToListAsync();

        return products.Select(p =>
        {
            var access = accessList.FirstOrDefault(a => a.ProductId == p.Id);
            var selectedIds = access?.SelectedSubProducts.Select(s => s.SubProductId).ToHashSet() ?? [];
            return new ProductAccessDto(
                p.Id,
                p.ProductName,
                p.Category,
                selectedIds.Count,
                access?.Jurisdictions.Count ?? 0,
                p.SubProducts.Select(s => new SubProductDto(s.Id, s.SubProductName, selectedIds.Contains(s.Id))).ToList(),
                access?.Jurisdictions.Select(j => new JurisdictionDto(j.StateCode, j.StateName)).ToList() ?? []
            );
        }).ToList();
    }

    public async Task SaveProductAccessAsync(long companyId, SaveProductAccessRequest req)
    {
        var access = await db.CompanyProductAccess
            .Include(a => a.SelectedSubProducts)
            .Include(a => a.Jurisdictions)
            .FirstOrDefaultAsync(a => a.CompanyId == companyId && a.ProductId == req.ProductId);

        if (access == null)
        {
            access = new CompanyProductAccess { CompanyId = companyId, ProductId = req.ProductId };
            db.CompanyProductAccess.Add(access);
            await db.SaveChangesAsync();
        }

        // Replace sub-products
        db.CompanyProductSubProducts.RemoveRange(access.SelectedSubProducts);
        foreach (var spId in req.SubProductIds)
            db.CompanyProductSubProducts.Add(new CompanyProductSubProduct { AccessId = access.Id, SubProductId = spId });

        // Replace jurisdictions
        db.CompanyProductJurisdictions.RemoveRange(access.Jurisdictions);
        foreach (var j in req.Jurisdictions)
            db.CompanyProductJurisdictions.Add(new CompanyProductJurisdiction { AccessId = access.Id, StateCode = j.StateCode, StateName = j.StateName });

        await db.SaveChangesAsync();
    }

    // ── Mapping helpers ────────────────────────────────────────────────────────
    private static AddressDto? MapAddress(ClientAddress? a) => a == null ? null : new AddressDto(
        a.Id, a.AddressType, a.AddressLine1, a.AddressLine2,
        a.Country, a.State, a.City, a.County, a.ZipCode, a.Latitude, a.Longitude, a.IsManual);

    private static AddressDto? MapCompanyAddress(CompanyAddress? a) => a == null ? null : new AddressDto(
        a.Id, a.AddressType, a.AddressLine1, a.AddressLine2,
        a.Country, a.State, a.City, a.County, a.ZipCode, a.Latitude, a.Longitude, a.IsManual);

    private static ContactDto? MapContact(ClientContact? c) => c == null ? null : new ContactDto(
        c.Id, c.ContactType, c.Name, c.Suffix, c.Title, c.EmailId,
        c.TelephoneNumber, c.TelephoneNumberCc, c.Extension,
        c.AltTelephoneNumber, c.AltTelephoneNumberCc);

    private static ContactDto? MapCompanyContact(CompanyContact? c) => c == null ? null : new ContactDto(
        c.Id, c.ContactType, c.Name, c.Suffix, c.Title, c.EmailId,
        c.TelephoneNumber, c.TelephoneNumberCc, c.Extension,
        c.AltTelephoneNumber, c.AltTelephoneNumberCc);

    private static OfficeDto MapOffice(ClientOffice o) => new(
        o.Id, o.OfficeName, o.OfficeType,
        o.AddressLine1, o.AddressLine2, o.Country, o.State, o.City, o.County, o.ZipCode, o.Latitude, o.Longitude,
        o.ContactName, o.ContactSuffix, o.ContactTitle, o.ContactEmail,
        o.ContactPhone, o.ContactPhoneCc, o.ContactExt, o.ContactAltPhone, o.ContactAltPhoneCc);

    private static CompanyDto MapCompany(ClientCompany co)
    {
        var legal   = co.Addresses.FirstOrDefault(a => a.AddressType == "Legal");
        var mailing = co.Addresses.FirstOrDefault(a => a.AddressType == "Mailing");
        var contact = co.Contacts.FirstOrDefault(ct => ct.ContactType == "Primary");
        return new CompanyDto(
            co.Id, co.CompanyCode, co.CompanyName, co.Status,
            co.DomicileCountry, co.StateOfDomicile, co.NaicCode,
            co.EmailId, co.TelephoneNumber, co.TelephoneNumberCc, co.Extension,
            co.FederalTaxId, co.Url, co.BusinessDescription,
            co.LogoData != null ? Convert.ToBase64String(co.LogoData) : null,
            co.LogoContentType,
            MapCompanyAddress(legal),
            MapCompanyAddress(mailing),
            MapCompanyContact(contact),
            co.CreatedOn.ToString("MM-dd-yyyy"),
            co.UpdatedOn?.ToString("MM-dd-yyyy")
        );
    }
}
