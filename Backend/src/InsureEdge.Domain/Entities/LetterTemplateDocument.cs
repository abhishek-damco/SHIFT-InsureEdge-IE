namespace InsureEdge.Domain.Entities;

public class LetterTemplateDocument
{
    public long Id { get; set; }
    public long TemplateId { get; set; }
    public string? DocumentName { get; set; }
    public string? DocumentFile { get; set; }
    public string? DocumentContent { get; set; }
    public string? Version { get; set; }
    public DateOnly? EffectiveStartDate { get; set; }
    public DateOnly? EffectiveEndDate { get; set; }
    public long? CreatedBy { get; set; }
    public DateTimeOffset? CreatedOn { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedOn { get; set; }

    public LetterTemplate? Template { get; set; }
}
