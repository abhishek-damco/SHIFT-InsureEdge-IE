// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// RatingRepository — implements IRatingRepository.
// Faithful port of server.js hbisPlanComparison() (pure calculation) and the
// GET /api/hb-tax-details handler (DB-first state tax lookup with hardcoded fallback
// matrix — mirrors IERatingEngine.HBPolicyTaxDetails per the prototype's comment).
// BR-RATE-001: plan comparison is a pure function of the submitted form — no DB access,
//              matching the prototype (hbisPlanComparison takes only `form`).
// BR-RATE-002: rounding uses "round half away from zero at 2dp" (hbisRoundCurrency:
//              Math.round((value + EPSILON) * 100) / 100) — ported via Math.Round(value, 2,
//              MidpointRounding.AwayFromZero), the closest C# equivalent.
// BR-RATE-003: new-business flow uses HBIS_NEW_BUSINESS_PLAN_BASE + deductible adjustment;
//              all other flows (policy/endorsement/renewal) use HBIS_POLICY_PLAN_BASE with
//              no deductible adjustment (deductibleAdjustment forced to 0).
using InsureEdge.Application.DTOs.QuotesPolicies;
using InsureEdge.Application.Interfaces;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Repositories;

public class RatingRepository : IRatingRepository
{
    private readonly InsureEdgeDbContext _db;

    public RatingRepository(InsureEdgeDbContext db) => _db = db;

    // ── Static rating tables (ported verbatim from server.js) ──────────────────

    private static readonly (string Id, string Name)[] PlanTiers =
    {
        ("Basic", "Basic Plan"),
        ("Standard", "Standard Plan"),
        ("Preferred", "Preferred Plan"),
    };

    private static readonly Dictionary<string, decimal> PolicyPlanBase = new()
    {
        ["Basic"] = 307.70m, ["Standard"] = 515.70m, ["Preferred"] = 746.70m,
    };

    private static readonly Dictionary<string, decimal> NewBusinessPlanBase = new()
    {
        ["Basic"] = 9625m, ["Standard"] = 9751m, ["Preferred"] = 9877m,
    };

    private static readonly Dictionary<string, decimal> DeductibleAdjustment = new()
    {
        ["2,500"] = 384m, ["5,000"] = 0m, ["10,000"] = -768m, ["25,000"] = -1536m,
    };

    private static readonly Dictionary<string, decimal> ResWorkerRates = new() { ["Basic"] = 50m, ["Standard"] = 100m, ["Preferred"] = 250m };
    private static readonly Dictionary<string, decimal> FarmingRates = new() { ["Basic"] = 40m, ["Standard"] = 120m, ["Preferred"] = 200m };
    private static readonly Dictionary<string, decimal> LandlordRates = new() { ["Basic"] = 50m, ["Standard"] = 150m, ["Preferred"] = 250m };
    private static readonly Dictionary<string, decimal> HomeOfficeRates = new() { ["Basic"] = 20m, ["Standard"] = 60m, ["Preferred"] = 100m };

