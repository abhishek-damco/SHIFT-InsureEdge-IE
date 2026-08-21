// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// ADR-003 / DBT-SEC-002 Corrective: ALL 9 permission types enforced server-side via this attribute.
// PermissionAttribute is applied to every protected action method.
// Authorization failure returns 403 Forbidden — never 200 with hidden UI.
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace InsureEdge.API.Filters;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public class PermissionAttribute : Attribute, IAsyncActionFilter
{
    private readonly string _screenCode;
    private readonly PermissionType _permission;

    public PermissionAttribute(string screenCode, PermissionType permission)
    {
        _screenCode = screenCode;
        _permission = permission;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var resolver = context.HttpContext.RequestServices.GetRequiredService<IPermissionResolver>();
        var tenant = context.HttpContext.RequestServices.GetRequiredService<ICurrentTenantService>();

        long userId;
        long clientId;
        try
        {
            userId = tenant.UserId;
            clientId = tenant.ClientId;
        }
        catch (UnauthorizedAccessException)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var perms = await resolver.ResolveAsync(userId, clientId, _screenCode);

        var allowed = _permission switch
        {
            PermissionType.View               => perms.View,
            PermissionType.Add                => perms.Add,
            PermissionType.Edit               => perms.Edit,
            PermissionType.Clone              => perms.Duplicate,
            PermissionType.Upload             => perms.Upload,
            PermissionType.Download           => perms.Download,
            PermissionType.SensitiveData      => perms.SensitiveData,
            PermissionType.SensitiveDocuments => perms.SensitiveDocuments,
            PermissionType.ApproveReject      => perms.ApproveReject,
            _ => false
        };

        if (!allowed)
        {
            context.Result = new ForbidResult();
            return;
        }

        await next();
    }
}
