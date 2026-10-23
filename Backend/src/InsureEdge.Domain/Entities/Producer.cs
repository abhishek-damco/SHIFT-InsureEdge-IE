// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Distribution: producer (individual agent under an intermediary). Ported from prototype "producer".
namespace InsureEdge.Domain.Entities;

public class Producer
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long IntermediaryId { get; set; }
    public string ProducerCode { get; set; } = "PC001";
    public string Status { get; set; } = "Active";
    public bool? StatusToggle { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string? PcLicenseRequirement { get; set; }
    public string? Country { get; set; }
    public string? ResidentialState { get; set; }
    public string? PlLicense { get; set; }
    public string? ClLicense { get; set; }
    public string? PlclCombinedLicense { get; set; }
    public string TelephoneNumberCC { get; set; } = "+1";
    public string TelephoneNumber { get; set; } = "0000000000";
    public string? AltTelephoneNumberCC { get; set; }
    public string? AltTelephoneNumber { get; set; }
    public string? Email { get; set; }
    public bool? IsManager { get; set; }
    public long? ManagerId { get; set; }
    public int? Extension { get; set; }
    public string? Suffix { get; set; }
    public string? Gender { get; set; }
    public string? PersonalBio { get; set; }
    public DateOnly? DateOfBirth { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public Intermediary? Intermediary { get; set; }
    public Producer? Manager { get; set; }
}
