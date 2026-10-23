// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// DisburseCloud API integration (sandbox): authenticates via Basic auth against
// /api/v1/companies/authenticate to obtain a bearer token, then calls
// /api/v1/disbursements/create with that token. Endpoints/credentials per team-provided
// spec; NOT smoke-tested against the live sandbox (no password available at write time —
// DISBURSECLOUD_PASSWORD is blank in .env, fill in before first real run).
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using InsureEdge.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace InsureEdge.Infrastructure.Services;

public class DisburseCloudClient : IDisburseCloudClient
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly ILogger<DisburseCloudClient> _log;
    private readonly string _baseUrl;
    private readonly string _username;
    private readonly string _password;

    public DisburseCloudClient(IHttpClientFactory httpFactory, IConfiguration config, ILogger<DisburseCloudClient> log)
    {
        _httpFactory = httpFactory;
        _log = log;
        _baseUrl = (config["DISBURSECLOUD_BASE_URL"] ?? "https://sandbox.services.disbursecloud.com").TrimEnd('/');
        _username = config["DISBURSECLOUD_USERNAME"] ?? "";
        _password = config["DISBURSECLOUD_PASSWORD"] ?? "";
    }

    private async Task<string?> AuthenticateAsync(HttpClient client)
    {
        var basic = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_username}:{_password}"));
        using var req = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/api/v1/companies/authenticate");
        req.Headers.Authorization = new AuthenticationHeaderValue("Basic", basic);

        var response = await client.SendAsync(req);
        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            _log.LogWarning("DisburseCloud authenticate failed ({Status}): {Body}", response.StatusCode, body);
            return null;
        }

        try
        {
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;
            // Token field name unconfirmed against the live API — accept common shapes.
            if (root.TryGetProperty("token", out var t) && t.ValueKind == JsonValueKind.String) return t.GetString();
            if (root.TryGetProperty("access_token", out var at) && at.ValueKind == JsonValueKind.String) return at.GetString();
        }
        catch (JsonException ex)
        {
            _log.LogWarning(ex, "DisburseCloud authenticate returned non-JSON body");
        }
        return null;
    }

    public async Task<(CreateDisbursementResponse? Response, string RawJson, bool IsError)> CreateDisbursementAsync(CreateDisbursementRequest request)
    {
        var client = _httpFactory.CreateClient("disbursecloud");
        var token = await AuthenticateAsync(client);
        if (string.IsNullOrEmpty(token))
            return (null, "{\"error\":\"authentication failed\"}", true);

        using var req = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/api/v1/disbursements/create")
        {
            Content = JsonContent.Create(request),
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.SendAsync(req);
        var rawJson = await response.Content.ReadAsStringAsync();

        CreateDisbursementResponse? parsed = null;
        try
        {
            parsed = JsonSerializer.Deserialize<CreateDisbursementResponse>(rawJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (JsonException ex)
        {
            _log.LogWarning(ex, "DisburseCloud CreateDisbursement returned unparseable body");
        }

        // Matches the OutSystems IsError rule exactly: only an empty Id AND a missing/empty
        // Created_at counts as a failure — a partial response is treated as success.
        var isError = (parsed?.Id is null or 0) && string.IsNullOrEmpty(parsed?.Created_at);
        if (isError)
            _log.LogWarning("DisburseCloud API Response failed: {Json}", rawJson);

        return (parsed, rawJson, isError);
    }
}
