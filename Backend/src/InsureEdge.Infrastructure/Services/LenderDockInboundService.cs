// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Inbound LenderDock endpoints — ported from OutSystems "lenderdock_essentials/rest/
// hudsonbailey" module (payment / search / search/alt / search/details), team-provided SQL.
// Not scoped by ICurrentTenantService — LenderDock calls these with no session, so lookups
// are by PolicyNumber alone (cross-tenant), same as the source SQL (no ClientId filter).
using InsureEdge.Application.DTOs.LenderDock;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Services;

public class LenderDockInboundService
{
    private readonly InsureEdgeDbContext _db;

    public LenderDockInboundService(InsureEdgeDbContext db)
    {
        _db = db;
    }

    // POST /payment
    public async Task<bool> RecordPaymentAsync(LenderDockPaymentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.PolicyNumber)) return false;

        var paymentDate = DateOnly.TryParse(req.PaymentDate, out var d) ? d : (DateOnly?)null;

        var transactions = await _db.PolicyPaymentTransactions
            .Where(t => _db.PolicyPremiums.Any(pp =>
                pp.Id == t.PolicyPremiumId &&
                _db.Policies.Any(p => p.Id == pp.PolicyId && p.PolicyNumber == req.PolicyNumber && p.PolicyStatus == "Active")))
            .ToListAsync();

        if (transactions.Count == 0) return false;

        foreach (var t in transactions)
        {
            t.TransactionStatus = "SUCCESS";
            t.IsPaid = true;
            t.PaymentMethod = req.PaymentMethod;
            t.TransactionPaymentDate = paymentDate;
        }
        await _db.SaveChangesAsync();
        return true;
    }

    // GET /search/{policyNumber} — policyType is hardcoded "Home" per the source SQL.
    public Task<List<LenderDockSearchResultDto>> SearchByPolicyNumberAsync(string policyNumber)
        => SearchAsync(BaseSearchQuery().Where(x => x.p.PolicyNumber == policyNumber), fixedPolicyType: "Home");

    // GET /search/alt?lastName=&zipCode= — policyType passed through as-is per the source SQL.
    public Task<List<LenderDockSearchResultDto>> SearchByAltAsync(string lastName, string zipCode)
        => SearchAsync(BaseSearchQuery().Where(x => x.a.LastName == lastName && x.ca.ZipCode == zipCode));

    private IQueryable<SearchRow> BaseSearchQuery() =>
        _db.Policies
            .Where(p => p.PolicyStatus == "Active" || p.PolicyStatus == "Cancelled")
            .Join(_db.Accounts, p => p.AccountId, a => a.Id, (p, a) => new { p, a })
            .Join(_db.CommonAddresses, pa => pa.a.Id, ca => ca.AccountId, (pa, ca) => new SearchRow { p = pa.p, a = pa.a, ca = ca })
            .Join(_db.PolicyMortgages, pac => pac.p.Id, m => m.PolicyId, (pac, m) => new SearchRow { p = pac.p, a = pac.a, ca = pac.ca, m = m });

    private class SearchRow
    {
        public Policy p { get; set; } = null!;
        public Account a { get; set; } = null!;
        public CommonAddress ca { get; set; } = null!;
        public PolicyMortgage m { get; set; } = null!;
    }

    private static async Task<List<LenderDockSearchResultDto>> SearchAsync(IQueryable<SearchRow> query, string? fixedPolicyType = null)
    {
        var rows = await query
            .Select(x => new
            {
                x.p.PolicyStatus,
                x.p.PolicyType,
                x.p.PolicyNumber,
                x.p.EffectiveDate,
                x.p.ExpiryDate,
                x.a.FirstName,
                x.a.LastName,
                x.a.LegalBusinessName,
                x.ca.AddressLine1,
                x.ca.AddressLine2,
                x.ca.City,
                x.ca.State,
                x.ca.ZipCode,
                x.m.LoanNumber,
            })
            .ToListAsync();

        return rows.Select(x => new LenderDockSearchResultDto(
            MapStatus(x.PolicyStatus, x.PolicyType),
            x.PolicyNumber, x.EffectiveDate, x.ExpiryDate,
            fixedPolicyType ?? x.PolicyType,
            string.IsNullOrEmpty(x.FirstName) && string.IsNullOrEmpty(x.LastName) ? x.LegalBusinessName : x.FirstName,
            x.LastName, "",
            x.AddressLine1, x.AddressLine2, x.City, x.State, x.ZipCode,
            x.LoanNumber)).ToList();
    }

    // Our policy_status/policy_type values are Title/UPPER-case (e.g. "Active",
    // "NEWBUSINESSINDIVIDUAL"), not the source system's "ACTIVE"/"POLICIESINDIVIDUAL" —
    // adjusted to this schema's actual conventions (confirmed against local data).
    private static string? MapStatus(string? policyStatus, string? policyType) => policyStatus switch
    {
        "Cancelled" => "Canceled",
        "Active" when policyType == "NEWBUSINESSINDIVIDUAL" => "NBS",
        "Active" when policyType == "RENEWALINDIVIDUAL" => "Renewal",
        _ => policyStatus,
    };

    // GET /search/details/{policyNumber}/{asOfDate}
    public async Task<LenderDockPolicyDetailsDto?> GetPolicyDetailsAsync(string policyNumber, DateOnly asOfDate)
    {
        var policy = await _db.Policies
            .Include(p => p.Extended)
            .Include(p => p.Account)
            .Include(p => p.LimitCoverages)
            .Include(p => p.Premium)
            .Include(p => p.RiskAddresses)
            .Include(p => p.RiskInformation)
            .Include(p => p.Intermediary)
            .Include(p => p.Producer)
            .Include(p => p.Mortgages)
            .Where(p => p.PolicyNumber == policyNumber && asOfDate <= p.ExpiryDate)
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync();
        if (policy == null) return null;

        var company = await _db.ClientCompanies.FirstOrDefaultAsync(c => c.ClientId == policy.ClientId);
        var limitCoverage = policy.LimitCoverages.FirstOrDefault();
        var account = policy.Account;
        var commonAddress = account != null
            ? await _db.CommonAddresses.FirstOrDefaultAsync(ca => ca.AccountId == account.Id)
            : null;
        var riskAddress = policy.RiskAddresses.FirstOrDefault();
        var riskInfo = policy.RiskInformation.FirstOrDefault();

        var cancellationDate = policy.Extended?.CancellationEffectiveDate is { } cd && cd != new DateOnly(1900, 1, 1)
            ? cd.ToString("yyyy-MM-dd") : "";

        var coverages = BuildCoverages(limitCoverage);
        // Same fallback as LenderDockRequestBuilder's WDEDUCTIBLE: a plain value of 0/null
        // means the user never overrode it, so fall back to the captured Excel default.
        var effectiveDeductible = limitCoverage?.PhysicalDamageDeductible is null or 0
            ? limitCoverage?.PhysicalDamageDeductibleEx
            : limitCoverage.PhysicalDamageDeductible;
        var deductibles = effectiveDeductible is { } deductible
            ? new List<LenderDockDeductibleDto> { new("1", "Physical Damage Deductible", "number", deductible.ToString("F2")) }
            : new List<LenderDockDeductibleDto>();

        var insuredFirstName = string.IsNullOrEmpty(account?.FirstName) && string.IsNullOrEmpty(account?.LastName)
            ? account?.LegalBusinessName : account?.FirstName;
        var insuredDetails = new LenderDockInsuredDetailsDto(
            insuredFirstName, account?.LastName, "",
            new LenderDockAddressDto(commonAddress?.AddressLine1, commonAddress?.AddressLine2, commonAddress?.City, commonAddress?.State, commonAddress?.ZipCode),
            null, null, "");

        var riskDescription = new LenderDockInsuredDetailsDto(
            null, null, "",
            new LenderDockAddressDto(riskAddress?.AddressLine1, riskAddress?.AddressLine2, riskAddress?.City, riskAddress?.State, riskAddress?.ZipCode),
            riskInfo?.YearBuilt, riskInfo?.ConstructionType, "Owner-Occupied");

        var interestedParties = policy.Mortgages.Select(m => new LenderDockInterestedPartyDto(
            m.MortgageName, m.LenderType, "",
            new LenderDockAddressDto(m.AddressLine1, m.AddressLine2, m.City, m.State, m.ZipCode))).ToList();

        var riskLocation = new LenderDockRiskLocationDto(
            riskAddress?.Id.ToString() ?? "",
            new List<LenderDockRiskDto> { new(riskInfo?.Id.ToString() ?? "", riskDescription, interestedParties, coverages) });

        return new LenderDockPolicyDetailsDto(
            new LenderDockPolicyHeaderDto(
                policy.PolicyNumber, "Home", policy.EffectiveDate, policy.ExpiryDate, policy.PolicyStatus,
                cancellationDate, policy.Extended?.ReasonOfCancellation ?? "", coverages, deductibles),
            insuredDetails,
            new List<LenderDockInsuredDetailsDto>(),
            new LenderDockAgentDetailsDto(
                policy.Producer != null ? $"{policy.Producer.FirstName} {policy.Producer.LastName}" : null,
                policy.Intermediary?.IntermediaryName),
            new LenderDockUnderwriterDetailsDto(company?.CompanyName, company?.NaicCode, company?.FederalTaxId),
            new LenderDockBillingDetailsDto(
                policy.PolicyTerm, policy.Premium?.TotalPremiumWithInstallmentFee, policy.Premium?.TotalPremiumWithInstallmentFee, "No", ""),
            new List<LenderDockRiskLocationDto> { riskLocation });
    }

    // Beyond the literal single-row SQL given (which only selects Dwelling + Physical Damage
    // Deductible): expands into one coverage entry per populated PolicyLimitCoverage field,
    // matching the flow diagram's multiple ListAppend/ListAppendNonStructuralDamage steps.
    private static List<LenderDockCoverageDto> BuildCoverages(PolicyLimitCoverage? lc)
    {
        var list = new List<LenderDockCoverageDto>();
        if (lc == null) return list;
        void Add(string name, decimal? value)
        {
            if (value.HasValue)
                list.Add(new LenderDockCoverageDto((list.Count + 1).ToString(), name, name, "number", value.Value.ToString("F2"), (list.Count + 1).ToString()));
        }
        Add("Dwelling Asset Limit", lc.DwellingAssetLimit);
        Add("Appurtenant Structure Asset", lc.AppurtenantStructureAsset);
        Add("Personal Belongings Asset", lc.PersonalBelongingsAsset);
        Add("Earthquake", lc.EarthquakeValue);
        Add("Flood", lc.FloodValue);
        Add("Wild Fire", lc.WildFireValue);
        return list;
    }
}
