using System.Text.Json;
using InsureEdge.API.Services;
using Npgsql;
using System.Text.Json.Serialization;
using InsureEdge.API.Filters;
using InsureEdge.Application.Interfaces;
using InsureEdge.Application.Validation;
using InsureEdge.Domain.Entities;
using InsureEdge.Domain.Enums;
using InsureEdge.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.API.Controllers;

[ApiController]
[Authorize]
[Route("api/distribution")]
public class DistributionController : ControllerBase
{
    private static readonly HashSet<string> UsStateCodes = new(StringComparer.OrdinalIgnoreCase)
    {
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
        "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
        "VA", "WA", "WV", "WI", "WY"
    };
    private readonly InsureEdgeDbContext _db;
    private readonly ICurrentTenantService _tenant;
    private readonly ProducerDraftIds _draftIds;

    public DistributionController(InsureEdgeDbContext db, ICurrentTenantService tenant, ProducerDraftIds draftIds)
    {
        _db = db;
        _tenant = tenant;
        _draftIds = draftIds;
    }

    [HttpGet("intermediaries")]
    public async Task<IActionResult> GetIntermediaries()
    {
        var clientId = _tenant.ClientId;
        var rows = await _db.Intermediaries
            .Where(i => i.ClientId == clientId)
            .OrderBy(i => i.IntermediaryName)
            .ToListAsync();

        return Ok(rows.Select(ToIntermediaryResponse));
    }

    [HttpGet("intermediaries/{id:long}")]
    public async Task<IActionResult> GetIntermediary(long id)
    {
        var intermediary = await FindIntermediary(id);
        return intermediary == null ? NotFound() : Ok(ToIntermediaryResponse(intermediary));
    }

    [HttpPost("intermediaries")]
    public async Task<IActionResult> CreateIntermediary([FromBody] UpsertIntermediaryRequest request)
    {
        var clientId = _tenant.ClientId;
        var usedCodes = (await _db.Intermediaries
            .Where(i => i.ClientId == clientId)
            .Select(i => i.IntermediaryCode)
            .ToListAsync()).ToHashSet();

        var intermediary = new Intermediary
        {
            ClientId = clientId,
            CreatedBy = _tenant.UserId,
            CreatedOn = DateTime.UtcNow,
            IntermediaryCode = NextCode("IM", usedCodes),
        };

        await using var transaction = await _db.Database.BeginTransactionAsync();
        ApplyIntermediary(intermediary, request);
        _db.Intermediaries.Add(intermediary);
        await _db.SaveChangesAsync();
        if (request.Address != null)
        {
            var address = new IntermediaryAddress { ClientId = clientId, IntermediaryId = intermediary.Id, CreatedBy = _tenant.UserId };
            ApplyAddress(address, request.Address); _db.IntermediaryAddresses.Add(address);
        }
        foreach (var contactRequest in request.Contacts ?? [])
        {
            var contact = new IntermediaryContact { ClientId = clientId, IntermediaryId = intermediary.Id, CreatedBy = _tenant.UserId };
            ApplyContact(contact, contactRequest); _db.IntermediaryContacts.Add(contact);
        }
        foreach (var stateRequest in request.NrStates ?? [])
        {
            if (string.IsNullOrWhiteSpace(stateRequest.State)) return BadRequest(new { error = "Non-resident state is required." });
            _db.IntermediaryNrStates.Add(new IntermediaryNrState { ClientId = clientId, IntermediaryId = intermediary.Id, State = stateRequest.State.Trim(), License = stateRequest.License, IsAvailableInSearch = stateRequest.IsAvailableInSearch, CreatedBy = _tenant.UserId });
        }
        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(ToIntermediaryResponse(intermediary));
    }

