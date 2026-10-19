namespace InsureEdge.Application.DTOs.Dashboard;

public static class DashboardPersonas
{
    public const string Client = "client";
    public const string Producer = "producer";
}

public record DashboardContextDto(string Persona, bool IsHudsonBailey, string Currency);
public record DashboardKpisDto(int Uploaded, int Approved, int NotApproved, int Expired);
public record DashboardProducerKpisDto(int ActivePolicies, int NewBusinessQuotes, int RenewalQuotes, int EndorsementQuotes);
public record DashboardPolicyKpisDto(int TotalPolicies, int ActivePolicies, int BoundPolicies, int CancelledPolicies);
public record DashboardCoverageKpisDto(int Basic, int Standard, int Preferred);
public record WrittenPremiumDto(int Year, decimal Amount);

public record DashboardQuoteDto(
    long PolicyId,
    string QuoteNumber,
    string TransactionType,
    string InsuredName,
    string? InsuredType,
    string? Lob,
    string? TransactionEffectiveDate,
    string? ApprovalStatus,
    string CreationDate,
    string? LastUpdated,
    decimal? PremiumEstimate,
    string? Status);

public record DashboardPendingCancellationDto(
    long PaymentTransactionId,
    long PolicyId,
    string PolicyNumber,
    string InsuredName,
    int DaysOverdue,
    string DueDate,
    decimal PremiumAmount,
    string Currency);

public record DashboardRenewalRadarDto(
    long PolicyId,
    string PolicyNumber,
    string InsuredName,
    string? LineOfBusiness,
    decimal? PremiumAmount,
    string? RiskLevel,
    string ExpiryDate,
    int DaysUntilExpiry,
    string Currency);

public record DashboardFailedPaymentDto(
    long PaymentTransactionId,
    long PolicyId,
    string PolicyNumber,
    string? EffectiveDate,
    string? ExpiryDate,
    string PaymentDate,
    decimal AmountDue,
    string Reason,
    string Currency);

public record DashboardRecentActivityDto(
    long Id,
    long PolicyId,
    string RecordNumber,
    string RecordType,
    string Description,
    DateTime CreatedAt);

public record DashboardSummaryDto(
    DashboardContextDto Context,
    DashboardKpisDto QuoteKpis,
    DashboardProducerKpisDto? ProducerKpis,
    DashboardPolicyKpisDto? PolicyKpis,
    DashboardCoverageKpisDto? CoverageKpis,
    List<WrittenPremiumDto> WrittenPremium,
    List<DashboardPendingCancellationDto> PendingCancellations,
    List<DashboardRenewalRadarDto> RenewalRadar,
    List<DashboardFailedPaymentDto> FailedPayments,
    List<DashboardRecentActivityDto> RecentActivities);

public record DashboardQuoteResponse(List<DashboardQuoteDto> Data, int Total, int Page, int PageSize);
public record DashboardPagedResponse<T>(List<T> Data, int Total, int Page, int PageSize);

public record DashboardQuoteQuery(
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? SortColumn = "creationDate",
    string? SortDirection = "desc",
    string? AccountType = null,
    string? TransactionType = null,
    string? InsuredName = null,
    string? Lob = null,
    DateOnly? EffectiveDate = null,
    string? ApprovalStatus = null,
    DateOnly? CreationDate = null,
    decimal? PremiumEstimate = null,
    string? Status = null);

public record DashboardListQuery(
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? SortColumn = null,
    string? SortDirection = "asc",
    string? PolicyNumber = null,
    DateOnly? EffectiveDate = null,
    DateOnly? ExpiryDate = null,
    DateOnly? PaymentDate = null,
    decimal? AmountDue = null,
    string? Reason = null);
public record DashboardWidgetPreferenceDto(string WidgetKey, int DisplayOrder, bool IsVisible);
public record DashboardPreferenceDto(List<DashboardWidgetPreferenceDto> Widgets);
public record DashboardActivityRequest(long PolicyId);
public record DashboardRenewalResultDto(long PolicyId, string QuoteNumber);
