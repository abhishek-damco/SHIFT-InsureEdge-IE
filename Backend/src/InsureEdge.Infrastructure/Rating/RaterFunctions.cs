// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// IERatingEngine server actions ported 1:1 from the captured Service Studio flows.
// Home of WildfireModificationValue and the upcoming RaterFunctions folder actions
// (GetHRHexzoneValues, GetLRHexzoneValues, GetFloodZoneValue, ...).
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace InsureEdge.Infrastructure.Rating;

public class RaterFunctions
{
    private readonly InsureEdgeDbContext _db;
    private readonly IMemoryCache _cache;

    public RaterFunctions(InsureEdgeDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    // WildfireModificationValue (captured flow):
    //   Input:  StateAbb (Text)
    //   Output: ModificationValue (Decimal)
    //   Start → GetRatingWildfiresByState (aggregate on HBRater_RatingWildfire,
    //           Filter: HBRater_RatingWildfire.State = StateAbb,
    //           Sorting: State ASC, Max Records = 1, Cache in Minutes = 2)
    //        → Assign ModificationValue = List.Current.HBRater_RatingWildfire.K8 → End
    //   OutSystems List.Current on an empty aggregate yields the default record,
    //   so a missing state resolves to 0 (Decimal default).
    public async Task<decimal> WildfireModificationValueAsync(string stateAbb)
    {
        var row = await _cache.GetOrCreateAsync($"GetRatingWildfiresByState:{stateAbb}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2); // aggregate Cache in Minutes = 2
            return await _db.HbRaterRatingWildfires
                .Where(w => w.State == stateAbb)
                .OrderBy(w => w.State)
                .Take(1) // Max Records = 1
                .Select(w => new { w.K8 })
                .FirstOrDefaultAsync();
        });
        return row?.K8 ?? 0m;
    }

    // GetFloodZoneValue (RaterFunctions folder, captured flow):
    //   Inputs:  FloodZone (Text), BuildingType (Text)
    //   Output:  PValue (Decimal)
    //   Start → GetExcessFloodCoveragesBuilding (aggregate on HBRater_ExcessFloodCoverage,
    //             Filters: TypeOfBuilding = BuildingType AND FloodZone = FloodZone;
    //                      Type = "Dwelling"; Sort Type ASC; Max Records = 1)
    //        → GetExcessFloodCoveragesContent (same filters but Type = "Personal belongings")
    //        → Assign PValue = (TextToDecimal(Building.List.Current.PValue)
    //                         + TextToDecimal(Content.List.Current.PValue)) / 2
    //        → End
    //   Empty aggregate ⇒ List.Current is the default record ⇒ that term contributes 0.
    public async Task<decimal> GetFloodZoneValueAsync(string floodZone, string buildingType)
    {
        var building = await _db.HbRaterExcessFloodCoverages
            .Where(c => c.TypeOfBuilding == buildingType && c.FloodZone == floodZone && c.Type == "Dwelling")
            .OrderBy(c => c.Type)
            .Take(1)
            .Select(c => c.PValue)
            .FirstOrDefaultAsync();

        var content = await _db.HbRaterExcessFloodCoverages
            .Where(c => c.TypeOfBuilding == buildingType && c.FloodZone == floodZone && c.Type == "Personal belongings")
            .OrderBy(c => c.Type)
            .Take(1)
            .Select(c => c.PValue)
            .FirstOrDefaultAsync();

        return ((building ?? 0m) + (content ?? 0m)) / 2m;
    }