    [HttpPut("intermediaries/{id:long}")]
    public async Task<IActionResult> UpdateIntermediary(long id, [FromBody] UpsertIntermediaryRequest request)
    {
        var intermediary = await FindIntermediary(id);
        if (intermediary == null) return NotFound();

        ApplyIntermediary(intermediary, request);
        intermediary.UpdatedBy = _tenant.UserId;
        intermediary.UpdatedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ToIntermediaryResponse(intermediary));
    }

    [HttpDelete("intermediaries/{id:long}")]
    public async Task<IActionResult> DeleteIntermediary(long id)
    {
        var intermediary = await FindIntermediary(id);
        if (intermediary == null) return NotFound();

        _db.Intermediaries.Remove(intermediary);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("producers/by-intermediary/{intermediaryId:long}")]
    public async Task<IActionResult> GetProducersByIntermediary(long intermediaryId)
    {
        var clientId = _tenant.ClientId;
        var intermediaryExists = await _db.Intermediaries.AnyAsync(i => i.Id == intermediaryId && i.ClientId == clientId);
        if (!intermediaryExists) return NotFound();

        var rows = await _db.Producers
            .Where(p => p.ClientId == clientId && p.IntermediaryId == intermediaryId && p.Status == "Active")
            .OrderBy(p => p.FirstName)
            .ThenBy(p => p.LastName)
            .ToListAsync();

        return Ok(rows.Select(ToProducerResponse));
    }

    [HttpGet("producers/{id:long}")]
    public async Task<IActionResult> GetProducer(long id)
    {
        var producer = await FindProducer(id);
        return producer == null ? NotFound() : Ok(ToProducerResponse(producer));
    }

    [HttpPost("producers/reserve-id/{intermediaryId:long}")]
    public async Task<IActionResult> ReserveProducerId(long intermediaryId)
    {
        if (!await _db.Intermediaries.AnyAsync(i => i.Id == intermediaryId && i.ClientId == _tenant.ClientId))
            return NotFound();
        try { return Ok(await _draftIds.ReserveAsync(_tenant.ClientId, _tenant.UserId, intermediaryId)); }
        catch (InvalidOperationException error) { return Conflict(new { error = error.Message }); }
    }

    [HttpPost("producers")]
    public async Task<IActionResult> CreateProducer([FromBody] UpsertProducerRequest request)
    {
        var clientId = _tenant.ClientId;
        var intermediaryExists = await _db.Intermediaries.AnyAsync(i => i.Id == request.IntermediaryId && i.ClientId == clientId);
        if (!intermediaryExists) return BadRequest(new { error = "Intermediary not found." });

        var licenseError = ProducerLicenseValidator.Validate(
            request.ResolvedPcLicenseRequirement(),
            request.PlLicense,
            request.ClLicense,
            request.PlclCombinedLicense);
        if (licenseError != null) return BadRequest(new { error = licenseError });

        ReservedProducerId? reservation = null;
        if (!string.IsNullOrEmpty(request.ProducerDraftToken))
        {
            if (!_draftIds.TryRead(request.ProducerDraftToken, clientId, _tenant.UserId, request.IntermediaryId, out reservation))
                return BadRequest(new { error = "This producer ID reservation is invalid for the current user or intermediary." });
            var existing = await FindProducer(reservation!.Id);
            if (existing != null)
            {
                // A retry after a successful commit must not insert or overwrite a producer.
                return existing.IntermediaryId == request.IntermediaryId && existing.ProducerCode == ProducerDraftIds.FormatCode(reservation.Id)
                    ? Ok(ToProducerResponse(existing)) : Conflict(new { error = "The reserved producer ID is already in use." });
            }
        }

        var usedCodes = (await _db.Producers
            .Where(p => p.ClientId == clientId)
            .Select(p => p.ProducerCode)
            .ToListAsync()).ToHashSet();

        var producer = new Producer
        {
            Id = reservation?.Id ?? 0,
            ClientId = clientId,
            IntermediaryId = request.IntermediaryId,
            CreatedBy = _tenant.UserId,
            CreatedOn = DateTime.UtcNow,
            ProducerCode = reservation is null ? NextCode("PR", usedCodes) : ProducerDraftIds.FormatCode(reservation.Id),
        };

        await using var transaction = await _db.Database.BeginTransactionAsync();
        ApplyProducer(producer, request);
        _db.Producers.Add(producer);
        try { await _db.SaveChangesAsync(); }
        catch (DbUpdateException error) when (reservation != null && error.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            _db.Entry(producer).State = EntityState.Detached;
            var existing = await FindProducer(reservation.Id);
            if (existing != null && existing.IntermediaryId == request.IntermediaryId && existing.ProducerCode == producer.ProducerCode)
                return Ok(ToProducerResponse(existing));
            return Conflict(new { error = "The reserved producer ID is already in use." });
        }

        if (request.Address != null)
        {
            var address = new ProducerAddress { ClientId = clientId, ProducerId = producer.Id, CreatedBy = _tenant.UserId };
            ApplyAddress(address, request.Address); _db.ProducerAddresses.Add(address);
        }
        foreach (var stateRequest in request.NrStates ?? [])
        {
            if (string.IsNullOrWhiteSpace(stateRequest.State)) return BadRequest(new { error = "Non-resident state is required." });
            _db.ProducerNrStates.Add(new ProducerNrState { ClientId = clientId, ProducerId = producer.Id, State = stateRequest.State.Trim(), LicenseNumber = stateRequest.LicenseNumber, IsAvailableInSearch = stateRequest.IsAvailableInSearch, CreatedBy = _tenant.UserId });
        }
        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(ToProducerResponse(producer));
    }

    [HttpPut("producers/{id:long}")]
    public async Task<IActionResult> UpdateProducer(long id, [FromBody] UpsertProducerRequest request)
    {
        var producer = await FindProducer(id);
        if (producer == null) return NotFound();

        var clientId = _tenant.ClientId;
        var intermediaryExists = await _db.Intermediaries.AnyAsync(i => i.Id == request.IntermediaryId && i.ClientId == clientId);
        if (!intermediaryExists) return BadRequest(new { error = "Intermediary not found." });

        var licenseError = ProducerLicenseValidator.Validate(
            request.ResolvedPcLicenseRequirement(),
            request.PlLicense,
            request.ClLicense,
            request.PlclCombinedLicense);
        if (licenseError != null) return BadRequest(new { error = licenseError });

        producer.IntermediaryId = request.IntermediaryId;
        producer.UpdatedBy = _tenant.UserId;
        producer.UpdatedOn = DateTime.UtcNow;
        ApplyProducer(producer, request);
        await _db.SaveChangesAsync();

        return Ok(ToProducerResponse(producer));
    }

    [HttpDelete("producers/{id:long}")]
    public async Task<IActionResult> DeleteProducer(long id)
    {
        var producer = await FindProducer(id);
        if (producer == null) return NotFound();

        _db.Producers.Remove(producer);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts([FromQuery(Name = "is_sub_product")] bool? isSubProduct)
    {
        const string specialtyLabel = "Specialty Lines";

        if (isSubProduct == true)
        {
            var subProducts = await _db.InsuranceSubProducts
                .AsNoTracking()
                .Where(p => p.Product != null && p.Product.IsActive)
                .OrderBy(p => p.SubProductName)
                .Select(p => new
                {
                    id = p.Id,
                    product_name = p.SubProductName,
                    product_type = p.Product!.Category == "Specialty" ? specialtyLabel : p.Product.Category,
                    is_sub_product = true,
                    parent_product_id = (long?)p.ProductId,
                    is_active = true,
                })
                .ToListAsync();

            return Ok(subProducts);
        }

        var products = await _db.InsuranceProducts
            .AsNoTracking()
            .Where(p => p.IsActive)
            .OrderBy(p => p.ProductName)
            .Select(p => new
            {
                id = p.Id,
                product_name = p.ProductName,
                product_type = p.Category == "Specialty" ? specialtyLabel : p.Category,
                is_sub_product = false,
                parent_product_id = (long?)null,
                is_active = p.IsActive,
            })
            .ToListAsync();

        return Ok(products);
    }

    [HttpGet("intermediaries/{intermediaryId:long}/commissions")]
    public async Task<IActionResult> GetCommissions(long intermediaryId)
    {
        if (await FindIntermediary(intermediaryId) == null) return NotFound();
        await EnsureIntermediaryCommissionStorageAsync();
        var rows = await _db.IntermediaryCommissions.AsNoTracking()
            .Where(c => c.ClientId == _tenant.ClientId && c.IntermediaryId == intermediaryId)
            .OrderBy(c => c.EffectiveDate)
            .ToListAsync();
        return Ok(rows.Select(ToCommissionResponse));
    }

    [HttpPost("intermediaries/{intermediaryId:long}/commissions")]
    public async Task<IActionResult> CreateCommission(long intermediaryId, [FromBody] UpsertIntermediaryCommissionRequest request)
    {
        if (await FindIntermediary(intermediaryId) == null) return NotFound();
        await EnsureIntermediaryCommissionStorageAsync();
        var error = await ValidateCommissionRequest(request);
        if (error != null) return BadRequest(new { error });

        var commission = new IntermediaryCommission
        {
            ClientId = _tenant.ClientId,
            IntermediaryId = intermediaryId,
            CreatedBy = _tenant.UserId,
            CreatedOn = DateTime.UtcNow,
        };
        ApplyCommission(commission, request);
        _db.IntermediaryCommissions.Add(commission);
        await _db.SaveChangesAsync();
        return Ok(ToCommissionResponse(commission));
    }

    [HttpPut("intermediaries/{intermediaryId:long}/commissions/{id:long}")]
    public async Task<IActionResult> UpdateCommission(long intermediaryId, long id, [FromBody] UpsertIntermediaryCommissionRequest request)
    {
        await EnsureIntermediaryCommissionStorageAsync();
        var commission = await _db.IntermediaryCommissions.FirstOrDefaultAsync(c => c.Id == id && c.ClientId == _tenant.ClientId && c.IntermediaryId == intermediaryId);
        if (commission == null) return NotFound();
        var error = await ValidateCommissionRequest(request);
        if (error != null) return BadRequest(new { error });

        ApplyCommission(commission, request);
        commission.UpdatedBy = _tenant.UserId;
        commission.UpdatedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(ToCommissionResponse(commission));
    }

    [HttpDelete("intermediaries/{intermediaryId:long}/commissions/{id:long}")]
    public async Task<IActionResult> DeleteCommission(long intermediaryId, long id)
    {
        await EnsureIntermediaryCommissionStorageAsync();
        var commission = await _db.IntermediaryCommissions.FirstOrDefaultAsync(c => c.Id == id && c.ClientId == _tenant.ClientId && c.IntermediaryId == intermediaryId);
        if (commission == null) return NotFound();
        _db.IntermediaryCommissions.Remove(commission);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private Task<Intermediary?> FindIntermediary(long id)
    {
        var clientId = _tenant.ClientId;
        return _db.Intermediaries.FirstOrDefaultAsync(i => i.Id == id && i.ClientId == clientId);
    }

    private Task<Producer?> FindProducer(long id)
    {
        var clientId = _tenant.ClientId;
        return _db.Producers.FirstOrDefaultAsync(p => p.Id == id && p.ClientId == clientId);
    }

    // Existing local installations predate EF migration history. The checked-in
    // migration is the deployment path; this idempotent guard keeps those legacy
    // databases usable until their migration history is brought under management.
    private Task EnsureIntermediaryCommissionStorageAsync() => _db.Database.ExecuteSqlRawAsync("""
        CREATE TABLE IF NOT EXISTS intermediary_commission (
            id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            client_id bigint NOT NULL,
            intermediary_id bigint NOT NULL REFERENCES intermediary(id) ON DELETE CASCADE,
            company_id bigint NOT NULL,
            product_id bigint NOT NULL REFERENCES insurance_product(id) ON DELETE RESTRICT,
            sub_product_id bigint NOT NULL REFERENCES insurance_sub_product(id) ON DELETE RESTRICT,
            insurance_type character varying(50) NOT NULL,
            juridiction_state character varying(2) NOT NULL,
            effective_date date NOT NULL,
            new_business_commission numeric(5,2) NOT NULL,
            renewal_commission numeric(5,2) NOT NULL,
            created_by bigint NULL,
            created_on timestamp without time zone NOT NULL,
            updated_by bigint NULL,
            updated_on timestamp without time zone NULL
        );
        CREATE INDEX IF NOT EXISTS ix_intermediary_commission_client_id_intermediary_id
            ON intermediary_commission (client_id, intermediary_id);
        """);

    private async Task<string?> ValidateCommissionRequest(UpsertIntermediaryCommissionRequest request)
    {
        if (IsPlaceholder(request.InsuranceType)) return "Insurance Type is required.";
        if (!request.ProductId.HasValue || request.ProductId <= 0) return "Line of Business is required.";
        if (!request.SubProductId.HasValue || request.SubProductId <= 0) return "Sub-Product is required.";
        if (IsPlaceholder(request.JuridictionState) || !UsStateCodes.Contains(request.JuridictionState!)) return "State is required.";
        if (!request.NewBusinessCommission.HasValue) return "New Business Commission is required.";
        if (!request.RenewalCommission.HasValue) return "Renewal Commission is required.";
        if (!request.EffectiveDate.HasValue) return "Effective Date is required.";
        if (request.NewBusinessCommission is < 0 or > 100 || request.RenewalCommission is < 0 or > 100)
            return "Commission percentages must be between 0 and 100.";

        var product = await _db.InsuranceProducts.AsNoTracking().FirstOrDefaultAsync(p => p.Id == request.ProductId && p.IsActive);
        if (product == null || !string.Equals(NormalizeInsuranceType(product.Category), request.InsuranceType!.Trim(), StringComparison.OrdinalIgnoreCase))
            return "Line of Business is invalid for the selected Insurance Type.";
        var subProductMatches = await _db.InsuranceSubProducts.AsNoTracking()
            .AnyAsync(s => s.Id == request.SubProductId && s.ProductId == request.ProductId);
        return subProductMatches ? null : "Sub-Product is invalid for the selected Line of Business.";
    }

    private static bool IsPlaceholder(string? value) => string.IsNullOrWhiteSpace(value) || value.Trim().StartsWith("select", StringComparison.OrdinalIgnoreCase);
    private static string NormalizeInsuranceType(string category) => category == "Specialty" ? "Specialty Lines" : category;

    private static void ApplyCommission(IntermediaryCommission commission, UpsertIntermediaryCommissionRequest request)
    {
        commission.CompanyId = request.CompanyId.GetValueOrDefault(1);
        commission.ProductId = request.ProductId!.Value;
        commission.SubProductId = request.SubProductId!.Value;
        commission.InsuranceType = request.InsuranceType!.Trim();
        commission.JuridictionState = request.JuridictionState!.Trim().ToUpperInvariant();
        commission.EffectiveDate = request.EffectiveDate!.Value;
        commission.NewBusinessCommission = request.NewBusinessCommission!.Value;
        commission.RenewalCommission = request.RenewalCommission!.Value;
    }

    private static object ToCommissionResponse(IntermediaryCommission c) => new
    {
        id = c.Id, company_id = c.CompanyId, product_id = c.ProductId, sub_product_id = c.SubProductId,
        insurance_type = c.InsuranceType, juridiction_state = c.JuridictionState, effective_date = c.EffectiveDate,
        new_business_commission = c.NewBusinessCommission, renewal_commission = c.RenewalCommission,
    };

    private static void ApplyIntermediary(Intermediary intermediary, UpsertIntermediaryRequest request)
    {
        intermediary.Status = Required(request.Status, request.StatusToggle == false ? "Inactive" : "Active", 10);
        intermediary.StatusToggle = request.StatusToggle ?? intermediary.Status.Equals("Active", StringComparison.OrdinalIgnoreCase);
        intermediary.IntermediaryName = Required(request.IntermediaryName, "Unnamed Intermediary", 50);
        intermediary.DoingBusinessAs = TrimTo(request.DoingBusinessAs, 50);
        intermediary.LegalEntity = Required(request.LegalEntity, "LLC", 50);
        intermediary.FederalTaxId = TrimTo(request.FederalTaxId, 10);
        intermediary.TypeOfIntermediary = TrimTo(request.TypeOfIntermediary, 50);
        intermediary.Country = TrimTo(request.Country, 50);
        intermediary.ResidentialState = TrimTo(request.ResidentialState, 50);
        intermediary.License = TrimTo(request.License, 10);
        intermediary.AllowFullProducerVisibility = request.AllowFullProducerVisibility ?? false;
        intermediary.LastStep = request.LastStep;
        intermediary.CommissionDisburseEmail = TrimTo(request.CommissionDisburseEmail, 100);
    }

    private static void ApplyProducer(Producer producer, UpsertProducerRequest request)
    {
        producer.Status = Required(request.Status, request.StatusToggle == false ? "Inactive" : "Active", 10);
        producer.StatusToggle = request.StatusToggle ?? producer.Status.Equals("Active", StringComparison.OrdinalIgnoreCase);
        producer.FirstName = Required(request.FirstName, "Unknown", 50);
        producer.MiddleName = TrimTo(request.MiddleName, 50);
        producer.LastName = Required(request.LastName, "Unknown", 50);
        producer.PcLicenseRequirement = TrimTo(request.ResolvedPcLicenseRequirement(), 10);
        producer.Country = TrimTo(request.Country, 50);
        producer.ResidentialState = TrimTo(request.ResidentialState, 50);
        producer.PlLicense = TrimTo(request.PlLicense, 10);
        producer.ClLicense = TrimTo(request.ClLicense, 10);
        producer.PlclCombinedLicense = TrimTo(request.PlclCombinedLicense, 10);
        producer.TelephoneNumberCC = Required(request.TelephoneNumberCc, "+1", 10);
        producer.TelephoneNumber = Required(request.TelephoneNumber, "0000000000", 20);
        producer.AltTelephoneNumberCC = TrimTo(request.AltTelephoneNumberCc, 10);
        producer.AltTelephoneNumber = TrimTo(request.AltTelephoneNumber, 20);
        producer.Email = TrimTo(request.Email, 50);
        producer.IsManager = request.IsManager;
        producer.ManagerId = request.ManagerId;
        producer.Extension = request.Extension;
        producer.Suffix = TrimTo(request.Suffix, 4);
        producer.Gender = TrimTo(request.Gender, 50);
        producer.PersonalBio = TrimTo(request.PersonalBio, 1000);
    }

    private static void ApplyAddress(IntermediaryAddress address, AddressRequest request)
    {
        address.AddressLine1 = request.AddressLine1; address.AddressLine2 = request.AddressLine2; address.Country = request.Country;
        address.State = request.State; address.City = request.City; address.County = request.County; address.ZipCode = request.ZipCode;
        address.Latitude = request.Latitude; address.Longitude = request.Longitude;
    }
    private static void ApplyAddress(ProducerAddress address, AddressRequest request)
    {
        address.AddressLine1 = request.AddressLine1; address.AddressLine2 = request.AddressLine2; address.Country = request.Country;
        address.State = request.State; address.City = request.City; address.County = request.County; address.ZipCode = request.ZipCode;
        address.Latitude = request.Latitude; address.Longitude = request.Longitude;
    }
    private static void ApplyContact(IntermediaryContact contact, ContactRequest request)
    {
        contact.Name = request.Name; contact.Title = request.Title; contact.EmailId = request.EmailId;
        contact.TelephoneNumber = request.TelephoneNumber; contact.Extension = request.Extension;
        contact.AltTelephoneNo = request.AltTelephoneNo; contact.IsPrimary = request.IsPrimary;
    }

    private static object ToIntermediaryResponse(Intermediary i) => new
    {
        id = i.Id,
        client_id = i.ClientId,
        intermediary_code = i.IntermediaryCode,
        status = i.Status,
        status_toggle = i.StatusToggle,
        intermediary_name = i.IntermediaryName,
        doing_business_as = i.DoingBusinessAs,
        legal_entity = i.LegalEntity,
        federal_tax_id = i.FederalTaxId,
        type_of_intermediary = i.TypeOfIntermediary,
        country = i.Country,
        residential_state = i.ResidentialState,
        license = i.License,
        allow_full_producer_visibility = i.AllowFullProducerVisibility,
        last_step = i.LastStep,
        commission_disburse_email = i.CommissionDisburseEmail,
        created_on = i.CreatedOn,
        updated_on = i.UpdatedOn,
    };

    private static object ToProducerResponse(Producer p) => new
    {
        id = p.Id,
        client_id = p.ClientId,
        intermediary_id = p.IntermediaryId,
        producer_code = p.ProducerCode,
        status = p.Status,
        status_toggle = p.StatusToggle,
        first_name = p.FirstName,
        middle_name = p.MiddleName,
        last_name = p.LastName,
        pc_license_requirement = p.PcLicenseRequirement,
        country = p.Country,
        residential_state = p.ResidentialState,
        pl_license = p.PlLicense,
        cl_license = p.ClLicense,
        plcl_combined_license = p.PlclCombinedLicense,
        telephone_number_cc = p.TelephoneNumberCC,
        telephone_number = p.TelephoneNumber,
        alt_telephone_number_cc = p.AltTelephoneNumberCC,
        alt_telephone_number = p.AltTelephoneNumber,
        email = p.Email,
        is_manager = p.IsManager,
        manager_id = p.ManagerId,
        extension = p.Extension,
        suffix = p.Suffix,
        gender = p.Gender,
        personal_bio = p.PersonalBio,
        created_on = p.CreatedOn,
        updated_on = p.UpdatedOn,
    };

    private static string NextCode(string prefix, ISet<string> usedCodes)
    {
        for (var i = 1; i <= 99999999; i++)
        {
            var code = $"{prefix}{i:D8}";
            if (!usedCodes.Contains(code)) return code;
        }

        throw new InvalidOperationException($"Unable to generate a {prefix} code.");
    }

    private static string Required(string? value, string fallback, int maxLength) => TrimTo(value, maxLength) ?? fallback;

    private static string? TrimTo(string? value, int maxLength)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed)) return null;
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }
}

