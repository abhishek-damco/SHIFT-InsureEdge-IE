// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Policies register — screen: POLICIESSCREEN
// Ported from server.js GET /api/:insuredType/policies[/kpis].
using InsureEdge.API.Filters;
using InsureEdge.Application.DTOs.QuotesPolicies;
using InsureEdge.Application.Interfaces;
using InsureEdge.Application.Services;
using InsureEdge.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/{insuredType}/policies")]
[Authorize]
public class PoliciesController : ControllerBase
{
    private readonly PolicyQuoteService _quotes;
    private readonly IPolicyQuoteRepository _repository;
    private readonly ICurrentTenantService _tenant;

    public PoliciesController(PolicyQuoteService quotes, IPolicyQuoteRepository repository, ICurrentTenantService tenant)
    {
        _quotes = quotes;
        _repository = repository;
        _tenant = tenant;
    }

    [HttpGet("kpis")]
    public async Task<IActionResult> GetKpis(string insuredType)
    {
        try
        {
            return Ok(await _quotes.GetPoliciesKpisAsync(insuredType));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetList(
        string insuredType,
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? sortCol,
        [FromQuery] string? sortDir)
    {
        try
        {
            return Ok(await _quotes.GetPoliciesAsync(insuredType, search, status, sortCol, sortDir));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("{policyNumber}/history")]
    public async Task<IActionResult> GetHistory(string insuredType, string policyNumber)
    {
        try
        {
            return Ok(await _quotes.GetPolicyHistoryAsync(policyNumber));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("{policyNumber}/summary")]
    public async Task<IActionResult> GetSummary(string insuredType, string policyNumber)
    {
        try
        {
            var summary = await _quotes.GetPolicySummaryAsync(policyNumber);
            return summary == null ? NotFound() : Ok(summary);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("{policyNumber}/pending-transactions")]
    public async Task<IActionResult> GetPendingTransactions(string insuredType, string policyNumber)
    {
        try
        {
            return Ok(await _quotes.GetPendingTransactionsAsync(policyNumber));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("{policyNumber}/billing")]
    public async Task<IActionResult> GetBillingDetail(string insuredType, string policyNumber)
    {
        try
        {
            var detail = await _quotes.GetBillingDetailAsync(policyNumber);
            return detail == null ? NotFound() : Ok(detail);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("{policyNumber}/claims")]
    public async Task<IActionResult> GetClaims(string insuredType, string policyNumber)
    {
        try
        {
            return Ok(await _quotes.GetClaimsAsync(policyNumber));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("{policyNumber}/timeline")]
    public async Task<IActionResult> GetTimeline(string insuredType, string policyNumber)
    {
        try
        {
            return Ok(await _quotes.GetTimelineAsync(policyNumber));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("{policyNumber}/endorse")]
    public async Task<IActionResult> EndorsePolicy(string insuredType, string policyNumber, [FromBody] EndorsePolicyRequestDto request)
    {
        try
        {
            return Ok(await _quotes.CreateEndorsementDraftAsync(policyNumber, request));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // Quote Review "Review/Compare Updated Information" grid for an open endorsement draft.
    [HttpGet("{policyNumber}/endorsement-changes")]
    public async Task<IActionResult> GetEndorsementChanges(string insuredType, string policyNumber)
    {
        try
        {
            return Ok(await _quotes.GetEndorsementChangesAsync(policyNumber));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // Hydrates the wizard's FormState from the open endorsement draft's real cloned data
    // (risk address, risk info, limits & coverages, additional insureds, mortgages) — used
    // right after Endorse Policy to seed the Submission with everything that was actually
    // cloned, instead of a hand-built subset of fields.
    [HttpGet("{policyNumber}/endorsement-draft-form")]
    public async Task<IActionResult> GetEndorsementDraftForm(string insuredType, string policyNumber)
    {
        try
        {
            var form = await _quotes.GetEndorsementDraftFormAsync(policyNumber);
            return form == null ? NotFound(new { error = "No open endorsement draft found for this policy." }) : Ok(form);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // Finalize Quote's Summary "Previous Amount" column — the prior policy's raw premium
    // inputs, for the frontend to run its own calculatePlanAmounts()/STATE_TAX against.
    [HttpGet("{policyNumber}/endorsement-prior-premium")]
    public async Task<IActionResult> GetEndorsementPriorPremiumForm(string insuredType, string policyNumber)
    {
        try
        {
            var form = await _quotes.GetEndorsementPriorPremiumFormAsync(policyNumber);
            return form == null ? NotFound(new { error = "No prior policy found for this endorsement." }) : Ok(form);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("cancellation/requested-by-options")]
    public async Task<IActionResult> GetRequestedByOptions(string insuredType)
        => Ok(await _quotes.GetRequestedByOptionsAsync());

    [HttpGet("cancellation/reason-options")]
    public IActionResult GetReasonOfCancellationOptions(string insuredType, [FromQuery] string requestedBy)
        => Ok(_quotes.GetReasonOfCancellationOptions(requestedBy));

    [HttpGet("{policyNumber}/cancellation-preview")]
    public async Task<IActionResult> GetCancellationPreview(string insuredType, string policyNumber, [FromQuery] DateOnly cancellationEffectiveDate)
    {
        var preview = await _quotes.GetCancellationPreviewAsync(policyNumber, cancellationEffectiveDate);
        return preview == null ? NotFound() : Ok(preview);
    }

    [HttpPost("{policyNumber}/cancel")]
    public async Task<IActionResult> CancelPolicy(string insuredType, string policyNumber, [FromBody] CancelPolicyRequestDto request)
    {
        try
        {
            return Ok(await _quotes.SubmitCancellationAsync(policyNumber, request));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("cancel-rewrite/reason-options")]
    public IActionResult GetReasonForRewritingOptions(string insuredType)
        => Ok(_quotes.GetReasonForRewritingOptions());

    [HttpGet("{policyNumber}/cancel-rewrite-preview")]
    public async Task<IActionResult> GetCancelRewritePreview(string insuredType, string policyNumber, [FromQuery] DateOnly cancellationEffectiveDate)
    {
        var preview = await _quotes.GetCancelRewritePreviewAsync(policyNumber, cancellationEffectiveDate);
        return preview == null ? NotFound() : Ok(preview);
    }

    [HttpPost("{policyNumber}/cancel-rewrite")]
    public async Task<IActionResult> CancelRewritePolicy(string insuredType, string policyNumber, [FromBody] CancelRewriteRequestDto request)
    {
        try
        {
            return Ok(await _quotes.SubmitCancelRewriteAsync(policyNumber, request));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("{policyNumber}/notice-of-nonrenewal-info")]
    public async Task<IActionResult> GetNoticeOfNonRenewalInfo(string insuredType, string policyNumber)
    {
        var info = await _quotes.GetNoticeOfNonRenewalInfoAsync(policyNumber);
        return info == null ? NotFound() : Ok(info);
    }

    [HttpPost("{policyNumber}/do-not-renew")]
    public async Task<IActionResult> SubmitDoNotRenew(string insuredType, string policyNumber, [FromBody] DoNotRenewRequestDto request)
    {
        try
        {
            return Ok(await _quotes.SubmitDoNotRenewAsync(policyNumber, request));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("{policyNumber}/remove-do-not-renew")]
    public async Task<IActionResult> RemoveDoNotRenew(string insuredType, string policyNumber)
    {
        try
        {
            return Ok(await _quotes.RemoveDoNotRenewAsync(policyNumber));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // ─── Notes ──────────────────────────────────────────────────────────────
    [HttpGet("{policyNumber}/notes")]
    public async Task<IActionResult> GetNotes(string insuredType, string policyNumber)
    {
        try
        {
            return Ok(await _repository.GetNotesAsync(_tenant.ClientId, policyNumber));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("{policyNumber}/notes")]
    public async Task<IActionResult> CreateNote(string insuredType, string policyNumber)
    {
        try
        {
            var accessType = Request.Form["accessType"];
            var notesText = Request.Form["notesText"];
            var files = new List<NoteFileUploadDto>();

            foreach (var formFile in Request.Form.Files.Where(f => f.Name == "files"))
            {
                using var ms = new MemoryStream();
                await formFile.CopyToAsync(ms);
                files.Add(new NoteFileUploadDto(formFile.FileName, formFile.ContentType, ms.ToArray()));
            }

            var request = new CreateNoteRequestDto(accessType, notesText, files);
            return Ok(await _repository.CreateNoteAsync(_tenant.ClientId, _tenant.UserId, policyNumber, request));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPut("{policyNumber}/notes/{noteId}")]
    public async Task<IActionResult> UpdateNote(string insuredType, string policyNumber, long noteId)
    {
        try
        {
            var accessType = Request.Form["accessType"];
            var notesText = Request.Form["notesText"];
            var newFiles = new List<NoteFileUploadDto>();
            var removeFileIds = new List<long>();

            foreach (var formFile in Request.Form.Files.Where(f => f.Name == "files"))
            {
                using var ms = new MemoryStream();
                await formFile.CopyToAsync(ms);
                newFiles.Add(new NoteFileUploadDto(formFile.FileName, formFile.ContentType, ms.ToArray()));
            }

            if (Request.Form.TryGetValue("removeFileIds", out var removeIds))
            {
                removeFileIds.AddRange(removeIds.Where(id => long.TryParse(id, out _)).Select(long.Parse));
            }

            var request = new UpdateNoteRequestDto(accessType, notesText, newFiles, removeFileIds);
            var result = await _repository.UpdateNoteAsync(_tenant.ClientId, _tenant.UserId, policyNumber, noteId, request);
            return result == null ? NotFound() : Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpDelete("{policyNumber}/notes/{noteId}")]
    public async Task<IActionResult> DeleteNote(string insuredType, string policyNumber, long noteId)
    {
        try
        {
            var success = await _repository.DeleteNoteAsync(_tenant.ClientId, policyNumber, noteId);
            return success ? Ok() : NotFound();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("{policyNumber}/notes/files/{fileId}")]
    public async Task<IActionResult> GetNoteFile(string insuredType, string policyNumber, long fileId)
    {
        try
        {
            var file = await _repository.GetNoteFileAsync(_tenant.ClientId, policyNumber, fileId);
            if (file == null) return NotFound();
            return File(file.FileData, file.FileType ?? "application/octet-stream", file.FileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
