namespace InsureEdge.Domain.Entities;

public class ConfigurationValue
{
    public long Id { get; set; }
    public long ConfigurationId { get; set; }
    public string? Value { get; set; }
    public bool Enabled { get; set; } = true;
    public bool IsDefault { get; set; } = false;
    public DateOnly? EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }

    public Configuration? Configuration { get; set; }
}
