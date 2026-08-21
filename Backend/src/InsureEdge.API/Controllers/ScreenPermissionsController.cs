// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Distribution Management "Assigned Rights" tab (ViewIntermediaryPage.tsx RightsTab):
// per-intermediary screen access grant, independent of the Group-level screen_permissions
// used by User Groups Management. See db/026_intermediary_screen_permissions.sql.
using InsureEdge.API.Filters;
using InsureEdge.Application.DTOs.Distribution;
using InsureEdge.Domain.Enums;
using InsureEdge.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/screen-permissions")]
[Authorize]
public class ScreenPermissionsController(IntermediaryScreenPermissionService screenPermissions) : ControllerBase
{
    [HttpGet("by-intermediary/{intermediaryId:long}")]
    [Permission("DISTRIBUTIONLANDINGPAGE", PermissionType.View)]
    public async Task<IActionResult> GetByIntermediary(long intermediaryId)
    {
        var result = await screenPermissions.GetByIntermediaryAsync(intermediaryId);
        return result == null ? NotFound(new { error = "Intermediary not found." }) : Ok(result);
    }

    public record SaveRequest([property: JsonPropertyName("permissions")] List<SaveIntermediaryScreenPermissionRequest> Permissions);

    [HttpPost("by-intermediary/{intermediaryId:long}")]
    [Permission("DISTRIBUTIONLANDINGPAGE", PermissionType.Edit)]
    public async Task<IActionResult> SaveByIntermediary(long intermediaryId, [FromBody] SaveRequest req)
    {
        var saved = await screenPermissions.SaveByIntermediaryAsync(intermediaryId, req.Permissions);
        if (!saved) return NotFound(new { error = "Intermediary not found." });
        return Ok(await screenPermissions.GetByIntermediaryAsync(intermediaryId));
    }
}
