namespace InsureEdge.Application.DTOs.Claim;

public record WorksheetReserveDto(
    long? Id,
    string? Coverage,
    decimal? CoverageLimit,
    string? CauseOfLossDescription,
    string? CauseOfLossCode,
    decimal? CauseOfLossLimit,
    string? LiabilityClaimDescription,
    string? LiabilityClaimCode,
    decimal? LiabilityLimit,
    decimal? SupersedingLimit,
    decimal ReserveAmount
);

public record WorksheetPaymentDto(
    long? Id,
    string? Coverage,
    string? CauseOfLossDescription,
    string? PayeeType,
    string? PayeeName,
    string? LiabilityClaim,
    decimal PaymentAmount
);

public record WorksheetDto(
    long Id,
    string WsNumber,
    string Status,
    bool CloseManually,
    string? Comments,
    decimal Incurred,
    decimal Reserve,
    decimal PersonalLiabilities,
    decimal Payment,
    string? ApprovedByName,
    string? EscalatedToName,
    string CreatedByName,
    string CreatedOn,
    string? UpdatedByName,
    string? UpdatedOn,
    List<WorksheetReserveDto> Reserves,
    List<WorksheetPaymentDto> Payments
);

public record WorksheetMatrixDto(List<WorksheetDto> Worksheets);

public record SaveWorksheetRequest(
    long? Id,
    bool CloseManually,
    string? Comments,
    List<WorksheetReserveDto> Reserves,
    List<WorksheetPaymentDto> Payments
);

public record EscalateWorksheetRequest(long EscalateTo);
