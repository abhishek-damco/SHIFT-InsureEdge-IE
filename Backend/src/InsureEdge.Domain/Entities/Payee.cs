namespace InsureEdge.Domain.Entities;

public class Payee
{
    public long Id { get; set; }
    public long? ClaimId { get; set; }
    public long ClientId { get; set; }

    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? BusinessName { get; set; }
    public string? Relationship { get; set; }
    public string? TelephoneNumberCC { get; set; }
    public string? TelephoneNumber { get; set; }
    public string? Email { get; set; }
    public string? NationalId { get; set; }
    public string? SocialSecurityNumber { get; set; }
    public string? TinId { get; set; }
    public string? PayeeType { get; set; }
    public string? ClaimPayeeType { get; set; }
    public string? PayeeCode { get; set; }

    // Compliance / checks
    public string? OFACChecks { get; set; }
    public string? BankDetailsValidation { get; set; }
    public string? DuplicatePayeeCheck { get; set; }
    public string? FraudCheck { get; set; }
    public string? CertificationVerification { get; set; }

    public string Status { get; set; } = "Draft";
    public string? Comments { get; set; }

    public long? ApprovedBy { get; set; }
    public DateTimeOffset? ApprovedOn { get; set; }
    public long? CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; } = DateTimeOffset.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedOn { get; set; }

    // Navigation
    public Claim? Claim { get; set; }
    public ICollection<BankDetail>    BankDetails { get; set; } = [];
    public ICollection<CommonAddress> Addresses   { get; set; } = [];
}
