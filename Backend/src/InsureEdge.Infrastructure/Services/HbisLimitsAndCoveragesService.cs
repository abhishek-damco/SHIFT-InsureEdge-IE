// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// GetHBISLimitsandCoverages (IE_Policy_CS > HBIS folder, captured 10-07-2026) — the
// server action behind the Limits & Coverages screen. Ported 1:1 from the captured flow:
//   Start → Get (PolicyLimitCoverage by PolicyId)
//         → GetRiskInformation (PolicyRiskInformation by PolicyId)
//         → GetRiskAddresses (RiskAddress by PolicyId, sort AddressType ASC, Max 1)
//         → GetPolicyPremiumsByPolicyId (PolicyPremium by PolicyId, sort PaymentFrequency ASC, Max 1)
//         → Assign (defaults below) → End
// Captured empty-value defaults (If(x="", default, x)):
//   CoverageLevel_EX → "Basic"          LiabilityCoverage_EX → "100000"
//   ExcessBlanketPL_EX → "No Coverage"  SinkholeCatastrophicGroundCollapse_EX → "No"
//   Earhquake_EX → "None"               Flood_EX → "None"
//   ResidentWorkerNFM_EX → "No"         SmallScalefarmingEndorsement_EX → "No"
//   LandlordEndorsement_EX → "No"       HomeOfficeEndorsement_EX → "No"
//   WindHail_EX → "Included"
//   WildFire_EX → "Included"            // ASSUMPTION A5: expression was cut off in the
//                                       // capture; mirrored from WindHail_EX — confirm
//                                       // in Service Studio.
//   PriorPolicyPerodPremiumi_EX = If(PriorPolicyPeriodPremium_EX="0" and Id=NullIdentifier(),"",value)
//   PolicyFee = If(GetPolicyPremiumsByPolicyId.List.Empty, 195, PolicyPremium.PolicyFees)
// OutSystems empty-aggregate semantics: List.Current of an empty result is a default
// record ("" / 0 / NullIdentifier()), so a policy with no policy_limit_coverage row
// still yields the defaults — modelled here by treating a missing row as empty values.
// UPDATE (db/044): the _EX columns are back — this screen is read-only and should show the
// true rating-engine/Excel-computed value (_EX) once one has been captured, not whatever
// the plain/canonical column currently holds (which may have since been edited elsewhere,
// e.g. "Plans Overview"). Falls back to the plain column, then to the hardcoded literal
// default, for legacy rows created before _EX capture existed.
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Services;

public class HbisLimitsAndCoveragesService
{
    private readonly InsureEdgeDbContext _db;

    public HbisLimitsAndCoveragesService(InsureEdgeDbContext db) => _db = db;

