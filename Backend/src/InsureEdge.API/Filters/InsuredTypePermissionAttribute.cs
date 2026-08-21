// Resolves the correct screen code for NB-Quotes / Endorsements / Renewals / Policies
// endpoints that are parameterised by {insuredType} in the route.
// Individual → screen code suffix INDIVIDUAL; Business → no suffix (legacy naming).
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace InsureEdge.API.Filters;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
public class InsuredTypePermissionAttribute : Attribute, IAsyncActionFilter
{
    private readonly string _individualScreenCode;
    private readonly string _businessScreenCode;
    private readonly PermissionType _permission;

    public InsuredTypePermissionAttribute(
        string individualScreenCode,
        string businessScreenCode,
        PermissionType permission)
    {
        _individualScreenCode = individualScreenCode;
        _businessScreenCode = businessScreenCode;
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

        var insuredType = context.RouteData.Values["insuredType"]?.ToString() ?? "";
        var screenCode = string.Equals(insuredType, "business", StringComparison.OrdinalIgnoreCase)
            ? _businessScreenCode
            : _individualScreenCode;

        var perms = await resolver.ResolveAsync(userId, clientId, screenCode);

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
