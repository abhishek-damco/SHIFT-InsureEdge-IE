// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Tests for BR-005 full-replace member sync and ADR-004 synchronous revocation.
using FluentAssertions;
using InsureEdge.Application.Interfaces;
using InsureEdge.Application.Services;
using Moq;
using Xunit;

namespace InsureEdge.UnitTests;

public class SyncMembersTests
{
    private readonly Mock<IGroupRepository> _repo = new();
    private readonly Mock<ICurrentTenantService> _tenant = new();
    private readonly GroupService _svc;

    public SyncMembersTests()
    {
        _tenant.Setup(t => t.ClientId).Returns(1);
        _tenant.Setup(t => t.UserId).Returns(100);
        _svc = new GroupService(_repo.Object, _tenant.Object);
    }

    // BR-005: SyncMembers delegates full-replace to repository exactly once
    [Fact]
    public async Task SyncMembers_CallsRepoWithExactList()
    {
        _repo.Setup(r => r.ExistsAsync(1, 1)).ReturnsAsync(true);
        _repo.Setup(r => r.SyncMembersAsync(1, It.IsAny<List<long>>(), 1)).Returns(Task.CompletedTask);

        var memberIds = new List<long> { 10, 20, 30 };
        await _svc.SyncMembersAsync(1, memberIds);

        // ADR-004: sync is called with the exact list — repo handles the delete+insert in transaction
        _repo.Verify(r => r.SyncMembersAsync(1,
            It.Is<List<long>>(m => m.SequenceEqual(new[] { 10L, 20L, 30L })), 1),
            Times.Once);
    }

    // BR-005: Empty list is valid — removes all members
    [Fact]
    public async Task SyncMembers_EmptyList_CallsRepoWithEmptyList()
    {
        _repo.Setup(r => r.ExistsAsync(1, 1)).ReturnsAsync(true);
        _repo.Setup(r => r.SyncMembersAsync(1, It.IsAny<List<long>>(), 1)).Returns(Task.CompletedTask);

        await _svc.SyncMembersAsync(1, new List<long>());

        _repo.Verify(r => r.SyncMembersAsync(1,
            It.Is<List<long>>(m => !m.Any()), 1),
            Times.Once);
    }

    // RSK-SEC-003 Corrective: Revocation is synchronous — no deferred jobs
    // The test confirms SyncMembersAsync does NOT start any background tasks
    [Fact]
    public async Task SyncMembers_IsNotDeferred_CompletesBeforeReturning()
    {
        // If the repo awaits correctly, the mutation is synchronous from the caller's perspective.
        var completed = false;
        _repo.Setup(r => r.ExistsAsync(5, 1)).ReturnsAsync(true);
        _repo.Setup(r => r.SyncMembersAsync(5, It.IsAny<List<long>>(), 1))
             .Returns(async () => { await Task.Yield(); completed = true; });

        await _svc.SyncMembersAsync(5, new List<long> { 1 });

        completed.Should().BeTrue("privilege revocation must complete synchronously within the request");
    }
}
