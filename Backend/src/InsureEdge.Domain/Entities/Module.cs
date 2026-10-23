// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// US-012: 8 modules grouping the 51 permission rows in the accordion UI.
namespace InsureEdge.Domain.Entities;

public class Module
{
    public long Id { get; set; }
    public string ModuleName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsSubmodule { get; set; }
    public long? ParentModuleId { get; set; }
    public int? DisplayOrder { get; set; }
    public ICollection<AppScreen> Screens { get; set; } = new List<AppScreen>();
}
