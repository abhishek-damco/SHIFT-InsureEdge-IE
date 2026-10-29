// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Core claim entity.
// BR-CLM-001: status values — DRAFT | OPEN | CLOSED | DENIED | APPROVED | PENDING
// BR-CLM-007: reporter contact auto-populated from policy account when reported_by_insured (new claim).
// BR-CLM-009: AssignedTo (internal staff) vs AdjusterId (external) are two separate fields.
// BR-CLM-017: ClaimClosureDate only set by close operation — never by caller.
namespace InsureEdge.Domain.Entities;

public class Claim
{
    public long Id { get; set; }
    public string? ClaimNumber { get; set; }
    public long PolicyId { get; set; }
    public long? RiskLocationId { get; set; }
    public long ClientId { get; set; }
    public string Status { get; set; } = "DRAFT";
    public short LastStepNumber { get; set; } = 1;
    public bool IsClaimReportedByInsured { get; set; }

    // Reporter contact
    public string? ReporterFirstName { get; set; }
    public string? ReporterLastName { get; set; }
    public string? ReporterRelationship { get; set; }
    public string? ReporterTelephone { get; set; }
    public string? ReporterTelephoneCC { get; set; }
    public string? ReporterEmail { get; set; }

    // Loss details (Step 3)
    public DateOnly? DateOfLoss { get; set; }
    public TimeOnly? TimeOfLoss { get; set; }
    public string? ClaimInitiationChannel { get; set; }
    public string? ClaimType { get; set; }
    public string? MainCauseOfLoss { get; set; }
    public string? ConsequencesOfLoss { get; set; }
    public bool InspectionRequired { get; set; }
    public string? ClaimReimbursementType { get; set; }
    public string? CatastrophicEvent { get; set; }
    public string? LossDescription { get; set; }
    public string? ListOfDamageFirstParty { get; set; }
    public bool? PhysicalDamage { get; set; }
    public bool? ClaimOnlyThirdParty { get; set; }
    public bool IsThirdPartyDamage { get; set; }

    // Loss location
    public string? LossAddressLine1 { get; set; }
    public string? LossAddressLine2 { get; set; }
    public string? LossCountry { get; set; }
    public string? LossState { get; set; }
    public string? LossCity { get; set; }
    public string? LossCounty { get; set; }
    public string? LossZipCode { get; set; }
    public string? LossLatitude { get; set; }
    public string? LossLongitude { get; set; }

    // Step 4
    public string? ClaimEstimate { get; set; }
    public string? Comment { get; set; }
    public DateOnly? ClaimClosureDate { get; set; }

    // Assignment (BR-CLM-009)
    public long? AssignedTo { get; set; }
    public long? AdjusterId { get; set; }

    // Audit
    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    // Navigation
    public Policy? Policy { get; set; }
    public User? AssignedToUser { get; set; }
    public ICollection<ClaimImpactedCoverage> Coverages { get; set; } = new List<ClaimImpactedCoverage>();
    public ICollection<Claimant> Claimants { get; set; } = new List<Claimant>();
    public ICollection<ClaimDocument> Documents { get; set; } = new List<ClaimDocument>();
}
