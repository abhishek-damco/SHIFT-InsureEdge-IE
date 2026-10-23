// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
namespace InsureEdge.Domain.Entities;

public class ClientCompany
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public string CompanyCode { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public string? DomicileCountry { get; set; }
    public string? StateOfDomicile { get; set; }
    public string? NaicCode { get; set; }
    public string? EmailId { get; set; }
    public string? TelephoneNumber { get; set; }
    public string? TelephoneNumberCc { get; set; }
    public int? Extension { get; set; }
    public string? FederalTaxId { get; set; }
    public string? Url { get; set; }
    public string? BusinessDescription { get; set; }
    public string? LogoFileName { get; set; }
    public string? LogoContentType { get; set; }
    public byte[]? LogoData { get; set; }
    public long? CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; } = DateTimeOffset.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedOn { get; set; }

    // Navigation
    public ICollection<CompanyAddress> Addresses { get; set; } = [];
    public ICollection<CompanyContact> Contacts { get; set; } = [];
    public ICollection<CompanyProductAccess> ProductAccess { get; set; } = [];
}
