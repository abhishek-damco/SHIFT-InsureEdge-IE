using InsureEdge.Application.DTOs.Claim;
using InsureEdge.Application.Interfaces;
using InsureEdge.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/claims/{claimId:long}/worksheets")]
[Authorize]
public class WorksheetController(WorksheetService worksheets, ICurrentTenantService tenant) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMatrix(long claimId) =>
        Ok(await worksheets.GetMatrixAsync(claimId, tenant.ClientId));

    [HttpGet("{id:long}")]
    public async Task<IActionResult> Get(long claimId, long id)
    {
        var result = await worksheets.GetWorksheetAsync(id, tenant.ClientId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost("save")]
    public async Task<IActionResult> Save(long claimId, [FromBody] SaveWorksheetRequest req)
    {
        try { return Ok(await worksheets.SaveAsync(claimId, tenant.ClientId, tenant.UserId, req)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message, detail = ex.InnerException?.Message }); }
    }

    [HttpPost("{id:long}/approve")]
    public async Task<IActionResult> Approve(long claimId, long id)
    {
        try { return Ok(await worksheets.ApproveAsync(id, tenant.ClientId, tenant.UserId)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPost("{id:long}/deny")]
    public async Task<IActionResult> Deny(long claimId, long id)
    {
        try { return Ok(await worksheets.DenyAsync(id, tenant.ClientId, tenant.UserId)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPost("{id:long}/escalate")]
    public async Task<IActionResult> Escalate(long claimId, long id, [FromBody] EscalateWorksheetRequest req)
    {
        try { return Ok(await worksheets.EscalateAsync(id, req.EscalateTo, tenant.ClientId, tenant.UserId)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }
}
