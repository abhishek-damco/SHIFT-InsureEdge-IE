// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Bulk Upload (Quotes & Policies) — Excel template download, multipart file upload
// (parsed synchronously with ClosedXML, one Draft submission created per row via
// SubmissionService's underlying repository), history and error-report download.
// Screen code reuses NBQUOTESSCREEN (same as SubmissionsController) since bulk
// upload is a New Business Quotes capability.
//
// Template layout matches the real "E&S Homeowners Insurance Products Upload
// Template" (source file provided under /Input) column-for-column — see
// BulkUploadColumns for the shared index/header map used by both this
// generator and the parser below.
using ClosedXML.Excel;
using InsureEdge.API.Filters;
using InsureEdge.Application.Services;
using InsureEdge.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/bulk-upload")]
[Authorize]
public class BulkUploadController : ControllerBase
{
    private readonly BulkUploadService _bulkUpload;

    public BulkUploadController(BulkUploadService bulkUpload) => _bulkUpload = bulkUpload;

    [HttpGet("template")]
    [ProducerOnly]
    public IActionResult DownloadTemplate()
    {
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Import Data");

        var headers = BulkUploadColumns.Headers;
        var mandatory = BulkUploadColumns.Mandatory;
        for (var i = 0; i < headers.Length; i++)
        {
            var col = i + 1;
            var markerCell = ws.Cell(1, col);
            markerCell.Value = mandatory[i];
            markerCell.Style.Font.Bold = true;
            markerCell.Style.Font.FontColor = mandatory[i] switch
            {
                "Mandatory" => XLColor.Red,
                "Conditional" => XLColor.Purple,
                _ => XLColor.Black,
            };

            var headerCell = ws.Cell(3, col);
            headerCell.Value = headers[i];
            headerCell.Style.Font.Bold = true;
            // Highlighted (not just colored text) so "highlighted columns indicate mandatory
            // fields" in the modal's description is literally true of the downloaded file.
            headerCell.Style.Fill.BackgroundColor = mandatory[i] switch
            {
                "Mandatory" => XLColor.LightYellow,
                "Conditional" => XLColor.Lavender,
                _ => XLColor.LightBlue,
            };
        }
        ws.Cell(2, 1).Value = "Row 1 = Mandatory / Conditional / Optional. Row 3 = column name. Data starts on row 4.";
        ws.Range(2, 1, 2, headers.Length).Merge();
        ws.Cell(2, 1).Style.Fill.BackgroundColor = XLColor.LightPink;
        ws.Cell(2, 1).Style.Alignment.WrapText = true;

        // Excel inline list validations are capped at 255 characters — short enum lists are
        // inlined directly; the State list (50 values) is too long, so it's sourced from a
        // range on the "Data" sheet instead (standard Excel dropdown pattern).
        var data = wb.Worksheets.Add("Data");
        var states = BulkUploadColumns.StateList.Split(',');
        for (var i = 0; i < states.Length; i++)
            data.Cell(i + 1, 1).Value = states[i];
        var stateRange = data.Range(1, 1, states.Length, 1);

        void AddList(int col0, string list) =>
            ws.Column(col0 + 1).CreateDataValidation().List(list, true);
        void AddRangeList(int col0, IXLRange range) =>
            ws.Column(col0 + 1).CreateDataValidation().List(range, true);

        AddList(BulkUploadColumns.TypeOfPrimaryInsured, BulkUploadColumns.TypeOfPrimaryInsuredList);
        AddList(BulkUploadColumns.Is65OrOlder, BulkUploadColumns.YesNoList);
        AddList(BulkUploadColumns.AddressSameAsMailing, BulkUploadColumns.YesNoList);
        AddList(BulkUploadColumns.SecondaryMortgageeFlag, BulkUploadColumns.YesNoList);
        AddRangeList(BulkUploadColumns.MailState, stateRange);
        AddRangeList(BulkUploadColumns.RiskState, stateRange);
        AddList(BulkUploadColumns.PhysicalDamageDeductible, BulkUploadColumns.PhysicalDamageDeductibleList);
        AddList(BulkUploadColumns.LiabilityCoverage, BulkUploadColumns.LiabilityCoverageList);
        AddList(BulkUploadColumns.ExcessBlanketPl, BulkUploadColumns.ExcessBlanketPlList);
        AddList(BulkUploadColumns.Sinkhole, BulkUploadColumns.SinkholeList);
        AddList(BulkUploadColumns.Earthquake, BulkUploadColumns.EarthquakeList);
        AddList(BulkUploadColumns.Flood, BulkUploadColumns.FloodList);
        AddList(BulkUploadColumns.WindHail, BulkUploadColumns.WindWildfireList);
        AddList(BulkUploadColumns.WildFire, BulkUploadColumns.WindWildfireList);
        AddList(BulkUploadColumns.BuildingType, BulkUploadColumns.BuildingTypeList);
        AddList(BulkUploadColumns.BuildingDescription, BulkUploadColumns.BuildingDescriptionList);

        ws.SheetView.FreezeRows(3);
        ws.Columns(1, headers.Length).AdjustToContents(3, 3);

        var instructions = wb.Worksheets.Add("Instructions");
        instructions.Cell(1, 1).Value = "File Guidelines and Instructions";
        instructions.Cell(1, 1).Style.Font.Bold = true;
        var lines = new[]
        {
            "1. Do not delete or reorder any columns in the \"Import Data\" tab.",
            "2. Do not revise the header text in row 3 of the \"Import Data\" tab.",
            "3. Do not delete the first 3 rows in the \"Import Data\" tab. Data starts on row 4.",
            "4. Row 1 indicates whether a column is Mandatory (red), Conditional on another column (purple), or Optional (black).",
            "5. First Name / Last Name are required only when Type of Primary Insured is Individual or Sole Proprietorship; otherwise Organization Name is required.",
            "6. Risk address (columns R-Y) is required only when \"Address same as Mailing Address\" = No.",
            "7. Mortgagee 1 is added whenever a Mortgagee Name is entered; Mortgagee 2 only when \"Secondary Mortgagee?\" = Yes.",
            "8. Up to 4 additional named insureds and 4 additional organizations may be provided; blank blocks are skipped.",
        };
        for (var i = 0; i < lines.Length; i++)
            instructions.Cell(i + 3, 1).Value = lines[i];
        instructions.Column(1).AdjustToContents();

        using var stream = new MemoryStream();
        wb.SaveAs(stream);
        return File(
            stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "E&S Homeowners Insurance Products Upload Template.xlsx");
    }

