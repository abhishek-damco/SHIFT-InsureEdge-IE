using System.Reflection;
using FluentAssertions;
using InsureEdge.API.Controllers;
using InsureEdge.API.Filters;
using InsureEdge.Application.DTOs.Dashboard;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace InsureEdge.UnitTests;

public class DashboardContractTests
{
    [Fact]
    public void DashboardController_RequiresAuthenticationAndDashboardViewPermission()
    {
        typeof(DashboardController).GetCustomAttribute<AuthorizeAttribute>().Should().NotBeNull();
        typeof(DashboardController).GetCustomAttribute<ApiControllerAttribute>().Should().NotBeNull();

        var permission = typeof(DashboardController).CustomAttributes
            .Single(attribute => attribute.AttributeType == typeof(PermissionAttribute));
        permission.ConstructorArguments[0].Value.Should().Be("DASHBOARD");
        permission.ConstructorArguments[1].Value.Should().Be((int)PermissionType.View);
    }

    [Fact]
    public void DashboardSummary_ContainsPersonaSpecificWidgets()
    {
        var type = typeof(DashboardSummaryDto);
        type.GetProperty(nameof(DashboardSummaryDto.Context)).Should().NotBeNull();
        type.GetProperty(nameof(DashboardSummaryDto.QuoteKpis)).Should().NotBeNull();
        type.GetProperty(nameof(DashboardSummaryDto.ProducerKpis)).Should().NotBeNull();
        type.GetProperty(nameof(DashboardSummaryDto.PolicyKpis)).Should().NotBeNull();
        type.GetProperty(nameof(DashboardSummaryDto.CoverageKpis)).Should().NotBeNull();
        type.GetProperty(nameof(DashboardSummaryDto.WrittenPremium)).Should().NotBeNull();
        type.GetProperty(nameof(DashboardSummaryDto.PendingCancellations)).Should().NotBeNull();
        type.GetProperty(nameof(DashboardSummaryDto.RenewalRadar)).Should().NotBeNull();
        type.GetProperty(nameof(DashboardSummaryDto.FailedPayments)).Should().NotBeNull();
        type.GetProperty(nameof(DashboardSummaryDto.RecentActivities)).Should().NotBeNull();
    }

    [Theory]
    [InlineData(nameof(DashboardController.GetSummary), "summary")]
    [InlineData(nameof(DashboardController.GetQuotes), "quotes")]
    [InlineData(nameof(DashboardController.GetPendingCancellations), "pending-cancellations")]
    [InlineData(nameof(DashboardController.GetRenewalRadar), "renewal-radar")]
    [InlineData(nameof(DashboardController.GetFailedPayments), "failed-payments")]
    [InlineData(nameof(DashboardController.GetPreference), "preference")]
    public void DashboardEndpoints_KeepExpectedRoutes(string methodName, string route)
    {
        var method = typeof(DashboardController).GetMethod(methodName);
        method.Should().NotBeNull();
        method!.GetCustomAttribute<HttpGetAttribute>()!.Template.Should().Be(route);
    }

    [Fact]
    public async Task ProducerOnlyEndpoint_ReturnsForbidden_WhenServiceRejectsClientPersona()
    {
        var service = new Mock<IDashboardService>();
        service.Setup(x => x.GetPendingCancellationsAsync(It.IsAny<DashboardListQuery>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new UnauthorizedAccessException("producer only"));
        var controller = new DashboardController(service.Object);

        var result = await controller.GetPendingCancellations(cancellationToken: CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task Quotes_RejectsUnsupportedPageSize_BeforeQueryingDatabase()
    {
        var service = new Mock<IDashboardService>(MockBehavior.Strict);
        var controller = new DashboardController(service.Object);

        var result = await controller.GetQuotes(pageSize: 7, cancellationToken: CancellationToken.None);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
        service.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task PolicyAlertList_RejectsInvalidPaging_BeforeQueryingDatabase()
    {
        var service = new Mock<IDashboardService>(MockBehavior.Strict);
        var controller = new DashboardController(service.Object);

        var result = await controller.GetRenewalRadar(page: 0, pageSize: 7, cancellationToken: CancellationToken.None);

        result.Should().BeOfType<BadRequestObjectResult>();
        service.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task FailedPayments_ForwardsColumnFiltersAndSortToScopedServiceQuery()
    {
        DashboardListQuery? captured = null;
        var service = new Mock<IDashboardService>();
        service.Setup(x => x.GetFailedPaymentsAsync(It.IsAny<DashboardListQuery>(), It.IsAny<CancellationToken>()))
            .Callback<DashboardListQuery, CancellationToken>((query, _) => captured = query)
            .ReturnsAsync(new DashboardPagedResponse<DashboardFailedPaymentDto>([], 0, 1, 10));
        var controller = new DashboardController(service.Object);

        var result = await controller.GetFailedPayments(
            sortColumn: "amountDue", sortDirection: "desc", policyNumber: "POL-42",
            effectiveDate: new DateOnly(2026, 1, 1), expiryDate: new DateOnly(2026, 12, 31),
            paymentDate: new DateOnly(2026, 10, 19), amountDue: 125.50m, reason: "declined",
            cancellationToken: CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        captured.Should().NotBeNull();
        captured!.SortColumn.Should().Be("amountDue");
        captured.SortDirection.Should().Be("desc");
        captured.PolicyNumber.Should().Be("POL-42");
        captured.EffectiveDate.Should().Be(new DateOnly(2026, 1, 1));
        captured.ExpiryDate.Should().Be(new DateOnly(2026, 12, 31));
        captured.PaymentDate.Should().Be(new DateOnly(2026, 10, 19));
        captured.AmountDue.Should().Be(125.50m);
        captured.Reason.Should().Be("declined");
    }

    [Fact]
    public async Task RecordView_ReturnsNotFound_ForRecordOutsideCallerScope()
    {
        var service = new Mock<IDashboardService>();
        service.Setup(x => x.RecordViewAsync(99, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException("not found"));
        var controller = new DashboardController(service.Object);

        var result = await controller.RecordView(new DashboardActivityRequest(99), CancellationToken.None);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task SavePreference_ReturnsServiceUnavailable_WhenDashboardMigrationIsMissing()
    {
        var service = new Mock<IDashboardService>();
        service.Setup(x => x.SavePreferenceAsync(It.IsAny<DashboardPreferenceDto>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Dashboard widget preferences require the Dashboard database migration."));
        var controller = new DashboardController(service.Object);

        var result = await controller.SavePreference(
            new DashboardPreferenceDto([new DashboardWidgetPreferenceDto("quoteKpis", 0, true)]), CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(503);
    }
}
