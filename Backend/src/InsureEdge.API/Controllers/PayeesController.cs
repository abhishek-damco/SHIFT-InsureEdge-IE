using InsureEdge.Application.DTOs.Payee;
using InsureEdge.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/payees")]
[Authorize]
public class PayeesController : ControllerBase
{
    private readonly PayeeService _payees;

    public PayeesController(PayeeService payees) => _payees = payees;

    // GET /api/payees  — all payees for this client (admin/global view)
    [HttpGet]
    public async Task<IActionResult> GetList()
        => Ok(await _payees.GetListAsync());

    // GET /api/payees/by-claim/{claimId}  — payees scoped to one claim
    [HttpGet("by-claim/{claimId:long}")]
    public async Task<IActionResult> GetByClaim(long claimId)
        => Ok(await _payees.GetListByClaimAsync(claimId));

    // GET /api/payees/kpi  — status KPI across all payees for this client
    [HttpGet("kpi")]
    public async Task<IActionResult> GetKpi()
        => Ok(await _payees.GetStatusKpiAsync());

    // GET /api/payees/kpi/by-claim/{claimId}  — status KPI scoped to one claim
    [HttpGet("kpi/by-claim/{claimId:long}")]
    public async Task<IActionResult> GetKpiByClaim(long claimId)
        => Ok(await _payees.GetStatusKpiAsync(claimId));

    // POST /api/payees  — create payee + bank detail in one call
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePayeeRequest req)
    {
        var id = await _payees.CreateAsync(req);
        return Ok(new { id });
    }

    // PUT /api/payees/{id}/banking  — add or update banking details on existing payee
    [HttpPut("{id:long}/banking")]
    public async Task<IActionResult> UpdateBanking(long id, [FromBody] CreateBankDetailRequest req)
    {
        await _payees.UpdateBankingAsync(id, req);
        return Ok();
    }

    // POST /api/payees/{id}/send-for-approval  — Draft → Pending
    [HttpPost("{id:long}/send-for-approval")]
    public async Task<IActionResult> SendForApproval(long id)
    {
        await _payees.SendForApprovalAsync(id);
        return Ok();
    }
}
