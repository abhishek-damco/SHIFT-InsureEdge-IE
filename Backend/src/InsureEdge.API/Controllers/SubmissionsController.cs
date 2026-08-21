// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Submission (quote wizard draft) CRUD — screen: NBQUOTESSCREEN
// Ported from server.js POST/GET/PUT/DELETE /api/submissions/:id and
// GET /api/submissions/:id/commission.
using InsureEdge.API.Filters;
using InsureEdge.Application.DTOs.QuotesPolicies;
using InsureEdge.Application.Interfaces;
using InsureEdge.Application.Services;
using InsureEdge.Domain.Enums;
using InsureEdge.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/submissions")]
[Authorize]
public class SubmissionsController : ControllerBase
{
    private readonly SubmissionService _submissions;
    private readonly InsureEdgeDbContext _db;
    private readonly ILogger<SubmissionsController> _log;

    public SubmissionsController(SubmissionService submissions, InsureEdgeDbContext db, ILogger<SubmissionsController> log)
    {
        _submissions = submissions;
        _db = db;
        _log = log;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSubmissionRequest req)
    {
        try
        {
            return Ok(await _submissions.CreateAsync(req));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        // CRITICAL: Check for Renewal/Endorsement Policy FIRST before checking Submission
        // Renewals and Endorsements must be detected before regular submissions to ensure proper flow
        if (long.TryParse(id, out var policyId))
        {
            var draftPolicy = await _db.Policies
                .Include(p => p.Extended)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == policyId && (p.PolicyType == "RENEWAL" || p.PolicyType == "ENDORSEMENT" ||
                    (p.PolicyStage == "RENEWAL" || p.PolicyStage == "ENDORSEMENT" ||
                     (p.PolicyStage != null && (p.PolicyStage.Contains("RENEWAL") || p.PolicyStage.Contains("ENDORSEMENT"))))));

            if (draftPolicy != null)
            {
                // Fetch prior policy and submission data
                Domain.Entities.Policy? priorPolicy = null;
                string? priorSubmissionDataJson = null;

                System.Console.WriteLine($"[GetById] Draft policy found: ID={draftPolicy.Id}, PriorPolicyId={draftPolicy.Extended?.PriorPolicyId}");

                if (draftPolicy.Extended?.PriorPolicyId.HasValue == true)
                {
                    priorPolicy = await _db.Policies
                        .AsNoTracking()
                        .FirstOrDefaultAsync(p => p.Id == draftPolicy.Extended.PriorPolicyId);

                    System.Console.WriteLine($"[GetById] Prior policy: {(priorPolicy != null ? $"Found ID={priorPolicy.Id}, QN={priorPolicy.QuoteNumber}, State={priorPolicy.StateProvince}, EffDate={priorPolicy.EffectiveDate}" : "NOT FOUND")}");

                    if (priorPolicy != null && !string.IsNullOrEmpty(priorPolicy.QuoteNumber))
                    {
                        // Fetch the submission that corresponds to the prior policy
                        var priorSubmission = await _db.Submissions
                            .AsNoTracking()
                            .FirstOrDefaultAsync(s => s.ClientId == draftPolicy.ClientId && s.Id == priorPolicy.QuoteNumber);

                        System.Console.WriteLine($"[GetById] Prior submission lookup: ClientId={draftPolicy.ClientId}, QuoteNumber={priorPolicy.QuoteNumber} → {(priorSubmission != null ? "FOUND" : "NOT FOUND")}");

                        if (priorSubmission != null)
                        {
                            priorSubmissionDataJson = priorSubmission.Data;
                            System.Console.WriteLine($"[GetById] Loaded submission data length: {priorSubmissionDataJson?.Length ?? 0} bytes");
                        }
                    }
                }

                // Convert renewal/endorsement policy to submission-like structure with prior data
                var draftSubmission = new SubmissionDto(
                    Id: draftPolicy.Id.ToString(),
                    Status: draftPolicy.PolicyStatus ?? "Draft",
                    CreatedAt: draftPolicy.CreatedOn,
                    DataJson: await _submissions.BuildRenewalFormDataJsonAsync(draftPolicy, priorPolicy, priorSubmissionDataJson)
                );
                return Ok(draftSubmission);
            }
        }

        // Then try to load as a Submission (usual case)
        var result = await _submissions.GetByIdAsync(id);
        if (result != null) return Ok(result);

        return NotFound(new { error = "Submission not found." });
    }

