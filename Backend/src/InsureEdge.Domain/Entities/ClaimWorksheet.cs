namespace InsureEdge.Domain.Entities;

public class ClaimWorksheet
{
    public long Id { get; set; }
    public long ClaimId { get; set; }
    public long ClientId { get; set; }
    public string WsNumber { get; set; } = string.Empty;
    public string Status { get; set; } = "Draft";
    public bool CloseManually { get; set; }
    public string? Comments { get; set; }
    public long? ApprovedBy { get; set; }
    public long? EscalatedTo { get; set; }
    public long? CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; } = DateTimeOffset.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedOn { get; set; }

    public User? ApprovedByUser { get; set; }
    public User? EscalatedToUser { get; set; }
    public User? CreatedByUser { get; set; }
    public User? UpdatedByUser { get; set; }
    public ICollection<WorksheetReserve> Reserves { get; set; } = [];
    public ICollection<WorksheetPayment> Payments { get; set; } = [];
}
