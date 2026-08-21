// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// IERatingEngine "Rater" Service Action — ported 1:1 from the captured Service Studio
// flow (canvas note: "This is the rating function that returns the premium in Base,
// standard and preffered options for H&B - mukul singh").
//
// Every expression below was captured from the expanded expression editors; OutSystems
// Round() with no digits rounds half-to-even to a whole number and is replicated with
// MidpointRounding.ToEven.
//
// Flagged assumptions (nodes whose argument mappings were not visible in the capture):
//  A1 GetLRHexzoneValues argument — assumed Inputs.LRHexzones (mirrors the HR call).
//  A2 GetFloodZoneValueForFloodProne arguments — assumed Inputs.BuildingfloodElevation
//     + Inputs.Buildingdescription (they are the action's declared inputs).
//  A3 GetFloodZoneValue arguments — assumed Inputs.FloodZone + Inputs.BuildingType.
//  A4 RateModification server-action arguments — assumed PriorPolicyCoverage =
//     Inputs.PriorPolicyPerodPremiumi, CoveragePremium = RatingOutput.BasicCoveragePremium.
using Microsoft.Extensions.Logging;

namespace InsureEdge.Infrastructure.Rating;

public class Rater
{
    private readonly RaterFunctions _fn;
    private readonly ILogger<Rater> _log;

    public Rater(RaterFunctions fn, ILogger<Rater> log)
    {
        _fn = fn;
        _log = log;
    }

    private static decimal Round0(decimal v) => Math.Round(v, 0, MidpointRounding.ToEven);
    private static decimal Round2(decimal v) => Math.Round(v, 2, MidpointRounding.ToEven);
    private static decimal Round3(decimal v) => Math.Round(v, 3, MidpointRounding.ToEven);
    private static long TextToInteger(string? s) => long.TryParse((s ?? "").Trim(), out var n) ? n : 0;
    private static decimal TextToDecimal(string? s) =>
        decimal.TryParse((s ?? "").Trim(), System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var d) ? d : 0m;

    // RaterForBulkUpload (OutDoc §3.4.1) has the identical signature and — per the
    // user-confirmed capture — the same logic as Rater; both are served by this method.
    public Task<RatingOutput> RaterForBulkUploadAsync(RatingInputs inputs, bool claculateRateModification, bool claculateRecurringRps)
        => RateAsync(inputs, claculateRateModification, claculateRecurringRps);

