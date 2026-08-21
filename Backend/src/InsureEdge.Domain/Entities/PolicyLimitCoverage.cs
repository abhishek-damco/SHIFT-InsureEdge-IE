// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// HO rater coverage/limits detail (wide table, kept flat per source). One row per policy.
// NOTE: several prototype "_ex" duplicate columns (e.g. covered_liability_sir_ex/
// covered_liability_sir, earhquake_ex/earhquake) were collapsed to a single canonical
// property during the db/010 migration — see that file's header notes.
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
    public string? CoverageLevel { get; set; }
    public string? LiabilityCoverage { get; set; }
    public string? ExcessBlanketPl { get; set; }
    public string? CoveredLiabilitySir { get; set; }
    public string? SinkholeCatastrophicGroundCollapse { get; set; }
    public string? Earthquake { get; set; }
    public string? Flood { get; set; }
    public string? WindHail { get; set; }
    public string? WildFire { get; set; }
    public string? ResidentWorkerNfm { get; set; }
    public string? SmallScaleFarmingEndorsement { get; set; }
    public string? LandlordEndorsement { get; set; }
    public string? HomeOfficeEndorsement { get; set; }
    public decimal? PriorPolicyPeriodPremium { get; set; }
    public decimal? RateModification { get; set; }
    public decimal? ExcessBlanketPlValue { get; set; }
    public decimal? SinkholeCatastrophicGroundCollapseValue { get; set; }
    public decimal? EarthquakeValue { get; set; }
    public decimal? FloodValue { get; set; }
    public decimal? WindHailValue { get; set; }
    public decimal? WildFireValue { get; set; }
    public decimal? ResidentWorkerNfmValue { get; set; }
    public decimal? SmallScaleFarmingEndorsementValue { get; set; }
    public decimal? LandlordEndorsementValue { get; set; }
    public decimal? HomeOfficeEndorsementValue { get; set; }
    public decimal? BasePremium { get; set; }
    public decimal? TotalPremiumWithFee { get; set; }
    public decimal? TotalPremiumWithoutRateModification { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public Policy? Policy { get; set; }
}
