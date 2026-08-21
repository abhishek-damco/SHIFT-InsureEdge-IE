// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// SubmissionRepository — implements ISubmissionRepository.
// Ported from prototype server.js POST/GET/PUT/DELETE /api/submissions/:id and
// GET /api/submissions/:id/commission.
// BR-SUB-001: Id is an app-generated 11-digit numeric string (server.js: random 7000000-9999999
//             range padded to 11 chars) — kept as varchar(20) PK per db/010.
// BR-SUB-002: PUT merges the incoming JSON body onto the existing stored "data" document
//             (shallow top-level merge), matching server.js `{ ...(existing?.data ?? {}), ...incoming }`.
// BR-SUB-003: GetCommissionAsync tries policy_commission first (latest non-cancelled row),
//             then falls back to a flat 12% default (intermediary_commission table referenced
//             by the prototype does not exist in our schema — out of the ported table set —
//             so the fallback is the flat default only, not a per-intermediary rate).
using System.Text.Json;
using System.Text.Json.Nodes;
using InsureEdge.Application.DTOs.QuotesPolicies;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Repositories;

public class SubmissionRepository : ISubmissionRepository
{
    private readonly InsureEdgeDbContext _db;
    private readonly ProducerScope? _producerScope;
    private static readonly Random _rng = new();

    public SubmissionRepository(InsureEdgeDbContext db, ICurrentTenantService tenant)
    {
        _db = db;
        _producerScope = ProducerScope.FromTenant(tenant);
    }

    public async Task<SubmissionDto> CreateAsync(long clientId, long userId, CreateSubmissionRequest req)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();

        string id;
        do
        {
            id = (3_700_000 + _rng.Next(0, 900_000)).ToString().PadLeft(11, '0');
        } while (await _db.Submissions.AnyAsync(s => s.Id == id));

        var dataJson = EnsureSubmissionDataHasIdentity(NormalizeJson(req.DataJson), id);
        var submission = new Submission
        {
            Id = id,
            ClientId = clientId,
            Status = "Draft",
            Data = dataJson,
            CreatedBy = userId,
            CreatedOn = DateTime.UtcNow,
        };
        _db.Submissions.Add(submission);
        await _db.SaveChangesAsync();

        await EnsurePolicyForSubmissionAsync(clientId, userId, id, dataJson);
        await SyncPolicyFromSubmissionAsync(clientId, userId, id, dataJson, submission.Status);