    [HttpPost]
    [ProducerOnly]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] string? module)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded." });

        List<string?[]> rows;
        try
        {
            rows = ParseExcel(file);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = $"Unable to read Excel file: {ex.Message}" });
        }

        if (rows.Count == 0)
            return BadRequest(new { error = "The uploaded file has no data rows." });

        try
        {
            var result = await _bulkUpload.ProcessAsync(file.FileName, rows, string.IsNullOrWhiteSpace(module) ? BulkUploadService.QuotesPoliciesModule : module);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Unexpected error in bulk upload: {ex}");
            return StatusCode(500, new { error = "An unexpected error occurred during bulk upload processing.", details = ex.Message });
        }
    }

    [HttpGet("history")]
    [ProducerOnly]
    public async Task<IActionResult> History([FromQuery] string? module)
        => Ok(await _bulkUpload.GetHistoryAsync(string.IsNullOrWhiteSpace(module) ? BulkUploadService.QuotesPoliciesModule : module));

    [HttpGet("{auditId}/error-report")]
    [ProducerOnly]
    public async Task<IActionResult> ErrorReport(long auditId)
    {
        var bytes = await _bulkUpload.GetErrorReportAsync(auditId);
        if (bytes == null) return NotFound(new { error = "No error report available for this upload." });
        return File(bytes, "text/csv", $"BulkUpload_{auditId}_Errors.csv");
    }

    // Reads the "Import Data" sheet positionally starting at BulkUploadColumns.DataStartRow —
    // header names are not used for lookup because several repeat across sections (see
    // BulkUploadColumns doc comment).
    private static List<string?[]> ParseExcel(IFormFile file)
    {
        using var stream = file.OpenReadStream();
        using var wb = new XLWorkbook(stream);
        var ws = wb.Worksheets.First();
        var columnCount = BulkUploadColumns.Headers.Length;

        var rows = new List<string?[]>();
        var lastRow = ws.LastRowUsed()?.RowNumber() ?? 0;
        for (var r = BulkUploadColumns.DataStartRow; r <= lastRow; r++)
        {
            var row = ws.Row(r);
            if (row.IsEmpty()) continue;

            var values = new string?[columnCount];
            var hasValue = false;
            for (var c = 1; c <= columnCount; c++)
            {
                var cell = row.Cell(c);
                var value = cell.IsEmpty() ? null : cell.GetString().Trim();
                if (!string.IsNullOrWhiteSpace(value)) hasValue = true;
                values[c - 1] = value;
            }
            if (hasValue) rows.Add(values);
        }
        return rows;
    }
}
