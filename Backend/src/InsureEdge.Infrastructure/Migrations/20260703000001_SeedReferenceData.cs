using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsureEdge.Infrastructure.Migrations;

public partial class SeedReferenceData : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // ── Add claim_type column to coverage_type ────────────────────────────
        migrationBuilder.AddColumn<string>(
            name: "claim_type",
            table: "coverage_type",
            type: "character varying(100)",
            maxLength: 100,
            nullable: true);

        // ── Claim Initiation Channels ─────────────────────────────────────────
        migrationBuilder.InsertData(
            table: "claim_initiation_channel",
            columns: new[] { "name" },
            values: new object[,]
            {
                { "Agent / Broker" },
                { "Email" },
                { "Fax" },
                { "Mobile App" },
                { "Online Portal" },
                { "Phone" },
                { "Walk-In" },
            });

        // ── Causes of Loss ────────────────────────────────────────────────────
        // Values sourced from original OutSystems ClaimCoverage data + standard ISO HO causes
        migrationBuilder.InsertData(
            table: "cause_of_loss",
            columns: new[] { "name" },
            values: new object[,]
            {
                { "Accidental Discharge or Overflow of Water" },
                { "Aircraft" },
                { "Air gust physical damage" },
                { "Assault or battery physical damage" },
                { "Battery energy storage system pollutant damage" },
                { "Bodily Injury - Third Party" },
                { "Breakage and dropping physical damage" },
                { "Catastrophic ground cover collapse physical damage" },
                { "Earthquake" },
                { "Explosion" },
                { "Falling Objects" },
                { "Fire or Lightning" },
                { "Freezing of Plumbing" },
                { "Mold or Fungus" },
                { "Personal Liability" },
                { "Riot or Civil Commotion" },
                { "Smoke" },
                { "Theft or Burglary" },
                { "Vandalism or Malicious Mischief" },
                { "Vehicles" },
                { "Vermin physical damage" },
                { "Volcanic Eruption" },
                { "Water Damage" },
                { "Weight of Ice, Snow, or Sleet" },
                { "Windstorm or Hail" },
            });

        // ── Consequences of Loss (static list from OutSystems) ────────────────
        migrationBuilder.InsertData(
            table: "consequence_of_loss",
            columns: new[] { "name" },
            values: new object[,]
            {
                { "Additional Living Expenses" },
                { "Bodily Injury Damages" },
                { "Debris Removal" },
                { "Dwelling damage" },
                { "General Damages" },
                { "Increased Costs of Construction" },
                { "Legal Defense Costs" },
                { "Loss of Rents" },
                { "Loss of Use of property" },
                { "Loss Settlement" },
                { "Medical Payments to Others" },
                { "Other Structures Damage" },
                { "Pain and Suffering" },
                { "Personal Property Loss" },
                { "Property damage" },
                { "Property damage to TP" },
                { "Reputational" },
                { "Settlements or Judgments" },
                { "Total loss" },
            });

        // ── Coverage Types — HO Physical Damage ──────────────────────────────
        // Matches OutSystems GetCoverageList: IsHOPhyscialDamage = True, Coverage <> "Adjuster Fee"
        migrationBuilder.InsertData(
            table: "coverage_type",
            columns: new[] { "name", "claim_type" },
            values: new object[,]
            {
                { "Building Additions and Alterations",    "HO - Physical Damage" },
                { "Debris Removal",                        "HO - Physical Damage" },
                { "Dwelling",                              "HO - Physical Damage" },
                { "Equipment Breakdown",                   "HO - Physical Damage" },
                { "Fire Department Service Charge",        "HO - Physical Damage" },
                { "Home Cyber Protection",                 "HO - Physical Damage" },
                { "Identity Theft Expense",                "HO - Physical Damage" },
                { "Increased Cost of Construction",        "HO - Physical Damage" },
                { "Loss of Use",                           "HO - Physical Damage" },
                { "Other Structures",                      "HO - Physical Damage" },
                { "Personal Property",                     "HO - Physical Damage" },
                { "Reasonable Repairs",                    "HO - Physical Damage" },
                { "Scheduled Personal Property",           "HO - Physical Damage" },
                { "Service Line Coverage",                 "HO - Physical Damage" },
                { "Sewer / Drain Backup",                  "HO - Physical Damage" },
                { "Trees, Shrubs and Other Plants",        "HO - Physical Damage" },
                { "Water Backup",                          "HO - Physical Damage" },
            });

        // ── Coverage Types — HO Personal Liability ────────────────────────────
        // Matches OutSystems GetCoverageList2: IsHOPersonalLiability = True, Coverage <> "Adjuster Fee"
        migrationBuilder.InsertData(
            table: "coverage_type",
            columns: new[] { "name", "claim_type" },
            values: new object[,]
            {
                { "Legal Defense Costs",              "HO - Personal Liability" },
                { "Medical Payments to Others",       "HO - Personal Liability" },
                { "Personal Liability",               "HO - Personal Liability" },
                { "Property Damage - Third Party",    "HO - Personal Liability" },
            });

        // ── Impacted Assets ───────────────────────────────────────────────────
        migrationBuilder.InsertData(
            table: "impacted_asset",
            columns: new[] { "name" },
            values: new object[,]
            {
                { "Clothing and Apparel" },
                { "Deck / Patio" },
                { "Electrical System" },
                { "Electronics / Computers" },
                { "Exterior Walls" },
                { "Fence / Gate" },
                { "Floors" },
                { "Furniture" },
                { "Garage" },
                { "HVAC System" },
                { "Interior Walls and Ceilings" },
                { "Jewelry and Valuables" },
                { "Kitchen Appliances" },
                { "Other Personal Property" },
                { "Other Structures" },
                { "Plumbing System" },
                { "Pool / Spa" },
                { "Roof" },
                { "Slab / Foundation" },
                { "Sporting Equipment" },
                { "Trees and Landscaping" },
                { "Washer / Dryer" },
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DeleteData(table: "claim_initiation_channel", keyColumn: "name", keyValues: new object[]
        {
            "Agent / Broker", "Email", "Fax", "Mobile App", "Online Portal", "Phone", "Walk-In",
        });

        migrationBuilder.DeleteData(table: "cause_of_loss", keyColumn: "name", keyValues: new object[]
        {
            "Accidental Discharge or Overflow of Water", "Aircraft", "Air gust physical damage",
            "Assault or battery physical damage", "Battery energy storage system pollutant damage",
            "Bodily Injury - Third Party", "Breakage and dropping physical damage",
            "Catastrophic ground cover collapse physical damage", "Earthquake", "Explosion",
            "Falling Objects", "Fire or Lightning", "Freezing of Plumbing", "Mold or Fungus",
            "Personal Liability", "Riot or Civil Commotion", "Smoke", "Theft or Burglary",
            "Vandalism or Malicious Mischief", "Vehicles", "Vermin physical damage",
            "Volcanic Eruption", "Water Damage", "Weight of Ice, Snow, or Sleet", "Windstorm or Hail",
        });

        migrationBuilder.DeleteData(table: "consequence_of_loss", keyColumn: "name", keyValues: new object[]
        {
            "Additional Living Expenses", "Bodily Injury Damages", "Debris Removal",
            "Dwelling damage", "General Damages", "Increased Costs of Construction",
            "Legal Defense Costs", "Loss of Rents", "Loss of Use of property",
            "Loss Settlement", "Medical Payments to Others", "Other Structures Damage",
            "Pain and Suffering", "Personal Property Loss", "Property damage",
            "Property damage to TP", "Reputational", "Settlements or Judgments", "Total loss",
        });

        migrationBuilder.DeleteData(table: "coverage_type", keyColumn: "claim_type",
            keyValues: new object[] { "HO - Physical Damage", "HO - Personal Liability" });

        migrationBuilder.DeleteData(table: "impacted_asset", keyColumn: "name", keyValues: new object[]
        {
            "Clothing and Apparel", "Deck / Patio", "Electrical System", "Electronics / Computers",
            "Exterior Walls", "Fence / Gate", "Floors", "Furniture", "Garage", "HVAC System",
            "Interior Walls and Ceilings", "Jewelry and Valuables", "Kitchen Appliances",
            "Other Personal Property", "Other Structures", "Plumbing System", "Pool / Spa",
            "Roof", "Slab / Foundation", "Sporting Equipment", "Trees and Landscaping", "Washer / Dryer",
        });

        migrationBuilder.DropColumn(name: "claim_type", table: "coverage_type");
    }
}
