// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// HBIS rating engine DTOs — plan comparison (POST /api/hbis/plan-comparison) and
// state tax lookup (GET /api/hb-tax-details). Faithful port of server.js hbisPlanComparison()
// and the /api/hb-tax-details handler (mirrors IERatingEngine.HBPolicyTaxDetails).
namespace InsureEdge.Application.DTOs.QuotesPolicies;

// ─── Plan comparison request (raw wizard form fields consumed by the rater) ─────

public record HbisPlanComparisonForm(
    string? ScreenCode,
    string? PolicyType,
    string? Deductible,
    string? CoverageLevel,
    string? SelectedPlan,
    string? LiabilityAmount,
    string? ExcessBlanketLiabilities,
    string? Sinkhole,
    string? Earthquake,
    string? Flood,
    string? WindHail,
    string? Wildfire,
    string? ResWorkerMedical,
    string? FarmingEndorsement,
    string? LandlordEndorsement,
    string? HomeOfficeEndorsement,
    string? PolicyFee,
    string? PriorPolicyPremium,
    string? RateModification,
    string? DwellingLimit,
    string? AppurtenantLimit,
    string? PersonalAssetsLimit,
    string? OccupancyDisruptionLimit,
    string? TotalInsuredValues,
    bool? IsHBProducer,
    bool? LockSubmission,
    bool? IsQuickQuote,
    // Geo/building fields consumed by the real IERatingEngine Rater
    // (HBISPlanComparisonChart → Get{Basic|Standard|Preferred}RaterAPI mapping).
    // The wizard already posts these; when HexZoneLR is present the plan comparison
    // is computed by the Rater instead of the legacy static tables.
    string? HexZoneHR = null,
    string? HexZoneLR = null,
    string? BuildingFloodElevation = null,
    string? BuildingType = null,
    string? BuildingDescription = null,
    string? FloodZone = null,
    string? Latitude = null,
    string? Longitude = null
);

public record HbisRatingInputsDto(
    decimal DwellingAssetLimit,
    decimal AppurtenantStructureAssetsLimit,
    decimal PersonalAssetsOtherThanFixedAssetsLimit,
    decimal DwellingOccupancyDisruptionLimit,
    decimal TotalInsuredValues,
    string PhysicalDamageDeductible,
    string CoverageLevel,
    string AmountOfLiabilityCoverage,
    string ExcessScheduledBlanketCoveredPersonalLiabilities,
    string SinkholeAndCatastrophicGroundCollapse,
    string Earhquake,
    string Flood,
    string WindHail,
    string Wildfire,
    string ResidentialWorkerNoFault,
    string SmallScaleFarmingEndorsement,
    string LandloardEndorsement,
    string HomeOfficeEndorsement,
    decimal PriorPolicyPeriodPremium,
    decimal RateModification,
    decimal PolicyFeesNew,
    bool IsHBISProducer,
    bool IsLockSubmission,
    bool IsQuickQuote
);

public record HbisRatingOutputDto(
    decimal BasePremium,
    decimal WildfirePremium,
    decimal WindPremium,
    decimal SinkholePremium,
    decimal ExcessScheduleBlanketCoveredPL,
    decimal EarthquakePremium,
    decimal FloodPremium,
    decimal ResidentWorkerNFPremium,
    decimal SmallScaleFarmingEndorsementPremium,
    decimal LandEndorsementPremium,
    decimal HomeOfficeEndorsementPremium,
    decimal PolicyFee,
    decimal SubtotalPremium,
    decimal TotalPremiumWithoutTaxes,
    decimal TotalPremiumWithFee
);

public record HbisPlanDto(
    string Id,
    string Name,
    decimal BasePremium,
    decimal Wildfire,
    decimal WindHail,
    decimal Sinkhole,
    decimal ExcessLiability,
    decimal Earthquake,
    decimal Flood,
    decimal ResWorker,
    decimal Farming,
    decimal Landlord,
    decimal HomeOffice,
    decimal PolicyFee,
    decimal Total,
    HbisRatingInputsDto RaterInputs,
    HbisRatingOutputDto RatingOutput
);

public record HbisPlanComparisonResultDto(
    string Source,
    string SelectedPlan,
    string CoverageLevel,
    decimal TotalInsuredValues,
    List<string> ValidationMessages,
    bool DataFetchCompleted,
    List<HbisPlanDto> Plans
);

// ─── State tax lookup (GET /api/hb-tax-details) ──────────────────────────────

public record HbTaxRowDto(string Tax, decimal Percentage, decimal PremiumBase, decimal InstallmentTax);

public record HbTaxDetailsDto(
    string State,
    List<HbTaxRowDto> TaxRows,
    decimal TotalTax,
    decimal StampingFee,
    bool FlatStamp,
    decimal SurplusLinesTax,
    decimal FirePremiumTax
);
