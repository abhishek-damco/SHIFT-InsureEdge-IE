using FluentAssertions;
using InsureEdge.Application.Validation;
using Xunit;

namespace InsureEdge.UnitTests;

public class ProducerLicenseValidatorTests
{
    [Theory]
    [InlineData("1234567890")]
    [InlineData("0000000001")]
    public void Combined_license_accepts_exactly_ten_digits(string license)
    {
        ProducerLicenseValidator.Validate("Combined", null, null, license).Should().BeNull();
    }

    [Theory]
    [InlineData("123456789")]
    [InlineData("12345678901")]
    [InlineData("ABC1234567")]
    [InlineData("12345-7890")]
    [InlineData("12345@67890")]
    [InlineData("")]
    [InlineData("123456789012345")]
    [InlineData(null)]
    public void Combined_license_rejects_invalid_values(string? license)
    {
        ProducerLicenseValidator.Validate("Combined", null, null, license)
            .Should().Be(ProducerLicenseValidator.ErrorMessage);
    }

    [Fact]
    public void Separate_licenses_require_both_values_to_be_exactly_ten_digits()
    {
        ProducerLicenseValidator.Validate("Separate", "1234567890", "0987654321", null)
            .Should().BeNull();

        ProducerLicenseValidator.Validate("Separate", "123456789", "0987654321", null)
            .Should().Be(ProducerLicenseValidator.ErrorMessage);
    }

    [Fact]
    public void Missing_requirement_does_not_allow_an_empty_license_set()
    {
        ProducerLicenseValidator.Validate(null, null, null, null)
            .Should().Be(ProducerLicenseValidator.ErrorMessage);
    }

    [Fact]
    public void Invalid_inactive_license_is_not_silently_accepted_or_truncated()
    {
        ProducerLicenseValidator.Validate("Combined", "12345678901", null, "1234567890")
            .Should().Be(ProducerLicenseValidator.ErrorMessage);
    }
}
