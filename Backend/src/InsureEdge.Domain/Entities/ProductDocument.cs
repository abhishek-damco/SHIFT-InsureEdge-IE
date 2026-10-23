// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Document Generation PRD §9.2: per-tenant Plumsail template mapping —
// (ClientId, Name) selects the Plumsail process/user used to generate a document.
namespace InsureEdge.Domain.Entities;

public class ProductDocument
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? PlumsailProcessId { get; set; }
    public string? PlumsailUserId { get; set; }
    public string? ClientMappingId { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
}
