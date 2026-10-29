using FluentAssertions;
using InsureEdge.Application.Validation;
using Xunit;

namespace InsureEdge.UnitTests;

// QA UGM-08/12/13/14: User Group Information rules.
public class GroupValidatorTests
{
    [Fact]
    public void Valid_group_passes()
    {
        GroupValidator.Validate("Claims Team - East & West/2.0 O'Neil", 1, "claims@example.com", "Handles claims")
            .Should().BeEmpty();
    }

    [Fact]
    public void Optional_fields_may_be_empty()
    {
        GroupValidator.Validate("Underwriting", 1, null, null).Should().BeEmpty();
        GroupValidator.Validate("Underwriting", 1, "", "  ").Should().BeEmpty();
    }

    [Fact]
    public void Missing_name_and_leader_use_standard_messages()
    {
        GroupValidator.Validate("  ", 0, null, null).Should().BeEquivalentTo(
            GroupValidator.GroupNameRequired, GroupValidator.GroupLeaderRequired);
    }

    [Fact]
    public void Group_name_is_limited_to_75_characters()
    {
        GroupValidator.Validate(new string('A', 75), 1, null, null).Should().BeEmpty();
        GroupValidator.Validate(new string('A', 76), 1, null, null)
            .Should().ContainSingle().Which.Should().Be(GroupValidator.GroupNameInvalid);
    }

    [Theory]
    [InlineData("Group_1")]
    [InlineData("Group@HQ")]
    [InlineData("Group#1")]
    [InlineData("Group (A)")]
    public void Group_name_rejects_disallowed_characters(string name)
    {
        GroupValidator.Validate(name, 1, null, null)
            .Should().ContainSingle().Which.Should().Be(GroupValidator.GroupNameInvalid);
    }

    [Theory]
    [InlineData("not-an-email")]
    [InlineData("a@b")]
    public void Group_email_must_be_valid_format(string email)
    {
        GroupValidator.Validate("Group", 1, email, null)
            .Should().ContainSingle().Which.Should().Be(GroupValidator.GroupEmailInvalid);
    }

    [Fact]
    public void Group_email_is_limited_to_50_characters()
    {
        var fifty = new string('a', 38) + "@example.com";
        GroupValidator.Validate("Group", 1, fifty, null).Should().BeEmpty();
        GroupValidator.Validate("Group", 1, "a" + fifty, null)
            .Should().ContainSingle().Which.Should().Be(GroupValidator.GroupEmailInvalid);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(4)]
    [InlineData(1001)]
    public void Group_description_must_be_5_to_1000_characters(int length)
    {
        GroupValidator.Validate("Group", 1, null, new string('d', length))
            .Should().ContainSingle().Which.Should().Be(GroupValidator.GroupDescLength);
    }

    [Theory]
    [InlineData(5)]
    [InlineData(1000)]
    public void Group_description_accepts_boundaries(int length)
    {
        GroupValidator.Validate("Group", 1, null, new string('d', length)).Should().BeEmpty();
    }
}
