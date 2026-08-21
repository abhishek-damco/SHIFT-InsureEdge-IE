namespace InsureEdge.Domain.Entities;

public class WorksheetReserve
{
    public long Id { get; set; }
    public long WorksheetId { get; set; }
    public long ClientId { get; set; }
    public string? Coverage { get; set; }
    public decimal? CoverageLimit { get; set; }
    public string? CauseOfLossDescription { get; set; }
    public string? CauseOfLossCode { get; set; }
    public decimal? CauseOfLossLimit { get; set; }
    public string? LiabilityClaimDescription { get; set; }
    public string? LiabilityClaimCode { get; set; }
    public decimal? LiabilityLimit { get; set; }
    public decimal? SupersedingLimit { get; set; }
    public decimal ReserveAmount { get; set; }

    public ClaimWorksheet Worksheet { get; set; } = null!;
}
