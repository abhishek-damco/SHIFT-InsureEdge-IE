// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Quote wizard draft/JSON payload store. Id is an app-generated short numeric string
// (see SubmissionRepository), not a bigserial — matches prototype's usage pattern where
// server.js treats the row as a wizard-draft JSON blob rather than a normalized entity.
namespace InsureEdge.Domain.Entities;

public class Submission
{
    public string Id { get; set; } = string.Empty;
    public long ClientId { get; set; }
    public string Status { get; set; } = "Draft";
    public string Data { get; set; } = "{}"; // jsonb, stored/mapped as raw JSON text

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
}
