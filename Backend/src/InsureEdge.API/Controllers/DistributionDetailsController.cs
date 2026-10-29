using System.Text.Json.Serialization;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.API.Controllers;

// Mirrors the established frontend distributionApi routes. All rows are tenant-scoped.
[ApiController, Authorize, Route("api/distribution")]
public sealed class DistributionDetailsController(InsureEdgeDbContext db, ICurrentTenantService tenant) : ControllerBase
{
    private long ClientId => tenant.ClientId;
    private Task<bool> IntermediaryExists(long id) => db.Intermediaries.AnyAsync(x => x.Id == id && x.ClientId == ClientId);
    private Task<bool> ProducerExists(long id) => db.Producers.AnyAsync(x => x.Id == id && x.ClientId == ClientId);

    [HttpGet("intermediaries/{id:long}/address")]
    public async Task<IActionResult> GetIntermediaryAddress(long id) { if (!await IntermediaryExists(id)) return NotFound(); var row = await db.IntermediaryAddresses.AsNoTracking().FirstOrDefaultAsync(x => x.ClientId == ClientId && x.IntermediaryId == id); return row is null ? NotFound() : Ok(Address(row)); }
    [HttpPost("intermediaries/{id:long}/address")]
    public async Task<IActionResult> CreateIntermediaryAddress(long id, AddressRequest request)
    {
        if (!await IntermediaryExists(id)) return NotFound(); var row = await db.IntermediaryAddresses.FirstOrDefaultAsync(x => x.ClientId == ClientId && x.IntermediaryId == id);
        if (row is null) { row = new IntermediaryAddress { ClientId = ClientId, IntermediaryId = id, CreatedBy = tenant.UserId }; db.IntermediaryAddresses.Add(row); } else Touch(row);
        Apply(row, request); await db.SaveChangesAsync(); return Ok(Address(row));
    }
    [HttpPut("intermediaries/{id:long}/address/{addressId:long}")]
    public async Task<IActionResult> UpdateIntermediaryAddress(long id, long addressId, AddressRequest request)
    { var row = await db.IntermediaryAddresses.FirstOrDefaultAsync(x => x.Id == addressId && x.ClientId == ClientId && x.IntermediaryId == id); if (row is null) return NotFound(); Apply(row, request); Touch(row); await db.SaveChangesAsync(); return Ok(Address(row)); }

    [HttpGet("intermediaries/{id:long}/contacts")]
    public async Task<IActionResult> GetIntermediaryContacts(long id) { if (!await IntermediaryExists(id)) return NotFound(); var rows = await db.IntermediaryContacts.AsNoTracking().Where(x => x.ClientId == ClientId && x.IntermediaryId == id).OrderByDescending(x => x.IsPrimary).ThenBy(x => x.Id).ToListAsync(); return Ok(rows.Select(Contact)); }
    [HttpPost("intermediaries/{id:long}/contacts")]
    public async Task<IActionResult> CreateIntermediaryContact(long id, ContactRequest request)
    {
        if (!await IntermediaryExists(id)) return NotFound(); var row = new IntermediaryContact { ClientId = ClientId, IntermediaryId = id, CreatedBy = tenant.UserId }; Apply(row, request); if (row.IsPrimary) await ClearPrimary(id, null); db.IntermediaryContacts.Add(row); await db.SaveChangesAsync(); return Ok(Contact(row));
    }
    [HttpPut("intermediaries/{id:long}/contacts/{contactId:long}")]
    public async Task<IActionResult> UpdateIntermediaryContact(long id, long contactId, ContactRequest request)
    { var row = await db.IntermediaryContacts.FirstOrDefaultAsync(x => x.Id == contactId && x.ClientId == ClientId && x.IntermediaryId == id); if (row is null) return NotFound(); Apply(row, request); if (row.IsPrimary) await ClearPrimary(id, row.Id); Touch(row); await db.SaveChangesAsync(); return Ok(Contact(row)); }
    [HttpDelete("intermediaries/{id:long}/contacts/{contactId:long}")]
    public async Task<IActionResult> DeleteIntermediaryContact(long id, long contactId) { var row = await db.IntermediaryContacts.FirstOrDefaultAsync(x => x.Id == contactId && x.ClientId == ClientId && x.IntermediaryId == id); if (row is null) return NotFound(); db.IntermediaryContacts.Remove(row); await db.SaveChangesAsync(); return NoContent(); }

