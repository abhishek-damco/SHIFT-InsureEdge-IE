namespace InsureEdge.Domain.Entities;

public class ClaimTaskDocument
{
    public long Id { get; set; }
    public long ClaimTaskId { get; set; }
    public long ClientId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public long? FileSize { get; set; }
    public byte[]? FileContent { get; set; }
    public long? CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; } = DateTimeOffset.UtcNow;

    public ClaimTask? ClaimTask { get; set; }
}
