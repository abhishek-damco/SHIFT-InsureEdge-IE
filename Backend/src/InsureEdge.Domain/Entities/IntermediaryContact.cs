using System.ComponentModel.DataAnnotations.Schema;
// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Distribution: intermediary contact (ported from OutSystems "IntermediaryContact" entity).
// Used by the DisburseCloud commission-disbursement job (primary contact) and by broker
// import to default CommissionDisburseEmail to the primary contact's email.
namespace InsureEdge.Domain.Entities;

public class IntermediaryContact
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long IntermediaryId { get; set; }
    public string? Name { get; set; }
    public string? Title { get; set; }
[NotMapped]
    public string? TelephoneNumberCC { get; set; }
    public string? TelephoneNumber { get; set; }
[NotMapped]
    public string? AltTelephoneNumberCC { get; set; }
[NotMapped]
    public string? AltTelephoneNumber { get; set; }
    public string? AltTelephoneNo { get; set; }
[NotMapped]
    public string? Email { get; set; }
    public string? EmailId { get; set; }
    public bool IsPrimary { get; set; }
    public string? Extension { get; set; }
[NotMapped]
    public string? Suffix { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public Intermediary? Intermediary { get; set; }
}
