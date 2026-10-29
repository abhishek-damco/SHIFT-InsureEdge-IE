// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Column layout for the real "E&S Homeowners Insurance Products Upload Template"
// (source file provided under /Input — 157 data columns across 3 header rows:
// row 1 = Mandatory/Conditional/Optional marker, row 2 = long-form guidance text,
// row 3 = the actual field name). Shared by BulkUploadController (template
// generation + parsing) and BulkUploadService (validation + form mapping) so both
// sides read from one authoritative index map instead of two hand-kept copies.
namespace InsureEdge.Application.Services;

public static class BulkUploadColumns
{
    // Data rows start on row 4 of the worksheet (1-based) — 3 header rows precede them.
    public const int DataStartRow = 4;

    // ─── Core columns (validated + mapped into the submission form — first pass) ──
    public const int EffectiveDate = 0;
    public const int TypeOfPrimaryInsured = 1;
    public const int FirstName = 2;
    public const int MiddleName = 3;
    public const int LastName = 4;
    public const int Is65OrOlder = 5;
    public const int OrganizationName = 6;
    public const int DoingBusinessAs = 7;
    public const int MailAddressLine1 = 8;
    public const int MailAddressLine2 = 9;
    public const int MailCity = 10;
    public const int MailCounty = 11;
    public const int MailState = 12;
    public const int MailZip = 13;
    public const int MailLongitude = 14;
    public const int MailLatitude = 15;
    public const int AddressSameAsMailing = 16;
    public const int RiskAddressLine1 = 17;
    public const int RiskAddressLine2 = 18;
    public const int RiskCity = 19;
    public const int RiskCounty = 20;
    public const int RiskState = 21;
    public const int RiskZip = 22;
    public const int RiskLongitude = 23;
    public const int RiskLatitude = 24;
    public const int DwellingAssetLimit = 25;
    public const int PhysicalDamageDeductible = 26;
    public const int LiabilityCoverage = 27;
    public const int ExcessBlanketPl = 28;
    public const int Sinkhole = 29;
    public const int Earthquake = 30;
    public const int Flood = 31;
    public const int WindHail = 32;
    public const int WildFire = 33;
    public const int ResidentWorkerNfm = 34;
    public const int SmallScaleFarmingEndorsement = 35;
    public const int LandlordEndorsement = 36;
    public const int HomeOfficeEndorsement = 37;
    public const int PriorPolicyPremium = 38;
    public const int TelephoneNumber = 39;
    public const int Extension = 40;
    public const int AltTelephoneNumber = 41;
    public const int Email = 42;
    public const int BuildingFloodElevation = 43;
    public const int BuildingType = 44;
    public const int BuildingDescription = 45;
    // ─── Mortgagee 1 (columns AU-BM) ────────────────────────────────────────────
    public const int Mortgage1Name = 46;
    public const int Mortgage1LoanNumber = 47;
    public const int Mortgage1ServiceCompany = 48;
    public const int Mortgage1ClientId = 49;
    public const int Mortgage1LenderType = 50;
    public const int Mortgage1LoanType = 51;
    public const int Mortgage1CoveredAsset = 52;
    public const int Mortgage1AddressLine1 = 53;
    public const int Mortgage1AddressLine2 = 54;
    public const int Mortgage1City = 55;
    public const int Mortgage1County = 56;
    public const int Mortgage1State = 57;
    public const int Mortgage1Zip = 58;
    public const int Mortgage1Longitude = 59;
    public const int Mortgage1Latitude = 60;
    public const int Mortgage1Telephone = 61;
    public const int Mortgage1Extension = 62;
    public const int Mortgage1AltTelephone = 63;
    public const int Mortgage1Email = 64;

    // ─── Mortgagee 2 (columns BN-CG) — only used if "Secondary Mortgagee?" = Yes ──
    public const int SecondaryMortgageeFlag = 65;
    public const int Mortgage2Name = 66;
    public const int Mortgage2LoanNumber = 67;
    public const int Mortgage2ServiceCompany = 68;
    public const int Mortgage2ClientId = 69;
    public const int Mortgage2LenderType = 70;
    public const int Mortgage2LoanType = 71;
    public const int Mortgage2CoveredAsset = 72;
    public const int Mortgage2AddressLine1 = 73;
    public const int Mortgage2AddressLine2 = 74;
    public const int Mortgage2City = 75;
    public const int Mortgage2County = 76;
    public const int Mortgage2State = 77;
    public const int Mortgage2Zip = 78;
    public const int Mortgage2Longitude = 79;
    public const int Mortgage2Latitude = 80;
    public const int Mortgage2Telephone = 81;
    public const int Mortgage2Extension = 82;
    public const int Mortgage2AltTelephone = 83;
    public const int Mortgage2Email = 84;
    // ─── Additional named insureds ×4 (columns 85..120, 9 columns per block:
    //     First Name, Middle Name/Initial, Last Name, Insured Type, Relationship,
    //     Telephone, Alternate Telephone, Email ID, DBA Name) ──────────────────────
    public const int AdditionalInsuredsStart = 85;
    public const int AdditionalInsuredBlockSize = 9;
    public const int AdditionalInsuredCount = 4;

