namespace InsureEdge.Domain.Entities;

public class LetterTemplateState
{
    public long Id { get; set; }
    public long TemplateId { get; set; }
    public string? State { get; set; }

    public LetterTemplate? Template { get; set; }
}
