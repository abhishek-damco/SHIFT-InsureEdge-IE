using InsureEdge.Application.DTOs.LetterTemplate;
using InsureEdge.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/letter-templates")]
[Authorize]
public class LetterTemplatesController : ControllerBase
{
    private readonly LetterTemplateService _service;

    public LetterTemplatesController(LetterTemplateService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] string? search) =>
        Ok(await _service.GetListAsync(search));

    [HttpGet("next-code")]
    public async Task<IActionResult> GetNextCode() =>
        Ok(new NextTemplateCodeDto(await _service.GetNextCodeAsync()));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTemplateRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.TemplateName))
            return BadRequest("Template Name is required.");
        var id = await _service.CreateAsync(request);
        return Created($"/api/letter-templates/{id}", new { id });
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var result = await _service.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateTemplateRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.TemplateName))
            return BadRequest("Template Name is required.");
        try
        {
            await _service.UpdateAsync(id, request);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
