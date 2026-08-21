// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Claim reference/lookup entities — mapped to reference tables seeded in 005_claims_seed.sql
namespace InsureEdge.Domain.Entities;

public class ClaimInitiationChannel
{
    public short Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class CauseOfLoss
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class ConsequenceOfLoss
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class CoverageType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ClaimType { get; set; }
}

public class ImpactedAsset
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
