// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// US-001..US-009/US-011/US-012: All group endpoints.
// ADR-003: Every mutating endpoint decorated with PermissionAttribute for the correct type.
using InsureEdge.API.Filters;
using InsureEdge.Application.DTOs.Group;
using InsureEdge.Application.Services;
using InsureEdge.Domain.Enums;
using InsureEdge.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/groups")]
[Authorize]
public class GroupsController : ControllerBase
{
    private readonly GroupService _groups;
    private readonly InsureEdgeDbContext _db;

    public GroupsController(GroupService groups, InsureEdgeDbContext db) { _groups = groups; _db = db; }

    // US-001: Paginated list with stat cards
    [HttpGet]
    [Permission("USERGROUPPAGE", PermissionType.View)]
    public async Task<IActionResult> GetList(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? sortBy,
        [FromQuery] string sortOrder = "asc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var (items, total, active, inactive) = await _groups.GetGroupListAsync(
            search, status, sortBy, sortOrder, page, pageSize);
        return Ok(new GroupListResponse(items, total, active, inactive));
    }

    // US-003: Full group detail
    [HttpGet("{id:long}")]
    [Permission("USERGROUPPAGE", PermissionType.View)]
    public async Task<IActionResult> GetById(long id)
    {
        var detail = await _groups.GetGroupByIdAsync(id);
        return detail == null ? NotFound() : Ok(detail);
    }

    // US-002: Create group
    [HttpPost]
    [Permission("USERGROUPPAGE", PermissionType.Add)]
    public async Task<IActionResult> Create([FromBody] CreateGroupRequest req)
    {
        try
        {
            var id = await _groups.CreateGroupAsync(req);
            return CreatedAtAction(nameof(GetById), new { id }, new { id });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { errors = ex.Errors });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { errors = new[] { ex.Message } });
        }
    }

    // US-004/US-007: Update group info (including status)
    [HttpPatch("{id:long}/info")]
    [Permission("USERGROUPPAGE", PermissionType.Edit)]
    public async Task<IActionResult> UpdateInfo(long id, [FromBody] UpdateGroupInfoRequest req)
    {
        try
        {
            await _groups.UpdateGroupInfoAsync(id, req);
            return NoContent();
        }
        catch (KeyNotFoundException)  { return NotFound(); }
        catch (ValidationException ex) { return BadRequest(new { errors = ex.Errors }); }
    }

    // US-005/US-011: Full-replace member sync (BR-005)
    [HttpPut("{id:long}/members")]
    [Permission("USERGROUPPAGE", PermissionType.Edit)]
    public async Task<IActionResult> SyncMembers(long id, [FromBody] SyncMembersRequest req)
    {
        try
        {
            await _groups.SyncMembersAsync(id, req.MemberIds);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // US-006/US-012: Save permissions (BR-011)
    [HttpPut("{id:long}/permissions")]
    [Permission("USERGROUPPAGE", PermissionType.Edit)]
    public async Task<IActionResult> SavePermissions(long id, [FromBody] SavePermissionsRequest req)
    {
        try
        {
            await _groups.SavePermissionsAsync(id, req.Permissions);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // US-008: Export all (filtered)
    [HttpGet("export")]
    [Permission("USERGROUPPAGE", PermissionType.Download)]
    public async Task<IActionResult> Export(
        [FromQuery] string format = "csv",
        [FromQuery] string? search = null,
        [FromQuery] string? status = null)
    {
        var bytes = await _groups.ExportAsync(format, search, status, null);
        var contentType = format == "csv" ? "text/csv" : "application/octet-stream";
        return File(bytes, contentType, $"groups.{format}");
    }

    // Screens list for permission matrix — grouped by module
    [HttpGet("screens")]
    [Permission("USERGROUPPAGE", PermissionType.View)]
    public async Task<IActionResult> GetScreens()
    {
        var screens = await _db.AppScreens
            .Include(s => s.Module)
            .OrderBy(s => s.Module.ModuleName)
            .ThenBy(s => s.ScreenName)
            .Select(s => new {
                screenId   = s.Id,
                screenCode = s.ScreenCode ?? "",
                screenName = s.ScreenName,
                moduleId   = s.ModuleId,
                moduleName = s.Module != null ? s.Module.ModuleName : "",
            })
            .ToListAsync();
        return Ok(screens);
    }

    // US-009: Export selected rows
    [HttpPost("export/selected")]
    [Permission("USERGROUPPAGE", PermissionType.Download)]
    public async Task<IActionResult> ExportSelected([FromBody] ExportSelectedRequest req)
    {
        var bytes = await _groups.ExportAsync(req.Format, null, null, req.Ids);
        var contentType = req.Format == "csv" ? "text/csv" : "application/octet-stream";
        return File(bytes, contentType, $"groups-selected.{req.Format}");
    }
}

public record ExportSelectedRequest(List<long> Ids, string Format = "csv");
