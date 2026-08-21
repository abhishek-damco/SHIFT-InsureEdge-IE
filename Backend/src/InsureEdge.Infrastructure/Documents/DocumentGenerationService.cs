// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Document Generation PRD §5 (IE_Policy_BL rebuild):
//  - GenerationDocuments_QuoteProposalPackage: tenant + policy resolution, ProductDocument
//    template lookup (GetPlumsailIds/GetPlumsailIds2), merge-JSON build
//    (GetJSON_QuoteProposalDec / GetJSON_UWSpecificChange), Plumsail GenerateDoc.
//  - GetandDownloadDocument: 2 s × ≤20 poll loop (GetFileURL), binary downloads
//    (DownloadFile), MergePDF, CreateUpdatePolicyDocument_HB persistence, binary return.
// The Quote Proposal Dec merge JSON follows the exact schema captured from the original
// GetJSON_QuoteProposalDec action (AddlNameIns/AddlOrg/Mortgagee arrays + root fields).
// The UW Specific Change Endorsement is generated only when its Plumsail template is
// configured; otherwise the package contains the Quote Proposal Declaration alone.
using System.Text.Json;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PdfSharpCore.Pdf;
using PdfSharpCore.Pdf.IO;

namespace InsureEdge.Infrastructure.Documents;

public class DocumentGenerationService : IDocumentGenerationService
{
    private const string PackageFileName = "Quote Proposal Package.pdf"; // PRD §7 rule 7
    private const int PollIntervalMs = 2000;                             // PRD §7 rule 5
    private const int MaxPollAttempts = 50;                              // Increased from 20 to 100s timeout to allow Plumsail more time
    private const string QuoteProposalTemplateName = "QuoteProposalDeclarationPage";        // PRD §5.4
    private const string UwChangeTemplateName = "UnderwriterSpecificChangeEndorsement";     // PRD §5.4

    private readonly InsureEdgeDbContext _db;
    private readonly IPlumsailDocumentGenerator _plumsail;
    private readonly ICurrentTenantService _tenant;
    private readonly ILogger<DocumentGenerationService> _log;

    public DocumentGenerationService(InsureEdgeDbContext db, IPlumsailDocumentGenerator plumsail,
        ICurrentTenantService tenant, ILogger<DocumentGenerationService> log)
    {
        _db = db;
        _plumsail = plumsail;
        _tenant = tenant;
        _log = log;
    }

