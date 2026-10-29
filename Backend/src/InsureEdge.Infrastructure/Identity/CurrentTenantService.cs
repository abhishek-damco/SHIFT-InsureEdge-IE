// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// ADR-010: ClientId and UserId always extracted from cookie session claims — never from request params.
using InsureEdge.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace InsureEdge.Infrastructure.Identity;

public class CurrentTenantService : ICurrentTenantService
{
    private readonly IHttpContextAccessor _http;

    public CurrentTenantService(IHttpContextAccessor http) => _http = http;

    public long ClientId
    {
        get
        {
            var val = _http.HttpContext?.User.FindFirst("client_id")?.Value;
            if (!long.TryParse(val, out var id))
                throw new UnauthorizedAccessException("Client context not established.");
            return id;
        }
    }

    public long UserId
    {
        get
        {
            var val = _http.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(val, out var id))
                throw new UnauthorizedAccessException("User context not established.");
            return id;
        }
    }

    // Producer self-service login scoping (see AuthController.Login, ProducerScope) —
    // absent/false for staff sessions, so every existing check behaves exactly as before.
    public long? ProducerId
    {
        get
        {
            var val = _http.HttpContext?.User.FindFirst("producer_id")?.Value;
            return long.TryParse(val, out var id) ? id : null;
        }
    }

    public long? IntermediaryId
    {
        get
        {
            var val = _http.HttpContext?.User.FindFirst("intermediary_id")?.Value;
            return long.TryParse(val, out var id) ? id : null;
        }
    }

    public bool IsFullProducerVisibility =>
        _http.HttpContext?.User.FindFirst("full_producer_visibility")?.Value == "true";
}
