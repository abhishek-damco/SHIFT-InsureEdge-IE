// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// ADR-007: SMTP provider-neutral. Credentials from env vars only — never hardcoded.
// US-018: SendPasswordResetAsync; US-019: SendOnboardingWelcomeAsync
namespace InsureEdge.Application.Interfaces;

public record EmailAttachment(string FileName, string ContentType, byte[] Content);

public interface IEmailService
{
    Task SendPasswordResetAsync(string toEmail, string toName, string resetUrl);
    Task SendOnboardingWelcomeAsync(string toEmail, string toName, string setupUrl, string adminEmail);

    Task SendQueryAsync(
        string fromEmail,
        IEnumerable<string> to,
        IEnumerable<string> cc,
        IEnumerable<string> bcc,
        string subject,
        string body,
        IEnumerable<EmailAttachment>? attachments = null);

    // Share Quote (Finalize Quote → Document → Share Quote): emails the rendered quote document.
    Task SendQuoteShareAsync(string toEmail, string toName, string subject, string htmlBody);
    // Email Compose (Send general email with To, CC, BCC support and optional attachment)
    Task SendEmailAsync(string fromEmail, string toEmail, string? ccEmail, string? bccEmail, string subject, string htmlBody, byte[]? attachmentBytes = null, string? attachmentFileName = null);
}
