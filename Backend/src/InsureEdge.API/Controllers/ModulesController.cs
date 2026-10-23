// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Distribution Management: modules/screens lookup for the Assign Rights wizard step
// (AssignRightsPage.tsx) and the "Assigned Rights" tab (ViewIntermediaryPage.tsx).
using InsureEdge.Application.DTOs.Distribution;
using InsureEdge.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/modules")]
[Authorize]
public class ModulesController(IntermediaryScreenPermissionService screenPermissions) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetModules()
    {
        var screens = await screenPermissions.GetAllScreensAsync();
        var modules = screens
            .GroupBy(s => (s.ModuleId, s.ModuleName))
            .Select(g => new ModuleListItemDto(g.Key.ModuleId, g.Key.ModuleName ?? "Unknown"))
            .OrderBy(m => m.Id)
            .ToList();
        return Ok(modules);
    }

    [HttpGet("screens/all")]
    public async Task<IActionResult> GetAllScreens()
        => Ok(await screenPermissions.GetAllScreensAsync());
}
