using System.Text.RegularExpressions;

namespace InsureEdge.Application.Validation;

// QA UGM-08/12/13/14: User Group Information rules. Mirrors Frontend components/GroupForm/groupValidation.ts.
public static class GroupValidator
{
    public const int GroupNameMaxLength = 75;
    public const int GroupEmailMaxLength = 50;
    public const int GroupDescMinLength = 5;
    public const int GroupDescMaxLength = 1000;

    public const string GroupNameRequired = "Provide Group Name to continue";
    public const string GroupNameInvalid = "Provide valid Group Name to continue";
    public const string GroupLeaderRequired = "Provide Group Leader to continue";
    public const string GroupEmailInvalid = "Provide valid Group Email ID to continue";
    public const string GroupDescLength = "Group Description should be in between 5 to 1000 characters";

    // Letters, digits, space and - & . ' /
    private static readonly Regex GroupNamePattern = new(@"^[A-Za-z0-9 \-&.'/]+$", RegexOptions.Compiled);
    private static readonly Regex EmailPattern = new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);

    public static List<string> Validate(string? groupName, long groupLeader, string? groupEmailId, string? groupDesc)
    {
        var errors = new List<string>();

        var name = groupName?.Trim() ?? string.Empty;
        if (name.Length == 0) errors.Add(GroupNameRequired);
        else if (name.Length > GroupNameMaxLength || !GroupNamePattern.IsMatch(name)) errors.Add(GroupNameInvalid);

        if (groupLeader <= 0) errors.Add(GroupLeaderRequired);

        var email = groupEmailId?.Trim() ?? string.Empty;
        if (email.Length > 0 && (email.Length > GroupEmailMaxLength || !EmailPattern.IsMatch(email)))
            errors.Add(GroupEmailInvalid);

        var desc = groupDesc?.Trim() ?? string.Empty;
        if (desc.Length > 0 && (desc.Length < GroupDescMinLength || desc.Length > GroupDescMaxLength))
            errors.Add(GroupDescLength);

        return errors;
    }
}
