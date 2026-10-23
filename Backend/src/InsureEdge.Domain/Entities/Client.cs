// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Tenant entity — all data is scoped to a ClientId (ADR-010).
namespace InsureEdge.Domain.Entities;

public class Client
{
    public long Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedOn { get; set; }

    // Extended profile
    public string? ClientCode { get; set; }
    public string Status { get; set; } = "Active";
    public DateOnly? ClientOnboardingDate { get; set; }
    public string? TypeOfCompany { get; set; }
    public string? NaicCode { get; set; }
    public string? RegisteredTradeMark { get; set; }
    public DateOnly? ClientRegistrationDate { get; set; }
    public string? DomicileCountry { get; set; }
    public string? StateOfDomicile { get; set; }
    public string? StateAllowedToOperate { get; set; }
    public string? FederalTaxId { get; set; }
    public string? OwnedBy { get; set; }
    public string? NumberOfEmployees { get; set; }
    public string? EstDirectWrittenPremium { get; set; }
    public string? YearBusinessStarted { get; set; }
    public string? BusinessDescription { get; set; }
    public string? EmailId { get; set; }
    public string? TelephoneNumber { get; set; }
    public string? TelephoneNumberCc { get; set; }
    public int? Extension { get; set; }
    public string? ClientUrl { get; set; }
    public string? LogoFileName { get; set; }
    public string? LogoContentType { get; set; }
    public byte[]? LogoData { get; set; }
    public long? CreatedBy { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedOn { get; set; }

    // Navigation
    public ICollection<ClientAddress> Addresses { get; set; } = [];
    public ICollection<ClientContact> Contacts { get; set; } = [];
    public ICollection<ClientOffice> Offices { get; set; } = [];
    public ICollection<ClientCompany> Companies { get; set; } = [];
}
