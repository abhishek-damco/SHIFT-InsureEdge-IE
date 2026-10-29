// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// ADR-010: ClientId always from session — never from request parameters.
namespace InsureEdge.Application.Interfaces;

public interface ICurrentTenantService
{
    long ClientId { get; }
    long UserId { get; }

    // Producer self-service login scoping (see AuthController.Login, ProducerScope) —
    // null for staff sessions.
    long? ProducerId { get; }
    long? IntermediaryId { get; }
    bool IsFullProducerVisibility { get; }
}
