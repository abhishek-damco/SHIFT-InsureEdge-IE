// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Originally a stub policy entity anchoring FNOL claims; extended (db/010, db/011) with
// underwriting/quotes-policies columns ported from the Node prototype's "policy" table.
// NOTE: "Status" (claims-era) and "PolicyStatus" (underwriting lifecycle: Draft/Submitted/
// Bound/Active/Cancelled/...) are two distinct columns — do not conflate them.
namespace InsureEdge.Domain.Entities;

public class Policy
{
    public long Id { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public string? InsuredName { get; set; }
    public string? Address { get; set; }
    public DateOnly? EffectiveDate { get; set; }
    public string? Lob { get; set; }
    public string? SubProduct { get; set; }
    public string Status { get; set; } = "Active";
    public long ClientId { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    // ── Underwriting (db/010, db/011) ──────────────────────────────────────
    public string? QuoteNumber { get; set; }
    public long? IntermediaryId { get; set; }
    public long? ProducerId { get; set; }
    public long? AccountId { get; set; }
    public string? PolicyStage { get; set; }
    public string? PolicyTerm { get; set; }
    public string? ApprovalStatus { get; set; }
    public bool LockSubmission { get; set; }
    public decimal? LastStep { get; set; }
    public bool? DoNotRenew { get; set; }
    public DateTime? PolicyIssuedOn { get; set; }
    public DateOnly? LockedSubmissionDate { get; set; }
    public string? WritingCompany { get; set; }
    public string? InsuranceType { get; set; }
    public string? Country { get; set; }
    public string? StateProvince { get; set; }
    public bool? IsSinglePolicy { get; set; }
    public bool? IsQuickQuote { get; set; }
    public DateOnly? QuoteCreationDate { get; set; }
    public string? PolicyType { get; set; }
    public string? PolicyStatus { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public string? IntermediaryType { get; set; }

    public Client? Client { get; set; }
    public ICollection<Claim> Claims { get; set; } = new List<Claim>();
    public Insured? Insured { get; set; }
    public RiskLocation? RiskLocation { get; set; }

    // ── Underwriting navigation ─────────────────────────────────────────────
    public Intermediary? Intermediary { get; set; }
    public Producer? Producer { get; set; }
    public Account? Account { get; set; }
    public PolicyExtended? Extended { get; set; }
    public ICollection<PolicyProduct> Products { get; set; } = new List<PolicyProduct>();
    public ICollection<PolicyLimitCoverage> LimitCoverages { get; set; } = new List<PolicyLimitCoverage>();
    public PolicyPremium? Premium { get; set; }
    public ICollection<PolicyCommission> Commissions { get; set; } = new List<PolicyCommission>();
    public ICollection<PolicyMortgage> Mortgages { get; set; } = new List<PolicyMortgage>();
    public ICollection<PolicyDocument> Documents { get; set; } = new List<PolicyDocument>();
    public ICollection<RiskAddress> RiskAddresses { get; set; } = new List<RiskAddress>();
    public ICollection<PolicyRiskInformation> RiskInformation { get; set; } = new List<PolicyRiskInformation>();
    public ICollection<AdditionalInsured> AdditionalInsureds { get; set; } = new List<AdditionalInsured>();
    public ICollection<AdditionalOrganisation> AdditionalOrganisations { get; set; } = new List<AdditionalOrganisation>();
    public ICollection<PolicyAccount> PolicyAccounts { get; set; } = new List<PolicyAccount>();
    public ICollection<CancellationPaymentTransaction> CancellationTransactions { get; set; } = new List<CancellationPaymentTransaction>();
}
