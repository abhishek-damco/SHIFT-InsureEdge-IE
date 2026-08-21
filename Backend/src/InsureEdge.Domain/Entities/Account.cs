// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Policyholder / prospect account (individual or business). Ported from prototype "account".
namespace InsureEdge.Domain.Entities;

public class Account
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public string? AccountCode { get; set; }
    public string? Status { get; set; }
    public string? AccountType { get; set; } // "Individual" | "Business"
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? ProducerType { get; set; }
    public long? IntermediaryId { get; set; }
    public long? ProducerId { get; set; }
    public string? LegalBusinessName { get; set; }
    public string? DoingBusinessAs { get; set; }
    public string? LegalEntityType { get; set; }
    public DateOnly? DateBusinessStarted { get; set; }
    public string? IndustryType { get; set; }
    public bool? IsDraft { get; set; }
    public string? Suffix { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public Intermediary? Intermediary { get; set; }
    public Producer? Producer { get; set; }
    public ICollection<Policy> Policies { get; set; } = new List<Policy>();
    public ICollection<PolicyAccount> PolicyAccounts { get; set; } = new List<PolicyAccount>();
}
