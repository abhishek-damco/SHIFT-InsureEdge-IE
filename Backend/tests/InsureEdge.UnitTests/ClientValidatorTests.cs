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

    [Theory]
    [InlineData("5551234567", "5551234567", true)]
    [InlineData("(555) 123-4567", "5551234567", true)]
    [InlineData("+1 (555) 123-4567", "5551234567", true)]
    [InlineData("555123456", "555123456", false)]
    [InlineData("+12 555 123 4567", "125551234567", false)]
    public void Phone_normalization_supports_legacy_plus_one_without_accepting_other_lengths(
        string input, string normalized, bool valid)
    {
        ClientValidator.NormalizePhone(input).Should().Be(normalized);
        ClientValidator.IsValidPhone(input).Should().Be(valid);
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

    [Fact]
    public void Contact_rejects_duplicate_primary_and_alternative_phone_after_normalization()
    {
        var contact = new SaveContactRequest("Alex Mercer", null, "Admin", "alex@example.com",
            "+1 (555) 123-4567", "+1", null, "555-123-4567", "CA +1");

        ClientValidator.ValidateContact(contact)
            .Should().Be(UserValidator.TelephoneSameAsAlt);
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

    [Fact]
    public void Year_business_started_is_optional_and_accepts_only_realistic_four_digit_years()
    {
        ClientValidator.ValidateInfo(ValidInfo() with { YearBusinessStarted = null }).Should().BeNull();
        ClientValidator.ValidateInfo(ValidInfo() with { YearBusinessStarted = "1993" }).Should().BeNull();
        ClientValidator.ValidateInfo(ValidInfo() with { YearBusinessStarted = "1599" })
            .Should().Be("Provide valid Year Business Started to continue");
        ClientValidator.ValidateInfo(ValidInfo() with { YearBusinessStarted = (DateTime.UtcNow.Year + 1).ToString() })
            .Should().Be("Provide valid Year Business Started to continue");
    }

    [Fact]
    public void Business_description_is_optional_and_enforces_five_to_one_thousand_trimmed_characters()
    {
        ClientValidator.ValidateBusinessDescription(null).Should().BeNull();
        ClientValidator.ValidateBusinessDescription("   ").Should().BeNull();
        ClientValidator.ValidateBusinessDescription("four").Should().Be(ClientValidator.BusinessDescriptionLengthError);
        ClientValidator.ValidateBusinessDescription("five!").Should().BeNull();
        ClientValidator.ValidateBusinessDescription(new string('a', 1000)).Should().BeNull();
        ClientValidator.ValidateBusinessDescription(new string('a', 1001)).Should().Be(ClientValidator.BusinessDescriptionLengthError);
    }

    [Fact]
    public void New_company_requires_logo_primary_fields_addresses_and_contact()
    {
        var blank = new SaveCompanyRequest(null, "", "United States", null, null, null, null, null, null,
            null, null, null, "Active", null, null, null, null, null, null);
        ClientValidator.ValidateCompany(blank).Should().Be("Provide Company Name to continue");

        var noLogo = ValidCompany() with { LogoBase64 = null, LogoContentType = null };
        ClientValidator.ValidateCompany(noLogo).Should().Be("Provide Company Logo to continue");
    }

    [Fact]
    public void Valid_company_request_passes_server_validation()
    {
        ClientValidator.ValidateCompany(ValidCompany()).Should().BeNull();
    }

    private static SaveCompanyRequest ValidCompany()
    {
        var address = new SaveAddressRequest("Legal", "1 Main St", null, "United States", "California",
            "Los Angeles", "Los Angeles", "90001", null, null, true);
        var contact = new SaveContactRequest("Alex Mercer", null, "Admin", "alex@example.com",
            "5551234567", "+1", null, null, "+1");
        return new SaveCompanyRequest(null, "Acme Insurance", "United States", "California", "12345",
            null, null, null, null, "23-4567890", null, null, "Active",
            Convert.ToBase64String(new byte[10 * 1024]), "image/png", "logo.png",
            address, address with { AddressType = "Mailing" }, contact, []);
    }

    private static SaveClientInfoRequest ValidInfo() => new(
        "Hudson Bailey Insurance", "MGA", "12345", null, "United States", "California", null,
        "23-4567890", null, null, null, null, "Hudson Bailey Insurance - Primary tenant",
        "admin@hudsonbailey.com", "5551234567", "+1", null, "https://hudsonbailey.com",
        "01-01-2024", "Active", null, null, null);
}