    /// <param name="id">Quote number or policy number (the wizard's submission id).</param>
    public async Task<object?> GetAsync(long clientId, string id)
    {
        var policy = await _db.Policies.FirstOrDefaultAsync(p =>
            p.ClientId == clientId && (p.QuoteNumber == id || p.PolicyNumber == id));
        if (policy == null) return null;

        var plc = await _db.PolicyLimitCoverages
            .FirstOrDefaultAsync(c => c.ClientId == clientId && c.PolicyId == policy.Id);
        var risk = await _db.PolicyRiskInformation
            .FirstOrDefaultAsync(r => r.ClientId == clientId && r.PolicyId == policy.Id);
        var addr = await _db.RiskAddresses
            .Where(a => a.ClientId == clientId && a.PolicyId == policy.Id)
            .OrderBy(a => a.AddressType)                       // captured: sort AddressType ASC, Max 1
            .FirstOrDefaultAsync();
        var premium = await _db.PolicyPremiums
            .Where(p => p.ClientId == clientId && p.PolicyId == policy.Id)
            .OrderBy(p => p.PaymentFrequency)                  // captured: sort PaymentFrequency ASC, Max 1
            .FirstOrDefaultAsync();

        // If(x = "", default, x) — OutSystems "" test on a Text attribute.
        static string Def(string? v, string dflt) => string.IsNullOrEmpty(v) ? dflt : v;

        // PriorPolicyPerodPremiumi_EX: "" when the value is "0" AND there is no coverage
        // row (Id = NullIdentifier()); otherwise the stored value as text.
        var priorPremiumRaw = plc?.PriorPolicyPeriodPremium ?? 0m;
        var priorPolicyPeriodPremium = priorPremiumRaw == 0m && plc == null
            ? ""
            : priorPremiumRaw.ToString(System.Globalization.CultureInfo.InvariantCulture);

        return new
        {
            policyId = policy.Id,
            id = plc?.Id ?? 0,

            // Defaults-applied (_EX) selections — prefer the real captured _EX value, fall
            // back to the plain column (legacy rows), then to the hardcoded literal default.
            coverageLevel = Def(plc?.CoverageLevelEx ?? plc?.CoverageLevel, "Basic"),
            liabilityCoverage = Def(plc?.LiabilityCoverageEx ?? plc?.LiabilityCoverage, "100000"),
            excessBlanketPL = Def(plc?.ExcessBlanketPlEx ?? plc?.ExcessBlanketPl, "No Coverage"),
            sinkholeCatastrophicGroundCollapse = Def(plc?.SinkholeCatastrophicGroundCollapseEx ?? plc?.SinkholeCatastrophicGroundCollapse, "No"),
            earthquake = Def(plc?.EarthquakeEx ?? plc?.Earthquake, "None"),
            flood = Def(plc?.FloodEx ?? plc?.Flood, "None"),
            windHail = Def(plc?.WindHailEx ?? plc?.WindHail, "Included"),
            wildFire = Def(plc?.WildFireEx ?? plc?.WildFire, "Included"),  // ASSUMPTION A5 (see header)
            residentWorkerNFM = Def(plc?.ResidentWorkerNfmEx ?? plc?.ResidentWorkerNfm, "No"),
            smallScaleFarmingEndorsement = Def(plc?.SmallScaleFarmingEndorsementEx ?? plc?.SmallScaleFarmingEndorsement, "No"),
            landlordEndorsement = Def(plc?.LandlordEndorsementEx ?? plc?.LandlordEndorsement, "No"),
            homeOfficeEndorsement = Def(plc?.HomeOfficeEndorsementEx ?? plc?.HomeOfficeEndorsement, "No"),
            priorPolicyPeriodPremium,

            // Straight-through limits/premiums (no _EX pairing — never had one, see entity header)
            dwellingLimit = plc?.DwellingAssetLimit,
            appurtenantStructureAssetsLimit = plc?.AppurtenantStructureAsset,
            personalAssetsLimit = plc?.PersonalBelongingsAsset,
            dwellingOccupancyDisruptionLimit = plc?.DwellingOccupancy,
            totalInsuredValue = plc?.Tiv,
            basicCoveragelevelCalculationPremium = plc?.CalculatedPremium,
            rateModification = plc?.RateModificationEx ?? plc?.RateModification,
            physicalDamageDeductible = plc?.PhysicalDamageDeductibleEx ?? plc?.PhysicalDamageDeductible,
            coveredLiabilitySelfInsuredRetention = plc?.CoveredLiabilitySirEx ?? plc?.CoveredLiabilitySir,
            basePremium = plc?.BasePremiumEx ?? plc?.BasePremium,
            totalPremiumAmount = plc?.TotalPremiumWithFee,     // captured: TotalPremiumAmount = TotalPremiumWithFee
            coveragePremiumAmount = plc?.TotalPremiumWithFee,  // captured: CoveragePremiumAmount = TotalPremiumWithFee
            totalPremiumWithoutRateModification = plc?.TotalPremiumWithoutRateModification,

            // Per-peril premium values
            excessBlanketPLValue = plc?.ExcessBlanketPlValueEx ?? plc?.ExcessBlanketPlValue,
            sinkholeValue = plc?.SinkholeCatastrophicGroundCollapseValueEx ?? plc?.SinkholeCatastrophicGroundCollapseValue,
            earthquakeValue = plc?.EarthquakeValueEx ?? plc?.EarthquakeValue,
            floodValue = plc?.FloodValueEx ?? plc?.FloodValue,
            windValue = plc?.WindHailValueEx ?? plc?.WindHailValue,
            wildfireValue = plc?.WildFireValueEx ?? plc?.WildFireValue,
            residentWorkerNFValue = plc?.ResidentWorkerNfmValueEx ?? plc?.ResidentWorkerNfmValue,
            smallScaleFarmingEndorsementValue = plc?.SmallScaleFarmingEndorsementValueEx ?? plc?.SmallScaleFarmingEndorsementValue,
            landEndorsementValue = plc?.LandlordEndorsementValueEx ?? plc?.LandlordEndorsementValue,
            homeOfficeEndorsementValue = plc?.HomeOfficeEndorsementValueEx ?? plc?.HomeOfficeEndorsementValue,

            // From PolicyRiskInformation
            buildingFloodElevation = risk?.BuildingFloodElevation,
            buildingType = risk?.BuildingType,
            buildingDescription = risk?.BuildingDecription,
            floodZone = risk?.FloodZone,
            hexZoneIdLower = risk?.HexZoneLowerResolution,
            hexZoneIdHiger = risk?.HexZoneHigerResolution,

            // From RiskAddress (Max 1, AddressType ASC)
            latitude = addr?.Latitude,
            longitude = addr?.Longitude,

            // PolicyFee = If(List.Empty, 195, PolicyFees)
            policyFee = premium == null ? 195m : premium.PolicyFees,
        };
    }
}
