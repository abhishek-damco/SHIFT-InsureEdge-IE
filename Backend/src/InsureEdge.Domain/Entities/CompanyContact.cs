// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
namespace InsureEdge.Domain.Entities;

public class CompanyContact
{
    public long Id { get; set; }
    public long CompanyId { get; set; }
    public string ContactType { get; set; } = "Primary";
    public string? Name { get; set; }
    public string? Suffix { get; set; }
    public string? Title { get; set; }
    public string? EmailId { get; set; }
    public string? TelephoneNumber { get; set; }
    public string? TelephoneNumberCc { get; set; }
    public int? Extension { get; set; }
    public string? AltTelephoneNumber { get; set; }
    public string? AltTelephoneNumberCc { get; set; }
}
