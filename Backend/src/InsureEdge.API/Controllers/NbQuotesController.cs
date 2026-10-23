// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// New Business Quotes register — screen: NBQUOTESSCREEN
// Ported from server.js GET /api/:insuredType/nb-quotes[/kpis].
using InsureEdge.API.Filters;
using InsureEdge.Application.DTOs.QuotesPolicies;
using InsureEdge.Application.Services;
using InsureEdge.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/{insuredType}/nb-quotes")]
[Authorize]
public class NbQuotesController : ControllerBase
{
    private readonly PolicyQuoteService _quotes;

    public NbQuotesController(PolicyQuoteService quotes) => _quotes = quotes;

    [HttpGet("kpis")]
    public async Task<IActionResult> GetKpis(string insuredType)
    {
        try
        {
            return Ok(await _quotes.GetNbQuotesKpisAsync(insuredType));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetList(
        string insuredType,
        [FromQuery] string? search,
        [FromQuery] string? approvalStatus,
        [FromQuery] string? lob,
        [FromQuery] string? status,
        [FromQuery] string? sortCol,
        [FromQuery] string? sortDir,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var query = new PolicyRegisterListQuery(insuredType, search, approvalStatus, lob, status, sortCol, sortDir, page, pageSize);
            return Ok(await _quotes.GetNbQuotesAsync(query));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
