// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Renewal Quote lifecycle service — create, bind, process payments.
// Based on OutSystems IE_Policy_BL CreateRenewalPolicy flow.
using InsureEdge.Application.DTOs.QuotesPolicies;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace InsureEdge.Infrastructure.Services;

public class RenewalQuoteService
{
    private readonly InsureEdgeDbContext _db;
    private readonly ICurrentTenantService _tenant;
    private readonly ILogger<RenewalQuoteService> _log;

    public RenewalQuoteService(
        InsureEdgeDbContext db,
        ICurrentTenantService tenant,
        ILogger<RenewalQuoteService> log)
    {
        _db = db;
        _tenant = tenant;
        _log = log;
    }

    /// <summary>Create a renewal quote from an active policy (CreateRenewalPolicy equivalent)</summary>
    public async Task<CreateRenewalQuoteResponse> CreateRenewalQuoteAsync(
        string priorPolicyNumber,
        DateOnly? renewalOfferDate = null,
        long? createdBy = null)
    {
        try
        {
            var clientId = _tenant.ClientId;
            createdBy ??= _tenant.UserId;

            _log.LogInformation("CreateRenewal: Starting for prior policy {PolicyNumber}, client {ClientId}",
                priorPolicyNumber, clientId);

            // ─── Step 1: Fetch the prior (source) policy ───────────────────────────
            var priorPolicy = await _db.Policies
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.ClientId == clientId && p.PolicyNumber == priorPolicyNumber);

            if (priorPolicy == null)
            {
                _log.LogWarning("CreateRenewal: Prior policy not found {PolicyNumber}", priorPolicyNumber);
                return new CreateRenewalQuoteResponse
                {
                    Success = false,
                    Message = $"Prior policy {priorPolicyNumber} not found"
                };
            }

            // ─── Step 2: Check renewal eligibility ───────────────────────────────
            if (!await IsRenewalEligibleAsync(priorPolicy))
            {
                _log.LogWarning("CreateRenewal: Policy not eligible {PolicyNumber}", priorPolicyNumber);
                return new CreateRenewalQuoteResponse
                {
                    Success = false,
                    Message = "Policy is not eligible for renewal"
                };
            }

            // ─── Step 3: Check for existing renewal quote ───────────────────────
            var existingRenewal = await _db.Policies
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.ClientId == clientId &&
                    p.Extended!.PriorPolicyId == priorPolicy.Id &&
                    p.PolicyType == "RENEWAL");

            if (existingRenewal != null && existingRenewal.PolicyStatus != "Expired")
            {
                _log.LogWarning("CreateRenewal: Renewal already exists for {PolicyNumber}", priorPolicyNumber);
                return new CreateRenewalQuoteResponse
                {
                    Success = false,
                    Message = "Renewal quote already exists for this policy"
                };
            }

            // ─── Step 4: Generate renewal policy number ──────────────────────────
            // Format: ClientId + "-" + IntermediaryId + "-" + PolicyNumber + "-R" + increment
            var renewalNumber = await GenerateRenewalNumberAsync(clientId, priorPolicy);

            // ─── Step 5: Create renewal quote policy ─────────────────────────────
            var renewalPolicy = new Policy
            {
                ClientId = clientId,
                QuoteNumber = renewalNumber,
                PolicyNumber = renewalNumber,
                PolicyType = "RENEWAL",
                PolicyStage = "Quote Received", // Initial stage
                PolicyStatus = "Draft",
                ApprovalStatus = "Pending",

                // Copy core data from prior policy
                AccountId = priorPolicy.AccountId,
                IntermediaryId = priorPolicy.IntermediaryId,
                ProducerId = priorPolicy.ProducerId,
                IntermediaryType = priorPolicy.IntermediaryType,
                WritingCompany = priorPolicy.WritingCompany,
                InsuranceType = priorPolicy.InsuranceType,
                Country = priorPolicy.Country,
                StateProvince = priorPolicy.StateProvince,
                Lob = priorPolicy.Lob,
                SubProduct = priorPolicy.SubProduct,

                // Renewal effective dates
                EffectiveDate = priorPolicy.ExpiryDate?.AddDays(1), // Start day after prior expiry
                ExpiryDate = priorPolicy.ExpiryDate?.AddYears(1), // Renew for 1 year

                QuoteCreationDate = DateOnly.FromDateTime(DateTime.UtcNow),
                CreatedBy = createdBy,
                CreatedOn = DateTime.UtcNow,
            };

