// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// HBISPlanComparisonChart (HBIS module, captured 10-07-2026): the plans-overview chart
// runs the Rater three times — GetBasicRaterAPI / GetStandardRaterAPI /
// GetPreferredRaterAPI — one per coverage tier, each with:
//   Start → Rater(Inputs = LimitCoverage→RatingInputs mapping, CoverageLevel = tier,
//           ClaculateRateModification = False, ClaculateRecurringRPS = False)
//        → Assign LimitsAndCoveragesValue = RatingOutput→chart mapping → End
// Captured output mapping (corrected 2026-09-22 against "Rater Action — IERatingEngine
// Flow Analysis" doc): TotalPremiumAmount = BasicCoveragePremium; BasePremium =
// BasePremiumWithoutAdditionalCoverage (BasicCoveragePremium minus every visible Plans
// Overview line item — Wildfire/Wind/Sinkhole/Earthquake/Flood/ExcessLiability/
// endorsements/Liability/PolicyFee — floored at 0; NOT "OtherPerils + LiabilityPremium",
// which was an earlier miscapture and produced far too small a Base Premium); per-peril
// *Value fields from the matching RatingOutput premiums; RPSValue = WildfireRPS.
// Input mapping detail preserved: the original passes entity numerics through
// TextToInteger/TextToDecimal (unformatted); our wizard stores display-formatted
// strings ("5,000"), so values are digit-normalized before mapping.
using InsureEdge.Application.DTOs.QuotesPolicies;

namespace InsureEdge.Infrastructure.Rating;

public class HbisPlanComparisonChart
{
    private static readonly (string Id, string Name)[] Tiers =
    {
        ("Basic", "Basic Plan"),
        ("Standard", "Standard Plan"),
        ("Preferred", "Preferred Plan"),
    };

    private readonly Rater _rater;

    public HbisPlanComparisonChart(Rater rater) => _rater = rater;

    private static string Digits(string? v) => new((v ?? "").Where(char.IsDigit).ToArray());
    private static decimal Num(string? v) =>
        decimal.TryParse(new string((v ?? "").Where(c => char.IsDigit(c) || c == '.' || c == '-').ToArray()),
            System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var d) ? d : 0m;

