// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Ported from OutSystems "Notes2" entity — free-form notes attachable to a Policy
// (and/or Account), shown on the Policy Summary "Notes" tab.
namespace InsureEdge.Domain.Entities;

public class Note
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public string NotesText { get; set; } = string.Empty; // rich-text HTML
    public string? NoteDisplayText { get; set; }           // plain-text preview
    public string AccessType { get; set; } = "Internal";   // Diary | Internal | External
    public long? AccountId { get; set; }
    public long? PolicyId { get; set; }
    public string Module { get; set; } = "Policy";
    public int TotalNumberOfAttachments { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
    public long? CreatedFor { get; set; }

    public Policy? Policy { get; set; }
    public Account? Account { get; set; }
    public ICollection<NoteFile> Files { get; set; } = new List<NoteFile>();
}