            _db.Policies.Add(renewalPolicy);
            await _db.SaveChangesAsync();

            _log.LogInformation("CreateRenewal: Policy created {QuoteNumber}, id {PolicyId}",
                renewalPolicy.QuoteNumber, renewalPolicy.Id);

            // ─── Step 6: Create policy extended record ──────────────────────────
            var renewalExtended = new PolicyExtended
            {
                PolicyId = renewalPolicy.Id,
                ClientId = clientId,
                PriorPolicyId = priorPolicy.Id,
                RenewalOfferDate = renewalOfferDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
                CreatedBy = createdBy,
                CreatedOn = DateTime.UtcNow,
            };

            _db.PolicyExtendeds.Add(renewalExtended);
            await _db.SaveChangesAsync();

            // ─── Step 7: Copy products and coverages ────────────────────────────
            await CopyPolicyProductsAndCoveragesAsync(priorPolicy.Id, renewalPolicy.Id, clientId, createdBy ?? 0);

            // ─── Step 8: Create policy transaction (audit log) ──────────────────
            var transaction = new PolicyTransaction
            {
                ClientId = clientId,
                PolicyNumber = renewalPolicy.PolicyNumber,
                EffectiveDate = renewalPolicy.EffectiveDate,
                ExpirationDate = renewalPolicy.ExpiryDate,
                TransactionType = priorPolicy.InsuranceType == "Business" ? "RenewalBusiness" : "RenewalIndividual",
                TransactionEffectiveDate = renewalPolicy.EffectiveDate,
                Status = "Draft",
                MainPolicyId = renewalPolicy.Id,
                RedirectionPolicyId = priorPolicy.Id,
                IsShowInTimeline = true,
                CreatedBy = createdBy,
                CreatedOn = DateTime.UtcNow,
            };

            _db.PolicyTransactions.Add(transaction);
            await _db.SaveChangesAsync();

            _log.LogInformation("CreateRenewal: Success {QuoteNumber}", renewalPolicy.QuoteNumber);

