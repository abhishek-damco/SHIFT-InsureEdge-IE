using FluentAssertions;
using InsureEdge.API.Services;
using InsureEdge.Infrastructure.Data;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace InsureEdge.UnitTests;

public class ProducerDraftIdsTests
{
    private static ProducerDraftIds CreateService()
    {
        // Formatting and protection tests never connect to any database.
        var db = new InsureEdgeDbContext(new DbContextOptionsBuilder<InsureEdgeDbContext>().Options);
        return new ProducerDraftIds(db, new EphemeralDataProtectionProvider());
    }

    [Theory]
    [InlineData(1, "PR00000001")]
    [InlineData(2, "PR00000002")]
    [InlineData(13, "PR00000013")]
    [InlineData(14, "PR00000014")]
    [InlineData(100000, "PR00100000")]
    [InlineData(99999999, "PR99999999")]
    public void Reserved_database_numbers_have_PR_prefix_and_exactly_eight_digits(long id, string expected)
        => ProducerDraftIds.FormatCode(id).Should().Be(expected);

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(100000000)]
    public void Out_of_range_numbers_are_never_truncated_or_recycled(long id)
        => FluentActions.Invoking(() => ProducerDraftIds.FormatCode(id)).Should().Throw<InvalidOperationException>();

    [Fact]
    public void Reservation_retains_the_exact_id_and_ownership_context()
    {
        var service = CreateService();
        var token = service.Protect(13, 4, 7, 9);
        service.TryRead(token, 4, 7, 9, out var value).Should().BeTrue();
        value.Should().Be(new ReservedProducerId(13, 4, 7, 9));
    }

    [Theory]
    [InlineData(5, 7, 9)]
    [InlineData(4, 8, 9)]
    [InlineData(4, 7, 10)]
    public void Reservation_cannot_be_submitted_by_another_tenant_user_or_intermediary(long client, long user, long intermediary)
    {
        var service = CreateService();
        var token = service.Protect(13, 4, 7, 9);
        service.TryRead(token, client, user, intermediary, out var value).Should().BeFalse();
        value.Should().BeNull();
    }

    [Fact]
    public void Forged_or_altered_reservations_are_rejected()
    {
        var service = CreateService();
        var token = service.Protect(13, 4, 7, 9);
        service.TryRead("13", 4, 7, 9, out _).Should().BeFalse();
        service.TryRead(token[..10] + "corrupted" + token[10..], 4, 7, 9, out _).Should().BeFalse();
    }
}