    [HttpGet("intermediaries/{id:long}/nr-states")]
    public async Task<IActionResult> GetIntermediaryStates(long id) { if (!await IntermediaryExists(id)) return NotFound(); var rows = await db.IntermediaryNrStates.AsNoTracking().Where(x => x.ClientId == ClientId && x.IntermediaryId == id).OrderBy(x => x.Id).ToListAsync(); return Ok(rows.Select(State)); }
    [HttpPost("intermediaries/{id:long}/nr-states")]
    public async Task<IActionResult> CreateIntermediaryState(long id, IntermediaryNrStateRequest request)
    { if (!await IntermediaryExists(id)) return NotFound(); if (string.IsNullOrWhiteSpace(request.State)) return BadRequest(new { error = "State is required." }); if (await db.IntermediaryNrStates.AnyAsync(x => x.ClientId == ClientId && x.IntermediaryId == id && x.State == request.State.Trim())) return Conflict(new { error = "State is already listed." }); var row = new IntermediaryNrState { ClientId = ClientId, IntermediaryId = id, CreatedBy = tenant.UserId }; Apply(row, request); db.IntermediaryNrStates.Add(row); await db.SaveChangesAsync(); return Ok(State(row)); }
    [HttpPut("intermediaries/{id:long}/nr-states/{stateId:long}")]
    public async Task<IActionResult> UpdateIntermediaryState(long id, long stateId, IntermediaryNrStateRequest request)
    { var row = await db.IntermediaryNrStates.FirstOrDefaultAsync(x => x.Id == stateId && x.ClientId == ClientId && x.IntermediaryId == id); if (row is null) return NotFound(); if (string.IsNullOrWhiteSpace(request.State)) return BadRequest(new { error = "State is required." }); if (await db.IntermediaryNrStates.AnyAsync(x => x.Id != stateId && x.ClientId == ClientId && x.IntermediaryId == id && x.State == request.State.Trim())) return Conflict(new { error = "State is already listed." }); Apply(row, request); Touch(row); await db.SaveChangesAsync(); return Ok(State(row)); }
    [HttpDelete("intermediaries/{id:long}/nr-states/{stateId:long}")]
    public async Task<IActionResult> DeleteIntermediaryState(long id, long stateId) { var row = await db.IntermediaryNrStates.FirstOrDefaultAsync(x => x.Id == stateId && x.ClientId == ClientId && x.IntermediaryId == id); if (row is null) return NotFound(); db.IntermediaryNrStates.Remove(row); await db.SaveChangesAsync(); return NoContent(); }

    [HttpGet("producers/{id:long}/address")]
    public async Task<IActionResult> GetProducerAddress(long id) { if (!await ProducerExists(id)) return NotFound(); var row = await db.ProducerAddresses.AsNoTracking().FirstOrDefaultAsync(x => x.ClientId == ClientId && x.ProducerId == id); return row is null ? NotFound() : Ok(Address(row)); }
    [HttpPost("producers/{id:long}/address")]
    public async Task<IActionResult> CreateProducerAddress(long id, AddressRequest request)
    { if (!await ProducerExists(id)) return NotFound(); var row = await db.ProducerAddresses.FirstOrDefaultAsync(x => x.ClientId == ClientId && x.ProducerId == id); if (row is null) { row = new ProducerAddress { ClientId = ClientId, ProducerId = id, CreatedBy = tenant.UserId }; db.ProducerAddresses.Add(row); } else Touch(row); Apply(row, request); await db.SaveChangesAsync(); return Ok(Address(row)); }
    [HttpPut("producers/{id:long}/address/{addressId:long}")]
    public async Task<IActionResult> UpdateProducerAddress(long id, long addressId, AddressRequest request)
    { var row = await db.ProducerAddresses.FirstOrDefaultAsync(x => x.Id == addressId && x.ClientId == ClientId && x.ProducerId == id); if (row is null) return NotFound(); Apply(row, request); Touch(row); await db.SaveChangesAsync(); return Ok(Address(row)); }

