// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Endorsements register — screen: ENDORSEMENTSSCREEN
// Ported from server.js GET /api/:insuredType/endorsements[/kpis].
using InsureEdge.API.Filters;
using InsureEdge.Application.Services;
using InsureEdge.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/{insuredType}/endorsements")]
[Authorize]
public class EndorsementsController : ControllerBase
{
    private readonly PolicyQuoteService _quotes;

    public EndorsementsController(PolicyQuoteService quotes) => _quotes = quotes;

    [HttpGet("kpis")]
    public async Task<IActionResult> GetKpis(string insuredType)
    {
        try
        {
            return Ok(await _quotes.GetEndorsementsKpisAsync(insuredType));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetList(string insuredType, [FromQuery] string? search)
    {
        try
        {
            return Ok(await _quotes.GetEndorsementsAsync(insuredType, search));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
