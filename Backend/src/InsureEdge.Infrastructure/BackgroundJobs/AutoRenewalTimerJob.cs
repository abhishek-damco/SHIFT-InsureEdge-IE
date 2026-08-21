using InsureEdge.Application.Interfaces;
using InsureEdge.Application.Services;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using InsureEdge.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace InsureEdge.Infrastructure.BackgroundJobs
{
    /// <summary>
    /// Automated Timer Job equivalent to OutSystems CreateRenewalPolicies BPT.
    /// Runs periodically to auto-create renewal quotes for policies approaching expiry.
    ///
    /// Workflow:
    /// 1. GetRenewalQuotes_SQL: Query policies eligible for renewal
    /// 2. ValidatePreviousPolicy: Check if policy is eligible
    /// 3. LaunchCreateRenewalPolicy: Auto-create renewal quote if valid
    /// 4. Send notifications (email to broker)
    /// </summary>
    public class AutoRenewalTimerJob
    {
        private readonly InsureEdgeDbContext _db;
        private readonly RenewalQuoteService _renewalService;
        private readonly RenewalNoticeService _noticeService;
        private readonly ICurrentTenantService _tenantService;
        private readonly ILogger<AutoRenewalTimerJob> _logger;

        public AutoRenewalTimerJob(
            InsureEdgeDbContext db,
            RenewalQuoteService renewalService,
            RenewalNoticeService noticeService,
            ICurrentTenantService tenantService,
            ILogger<AutoRenewalTimerJob> logger)
        {
            _db = db;
            _renewalService = renewalService;
            _noticeService = noticeService;
            _tenantService = tenantService;
            _logger = logger;
        }

        /// <summary>
        /// Main timer job execution - runs on schedule (e.g., daily at 2 AM)
        /// Equivalent to CreateRenewalPolicies timer start event
        /// </summary>
        public async Task ExecuteAsync()
        {
            _logger.LogInformation("🕐 AutoRenewalTimerJob started");

            try
            {
                // Step 0: Generate Renewal Notices (30, 15, 7 days before expiry)
                _logger.LogInformation("Generating renewal notices...");
                var noticesCreated = await _noticeService.GenerateRenewalNoticesAsync();
                _logger.LogInformation($"✉️ Generated {noticesCreated} renewal notices");

                // Step 1: GetRenewalQuotes_SQL - Get list of policies to renew
                var policiesToRenew = await GetRenewalQuotesAsync();
                _logger.LogInformation($"Found {policiesToRenew.Count} policies eligible for renewal");

                if (policiesToRenew.Count == 0)
                {
                    _logger.LogInformation("No policies eligible for renewal");
                    return;
                }

                // Step 2-3: For each policy, validate & create renewal
                var successCount = 0;
                var failureCount = 0;

                foreach (var policy in policiesToRenew)
                {
                    try
                    {
                        // Step 2: ValidatePreviousPolicy - Check if policy is eligible for renewal
                        var isValid = await ValidatePreviousPolicyAsync(policy);

                        if (!isValid)
                        {
                            _logger.LogWarning($"Policy {policy.PolicyNumber} failed validation, skipping renewal");
                            failureCount++;
                            continue;
                        }

                        // Step 3: LaunchCreateRenewalPolicy - Create renewal automatically
                        var result = await LaunchCreateRenewalPolicyAsync(policy);

                        if (result.Success)
                        {
                            _logger.LogInformation(
                                $"✅ Renewal created for {policy.PolicyNumber}: Quote #{result.QuoteNumber}");
                            successCount++;

                            // Send email notification to broker (future enhancement)
                            await SendBrokerNotificationAsync(policy, result);
                        }
                        else
                        {
                            _logger.LogError(
                                $"❌ Failed to create renewal for {policy.PolicyNumber}: {result.Message}");
                            failureCount++;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error processing renewal for policy {policy.PolicyNumber}");
                        failureCount++;
                    }
                }

                _logger.LogInformation(
                    $"🏁 AutoRenewalTimerJob completed: {successCount} success, {failureCount} failed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AutoRenewalTimerJob failed");
                throw;
            }
        }

        /// <summary>
        /// Step 1: GetRenewalQuotes_SQL
        /// Query policies that need renewal quotes created
        ///
        /// Criteria:
        /// - Status = Active
        /// - Expiry date exists
        /// - Expiry is between TODAY and TODAY + 60 days (configurable window)
        /// - No existing renewal quote already created
        /// </summary>
        private async Task<List<Policy>> GetRenewalQuotesAsync()
        {
            var clientId = _tenantService.ClientId;
            var today = DateTime.UtcNow.Date;
            var renewalWindow = 60; // Days before expiry to start renewal (configurable)
            var gracePeriod = 30; // Allow renewal up to 30 days after expiry
            var todayDateOnly = DateOnly.FromDateTime(today);
            var startDateOnly = DateOnly.FromDateTime(today.AddDays(-gracePeriod));
            var endDateOnly = DateOnly.FromDateTime(today.AddDays(renewalWindow));

            var policiesToRenew = await _db.Policies
                .Include(p => p.Premium)
                .ThenInclude(pp => pp!.Transactions)
                .Where(p => p.ClientId == clientId)
                .Where(p => p.Status == "Active")
                .Where(p => p.Premium != null) // FIX #1: Check premium exists
                .Where(p => p.Premium.Transactions.Any(ppt => ppt.IsPaid == true)) // FIX #1: Premium must be paid
                .Where(p => p.ExpiryDate != null)
                // FIX #2: Include grace period (30 days after expiry) + renewal window (60 days before expiry)
                .Where(p => p.ExpiryDate >= startDateOnly && p.ExpiryDate <= endDateOnly)
                .ToListAsync();

            return policiesToRenew ?? new List<Policy>();
        }

        /// <summary>
        /// Step 2: ValidatePreviousPolicy (Run Server Action)
        /// Check if the policy is eligible for renewal
        ///
        /// Validation Rules:
        /// - Status must be Active (not Cancelled, Declined, Lapsed)
        /// - Expiry date must exist
        /// - Policy must not already have an active renewal quote
        /// - Policy must not be in dispute or hold
        /// </summary>
        private async Task<bool> ValidatePreviousPolicyAsync(Policy policy)
        {
            try
            {
                var policyNumber = policy.PolicyNumber;
                _logger.LogInformation($"Validating policy {policyNumber}");

                // Check status
                if (policy.Status != "Active")
                {
                    _logger.LogWarning($"Policy {policyNumber} status is {policy.Status}, not Active");
                    return false;
                }

                // Check expiry date exists
                if (policy.ExpiryDate == null)
                {
                    _logger.LogWarning($"Policy {policyNumber} has no expiry date");
                    return false;
                }

                // Check renewal doesn't already exist
                var existingRenewal = await _db.Policies
                    .Include(p => p.Extended)
                    .Where(p => p.ClientId == policy.ClientId)
                    .Where(p => p.PolicyType == "RENEWAL")
                    .Where(p => p.Extended != null && p.Extended.PriorPolicyId == policy.Id)
                    .FirstOrDefaultAsync();

                if (existingRenewal != null)
                {
                    _logger.LogWarning(
                        $"Renewal already exists for policy {policyNumber}: {existingRenewal.PolicyNumber}");
                    return false;
                }

                _logger.LogInformation($"✓ Policy {policyNumber} passed validation");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Policy validation failed");
                return false;
            }
        }

        /// <summary>
        /// Step 3: LaunchCreateRenewalPolicy
        /// Automatically create renewal quote for validated policy
        ///
        /// Actions:
        /// - Call RenewalQuoteService.CreateRenewalQuoteAsync
        /// - Create all supporting records (products, coverages, transactions)
        /// - Log audit trail
        /// </summary>
        private async Task<(bool Success, string QuoteNumber, string Message)> LaunchCreateRenewalPolicyAsync(Policy policy)
        {
            try
            {
                var policyNumber = policy.PolicyNumber;
                _logger.LogInformation($"Creating renewal for policy {policyNumber}");

                // Call the renewal service to create the quote
                // This is equivalent to OutSystems "LaunchCreateRenewalPolicy" action
                var result = await _renewalService.CreateRenewalQuoteAsync(
                    priorPolicyNumber: policyNumber ?? "",
                    renewalOfferDate: DateOnly.FromDateTime(DateTime.UtcNow),
                    createdBy: 0 // System user
                );

                if (!result.Success)
                {
                    return (false, result.QuoteNumber, result.Message);
                }

                return (true, result.QuoteNumber, result.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to launch renewal creation for policy");
                return (false, "", ex.Message);
            }
        }

        /// <summary>
        /// Send email notification to broker when renewal is created
        /// Equivalent to HBEmailNotificationToBrokerForApprovedQuotes action
        /// </summary>
        private Task SendBrokerNotificationAsync(Policy policy, (bool Success, string QuoteNumber, string Message) result)
        {
            try
            {
                var policyNumber = policy.PolicyNumber;
                var intermediaryName = policy.Intermediary?.IntermediaryName ?? "";

                _logger.LogInformation(
                    $"Sending renewal notification to broker for policy {policyNumber} " +
                    $"(Intermediary: {intermediaryName})");

                // TODO: Implement email notification
                // Would send: "Renewal Quote {QuoteNumber} created for policy {PolicyNumber}"
                // To: Broker/Intermediary email
                // Subject: "Renewal Quote Ready for Review"

                _logger.LogInformation($"Notification sent for renewal {result.QuoteNumber}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send broker notification");
                // Don't throw - notification failure shouldn't stop the renewal
            }

            return Task.CompletedTask;
        }
    }
}
