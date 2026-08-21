using System.Text.Json;
using System.Text.Json.Serialization;
using InsureEdge.API.Filters;
using InsureEdge.Application.Interfaces;
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
    private readonly InsureEdgeDbContext _db;
    private readonly ICurrentTenantService _tenant;

    public DistributionController(InsureEdgeDbContext db, ICurrentTenantService tenant)
    {
        _db = db;
        _tenant = tenant;
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

        ApplyIntermediary(intermediary, request);
        _db.Intermediaries.Add(intermediary);
        await _db.SaveChangesAsync();

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

    [HttpPost("producers")]
    public async Task<IActionResult> CreateProducer([FromBody] UpsertProducerRequest request)
    {
        var clientId = _tenant.ClientId;
        var intermediaryExists = await _db.Intermediaries.AnyAsync(i => i.Id == request.IntermediaryId && i.ClientId == clientId);
        if (!intermediaryExists) return BadRequest(new { error = "Intermediary not found." });

        var usedCodes = (await _db.Producers
            .Where(p => p.ClientId == clientId)
            .Select(p => p.ProducerCode)
            .ToListAsync()).ToHashSet();

        var producer = new Producer
        {
            ClientId = clientId,
            IntermediaryId = request.IntermediaryId,
            CreatedBy = _tenant.UserId,
            CreatedOn = DateTime.UtcNow,
            ProducerCode = NextCode("PR", usedCodes),
        };

        ApplyProducer(producer, request);
        _db.Producers.Add(producer);
        await _db.SaveChangesAsync();

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
        producer.PcLicenseRequirement = TrimTo(request.PcLicenseRequirement ?? request.ExtraString("pc_license_requirement") ?? request.ExtraString("pcLicenseRequirement"), 10);
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
        producer.Extension = request.Extension;
        producer.Suffix = TrimTo(request.Suffix, 4);
        producer.Gender = TrimTo(request.Gender, 50);
        producer.PersonalBio = TrimTo(request.PersonalBio, 1000);
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
}

public sealed class UpsertProducerRequest
{
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
    [JsonPropertyName("extension")] public int? Extension { get; init; }
    [JsonPropertyName("suffix")] public string? Suffix { get; init; }
    [JsonPropertyName("gender")] public string? Gender { get; init; }
    [JsonPropertyName("personal_bio")] public string? PersonalBio { get; init; }
    [JsonExtensionData] public Dictionary<string, JsonElement>? Extra { get; init; }

    public string? ExtraString(string key)
    {
        return Extra != null && Extra.TryGetValue(key, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
    }
}
