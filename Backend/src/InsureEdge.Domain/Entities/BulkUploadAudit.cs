// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Bulk Upload audit/history row — one per uploaded Excel file. Tracks progress
// (processed/total records) and final status so the "Previously Uploaded Files"
// UI table can render history, and stores an in-memory-built error CSV for
// failed rows (served back via GET /api/bulk-upload/{id}/error-report).
namespace InsureEdge.Domain.Entities;

public class BulkUploadAudit
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public string Module { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public int TotalRecords { get; set; }
    public int ProcessedRecords { get; set; }
    public string Status { get; set; } = "Processing"; // Processing | Completed | Failed | CompletedWithErrors
    public byte[]? ErrorFile { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedOn { get; set; }
}
