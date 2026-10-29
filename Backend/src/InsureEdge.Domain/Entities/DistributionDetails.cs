namespace InsureEdge.Domain.Entities;

// Persisted Distribution Management detail records.  These remain separate from
// the base intermediary/producer records because the UI permits multiple
// intermediary contacts and non-resident-state rows.
public sealed class IntermediaryAddress
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long IntermediaryId { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? Country { get; set; }
    public string? State { get; set; }
    public string? City { get; set; }
    public string? County { get; set; }
    public string? ZipCode { get; set; }
    public string? Latitude { get; set; }
    public string? Longitude { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
    public Intermediary? Intermediary { get; set; }
}

public sealed class IntermediaryNrState
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long IntermediaryId { get; set; }
    public string State { get; set; } = string.Empty;
    public string? License { get; set; }
    public bool IsAvailableInSearch { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
    public Intermediary? Intermediary { get; set; }
}

public sealed class ProducerAddress
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long ProducerId { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? Country { get; set; }
    public string? State { get; set; }
    public string? City { get; set; }
    public string? County { get; set; }
    public string? ZipCode { get; set; }
    public string? Latitude { get; set; }
    public string? Longitude { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
    public Producer? Producer { get; set; }
}

public sealed class ProducerNrState
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long ProducerId { get; set; }
    public string State { get; set; } = string.Empty;
    public string? LicenseNumber { get; set; }
    public bool IsAvailableInSearch { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
    public Producer? Producer { get; set; }
}