    public async Task<GenerateDocumentResult> GenerateQuoteProposalPackageAsync(string submissionId)
    {
        try
        {
            var clientId = _tenant.ClientId;
            _log.LogInformation("DocumentGeneration: Starting for submission {SubmissionId}, clientId {ClientId}", submissionId, clientId);

            // GetPolicyByPolicyId + client check ("same quote number can exist for different clients").
            var policy = await _db.Policies.FirstOrDefaultAsync(p =>
                p.ClientId == clientId && (p.QuoteNumber == submissionId || p.PolicyNumber == submissionId));
            if (policy == null)
            {
                _log.LogWarning("DocumentGeneration: Quote not found for submission {SubmissionId}, clientId {ClientId}", submissionId, clientId);
                return new GenerateDocumentResult(false, "Quote not found.", null, null, PackageFileName);
            }
            _log.LogInformation("DocumentGeneration: Found policy {PolicyId} for submission {SubmissionId}", policy.Id, submissionId);

            // GetPlumsailIds — ProductDocument lookup (ClientId + Name, Max Records 1).
            var quoteTemplate = await GetPlumsailIdsAsync(clientId, QuoteProposalTemplateName);
            if (!IsConfigured(quoteTemplate))
            {
                _log.LogWarning("DocumentGeneration: Plumsail template not configured for clientId {ClientId}, templateName {TemplateName}", clientId, QuoteProposalTemplateName);
                return new GenerateDocumentResult(false,
                    "Plumsail template mapping (ProductDocument) is not configured for the Quote Proposal Declaration.", null, null, PackageFileName);
            }
            _log.LogInformation("DocumentGeneration: Found Plumsail template for {TemplateName}", QuoteProposalTemplateName);
            // Second document of the package — optional until its template is configured.
            var uwTemplate = await GetPlumsailIdsAsync(clientId, UwChangeTemplateName);
            var includeUwDoc = IsConfigured(uwTemplate);

            var premium = await _db.PolicyPremiums.FirstOrDefaultAsync(pp =>
                pp.PolicyId == policy.Id && pp.ClientId == clientId && (pp.IsCancelled == null || pp.IsCancelled == false));
            var draft = await _db.Submissions.Where(s => s.Id == submissionId && s.ClientId == clientId)
                .Select(s => s.Data).FirstOrDefaultAsync();
            _log.LogInformation("DocumentGeneration: Draft data is null: {DraftNull}, Draft length: {DraftLength}", string.IsNullOrWhiteSpace(draft), draft?.Length ?? 0);

            // Broker of record: resolve the intermediary from the policy link or the
            // draft's brokerageFirmId (name + code; no address data exists in this schema).
            var intermediaryId = policy.IntermediaryId ?? ReadDraftBrokerageFirmId(draft);
            var broker = intermediaryId.HasValue
                ? await _db.Database.SqlQuery<BrokerRow>(
                        $"SELECT intermediary_name AS name, intermediary_code AS code FROM intermediary WHERE id = {intermediaryId.Value} AND client_id = {clientId}")
                    .FirstOrDefaultAsync()
                : null;

            // GetJSON_QuoteProposalDec — merge-field payload (exact original schema).
            var quoteJson = BuildQuoteProposalDecJson(policy, premium, draft, broker);
            _log.LogInformation("DocumentGeneration: Quote JSON payload: {QuoteJson}", quoteJson);
            _log.LogInformation("DocumentGeneration: starting Plumsail job (QuoteProposalDec) for policy {PolicyId}", policy.Id); // LogMessage
            var quoteJobId = await _plumsail.GenerateDocAsync(quoteJson, quoteTemplate!.PlumsailProcessId!, quoteTemplate.PlumsailUserId!);
            if (string.IsNullOrEmpty(quoteJobId))
                return new GenerateDocumentResult(false, "Document generation could not be started (Quote Proposal Declaration).", null, null, PackageFileName);

            var uwJobId = "";
            if (includeUwDoc)
            {
                var uwJson = BuildQuoteProposalDecJson(policy, premium, draft, broker); // UW schema not yet provided; reuse until GetJSON_UWSpecificChange is captured
                _log.LogInformation("DocumentGeneration: starting Plumsail job (UWSpecificChange) for policy {PolicyId}", policy.Id); // LogMessage2
                uwJobId = await _plumsail.GenerateDocAsync(uwJson, uwTemplate!.PlumsailProcessId!, uwTemplate.PlumsailUserId!);
                if (string.IsNullOrEmpty(uwJobId))
                    return new GenerateDocumentResult(false, "Document generation could not be started (Underwriter Specific Change Endorsement).", null, null, PackageFileName);
            }

            // GetandDownloadDocument — poll, download, merge, persist, return binary.
            return await GetAndDownloadDocumentAsync(policy, quoteJobId, uwJobId);
        }
        catch (Exception ex)
        {
            // AllExceptions handler → LogMessage3 → error message out (PRD §15).
            _log.LogError(ex, "DocumentGeneration: unhandled exception for submission {SubmissionId}", submissionId);
            return new GenerateDocumentResult(false, ex.Message, null, null, PackageFileName);
        }
    }

    private static bool IsConfigured(ProductDocument? template) =>
        template != null
        && !string.IsNullOrWhiteSpace(template.PlumsailProcessId)
        && !string.IsNullOrWhiteSpace(template.PlumsailUserId)
        && !template.PlumsailProcessId!.StartsWith("REPLACE_WITH", StringComparison.OrdinalIgnoreCase);

