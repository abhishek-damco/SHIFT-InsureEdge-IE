// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Implements US-015, US-016, US-017 password reset and onboarding token logic.
// CORRECTIVE (RSK-SEC-004): tokens stored as SHA-256 hash — plaintext never persisted.
// CORRECTIVE (US-017): existence-only validation is prohibited — all 3 checks mandatory.
// VR-006: standard token valid if: exists AND not-expired (30min) AND hash-matches.
// VR-007: onboarding token valid if: exists AND not-expired (24h) AND hash-matches.
// VR-009: resend rate limit — reject if 2+ active tokens within 30-min window.
using System.Security.Cryptography;
using System.Text;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using Microsoft.Extensions.Configuration;

namespace InsureEdge.Application.Services;

public class PasswordResetService
{
    private readonly IPasswordResetRepository _resetRepo;
    private readonly IUserRepository _userRepo;
    private readonly IEmailService _email;
    private readonly string _appBaseUrl;

    public PasswordResetService(
        IPasswordResetRepository resetRepo,
        IUserRepository userRepo,
        IEmailService email,
        IConfiguration config)
    {
        _resetRepo = resetRepo;
        _userRepo = userRepo;
        _email = email;
        _appBaseUrl = config["AppBaseUrl"] ?? "http://localhost:5000";
    }

    // US-015: Standard reset — always returns success to prevent user enumeration
    public async Task<bool> RequestResetAsync(string email, long clientId)
    {
        var user = await _userRepo.GetByEmailAsync(email, clientId);
        if (user == null || !user.IsActive) return true; // silent — no enumeration

        var (plaintext, hash) = GenerateToken();
        await _resetRepo.CreateTokenAsync(user.Id, user.Email, hash, isOnboarding: false);

        var resetUrl = $"{_appBaseUrl}/password-reset/confirm?username={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(plaintext)}";
        await _email.SendPasswordResetAsync(user.Email, user.FullName, resetUrl);
        return true;
    }

    // US-016: Resend — rate limited by VR-009
    public async Task<(bool Success, string? Error)> ResendResetAsync(string email, long clientId)
    {
        var user = await _userRepo.GetByEmailAsync(email, clientId);
        if (user == null || !user.IsActive) return (true, null); // silent

        // VR-009: reject if 2+ active (non-expired) tokens within window
        var activeCount = await _resetRepo.CountActiveTokensAsync(user.Email);
        if (activeCount >= 2)
            return (false, "Rate limit reached. Please wait for existing links to expire before requesting a new one.");

        // Delete old tokens before issuing new (VR-009: clean slate)
        await _resetRepo.DeleteAllForUserAsync(user.Email);

        var (plaintext, hash) = GenerateToken();
        await _resetRepo.CreateTokenAsync(user.Id, user.Email, hash, isOnboarding: false);

        var resetUrl = $"{_appBaseUrl}/password-reset/confirm?username={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(plaintext)}";
        await _email.SendPasswordResetAsync(user.Email, user.FullName, resetUrl);
        return (true, null);
    }

    // US-015/US-017: Validate token — all 3 checks mandatory (VR-006/VR-007)
    // CORRECTIVE (US-017): existence-only validation is NOT used. Code hash MUST match.
    public async Task<bool> ValidateTokenAsync(string username, string token)
    {
        var hash = HashToken(token);
        var record = await _resetRepo.GetByUsernameAndHashAsync(username, hash);
        if (record == null) return false;       // check 1: exists
        if (record.IsExpired()) return false;   // check 2: not expired
        return true;                            // check 3: hash matched (implicit — lookup was by hash)
    }

    // US-015/US-017: Confirm — validate, set password, delete token (single-use)
    public async Task<(bool Success, string? Error)> ConfirmResetAsync(
        string username, string token, string newPassword)
    {
        var hash = HashToken(token);
        var record = await _resetRepo.GetByUsernameAndHashAsync(username, hash);

        if (record == null)
            return (false, "Reset link is invalid.");
        if (record.IsExpired())
            return (false, "Reset link has expired. Please request a new one.");

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await _userRepo.UpdatePasswordAsync(record.UserId, passwordHash);
        await _resetRepo.DeleteByIdAsync(record.Id); // single-use — delete after use
        return (true, null);
    }

    // US-017/US-019: Onboarding — 24h expiry, welcome email
    public async Task GenerateOnboardingTokenAsync(
        long userId, string username, string email, string fullName, string adminEmail)
    {
        var (plaintext, hash) = GenerateToken();
        await _resetRepo.CreateTokenAsync(userId, username, hash, isOnboarding: true);

        var setupUrl = $"{_appBaseUrl}/onboarding/setup?username={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(plaintext)}";
        await _email.SendOnboardingWelcomeAsync(email, fullName, setupUrl, adminEmail);
    }

    // CORRECTIVE (RSK-SEC-004): SHA-256 hash. High-entropy random token — SHA-256 is appropriate.
    public static string HashToken(string plaintext)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(plaintext));
        return Convert.ToHexString(bytes).ToLowerInvariant(); // 64-char hex
    }

    private static (string Plaintext, string Hash) GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        var plaintext = Convert.ToBase64String(bytes)
            .Replace('+', '-').Replace('/', '_').TrimEnd('='); // URL-safe base64
        var hash = HashToken(plaintext);
        return (plaintext, hash);
    }
}
