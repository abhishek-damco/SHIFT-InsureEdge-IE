// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
using InsureEdge.API.Filters;
using InsureEdge.Application.DTOs.Distribution;
using InsureEdge.Domain.Enums;
using InsureEdge.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/intermediaries")]
[Authorize]
public class IntermediariesController(IntermediaryService intermediaries) : ControllerBase
{
    [HttpGet]
    [Permission("DISTRIBUTIONLANDINGPAGE", PermissionType.View)]
    public async Task<IActionResult> GetList() => Ok(await intermediaries.GetListAsync());

    [HttpGet("{id:long}")]
    [Permission("DISTRIBUTIONLANDINGPAGE", PermissionType.View)]
    public async Task<IActionResult> GetById(long id)
    {
        var detail = await intermediaries.GetByIdAsync(id);
        return detail == null ? NotFound(new { error = "Intermediary not found." }) : Ok(detail);
    }

    [HttpPost]
    [Permission("DIST_ADDINTERMEDIARY", PermissionType.Add)]
    public async Task<IActionResult> Create([FromBody] SaveIntermediaryRequest req)
    {
        var created = await intermediaries.CreateAsync(req);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:long}")]
    [Permission("DIST_ADDINTERMEDIARY", PermissionType.Edit)]
    public async Task<IActionResult> Update(long id, [FromBody] SaveIntermediaryRequest req)
    {
        var updated = await intermediaries.UpdateAsync(id, req);
        return updated == null ? NotFound(new { error = "Intermediary not found." }) : Ok(updated);
    }

    [HttpDelete("{id:long}")]
    [Permission("DIST_ADDINTERMEDIARY", PermissionType.Edit)]
    public async Task<IActionResult> Delete(long id)
    {
        var deleted = await intermediaries.DeleteAsync(id);
        return deleted ? NoContent() : NotFound(new { error = "Intermediary not found." });
    }
}
