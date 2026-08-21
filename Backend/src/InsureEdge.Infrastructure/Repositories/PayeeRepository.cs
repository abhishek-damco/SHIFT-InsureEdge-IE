using InsureEdge.Application.DTOs.Payee;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Repositories;

public class PayeeRepository : IPayeeRepository
{
    private readonly InsureEdgeDbContext _db;

    public PayeeRepository(InsureEdgeDbContext db) => _db = db;

    // ── Queries ────────────────────────────────────────────────────────────────

    public async Task<List<PayeeListItemDto>> GetListAsync(long clientId)
    {
        var paymentTotals = await BuildPaymentTotals(clientId);
        var payees = await _db.Payees
            .Where(x => x.ClientId == clientId)
            .Include(x => x.Claim).ThenInclude(c => c!.Policy)
            .Include(x => x.BankDetails)
            .OrderByDescending(x => x.CreatedOn)
            .ToListAsync();

        return payees.Select(p => Map(p, paymentTotals)).ToList();
    }

    public async Task<List<PayeeListItemDto>> GetListByClaimAsync(long clientId, long claimId)
    {
        var paymentTotals = await _db.Set<WorksheetPayment>()
            .Where(wp => wp.Worksheet.ClaimId == claimId && wp.Worksheet.ClientId == clientId)
            .GroupBy(wp => wp.Worksheet.ClaimId)
            .Select(g => new { ClaimId = g.Key, Total = g.Sum(wp => wp.PaymentAmount) })
            .ToDictionaryAsync(x => x.ClaimId, x => x.Total);

        var payees = await _db.Payees
            .Where(x => x.ClientId == clientId && x.ClaimId == claimId)
            .Include(x => x.Claim).ThenInclude(c => c!.Policy)
            .Include(x => x.BankDetails)
            .OrderByDescending(x => x.CreatedOn)
            .ToListAsync();

        return payees.Select(p => Map(p, paymentTotals)).ToList();
    }

