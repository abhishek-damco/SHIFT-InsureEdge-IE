// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
namespace InsureEdge.Domain.Entities;

public class ClientOffice
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public string OfficeName { get; set; } = string.Empty;
    public string? OfficeType { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? Country { get; set; }
    public string? State { get; set; }
    public string? City { get; set; }
    public string? County { get; set; }
    public string? ZipCode { get; set; }
    public string? Latitude { get; set; }
    public string? Longitude { get; set; }
    public string? ContactName { get; set; }
    public string? ContactSuffix { get; set; }
    public string? ContactTitle { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactPhoneCc { get; set; }
    public int? ContactExt { get; set; }
    public string? ContactAltPhone { get; set; }
    public string? ContactAltPhoneCc { get; set; }
    public long? CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; } = DateTimeOffset.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedOn { get; set; }
}
