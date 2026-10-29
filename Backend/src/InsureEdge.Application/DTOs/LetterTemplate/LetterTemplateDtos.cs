namespace InsureEdge.Application.DTOs.LetterTemplate;

public record LetterTemplateListItemDto(
    long Id,
    string TemplateCode,
    string TemplateName,
    string TemplateCategory,
    string LineOfBusiness,
    string VersionNo,
    string EffectiveDateFrom,
    string EffectiveDateTo
);

public record NextTemplateCodeDto(string Code);

public record CreateDocumentDto(
    string? DocumentName,
    string? DocumentFile,
    string? DocumentContent,
    string? Version,
    string? EffectiveStartDate,
    string? EffectiveEndDate
);

public record CreateTemplateRequestDto(
    string TemplateName,
    bool Active,
    string? TemplateCategory,
    string? SubjectLine,
    string? Description,
    string? LineOfBusiness,
    string? InsuranceType,
    List<string> States,
    List<CreateDocumentDto> Documents
);

public record LetterTemplateDocumentDetailDto(
    long Id,
    string? DocumentName,
    string? DocumentContent,
    string? Version,
    string? EffectiveStartDate,
    string? EffectiveEndDate
);

public record LetterTemplateDetailDto(
    long Id,
    string TemplateCode,
    bool Active,
    string CurrentVersion,
    string TemplateName,
    string? TemplateCategory,
    string? LineOfBusiness,
    string? InsuranceType,
    string? SubjectLine,
    string? Description,
    List<string> States,
    List<LetterTemplateDocumentDetailDto> Documents
);

public record UpdateTemplateRequestDto(
    string TemplateName,
    bool Active,
    string? TemplateCategory,
    string? SubjectLine,
    string? Description,
    List<string> States,
    List<long> KeepDocumentIds,
    List<CreateDocumentDto> NewDocuments
);