    private async Task<GenerateDocumentResult> GetAndDownloadDocumentAsync(Policy policy, string quoteJobId, string uwJobId)
    {
        var wantUw = !string.IsNullOrEmpty(uwJobId);
        var fileUrlQuoteProposal = "";
        var fileUrlUwChanges = "";
        var count = 0;

        // PRD §5.5: poll every 2 s, up to 50 attempts, until all requested file URLs are populated.
        _log.LogInformation("DocumentGeneration: Starting poll for file URLs - QuoteJobId: {QuoteJobId}, UwJobId: {UwJobId}, WantUw: {WantUw}", quoteJobId, uwJobId, wantUw);
        try
        {
            while ((string.IsNullOrWhiteSpace(fileUrlQuoteProposal) || (wantUw && string.IsNullOrWhiteSpace(fileUrlUwChanges))) && count < MaxPollAttempts)
            {
                await Task.Delay(PollIntervalMs);
                if (string.IsNullOrWhiteSpace(fileUrlQuoteProposal))
                {
                    var (path, success, message) = await _plumsail.GetFileUrlAsync(quoteJobId);
                    // CRITICAL: Must check 'success' flag! GetFileUrlAsync returns Success=false when Plumsail
                    // returns 4xx/5xx errors. If this check is removed, errors get silently retried 50 times
                    // for 100 seconds instead of immediately reporting the actual problem.
                    // Root cause of silent document generation failures (found July 2026).
                    if (!success)
                    {
                        _log.LogError("DocumentGeneration: Plumsail returned error for quote job - Message: {Message}", message);
                        return new GenerateDocumentResult(false, $"Plumsail document generation error: {message}", null, null, PackageFileName);
                    }
                    fileUrlQuoteProposal = path;
                    _log.LogInformation("DocumentGeneration: Poll attempt {Attempt} - QuoteURL: {QuoteUrl}", count, string.IsNullOrWhiteSpace(path) ? "NOT_READY" : "READY");
                }
                if (wantUw && string.IsNullOrWhiteSpace(fileUrlUwChanges))
                {
                    var (path, success, message) = await _plumsail.GetFileUrlAsync(uwJobId);
                    // CRITICAL: Must check 'success' flag! See comment above for GetFileUrlAsync.
                    if (!success)
                    {
                        _log.LogError("DocumentGeneration: Plumsail returned error for UW job - Message: {Message}", message);
                        return new GenerateDocumentResult(false, $"Plumsail document generation error: {message}", null, null, PackageFileName);
                    }
                    fileUrlUwChanges = path;
                    _log.LogInformation("DocumentGeneration: Poll attempt {Attempt} - UwURL: {UwUrl}", count, string.IsNullOrWhiteSpace(path) ? "NOT_READY" : "READY");
                }
                count++;
            }
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "DocumentGeneration: Error during polling - Attempt: {Attempt}", count);
            return new GenerateDocumentResult(false, $"Error polling for document: {ex.Message}", null, null, PackageFileName);
        }

        _log.LogInformation("DocumentGeneration: Poll complete after {Attempts} attempts - QuoteURL ready: {QuoteReady}, UwURL ready: {UwReady}", count, !string.IsNullOrWhiteSpace(fileUrlQuoteProposal), !string.IsNullOrWhiteSpace(fileUrlUwChanges));
        if (string.IsNullOrWhiteSpace(fileUrlQuoteProposal) || (wantUw && string.IsNullOrWhiteSpace(fileUrlUwChanges)))
            return new GenerateDocumentResult(false, "Document generation timed out. Please try again.", null, null, PackageFileName);

        var pdfs = new List<byte[]>();
        _log.LogInformation("DocumentGeneration: Downloading quote PDF from {FileUrl}", fileUrlQuoteProposal);
        var (quotePdf, _) = await _plumsail.DownloadFileAsync(fileUrlQuoteProposal);
        _log.LogInformation("DocumentGeneration: Quote PDF downloaded - Size: {Size} bytes", quotePdf.Length);
        if (quotePdf.Length == 0)
            return new GenerateDocumentResult(false, "Generated document could not be downloaded.", null, null, PackageFileName);
        pdfs.Add(quotePdf);
        if (wantUw)
        {
            _log.LogInformation("DocumentGeneration: Downloading UW PDF from {FileUrl}", fileUrlUwChanges);
            var (uwPdf, _) = await _plumsail.DownloadFileAsync(fileUrlUwChanges);
            _log.LogInformation("DocumentGeneration: UW PDF downloaded - Size: {Size} bytes", uwPdf.Length);
            if (uwPdf.Length == 0)
                return new GenerateDocumentResult(false, "Generated document could not be downloaded.", null, null, PackageFileName);
            pdfs.Add(uwPdf);
        }

