namespace InsureEdge.Application.Validation;

public static class ProducerLicenseValidator
{
    public const string ErrorMessage = "License Number must be exactly 10 digits.";

    public static string? Validate(
        string? licenseRequirement,
        string? plLicense,
        string? clLicense,
        string? combinedLicense)
    {
        var suppliedLicenses = new[] { plLicense, clLicense, combinedLicense }
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .ToArray();

        if (suppliedLicenses.Any(value => !IsValid(value))) return ErrorMessage;

        if (licenseRequirement?.Equals("Combined", StringComparison.OrdinalIgnoreCase) == true)
            return IsValid(combinedLicense) ? null : ErrorMessage;

        if (licenseRequirement?.Equals("Separate", StringComparison.OrdinalIgnoreCase) == true)
            return IsValid(plLicense) && IsValid(clLicense) ? null : ErrorMessage;

        // Preserve compatibility with callers that omit the requirement type, but never
        // allow an empty set of licenses to satisfy validation.
        return suppliedLicenses.Length > 0 ? null : ErrorMessage;
    }

    public static bool IsValid(string? value) =>
        value is { Length: 10 } && value.All(char.IsAsciiDigit);
}
