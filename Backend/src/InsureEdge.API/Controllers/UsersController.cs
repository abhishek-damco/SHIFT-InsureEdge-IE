using Dapper;
using InsureEdge.Application.Services;
using InsureEdge.API.Models;
using InsureEdge.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController(
    InsureEdgeDbContext dbContext,
    PasswordResetService passwordReset,
    ILogger<UsersController> logger) : ControllerBase
{
    private const string BaseSelect = @"
        u.id,
        ue.user_code,
        COALESCE(ue.status, CASE WHEN u.is_active THEN 'Active' ELSE 'Inactive' END) AS status,
        COALESCE(ue.status_toggle, u.is_active) AS status_toggle,
        COALESCE(ue.first_name, u.first_name) AS first_name,
        ue.middle_name,
        COALESCE(ue.last_name, u.last_name) AS last_name,
        ue.suffix,
        u.email,
        ue.date_of_birth,
        ue.gender,
        ue.is_remote_working,
        ue.is_manager,
        ue.office_location,
        ue.department,
        ue.address_line1,
        ue.address_line2,
        ue.country_code,
        ue.state_code,
        ue.city,
        ue.county,
        ue.zip_code,
        ue.latitude,
        ue.longitude,
        ue.telephone_number,
        ue.telephone_number_cc,
        ue.alt_telephone_number,
        ue.alt_telephone_number_cc,
        ue.extension,
        ue.bio,
        COALESCE(ue.created_on, u.created_on) AS created_on,
        ue.updated_on,
        ue.reports_to,
        TRIM(COALESCE(mue.first_name, mgr.first_name, '') || ' ' || COALESCE(mue.last_name, mgr.last_name, '')) AS manager_name,
        c.name  AS country_name,
        st.name AS state_name";

    private const string BaseFrom = @"
        FROM ""user"" u
        LEFT JOIN user_extended ue  ON ue.user_id = u.id
        LEFT JOIN ""user"" mgr      ON ue.reports_to = mgr.id
        LEFT JOIN user_extended mue ON mue.user_id = mgr.id
        LEFT JOIN country c         ON ue.country_code = c.code
        LEFT JOIN state st          ON ue.state_code = st.code AND ue.country_code = st.country_code";

    private static readonly HashSet<string> AllowedSortColumns =
        ["created_on", "first_name", "last_name", "email", "status", "user_code"];

    private NpgsqlConnection GetConnection()
    {
        var conn = (NpgsqlConnection)dbContext.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
            conn.Open();
        return conn;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string search = "",
        [FromQuery] string status = "",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "created_on",
        [FromQuery] string sortDir = "desc")
    {
        var orderCol = AllowedSortColumns.Contains(sortBy)
            ? sortBy switch
            {
                "first_name" or "last_name" or "email" or "created_on" => $"u.{sortBy}",
                _ => $"ue.{sortBy}",
            }
            : "u.created_on";
        var orderDir = sortDir == "asc" ? "ASC" : "DESC";

        var conditions = new List<string>();
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(search))
        {
            parameters.Add("search", $"%{search}%");
            conditions.Add(@"(u.first_name ILIKE @search OR u.last_name ILIKE @search OR
                 u.email ILIKE @search OR ue.user_code ILIKE @search OR
                 ue.department ILIKE @search)");
        }
        if (!string.IsNullOrWhiteSpace(status))
        {
            parameters.Add("status", status);
            conditions.Add("COALESCE(ue.status, CASE WHEN u.is_active THEN 'Active' ELSE 'Inactive' END) = @status");
        }

        // Only show users that have a user_code (managed users, not just auth-only users)
        conditions.Add("ue.user_code IS NOT NULL");

        var where = "WHERE " + string.Join(" AND ", conditions);

        var conn = GetConnection();

        var total = await conn.ExecuteScalarAsync<int>(
            $@"SELECT COUNT(*) FROM ""user"" u
                LEFT JOIN user_extended ue ON ue.user_id = u.id
                {where}", parameters);

        parameters.Add("limit", pageSize);
        parameters.Add("offset", (page - 1) * pageSize);

        var rows = (await conn.QueryAsync<UserListItem>(
            $@"SELECT {BaseSelect}
            {BaseFrom}
            {where}
            ORDER BY {orderCol} {orderDir}
            LIMIT @limit OFFSET @offset",
            parameters)).ToList();

        if (rows.Count > 0)
        {
            var userIds = rows.Select(r => r.Id).ToArray();
            var groups = await conn.QueryAsync<(int UserId, int Id, string GroupName)>(
                @"SELECT gu.user_id, gu.group_id AS id, g.group_name
                FROM group_user gu
                JOIN ""group"" g ON gu.group_id = g.id
                WHERE gu.user_id = ANY(@ids)",
                new { ids = userIds });

            var groupMap = groups.GroupBy(g => g.UserId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x => new UserGroupRef { Id = x.Id, GroupName = x.GroupName }).ToList());

            foreach (var row in rows)
                row.Groups = groupMap.TryGetValue(row.Id, out var g) ? g : [];
        }

        var kpi = await conn.QuerySingleAsync<UserKpiResult>(
            @"SELECT COUNT(*)                                    AS total,
                   COUNT(*) FILTER (WHERE ue.status = 'Active')   AS active,
                   COUNT(*) FILTER (WHERE ue.status = 'Inactive') AS inactive
            FROM ""user"" u
            JOIN user_extended ue ON ue.user_id = u.id
            WHERE ue.user_code IS NOT NULL");

        return Ok(new UserListResponse
        {
            Items      = rows,
            Total      = total,
            Page       = page,
            PageSize   = pageSize,
            TotalUsers = kpi.Total,
            Active     = kpi.Active,
            Inactive   = kpi.Inactive,
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var conn = GetConnection();

        var user = await conn.QuerySingleOrDefaultAsync<UserDetail>(
            $@"SELECT {BaseSelect}
            {BaseFrom}
            WHERE u.id = @id", new { id });

        if (user is null) return NotFound(new { error = "User not found" });

        user.Groups = (await conn.QueryAsync<UserGroupRef>(
            @"SELECT g.id, g.group_name
            FROM group_user gu
            JOIN ""group"" g ON gu.group_id = g.id
            WHERE gu.user_id = @id", new { id })).ToList();

        user.Permissions = (await conn.QueryAsync<UserPermissionRow>(
            @"SELECT us.screen_id, s.screen_code, s.screen_name, m.module_name,
                   us.is_view_permission, us.is_create_permission, us.is_edit_permission,
                   us.is_duplicate_permission, us.is_upload_permission, us.is_download_permission,
                   us.is_view_sensitive_info, us.is_access_sensitive_doc, us.is_approve_reject,
                   us.all_access
            FROM user_screen us
            JOIN app_screen s ON us.screen_id = s.id
            JOIN module     m ON s.module_id  = m.id
            WHERE us.user_id = @id", new { id })).ToList();

        return Ok(user);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.FirstName) ||
            string.IsNullOrWhiteSpace(req.LastName)  ||
            string.IsNullOrWhiteSpace(req.Email))
            return BadRequest(new { error = "firstName, lastName and email are required" });

        var conn = (NpgsqlConnection)dbContext.Database.GetDbConnection();
        await conn.OpenAsync();
        using var tx = await conn.BeginTransactionAsync();

        try
        {
            var userCode = await GenerateUserCode(conn, tx);

            var userId = await conn.QuerySingleAsync<long>(
                @"INSERT INTO ""user"" (
                    first_name, last_name, email, password_hash, is_active, client_id, created_on
                ) VALUES (
                    @firstName, @lastName, @email, @passwordHash, true, 1, now()
                ) RETURNING id",
                new
                {
                    firstName = req.FirstName,
                    lastName = req.LastName,
                    email = req.Email,
                    passwordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N")),
                },
                transaction: tx);

            await conn.ExecuteAsync(
                @"INSERT INTO user_extended (
                    id, user_id, user_code, status, status_toggle,
                    first_name, middle_name, last_name, suffix,
                    date_of_birth, gender, is_remote_working,
                    office_location, department, is_manager, reports_to,
                    address_line1, address_line2, country_code, state_code,
                    city, county, zip_code, latitude, longitude,
                    telephone_number, telephone_number_cc,
                    alt_telephone_number, alt_telephone_number_cc,
                    extension, bio, created_on
                ) VALUES (
                    @userId, @userId, @userCode, 'Active', true,
                    @firstName, @middleName, @lastName, @suffix,
                    @dateOfBirth, @gender, @isRemoteWorking,
                    @officeLocation, @department, @isManager, @reportsTo,
                    @addressLine1, @addressLine2, @countryCode, @stateCode,
                    @city, @county, @zipCode, @latitude, @longitude,
                    @telephoneNumber, @telephoneNumberCc,
                    @altTelephoneNumber, @altTelephoneNumberCc,
                    @extension, @bio, now()
                )",
                UserParameters(req, userId, userCode), transaction: tx);

            foreach (var gid in req.GroupIds)
                await conn.ExecuteAsync(
                    @"INSERT INTO group_user (user_id, group_id, client_id) VALUES (@userId, @gid, 1) ON CONFLICT DO NOTHING",
                    new { userId, gid }, tx);

            await InsertPermissions(conn, tx, userId, req.Permissions, upsert: true);
            await tx.CommitAsync();

            // The random password is intentionally never exposed. The onboarding link is
            // the supported way for the new user to choose a password. An SMTP failure
            // does not undo the already-valid user record; password reset remains available.
            try
            {
                await passwordReset.GenerateOnboardingTokenAsync(
                    userId, req.Email, req.Email, $"{req.FirstName} {req.LastName}".Trim(), "");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "User {UserId} was created, but the onboarding email could not be sent.", userId);
            }

            return StatusCode(201, new { id = userId, userCode });
        }
        catch (PostgresException ex) when (ex.SqlState == "23505")
        {
            await tx.RollbackAsync();
            return Conflict(new { error = "Email already exists" });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest req)
    {
        var conn = (NpgsqlConnection)dbContext.Database.GetDbConnection();
        await conn.OpenAsync();
        using var tx = await conn.BeginTransactionAsync();

        try
        {
            var parameters = UserParameters(req, id);
            var rows = await conn.ExecuteAsync(
                @"UPDATE ""user"" SET
                    first_name = @firstName,
                    last_name  = @lastName,
                    email      = @email
                WHERE id = @id",
                parameters, transaction: tx);

            if (rows == 0) { await tx.RollbackAsync(); return NotFound(new { error = "User not found" }); }

            await conn.ExecuteAsync(
                @"UPDATE user_extended SET
                    first_name               = @firstName,
                    middle_name              = @middleName,
                    last_name                = @lastName,
                    suffix                   = @suffix,
                    date_of_birth            = @dateOfBirth,
                    gender                   = @gender,
                    is_remote_working        = @isRemoteWorking,
                    office_location          = @officeLocation,
                    department               = @department,
                    is_manager               = @isManager,
                    reports_to               = @reportsTo,
                    address_line1            = @addressLine1,
                    address_line2            = @addressLine2,
                    country_code             = @countryCode,
                    state_code               = @stateCode,
                    city                     = @city,
                    county                   = @county,
                    zip_code                 = @zipCode,
                    latitude                 = @latitude,
                    longitude                = @longitude,
                    telephone_number         = @telephoneNumber,
                    telephone_number_cc      = @telephoneNumberCc,
                    alt_telephone_number     = @altTelephoneNumber,
                    alt_telephone_number_cc  = @altTelephoneNumberCc,
                    extension                = @extension,
                    bio                      = @bio,
                    updated_on               = now()
                WHERE user_id = @id",
                parameters, transaction: tx);

            await conn.ExecuteAsync(@"DELETE FROM group_user WHERE user_id = @id", new { id }, tx);
            foreach (var gid in req.GroupIds)
                await conn.ExecuteAsync(
                    @"INSERT INTO group_user (user_id, group_id, client_id) VALUES (@id, @gid, 1) ON CONFLICT DO NOTHING",
                    new { id, gid }, tx);

            await conn.ExecuteAsync("DELETE FROM user_screen WHERE user_id = @id", new { id }, tx);
            await InsertPermissions(conn, tx, id, req.Permissions, upsert: false);

            await tx.CommitAsync();
            return Ok(new { success = true });
        }
        catch (PostgresException ex) when (ex.SqlState == "23505")
        {
            await tx.RollbackAsync();
            return Conflict(new { error = "Email already exists" });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UserStatusUpdateRequest req)
    {
        if (req.Status is not ("Active" or "Inactive"))
            return BadRequest(new { error = "status must be Active or Inactive" });

        var conn = GetConnection();
        await conn.ExecuteAsync(
            @"UPDATE ""user"" SET is_active = @toggle WHERE id = @id;
              UPDATE user_extended
              SET status = @status, status_toggle = @toggle, updated_on = now()
              WHERE user_id = @id",
            new { id, status = req.Status, toggle = req.Status == "Active" });

        return Ok(new { success = true });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var conn = GetConnection();
        await conn.ExecuteAsync(
            @"UPDATE ""user"" SET is_active = false WHERE id = @id;
              UPDATE user_extended
              SET status = 'Inactive', status_toggle = false, updated_on = now()
              WHERE user_id = @id",
            new { id });
        return Ok(new { success = true });
    }

    private static async Task<string> GenerateUserCode(NpgsqlConnection conn, NpgsqlTransaction tx)
    {
        var last = await conn.QuerySingleOrDefaultAsync<string>(
            @"SELECT user_code FROM user_extended WHERE user_code LIKE 'IE%' AND LENGTH(user_code) = 6 ORDER BY user_code DESC LIMIT 1",
            transaction: tx);
        if (last is null) return "IE0001";
        if (!int.TryParse(last[2..], out var num)) return "IE0001";
        return "IE" + (num + 1).ToString("D4");
    }

    private static DynamicParameters UserParameters(CreateUserRequest req, long id, string? userCode = null)
    {
        var parameters = new DynamicParameters();
        parameters.Add("id", id);
        parameters.Add("userId", id);
        parameters.Add("userCode", userCode);
        parameters.Add("firstName", req.FirstName);
        parameters.Add("middleName", req.MiddleName);
        parameters.Add("lastName", req.LastName);
        parameters.Add("suffix", req.Suffix);
        parameters.Add("dateOfBirth", req.DateOfBirth);
        parameters.Add("gender", req.Gender);
        parameters.Add("isRemoteWorking", req.IsRemoteWorking);
        parameters.Add("officeLocation", req.OfficeLocation);
        parameters.Add("department", req.Department);
        parameters.Add("isManager", req.IsManager);
        parameters.Add("reportsTo", req.ReportsTo);
        parameters.Add("addressLine1", req.AddressLine1);
        parameters.Add("addressLine2", req.AddressLine2);
        parameters.Add("countryCode", req.CountryCode);
        parameters.Add("stateCode", req.StateCode);
        parameters.Add("city", req.City);
        parameters.Add("county", req.County);
        parameters.Add("zipCode", req.ZipCode);
        parameters.Add("latitude", req.Latitude);
        parameters.Add("longitude", req.Longitude);
        parameters.Add("telephoneNumber", req.TelephoneNumber);
        parameters.Add("telephoneNumberCc", req.TelephoneNumberCc);
        parameters.Add("altTelephoneNumber", req.AltTelephoneNumber);
        parameters.Add("altTelephoneNumberCc", req.AltTelephoneNumberCc);
        parameters.Add("email", req.Email);
        parameters.Add("extension", req.Extension);
        parameters.Add("bio", req.Bio);
        return parameters;
    }

    private static async Task InsertPermissions(
        NpgsqlConnection conn, NpgsqlTransaction tx,
        long userId, List<UserPermissionInput> permissions, bool upsert)
    {
        var onConflict = upsert
            ? @"ON CONFLICT (user_id, screen_id) DO UPDATE SET
                  is_view_permission      = EXCLUDED.is_view_permission,
                  is_create_permission    = EXCLUDED.is_create_permission,
                  is_edit_permission      = EXCLUDED.is_edit_permission,
                  is_duplicate_permission = EXCLUDED.is_duplicate_permission,
                  is_upload_permission    = EXCLUDED.is_upload_permission,
                  is_download_permission  = EXCLUDED.is_download_permission,
                  is_view_sensitive_info  = EXCLUDED.is_view_sensitive_info,
                  is_access_sensitive_doc = EXCLUDED.is_access_sensitive_doc,
                  is_approve_reject       = EXCLUDED.is_approve_reject,
                  all_access              = EXCLUDED.all_access"
            : "";

        foreach (var p in permissions)
            await conn.ExecuteAsync(
                $@"INSERT INTO user_screen (
                    user_id, screen_id,
                    is_view_permission, is_create_permission, is_edit_permission,
                    is_duplicate_permission, is_upload_permission, is_download_permission,
                    is_view_sensitive_info, is_access_sensitive_doc, is_approve_reject, all_access
                ) VALUES (
                    @userId, @screenId,
                    @isView, @isCreate, @isEdit,
                    @isDuplicate, @isUpload, @isDownload,
                    @isViewSensitive, @isAccessDoc, @isApprove, @allAccess
                ) {onConflict}",
                new
                {
                    userId,
                    screenId         = p.ScreenId,
                    isView           = p.IsViewPermission,
                    isCreate         = p.IsCreatePermission,
                    isEdit           = p.IsEditPermission,
                    isDuplicate      = p.IsDuplicatePermission,
                    isUpload         = p.IsUploadPermission,
                    isDownload       = p.IsDownloadPermission,
                    isViewSensitive  = p.IsViewSensitiveInfo,
                    isAccessDoc      = p.IsAccessSensitiveDoc,
                    isApprove        = p.IsApproveReject,
                    allAccess        = p.AllAccess,
                }, transaction: tx);
    }
}
