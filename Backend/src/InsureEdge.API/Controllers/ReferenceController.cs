using Dapper;
using InsureEdge.API.Models;
using InsureEdge.Application.Interfaces;
using InsureEdge.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/reference")]
[Authorize]
public class ReferenceController(InsureEdgeDbContext dbContext, ICurrentTenantService tenant) : ControllerBase
{
    private System.Data.IDbConnection GetConnection()
    {
        var conn = dbContext.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
            conn.Open();
        return conn;
    }

    [HttpGet("countries")]
    public async Task<IActionResult> GetCountries()
    {
        var rows = await GetConnection().QueryAsync<ReferenceCountryRow>(
            "SELECT code, name, country_dial_code FROM country ORDER BY name");
        return Ok(rows);
    }

    [HttpGet("states")]
    public async Task<IActionResult> GetStates([FromQuery] string? country_code)
    {
        if (string.IsNullOrWhiteSpace(country_code))
            return BadRequest(new { error = "country_code is required" });
        var rows = await GetConnection().QueryAsync<ReferenceStateRow>(
            "SELECT code, name, abbreviation FROM state WHERE country_code = @country_code ORDER BY name",
            new { country_code });
        return Ok(rows);
    }

    [HttpGet("groups")]
    public async Task<IActionResult> GetGroups()
    {
        var rows = await GetConnection().QueryAsync<ReferenceGroupRow>(
            @"SELECT id, group_code, group_name FROM ""group"" WHERE LOWER(status) = 'active' ORDER BY group_name");
        return Ok(rows);
    }

    [HttpGet("modules")]
    public async Task<IActionResult> GetModules()
    {
        var conn = GetConnection();
        var modules = (await conn.QueryAsync<ReferenceModuleRow>(
            "SELECT id, module_name FROM module ORDER BY sort_order")).ToList();
        var screens = (await conn.QueryAsync<ReferenceScreenRow>(
            "SELECT id, screen_code, screen_name, module_id FROM app_screen ORDER BY id")).ToList();
        foreach (var m in modules)
            m.Screens = screens.Where(s => s.ModuleId == m.Id).ToList();
        return Ok(modules);
    }

