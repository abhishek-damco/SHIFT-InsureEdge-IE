namespace InsureEdge.Domain.Entities;

public class TempClaimReport
{
    public long Id { get; set; }
    public long ClaimId { get; set; }
    public long ClientId { get; set; }
    public string? ReportType { get; set; }
    public string? ReportNumber { get; set; }
    public string? ReportFilingDate { get; set; }
    public string? PrecinctName { get; set; }
    public string? CaseStatus { get; set; }
    public string? NumberOfWitness { get; set; }
    public string? Description { get; set; }
    public bool NotifyDocumentUpload { get; set; }
    public string? NotifyToName { get; set; }
    public string? Comment { get; set; }
    public string? ContactFirstName { get; set; }
    public string? ContactLastName { get; set; }
    public string? IdentityDocument { get; set; }
    public string? TelephoneNumber { get; set; }
    public string? Extension { get; set; }
    public string? AlternateTelephoneNumber { get; set; }
    public string? EmailId { get; set; }
    public string? ReferenceDocumentName { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public Claim? Claim { get; set; }
}
