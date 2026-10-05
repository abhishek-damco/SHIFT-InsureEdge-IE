// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// LenderDock API integration (QA): POST /v2/notice/bill and /v2/notice/coverage.
// No auth mechanism was provided by the team (matches this codebase's existing Plumsail
// integration, which also sends no auth headers) — revisit if the real API rejects
// unauthenticated calls. NOT smoke-tested against the live QA endpoint.
// Retry: up to 2 attempts on failure (HTTP failure or response.status != "success"), then
// logs and gives up — no email fallback (skipped per team decision).
using System.Net.Http.Json;
using System.Text.Json;
using InsureEdge.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace InsureEdge.Infrastructure.Services;

public class LenderDockClient : ILenderDockClient
{
    private const int MaxAttempts = 2;

    private readonly IHttpClientFactory _httpFactory;
    private readonly ILogger<LenderDockClient> _log;
    private readonly string _baseUrl;

    public LenderDockClient(IHttpClientFactory httpFactory, IConfiguration config, ILogger<LenderDockClient> log)
    {
        _httpFactory = httpFactory;
        _log = log;
        _baseUrl = (config["LENDERDOCK_BASE_URL"] ?? "https://resources-qa.lenderdock.com").TrimEnd('/');
    }

    public Task<(LenderDockResponse? Response, string RawJson, bool IsSuccess)> PostBillAsync(LenderDockRequest request)
        => PostWithRetryAsync("/v2/notice/bill", request);

    public Task<(LenderDockResponse? Response, string RawJson, bool IsSuccess)> PostCoverageAsync(LenderDockRequest request)
        => PostWithRetryAsync("/v2/notice/coverage", request);

    private async Task<(LenderDockResponse?, string, bool)> PostWithRetryAsync(string path, LenderDockRequest request)
    {
        var client = _httpFactory.CreateClient("lenderdock");
        string rawJson = "";
        LenderDockResponse? parsed = null;

        for (var attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            try
            {
                var response = await client.PostAsJsonAsync($"{_baseUrl}{path}", request);
                rawJson = await response.Content.ReadAsStringAsync();

                try
                {
                    parsed = JsonSerializer.Deserialize<LenderDockResponse>(rawJson,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                }
                catch (JsonException ex)
                {
                    _log.LogWarning(ex, "LenderDock {Path} returned unparseable body (attempt {Attempt})", path, attempt);
                }

                var isSuccess = response.IsSuccessStatusCode
                    && string.Equals(parsed?.Status, "success", StringComparison.OrdinalIgnoreCase);

                if (isSuccess)
                {
                    if (parsed?.Errors is { Count: > 0 })
                        _log.LogWarning("LenderDock {Path} succeeded but returned field errors: {Errors}",
                            path, string.Join("; ", parsed.Errors.Select(e => $"{e.Field}: {e.Message}")));
                    return (parsed, rawJson, true);
                }

                _log.LogWarning("LenderDock {Path} failed (attempt {Attempt}/{Max}, HTTP {StatusCode}): {Json}",
                    path, attempt, MaxAttempts, (int)response.StatusCode, rawJson);
            }
            catch (Exception ex)
            {
                _log.LogWarning(ex, "LenderDock {Path} threw on attempt {Attempt}/{Max}", path, attempt, MaxAttempts);
                rawJson = $"{{\"error\":\"{ex.Message}\"}}";
            }
        }

        _log.LogError("LenderDock {Path} failed after {Max} attempts, giving up: {Json}", path, MaxAttempts, rawJson);
        return (parsed, rawJson, false);
    }
}
