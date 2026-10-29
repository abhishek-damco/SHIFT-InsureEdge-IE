// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// IERatingEngine Bootstrap* server actions (OutDoc §3.4.1). Each action populates its
// HBRater_* table from the module's Excel resource if — and only if — the table is
// still empty, exactly mirroring the OutSystems flows:
//   Start → Get<Table> (aggregate) → List.Empty? False → End
//                                              True  → ConvertFromExcel(resource, sheet)
//                                                      → Cycle: Assign record → Create<Table> → End
using System.Reflection;
using ClosedXML.Excel;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace InsureEdge.Infrastructure.Rating;

public class RaterBootstrap
{
    private readonly InsureEdgeDbContext _db;
    private readonly ILogger<RaterBootstrap> _log;

    public RaterBootstrap(InsureEdgeDbContext db, ILogger<RaterBootstrap> log)
    {
        _db = db;
        _log = log;
    }

    // BootstrapExcessFloodCoverages: "Populates the database with the excess flood
    // coverages from the excel file if the corresponding database table is still empty."
    public async Task BootstrapExcessFloodCoveragesAsync()
    {
        // GetExcessFloodCoverages → List.Empty? False → End (flow's False branch).
        if (await _db.HbRaterExcessFloodCoverages.AnyAsync()) return;

        // ConvertFromExcel: Resources.NewXLSXWorksheet_2__xlsx, Sheet "ExcessFloodCoverage",
        // record definition Excel_NewXLSXWorksheet_2_ (Type Text50, TypeOfBuilding Text50,
        // BuildingDescription Text100, BaseFloodElevation Integer, FloodZone Text50, PValue Text50).
        var rows = ReadSheet("NewXLSXWorksheet_2_.xlsx", "ExcessFloodCoverage");

        // Cycle → Assign ExcessFloodCoverageRecord → CreateHBRater_ExcessFloodCoverage.
        foreach (var row in rows)
        {
            _db.HbRaterExcessFloodCoverages.Add(new HbRaterExcessFloodCoverage
            {
                Type = row.GetValueOrDefault("Type"),
                TypeOfBuilding = row.GetValueOrDefault("TypeOfBuilding"),
                BuildingDescription = row.GetValueOrDefault("BuildingDescription"),
                BaseFloodElevation = int.TryParse(row.GetValueOrDefault("BaseFloodElevation"), out var elev) ? elev : null,
                FloodZone = row.GetValueOrDefault("FloodZone"),
                PValue = decimal.TryParse(row.GetValueOrDefault("PValue"), out var p) ? p : null,
            });
        }
        await _db.SaveChangesAsync();
        _log.LogInformation("BootstrapExcessFloodCoverages: seeded {Count} rows", rows.Count);
    }

    // BootstrapHRHexzones — flow per the captured screenshots, EXCEPT the original's
    // SQL1 "Delete From {HBRater_HRHexzone}" branch: per user direction (09-07-2026),
    // seeding happens ONCE — an already-populated table is never deleted or re-seeded
    // automatically; deletes/re-seeds only on explicit request.
    //   True (empty) → ConvertFromExcel(HRHexzones.xlsx, "Sheet1") → Cycle:
    //     Assign (HRHexzones, Hurricanerateper1000, Tornado, Hail, CreatedOn=CurrDateTime())
    //     → CreateHBRater_HRHexzone → End
    // The Excel's Wildfire column is intentionally NOT persisted (no entity attribute),
    // and CreatedBy is intentionally left null — both mirror the original exactly.
    public async Task BootstrapHRHexzonesAsync()
    {
        if (await _db.HbRaterHrHexzones.AnyAsync()) return;

        var rows = ReadSheet("HRHexzones.xlsx", "Sheet1");
        var now = DateTime.UtcNow; // CurrDateTime()
        foreach (var row in rows)
        {
            _db.HbRaterHrHexzones.Add(new HbRaterHrHexzone
            {
                HrHexzones = row.GetValueOrDefault("HR Hexzones"),
                Hurricanerateper1000 = ParseDecimal(row.GetValueOrDefault("Hurricane rate per 1000")),
                Tornado = ParseDecimal(row.GetValueOrDefault("Tornado")),
                Hail = ParseDecimal(row.GetValueOrDefault("Hail")),
                CreatedOn = now,
            });
        }
        await _db.SaveChangesAsync();
        _log.LogInformation("BootstrapHRHexzones: seeded {Count} rows", rows.Count);
    }

    // BootstrapLRHexzones — flow per the captured screenshots (GetSheet1s → List.Empty?
    // → True: ConvertFromExcel(LRHexzones.xlsx, "Sheet1", Excel_LRHexzones) → Cycle:
    // Assign Sheet1Record (8 attributes + CreatedOn=CurrDateTime()) → CreateHBRater_LRHexzones).
    // The original's SQL1 "Delete From {HBRater_LRHexzones}" not-empty branch is omitted
    // per user direction (09-07-2026): seed once, never auto-delete.
    // Several Excel rate cells are currency-formatted text ("$-   " = zero) — the OutDoc
    // types those Excel_LRHexzones fields as Text(50) for exactly this reason; they are
    // normalized to decimals here (entity LRHexzones2 stores decimals).
    public async Task BootstrapLRHexzonesAsync()
    {
        if (await _db.HbRaterLrHexzones.AnyAsync()) return;

        var rows = ReadSheet("LRHexzones.xlsx", "Sheet1");
        var now = DateTime.UtcNow; // CurrDateTime()
        foreach (var row in rows)
        {
            _db.HbRaterLrHexzones.Add(new HbRaterLrHexzones
            {
                LrHexzones = row.GetValueOrDefault("LR Hexzones"),
                StateAbb = row.GetValueOrDefault("State Abb"),
                Derechorateper1000 = ParseCurrencyDecimal(row.GetValueOrDefault("Derecho rate per 1000")),
                XwindCombinedrateAllotherpe = ParseCurrencyDecimal(row.GetValueOrDefault("Xwind Combined rate/all other perils")),
                Earthquakerate = ParseCurrencyDecimal(row.GetValueOrDefault("Earthquake rate")),
                Sinkholerate = ParseCurrencyDecimal(row.GetValueOrDefault("sinkhole rate")),
                Liabilityrates = ParseCurrencyDecimal(row.GetValueOrDefault("Liability rates")),
                Flashfloodrates = ParseCurrencyDecimal(row.GetValueOrDefault("Flash flood rates")),
                CreatedOn = now,
            });
        }
        await _db.SaveChangesAsync();
        _log.LogInformation("BootstrapLRHexzones: seeded {Count} rows", rows.Count);
    }

