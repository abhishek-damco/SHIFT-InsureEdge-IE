// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Read-only display in FNOL Step 2 — sourced from policy admin.
namespace InsureEdge.Domain.Entities;

public class Insured
{
    public long Id { get; set; }
    public long PolicyId { get; set; }
    public string? CustomerId { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? Country { get; set; }
    public string? State { get; set; }
    public string? City { get; set; }
    public string? County { get; set; }
    public string? ZipCode { get; set; }
    public string? Telephone { get; set; }
    public string? TelephoneExt { get; set; }
    public string? AlternateTelephone { get; set; }
    public string? Email { get; set; }
    public long ClientId { get; set; }

    public Policy? Policy { get; set; }
}