    // ─── Additional organizations ×4 (columns 121..156, 9 columns per block:
    //     Organization Name, Organization Type, Telephone, Extension,
    //     Alternate Telephone, Email ID, Contact First/Middle/Last Name) ────────────
    public const int AdditionalOrgsStart = 121;
    public const int AdditionalOrgBlockSize = 9;
    public const int AdditionalOrgCount = 4;

    public static readonly (int Col, string Label)[] MandatoryCoverageColumns =
    {
        (DwellingAssetLimit, "Dwelling Asset Limit"),
        (PhysicalDamageDeductible, "Physical damage Deductible"),
        (LiabilityCoverage, "Amount Of Liability Coverage"),
        (ExcessBlanketPl, "Excess scheduled Blanket Covered Personal Liabilities"),
        (Sinkhole, "Sinkhole and Catastrophic Ground Collapse"),
        (Earthquake, "Earthquake"),
        (Flood, "Flood"),
        (WindHail, "Wind & Hail"),
        (WildFire, "WildFire"),
        (ResidentWorkerNfm, "Residential Worker No-fault Medical"),
        (SmallScaleFarmingEndorsement, "Small Scale Farming Endorsement"),
        (LandlordEndorsement, "Landlord Endorsement"),
        (HomeOfficeEndorsement, "Home Office Endorsement"),
        (PriorPolicyPremium, "Prior Policy Premium"),
    };

    // Full header row (row 3), positional — used to regenerate the template exactly
    // and to render column letters in error messages if needed.
    public static readonly string[] Headers =
    {
        "Effective Date", "Type of Primary Insured", "First Name", "Middle Name/Initial", "Last Name", "Are you 65 or Older?", "Organization Name", "Doing Business As", "Address Line 1", "Address Line 2", "City", "County", "State", "Zip Code", "Longitude", "Latitude", "Address same as Mailing Address", "Address Line 1", "Address Line 2", "City", "County", "State", "Zip Code", "Longitude", "Latitude", "Dwelling Asset Limit", "Physical damage Deductible", "Amount Of Liability Coverage", "Excess scheduled Blanket Covered Personal Liabilities", "Sinkhole and Catastrophic Ground Collapse", "Earthquake", "Flood", "Wind & Hail", "WildFire", "Residential Worker No-fault Medical", "Small Scale Farming Endorsement", "Landlord Endorsement", "Home Office Endorsement", "Prior Policy Premium", "Telephone Number XXX XXX - XXXX", "Extension (XXXXXX)", "Alternate Telephone Number XXX XXX - XXXX", "Email ID", "Building Flood Elevation", "Building Type", "Building Description", "Mortgagee Name", "Loan Number", "Mortgagee Service Company", "Client ID", "Lender Type", "Loan Type", "Covered Asset", "Address Line 1", "Address Line 2", "City", "County", "State", "Zip Code", "Longitude", "Latitude", "Telephone Number XXX XXX - XXXX", "Extension (XXXXXX)", "Alternate Telephone Number XXX XXX - XXXX", "Email ID", "Secondary Mortgagee?", "Mortgagee Name", "Loan Number", "Mortgagee Service Company", "Client ID", "Lender Type", "Loan Type", "Covered Asset", "Address Line 1", "Address Line 2", "City", "County", "State", "Zip Code", "Longitude", "Latitude", "Telephone Number XXX XXX - XXXX", "Extension (XXXXXX)", "Alternate Telephone Number XXX XXX - XXXX", "Email ID", "First Name", "Middle Name/Initial", "Last Name", "Insured Type", "Relationship", "Telephone Number XXX XXX - XXXX", "Alternate Telephone Number XXX XXX - XXXX", "Email ID", "DBA Name", "First Name", "Middle Name/Initial", "Last Name", "Insured Type", "Relationship", "Telephone Number XXX XXX - XXXX", "Alternate Telephone Number XXX XXX - XXXX", "Email ID", "DBA Name", "First Name", "Middle Name/Initial", "Last Name", "Insured Type", "Relationship", "Telephone Number XXX XXX - XXXX", "Alternate Telephone Number XXX XXX - XXXX", "Email ID", "DBA Name", "First Name", "Middle Name/Initial", "Last Name", "Insured Type", "Relationship", "Telephone Number XXX XXX - XXXX", "Alternate Telephone Number XXX XXX - XXXX", "Email ID", "DBA Name", "Organization Name", "Organization Type", "Telephone Number XXX XXX - XXXX", "Extension", "Alternate Telephone Number XXX XXX - XXXX", "Email ID", "First Name", "Middle Name/Initial", "Last Name", "Organization Name", "Organization Type", "Telephone Number XXX XXX - XXXX", "Extension", "Alternate Telephone Number XXX XXX - XXXX", "Email ID", "First Name", "Middle Name/Initial", "Last Name", "Organization Name", "Organization Type", "Telephone Number XXX XXX - XXXX", "Extension", "Alternate Telephone Number XXX XXX - XXXX", "Email ID", "First Name", "Middle Name/Initial", "Last Name", "Organization Name", "Organization Type", "Telephone Number XXX XXX - XXXX", "Extension", "Alternate Telephone Number XXX XXX - XXXX", "Email ID", "First Name", "Middle Name/Initial", "Last Name",
    };