    // GetHRHexzoneValues (RaterFunctions folder, captured flow):
    //   Input:  SelectedHRHexzone (Text)
    //   Output: HRHezzoneRelatedValues (HBRater_HRHexzone record)
    //   Start → GetHRHexzonesByHRHexzones (aggregate on HBRater_HRHexzone,
    //           Filter: HRHexzones = SelectedHRHexzone, Sort HRHexzones ASC,
    //           Max Records = 1, Cache in Minutes = 2)
    //        → Assign HRHezzoneRelatedValues = List.Current → End
    //   No match ⇒ List.Current default record (all rates 0) — returned as a fresh entity.
    public async Task<Domain.Entities.HbRaterHrHexzone> GetHRHexzoneValuesAsync(string selectedHrHexzone)
    {
        var row = await _cache.GetOrCreateAsync($"GetHRHexzonesByHRHexzones:{selectedHrHexzone}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2); // aggregate Cache in Minutes = 2
            return await _db.HbRaterHrHexzones.AsNoTracking()
                .Where(h => h.HrHexzones == selectedHrHexzone)
                .OrderBy(h => h.HrHexzones)
                .Take(1) // Max Records = 1
                .FirstOrDefaultAsync();
        });
        return row ?? new Domain.Entities.HbRaterHrHexzone();
    }

    // GetLRHexzoneValues (RaterFunctions folder, captured flow):
    //   Input:  SelectedLRHexzone (Text)
    //   Output: LRHezzoneRelatedValues (LRHexzones2 record: Id, LRHexzones, StateAbb,
    //           Derechorateper1000, XwindCombinedrate_allotherpe, Earthquakerate,
    //           sinkholerate, Liabilityrates, Flashfloodrates — per OutDoc §3.3.3)
    //   Start → GetLRHexzonesByLRHexzones (aggregate on HBRater_LRHexzones,
    //           Filter: LRHexzones = SelectedLRHexzone,
    //           Max Records = 2, Cache in Minutes = 1)
    //        → Assign LRHezzoneRelatedValues = List.Current mapped to LRHexzones2
    //          (rate fields via TextToDecimal — the entity stores them as text in the
    //           original; our port normalized them to decimals at bootstrap, so the
    //           conversion is inherent) → End
    public async Task<Domain.Entities.HbRaterLrHexzones> GetLRHexzoneValuesAsync(string selectedLrHexzone)
    {
        var row = await _cache.GetOrCreateAsync($"GetLRHexzonesByLRHexzones:{selectedLrHexzone}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1); // aggregate Cache in Minutes = 1
            return await _db.HbRaterLrHexzones.AsNoTracking()
                .Where(l => l.LrHexzones == selectedLrHexzone)
                .Take(2) // Max Records = 2 (List.Current still yields the first row)
                .FirstOrDefaultAsync();
        });
        return row ?? new Domain.Entities.HbRaterLrHexzones();
    }

    // RateModification (captured flow):
    //   Inputs:  PriorPolicyCoverage, CoveragePremium (Decimals)
    //   Output:  RateModification (Decimal)
    //   Locals:  dealCoveragefractor, AdjustmentFactor
    //   Start → If PriorPolicyCoverage = 0 or PriorPolicyCoverage = CoveragePremium?
    //     True  → RateModification = 1.00 → End
    //     False → dealCoveragefractor = CoveragePremium / PriorPolicyCoverage
    //             → If dealCoveragefractor < 0.85?
    //                 True  → AdjustmentFactor = PriorPolicyCoverage * 0.85;
    //                         RateModification = AdjustmentFactor / CoveragePremium → End
    //                 False → RateModification = 1.0 → End
    public static decimal RateModification(decimal priorPolicyCoverage, decimal coveragePremium)
    {
        if (priorPolicyCoverage == 0m || priorPolicyCoverage == coveragePremium)
            return 1.00m;

        var dealCoveragefractor = coveragePremium / priorPolicyCoverage;
        if (dealCoveragefractor < 0.85m)
        {
            var adjustmentFactor = priorPolicyCoverage * 0.85m;
            return adjustmentFactor / coveragePremium;
        }
        return 1.0m;
    }

    // GetRPSValue (WildfireRPS folder, captured flow):
    //   Inputs:  Lat, Long, ClaculateRecurringRPS (Boolean, mandatory)
    //   Output:  Value (Decimal)
    //   Canvas note: "RunTheSQL Based on the recurring RPS calculations (needed for bulk upload)"
    //   Start → If Lat = 0 or Long = 0? True → End (Value stays 0)
    //     False → If ClaculateRecurringRPS?
    //       True  → SQL2 → Value = TextToDecimal(SQL2.List.Current.RPS.Value) → End
    //       False → SQL1 → Value = TextToDecimal(SQL1.List.Current.RPS.Value) → End
    //   SQL1 and SQL2 are IDENTICAL PostGIS raster point-samples (captured verbatim):
    //     SELECT ST_Value(r.rast, ST_Transform(ST_SetSRID(ST_MakePoint(@lon,@lat),4326),5070)) AS rps_value
    //     FROM {rps_raster} r
    //     WHERE ST_Intersects(r.rast, ST_Transform(ST_SetSRID(ST_MakePoint(@lon,@lat),4326),5070)) LIMIT 1
    //   ⚠ DEPENDENCY: requires the PostGIS + postgis_raster extensions and the wildfire
    //     RPS raster loaded into table rps_raster — neither exists in this environment yet.
    public async Task<decimal> GetRPSValueAsync(decimal lat, decimal lon, bool calculateRecurringRps)
    {
        if (lat == 0m || lon == 0m) return 0m;

        // SQL1 (non-recurring) and SQL2 (recurring) carry the same statement in the
        // original; the branch is preserved for fidelity and future divergence.
        _ = calculateRecurringRps;
        var value = await _db.Database.SqlQuery<decimal?>($@"
            SELECT ST_Value(
                r.rast,
                ST_Transform(ST_SetSRID(ST_MakePoint({lon},{lat}), 4326), 5070)
            ) AS ""Value""
            FROM rps_raster r
            WHERE ST_Intersects(
                r.rast,
                ST_Transform(ST_SetSRID(ST_MakePoint({lon},{lat}), 4326), 5070)
            )
            LIMIT 1").FirstOrDefaultAsync();
        return value ?? 0m;
    }

    // GetOtherPerials (Service Action, captured flow):
    //   Inputs:  LXHexzone, DwellingLimit
    //   Output:  OtherPerials (Decimal)
    //   Start → GetLRHexzoneValues (LXHexzone) → Assign OtherPerils → End
    //   Expression (captured verbatim from the editor):
    //     Round(If((LRHezzoneRelatedValues.XwindCombinedrate_allotherpe
    //               * (TextToLongInteger(DwellingLimit)/1000)) < 125.00,
    //           125.00,
    //           LRHezzoneRelatedValues.XwindCombinedrate_allotherpe
    //               * (TextToLongInteger(DwellingLimit)/1000)), 2)
    //   i.e. X-wind combined / all-other-perils rate-per-1000 × (dwelling limit ÷ 1000),
    //   with a minimum premium of 125.00, rounded to 2 decimals.
    public async Task<decimal> GetOtherPerialsAsync(string lxHexzone, string dwellingLimit)
    {
        var lr = await GetLRHexzoneValuesAsync(lxHexzone);
        var rate = lr.XwindCombinedrateAllotherpe ?? 0m;
        long.TryParse((dwellingLimit ?? "").Trim(), out var limit); // TextToLongInteger
        var value = rate * (limit / 1000m);
        return Math.Round(value < 125.00m ? 125.00m : value, 2);
    }

    // TaxStructure (OutDoc §3.3.3): SurplusLines, StampingFee, FirePremiumTax +
    // SurplusLinesValue, StampingFeeValue, FirePremiumTaxValue (all Decimal(37,8)).
    public record TaxStructure(
        decimal SurplusLines,
        decimal StampingFee,
        decimal FirePremiumTax,
        decimal SurplusLinesValue,
        decimal StampingFeeValue,
        decimal FirePremiumTaxValue);

    // HBPolicyTaxDetails (Service Action, captured flow):
    //   Inputs:  State, PremiumValue, PolicyFee, FireTax, AllOtherPerils
    //   Output:  TaxStructure
    //   Canvas note: "Surplus line stamping fee: if (OREGON, PENNSYLVANIA) the flat fee of
    //   10 & 20 respectively else percentage fee from the table."
    //   Start → GetStateTaxSheetsByAbbriviation (aggregate on HBRater_StateTaxSheet,
    //           Filter: STATE = State, Sort STATE ASC, Max Records = 1)
    //        → Assign:
    //           TaxStructure.SurplusLines      = row.SurplusLines
    //           TaxStructure.StampingFee       = row.StampingFee * 100
    //           TaxStructure.FirePremiumTax    = row.FirePremiumTax
    //           TaxStructure.StampingFeeValue  = Round(If(State = "OREGON", 10.00,
    //                                             If(State = "PENNSYLVANIA", 20.00,
    //                                             (PremiumValue + PolicyFee) * row.StampingFee)), 2)
    //             (full expression confirmed from the expanded editor capture, 09-07-2026)
    //           TaxStructure.SurplusLinesValue = (PremiumValue + PolicyFee) * row.SurplusLines
    //           TaxStructure.FirePremiumTaxValue = (FireTax + AllOtherPerils) * row.FirePremiumTax
    //        → End
    public async Task<TaxStructure> HBPolicyTaxDetailsAsync(
        string state, decimal premiumValue, decimal policyFee, decimal fireTax, decimal allOtherPerils)
    {
        var row = await _db.HbRaterStateTaxSheets.AsNoTracking()
            .Where(t => t.State == state)
            .OrderBy(t => t.State)
            .Take(1) // Max Records = 1
            .FirstOrDefaultAsync();

        var surplusLines = row?.SurplusLines ?? 0m;
        var stampingFee = row?.StampingFee ?? 0m;
        var firePremiumTax = row?.FirePremiumTax ?? 0m;

        var stampingFeeValue = Math.Round(
            state == "OREGON" ? 10.00m
            : state == "PENNSYLVANIA" ? 20.00m
            : (premiumValue + policyFee) * stampingFee,
            2); // Round(..., 2) — confirmed from the expanded expression capture

        return new TaxStructure(
            SurplusLines: surplusLines,
            StampingFee: stampingFee * 100m,
            FirePremiumTax: firePremiumTax,
            SurplusLinesValue: (premiumValue + policyFee) * surplusLines,
            StampingFeeValue: stampingFeeValue,
            FirePremiumTaxValue: (fireTax + allOtherPerils) * firePremiumTax);
    }

    // GetFloodZoneValueForFloodProne (RaterFunctions folder, captured flow):
    //   Inputs:  Elevation, BuildingDescription
    //   Output:  PValue (Decimal)
    //   Start → GetExcessFloodCoveragesBuilding (aggregate on HBRater_ExcessFloodCoverage,
    //             Filters: Type = "Building";
    //                      BuildingDescription = BuildingDescription AND BaseFloodElevation = Elevation;
    //             Sort Type ASC; Max Records = 1)
    //        → GetExcessFloodCoveragesContent (same second filter but Type = "Content")
    //        → Assign PValue = (TextToDecimal(Building.List.Current.PValue)
    //                         + TextToDecimal(Content.List.Current.PValue)) / 2
    //        → End
    public async Task<decimal> GetFloodZoneValueForFloodProneAsync(int elevation, string buildingDescription)
    {
        var building = await _db.HbRaterExcessFloodCoverages
            .Where(c => c.Type == "Building"
                && c.BuildingDescription == buildingDescription && c.BaseFloodElevation == elevation)
            .OrderBy(c => c.Type)
            .Take(1)
            .Select(c => c.PValue)
            .FirstOrDefaultAsync();

        var content = await _db.HbRaterExcessFloodCoverages
            .Where(c => c.Type == "Content"
                && c.BuildingDescription == buildingDescription && c.BaseFloodElevation == elevation)
            .OrderBy(c => c.Type)
            .Take(1)
            .Select(c => c.PValue)
            .FirstOrDefaultAsync();

        return ((building ?? 0m) + (content ?? 0m)) / 2m;
    }
}
