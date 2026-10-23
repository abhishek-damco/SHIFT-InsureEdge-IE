namespace InsureEdge.Domain.Entities;

public class DashboardPreference
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long UserId { get; set; }
    public string ConfigurationJson { get; set; } = "[]";
    public DateTime UpdatedOn { get; set; } = DateTime.UtcNow;

    public Client? Client { get; set; }
    public User? User { get; set; }
}
