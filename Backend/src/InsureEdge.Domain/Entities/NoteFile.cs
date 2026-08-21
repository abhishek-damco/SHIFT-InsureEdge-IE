// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Ported from OutSystems "NoteFile" entity — reference document attached to a Note.
namespace InsureEdge.Domain.Entities;

public class NoteFile
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long NotesId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? FileType { get; set; }
    public byte[] FileData { get; set; } = Array.Empty<byte>();
    public string Module { get; set; } = "Policy";

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public Note? Note { get; set; }
}
