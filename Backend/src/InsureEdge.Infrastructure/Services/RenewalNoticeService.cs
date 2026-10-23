using InsureEdge.Application.DTOs.QuotesPolicies;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace InsureEdge.Infrastructure.Services;

/// <summary>
/// Renewal Notice Service - Generates and tracks renewal notices at configurable intervals
/// (30 days, 15 days, 7 days before policy expiry).
///
/// Workflow:
/// 1. Query policies approaching expiry
/// 2. Check if notice already sent at this interval
/// 3. Generate and send renewal notice
/// 4. Track notice in database for audit trail
/// 5. Create renewal quote when appropriate (after initial notice or on schedule)
/// </summary>
public class RenewalNoticeService
{
    private readonly InsureEdgeDbContext _db;
    private readonly ICurrentTenantService _tenant;
    private readonly ILogger<RenewalNoticeService> _log;

    public RenewalNoticeService(
        InsureEdgeDbContext db,
        ICurrentTenantService tenant,
        ILogger<RenewalNoticeService> log)
    {
        _db = db;
        _tenant = tenant;
        _log = log;
    }

    /// <summary>
    /// Generate renewal notices for policies approaching expiry
    /// Runs at configurable intervals (30, 15, 7 days before expiry)
    /// </summary>
    public async Task<int> GenerateRenewalNoticesAsync(long? createdBy = null)
    {
        var clientId = _tenant.ClientId;
        createdBy ??= _tenant.UserId;

        _log.LogInformation("GenerateRenewalNotices: Starting for client {ClientId}", clientId);

        var noticesCreated = 0;

        try
        {
            // Notice intervals (in days before expiry): 30, 15, 7
            var noticeIntervals = new[] { 30, 15, 7 };

            foreach (var daysBeforeExpiry in noticeIntervals)
            {
                noticesCreated += await GenerateNoticesForIntervalAsync(daysBeforeExpiry, createdBy ?? 0, clientId);
            }

            _log.LogInformation("GenerateRenewalNotices: Created {Count} notices", noticesCreated);
            return noticesCreated;
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "GenerateRenewalNotices: Error generating notices");
            throw;
        }
    }

    /// <summary>
    /// Generate notices for a specific interval (e.g., 30 days before expiry)
    /// </summary>
    private async Task<int> GenerateNoticesForIntervalAsync(int daysBeforeExpiry, long createdBy, long clientId)
    {
        var today = DateTime.UtcNow.Date;
        var targetDate = today.AddDays(daysBeforeExpiry);

        _log.LogInformation(
            "GenerateNoticesForInterval: Processing {DaysBeforeExpiry} days interval (target: {TargetDate})",
            daysBeforeExpiry, targetDate);

        // Find policies expiring on the target date
        var eligiblePolicies = await _db.Policies
            .AsNoTracking()
            .Where(p => p.ClientId == clientId)
            .Where(p => p.Status == "Active")
            .Where(p => p.ExpiryDate != null)
            .Where(p => p.ExpiryDate == DateOnly.FromDateTime(targetDate))
            .ToListAsync();

        var noticesCreated = 0;

        foreach (var policy in eligiblePolicies)
        {
            try
            {
                // Check if notice already sent for this interval
                var noticeExists = await _db.RenewalNotices
                    .AsNoTracking()
                    .FirstOrDefaultAsync(n =>
                        n.ClientId == clientId &&
                        n.PolicyId == policy.Id &&
                        n.DaysBeforeExpiry == daysBeforeExpiry &&
                        n.NoticeSentDate != null);

                if (noticeExists != null)
                {
                    _log.LogInformation(
                        "GenerateNoticesForInterval: Notice already sent for {PolicyNumber} at {Interval} days",
                        policy.PolicyNumber, daysBeforeExpiry);
                    continue;
                }

                // Create renewal notice record
                var notice = new RenewalNotice
                {
                    ClientId = clientId,
                    PolicyId = policy.Id,
                    PolicyNumber = policy.PolicyNumber,
                    DaysBeforeExpiry = daysBeforeExpiry,
                    NoticeType = $"Renewal Notice - {daysBeforeExpiry} days",
                    NoticeSentDate = DateTime.UtcNow,
                    NoticeStatus = "Sent",
                    ExpiryDate = policy.ExpiryDate,
                    IntermediaryId = policy.IntermediaryId,
                    IntermediaryName = policy.Intermediary?.IntermediaryName ?? policy.IntermediaryType ?? "Unknown",
                    CreatedBy = createdBy,
                    CreatedOn = DateTime.UtcNow,
                };

                _db.RenewalNotices.Add(notice);
                await _db.SaveChangesAsync();

                _log.LogInformation(
                    "GenerateNoticesForInterval: Created renewal notice for {PolicyNumber} ({DaysBeforeExpiry} days)",
                    policy.PolicyNumber, daysBeforeExpiry);

                noticesCreated++;

                // TODO: Send email notification to broker/customer
                // await SendRenewalNoticeEmailAsync(policy, daysBeforeExpiry);
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "GenerateNoticesForInterval: Error processing notice for {PolicyNumber}",
                    policy.PolicyNumber);
            }
        }

        return noticesCreated;
    }

    /// <summary>
    /// Get renewal notices for a policy (for UI display)
    /// </summary>
    public async Task<List<RenewalNoticeDto>> GetRenewalNoticesAsync(long policyId)
    {
        var clientId = _tenant.ClientId;

        var notices = await _db.RenewalNotices
            .AsNoTracking()
            .Where(n => n.ClientId == clientId && n.PolicyId == policyId)
            .OrderByDescending(n => n.DaysBeforeExpiry)
            .Select(n => new RenewalNoticeDto
            {
                Id = n.Id,
                PolicyNumber = n.PolicyNumber,
                DaysBeforeExpiry = n.DaysBeforeExpiry,
                NoticeType = n.NoticeType,
                NoticeSentDate = n.NoticeSentDate,
                NoticeStatus = n.NoticeStatus,
                ExpiryDate = n.ExpiryDate,
            })
            .ToListAsync();

        return notices;
    }

    /// <summary>
    /// Mark notice as acknowledged by customer
    /// </summary>
    public async Task<bool> MarkNoticeAcknowledgedAsync(long noticeId)
    {
        try
        {
            var notice = await _db.RenewalNotices.FirstOrDefaultAsync(n => n.Id == noticeId);
            if (notice == null)
            {
                _log.LogWarning("MarkNoticeAcknowledged: Notice not found {NoticeId}", noticeId);
                return false;
            }

            notice.NoticeStatus = "Acknowledged";
            notice.UpdatedOn = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            _log.LogInformation("MarkNoticeAcknowledged: Marked notice {NoticeId} as acknowledged", noticeId);
            return true;
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "MarkNoticeAcknowledged: Error updating notice");
            return false;
        }
    }
}

/// <summary>
/// DTO for renewal notice display
/// </summary>
public class RenewalNoticeDto
{
    public long Id { get; set; }
    public string PolicyNumber { get; set; }
    public int DaysBeforeExpiry { get; set; }
    public string NoticeType { get; set; }
    public DateTime? NoticeSentDate { get; set; }
    public string NoticeStatus { get; set; }
    public DateOnly? ExpiryDate { get; set; }
}
