// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// ADR-007: MailKit SMTP. All credentials from environment variables only — never hardcoded.
// US-015/US-016/US-017/US-019: Sends branded HTML+plain-text email for reset and onboarding.
using InsureEdge.Application.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using MimeKit.Text;

namespace InsureEdge.Infrastructure.Email;

public class SmtpEmailService : IEmailService
{
    private readonly string _host;
    private readonly int _port;
    private readonly string _username;
    private readonly string _password;
    private readonly string _fromEmail;
    private readonly string _fromName;
    private readonly string _templateDir;
    private readonly ILogger<SmtpEmailService> _log;

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> log)
    {
        _log = log;
        _host = config["SMTP_HOST"] ?? throw new InvalidOperationException("SMTP_HOST not configured.");
        _port = int.Parse(config["SMTP_PORT"] ?? "587");
        _username = config["SMTP_USERNAME"] ?? throw new InvalidOperationException("SMTP_USERNAME not configured.");
        _password = config["SMTP_PASSWORD"] ?? throw new InvalidOperationException("SMTP_PASSWORD not configured.");
        _fromEmail = config["SMTP_FROM_EMAIL"] ?? _username;
        _fromName = config["SMTP_FROM_NAME"] ?? "Hudson Bailey InsureEdge";
        // Try output-dir path first; fall back to source path for dev
        var outDir = Path.Combine(AppContext.BaseDirectory, "Email", "Templates");
        var srcDir = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "InsureEdge.Infrastructure", "Email", "Templates");
        _templateDir = Directory.Exists(outDir) ? outDir
            : Directory.Exists(srcDir) ? Path.GetFullPath(srcDir)
            : outDir;
    }

    public async Task SendPasswordResetAsync(string toEmail, string toName, string resetUrl)
    {
        var html = await LoadAndReplaceAsync("PasswordReset.html",
            ("{{NAME}}", toName), ("{{RESET_URL}}", resetUrl));
        var text = await LoadAndReplaceAsync("PasswordReset.txt",
            ("{{NAME}}", toName), ("{{RESET_URL}}", resetUrl));
        await SendAsync(toEmail, toName, "Reset Your InsureEdge Password", html, text);
    }

    public async Task SendOnboardingWelcomeAsync(string toEmail, string toName, string setupUrl, string adminEmail)
    {
        var html = await LoadAndReplaceAsync("OnboardingWelcome.html",
            ("{{NAME}}", toName), ("{{SETUP_URL}}", setupUrl), ("{{ADMIN_EMAIL}}", adminEmail));
        var text = await LoadAndReplaceAsync("OnboardingWelcome.txt",
            ("{{NAME}}", toName), ("{{SETUP_URL}}", setupUrl), ("{{ADMIN_EMAIL}}", adminEmail));
        await SendAsync(toEmail, toName, "Welcome to Hudson Bailey InsureEdge", html, text);
    }

    public async Task SendQueryAsync(
        string fromEmail,
        IEnumerable<string> to,
        IEnumerable<string> cc,
        IEnumerable<string> bcc,
        string subject,
        string body,
        IEnumerable<EmailAttachment>? attachments = null)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(string.Empty, fromEmail));

        foreach (var addr in to)  message.To.Add(new MailboxAddress(string.Empty, addr));
        foreach (var addr in cc)  message.Cc.Add(new MailboxAddress(string.Empty, addr));
        foreach (var addr in bcc) message.Bcc.Add(new MailboxAddress(string.Empty, addr));

        message.Subject = subject;

        var builder = new BodyBuilder { TextBody = body };
        if (attachments != null)
            foreach (var att in attachments)
                builder.Attachments.Add(att.FileName, att.Content, ContentType.Parse(att.ContentType));

        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(_host, _port, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(_username, _password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    public async Task SendQuoteShareAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        // Plain-text fallback: strip tags from the rendered quote document.
        var text = System.Text.RegularExpressions.Regex.Replace(htmlBody, "<[^>]+>", " ");
        text = System.Text.RegularExpressions.Regex.Replace(text, @"\s+", " ").Trim();
        await SendAsync(toEmail, toName, subject, htmlBody, text);
    }

    public async Task SendEmailAsync(string fromEmail, string toEmail, string? ccEmail, string? bccEmail, string subject, string htmlBody, byte[]? attachmentBytes = null, string? attachmentFileName = null)
    {
        // Plain-text fallback: strip tags from HTML.
        var text = System.Text.RegularExpressions.Regex.Replace(htmlBody, "<[^>]+>", " ");
        text = System.Text.RegularExpressions.Regex.Replace(text, @"\s+", " ").Trim();
        await SendAsync(fromEmail, toEmail, ccEmail, bccEmail, subject, htmlBody, text, attachmentBytes, attachmentFileName);
    }

    private async Task SendAsync(string toEmail, string toName, string subject, string html, string text)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_fromName, _fromEmail));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder { HtmlBody = html, TextBody = text };
        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        client.Timeout = 60000; // 60 seconds timeout
        client.ServerCertificateValidationCallback = (s, c, h, e) => true; // Accept any certificate for Office 365
        // Port 465 = implicit SSL (SslOnConnect); Port 587 = explicit TLS (StartTls)
        var secureOption = _port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;
        await client.ConnectAsync(_host, _port, secureOption);
        await client.AuthenticateAsync(_username, _password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    private async Task SendAsync(string fromEmail, string toEmail, string? ccEmail, string? bccEmail, string subject, string html, string text, byte[]? attachmentBytes = null, string? attachmentFileName = null)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_fromName, fromEmail ?? _fromEmail));
            message.To.Add(new MailboxAddress(toEmail.Split('@')[0], toEmail));

            if (!string.IsNullOrWhiteSpace(ccEmail))
                foreach (var cc in ccEmail.Split(';', StringSplitOptions.RemoveEmptyEntries))
                    message.Cc.Add(new MailboxAddress(cc.Trim().Split('@')[0], cc.Trim()));

            if (!string.IsNullOrWhiteSpace(bccEmail))
                foreach (var bcc in bccEmail.Split(';', StringSplitOptions.RemoveEmptyEntries))
                    message.Bcc.Add(new MailboxAddress(bcc.Trim().Split('@')[0], bcc.Trim()));

            message.Subject = subject;

            var bodyBuilder = new BodyBuilder { HtmlBody = html, TextBody = text };

            if (attachmentBytes != null && !string.IsNullOrWhiteSpace(attachmentFileName))
            {
                _log.LogInformation("Attaching document: {FileName}, Size: {Size} bytes", attachmentFileName, attachmentBytes.Length);
                bodyBuilder.Attachments.Add(attachmentFileName, new System.IO.MemoryStream(attachmentBytes), MimeKit.ContentType.Parse("application/pdf"));
            }
            else if (attachmentFileName != null)
            {
                _log.LogWarning("Document attachment requested but bytes are null - FileName: {FileName}", attachmentFileName);
            }

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            client.Timeout = 60000; // 60 seconds timeout
            client.ServerCertificateValidationCallback = (s, c, h, e) => true; // Accept any certificate for Office 365
            // Port 465 = implicit SSL (SslOnConnect); Port 587 = explicit TLS (StartTls)
            var secureOption = _port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;
            await client.ConnectAsync(_host, _port, secureOption);
            await client.AuthenticateAsync(_username, _password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Email sending failed for {ToEmail}", toEmail);
            throw new InvalidOperationException($"Failed to send email to {toEmail}: {ex.Message}", ex);
        }
    }

    private async Task<string> LoadAndReplaceAsync(string templateName, params (string Key, string Value)[] replacements)
    {
        var path = Path.Combine(_templateDir, templateName);
        var content = await File.ReadAllTextAsync(path);
        foreach (var (key, value) in replacements)
            content = content.Replace(key, value);
        return content;
    }
}
