// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// PolicyQuoteRepository — implements IPolicyQuoteRepository.
// Ported from prototype server.js GET /api/:insuredType/{nb-quotes,endorsements,renewals,policies}[/kpis].
// BR-QP-001: all queries WHERE p.client_id = clientId (tenant scoping — the prototype had no
//            multi-tenancy; this is our added scoping per codebase convention).
// BR-QP-002: :insuredType route segment filters on account.account_type (case-insensitive).
// BR-QP-003: NB Quotes = policy_type 'NEWBUSINESS'; Endorsements = 'ENDORSEMENT';
//            Renewals = 'RENEWAL'; Policies = 'POLICY' (see server.js conds).
// BR-QP-004: InsuredName is a computed expression — business => LegalBusinessName,
//            else First+Middle+Last trimmed (server.js INSURED_NAME constant).
using InsureEdge.Application.DTOs.QuotesPolicies;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace InsureEdge.Infrastructure.Repositories;

public class PolicyQuoteRepository : IPolicyQuoteRepository
{
    private readonly InsureEdgeDbContext _db;
    private readonly IDocumentGenerationService _documents;

    public PolicyQuoteRepository(InsureEdgeDbContext db, IDocumentGenerationService documents)
    {
        _db = db;
        _documents = documents;
    }

    // ─── NB Quotes ────────────────────────────────────────────────────────────

    public async Task<NbQuotesKpiDto> GetNbQuotesKpisAsync(long clientId, string insuredType)
    {
        var type = insuredType.ToLower();
        var q = BasePolicyAccountQuery(clientId, "NEWBUSINESS", type);

        var uploaded = await q.CountAsync();
        var approved = await q.CountAsync(x => x.Policy.ApprovalStatus == "Approved");
        var notApproved = await q.CountAsync(x => x.Policy.ApprovalStatus == "Not Approved");
        var expired = await q.CountAsync(x => x.Policy.PolicyStatus == "Expired");

        return new NbQuotesKpiDto(uploaded, approved, notApproved, expired);
    }

    public async Task<NbQuoteListResponse> GetNbQuotesAsync(long clientId, PolicyRegisterListQuery query)
    {
        var type = query.InsuredType.ToLower();
        var joined = BasePolicyAccountQuery(clientId, "NEWBUSINESS", type)
            .Select(x => new
            {
                x.Policy,
                x.Account,
                Lob = x.Policy.Products.Select(p => p.Product!.ProductName).FirstOrDefault(),
                SubProductName = x.Policy.Products.Select(p => p.SubProduct!.SubProductName).FirstOrDefault(),
                ProductState = x.Policy.Products.Select(p => p.State).FirstOrDefault(),
                Coverage = x.Policy.LimitCoverages.FirstOrDefault(),
            });

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.ToLower();
            joined = joined.Where(x =>
                (x.Policy.QuoteNumber != null && x.Policy.QuoteNumber.ToLower().Contains(s)) ||
                InsuredNameLower(x.Account).Contains(s) ||
                (x.Lob != null && x.Lob.ToLower().Contains(s)) ||
                (x.ProductState != null && x.ProductState.ToLower().Contains(s)));
        }
        if (!string.IsNullOrWhiteSpace(query.ApprovalStatus))
            joined = joined.Where(x => x.Policy.ApprovalStatus == query.ApprovalStatus);
        if (!string.IsNullOrWhiteSpace(query.Lob))
            joined = joined.Where(x => x.Lob == query.Lob);
        if (!string.IsNullOrWhiteSpace(query.Status))
            joined = joined.Where(x => x.Policy.PolicyStatus == query.Status);

        var total = await joined.CountAsync();
        var pageSize = Math.Max(1, query.PageSize);
        var page = Math.Max(1, query.Page);

        // Sort — whitelist matching server.js NB_SORT
        joined = (query.SortCol, query.SortDir?.ToLower()) switch
        {
            ("insuredName", "asc") => joined.OrderBy(x => InsuredNameLower(x.Account)),
            ("insuredName", _) => joined.OrderByDescending(x => InsuredNameLower(x.Account)),
            ("lob", "asc") => joined.OrderBy(x => x.Lob ?? ""),
            ("lob", _) => joined.OrderByDescending(x => x.Lob ?? ""),
            ("effectiveDate", "asc") => joined.OrderBy(x => x.Policy.EffectiveDate),
            ("effectiveDate", _) => joined.OrderByDescending(x => x.Policy.EffectiveDate),
            ("premiumEstimate", "asc") => joined.OrderBy(x => x.Coverage != null ? x.Coverage.CalculatedPremium : null),
            ("premiumEstimate", _) => joined.OrderByDescending(x => x.Coverage != null ? x.Coverage.CalculatedPremium : null),
            ("approvalStatus", "asc") => joined.OrderBy(x => x.Policy.ApprovalStatus),
            ("approvalStatus", _) => joined.OrderByDescending(x => x.Policy.ApprovalStatus),
            ("lastUpdated", "asc") => joined.OrderBy(x => x.Policy.UpdatedOn),
            ("lastUpdated", _) => joined.OrderByDescending(x => x.Policy.UpdatedOn),
            ("status", "asc") => joined.OrderBy(x => x.Policy.PolicyStatus),
            ("status", _) => joined.OrderByDescending(x => x.Policy.PolicyStatus),
            ("id", "asc") => joined.OrderBy(x => x.Policy.QuoteNumber),
            ("id", _) => joined.OrderByDescending(x => x.Policy.QuoteNumber),
            (_, "asc") => joined.OrderBy(x => x.Policy.QuoteNumber),
            _ => joined.OrderByDescending(x => x.Policy.QuoteNumber),
        };

        var rows = await joined
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();

        var items = rows.Select(x => new NbQuoteListItemDto(
            x.Policy.QuoteNumber ?? "",
            InsuredName(x.Account),
            x.Lob,
            x.SubProductName,
            x.Policy.EffectiveDate?.ToString("MM-dd-yyyy"),
            x.Coverage?.CalculatedPremium,
            x.Policy.QuoteCreationDate?.ToString("MM-dd-yyyy"),
            x.Policy.ApprovalStatus,
            x.Policy.UpdatedOn?.ToString("MM-dd-yyyy"),
            x.Policy.PolicyStatus,
            x.ProductState,
            x.Account.AccountType
        )).ToList();

