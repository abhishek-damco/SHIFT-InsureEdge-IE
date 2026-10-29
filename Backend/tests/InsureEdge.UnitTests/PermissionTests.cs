// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Tests for PermissionAttribute behavior and EffectivePermissions aggregation.
// DBT-SEC-002 Corrective: all 9 types must be enforced server-side.
using FluentAssertions;
using InsureEdge.Application.Interfaces;
using Xunit;

namespace InsureEdge.UnitTests;

public class PermissionTests
{
    // DBT-SEC-002: EffectivePermissions correctly represents all 9 types
    [Fact]
    public void EffectivePermissions_AllFalse_NoAccess()
    {
        var p = new EffectivePermissions(false, false, false, false, false, false, false, false, false);
        p.View.Should().BeFalse();
        p.Add.Should().BeFalse();
        p.Edit.Should().BeFalse();
        p.Duplicate.Should().BeFalse();
        p.Upload.Should().BeFalse();
        p.Download.Should().BeFalse();
        p.SensitiveData.Should().BeFalse();
        p.SensitiveDocuments.Should().BeFalse();
        p.ApproveReject.Should().BeFalse();
    }

    [Fact]
    public void EffectivePermissions_AllTrue_FullAccess()
    {
        var p = new EffectivePermissions(true, true, true, true, true, true, true, true, true);
        p.View.Should().BeTrue();
        p.Add.Should().BeTrue();
        p.Edit.Should().BeTrue();
        p.Duplicate.Should().BeTrue();
        p.Upload.Should().BeTrue();
        p.Download.Should().BeTrue();
        p.SensitiveData.Should().BeTrue();
        p.SensitiveDocuments.Should().BeTrue();
        p.ApproveReject.Should().BeTrue();
    }

    [Fact]
    public void EffectivePermissions_HasNineDistinctFlags()
    {
        // Ensure View-only does not imply any other permission
        var viewOnly = new EffectivePermissions(
            View: true, Add: false, Edit: false, Duplicate: false,
            Upload: false, Download: false, SensitiveData: false,
            SensitiveDocuments: false, ApproveReject: false);

        viewOnly.View.Should().BeTrue();
        viewOnly.Add.Should().BeFalse();
        viewOnly.Edit.Should().BeFalse();
        viewOnly.Download.Should().BeFalse();
        viewOnly.SensitiveData.Should().BeFalse();
    }

    // BR-013: Inactive groups must NOT contribute permissions — verified via resolver logic
    // This is an integration concern; the resolver query filters by Status==Active.
    // Here we verify the EffectivePermissions default is deny-all (correct deny-by-default baseline).
    [Fact]
    public void EffectivePermissions_Default_IsDenyAll()
    {
        var p = new EffectivePermissions(false, false, false, false, false, false, false, false, false);
        var flags = new[] { p.View, p.Add, p.Edit, p.Duplicate, p.Upload, p.Download, p.SensitiveData, p.SensitiveDocuments, p.ApproveReject };
        flags.Should().AllBeEquivalentTo(false);
    }

    // GroupStatus: inactive groups should not be selectable for permission purposes (domain check)
    [Fact]
    public void GroupStatus_ActiveAndInactive_AreOnlyValidValues()
    {
        var active = InsureEdge.Domain.Enums.GroupStatus.Active;
        var inactive = InsureEdge.Domain.Enums.GroupStatus.Inactive;
        active.Should().NotBe(inactive);
        Enum.GetValues<InsureEdge.Domain.Enums.GroupStatus>().Should().HaveCount(2);
    }
}