            return new CreateRenewalQuoteResponse
            {
                PolicyId = renewalPolicy.Id,
                QuoteNumber = renewalPolicy.QuoteNumber ?? "",
                PolicyNumber = renewalPolicy.PolicyNumber,
                Status = renewalPolicy.PolicyStatus ?? "Draft",
                EffectiveDate = renewalPolicy.EffectiveDate,
                ExpiryDate = renewalPolicy.ExpiryDate,
                Success = true,
                Message = "Renewal quote created successfully"
            };
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "CreateRenewal: Error creating renewal quote");
            return new CreateRenewalQuoteResponse
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            };
        }
    }

    /// <summary>Bind renewal quote to active (update prior policy to inactive, activate renewal)</summary>
    public async Task<BindRenewalQuoteResponse> BindRenewalQuoteAsync(long renewalPolicyId, long? updatedBy = null)
    {
        try
        {
            var clientId = _tenant.ClientId;
            updatedBy ??= _tenant.UserId;

            _log.LogInformation("BindRenewal: Starting for renewal policy id {PolicyId}, client {ClientId}",
                renewalPolicyId, clientId);

            // ─── Step 1: Fetch renewal policy ───────────────────────────────────
            var renewalPolicy = await _db.Policies
                .Include(p => p.Extended)
                .FirstOrDefaultAsync(p => p.Id == renewalPolicyId && p.ClientId == clientId);

            if (renewalPolicy == null || renewalPolicy.PolicyType != "RENEWAL")
            {
                _log.LogWarning("BindRenewal: Renewal policy not found {PolicyId}", renewalPolicyId);
                return new BindRenewalQuoteResponse
                {
                    Success = false,
                    Message = "Renewal policy not found"
                };
            }

            // ─── Step 2: Fetch prior policy ──────────────────────────────────────
            if (renewalPolicy.Extended?.PriorPolicyId == null)
            {
                _log.LogWarning("BindRenewal: Prior policy not linked {PolicyId}", renewalPolicyId);
                return new BindRenewalQuoteResponse
                {
                    Success = false,
                    Message = "Prior policy reference missing"
                };
            }

            var priorPolicy = await _db.Policies
                .FirstOrDefaultAsync(p => p.Id == renewalPolicy.Extended.PriorPolicyId && p.ClientId == clientId);

            if (priorPolicy == null)
            {
                _log.LogWarning("BindRenewal: Prior policy not found id {PriorPolicyId}",
                    renewalPolicy.Extended.PriorPolicyId);
                return new BindRenewalQuoteResponse
                {
                    Success = false,
                    Message = "Prior policy not found"
                };
            }

            // ─── Step 3: Update renewal policy status ───────────────────────────
            renewalPolicy.PolicyStatus = "Bound";
            renewalPolicy.PolicyStage = "Policy Bound";
            renewalPolicy.PolicyType = "POLICY";
            renewalPolicy.ApprovalStatus = "Approved";
            renewalPolicy.UpdatedBy = updatedBy;
            renewalPolicy.UpdatedOn = DateTime.UtcNow;

            // ─── Step 4: Update prior policy status ──────────────────────────────
            priorPolicy.PolicyStatus = "Lapsed";
            priorPolicy.UpdatedBy = updatedBy;
            priorPolicy.UpdatedOn = DateTime.UtcNow;

            // ─── Step 5: Create transaction records ──────────────────────────────
            var renewalTransaction = new PolicyTransaction
            {
                ClientId = clientId,
                PolicyNumber = renewalPolicy.PolicyNumber,
                EffectiveDate = renewalPolicy.EffectiveDate,
                ExpirationDate = renewalPolicy.ExpiryDate,
                TransactionType = priorPolicy.InsuranceType == "Business" ? "RenewalBusiness" : "RenewalIndividual",
                TransactionEffectiveDate = renewalPolicy.EffectiveDate,
                Status = "Bound",
                MainPolicyId = renewalPolicy.Id,
                RedirectionPolicyId = priorPolicy.Id,
                IsShowInTimeline = true,
                CreatedBy = updatedBy,
                CreatedOn = DateTime.UtcNow,
            };

            _db.PolicyTransactions.Add(renewalTransaction);

            // Prior policy cancellation transaction
            var cancelTransaction = new PolicyTransaction
            {
                ClientId = clientId,
                PolicyNumber = priorPolicy.PolicyNumber,
                EffectiveDate = priorPolicy.EffectiveDate,
                ExpirationDate = priorPolicy.ExpiryDate,
                TransactionType = priorPolicy.InsuranceType == "Business" ? "RenewalBusiness" : "RenewalIndividual",
                TransactionEffectiveDate = renewalPolicy.EffectiveDate,
                Status = "Lapsed",
                MainPolicyId = priorPolicy.Id,
                RedirectionPolicyId = renewalPolicy.Id,
                IsShowInTimeline = true,
                CreatedBy = updatedBy,
                CreatedOn = DateTime.UtcNow,
            };

            _db.PolicyTransactions.Add(cancelTransaction);

            await _db.SaveChangesAsync();

            _log.LogInformation("BindRenewal: Success {RenewalPolicyNumber}, prior status changed",
                renewalPolicy.PolicyNumber);

            return new BindRenewalQuoteResponse
            {
                Success = true,
                Message = "Renewal quote bound successfully",
                NewPolicyNumber = renewalPolicy.PolicyNumber,
                PreviousPolicyStatus = priorPolicy.PolicyStatus ?? "Lapsed"
            };
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "BindRenewal: Error binding renewal quote");
            return new BindRenewalQuoteResponse
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            };
        }
    }

    /// <summary>Process payment for renewal quote based on responsible party</summary>
    public async Task<ProcessRenewalPaymentResponse> ProcessPaymentAsync(
        long renewalPolicyId,
        string? responsibleParty,
        string? paymentMethod = null,
        decimal? amountPaid = null,
        long? processedBy = null)
    {
        try
        {
            var clientId = _tenant.ClientId;
            processedBy ??= _tenant.UserId;

            _log.LogInformation("ProcessPayment: Starting for renewal policy id {PolicyId}, responsible party {Party}",
                renewalPolicyId, responsibleParty);

            // ─── Step 1: Fetch renewal policy with premium ──────────────────────
            var renewalPolicy = await _db.Policies
                .Include(p => p.Extended)
                .Include(p => p.Premium)
                .FirstOrDefaultAsync(p => p.Id == renewalPolicyId && p.ClientId == clientId);

            if (renewalPolicy == null)
            {
                _log.LogWarning("ProcessPayment: Policy not found {PolicyId}", renewalPolicyId);
                return new ProcessRenewalPaymentResponse
                {
                    Success = false,
                    Message = "Policy not found"
                };
            }

            if (renewalPolicy.Premium == null)
            {
                _log.LogWarning("ProcessPayment: No premium found for {PolicyId}", renewalPolicyId);
                return new ProcessRenewalPaymentResponse
                {
                    Success = false,
                    Message = "No premium information found"
                };
            }

            // ─── Step 2: Branch based on ResponsibleParty ───────────────────────
            if (responsibleParty == "INSURED")
            {
                // Branch: Insured is responsible — create payment gateway transaction
                // TODO: Implement payment gateway integration (pending)
                _log.LogInformation("ProcessPayment: Insured payment flow (gateway integration pending)");

                return new ProcessRenewalPaymentResponse
                {
                    Success = false,
                    Message = "Payment gateway integration pending"
                };
            }
            else
            {
                // Branch: Non-insured responsible party (e.g., lender) — auto-approve payment
                return await ProcessNonInsuredPaymentAsync(renewalPolicy, paymentMethod, amountPaid, processedBy ?? 0);
            }
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "ProcessPayment: Error processing payment");
            return new ProcessRenewalPaymentResponse
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            };
        }
    }

    /// <summary>Get renewal quote detail</summary>
    public async Task<RenewalQuoteDetailDto?> GetRenewalQuoteDetailAsync(long renewalPolicyId)
    {
        var clientId = _tenant.ClientId;

        var policy = await _db.Policies
            .AsNoTracking()
            .Include(p => p.Extended)
            .Include(p => p.LimitCoverages)
            .Include(p => p.Intermediary)
            .Include(p => p.Producer)
            .Include(p => p.Premium)
            .FirstOrDefaultAsync(p => p.Id == renewalPolicyId && p.ClientId == clientId);

        if (policy == null)
            return null;

        var priorPolicyNumber = policy.Extended?.PriorPolicyId != null
            ? (await _db.Policies
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == policy.Extended.PriorPolicyId))?.PolicyNumber
            : null;

        var paymentTransactions = await _db.PolicyPaymentTransactions
            .AsNoTracking()
            .Where(pt => pt.PolicyPremium!.PolicyId == renewalPolicyId)
            .Select(pt => new PolicyPaymentTransactionDto
            {
                Id = pt.Id,
                AmountDue = pt.AmountDue,
                InvoiceDate = pt.InvoiceDate,
                DueDate = pt.DueDate,
                TransactionPaymentDate = pt.TransactionPaymentDate,
                IsPaid = pt.IsPaid,
                TransactionStatus = pt.TransactionStatus,
                PaymentMethod = pt.PaymentMethod,
            })
            .ToListAsync();

        var coverage = policy.LimitCoverages.FirstOrDefault();

        return new RenewalQuoteDetailDto
        {
            PolicyId = policy.Id,
            QuoteNumber = policy.QuoteNumber ?? "",
            PolicyNumber = policy.PolicyNumber,
            PriorPolicyNumber = priorPolicyNumber,
            InsuredName = policy.InsuredName ?? "",
            LineOfBusiness = policy.Lob,
            SubProduct = policy.SubProduct,
            EffectiveDate = policy.EffectiveDate,
            ExpiryDate = policy.ExpiryDate,
            RenewalOfferDate = policy.Extended?.RenewalOfferDate,
            PremiumEstimate = coverage?.CalculatedPremium,
            TotalPremium = coverage?.TotalPremiumWithFee,
            PolicyStage = policy.PolicyStage,
            PolicyType = policy.PolicyType,
            PolicyStatus = policy.PolicyStatus,
            ApprovalStatus = policy.ApprovalStatus,
            IntermediaryType = policy.IntermediaryType,
            IntermediaryName = policy.Intermediary?.IntermediaryName,
            ProducerName = policy.Producer != null ? $"{policy.Producer.FirstName} {policy.Producer.LastName}".Trim() : null,
            PaymentTransactions = paymentTransactions,
        };
    }

    // ─── Private Helper Methods ──────────────────────────────────────────────

    private Task<bool> IsRenewalEligibleAsync(Policy policy)
    {
        // Check if policy exists and is active/not expired
        if (policy.PolicyStatus == "Cancelled" || policy.PolicyStatus == "Declined")
            return Task.FromResult(false);

        // Check if expiry date is approaching (e.g., within 90 days)
        if (policy.ExpiryDate == null)
            return Task.FromResult(false);

        var daysToExpiry = (policy.ExpiryDate.Value.ToDateTime(TimeOnly.MinValue) - DateTime.UtcNow).TotalDays;
        return Task.FromResult(daysToExpiry > -30); // Allow renewal up to 30 days after expiry
    }

    private async Task<string> GenerateRenewalNumberAsync(long clientId, Policy priorPolicy)
    {
        // Format: {ClientId}-{IntermediaryId}-{PolicyNumberSuffix}-{RenewalCount}
        var count = await _db.Policies
            .AsNoTracking()
            .Where(p => p.ClientId == clientId &&
                p.Extended!.PriorPolicyId == priorPolicy.Id)
            .CountAsync();

        var increment = count + 1;
        var basePolicySuffix = priorPolicy.PolicyNumber?.Split('-').LastOrDefault() ?? "000";

        return $"{clientId}-{priorPolicy.IntermediaryId ?? 0}-{basePolicySuffix}-R{increment}";
    }

    private async Task CopyPolicyProductsAndCoveragesAsync(
        long sourcePolicyId, long targetPolicyId, long clientId, long createdBy)
    {
        // Copy products
        var sourceProducts = await _db.PolicyProducts
            .AsNoTracking()
            .Where(pp => pp.PolicyId == sourcePolicyId)
            .ToListAsync();

        foreach (var product in sourceProducts)
        {
            var newProduct = new PolicyProduct
            {
                PolicyId = targetPolicyId,
                ClientId = clientId,
                ProductId = product.ProductId,
                SubProductId = product.SubProductId,
                State = product.State,
            };
            _db.PolicyProducts.Add(newProduct);
        }

        // Copy limit coverages
        var sourceCoverages = await _db.PolicyLimitCoverages
            .AsNoTracking()
            .Where(c => c.PolicyId == sourcePolicyId)
            .ToListAsync();

        foreach (var coverage in sourceCoverages)
        {
            var newCoverage = new PolicyLimitCoverage
            {
                PolicyId = targetPolicyId,
                ClientId = clientId,
                CalculatedPremium = coverage.CalculatedPremium,
                PhysicalDamageDeductible = coverage.PhysicalDamageDeductible,
                CoverageLevel = coverage.CoverageLevel,
            };
            _db.PolicyLimitCoverages.Add(newCoverage);
        }

        await _db.SaveChangesAsync();

        _log.LogInformation("CopyProducts: Copied {Count} products and coverages from {SourceId} to {TargetId}",
            sourceProducts.Count + sourceCoverages.Count, sourcePolicyId, targetPolicyId);
    }

    private async Task<ProcessRenewalPaymentResponse> ProcessNonInsuredPaymentAsync(
        Policy policy, string? paymentMethod, decimal? amountPaid, long processedBy)
    {
        try
        {
            // For non-insured responsible party, auto-approve payment
            if (policy.Premium == null)
            {
                return new ProcessRenewalPaymentResponse
                {
                    Success = false,
                    Message = "Premium information not found"
                };
            }

            var clientId = _tenant.ClientId;

            // Create payment transaction
            var paymentTransaction = new PolicyPaymentTransaction
            {
                ClientId = clientId,
                PolicyPremiumId = policy.Premium.Id,
                AmountDue = amountPaid ?? policy.Premium.TotalPremiumWithInstallmentFee,
                InvoiceDate = DateOnly.FromDateTime(DateTime.UtcNow),
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
                TransactionPaymentDate = DateOnly.FromDateTime(DateTime.UtcNow),
                IsPaid = true,
                TransactionStatus = "Approved",
                PaymentMethod = paymentMethod ?? "Auto-Approved (Non-Insured)",
                CreatedBy = processedBy,
                CreatedOn = DateTime.UtcNow,
            };

            _db.PolicyPaymentTransactions.Add(paymentTransaction);
            await _db.SaveChangesAsync();

            _log.LogInformation("ProcessPayment: Payment approved for non-insured party {PolicyId}",
                policy.Id);

            return new ProcessRenewalPaymentResponse
            {
                Success = true,
                Message = "Payment processed successfully",
                PaymentTransactionId = paymentTransaction.Id,
                Status = "Approved"
            };
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "ProcessNonInsuredPayment: Error processing payment");
            return new ProcessRenewalPaymentResponse
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            };
        }
    }
}
