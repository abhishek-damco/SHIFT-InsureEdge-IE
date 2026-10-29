using InsureEdge.API.Filters;
using InsureEdge.Application.DTOs.Dashboard;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
[Permission("DASHBOARD", PermissionType.View)]
public class DashboardController(IDashboardService dashboard) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary(CancellationToken cancellationToken) =>
        Ok(await dashboard.GetSummaryAsync(cancellationToken));

    [HttpGet("quotes")]
    public async Task<ActionResult<DashboardQuoteResponse>> GetQuotes(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? sortColumn = "creationDate",
        [FromQuery] string? sortDirection = "desc",
        [FromQuery] string? accountType = null,
        [FromQuery] string? transactionType = null,
        [FromQuery] string? insuredName = null,
        [FromQuery] string? lob = null,
        [FromQuery] string? effectiveDate = null,
        [FromQuery] string? approvalStatus = null,
        [FromQuery] string? creationDate = null,
        [FromQuery] string? premiumEstimate = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        if (!TryDate(effectiveDate, "effectiveDate", out var effective, out var dateError)) return dateError!;
        if (!TryDate(creationDate, "creationDate", out var created, out dateError)) return dateError!;
        if (!TryDecimal(premiumEstimate, "premiumEstimate", out var premium, out var decimalError)) return decimalError!;
        if (page < 1) return BadRequest(new { error = "page must be greater than zero." });
        if (pageSize is not (10 or 25 or 50)) return BadRequest(new { error = "pageSize must be 10, 25, or 50." });
        if (sortDirection is not null && !sortDirection.Equals("asc", StringComparison.OrdinalIgnoreCase) && !sortDirection.Equals("desc", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "sortDirection must be asc or desc." });

        var query = new DashboardQuoteQuery(page, pageSize, search, sortColumn, sortDirection, accountType,
            transactionType, insuredName, lob, effective, approvalStatus, created, premium, status);
        return Ok(await dashboard.GetQuotesAsync(query, cancellationToken));
    }

    [HttpGet("pending-cancellations")]
    public async Task<IActionResult> GetPendingCancellations([FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null, [FromQuery] string? sortColumn = null, [FromQuery] string? sortDirection = "asc",
        CancellationToken cancellationToken = default)
    {
        var validation = ValidateListQuery(page, pageSize, sortDirection);
        if (validation is not null) return validation;
        return await RunPersonaQuery(() => dashboard.GetPendingCancellationsAsync(new DashboardListQuery(page, pageSize, search, sortColumn, sortDirection), cancellationToken));
    }

    [HttpGet("renewal-radar")]
    public async Task<IActionResult> GetRenewalRadar([FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null, [FromQuery] string? sortColumn = null, [FromQuery] string? sortDirection = "asc",
        CancellationToken cancellationToken = default)
    {
        var validation = ValidateListQuery(page, pageSize, sortDirection);
        if (validation is not null) return validation;
        return await RunPersonaQuery(() => dashboard.GetRenewalRadarAsync(new DashboardListQuery(page, pageSize, search, sortColumn, sortDirection), cancellationToken));
    }

    [HttpGet("failed-payments")]
    public async Task<IActionResult> GetFailedPayments([FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null, [FromQuery] string? sortColumn = null, [FromQuery] string? sortDirection = "asc",
        [FromQuery] string? policyNumber = null, [FromQuery] DateOnly? effectiveDate = null,
        [FromQuery] DateOnly? expiryDate = null, [FromQuery] DateOnly? paymentDate = null,
        [FromQuery] decimal? amountDue = null, [FromQuery] string? reason = null,
        CancellationToken cancellationToken = default)
    {
        var validation = ValidateListQuery(page, pageSize, sortDirection);
        if (validation is not null) return validation;
        return await RunPersonaQuery(() => dashboard.GetFailedPaymentsAsync(
            new DashboardListQuery(page, pageSize, search, sortColumn, sortDirection, policyNumber,
                effectiveDate, expiryDate, paymentDate, amountDue, reason), cancellationToken));
    }

    [HttpGet("preference")]
    public async Task<ActionResult<DashboardPreferenceDto>> GetPreference(CancellationToken cancellationToken) =>
        Ok(await dashboard.GetPreferenceAsync(cancellationToken));

    [HttpPut("preference")]
    public async Task<IActionResult> SavePreference([FromBody] DashboardPreferenceDto request, CancellationToken cancellationToken)
    {
        try { return Ok(await dashboard.SavePreferenceAsync(request, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = ex.Message }); }
    }

    [HttpPost("activity/view")]
    public async Task<IActionResult> RecordView([FromBody] DashboardActivityRequest request, CancellationToken cancellationToken)
    {
        try
        {
            await dashboard.RecordViewAsync(request.PolicyId, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPost("policies/{policyId:long}/renewal")]
    public async Task<IActionResult> InitiateRenewal(long policyId, CancellationToken cancellationToken)
    {
        try { return Ok(await dashboard.InitiateRenewalAsync(policyId, cancellationToken)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
    }

    private async Task<IActionResult> RunPersonaQuery<T>(Func<Task<T>> action)
    {
        try { return Ok(await action()); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message }); }
    }

    private IActionResult? ValidateListQuery(int page, int pageSize, string? sortDirection)
    {
        if (page < 1) return BadRequest(new { error = "page must be greater than zero." });
        if (pageSize is not (10 or 25 or 50)) return BadRequest(new { error = "pageSize must be 10, 25, or 50." });
        if (sortDirection is not null && !sortDirection.Equals("asc", StringComparison.OrdinalIgnoreCase) && !sortDirection.Equals("desc", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "sortDirection must be asc or desc." });
        return null;
    }

    private bool TryDate(string? raw, string name, out DateOnly? value, out ActionResult? error)
    {
        value = null;
        error = null;
        if (string.IsNullOrWhiteSpace(raw)) return true;
        if (DateOnly.TryParse(raw, out var parsed)) { value = parsed; return true; }
        error = BadRequest(new { error = $"{name} must be a valid date." });
        return false;
    }

    private bool TryDecimal(string? raw, string name, out decimal? value, out ActionResult? error)
    {
        value = null;
        error = null;
        if (string.IsNullOrWhiteSpace(raw)) return true;
        if (decimal.TryParse(raw, out var parsed) && parsed >= 0) { value = parsed; return true; }
        error = BadRequest(new { error = $"{name} must be a non-negative number." });
        return false;
    }
}