    [HttpGet("managers")]
    public async Task<IActionResult> GetManagers()
    {
        var rows = await GetConnection().QueryAsync<ReferenceManagerRow>(
            @"SELECT u.id, ue.user_code,
                     COALESCE(ue.first_name, u.first_name) AS first_name,
                     COALESCE(ue.last_name, u.last_name) AS last_name,
                     u.email
              FROM ""user"" u
              JOIN user_extended ue ON ue.user_id = u.id
              WHERE ue.status = 'Active' AND ue.user_code IS NOT NULL
              ORDER BY first_name, last_name");
        return Ok(rows);
    }

    [HttpGet("office-locations")]
    public async Task<IActionResult> GetOfficeLocations()
    {
        var clientId = tenant.ClientId;
        var conn = GetConnection();
        var rows = (await conn.QueryAsync<ReferenceOptionRow>(
            @"SELECT address_type AS value,
                     CASE
                       WHEN NULLIF(BTRIM(address_line1), '') IS NULL THEN address_type
                       ELSE CONCAT(
                         address_type, ' - ', address_line1,
                         CASE
                           WHEN NULLIF(BTRIM(CONCAT_WS(' ', NULLIF(BTRIM(city), ''), NULLIF(BTRIM(zip_code), ''))), '') IS NULL THEN ''
                           ELSE CONCAT(', ', CONCAT_WS(' ', NULLIF(BTRIM(city), ''), NULLIF(BTRIM(zip_code), '')))
                         END)
                     END AS label
              FROM client_address
              WHERE client_id = @clientId
                AND address_type IS NOT NULL
              ORDER BY CASE address_type WHEN 'Legal' THEN 0 WHEN 'Mailing' THEN 1 ELSE 2 END, address_type",
            new { clientId })).ToList();

        // Keep separately configured offices available alongside the client's
        // Legal/Mailing addresses. The value remains the office name so existing
        // create/update payloads and persisted user values are unchanged.
        rows.AddRange(await conn.QueryAsync<ReferenceOptionRow>(
            @"SELECT office_name AS value,
                     CASE
                       WHEN NULLIF(BTRIM(address_line1), '') IS NULL THEN office_name
                       ELSE CONCAT(
                         office_name, ' - ', address_line1,
                         CASE
                           WHEN NULLIF(BTRIM(CONCAT_WS(' ', NULLIF(BTRIM(city), ''), NULLIF(BTRIM(zip_code), ''))), '') IS NULL THEN ''
                           ELSE CONCAT(', ', CONCAT_WS(' ', NULLIF(BTRIM(city), ''), NULLIF(BTRIM(zip_code), '')))
                         END)
                     END AS label
              FROM client_office
              WHERE client_id = @clientId
                AND office_name IS NOT NULL
              ORDER BY office_name",
            new { clientId }));

        // Include any legacy selections not present in the current client setup,
        // so an existing user's value still displays and can be saved unchanged.
        rows.AddRange(await conn.QueryAsync<ReferenceOptionRow>(
            @"SELECT DISTINCT ue.office_location AS value, ue.office_location AS label
              FROM user_extended ue
              INNER JOIN ""user"" u ON u.id = ue.user_id
              WHERE u.client_id = @clientId
                AND ue.office_location IS NOT NULL
              ORDER BY ue.office_location",
            new { clientId }));

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var options = rows.Where(r => !string.IsNullOrWhiteSpace(r.Value) && seen.Add(r.Value)).ToList();
        return Ok(options);
    }

    [HttpGet("office-locations/address")]
    public async Task<IActionResult> GetOfficeAddress([FromQuery] string location)
    {
        if (string.IsNullOrWhiteSpace(location))
            return BadRequest(new { error = "location is required" });
        var clientId = tenant.ClientId;
        var row = await GetConnection().QueryFirstOrDefaultAsync<OfficeAddressRow>(
            @"SELECT address_line1, address_line2, country AS country_code, state AS state_code,
                     city, county, zip_code, latitude, longitude
              FROM client_address
              WHERE client_id = @clientId AND address_type = @location
              LIMIT 1", new { clientId, location });
        if (row == null)
        {
            row = await GetConnection().QueryFirstOrDefaultAsync<OfficeAddressRow>(
            @"SELECT address_line1, address_line2, country AS country_code, state AS state_code,
                     city, county, zip_code, latitude, longitude
              FROM client_office
              WHERE client_id = @clientId AND office_name = @location
              LIMIT 1", new { clientId, location });
        }
        if (row == null)
        {
            // fallback: use address from user record
            row = await GetConnection().QueryFirstOrDefaultAsync<OfficeAddressRow>(
                @"SELECT address_line1, address_line2, country_code, state_code, city, county, zip_code, latitude, longitude
                  FROM user_extended
                  WHERE office_location = @location AND address_line1 IS NOT NULL
                  LIMIT 1", new { location });
        }
        if (row == null) return Ok(null);
        return Ok(row);
    }

    private sealed class OfficeAddressRow
    {
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? CountryCode { get; set; }
        public string? StateCode { get; set; }
        public string? City { get; set; }
        public string? County { get; set; }
        public string? ZipCode { get; set; }
        public string? Latitude { get; set; }
        public string? Longitude { get; set; }
    }

    [HttpGet("departments")]
    public async Task<IActionResult> GetDepartments()
    {
        var rows = await GetConnection().QueryAsync<string>(
            @"SELECT DISTINCT department FROM user_extended WHERE department IS NOT NULL ORDER BY department");
        return Ok(rows.Select(r => new ReferenceOptionRow { Value = r, Label = r }));
    }

    [HttpGet("groups/{groupId}/permissions")]
    public async Task<IActionResult> GetGroupPermissions(int groupId)
    {
        var rows = await GetConnection().QueryAsync(
            @"SELECT us.screen_id, us.is_view_permission, us.is_create_permission, us.is_edit_permission,
                     us.is_duplicate_permission, us.is_upload_permission, us.is_download_permission,
                     us.is_view_sensitive_info, us.is_access_sensitive_doc, us.is_approve_reject
              FROM user_screen us
              INNER JOIN group_user gu ON gu.user_id = us.user_id
              WHERE gu.group_id = @groupId
              LIMIT 1000",
            new { groupId });
        return Ok(rows);
    }
}