public sealed class UpsertIntermediaryRequest
{
    [JsonPropertyName("status")] public string? Status { get; init; }
    [JsonPropertyName("status_toggle")] public bool? StatusToggle { get; init; }
    [JsonPropertyName("intermediary_name")] public string? IntermediaryName { get; init; }
    [JsonPropertyName("doing_business_as")] public string? DoingBusinessAs { get; init; }
    [JsonPropertyName("legal_entity")] public string? LegalEntity { get; init; }
    [JsonPropertyName("federal_tax_id")] public string? FederalTaxId { get; init; }
    [JsonPropertyName("type_of_intermediary")] public string? TypeOfIntermediary { get; init; }
    [JsonPropertyName("country")] public string? Country { get; init; }
    [JsonPropertyName("residential_state")] public string? ResidentialState { get; init; }
    [JsonPropertyName("license")] public string? License { get; init; }
    [JsonPropertyName("allow_full_producer_visibility")] public bool? AllowFullProducerVisibility { get; init; }
    [JsonPropertyName("last_step")] public int? LastStep { get; init; }
    [JsonPropertyName("commission_disburse_email")] public string? CommissionDisburseEmail { get; init; }
    [JsonPropertyName("address")] public AddressRequest? Address { get; init; }
    [JsonPropertyName("contacts")] public List<ContactRequest>? Contacts { get; init; }
    [JsonPropertyName("nr_states")] public List<IntermediaryNrStateRequest>? NrStates { get; init; }
}

