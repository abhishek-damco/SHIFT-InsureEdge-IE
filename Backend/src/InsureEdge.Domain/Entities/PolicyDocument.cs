// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Document/attachment stored against a policy (quote wizard uploads, endorsement letters, etc).
namespace InsureEdge.Domain.Entities;

public class PolicyDocument
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long PolicyId { get; set; }
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

    public Policy? Policy { get; set; }
}
