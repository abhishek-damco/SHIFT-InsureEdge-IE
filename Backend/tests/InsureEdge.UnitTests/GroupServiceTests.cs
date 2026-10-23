// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Tests for GroupService: group code generation, validation (VR-001..VR-004), create, update.
using FluentAssertions;
using InsureEdge.Application.DTOs.Group;
using InsureEdge.Application.Interfaces;
using InsureEdge.Application.Services;
using InsureEdge.Domain.Entities;
using InsureEdge.Domain.Enums;
using Moq;
using Xunit;

namespace InsureEdge.UnitTests;

public class GroupServiceTests
{
    private readonly Mock<IGroupRepository> _repo = new();
    private readonly Mock<ICurrentTenantService> _tenant = new();
    private readonly GroupService _svc;

    public GroupServiceTests()
    {
        _tenant.Setup(t => t.ClientId).Returns(1);
        _tenant.Setup(t => t.UserId).Returns(100);
        _svc = new GroupService(_repo.Object, _tenant.Object);
    }

    [Fact]
    public async Task GetNextGroupCode_ReturnsZeroPaddedFourDigitPreview()
    {
        // BR-001: seq=5 → "0005"
        _repo.Setup(r => r.GetNextGroupSequenceAsync(1)).ReturnsAsync(5);
        var code = await _svc.GetNextGroupCodeAsync();

        code.Should().Be("0005");
    }

    [Fact]
    public async Task GetNextGroupCode_SequenceOf1000_GivesCode1000()
    {
        _repo.Setup(r => r.GetNextGroupSequenceAsync(1)).ReturnsAsync(1000);
        var code = await _svc.GetNextGroupCodeAsync();

        code.Should().Be("1000");
    }

    [Fact]
    public async Task CreateGroup_ReturnsRepositoryAssignedCode()
    {
        _repo.Setup(r => r.CreateAsync(It.IsAny<Group>(), It.IsAny<List<long>>(), It.IsAny<List<ScreenPermissionSaveDto>>()))
             .ReturnsAsync((Group g, List<long> _, List<ScreenPermissionSaveDto> _) =>
             {
                 g.AssignGeneratedCode("0005");
                 g.Id = 99;
                 return g;
             });

        var req = new CreateGroupRequest("Test Group", 100, "test@example.com", "desc", false, false,
            new List<long>(), new List<ScreenPermissionSaveDto>());
        var group = await _svc.CreateGroupAsync(req);

        _repo.Verify(r => r.CreateAsync(
            It.IsAny<Group>(), It.IsAny<List<long>>(), It.IsAny<List<ScreenPermissionSaveDto>>()),
            Times.Once);
        group.Id.Should().Be(99);
        group.GroupCode.Should().Be("0005");
    }

    [Fact]
    public void UpdateGroupInfo_DoesNotChangeExistingGroupCode()
    {
        var group = Group.Create("0005", "Original", null, 1, null, false, 1, 100);

        group.UpdateInfo("Updated", "updated@example.com", 2, "Changed", GroupStatus.Inactive, 101);

        group.GroupCode.Should().Be("0005");
    }

    [Fact]
    public async Task CreateGroup_MissingName_ThrowsValidationException()
    {
        var req = new CreateGroupRequest("", 1, null, null, false, false, [], []);
        var act = async () => await _svc.CreateGroupAsync(req);
        await act.Should().ThrowAsync<ValidationException>()
            .Where(e => e.Errors.Contains("Group Name is required."));
    }

    [Fact]
    public async Task CreateGroup_NameTooLong_ThrowsValidationException()
    {
        var req = new CreateGroupRequest(new string('X', 201), 1, null, null, false, false, [], []);
        var act = async () => await _svc.CreateGroupAsync(req);
        await act.Should().ThrowAsync<ValidationException>()
            .Where(e => e.Errors.Any(e2 => e2.Contains("200")));
    }

    [Fact]
    public async Task CreateGroup_MissingLeader_ThrowsValidationException()
    {
        var req = new CreateGroupRequest("Valid Name", 0, null, null, false, false, [], []);
        var act = async () => await _svc.CreateGroupAsync(req);
        await act.Should().ThrowAsync<ValidationException>()
            .Where(e => e.Errors.Contains("Group Leader is required."));
    }

    [Fact]
    public async Task CreateGroup_InvalidEmail_ThrowsValidationException()
    {
        var req = new CreateGroupRequest("Valid Name", 1, "not-an-email", null, false, false, [], []);
        var act = async () => await _svc.CreateGroupAsync(req);
        await act.Should().ThrowAsync<ValidationException>()
            .Where(e => e.Errors.Any(e2 => e2.Contains("email")));
    }

    [Fact]
    public async Task CreateGroup_DescTooLong_ThrowsValidationException()
    {
        var req = new CreateGroupRequest("Valid Name", 1, null, new string('D', 501), false, false, [], []);
        var act = async () => await _svc.CreateGroupAsync(req);
        await act.Should().ThrowAsync<ValidationException>()
            .Where(e => e.Errors.Any(e2 => e2.Contains("500")));
    }

    [Fact]
    public async Task UpdateGroupInfo_GroupNotFound_ThrowsKeyNotFoundException()
    {
        _repo.Setup(r => r.ExistsAsync(999, 1)).ReturnsAsync(false);
        var req = new UpdateGroupInfoRequest("Name", 1, null, null, "Active");
        var act = async () => await _svc.UpdateGroupInfoAsync(999, req);
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task SyncMembers_GroupNotFound_ThrowsKeyNotFoundException()
    {
        _repo.Setup(r => r.ExistsAsync(999, 1)).ReturnsAsync(false);
        var act = async () => await _svc.SyncMembersAsync(999, new List<long> { 1, 2 });
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }
}