    [HttpGet("producers/{id:long}/nr-states")]
    public async Task<IActionResult> GetProducerStates(long id) { if (!await ProducerExists(id)) return NotFound(); var rows = await db.ProducerNrStates.AsNoTracking().Where(x => x.ClientId == ClientId && x.ProducerId == id).OrderBy(x => x.Id).ToListAsync(); return Ok(rows.Select(State)); }
    [HttpPost("producers/{id:long}/nr-states")]
    public async Task<IActionResult> CreateProducerState(long id, ProducerNrStateRequest request)
    { if (!await ProducerExists(id)) return NotFound(); if (string.IsNullOrWhiteSpace(request.State)) return BadRequest(new { error = "State is required." }); if (await db.ProducerNrStates.AnyAsync(x => x.ClientId == ClientId && x.ProducerId == id && x.State == request.State.Trim())) return Conflict(new { error = "State is already listed." }); var row = new ProducerNrState { ClientId = ClientId, ProducerId = id, CreatedBy = tenant.UserId }; Apply(row, request); db.ProducerNrStates.Add(row); await db.SaveChangesAsync(); return Ok(State(row)); }
    [HttpPut("producers/{id:long}/nr-states/{stateId:long}")]
    public async Task<IActionResult> UpdateProducerState(long id, long stateId, ProducerNrStateRequest request)
    { var row = await db.ProducerNrStates.FirstOrDefaultAsync(x => x.Id == stateId && x.ClientId == ClientId && x.ProducerId == id); if (row is null) return NotFound(); if (string.IsNullOrWhiteSpace(request.State)) return BadRequest(new { error = "State is required." }); if (await db.ProducerNrStates.AnyAsync(x => x.Id != stateId && x.ClientId == ClientId && x.ProducerId == id && x.State == request.State.Trim())) return Conflict(new { error = "State is already listed." }); Apply(row, request); Touch(row); await db.SaveChangesAsync(); return Ok(State(row)); }
    [HttpDelete("producers/{id:long}/nr-states/{stateId:long}")]
    public async Task<IActionResult> DeleteProducerState(long id, long stateId) { var row = await db.ProducerNrStates.FirstOrDefaultAsync(x => x.Id == stateId && x.ClientId == ClientId && x.ProducerId == id); if (row is null) return NotFound(); db.ProducerNrStates.Remove(row); await db.SaveChangesAsync(); return NoContent(); }

