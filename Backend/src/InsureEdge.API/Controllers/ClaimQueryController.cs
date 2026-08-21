using InsureEdge.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/claims/{claimId:long}/query")]
[Authorize]
public class ClaimQueryController : ControllerBase
{
    private readonly IEmailService _email;

    public ClaimQueryController(IEmailService email) => _email = email;

    public record QueryAttachmentDto(string FileName, string ContentType, string ContentBase64);

    public record SendQueryRequest(
        string EmailCategory,
        string DepartmentRole,
        string FromEmail,
        List<string> To,
        List<string> Cc,
        List<string> Bcc,
        string Subject,
        string Body,
        List<QueryAttachmentDto>? Attachments
    );

    // POST /api/claims/{claimId}/query/send
    [HttpPost("send")]
    public async Task<IActionResult> Send(long claimId, [FromBody] SendQueryRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.FromEmail))
            return BadRequest(new { error = "From email is required." });
        if (req.To == null || req.To.Count == 0)
            return BadRequest(new { error = "At least one To address is required." });
        if (string.IsNullOrWhiteSpace(req.Subject))
            return BadRequest(new { error = "Subject is required." });
        if (string.IsNullOrWhiteSpace(req.Body))
            return BadRequest(new { error = "Body is required." });

        var attachments = req.Attachments?
            .Where(a => !string.IsNullOrWhiteSpace(a.ContentBase64))
            .Select(a => new EmailAttachment(
                a.FileName,
                string.IsNullOrWhiteSpace(a.ContentType) ? "application/octet-stream" : a.ContentType,
                Convert.FromBase64String(a.ContentBase64)))
            .ToList();

        await _email.SendQueryAsync(
            req.FromEmail,
            req.To,
            req.Cc ?? [],
            req.Bcc ?? [],
            req.Subject,
            req.Body,
            attachments);

        return Ok(new { sent = true });
    }
}
