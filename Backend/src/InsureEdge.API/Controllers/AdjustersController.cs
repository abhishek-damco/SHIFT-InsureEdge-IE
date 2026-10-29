using InsureEdge.Application.DTOs.Adjuster;
using InsureEdge.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/adjusters")]
[Authorize]
public class AdjustersController : ControllerBase
{
    private readonly AdjusterService _adjusters;

    public AdjustersController(AdjusterService adjusters) => _adjusters = adjusters;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _adjusters.GetAllAsync());

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var result = await _adjusters.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertTempAdjusterRequest req)
    {
        var result = await _adjusters.CreateAsync(req);
        return Ok(result);
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpsertTempAdjusterRequest req)
    {
        try
        {
            return Ok(await _adjusters.UpdateAsync(id, req));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
