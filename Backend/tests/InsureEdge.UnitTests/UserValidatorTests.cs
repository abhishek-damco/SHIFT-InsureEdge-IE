using FluentAssertions;
using InsureEdge.Application.Validation;
using Xunit;

namespace InsureEdge.UnitTests;

// QA UM-14/15: address limits and Telephone ≠ Alternative Telephone.
public class UserValidatorTests
{
    [Fact]
    public void Valid_user_passes()
    {
        UserValidator.Validate("1 Main St", null, "Boston", "Suffolk", "(555) 123-4567", "(555) 765-4321")
            .Should().BeEmpty();
    }

    [Fact]
    public void Limits_are_inclusive()
    {
        UserValidator.Validate(new string('a', 500), new string('b', 500), new string('c', 50), new string('d', 50), null, null)
            .Should().BeEmpty();
    }

    [Fact]
    public void Over_limit_fields_are_rejected()
    {
        UserValidator.Validate(new string('a', 501), new string('b', 501), new string('c', 51), new string('d', 51), null, null)
            .Should().BeEquivalentTo(
                UserValidator.AddressLine1Invalid, UserValidator.AddressLine2Invalid,
                UserValidator.CityInvalid, UserValidator.CountyInvalid);
    }

    [Theory]
    [InlineData("(555) 123-4567", "5551234567")]
    [InlineData("5551234567", "+1 555 123 4567")]
    public void Same_phone_in_any_format_is_rejected(string tel, string alt)
    {
        UserValidator.Validate(null, null, null, null, tel, alt)
            .Should().ContainSingle().Which.Should().Be(UserValidator.TelephoneSameAsAlt);
    }

    [Fact]
    public void Blank_alternative_phone_is_allowed()
    {
        UserValidator.PhonesMatch("5551234567", null).Should().BeFalse();
        UserValidator.PhonesMatch(null, null).Should().BeFalse();
    }
}
