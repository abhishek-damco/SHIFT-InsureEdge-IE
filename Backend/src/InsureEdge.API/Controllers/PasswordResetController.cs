// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// US-015: Request reset; US-016: Resend with rate limit; US-017: Validate + confirm.
// CORRECTIVE (DBT-SEC-004): ValidateToken always performs 3-check validation.
// CORRECTIVE (RSK-SEC-004): Plaintext token never logged or returned from server; only used to hash.
using InsureEdge.Application.DTOs.Auth;
using InsureEdge.Application.Services;
using InsureEdge.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/password-reset")]
[AllowAnonymous]
public class PasswordResetController : ControllerBase
{
    private readonly PasswordResetService _svc;

    public PasswordResetController(PasswordResetService svc) => _svc = svc;

    // US-015: Initiate reset — always 200 to prevent enumeration
    [HttpPost("request")]
    public async Task<IActionResult> Request([FromBody] PasswordResetRequestDto dto,
        [FromServices] InsureEdge.Infrastructure.Data.InsureEdgeDbContext db)
    {
        // ClientId for password reset comes from the email lookup (user's own client)
        // Since this endpoint is anonymous, we search across all clients (email is globally unique per client)
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsActive);
        if (user != null)
            await _svc.RequestResetAsync(dto.Email, user.ClientId);
        return Ok(new { message = "If that email is registered, a reset link has been sent." });
    }

    // US-016: Resend
    [HttpPost("resend")]
    public async Task<IActionResult> Resend([FromBody] PasswordResetRequestDto dto,
        [FromServices] InsureEdge.Infrastructure.Data.InsureEdgeDbContext db)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsActive);
        if (user == null)
            return Ok(new { message = "If that email is registered, a reset link has been sent." });

        var (success, error) = await _svc.ResendResetAsync(dto.Email, user.ClientId);
        if (!success)
            return BadRequest(new { message = error });
        return Ok(new { message = "A new reset link has been sent." });
    }

    // US-015/US-017: Validate token (used by frontend before showing set-password form)
    // CORRECTIVE (DBT-SEC-004): 3 checks — exists + not-expired + hash-matches.
    [HttpPost("validate")]
    public async Task<IActionResult> Validate([FromBody] PasswordResetValidateDto dto)
    {
        var valid = await _svc.ValidateTokenAsync(dto.Username, dto.Token);
        return Ok(new { valid });
    }

    // US-015/US-017: Confirm new password
    [HttpPost("confirm")]
    public async Task<IActionResult> Confirm([FromBody] PasswordResetConfirmDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 8)
            return BadRequest(new { message = "Password must be at least 8 characters." });

        var (success, error) = await _svc.ConfirmResetAsync(dto.Username, dto.Token, dto.NewPassword);
        if (!success)
            return BadRequest(new { message = error });
        return Ok(new { message = "Password updated successfully." });
    }
}

