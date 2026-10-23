// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Distribution: address for an intermediary, or for one of its producers when ProducerId
// is set (ported from OutSystems "IntermediaryProducerAddress" entity). The DisburseCloud
// commission-disbursement job only uses the intermediary's own address (ProducerId null).
namespace InsureEdge.Domain.Entities;

public class IntermediaryProducerAddress
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long IntermediaryId { get; set; }
    public long? ProducerId { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? Country { get; set; }
    public string? State { get; set; }
    public string? City { get; set; }
    public string? ZipCode { get; set; }
    public string? Latitude { get; set; }
    public string? Longitude { get; set; }
    public string? County { get; set; }
    public bool? IsSameAsIntermediary { get; set; }
    public bool? IsManual { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }

    public Intermediary? Intermediary { get; set; }
    public Producer? Producer { get; set; }
}
