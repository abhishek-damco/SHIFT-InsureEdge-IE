namespace InsureEdge.Domain.Entities;

public class ClaimLetter
{
    public long Id { get; set; }
    public long ClaimId { get; set; }
    public long ClientId { get; set; }
    public string LetterCode { get; set; } = string.Empty;   // e.g. "LTR-0001"
    public string? LetterType { get; set; }
    public DateTimeOffset? LetterDate { get; set; }
    public DateTimeOffset? SendDate { get; set; }
    public string? Subject { get; set; }
    public string? LetterBody { get; set; }
    public string? RecipientRole { get; set; }
    public string? RecipientName { get; set; }
    public string? DeliveryMethod { get; set; }
    public string? RecipientEmail { get; set; }
    public string? RecipientAddress { get; set; }
    public string? Priority { get; set; }
    public bool FollowUp { get; set; }
    public string Status { get; set; } = "Draft";            // Draft | Sent
    public long? CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; } = DateTimeOffset.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedOn { get; set; }

    public User? CreatedByUser { get; set; }
    public User? UpdatedByUser { get; set; }
}
