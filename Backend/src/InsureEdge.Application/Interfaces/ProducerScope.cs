// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
namespace InsureEdge.Application.Interfaces;

// Row-level scoping for a Producer's self-service login (see ICurrentTenantService).
// Null for staff — every register query behaves exactly as before when this is null.
public sealed record ProducerScope(long ProducerId, long IntermediaryId, bool FullVisibility)
{
    public static ProducerScope? FromTenant(ICurrentTenantService tenant) =>
        tenant.ProducerId.HasValue && tenant.IntermediaryId.HasValue
            ? new ProducerScope(tenant.ProducerId.Value, tenant.IntermediaryId.Value, tenant.IsFullProducerVisibility)
            : null;
}
