// US-017/US-019: Onboarding email flow (validate token, complete setup).
// NOTE: User creation and retrieval moved to UsersController (unified user table).
using InsureEdge.Application.DTOs.Auth;
using InsureEdge.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/onboarding")]
public class OnboardingController : ControllerBase
{
    private readonly PasswordResetService _resetSvc;

    public OnboardingController(PasswordResetService resetSvc)
    {
        _resetSvc = resetSvc;
    }

    // US-017: Validate onboarding token
    [HttpPost("validate")]
    [AllowAnonymous]
    public async Task<IActionResult> ValidateOnboarding([FromBody] PasswordResetValidateDto dto)
    {
        var valid = await _resetSvc.ValidateTokenAsync(dto.Username, dto.Token);
        return Ok(new { valid });
    }

    // US-017: Complete onboarding — set password, activate account
    [HttpPost("setup")]
    [AllowAnonymous]
    public async Task<IActionResult> SetupAccount([FromBody] PasswordResetConfirmDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 8)
            return BadRequest(new { message = "Password must be at least 8 characters." });

        var (success, error) = await _resetSvc.ConfirmResetAsync(dto.Username, dto.Token, dto.NewPassword);
        if (!success)
            return BadRequest(new { message = error });
        return Ok(new { message = "Account activated. You may now log in." });
    }
}