    // BootstrapStateTaxSheet — flow per the captured screenshots:
    //   GetSheet1s (HBRater_StateTaxSheet) → List.Empty? False → End (no delete branch here)
    //   True → ConvertFromExcel(Statetaxmatrix_v2.xlsx, "Sheet1", Excel_Statetaxmatrix_v2)
    //        → GetCountryStates (State where CountryCode = "US", sorted by Name ASC)
    //        → Cycle:
    //            ListFilter: GetCountryStates.List where
    //              ToUpper(State.Name) = ToUpper(Trim(Excel.STATE))
    //            Assign Sheet1Record: STATE, SurplusLines, StampingFee, FirePremiumTax
    //              from Excel; Abbriviation = ListFilter.FilteredList.Current.State.Abbreviation;
    //              CreatedOn = CurrDateTime()
    //            → CreateHBRater_StateTaxSheet → End
    public async Task BootstrapStateTaxSheetAsync()
    {
        if (await _db.HbRaterStateTaxSheets.AnyAsync()) return;

        var rows = ReadSheet("Statetaxmatrix_v2.xlsx", "Sheet1");
        // GetCountryStates: State entity filtered to CountryCode = "US", Name ASC.
        var usStates = await _db.Database
            .SqlQuery<StateRow>($"SELECT name AS name, abbreviation AS abbreviation FROM state WHERE country_code = 'US' ORDER BY name ASC")
            .ToListAsync();

        var now = DateTime.UtcNow; // CurrDateTime()
        foreach (var row in rows)
        {
            var stateName = row.GetValueOrDefault("STATE") ?? "";
            // ListFilter: ToUpper(State.Name) = ToUpper(Trim(Excel.STATE)); Current = first match.
            var match = usStates.FirstOrDefault(s =>
                string.Equals(s.Name?.Trim(), stateName.Trim(), StringComparison.OrdinalIgnoreCase));

            _db.HbRaterStateTaxSheets.Add(new HbRaterStateTaxSheet
            {
                State = stateName,
                SurplusLines = ParseCurrencyDecimal(row.GetValueOrDefault("Surplus Lines")),
                StampingFee = ParseCurrencyDecimal(row.GetValueOrDefault("Stamping Fee")),
                FirePremiumTax = ParseCurrencyDecimal(row.GetValueOrDefault("Fire Premium Tax")),
                Abbreviation = match?.Abbreviation ?? "",
                CreatedOn = now,
            });
        }
        await _db.SaveChangesAsync();
        _log.LogInformation("BootstrapStateTaxSheet: seeded {Count} rows", rows.Count);
    }

    private sealed class StateRow
    {
        public string? Name { get; set; }
        public string? Abbreviation { get; set; }
    }

    // Currency-formatted Excel text → decimal: strips "$", ",", whitespace; a bare "-"
    // (accounting-format zero) becomes 0.
    private static decimal? ParseCurrencyDecimal(string? value)
    {
        var cleaned = (value ?? "").Replace("$", "").Replace(",", "").Trim();
        if (cleaned.Length == 0) return null;
        if (cleaned == "-") return 0m;
        return ParseDecimal(cleaned);
    }

    private static decimal? ParseDecimal(string? value) =>
        decimal.TryParse(value, System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var d) ? d : null;

    // ConvertFromExcel equivalent: reads a sheet from an embedded module resource into
    // header-keyed string rows (header row = attribute names, matching the Excel_* structs).
    private static List<Dictionary<string, string>> ReadSheet(string resourceFileName, string sheetName)
    {
        var assembly = Assembly.GetExecutingAssembly();
        var resourceName = assembly.GetManifestResourceNames()
            .FirstOrDefault(n => n.EndsWith(resourceFileName, StringComparison.OrdinalIgnoreCase))
            ?? throw new InvalidOperationException($"Embedded rating resource '{resourceFileName}' not found.");
        using var stream = assembly.GetManifestResourceStream(resourceName)!;
        using var workbook = new XLWorkbook(stream);
        var sheet = workbook.Worksheet(sheetName);

        var headerRow = sheet.Row(1);
        var headers = new List<string>();
        for (var c = 1; c <= sheet.LastColumnUsed()!.ColumnNumber(); c++)
            headers.Add(headerRow.Cell(c).GetString().Trim());

        var rows = new List<Dictionary<string, string>>();
        foreach (var row in sheet.RowsUsed().Skip(1))
        {
            var record = new Dictionary<string, string>();
            for (var c = 0; c < headers.Count; c++)
            {
                if (string.IsNullOrEmpty(headers[c])) continue;
                record[headers[c]] = row.Cell(c + 1).GetString().Trim();
            }
            // Skip fully blank rows (trailing worksheet noise).
            if (record.Values.All(string.IsNullOrEmpty)) continue;
            rows.Add(record);
        }
        return rows;
    }
}
