// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
using InsureEdge.API.Filters;
using InsureEdge.Application.DTOs.Distribution;
using InsureEdge.Domain.Enums;
using InsureEdge.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/producers")]
[Authorize]
public class ProducersController(ProducerService producers) : ControllerBase
{
    [HttpGet("by-intermediary/{intermediaryId:long}")]
    [Permission("DIST_ADDINTERMEDIARY", PermissionType.View)]
    public async Task<IActionResult> GetByIntermediary(long intermediaryId)
        => Ok(await producers.GetByIntermediaryAsync(intermediaryId));

    [HttpGet("{id:long}")]
    [Permission("DIST_ADDINTERMEDIARY", PermissionType.View)]
    public async Task<IActionResult> GetById(long id)
    {
        var producer = await producers.GetByIdAsync(id);
        return producer == null ? NotFound(new { error = "Producer not found." }) : Ok(producer);
    }

    [HttpPost]
    [Permission("DIST_ADDINTERMEDIARY", PermissionType.Add)]
    public async Task<IActionResult> Create([FromBody] SaveProducerRequest req)
    {
        var (success, error, producer) = await producers.CreateAsync(req);
        if (!success) return BadRequest(new { error });
        return CreatedAtAction(nameof(GetById), new { id = producer!.Id }, producer);
    }

    [HttpPut("{id:long}")]
    [Permission("DIST_ADDINTERMEDIARY", PermissionType.Edit)]
    public async Task<IActionResult> Update(long id, [FromBody] SaveProducerRequest req)
    {
        var (success, error, producer) = await producers.UpdateAsync(id, req);
        if (!success) return producer == null && error == "Producer not found." ? NotFound(new { error }) : BadRequest(new { error });
        return Ok(producer);
    }

    [HttpDelete("{id:long}")]
    [Permission("DIST_ADDINTERMEDIARY", PermissionType.Edit)]
    public async Task<IActionResult> Delete(long id)
    {
        var deleted = await producers.DeleteAsync(id);
        return deleted ? NoContent() : NotFound(new { error = "Producer not found." });
    }

    // Producer self-service login: emails a "set your password" link (reuses the same
    // onboarding-token flow as staff user setup). Requires the Producer to already have
    // an email on file. Never returns a password — no one, including staff, sets or sees it.
    [HttpPost("{id:long}/invite")]
    [Permission("DIST_ADDINTERMEDIARY", PermissionType.Edit)]
    public async Task<IActionResult> Invite(long id)
    {
        var (success, error) = await producers.InviteAsync(id);
        return success ? Ok(new { message = "Invitation sent." }) : BadRequest(new { error });
    }
}
