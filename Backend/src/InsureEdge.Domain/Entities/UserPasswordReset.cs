// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// US-015/US-016/US-017: Password reset and onboarding tokens.
// CORRECTIVE (RSK-SEC-004): Code stored as SHA-256 hex hash — plaintext NEVER persisted.
// CORRECTIVE (US-017/DBT-SEC-004): IsOnboarding flag; 24h expiry for onboarding, 30min for standard.
// VR-006 (standard): exists AND not expired AND hash matches — all 3 mandatory.
// VR-007 (onboarding): same 3 checks — existence-only validation prohibited by design.
namespace InsureEdge.Domain.Entities;

public class UserPasswordReset
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string CodeHash { get; set; } = string.Empty;   // SHA-256 hex hash — plaintext NEVER stored
    public bool IsOnboarding { get; set; }              // true = 24h expiry, false = 30min expiry
    public DateTime CreatedOn { get; set; }
    public User? User { get; set; }

    public bool IsExpired() =>
        DateTime.UtcNow > (IsOnboarding ? CreatedOn.AddHours(24) : CreatedOn.AddMinutes(30));
}
