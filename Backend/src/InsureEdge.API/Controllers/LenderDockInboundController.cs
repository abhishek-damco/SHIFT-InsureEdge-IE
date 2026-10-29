// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Inbound LenderDock endpoints — mirrors the OutSystems "lenderdock_essentials/rest/
// hudsonbailey" path exactly (host will differ, path kept identical to minimize the
// vendor-side reconfiguration to just a base-URL change once cutover is coordinated).
//
// Auth: HTTP Basic, checked by LenderDockBasicAuthFilter against LENDERDOCK_INBOUND_USERNAME/
// PASSWORD in .env — a new credential pair for this app, not the original OutSystems login.
using InsureEdge.API.Filters;
using InsureEdge.Application.DTOs.LenderDock;
using InsureEdge.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[AllowAnonymous]
[ServiceFilter(typeof(LenderDockBasicAuthFilter))]
[Route("lenderdock_essentials/rest/hudsonbailey")]
public class LenderDockInboundController : ControllerBase
{
    private readonly LenderDockInboundService _service;

    public LenderDockInboundController(LenderDockInboundService service)
    {
        _service = service;
    }

    [HttpPost("payment")]
    public async Task<IActionResult> Payment([FromBody] LenderDockPaymentRequest data)
    {
        if (string.IsNullOrWhiteSpace(data.PolicyNumber))
            return BadRequest("policyNumber is required.");

        var updated = await _service.RecordPaymentAsync(data);
        if (!updated)
            return NotFound("No matching active policy/payment transaction found.");

        return Ok("Payment recorded.");
    }

    [HttpGet("search/{policyNumber}")]
    public async Task<IActionResult> Search(string policyNumber)
    {
        if (string.IsNullOrWhiteSpace(policyNumber))
            return BadRequest("policyNumber is required.");

        return Ok(await _service.SearchByPolicyNumberAsync(policyNumber));
    }

    [HttpGet("search/alt")]
    public async Task<IActionResult> SearchAlt([FromQuery] string lastName, [FromQuery] string zipCode)
    {
        if (string.IsNullOrWhiteSpace(lastName) || string.IsNullOrWhiteSpace(zipCode))
            return BadRequest("lastName and zipCode are required.");

        return Ok(await _service.SearchByAltAsync(lastName, zipCode));
    }

    [HttpGet("search/details/{policyNumber}/{asOfDate}")]
    public async Task<IActionResult> SearchDetails(string policyNumber, DateOnly asOfDate)
    {
        if (string.IsNullOrWhiteSpace(policyNumber))
            return BadRequest("policyNumber and asOfDate are required.");

        var result = await _service.GetPolicyDetailsAsync(policyNumber, asOfDate);
        return result == null ? NotFound() : Ok(result);
    }
}
