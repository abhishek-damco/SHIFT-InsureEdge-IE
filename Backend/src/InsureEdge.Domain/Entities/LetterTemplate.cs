namespace InsureEdge.Domain.Entities;

public class LetterTemplate
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public string? TemplateCode { get; set; }
    public string? Status { get; set; }
    public string? CurrentVersion { get; set; }
    public string? TemplateName { get; set; }
    public string? TemplateCategory { get; set; }
    public string? InsuranceType { get; set; }
    public string? LineOfBusiness { get; set; }
    public string? SubjectLine { get; set; }
    public string? Description { get; set; }
    public DateTimeOffset? CreatedOn { get; set; }
    public long? CreatedBy { get; set; }
    public DateTimeOffset? UpdatedOn { get; set; }
    public long? UpdatedBy { get; set; }

    public ICollection<LetterTemplateDocument> Documents { get; set; } = [];
    public ICollection<LetterTemplateState> States { get; set; } = [];
}
