// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// ADR-002: HttpOnly, SameSite=Strict cookie auth.
// ADR-009: /me/permissions returns per-screen permissions for PermissionContext.
// US-020: RSK-SEC-001 Corrective — no bulk credential update endpoint.
using Dapper;
using InsureEdge.Application.DTOs.Auth;
using InsureEdge.Application.Interfaces;
using InsureEdge.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly InsureEdgeDbContext _db;
    private readonly IPermissionResolver _permissions;
    private readonly ICurrentTenantService _tenant;

    public AuthController(InsureEdgeDbContext db, IPermissionResolver permissions, ICurrentTenantService tenant)
    {
        _db = db;
        _permissions = permissions;
        _tenant = tenant;
    }

    // ADR-002: Login — sets HttpOnly cookie
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email && u.IsActive);
        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid credentials." });

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FirstName + " " + user.LastName),
            new("client_id", user.ClientId.ToString())
        };

        // Producer self-service login: resolve the linked Producer's Intermediary once
        // here, at login, rather than on every request (see ICurrentTenantService,
        // ProducerScope) — cheaper, and avoids a DbContext dependency in CurrentTenantService.
        if (user.ProducerId.HasValue)
        {
            var producer = await _db.Producers.FirstOrDefaultAsync(p => p.Id == user.ProducerId.Value);
            if (producer != null && producer.IntermediaryId > 0)
            {
                var intermediary = await _db.Intermediaries.FirstOrDefaultAsync(i => i.Id == producer.IntermediaryId);
                claims.Add(new Claim("producer_id", producer.Id.ToString()));
                claims.Add(new Claim("intermediary_id", producer.IntermediaryId.ToString()));
                claims.Add(new Claim("full_producer_visibility", (intermediary?.AllowFullProducerVisibility ?? false).ToString().ToLowerInvariant()));
            }
        }

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal,
            new AuthenticationProperties { IsPersistent = false });

        // My Profile "Last Login" — update user record with login timestamp
        try
        {
            user.LastLoginOn = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
        catch
        {
            // Fail silently if update fails — login should not be blocked by audit logging
        }

        return Ok(new
        {
            user.Id,
            FullName = user.FirstName + " " + user.LastName,
            user.Email
        });
    }

    // ADR-002: Logout — clears cookie
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    // Returns current user's basic profile (id, email, fullName)
    [HttpGet("me")]
    [Authorize]
    public IActionResult GetMe()
    {
        var email    = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "";
        var fullName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value  ?? "";
        var userId   = _tenant.UserId;
        return Ok(new { id = userId, email, fullName });
    }

    // ADR-009: Returns all per-screen permissions for the authenticated user
    [HttpGet("me/permissions")]
    [Authorize]
    public async Task<IActionResult> GetMyPermissions()
    {
        var userId = _tenant.UserId;
        var clientId = _tenant.ClientId;

        var screens = await _db.AppScreens.Include(s => s.Module).ToListAsync();
        var result = new List<ScreenPermissionsDto>();

        foreach (var screen in screens)
        {
            var p = await _permissions.ResolveAsync(userId, clientId, screen.ScreenCode);
            result.Add(new ScreenPermissionsDto(
                screen.ScreenCode,
                p.View, p.Add, p.Edit, p.Duplicate,
                p.Upload, p.Download, p.SensitiveData, p.SensitiveDocuments, p.ApproveReject));
        }

        return Ok(result);
    }

    // US-010: Active users dropdown for member picker
    [HttpGet("users")]
    [Authorize]
    public async Task<IActionResult> GetUsers([FromServices] IUserRepository userRepo)
    {
        var users = await userRepo.GetActiveUsersAsync(_tenant.ClientId);
        return Ok(users);
    }

    // My Profile screen (header "View Profile"): the caller's own record, no
    // permission gate beyond being logged in — a user always sees their own profile.
    [HttpGet("me/profile")]
    [Authorize]
    public async Task<IActionResult> GetMyProfile()
    {
        var profile = await LoadMyProfileAsync();
        return profile == null ? NotFound(new { error = "User not found." }) : Ok(profile);
    }

    [HttpPut("me/profile")]
    [Authorize]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateMyProfileRequest req)
    {
        var user = await _db.Users.FindAsync(_tenant.UserId);
        if (user == null) return NotFound(new { error = "User not found." });

        var conn = (Npgsql.NpgsqlConnection)_db.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open) await conn.OpenAsync();

        // The extended profile fields (middle_name, date_of_birth, gender, bio, ...) live
        // on user_extended, a one-to-one table keyed by user_extended.user_id → "user".id.
        // Group and permission membership continue to use the base user ID.
        await conn.ExecuteAsync(
            @"UPDATE user_extended SET
                first_name    = @firstName,
                middle_name   = @middleName,
                last_name     = @lastName,
                date_of_birth = @dateOfBirth,
                gender        = @gender,
                bio           = @bio,
                updated_on    = now()
            WHERE user_id = @id",
            new
            {
                id = _tenant.UserId,
                firstName = req.FirstName,
                middleName = req.MiddleName,
                lastName = req.LastName,
                dateOfBirth = req.DateOfBirth,
                gender = req.Gender,
                bio = req.Bio,
            });

        // Keep the base "user" row's name in sync — it's what ClaimTypes.Name / the header
        // "Hi, {name}" greeting is built from at login (see AuthController.Login).
        await conn.ExecuteAsync(
            @"UPDATE ""user"" SET first_name = @firstName, last_name = @lastName WHERE id = @id",
            new { id = _tenant.UserId, firstName = req.FirstName, lastName = req.LastName });

        var profile = await LoadMyProfileAsync();
        return Ok(profile);
    }

    private async Task<MyProfile?> LoadMyProfileAsync()
    {
        var conn = (Npgsql.NpgsqlConnection)_db.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open) await conn.OpenAsync();

        var row = await conn.QuerySingleOrDefaultAsync(
            @"SELECT u.id, ue.user_code, ue.status,
                     COALESCE(ue.first_name, u.first_name) AS first_name,
                     ue.middle_name,
                     COALESCE(ue.last_name, u.last_name) AS last_name,
                     u.email, ue.date_of_birth, ue.gender, ue.bio,
                     u.password_updated_on, u.last_login_on, u.producer_id,
                     g.group_name AS role_name
              FROM ""user"" u
              LEFT JOIN user_extended ue ON ue.user_id = u.id
              LEFT JOIN group_user gu ON gu.user_id = u.id
              LEFT JOIN ""group""  g  ON gu.group_id = g.id
              WHERE u.id = @id
              LIMIT 1",
            new { id = _tenant.UserId });

        if (row == null) return null;

        // Producer linkage determines the semantic application role even when the user
        // also belongs to a display/permission group such as "Producers".
        string? roleName = row.producer_id != null ? "Producer" : row.role_name;

        // Dynamic-row values come back as DateTime (Npgsql legacy timestamp behaviour, see
        // Program.cs), not DateOnly — the record constructor needs an explicit conversion,
        // the dynamic binder won't do it implicitly.
        DateTime? dobRaw = row.date_of_birth;
        DateOnly? dateOfBirth = dobRaw.HasValue ? DateOnly.FromDateTime(dobRaw.Value) : null;

        return new MyProfile(
            row.id, row.user_code, row.status, row.first_name, row.middle_name, row.last_name,
            row.email, roleName, dateOfBirth, row.gender, row.bio,
            row.password_updated_on, row.last_login_on);
    }

    // Producer self-service login: the "Brokerage Firm"/"Producer Name" fields on New
    // Submission pre-fill from the logged-in Producer's own record — null/null for staff.
    [HttpGet("me/producer")]
    [Authorize]
    public async Task<IActionResult> GetMyProducer()
    {
        if (_tenant.ProducerId == null)
            return Ok(new { producer = (object?)null, intermediary = (object?)null });

        var producer = await _db.Producers.FirstOrDefaultAsync(p => p.Id == _tenant.ProducerId.Value);
        var intermediary = _tenant.IntermediaryId == null ? null
            : await _db.Intermediaries.FirstOrDefaultAsync(i => i.Id == _tenant.IntermediaryId.Value);

        return Ok(new
        {
            producer = producer == null ? null : new { id = producer.Id, first_name = producer.FirstName, last_name = producer.LastName },
            intermediary = intermediary == null ? null : new { id = intermediary.Id, intermediary_name = intermediary.IntermediaryName, type_of_intermediary = intermediary.TypeOfIntermediary },
        });
    }
}