    public async Task<PayeeStatusKpiDto> GetStatusKpiAsync(long clientId, long? claimId)
    {
        var q = _db.Payees.Where(x => x.ClientId == clientId);
        if (claimId.HasValue)
            q = q.Where(x => x.ClaimId == claimId.Value);

        var counts = await q
            .GroupBy(x => x.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        int Get(string s) => counts.FirstOrDefault(x => x.Status == s)?.Count ?? 0;
        var total = counts.Sum(x => x.Count);

        return new PayeeStatusKpiDto(total, Get("Draft"), Get("Pending"), Get("Approved"), Get("Rejected"));
    }

    // ── Mutations ──────────────────────────────────────────────────────────────

    public async Task<long> CreateAsync(long clientId, long userId, CreatePayeeRequest req)
    {
        var payee = new Payee
        {
            ClientId        = clientId,
            ClaimId         = req.ClaimId,
            ClaimPayeeType  = req.ClaimPayeeType,
            FirstName       = req.FirstName,
            MiddleName      = req.MiddleName,
            LastName        = req.LastName,
            BusinessName    = req.BusinessName,
            NationalId      = req.NationalId,
            SocialSecurityNumber = req.SocialSecurityNumber,
            TinId           = req.TinId,
            PayeeType       = req.PayeeType,
            Relationship    = req.Relationship,
            TelephoneNumberCC = req.TelephoneNumberCC,
            TelephoneNumber = req.TelephoneNumber,
            Email           = req.Email,
            Status          = "Draft",
            CreatedBy       = userId,
            CreatedOn       = DateTimeOffset.UtcNow,
        };

        if (req.BankDetail is { } bd)
        {
            payee.BankDetails.Add(new BankDetail
            {
                ClientId                   = clientId,
                PaymentMethod              = bd.PaymentMethod,
                BankName                   = bd.BankName,
                AccountHolderName          = bd.AccountHolderName,
                AccountNumber              = bd.AccountNumber,
                AccountType                = bd.AccountType,
                AbaRoutingNumber           = bd.AbaRoutingNumber,
                BusinessName               = bd.BusinessName,
                FederalTaxClassification   = bd.FederalTaxClassification,
                EmployerIdentificationNumber = bd.EmployerIdentificationNumber,
                Type1099                   = bd.Type1099,
                W9FormOnFile               = bd.W9FormOnFile,
                CreatedBy                  = userId,
                CreatedOn                  = DateTimeOffset.UtcNow,
            });
        }

        if (req.Address is { } addr)
        {
            payee.Addresses.Add(new CommonAddress
            {
                AddressType   = "Payee",
                IsManual      = addr.IsManual,
                GoogleAddress = addr.GoogleAddress,
                AddressLine1  = addr.AddressLine1,
                AddressLine2  = addr.AddressLine2,
                Country       = addr.Country,
                State         = addr.State,
                City          = addr.City,
                County        = addr.County,
                ZipCode       = addr.ZipCode,
                Latitude      = addr.Latitude,
                Longitude     = addr.Longitude,
                IsActive      = true,
                CreatedBy     = userId,
                CreatedOn     = DateTimeOffset.UtcNow,
            });
        }

        _db.Payees.Add(payee);
        await _db.SaveChangesAsync();
        return payee.Id;
    }

    public async Task UpdateBankingAsync(long clientId, long userId, long payeeId, CreateBankDetailRequest req)
    {
        var payee = await _db.Payees
            .Include(x => x.BankDetails)
            .FirstOrDefaultAsync(x => x.Id == payeeId && x.ClientId == clientId);
        if (payee is null) return;

        var bd = payee.BankDetails.FirstOrDefault();
        if (bd is null)
        {
            payee.BankDetails.Add(new BankDetail
            {
                ClientId                     = clientId,
                PaymentMethod                = req.PaymentMethod,
                BankName                     = req.BankName,
                AccountHolderName            = req.AccountHolderName,
                AccountNumber                = req.AccountNumber,
                AccountType                  = req.AccountType,
                AbaRoutingNumber             = req.AbaRoutingNumber,
                BusinessName                 = req.BusinessName,
                FederalTaxClassification     = req.FederalTaxClassification,
                EmployerIdentificationNumber = req.EmployerIdentificationNumber,
                Type1099                     = req.Type1099,
                W9FormOnFile                 = req.W9FormOnFile,
                CreatedBy                    = userId,
                CreatedOn                    = DateTimeOffset.UtcNow,
            });
        }
        else
        {
            bd.PaymentMethod                = req.PaymentMethod;
            bd.BankName                     = req.BankName;
            bd.AccountHolderName            = req.AccountHolderName;
            bd.AccountNumber                = req.AccountNumber;
            bd.AccountType                  = req.AccountType;
            bd.AbaRoutingNumber             = req.AbaRoutingNumber;
            bd.BusinessName                 = req.BusinessName;
            bd.FederalTaxClassification     = req.FederalTaxClassification;
            bd.EmployerIdentificationNumber = req.EmployerIdentificationNumber;
            bd.Type1099                     = req.Type1099;
            bd.W9FormOnFile                 = req.W9FormOnFile;
            bd.UpdatedBy                    = userId;
            bd.UpdatedOn                    = DateTimeOffset.UtcNow;
        }

        payee.UpdatedBy  = userId;
        payee.UpdatedOn  = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task SendForApprovalAsync(long clientId, long payeeId)
    {
        var payee = await _db.Payees
            .FirstOrDefaultAsync(x => x.Id == payeeId && x.ClientId == clientId);
        if (payee is null) return;

        payee.Status    = "Pending";
        payee.UpdatedOn = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
    }

    // ── Mapping helpers ────────────────────────────────────────────────────────

    private async Task<Dictionary<long, decimal>> BuildPaymentTotals(long clientId) =>
        await _db.Set<WorksheetPayment>()
            .Where(wp => wp.Worksheet.ClientId == clientId)
            .GroupBy(wp => wp.Worksheet.ClaimId)
            .Select(g => new { ClaimId = g.Key, Total = g.Sum(wp => wp.PaymentAmount) })
            .ToDictionaryAsync(x => x.ClaimId, x => x.Total);

    private static PayeeListItemDto Map(Payee p, Dictionary<long, decimal> paymentTotals)
    {
        var name           = BuildPayeeName(p);
        var initials       = BuildInitials(name);
        var avatarColor    = PickColor(p.Id);
        var claimNumber    = p.Claim?.ClaimNumber ?? "—";
        var policyNumber   = p.Claim?.Policy?.PolicyNumber ?? "—";
        var paymentMethod  = p.BankDetails.FirstOrDefault()?.PaymentMethod ?? "—";
        var compliance     = DeriveCompliance(p);
        var dateOfLoss     = p.Claim?.DateOfLoss?.ToString("MM/dd/yyyy") ?? "—";
        var lossType       = p.Claim?.MainCauseOfLoss ?? "—";
        var amount         = p.ClaimId.HasValue && paymentTotals.TryGetValue(p.ClaimId.Value, out var tot)
                             ? $"${tot:N2}" : "$0.00";

        return new PayeeListItemDto(
            p.Id, initials, avatarColor,
            name, p.PayeeType ?? "—",
            claimNumber, policyNumber,
            paymentMethod, compliance,
            dateOfLoss, lossType, amount,
            p.Status);
    }

    private static string BuildPayeeName(Payee p)
    {
        if (!string.IsNullOrWhiteSpace(p.BusinessName)) return p.BusinessName;
        var parts = new[] { p.FirstName, p.MiddleName, p.LastName }
            .Where(s => !string.IsNullOrWhiteSpace(s));
        var name = string.Join(" ", parts);
        return string.IsNullOrWhiteSpace(name) ? "Unknown" : name;
    }

    private static string BuildInitials(string name)
    {
        var words = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length == 0) return "?";
        if (words.Length == 1) return words[0][..Math.Min(2, words[0].Length)].ToUpper();
        return $"{words[0][0]}{words[^1][0]}".ToUpper();
    }

    private static string DeriveCompliance(Payee p)
    {
        var checks = new[] { p.OFACChecks, p.FraudCheck, p.BankDetailsValidation, p.DuplicatePayeeCheck, p.CertificationVerification };
        if (checks.Any(c => string.Equals(c, "Failed",  StringComparison.OrdinalIgnoreCase))) return "Alert";
        if (checks.All(c => string.Equals(c, "Passed",  StringComparison.OrdinalIgnoreCase))) return "Clear";
        return "Pending";
    }

    private static readonly string[] Colors =
        ["#4f46e5", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777", "#0284c7"];

    private static string PickColor(long id) => Colors[id % Colors.Length];
}
