namespace InsureEdge.Domain.Entities;

public class TempAdjusterLicense
{
    public long Id { get; set; }
    public long AdjusterId { get; set; }
    public string? LicensedState { get; set; }
    public string? LicenseNumber { get; set; }
    public string? LicenseStartDate { get; set; }
    public string? LicenseExpirationDate { get; set; }
    public TempAdjuster? Adjuster { get; set; }
}
