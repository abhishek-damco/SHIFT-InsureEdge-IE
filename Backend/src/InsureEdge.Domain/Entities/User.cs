// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Passwords stored as BCrypt hash (ADR-002). Never store plaintext passwords.
using System.ComponentModel.DataAnnotations.Schema;

namespace InsureEdge.Domain.Entities;

public class User
{
    public long Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;   // BCrypt hash (ADR-002)
    public bool IsActive { get; set; }
    public long ClientId { get; set; }
    public DateTime CreatedOn { get; set; }

    // Producer self-service login: set only for a Producer's own login, never for staff.
    // Excluded from User Management (UsersController.GetAll) and scopes quote/policy
    // visibility to this producer's own book (ICurrentTenantService, ProducerScope).
    public long? ProducerId { get; set; }
    public Producer? Producer { get; set; }

    public DateTime? LastLoginOn { get; set; }

    public string FullName => $"{FirstName} {LastName}".Trim();
    public string Initials => $"{(FirstName.Length > 0 ? FirstName[0] : ' ')}{(LastName.Length > 0 ? LastName[0] : ' ')}".Trim().ToUpper();
}
