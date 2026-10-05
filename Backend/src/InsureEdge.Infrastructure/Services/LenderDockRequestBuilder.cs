// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Builds a LenderDockRequest for one policy/mortgage pair — ported from OutSystems
// NotifyLenderDockForEndorsement's per-mortgage Assign blocks (team-provided). Field
// transformations (zip dash-stripping, mortgagee-name 35-char split, WHIDHTEST env gate)
// match exactly what was specified; a few fields (W-DEDUCTIBLE's "_EX" excess-deductible
// fallback, W-AGENT-*, W-MAILING-*) have no source in our schema and are left blank/using
// the plain value — see conversation notes, not a schema gap worth a new column for yet.
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace InsureEdge.Infrastructure.Services;

public class LenderDockRequestBuilder
{
    private readonly InsureEdgeDbContext _db;
    private readonly IHostEnvironment _env;
    private readonly string _provider;
    private record StateRow(string Name, string Abbreviation);

    public LenderDockRequestBuilder(InsureEdgeDbContext db, IHostEnvironment env, IConfiguration config)
    {
        _db = db;
        _env = env;
        _provider = config["LENDERDOCK_PROVIDER"] ?? "00002";
    }

    /// <param name="policy">Must have Account, RiskAddresses, LimitCoverages, Premium, Extended loaded.</param>
    /// <param name="mortgage">The specific mortgage record this request is for.</param>
    /// <param name="activityCode">"PCH" (endorsement), "XLC" (cancel/rewrite), etc.</param>
    /// <param name="activityEffectiveDate">Endorsement effective date, cancellation effective date, etc. — differs per caller.</param>
    public async Task<LenderDockRequest> BuildAsync(
        Policy policy, PolicyMortgage mortgage, string activityCode, DateOnly activityEffectiveDate, string? cancelReason = null)
    {
        var client = await _db.Clients.FirstOrDefaultAsync(c => c.Id == policy.ClientId);
        var company = !string.IsNullOrWhiteSpace(policy.WritingCompany)
            ? await _db.ClientCompanies.FirstOrDefaultAsync(c => c.ClientId == policy.ClientId && c.CompanyCode == policy.WritingCompany)
            : null;

        var premAddress = policy.RiskAddresses.FirstOrDefault(r => r.IsActive != false) ?? policy.RiskAddresses.FirstOrDefault();
        var premStateAbbr = await LookupStateAbbreviationAsync(premAddress?.State);
        var mortStateAbbr = await LookupStateAbbreviationAsync(mortgage.State);

        var limitCoverage = policy.LimitCoverages.FirstOrDefault();
        var premium = policy.Premium;
        var account = policy.Account;

        var insuredName = string.IsNullOrWhiteSpace((account?.LastName + " " + account?.FirstName).Trim())
            ? account?.LegalBusinessName
            : $"{account?.LastName} {account?.FirstName}".Trim();

        var (mortName1, mortName2) = SplitAt35(mortgage.MortgageName);

        return new LenderDockRequest
        {
            Provider = _provider,
            ClientId = policy.ClientId.ToString(),
            WHiDhTest = _env.IsProduction() ? "" : "TEST",
            WSenderOrgName = "Hudson Bailey Insurance Services",
            WSenderEin = ToLongOrNull(StripDashes(client?.FederalTaxId)),
            WSenderElit = "PPI",
            WDataDate = ToYyyyMmDd(DateOnly.FromDateTime(DateTime.UtcNow)),
            WDueDate = ToYyyyMmDd(policy.EffectiveDate),
            WInsCoName = company?.CompanyName,
            WInsCoTaxId = ToLongOrNull(StripDashes(company?.FederalTaxId)),
            WInsCoNaicCode = ToLongOrNull(company?.NaicCode),
            WInsuredName1 = insuredName,
            WPremAddr1 = premAddress?.AddressLine1,
            WPremCity = premAddress?.City,
            WPremState = premStateAbbr ?? premAddress?.State,
            WPremZip = StripDashes(premAddress?.ZipCode),
            WPolicyNo = policy.PolicyNumber,
            WPolEffDate = ToYyyyMmDd(policy.EffectiveDate),
            WPolExpDate = ToYyyyMmDd(policy.ExpiryDate),
            WProcessDate = ToYyyyMmDd(DateOnly.FromDateTime(DateTime.UtcNow)),
            WActEffDate = ToYyyyMmDd(activityEffectiveDate),
            WActivityCode = activityCode,
            WCancelReason = cancelReason,
            WMortName1 = mortName1,
            WMortName2 = mortName2,
            WMortAddr1 = mortgage.AddressLine1,
            WMortCity = mortgage.City,
            WMortState = mortStateAbbr ?? mortgage.State,
            WMortZip = StripDashes(mortgage.ZipCode),
            WMortNum = string.Equals(mortgage.LoanType, "Primary Lender", StringComparison.OrdinalIgnoreCase) ? "1" : "2",
            WDwellingLimit = FormatAmount(limitCoverage?.DwellingAssetLimit),
            WTotalPremium = FormatAmount(premium?.TotalPremiumWithoutInstallmentFee),
            // If(PhysicalDamageDeductible = 0, ..._EX, PhysicalDamageDeductible) — the value
            // the user never overrode falls back to the original rating-engine/Excel default.
            WDeductible = FormatAmount(
                limitCoverage?.PhysicalDamageDeductible is null or 0
                    ? limitCoverage?.PhysicalDamageDeductibleEx
                    : limitCoverage.PhysicalDamageDeductible),
            WLoanNo = mortgage.LoanNumber,
            WPayor = string.Equals(premium?.ResponsibleParty, "MORTGAGEE", StringComparison.OrdinalIgnoreCase) ? "MG" : null,
            WPremFreq = string.Equals(premium?.PaymentFrequency, "Annual", StringComparison.OrdinalIgnoreCase) ? "AN" : premium?.PaymentFrequency,
            WAmountDue = FormatAmount(premium?.TotalPremiumWithoutInstallmentFee),
        };
    }

    private async Task<string?> LookupStateAbbreviationAsync(string? stateName)
    {
        if (string.IsNullOrWhiteSpace(stateName)) return null;
        var row = (await _db.Database.SqlQuery<StateRow>(
            $"SELECT name AS \"Name\", abbreviation AS \"Abbreviation\" FROM state WHERE country_code = 'US' AND name = {stateName}")
            .ToListAsync()).FirstOrDefault();
        return row?.Abbreviation;
    }

    private static (string? First35, string? Next35) SplitAt35(string? fullName)
    {
        if (string.IsNullOrEmpty(fullName)) return (null, null);
        var first = fullName.Length > 35 ? fullName[..35] : fullName;
        var second = fullName.Length > 35 ? fullName[35..Math.Min(fullName.Length, 70)] : null;
        return (first, second);
    }

    private static string? StripDashes(string? value) => value?.Replace("-", "");

    private static long? ToLongOrNull(string? value) => long.TryParse(value, out var result) ? result : null;

    private static long? ToYyyyMmDd(DateOnly? date) => date.HasValue
        ? long.Parse(date.Value.ToString("yyyyMMdd"))
        : null;

    private static string? FormatAmount(decimal? value) => value?.ToString("F2");
}
