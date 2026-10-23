namespace InsureEdge.Domain.Entities;

public class BankDetail
{
    public long Id { get; set; }
    public long PayeeId { get; set; }
    public long ClientId { get; set; }

    public string? BankName { get; set; }
    public string? AccountHolderName { get; set; }
    public string? AccountNumber { get; set; }
    public string? AccountType { get; set; }
    public string? AbaRoutingNumber { get; set; }
    public string? PaperChequesRoutingNo { get; set; }
    public string? BusinessName { get; set; }
    public string? FederalTaxClassification { get; set; }
    public string? LlcClassification { get; set; }
    public string? Description { get; set; }
    public string? Ssn { get; set; }
    public string? EmployerIdentificationNumber { get; set; }
    public string? Type1099 { get; set; }
    public bool W9FormOnFile { get; set; }
    public DateOnly? DateW9Received { get; set; }
    public string? Tin { get; set; }
    public string? W9FormIrs { get; set; }
    public string? ReportingPreference { get; set; }
    public string? DirectDepositAuthForm { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Auth { get; set; }
    public long? AdjusterId { get; set; }
    public decimal? RatePerHour { get; set; }

    public long? CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; } = DateTimeOffset.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedOn { get; set; }

    // Navigation
    public Payee Payee { get; set; } = null!;
}
