// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
namespace InsureEdge.Domain.Entities;

// Secondary contacts of an office; the office's primary contact lives on ClientOffice.
public class ClientOfficeContact
{
    public long Id { get; set; }
    public long OfficeId { get; set; }
    public int SortOrder { get; set; }
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
