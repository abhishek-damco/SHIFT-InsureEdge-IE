using FluentAssertions;
using InsureEdge.Application.Validation;
using Xunit;

namespace InsureEdge.UnitTests;

// QA D1-29/30: licenses are optional and alphanumeric (letters + digits, max 10).
public class ProducerLicenseValidatorTests
{
    [Theory]
    [InlineData("1234567890")]
    [InlineData("ABC1234567")]
    [InlineData("a1")]
    [InlineData("LIC")]
    public void Combined_license_accepts_alphanumeric_up_to_ten_characters(string license)
    {
        ProducerLicenseValidator.Validate("Combined", null, null, license).Should().BeNull();
    }

    [Theory]
    [InlineData("12345678901")]       // 11 characters
    [InlineData("12345-7890")]        // hyphen
    [InlineData("12345@6789")]        // symbol
    [InlineData("ABC 123")]           // space
    public void Combined_license_rejects_invalid_values(string license)
    {
        ProducerLicenseValidator.Validate("Combined", null, null, license)
            .Should().Be(ProducerLicenseValidator.ErrorMessage);
    }

    [Theory]
    [InlineData("Combined")]
    [InlineData("Separate")]
    [InlineData(null)]
    public void Licenses_are_optional(string? requirement)
    {
        ProducerLicenseValidator.Validate(requirement, null, null, null).Should().BeNull();
        ProducerLicenseValidator.Validate(requirement, "", "  ", "").Should().BeNull();
    }

    [Fact]
    public void Separate_licenses_are_each_checked_when_supplied()
    {
        ProducerLicenseValidator.Validate("Separate", "PL12345", "CL98765", null).Should().BeNull();
        ProducerLicenseValidator.Validate("Separate", "PL12345", null, null).Should().BeNull();
        ProducerLicenseValidator.Validate("Separate", "PL-12345", "CL98765", null)
            .Should().Be(ProducerLicenseValidator.ErrorMessage);
    }

    [Fact]
    public void Invalid_inactive_license_is_not_silently_accepted_or_truncated()
    {
        ProducerLicenseValidator.Validate("Combined", "12345678901", null, "1234567890")
            .Should().Be(ProducerLicenseValidator.ErrorMessage);
    }
}
