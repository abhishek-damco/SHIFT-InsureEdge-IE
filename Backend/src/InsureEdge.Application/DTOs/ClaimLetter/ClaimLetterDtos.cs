namespace InsureEdge.Application.DTOs.ClaimLetter;

public record ClaimLetterListItemDto(
    long Id,
    string LetterCode,
    string? LetterType,
    string? LetterDate,
    string? SendDate,
    string? RecipientName,
    string? RecipientRole,
    string? RecipientEmail,
    string? Priority,
    string Status,
    string? CreatedByName,
    string? CreatedOn
);

public record ClaimLetterDetailDto(
    long Id,
    string LetterCode,
    string? LetterType,
    string? LetterDate,
    string? Subject,
    string? LetterBody,
    string? RecipientRole,
    string? RecipientName,
    string? DeliveryMethod,
    string? RecipientEmail,
    string? RecipientAddress,
    string? Priority,
    bool FollowUp,
    string Status,
    string? SendDate,
    string? CreatedByName,
    string? CreatedOn,
    string? UpdatedByName,
    string? UpdatedOn
);

public record SaveClaimLetterRequest(
    long? Id,
    long ClaimId,
    string? LetterType,
    string? LetterDate,
    string? Subject,
    string? LetterBody,
    string? RecipientRole,
    string? RecipientName,
    string? DeliveryMethod,
    string? RecipientEmail,
    string? RecipientAddress,
    string? Priority,
    bool FollowUp
);
