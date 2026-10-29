namespace InsureEdge.Domain.Entities;

public class WorksheetPayment
{
    public long Id { get; set; }
    public long WorksheetId { get; set; }
    public long ClientId { get; set; }
    public string? Coverage { get; set; }
    public string? CauseOfLossDescription { get; set; }
    public string? PayeeType { get; set; }
    public string? PayeeName { get; set; }
    public string? LiabilityClaim { get; set; }
    public decimal PaymentAmount { get; set; }

    public ClaimWorksheet Worksheet { get; set; } = null!;
}
