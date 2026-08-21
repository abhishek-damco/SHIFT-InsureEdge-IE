// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Join table: account <-> policy. Table name is "policy_accounts" (plural, per db/010).
namespace InsureEdge.Domain.Entities;

public class PolicyAccount
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long AccountId { get; set; }
    public long PolicyId { get; set; }

    public Account? Account { get; set; }
    public Policy? Policy { get; set; }
}
