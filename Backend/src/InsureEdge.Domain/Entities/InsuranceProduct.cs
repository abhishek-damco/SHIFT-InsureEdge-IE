// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
namespace InsureEdge.Domain.Entities;

public class InsuranceProduct
{
    public long Id { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // Personal | Commercial | Specialty
    public bool IsActive { get; set; } = true;

    public ICollection<InsuranceSubProduct> SubProducts { get; set; } = [];
}

public class InsuranceSubProduct
{
    public long Id { get; set; }
    public long ProductId { get; set; }
    public string SubProductName { get; set; } = string.Empty;

    public InsuranceProduct? Product { get; set; }
}

public class CompanyProductAccess
{
    public long Id { get; set; }
    public long CompanyId { get; set; }
    public long ProductId { get; set; }

    public InsuranceProduct? Product { get; set; }
    public ICollection<CompanyProductSubProduct> SelectedSubProducts { get; set; } = [];
    public ICollection<CompanyProductJurisdiction> Jurisdictions { get; set; } = [];
}

public class CompanyProductSubProduct
{
    public long Id { get; set; }
    public long AccessId { get; set; }
    public long SubProductId { get; set; }

    public InsuranceSubProduct? SubProduct { get; set; }
}

public class CompanyProductJurisdiction
{
    public long Id { get; set; }
    public long AccessId { get; set; }
    public string StateCode { get; set; } = string.Empty;
    public string StateName { get; set; } = string.Empty;
}