        return new NbQuoteListResponse(items, total, page, pageSize);
    }

    // ─── Endorsements ─────────────────────────────────────────────────────────

    public async Task<EndorsementsKpiDto> GetEndorsementsKpisAsync(long clientId, string insuredType)
    {
        var type = insuredType.ToLower();
        var q = BasePolicyAccountQuery(clientId, "ENDORSEMENT", type);

        return new EndorsementsKpiDto(
            await q.CountAsync(),
            await q.CountAsync(x => x.Policy.PolicyStatus == "Draft"),
            await q.CountAsync(x => x.Policy.PolicyStatus == "Submitted"),
            await q.CountAsync(x => x.Policy.ApprovalStatus == "Approved"),
            await q.CountAsync(x => x.Policy.ApprovalStatus == "Not Approved"),
            await q.CountAsync(x => x.Policy.PolicyStatus == "Bound"));
    }

    public async Task<List<EndorsementListItemDto>> GetEndorsementsAsync(long clientId, string insuredType, string? search)
    {
        var type = insuredType.ToLower();
        var joined = BasePolicyAccountQuery(clientId, "ENDORSEMENT", type)
            .Select(x => new
            {
                x.Policy,
                x.Account,
                Extended = x.Policy.Extended,
                Lob = x.Policy.Products.Select(p => p.Product!.ProductName).FirstOrDefault(),
                Coverage = x.Policy.LimitCoverages.FirstOrDefault(),
            });

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            joined = joined.Where(x =>
                InsuredNameLower(x.Account).Contains(s) ||
                x.Policy.PolicyNumber.ToLower().Contains(s));
        }

        var rows = await joined.OrderByDescending(x => x.Policy.QuoteCreationDate).ToListAsync();

        return rows.Select(x => new EndorsementListItemDto(
            x.Policy.QuoteNumber ?? "",
            x.Policy.PolicyNumber,
            InsuredName(x.Account),
            x.Lob,
            x.Policy.EffectiveDate?.ToString("MM-dd-yyyy"),
            x.Extended?.EndorsementEffectiveDate?.ToString("MM-dd-yyyy"),
            x.Coverage?.CalculatedPremium ?? 0,
            x.Policy.QuoteCreationDate?.ToString("MM-dd-yyyy"),
            x.Policy.PolicyStatus,
            x.Account.AccountType
        )).ToList();
    }

    // ─── Renewals ─────────────────────────────────────────────────────────────

    public async Task<RenewalsKpiDto> GetRenewalsKpisAsync(long clientId, string insuredType)
    {
        var type = insuredType.ToLower();
        var q = BasePolicyAccountQuery(clientId, "RENEWAL", type);

        return new RenewalsKpiDto(
            await q.CountAsync(),
            await q.CountAsync(x => x.Policy.PolicyStatus == "Draft"),
            await q.CountAsync(x => x.Policy.PolicyStatus == "Pending"),
            await q.CountAsync(x => x.Policy.PolicyStatus == "Declined"),
            await q.CountAsync(x => x.Policy.PolicyStatus == "Expired"));
    }

    public async Task<List<RenewalListItemDto>> GetRenewalsAsync(long clientId, string insuredType, string? search)
    {
        var type = insuredType.ToLower();
        var joined = BasePolicyAccountQuery(clientId, "RENEWAL", type)
            .Select(x => new
            {
                x.Policy,
                x.Account,
                Extended = x.Policy.Extended,
                Lob = x.Policy.Products.Select(p => p.Product!.ProductName).FirstOrDefault(),
                SubProductName = x.Policy.Products.Select(p => p.SubProduct!.SubProductName).FirstOrDefault(),
                Coverage = x.Policy.LimitCoverages.FirstOrDefault(),
            });

        // Prior policy number resolved via policy_extended.prior_policy_id -> policy.policy_number
        // (the prototype's schema had a redundant free-text prior_policy_number column that our
        // migration collapsed into prior_policy_id — see db/011 header notes).
        var priorPolicyNumbers = await _db.PolicyExtendeds
            .Where(pe => pe.ClientId == clientId && pe.PriorPolicyId != null)
            .Select(pe => new { pe.PolicyId, pe.PriorPolicyId })
            .Join(_db.Policies, pe => pe.PriorPolicyId, p => p.Id, (pe, p) => new { pe.PolicyId, p.PolicyNumber })
            .ToDictionaryAsync(x => x.PolicyId, x => x.PolicyNumber);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            joined = joined.Where(x =>
                InsuredNameLower(x.Account).Contains(s) ||
                (priorPolicyNumbers.ContainsKey(x.Policy.Id) && priorPolicyNumbers[x.Policy.Id].ToLower().Contains(s)));
        }

        var rows = await joined.OrderByDescending(x => x.Policy.QuoteCreationDate).ToListAsync();

        var producerIds = rows.Where(x => x.Policy.ProducerId.HasValue).Select(x => x.Policy.ProducerId!.Value).Distinct().ToList();
        var producers = await _db.Producers.Where(p => producerIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => (p.FirstName + " " + p.LastName).Trim());

        var intermediaryIds = rows.Where(x => x.Policy.IntermediaryId.HasValue).Select(x => x.Policy.IntermediaryId!.Value).Distinct().ToList();
        var intermediaries = await _db.Intermediaries.Where(i => intermediaryIds.Contains(i.Id))
            .ToDictionaryAsync(i => i.Id, i => i.IntermediaryName);

        return rows.Select(x => new RenewalListItemDto(
            x.Policy.QuoteNumber ?? "",
            priorPolicyNumbers.TryGetValue(x.Policy.Id, out var ppn) ? ppn : null,
            InsuredName(x.Account),
            x.Lob,
            x.SubProductName,
            x.Policy.IntermediaryType,
            x.Policy.IntermediaryId.HasValue && intermediaries.TryGetValue(x.Policy.IntermediaryId.Value, out var iname) ? iname : null,
            x.Policy.ProducerId.HasValue && producers.TryGetValue(x.Policy.ProducerId.Value, out var pname) ? pname : null,
            x.Policy.EffectiveDate?.ToString("MM-dd-yyyy"),
            x.Policy.QuoteCreationDate?.ToString("MM-dd-yyyy"),
            x.Policy.ExpiryDate?.ToString("MM-dd-yyyy"),
            x.Extended?.RenewalOfferDate?.ToString("MM-dd-yyyy"),
            x.Coverage?.CalculatedPremium,
            x.Policy.PolicyStatus,
            x.Account.AccountType
        )).ToList();
    }

    // ─── Policies ─────────────────────────────────────────────────────────────

    public async Task<PoliciesKpiDto> GetPoliciesKpisAsync(long clientId, string insuredType)
    {
        var type = insuredType.ToLower();
        var q = BasePolicyAccountQuery(clientId, "POLICY", type);

        return new PoliciesKpiDto(
            await q.CountAsync(),
            await q.CountAsync(x => x.Policy.PolicyStatus == "Active"),
            await q.CountAsync(x => x.Policy.PolicyStatus == "Lapsed"),
            await q.CountAsync(x => x.Policy.PolicyStatus == "Expired"),
            await q.CountAsync(x => x.Policy.PolicyStatus == "Cancelled"));
    }

    public async Task<List<PolicyListItemDto>> GetPoliciesAsync(
        long clientId, string insuredType, string? search, string? status, string? sortCol, string? sortDir)
    {
        var type = insuredType.ToLower();
        var joined = BasePolicyAccountQuery(clientId, "POLICY", type)
            .Select(x => new
            {
                x.Policy,
                x.Account,
                Lob = x.Policy.Products.Select(p => p.Product!.ProductName).FirstOrDefault(),
                SubProductName = x.Policy.Products.Select(p => p.SubProduct!.SubProductName).FirstOrDefault(),
                ProductState = x.Policy.Products.Select(p => p.State).FirstOrDefault(),
                Coverage = x.Policy.LimitCoverages.FirstOrDefault(),
            });

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            joined = joined.Where(x =>
                x.Policy.PolicyNumber.ToLower().Contains(s) ||
                InsuredNameLower(x.Account).Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(status))
            joined = joined.Where(x => x.Policy.PolicyStatus == status);
        else
            // When no status filter is specified, exclude Inactive policies so endorsed/replaced policies don't show
            joined = joined.Where(x => x.Policy.PolicyStatus != "Inactive");

        joined = (sortCol, sortDir?.ToLower()) switch
        {
            ("insuredName", "asc") => joined.OrderBy(x => InsuredNameLower(x.Account)),
            ("insuredName", _) => joined.OrderByDescending(x => InsuredNameLower(x.Account)),
            ("lob", "asc") => joined.OrderBy(x => x.Lob ?? ""),
            ("lob", _) => joined.OrderByDescending(x => x.Lob ?? ""),
            ("premiumAmount", "asc") => joined.OrderBy(x => x.Coverage != null ? x.Coverage.TotalPremiumWithFee : null),
            ("premiumAmount", _) => joined.OrderByDescending(x => x.Coverage != null ? x.Coverage.TotalPremiumWithFee : null),
            ("lastUpdated", "asc") => joined.OrderBy(x => x.Policy.UpdatedOn),
            ("lastUpdated", _) => joined.OrderByDescending(x => x.Policy.UpdatedOn),
            ("status", "asc") => joined.OrderBy(x => x.Policy.PolicyStatus),
            ("status", _) => joined.OrderByDescending(x => x.Policy.PolicyStatus),
            ("id", "asc") => joined.OrderBy(x => x.Policy.PolicyNumber),
            ("id", _) => joined.OrderByDescending(x => x.Policy.PolicyNumber),
            (_, "asc") => joined.OrderBy(x => x.Policy.PolicyNumber),
            _ => joined.OrderByDescending(x => x.Policy.PolicyNumber),
        };

        var rows = await joined.ToListAsync();

        return rows.Select(x => new PolicyListItemDto(
            x.Policy.PolicyNumber,
            InsuredName(x.Account),
            x.Lob,
            x.SubProductName,
            x.Policy.EffectiveDate?.ToString("MM-dd-yyyy"),
            x.Policy.PolicyStatus,
            x.Policy.ExpiryDate?.ToString("MM-dd-yyyy"),
            x.Coverage?.TotalPremiumWithFee,
            x.Policy.UpdatedOn?.ToString("MM-dd-yyyy"),
            x.ProductState,
            x.Account.AccountType
        )).ToList();
    }

    // ─── Policy Transactions (Policy History / Timeline) ───────────────────────

    public async Task<List<PolicyTransactionDto>> GetPolicyHistoryAsync(long clientId, string policyNumber)
    {
        var main = await _db.Policies
            .FirstOrDefaultAsync(p => p.ClientId == clientId && p.PolicyNumber == policyNumber && p.PolicyStatus != "Draft");
        if (main == null) return new List<PolicyTransactionDto>();

        var rows = await _db.PolicyTransactions
            .Where(t => t.ClientId == clientId && t.MainPolicyId == main.Id)
            .OrderByDescending(t => t.CreatedOn)
            .Select(t => new
            {
                t.Id,
                t.PolicyNumber,
                t.EffectiveDate,
                t.ExpirationDate,
                t.TransactionType,
                TransactionTypeLabel = t.TransactionTypeRef != null ? t.TransactionTypeRef.Label : t.TransactionType,
                t.TransactionEffectiveDate,
                t.Status,
                RedirectionPolicyNumber = t.RedirectionPolicy != null ? t.RedirectionPolicy.PolicyNumber : null,
            })
            .ToListAsync();

        return rows.Select(t => new PolicyTransactionDto(
            t.Id,
            t.PolicyNumber,
            t.EffectiveDate?.ToString("MM-dd-yyyy"),
            t.ExpirationDate?.ToString("MM-dd-yyyy"),
            t.TransactionType,
            t.TransactionTypeLabel,
            t.TransactionEffectiveDate?.ToString("MM-dd-yyyy"),
            t.Status,
            t.RedirectionPolicyNumber
        )).ToList();
    }

    // ─── Policy Summary (Policy Information / Producer / Financials / Billing / Claims / Contacts) ─

    public async Task<PolicySummaryDto?> GetPolicySummaryAsync(long clientId, string policyNumber)
    {
        var policy = await _db.Policies
            .Include(p => p.Account)
            .Include(p => p.Products).ThenInclude(pp => pp.Product)
            .Include(p => p.Products).ThenInclude(pp => pp.SubProduct)
            .Include(p => p.Producer)
            .Include(p => p.Intermediary)
            .Include(p => p.Premium).ThenInclude(pr => pr!.Transactions)
            .Include(p => p.Commissions).ThenInclude(c => c.Producer)
            .Include(p => p.Commissions).ThenInclude(c => c.Intermediary)
            .Include(p => p.Commissions).ThenInclude(c => c.Transactions)
            .Include(p => p.Claims)
            .Include(p => p.AdditionalInsureds)
            .Include(p => p.RiskAddresses)
            .FirstOrDefaultAsync(p => p.ClientId == clientId && p.PolicyNumber == policyNumber && p.PolicyStatus != "Draft");

        if (policy == null) return null;

        var product = policy.Products.FirstOrDefault();
        var address = policy.RiskAddresses.FirstOrDefault(a => a.IsActive != false)
            ?? policy.RiskAddresses.FirstOrDefault();
        var addressText = address == null ? null : string.Join(", ", new[]
        {
            address.AddressLine1, address.AddressLine2, address.City, address.State, address.County, address.Country, address.ZipCode
        }.Where(s => !string.IsNullOrWhiteSpace(s)));

        var producers = policy.Commissions.Select(ToProducerDto).ToList();

        PolicyFinancialsDto? financials = policy.Premium == null ? null : new PolicyFinancialsDto(
            policy.Premium.TotalCoveragePremium,
            policy.Premium.TotalTax,
            policy.Premium.PolicyFees,
            policy.Premium.TotalPremiumWithInstallmentFee
        );

        PolicyBillingDto? billing = null;
        if (policy.Premium != null)
        {
            var totalBilled = policy.Premium.Transactions.Sum(t => t.AmountDue);
            var amountPaid = policy.Premium.Transactions.Where(t => t.IsPaid == true).Sum(t => t.AmountDue);
            var amountDue = policy.Premium.Transactions.Where(t => t.IsPaid != true).Sum(t => t.AmountDue);
            var unbilled = Math.Max(0, policy.Premium.TotalPremiumWithInstallmentFee - totalBilled);
            billing = new PolicyBillingDto(
                policy.Premium.PaymentFrequency,
                policy.Premium.ResponsibleParty,
                policy.Premium.TotalPremiumWithoutInstallmentFee,
                totalBilled,
                amountPaid,
                amountDue,
                unbilled
            );
        }

        var claims = policy.Claims.Select(c => new PolicyClaimSummaryDto(c.ClaimNumber, c.Status)).ToList();

        var contacts = policy.AdditionalInsureds.Select(a => new PolicyContactDto(
            string.Join(" ", new[] { a.FirstName, a.MiddleName, a.LastName }.Where(s => !string.IsNullOrWhiteSpace(s))),
            a.TelephoneNumber == null ? null : $"{a.TelephoneNumberCC} {a.TelephoneNumber}",
            a.Email,
            addressText
        )).ToList();

        return new PolicySummaryDto(
            policy.PolicyNumber,
            policy.PolicyStatus,
            product?.Product?.ProductName,
            product?.SubProduct?.SubProductName,
            policy.EffectiveDate?.ToString("MM-dd-yyyy"),
            policy.ExpiryDate?.ToString("MM-dd-yyyy"),
            policy.Account?.FirstName,
            policy.Account?.MiddleName,
            policy.Account?.LastName,
            policy.DoNotRenew == true ? "No" : "Yes",
            producers,
            financials,
            billing,
            claims,
            contacts
        );
    }

    // ─── Pending Transactions ───────────────────────────────────────────────────

    public async Task<List<PolicyPendingTransactionDto>> GetPendingTransactionsAsync(long clientId, string policyNumber)
    {
        var drafts = await _db.Policies
            .Include(p => p.Extended)
            .Where(p => p.ClientId == clientId && p.PolicyNumber == policyNumber && p.PolicyStatus == "Draft")
            .OrderBy(p => p.Id)
            .ToListAsync();

        if (drafts.Count == 0) return new List<PolicyPendingTransactionDto>();

        var typeLabels = await _db.PolicyTransactionTypes.ToDictionaryAsync(t => t.Code, t => t.Label);
        var creatorIds = drafts.Where(p => p.CreatedBy is > 0).Select(p => p.CreatedBy!.Value).Distinct().ToList();
        var creators = await _db.Users.Where(u => creatorIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.FullName);

        return drafts.Select(p =>
        {
            var label = !string.IsNullOrEmpty(p.PolicyStage) && typeLabels.TryGetValue(p.PolicyStage, out var l) ? l : null;
            var transactionType = label switch
            {
                "Endorsement" => "Endorsement Quote",
                "Renewal" => "Renewal Quote",
                _ => label
            };

            var effectiveDate = (p.Extended?.EndorsementEffectiveDate == null || p.Extended?.PriorPolicyId == null)
                ? p.EffectiveDate
                : p.Extended.EndorsementEffectiveDate;

            var assignedUser = (p.CreatedBy is null or 0) ? "System" : creators.GetValueOrDefault(p.CreatedBy.Value, "System");

            return new PolicyPendingTransactionDto(
                p.Id,
                p.PolicyNumber,
                transactionType,
                p.QuoteNumber,
                effectiveDate?.ToString("MM-dd-yyyy"),
                assignedUser,
                p.PolicyStatus,
                p.PolicyType
            );
        }).ToList();
    }

    // ─── Billing detail screen ───────────────────────────────────────────────────

    public async Task<PolicyBillingDetailDto?> GetBillingDetailAsync(long clientId, string policyNumber)
    {
        var policy = await _db.Policies
            .Include(p => p.Extended)
            .Include(p => p.Premium).ThenInclude(pr => pr!.Transactions).ThenInclude(t => t.Extended)
            .Include(p => p.CancellationTransactions)
            .Include(p => p.Commissions).ThenInclude(c => c.Producer)
            .Include(p => p.Commissions).ThenInclude(c => c.Intermediary)
            .Include(p => p.Commissions).ThenInclude(c => c.Transactions)
            .FirstOrDefaultAsync(p => p.ClientId == clientId && p.PolicyNumber == policyNumber && p.PolicyStatus != "Draft");

        if (policy == null) return null;

        var premium = policy.Premium;
        var perInstallmentFee = premium != null && premium.NumberOfInstallments > 0
            ? Math.Round(premium.TotalInstallmentFee / premium.NumberOfInstallments, 2)
            : 0m;

        var schedule = premium?.Transactions
            .OrderBy(t => t.DueDate)
            .Select(t => new PolicyPaymentScheduleRowDto(
                t.DueDate.ToString("MM-dd-yyyy"),
                perInstallmentFee,
                t.AmountDue,
                t.AmountDue,
                t.IsPaid == true ? "Paid" : "Unpaid"
            )).ToList() ?? new List<PolicyPaymentScheduleRowDto>();

        var totalPending = premium?.Transactions.Where(t => t.IsPaid != true).Sum(t => t.AmountDue) ?? 0m;

        var isCancelled = policy.PolicyStatus == "Cancelled";
        var cancellation = policy.CancellationTransactions.FirstOrDefault();
        var premiumBreakdown = isCancelled && premium != null
            ? BuildPremiumBreakdown(premium, cancellation)
            : new List<PolicyPremiumBreakdownRowDto>();
        var commissions = isCancelled ? policy.Commissions.Select(ToProducerDto).ToList() : new List<PolicyProducerDto>();

        return new PolicyBillingDetailDto(
            premium?.PaymentFrequency,
            premium?.ResponsibleParty,
            premium?.ModeOfPaymentToUse,
            premium?.NumberOfInstallments ?? 0,
            premium?.TotalInstallmentFee ?? 0,
            premium?.IsPolicyFullyPaid == true ? "Yes" : "No",
            schedule,
            totalPending,
            isCancelled ? policy.Extended?.CancellationEffectiveDate?.ToString("MM-dd-yyyy") : null,
            premiumBreakdown,
            commissions
        );
    }

    // Ported from OutSystems GetPolicyRefundBilling_BL assignment logic: Written = sum of
    // policy_payment_transaction_extended across installments (flat policy_premium value
    // for Stamping Fee / Policy Fee, repeated per installment per source logic); Unearned =
    // the policy's cancellation_payment_transaction value if that installment is paid,
    // else the full Written amount for that installment; Earned = Written − Unearned if
    // paid, else 0. CancellationPaymentTransaction is keyed by PolicyId only (one row per
    // policy, not per installment), so the same snapshot applies to every paid installment.
    private static List<PolicyPremiumBreakdownRowDto> BuildPremiumBreakdown(PolicyPremium premium, CancellationPaymentTransaction? cancel)
    {
        decimal writtenCoverage = 0, earnedCoverage = 0, unearnedCoverage = 0;
        decimal writtenSurplus = 0, earnedSurplus = 0, unearnedSurplus = 0;
        decimal writtenFire = 0, earnedFire = 0, unearnedFire = 0;
        decimal writtenStamping = 0, earnedStamping = 0, unearnedStamping = 0;
        decimal writtenPolicyFee = 0, earnedPolicyFee = 0, unearnedPolicyFee = 0;

        foreach (var t in premium.Transactions)
        {
            var ext = t.Extended;
            var isPaid = t.IsPaid == true;

            var wCoverage = ext?.CoveragePremium ?? 0;
            var wSurplus = ext?.SurplusLineTaxInstallmentAmount ?? 0;
            var wFire = ext?.FirePremiumTaxInstallmentAmount ?? 0;
            var wStamping = premium.StampingFee ?? 0;
            var wPolicyFee = premium.PolicyFees;

            writtenCoverage += wCoverage; writtenSurplus += wSurplus; writtenFire += wFire;
            writtenStamping += wStamping; writtenPolicyFee += wPolicyFee;

            var uCoverage = isPaid ? (cancel?.CoveragePremium ?? 0) : wCoverage;
            var uSurplus = isPaid ? (cancel?.SurplusLinesTax ?? 0) : wSurplus;
            var uFire = isPaid ? (cancel?.FirePremiumTax ?? 0) : wFire;
            var uStamping = isPaid ? (cancel?.StampingFee ?? 0) : wStamping;
            var uPolicyFee = isPaid ? (cancel?.PolicyFee ?? 0) : wPolicyFee;

            unearnedCoverage += uCoverage; unearnedSurplus += uSurplus; unearnedFire += uFire;
            unearnedStamping += uStamping; unearnedPolicyFee += uPolicyFee;

            earnedCoverage += isPaid ? wCoverage - uCoverage : 0;
            earnedSurplus += isPaid ? wSurplus - uSurplus : 0;
            earnedFire += isPaid ? wFire - uFire : 0;
            earnedStamping += isPaid ? wStamping - uStamping : 0;
            earnedPolicyFee += isPaid ? wPolicyFee - uPolicyFee : 0;
        }

        return new List<PolicyPremiumBreakdownRowDto>
        {
            new("Coverage Premium", writtenCoverage, earnedCoverage, unearnedCoverage),
            new("Surplus Lines Tax", writtenSurplus, earnedSurplus, unearnedSurplus),
            new("Fire Premium Tax", writtenFire, earnedFire, unearnedFire),
            new("Stamping Fee", writtenStamping, earnedStamping, unearnedStamping),
            new("Policy Fee", writtenPolicyFee, earnedPolicyFee, unearnedPolicyFee),
        };
    }

    // ─── Claims screen ────────────────────────────────────────────────────────────

    public async Task<List<PolicyClaimRowDto>> GetClaimsAsync(long clientId, string policyNumber)
    {
        var policy = await _db.Policies
            .Include(p => p.Account)
            .FirstOrDefaultAsync(p => p.ClientId == clientId && p.PolicyNumber == policyNumber && p.PolicyStatus != "Draft");
        if (policy == null) return new List<PolicyClaimRowDto>();

        var claims = await _db.Claims
            .Include(c => c.Claimants)
            .Where(c => c.PolicyId == policy.Id && c.Status != "DRAFT")
            .OrderByDescending(c => c.CreatedOn)
            .ToListAsync();
        if (claims.Count == 0) return new List<PolicyClaimRowDto>();

        var claimIds = claims.Select(c => c.Id).ToList();
        var worksheets = await _db.Worksheets
            .Include(w => w.Payments)
            .Include(w => w.Reserves)
            .Where(w => claimIds.Contains(w.ClaimId))
            .ToListAsync();

        var accountName = policy.Account != null
            ? string.Join(" ", new[] { policy.Account.FirstName, policy.Account.MiddleName, policy.Account.LastName }.Where(s => !string.IsNullOrWhiteSpace(s)))
            : null;

        return claims.Select(c =>
        {
            var claimantNames = c.Claimants
                .Select(cl => string.Join(" ", new[] { cl.FirstName, cl.LastName }.Where(s => !string.IsNullOrWhiteSpace(s))))
                .Where(n => !string.IsNullOrWhiteSpace(n));
            var names = new[] { accountName }.Where(n => !string.IsNullOrWhiteSpace(n)).Concat(claimantNames).Distinct().ToList();

            var claimWorksheets = worksheets.Where(w => w.ClaimId == c.Id).ToList();
            var paid = claimWorksheets.SelectMany(w => w.Payments).Sum(p => p.PaymentAmount);
            var reserve = claimWorksheets.SelectMany(w => w.Reserves).Sum(r => r.ReserveAmount);

            return new PolicyClaimRowDto(
                c.ClaimNumber ?? "",
                string.Join(", ", names),
                c.DateOfLoss?.ToString("MM-dd-yyyy"),
                c.MainCauseOfLoss,
                paid + reserve,
                paid,
                c.Status
            );
        }).ToList();
    }

    // ─── Timeline screen ──────────────────────────────────────────────────────────

    public async Task<List<PolicyTimelineEntryDto>> GetTimelineAsync(long clientId, string policyNumber)
    {
        var policy = await _db.Policies
            .FirstOrDefaultAsync(p => p.ClientId == clientId && p.PolicyNumber == policyNumber && p.PolicyStatus != "Draft");
        if (policy == null) return new List<PolicyTimelineEntryDto>();

        var transactionIds = await _db.PolicyTransactions
            .Where(t => t.ClientId == clientId && t.MainPolicyId == policy.Id && t.IsShowInTimeline)
            .Select(t => t.Id)
            .ToListAsync();
        if (transactionIds.Count == 0) return new List<PolicyTimelineEntryDto>();

        var entries = await _db.Audits
            .Where(a => a.ClientId == clientId && a.TransactionId != null && transactionIds.Contains(a.TransactionId.Value))
            .OrderBy(a => a.CreatedDateTime)
            .Select(a => new
            {
                a.ActivityDescription,
                CreatedByName = a.CreatedBy == null ? null : _db.Users.Where(u => u.Id == a.CreatedBy).Select(u => u.FirstName + " " + u.LastName).FirstOrDefault(),
                a.CreatedDateTime,
            })
            .ToListAsync();

        return entries.Select(e => new PolicyTimelineEntryDto(
            e.ActivityDescription ?? "",
            e.CreatedByName ?? "System",
            e.CreatedDateTime.ToString("MM-dd-yyyy"),
            e.CreatedDateTime.ToString("HH:mm")
        )).ToList();
    }

    // ─── Shared helpers ───────────────────────────────────────────────────────

    private static PolicyProducerDto ToProducerDto(PolicyCommission c) => new(
        c.Producer != null ? $"{c.Producer.FirstName} {c.Producer.LastName}".Trim() : "-",
        c.Intermediary?.IntermediaryName,
        c.CommissionPercentage,
        c.TotalCoveragePremium,
        c.AnnualCommission,
        c.Transactions.Where(t => t.IsPaid == true).Sum(t => t.CommissionAmountDue),
        c.Transactions.Where(t => t.TransactionStatus != "Cancelled").Sum(t => t.CommissionAmountDue)
    );

    private IQueryable<PolicyAccountPair> BasePolicyAccountQuery(
        long clientId, string policyType, string insuredTypeLower)
    {
        return _db.Policies
            .Where(p => p.ClientId == clientId && p.PolicyType == policyType)
            .Join(_db.Accounts.Where(a => a.ClientId == clientId),
                p => p.AccountId, a => a.Id,
                (p, a) => new { Policy = p, Account = a })
            .Where(x => x.Account.AccountType != null && x.Account.AccountType.ToLower() == insuredTypeLower)
            .Select(x => new PolicyAccountPair { Policy = x.Policy, Account = x.Account });
    }

    // Named projection type — EF Core's Npgsql provider cannot translate queries that
    // project into ValueTuple/record (constructor call) and later access members inside
    // Count/OrderBy predicates. A plain class with an object initializer (no ctor call in
    // the LINQ tree) plus a final materializing .Select keeps translation working.
    private sealed class PolicyAccountPair
    {
        public required Domain.Entities.Policy Policy { get; init; }
        public required Domain.Entities.Account Account { get; init; }
    }

    // BR-QP-004: INSURED_NAME expression (server.js) — business uses legal name, else first+middle+last
    private static string InsuredName(Domain.Entities.Account a) =>
        string.Equals(a.AccountType, "business", StringComparison.OrdinalIgnoreCase)
            ? (a.LegalBusinessName ?? "").Trim()
            : string.Join(" ", new[] { a.FirstName, a.MiddleName, a.LastName }.Where(v => !string.IsNullOrWhiteSpace(v))).Trim();

    private static string InsuredNameLower(Domain.Entities.Account a) => InsuredName(a).ToLower();

    // ── Endorse Policy: deep-clone the live policy graph into a new Draft policy ────
    // sharing the same PolicyNumber (db/014 relaxed the unique constraint for exactly
    // this). Ledger/money tables (PolicyPaymentTransaction[Extended], CommissionPaymentTransaction,
    // CancellationPaymentTransaction) are intentionally NOT cloned here — those get cloned
    // and relinked only when the endorsement is later Issued.
    public async Task<EndorsePolicyResultDto> CreateEndorsementDraftAsync(
        long clientId, long userId, string policyNumber, EndorsePolicyRequestDto request)
    {
        var source = await _db.Policies
            .Include(p => p.Extended)
            .Include(p => p.Account)
            .Include(p => p.Products)
            .Include(p => p.LimitCoverages)
            .Include(p => p.Premium)
            .Include(p => p.Commissions)
            .Include(p => p.Mortgages)
            .Include(p => p.RiskAddresses).ThenInclude(r => r.RiskInformation)
            .Include(p => p.AdditionalInsureds)
            .Include(p => p.AdditionalOrganisations)
            .Where(p => p.ClientId == clientId && p.PolicyNumber == policyNumber
                        && (p.PolicyStatus == "Active" || p.PolicyStatus == "Bound"))
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException(
                $"Policy '{policyNumber}' is not Active/Bound — cannot endorse.");

        var hasOpenEndorsement = await _db.Policies.AnyAsync(p =>
            p.ClientId == clientId && p.PolicyNumber == policyNumber && p.PolicyStatus == "Draft"
            && (p.PolicyStage == "EndorsementIndividual" || p.PolicyStage == "EndorsementBusiness"));
        if (hasOpenEndorsement)
            throw new InvalidOperationException(
                $"Policy '{policyNumber}' already has an open endorsement in progress.");

        var isIndividual = string.Equals(source.PolicyType, "POLICIESINDIVIDUAL", StringComparison.OrdinalIgnoreCase)
            || string.Equals(source.Account?.AccountType, "Individual", StringComparison.OrdinalIgnoreCase);
        var endorsementCode = isIndividual ? "EndorsementIndividual" : "EndorsementBusiness";

        var quoteNumber = await NextQuoteNumberAsync(clientId);
        var now = DateTime.UtcNow;

        // Extract additional fields from prior submission data if source policy is missing them
        string? extractedAddress = source.Address;
        DateOnly? extractedEffDate = source.EffectiveDate;
        DateOnly? extractedExpDate = source.ExpiryDate;
        string? extractedState = source.StateProvince;

        if (!string.IsNullOrEmpty(source.QuoteNumber))
        {
            var priorSubmission = await _db.Submissions
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.ClientId == clientId && s.Id == source.QuoteNumber);

            if (priorSubmission != null && !string.IsNullOrEmpty(priorSubmission.Data))
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(priorSubmission.Data);
                    var root = doc.RootElement;
                    var form = root.TryGetProperty("form", out var formElem) ? formElem : root;

                    // Extract dates with DD-MM-YYYY parsing
                    if (extractedEffDate == null && form.TryGetProperty("effectiveDate", out var effDateElem) && effDateElem.ValueKind != JsonValueKind.Null)
                    {
                        var dateStr = effDateElem.GetString()?.Trim();
                        if (!string.IsNullOrEmpty(dateStr))
                        {
                            var datePart = dateStr.Split()[0];
                            if (DateOnly.TryParse(datePart, System.Globalization.CultureInfo.GetCultureInfo("en-GB"), System.Globalization.DateTimeStyles.None, out var effDate))
                                extractedEffDate = effDate;
                            else if (DateOnly.TryParse(dateStr, out var effDate2))
                                extractedEffDate = effDate2;
                        }
                    }

                    if (extractedExpDate == null && form.TryGetProperty("expirationDate", out var expDateElem) && expDateElem.ValueKind != JsonValueKind.Null)
                    {
                        var dateStr = expDateElem.GetString()?.Trim();
                        if (!string.IsNullOrEmpty(dateStr))
                        {
                            var datePart = dateStr.Split()[0];
                            if (DateOnly.TryParse(datePart, System.Globalization.CultureInfo.GetCultureInfo("en-GB"), System.Globalization.DateTimeStyles.None, out var expDate))
                                extractedExpDate = expDate;
                            else if (DateOnly.TryParse(dateStr, out var expDate2))
                                extractedExpDate = expDate2;
                        }
                    }

                    // Extract address and state
                    if (string.IsNullOrEmpty(extractedAddress) && form.TryGetProperty("addressLine1", out var addrElem) && addrElem.ValueKind != JsonValueKind.Null)
                        extractedAddress = addrElem.GetString();
                    if (string.IsNullOrEmpty(extractedState) && form.TryGetProperty("state", out var stateElem) && stateElem.ValueKind != JsonValueKind.Null)
                        extractedState = stateElem.GetString();
                }
                catch (Exception ex)
                {
                    System.Console.WriteLine($"[CreateEndorsementDraftAsync] Error extracting prior submission data: {ex.Message}");
                }
            }
        }

        // New Account clone — every endorsement gets its own Account row so edits made
        // while the draft is in progress never mutate the live policy's account.
        var newAccount = CloneAccount(source.Account, clientId, userId, now);

        var draft = new Domain.Entities.Policy
        {
            PolicyNumber = source.PolicyNumber,
            InsuredName = source.InsuredName,
            Address = extractedAddress,
            EffectiveDate = extractedEffDate,
            Lob = source.Lob,
            SubProduct = source.SubProduct,
            ClientId = clientId,
            CreatedBy = userId,
            CreatedOn = now,
            QuoteNumber = quoteNumber,
            IntermediaryId = source.IntermediaryId,
            ProducerId = source.ProducerId,
            Account = newAccount,
            PolicyStage = endorsementCode,
            PolicyTerm = source.PolicyTerm,
            LockSubmission = false,
            LastStep = 1,
            DoNotRenew = source.DoNotRenew,
            PolicyIssuedOn = source.PolicyIssuedOn,
            WritingCompany = source.WritingCompany,
            InsuranceType = source.InsuranceType,
            Country = source.Country,
            StateProvince = extractedState ?? source.StateProvince,
            IsSinglePolicy = source.IsSinglePolicy,
            IsQuickQuote = source.IsQuickQuote,
            QuoteCreationDate = DateOnly.FromDateTime(now),
            PolicyType = "ENDORSEMENT",
            PolicyStatus = "Draft",
            ExpiryDate = extractedExpDate ?? source.ExpiryDate,
            IntermediaryType = source.IntermediaryType,
        };
        _db.Policies.Add(draft);

        draft.Extended = new Domain.Entities.PolicyExtended
        {
            ClientId = clientId,
            PrimaryInsuredType = source.Extended?.PrimaryInsuredType,
            PriorPolicyId = source.Id,
            EndorsementEffectiveDate = request.TransactionEffectiveDate,
            Comments = request.SummaryOfChanges,
            IsPremiumBearingEndorsement = null,
            CreatedBy = userId,
            CreatedOn = now,
        };

        CloneChildEntities(source, draft, clientId, userId, now, includePremiumAndCommission: true);

        // Ensure RiskAddresses have state/city/zip from prior submission if missing
        if (!string.IsNullOrEmpty(source.QuoteNumber))
        {
            var priorSubmission = await _db.Submissions
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.ClientId == clientId && s.Id == source.QuoteNumber);

            if (priorSubmission != null && !string.IsNullOrEmpty(priorSubmission.Data))
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(priorSubmission.Data);
                    var root = doc.RootElement;
                    var form = root.TryGetProperty("form", out var formElem) ? formElem : root;

                    // Extract location data from form
                    string? riskCity = null;
                    string? riskState = null;
                    string? riskZip = null;
                    string? riskCountry = null;
                    string? riskAddressLine1 = null;
                    string? riskAddressLine2 = null;

                    if (form.TryGetProperty("city", out var cityElem) && cityElem.ValueKind != JsonValueKind.Null)
                        riskCity = cityElem.GetString();
                    if (form.TryGetProperty("state", out var stateElem) && stateElem.ValueKind != JsonValueKind.Null)
                        riskState = stateElem.GetString();
                    if (form.TryGetProperty("zip", out var zipElem) && zipElem.ValueKind != JsonValueKind.Null)
                        riskZip = zipElem.GetString();
                    if (form.TryGetProperty("country", out var countryElem) && countryElem.ValueKind != JsonValueKind.Null)
                        riskCountry = countryElem.GetString();
                    if (form.TryGetProperty("addressLine1", out var addr1Elem) && addr1Elem.ValueKind != JsonValueKind.Null)
                        riskAddressLine1 = addr1Elem.GetString();
                    if (form.TryGetProperty("addressLine2", out var addr2Elem) && addr2Elem.ValueKind != JsonValueKind.Null)
                        riskAddressLine2 = addr2Elem.GetString();

                    // Update first RiskAddress or create one if missing
                    var riskAddress = draft.RiskAddresses.FirstOrDefault();
                    if (riskAddress != null)
                    {
                        if (string.IsNullOrEmpty(riskAddress.State) && !string.IsNullOrEmpty(riskState))
                            riskAddress.State = riskState;
                        if (string.IsNullOrEmpty(riskAddress.City) && !string.IsNullOrEmpty(riskCity))
                            riskAddress.City = riskCity;
                        if (string.IsNullOrEmpty(riskAddress.ZipCode) && !string.IsNullOrEmpty(riskZip))
                            riskAddress.ZipCode = riskZip;
                        if (string.IsNullOrEmpty(riskAddress.AddressLine1) && !string.IsNullOrEmpty(riskAddressLine1))
                            riskAddress.AddressLine1 = riskAddressLine1;
                        if (string.IsNullOrEmpty(riskAddress.AddressLine2) && !string.IsNullOrEmpty(riskAddressLine2))
                            riskAddress.AddressLine2 = riskAddressLine2;
                        if (string.IsNullOrEmpty(riskAddress.Country) && !string.IsNullOrEmpty(riskCountry))
                            riskAddress.Country = riskCountry;
                    }
                    else if (!string.IsNullOrEmpty(riskState) || !string.IsNullOrEmpty(riskCity))
                    {
                        // Create a new RiskAddress if none exists but we have data
                        var newRiskAddress = new Domain.Entities.RiskAddress
                        {
                            ClientId = clientId,
                            AddressType = "Risk",
                            AddressLine1 = riskAddressLine1,
                            AddressLine2 = riskAddressLine2,
                            Country = riskCountry ?? "United States",
                            State = riskState,
                            City = riskCity,
                            ZipCode = riskZip,
                            IsActive = true,
                            IsManual = true,
                            CreatedBy = userId,
                            CreatedOn = now,
                        };
                        draft.RiskAddresses.Add(newRiskAddress);
                    }
                }
                catch (Exception ex)
                {
                    System.Console.WriteLine($"[CreateEndorsementDraftAsync] Error populating RiskAddress: {ex.Message}");
                }
            }
        }

        await _db.SaveChangesAsync();

        return new EndorsePolicyResultDto(draft.Id, draft.PolicyNumber, quoteNumber);
    }

    // Shared by Endorse Policy and Cancel/Rewrite Policy: every derived-policy transaction
    // gets its own Account row so edits while the draft is in progress never mutate the
    // source policy's account.
    private Domain.Entities.Account? CloneAccount(Domain.Entities.Account? source, long clientId, long userId, DateTime now)
    {
        if (source == null) return null;
        var newAccount = new Domain.Entities.Account
        {
            ClientId = clientId,
            AccountCode = source.AccountCode,
            Status = source.Status,
            AccountType = source.AccountType,
            FirstName = source.FirstName,
            MiddleName = source.MiddleName,
            LastName = source.LastName,
            DateOfBirth = source.DateOfBirth,
            Gender = source.Gender,
            ProducerType = source.ProducerType,
            IntermediaryId = source.IntermediaryId,
            ProducerId = source.ProducerId,
            LegalBusinessName = source.LegalBusinessName,
            DoingBusinessAs = source.DoingBusinessAs,
            LegalEntityType = source.LegalEntityType,
            DateBusinessStarted = source.DateBusinessStarted,
            IndustryType = source.IndustryType,
            IsDraft = true,
            Suffix = source.Suffix,
            CreatedBy = userId,
            CreatedOn = now,
        };
        _db.Accounts.Add(newAccount);
        return newAccount;
    }

    // Shared by Endorse Policy and Cancel/Rewrite Policy: clones Products, LimitCoverages,
    // Mortgages (non-deleted), AdditionalInsureds/Organisations, and RiskAddresses+RiskInformation
    // onto `draft`. Premium/Commission cloning is optional — Cancel/Rewrite's new policy is a
    // fresh New Business draft that gets its own premium/commission later in the wizard, so it
    // skips that part (matches the disabled steps in the source OutSystems action).
    private void CloneChildEntities(
        Domain.Entities.Policy source, Domain.Entities.Policy draft,
        long clientId, long userId, DateTime now, bool includePremiumAndCommission)
    {
        foreach (var p in source.Products)
        {
            draft.Products.Add(new Domain.Entities.PolicyProduct
            {
                ClientId = clientId,
                ProductId = p.ProductId,
                SubProductId = p.SubProductId,
                State = p.State,
            });
        }

        foreach (var lc in source.LimitCoverages)
        {
            draft.LimitCoverages.Add(new Domain.Entities.PolicyLimitCoverage
            {
                ClientId = clientId,
                DwellingAssetLimit = lc.DwellingAssetLimit,
                AppurtenantStructureAsset = lc.AppurtenantStructureAsset,
                PersonalBelongingsAsset = lc.PersonalBelongingsAsset,
                DwellingOccupancy = lc.DwellingOccupancy,
                CalculatedPremium = lc.CalculatedPremium,
                Tiv = lc.Tiv,
                PhysicalDamageDeductible = lc.PhysicalDamageDeductible,
                CoverageLevel = lc.CoverageLevel,
                LiabilityCoverage = lc.LiabilityCoverage,
                ExcessBlanketPl = lc.ExcessBlanketPl,
                CoveredLiabilitySir = lc.CoveredLiabilitySir,
                SinkholeCatastrophicGroundCollapse = lc.SinkholeCatastrophicGroundCollapse,
                Earthquake = lc.Earthquake,
                Flood = lc.Flood,
                WindHail = lc.WindHail,
                WildFire = lc.WildFire,
                ResidentWorkerNfm = lc.ResidentWorkerNfm,
                SmallScaleFarmingEndorsement = lc.SmallScaleFarmingEndorsement,
                LandlordEndorsement = lc.LandlordEndorsement,
                HomeOfficeEndorsement = lc.HomeOfficeEndorsement,
                PriorPolicyPeriodPremium = lc.PriorPolicyPeriodPremium,
                RateModification = lc.RateModification,
                ExcessBlanketPlValue = lc.ExcessBlanketPlValue,
                SinkholeCatastrophicGroundCollapseValue = lc.SinkholeCatastrophicGroundCollapseValue,
                EarthquakeValue = lc.EarthquakeValue,
                FloodValue = lc.FloodValue,
                WindHailValue = lc.WindHailValue,
                WildFireValue = lc.WildFireValue,
                ResidentWorkerNfmValue = lc.ResidentWorkerNfmValue,
                SmallScaleFarmingEndorsementValue = lc.SmallScaleFarmingEndorsementValue,
                LandlordEndorsementValue = lc.LandlordEndorsementValue,
                HomeOfficeEndorsementValue = lc.HomeOfficeEndorsementValue,
                BasePremium = lc.BasePremium,
                TotalPremiumWithFee = lc.TotalPremiumWithFee,
                TotalPremiumWithoutRateModification = lc.TotalPremiumWithoutRateModification,
                CreatedBy = userId,
                CreatedOn = now,
            });
        }

        if (includePremiumAndCommission)
        {
            if (source.Premium is { } srcPremium)
            {
                draft.Premium = new Domain.Entities.PolicyPremium
                {
                    ClientId = clientId,
                    PaymentFrequency = srcPremium.PaymentFrequency,
                    ResponsibleParty = srcPremium.ResponsibleParty,
                    NumberOfInstallments = srcPremium.NumberOfInstallments,
                    TotalInstallmentFee = srcPremium.TotalInstallmentFee,
                    StampingFee = srcPremium.StampingFee,
                    PolicyFees = srcPremium.PolicyFees,
                    IsPolicyFullyPaid = false,
                    IsPaymentRequiredToBind = srcPremium.IsPaymentRequiredToBind,
                    TotalTax = srcPremium.TotalTax,
                    TotalPremiumWithoutInstallmentFee = srcPremium.TotalPremiumWithoutInstallmentFee,
                    TotalPremiumWithInstallmentFee = srcPremium.TotalPremiumWithInstallmentFee,
                    ModeOfPaymentToUse = srcPremium.ModeOfPaymentToUse,
                    TotalCoveragePremium = srcPremium.TotalCoveragePremium,
                    CreatedBy = userId,
                    CreatedOn = now,
                };
            }

            foreach (var c in source.Commissions.Where(c => c.IsCancelled != true))
            {
                draft.Commissions.Add(new Domain.Entities.PolicyCommission
                {
                    ClientId = clientId,
                    IntermediaryId = c.IntermediaryId,
                    ProducerId = c.ProducerId,
                    CommissionPercentage = c.CommissionPercentage,
                    InstallmentCommission = c.InstallmentCommission,
                    AnnualCommission = c.AnnualCommission,
                    TotalCoveragePremium = c.TotalCoveragePremium,
                    PaymentFrequency = c.PaymentFrequency,
                    NumberOfInstallments = c.NumberOfInstallments,
                    CreatedBy = userId,
                    CreatedOn = now,
                });
            }
        }

        foreach (var m in source.Mortgages.Where(m => m.IsDeleted != true))
        {
            draft.Mortgages.Add(new Domain.Entities.PolicyMortgage
            {
                ClientId = clientId,
                MortgageName = m.MortgageName,
                LoanNumber = m.LoanNumber,
                MortgageServiceCompany = m.MortgageServiceCompany,
                TelephoneNumber = m.TelephoneNumber,
                TelephoneNumberCC = m.TelephoneNumberCC,
                Extension = m.Extension,
                AltTelephoneNumber = m.AltTelephoneNumber,
                AltTelephoneNumberCC = m.AltTelephoneNumberCC,
                EmailId = m.EmailId,
                GoogleAddress = m.GoogleAddress,
                AddressLine1 = m.AddressLine1,
                AddressLine2 = m.AddressLine2,
                Country = m.Country,
                State = m.State,
                City = m.City,
                ZipCode = m.ZipCode,
                Latitude = m.Latitude,
                Longitude = m.Longitude,
                County = m.County,
                IsManual = m.IsManual,
                LenderType = m.LenderType,
                LoanType = m.LoanType,
                CoveredAsset = m.CoveredAsset,
                IsDeleted = false,
                RecordNumber = m.RecordNumber,
                CreatedBy = userId,
                CreatedOn = now,
            });
        }

        foreach (var ai in source.AdditionalInsureds)
        {
            draft.AdditionalInsureds.Add(new Domain.Entities.AdditionalInsured
            {
                ClientId = clientId,
                FirstName = ai.FirstName,
                MiddleName = ai.MiddleName,
                LastName = ai.LastName,
                DateOfBirth = ai.DateOfBirth,
                Relationship = ai.Relationship,
                TelephoneNumber = ai.TelephoneNumber,
                TelephoneNumberCC = ai.TelephoneNumberCC,
                AltTelephoneNumber = ai.AltTelephoneNumber,
                AltTelephoneNumberCC = ai.AltTelephoneNumberCC,
                Email = ai.Email,
                Gender = ai.Gender,
                IsManual = ai.IsManual,
                InsuredType = ai.InsuredType,
                Suffix = ai.Suffix,
                Dba = ai.Dba,
                RecordNumber = ai.RecordNumber,
                CreatedBy = userId,
                CreatedOn = now,
            });
        }

        foreach (var ao in source.AdditionalOrganisations)
        {
            draft.AdditionalOrganisations.Add(new Domain.Entities.AdditionalOrganisation
            {
                ClientId = clientId,
                FirstName = ao.FirstName,
                MiddleName = ao.MiddleName,
                LastName = ao.LastName,
                OrganisationName = ao.OrganisationName,
                TelephoneNumber = ao.TelephoneNumber,
                TelephoneNumberCC = ao.TelephoneNumberCC,
                AltTelephoneNumber = ao.AltTelephoneNumber,
                AltTelephoneNumberCC = ao.AltTelephoneNumberCC,
                Email = ao.Email,
                Extension = ao.Extension,
                OrganisationType = ao.OrganisationType,
                RecordNumber = ao.RecordNumber,
                CreatedBy = userId,
                CreatedOn = now,
            });
        }

        // Risk addresses + their risk-information rows: clone address first so the new
        // PolicyRiskInformation rows can remap RiskAddressId to the *new* address's id.
        foreach (var ra in source.RiskAddresses)
        {
            var newRa = new Domain.Entities.RiskAddress
            {
                ClientId = clientId,
                AddressType = ra.AddressType,
                AddressLine1 = ra.AddressLine1,
                AddressLine2 = ra.AddressLine2,
                Country = ra.Country,
                State = ra.State,
                City = ra.City,
                ZipCode = ra.ZipCode,
                Latitude = ra.Latitude,
                Longitude = ra.Longitude,
                County = ra.County,
                IsActive = ra.IsActive,
                IsManual = ra.IsManual,
                GoogleAddress = ra.GoogleAddress,
                LocationNumber = ra.LocationNumber,
                IsAddedFromAccount = ra.IsAddedFromAccount,
                CreatedBy = userId,
                CreatedOn = now,
            };
            draft.RiskAddresses.Add(newRa);

            foreach (var ri in ra.RiskInformation)
            {
                draft.RiskInformation.Add(new Domain.Entities.PolicyRiskInformation
                {
                    ClientId = clientId,
                    RiskAddress = newRa,
                    BuildingFloodElevation = ri.BuildingFloodElevation,
                    BuildingType = ri.BuildingType,
                    BuildingDecription = ri.BuildingDecription,
                    HexZoneLowerResolution = ri.HexZoneLowerResolution,
                    HexZoneHigerResolution = ri.HexZoneHigerResolution,
                    FloodZone = ri.FloodZone,
                    ConstructionType = ri.ConstructionType,
                    NumberOfStories = ri.NumberOfStories,
                    SquareFootage = ri.SquareFootage,
                    RoofYear = ri.RoofYear,
                    RoofShape = ri.RoofShape,
                    RoofCovering = ri.RoofCovering,
                    PresenceOfBasement = ri.PresenceOfBasement,
                    Status = ri.Status,
                    StatusTimeStamp = ri.StatusTimeStamp,
                    ApprovalCounter = ri.ApprovalCounter,
                    ApprovalExpirationDate = ri.ApprovalExpirationDate,
                    WritingCompany = ri.WritingCompany,
                    YearBuilt = ri.YearBuilt,
                    NotApprovedCounter = ri.NotApprovedCounter,
                    ResidenceType = ri.ResidenceType,
                    RoofAge = ri.RoofAge,
                    RoofArchitectureType = ri.RoofArchitectureType,
                    FoundationType = ri.FoundationType,
                    CreatedBy = userId,
                    CreatedOn = now,
                });
            }
        }
    }

    // Quote Review "Review/Compare Updated Information": diff the open endorsement draft
    // (Draft status, EndorsementIndividual/EndorsementBusiness stage) against the prior
    // policy it was cloned from (PolicyExtended.PriorPolicyId — see CreateEndorsementDraftAsync).
    // Returns one row per field that actually differs; empty list if there's no open draft,
    // no prior policy on record, or nothing has changed yet.
    public async Task<List<EndorsementFieldChangeDto>> GetEndorsementChangesAsync(long clientId, string policyNumber)
    {
        var draft = await _db.Policies
            .Include(p => p.Extended)
            .Include(p => p.Account)
            .Include(p => p.LimitCoverages)
            .Include(p => p.RiskAddresses).ThenInclude(r => r.RiskInformation)
            .Where(p => p.ClientId == clientId && p.PolicyNumber == policyNumber && p.PolicyStatus == "Draft"
                        && (p.PolicyStage == "EndorsementIndividual" || p.PolicyStage == "EndorsementBusiness"))
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync();

        var priorPolicyId = draft?.Extended?.PriorPolicyId;
        if (draft == null || priorPolicyId == null)
            return [];

        var prior = await _db.Policies
            .Include(p => p.Account)
            .Include(p => p.LimitCoverages)
            .Include(p => p.RiskAddresses).ThenInclude(r => r.RiskInformation)
            .FirstOrDefaultAsync(p => p.Id == priorPolicyId.Value && p.ClientId == clientId);

        if (prior == null)
            return [];

        var draftLc = draft.LimitCoverages.FirstOrDefault();
        var priorLc = prior.LimitCoverages.FirstOrDefault();
        var draftRisk = draft.RiskAddresses.FirstOrDefault();
        var priorRisk = prior.RiskAddresses.FirstOrDefault();
        var draftRiskInfo = draftRisk?.RiskInformation.FirstOrDefault();
        var priorRiskInfo = priorRisk?.RiskInformation.FirstOrDefault();

        var rows = new List<EndorsementFieldChangeDto>();

        void Add(string panel, string field, object? priorVal, object? updatedVal)
        {
            var p = FormatFieldValue(priorVal);
            var u = FormatFieldValue(updatedVal);
            if (p != u) rows.Add(new EndorsementFieldChangeDto(panel, field, p, u));
        }

        // Policy Information
        Add("Policy Information", "Effective Date", prior.EffectiveDate, draft.EffectiveDate);
        Add("Policy Information", "Expiration Date", prior.ExpiryDate, draft.ExpiryDate);
        Add("Policy Information", "Policy Term", prior.PolicyTerm, draft.PolicyTerm);
        Add("Policy Information", "Line of Business", prior.Lob, draft.Lob);

        // Insured / Contact Detail (Account)
        Add("Contact Information", "Organization Name", prior.Account?.LegalBusinessName, draft.Account?.LegalBusinessName);
        Add("Contact Information", "Doing Business As", prior.Account?.DoingBusinessAs, draft.Account?.DoingBusinessAs);
        Add("Contact Information", "First Name", prior.Account?.FirstName, draft.Account?.FirstName);
        Add("Contact Information", "Last Name", prior.Account?.LastName, draft.Account?.LastName);

        // Contact detail phone/email lives on the primary insured — fall back through
        // AdditionalInsureds only if ever needed; Account has no phone/email columns today,
        // so pull from the first AdditionalInsured marked "Primary Insured" instead.
        var draftPrimary = await _db.AdditionalInsureds
            .Where(a => a.PolicyId == draft.Id && a.ClientId == clientId && a.Relationship == "Primary Insured")
            .FirstOrDefaultAsync();
        var priorPrimary = await _db.AdditionalInsureds
            .Where(a => a.PolicyId == prior.Id && a.ClientId == clientId && a.Relationship == "Primary Insured")
            .FirstOrDefaultAsync();
        Add("Contact Information", "Alternative Telephone Number", priorPrimary?.AltTelephoneNumber, draftPrimary?.AltTelephoneNumber);
        Add("Contact Information", "Email ID", priorPrimary?.Email, draftPrimary?.Email);
        Add("Contact Information", "Telephone Number", priorPrimary?.TelephoneNumber, draftPrimary?.TelephoneNumber);

        // Risk Information & Location
        Add("Location", "Address Line 1", priorRisk?.AddressLine1, draftRisk?.AddressLine1);
        Add("Location", "Address Line 2", priorRisk?.AddressLine2, draftRisk?.AddressLine2);
        Add("Location", "City", priorRisk?.City, draftRisk?.City);
        Add("Location", "State", priorRisk?.State, draftRisk?.State);
        Add("Location", "County", priorRisk?.County, draftRisk?.County);
        Add("Location", "Zip Code", priorRisk?.ZipCode, draftRisk?.ZipCode);
        Add("Risk Information", "Building Type", priorRiskInfo?.BuildingType, draftRiskInfo?.BuildingType);
        Add("Risk Information", "Number Of Stories", priorRiskInfo?.NumberOfStories, draftRiskInfo?.NumberOfStories);
        Add("Risk Information", "Square Footage", priorRiskInfo?.SquareFootage, draftRiskInfo?.SquareFootage);
        Add("Risk Information", "Construction Type", priorRiskInfo?.ConstructionType, draftRiskInfo?.ConstructionType);
        Add("Risk Information", "Year Built", priorRiskInfo?.YearBuilt, draftRiskInfo?.YearBuilt);
        Add("Risk Information", "Roof Shape", priorRiskInfo?.RoofShape, draftRiskInfo?.RoofShape);
        Add("Risk Information", "Roof Covering", priorRiskInfo?.RoofCovering, draftRiskInfo?.RoofCovering);
        Add("Risk Information", "Flood Zone", priorRiskInfo?.FloodZone, draftRiskInfo?.FloodZone);

        // Limits & Coverages / Premium
        Add("Limits & Coverages", "Dwelling Asset Limit (DAL)", priorLc?.DwellingAssetLimit, draftLc?.DwellingAssetLimit);
        Add("Limits & Coverages", "Appurtenant Structure Assets Limit", priorLc?.AppurtenantStructureAsset, draftLc?.AppurtenantStructureAsset);
        Add("Limits & Coverages", "Personal Assets (Other than Fixed Assets) Limit", priorLc?.PersonalBelongingsAsset, draftLc?.PersonalBelongingsAsset);
        Add("Limits & Coverages", "Dwelling Occupancy Disruption Limit", priorLc?.DwellingOccupancy, draftLc?.DwellingOccupancy);
        Add("Limits & Coverages", "Physical Damage Deductible", priorLc?.PhysicalDamageDeductible, draftLc?.PhysicalDamageDeductible);
        Add("Limits & Coverages", "Coverage Level", priorLc?.CoverageLevel, draftLc?.CoverageLevel);
        Add("Limits & Coverages", "Amount of Liability Coverage", priorLc?.LiabilityCoverage, draftLc?.LiabilityCoverage);
        Add("Limits & Coverages", "Total Insured Values", priorLc?.Tiv, draftLc?.Tiv);
        Add("Limits & Coverages", "Base Premium", priorLc?.BasePremium, draftLc?.BasePremium);

        return rows;
    }

    // Finalize Quote's Summary "Previous Amount" column: same prior-policy lookup as
    // GetEndorsementChangesAsync above, but returns only the raw inputs the frontend's
    // calculatePlanAmounts()/STATE_TAX/getCoveragePremiums() need to compute the prior
    // policy's own Coverage Premium/Taxes/Fees/Total — not a diff, not the formula itself.
    public async Task<EndorsementPriorPremiumFormDto?> GetEndorsementPriorPremiumFormAsync(long clientId, string policyNumber)
    {
        var draft = await _db.Policies
            .Include(p => p.Extended)
            .Include(p => p.Account)
            .Where(p => p.ClientId == clientId && p.PolicyNumber == policyNumber && p.PolicyStatus == "Draft"
                        && (p.PolicyStage == "EndorsementIndividual" || p.PolicyStage == "EndorsementBusiness"))
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync();

        var priorPolicyId = draft?.Extended?.PriorPolicyId;
        if (draft == null || priorPolicyId == null)
            return null;

        var prior = await _db.Policies
            .Include(p => p.Account)
            .Include(p => p.LimitCoverages)
            .Include(p => p.RiskAddresses)
            .Include(p => p.Premium)
            .FirstOrDefaultAsync(p => p.Id == priorPolicyId.Value && p.ClientId == clientId);

        if (prior == null)
            return null;

        var priorLc = prior.LimitCoverages.FirstOrDefault();
        var priorRisk = prior.RiskAddresses.FirstOrDefault();
        var isBusiness = string.Equals(prior.Account?.AccountType, "Business", StringComparison.OrdinalIgnoreCase);

        var form = new Dictionary<string, object?>
        {
            ["screenCode"] = isBusiness ? "ENDORSEMENTBUSINESS" : "ENDORSEMENTINDIVIDUAL",
            ["insuredType"] = isBusiness ? "Business" : "Individual",
            ["state"] = priorRisk?.State,
            ["coverageLevel"] = priorLc?.CoverageLevel,
            ["selectedPlan"] = priorLc?.CoverageLevel,
            ["deductible"] = FormatFieldValue(priorLc?.PhysicalDamageDeductible),
            ["policyFee"] = FormatFieldValue(prior.Premium?.PolicyFees),
            ["wildfire"] = priorLc?.WildFire,
            ["windHail"] = priorLc?.WindHail,
            ["sinkhole"] = priorLc?.SinkholeCatastrophicGroundCollapse,
            ["excessBlanketLiabilities"] = priorLc?.ExcessBlanketPl,
            ["earthquake"] = priorLc?.Earthquake,
            ["flood"] = priorLc?.Flood,
            ["resWorkerMedical"] = priorLc?.ResidentWorkerNfm,
            ["farmingEndorsement"] = priorLc?.SmallScaleFarmingEndorsement,
            ["landlordEndorsement"] = priorLc?.LandlordEndorsement,
            ["homeOfficeEndorsement"] = priorLc?.HomeOfficeEndorsement,
        };

        return new EndorsementPriorPremiumFormDto(form);
    }

    // Hydrates the wizard's FormState from the endorsement draft's real cloned data (see
    // EndorsementDraftFormDto) — field names below match NewSubmission.tsx's FormState/
    // LocationItem/MortgageItem/AdditionalInsuredItem/AdditionalOrgItem exactly, so the
    // frontend can hand this straight to createSubmission as the initial dataJson payload.
    public async Task<EndorsementDraftFormDto?> GetEndorsementDraftFormAsync(long clientId, string policyNumber)
    {
        var draft = await _db.Policies
            .Include(p => p.Extended)
            .Include(p => p.Account)
            .Include(p => p.LimitCoverages)
            .Include(p => p.Premium)
            .Include(p => p.Mortgages.Where(m => m.IsDeleted != true))
            .Include(p => p.AdditionalInsureds)
            .Include(p => p.AdditionalOrganisations)
            .Include(p => p.RiskAddresses).ThenInclude(r => r.RiskInformation)
            .Include(p => p.Intermediary)
            .Include(p => p.Producer)
            .Where(p => p.ClientId == clientId && p.PolicyNumber == policyNumber && p.PolicyStatus == "Draft"
                        && (p.PolicyStage == "EndorsementIndividual" || p.PolicyStage == "EndorsementBusiness"))
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync();

        if (draft == null) return null;

        var account = draft.Account;
        var lc = draft.LimitCoverages.FirstOrDefault();
        var premium = draft.Premium;
        var risk = draft.RiskAddresses.FirstOrDefault();
        var riskInfo = risk?.RiskInformation.FirstOrDefault();
        var primaryInsured = draft.AdditionalInsureds.FirstOrDefault(a => a.Relationship == "Primary Insured");
        var isBusiness = string.Equals(account?.AccountType, "Business", StringComparison.OrdinalIgnoreCase);
        var screenCode = isBusiness ? "ENDORSEMENTBUSINESS" : "ENDORSEMENTINDIVIDUAL";

        var form = new Dictionary<string, object?>
        {
            ["screenCode"] = screenCode,
            ["policyType"] = "ENDORSEMENT",
            ["insuredType"] = isBusiness ? "Business" : "Individual",
            ["policyNumber"] = draft.PolicyNumber,
            ["priorPolicyNumber"] = draft.PolicyNumber,
            ["quoteNumber"] = draft.QuoteNumber,
            ["recordStatus"] = "Draft",
            ["effectiveDate"] = FormatFieldValue(draft.EffectiveDate),
            ["expirationDate"] = FormatFieldValue(draft.ExpiryDate),
            ["endorsementEffectiveDate"] = FormatFieldValue(draft.Extended?.EndorsementEffectiveDate),
            ["policyTerm"] = draft.PolicyTerm,
            ["lob"] = draft.Lob,
            ["subProduct"] = draft.SubProduct,
            ["writingCompany"] = draft.WritingCompany,
            ["lockSubmission"] = draft.LockSubmission,

            // Producer / Intermediary
            ["brokerageFirm"] = draft.Intermediary?.IntermediaryName,
            ["brokerageFirmId"] = draft.IntermediaryId,
            ["producerName"] = draft.Producer != null ? $"{draft.Producer.FirstName} {draft.Producer.LastName}".Trim() : null,
            ["producerId"] = draft.ProducerId,

            // Insured (Account + primary AdditionalInsured for contact detail)
            ["firstName"] = account?.FirstName,
            ["middleName"] = account?.MiddleName,
            ["lastName"] = account?.LastName,
            ["organizationName"] = account?.LegalBusinessName,
            ["doingBusinessAs"] = account?.DoingBusinessAs,
            ["phone"] = primaryInsured?.TelephoneNumber,
            ["altPhone"] = primaryInsured?.AltTelephoneNumber,
            ["phoneCountry"] = primaryInsured?.TelephoneNumberCC,
            ["altPhoneCountry"] = primaryInsured?.AltTelephoneNumberCC,
            ["email"] = primaryInsured?.Email,

            // Location (primary risk address)
            ["addressLine1"] = risk?.AddressLine1,
            ["addressLine2"] = risk?.AddressLine2,
            ["country"] = risk?.Country,
            ["state"] = risk?.State,
            ["city"] = risk?.City,
            ["county"] = risk?.County,
            ["zip"] = risk?.ZipCode,
            ["latitude"] = risk?.Latitude,
            ["longitude"] = risk?.Longitude,
            ["googleAddress"] = risk?.GoogleAddress,

            // Risk Information
            ["buildingFloodElevation"] = riskInfo?.BuildingFloodElevation,
            ["buildingType"] = riskInfo?.BuildingType,
            ["buildingDescription"] = riskInfo?.BuildingDecription,
            ["hexZoneLR"] = riskInfo?.HexZoneLowerResolution,
            ["hexZoneHR"] = riskInfo?.HexZoneHigerResolution,
            ["floodZone"] = riskInfo?.FloodZone,
            ["roofYear"] = riskInfo?.RoofYear,
            ["roofConstructionType"] = riskInfo?.ConstructionType,

            // Limits & Coverages (kept in the payload even though the endorsement wizard
            // hides this step — Quote Review's Limit & Premium Summary card still reads
            // these same FormState fields)
            ["dwellingLimit"] = FormatFieldValue(lc?.DwellingAssetLimit),
            ["appurtenantLimit"] = FormatFieldValue(lc?.AppurtenantStructureAsset),
            ["personalAssetsLimit"] = FormatFieldValue(lc?.PersonalBelongingsAsset),
            ["occupancyDisruptionLimit"] = FormatFieldValue(lc?.DwellingOccupancy),
            ["deductible"] = FormatFieldValue(lc?.PhysicalDamageDeductible),
            ["coverageLevel"] = lc?.CoverageLevel,
            ["liabilityAmount"] = lc?.LiabilityCoverage,
            ["excessBlanketLiabilities"] = lc?.ExcessBlanketPl,
            ["sinkhole"] = lc?.SinkholeCatastrophicGroundCollapse,
            ["earthquake"] = lc?.Earthquake,
            ["flood"] = lc?.Flood,
            ["windHail"] = lc?.WindHail,
            ["wildfire"] = lc?.WildFire,
            ["resWorkerMedical"] = lc?.ResidentWorkerNfm,
            ["farmingEndorsement"] = lc?.SmallScaleFarmingEndorsement,
            ["landlordEndorsement"] = lc?.LandlordEndorsement,
            ["homeOfficeEndorsement"] = lc?.HomeOfficeEndorsement,
            ["priorPolicyPremium"] = FormatFieldValue(lc?.PriorPolicyPeriodPremium),
            ["basePremium"] = FormatFieldValue(lc?.BasePremium),
            ["rateModification"] = FormatFieldValue(lc?.RateModification),
            ["totalInsuredValues"] = FormatFieldValue(lc?.Tiv),

            // Premium / Billing
            ["paymentFrequency"] = premium?.PaymentFrequency,
            ["responsibleParty"] = premium?.ResponsibleParty,
            ["policyFee"] = FormatFieldValue(premium?.PolicyFees),
            ["modeOfPayment"] = premium?.ModeOfPaymentToUse,
            ["paymentRequiredToBind"] = premium?.IsPaymentRequiredToBind,
        };

        var locations = draft.RiskAddresses.Select(ra => new Dictionary<string, object?>
        {
            ["id"] = ra.Id,
            ["addressLine1"] = ra.AddressLine1,
            ["addressLine2"] = ra.AddressLine2,
            ["country"] = ra.Country,
            ["state"] = ra.State,
            ["city"] = ra.City,
            ["county"] = ra.County,
            ["zip"] = ra.ZipCode,
            ["latitude"] = ra.Latitude,
            ["longitude"] = ra.Longitude,
        }).ToList();

        var mortgages = draft.Mortgages.Select(m => new Dictionary<string, object?>
        {
            ["id"] = m.Id,
            ["name"] = m.MortgageName,
            ["loanNumber"] = m.LoanNumber,
            ["mortgageServiceCompany"] = m.MortgageServiceCompany,
            ["telephone"] = m.TelephoneNumber,
            ["extension"] = m.Extension,
            ["altTelephone"] = m.AltTelephoneNumber,
            ["phoneCountry"] = m.TelephoneNumberCC,
            ["altPhoneCountry"] = m.AltTelephoneNumberCC,
            ["googleAddress"] = m.GoogleAddress,
            ["clientId"] = m.ClientId.ToString(),
            ["lenderType"] = m.LenderType,
            ["loanType"] = m.LoanType,
            ["coveredAsset"] = m.CoveredAsset,
            ["email"] = m.EmailId,
            ["addressLine1"] = m.AddressLine1,
            ["addressLine2"] = m.AddressLine2,
            ["country"] = m.Country,
            ["state"] = m.State,
            ["city"] = m.City,
            ["county"] = m.County,
            ["zip"] = m.ZipCode,
            ["latitude"] = m.Latitude,
            ["longitude"] = m.Longitude,
        }).ToList();

        var additionalInsureds = draft.AdditionalInsureds.Select(ai => new Dictionary<string, object?>
        {
            ["id"] = ai.Id,
            ["firstName"] = ai.FirstName,
            ["middleName"] = ai.MiddleName,
            ["lastName"] = ai.LastName,
            ["relationship"] = ai.Relationship,
            ["telephone"] = ai.TelephoneNumber,
            ["altTelephone"] = ai.AltTelephoneNumber,
            ["email"] = ai.Email,
            ["insuredType"] = ai.InsuredType,
            ["dbaName"] = ai.Dba,
            ["isManual"] = ai.IsManual,
        }).ToList();

        var additionalOrgs = draft.AdditionalOrganisations.Select(ao => new Dictionary<string, object?>
        {
            ["id"] = ao.Id,
            ["orgName"] = ao.OrganisationName,
            ["orgType"] = ao.OrganisationType,
            ["telephone"] = ao.TelephoneNumber,
            ["extension"] = ao.Extension,
            ["altTelephone"] = ao.AltTelephoneNumber,
            ["email"] = ao.Email,
            ["contactFirstName"] = ao.FirstName,
            ["contactMiddleName"] = ao.MiddleName,
            ["contactLastName"] = ao.LastName,
        }).ToList();

        return new EndorsementDraftFormDto(form, locations, mortgages, additionalInsureds, additionalOrgs);
    }

    private static string? FormatFieldValue(object? value) => value switch
    {
        null => null,
        DateOnly d => d.ToString("MM-dd-yyyy"),
        DateTime d => d.ToString("MM-dd-yyyy"),
        decimal m => m.ToString("0.##"),
        bool b => b ? "Yes" : "No",
        string s => s,
        _ => value.ToString(),
    };

    // 11-digit zero-padded, globally sequential per client (matches the OutSystems
    // FormatText(IntegerToText(...)+1, 11, 11, True, "0") pattern).
    private async Task<string> NextQuoteNumberAsync(long clientId)
    {
        var latest = await _db.Policies
            .Where(p => p.ClientId == clientId && p.QuoteNumber != null)
            .OrderByDescending(p => p.Id)
            .Select(p => p.QuoteNumber)
            .FirstOrDefaultAsync();

        if (string.IsNullOrEmpty(latest) || !long.TryParse(latest, out var n))
            return "00000000001";

        return (n + 1).ToString().PadLeft(11, '0');
    }

    // ── Cancel Policy ───────────────────────────────────────────────────────

    private static readonly List<string> MgaReasonsOfCancellation = new()
    {
        "Breach of underwriting warranty (by covered person(s), organization(s), broker, etc.)",
        "Change in ownership (no longer have financial or insurable interest)",
        "Failure of the first-named insured to maintain the covered dwelling asset in accordance with applicable law",
        "Covered dwelling asset is in danger of collapse because of serious structural conditions",
        "Covered dwelling asset is subject to extremely hazardous conditions (e.g., in such a state of disrepair as to be considered dilapidated)",
        "Outstanding order to vacate, demolition order, or declared unsafe due to physical condition",
        "Reasonable knowledge/belief that the dwelling is endangered and not protected from arson (for fraud purposes)",
        "Dwelling possesses characteristics of ownership, condition, occupancy, or maintenance that violate law or public policy",
        "Violation of local fire, health, safety, building, or construction regulation/ordinance that substantially increases hazard",
        "Real property taxes delinquent for 2+ years and still delinquent (not bona fide dispute)",
        "Sale or other change/transfer of ownership of the covered dwelling asset",
        "After covered peril damage, permanent repairs not contracted for or not commenced within 120 days (or 180 days if delayed by permitting)",
        "Outstanding order to vacate, demolish, or declared unsafe by governmental authority (duplicate/related to 3.3)",
        "Policy in effect less than 61 days (early cancellation – non-renewal)",
        "Existence of moral hazard – risk of intentional destruction for insurance proceeds",
        "Change in circumstances increasing probability of intentional destruction",
        "Substantial risk due to character, circumstances, or habits increasing loss/liability probability",
        "Change in character/circumstances increasing probability of loss/liability",
        "Unable to conduct risk inspections due to failure to cooperate",
        "Unable to conduct audit due to failure to cooperate",
        "Failure to make premium payment when due (general)",
        "Failure to make first payment when due (automatic nullification unless paid within 14 days)",
        "Failure to make midterm installment payments when due (cancellation after 15 days unless cured)",
        "Material violation of material duties, conditions, warranties, or provisions",
        "Failure to comply/cooperate with pre-effective loss control or underwriting requirements within 61 days",
        "Covered person acted in manner known/suspected to violate/breach policy terms",
        "Evidence of arson by a covered person(s) and organization(s)",
        "Discovery of fraud, material misrepresentation, or nondisclosure (by you, broker, etc.) in obtaining/continuing policy or claim",
        "Insurance Commissioner determination that continuation violates insurance laws",
        "Cancellation applies to all insureds in a given class",
        "Governmental finding that early cancellation is necessary due to financial impairment, reinsurance issues, or supervision",
        "Increased hazard or material change in risk not reasonably contemplated at inception",
        "Material increase in exposure from changes in statutory or case law after issuance/renewal",
        "Increase in hazard within your control that would cause rate increase or disqualification",
        "Willful, reckless, or grossly negligent act/omission noticeably increasing risk",
        "Undisclosed condition creating increased hazard (not subject of prior claim)",
        "Conviction of crime materially increasing underwritten risks",
        "Ceased writing the line of insurance throughout the state or discontinued operations",
        "Inability to secure adequate reinsurance (threatening solvency)",
        "Failure to take reasonable action to prevent recurrence/future damage after natural disaster (as requested)",
        "Nonpayment of total premium or periodic installment when due",
        "Removal of fixed/salvageable items without replacement (except for renovation)",
        "Physical changes making covered assets uninsurable under guidelines",
        "Placed in supervision, conservatorship, or receivership (cancellation directed/approved)",
        "State insurance department determination that continuation violates insurance code/law",
    };

    public async Task<List<RequestedByOptionDto>> GetRequestedByOptionsAsync()
        => await _db.PolicyConfigurationRequestedBys
            .Where(x => x.IsActive)
            .OrderBy(x => x.SortOrder)
            .Select(x => new RequestedByOptionDto(x.Code, x.Label))
            .ToListAsync();

    public List<string> GetReasonOfCancellationOptions(string requestedByCode)
    {
        var isMga = string.Equals(requestedByCode, "MGA", StringComparison.OrdinalIgnoreCase)
            || string.Equals(requestedByCode, "BROKER", StringComparison.OrdinalIgnoreCase);
        return isMga ? MgaReasonsOfCancellation : new List<string> { "Client Request" };
    }

    // Mirrors GetPolicyPaidAmountValues_CS's per-installment day-proration for
    // Coverage/SurplusTax/FireTax, plus the ResponsibleParty-gated fee rule
    // (INSURED: fully earned once paid; MORTGAGEE: refundable if paid AND within a
    // 30-day free-look window of the policy's effective date).
    private async Task<(decimal paidCoverage, decimal balanceCoverage, decimal paidSurplusTax, decimal balanceSurplusTax,
        decimal paidFireTax, decimal balanceFireTax, decimal paidStampingFee, decimal balanceStampingFee,
        decimal paidPolicyFee, decimal balancePolicyFee)>
        ComputePremiumBalanceAsync(Domain.Entities.Policy policy, DateOnly cancellationEffectiveDate)
    {
        var premium = policy.Premium;
        if (premium == null) return (0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

        var installments = premium.Transactions
            .Select(t => new { t.DueDate, t.IsPaid, t.Extended })
            .Where(t => t.Extended != null)
            .OrderBy(t => t.DueDate)
            .ToList();

        decimal paidCoverage = 0, balanceCoverage = 0, paidSurplusTax = 0, balanceSurplusTax = 0, paidFireTax = 0, balanceFireTax = 0;

        for (int i = 0; i < installments.Count; i++)
        {
            var inst = installments[i];
            var nextDue = i + 1 < installments.Count ? installments[i + 1].DueDate : (DateOnly?)null;
            var periodEnd = nextDue ?? premium.PaymentFrequency.ToUpperInvariant() switch
            {
                "QUARTERLY" => inst.DueDate.AddMonths(3),
                "SEMIANNUAL" => inst.DueDate.AddMonths(6),
                "ANNUAL" => inst.DueDate.AddMonths(12),
                _ => inst.DueDate.AddMonths(1),
            };

            var isPaid = inst.IsPaid == true;
            var paidFactor = isPaid ? 1.0m : 0.0m;
            decimal prorationFactor = 0.0m;
            if (isPaid)
            {
                if (cancellationEffectiveDate <= inst.DueDate) prorationFactor = 0.0m;
                else if (cancellationEffectiveDate >= periodEnd) prorationFactor = 1.0m;
                else
                {
                    var totalDays = periodEnd.DayNumber - inst.DueDate.DayNumber;
                    var elapsedDays = cancellationEffectiveDate.DayNumber - inst.DueDate.DayNumber;
                    prorationFactor = totalDays > 0 ? (decimal)elapsedDays / totalDays : 0.0m;
                }
            }

            var ext = inst.Extended!;
            paidCoverage += ext.CoveragePremium * paidFactor;
            balanceCoverage += ext.CoveragePremium * (paidFactor - prorationFactor);
            paidSurplusTax += ext.SurplusLineTaxInstallmentAmount * paidFactor;
            balanceSurplusTax += ext.SurplusLineTaxInstallmentAmount * (paidFactor - prorationFactor);
            paidFireTax += ext.FirePremiumTaxInstallmentAmount * paidFactor;
            balanceFireTax += ext.FirePremiumTaxInstallmentAmount * (paidFactor - prorationFactor);
        }

        decimal paidStampingFee, balanceStampingFee = 0, paidPolicyFee, balancePolicyFee = 0;
        var stampingFee = premium.StampingFee ?? 0;
        var policyFee = premium.PolicyFees;
        var isInsured = string.Equals(premium.ResponsibleParty, "INSURED", StringComparison.OrdinalIgnoreCase);

        if (isInsured)
        {
            paidStampingFee = stampingFee;
            paidPolicyFee = policyFee;
        }
        else
        {
            var anyPaid = premium.Transactions.Any(t => t.IsPaid == true);
            paidStampingFee = anyPaid ? stampingFee : 0;
            paidPolicyFee = anyPaid ? policyFee : 0;

            var withinFreeLook = policy.EffectiveDate.HasValue
                && cancellationEffectiveDate <= policy.EffectiveDate.Value.AddDays(30);
            if (withinFreeLook && paidCoverage != 0)
            {
                balanceStampingFee = stampingFee;
                balancePolicyFee = policyFee;
            }
        }

        return (paidCoverage, balanceCoverage, paidSurplusTax, balanceSurplusTax, paidFireTax, balanceFireTax,
            paidStampingFee, balanceStampingFee, paidPolicyFee, balancePolicyFee);
    }

    // Mirrors GetCommissionFinancialDetail_CS: an even split of each PolicyCommission's
    // InstallmentCommission across NumberOfInstallments periods spanning EffectiveDate..
    // ExpiryDate (independent of the premium's actual due-date schedule), day-prorated
    // per period at the cancellation date.
    private List<CancellationCommissionEffectRowDto> ComputeCommissionEffect(
        Domain.Entities.Policy policy, DateOnly cancellationEffectiveDate, out List<(Domain.Entities.PolicyCommission commission, decimal balance)> balances)
    {
        var rows = new List<CancellationCommissionEffectRowDto>();
        balances = new List<(Domain.Entities.PolicyCommission, decimal)>();

        foreach (var pc in policy.Commissions.Where(c => c.IsCancelled != true))
        {
            var effectiveDate = policy.EffectiveDate;
            var expiryDate = policy.ExpiryDate;
            var installments = Math.Max(pc.NumberOfInstallments, 1);
            var amount = pc.InstallmentCommission ?? 0;

            decimal commissionEarned = 0;
            if (effectiveDate.HasValue && expiryDate.HasValue)
            {
                var termDays = expiryDate.Value.DayNumber - effectiveDate.Value.DayNumber;
                for (int n = 1; n <= installments; n++)
                {
                    var periodStart = effectiveDate.Value.AddDays((n - 1) * termDays / installments);
                    var periodEnd = effectiveDate.Value.AddDays(n * termDays / installments);
                    decimal factor;
                    if (cancellationEffectiveDate <= effectiveDate.Value || cancellationEffectiveDate <= periodStart || periodEnd <= periodStart)
                        factor = 0.0m;
                    else if (cancellationEffectiveDate >= periodEnd)
                        factor = 1.0m;
                    else
                    {
                        var total = periodEnd.DayNumber - periodStart.DayNumber;
                        var elapsed = cancellationEffectiveDate.DayNumber - periodStart.DayNumber;
                        factor = total > 0 ? (decimal)elapsed / total : 0.0m;
                    }
                    commissionEarned += amount * factor;
                }
            }

            var paidCommission = pc.Transactions.Where(t => t.IsPaid == true).Sum(t => t.CommissionAmountDue);
            var balanceCommission = commissionEarned - paidCommission;
            balances.Add((pc, balanceCommission));
            rows.Add(new CancellationCommissionEffectRowDto(
                pc.Intermediary?.IntermediaryName ?? "",
                paidCommission,
                balanceCommission));
        }

        return rows;
    }

    public async Task<PolicyCancellationPreviewDto?> GetCancellationPreviewAsync(
        long clientId, string policyNumber, DateOnly cancellationEffectiveDate)
    {
        var policy = await _db.Policies
            .Include(p => p.Premium).ThenInclude(pr => pr!.Transactions).ThenInclude(t => t.Extended)
            .Include(p => p.Commissions).ThenInclude(c => c.Intermediary)
            .Include(p => p.Commissions).ThenInclude(c => c.Transactions)
            .Where(p => p.ClientId == clientId && p.PolicyNumber == policyNumber && p.PolicyStatus == "Active")
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync();
        if (policy == null) return null;

        var (paidCoverage, balanceCoverage, paidSurplusTax, balanceSurplusTax, paidFireTax, balanceFireTax,
            paidStampingFee, balanceStampingFee, paidPolicyFee, balancePolicyFee) =
            await ComputePremiumBalanceAsync(policy, cancellationEffectiveDate);

        var breakdown = new List<CancellationPremiumBreakdownRowDto>
        {
            new("Coverage Premium", paidCoverage, balanceCoverage),
            new("Surplus Lines Tax", paidSurplusTax, balanceSurplusTax),
            new("Fire Premium Tax", paidFireTax, balanceFireTax),
            new("Stamping Fee", paidStampingFee, balanceStampingFee),
            new("Policy Fee", paidPolicyFee, balancePolicyFee),
        };

        var commissionEffect = ComputeCommissionEffect(policy, cancellationEffectiveDate, out _);

        // "Is policy paid?" — Cancellation Effective Date is only editable when this is true.
        // Mortgagee-responsible policies are paid only if the installment(s) were actually
        // paid; any other responsible party is always considered paid.
        var isPolicyPaid = policy.Premium == null
            || !string.Equals(policy.Premium.ResponsibleParty, "MORTGAGEE", StringComparison.OrdinalIgnoreCase)
            || policy.Premium.Transactions.Any(t => t.IsPaid == true);

        return new PolicyCancellationPreviewDto(
            breakdown,
            breakdown.Sum(b => b.PaidAmount),
            breakdown.Sum(b => b.RefundAmount),
            commissionEffect,
            isPolicyPaid);
    }

    public async Task<CancelPolicyResultDto> SubmitCancellationAsync(
        long clientId, long userId, string policyNumber, CancelPolicyRequestDto request)
    {
        var policy = await _db.Policies
            .Include(p => p.Extended)
            .Include(p => p.Premium).ThenInclude(pr => pr!.Transactions).ThenInclude(t => t.Extended)
            .Include(p => p.Commissions).ThenInclude(c => c.Intermediary)
            .Include(p => p.Commissions).ThenInclude(c => c.Transactions)
            .Include(p => p.CancellationTransactions)
            .Where(p => p.ClientId == clientId && p.PolicyNumber == policyNumber)
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync();
        if (policy == null) throw new KeyNotFoundException($"Policy '{policyNumber}' not found.");
        if (!string.Equals(policy.PolicyStatus, "Active", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                policy.PolicyStatus is "Bound" or "Draft"
                    ? "This policy cannot be cancelled because it has an associated bound/draft quote."
                    : "This transaction cannot proceed because the policy is not active.");
        }

        var now = DateTime.UtcNow;
        var (paidCoverage, balanceCoverage, paidSurplusTax, balanceSurplusTax, paidFireTax, balanceFireTax,
            paidStampingFee, balanceStampingFee, paidPolicyFee, balancePolicyFee) =
            await ComputePremiumBalanceAsync(policy, request.CancellationEffectiveDate);
        var transactionAmount = balanceCoverage + balanceSurplusTax + balanceFireTax + balanceStampingFee + balancePolicyFee;

        var isInsured = string.Equals(policy.Premium?.ResponsibleParty, "INSURED", StringComparison.OrdinalIgnoreCase);

        // Refund settlement — mocked (no live Tranzpay call), always succeeds.
        policy.CancellationTransactions.Add(new Domain.Entities.CancellationPaymentTransaction
        {
            ClientId = clientId,
            RefundAmount = transactionAmount,
            TransactionPaymentDate = DateOnly.FromDateTime(now),
            TransactionStatus = "SUCCESS",
            TransactionId = isInsured ? "MOCKED" : null,
            PaymentMethod = isInsured ? "ACH" : null,
            CreatedOn = now,
            CoveragePremium = balanceCoverage,
            SurplusLinesTax = balanceSurplusTax,
            FirePremiumTax = balanceFireTax,
            StampingFee = balanceStampingFee,
            PolicyFee = balancePolicyFee,
        });

        // Policy_Extended — cancellation details (create the row if this policy never had one).
        if (policy.Extended == null)
        {
            policy.Extended = new Domain.Entities.PolicyExtended
            {
                ClientId = clientId,
                CreatedBy = userId,
                CreatedOn = now,
            };
        }
        policy.Extended.CancellationEffectiveDate = request.CancellationEffectiveDate;
        policy.Extended.ProrationBasis = request.ProrationBasis;
        policy.Extended.RequestedBy = request.RequestedBy;
        policy.Extended.ReasonOfCancellation = request.ReasonOfCancellation;
        policy.Extended.OtherReason = request.OtherReason;
        policy.Extended.AdjustCommissions = request.AdjustCommissions;
        policy.Extended.Comments = request.Comments;
        policy.Extended.UpdatedBy = userId;
        policy.Extended.UpdatedOn = now;

        policy.PolicyStatus = "Cancelled";
        policy.UpdatedBy = userId;
        policy.UpdatedOn = now;

        if (policy.Premium != null)
        {
            policy.Premium.IsCancelled = true;
            policy.Premium.CancelledOn = request.CancellationEffectiveDate;
            policy.Premium.UpdatedBy = userId;
            policy.Premium.UpdatedOn = now;

            foreach (var t in policy.Premium.Transactions.Where(t => t.IsPaid != true && t.TransactionStatus == "PENDING"))
            {
                t.TransactionStatus = "CANCELLED";
                t.CancelledOn = request.CancellationEffectiveDate;
                t.UpdatedBy = userId;
                t.UpdatedOn = now;
            }
        }

        ComputeCommissionEffect(policy, request.CancellationEffectiveDate, out var commissionBalances);
        foreach (var pc in policy.Commissions)
        {
            pc.IsCancelled = true;
            pc.CancelledOn = request.CancellationEffectiveDate;
            pc.UpdatedBy = userId;
            pc.UpdatedOn = now;

            foreach (var t in pc.Transactions.Where(t => t.IsPaid != true && t.TransactionStatus == "PENDING"))
            {
                t.TransactionStatus = "CANCELLED";
                t.CancelledOn = request.CancellationEffectiveDate;
                t.UpdatedBy = userId;
                t.UpdatedOn = now;
            }
        }
        foreach (var (commission, balance) in commissionBalances)
        {
            var monthEnd = new DateOnly(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month));
            commission.Transactions.Add(new Domain.Entities.CommissionPaymentTransaction
            {
                ClientId = clientId,
                CommissionAmountDue = balance,
                InvoiceDate = DateOnly.FromDateTime(now),
                DueDate = monthEnd,
                TransactionStatus = "PENDING",
                CreatedBy = userId,
                CreatedOn = now,
            });
        }

        // NotifyMortgageeCoverage — deferred (no email infrastructure wired yet).

        var transactionType = "CancelPolicy";
        var policyTransaction = new Domain.Entities.PolicyTransaction
        {
            ClientId = clientId,
            PolicyNumber = policy.PolicyNumber,
            EffectiveDate = request.CancellationEffectiveDate,
            ExpirationDate = policy.ExpiryDate,
            TransactionType = transactionType,
            TransactionEffectiveDate = request.CancellationEffectiveDate,
            Status = policy.PolicyStatus,
            MainPolicyId = policy.Id,
            RedirectionPolicyId = policy.Id,
            IsShowInTimeline = true,
            CreatedBy = userId,
            CreatedOn = now,
        };
        _db.PolicyTransactions.Add(policyTransaction);

        await _db.SaveChangesAsync();

        _db.Audits.Add(new Domain.Entities.Audit
        {
            ClientId = clientId,
            TransactionId = policyTransaction.Id,
            ActivityType = "Update",
            RecordId = policy.Id,
            ActivityDescription = "Policy cancelled. Policy Record updated.",
            Module = "Policy",
            CreatedBy = userId,
            CreatedDateTime = now,
            TableName = "Policy",
        });
        await _db.SaveChangesAsync();

        return new CancelPolicyResultDto(policy.PolicyNumber, policy.PolicyStatus);
    }

    // ── Cancel / Rewrite Policy ──────────────────────────────────────────────
    // Cancels the current policy and replaces it with a brand-new NEW BUSINESS draft
    // (not an endorsement draft) that shares the same PolicyNumber. The original policy
    // is only cancelled AFTER the replacement policy is fully built (mirrors
    // MakePriorPolicyCancelled_HB in the source flow — the cancel is a side-effect
    // discovered via the new policy's Policy_Extended.PriorPolicyId lineage pointer).
    // HB-only scope; non-HB path intentionally not ported per business decision.

    private static readonly List<string> ReasonForRewritingOptions = new() { "Correction of Rate", "Other" };

    public List<string> GetReasonForRewritingOptions() => ReasonForRewritingOptions;

    public async Task<CancelRewritePreviewDto?> GetCancelRewritePreviewAsync(
        long clientId, string policyNumber, DateOnly cancellationEffectiveDate)
    {
        var policy = await _db.Policies
            .Include(p => p.Premium).ThenInclude(pr => pr!.Transactions).ThenInclude(t => t.Extended)
            .Include(p => p.Commissions).ThenInclude(c => c.Intermediary)
            .Include(p => p.Commissions).ThenInclude(c => c.Transactions)
            .Where(p => p.ClientId == clientId && p.PolicyNumber == policyNumber && p.PolicyStatus == "Active")
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync();
        if (policy == null) return null;

        var (paidCoverage, balanceCoverage, paidSurplusTax, balanceSurplusTax, paidFireTax, balanceFireTax,
            paidStampingFee, balanceStampingFee, paidPolicyFee, balancePolicyFee) =
            await ComputePremiumBalanceAsync(policy, cancellationEffectiveDate);

        var commissionRows = ComputeCommissionEffect(policy, cancellationEffectiveDate, out _);
        var paidCommission = commissionRows.Sum(r => r.LastCommissionPaid);
        var balanceCommission = commissionRows.Sum(r => r.ChangeInCommission);

        var breakdown = new List<CancellationPremiumBreakdownRowDto>
        {
            new("Coverage Premium", paidCoverage, balanceCoverage),
            new("Surplus Lines Tax", paidSurplusTax, balanceSurplusTax),
            new("Fire Premium Tax", paidFireTax, balanceFireTax),
            new("Stamping Fee", paidStampingFee, balanceStampingFee),
            new("Policy Fee", paidPolicyFee, balancePolicyFee),
            new("Commissions", paidCommission, balanceCommission),
        };
        var totalPaid = breakdown.Sum(b => b.PaidAmount);
        var totalRefund = breakdown.Sum(b => b.RefundAmount);
        breakdown.Add(new CancellationPremiumBreakdownRowDto("Total", totalPaid, totalRefund));

        var isPolicyPaid = policy.Premium == null
            || !string.Equals(policy.Premium.ResponsibleParty, "MORTGAGEE", StringComparison.OrdinalIgnoreCase)
            || policy.Premium.Transactions.Any(t => t.IsPaid == true);

        return new CancelRewritePreviewDto(breakdown, totalPaid, totalRefund, isPolicyPaid);
    }

    public async Task<CancelRewriteResultDto> SubmitCancelRewriteAsync(
        long clientId, long userId, string policyNumber, CancelRewriteRequestDto request)
    {
        var source = await _db.Policies
            .Include(p => p.Extended)
            .Include(p => p.Account)
            .Include(p => p.Products)
            .Include(p => p.LimitCoverages)
            .Include(p => p.Mortgages)
            .Include(p => p.RiskAddresses).ThenInclude(r => r.RiskInformation)
            .Include(p => p.AdditionalInsureds)
            .Include(p => p.AdditionalOrganisations)
            .Where(p => p.ClientId == clientId && p.PolicyNumber == policyNumber && p.PolicyStatus == "Active")
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException(
                $"Policy '{policyNumber}' is not Active — cannot cancel/rewrite.");

        var now = DateTime.UtcNow;

        // Upsert Policy_Extended on the SOURCE policy with the cancel/rewrite detail fields
        // (mirrors UpdatePolicyCancelRewrite_CS) — does not touch PolicyStatus.
        if (source.Extended == null)
        {
            source.Extended = new Domain.Entities.PolicyExtended
            {
                ClientId = clientId,
                CreatedBy = userId,
                CreatedOn = now,
            };
        }
        source.Extended.CancellationEffectiveDate = request.CancellationEffectiveDate;
        source.Extended.ProrationBasis = request.ProrationBasis;
        source.Extended.RewriteEffectiveDate = request.RewriteEffectiveDate;
        source.Extended.ReasonForRewritingPolicy = request.ReasonForRewritingPolicy;
        source.Extended.RewriteOtherReason = request.OtherReason;
        source.Extended.AdjustCommissions = request.AdjustCommissions;
        source.Extended.Comments = request.Comments;
        source.Extended.UpdatedBy = userId;
        source.Extended.UpdatedOn = now;

        var isIndividual = string.Equals(source.Account?.AccountType, "Individual", StringComparison.OrdinalIgnoreCase);
        var newBusinessCode = isIndividual ? "NEWBUSINESSINDIVIDUAL" : "NEWBUSINESS";
        var quoteNumber = await NextQuoteNumberAsync(clientId);
        var newAccount = CloneAccount(source.Account, clientId, userId, now);

        var draft = new Domain.Entities.Policy
        {
            PolicyNumber = source.PolicyNumber, // shared across Draft rows — same convention as Endorse Policy
            InsuredName = source.InsuredName,
            Address = source.Address,
            EffectiveDate = request.CancellationEffectiveDate, // HB rule: new policy starts when the old one is cancelled
            Lob = source.Lob,
            SubProduct = source.SubProduct,
            ClientId = clientId,
            CreatedBy = userId,
            CreatedOn = now,
            QuoteNumber = quoteNumber,
            IntermediaryId = source.IntermediaryId,
            ProducerId = source.ProducerId,
            Account = newAccount,
            PolicyStage = newBusinessCode,
            PolicyTerm = source.PolicyTerm,
            LockSubmission = false,
            LastStep = 1,
            DoNotRenew = source.DoNotRenew,
            PolicyIssuedOn = source.PolicyIssuedOn,
            WritingCompany = source.WritingCompany,
            InsuranceType = source.InsuranceType,
            Country = source.Country,
            StateProvince = source.StateProvince,
            IsSinglePolicy = source.IsSinglePolicy,
            IsQuickQuote = source.IsQuickQuote,
            QuoteCreationDate = DateOnly.FromDateTime(now),
            PolicyType = newBusinessCode,
            PolicyStatus = "Draft",
            ExpiryDate = request.CancellationEffectiveDate.AddYears(1),
            IntermediaryType = source.IntermediaryType,
        };
        _db.Policies.Add(draft);

        draft.Extended = new Domain.Entities.PolicyExtended
        {
            ClientId = clientId,
            PrimaryInsuredType = source.Extended?.PrimaryInsuredType,
            PriorPolicyId = source.Id,
            EndorsementEffectiveDate = null,
            CreatedBy = userId,
            CreatedOn = now,
        };

        // Premium/Commission intentionally NOT cloned — the new policy is a fresh New
        // Business draft that gets its own premium/commission later in the wizard.
        CloneChildEntities(source, draft, clientId, userId, now, includePremiumAndCommission: false);

        await _db.SaveChangesAsync();

        // Cancel the original policy only after the replacement is fully built
        // (mirrors MakePriorPolicyCancelled_HB). Lender Dock notification deferred/mocked.
        source.PolicyStatus = "Cancelled";
        source.UpdatedBy = userId;
        source.UpdatedOn = now;
        await _db.SaveChangesAsync();

        return new CancelRewriteResultDto(source.PolicyNumber, draft.Id, draft.PolicyNumber, quoteNumber);
    }

    // ── Do Not Renew ──────────────────────────────────────────────────────────
    // No new policy created, no clone — flips PolicyStatus in place and generates a
    // notice document. The 65 "Our Policy Nonrenewal" + 1 "Your Nonrenewal" checkbox
    // selections are never persisted (confirmed against the source action) — they exist
    // only transiently to render the notice PDF via GenerateNoticeOfNonRenewalAsync.

    public async Task<NoticeOfNonRenewalInfoDto?> GetNoticeOfNonRenewalInfoAsync(long clientId, string policyNumber)
    {
        var policy = await _db.Policies
            .Include(p => p.Account)
            .Include(p => p.Intermediary)
            .Where(p => p.ClientId == clientId && p.PolicyNumber == policyNumber && p.PolicyStatus != "Draft")
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync();
        if (policy == null) return null;

        var account = policy.Account;
        var namedInsured = account == null ? "" :
            string.Equals(account.AccountType, "Individual", StringComparison.OrdinalIgnoreCase)
                ? string.Join(" ", new[] { account.FirstName, account.MiddleName, account.LastName, account.Suffix }.Where(s => !string.IsNullOrWhiteSpace(s)))
                : account.LegalBusinessName ?? "";

        var nextDueEffective = policy.ExpiryDate?.AddDays(1);

        return new NoticeOfNonRenewalInfoDto(
            namedInsured,
            policy.Intermediary?.IntermediaryName ?? "",
            "", "", "", "", "", "", "", "", // address fields — no CommonAddress/CommonContact entities in this schema yet
            namedInsured,
            "",
            "",
            policy.Intermediary?.IntermediaryCode ?? "",
            "",
            policy.PolicyNumber,
            policy.EffectiveDate?.ToString("MM-dd-yyyy") ?? "",
            DateTime.UtcNow.ToString("MM-dd-yyyy"),
            policy.ExpiryDate?.ToString("MM-dd-yyyy") ?? "",
            nextDueEffective?.ToString("MM-dd-yyyy") ?? "");
    }

    public async Task<DoNotRenewResultDto> SubmitDoNotRenewAsync(
        long clientId, long userId, string policyNumber, DoNotRenewRequestDto request)
    {
        var anyAttributeSelected = request.Attributes.Any(a => a);
        if (!request.CheckBoxYourNonRenewal && !anyAttributeSelected)
            throw new InvalidOperationException("At least one reason is required to generate the Policy Nonrenewal Notice.");
        if (request.CheckBoxYourNonRenewal && anyAttributeSelected)
            throw new InvalidOperationException(
                "The policy can be non-renewed by either the insured or by the Underwriter.  Please correct your selections accordingly.");

        var policy = await _db.Policies
            .Where(p => p.ClientId == clientId && p.PolicyNumber == policyNumber && p.PolicyStatus == "Active")
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException($"Policy '{policyNumber}' is not Active — cannot set Do Not Renew.");

        var now = DateTime.UtcNow;
        policy.PolicyStatus = "DONOTRENEW";
        policy.DoNotRenew = true;
        policy.UpdatedBy = userId;
        policy.UpdatedOn = now;
        await _db.SaveChangesAsync();

        _db.Audits.Add(new Domain.Entities.Audit
        {
            ClientId = clientId,
            ActivityType = "Update",
            RecordId = policy.Id,
            ActivityDescription = "Policy record updated.",
            Module = "Policy",
            CreatedBy = userId,
            CreatedDateTime = now,
            TableName = "Policy",
        });

        // Best-effort: notice document generation failing (e.g. Plumsail template not
        // configured for this client) should not block the status change itself.
        await _documents.GenerateNoticeOfNonRenewalAsync(policy.Id,
            new NoticeOfNonRenewalSelections(request.CheckBoxYourNonRenewal, request.Attributes));

        _db.PolicyTransactions.Add(new Domain.Entities.PolicyTransaction
        {
            ClientId = clientId,
            PolicyNumber = policy.PolicyNumber,
            EffectiveDate = policy.EffectiveDate,
            ExpirationDate = policy.ExpiryDate,
            TransactionType = "DoNotRenew",
            TransactionEffectiveDate = DateOnly.FromDateTime(now),
            Status = "DONOTRENEW",
            MainPolicyId = policy.Id,
            RedirectionPolicyId = policy.Id,
            IsShowInTimeline = true,
            CreatedBy = userId,
            CreatedOn = now,
        });
        await _db.SaveChangesAsync();

        return new DoNotRenewResultDto(policy.PolicyNumber, policy.PolicyStatus);
    }

    public async Task<DoNotRenewResultDto> RemoveDoNotRenewAsync(long clientId, long userId, string policyNumber)
    {
        var policy = await _db.Policies
            .Where(p => p.ClientId == clientId && p.PolicyNumber == policyNumber && p.PolicyStatus == "DONOTRENEW")
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException($"Policy '{policyNumber}' does not have Do Not Renew set.");

        var now = DateTime.UtcNow;
        policy.PolicyStatus = "Active";
        policy.DoNotRenew = false;
        policy.UpdatedBy = userId;
        policy.UpdatedOn = now;
        await _db.SaveChangesAsync();

        _db.Audits.Add(new Domain.Entities.Audit
        {
            ClientId = clientId,
            ActivityType = "Update",
            RecordId = policy.Id,
            ActivityDescription = "Policy record updated.",
            Module = "Policy",
            CreatedBy = userId,
            CreatedDateTime = now,
            TableName = "Policy",
        });

        _db.PolicyTransactions.Add(new Domain.Entities.PolicyTransaction
        {
            ClientId = clientId,
            PolicyNumber = policy.PolicyNumber,
            EffectiveDate = policy.EffectiveDate,
            ExpirationDate = policy.ExpiryDate,
            TransactionType = "RemoveDoNotRenew",
            TransactionEffectiveDate = DateOnly.FromDateTime(now),
            Status = policy.PolicyStatus,
            MainPolicyId = policy.Id,
            RedirectionPolicyId = policy.Id,
            IsShowInTimeline = true,
            CreatedBy = userId,
            CreatedOn = now,
        });
        await _db.SaveChangesAsync();

        return new DoNotRenewResultDto(policy.PolicyNumber, policy.PolicyStatus);
    }

    // ── Notes ───────────────────────────────────────────────────────────────

    private async Task<Domain.Entities.Policy?> FindPolicyForNotesAsync(long clientId, string policyNumber)
        => await _db.Policies
            .Where(p => p.ClientId == clientId && p.PolicyNumber == policyNumber && p.PolicyStatus != "Draft")
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync()
        ?? await _db.Policies
            .Where(p => p.ClientId == clientId && p.PolicyNumber == policyNumber)
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync();

    private async Task<NoteDto> ToNoteDtoAsync(Domain.Entities.Note note)
    {
        var creatorName = note.CreatedBy is > 0
            ? await _db.Users.Where(u => u.Id == note.CreatedBy!.Value).Select(u => u.FullName).FirstOrDefaultAsync()
            : null;

        return new NoteDto(
            note.Id,
            note.NotesText,
            note.AccessType,
            note.Module,
            creatorName,
            note.CreatedOn.ToString("MM-dd-yyyy , HH:mm:ss"),
            note.Files.Select(f => new NoteFileDto(f.Id, f.FileName, f.FileType)).ToList()
        );
    }

    public async Task<List<NoteDto>> GetNotesAsync(long clientId, string policyNumber)
    {
        var policy = await FindPolicyForNotesAsync(clientId, policyNumber);
        if (policy == null) return new List<NoteDto>();

        var notes = await _db.Notes
            .Include(n => n.Files)
            .Where(n => n.ClientId == clientId && n.PolicyId == policy.Id)
            .OrderByDescending(n => n.CreatedOn)
            .ToListAsync();

        var result = new List<NoteDto>();
        foreach (var n in notes) result.Add(await ToNoteDtoAsync(n));
        return result;
    }

    public async Task<NoteDto> CreateNoteAsync(long clientId, long userId, string policyNumber, CreateNoteRequestDto request)
    {
        var policy = await FindPolicyForNotesAsync(clientId, policyNumber)
            ?? throw new KeyNotFoundException($"Policy '{policyNumber}' not found.");

        var now = DateTime.UtcNow;
        var plainText = System.Text.RegularExpressions.Regex.Replace(request.NotesText, "<[^>]*>", string.Empty).Trim();

        var note = new Domain.Entities.Note
        {
            ClientId = clientId,
            NotesText = request.NotesText,
            NoteDisplayText = plainText.Length > 500 ? plainText[..500] : plainText,
            AccessType = request.AccessType,
            AccountId = policy.AccountId,
            PolicyId = policy.Id,
            Module = "Policy",
            TotalNumberOfAttachments = request.Files?.Count ?? 0,
            CreatedBy = userId,
            CreatedOn = now,
        };

        foreach (var f in request.Files ?? new List<NoteFileUploadDto>())
        {
            note.Files.Add(new Domain.Entities.NoteFile
            {
                ClientId = clientId,
                FileName = f.FileName,
                FileType = f.FileType,
                FileData = f.Data,
                Module = "Policy",
                CreatedBy = userId,
                CreatedOn = now,
            });
        }

        _db.Notes.Add(note);
        await _db.SaveChangesAsync();

        return await ToNoteDtoAsync(note);
    }

    public async Task<NoteDto?> UpdateNoteAsync(long clientId, long userId, string policyNumber, long noteId, UpdateNoteRequestDto request)
    {
        var policy = await FindPolicyForNotesAsync(clientId, policyNumber);
        if (policy == null) return null;

        var note = await _db.Notes.Include(n => n.Files)
            .FirstOrDefaultAsync(n => n.ClientId == clientId && n.PolicyId == policy.Id && n.Id == noteId);
        if (note == null) return null;

        var now = DateTime.UtcNow;
        var plainText = System.Text.RegularExpressions.Regex.Replace(request.NotesText, "<[^>]*>", string.Empty).Trim();

        note.NotesText = request.NotesText;
        note.NoteDisplayText = plainText.Length > 500 ? plainText[..500] : plainText;
        note.AccessType = request.AccessType;
        note.UpdatedBy = userId;
        note.UpdatedOn = now;

        if (request.RemoveFileIds is { Count: > 0 })
        {
            var toRemove = note.Files.Where(f => request.RemoveFileIds.Contains(f.Id)).ToList();
            foreach (var f in toRemove) _db.NoteFiles.Remove(f);
        }

        foreach (var f in request.NewFiles ?? new List<NoteFileUploadDto>())
        {
            note.Files.Add(new Domain.Entities.NoteFile
            {
                ClientId = clientId,
                FileName = f.FileName,
                FileType = f.FileType,
                FileData = f.Data,
                Module = "Policy",
                CreatedBy = userId,
                CreatedOn = now,
            });
        }

        await _db.SaveChangesAsync();
        note.TotalNumberOfAttachments = note.Files.Count;
        await _db.SaveChangesAsync();

        return await ToNoteDtoAsync(note);
    }

    public async Task<bool> DeleteNoteAsync(long clientId, string policyNumber, long noteId)
    {
        var policy = await FindPolicyForNotesAsync(clientId, policyNumber);
        if (policy == null) return false;

        var note = await _db.Notes.FirstOrDefaultAsync(n => n.ClientId == clientId && n.PolicyId == policy.Id && n.Id == noteId);
        if (note == null) return false;

        _db.Notes.Remove(note);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<Domain.Entities.NoteFile?> GetNoteFileAsync(long clientId, string policyNumber, long fileId)
    {
        var policy = await FindPolicyForNotesAsync(clientId, policyNumber);
        if (policy == null) return null;

        return await _db.NoteFiles
            .Include(f => f.Note)
            .FirstOrDefaultAsync(f => f.ClientId == clientId && f.Id == fileId && f.Note!.PolicyId == policy.Id);
    }
}