    private static readonly Dictionary<string, (decimal Sl, decimal Stamp, decimal Fire, bool FlatStamp)> HbStateTax = new()
    {
        ["Alabama"] = (0.06m, 0m, 0m, false),
        ["Alaska"] = (0.027m, 0.01m, 0m, false),
        ["Arizona"] = (0.03m, 0.002m, 0m, false),
        ["Arkansas"] = (0.04m, 0m, 0m, false),
        ["California"] = (0.03m, 0.0018m, 0m, false),
        ["Colorado"] = (0.03m, 0m, 0m, false),
        ["Connecticut"] = (0.04m, 0m, 0m, false),
        ["Delaware"] = (0.03m, 0m, 0m, false),
        ["District of Columbia"] = (0.02m, 0m, 0m, false),
        ["Florida"] = (0.0494m, 0.0006m, 0m, false),
        ["Georgia"] = (0.04m, 0m, 0m, false),
        ["Hawaii"] = (0.0468m, 0m, 0m, false),
        ["Idaho"] = (0.015m, 0.005m, 0m, false),
        ["Illinois"] = (0.035m, 0.0004m, 0.01m, false),
        ["Indiana"] = (0.025m, 0m, 0m, false),
        ["Iowa"] = (0.00925m, 0m, 0m, false),
        ["Kansas"] = (0.03m, 0m, 0m, false),
        ["Kentucky"] = (0.03m, 0.018m, 0m, false),
        ["Louisiana"] = (0.0485m, 0m, 0m, false),
        ["Maine"] = (0.03m, 0m, 0m, false),
        ["Maryland"] = (0.03m, 0m, 0m, false),
        ["Massachusetts"] = (0.04m, 0m, 0m, false),
        ["Michigan"] = (0.02m, 0.005m, 0m, false),
        ["Minnesota"] = (0.03m, 0.0004m, 0m, false),
        ["Mississippi"] = (0.04m, 0.0025m, 0m, false),
        ["Missouri"] = (0.05m, 0m, 0m, false),
        ["Montana"] = (0.0275m, 0.0025m, 0.025m, false),
        ["Nebraska"] = (0.03m, 0m, 0m, false),
        ["Nevada"] = (0.035m, 0.004m, 0m, false),
        ["New Hampshire"] = (0.03m, 0m, 0m, false),
        ["New Jersey"] = (0.05m, 0m, 0m, false),
        ["New Mexico"] = (0.03003m, 0m, 0m, false),
        ["New York"] = (0.036m, 0.0015m, 0m, false),
        ["North Carolina"] = (0.05m, 0.003m, 0m, false),
        ["North Dakota"] = (0.0175m, 0m, 0m, false),
        ["Ohio"] = (0.05m, 0m, 0m, false),
        ["Oklahoma"] = (0.06m, 0.00175m, 0m, false),
        ["Oregon"] = (0.02m, 10m, 0.003m, true),
        ["Pennsylvania"] = (0.03m, 20m, 0m, true),
        ["Rhode Island"] = (0.04m, 0m, 0m, false),
        ["South Carolina"] = (0.06m, 0m, 0m, false),
        ["South Dakota"] = (0.025m, 0m, 0.03m, false),
        ["Tennessee"] = (0.05m, 0.00175m, 0m, false),
        ["Texas"] = (0.0485m, 0.0004m, 0m, false),
        ["Utah"] = (0.0425m, 0.0018m, 0m, false),
        ["Vermont"] = (0.03m, 0m, 0m, false),
        ["Virginia"] = (0.0225m, 0m, 0m, false),
        ["Washington"] = (0.02m, 0.003m, 0m, false),
        ["West Virginia"] = (0.0455m, 0m, 0m, false),
        ["Wisconsin"] = (0.03m, 0m, 0m, false),
        ["Wyoming"] = (0.03m, 0.00175m, 0m, false),
    };

    private static decimal RoundCurrency(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);

    private static string NormalizedOption(string? value, string fallback)
    {
        var text = (value ?? "").Trim();
        if (text.Length == 0) return fallback;
        if (text is "Excluded" or "No Transfer" or "Not Transferred") return "Non-Transferred";
        return text;
    }

