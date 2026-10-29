// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Tests for PasswordResetService: SHA-256 hashing, rate limiting (VR-009),
// 3-check validation (VR-006/VR-007, US-017 corrective), single-use token deletion.
using FluentAssertions;
using InsureEdge.Application.Interfaces;
using InsureEdge.Application.Services;
using InsureEdge.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace InsureEdge.UnitTests;

public class PasswordResetServiceTests
{
    private readonly Mock<IPasswordResetRepository> _resetRepo = new();
    private readonly Mock<IUserRepository> _userRepo = new();
    private readonly Mock<IEmailService> _email = new();
    private readonly PasswordResetService _svc;
    private readonly IConfiguration _config;

    public PasswordResetServiceTests()
    {
        var configData = new Dictionary<string, string?> { ["AppBaseUrl"] = "http://test" };
        _config = new ConfigurationBuilder().AddInMemoryCollection(configData).Build();
        _svc = new PasswordResetService(_resetRepo.Object, _userRepo.Object, _email.Object, _config);
    }

    // RSK-SEC-004 Corrective: token hash is 64-char lowercase SHA-256 hex
    [Fact]
    public void HashToken_ReturnsSha256HexLowercase()
    {
        var hash = PasswordResetService.HashToken("test-token");
        hash.Should().HaveLength(64);
        hash.Should().MatchRegex("^[0-9a-f]{64}$");
    }

    [Fact]
    public void HashToken_SameInput_ReturnsSameHash()
    {
        var h1 = PasswordResetService.HashToken("abc");
        var h2 = PasswordResetService.HashToken("abc");
        h1.Should().Be(h2);
    }

    [Fact]
    public void HashToken_DifferentInput_ReturnsDifferentHash()
    {
        var h1 = PasswordResetService.HashToken("token-a");
        var h2 = PasswordResetService.HashToken("token-b");
        h1.Should().NotBe(h2);
    }

