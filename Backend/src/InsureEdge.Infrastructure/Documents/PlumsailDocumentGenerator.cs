// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Document Generation PRD §6/§11: Plumsail integration (IEDocumentGenerator rebuild).
// Talks to Plumsail with raw HTTP calls (the original used ardoHTTP HTTPPost/HTTPGet/
// HttpBinaryGet rather than a generated REST consumer). No authentication headers are
// configured — per the PRD the original calls carried no credentials; tenant routing is
// embedded in the {UserId} path segment (PRD §11 open question, replicated as-is).
using InsureEdge.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace InsureEdge.Infrastructure.Documents;

public class PlumsailDocumentGenerator : IPlumsailDocumentGenerator
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly ILogger<PlumsailDocumentGenerator> _log;
    private readonly string _baseUrl;

    public PlumsailDocumentGenerator(IHttpClientFactory httpFactory, IConfiguration config, ILogger<PlumsailDocumentGenerator> log)
    {
        _httpFactory = httpFactory;
        _log = log;
        // PRD §6.4 Site Property PlumsailAPI (same default value).
        _baseUrl = config["PlumsailAPI"] ?? "https://api.plumsail.com/api/v2/processes/jobs/";
    }

    public async Task<string> GenerateDocAsync(string json, string processId, string userId)
    {
        var client = _httpFactory.CreateClient("plumsail");
        var url = $"{_baseUrl}{userId}/{processId}/start";
        using var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync(url, content);

        // PRD §6.1: JobId comes from the Location response header (case-insensitive
        // match), with the jobs base URL prefix stripped.
        foreach (var header in response.Headers)
        {
            if (!string.Equals(header.Key, "location", StringComparison.OrdinalIgnoreCase)) continue;
            var value = header.Value.FirstOrDefault() ?? "";
            return value.Replace("https://api.plumsail.com/api/v2/processes/jobs/", "");
        }
        _log.LogWarning("Plumsail start job returned no Location header (status {Status}) for process {ProcessId}", response.StatusCode, processId);
        return "";
    }

    public async Task<(string FilePath, bool Success, string Message)> GetFileUrlAsync(string jobId)
    {
        try
        {
            var client = _httpFactory.CreateClient("plumsail");
            var response = await client.GetAsync($"{_baseUrl}{jobId}");
            var body = await response.Content.ReadAsStringAsync();
            var filePath = "";
            // PRD §6.2/§6.5: response deserialized into GetResponseText — Data.Link holds
            // the generated file URL once the job completes.
            try
            {
                // Plumsail returns {"link":"..."} at the root once the job completes
                // (verified live); the OutSystems trace showed it nested under Data — accept both.
                using var doc = System.Text.Json.JsonDocument.Parse(body);
                var root = doc.RootElement;
                if (root.TryGetProperty("link", out var rootLink) && rootLink.ValueKind == System.Text.Json.JsonValueKind.String)
                    filePath = rootLink.GetString() ?? "";
                else if (root.TryGetProperty("data", out var data) && data.ValueKind == System.Text.Json.JsonValueKind.Object
                    && data.TryGetProperty("link", out var link) && link.ValueKind == System.Text.Json.JsonValueKind.String)
                    filePath = link.GetString() ?? "";
            }
            catch (System.Text.Json.JsonException) { /* still processing / non-JSON body */ }
            return (filePath, response.IsSuccessStatusCode, body);
        }
        catch (Exception ex)
        {
            // PRD §6.2: AllExceptions → Success=False + Message.
            return ("", false, ex.Message);
        }
    }

    public async Task<(byte[] BinaryFile, string ContentType)> DownloadFileAsync(string path)
    {
        var client = _httpFactory.CreateClient("plumsail");
        var response = await client.GetAsync(path);
        var bytes = await response.Content.ReadAsByteArrayAsync();
        return (bytes, response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream");
    }
}
