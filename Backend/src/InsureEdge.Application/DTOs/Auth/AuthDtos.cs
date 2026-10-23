// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
namespace InsureEdge.Application.DTOs.Auth;

// US-010: Member picker dropdown
public record UserSelectDto(long Id, string FullName, string Email, string Initials);

// ADR-002: Login
public record LoginRequest(string Email, string Password);

// ADR-009: Screen permission flags returned to frontend
public record ScreenPermissionsDto(
    string Screen,
    bool View, bool Add, bool Edit, bool Duplicate,
    bool Upload, bool Download, bool SensitiveData,
    bool SensitiveDocuments, bool ApproveReject
);

// US-015/US-016: Password reset initiation
public record PasswordResetRequestDto(string Email);

// US-015/US-017: Token validation
public record PasswordResetValidateDto(string Username, string Token);

// US-015/US-017: Set new password
public record PasswordResetConfirmDto(string Username, string Token, string NewPassword);

// US-017/US-019: New user creation (triggers onboarding email)
public record CreateUserRequest(
    string FirstName,
    string LastName,
    string Email,
    bool IsActive = true
);

// My Profile screen (header "View Profile" → Personal/Security tabs)
public record MyProfile(
    long Id,
    string? UserCode,
    string? Status,
    string FirstName,
    string? MiddleName,
    string LastName,
    string Email,
    string? RoleName,
    DateOnly? DateOfBirth,
    string? Gender,
    string? Bio,
    DateTime? PasswordUpdatedOn,
    DateTime? LastLoginOn
);

public record UpdateMyProfileRequest(
    string FirstName,
    string? MiddleName,
    string LastName,
    DateOnly? DateOfBirth,
    string? Gender,
    string? Bio
);
