using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;

namespace InsureEdge.API.Filters;

/// <summary>
/// Producer logins may only use Dashboard, Quotes &amp; Policies and Claims (QA D1-25).
/// Registered globally; staff sessions (no <c>producer_id</c> claim) are never affected.
/// Hiding the menu isn't enough — this blocks direct URL / API access too.
/// </summary>
public sealed class ProducerModuleRestrictionFilter : IAuthorizationFilter
{
    // Controllers a producer can call with any HTTP method.
    private static readonly HashSet<string> FullAccess = new(StringComparer.OrdinalIgnoreCase)
    {
        // Session / account
        "Auth", "PasswordReset", "Onboarding",
        // Dashboard
        "Dashboard", "Tasks",
        // Quotes & Policies
        "Submissions", "NbQuotes", "Endorsements", "Renewals", "Policies", "Rating",
        "Documents", "BulkUpload", "Reference",
        // Claims (including its sub-screens)
        "Claims", "ClaimsDashboard", "ClaimQuery", "ClaimLetters", "Worksheet",
        "LetterTemplates", "Adjusters", "Payees", "Configurations",
    };

    // Controllers a producer can only read: New Submission's Brokerage Firm / Producer
    // drop-downs list intermediaries and producers from Distribution Management.
    private static readonly HashSet<string> ReadOnlyAccess = new(StringComparer.OrdinalIgnoreCase)
    {
        "Distribution", "DistributionDetails", "Intermediaries", "Producers",
    };

    public static bool IsAllowed(string controller, string httpMethod) =>
        FullAccess.Contains(controller) ||
        (ReadOnlyAccess.Contains(controller) && HttpMethods.IsGet(httpMethod));

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        if (context.HttpContext.User.FindFirst("producer_id") is null) return;
        if (context.ActionDescriptor is not ControllerActionDescriptor action) return;

        if (!IsAllowed(action.ControllerName, context.HttpContext.Request.Method))
            context.Result = new ObjectResult(new { error = "You do not have access to this module." })
            {
                StatusCode = StatusCodes.Status403Forbidden,
            };
    }
}
