// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// HBIS rating engine — screen: NBQUOTESSCREEN
// Ported from server.js POST /api/plan-comparison (+ /api/hbis/plan-comparison alias)
// and GET /api/hb-tax-details.
using InsureEdge.API.Filters;
using InsureEdge.Application.DTOs.QuotesPolicies;
using InsureEdge.Application.Services;
using InsureEdge.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class RatingController : ControllerBase
{
    private readonly RatingService _rating;

    public RatingController(RatingService rating) => _rating = rating;

    // TEMPORARILY DISABLED (3 endpoints) — PlanComparison, Rate, HBPolicyTaxDetails depend on
    // InsureEdge.Infrastructure.Rating namespace (HbisPlanComparisonChart, RatingInputs, Rater,
    // RaterFunctions) that do not exist. See VERSIONS.md.
    // NOTE: LimitsAndCoverages IS enabled below (needed by Finalize Quote screen).
    /*
    [HttpPost("plan-comparison")]
    [Permission("NBQUOTESSCREEN", PermissionType.View)]
    public async Task<IActionResult> PlanComparison(
        [FromBody] HbisPlanComparisonForm form,
        [FromServices] InsureEdge.Infrastructure.Rating.HbisPlanComparisonChart chart)
    {
        try
        {
            // HBISPlanComparisonChart: when the quote carries hexzone geo data the real
            // IERatingEngine Rater prices all three tiers (Get{Basic|Standard|Preferred}
            // RaterAPI). Quotes without hexzones (no geocode yet) fall back to the
            // legacy prototype static tables so the wizard still renders.
            if (!string.IsNullOrWhiteSpace(form.HexZoneLR))
                return Ok(await chart.BuildAsync(form));
            return Ok(_rating.CalculatePlanComparison(form));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // Alias per server.js (POST /api/hbis/plan-comparison)
    [HttpPost("hbis/plan-comparison")]
    [Permission("NBQUOTESSCREEN", PermissionType.View)]
    public Task<IActionResult> PlanComparisonAlias(
        [FromBody] HbisPlanComparisonForm form,
        [FromServices] InsureEdge.Infrastructure.Rating.HbisPlanComparisonChart chart) => PlanComparison(form, chart);

    // ─── IERatingEngine Rater (Service Action, ported 1:1 from the OutSystems module) ─
    // Full hexzone/flood/wildfire data-driven rating. Query params ClaculateRateModification
    // and ClaculateRecurringRPS mirror the original service action's boolean inputs.
    [HttpPost("rater")]
    [Permission("NBQUOTESSCREEN", PermissionType.View)]
    public async Task<IActionResult> Rate(
        [FromBody] InsureEdge.Infrastructure.Rating.RatingInputs inputs,
        [FromServices] InsureEdge.Infrastructure.Rating.Rater rater,
        [FromQuery] bool claculateRateModification = false,
        [FromQuery] bool claculateRecurringRps = false)
    {
        try
        {
            return Ok(await rater.RateAsync(inputs, claculateRateModification, claculateRecurringRps));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // HBPolicyTaxDetails (Service Action) — exact port incl. Oregon/Pennsylvania flat
    // stamping fees; coexists with the legacy prototype hb-tax-details endpoint below.
    [HttpGet("hb-policy-tax-details")]
    [Permission("NBQUOTESSCREEN", PermissionType.View)]
    public async Task<IActionResult> HBPolicyTaxDetails(
        [FromServices] InsureEdge.Infrastructure.Rating.RaterFunctions fn,
        [FromQuery] string state,
        [FromQuery] decimal premiumValue = 0,
        [FromQuery] decimal policyFee = 0,
        [FromQuery] decimal fireTax = 0,
        [FromQuery] decimal allOtherPerils = 0)
    {
        if (string.IsNullOrWhiteSpace(state))
            return BadRequest(new { error = "state is required." });
        try
        {
            return Ok(await fn.HBPolicyTaxDetailsAsync(state, premiumValue, policyFee, fireTax, allOtherPerils));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
    */

    // GetHBISLimitsandCoverages (IE_Policy_CS server action) — data source of the
    // Limits & Coverages screen; applies the captured empty-value defaults.
    // ⚠️ CRITICAL: MUST REMAIN ENABLED
    // Uses HbisLimitsAndCoveragesService (which EXISTS, unlike other commented-out endpoints).
    // If disabled, GET /api/hbis/limits-and-coverages/{id} returns 404 and breaks Finalize Quote screen.
    // Do NOT comment out with other disabled Rating endpoints. See git blame for July 2026 fix.
    [HttpGet("hbis/limits-and-coverages/{id}")]
    public async Task<IActionResult> LimitsAndCoverages(
        string id,
        [FromServices] InsureEdge.Infrastructure.Services.HbisLimitsAndCoveragesService svc,
        [FromServices] InsureEdge.Application.Interfaces.ICurrentTenantService tenant)
    {
        try
        {
            var result = await svc.GetAsync(tenant.ClientId, id);
            return result == null ? NotFound(new { error = "Policy not found." }) : Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("hb-tax-details")]
    [Permission("NBQUOTESSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetHbTaxDetails(
        [FromQuery] string state,
        [FromQuery] decimal premiumValue = 0,
        [FromQuery] decimal policyFee = 0)
    {
        if (string.IsNullOrWhiteSpace(state))
            return BadRequest(new { error = "state is required." });

        try
        {
            return Ok(await _rating.GetHbTaxDetailsAsync(state, premiumValue, policyFee));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
