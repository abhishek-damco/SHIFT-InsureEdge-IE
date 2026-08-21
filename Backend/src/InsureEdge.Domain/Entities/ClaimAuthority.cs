namespace InsureEdge.Domain.Entities;

public class ClaimAuthority
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long UserId { get; set; }
    public string ApprovedLob { get; set; } = string.Empty;
    public string Currency { get; set; } = "USD";
    public decimal ReserveApprovalLimit { get; set; }
    public decimal PaymentApprovalLimit { get; set; }
    public decimal FeePaymentLimit { get; set; }
    public decimal ExGratiaPaymentLimit { get; set; }
    public string? JurisdictionLocation { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    // Extended detail fields
    public string? InsuranceType { get; set; }
    public string? PaymentMethodRestrictions { get; set; }
    public DateOnly? DateOfAuthorityAssignment { get; set; }
    public bool CanDenyWorksheet { get; set; }
    public string? Designation { get; set; }
    public string? JurisdictionCountry { get; set; }
    public string? JurisdictionStates { get; set; }
    public long? CreatedBy { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
    public long? ApprovedBy { get; set; }
    public DateTime? ApprovedOn { get; set; }

    public User? User { get; set; }
}