        // MergePDF: combine the generated PDFs into one package.
        // (GetStaticDocument / GetStaticDocumentScheldeuedOfInsurers static attachments were
        // "Not Found" in the PRD trace and are not reproduced here.)
        _log.LogInformation("DocumentGeneration: Merging {PdfCount} PDFs", pdfs.Count);
        byte[] merged;
        try
        {
            merged = MergePdf(pdfs.ToArray());
            _log.LogInformation("DocumentGeneration: Merged PDF size: {Size} bytes", merged.Length);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "DocumentGeneration: PDF merge failed");
            return new GenerateDocumentResult(false, $"PDF merge failed: {ex.Message}", null, null, PackageFileName);
        }

        // CreateUpdatePolicyDocument_HB → PolicyDocument entity (PRD §5.6/§7 rule 7).
        _log.LogInformation("DocumentGeneration: Creating PolicyDocument - PolicyId: {PolicyId}, FileName: {FileName}", policy.Id, PackageFileName);
        var document = new PolicyDocument
        {
            ClientId = policy.ClientId,
            PolicyId = policy.Id,
            FileName = PackageFileName,
            FileType = "pdf",
            BinaryFileTemp = merged,
            TransactionType = null,
            Version = null,
            CreatedBy = _tenant.UserId,
        };
        _db.PolicyDocuments.Add(document);
        try
        {
            await _db.SaveChangesAsync();
            _log.LogInformation("DocumentGeneration: PolicyDocument saved - DocumentId: {DocumentId}", document.Id);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "DocumentGeneration: Failed to save PolicyDocument");
            return new GenerateDocumentResult(false, $"Failed to save document: {ex.Message}", null, null, PackageFileName);
        }

        return new GenerateDocumentResult(true, "Document generated successfully.", document.Id, merged, PackageFileName);
    }

    public async Task<IReadOnlyList<GeneratedDocumentDto>> ListGeneratedAsync(string submissionId)
    {
        var clientId = _tenant.ClientId;
        var policy = await _db.Policies.FirstOrDefaultAsync(p =>
            p.ClientId == clientId && (p.QuoteNumber == submissionId || p.PolicyNumber == submissionId));
        if (policy == null) return Array.Empty<GeneratedDocumentDto>();

        return await _db.PolicyDocuments
            .Where(d => d.PolicyId == policy.Id && d.ClientId == clientId && d.BinaryFileTemp != null)
            .OrderByDescending(d => d.CreatedOn)
            .Select(d => new GeneratedDocumentDto(d.Id, d.FileName, d.FileType, d.TransactionType, d.Version, d.CreatedOn))
            .ToListAsync();
    }

    public async Task<(byte[] Bytes, string FileName, string ContentType)?> GetGeneratedBinaryAsync(string submissionId, long documentId)
    {
        var clientId = _tenant.ClientId;
        var policy = await _db.Policies.FirstOrDefaultAsync(p =>
            p.ClientId == clientId && (p.QuoteNumber == submissionId || p.PolicyNumber == submissionId));
        if (policy == null) return null;

        // Tenant isolation on download (PRD §17): document must belong to this client+policy.
        var doc = await _db.PolicyDocuments.FirstOrDefaultAsync(d =>
            d.Id == documentId && d.PolicyId == policy.Id && d.ClientId == clientId);
        if (doc?.BinaryFileTemp == null) return null;
        var contentType = string.Equals(doc.FileType, "pdf", StringComparison.OrdinalIgnoreCase)
            ? "application/pdf" : "application/octet-stream";
        return (doc.BinaryFileTemp, doc.FileName ?? "document", contentType);
    }

    private const string NoticeOfNonRenewalTemplateName = "NoticeOfPolicyNonrenewal";
    private const string NoticeOfNonRenewalFileName = "Notice of Policy Nonrenewal.pdf";

    public async Task<GenerateDocumentResult> GenerateNoticeOfNonRenewalAsync(long policyId, NoticeOfNonRenewalSelections selections)
    {
        try
        {
            var clientId = _tenant.ClientId;
            var policy = await _db.Policies
                .Include(p => p.Account)
                .Include(p => p.Intermediary)
                .FirstOrDefaultAsync(p => p.Id == policyId && p.ClientId == clientId);
            if (policy == null)
                return new GenerateDocumentResult(false, "Policy not found.", null, null, NoticeOfNonRenewalFileName);

            var template = await GetPlumsailIdsAsync(clientId, NoticeOfNonRenewalTemplateName);
            if (!IsConfigured(template))
                return new GenerateDocumentResult(false,
                    "Plumsail template mapping (ProductDocument) is not configured for the Notice of Policy Nonrenewal.", null, null, NoticeOfNonRenewalFileName);

            var account = policy.Account;
            var namedInsured = account == null ? "" :
                string.Equals(account.AccountType, "Individual", StringComparison.OrdinalIgnoreCase)
                    ? string.Join(" ", new[] { account.FirstName, account.MiddleName, account.LastName, account.Suffix }.Where(s => !string.IsNullOrWhiteSpace(s)))
                    : account.LegalBusinessName ?? "";

            var nextDueEffective = policy.ExpiryDate?.AddDays(1);

            var payload = new Dictionary<string, object>
            {
                ["NamedInsured"] = namedInsured,
                ["Brokerage"] = policy.Intermediary?.IntermediaryName ?? "",
                ["PolicyNo"] = policy.PolicyNumber,
                ["PolEffDt"] = policy.EffectiveDate?.ToString("MM-dd-yyyy") ?? "",
                ["PolExpDt"] = policy.ExpiryDate?.ToString("MM-dd-yyyy") ?? "",
                ["SystemDt"] = DateTime.UtcNow.ToString("MM-dd-yyyy"),
                ["NonRenewEffDt"] = nextDueEffective?.ToString("MM-dd-yyyy") ?? "",
                ["NRNI"] = selections.CheckBoxYourNonRenewal ? "X" : "",
                ["ReneffdateNI"] = selections.CheckBoxYourNonRenewal ? (nextDueEffective?.ToString("MM-dd-yyyy") ?? " ") : " ",
                ["Reneffdate"] = !selections.CheckBoxYourNonRenewal ? (nextDueEffective?.ToString("MM-dd-yyyy") ?? " ") : " ",
            };
            for (var i = 0; i < selections.Attributes.Count && i < 65; i++)
                payload[$"Attribute{i + 1}"] = selections.Attributes[i] ? "X" : " ";

            var json = JsonSerializer.Serialize(payload);
            _log.LogInformation("DocumentGeneration: starting Plumsail job (NoticeOfPolicyNonrenewal) for policy {PolicyId}", policy.Id);
            var jobId = await _plumsail.GenerateDocAsync(json, template!.PlumsailProcessId!, template.PlumsailUserId!);
            if (string.IsNullOrEmpty(jobId))
                return new GenerateDocumentResult(false, "Document generation could not be started (Notice of Policy Nonrenewal).", null, null, NoticeOfNonRenewalFileName);

            var fileUrl = "";
            var count = 0;
            while (string.IsNullOrWhiteSpace(fileUrl) && count < MaxPollAttempts)
            {
                await Task.Delay(PollIntervalMs);
                var (path, _, _) = await _plumsail.GetFileUrlAsync(jobId);
                fileUrl = path;
                count++;
            }
            if (string.IsNullOrWhiteSpace(fileUrl))
                return new GenerateDocumentResult(false, "Document generation timed out. Please try again.", null, null, NoticeOfNonRenewalFileName);

            var (pdf, _) = await _plumsail.DownloadFileAsync(fileUrl);
            if (pdf.Length == 0)
                return new GenerateDocumentResult(false, "Generated document could not be downloaded.", null, null, NoticeOfNonRenewalFileName);

            var version = await NextDocumentVersionAsync(clientId, policy.Id, "Do Not Renew");
            var document = new PolicyDocument
            {
                ClientId = clientId,
                PolicyId = policy.Id,
                FileName = NoticeOfNonRenewalFileName,
                FileType = "pdf",
                BinaryFileTemp = pdf,
                TransactionType = "Do Not Renew",
                Version = version,
                CreatedBy = _tenant.UserId,
            };
            _db.PolicyDocuments.Add(document);
            await _db.SaveChangesAsync();

            return new GenerateDocumentResult(true, "Document generated successfully.", document.Id, pdf, NoticeOfNonRenewalFileName);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "DocumentGeneration: unhandled exception generating Notice of Policy Nonrenewal for policy {PolicyId}", policyId);
            return new GenerateDocumentResult(false, ex.Message, null, null, NoticeOfNonRenewalFileName);
        }
    }

    private async Task<string> NextDocumentVersionAsync(long clientId, long policyId, string transactionType)
    {
        var versions = await _db.PolicyDocuments
            .Where(d => d.ClientId == clientId && d.PolicyId == policyId && d.TransactionType == transactionType)
            .Select(d => d.Version)
            .ToListAsync();
        var max = versions.Select(v => int.TryParse(v, out var n) ? n : 0).DefaultIfEmpty(0).Max();
        return (max + 1).ToString();
    }

    // PRD §5.4 GetPlumsailIds/GetPlumsailIds2: ProductDocument by ClientId + Name, Max Records 1.
    private Task<ProductDocument?> GetPlumsailIdsAsync(long clientId, string name) =>
        _db.ProductDocuments
            .Where(pd => pd.ClientId == clientId && pd.Name == name)
            .OrderBy(pd => pd.Name)
            .FirstOrDefaultAsync();

    private sealed class BrokerRow
    {
        public string? Name { get; set; }
        public string? Code { get; set; }
    }

    private static long? ReadDraftBrokerageFirmId(string? draftJson)
    {
        if (string.IsNullOrWhiteSpace(draftJson)) return null;
        try
        {
            using var doc = JsonDocument.Parse(draftJson);
            if (doc.RootElement.TryGetProperty("form", out var form)
                && form.TryGetProperty("brokerageFirmId", out var id))
            {
                if (id.ValueKind == JsonValueKind.Number && id.TryGetInt64(out var n)) return n;
                if (id.ValueKind == JsonValueKind.String && long.TryParse(id.GetString(), out var s)) return s;
            }
        }
        catch (JsonException) { }
        return null;
    }

    // ─── GetJSON_QuoteProposalDec (exact schema from the original action) ─────────
    //
    // Root fields + AddlNameIns / AddlOrg / Mortgagee arrays, matching the merge tokens
    // of the Plumsail "Quote Dec Page" template. Data sources mirror the original
    // aggregates: policy + premium rows and the submission draft (named insured,
    // location, additional insureds/orgs, mortgagees, brokerage).
    private static string BuildQuoteProposalDecJson(Policy policy, PolicyPremium? premium, string? draftJson, BrokerRow? broker = null)
    {
        JsonElement form = default, mortgages = default, addlIns = default, addlOrgs = default;
        JsonDocument? doc = null;
        if (!string.IsNullOrWhiteSpace(draftJson))
        {
            try
            {
                doc = JsonDocument.Parse(draftJson);
                var root = doc.RootElement;
                root.TryGetProperty("form", out form);
                root.TryGetProperty("mortgages", out mortgages);
                root.TryGetProperty("additionalInsureds", out addlIns);
                root.TryGetProperty("additionalOrgs", out addlOrgs);
            }
            catch (JsonException) { }
        }

        using (doc)
        {
            string F(string key) =>
                form.ValueKind == JsonValueKind.Object && form.TryGetProperty(key, out var v) && v.ValueKind == JsonValueKind.String
                    ? v.GetString() ?? "" : "";
            static string Item(JsonElement e, string key) =>
                e.ValueKind == JsonValueKind.Object && e.TryGetProperty(key, out var v) && v.ValueKind == JsonValueKind.String
                    ? v.GetString() ?? "" : "";
            static string Usd(decimal? n) => (n ?? 0m).ToString("N2", System.Globalization.CultureInfo.InvariantCulture);
            static IEnumerable<JsonElement> Rows(JsonElement e) =>
                e.ValueKind == JsonValueKind.Array ? e.EnumerateArray() : Enumerable.Empty<JsonElement>();

            var namedInsured = string.Join(" ", new[] { F("firstName"), F("middleName"), F("lastName") }
                .Where(s => !string.IsNullOrWhiteSpace(s)));
            if (string.IsNullOrWhiteSpace(namedInsured)) namedInsured = F("organizationName");
            var addressLine = string.Join(" ", new[] { F("addressLine1"), F("addressLine2") }
                .Where(s => !string.IsNullOrWhiteSpace(s)));

            // Limit amounts ("Summary of coverage" grid): normalize draft strings like
            // "3,00,000" / "300000" to US-formatted numbers; blank stays blank.
            static string Amount(string raw)
            {
                var digits = new string(raw.Where(char.IsDigit).ToArray());
                return long.TryParse(digits, out var n) && n > 0
                    ? n.ToString("N0", System.Globalization.CultureInfo.InvariantCulture) : "";
            }

            // Policy period: expiration falls back to effective + 1 year (annual term).
            var effDt = policy.EffectiveDate?.ToString("MM-dd-yyyy") ?? F("effectiveDate");
            var expDt = policy.ExpiryDate?.ToString("MM-dd-yyyy") ?? F("expirationDate");
            if (string.IsNullOrWhiteSpace(expDt) && policy.EffectiveDate.HasValue)
                expDt = policy.EffectiveDate.Value.AddYears(1).ToString("MM-dd-yyyy");

            var coveragePremium = premium?.TotalCoveragePremium ?? 0m;
            var totalTax = premium?.TotalTax ?? 0m;
            var stampingFee = premium?.StampingFee ?? 0m;
            var policyFee = premium?.PolicyFees ?? 0m;
            var total = coveragePremium + totalTax + stampingFee + policyFee;

            // ListAppendAdditionalInsured mapping (from the original action):
            // Name = First + Middle + Last, address from the account's CommonAddress,
            // AN1 = "X" when INDIVIDUAL, AN2 = "X" when SOLEPROPRIETORSHIP, DBA as-is.
            var addlNameIns = Rows(addlIns).Select(ai => new Dictionary<string, string>
            {
                ["Name"] = string.Join(" ", new[] { Item(ai, "firstName"), Item(ai, "middleName"), Item(ai, "lastName"), Item(ai, "name") }
                    .Where(s => !string.IsNullOrWhiteSpace(s))),
                ["AddressLine"] = addressLine,
                ["City"] = F("city"),
                ["State"] = F("state"),
                ["Zip"] = F("zip"),
                ["AN1"] = Item(ai, "insuredType").ToUpperInvariant() == "INDIVIDUAL" ? "X" : "",
                ["AN2"] = Item(ai, "insuredType").ToUpperInvariant() == "SOLEPROPRIETORSHIP" ? "X" : "",
                ["DBA"] = Item(ai, "dba"),
            }).ToList();

            var addlOrg = Rows(addlOrgs).Select(org => new Dictionary<string, string>
            {
                ["Name"] = string.IsNullOrWhiteSpace(Item(org, "organizationName")) ? Item(org, "name") : Item(org, "organizationName"),
                ["AddressLine"] = addressLine,
                ["City"] = F("city"),
                ["State"] = F("state"),
                ["Zip"] = F("zip"),
                ["O1"] = "", ["O5"] = "", ["O2"] = "", ["O6"] = "",
                ["O3"] = "", ["O7"] = "", ["O4"] = "", ["O8"] = "",
            }).ToList();

            var mortgagee = Rows(mortgages).Select(m => new Dictionary<string, string>
            {
                ["Name"] = Item(m, "name"),
                ["AddressLine"] = Item(m, "googleAddress"),
                ["City"] = "",
                ["State"] = "",
                ["Zip"] = "",
                ["LoanNo"] = Item(m, "loanNumber"),
                ["LE1"] = Item(m, "lenderType").ToUpperInvariant().Contains("MORTGAGE") ? "X" : "",
                ["LE2"] = !string.IsNullOrWhiteSpace(Item(m, "lenderType")) && !Item(m, "lenderType").ToUpperInvariant().Contains("MORTGAGE") ? "X" : "",
                ["LO1"] = Item(m, "loanType").ToUpperInvariant().Contains("FIRST") ? "X" : "",
                ["LO2"] = Item(m, "loanType").ToUpperInvariant().Contains("SECOND") ? "X" : "",
                ["LO3"] = !string.IsNullOrWhiteSpace(Item(m, "loanType"))
                    && !Item(m, "loanType").ToUpperInvariant().Contains("FIRST")
                    && !Item(m, "loanType").ToUpperInvariant().Contains("SECOND") ? "X" : "",
                ["CA1"] = Item(m, "coveredAsset").ToUpperInvariant().Contains("DWELLING") ? "X" : "",
                ["CA2"] = !string.IsNullOrWhiteSpace(Item(m, "coveredAsset"))
                    && !Item(m, "coveredAsset").ToUpperInvariant().Contains("DWELLING") ? "X" : "",
            }).ToList();

            var payload = new Dictionary<string, object>
            {
                ["AddlNameIns"] = addlNameIns,
                ["AddlOrg"] = addlOrg,
                ["Mortgagee"] = mortgagee,
                ["PolicyNo"] = policy.QuoteNumber ?? policy.PolicyNumber ?? "",
                ["RenewalNo"] = "",
                // Broker of record: intermediary name/code; address & phone have no source
                // in this schema (intermediary carries no address rows).
                ["Brokerage"] = broker?.Name ?? F("brokerageFirm"),
                ["BrokerAddressLine"] = "",
                ["BrokerAddressCity"] = "",
                ["BrokerAddressState"] = "",
                ["BrokerAddressZip"] = "",
                ["BrokerAddressPhone"] = "",
                ["BrokerID"] = broker?.Code ?? "",
                ["PolEffDt"] = effDt,
                ["PolExpDt"] = expDt,
                ["NamedInsured"] = namedInsured,
                ["NamedInsuredAddressLine"] = addressLine,
                ["NamedInsuredAddressCity"] = F("city"),
                ["NIST"] = F("state"),
                ["NamedInsuredAddressState"] = F("state"),
                ["PrimaryContactName"] = namedInsured,
                ["PrimaryContactEmail"] = F("email"),
                ["PrimaryContactPhone"] = F("phone"),
                ["LocAddress"] = addressLine,
                ["LocAddressCity"] = F("city"),
                // Covered-location grid order is Street/City/County/State/Postal —
                // the "LocAddress?" token sits between City and Zip, i.e. the County cell.
                ["LocAddress?"] = F("county"),
                ["LocAddressZip"] = F("zip"),
                ["HBLicenseNo"] = "",
                ["BoundDate"] = policy.PolicyIssuedOn?.ToString("MM-dd-yyyy") ?? "",
                ["CoveragePremium"] = Usd(coveragePremium),
                ["SurplusTax"] = Usd(totalTax),   // surplus lines carries the tax; fire is 0 in current states
                ["FireTax"] = Usd(0m),
                ["StampingFee"] = Usd(stampingFee),
                ["TotalTaxFee"] = Usd(totalTax + stampingFee + policyFee),
                ["LocState"] = F("state"),
                ["TotalOfAboveFigures"] = Usd(total),
                ["StateDisclaimer"] = "",
            };
            // Numbered tokens 01..24 (dec-page grid cells). 01–05 are the "Summary of
            // coverage" limit rows: Dwelling, Appurtenant structure, Personal asset,
            // Dwelling occupancy disruption, Blanket personal liabilities. The remaining
            // tokens (deductible/coverage option marks) have no captured mapping — blank.
            for (var i = 1; i <= 24; i++) payload[i.ToString("00")] = "";
            payload["01"] = Amount(F("dwellingLimit"));
            payload["02"] = Amount(F("appurtenantLimit"));
            payload["03"] = Amount(F("personalAssetsLimit"));
            payload["04"] = Amount(F("occupancyDisruptionLimit"));
            payload["05"] = Amount(F("liabilityAmount"));

            return JsonSerializer.Serialize(payload);
        }
    }

    // MergePDF equivalent (PRD §5.5): merges the generated PDFs into a single document.
    private static byte[] MergePdf(params byte[][] pdfs)
    {
        using var output = new PdfDocument();
        foreach (var pdfBytes in pdfs)
        {
            using var stream = new MemoryStream(pdfBytes);
            using var input = PdfReader.Open(stream, PdfDocumentOpenMode.Import);
            foreach (var page in input.Pages) output.AddPage(page);
        }
        using var result = new MemoryStream();
        output.Save(result, false);
        return result.ToArray();
    }
}
