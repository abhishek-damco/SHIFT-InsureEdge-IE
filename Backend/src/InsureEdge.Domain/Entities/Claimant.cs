// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Third-party claimant (Step 3 — conditional on IsThirdPartyDamage toggle).
// PartyType: Individual | Business
namespace InsureEdge.Domain.Entities;

public class Claimant
{
    public long Id { get; set; }
    public long ClaimId { get; set; }
    public long ClientId { get; set; }
    public string PartyType { get; set; } = "Individual";
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? RelationshipWithInsured { get; set; }
    public string? Telephone { get; set; }
    public string? TelephoneCC { get; set; }
    public string? AlternateTelephone { get; set; }
    public string? Email { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? Country { get; set; }
    public string? State { get; set; }
    public string? City { get; set; }
    public string? County { get; set; }
    public string? ZipCode { get; set; }
    public string? Latitude { get; set; }
    public string? Longitude { get; set; }
    public string? ListOfDamages { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public Claim? Claim { get; set; }
}
