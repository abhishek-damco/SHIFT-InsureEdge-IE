using FluentAssertions;
using InsureEdge.Application.DTOs.Client;
using InsureEdge.Application.Validation;
using Xunit;

namespace InsureEdge.UnitTests;

public class ClientValidatorTests
{
    [Theory]
    [InlineData("12345")]
    [InlineData("12345-2323")]
    public void Us_zip_accepts_five_digits_or_zip_plus_four(string zip)
    {
        ClientValidator.IsValidZip(zip, "United States").Should().BeTrue();
    }

    [Theory]
    [InlineData("1234")]
    [InlineData("123456")]
    [InlineData("12345-23")]
    [InlineData("K1A 0B1")]
    public void Us_zip_rejects_other_formats(string zip)
    {
        ClientValidator.IsValidZip(zip, "United States").Should().BeFalse();
    }

    [Theory]
    [InlineData("K1A 0B1")]
    [InlineData("M5V 3L9")]
    [InlineData("T2P 1W1")]
    public void Canadian_postal_code_accepts_A1A_1A1(string zip)
    {
        ClientValidator.IsValidZip(zip, "Canada").Should().BeTrue();
    }

    [Theory]
    [InlineData("k1a 0b1")]   // lowercase
    [InlineData("K1A0B1")]    // missing space
    [InlineData("D1A 0B1")]   // D never used
    [InlineData("K1O 0B1")]   // O never used
    [InlineData("W1A 0B1")]   // W never first
    [InlineData("Z1A 0B1")]   // Z never first
    [InlineData("12345")]
    public void Canadian_postal_code_rejects_invalid_values(string zip)
    {
        ClientValidator.IsValidZip(zip, "Canada").Should().BeFalse();
    }

    [Theory]
    [InlineData("23-4567890")]
    [InlineData("234567890")]
    public void Federal_tax_id_accepts_nine_digits(string id)
    {
        ClientValidator.IsValidFederalTaxId(id).Should().BeTrue();
    }

    [Theory]
    [InlineData("23-456789")]
    [InlineData("234-567890")]
    [InlineData("AB-4567890")]
    public void Federal_tax_id_rejects_invalid_values(string id)
    {
        ClientValidator.IsValidFederalTaxId(id).Should().BeFalse();
    }

    [Theory]
    [InlineData("Alex Mercer")]
    [InlineData("O'Brien-Núñez Jr.")]
    [InlineData("José ‘Pepe’ Ruiz")]
    public void Name_accepts_allowed_characters(string name)
    {
        ClientValidator.IsValidName(name).Should().BeTrue();
    }

    [Theory]
    [InlineData(" Alex")]
    [InlineData("Alex@Mercer")]
    [InlineData("Alex_Mercer")]
    public void Name_rejects_leading_space_and_disallowed_characters(string name)
    {
        ClientValidator.IsValidName(name).Should().BeFalse();
    }

    [Fact]
    public void Name_rejects_more_than_fifty_characters()
    {
        ClientValidator.IsValidName(new string('a', 51)).Should().BeFalse();
    }

    [Theory]
    [InlineData(null, true)]
    [InlineData(0, true)]
    [InlineData(999999, true)]
    [InlineData(1000000, false)]
    [InlineData(-1, false)]
    public void Extension_allows_up_to_six_digits(int? ext, bool expected)
    {
        ClientValidator.IsValidExtension(ext).Should().Be(expected);
    }

    [Fact]
    public void Address_messages_use_postal_code_for_canada()
    {
        var req = new SaveAddressRequest("Legal", "1 Main St", null, "Canada", "Ontario", "Toronto", null, "12345", null, null, true);
        ClientValidator.ValidateAddress(req).Should().Be("Provide valid Postal Code to continue");
    }

    [Fact]
    public void Address_requires_line1_first()
    {
        var req = new SaveAddressRequest("Legal", null, null, null, null, null, null, null, null, null, true);
        ClientValidator.ValidateAddress(req).Should().Be("Provide Address Line 1 to continue");
    }

    [Fact]
    public void Contact_requires_name_title_and_email()
    {
        var blank = new SaveContactRequest(null, null, null, null, null, null, null, null, null);
        ClientValidator.ValidateContact(blank).Should().Be("Provide Name to continue");

        var noTitle = blank with { Name = "Alex Mercer" };
        ClientValidator.ValidateContact(noTitle).Should().Be("Provide Title to continue");

        var noEmail = noTitle with { Title = "Admin" };
        ClientValidator.ValidateContact(noEmail).Should().Be("Provide Email ID to continue");

        var valid = noEmail with { EmailId = "alex@example.com", TelephoneNumber = "5551234567" };
        ClientValidator.ValidateContact(valid).Should().BeNull();
    }

    [Fact]
    public void Contacts_validates_secondary_contacts_too()
    {
        var primary = new SaveContactRequest("Alex Mercer", null, "Admin", "alex@example.com", null, null, null, null, null);
        var badSecondary = primary with { EmailId = "not-an-email" };
        ClientValidator.ValidateContacts(new SaveContactsRequest(primary, [badSecondary]))
            .Should().Be("Provide valid Email ID to continue");
    }

    [Theory]
    [InlineData("Acme")]
    [InlineData("")]
    public void Company_name_uses_custom_length_message(string name)
    {
        var req = ValidInfo() with { CompanyName = name };
        ClientValidator.ValidateInfo(req).Should().Be(name.Length == 0
            ? "Provide Company Name to continue"
            : "Company Name should be in between 5 to 75 characters");
    }

    [Fact]
    public void Client_info_seed_values_are_valid()
    {
        ClientValidator.ValidateInfo(ValidInfo()).Should().BeNull();
    }

    private static SaveClientInfoRequest ValidInfo() => new(
        "Hudson Bailey Insurance", "MGA", "12345", null, "United States", "California", null,
        "23-4567890", null, null, null, null, "Hudson Bailey Insurance - Primary tenant",
        "admin@hudsonbailey.com", "5551234567", "+1", null, "https://hudsonbailey.com",
        "01-01-2024", "Active", null, null, null);
}
