using FluentAssertions;
using InsureEdge.API.Filters;
using Xunit;

namespace InsureEdge.UnitTests;

public class ProducerModuleRestrictionFilterTests
{
    [Theory]
    [InlineData("Dashboard", "GET")]
    [InlineData("Submissions", "POST")]
    [InlineData("NbQuotes", "GET")]
    [InlineData("Policies", "PUT")]
    [InlineData("Claims", "POST")]
    [InlineData("ClaimsDashboard", "GET")]
    [InlineData("Auth", "POST")]
    public void Producer_can_use_dashboard_quotes_policies_and_claims(string controller, string method)
    {
        ProducerModuleRestrictionFilter.IsAllowed(controller, method).Should().BeTrue();
    }

    [Theory]
    [InlineData("Users", "GET")]
    [InlineData("Groups", "GET")]
    [InlineData("Clients", "GET")]
    [InlineData("Admin", "POST")]
    [InlineData("ScreenPermissions", "PUT")]
    public void Producer_is_blocked_from_other_modules(string controller, string method)
    {
        ProducerModuleRestrictionFilter.IsAllowed(controller, method).Should().BeFalse();
    }

    [Theory]
    [InlineData("Distribution", "GET", true)]     // Brokerage Firm drop-down on New Submission
    [InlineData("Producers", "GET", true)]
    [InlineData("Distribution", "POST", false)]
    [InlineData("Intermediaries", "PUT", false)]
    [InlineData("Producers", "DELETE", false)]
    public void Producer_can_only_read_distribution_lists(string controller, string method, bool expected)
    {
        ProducerModuleRestrictionFilter.IsAllowed(controller, method).Should().Be(expected);
    }
}
