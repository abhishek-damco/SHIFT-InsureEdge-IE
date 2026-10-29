using FluentAssertions;
using InsureEdge.Application.DTOs.Dashboard;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using InsureEdge.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Npgsql;
using Xunit;

namespace InsureEdge.UnitTests;

// Opt-in test against the same isolated local cluster used by ProducerReservationApiTests.
// It creates and drops a unique database and never reads application configuration.
public class DashboardPostgresIntegrationTests
{
    private sealed class LocalPostgresFactAttribute : FactAttribute
    {
        public LocalPostgresFactAttribute()
        {
            if (Environment.GetEnvironmentVariable("INSUREEDGE_LOCAL_PRODUCER_TEST") != "1")
                Skip = "Requires the isolated local PostgreSQL test cluster on port 55439.";
        }
    }

    private sealed record TestTenant(
        long ClientId,
        long UserId,
        long? ProducerId,
        long? IntermediaryId,
        bool IsFullProducerVisibility = false) : ICurrentTenantService;

    [LocalPostgresFact]
    [Trait("Category", "LocalPostgres")]
    public async Task Dashboard_queries_apply_original_filters_search_and_producer_isolation()
    {
        var database = "dashboard_verification_" + Guid.NewGuid().ToString("N");
        const string adminConnection = "Host=127.0.0.1;Port=55439;Username=producer_test;Database=postgres;Pooling=false";
        await using var admin = new NpgsqlConnection(adminConnection);
        await admin.OpenAsync();
        await using (var create = new NpgsqlCommand($"CREATE DATABASE {database}", admin))
            await create.ExecuteNonQueryAsync();

        var connection = new NpgsqlConnectionStringBuilder(adminConnection) { Database = database }.ConnectionString;
        try
        {
            var options = new DbContextOptionsBuilder<InsureEdgeDbContext>()
                .UseNpgsql(connection).UseSnakeCaseNamingConvention().Options;
            await using var db = new InsureEdgeDbContext(options);
            var unmigratedTenant = new TestTenant(1, 1, null, null);
            var unmigratedService = new DashboardService(db, unmigratedTenant,
                new RenewalQuoteService(db, unmigratedTenant, NullLogger<RenewalQuoteService>.Instance));
            var defaultPreference = await unmigratedService.GetPreferenceAsync();
            defaultPreference.Widgets.Should().NotBeEmpty("an optional missing preference table must not block Dashboard viewing");

            await db.Database.EnsureCreatedAsync();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var overdueDate = new DateOnly(today.Year, today.Month, 1);
            overdueDate.Should().BeBefore(today, "the test fixture needs an overdue day in the current month");

            db.Clients.AddRange(
                new Client { Id = 1, CompanyName = "Acme Insurance", IsActive = true, CreatedOn = DateTime.UtcNow },
                new Client { Id = 2, CompanyName = "Other Tenant", IsActive = true, CreatedOn = DateTime.UtcNow });
            db.Intermediaries.Add(new Intermediary { Id = 1, ClientId = 1, IntermediaryCode = "IM00000001", IntermediaryName = "Acme Agency" });
            db.Producers.AddRange(
                new Producer { Id = 1, ClientId = 1, IntermediaryId = 1, ProducerCode = "PR00000001", FirstName = "Scoped", LastName = "Producer" },
                new Producer { Id = 2, ClientId = 1, IntermediaryId = 1, ProducerCode = "PR00000002", FirstName = "Other", LastName = "Producer" });
            db.Users.Add(new User { Id = 1, ClientId = 1, ProducerId = 1, FirstName = "Dashboard", LastName = "Tester", Email = "dashboard@test.invalid", PasswordHash = "not-used", IsActive = true, CreatedOn = DateTime.UtcNow });
            db.Accounts.Add(new Account { Id = 1, ClientId = 1, ProducerId = 1, IntermediaryId = 1, AccountType = "Individual", FirstName = "Test", LastName = "Insured" });

            var policies = new[]
            {
                Policy(1, "NB-1", "NEWBUSINESSINDIVIDUAL", "Draft", 1),
                Policy(2, "NB-BUSINESS", "NEWBUSINESSBUSINESS", "Draft", 1),
                Policy(3, "RN-1", "RENEWALINDIVIDUAL", "Draft", 1),
                Policy(4, "RN-GENERIC", "RENEWAL", "Draft", 1),
                Policy(5, "EN-1", "ENDORSEMENTBUSINESS", "Draft", 1),
                Policy(6, "EN-GENERIC", "ENDORSEMENT", "Draft", 1),
                Policy(7, "POL-RENEW", "POLICIESINDIVIDUAL", "Active", 1, today.AddDays(10), false),
                Policy(8, "POL-GENERIC", "POLICY", "Active", 1, today.AddDays(10), false),
                Policy(9, "POL-DNR-NULL", "POLICIESBUSINESS", "Active", 1, today.AddDays(20), null),
                Policy(10, "OTHER-PRODUCER", "POLICIESINDIVIDUAL", "Active", 2, today.AddDays(5), false),
                Policy(11, "OTHER-TENANT", "POLICIESINDIVIDUAL", "Active", 1, today.AddDays(5), false, clientId: 2),
                Policy(12, "POL-DAY-0", "POLICIESINDIVIDUAL", "Active", 1, today, false),
                Policy(13, "POL-DAY-60", "POLICIESBUSINESS", "Active", 1, today.AddDays(60), false),
                Policy(14, "POL-DAY-61", "POLICIESBUSINESS", "Active", 1, today.AddDays(61), false)
            };
            db.Policies.AddRange(policies);
            db.PolicyPremiums.AddRange(
                new PolicyPremium
                {
                    Id = 1, ClientId = 1, PolicyId = 7, TotalPremiumWithoutInstallmentFee = 1234.56m,
                    TotalPremiumWithInstallmentFee = 1250m, NumberOfInstallments = 12
                },
                new PolicyPremium
                {
                    Id = 2, ClientId = 2, PolicyId = 11, TotalPremiumWithoutInstallmentFee = 999m,
                    TotalPremiumWithInstallmentFee = 999m, NumberOfInstallments = 12
                });
            db.PolicyPaymentTransactions.AddRange(
                new PolicyPaymentTransaction { Id = 1, ClientId = 1, PolicyPremiumId = 1, AmountDue = 125m, InvoiceDate = overdueDate, DueDate = overdueDate, IsPaid = false, TransactionStatus = "FAILED" },
                new PolicyPaymentTransaction { Id = 2, ClientId = 1, PolicyPremiumId = 1, AmountDue = 126m, InvoiceDate = overdueDate, DueDate = overdueDate, IsPaid = false, TransactionStatus = null },
                new PolicyPaymentTransaction { Id = 3, ClientId = 2, PolicyPremiumId = 2, AmountDue = 999m, InvoiceDate = overdueDate, DueDate = overdueDate, IsPaid = false, TransactionStatus = "FAILED" });
            await db.SaveChangesAsync();

            var tenant = new TestTenant(1, 1, 1, 1);
            var renewal = new RenewalQuoteService(db, tenant, NullLogger<RenewalQuoteService>.Instance);
            var service = new DashboardService(db, tenant, renewal);

            var summary = await service.GetSummaryAsync();
            summary.Context.Persona.Should().Be(DashboardPersonas.Producer);
            summary.Context.IsHudsonBailey.Should().BeTrue("Dashboard HB classification is an unconditional business rule");
            summary.Context.Currency.Should().Be("USD");
            summary.ProducerKpis.Should().BeNull("the non-HB Producer KPI branch must never execute");
            summary.QuoteKpis.Uploaded.Should().Be(2);

            var pending = await service.GetPendingCancellationsAsync(new DashboardListQuery(1, 10, "125", null, null));
            pending.Total.Should().Be(1);
            pending.Data.Single().PolicyNumber.Should().Be("POL-RENEW");

            var renewals = await service.GetRenewalRadarAsync(new DashboardListQuery(1, 10, "1234.56", null, null));
            renewals.Total.Should().Be(1);
            renewals.Data.Single().PolicyNumber.Should().Be("POL-RENEW");
            renewals.Data.Single().RiskLevel.Should().BeNull();

            var renewalBoundaries = await service.GetRenewalRadarAsync(new DashboardListQuery(1, 10));
            renewalBoundaries.Data.Select(x => x.PolicyNumber).Should().BeEquivalentTo("POL-DAY-0", "POL-RENEW", "POL-DAY-60");

            var clientTenant = new TestTenant(1, 1, null, null);
            var clientService = new DashboardService(db, clientTenant,
                new RenewalQuoteService(db, clientTenant, NullLogger<RenewalQuoteService>.Instance));
            var clientSummary = await clientService.GetSummaryAsync();
            clientSummary.Context.IsHudsonBailey.Should().BeTrue();
            clientSummary.Context.Currency.Should().Be("USD");
            var clientFailures = await clientService.GetFailedPaymentsAsync(new DashboardListQuery(1, 10));
            clientFailures.Total.Should().Be(2);
            clientFailures.Data.Should().OnlyContain(x => x.PolicyNumber == "POL-RENEW");
        }
        finally
        {
            await using var drop = new NpgsqlCommand($"DROP DATABASE {database} WITH (FORCE)", admin);
            await drop.ExecuteNonQueryAsync();
        }
    }

    private static Policy Policy(long id, string number, string type, string status, long producerId,
        DateOnly? expiry = null, bool? doNotRenew = false, long clientId = 1) => new()
    {
        Id = id,
        ClientId = clientId,
        AccountId = clientId == 1 ? 1 : null,
        IntermediaryId = clientId == 1 ? 1 : null,
        ProducerId = producerId,
        PolicyNumber = number,
        PolicyType = type,
        PolicyStatus = status,
        Status = status,
        EffectiveDate = DateOnly.FromDateTime(DateTime.UtcNow),
        ExpiryDate = expiry,
        DoNotRenew = doNotRenew
    };
}
