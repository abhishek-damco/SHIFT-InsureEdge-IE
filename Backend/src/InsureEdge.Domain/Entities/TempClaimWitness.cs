namespace InsureEdge.Domain.Entities;

public class TempClaimWitness
{
    public long Id { get; set; }
    public long ClaimId { get; set; }
    public long ClientId { get; set; }
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? SocialSecurityNumber { get; set; }
    public string? RelationshipWithInsured { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? Country { get; set; }
    public string? State { get; set; }
    public string? City { get; set; }
    public string? County { get; set; }
    public string? ZipCode { get; set; }
    public string? Latitude { get; set; }
    public string? Longitude { get; set; }
    public string? TelephoneNumber { get; set; }
    public string? Extension { get; set; }
    public string? AlternateTelephoneNumber { get; set; }
    public string? EmailId { get; set; }
    public string? Description { get; set; }
    public string? ProfileImageName { get; set; }
    public string? IdProofName { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public Claim? Claim { get; set; }
}
