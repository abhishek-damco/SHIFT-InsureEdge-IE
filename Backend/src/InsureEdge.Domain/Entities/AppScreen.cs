// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// US-012: 51 rows across 8 modules forming the permission matrix.
namespace InsureEdge.Domain.Entities;

public class AppScreen
{
    public long Id { get; set; }
    public string? ScreenCode { get; set; }
    public string ScreenName { get; set; } = string.Empty;
    public long ModuleId { get; set; }
    public int? DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public bool IsVisible { get; set; } = true; // QA UM-07–10: false = kept for API checks, hidden from Rights screens
    public Module? Module { get; set; }
}
