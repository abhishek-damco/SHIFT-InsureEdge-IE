namespace InsureEdge.Application.Validation;

// QA UM-14/15: address length limits and Telephone ≠ Alternative Telephone.
// Mirrors Frontend utils/fieldValidation.ts (ADDRESS_LINE_MAX, CITY_MAX, COUNTY_MAX, checkPhonesDiffer).
public static class UserValidator
{
    public const int AddressLineMaxLength = 500;
    public const int CityMaxLength = 50;
    public const int CountyMaxLength = 50;

    public const string AddressLine1Invalid = "Provide valid Address Line 1 to continue";
    public const string AddressLine2Invalid = "Provide valid Address Line 2 to continue";
    public const string CityInvalid = "Provide valid City to continue";
    public const string CountyInvalid = "Provide valid County to continue";
    public const string TelephoneSameAsAlt = "Telephone Number should not be same as Alternative Telephone Number";

    public static List<string> Validate(string? addressLine1, string? addressLine2, string? city, string? county,
        string? telephone, string? altTelephone)
    {
        var errors = new List<string>();

        if ((addressLine1?.Length ?? 0) > AddressLineMaxLength) errors.Add(AddressLine1Invalid);
        if ((addressLine2?.Length ?? 0) > AddressLineMaxLength) errors.Add(AddressLine2Invalid);
        if ((city?.Length ?? 0) > CityMaxLength) errors.Add(CityInvalid);
        if ((county?.Length ?? 0) > CountyMaxLength) errors.Add(CountyInvalid);

        if (PhonesMatch(telephone, altTelephone)) errors.Add(TelephoneSameAsAlt);

        return errors;
    }

    // Compares national digits, so "(555) 123-4567", "5551234567" and "+1 555 123 4567" all match.
    public static bool PhonesMatch(string? a, string? b)
    {
        var x = NationalDigits(a);
        var y = NationalDigits(b);
        return x.Length > 0 && x == y;
    }

    private static string NationalDigits(string? phone)
    {
        var digits = new string((phone ?? string.Empty).Where(char.IsDigit).ToArray());
        return digits.Length == 11 && digits.StartsWith('1') ? digits[1..] : digits;
    }
}
