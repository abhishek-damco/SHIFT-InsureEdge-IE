namespace InsureEdge.Domain.Entities;

public class CommonAddress
{
    public long    Id                  { get; set; }
    public long?   AccountId           { get; set; }
    public bool    IsLegalSameAsMailing { get; set; }
    public string? AddressType         { get; set; }
    public string? AddressLine1        { get; set; }
    public string? AddressLine2        { get; set; }
    public string? Country             { get; set; }
    public string? State               { get; set; }
    public string? City                { get; set; }
    public string? ZipCode             { get; set; }
    public string? Latitude            { get; set; }
    public string? Longitude           { get; set; }
    public string? County              { get; set; }
    public bool    IsActive            { get; set; } = true;
    public bool    IsManual            { get; set; }
    public string? GoogleAddress       { get; set; }

    // Nullable FKs — this table is shared across many entity types
    public long? PolicyId       { get; set; }
    public long? ClaimId        { get; set; }
    public long? ClaimantId     { get; set; }
    public long? AdjusterId     { get; set; }
    public long? PayeeId        { get; set; }
    public long? BankingDetailId { get; set; }
    public long? WitnessId      { get; set; }

    public long?           CreatedBy  { get; set; }
    public DateTimeOffset  CreatedOn  { get; set; } = DateTimeOffset.UtcNow;
    public long?           UpdatedBy  { get; set; }
    public DateTimeOffset? UpdatedOn  { get; set; }

    // Navigation
    public Payee? Payee { get; set; }
}
