// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
namespace InsureEdge.Domain.Entities;

public class CompanyAddress
{
    public long Id { get; set; }
    public long CompanyId { get; set; }
    public string AddressType { get; set; } = "Legal";
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? Country { get; set; }
    public string? State { get; set; }
    public string? City { get; set; }
    public string? County { get; set; }
    public string? ZipCode { get; set; }
    public string? Latitude { get; set; }
    public string? Longitude { get; set; }
    public bool IsManual { get; set; }
}
