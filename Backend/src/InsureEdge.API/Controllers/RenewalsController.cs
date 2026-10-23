// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Renewals register — screen: RENEWALSSCREEN
// Ported from server.js GET /api/:insuredType/renewals[/kpis].
using InsureEdge.API.Filters;
using InsureEdge.Application.DTOs.QuotesPolicies;
using InsureEdge.Application.Services;
using InsureEdge.Infrastructure.Services;
using InsureEdge.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/{insuredType}/renewals")]
[Authorize]
public class RenewalsController : ControllerBase
{
    private readonly PolicyQuoteService _quotes;
    private readonly RenewalQuoteService _renewals;
    private readonly ILogger<RenewalsController> _log;

    public RenewalsController(
        PolicyQuoteService quotes,
        RenewalQuoteService renewals,
        ILogger<RenewalsController> log)
    {
        _quotes = quotes;
        _renewals = renewals;
        _log = log;
    }

    [HttpGet("kpis")]
    [InsuredTypePermission("RENEWALINDIVIDUAL", "RENEWALBUSINESS", PermissionType.View)]
    public async Task<IActionResult> GetKpis(string insuredType)
    {
        try
        {
            return Ok(await _quotes.GetRenewalsKpisAsync(insuredType));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet]
    [InsuredTypePermission("RENEWALINDIVIDUAL", "RENEWALBUSINESS", PermissionType.View)]
    public async Task<IActionResult> GetList(string insuredType, [FromQuery] string? search)
    {
        try
        {
            return Ok(await _quotes.GetRenewalsAsync(insuredType, search));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // ─── Renewal Creation ────────────────────────────────────────────────────

    [HttpPost("create")]
    [Permission("RENEWALSSCREEN", PermissionType.Add)]
    public async Task<IActionResult> CreateRenewal([FromBody] CreateRenewalQuoteRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.PriorPolicyNumber))
            return BadRequest(new { error = "Prior policy number is required" });

        try
        {
            var result = await _renewals.CreateRenewalQuoteAsync(
                req.PriorPolicyNumber,
                req.RenewalOfferDate);

            return result.Success ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "CreateRenewal: Error creating renewal");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // ─── Renewal Detail ──────────────────────────────────────────────────────

    [HttpGet("{renewalPolicyId}")]
    [Permission("RENEWALSSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetDetail(long renewalPolicyId)
    {
        try
        {
            var detail = await _renewals.GetRenewalQuoteDetailAsync(renewalPolicyId);
            return detail == null
                ? NotFound(new { error = "Renewal quote not found" })
                : Ok(detail);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // ─── Renewal Binding ─────────────────────────────────────────────────────

    [HttpPost("{renewalPolicyId}/bind")]
    [Permission("RENEWALSSCREEN", PermissionType.Edit)]
    public async Task<IActionResult> BindRenewal(long renewalPolicyId, [FromBody] BindRenewalQuoteRequest? req = null)
    {
        try
        {
            var result = await _renewals.BindRenewalQuoteAsync(renewalPolicyId);
            return result.Success ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "BindRenewal: Error binding renewal");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // ─── Payment Processing ──────────────────────────────────────────────────

    [HttpPost("{renewalPolicyId}/process-payment")]
    [Permission("RENEWALSSCREEN", PermissionType.Edit)]
    public async Task<IActionResult> ProcessPayment(long renewalPolicyId, [FromBody] ProcessRenewalPaymentRequest req)
    {
        try
        {
            var result = await _renewals.ProcessPaymentAsync(
                renewalPolicyId,
                responsibleParty: "LENDER", // Default to non-insured; can be parameterized if needed
                req.PaymentMethod,
                req.AmountPaid);

            return result.Success ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "ProcessPayment: Error processing payment");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