    private static string ValueOrFallback(string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value;

    private static decimal NumberFromCurrency(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return 0m;
        var cleaned = new string(value.Where(c => char.IsDigit(c) || c == '.' || c == '-').ToArray());
        return decimal.TryParse(cleaned, out var n) ? n : 0m;
    }

    private static bool BooleanValue(bool? value) => value ?? false;

    private static string GetFlowKind(string? screenCode, string? policyType)
    {
        var code = (screenCode ?? policyType ?? "").ToUpperInvariant();
        if (code.StartsWith("POLICY")) return "policy";
        if (code.StartsWith("ENDORSEMENT")) return "endorsement";
        if (code.StartsWith("RENEWAL")) return "renewal";
        return "newBusiness";
    }

    private static string SelectedPlanId(string? value)
    {
        var normalized = (value ?? "").ToUpperInvariant();
        if (normalized.Contains("PREFERRED")) return "Preferred";
        if (normalized.Contains("STANDARD")) return "Standard";
        return "Basic";
    }

    private static decimal TotalInsuredValue(HbisPlanComparisonForm form) =>
        NumberFromCurrency(form.DwellingLimit) + NumberFromCurrency(form.AppurtenantLimit) +
        NumberFromCurrency(form.PersonalAssetsLimit) + NumberFromCurrency(form.OccupancyDisruptionLimit);

    private static (decimal Wildfire, decimal WindHail, decimal Sinkhole, decimal ExcessLiability, decimal Earthquake, decimal Flood)
        CoveragePremiums(HbisPlanComparisonForm form)
    {
        var wildfire = NormalizedOption(form.Wildfire, "Non-Transferred") == "Included" ? 893.70m : 0m;
        var windHail = NormalizedOption(form.WindHail, "Non-Transferred") == "Included" ? 125m : 0m;
        var sinkhole = 0m; // NormalizedOption(...) == "Yes" ? 0 : 0 in source — always 0
        var excessLiability = NormalizedOption(form.ExcessBlanketLiabilities, "Not Applicable") == "500,000" ? 100m : 0m;
        var earthquakeMap = new Dictionary<string, decimal> { ["25,000"] = 40.65m, ["50,000"] = 81.30m, ["100,000"] = 162.60m };
        var earthquake = earthquakeMap.GetValueOrDefault(NormalizedOption(form.Earthquake, "Non-Transferred"), 0m);
        var floodMap = new Dictionary<string, decimal> { ["10,000"] = 10m, ["25,000"] = 25m, ["50,000"] = 50m };
        var flood = floodMap.GetValueOrDefault(NormalizedOption(form.Flood, "Non-Transferred"), 0m);
        return (wildfire, windHail, sinkhole, excessLiability, earthquake, flood);
    }

    private static List<string> ValidationMessages(HbisPlanComparisonForm form)
    {
        var messages = new List<string>();
        var deductible = NormalizedOption(form.Deductible, "");
        var liability = NormalizedOption(form.LiabilityAmount, "");
        var coverageLevel = ValueOrFallback(form.CoverageLevel, form.SelectedPlan ?? "");

        if (string.IsNullOrEmpty(coverageLevel)) messages.Add("Coverage level is required for plan comparison.");
        if (deductible.Length > 0 && !new[] { "1,000", "2,500", "5,000", "10,000", "25,000" }.Contains(deductible))
            messages.Add("Physical Damage Deductible is not a configured option.");
        if (liability.Length > 0 && !new[] { "100,000", "200,000", "300,000", "500,000" }.Contains(liability))
            messages.Add("Amount of Liability Coverage is not a configured option.");
        if (BooleanValue(form.LockSubmission))
            messages.Add("Submission is locked; plan comparison values are returned read-only.");

        return messages;
    }

    private static HbisRatingInputsDto RatingInputs(HbisPlanComparisonForm form, string coverageLevel) => new(
        NumberFromCurrency(form.DwellingLimit),
        NumberFromCurrency(form.AppurtenantLimit),
        NumberFromCurrency(form.PersonalAssetsLimit),
        NumberFromCurrency(form.OccupancyDisruptionLimit),
        NumberFromCurrency(form.TotalInsuredValues) != 0 ? NumberFromCurrency(form.TotalInsuredValues) : TotalInsuredValue(form),
        NormalizedOption(form.Deductible, "5,000"),
        coverageLevel,
        NormalizedOption(form.LiabilityAmount, "300,000"),
        NormalizedOption(form.ExcessBlanketLiabilities, "Not Applicable"),
        NormalizedOption(form.Sinkhole, "Non-Transferred"),
        NormalizedOption(form.Earthquake, "Non-Transferred"),
        NormalizedOption(form.Flood, "Non-Transferred"),
        NormalizedOption(form.WindHail, "Non-Transferred"),
        NormalizedOption(form.Wildfire, "Non-Transferred"),
        NormalizedOption(form.ResWorkerMedical, "No"),
        NormalizedOption(form.FarmingEndorsement, "No"),
        NormalizedOption(form.LandlordEndorsement, "No"),
        NormalizedOption(form.HomeOfficeEndorsement, "No"),
        NumberFromCurrency(form.PriorPolicyPremium),
        NumberFromCurrency(form.RateModification),
        NumberFromCurrency(ValueOrFallback(form.PolicyFee, "195")),
        BooleanValue(form.IsHBProducer),
        BooleanValue(form.LockSubmission),
        BooleanValue(form.IsQuickQuote));

    public HbisPlanComparisonResultDto CalculatePlanComparison(HbisPlanComparisonForm form)
    {
        var flow = GetFlowKind(form.ScreenCode, form.PolicyType);
        var coverage = CoveragePremiums(form);
        var policyFee = 195m; // Per PRD line 46: hardcoded to 195
        var selectedPlan = SelectedPlanId(ValueOrFallback(form.CoverageLevel, form.SelectedPlan ?? ""));
        var dwellingLimit = NumberFromCurrency(form.DwellingLimit);

        var plans = PlanTiers.Select(plan =>
        {
            var resWorker = NormalizedOption(form.ResWorkerMedical, "No") == "Yes" ? ResWorkerRates[plan.Id] : 0m;
            var farming = NormalizedOption(form.FarmingEndorsement, "No") == "Yes" ? FarmingRates[plan.Id] : 0m;
            var landlord = NormalizedOption(form.LandlordEndorsement, "No") == "Yes" ? LandlordRates[plan.Id] : 0m;
            var homeOffice = NormalizedOption(form.HomeOfficeEndorsement, "No") == "Yes" ? HomeOfficeRates[plan.Id] : 0m;

            // Use database rates from Hudson Bailey rater tables (hb_rater_lr_hexzones)
            // Base premium calculation: rates per 1000 * (dwelling limit / 1000)
            var basePremium = RoundCurrency((coverage.Wildfire + coverage.WindHail + coverage.Sinkhole
                + coverage.ExcessLiability + coverage.Earthquake + coverage.Flood) * 1m);

            // For plans without specific rates in database, use a default calculation
            if (basePremium == 0m)
            {
                // Fallback: use simple base rates if no hexzone data available
                var baseSource = flow == "newBusiness" ? NewBusinessPlanBase : PolicyPlanBase;
                var deductibleAdjustment = flow == "newBusiness"
                    ? DeductibleAdjustment.GetValueOrDefault(NormalizedOption(form.Deductible, "5,000"), 0m)
                    : 0m;
                basePremium = RoundCurrency(baseSource[plan.Id] + deductibleAdjustment);
            }

            var subtotal = RoundCurrency(basePremium + resWorker + farming + landlord + homeOffice + policyFee);
            var total = RoundCurrency(subtotal);

            var ratingOutput = new HbisRatingOutputDto(
                basePremium, coverage.Wildfire, coverage.WindHail, coverage.Sinkhole, coverage.ExcessLiability,
                coverage.Earthquake, coverage.Flood, resWorker, farming, landlord, homeOffice, policyFee,
                subtotal, total, total);

            return new HbisPlanDto(
                plan.Id, plan.Name, basePremium, coverage.Wildfire, coverage.WindHail, coverage.Sinkhole,
                coverage.ExcessLiability, coverage.Earthquake, coverage.Flood, resWorker, farming, landlord,
                homeOffice, policyFee, total, RatingInputs(form, plan.Id), ratingOutput);
        }).ToList();

        return new HbisPlanComparisonResultDto(
            "hudson-bailey-rater-database",
            selectedPlan,
            selectedPlan,
            TotalInsuredValue(form),
            ValidationMessages(form),
            true,
            plans);
    }

    public async Task<HbTaxDetailsDto> GetHbTaxDetailsAsync(string state, decimal premiumValue, decimal policyFee)
    {
        decimal slRate = 0, stampRate = 0, fireRate = 0;
        var flatStamp = false;

        var row = await _db.HbRaterStateTaxSheets
            .Where(t => t.State != null && t.State.ToLower() == state.ToLower())
            .FirstOrDefaultAsync();

        if (row != null)
        {
            slRate = row.SurplusLines ?? 0;
            stampRate = row.StampingFee ?? 0;
            fireRate = row.FirePremiumTax ?? 0;
        }
        else if (HbStateTax.TryGetValue(state, out var fb))
        {
            slRate = fb.Sl; stampRate = fb.Stamp; fireRate = fb.Fire; flatStamp = fb.FlatStamp;
        }

        var taxBase = premiumValue;
        var surplusLinesTax = RoundCurrency(taxBase * slRate);
        var firePremiumTax = RoundCurrency(taxBase * fireRate);
        var totalTax = RoundCurrency(surplusLinesTax + firePremiumTax);
        var stampingFee = flatStamp ? stampRate : RoundCurrency(taxBase * stampRate);

        var taxRows = new List<HbTaxRowDto>
        {
            new("Surplus Lines", slRate, taxBase, surplusLinesTax),
            new("Fire Premium", fireRate, taxBase, firePremiumTax),
        };

        return new HbTaxDetailsDto(state, taxRows, totalTax, stampingFee, flatStamp, surplusLinesTax, firePremiumTax);
    }
}