        await tx.CommitAsync();
        return Map(submission);
    }

    public async Task<SubmissionDto?> GetByIdAsync(long clientId, string id)
    {
        var row = await _db.Submissions.FirstOrDefaultAsync(s => s.Id == id && s.ClientId == clientId);
        if (row != null) return Map(row);

        // Legacy/seeded policies created directly in the `policy` table (not through the
        // wizard's CreateAsync flow) have no matching Submissions row, so the read-only
        // submission view would otherwise 404. Backfill a minimal one from the Policy's
        // relational data so it can still be viewed.
        return await BackfillSubmissionFromPolicyAsync(clientId, id);
    }

    public async Task<string?> GetSubmissionIdByQuoteNumberAsync(long clientId, string quoteNumber)
    {
        // The quoteNumber only exists inside each row's JSON blob (no relational column/index
        // for it). Data is mapped as jsonb (not text), so a LINQ .Contains() prefilter fails at
        // the SQL layer (Postgres has no like_escape(jsonb, ...) overload) — scope by ClientId
        // only and confirm the exact form.quoteNumber match in-memory.
        var candidates = await _db.Submissions
            .Where(s => s.ClientId == clientId)
            .Select(s => new { s.Id, s.Data })
            .ToListAsync();

        var matches = new List<string>();
        foreach (var candidate in candidates)
        {
            string? candidateQuoteNumber;
            try
            {
                var root = JsonNode.Parse(candidate.Data);
                candidateQuoteNumber = BlankToNull(StringOrNull(root?["form"], "quoteNumber"));
            }
            catch (JsonException)
            {
                continue;
            }
            if (candidateQuoteNumber == quoteNumber) matches.Add(candidate.Id);
        }
        if (matches.Count == 0) return null;
        if (matches.Count == 1) return matches[0];

        // More than one Submission shares this quoteNumber — a legacy phantom row created by
        // the id/quoteNumber mixup this endpoint exists to route around (UpsertAsync's
        // create-new-if-missing branch previously ran with the URL's quoteNumber as the id).
        // That phantom's own Id is, by construction, exactly the quoteNumber being searched
        // for here; a real Submission's Id is independently random and effectively never
        // collides with a QuoteNumber by chance. Prefer any match whose Id differs from the
        // quoteNumber; only fall back to a quoteNumber-Id match if that's all there is.
        return matches.FirstOrDefault(m => m != quoteNumber) ?? matches[0];
    }

    private async Task<SubmissionDto?> BackfillSubmissionFromPolicyAsync(long clientId, string id)
    {
        // Prefer an exact QuoteNumber match (unique per draft/endorsement), then the
        // non-Draft policy sharing that PolicyNumber (main/active record — PolicyNumber
        // is shared across a policy's endorsement drafts, so this avoids landing on an
        // unrelated in-progress draft when viewing Policy History), then anything else.
        var query = _db.Policies
            .Include(p => p.Account)
            .Include(p => p.Producer)
            .Include(p => p.Intermediary)
            .Include(p => p.RiskAddresses)
            .Where(p => p.ClientId == clientId);

        var policy = await query.Where(p => p.QuoteNumber == id).OrderByDescending(p => p.Id).FirstOrDefaultAsync()
            ?? await query.Where(p => p.PolicyNumber == id && p.PolicyStatus != "Draft").OrderByDescending(p => p.Id).FirstOrDefaultAsync()
            ?? await query.Where(p => p.PolicyNumber == id).OrderByDescending(p => p.Id).FirstOrDefaultAsync();
        if (policy == null) return null;

        var address = policy.RiskAddresses.FirstOrDefault(a => a.IsActive != false) ?? policy.RiskAddresses.FirstOrDefault();
        var isBusiness = string.Equals(policy.Account?.AccountType, "Business", StringComparison.OrdinalIgnoreCase);

        var form = new JsonObject
        {
            ["effectiveDate"] = DateOnlyToIso(policy.EffectiveDate),
            ["expirationDate"] = DateOnlyToIso(policy.ExpiryDate),
            ["policyTerm"] = policy.PolicyTerm ?? "Annual",
            ["quoteCreationDate"] = DateOnlyToIso(policy.QuoteCreationDate),
            ["writingCompany"] = policy.WritingCompany ?? "Sierra Specialty Insurance Company",
            ["insuredType"] = isBusiness ? "Business" : "Individual",
            ["brokerageFirm"] = policy.Intermediary?.IntermediaryName,
            ["producerName"] = policy.Producer == null ? null : string.Join(" ", new[] { policy.Producer.FirstName, policy.Producer.LastName }.Where(s => !string.IsNullOrWhiteSpace(s))),
            ["firstName"] = policy.Account?.FirstName,
            ["middleName"] = policy.Account?.MiddleName,
            ["lastName"] = policy.Account?.LastName,
            ["addressLine1"] = address?.AddressLine1,
            ["addressLine2"] = address?.AddressLine2,
            ["country"] = address?.Country ?? "United States",
            ["state"] = address?.State,
            ["city"] = address?.City,
            ["county"] = address?.County,
            ["zip"] = address?.ZipCode,
            ["latitude"] = address?.Latitude,
            ["longitude"] = address?.Longitude,
            ["manualAddress"] = true,
            ["policyInsuranceType"] = policy.InsuranceType ?? "2",
            ["policyType"] = policy.PolicyType,
            ["policyNumber"] = policy.PolicyNumber,
            ["quoteNumber"] = policy.QuoteNumber,
            ["recordStatus"] = policy.PolicyStatus,
            ["lob"] = policy.Lob ?? "E&S Homeowners",
            ["subProduct"] = policy.SubProduct ?? "SuperPerils",
            ["lockSubmission"] = true,
        };

        var dataJson = new JsonObject { ["form"] = form }.ToJsonString();

        return new SubmissionDto(policy.QuoteNumber ?? policy.PolicyNumber, policy.PolicyStatus ?? "Active", policy.CreatedOn, dataJson);
    }

    private static string? DateOnlyToIso(DateOnly? d) => d?.ToString("yyyy-MM-dd");

    public async Task<SubmissionDto> UpsertAsync(long clientId, long userId, string id, UpdateSubmissionRequest req)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();

        var existing = await _db.Submissions.FirstOrDefaultAsync(s => s.Id == id && s.ClientId == clientId);
        var status = req.Status ?? existing?.Status ?? "Draft";
        var mergedJson = MergeJson(existing?.Data, req.DataJson);

        if (existing != null)
        {
            existing.Status = status;
            existing.Data = mergedJson;
            existing.UpdatedBy = userId;
            existing.UpdatedOn = DateTime.UtcNow;
        }
        else
        {
            existing = new Submission
            {
                Id = id,
                ClientId = clientId,
                Status = status,
                Data = mergedJson,
                CreatedBy = userId,
                CreatedOn = DateTime.UtcNow,
            };
            _db.Submissions.Add(existing);
        }

        await _db.SaveChangesAsync();

        // BR-SUB-004: keep the durable "policy" aggregate (account/policy/policy_limit_coverage)
        // in sync with the wizard's "form" fields — mirrors server.js syncPolicyFromSubmission().
        await SyncPolicyFromSubmissionAsync(clientId, userId, id, mergedJson, status);
        await tx.CommitAsync();
        return Map(existing);
    }

    public async Task<bool> DeleteAsync(long clientId, string id)
    {
        var row = await _db.Submissions.FirstOrDefaultAsync(s => s.Id == id && s.ClientId == clientId);
        if (row == null) return false;

        // Endorsement/renewal drafts: the Submission's own Id is NOT the linked Policy's
        // QuoteNumber (unlike New Business, where EnsurePolicyForSubmissionAsync uses the
        // Submission Id itself as QuoteNumber) — the real link only exists as "quoteNumber"
        // inside the Submission's own JSON blob (see PolicySummaryPage.tsx's endorse
        // handler / CreateEndorsementDraftAsync). Deleting only the Submission row would
        // leave that cloned Draft Policy graph behind forever, permanently blocking a
        // future endorsement attempt (CreateEndorsementDraftAsync's "already has an open
        // endorsement" guard). Clean up the linked draft too, if one exists.
        await DeleteLinkedDraftPolicyAsync(clientId, row.Data);

        _db.Submissions.Remove(row);
        await _db.SaveChangesAsync();
        return true;
    }

    private async Task DeleteLinkedDraftPolicyAsync(long clientId, string dataJson)
    {
        string? quoteNumber;
        try
        {
            var root = JsonNode.Parse(dataJson);
            quoteNumber = BlankToNull(StringOrNull(root?["form"], "quoteNumber"));
        }
        catch (JsonException)
        {
            return;
        }
        if (quoteNumber == null) return;

        var draft = await _db.Policies
            .Include(p => p.Extended)
            .Include(p => p.Products)
            .Include(p => p.LimitCoverages)
            .Include(p => p.Premium)
            .Include(p => p.Commissions)
            .Include(p => p.Mortgages)
            .Include(p => p.RiskAddresses).ThenInclude(r => r.RiskInformation)
            .Include(p => p.AdditionalInsureds)
            .Include(p => p.AdditionalOrganisations)
            .Include(p => p.Account)
            .FirstOrDefaultAsync(p => p.ClientId == clientId && p.QuoteNumber == quoteNumber && p.PolicyStatus == "Draft"
                        && (p.PolicyStage == "EndorsementIndividual" || p.PolicyStage == "EndorsementBusiness"
                            || p.PolicyStage == "RenewalIndividual" || p.PolicyStage == "RenewalBusiness"));
        if (draft == null) return;

        foreach (var ri in draft.RiskAddresses.SelectMany(ra => ra.RiskInformation).ToList())
            _db.PolicyRiskInformation.Remove(ri);
        foreach (var ra in draft.RiskAddresses.ToList())
            _db.RiskAddresses.Remove(ra);
        foreach (var ai in draft.AdditionalInsureds.ToList())
            _db.AdditionalInsureds.Remove(ai);
        foreach (var ao in draft.AdditionalOrganisations.ToList())
            _db.AdditionalOrganisations.Remove(ao);
        foreach (var m in draft.Mortgages.ToList())
            _db.PolicyMortgages.Remove(m);
        foreach (var c in draft.Commissions.ToList())
            _db.PolicyCommissions.Remove(c);
        if (draft.Premium != null)
            _db.PolicyPremiums.Remove(draft.Premium);
        foreach (var lc in draft.LimitCoverages.ToList())
            _db.PolicyLimitCoverages.Remove(lc);
        foreach (var p in draft.Products.ToList())
            _db.PolicyProducts.Remove(p);
        if (draft.Extended != null)
            _db.PolicyExtendeds.Remove(draft.Extended);

        var draftAccount = draft.Account;
        _db.Policies.Remove(draft);
        // The endorsement draft's own Account clone (IsDraft = true) has no other
        // references — safe to remove once the Policy row pointing at it is gone.
        if (draftAccount is { IsDraft: true })
            _db.Accounts.Remove(draftAccount);

        await _db.SaveChangesAsync();
    }

    public async Task<SubmissionCommissionDto?> GetCommissionAsync(long clientId, string id)
    {
        var policy = await _db.Policies.FirstOrDefaultAsync(p =>
            p.ClientId == clientId && (p.QuoteNumber == id || p.PolicyNumber == id));
        if (policy == null) return null;

        var commission = await _db.PolicyCommissions
            .Where(pc => pc.PolicyId == policy.Id && pc.ClientId == clientId && (pc.IsCancelled == null || pc.IsCancelled == false))
            .OrderByDescending(pc => pc.Id)
            .Select(pc => new
            {
                pc.CommissionPercentage,
                pc.InstallmentCommission,
                pc.AnnualCommission,
                pc.TotalCoveragePremium,
                pc.PaymentFrequency,
                pc.NumberOfInstallments,
                Brokerage = pc.Intermediary != null ? pc.Intermediary.IntermediaryName : null,
                Producer = pc.Producer,
            })
            .FirstOrDefaultAsync();

        if (commission != null)
        {
            var producerName = commission.Producer != null
                ? $"{commission.Producer.FirstName} {commission.Producer.LastName}".Trim()
                : null;
            return new SubmissionCommissionDto(
                commission.CommissionPercentage, commission.InstallmentCommission,
                commission.AnnualCommission, commission.TotalCoveragePremium,
                commission.PaymentFrequency, commission.NumberOfInstallments,
                commission.Brokerage, producerName);
        }

        // Fallback default (see BR-SUB-003 — intermediary_commission table not ported).
        const decimal defaultCommissionPct = 12m;
        return new SubmissionCommissionDto(defaultCommissionPct, null, null, null, null, null, null, null);
    }

    // ─── Payment plan (OutSystems SaveOnClick / GetPolicyDetails) ─────────────

    public async Task<PaymentPlanResponse?> GetPaymentPlanAsync(long clientId, string id)
    {
        Domain.Entities.Policy? policy = await _db.Policies.FirstOrDefaultAsync(p =>
            p.ClientId == clientId && (p.QuoteNumber == id || p.PolicyNumber == id));

        // If not found and id is numeric, try by Policy ID (endorsements/renewals opened with policy ID)
        if (policy == null && long.TryParse(id, out var policyId))
        {
            policy = await _db.Policies.FirstOrDefaultAsync(p =>
                p.Id == policyId && p.ClientId == clientId);
        }

        // If still not found, try to get it from submission data
        if (policy == null)
        {
            var submission = await _db.Submissions.FirstOrDefaultAsync(s => s.Id == id && s.ClientId == clientId);
            if (submission != null)
            {
                policy = await _db.Policies.FirstOrDefaultAsync(p =>
                    p.ClientId == clientId && (p.QuoteNumber == id || p.PolicyNumber == id));
            }
        }

        if (policy == null) return null;

        var premium = await _db.PolicyPremiums.FirstOrDefaultAsync(pp =>
            pp.PolicyId == policy.Id && pp.ClientId == clientId && (pp.IsCancelled == null || pp.IsCancelled == false));
        if (premium == null) return new PaymentPlanResponse(null, new List<InstallmentDto>());

        var installments = await LoadInstallmentsAsync(premium);
        return new PaymentPlanResponse(MapPremium(premium), installments);
    }

    public async Task<PaymentPlanResponse> SavePaymentPlanAsync(long clientId, long userId, string id, SavePaymentPlanRequest req)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();

        Domain.Entities.Policy? policy = null;

        // Try by QuoteNumber/PolicyNumber first (normal submissions)
        policy = await _db.Policies.FirstOrDefaultAsync(p =>
            p.ClientId == clientId && (p.QuoteNumber == id || p.PolicyNumber == id));

        // If not found and id is numeric, try by Policy ID (endorsements/renewals opened with policy ID)
        if (policy == null && long.TryParse(id, out var policyId))
        {
            policy = await _db.Policies.FirstOrDefaultAsync(p =>
                p.Id == policyId && p.ClientId == clientId);
        }

        // If still not found, try to get it from submission data (for orphaned endorsements/renewals)
        if (policy == null)
        {
            var submission = await _db.Submissions.FirstOrDefaultAsync(s => s.Id == id && s.ClientId == clientId);
            if (submission != null)
            {
                // For endorsements/renewals missing their policy record, create a minimal policy record
                // so payment plan can be saved. EnsurePolicyForSubmissionAsync won't create these, so do it directly.
                var newPolicy = new Domain.Entities.Policy
                {
                    ClientId = clientId,
                    QuoteNumber = id,
                    PolicyNumber = id,
                    PolicyType = "DRAFT",
                    PolicyStatus = "Draft",
                    CreatedBy = userId,
                    CreatedOn = DateTime.UtcNow,
                };
                _db.Policies.Add(newPolicy);
                await _db.SaveChangesAsync();
                policy = newPolicy;
            }
        }

        if (policy == null)
            throw new KeyNotFoundException("Submission not found.");

        var frequency = NormalizeFrequency(req.PaymentFrequency);
        var responsibleParty = NormalizeParty(req.ResponsibleParty);
        var numInstallments = frequency == "MONTHLY" ? 12 : 1;

        var coveragePremium = req.CoveragePremium ?? 0m;
        var totalTax = req.TotalTax ?? 0m;
        var policyFee = req.PolicyFee ?? 0m;
        var stampingFee = req.StampingFee ?? 0m;
        var totalPremium = coveragePremium + totalTax + policyFee + stampingFee;
        // PRD §4: Monthly carries a USD 10.00 fee per installment; Annual has none.
        var installmentFeePerPayment = frequency == "MONTHLY" ? 10m : 0m;
        var totalInstallmentFee = installmentFeePerPayment * numInstallments;

        var premium = await _db.PolicyPremiums.FirstOrDefaultAsync(pp =>
            pp.PolicyId == policy.Id && pp.ClientId == clientId && (pp.IsCancelled == null || pp.IsCancelled == false));
        if (premium == null)
        {
            premium = new PolicyPremium { ClientId = clientId, PolicyId = policy.Id, CreatedBy = userId };
            _db.PolicyPremiums.Add(premium);
        }
        else
        {
            premium.UpdatedBy = userId;
            premium.UpdatedOn = DateTime.UtcNow;
        }

        premium.PaymentFrequency = frequency;
        premium.ResponsibleParty = responsibleParty;
        premium.NumberOfInstallments = numInstallments;
        premium.PolicyFees = policyFee;
        premium.StampingFee = stampingFee;
        premium.TotalTax = totalTax;
        premium.TotalCoveragePremium = coveragePremium;
        premium.TotalInstallmentFee = totalInstallmentFee;
        premium.TotalPremiumWithoutInstallmentFee = totalPremium;
        premium.TotalPremiumWithInstallmentFee = totalPremium + totalInstallmentFee;
        premium.ModeOfPaymentToUse = BlankToNull(req.ModeOfPayment) ?? premium.ModeOfPaymentToUse;
        // PRD §8: read-only computed indicator — Insured pays to bind, Mortgagee (lender-billed) does not.
        premium.IsPaymentRequiredToBind = responsibleParty == "" ? premium.IsPaymentRequiredToBind : responsibleParty == "INSURED";
        premium.FirstPaymentDate = policy.EffectiveDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        await _db.SaveChangesAsync();

        // FirstPaymentTransaction (OutSystems): Deleteoldtransactions when nothing is paid,
        // then CreateOrUpdatePolicyPaymentTransactions for the new schedule.
        await RegenerateInstallmentsAsync(premium, userId);
        await tx.CommitAsync();

        var installments = await LoadInstallmentsAsync(premium);
        return new PaymentPlanResponse(MapPremium(premium), installments);
    }

    // ─── Bind (BindOnClick → UpdatePolicyStatus_BL) ───────────────────────────

    public async Task<IssuePolicyResponse> BindPolicyAsync(long clientId, long userId, string id)
    {
        Domain.Entities.Policy? policy = await _db.Policies.FirstOrDefaultAsync(p =>
            p.ClientId == clientId && (p.QuoteNumber == id || p.PolicyNumber == id));

        // If not found and id is numeric, try by Policy ID (endorsements/renewals opened with policy ID)
        if (policy == null && long.TryParse(id, out var policyId))
        {
            policy = await _db.Policies.FirstOrDefaultAsync(p =>
                p.Id == policyId && p.ClientId == clientId);
        }

        if (policy == null)
            throw new KeyNotFoundException("Submission not found.");

        // ValidatePaymentPlan (PRD §15): the payment plan must be saved with a responsible
        // party and payment frequency before the quote can be bound.
        var premium = await _db.PolicyPremiums.FirstOrDefaultAsync(pp =>
            pp.PolicyId == policy.Id && pp.ClientId == clientId && (pp.IsCancelled == null || pp.IsCancelled == false));
        if (premium == null || string.IsNullOrWhiteSpace(premium.ResponsibleParty))
            throw new InvalidOperationException("Provide Responsible Party to continue");
        if (string.IsNullOrWhiteSpace(premium.PaymentFrequency))
            throw new InvalidOperationException("Provide Payment Frequency to continue");

        var isMortgagee = string.Equals(premium.ResponsibleParty, "MORTGAGEE", StringComparison.OrdinalIgnoreCase);
        if (isMortgagee)
        {
            if (!string.Equals(premium.PaymentFrequency, "ANNUAL", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Payment Frequency should be Annual when Responsible Party is Mortgagee");
            var hasMortgagee = await _db.PolicyMortgages.AnyAsync(m =>
                m.PolicyId == policy.Id && m.ClientId == clientId && (m.IsDeleted == null || m.IsDeleted == false));
            if (!hasMortgagee)
            {
                var draft = await _db.Submissions
                    .Where(s => s.Id == id && s.ClientId == clientId)
                    .Select(s => s.Data)
                    .FirstOrDefaultAsync();
                hasMortgagee = HasDraftMortgages(draft);
            }
            if (!hasMortgagee)
                throw new InvalidOperationException("Responsible Party cannot be Mortgagee when no Mortgagee Information records exist in the quote");
        }

        policy.PolicyStatus = "Bound";
        policy.UpdatedBy = userId;
        policy.UpdatedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return new IssuePolicyResponse(true, policy.PolicyNumber, policy.PolicyStatus,
            await ScreenCodeAsync(clientId, policy), "Policy has been bound successfully.");
    }

    // ─── Issue Policy (IssueOnClick → IssuePolicyHB_BL) ───────────────────────

    public async Task<IssuePolicyResponse> IssuePolicyAsync(long clientId, long userId, string id)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();

        var submission = await _db.Submissions.FirstOrDefaultAsync(s => s.Id == id && s.ClientId == clientId);
        var policy = await _db.Policies
            .Include(p => p.Extended)
            .FirstOrDefaultAsync(p => p.ClientId == clientId && (p.QuoteNumber == id || p.PolicyNumber == id));

        // If not found and id is numeric, try by Policy ID (endorsements/renewals opened with policy ID)
        if (policy == null && long.TryParse(id, out var policyId))
        {
            policy = await _db.Policies
                .Include(p => p.Extended)
                .FirstOrDefaultAsync(p => p.Id == policyId && p.ClientId == clientId);
        }

        if (policy == null)
            throw new KeyNotFoundException("Submission not found.");

        // GetPolicyDetails guard: quote already converted → exit without re-issuing.
        if (policy.PolicyType == "POLICY" && policy.PolicyIssuedOn != null)
            return new IssuePolicyResponse(false, policy.PolicyNumber, policy.PolicyStatus,
                await ScreenCodeAsync(clientId, policy), "Policy has already been issued.");

        // ListFilter commission gate (IssueOnClick): a commission schedule with a valid
        // percentage must exist. BR-SUB-003 flat 12% default applies when no row exists.
        var commissionRow = await _db.PolicyCommissions
            .Where(pc => pc.PolicyId == policy.Id && pc.ClientId == clientId && (pc.IsCancelled == null || pc.IsCancelled == false))
            .OrderByDescending(pc => pc.Id)
            .FirstOrDefaultAsync();
        var commissionPct = commissionRow?.CommissionPercentage ?? 12m;
        if (commissionPct <= 0)
            throw new InvalidOperationException("A commission schedule and valid commission percentage must be configured before the policy can be issued.");

        // ValidatePaymentPlan (GetPolicyDetails.PolicyPremiumInfo checks): the payment plan
        // must be saved with a payment frequency and responsible party before issuing.
        var premium = await _db.PolicyPremiums.FirstOrDefaultAsync(pp =>
            pp.PolicyId == policy.Id && pp.ClientId == clientId && (pp.IsCancelled == null || pp.IsCancelled == false));
        if (premium == null || string.IsNullOrWhiteSpace(premium.PaymentFrequency))
            throw new InvalidOperationException("Payment Frequency is required before issuing.");
        if (string.IsNullOrWhiteSpace(premium.ResponsibleParty))
            throw new InvalidOperationException("Responsible Party is required before issuing.");

        // ValidateLenderDockDetails: Mortgagee-billed policies need lender (mortgage) details.
        // The quote wizard stores mortgagees in the submission draft JSON (data.mortgages),
        // not in policy_mortgage, so accept either source.
        var mortgages = await _db.PolicyMortgages
            .Where(m => m.PolicyId == policy.Id && m.ClientId == clientId && (m.IsDeleted == null || m.IsDeleted == false))
            .ToListAsync();
        if (string.Equals(premium.ResponsibleParty, "MORTGAGEE", StringComparison.OrdinalIgnoreCase)
            && mortgages.Count == 0 && !HasDraftMortgages(submission?.Data))
            throw new InvalidOperationException("Lender details are required when the Responsible Party is Mortgagee.");

        var account = policy.AccountId.HasValue
            ? await _db.Accounts.FirstOrDefaultAsync(a => a.Id == policy.AccountId.Value && a.ClientId == clientId)
            : null;
        var isBusiness = string.Equals(account?.AccountType, "business", StringComparison.OrdinalIgnoreCase);

        // CreatePolicyNumber_HB: reuse an already-generated number (GetLatestPolicyforPolicyNo
        // branch), otherwise GenerateNewBusinessHBISPolicyNumber.
        var policyNumber = policy.PolicyNumber != policy.QuoteNumber && !string.IsNullOrWhiteSpace(policy.PolicyNumber)
            ? policy.PolicyNumber
            : await GenerateNewBusinessPolicyNumberAsync(clientId);

        // Quote → policy conversion (CreatePolicy_CS2 / UpdatePolicyType):
        // PolicyType 'POLICY' moves the record from the NB Quotes register to the Policies
        // register; the Individual/Business split (Policy Individual vs Policy Business)
        // is carried by account.account_type and recorded on policy_extended.
        policy.PolicyNumber = policyNumber;
        policy.PolicyType = "POLICY";
        policy.PolicyStatus = "Active";
        policy.PolicyIssuedOn = DateTime.UtcNow;
        policy.LockSubmission = true;
        policy.UpdatedBy = userId;
        policy.UpdatedOn = DateTime.UtcNow;

        // Extract and set ALL relevant fields from submission
        DateOnly? extractedEffDate = null;
        DateOnly? extractedExpDate = null;
        string? extractedState = null;

        if (submission != null && !string.IsNullOrEmpty(submission.Data))
        {
            try
            {
                using var doc = JsonDocument.Parse(submission.Data);
                var root = doc.RootElement;
                var form = root.TryGetProperty("form", out var formElem) ? formElem : root;

                // Extract dates - try multiple date formats
                if (form.TryGetProperty("effectiveDate", out var effDateElem) && effDateElem.ValueKind != JsonValueKind.Null)
                {
                    var dateStr = effDateElem.GetString()?.Trim();
                    if (!string.IsNullOrEmpty(dateStr))
                    {
                        // Try parsing: "25-06-2026 00:00:00" → "25-06-2026"
                        var datePart = dateStr.Split()[0];
                        if (DateOnly.TryParse(datePart, System.Globalization.CultureInfo.GetCultureInfo("en-GB"), System.Globalization.DateTimeStyles.None, out var effDate))
                            extractedEffDate = effDate;
                        else if (DateOnly.TryParse(dateStr, out var effDate2))
                            extractedEffDate = effDate2;
                    }
                }
                if (form.TryGetProperty("expirationDate", out var expDateElem) && expDateElem.ValueKind != JsonValueKind.Null)
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

                // Extract state
                if (form.TryGetProperty("state", out var stateElem) && stateElem.ValueKind != JsonValueKind.Null)
                    extractedState = stateElem.GetString();
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[IssuePolicyAsync] Error parsing submission data: {ex.Message}");
            }
        }

        // Set extracted dates
        if (extractedEffDate.HasValue)
            policy.EffectiveDate = extractedEffDate.Value;
        if (extractedExpDate.HasValue)
            policy.ExpiryDate = extractedExpDate.Value;
        if (!string.IsNullOrEmpty(extractedState))
            policy.StateProvince = extractedState;

        // Continue with other field extraction
        if (submission != null && !string.IsNullOrEmpty(submission.Data))
        {
            try
            {
                using var doc = JsonDocument.Parse(submission.Data);
                var root = doc.RootElement;
                var form = root.TryGetProperty("form", out var formElem) ? formElem : root;

                // Address and location
                if (form.TryGetProperty("country", out var countryElem) && countryElem.ValueKind != JsonValueKind.Null)
                    policy.Country = countryElem.GetString();
                if (form.TryGetProperty("state", out var stateElem) && stateElem.ValueKind != JsonValueKind.Null)
                    policy.StateProvince = stateElem.GetString();
                if (form.TryGetProperty("addressLine1", out var addrElem) && addrElem.ValueKind != JsonValueKind.Null)
                    policy.Address = addrElem.GetString();

                // Policy details
                if (form.TryGetProperty("lob", out var lobElem) && lobElem.ValueKind != JsonValueKind.Null)
                    policy.Lob = lobElem.GetString();
                if (form.TryGetProperty("subProduct", out var subElem) && subElem.ValueKind != JsonValueKind.Null)
                    policy.SubProduct = subElem.GetString();
                if (form.TryGetProperty("policyTerm", out var termElem) && termElem.ValueKind != JsonValueKind.Null)
                    policy.PolicyTerm = termElem.GetString();
                if (form.TryGetProperty("insuredName", out var nameElem) && nameElem.ValueKind != JsonValueKind.Null)
                    policy.InsuredName = nameElem.GetString();
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[IssuePolicyAsync] Error extracting fields from submission: {ex.Message}");
            }
        }

        var extended = policy.Extended
            ?? await _db.PolicyExtendeds.FirstOrDefaultAsync(e => e.PolicyId == policy.Id && e.ClientId == clientId);
        if (extended == null)
        {
            extended = new PolicyExtended { PolicyId = policy.Id, ClientId = clientId, CreatedBy = userId };
            _db.PolicyExtendeds.Add(extended);
        }
        extended.PrimaryInsuredType = isBusiness ? "Business" : "Individual";
        extended.UpdatedBy = userId;
        extended.UpdatedOn = DateTime.UtcNow;

        // CheckIfPolicyIsCancelRewrite_BL → MakePriorPolicyCancelled_HB: rewrite quotes
        // cancel their prior policy on issue.
        var isRewrite = extended.PriorPolicyId != null &&
            (extended.RewriteEffectiveDate != null || !string.IsNullOrWhiteSpace(extended.ReasonForRewritingPolicy));
        if (isRewrite)
        {
            var prior = await _db.Policies.FirstOrDefaultAsync(p => p.Id == extended.PriorPolicyId && p.ClientId == clientId);
            if (prior != null)
            {
                prior.PolicyStatus = "Cancelled";
                prior.UpdatedBy = userId;
                prior.UpdatedOn = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync();

        // FirstPaymentTransaction: rebuild the unpaid installment schedule from the plan.
        await RegenerateInstallmentsAsync(premium, userId);

        // CreateorUpdateHBIScommissiondetails + CreateorUpdateHBPolicyCommissionTransactions.
        await UpsertCommissionAsync(clientId, userId, policy, premium, commissionRow, commissionPct);

        // Sync the submission document so the wizard reopens in policy mode
        // (RefreshClientVariable / OnStatusChange on the client side).
        var screenCode = isBusiness ? "POLICYBUSINESS" : "POLICYINDIVIDUAL";
        if (submission != null)
        {
            submission.Status = "Active";
            submission.Data = ApplyIssuedIdentity(submission.Data, policyNumber, screenCode);
            submission.UpdatedBy = userId;
            submission.UpdatedOn = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return new IssuePolicyResponse(true, policyNumber, "Active", screenCode,
            $"Policy {policyNumber} has been issued successfully.");
    }

    // ─── Issue Endorsement (IssueEndorsementOnClick) ──────────────────────────
    // Same validation gates as IssuePolicyAsync (commission / payment plan / lender dock),
    // but the identity lookup differs: an endorsement Submission's own Id is NOT the
    // linked draft Policy's QuoteNumber (unlike New Business, where they're the same
    // value by construction — see EnsurePolicyForSubmissionAsync) — the real link is the
    // "quoteNumber" field stored inside the Submission's own JSON blob (set by
    // PolicySummaryPage.tsx's endorse handler from CreateEndorsementDraftAsync's result).
    // On success: the draft flips Draft→Active/ENDORSEMENT→POLICY (same PolicyNumber it
    // already carried), and the prior policy it was drafted against (PolicyExtended.
    // PriorPolicyId — always set for an endorsement, unlike the optional rewrite flag)
    // unconditionally flips to Cancelled, mirroring MakePriorPolicyCancelled_HB above.
    public async Task<IssuePolicyResponse> IssueEndorsementAsync(long clientId, long userId, string id)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();

        var submission = await _db.Submissions.FirstOrDefaultAsync(s => s.Id == id && s.ClientId == clientId)
            ?? throw new KeyNotFoundException("Submission not found.");

        string? quoteNumber;
        try
        {
            var root = JsonNode.Parse(submission.Data);
            quoteNumber = BlankToNull(StringOrNull(root?["form"], "quoteNumber"));
        }
        catch (JsonException)
        {
            quoteNumber = null;
        }
        if (quoteNumber == null)
            throw new KeyNotFoundException("Submission not found.");

        var policy = await _db.Policies
            .Include(p => p.Extended)
            .FirstOrDefaultAsync(p => p.ClientId == clientId && p.QuoteNumber == quoteNumber
                        && (p.PolicyStage == "EndorsementIndividual" || p.PolicyStage == "EndorsementBusiness"))
            ?? throw new KeyNotFoundException("Submission not found.");

        if (policy.PolicyStatus == "Active")
            return new IssuePolicyResponse(false, policy.PolicyNumber, policy.PolicyStatus,
                await ScreenCodeAsync(clientId, policy), "Endorsement has already been issued.");

        var priorPolicyId = policy.Extended?.PriorPolicyId
            ?? throw new InvalidOperationException("This endorsement has no prior policy on record — cannot issue.");

        var commissionRow = await _db.PolicyCommissions
            .Where(pc => pc.PolicyId == policy.Id && pc.ClientId == clientId && (pc.IsCancelled == null || pc.IsCancelled == false))
            .OrderByDescending(pc => pc.Id)
            .FirstOrDefaultAsync();
        var commissionPct = commissionRow?.CommissionPercentage ?? 12m;
        if (commissionPct <= 0)
            throw new InvalidOperationException("A commission schedule and valid commission percentage must be configured before the endorsement can be issued.");

        var premium = await _db.PolicyPremiums.FirstOrDefaultAsync(pp =>
            pp.PolicyId == policy.Id && pp.ClientId == clientId && (pp.IsCancelled == null || pp.IsCancelled == false));
        if (premium == null || string.IsNullOrWhiteSpace(premium.PaymentFrequency))
            throw new InvalidOperationException("Payment Frequency is required before issuing.");
        if (string.IsNullOrWhiteSpace(premium.ResponsibleParty))
            throw new InvalidOperationException("Responsible Party is required before issuing.");

        var mortgages = await _db.PolicyMortgages
            .Where(m => m.PolicyId == policy.Id && m.ClientId == clientId && (m.IsDeleted == null || m.IsDeleted == false))
            .ToListAsync();
        if (string.Equals(premium.ResponsibleParty, "MORTGAGEE", StringComparison.OrdinalIgnoreCase)
            && mortgages.Count == 0 && !HasDraftMortgages(submission.Data))
            throw new InvalidOperationException("Lender details are required when the Responsible Party is Mortgagee.");

        var account = policy.AccountId.HasValue
            ? await _db.Accounts.FirstOrDefaultAsync(a => a.Id == policy.AccountId.Value && a.ClientId == clientId)
            : null;
        var isBusiness = string.Equals(account?.AccountType, "business", StringComparison.OrdinalIgnoreCase);

        // Endorsement keeps the SAME PolicyNumber it already carries (cloned from the prior
        // policy at draft-creation time) — no new number is generated, unlike New Business.
        policy.PolicyType = "POLICY";
        policy.PolicyStatus = "Active";
        policy.PolicyIssuedOn = DateTime.UtcNow;
        policy.LockSubmission = true;
        policy.UpdatedBy = userId;
        policy.UpdatedOn = DateTime.UtcNow;

        var prior = await _db.Policies.FirstOrDefaultAsync(p => p.Id == priorPolicyId && p.ClientId == clientId);
        if (prior != null)
        {
            prior.PolicyStatus = "Inactive";
            prior.UpdatedBy = userId;
            prior.UpdatedOn = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        await RegenerateInstallmentsAsync(premium, userId);
        await UpsertCommissionAsync(clientId, userId, policy, premium, commissionRow, commissionPct);

        var screenCode = isBusiness ? "POLICYBUSINESS" : "POLICYINDIVIDUAL";
        submission.Status = "Active";
        submission.Data = ApplyIssuedIdentity(submission.Data, policy.PolicyNumber, screenCode);
        submission.UpdatedBy = userId;
        submission.UpdatedOn = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return new IssuePolicyResponse(true, policy.PolicyNumber, "Active", screenCode,
            $"Endorsement for policy {policy.PolicyNumber} has been issued successfully.");
    }

    // GenerateNewBusinessHBISPolicyNumber: take the latest issued HB policy number,
    // split on '-' and increment the trailing sequence; seed HB-{year}-000001 when none exist.
    private async Task<string> GenerateNewBusinessPolicyNumberAsync(long clientId)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"HB-{year}-";
        var latest = await _db.Policies
            .Where(p => p.ClientId == clientId && p.PolicyType == "POLICY" && p.PolicyNumber.StartsWith(prefix))
            .OrderByDescending(p => p.PolicyNumber)
            .Select(p => p.PolicyNumber)
            .FirstOrDefaultAsync();

        var seq = 0;
        if (!string.IsNullOrEmpty(latest))
        {
            var parts = latest.Split('-');
            if (parts.Length > 0 && int.TryParse(parts[^1], out var parsed)) seq = parsed;
        }

        string candidate;
        do
        {
            seq++;
            candidate = $"{prefix}{seq.ToString().PadLeft(6, '0')}";
        } while (await _db.Policies.AnyAsync(p => p.ClientId == clientId && p.PolicyNumber == candidate));
        return candidate;
    }

    private async Task UpsertCommissionAsync(
        long clientId, long userId, Policy policy, PolicyPremium premium,
        PolicyCommission? commissionRow, decimal commissionPct)
    {
        var totalCoveragePremium = premium.TotalCoveragePremium ?? 0m;
        var annualCommission = Math.Round(totalCoveragePremium * commissionPct / 100m, 2);
        var installmentCommission = premium.NumberOfInstallments > 0
            ? Math.Round(annualCommission / premium.NumberOfInstallments, 2)
            : annualCommission;

        if (commissionRow == null)
        {
            // policy_commission.intermediary_id is required — without a writing intermediary
            // there is no commission schedule to record (flat-default case, BR-SUB-003).
            if (policy.IntermediaryId == null) return;
            commissionRow = new PolicyCommission
            {
                ClientId = clientId,
                PolicyId = policy.Id,
                IntermediaryId = policy.IntermediaryId.Value,
                ProducerId = policy.ProducerId,
                CommissionPercentage = commissionPct,
                CreatedBy = userId,
            };
            _db.PolicyCommissions.Add(commissionRow);
        }
        else
        {
            commissionRow.UpdatedBy = userId;
            commissionRow.UpdatedOn = DateTime.UtcNow;
        }

        commissionRow.PaymentFrequency = premium.PaymentFrequency;
        commissionRow.NumberOfInstallments = premium.NumberOfInstallments;
        commissionRow.TotalCoveragePremium = totalCoveragePremium;
        commissionRow.AnnualCommission = annualCommission;
        commissionRow.InstallmentCommission = installmentCommission;
        await _db.SaveChangesAsync();

        // CreateorUpdateHBPolicyCommissionTransactions: mirror the unpaid installment rows.
        var oldTxns = await _db.CommissionPaymentTransactions
            .Where(t => t.PolicyCommissionId == commissionRow.Id && t.ClientId == clientId && (t.IsPaid == null || t.IsPaid == false))
            .ToListAsync();
        _db.CommissionPaymentTransactions.RemoveRange(oldTxns);

        var firstDate = premium.FirstPaymentDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var monthsPerInstallment = premium.NumberOfInstallments == 12 ? 1 : 12;
        for (var i = 0; i < premium.NumberOfInstallments; i++)
        {
            var due = firstDate.AddMonths(i * monthsPerInstallment);
            _db.CommissionPaymentTransactions.Add(new CommissionPaymentTransaction
            {
                ClientId = clientId,
                PolicyCommissionId = commissionRow.Id,
                CommissionAmountDue = installmentCommission,
                InvoiceDate = due,
                DueDate = due,
                IsPaid = false,
                TransactionStatus = "PENDING",
                CreatedBy = userId,
            });
        }
        await _db.SaveChangesAsync();
    }

    private async Task RegenerateInstallmentsAsync(PolicyPremium premium, long userId)
    {
        var existing = await _db.PolicyPaymentTransactions
            .Where(t => t.PolicyPremiumId == premium.Id && t.ClientId == premium.ClientId)
            .ToListAsync();
        // Deleteoldtransactions branch: only regenerate while nothing has been paid.
        if (existing.Any(t => t.IsPaid == true)) return;
        _db.PolicyPaymentTransactions.RemoveRange(existing);

        var n = Math.Max(1, premium.NumberOfInstallments);
        var feePerInstallment = Math.Round(premium.TotalInstallmentFee / n, 2);
        var firstDate = premium.FirstPaymentDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var monthsPerInstallment = n == 12 ? 1 : 12;

        // OutSystems FirstPaymentTransaction math (verified against the reference UI):
        // coverage premium splits equally across installments (first carries any rounding
        // remainder); policy/stamping fees are paid entirely in the FIRST installment
        // ("Fees fully paid in first installment" = Yes); tax is charged per installment
        // proportionally to that installment's premium base; installment fee is added on top.
        var installmentBases = BuildInstallmentBases(premium, n);
        var taxes = DistributeTax(premium.TotalTax ?? 0m, installmentBases);

        for (var i = 0; i < n; i++)
        {
            var amount = installmentBases[i] + taxes[i] + feePerInstallment;
            var due = firstDate.AddMonths(i * monthsPerInstallment);
            _db.PolicyPaymentTransactions.Add(new PolicyPaymentTransaction
            {
                ClientId = premium.ClientId,
                PolicyPremiumId = premium.Id,
                AmountDue = amount,
                InvoiceDate = due,
                DueDate = due,
                IsPaid = false,
                TransactionStatus = "PENDING",
                CreatedBy = userId,
            });
        }
        await _db.SaveChangesAsync();
    }

    private async Task<List<InstallmentDto>> LoadInstallmentsAsync(PolicyPremium premium)
    {
        var n = Math.Max(1, premium.NumberOfInstallments);
        var installmentBases = BuildInstallmentBases(premium, n);
        var taxes = DistributeTax(premium.TotalTax ?? 0m, installmentBases);
        var perFee = Math.Round(premium.TotalInstallmentFee / n, 2);

        var rows = await _db.PolicyPaymentTransactions
            .Where(t => t.PolicyPremiumId == premium.Id && t.ClientId == premium.ClientId)
            .OrderBy(t => t.DueDate).ThenBy(t => t.Id)
            .ToListAsync();

        return rows.Select((t, i) => new InstallmentDto(
            t.Id,
            t.AmountDue,
            t.DueDate.ToString("MM-dd-yyyy"),
            t.IsPaid == true,
            t.TransactionStatus ?? "PENDING",
            0m,
            0m,
            i < installmentBases.Count ? installmentBases[i] : 0m,
            i < taxes.Count ? taxes[i] : 0m,
            perFee)).ToList();
    }

    // Per-installment premium base: coverage premium splits equally (first installment
    // carries the rounding remainder) and the policy + stamping fees are added entirely
    // to the FIRST installment ("Fees fully paid in first installment" = Yes).
    private static List<decimal> BuildInstallmentBases(PolicyPremium premium, int n)
    {
        var coverage = premium.TotalCoveragePremium ?? 0m;
        var fees = premium.PolicyFees + (premium.StampingFee ?? 0m);
        if (n <= 1) return new List<decimal> { Math.Round(coverage + fees, 2) };
        var rest = Math.Floor(coverage / n * 100m) / 100m;
        var first = Math.Round(coverage - rest * (n - 1) + fees, 2);
        var bases = new List<decimal>(n) { first };
        for (var i = 1; i < n; i++) bases.Add(rest);
        return bases;
    }

    // Tax is charged per installment proportionally to that installment's premium base
    // (equivalent to rate × base when a single rate applies); the first installment
    // absorbs any rounding remainder so the parts sum exactly to the annual tax.
    private static List<decimal> DistributeTax(decimal totalTax, List<decimal> bases)
    {
        var totalBase = bases.Sum();
        if (totalBase == 0m || bases.Count == 1)
            return bases.Select(_ => Math.Round(totalTax, 2)).Take(1).Concat(bases.Skip(1).Select(_ => 0m)).ToList();
        var taxes = bases.Select(b => Math.Round(totalTax * b / totalBase, 2)).ToList();
        taxes[0] = Math.Round(taxes[0] + (totalTax - taxes.Sum()), 2);
        return taxes;
    }

    private static PaymentPlanDto MapPremium(PolicyPremium p) => new(
        p.PaymentFrequency,
        p.ResponsibleParty,
        p.NumberOfInstallments,
        p.ModeOfPaymentToUse,
        p.IsPaymentRequiredToBind,
        p.IsPolicyFullyPaid,
        p.TotalCoveragePremium,
        p.TotalTax,
        p.PolicyFees,
        p.StampingFee,
        p.TotalPremiumWithInstallmentFee);

    private static string NormalizeFrequency(string? value)
    {
        // Blank stays blank: the frequency is user-chosen and the issue/bind gates rely
        // on it being empty until the user actually selects one.
        var v = (value ?? "").Trim().ToUpperInvariant();
        if (v.Length == 0) return "";
        return v.Contains("MONTH") ? "MONTHLY" : "ANNUAL";
    }

    // The quote wizard keeps mortgagee records inside the submission draft JSON
    // (data.mortgages) rather than policy_mortgage rows; treat a non-empty array there
    // as valid lender details.
    private static bool HasDraftMortgages(string? draftJson)
    {
        if (string.IsNullOrWhiteSpace(draftJson)) return false;
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(draftJson);
            return doc.RootElement.TryGetProperty("mortgages", out var m)
                && m.ValueKind == System.Text.Json.JsonValueKind.Array
                && m.GetArrayLength() > 0;
        }
        catch (System.Text.Json.JsonException)
        {
            return false;
        }
    }

    private static string NormalizeParty(string? value)
    {
        // Blank stays blank: the responsible party is user-chosen and the issue/bind
        // gates rely on it being empty until the user actually selects one.
        var v = (value ?? "").Trim().ToUpperInvariant();
        if (v.Length == 0) return "";
        return v.Contains("MORTGAGE") ? "MORTGAGEE" : "INSURED";
    }

    private async Task<string?> ScreenCodeAsync(long clientId, Policy policy)
    {
        if (policy.AccountId == null) return "POLICYINDIVIDUAL";
        var accountType = await _db.Accounts
            .Where(a => a.Id == policy.AccountId.Value && a.ClientId == clientId)
            .Select(a => a.AccountType)
            .FirstOrDefaultAsync();
        return string.Equals(accountType, "business", StringComparison.OrdinalIgnoreCase)
            ? "POLICYBUSINESS" : "POLICYINDIVIDUAL";
    }

    // Rewrites the submission "form" document after issuing so the wizard reopens the
    // record as a policy (policy number, POLICY type/screen code, Active status, locked).
    private static string ApplyIssuedIdentity(string dataJson, string policyNumber, string screenCode)
    {
        try
        {
            var root = JsonNode.Parse(dataJson) as JsonObject;
            if (root == null) return dataJson;
            var form = root["form"] as JsonObject ?? new JsonObject();
            form["policyNumber"] = policyNumber;
            form["policyType"] = "POLICY";
            form["screenCode"] = screenCode;
            form["recordStatus"] = "Active";
            form["lockSubmission"] = true;
            root["form"] = form;
            return root.ToJsonString();
        }
        catch (JsonException)
        {
            return dataJson;
        }
    }

    // ─── Policy sync (BR-SUB-004) ─────────────────────────────────────────────

    private async Task EnsurePolicyForSubmissionAsync(long clientId, long userId, string id, string dataJson)
    {
        JsonNode? form;
        try
        {
            var root = JsonNode.Parse(dataJson);
            form = root?["form"];
        }
        catch (JsonException)
        {
            return;
        }
        if (form == null) return;

        // Endorsement/renewal drafts already have a real Policy row — created up front by
        // CreateEndorsementDraftAsync (deep-clone), keyed by its own sequential QuoteNumber
        // embedded in this exact form (see endorsement-draft-form's "quoteNumber" field) —
        // NOT by this Submission's own randomly-generated Id. Checking only
        // QuoteNumber == id || PolicyNumber == id below would never find that row (the
        // Submission Id matches neither), and this function would then create a SECOND,
        // phantom "NEWBUSINESS"/Draft policy every time the draft's Submission is first
        // saved — which is exactly what happened before this guard existed (see
        // VERSIONS.md). Only a genuinely new Submission (no screenCode yet, or an actual
        // New Business screenCode) should ever fall through to "create a new policy".
        var screenCode = StringOrNull(form, "screenCode")?.ToUpperInvariant() ?? string.Empty;
        var isEndorsementOrRenewalDraft = screenCode.StartsWith("ENDORSEMENT") || screenCode.StartsWith("RENEWAL");
        if (isEndorsementOrRenewalDraft)
        {
            var quoteNumber = BlankToNull(StringOrNull(form, "quoteNumber"));
            if (quoteNumber != null)
            {
                var linkedDraft = await _db.Policies.AnyAsync(p =>
                    p.ClientId == clientId && p.QuoteNumber == quoteNumber);
                if (linkedDraft) return; // its Policy row already exists — nothing to create
            }
            // No quoteNumber yet, or no matching Policy found: this draft hasn't reached
            // CreateEndorsementDraftAsync yet (shouldn't normally happen — that's what
            // stamps quoteNumber onto the form in the first place) — don't guess at
            // creating a NEWBUSINESS policy for what is explicitly not new business.
            return;
        }

        var existingPolicy = await _db.Policies.FirstOrDefaultAsync(p =>
            p.ClientId == clientId && (p.QuoteNumber == id || p.PolicyNumber == id));
        if (existingPolicy != null)
            return;

        var insuredType = string.Equals(StringOrNull(form, "insuredType"), "business", StringComparison.OrdinalIgnoreCase)
            ? "Business" : "Individual";
        var firstName = BlankToNull(StringOrNull(form, "firstName"));
        var middleName = BlankToNull(StringOrNull(form, "middleName"));
        var lastName = BlankToNull(StringOrNull(form, "lastName"));
        var organizationName = BlankToNull(StringOrNull(form, "organizationName"));
        var doingBusinessAs = BlankToNull(StringOrNull(form, "doingBusinessAs"));
        var composedName = string.Join(" ", new[] { firstName, middleName, lastName }.Where(v => !string.IsNullOrWhiteSpace(v))).Trim();
        var legalBusinessName = insuredType == "Business"
            ? BlankToNull(organizationName ?? doingBusinessAs ?? composedName)
            : null;

        var account = new Account
        {
            ClientId = clientId,
            AccountType = insuredType,
            FirstName = insuredType == "Business" ? null : firstName,
            MiddleName = insuredType == "Business" ? null : middleName,
            LastName = insuredType == "Business" ? null : lastName,
            LegalBusinessName = insuredType == "Business" ? legalBusinessName : null,
            DoingBusinessAs = doingBusinessAs,
            CreatedBy = userId,
            CreatedOn = DateTime.UtcNow,
        };
        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        var state = BlankToNull(StringOrNull(form, "state")) ?? BlankToNull(StringOrNull(form, "primaryState"));
        var lob = BlankToNull(StringOrNull(form, "lob"));
        var insuredName = insuredType == "Business" ? legalBusinessName : composedName;
        var policy = new Policy
        {
            ClientId = clientId,
            IntermediaryId = _producerScope?.IntermediaryId,
            ProducerId = _producerScope?.ProducerId,
            PolicyNumber = id,
            QuoteNumber = id,
            PolicyType = "NEWBUSINESS",
            PolicyStatus = "Draft",
            AccountId = account.Id,
            InsuredName = insuredName,
            Lob = lob,
            CreatedBy = userId,
            CreatedOn = DateTime.UtcNow,
            UpdatedOn = DateTime.UtcNow,
            QuoteCreationDate = DateOnly.FromDateTime(DateTime.UtcNow),
            EffectiveDate = ToDateOnly(StringOrNull(form, "effectiveDate")),
            ExpiryDate = ToDateOnly(StringOrNull(form, "expirationDate")),
            PolicyTerm = BlankToNull(StringOrNull(form, "policyTerm")),
            WritingCompany = BlankToNull(StringOrNull(form, "writingCompany")),
            InsuranceType = BlankToNull(StringOrNull(form, "insuranceType")),
            Country = BlankToNull(StringOrNull(form, "country")),
            StateProvince = state,
            IsQuickQuote = bool.TryParse(StringOrNull(form, "isQuickQuote"), out var isQuick) ? isQuick : null,
        };
        _db.Policies.Add(policy);
        await _db.SaveChangesAsync();

        _db.PolicyAccounts.Add(new PolicyAccount
        {
            ClientId = clientId,
            AccountId = account.Id,
            PolicyId = policy.Id,
        });
        await _db.SaveChangesAsync();

        var subProduct = BlankToNull(StringOrNull(form, "subProduct"));
        if (!string.IsNullOrWhiteSpace(lob))
        {
            var product = await _db.InsuranceProducts.FirstOrDefaultAsync(p => p.ProductName == lob);
            if (product != null)
            {
                var policyProduct = new PolicyProduct
                {
                    ClientId = clientId,
                    PolicyId = policy.Id,
                    ProductId = product.Id,
                    State = state,
                };
                if (!string.IsNullOrWhiteSpace(subProduct))
                {
                    var sub = await _db.InsuranceSubProducts.FirstOrDefaultAsync(sp => sp.SubProductName == subProduct && sp.ProductId == product.Id);
                    if (sub != null) policyProduct.SubProductId = sub.Id;
                }
                _db.PolicyProducts.Add(policyProduct);
                await _db.SaveChangesAsync();
            }
        }
    }

    private async Task SyncPolicyFromSubmissionAsync(long clientId, long userId, string id, string dataJson, string status)
    {
        JsonNode? root;
        JsonNode? form;
        try
        {
            root = JsonNode.Parse(dataJson);
            form = root?["form"];
        }
        catch (JsonException ex)
        {
            System.Console.WriteLine($"[SyncPolicyFromSubmissionAsync] JSON Parse Error: {ex.Message}");
            return;
        }
        if (form == null) return;

        // Same identifier mismatch as EnsurePolicyForSubmissionAsync above: an endorsement/
        // renewal draft's real Policy row is keyed by its own sequential QuoteNumber, not
        // by this Submission's randomly-generated Id — resolve via the form's own
        // "quoteNumber" field for those screenCodes so wizard edits actually reach the
        // draft Policy row instead of silently no-op'ing here.
        var screenCode = StringOrNull(form, "screenCode")?.ToUpperInvariant() ?? string.Empty;
        var isEndorsementOrRenewalDraft = screenCode.StartsWith("ENDORSEMENT") || screenCode.StartsWith("RENEWAL");
        var quoteNumber = StringOrNull(form, "quoteNumber");
        var lookupKey = isEndorsementOrRenewalDraft ? BlankToNull(quoteNumber) ?? id : id;

        System.Console.WriteLine($"[SyncPolicyFromSubmissionAsync] screenCode={screenCode}, isEndorsement={isEndorsementOrRenewalDraft}, quoteNumber={quoteNumber}, lookupKey={lookupKey}");

        var policy = await _db.Policies.FirstOrDefaultAsync(p =>
            p.ClientId == clientId && (p.QuoteNumber == lookupKey || p.PolicyNumber == lookupKey));

        if (policy == null)
        {
            System.Console.WriteLine($"[SyncPolicyFromSubmissionAsync] WARNING: Policy not found for lookupKey={lookupKey}, screenCode={screenCode}");
            return;
        }

        System.Console.WriteLine($"[SyncPolicyFromSubmissionAsync] Found policy {policy.Id} for endorsement sync");

        var insuredType = string.Equals(StringOrNull(form, "insuredType"), "business", StringComparison.OrdinalIgnoreCase)
            ? "Business" : "Individual";
        var firstName = BlankToNull(StringOrNull(form, "firstName"));
        var middleName = BlankToNull(StringOrNull(form, "middleName"));
        var lastName = BlankToNull(StringOrNull(form, "lastName"));
        var composedName = BlankToNull(string.Join(" ", new[] { firstName, middleName, lastName }.Where(v => !string.IsNullOrWhiteSpace(v))));

        if (policy.AccountId.HasValue)
        {
            var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == policy.AccountId.Value && a.ClientId == clientId);
            if (account != null)
            {
                account.AccountType = insuredType;
                account.FirstName = insuredType == "business" ? null : firstName;
                account.MiddleName = insuredType == "business" ? null : middleName;
                account.LastName = insuredType == "business" ? null : lastName;
                account.LegalBusinessName = insuredType == "business" ? (composedName ?? firstName) : null;
                account.UpdatedOn = DateTime.UtcNow;
            }
        }

        policy.EffectiveDate = ToDateOnly(StringOrNull(form, "effectiveDate")) ?? policy.EffectiveDate;
        policy.ExpiryDate = ToDateOnly(StringOrNull(form, "expirationDate")) ?? policy.ExpiryDate;
        policy.PolicyTerm = BlankToNull(StringOrNull(form, "policyTerm")) ?? policy.PolicyTerm;
        policy.WritingCompany = BlankToNull(StringOrNull(form, "writingCompany")) ?? policy.WritingCompany;
        policy.PolicyStatus = BlankToNull(status) ?? policy.PolicyStatus;
        if (form["lockSubmission"] is JsonValue lv && lv.TryGetValue<bool>(out var lockVal))
            policy.LockSubmission = lockVal;
        policy.UpdatedOn = DateTime.UtcNow;

        var policyProduct = await _db.PolicyProducts.FirstOrDefaultAsync(pp => pp.PolicyId == policy.Id && pp.ClientId == clientId);
        if (policyProduct != null)
            policyProduct.State = BlankToNull(StringOrNull(form, "state")) ?? policyProduct.State;

        var coverage = await _db.PolicyLimitCoverages.FirstOrDefaultAsync(c => c.PolicyId == policy.Id && c.ClientId == clientId);
        var dwellingLimit = NumberFromCurrency(StringOrNull(form, "dwellingLimit"));
        var tiv = NumberFromCurrency(StringOrNull(form, "totalInsuredValues"));
        var basePremium = NumberFromCurrency(StringOrNull(form, "basePremium"));
        var rateModification = NumberFromCurrency(StringOrNull(form, "rateModification"));
        // BR-SUB-005: additional coverage-limit fields — key names match NewSubmission.tsx's
        // FormState exactly ("deductible", "liabilityAmount", "excessBlanketLiabilities",
        // "wildfire", "resWorkerMedical", "farmingEndorsement", not invented names) so a
        // bulk-uploaded row and the manual wizard populate policy_limit_coverage the same way.
        var physicalDamageDeductible = NumberFromCurrency(StringOrNull(form, "deductible"));
        var priorPolicyPremium = NumberFromCurrency(StringOrNull(form, "priorPolicyPremium"));
        var liabilityCoverage = BlankToNull(StringOrNull(form, "liabilityAmount"));
        var excessBlanketPl = BlankToNull(StringOrNull(form, "excessBlanketLiabilities"));
        var sinkhole = BlankToNull(StringOrNull(form, "sinkhole"));
        var earthquake = BlankToNull(StringOrNull(form, "earthquake"));
        var flood = BlankToNull(StringOrNull(form, "flood"));
        var windHail = BlankToNull(StringOrNull(form, "windHail"));
        var wildFire = BlankToNull(StringOrNull(form, "wildfire"));
        var residentWorkerNfm = BlankToNull(StringOrNull(form, "resWorkerMedical"));
        var smallScaleFarmingEndorsement = BlankToNull(StringOrNull(form, "farmingEndorsement"));
        var landlordEndorsement = BlankToNull(StringOrNull(form, "landlordEndorsement"));
        var homeOfficeEndorsement = BlankToNull(StringOrNull(form, "homeOfficeEndorsement"));

        if (coverage == null)
        {
            coverage = new PolicyLimitCoverage { ClientId = clientId, PolicyId = policy.Id };
            _db.PolicyLimitCoverages.Add(coverage);
        }

        coverage.DwellingAssetLimit = dwellingLimit ?? coverage.DwellingAssetLimit;
        coverage.Tiv = tiv ?? coverage.Tiv;
        coverage.CalculatedPremium = basePremium ?? coverage.CalculatedPremium;
        coverage.RateModification = rateModification ?? coverage.RateModification;
        coverage.BasePremium = basePremium ?? coverage.BasePremium;
        coverage.PhysicalDamageDeductible = physicalDamageDeductible ?? coverage.PhysicalDamageDeductible;
        coverage.PriorPolicyPeriodPremium = priorPolicyPremium ?? coverage.PriorPolicyPeriodPremium;
        coverage.LiabilityCoverage = liabilityCoverage ?? coverage.LiabilityCoverage;
        coverage.ExcessBlanketPl = excessBlanketPl ?? coverage.ExcessBlanketPl;
        coverage.SinkholeCatastrophicGroundCollapse = sinkhole ?? coverage.SinkholeCatastrophicGroundCollapse;
        coverage.Earthquake = earthquake ?? coverage.Earthquake;
        coverage.Flood = flood ?? coverage.Flood;
        coverage.WindHail = windHail ?? coverage.WindHail;
        coverage.WildFire = wildFire ?? coverage.WildFire;
        coverage.ResidentWorkerNfm = residentWorkerNfm ?? coverage.ResidentWorkerNfm;
        coverage.SmallScaleFarmingEndorsement = smallScaleFarmingEndorsement ?? coverage.SmallScaleFarmingEndorsement;
        coverage.LandlordEndorsement = landlordEndorsement ?? coverage.LandlordEndorsement;
        coverage.HomeOfficeEndorsement = homeOfficeEndorsement ?? coverage.HomeOfficeEndorsement;

        // Additional named insureds / organizations live as top-level arrays in the
        // draft JSON ({form, locations, mortgages, additionalInsureds, additionalOrgs}).
        // Sync them to the relational tables so they exist "in the database" for both
        // bulk-uploaded and manually saved submissions. Delete+recreate per policy: the
        // arrays are the source of truth and carry no stable row ids.
        if (root?["additionalInsureds"] is JsonArray insureds)
        {
            var existing = await _db.AdditionalInsureds
                .Where(a => a.ClientId == clientId && a.PolicyId == policy.Id).ToListAsync();
            _db.AdditionalInsureds.RemoveRange(existing);

            var record = 0;
            foreach (var node in insureds)
            {
                if (node == null) continue;
                record++;
                _db.AdditionalInsureds.Add(new AdditionalInsured
                {
                    ClientId = clientId,
                    PolicyId = policy.Id,
                    FirstName = BlankToNull(StringOrNull(node, "firstName")),
                    MiddleName = BlankToNull(StringOrNull(node, "middleName")),
                    LastName = BlankToNull(StringOrNull(node, "lastName")),
                    InsuredType = BlankToNull(StringOrNull(node, "insuredType")),
                    Relationship = BlankToNull(StringOrNull(node, "relationship")),
                    TelephoneNumber = BlankToNull(StringOrNull(node, "telephone")),
                    AltTelephoneNumber = BlankToNull(StringOrNull(node, "altTelephone")),
                    Email = BlankToNull(StringOrNull(node, "email")),
                    Dba = BlankToNull(StringOrNull(node, "dbaName")),
                    IsManual = string.Equals(StringOrNull(node, "isManual"), "true", StringComparison.OrdinalIgnoreCase),
                    RecordNumber = record,
                    CreatedBy = userId,
                });
            }
        }

        if (root?["additionalOrgs"] is JsonArray orgs)
        {
            var existing = await _db.AdditionalOrganisations
                .Where(a => a.ClientId == clientId && a.PolicyId == policy.Id).ToListAsync();
            _db.AdditionalOrganisations.RemoveRange(existing);

            var record = 0;
            foreach (var node in orgs)
            {
                if (node == null) continue;
                record++;
                var extText = BlankToNull(StringOrNull(node, "extension"));
                _db.AdditionalOrganisations.Add(new AdditionalOrganisation
                {
                    ClientId = clientId,
                    PolicyId = policy.Id,
                    OrganisationName = BlankToNull(StringOrNull(node, "orgName")),
                    OrganisationType = BlankToNull(StringOrNull(node, "orgType")),
                    TelephoneNumber = BlankToNull(StringOrNull(node, "telephone")),
                    Extension = int.TryParse(extText, out var ext) ? ext : null,
                    AltTelephoneNumber = BlankToNull(StringOrNull(node, "altTelephone")),
                    Email = BlankToNull(StringOrNull(node, "email")),
                    FirstName = BlankToNull(StringOrNull(node, "contactFirstName")),
                    MiddleName = BlankToNull(StringOrNull(node, "contactMiddleName")),
                    LastName = BlankToNull(StringOrNull(node, "contactLastName")),
                    RecordNumber = record,
                    CreatedBy = userId,
                });
            }
        }

        if (root?["mortgages"] is JsonArray mortgages)
        {
            var existing = await _db.PolicyMortgages
                .Where(m => m.ClientId == clientId && m.PolicyId == policy.Id).ToListAsync();
            _db.PolicyMortgages.RemoveRange(existing);

            var record = 0;
            foreach (var node in mortgages)
            {
                if (node == null) continue;
                record++;
                _db.PolicyMortgages.Add(new PolicyMortgage
                {
                    ClientId = clientId,
                    PolicyId = policy.Id,
                    MortgageName = BlankToNull(StringOrNull(node, "name")),
                    LoanNumber = BlankToNull(StringOrNull(node, "loanNumber")),
                    MortgageServiceCompany = BlankToNull(StringOrNull(node, "mortgageServiceCompany")),
                    TelephoneNumber = BlankToNull(StringOrNull(node, "telephone")),
                    TelephoneNumberCC = BlankToNull(StringOrNull(node, "telephoneCC")),
                    Extension = BlankToNull(StringOrNull(node, "extension")),
                    AltTelephoneNumber = BlankToNull(StringOrNull(node, "altTelephone")),
                    AltTelephoneNumberCC = BlankToNull(StringOrNull(node, "altTelephoneCC")),
                    EmailId = BlankToNull(StringOrNull(node, "email")),
                    GoogleAddress = BlankToNull(StringOrNull(node, "googleAddress")),
                    AddressLine1 = BlankToNull(StringOrNull(node, "addressLine1")),
                    AddressLine2 = BlankToNull(StringOrNull(node, "addressLine2")),
                    Country = BlankToNull(StringOrNull(node, "country")),
                    State = BlankToNull(StringOrNull(node, "state")),
                    City = BlankToNull(StringOrNull(node, "city")),
                    ZipCode = BlankToNull(StringOrNull(node, "zipCode")),
                    Latitude = BlankToNull(StringOrNull(node, "latitude")),
                    Longitude = BlankToNull(StringOrNull(node, "longitude")),
                    County = BlankToNull(StringOrNull(node, "county")),
                    IsManual = string.Equals(StringOrNull(node, "isManual"), "true", StringComparison.OrdinalIgnoreCase),
                    LenderType = BlankToNull(StringOrNull(node, "lenderType")),
                    LoanType = BlankToNull(StringOrNull(node, "loanType")),
                    CoveredAsset = BlankToNull(StringOrNull(node, "coveredAsset")),
                    RecordNumber = record,
                    CreatedBy = userId,
                });
            }
        }

        await _db.SaveChangesAsync();
    }

    // ─── JSON helpers ─────────────────────────────────────────────────────────

    private static string NormalizeJson(string json) => string.IsNullOrWhiteSpace(json) ? "{}" : json;

    private static string MergeJson(string? existingJson, string incomingJson)
    {
        var existing = string.IsNullOrWhiteSpace(existingJson) ? new JsonObject() : (JsonNode.Parse(existingJson) as JsonObject ?? new JsonObject());
        var incoming = string.IsNullOrWhiteSpace(incomingJson) ? new JsonObject() : (JsonNode.Parse(incomingJson) as JsonObject ?? new JsonObject());

        // Shallow top-level merge — incoming keys win (matches server.js `{...existing, ...incoming}`).
        // "status" is handled separately by the caller and must not leak into the data document.
        incoming.Remove("status");
        var merged = new JsonObject();
        foreach (var kv in existing)
            merged[kv.Key] = kv.Value?.DeepClone();
        foreach (var kv in incoming)
            merged[kv.Key] = kv.Value?.DeepClone();

        return merged.ToJsonString();
    }

    private static string? StringOrNull(JsonNode? node, string key)
    {
        var value = node?[key];
        if (value == null) return null;
        try
        {
            var element = value.GetValue<JsonElement>();
            return element.ValueKind switch
            {
                JsonValueKind.String => element.GetString(),
                JsonValueKind.Number => element.GetRawText(),
                JsonValueKind.True => "true",
                JsonValueKind.False => "false",
                _ => null,
            };
        }
        catch (InvalidOperationException)
        {
            // node was a JsonObject/JsonArray, not a scalar value
            return null;
        }
    }

    private static string? BlankToNull(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static readonly string[] DateFormats = { "MM-dd-yyyy", "MM/dd/yyyy", "yyyy-MM-dd" };

    private static DateOnly? ToDateOnly(string? value)
    {
        var trimmed = BlankToNull(value);
        if (trimmed == null) return null;
        if (DateOnly.TryParseExact(trimmed, DateFormats, System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None, out var exact))
            return exact;
        return DateOnly.TryParse(trimmed, System.Globalization.CultureInfo.InvariantCulture, out var d) ? d : null;
    }

    private static decimal? NumberFromCurrency(string? value)
    {
        var trimmed = BlankToNull(value);
        if (trimmed == null) return null;
        var cleaned = new string(trimmed.Where(c => char.IsDigit(c) || c == '.' || c == '-').ToArray());
        return decimal.TryParse(cleaned, out var n) ? n : null;
    }

    private static string EnsureSubmissionDataHasIdentity(string dataJson, string id)
    {
        try
        {
            var root = JsonNode.Parse(dataJson) as JsonObject;
            if (root == null) return dataJson;
            var form = root["form"] as JsonObject;
            if (form == null) return dataJson;

            var policyType = StringOrNull(form, "policyType")?.ToUpperInvariant() ?? string.Empty;
            if (policyType.StartsWith("POLICY"))
            {
                if (string.IsNullOrWhiteSpace(StringOrNull(form, "policyNumber")))
                    form["policyNumber"] = id;
            }
            else
            {
                if (string.IsNullOrWhiteSpace(StringOrNull(form, "quoteNumber")))
                    form["quoteNumber"] = id;
            }

            root["form"] = form;
            return root.ToJsonString();
        }
        catch (JsonException)
        {
            return dataJson;
        }
    }

    private static SubmissionDto Map(Submission s)
    {
        var dataLength = s.Data?.Length ?? 0;
        System.Console.WriteLine($"[SubmissionRepository.Map] Mapping submission {s.Id}: Data type={s.Data?.GetType()?.Name ?? "null"}, Length={dataLength}");
        if (dataLength > 0 && dataLength < 200)
        {
            System.Console.WriteLine($"[SubmissionRepository.Map] Data preview: {s.Data}");
        }
        return new(s.Id, s.Status, s.CreatedOn, s.Data);
    }
}
