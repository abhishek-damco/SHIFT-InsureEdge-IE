// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
using InsureEdge.Application.DTOs.Client;
using InsureEdge.Application.Interfaces;
using InsureEdge.Application.Services;
using InsureEdge.Application.Validation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/clients")]
[Authorize]
public class ClientsController(ClientService clients, ICurrentTenantService tenant) : ControllerBase
{
    // GET api/clients — list (for platform admin multi-tenant view)
    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var (items, total) = await clients.GetListAsync(search, page, pageSize);
        return Ok(new { items, total, page, pageSize });
    }

    // GET api/clients/me — current tenant's full profile
    [HttpGet("me")]
    public async Task<IActionResult> GetMyDetail()
    {
        var detail = await clients.GetDetailAsync();
        if (detail == null) return NotFound();
        return Ok(detail);
    }

    // GET api/clients/{id} — specific client by id
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var detail = await clients.GetDetailByIdAsync(id);
        if (detail == null) return NotFound();
        return Ok(detail);
    }

    // PATCH api/clients/me/info — update primary information
    [HttpPatch("me/info")]
    public async Task<IActionResult> UpdateInfo([FromBody] SaveClientInfoRequest req)
    {
        if (ClientValidator.ValidateInfo(req) is { } error) return BadRequest(new { error });
        await clients.UpdateInfoAsync(req);
        return NoContent();
    }

    // PUT api/clients/me/address — upsert legal or mailing address
    [HttpPut("me/address")]
    public async Task<IActionResult> SaveAddress([FromBody] SaveAddressRequest req)
    {
        if (ClientValidator.ValidateAddress(req) is { } error) return BadRequest(new { error });
        await clients.SaveAddressAsync(req);
        return NoContent();
    }

    // PUT api/clients/me/contact — upsert primary contact
    [HttpPut("me/contact")]
    public async Task<IActionResult> SaveContact([FromBody] SaveContactRequest req)
    {
        if (ClientValidator.ValidateContact(req) is { } error) return BadRequest(new { error });
        await clients.SaveContactAsync(req);
        return NoContent();
    }

    // PUT api/clients/me/contacts — save primary contact and replace all secondary contacts
    [HttpPut("me/contacts")]
    public async Task<IActionResult> SaveContacts([FromBody] SaveContactsRequest req)
    {
        if (ClientValidator.ValidateContacts(req) is { } error) return BadRequest(new { error });
        await clients.SaveContactsAsync(req);
        return NoContent();
    }

    // POST api/clients/me/offices — create or update office
    [HttpPost("me/offices")]
    public async Task<IActionResult> SaveOffice([FromBody] SaveOfficeRequest req)
    {
        if (ClientValidator.ValidateOffice(req) is { } error) return BadRequest(new { error });
        var id = await clients.SaveOfficeAsync(req);
        return Ok(new { id });
    }

    // DELETE api/clients/me/offices/{officeId}
    [HttpDelete("me/offices/{officeId:long}")]
    public async Task<IActionResult> DeleteOffice(long officeId)
    {
        await clients.DeleteOfficeAsync(officeId);
        return NoContent();
    }

    // POST api/clients/me/companies — create or update subsidiary company
    [HttpPost("me/companies")]
    public async Task<IActionResult> SaveCompany([FromBody] SaveCompanyRequest req)
    {
        if (ClientValidator.ValidateCompany(req) is { } error)
            return BadRequest(new { error });
        var id = await clients.SaveCompanyAsync(req);
        return Ok(new { id });
    }

    // DELETE api/clients/me/companies/{companyId}
    [HttpDelete("me/companies/{companyId:long}")]
    public async Task<IActionResult> DeleteCompany(long companyId)
    {
        await clients.DeleteCompanyAsync(companyId);
        return NoContent();
    }

    // PUT api/clients/me/companies/{companyId}/address
    [HttpPut("me/companies/{companyId:long}/address")]
    public async Task<IActionResult> SaveCompanyAddress(long companyId, [FromBody] SaveAddressRequest req)
    {
        if (ClientValidator.ValidateAddress(req) is { } error) return BadRequest(new { error });
        await clients.SaveCompanyAddressAsync(companyId, req);
        return NoContent();
    }

    // PUT api/clients/me/companies/{companyId}/contact
    [HttpPut("me/companies/{companyId:long}/contact")]
    public async Task<IActionResult> SaveCompanyContact(long companyId, [FromBody] SaveContactRequest req)
    {
        if (ClientValidator.ValidateContact(req) is { } error) return BadRequest(new { error });
        await clients.SaveCompanyContactAsync(companyId, req);
        return NoContent();
    }

    // GET api/clients/me/companies/{companyId}/products
    [HttpGet("me/companies/{companyId:long}/products")]
    public async Task<IActionResult> GetProductAccess(long companyId)
    {
        try
        {
            var result = await clients.GetProductAccessAsync(companyId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    // PUT api/clients/me/companies/{companyId}/products
    [HttpPut("me/companies/{companyId:long}/products")]
    public async Task<IActionResult> SaveProductAccess(long companyId, [FromBody] SaveProductAccessRequest req)
    {
        try
        {
            await clients.SaveProductAccessAsync(companyId, req);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("me/companies/{companyId:long}/products/{productId:long}")]
    public async Task<IActionResult> DeleteProductAccess(long companyId, long productId)
    {
        try
        {
            await clients.DeleteProductAccessAsync(companyId, productId);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    // GET api/clients/reference/products — all LOB products for UI dropdowns
    [HttpGet("reference/products")]
    public async Task<IActionResult> GetAllProducts()
    {
        var result = await clients.GetAllProductsAsync();
        return Ok(result);
    }
}
