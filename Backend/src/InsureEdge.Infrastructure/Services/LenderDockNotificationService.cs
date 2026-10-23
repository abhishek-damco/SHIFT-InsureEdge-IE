// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Orchestrates LenderDock notifications for Endorsement, Cancellation, and Cancel/Rewrite —
// ported from OutSystems NotifyLenderDockForEndorsement / NotifyLenderDockForCancelledPolicy /
// NotifyLenderDockForCancelRewrite. Renewal intentionally out of scope (no "Issue Renewal"
// step exists in this app yet — see conversation notes).
//
// Fired fire-and-forget (own DI scope, own DbContext) from all three call sites so a slow/down
// LenderDock never blocks the core policy transaction — OutSystems only explicitly confirmed
// this for Cancellation (via its "InformLenderdockForCancellation" async Process wrapper);
// applying the same pattern to Endorsement/CancelRewrite here is a deliberate choice for
// robustness, not a confirmed 1:1 port — flag if the business wants those synchronous instead.
using InsureEdge.Application.Interfaces;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace InsureEdge.Infrastructure.Services;

public class LenderDockNotificationService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<LenderDockNotificationService> _log;

    public LenderDockNotificationService(IServiceScopeFactory scopeFactory, ILogger<LenderDockNotificationService> log)
    {
        _scopeFactory = scopeFactory;
        _log = log;
    }

    public void NotifyEndorsementFireAndForget(long policyId, DateOnly effectiveDate)
        => FireAndForget(() => NotifyEndorsementAsync(policyId, effectiveDate));

    public void NotifyCancellationFireAndForget(long policyId, DateOnly effectiveDate, string? cancelReason)
        => FireAndForget(() => NotifyCoverageForAllMortgagesAsync(policyId, effectiveDate, "XLC", cancelReason));

    public void NotifyCancelRewriteFireAndForget(long policyId, DateOnly effectiveDate)
        => FireAndForget(() => NotifyCoverageForAllMortgagesAsync(policyId, effectiveDate, "XLC", "Cancel/Rewrite"));

    private void FireAndForget(Func<Task> action)
    {
        _ = Task.Run(async () =>
        {
            try { await action(); }
            catch (Exception ex) { _log.LogError(ex, "LenderDock notification task failed unexpectedly"); }
        });
    }

    // NotifyLenderDockForEndorsement: classify each Dwelling mortgage — deleted/edited →
    // Coverage, newly added → Bill, unchanged → no notification needed.
    private async Task NotifyEndorsementAsync(long policyId, DateOnly effectiveDate)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InsureEdgeDbContext>();
        var lenderDock = scope.ServiceProvider.GetRequiredService<ILenderDockClient>();
        var builder = scope.ServiceProvider.GetRequiredService<LenderDockRequestBuilder>();

        var policy = await LoadPolicyAsync(db, policyId);
        if (policy == null) return;

        foreach (var mortgage in policy.Mortgages.Where(m => m.CoveredAsset == "Dwelling"))
        {
            if (mortgage.IsDeleted == true)
            {
                var req = await builder.BuildAsync(policy, mortgage, "PCH", effectiveDate);
                var (_, json, ok) = await lenderDock.PostCoverageAsync(req);
                LogResult("Endorsement/Coverage(deleted)", policyId, mortgage.Id, ok, json);
            }
            else if (mortgage.IsNewlyAdded == true)
            {
                var req = await builder.BuildAsync(policy, mortgage, "PCH", effectiveDate);
                var (_, json, ok) = await lenderDock.PostBillAsync(req);
                LogResult("Endorsement/Bill(new)", policyId, mortgage.Id, ok, json);
            }
            else if (mortgage.IsEdited == true)
            {
                var req = await builder.BuildAsync(policy, mortgage, "PCH", effectiveDate);
                var (_, json, ok) = await lenderDock.PostCoverageAsync(req);
                LogResult("Endorsement/Coverage(edited)", policyId, mortgage.Id, ok, json);
            }
            // unchanged mortgage: no notification needed.
        }
    }

    // NotifyLenderDockForCancelledPolicy / NotifyLenderDockForCancelRewrite /
    // NotifyMortgageeCoverageCancellation: every Dwelling mortgage gets a Coverage call.
    private async Task NotifyCoverageForAllMortgagesAsync(long policyId, DateOnly effectiveDate, string activityCode, string? cancelReason)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InsureEdgeDbContext>();
        var lenderDock = scope.ServiceProvider.GetRequiredService<ILenderDockClient>();
        var builder = scope.ServiceProvider.GetRequiredService<LenderDockRequestBuilder>();

        var policy = await LoadPolicyAsync(db, policyId);
        if (policy == null) return;

        foreach (var mortgage in policy.Mortgages.Where(m => m.CoveredAsset == "Dwelling"))
        {
            var req = await builder.BuildAsync(policy, mortgage, activityCode, effectiveDate, cancelReason);
            var (_, json, ok) = await lenderDock.PostCoverageAsync(req);
            LogResult($"Coverage({activityCode})", policyId, mortgage.Id, ok, json);
        }
    }

    private static Task<InsureEdge.Domain.Entities.Policy?> LoadPolicyAsync(InsureEdgeDbContext db, long policyId) =>
        db.Policies
            .Include(p => p.Account)
            .Include(p => p.RiskAddresses)
            .Include(p => p.LimitCoverages)
            .Include(p => p.Premium)
            .Include(p => p.Extended)
            .Include(p => p.Mortgages)
            .FirstOrDefaultAsync(p => p.Id == policyId);

    private void LogResult(string label, long policyId, long mortgageId, bool success, string json)
    {
        if (success)
            _log.LogInformation("LenderDock {Label} succeeded for policy {PolicyId}, mortgage {MortgageId}", label, policyId, mortgageId);
        else
            _log.LogError("LenderDock {Label} failed for policy {PolicyId}, mortgage {MortgageId}: {Json}", label, policyId, mortgageId, json);
    }
}
