using ClosedXML.Excel;
using InsureEdge.Application.DTOs.Configuration;
using InsureEdge.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/configurations")]
[Authorize]
public class ConfigurationsController : ControllerBase
{
    private readonly ConfigurationService _configs;

    public ConfigurationsController(ConfigurationService configs) => _configs = configs;

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] string? search) =>
        Ok(await _configs.GetListAsync(search));

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetDetail(
        long id,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var detail = await _configs.GetDetailAsync(id, search, page, pageSize);
        if (detail == null) return NotFound();
        return Ok(detail);
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Save(long id, [FromBody] ConfigurationSaveRequestDto body)
    {
        var ok = await _configs.SaveAsync(id, body);
        if (!ok) return NotFound();
        return NoContent();
    }

    [HttpGet("{id:long}/export")]
    public async Task<IActionResult> Export(long id)
    {
        var rows = await _configs.GetValuesForExportAsync(id);

        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Configuration");

        ws.Cell(1, 1).Value = "ConfigurationValue";
        ws.Cell(1, 2).Value = "Enabled";
        ws.Cell(1, 3).Value = "IsDefault";
        ws.Cell(1, 4).Value = "EffectiveFrom";
        ws.Cell(1, 5).Value = "EffectiveTo";

        var headerRange = ws.Range(1, 1, 1, 5);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#4472C4");
        headerRange.Style.Font.FontColor = XLColor.White;

        for (int i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var r = i + 2;
            ws.Cell(r, 1).Value = row.ConfigurationValue ?? "";
            ws.Cell(r, 2).Value = row.Enabled ? "Yes" : "No";
            ws.Cell(r, 3).Value = row.IsDefault ? "Yes" : "No";
            ws.Cell(r, 4).Value = row.EffectiveFrom.HasValue ? row.EffectiveFrom.Value.ToString("MM/dd/yyyy") : "";
            ws.Cell(r, 5).Value = row.EffectiveTo.HasValue ? row.EffectiveTo.Value.ToString("MM/dd/yyyy") : "";
        }

        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        ms.Position = 0;

        return File(ms.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"configuration-{id}.xlsx");
    }
}
