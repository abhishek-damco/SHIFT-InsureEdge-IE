// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// IERatingEngine DropDownvaluesHB server actions consumed by the Rater — values
// CONFIRMED against DropDownvaluesHB_Backend_PRD.md (Input folder, scraped from the
// original module, 10-07-2026). Each original action builds a hard-coded ListItems
// list via ListAppendAll; the lookup ones then ListFilter on the input and Assign.
//
// Faithful details preserved:
//  - GetStandardDeductiblefactor (PRD §2.16) matches on UNFORMATTED keys ("5000", no
//    commas) and returns 0.00 when nothing matches (the only action with an Empty guard).
//  - The endorsement lookups (§2.18/2.21/2.26/2.27) have NO empty guard in the original —
//    an unknown PlanType errors there; here it resolves to the default record (0),
//    which only diverges on inputs the original would crash on.
//  - ExcessLiabilitiesPremium (§2.13) actively returns a single record 500000 → 100;
//    the disabled IN-2064 tiered logic (1M–5M) is intentionally NOT reproduced.
namespace InsureEdge.Infrastructure.Rating;

public static class DropDownvaluesHB
{
    // WorkersNoFaultMedical(PlanType) → Value (PRD §2.27)
    public static decimal WorkersNoFaultMedical(string planType) => planType switch
    {
        "Basic" => 50m, "Standard" => 100m, "Preferred" => 250m, _ => 0m,
    };

    // SmallScaleEndorsementSelection(PlanType) → Value (PRD §2.26)
    public static decimal SmallScaleEndorsementSelection(string planType) => planType switch
    {
        "Basic" => 40m, "Standard" => 120m, "Preferred" => 200m, _ => 0m,
    };

    // LandlordEndorsementSelection(PlanType) → Value (PRD §2.18)
    public static decimal LandlordEndorsementSelection(string planType) => planType switch
    {
        "Basic" => 50m, "Standard" => 150m, "Preferred" => 250m, _ => 0m,
    };

    // OfficeEndorsementSelection(PlanType) → Value (PRD §2.21)
    public static decimal OfficeEndorsementSelection(string planType) => planType switch
    {
        "Basic" => 20m, "Standard" => 60m, "Preferred" => 100m, _ => 0m,
    };

    // ExcessLiabilitiesPremium → PackageOptions (PRD §2.13: single active record).
    // Rater: ListFilter Key = Inputs.ExcessBlanketPL → TextToInteger(Current.Value).
    public static string ExcessLiabilitiesPremiumOption(string key) => key switch
    {
        "500000" => "100", _ => "", // no match ⇒ default record ⇒ TextToInteger("") = 0
    };

    // LiabilityPackageSelectionPremium → options (PRD §2.20).
    public static string LiabilityPackageSelectionPremiumOption(string key) => key switch
    {
        "Basic" => "0", "Standard" => "20.00", "Preferred" => "40.00", _ => "",
    };

    // PhysicalDamagePackageSelectionPremium → PackageOptions (PRD §2.22).
    public static string PhysicalDamagePackageSelectionPremiumOption(string key) => key switch
    {
        "Basic" => "0.0", "Standard" => "106.00", "Preferred" => "212.00", _ => "",
    };

    // GetStandardDeductiblefactor(Deductible) → Factor (PRD §2.16):
    //   Factor = If(FilteredList.Empty, 0.00, TextToDecimal(Current.Value))
    //   Keys are raw numeric strings WITHOUT commas.
    public static decimal GetStandardDeductiblefactor(string deductible) => deductible switch
    {
        "2500" => 1m, "5000" => 0.935m, "10000" => 0.86m, "25000" => 0.75m, _ => 0.00m,
    };
}
