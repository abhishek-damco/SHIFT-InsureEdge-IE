// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Claim document attachment (Step 4).
// BR-CLM-011: binary content NOT returned in list queries — only in single-record fetch.
// Accepted formats: doc, xls, png, jpeg (max 25 MB per PRD Section 14).
namespace InsureEdge.Domain.Entities;

public class ClaimDocument
{
    public long Id { get; set; }
    public long ClaimId { get; set; }
    public long ClientId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public long? FileSize { get; set; }
    public byte[]? DocumentFile { get; set; }   // not mapped in list queries
    public long? NotifyTo { get; set; }
    public string? Comment { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public Claim? Claim { get; set; }
}


