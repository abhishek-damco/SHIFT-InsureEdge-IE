namespace InsureEdge.Domain.Entities;

public class Configuration
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public string? ConfigurationType { get; set; }
    public string ConfigurationName { get; set; } = string.Empty;
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedOn { get; set; }

    public User? UpdatedByUser { get; set; }
    public ICollection<ConfigurationValue> Values { get; set; } = [];
}
