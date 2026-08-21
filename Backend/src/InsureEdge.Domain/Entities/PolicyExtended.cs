// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Extended per-policy detail: endorsement/cancellation/rewrite/renewal metadata (1:1 with policy).
namespace InsureEdge.Domain.Entities;

public class PolicyExtended
{
    public long PolicyId { get; set; } // PK, FK -> policy(id)
    public long ClientId { get; set; }
    public string? PrimaryInsuredType { get; set; }
    public string? InternalReason { get; set; }
    public string? ExplainationOfLetter { get; set; }
    public DateOnly? CancellationEffectiveDate { get; set; }
    public string? ProrationBasis { get; set; }
    public string? RequestedBy { get; set; }
    public string? ReasonOfCancellation { get; set; }
    public string? OtherReason { get; set; }
    public bool? AdjustCommissions { get; set; }
    public string? Comments { get; set; }
    public long? PriorPolicyId { get; set; }
    public DateOnly? RenewalOfferDate { get; set; }
    public string? DeclinedReason { get; set; }
    public string? DeclinedReasonDescription { get; set; }
    public DateOnly? EndorsementEffectiveDate { get; set; }
    public DateOnly? RewriteEffectiveDate { get; set; }
    public string? ReasonForRewritingPolicy { get; set; }
    public string? RewriteOtherReason { get; set; }
    public bool? IsPremiumBearingEndorsement { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public Policy? Policy { get; set; }
    public Policy? PriorPolicy { get; set; }
}