    // Endorsement/Renewal registers list rows keyed by the Policy's QuoteNumber, which is NOT
    // the Submission's own Id for those flows (see EndorsementListItemDto/RenewalListItemDto's
    // "p.quote_number" comment). Resolves the real Submission Id before the wizard navigates,
    // so it opens the actual draft instead of 404'ing and silently minting a new blank one on save.
    [HttpGet("by-quote-number/{quoteNumber}")]
    public async Task<IActionResult> GetIdByQuoteNumber(string quoteNumber)
    {
        var id = await _submissions.GetSubmissionIdByQuoteNumberAsync(quoteNumber);
        return id == null ? NotFound(new { error = "Submission not found." }) : Ok(new { id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Upsert(string id, [FromBody] UpdateSubmissionRequest req)
    {
        try
        {
            return Ok(await _submissions.UpsertAsync(id, req));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _submissions.DeleteAsync(id);
        return deleted ? NoContent() : NotFound(new { error = "Submission not found." });
    }

    // ─── Finalize Quote: payment plan (OutSystems SaveOnClick / GetPolicyDetails) ───

    [HttpGet("{id}/payment-plan")]
    public async Task<IActionResult> GetPaymentPlan(string id)
    {
        try
        {
            var result = await _submissions.GetPaymentPlanAsync(id);
            return result == null ? NotFound(new { error = "Policy not found for submission." }) : Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("{id}/payment-plan")]
    public async Task<IActionResult> SavePaymentPlan(string id, [FromBody] SavePaymentPlanRequest req)
    {
        try
        {
            return Ok(await _submissions.SavePaymentPlanAsync(id, req));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // ─── Bind (BindOnClick → UpdatePolicyStatus_BL) ──────────────────────────

    [HttpPost("{id}/bind")]
    public async Task<IActionResult> BindPolicy(string id)
    {
        try
        {
            return Ok(await _submissions.BindPolicyAsync(id));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // ValidatePaymentPlan failures (responsible party / frequency / mortgagee gates).
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // ─── Document Generation (PRD: DownloadQuoteOnClick → GenerationDocuments_
    // QuoteProposalPackage → GetandDownloadDocument, Plumsail-backed) ──────────

    [HttpPost("{id}/documents/generate-quote-package")]
    public async Task<IActionResult> GenerateQuotePackage(string id,
        [FromServices] InsureEdge.Application.Interfaces.IDocumentGenerationService docs)
    {
        var result = await docs.GenerateQuoteProposalPackageAsync(id);
        if (!result.Success)
            return BadRequest(new { error = result.Message });
        return Ok(new { isSuccess = true, documentId = result.DocumentId, fileName = result.FileName, message = result.Message });
    }

    [HttpGet("{id}/documents/generated")]
    public async Task<IActionResult> ListGeneratedDocuments(string id,
        [FromServices] InsureEdge.Application.Interfaces.IDocumentGenerationService docs)
        => Ok(await docs.ListGeneratedAsync(id));

    [HttpGet("{id}/documents/generated/{documentId:long}")]
    public async Task<IActionResult> DownloadGeneratedDocument(string id, long documentId,
        [FromServices] InsureEdge.Application.Interfaces.IDocumentGenerationService docs)
    {
        var file = await docs.GetGeneratedBinaryAsync(id, documentId);
        if (file == null) return NotFound(new { error = "Document not found." });
        return File(file.Value.Bytes, file.Value.ContentType, file.Value.FileName);
    }

    // ─── Share Quote (Finalize Quote → Document → Share Quote) ────────────────

    [HttpPost("{id}/share-quote")]
    public async Task<IActionResult> ShareQuote(string id, [FromBody] ShareQuoteRequest req,
        [FromServices] InsureEdge.Application.Interfaces.IEmailService email)
    {
        if (string.IsNullOrWhiteSpace(req.ToEmail))
            return BadRequest(new { error = "Recipient email is required." });
        if (string.IsNullOrWhiteSpace(req.Html))
            return BadRequest(new { error = "Quote content is required." });
        try
        {
            var subject = string.IsNullOrWhiteSpace(req.Subject) ? $"Insurance Quote {id}" : req.Subject!;
            await email.SendQuoteShareAsync(req.ToEmail.Trim(), (req.ToName ?? req.ToEmail).Trim(), subject, req.Html);
            return Ok(new { isSuccess = true });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // ─── Send Email (Email Compose Modal) ────────────────────────────────────

    [HttpPost("{id}/send-email")]
    public async Task<IActionResult> SendEmail(string id, [FromBody] SendEmailRequest req,
        [FromServices] InsureEdge.Application.Interfaces.IEmailService email,
        [FromServices] InsureEdge.Infrastructure.Data.InsureEdgeDbContext db,
        [FromServices] InsureEdge.Application.Interfaces.ICurrentTenantService tenant)
    {
        if (string.IsNullOrWhiteSpace(req.ToEmail))
            return BadRequest(new { error = "Recipient email (To) is required." });
        if (string.IsNullOrWhiteSpace(req.FromEmail))
            return BadRequest(new { error = "From email is required." });
        if (string.IsNullOrWhiteSpace(req.Subject))
            return BadRequest(new { error = "Subject is required." });
        if (string.IsNullOrWhiteSpace(req.HtmlBody))
            return BadRequest(new { error = "Email body is required." });
        try
        {
            byte[]? attachmentBytes = null;
            string? attachmentFileName = null;

            // Handle base64-encoded attachments (for client/uploaded documents)
            if (!string.IsNullOrWhiteSpace(req.AttachmentBase64))
            {
                try
                {
                    attachmentBytes = Convert.FromBase64String(req.AttachmentBase64);
                    attachmentFileName = req.DocumentName;
                    _log.LogInformation("SendEmail: Using base64 attachment - FileName: {FileName}, Size: {Size}", req.DocumentName, attachmentBytes.Length);
                }
                catch (Exception ex)
                {
                    _log.LogWarning(ex, "SendEmail: Failed to decode base64 attachment");
                }
            }

            if (!string.IsNullOrWhiteSpace(req.DocumentName) && attachmentBytes == null)
            {
                _log.LogInformation("SendEmail: Looking for document - SubmissionId: {SubmissionId}, DocumentName: {DocumentName}, Source: {Source}", id, req.DocumentName, req.DocumentSource);
                var clientId = tenant.ClientId;

                // Handle Quote/Policy documents
                if (req.DocumentSource == "QuotePolicy")
                {
                    var policy = await db.Policies
                        .FirstOrDefaultAsync(p => p.ClientId == clientId &&
                            (p.QuoteNumber == id || p.PolicyNumber == id));
                    if (policy != null)
                    {
                        _log.LogInformation("SendEmail: Found policy {PolicyId} for submission {SubmissionId}", policy.Id, id);
                        var doc = await db.PolicyDocuments
                            .FirstOrDefaultAsync(d => d.FileName == req.DocumentName &&
                                d.PolicyId == policy.Id && d.ClientId == clientId);
                        if (doc != null)
                        {
                            _log.LogInformation("SendEmail: Found document {DocumentId}, FileName: {FileName}, Size: {Size}", doc.Id, doc.FileName, doc.BinaryFileTemp?.Length ?? 0);
                            if (doc.BinaryFileTemp != null)
                            {
                                attachmentBytes = doc.BinaryFileTemp;
                                attachmentFileName = req.DocumentName;
                            }
                        }
                        else
                        {
                            _log.LogWarning("SendEmail: No document found with FileName: {FileName} for PolicyId: {PolicyId}", req.DocumentName, policy.Id);
                        }
                    }
                    else
                    {
                        _log.LogWarning("SendEmail: No policy found for submission {SubmissionId}", id);
                    }
                }
                else if (req.DocumentSource == "System")
                {
                    // System documents are fixed and stored as static files - log this for now
                    _log.LogInformation("SendEmail: System document requested - {DocumentName}. Note: System document attachment requires separate handling", req.DocumentName);
                }
                else
                {
                    // For uploaded/client documents, log that they're not yet supported for email attachment
                    _log.LogWarning("SendEmail: Document source '{Source}' is not yet supported for email attachments. DocumentName: {DocumentName}", req.DocumentSource, req.DocumentName);
                }
            }

            await email.SendEmailAsync(req.FromEmail.Trim(), req.ToEmail.Trim(), req.CcEmail?.Trim(), req.BccEmail?.Trim(), req.Subject.Trim(), req.HtmlBody, attachmentBytes, attachmentFileName);
            return Ok(new { isSuccess = true });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // ─── Issue Policy (IssueOnClick → IssuePolicyHB_BL) ──────────────────────

    [HttpPost("{id}/issue")]
    public async Task<IActionResult> IssuePolicy(string id)
    {
        try
        {
            return Ok(await _submissions.IssuePolicyAsync(id));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // Validation failures (commission gate / ValidatePaymentPlan / lender dock).
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            // AllExceptions handler: LogMessage → IsSuccess = false.
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // ─── Issue Endorsement (IssueEndorsementOnClick) ─────────────────────────

    [HttpPost("{id}/issue-endorsement")]
    public async Task<IActionResult> IssueEndorsement(string id)
    {
        try
        {
            return Ok(await _submissions.IssueEndorsementAsync(id));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("{id}/commission")]
    public async Task<IActionResult> GetCommission(string id)
    {
        try
        {
            var result = await _submissions.GetCommissionAsync(id);
            return result == null ? NotFound(new { error = "Policy not found for submission." }) : Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
