// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Document generated from quote wizard (Finalize Quote screen).
namespace InsureEdge.Domain.Entities;

public class QuoteDocument
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public string SubmissionId { get; set; } = string.Empty;
    public long? PolicyId { get; set; }
    public string? BlobPath { get; set; }
    public string? FileName { get; set; }
    public string? FileType { get; set; }
    public byte[]? BinaryFileTemp { get; set; }
    public long? ProductDocumentId { get; set; }
    public string? TransactionType { get; set; }
    public string? Version { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public Submission? Submission { get; set; }
    public Policy? Policy { get; set; }
}
