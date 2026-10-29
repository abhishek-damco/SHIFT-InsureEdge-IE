// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Basic Auth for the inbound LenderDock endpoints, replacing OutSystems' OnAuthentication
// callback (which validated against a platform User_Login). Credentials are a new
// username/password pair defined in .env, not the OutSystems account's original login —
// LenderDock will be given these when their base URL is repointed to us.
using System.Net.Http.Headers;
using System.Text;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;

namespace InsureEdge.API.Filters;

public class LenderDockBasicAuthFilter : IActionFilter
{
    private readonly IConfiguration _config;

    public LenderDockBasicAuthFilter(IConfiguration config)
    {
        _config = config;
    }

    public void OnActionExecuting(ActionExecutingContext context)
    {
        var expectedUsername = _config["LENDERDOCK_INBOUND_USERNAME"];
        var expectedPassword = _config["LENDERDOCK_INBOUND_PASSWORD"];

        if (string.IsNullOrEmpty(expectedUsername) || string.IsNullOrEmpty(expectedPassword))
        {
            context.Result = new Microsoft.AspNetCore.Mvc.ObjectResult("LenderDock inbound auth not configured.")
            { StatusCode = 500 };
            return;
        }

        var header = context.HttpContext.Request.Headers.Authorization.ToString();
        if (string.IsNullOrEmpty(header) || !AuthenticationHeaderValue.TryParse(header, out var authHeader)
            || !string.Equals(authHeader.Scheme, "Basic", StringComparison.OrdinalIgnoreCase)
            || string.IsNullOrEmpty(authHeader.Parameter))
        {
            Unauthorized(context);
            return;
        }

        string decoded;
        try
        {
            decoded = Encoding.UTF8.GetString(Convert.FromBase64String(authHeader.Parameter));
        }
        catch (FormatException)
        {
            Unauthorized(context);
            return;
        }

        var parts = decoded.Split(':', 2);
        if (parts.Length != 2 || parts[0] != expectedUsername || parts[1] != expectedPassword)
        {
            Unauthorized(context);
        }
    }

    public void OnActionExecuted(ActionExecutedContext context) { }

    private static void Unauthorized(ActionExecutingContext context)
    {
        context.HttpContext.Response.Headers.WWWAuthenticate = "Basic realm=\"lenderdock\"";
        context.Result = new Microsoft.AspNetCore.Mvc.UnauthorizedResult();
    }
}
