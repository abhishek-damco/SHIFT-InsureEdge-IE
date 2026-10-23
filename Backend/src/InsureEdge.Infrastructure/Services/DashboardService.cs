using System.Text.Json;
using System.Globalization;
using InsureEdge.Application.DTOs.Dashboard;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace InsureEdge.Infrastructure.Services;

public sealed class DashboardService(
    InsureEdgeDbContext db,
    ICurrentTenantService tenant,
    RenewalQuoteService renewalQuoteService) : IDashboardService
{
    private const string DashboardCurrency = "USD";
    private static readonly string[] QuoteTypes =
    [
        "NEWBUSINESS", "NEWBUSINESSINDIVIDUAL", "NEWBUSINESSBUSINESS",
        "ENDORSEMENT", "ENDORSEMENTINDIVIDUAL", "ENDORSEMENTBUSINESS",
        "RENEWAL", "RENEWALINDIVIDUAL", "RENEWALBUSINESS"
    ];

    private static readonly string[] PolicyTypes = ["POLICY", "POLICIESINDIVIDUAL", "POLICIESBUSINESS"];
    private static readonly string[] RenewalRadarPolicyTypes = ["POLICIESINDIVIDUAL", "POLICIESBUSINESS"];
    private static readonly string[] WidgetKeys =
    [
        "quoteKpis", "producerKpis", "policyKpis", "coverageKpis", "writtenPremium",
        "recentQuotes", "pendingCancellations", "renewalRadar", "failedPayments", "tasksReminders", "myNotes"
    ];

    private IQueryable<Policy> ScopedPolicies()
    {
        var query = db.Policies.AsNoTracking().Where(p => p.ClientId == tenant.ClientId);
        if (!tenant.ProducerId.HasValue) return query;

        return tenant.IsFullProducerVisibility && tenant.IntermediaryId.HasValue
            ? query.Where(p => p.IntermediaryId == tenant.IntermediaryId.Value)
            : query.Where(p => p.ProducerId == tenant.ProducerId.Value);
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var context = GetContext();
        var policies = ScopedPolicies();
        var quotes = policies.Where(p => p.PolicyType != null &&
            (p.PolicyType.ToUpper() == "NEWBUSINESS" || p.PolicyType.ToUpper() == "NEWBUSINESSINDIVIDUAL" || p.PolicyType.ToUpper() == "NEWBUSINESSBUSINESS"));
        var issuedPolicies = policies.Where(p => p.PolicyType != null && PolicyTypes.Contains(p.PolicyType.ToUpper()));

        var quoteKpis = await quotes.GroupBy(_ => 1).Select(g => new DashboardKpisDto(
                g.Count(),
                g.Count(p => p.ApprovalStatus != null && p.ApprovalStatus.ToUpper() == "APPROVED"),
                g.Count(p => p.ApprovalStatus != null && p.ApprovalStatus.ToUpper() == "NOT APPROVED"),
                g.Count(p => p.PolicyStatus != null && p.PolicyStatus.ToUpper() == "EXPIRED")))
            .SingleOrDefaultAsync(cancellationToken) ?? new DashboardKpisDto(0, 0, 0, 0);

        DashboardProducerKpisDto? producerKpis = null;
        DashboardPolicyKpisDto? policyKpis = null;
        DashboardCoverageKpisDto? coverageKpis = null;

        if (context.Persona == DashboardPersonas.Client)
        {
            policyKpis = await issuedPolicies.GroupBy(_ => 1).Select(g => new DashboardPolicyKpisDto(
                    g.Count(),
                    g.Count(p => p.PolicyStatus != null && p.PolicyStatus.ToUpper() == "ACTIVE"),
                    g.Count(p => p.PolicyStatus != null && p.PolicyStatus.ToUpper() == "BOUND"),
                    g.Count(p => p.PolicyStatus != null && p.PolicyStatus.ToUpper() == "CANCELLED")))
                .SingleOrDefaultAsync(cancellationToken) ?? new DashboardPolicyKpisDto(0, 0, 0, 0);

            coverageKpis = new DashboardCoverageKpisDto(
                await issuedPolicies.CountAsync(p => p.LimitCoverages.Any(c => c.ClientId == tenant.ClientId && c.CoverageLevel != null && c.CoverageLevel.ToUpper() == "BASIC"), cancellationToken),
                await issuedPolicies.CountAsync(p => p.LimitCoverages.Any(c => c.ClientId == tenant.ClientId && c.CoverageLevel != null && c.CoverageLevel.ToUpper() == "STANDARD"), cancellationToken),
                await issuedPolicies.CountAsync(p => p.LimitCoverages.Any(c => c.ClientId == tenant.ClientId && c.CoverageLevel != null && c.CoverageLevel.ToUpper() == "PREFERRED"), cancellationToken));
        }

        var firstYear = today.Year - 1;
        var lastYear = today.Year + 1;
        var premiumRows = await issuedPolicies
            .Where(p => p.PolicyStatus != null && (p.PolicyStatus.ToUpper() == "ACTIVE" || p.PolicyStatus.ToUpper() == "BOUND") &&
                        p.EffectiveDate.HasValue && p.EffectiveDate.Value.Year >= firstYear && p.EffectiveDate.Value.Year <= lastYear &&
                        p.Premium != null && p.Premium.ClientId == tenant.ClientId)
            .GroupBy(p => p.EffectiveDate!.Value.Year)
            .Select(g => new { Year = g.Key, Amount = g.Sum(p => p.Premium!.TotalPremiumWithoutInstallmentFee) })
            .ToListAsync(cancellationToken);
        var premiumByYear = premiumRows.ToDictionary(x => x.Year, x => x.Amount);
        var writtenPremium = Enumerable.Range(firstYear, 3)
            .Select(year => new WrittenPremiumDto(year, premiumByYear.GetValueOrDefault(year)))
            .ToList();

        var activities = await GetRecentActivitiesAsync(cancellationToken);

        return new DashboardSummaryDto(context, quoteKpis, producerKpis, policyKpis, coverageKpis,
            writtenPremium, [], [], [], activities);
    }

    public async Task<DashboardQuoteResponse> GetQuotesAsync(DashboardQuoteQuery input, CancellationToken cancellationToken = default)
    {
        var page = Math.Max(1, input.Page);
        var pageSize = NormalizePageSize(input.PageSize);
        var query =
            from policy in ScopedPolicies()
            where policy.PolicyType != null && QuoteTypes.Contains(policy.PolicyType.ToUpper())
            join accountRow in db.Accounts.AsNoTracking().Where(a => a.ClientId == tenant.ClientId)
                on policy.AccountId equals accountRow.Id into accounts
            from account in accounts.DefaultIfEmpty()
            select new
            {
                Policy = policy,
                Account = account,
                Lob = policy.Products.Where(product => product.ClientId == tenant.ClientId).Select(product => product.Product!.ProductName).FirstOrDefault() ?? policy.Lob,
                Premium = policy.LimitCoverages.Where(c => c.ClientId == tenant.ClientId).Select(c => c.CalculatedPremium).FirstOrDefault()
            };

        var search = input.Search?.Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(search))
            query = query.Where(x =>
                (x.Policy.QuoteNumber != null && x.Policy.QuoteNumber.ToLower().Contains(search)) ||
                x.Policy.PolicyNumber.ToLower().Contains(search) ||
                (x.Account != null && (((x.Account.FirstName ?? "") + " " + (x.Account.MiddleName ?? "") + " " + (x.Account.LastName ?? "")).ToLower().Contains(search) || (x.Account.LegalBusinessName ?? "").ToLower().Contains(search))) ||
                (x.Lob != null && x.Lob.ToLower().Contains(search)) ||
                (x.Policy.ApprovalStatus != null && x.Policy.ApprovalStatus.ToLower().Contains(search)) ||
                (x.Policy.PolicyStatus != null && x.Policy.PolicyStatus.ToLower().Contains(search)));

        if (!string.IsNullOrWhiteSpace(input.AccountType))
        {
            var value = input.AccountType.Trim().ToUpperInvariant();
            query = query.Where(x => x.Account != null && x.Account.AccountType != null && x.Account.AccountType.ToUpper() == value);
        }
        if (!string.IsNullOrWhiteSpace(input.TransactionType))
        {
            var types = TransactionTypes(input.TransactionType);
            query = query.Where(x => x.Policy.PolicyType != null && types.Contains(x.Policy.PolicyType.ToUpper()));
        }
        if (!string.IsNullOrWhiteSpace(input.InsuredName))
        {
            var value = input.InsuredName.Trim().ToLowerInvariant();
            query = query.Where(x => x.Account != null && (((x.Account.FirstName ?? "") + " " + (x.Account.MiddleName ?? "") + " " + (x.Account.LastName ?? "")).ToLower().Contains(value) || (x.Account.LegalBusinessName ?? "").ToLower().Contains(value)));
        }
        if (!string.IsNullOrWhiteSpace(input.Lob))
        {
            var value = input.Lob.Trim().ToLowerInvariant();
            query = query.Where(x => x.Lob != null && x.Lob.ToLower().Contains(value));
        }
        if (input.EffectiveDate.HasValue) query = query.Where(x => x.Policy.EffectiveDate == input.EffectiveDate.Value);
        if (!string.IsNullOrWhiteSpace(input.ApprovalStatus))
        {
            var value = input.ApprovalStatus.Trim().ToUpperInvariant();
            query = query.Where(x => x.Policy.ApprovalStatus != null && x.Policy.ApprovalStatus.ToUpper() == value);
        }
        if (input.CreationDate.HasValue) query = query.Where(x => x.Policy.QuoteCreationDate == input.CreationDate.Value || DateOnly.FromDateTime(x.Policy.CreatedOn) == input.CreationDate.Value);
        if (input.PremiumEstimate.HasValue) query = query.Where(x => x.Premium == input.PremiumEstimate.Value);
        if (!string.IsNullOrWhiteSpace(input.Status))
        {
            var value = input.Status.Trim().ToUpperInvariant();
            query = query.Where(x => x.Policy.PolicyStatus != null && x.Policy.PolicyStatus.ToUpper() == value);
        }

        var total = await query.CountAsync(cancellationToken);
        var ascending = string.Equals(input.SortDirection, "asc", StringComparison.OrdinalIgnoreCase);
        query = input.SortColumn?.ToLowerInvariant() switch
        {
            "quotenumber" => ascending ? query.OrderBy(x => x.Policy.QuoteNumber) : query.OrderByDescending(x => x.Policy.QuoteNumber),
            "transactiontype" => ascending ? query.OrderBy(x => x.Policy.PolicyType) : query.OrderByDescending(x => x.Policy.PolicyType),
            "insuredname" => ascending ? query.OrderBy(x => x.Account!.LegalBusinessName).ThenBy(x => x.Account!.FirstName).ThenBy(x => x.Account!.LastName) : query.OrderByDescending(x => x.Account!.LegalBusinessName).ThenByDescending(x => x.Account!.FirstName).ThenByDescending(x => x.Account!.LastName),
            "lob" => ascending ? query.OrderBy(x => x.Lob) : query.OrderByDescending(x => x.Lob),
            "effectivedate" => ascending ? query.OrderBy(x => x.Policy.EffectiveDate) : query.OrderByDescending(x => x.Policy.EffectiveDate),
            "approvalstatus" => ascending ? query.OrderBy(x => x.Policy.ApprovalStatus) : query.OrderByDescending(x => x.Policy.ApprovalStatus),
            "premium" or "premiumestimate" => ascending ? query.OrderBy(x => x.Premium) : query.OrderByDescending(x => x.Premium),
            "status" => ascending ? query.OrderBy(x => x.Policy.PolicyStatus) : query.OrderByDescending(x => x.Policy.PolicyStatus),
            "lastupdated" => ascending ? query.OrderBy(x => x.Policy.UpdatedOn) : query.OrderByDescending(x => x.Policy.UpdatedOn),
            _ => ascending ? query.OrderBy(x => x.Policy.QuoteCreationDate).ThenBy(x => x.Policy.CreatedOn) : query.OrderByDescending(x => x.Policy.QuoteCreationDate).ThenByDescending(x => x.Policy.CreatedOn)
        };

        var rows = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        var data = rows.Select(x => new DashboardQuoteDto(
            x.Policy.Id,
            x.Policy.QuoteNumber ?? x.Policy.PolicyNumber,
            TransactionLabel(x.Policy.PolicyType),
            AccountName(x.Account),
            x.Account?.AccountType,
            x.Lob,
            TransactionDate(x.Policy),
            x.Policy.ApprovalStatus,
            (x.Policy.QuoteCreationDate?.ToString("MM-dd-yyyy") ?? x.Policy.CreatedOn.ToString("MM-dd-yyyy")),
            x.Policy.UpdatedOn?.ToString("MM-dd-yyyy"),
            x.Premium,
            x.Policy.PolicyStatus)).ToList();

        return new DashboardQuoteResponse(data, total, page, pageSize);
    }

    public async Task<DashboardPagedResponse<DashboardPendingCancellationDto>> GetPendingCancellationsAsync(DashboardListQuery input, CancellationToken cancellationToken = default)
    {
        EnsureProducer();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var page = Math.Max(1, input.Page);
        var pageSize = NormalizePageSize(input.PageSize);
        var query =
            from policy in ScopedPolicies()
            where policy.PolicyStatus != null && policy.PolicyStatus.ToUpper() == "ACTIVE"
            join premium in db.PolicyPremiums.AsNoTracking().Where(p => p.ClientId == tenant.ClientId) on policy.Id equals premium.PolicyId
            join payment in db.PolicyPaymentTransactions.AsNoTracking().Where(p => p.ClientId == tenant.ClientId) on premium.Id equals payment.PolicyPremiumId
            join accountRow in db.Accounts.AsNoTracking().Where(a => a.ClientId == tenant.ClientId) on policy.AccountId equals accountRow.Id into accounts
            from account in accounts.DefaultIfEmpty()
            where payment.DueDate.Year == today.Year && payment.DueDate.Month == today.Month && payment.DueDate < today &&
                  payment.IsPaid != true && payment.TransactionStatus != null && payment.TransactionStatus.ToUpper() != "SUCCESS"
            select new { Policy = policy, Payment = payment, Account = account };

        var search = input.Search?.Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(search))
        {
            var hasDays = int.TryParse(search, NumberStyles.Integer, CultureInfo.InvariantCulture, out var daysOverdue);
            var dueDateForDays = hasDays ? today.AddDays(-daysOverdue) : default;
            var hasDate = DateOnly.TryParseExact(search, ["MM-dd-yyyy", "M-d-yyyy", "yyyy-MM-dd"], CultureInfo.InvariantCulture, DateTimeStyles.None, out var dueDate);
            var hasAmount = decimal.TryParse(search, NumberStyles.Number, CultureInfo.InvariantCulture, out var premiumAmount);
            query = query.Where(x =>
                x.Policy.PolicyNumber.ToLower().Contains(search) ||
                (hasDays && x.Payment.DueDate == dueDateForDays) ||
                (hasDate && x.Payment.DueDate == dueDate) ||
                (hasAmount && x.Payment.AmountDue == premiumAmount));
        }

        var total = await query.CountAsync(cancellationToken);
        var ascending = string.Equals(input.SortDirection, "asc", StringComparison.OrdinalIgnoreCase);
        query = input.SortColumn?.ToLowerInvariant() switch
        {
            "policynumber" => ascending ? query.OrderBy(x => x.Policy.PolicyNumber) : query.OrderByDescending(x => x.Policy.PolicyNumber),
            "duedate" => ascending ? query.OrderBy(x => x.Payment.DueDate) : query.OrderByDescending(x => x.Payment.DueDate),
            "premiumamount" => ascending ? query.OrderBy(x => x.Payment.AmountDue) : query.OrderByDescending(x => x.Payment.AmountDue),
            _ => query.OrderBy(x => x.Payment.DueDate)
        };
        var rows = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return new DashboardPagedResponse<DashboardPendingCancellationDto>(rows.Select(x => new DashboardPendingCancellationDto(
            x.Payment.Id, x.Policy.Id, x.Policy.PolicyNumber, AccountName(x.Account), today.DayNumber - x.Payment.DueDate.DayNumber,
            x.Payment.DueDate.ToString("MM-dd-yyyy"), x.Payment.AmountDue, DashboardCurrency)).ToList(), total, page, pageSize);
    }

    public async Task<DashboardPagedResponse<DashboardRenewalRadarDto>> GetRenewalRadarAsync(DashboardListQuery input, CancellationToken cancellationToken = default)
    {
        EnsureProducer();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var end = today.AddDays(60);
        var page = Math.Max(1, input.Page);
        var pageSize = NormalizePageSize(input.PageSize);
        var query =
            from policy in ScopedPolicies()
            where policy.PolicyType != null && RenewalRadarPolicyTypes.Contains(policy.PolicyType.ToUpper()) &&
                  policy.PolicyStatus != null && policy.PolicyStatus.ToUpper() == "ACTIVE" && policy.DoNotRenew == false &&
                  policy.ExpiryDate.HasValue && policy.ExpiryDate.Value >= today && policy.ExpiryDate.Value <= end
            join accountRow in db.Accounts.AsNoTracking().Where(a => a.ClientId == tenant.ClientId) on policy.AccountId equals accountRow.Id into accounts
            from account in accounts.DefaultIfEmpty()
            select new
            {
                Policy = policy,
                Account = account,
                Lob = policy.Products.Where(product => product.ClientId == tenant.ClientId).Select(product => product.Product!.ProductName).FirstOrDefault() ?? policy.Lob,
                Premium = policy.Premium != null && policy.Premium.ClientId == tenant.ClientId ? (decimal?)policy.Premium.TotalPremiumWithoutInstallmentFee : null
            };
        var search = input.Search?.Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(search))
        {
            var hasDays = int.TryParse(search, NumberStyles.Integer, CultureInfo.InvariantCulture, out var daysUntilExpiry);
            var expiryDateForDays = hasDays ? today.AddDays(daysUntilExpiry) : default;
            var hasDate = DateOnly.TryParseExact(search, ["MM-dd-yyyy", "M-d-yyyy", "yyyy-MM-dd"], CultureInfo.InvariantCulture, DateTimeStyles.None, out var expiryDate);
            var hasAmount = decimal.TryParse(search, NumberStyles.Number, CultureInfo.InvariantCulture, out var premiumAmount);
            query = query.Where(x =>
                x.Policy.PolicyNumber.ToLower().Contains(search) ||
                (x.Lob != null && x.Lob.ToLower().Contains(search)) ||
                (hasDays && x.Policy.ExpiryDate == expiryDateForDays) ||
                (hasDate && x.Policy.ExpiryDate == expiryDate) ||
                (hasAmount && x.Premium == premiumAmount));
        }
        var total = await query.CountAsync(cancellationToken);
        var ascending = string.Equals(input.SortDirection, "asc", StringComparison.OrdinalIgnoreCase);
        query = input.SortColumn?.ToLowerInvariant() switch
        {
            "policynumber" => ascending ? query.OrderBy(x => x.Policy.PolicyNumber) : query.OrderByDescending(x => x.Policy.PolicyNumber),
            "lob" or "lineofbusiness" => ascending ? query.OrderBy(x => x.Lob) : query.OrderByDescending(x => x.Lob),
            "premium" or "premiumamount" => ascending ? query.OrderBy(x => x.Premium) : query.OrderByDescending(x => x.Premium),
            "expirydate" => ascending ? query.OrderBy(x => x.Policy.ExpiryDate) : query.OrderByDescending(x => x.Policy.ExpiryDate),
            _ => query.OrderBy(x => x.Policy.ExpiryDate)
        };
        var rows = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return new DashboardPagedResponse<DashboardRenewalRadarDto>(rows.Select(x => new DashboardRenewalRadarDto(
            x.Policy.Id, x.Policy.PolicyNumber, AccountName(x.Account), x.Lob, x.Premium, null,
            x.Policy.ExpiryDate!.Value.ToString("MM-dd-yyyy"), x.Policy.ExpiryDate.Value.DayNumber - today.DayNumber, DashboardCurrency)).ToList(), total, page, pageSize);
    }

    public async Task<DashboardPagedResponse<DashboardFailedPaymentDto>> GetFailedPaymentsAsync(DashboardListQuery input, CancellationToken cancellationToken = default)
    {
        if (tenant.ProducerId.HasValue) throw new UnauthorizedAccessException("Failed-payment data is available only to client users.");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var page = Math.Max(1, input.Page);
        var pageSize = NormalizePageSize(input.PageSize);
        var query =
            from policy in ScopedPolicies()
            join premium in db.PolicyPremiums.AsNoTracking().Where(p => p.ClientId == tenant.ClientId) on policy.Id equals premium.PolicyId
            join payment in db.PolicyPaymentTransactions.AsNoTracking().Where(p => p.ClientId == tenant.ClientId) on premium.Id equals payment.PolicyPremiumId
            where payment.DueDate <= today && payment.IsPaid != true && (payment.TransactionStatus == null || payment.TransactionStatus.ToUpper() != "SUCCESS")
            select new { Policy = policy, Payment = payment };
        var search = input.Search?.Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(search)) query = query.Where(x => x.Policy.PolicyNumber.ToLower().Contains(search) || (x.Payment.TransactionStatus != null && x.Payment.TransactionStatus.ToLower().Contains(search)));
        var policyNumber = input.PolicyNumber?.Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(policyNumber)) query = query.Where(x => x.Policy.PolicyNumber.ToLower().Contains(policyNumber));
        if (input.EffectiveDate.HasValue) query = query.Where(x => x.Policy.EffectiveDate == input.EffectiveDate.Value);
        if (input.ExpiryDate.HasValue) query = query.Where(x => x.Policy.ExpiryDate == input.ExpiryDate.Value);
        if (input.PaymentDate.HasValue) query = query.Where(x => x.Payment.DueDate == input.PaymentDate.Value);
        if (input.AmountDue.HasValue) query = query.Where(x => x.Payment.AmountDue == input.AmountDue.Value);
        var reason = input.Reason?.Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(reason)) query = query.Where(x =>
            (x.Payment.TransactionStatus ?? "Payment overdue").ToLower().Contains(reason));
        var total = await query.CountAsync(cancellationToken);
        var ascending = string.Equals(input.SortDirection, "asc", StringComparison.OrdinalIgnoreCase);
        query = input.SortColumn?.ToLowerInvariant() switch
        {
            "policynumber" => ascending ? query.OrderBy(x => x.Policy.PolicyNumber) : query.OrderByDescending(x => x.Policy.PolicyNumber),
            "effectivedate" => ascending ? query.OrderBy(x => x.Policy.EffectiveDate) : query.OrderByDescending(x => x.Policy.EffectiveDate),
            "expirydate" or "expirationdate" => ascending ? query.OrderBy(x => x.Policy.ExpiryDate) : query.OrderByDescending(x => x.Policy.ExpiryDate),
            "paymentdate" or "duedate" => ascending ? query.OrderBy(x => x.Payment.DueDate) : query.OrderByDescending(x => x.Payment.DueDate),
            "amount" or "amountdue" => ascending ? query.OrderBy(x => x.Payment.AmountDue) : query.OrderByDescending(x => x.Payment.AmountDue),
            "reason" => ascending ? query.OrderBy(x => x.Payment.TransactionStatus) : query.OrderByDescending(x => x.Payment.TransactionStatus),
            _ => query.OrderByDescending(x => x.Payment.DueDate)
        };
        var rows = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return new DashboardPagedResponse<DashboardFailedPaymentDto>(rows.Select(x => new DashboardFailedPaymentDto(
            x.Payment.Id, x.Policy.Id, x.Policy.PolicyNumber, x.Policy.EffectiveDate?.ToString("MM-dd-yyyy"), x.Policy.ExpiryDate?.ToString("MM-dd-yyyy"),
            x.Payment.DueDate.ToString("MM-dd-yyyy"), x.Payment.AmountDue, x.Payment.TransactionStatus ?? "Payment overdue", DashboardCurrency)).ToList(), total, page, pageSize);
    }

    public async Task<DashboardPreferenceDto> GetPreferenceAsync(CancellationToken cancellationToken = default)
    {
        string? json;
        try
        {
            json = await db.DashboardPreferences.AsNoTracking()
                .Where(x => x.ClientId == tenant.ClientId && x.UserId == tenant.UserId)
                .Select(x => x.ConfigurationJson)
                .SingleOrDefaultAsync(cancellationToken);
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UndefinedTable)
        {
            // Widget preferences are optional for viewing. Existing databases may not
            // have the Dashboard migration yet, so return the normal default layout.
            return DefaultPreference();
        }
        if (string.IsNullOrWhiteSpace(json)) return DefaultPreference();
        try { return NormalizePreference(JsonSerializer.Deserialize<DashboardPreferenceDto>(json) ?? DefaultPreference()); }
        catch (JsonException) { return DefaultPreference(); }
    }

    public async Task<DashboardPreferenceDto> SavePreferenceAsync(DashboardPreferenceDto preference, CancellationToken cancellationToken = default)
    {
        var normalized = NormalizePreference(preference);
        if (!normalized.Widgets.Any(x => x.IsVisible)) throw new ArgumentException("Select at least one dashboard widget.");
        try
        {
            var row = await db.DashboardPreferences.SingleOrDefaultAsync(x => x.ClientId == tenant.ClientId && x.UserId == tenant.UserId, cancellationToken);
            if (row == null)
            {
                row = new DashboardPreference { ClientId = tenant.ClientId, UserId = tenant.UserId };
                db.DashboardPreferences.Add(row);
            }
            row.ConfigurationJson = JsonSerializer.Serialize(normalized);
            row.UpdatedOn = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
            return normalized;
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UndefinedTable)
        {
            throw new InvalidOperationException("Dashboard widget preferences require the Dashboard database migration.", ex);
        }
    }

    public async Task RecordViewAsync(long policyId, CancellationToken cancellationToken = default)
    {
        var policy = await ScopedPolicies().SingleOrDefaultAsync(p => p.Id == policyId, cancellationToken)
            ?? throw new KeyNotFoundException("Dashboard record was not found.");
        var duplicateThreshold = DateTime.UtcNow.AddSeconds(-5);
        if (await db.Audits.AnyAsync(a => a.ClientId == tenant.ClientId && a.CreatedBy == tenant.UserId && a.RecordId == policyId && a.Module == "Dashboard" && a.ActivityType == "View" && a.CreatedDateTime >= duplicateThreshold, cancellationToken)) return;
        var recordNumber = policy.QuoteNumber ?? policy.PolicyNumber;
        db.Audits.Add(new Audit
        {
            ClientId = tenant.ClientId,
            RecordId = policy.Id,
            ActivityType = "View",
            ActivityDescription = $"{(QuoteTypes.Contains((policy.PolicyType ?? "").ToUpperInvariant()) ? "Submission" : "Policy")} viewed for ID {recordNumber}",
            Module = "Dashboard",
            TableName = "policy",
            CreatedBy = tenant.UserId,
            CreatedDateTime = DateTime.UtcNow
        });
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<DashboardRenewalResultDto> InitiateRenewalAsync(long policyId, CancellationToken cancellationToken = default)
    {
        EnsureProducer();
        var policy = await ScopedPolicies().SingleOrDefaultAsync(p => p.Id == policyId, cancellationToken)
            ?? throw new KeyNotFoundException("Policy was not found.");
        if (policy.PolicyStatus == null || !policy.PolicyStatus.Equals("Active", StringComparison.OrdinalIgnoreCase) || policy.DoNotRenew == true)
            throw new InvalidOperationException("The policy is not eligible for renewal.");
        var result = await renewalQuoteService.CreateRenewalQuoteAsync(policy.PolicyNumber, DateOnly.FromDateTime(DateTime.UtcNow), tenant.UserId);
        if (!result.Success) throw new InvalidOperationException(result.Message ?? "Renewal quote could not be created.");
        return new DashboardRenewalResultDto(result.PolicyId, result.QuoteNumber);
    }

    private DashboardContextDto GetContext() => new(
        tenant.ProducerId.HasValue ? DashboardPersonas.Producer : DashboardPersonas.Client,
        true,
        DashboardCurrency);

    private async Task<List<DashboardRecentActivityDto>> GetRecentActivitiesAsync(CancellationToken cancellationToken)
    {
        var policies = ScopedPolicies();
        var rows = await (
            from audit in db.Audits.AsNoTracking()
            join policy in policies on audit.RecordId equals policy.Id
            where audit.ClientId == tenant.ClientId && audit.CreatedBy == tenant.UserId && audit.Module == "Dashboard" && audit.ActivityType == "View"
            orderby audit.CreatedDateTime descending
            select new { audit, policy }).Take(10).ToListAsync(cancellationToken);
        return rows.Select(x => new DashboardRecentActivityDto(x.audit.Id, x.policy.Id, x.policy.QuoteNumber ?? x.policy.PolicyNumber,
            QuoteTypes.Contains((x.policy.PolicyType ?? "").ToUpperInvariant()) ? "quote" : "policy",
            x.audit.ActivityDescription ?? "Record viewed", x.audit.CreatedDateTime)).ToList();
    }

    private void EnsureProducer()
    {
        if (!tenant.ProducerId.HasValue) throw new UnauthorizedAccessException("This dashboard feature is available only to producers.");
    }

    private static int NormalizePageSize(int pageSize) => pageSize is 10 or 25 or 50 ? pageSize : 10;

    private static string[] TransactionTypes(string value) => value.Trim().ToUpperInvariant() switch
    {
        "NEW BUSINESS" or "NEWBUSINESS" => ["NEWBUSINESS", "NEWBUSINESSINDIVIDUAL", "NEWBUSINESSBUSINESS"],
        "ENDORSEMENT" => ["ENDORSEMENT", "ENDORSEMENTINDIVIDUAL", "ENDORSEMENTBUSINESS"],
        "RENEWAL" => ["RENEWAL", "RENEWALINDIVIDUAL", "RENEWALBUSINESS"],
        var exact => [exact]
    };

    private static DashboardPreferenceDto DefaultPreference() => new(WidgetKeys.Select((key, index) => new DashboardWidgetPreferenceDto(key, index, true)).ToList());

    private static DashboardPreferenceDto NormalizePreference(DashboardPreferenceDto preference)
    {
        var supplied = preference.Widgets
            .Where(x => WidgetKeys.Contains(x.WidgetKey, StringComparer.OrdinalIgnoreCase))
            .GroupBy(x => x.WidgetKey, StringComparer.OrdinalIgnoreCase)
            .Select(g => g.First())
            .OrderBy(x => x.DisplayOrder)
            .ToList();
        var result = new List<DashboardWidgetPreferenceDto>();
        foreach (var item in supplied) result.Add(new DashboardWidgetPreferenceDto(WidgetKeys.First(k => k.Equals(item.WidgetKey, StringComparison.OrdinalIgnoreCase)), result.Count, item.IsVisible));
        foreach (var key in WidgetKeys.Where(key => result.All(x => x.WidgetKey != key))) result.Add(new DashboardWidgetPreferenceDto(key, result.Count, true));
        return new DashboardPreferenceDto(result);
    }

    private static string AccountName(Account? account)
    {
        if (account == null) return "-";
        if (string.Equals(account.AccountType, "Business", StringComparison.OrdinalIgnoreCase)) return account.LegalBusinessName?.Trim() ?? "-";
        var name = string.Join(" ", new[] { account.FirstName, account.MiddleName, account.LastName }.Where(value => !string.IsNullOrWhiteSpace(value)));
        return string.IsNullOrWhiteSpace(name) ? "-" : name;
    }

    private static string TransactionLabel(string? policyType)
    {
        var value = policyType?.ToUpperInvariant() ?? "";
        if (value.StartsWith("NEWBUSINESS")) return "New Business";
        if (value.StartsWith("ENDORSEMENT")) return "Endorsement";
        if (value.StartsWith("RENEWAL")) return "Renewal";
        return policyType ?? "-";
    }

    private static string? TransactionDate(Policy policy)
    {
        var value = policy.PolicyType?.ToUpperInvariant() ?? "";
        if (value.StartsWith("ENDORSEMENT")) return policy.Extended?.EndorsementEffectiveDate?.ToString("MM-dd-yyyy") ?? policy.EffectiveDate?.ToString("MM-dd-yyyy");
        if (value.StartsWith("RENEWAL")) return policy.Extended?.RenewalOfferDate?.ToString("MM-dd-yyyy") ?? policy.EffectiveDate?.ToString("MM-dd-yyyy");
        return policy.EffectiveDate?.ToString("MM-dd-yyyy");
    }
}
