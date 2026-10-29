// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// IERatingEngine structures (OutDoc §3.3.3), attribute names preserved verbatim —
// including the original's typos (Earhquake, PriorPolicyPerodPremiumi, Landloard).
namespace InsureEdge.Infrastructure.Rating;

// RatingInputs (OutDoc §3.3.3)
public class RatingInputs
{
    public decimal DwellingAssetLimit { get; set; }             // Decimal(18,2)
    public string PhysicalDamageDeductible { get; set; } = "";
    public string CoverageLevel { get; set; } = "";
    public string LiabilityCoverage { get; set; } = "";
    public string ExcessBlanketPL { get; set; } = "";
    public string SinkholeCatastrophicGroundCollapse { get; set; } = "";
    public string Earhquake { get; set; } = "";                  // (sic)
    public string Flood { get; set; } = "";
    public string WindHail { get; set; } = "";
    public string WildFire { get; set; } = "";
    public string ResidentWorkerNFM { get; set; } = "";
    public string SmallScalefarmingEndorsement { get; set; } = "";
    public string LandloardEndorsement { get; set; } = "";       // (sic)
    public string HomeOfficeEndorsement { get; set; } = "";
    public decimal PriorPolicyPerodPremiumi { get; set; }        // (sic) Decimal(10,2)
    public decimal RateModification { get; set; }                // Decimal(5,4)
    public string HRHexZones { get; set; } = "";
    public string LRHexzones { get; set; } = "";
    public string BuildingfloodElevation { get; set; } = "";
    public string BuildingType { get; set; } = "";
    public string Buildingdescription { get; set; } = "";
    public string FloodZone { get; set; } = "";
    public string Lat { get; set; } = "";
    public string Lon { get; set; } = "";
    public string RecalculateRateModification { get; set; } = "";
    public decimal PolicyFeesNew { get; set; }
}

// RatingOutput (OutDoc §3.3.3)
public class RatingOutput
{
    public decimal BasePremium { get; set; }
    public decimal WildfirePremium { get; set; }
    public decimal WindPremium { get; set; }
    public decimal SinkholePremium { get; set; }
    public decimal ExcessScheduleBlanketCoveredPL { get; set; }
    public decimal EarthquakePremium { get; set; }
    public decimal FloodPremium { get; set; }
    public decimal ResidentWorkerNFPremium { get; set; }
    public decimal SmallScalefarmingEndorsementPremium { get; set; }
    public decimal LandEndorsementPremium { get; set; }
    public decimal HomeOfficeEndorsementPremium { get; set; }
    public decimal PolicyFee { get; set; }
    public decimal DeductibleFactorPremiumAdjuster { get; set; }
    public decimal ExcessFlood { get; set; }
    public decimal OtherPerils { get; set; }
    public decimal LiabilityPremium { get; set; }
    public decimal SubTotal { get; set; }
    public decimal CoveredLiabilityPremiumValue { get; set; }
    public decimal PhysicaldamagePackageSelectionPremium { get; set; }
    public decimal BasicCoveragePremium { get; set; }
    public decimal RateModification { get; set; }
    public decimal BasePremiumWithoutAdditionalCoverage { get; set; }
    public decimal BasicCoveragePremiumWithoutRateModification { get; set; }
    public decimal WildfireRPS { get; set; }
}