    public async Task<HbisPlanComparisonResultDto> BuildAsync(HbisPlanComparisonForm form)
    {
        var plans = new List<HbisPlanDto>();
        var totalInsured = Num(form.DwellingLimit) + Num(form.AppurtenantLimit)
            + Num(form.PersonalAssetsLimit) + Num(form.OccupancyDisruptionLimit);

        // RateModification is computed ONCE (against the Basic tier's premium) and then reused
        // as-is for Standard/Preferred — confirmed against a live OutSystems debug trace: with it
        // recomputed independently per tier, Standard/Preferred came out LOWER than Basic (each
        // tier's larger pre-modification premium shrinks its own freshly-computed factor), the
        // opposite of production. Reusing Basic's factor reproduces production's numbers exactly.
        decimal? sharedRateModification = null;

        foreach (var tier in Tiers)
        {
            // LimitCoverage → RatingInputs (captured mapping, per tier)
            var inputs = new RatingInputs
            {
                DwellingAssetLimit = Num(form.DwellingLimit),
                PhysicalDamageDeductible = Digits(form.Deductible),            // TextToInteger(PhysicaldamageDeductible)
                CoverageLevel = tier.Id,                                       // Basic/Standard/PreferredCoverageLevel
                LiabilityCoverage = Digits(form.LiabilityAmount),              // TextToInteger(AmountOfLiabilityCoverage)
                ExcessBlanketPL = Digits(form.ExcessBlanketLiabilities),       // TextToInteger(ExcessscheduledBlanketCoveredPL)
                SinkholeCatastrophicGroundCollapse = form.Sinkhole ?? "",
                Earhquake = Digits(form.Earthquake),
                Flood = Digits(form.Flood),
                WindHail = form.WindHail ?? "",
                WildFire = form.Wildfire ?? "",
                ResidentWorkerNFM = form.ResWorkerMedical ?? "",
                SmallScalefarmingEndorsement = form.FarmingEndorsement ?? "",
                LandloardEndorsement = form.LandlordEndorsement ?? "",
                HomeOfficeEndorsement = form.HomeOfficeEndorsement ?? "",
                PriorPolicyPerodPremiumi = Num(form.PriorPolicyPremium),       // TextToDecimal(PriorPolicyPeriodPremium)
                RateModification = sharedRateModification
                    ?? (Num(form.RateModification) == 0m ? 1m : Num(form.RateModification)), // RateModification_EX
                HRHexZones = form.HexZoneHR ?? "",                             // HexZoneIdHiger
                LRHexzones = form.HexZoneLR ?? "",                             // HexZoneIdLower
                BuildingfloodElevation = Digits(form.BuildingFloodElevation),
                BuildingType = form.BuildingType ?? "",
                Buildingdescription = form.BuildingDescription ?? "",
                FloodZone = string.IsNullOrWhiteSpace(form.FloodZone) ? "None" : form.FloodZone!,
                Lat = form.Latitude ?? "0",
                Lon = form.Longitude ?? "0",
                PolicyFeesNew = Num(form.PolicyFee),
            };

            // ClaculateRateModification = True (corrected 2026-09-22 against live OutSystems
            // debug trace — the earlier "False" capture was wrong: production evaluates rate
            // modification here whenever PriorPolicyPerodPremiumi is set, confirmed by a live
            // trace producing RateModification=29.18 for PriorPolicyPeriodPremium=30000,
            // TotalPremiumWithoutRateModification=874, which reproduces the exact production
            // Base Premium ($24,764.81) once applied. ClaculateRecurringRPS stays False —
            // unrelated to this bug, not something the trace touched.
            var o = await _rater.RateAsync(inputs, claculateRateModification: sharedRateModification == null, claculateRecurringRps: false);
            sharedRateModification ??= o.RateModification;

            plans.Add(new HbisPlanDto(
                Id: tier.Id,
                Name: tier.Name,
                BasePremium: o.BasePremiumWithoutAdditionalCoverage,          // corrected: BasePremium = RatingOutput.BasePremiumWithoutAdditionalCoverage
                Wildfire: o.WildfirePremium,
                WindHail: o.WindPremium,
                Sinkhole: o.SinkholePremium,
                ExcessLiability: o.ExcessScheduleBlanketCoveredPL,
                Earthquake: o.EarthquakePremium,
                Flood: o.FloodPremium,
                ResWorker: o.ResidentWorkerNFPremium,
                Farming: o.SmallScalefarmingEndorsementPremium,
                Landlord: o.LandEndorsementPremium,
                HomeOffice: o.HomeOfficeEndorsementPremium,
                PolicyFee: o.PolicyFee,
                Total: o.BasicCoveragePremium,                                 // captured: TotalPremiumAmount = BasicCoveragePremium
                RaterInputs: new HbisRatingInputsDto(
                    inputs.DwellingAssetLimit,
                    Num(form.AppurtenantLimit),
                    Num(form.PersonalAssetsLimit),
                    Num(form.OccupancyDisruptionLimit),
                    totalInsured,
                    inputs.PhysicalDamageDeductible,
                    inputs.CoverageLevel,
                    inputs.LiabilityCoverage,
                    inputs.ExcessBlanketPL,
                    inputs.SinkholeCatastrophicGroundCollapse,
                    inputs.Earhquake,
                    inputs.Flood,
                    inputs.WindHail,
                    inputs.WildFire,
                    inputs.ResidentWorkerNFM,
                    inputs.SmallScalefarmingEndorsement,
                    inputs.LandloardEndorsement,
                    inputs.HomeOfficeEndorsement,
                    inputs.PriorPolicyPerodPremiumi,
                    inputs.RateModification,
                    inputs.PolicyFeesNew,
                    form.IsHBProducer ?? false,
                    form.LockSubmission ?? false,
                    form.IsQuickQuote ?? false),
                RatingOutput: new HbisRatingOutputDto(
                    o.BasePremiumWithoutAdditionalCoverage,
                    o.WildfirePremium,
                    o.WindPremium,
                    o.SinkholePremium,
                    o.ExcessScheduleBlanketCoveredPL,
                    o.EarthquakePremium,
                    o.FloodPremium,
                    o.ResidentWorkerNFPremium,
                    o.SmallScalefarmingEndorsementPremium,
                    o.LandEndorsementPremium,
                    o.HomeOfficeEndorsementPremium,
                    o.PolicyFee,
                    o.SubTotal,
                    o.BasicCoveragePremium - o.PolicyFee,
                    o.BasicCoveragePremium)));
        }

        var coverageLevel = string.IsNullOrWhiteSpace(form.CoverageLevel) ? (form.SelectedPlan ?? "Basic") : form.CoverageLevel!;
        return new HbisPlanComparisonResultDto(
            Source: "rater-engine",
            SelectedPlan: coverageLevel,
            CoverageLevel: coverageLevel,
            TotalInsuredValues: totalInsured,
            ValidationMessages: new List<string>(),
            DataFetchCompleted: true,
            Plans: plans);
    }
}
