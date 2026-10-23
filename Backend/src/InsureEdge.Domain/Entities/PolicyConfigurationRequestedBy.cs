// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Static "Requested By" lookup for Cancel Policy — ported from the OutSystems
// PolicyConfigurationsRequestedBy static entity.
namespace InsureEdge.Domain.Entities;

public class PolicyConfigurationRequestedBy
{
    public string Code { get; set; } = string.Empty; // PK
    public string Label { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public string TypeOfCompany { get; set; } = string.Empty; // INSURANCECARRIER | MGA | BOTH
}
