// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// HO rater coverage/limits detail (wide table, kept flat per source). One row per policy.
// The "_ex" columns were reinstated (db/044) after confirming — via the LenderDock
// integration's WDEDUCTIBLE formula (If(PhysicalDamageDeductible = 0, ..._EX, ...)) — that
// they are NOT simple hardcoded UI defaults (the earlier db/010 assumption): they're the
// original rating-engine/Excel-computed value, captured once and preserved even after the
// user edits the plain (canonical) field on the "Plans Overview" step. See
// SubmissionRepository's coverage-save block for the "capture once, on creation only" logic.
namespace InsureEdge.Domain.Entities;

public class PolicyLimitCoverage
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long PolicyId { get; set; }
    public decimal? DwellingAssetLimit { get; set; }
    public decimal? AppurtenantStructureAsset { get; set; }
    public decimal? PersonalBelongingsAsset { get; set; }
    public decimal? DwellingOccupancy { get; set; }
    public decimal? CalculatedPremium { get; set; }
    public decimal? Tiv { get; set; }
    public decimal? PhysicalDamageDeductible { get; set; }
    public decimal? PhysicalDamageDeductibleEx { get; set; }
    public string? CoverageLevel { get; set; }
    public string? CoverageLevelEx { get; set; }
    public string? LiabilityCoverage { get; set; }
    public string? LiabilityCoverageEx { get; set; }
    public string? ExcessBlanketPl { get; set; }
    public string? ExcessBlanketPlEx { get; set; }
    public string? CoveredLiabilitySir { get; set; }
    public string? CoveredLiabilitySirEx { get; set; }
    public string? SinkholeCatastrophicGroundCollapse { get; set; }
    public string? SinkholeCatastrophicGroundCollapseEx { get; set; }
    public string? Earthquake { get; set; }
    public string? EarthquakeEx { get; set; }
    public string? Flood { get; set; }
    public string? FloodEx { get; set; }
    public string? WindHail { get; set; }
    public string? WindHailEx { get; set; }
    public string? WildFire { get; set; }
    public string? WildFireEx { get; set; }
    public string? ResidentWorkerNfm { get; set; }
    public string? ResidentWorkerNfmEx { get; set; }
    public string? SmallScaleFarmingEndorsement { get; set; }
    public string? SmallScaleFarmingEndorsementEx { get; set; }
    public string? LandlordEndorsement { get; set; }
    public string? LandlordEndorsementEx { get; set; }
    public string? HomeOfficeEndorsement { get; set; }
    public string? HomeOfficeEndorsementEx { get; set; }
    public decimal? PriorPolicyPeriodPremium { get; set; }
    public decimal? PriorPolicyPeriodPremiumEx { get; set; }
    public decimal? RateModification { get; set; }
    public decimal? RateModificationEx { get; set; }
    public decimal? ExcessBlanketPlValue { get; set; }
    public decimal? ExcessBlanketPlValueEx { get; set; }
    public decimal? SinkholeCatastrophicGroundCollapseValue { get; set; }
    public decimal? SinkholeCatastrophicGroundCollapseValueEx { get; set; }
    public decimal? EarthquakeValue { get; set; }
    public decimal? EarthquakeValueEx { get; set; }
    public decimal? FloodValue { get; set; }
    public decimal? FloodValueEx { get; set; }
    public decimal? WindHailValue { get; set; }
    public decimal? WindHailValueEx { get; set; }
    public decimal? WildFireValue { get; set; }
    public decimal? WildFireValueEx { get; set; }
    public decimal? ResidentWorkerNfmValue { get; set; }
    public decimal? ResidentWorkerNfmValueEx { get; set; }
    public decimal? SmallScaleFarmingEndorsementValue { get; set; }
    public decimal? SmallScaleFarmingEndorsementValueEx { get; set; }
    public decimal? LandlordEndorsementValue { get; set; }
    public decimal? LandlordEndorsementValueEx { get; set; }
    public decimal? HomeOfficeEndorsementValue { get; set; }
    public decimal? HomeOfficeEndorsementValueEx { get; set; }
    public decimal? BasePremium { get; set; }
    public decimal? BasePremiumEx { get; set; }
    public decimal? TotalPremiumWithFee { get; set; }
    public decimal? TotalPremiumWithoutRateModification { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public Policy? Policy { get; set; }
}
