using InsureEdge.Application.DTOs.Dashboard;

namespace InsureEdge.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default);
    Task<DashboardQuoteResponse> GetQuotesAsync(DashboardQuoteQuery query, CancellationToken cancellationToken = default);
    Task<DashboardPagedResponse<DashboardPendingCancellationDto>> GetPendingCancellationsAsync(DashboardListQuery query, CancellationToken cancellationToken = default);
    Task<DashboardPagedResponse<DashboardRenewalRadarDto>> GetRenewalRadarAsync(DashboardListQuery query, CancellationToken cancellationToken = default);
    Task<DashboardPagedResponse<DashboardFailedPaymentDto>> GetFailedPaymentsAsync(DashboardListQuery query, CancellationToken cancellationToken = default);
    Task<DashboardPreferenceDto> GetPreferenceAsync(CancellationToken cancellationToken = default);
    Task<DashboardPreferenceDto> SavePreferenceAsync(DashboardPreferenceDto preference, CancellationToken cancellationToken = default);
    Task RecordViewAsync(long policyId, CancellationToken cancellationToken = default);
    Task<DashboardRenewalResultDto> InitiateRenewalAsync(long policyId, CancellationToken cancellationToken = default);
}
