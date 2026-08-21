using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using InsureEdge.Application.Interfaces;

namespace InsureEdge.API.Filters;

/// <summary>
/// Restricts endpoint access to Producer users only.
/// Returns 403 Forbidden for non-Producer (Client) users.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class ProducerOnlyAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var tenantService = context.HttpContext.RequestServices.GetService<ICurrentTenantService>();
        if (tenantService == null)
        {
            context.Result = new StatusCodeResult(500);
            return;
        }

        try
        {
            // Check if current user has a ProducerId (Producer user)
            // Client users will not have ProducerId set
            var producerId = tenantService.ProducerId;
            if (producerId == null)
            {
                context.Result = new ForbidResult();
            }
        }
        catch
        {
            context.Result = new StatusCodeResult(401);
        }
    }
}
