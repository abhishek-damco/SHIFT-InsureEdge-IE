// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// LOB / sub-product + jurisdiction association for a policy. FKs to existing
// insurance_product / insurance_sub_product tables (not a new "product" table).
namespace InsureEdge.Domain.Entities;

public class PolicyProduct
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long PolicyId { get; set; }
    public long? ProductId { get; set; }
    public long? SubProductId { get; set; }
    public string? State { get; set; }

    public Policy? Policy { get; set; }
    public InsuranceProduct? Product { get; set; }
    public InsuranceSubProduct? SubProduct { get; set; }
}
