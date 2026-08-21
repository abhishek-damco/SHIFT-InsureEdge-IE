// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// ADR-003/ADR-004: Request-time resolution. No cache. Removing a GroupUser row
// immediately eliminates that user's permissions on the next request.
namespace InsureEdge.Application.Interfaces;

public record EffectivePermissions(
    bool View, bool Add, bool Edit, bool Duplicate,
    bool Upload, bool Download, bool SensitiveData,
    bool SensitiveDocuments, bool ApproveReject);

public interface IPermissionResolver
{
    Task<EffectivePermissions> ResolveAsync(long userId, long clientId, string screenCode);
}