    // Row 1 marker per column — "Mandatory" (red), "Conditional" (purple), "Optional" (black).
    public static readonly string[] Mandatory =
    {
        "Mandatory", "Mandatory", "Conditional", "Optional", "Conditional", "Conditional", "Conditional", "Optional", "Mandatory", "Optional", "Mandatory", "Optional", "Mandatory", "Mandatory", "Optional", "Optional", "Mandatory", "Conditional", "Optional", "Conditional", "Optional", "Conditional", "Conditional", "Optional", "Optional", "Mandatory", "Mandatory", "Mandatory", "Mandatory", "Mandatory", "Mandatory", "Mandatory", "Mandatory", "Mandatory", "Mandatory", "Mandatory", "Mandatory", "Mandatory", "Mandatory", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Conditional", "Mandatory", "Optional", "Optional", "Mandatory", "Mandatory", "Mandatory", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Conditional", "Mandatory", "Optional", "Optional", "Mandatory", "Mandatory", "Mandatory", "Mandatory", "Optional", "Mandatory", "Mandatory", "Mandatory", "Mandatory", "Optional", "Optional", "Mandatory", "Optional", "Optional", "Mandatory", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional", "Optional",
    };

    public const string TypeOfPrimaryInsuredList = "Association,Corporation,Individual,Joint Venture,Legal Trust Organization,Limited Liability Company,Partnership,Sole Proprietorship,Tenancy in Common";
    public const string YesNoList = "Yes,No";
    // Deliberately comma-free here — ClosedXML's inline .List(string) splits options on
    // commas, so a value containing one ("2,500") would fragment into wrong entries.
    // The rating engine expects comma-grouped strings ("2,500", "10,000"), so
    // BulkUploadService.FormatThousands re-normalizes whatever the user actually typed
    // (with or without commas) after parsing — these plain-number lists are just what
    // Excel's dropdown offers, not the wire format sent to the rater.
    public const string PhysicalDamageDeductibleList = "2500,5000,10000,25000";
    public const string LiabilityCoverageList = "100000,300000,500000";
    public const string ExcessBlanketPlList = "No Coverage,500000";
    public const string SinkholeList = "None,1000,2500";
    public const string EarthquakeList = "None,25000,50000,100000";
    public const string FloodList = "None,10000,25000,50000";
    public const string WindWildfireList = "Included,Non-Transferred";
    public const string BuildingTypeList = "No basement/enclosure,With basement,With enclosure,Elevated on crawlspace,Non-elevated with subgrade crawlspace,Manufactured";
    public const string BuildingDescriptionList = "1 floor,More than 1 floor no basement,More than 1 floor with basement";
    public const string StateList = "Alabama,Alaska,Arizona,Arkansas,California,Colorado,Connecticut,Delaware,Florida,Georgia,Hawaii,Idaho,Illinois,Indiana,Iowa,Kansas,Kentucky,Louisiana,Maine,Maryland,Massachusetts,Michigan,Minnesota,Mississippi,Missouri,Montana,Nebraska,Nevada,New Hampshire,New Jersey,New Mexico,New York,North Carolina,North Dakota,Ohio,Oklahoma,Oregon,Pennsylvania,Rhode Island,South Carolina,South Dakota,Tennessee,Texas,Utah,Vermont,Virginia,Washington,West Virginia,Wisconsin,Wyoming";
}
