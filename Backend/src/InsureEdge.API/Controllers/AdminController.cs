using InsureEdge.Application.Interfaces;
using InsureEdge.Infrastructure.Data;
using InsureEdge.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/admin")]
[AllowAnonymous]  // Temporary for testing - remove in production
public class AdminController : ControllerBase
{
    private readonly InsureEdgeDbContext _db;
    private readonly RenewalQuoteService _renewalService;
    private readonly ICurrentTenantService _tenant;

    public AdminController(InsureEdgeDbContext db, RenewalQuoteService renewalService, ICurrentTenantService tenant)
    {
        _db = db;
        _renewalService = renewalService;
        _tenant = tenant;
    }

    /// <summary>
    /// TEMPORARY: Manually trigger renewal creation for a specific policy
    /// Remove this endpoint before production deployment
    /// </summary>
    [HttpPost("trigger-renewal/{policyNumber}")]
    public async Task<IActionResult> TriggerRenewal(string policyNumber)
    {
        try
        {
            // Find the policy
            var policy = await _db.Policies
                .FirstOrDefaultAsync(p => p.PolicyNumber == policyNumber);

            if (policy == null)
                return NotFound(new { error = $"Policy {policyNumber} not found" });

            // Directly call renewal service without tenant context requirement
            // (temporary for testing - remove before production)
            var result = await _renewalService.CreateRenewalQuoteAsync(
                priorPolicyNumber: policyNumber,
                renewalOfferDate: DateOnly.FromDateTime(DateTime.UtcNow),
                createdBy: 0  // System user
            );

            if (!result.Success)
                return BadRequest(new { error = result.Message, details = result.Message });

            return Ok(new
            {
                success = true,
                message = "Renewal quote created successfully",
                quoteNumber = result.QuoteNumber,
                policyNumber = policyNumber,
                note = "The renewal quote has been automatically created. Check the database or UI to view it."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stack = ex.StackTrace });
        }
    }
}