    private async Task ClearPrimary(long intermediaryId, long? exceptId) { var rows = await db.IntermediaryContacts.Where(x => x.ClientId == ClientId && x.IntermediaryId == intermediaryId && x.IsPrimary && x.Id != exceptId).ToListAsync(); foreach (var x in rows) { x.IsPrimary = false; Touch(x); } }
    private void Touch(IntermediaryAddress x) { x.UpdatedBy = tenant.UserId; x.UpdatedOn = DateTime.UtcNow; } private void Touch(ProducerAddress x) { x.UpdatedBy = tenant.UserId; x.UpdatedOn = DateTime.UtcNow; } private void Touch(IntermediaryContact x) { x.UpdatedBy = tenant.UserId; x.UpdatedOn = DateTime.UtcNow; } private void Touch(IntermediaryNrState x) { x.UpdatedBy = tenant.UserId; x.UpdatedOn = DateTime.UtcNow; } private void Touch(ProducerNrState x) { x.UpdatedBy = tenant.UserId; x.UpdatedOn = DateTime.UtcNow; }
    private static void Apply(IntermediaryAddress x, AddressRequest r) { x.AddressLine1=r.AddressLine1; x.AddressLine2=r.AddressLine2; x.Country=r.Country; x.State=r.State; x.City=r.City; x.County=r.County; x.ZipCode=r.ZipCode; x.Latitude=r.Latitude; x.Longitude=r.Longitude; } private static void Apply(ProducerAddress x, AddressRequest r) { x.AddressLine1=r.AddressLine1; x.AddressLine2=r.AddressLine2; x.Country=r.Country; x.State=r.State; x.City=r.City; x.County=r.County; x.ZipCode=r.ZipCode; x.Latitude=r.Latitude; x.Longitude=r.Longitude; } private static void Apply(IntermediaryContact x, ContactRequest r) { x.Name=r.Name; x.Title=r.Title; x.EmailId=r.EmailId; x.TelephoneNumber=r.TelephoneNumber; x.Extension=r.Extension; x.AltTelephoneNo=r.AltTelephoneNo; x.IsPrimary=r.IsPrimary; } private static void Apply(IntermediaryNrState x, IntermediaryNrStateRequest r) { x.State=r.State!.Trim(); x.License=r.License; x.IsAvailableInSearch=r.IsAvailableInSearch; } private static void Apply(ProducerNrState x, ProducerNrStateRequest r) { x.State=r.State!.Trim(); x.LicenseNumber=r.LicenseNumber; x.IsAvailableInSearch=r.IsAvailableInSearch; }
    private static object Address(IntermediaryAddress x) => new { id=x.Id,address_line1=x.AddressLine1,address_line2=x.AddressLine2,country=x.Country,state=x.State,city=x.City,county=x.County,zip_code=x.ZipCode,latitude=x.Latitude,longitude=x.Longitude }; private static object Address(ProducerAddress x) => new { id=x.Id,address_line1=x.AddressLine1,address_line2=x.AddressLine2,country=x.Country,state=x.State,city=x.City,county=x.County,zip_code=x.ZipCode,latitude=x.Latitude,longitude=x.Longitude }; private static object Contact(IntermediaryContact x) => new { id=x.Id,name=x.Name,title=x.Title,email_id=x.EmailId,telephone_number=x.TelephoneNumber,extension=x.Extension,alt_telephone_no=x.AltTelephoneNo,is_primary=x.IsPrimary }; private static object State(IntermediaryNrState x) => new { id=x.Id,state=x.State,license=x.License,is_available_in_search=x.IsAvailableInSearch }; private static object State(ProducerNrState x) => new { id=x.Id,state=x.State,license_number=x.LicenseNumber,is_available_in_search=x.IsAvailableInSearch };
}

public sealed class AddressRequest { [JsonPropertyName("address_line1")] public string? AddressLine1 { get; init; } [JsonPropertyName("address_line2")] public string? AddressLine2 { get; init; } [JsonPropertyName("country")] public string? Country { get; init; } [JsonPropertyName("state")] public string? State { get; init; } [JsonPropertyName("city")] public string? City { get; init; } [JsonPropertyName("county")] public string? County { get; init; } [JsonPropertyName("zip_code")] public string? ZipCode { get; init; } [JsonPropertyName("latitude")] public string? Latitude { get; init; } [JsonPropertyName("longitude")] public string? Longitude { get; init; } }
public sealed class ContactRequest { [JsonPropertyName("name")] public string? Name { get; init; } [JsonPropertyName("title")] public string? Title { get; init; } [JsonPropertyName("email_id")] public string? EmailId { get; init; } [JsonPropertyName("telephone_number")] public string? TelephoneNumber { get; init; } [JsonPropertyName("extension")] public string? Extension { get; init; } [JsonPropertyName("alt_telephone_no")] public string? AltTelephoneNo { get; init; } [JsonPropertyName("is_primary")] public bool IsPrimary { get; init; } }
public sealed class IntermediaryNrStateRequest { [JsonPropertyName("state")] public string? State { get; init; } [JsonPropertyName("license")] public string? License { get; init; } [JsonPropertyName("is_available_in_search")] public bool IsAvailableInSearch { get; init; } }
public sealed class ProducerNrStateRequest { [JsonPropertyName("state")] public string? State { get; init; } [JsonPropertyName("license_number")] public string? LicenseNumber { get; init; } [JsonPropertyName("is_available_in_search")] public bool IsAvailableInSearch { get; init; } }
