namespace InsureEdge.Application.Validation;

// QA D1-29/30: producer licenses (P&C Combined, PL, CL) are optional and alphanumeric —
// letters and digits only, at most 10 characters. Mirrors Frontend ProducerLicenseInput.
public static class ProducerLicenseValidator
{
    public const int MaxLength = 10;
    public const string ErrorMessage = "Provide valid License Number to continue";

    // The requirement type (Combined / Separate) no longer makes any license mandatory;
    // it is kept in the signature so existing callers don't change.
    public static string? Validate(
        string? licenseRequirement,
        string? plLicense,
        string? clLicense,
        string? combinedLicense)
    {
        var supplied = new[] { plLicense, clLicense, combinedLicense }
            .Where(value => !string.IsNullOrWhiteSpace(value));
        return supplied.All(IsValid) ? null : ErrorMessage;
    }

    public static bool IsValid(string? value) =>
        value is { Length: > 0 and <= MaxLength } && value.All(char.IsAsciiLetterOrDigit);
}
