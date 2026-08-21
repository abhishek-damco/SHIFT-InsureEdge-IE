// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Additional (non-primary) insured individual on a policy.
namespace InsureEdge.Domain.Entities;

public class AdditionalInsured
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long PolicyId { get; set; }
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Relationship { get; set; }
    public string? TelephoneNumber { get; set; }
    public string? TelephoneNumberCC { get; set; }
    public string? AltTelephoneNumber { get; set; }
    public string? AltTelephoneNumberCC { get; set; }
    public string? Email { get; set; }
    public string? Gender { get; set; }
    public bool? IsManual { get; set; }
    public string? InsuredType { get; set; }
    public string? Suffix { get; set; }
    public string? Dba { get; set; }
    public int? RecordNumber { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public Policy? Policy { get; set; }
}
