using InsureEdge.Application.DTOs.ClaimLetter;
using InsureEdge.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/claims/{claimId:long}/letters")]
[Authorize]
public class ClaimLettersController : ControllerBase
{
    private readonly ClaimLetterService _service;

    public ClaimLettersController(ClaimLetterService service) => _service = service;

    // GET /api/claims/{claimId}/letters
    [HttpGet]
    public async Task<IActionResult> GetList(long claimId)
        => Ok(await _service.GetListAsync(claimId));

    // GET /api/claims/{claimId}/letters/{letterId}
    [HttpGet("{letterId:long}")]
    public async Task<IActionResult> GetById(long claimId, long letterId)
    {
        var result = await _service.GetByIdAsync(letterId);
        return result == null ? NotFound() : Ok(result);
    }

    // POST /api/claims/{claimId}/letters  (create or update — Id null = create)
    [HttpPost]
    public async Task<IActionResult> Save(long claimId, [FromBody] SaveClaimLetterRequest req)
    {
        var id = await _service.SaveAsync(req with { ClaimId = claimId });
        return Ok(new { id });
    }

    // PUT /api/claims/{claimId}/letters/{letterId}  (explicit update with id in route)
    [HttpPut("{letterId:long}")]
    public async Task<IActionResult> Update(long claimId, long letterId, [FromBody] SaveClaimLetterRequest req)
    {
        var id = await _service.SaveAsync(req with { Id = letterId, ClaimId = claimId });
        return Ok(new { id });
    }

    // POST /api/claims/{claimId}/letters/{letterId}/send
    [HttpPost("{letterId:long}/send")]
    public async Task<IActionResult> Send(long claimId, long letterId)
    {
        var ok = await _service.SendAsync(letterId);
        return ok ? Ok(new { sent = true }) : NotFound();
    }

    // DELETE /api/claims/{claimId}/letters/{letterId}
    [HttpDelete("{letterId:long}")]
    public async Task<IActionResult> Delete(long claimId, long letterId)
    {
        var ok = await _service.DeleteAsync(letterId);
        return ok ? Ok() : NotFound();
    }
}