    public async Task<RatingOutput> RateAsync(RatingInputs inputs, bool claculateRateModification, bool claculateRecurringRps)
    {
        var o = new RatingOutput();

        // Assign RatingOutput.PolicyFee = If(Inputs.PolicyFeesNew = 0, 195, Inputs.PolicyFeesNew)
        o.PolicyFee = inputs.PolicyFeesNew == 0m ? 195m : inputs.PolicyFeesNew;

        // GetHRHexzoneValues(SelectedHRHexzone = Inputs.HRHexZones)
        var hr = await _fn.GetHRHexzoneValuesAsync(inputs.HRHexZones);
        // GetLRHexzoneValues (A1: argument assumed Inputs.LRHexzones)
        var lr = await _fn.GetLRHexzoneValuesAsync(inputs.LRHexzones);

        // ── "Calculating Wind & Hail Premium Breakdown" ────────────────────────────
        // If Inputs.WindHail = "Non-Transferred"? True → WindPremium = 0
        // False → Round(If((Hail+Hurricane+Tornado+Derecho)*(DwellingAssetLimit/1000) < 125,
        //               125.00, (same)*(DwellingAssetLimit/1000)), 2)
        if (inputs.WindHail == "Non-Transferred")
        {
            o.WindPremium = 0m;
        }
        else
        {
            var windRate = (hr.Hail ?? 0m) + (hr.Hurricanerateper1000 ?? 0m) + (hr.Tornado ?? 0m)
                + (lr.Derechorateper1000 ?? 0m);
            var wind = windRate * (inputs.DwellingAssetLimit / 1000m);
            o.WindPremium = Round2(wind < 125m ? 125.00m : wind);
        }

        // ── "Calculating Wildfire Premium Breakdown" ───────────────────────────────
        // If Inputs.WildFire = "Non-Transferred"? True → WildfirePremium = 0
        // False → GetRPSValue(TextToDecimal(Lat), TextToDecimal(Lon), ClaculateRecurringRPS)
        //       → WildfireModificationValue(StateAbb = LR.StateAbb)
        //       → rate = 0.25 * ((1 + 0.4*Power(RPS,0.65)) * Power(e, 0.09*RPS))
        //                * ModificationValue * (1 - (0.7 * Power(0.1-RPS, 2) * If(RPS<0.1,1,0)))
        //         WildfirePremium = If(rate*(DwellingAssetLimit/1000) < 75.00, 75.00,
        //                              rate*(DwellingAssetLimit/1000))   [no rounding]
        //         WildfireRPS = GetRPSValue.Value
        if (inputs.WildFire == "Non-Transferred")
        {
            o.WildfirePremium = 0m;
        }
        else
        {
            var rps = await _fn.GetRPSValueAsync(TextToDecimal(inputs.Lat), TextToDecimal(inputs.Lon), claculateRecurringRps);
            var mod = await _fn.WildfireModificationValueAsync(lr.StateAbb ?? "");
            var rpsD = (double)rps;
            var rate = 0.25m
                * (decimal)((1 + 0.4 * Math.Pow(rpsD, 0.65)) * Math.Pow(2.718281828459045, 0.09 * rpsD))
                * mod
                * (decimal)(1 - (0.7 * Math.Pow(0.1 - rpsD, 2) * (rpsD < 0.1 ? 1 : 0)));
            var wf = rate * (inputs.DwellingAssetLimit / 1000m);
            o.WildfirePremium = wf < 75.00m ? 75.00m : wf;
            o.WildfireRPS = rps;
        }

        // EarthQuake: Round((If(LR.Earthquakerate<1, 1, LR.Earthquakerate)
        //                    * (TextToInteger(Inputs.Earhquake)/1000)), 2)
        var eqRate = (lr.Earthquakerate ?? 0m) < 1m ? 1m : lr.Earthquakerate!.Value;
        o.EarthquakePremium = Round2(eqRate * (TextToInteger(inputs.Earhquake) / 1000m));

        // Sinkhole: Round(If(Inputs.SinkholeCatastrophicGroundCollapse="Yes",
        //                    LR.sinkholerate*(Inputs.DwellingAssetLimit/1000), 0), 2)
        o.SinkholePremium = Round2(inputs.SinkholeCatastrophicGroundCollapse == "Yes"
            ? (lr.Sinkholerate ?? 0m) * (inputs.DwellingAssetLimit / 1000m)
            : 0m);

        // AmountOfLiabilityPremium: Round(LR.Liabilityrates
        //                    * (TextToInteger(Inputs.LiabilityCoverage)/1000), 2)
        o.LiabilityPremium = Round2((lr.Liabilityrates ?? 0m) * (TextToInteger(inputs.LiabilityCoverage) / 1000m));

        // OtherPerils: Round(If((LR.Xwind*(TextToLongInteger(DwellingAssetLimit)/1000)) < 125.00,
        //                    125.00, LR.Xwind*(TextToLongInteger(DwellingAssetLimit)/1000)), 2)
        var opBase = (lr.XwindCombinedrateAllotherpe ?? 0m) * ((long)inputs.DwellingAssetLimit / 1000m);
        o.OtherPerils = Round2(opBase < 125.00m ? 125.00m : opBase);

        // ── Endorsements ("Check if ... is included") ──────────────────────────────
        // Each: Inputs.X = "No"? True → 0; False → Round(Selection(Inputs.CoverageLevel).Value, 2)
        o.SmallScalefarmingEndorsementPremium = inputs.SmallScalefarmingEndorsement == "No"
            ? 0m : Round2(DropDownvaluesHB.SmallScaleEndorsementSelection(inputs.CoverageLevel));
        o.LandEndorsementPremium = inputs.LandloardEndorsement == "No"
            ? 0m : Round2(DropDownvaluesHB.LandlordEndorsementSelection(inputs.CoverageLevel));
        o.HomeOfficeEndorsementPremium = inputs.HomeOfficeEndorsement == "No"
            ? 0m : Round2(DropDownvaluesHB.OfficeEndorsementSelection(inputs.CoverageLevel));
        // "Check if Residential No-Fault Medical package selected"
        o.ResidentWorkerNFPremium = inputs.ResidentWorkerNFM == "No"
            ? 0m : Round2(DropDownvaluesHB.WorkersNoFaultMedical(inputs.CoverageLevel));

        // "Excess Liabilities Premium": ExcessLiabilitiesPremium → ListFilter
        // (Key = Inputs.ExcessBlanketPL) → TextToInteger(FilteredList.Current.Value)
        o.ExcessScheduleBlanketCoveredPL =
            TextToInteger(DropDownvaluesHB.ExcessLiabilitiesPremiumOption(inputs.ExcessBlanketPL));

        // "Liability Package Selection Value": LiabilityPackageSelectionPremium →
        // ListFilter (Key = Inputs.CoverageLevel) → Round(TextToDecimal(Value), 2)
        o.CoveredLiabilityPremiumValue =
            Round2(TextToDecimal(DropDownvaluesHB.LiabilityPackageSelectionPremiumOption(inputs.CoverageLevel)));

        // PhysicalDamagePackageSelectionPremium → ListFilter (Key = CoverageLevel)
        // → Round(TextToDecimal(Value), 2)
        o.PhysicaldamagePackageSelectionPremium =
            Round2(TextToDecimal(DropDownvaluesHB.PhysicalDamagePackageSelectionPremiumOption(inputs.CoverageLevel)));

        // ── Flood ("If the flood zone = None then the Flash flood will be calculated
        //           Else Excess flood premium will be calculated") ──────────────────
        if (inputs.FloodZone != "None")
        {
            if (inputs.FloodZone == "AE, A1-A30")
            {
                // A2: GetFloodZoneValueForFloodProne(Elevation, BuildingDescription)
                var p = await _fn.GetFloodZoneValueForFloodProneAsync(
                    (int)TextToInteger(inputs.BuildingfloodElevation), inputs.Buildingdescription);
                o.ExcessFlood = Round2(p * (TextToInteger(inputs.Flood) / 1000m));
            }
            else
            {
                // A3: GetFloodZoneValue(FloodZone, BuildingType)
                var p = await _fn.GetFloodZoneValueAsync(inputs.FloodZone, inputs.BuildingType);
                o.ExcessFlood = Round2(p * (TextToInteger(inputs.Flood) / 1000m));
            }
        }

        // FlashFlood: RatingOutput.FloodPremium =
        //   Round(If(Inputs.Flood <> "Add to non-transferred risks",
        //            LR.Flashfloodrates*(TextToInteger(Inputs.Flood)/1000), 0), 2)
        //   + RatingOutput.ExcessFlood
        o.FloodPremium = Round2(inputs.Flood != "Add to non-transferred risks"
                ? (lr.Flashfloodrates ?? 0m) * (TextToInteger(inputs.Flood) / 1000m)
                : 0m)
            + o.ExcessFlood;

        // GetStandardDeductiblefactor(Deductible = Inputs.PhysicalDamageDeductible)
        var factor = DropDownvaluesHB.GetStandardDeductiblefactor(inputs.PhysicalDamageDeductible);

        // PhysicalDeductible (three assignments):
        //   SubTotal = Round(Wildfire+Wind+Sinkhole+Earthquake+Flood+OtherPerils+Liability)
        o.SubTotal = Round0(o.WildfirePremium + o.WindPremium + o.SinkholePremium
            + o.EarthquakePremium + o.FloodPremium + o.OtherPerils + o.LiabilityPremium);
        //   DeductibleFactorPremiumAdjuster = Round(OtherPerils - (OtherPerils*Factor))
        o.DeductibleFactorPremiumAdjuster = Round0(o.OtherPerils - o.OtherPerils * factor);
        //   BasicCoveragePremium = Round(((SubTotal + ResidentWorkerNF + SmallScalefarming
        //     + LandEndorsement + HomeOffice + CoveredLiabilityPremiumValue
        //     + PhysicaldamagePackageSelection + ExcessScheduleBlanketCoveredPL + PolicyFee)
        //     - DeductibleFactorPremiumAdjuster), 2)
        o.BasicCoveragePremium = Round2((o.SubTotal + o.ResidentWorkerNFPremium
            + o.SmallScalefarmingEndorsementPremium + o.LandEndorsementPremium
            + o.HomeOfficeEndorsementPremium + o.CoveredLiabilityPremiumValue
            + o.PhysicaldamagePackageSelectionPremium + o.ExcessScheduleBlanketCoveredPL
            + o.PolicyFee) - o.DeductibleFactorPremiumAdjuster);

        // If ClaculateRateModification and (Inputs.PriorPolicyPerodPremiumi <> ""
        //    or Inputs.PriorPolicyPerodPremiumi <> 0)?
        //   True  → RateModification (A4) → Inputs.RateModification = result;
        //           RatingOutput.RateModification = (Round(result, 3))
        //   False → RatingOutput.RateModification = Inputs.RateModification
        var priorText = inputs.PriorPolicyPerodPremiumi.ToString(System.Globalization.CultureInfo.InvariantCulture);
        if (claculateRateModification && (priorText != "" || inputs.PriorPolicyPerodPremiumi != 0m))
        {
            var rm = RaterFunctions.RateModification(inputs.PriorPolicyPerodPremiumi, o.BasicCoveragePremium);
            inputs.RateModification = rm;
            o.RateModification = Round3(rm);
        }
        else
        {
            o.RateModification = inputs.RateModification;
        }

        // Final Assign:
        //   BasicCoveragePremiumWithoutRateModification = Round(BasicCoveragePremium)
        //   BasicCoveragePremium = Round(RateModification * BasicCoveragePremium)
        //   BasePremiumWithoutAdditionalCoverage = Round(If((BasicCoveragePremium - components)<0,
        //       0, (BasicCoveragePremium - components)), 2)
        o.BasicCoveragePremiumWithoutRateModification = Round0(o.BasicCoveragePremium);
        o.BasicCoveragePremium = Round0(o.RateModification * o.BasicCoveragePremium);
        var components = o.WildfirePremium + o.WindPremium + o.SinkholePremium
            + o.EarthquakePremium + o.FloodPremium + o.ExcessScheduleBlanketCoveredPL
            + o.ResidentWorkerNFPremium + o.SmallScalefarmingEndorsementPremium
            + o.LandEndorsementPremium + o.HomeOfficeEndorsementPremium
            + o.LiabilityPremium + o.PolicyFee;
        var baseWo = o.BasicCoveragePremium - components;
        o.BasePremiumWithoutAdditionalCoverage = Round2(baseWo < 0m ? 0m : baseWo);

        return o;
    }
}