public sealed class UpsertProducerRequest
{
    [JsonPropertyName("producer_draft_token")] public string? ProducerDraftToken { get; init; }
    [JsonPropertyName("intermediary_id")] public long IntermediaryId { get; init; }
    [JsonPropertyName("status")] public string? Status { get; init; }
    [JsonPropertyName("status_toggle")] public bool? StatusToggle { get; init; }
    [JsonPropertyName("first_name")] public string? FirstName { get; init; }
    [JsonPropertyName("middle_name")] public string? MiddleName { get; init; }
    [JsonPropertyName("last_name")] public string? LastName { get; init; }
    [JsonPropertyName("pc_licence_requirement")] public string? PcLicenseRequirement { get; init; }
    [JsonPropertyName("country")] public string? Country { get; init; }
    [JsonPropertyName("residential_state")] public string? ResidentialState { get; init; }
    [JsonPropertyName("pl_license")] public string? PlLicense { get; init; }
    [JsonPropertyName("cl_license")] public string? ClLicense { get; init; }
    [JsonPropertyName("plcl_combined_license")] public string? PlclCombinedLicense { get; init; }
    [JsonPropertyName("telephone_number_cc")] public string? TelephoneNumberCc { get; init; }
    [JsonPropertyName("telephone_number")] public string? TelephoneNumber { get; init; }
    [JsonPropertyName("alt_telephone_number_cc")] public string? AltTelephoneNumberCc { get; init; }
    [JsonPropertyName("alt_telephone_number")] public string? AltTelephoneNumber { get; init; }
    [JsonPropertyName("email")] public string? Email { get; init; }
    [JsonPropertyName("is_manager")] public bool? IsManager { get; init; }
    [JsonPropertyName("manager_id")] public long? ManagerId { get; init; }
    [JsonPropertyName("extension")] public int? Extension { get; init; }
    [JsonPropertyName("suffix")] public string? Suffix { get; init; }
    [JsonPropertyName("gender")] public string? Gender { get; init; }
    [JsonPropertyName("personal_bio")] public string? PersonalBio { get; init; }
    [JsonPropertyName("address")] public AddressRequest? Address { get; init; }
    [JsonPropertyName("nr_states")] public List<ProducerNrStateRequest>? NrStates { get; init; }
    [JsonExtensionData] public Dictionary<string, JsonElement>? Extra { get; init; }

    public string? ExtraString(string key)
    {
        return Extra != null && Extra.TryGetValue(key, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
    }

    public string? ResolvedPcLicenseRequirement() =>
        PcLicenseRequirement ?? ExtraString("pc_license_requirement") ?? ExtraString("pcLicenseRequirement");
}

public sealed class UpsertIntermediaryCommissionRequest
{
    [JsonPropertyName("company_id")] public long? CompanyId { get; init; }
    [JsonPropertyName("product_id")] public long? ProductId { get; init; }
    [JsonPropertyName("sub_product_id")] public long? SubProductId { get; init; }
    [JsonPropertyName("insurance_type")] public string? InsuranceType { get; init; }
    [JsonPropertyName("juridiction_state")] public string? JuridictionState { get; init; }
    [JsonPropertyName("effective_date")] public DateOnly? EffectiveDate { get; init; }
    [JsonPropertyName("new_business_commission")] public decimal? NewBusinessCommission { get; init; }
    [JsonPropertyName("renewal_commission")] public decimal? RenewalCommission { get; init; }
}