    // US-015: Unknown email returns true (silent — no enumeration)
    [Fact]
    public async Task RequestReset_UnknownEmail_ReturnsTrueWithNoAction()
    {
        _userRepo.Setup(r => r.GetByEmailAsync("unknown@x.com", 1)).ReturnsAsync((User?)null);
        var result = await _svc.RequestResetAsync("unknown@x.com", 1);
        result.Should().BeTrue();
        _resetRepo.Verify(r => r.CreateTokenAsync(It.IsAny<long>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>()), Times.Never);
        _email.Verify(e => e.SendPasswordResetAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    // VR-009: Reject resend if 2+ active tokens
    [Fact]
    public async Task ResendReset_RateLimitReached_ReturnsFalseWithError()
    {
        var user = new User { Id = 1, Email = "user@x.com", FirstName = "A", LastName = "B", ClientId = 1, IsActive = true, PasswordHash = "x" };
        _userRepo.Setup(r => r.GetByEmailAsync("user@x.com", 1)).ReturnsAsync(user);
        _resetRepo.Setup(r => r.CountActiveTokensAsync("user@x.com")).ReturnsAsync(2);

        var (success, error) = await _svc.ResendResetAsync("user@x.com", 1);
        success.Should().BeFalse();
        error.Should().Contain("Rate limit");
        _resetRepo.Verify(r => r.CreateTokenAsync(It.IsAny<long>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>()), Times.Never);
    }

    // VR-009: Allow resend if < 2 active tokens
    [Fact]
    public async Task ResendReset_BelowRateLimit_CreatesNewToken()
    {
        var user = new User { Id = 1, Email = "user@x.com", FirstName = "A", LastName = "B", ClientId = 1, IsActive = true, PasswordHash = "x" };
        _userRepo.Setup(r => r.GetByEmailAsync("user@x.com", 1)).ReturnsAsync(user);
        _resetRepo.Setup(r => r.CountActiveTokensAsync("user@x.com")).ReturnsAsync(1);
        _resetRepo.Setup(r => r.DeleteAllForUserAsync("user@x.com")).Returns(Task.CompletedTask);
        _resetRepo.Setup(r => r.CreateTokenAsync(It.IsAny<long>(), It.IsAny<string>(), It.IsAny<string>(), false))
                  .ReturnsAsync(new UserPasswordReset { Id = 1 });
        _email.Setup(e => e.SendPasswordResetAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).Returns(Task.CompletedTask);

        var (success, error) = await _svc.ResendResetAsync("user@x.com", 1);
        success.Should().BeTrue();
        error.Should().BeNull();
        _resetRepo.Verify(r => r.CreateTokenAsync(1, "user@x.com", It.IsAny<string>(), false), Times.Once);
    }

    // US-017 Corrective (DBT-SEC-004): ValidateToken returns false when no record found (hash mismatch)
    [Fact]
    public async Task ValidateToken_NoMatchingRecord_ReturnsFalse()
    {
        _resetRepo.Setup(r => r.GetByUsernameAndHashAsync(It.IsAny<string>(), It.IsAny<string>()))
                  .ReturnsAsync((UserPasswordReset?)null);
        var result = await _svc.ValidateTokenAsync("user@x.com", "bad-token");
        result.Should().BeFalse();
    }

    // US-017 Corrective: ValidateToken returns false for expired token
    [Fact]
    public async Task ValidateToken_ExpiredRecord_ReturnsFalse()
    {
        var expired = new UserPasswordReset
        {
            Id = 1, UserId = 1, Username = "user@x.com",
            CodeHash = "hash", IsOnboarding = false,
            CreatedOn = DateTime.UtcNow.AddHours(-2) // 30-min window expired
        };
        _resetRepo.Setup(r => r.GetByUsernameAndHashAsync("user@x.com", It.IsAny<string>()))
                  .ReturnsAsync(expired);
        var result = await _svc.ValidateTokenAsync("user@x.com", "some-token");
        result.Should().BeFalse();
    }

    // US-015/US-017: ConfirmReset deletes token (single-use)
    [Fact]
    public async Task ConfirmReset_ValidToken_UpdatesPasswordAndDeletesToken()
    {
        var record = new UserPasswordReset
        {
            Id = 10, UserId = 5, Username = "user@x.com",
            CodeHash = "placeholder", IsOnboarding = false,
            CreatedOn = DateTime.UtcNow // valid, not expired
        };
        _resetRepo.Setup(r => r.GetByUsernameAndHashAsync("user@x.com", It.IsAny<string>()))
                  .ReturnsAsync(record);
        _userRepo.Setup(r => r.UpdatePasswordAsync(5, It.IsAny<string>())).Returns(Task.CompletedTask);
        _resetRepo.Setup(r => r.DeleteByIdAsync(10)).Returns(Task.CompletedTask);

        var (success, error) = await _svc.ConfirmResetAsync("user@x.com", "valid-token", "newPass123");
        success.Should().BeTrue();
        error.Should().BeNull();
        _userRepo.Verify(r => r.UpdatePasswordAsync(5, It.IsAny<string>()), Times.Once);
        _resetRepo.Verify(r => r.DeleteByIdAsync(10), Times.Once); // single-use
    }

    // US-017: Onboarding token uses 24-hour expiry
    [Fact]
    public void UserPasswordReset_OnboardingExpiry_Is24Hours()
    {
        var record = new UserPasswordReset { IsOnboarding = true, CreatedOn = DateTime.UtcNow.AddHours(-23) };
        record.IsExpired().Should().BeFalse();

        var expired = new UserPasswordReset { IsOnboarding = true, CreatedOn = DateTime.UtcNow.AddHours(-25) };
        expired.IsExpired().Should().BeTrue();
    }

    // US-015: Standard token expiry is 30 minutes
    [Fact]
    public void UserPasswordReset_StandardExpiry_Is30Minutes()
    {
        var record = new UserPasswordReset { IsOnboarding = false, CreatedOn = DateTime.UtcNow.AddMinutes(-29) };
        record.IsExpired().Should().BeFalse();

        var expired = new UserPasswordReset { IsOnboarding = false, CreatedOn = DateTime.UtcNow.AddMinutes(-31) };
        expired.IsExpired().Should().BeTrue();
    }
}
