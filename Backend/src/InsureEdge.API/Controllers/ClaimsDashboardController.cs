using Dapper;
using InsureEdge.Application.Interfaces;
using InsureEdge.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/claims/dashboard")]
[Authorize]
public class ClaimsDashboardController(InsureEdgeDbContext dbContext, ICurrentTenantService tenant) : ControllerBase
{
    private System.Data.IDbConnection GetConnection()
    {
        var conn = dbContext.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
            conn.Open();
        return conn;
    }

    /// <summary>FNOL Reported by Month — count of non-DRAFT claims grouped by month of creation.</summary>
    [HttpGet("fnol-by-month")]
    public async Task<IActionResult> GetFnolByMonth()
    {
        var clientId = tenant.ClientId;
        var rows = await GetConnection().QueryAsync(
            @"SELECT
                TRIM(TO_CHAR(created_on, 'Month')) AS month,
                EXTRACT(MONTH FROM created_on)::int  AS month_num,
                EXTRACT(YEAR  FROM created_on)::int  AS year,
                COUNT(*)::int                         AS count
              FROM claim
              WHERE client_id = @clientId
                AND status != 'DRAFT'
              GROUP BY month, month_num, year
              ORDER BY year, month_num",
            new { clientId });
        return Ok(rows);
    }

    /// <summary>Average Claim Handled — count of closed/handled claims grouped by month of closure date.</summary>
    [HttpGet("avg-claim-handled")]
    public async Task<IActionResult> GetAvgClaimHandled()
    {
        var clientId = tenant.ClientId;
        var rows = await GetConnection().QueryAsync(
            @"SELECT
                TRIM(TO_CHAR(claim_closure_date, 'Month')) AS month,
                EXTRACT(MONTH FROM claim_closure_date)::int  AS month_num,
                EXTRACT(YEAR  FROM claim_closure_date)::int  AS year,
                COUNT(*)::int                                 AS count
              FROM claim
              WHERE client_id = @clientId
                AND claim_closure_date IS NOT NULL
              GROUP BY month, month_num, year
              ORDER BY year, month_num",
            new { clientId });
        return Ok(rows);
    }

    /// <summary>Top 10 Cause of Loss — top 10 main_cause_of_loss by claim count for a given YYYY-MM period.</summary>
    [HttpGet("top-cause-of-loss")]
    public async Task<IActionResult> GetTopCauseOfLoss([FromQuery] string period)
    {
        var clientId = tenant.ClientId;
        var rows = await GetConnection().QueryAsync(
            @"SELECT
                COALESCE(main_cause_of_loss, 'Unknown') AS cause_of_loss,
                COUNT(id)::int                           AS count
              FROM claim
              WHERE client_id = @clientId
                AND status != 'DRAFT'
                AND created_on IS NOT NULL
                AND TO_CHAR(created_on, 'YYYY-MM') = @period
              GROUP BY main_cause_of_loss
              ORDER BY count DESC
              LIMIT 10",
            new { clientId, period });
        return Ok(rows);
    }

    /// <summary>Claim by LOB — count of claims grouped by policy LOB for a given YYYY-MM period.</summary>
    [HttpGet("claim-by-lob")]
    public async Task<IActionResult> GetClaimByLob([FromQuery] string period)
    {
        var clientId = tenant.ClientId;
        var rows = await GetConnection().QueryAsync(
            @"SELECT
                COALESCE(p.lob, 'Unknown') AS lob,
                COUNT(c.id)::int            AS count
              FROM claim c
              LEFT JOIN policy p ON c.policy_id = p.id
              WHERE c.client_id = @clientId
                AND c.status != 'DRAFT'
                AND c.created_on IS NOT NULL
                AND TO_CHAR(c.created_on, 'YYYY-MM') = @period
              GROUP BY p.lob
              ORDER BY count DESC",
            new { clientId, period });
        return Ok(rows);
    }

    /// <summary>Shared month list — distinct months with non-DRAFT claims, for dropdowns.</summary>
    [HttpGet("months")]
    public async Task<IActionResult> GetChartMonths()
    {
        var clientId = tenant.ClientId;
        var rows = await GetConnection().QueryAsync(
            @"SELECT DISTINCT
                TRIM(TO_CHAR(created_on, 'Month')) || ' ' || EXTRACT(YEAR FROM created_on)::text AS label,
                TO_CHAR(created_on, 'YYYY-MM') AS value
              FROM claim
              WHERE client_id = @clientId
                AND status != 'DRAFT'
              ORDER BY value",
            new { clientId });
        return Ok(rows);
    }

    /// <summary>Claim Approval Trend — distinct months with claims, for the month dropdown.</summary>
    [HttpGet("approval-trend/months")]
    public async Task<IActionResult> GetApprovalMonths()
    {
        var clientId = tenant.ClientId;
        var rows = await GetConnection().QueryAsync(
            @"SELECT DISTINCT
                TRIM(TO_CHAR(created_on, 'Month')) || ' ' || EXTRACT(YEAR FROM created_on)::text AS label,
                TO_CHAR(created_on, 'YYYY-MM') AS value
              FROM claim
              WHERE client_id = @clientId
                AND status != 'DRAFT'
              ORDER BY value",
            new { clientId });
        return Ok(rows);
    }

    /// <summary>Claim Approval Trend — count of claims by status for a given YYYY-MM period.</summary>
    [HttpGet("approval-trend")]
    public async Task<IActionResult> GetApprovalTrend([FromQuery] string period)
    {
        var clientId = tenant.ClientId;
        var rows = await GetConnection().QueryAsync(
            @"SELECT
                status,
                COUNT(*)::int AS count
              FROM claim
              WHERE client_id = @clientId
                AND status != 'DRAFT'
                AND TO_CHAR(created_on, 'YYYY-MM') = @period
              GROUP BY status
              ORDER BY status",
            new { clientId, period });
        return Ok(rows);
    }

    /// <summary>Average TAT of Claim — average days from created_on to claim_closure_date, per month.</summary>
    [HttpGet("avg-tat")]
    public async Task<IActionResult> GetAvgTat()
    {
        var clientId = tenant.ClientId;
        var rows = await GetConnection().QueryAsync(
            @"SELECT
                TRIM(TO_CHAR(created_on, 'Month'))  AS month,
                EXTRACT(MONTH FROM created_on)::int  AS month_num,
                EXTRACT(YEAR  FROM created_on)::int  AS year,
                ROUND(AVG(
                    EXTRACT(EPOCH FROM (claim_closure_date - created_on)) / 86400.0
                ))::int AS avg_days
              FROM claim
              WHERE client_id = @clientId
                AND status != 'DRAFT'
                AND claim_closure_date IS NOT NULL
              GROUP BY month, month_num, year
              ORDER BY year, month_num",
            new { clientId });
        return Ok(rows);
    }

    /// <summary>Average Claim Paid — average of claim_estimate amounts per month.</summary>
    [HttpGet("avg-claim-paid")]
    public async Task<IActionResult> GetAvgClaimPaid()
    {
        var clientId = tenant.ClientId;
        var rows = await GetConnection().QueryAsync(
            @"SELECT
                TRIM(TO_CHAR(created_on, 'Month'))  AS month,
                EXTRACT(MONTH FROM created_on)::int  AS month_num,
                EXTRACT(YEAR  FROM created_on)::int  AS year,
                ROUND(AVG(
                    CASE
                        WHEN claim_estimate IS NOT NULL
                         AND claim_estimate ~ '^[0-9]+(\.[0-9]+)?$'
                        THEN claim_estimate::NUMERIC
                        ELSE 0
                    END
                ))::bigint AS amount
              FROM claim
              WHERE client_id = @clientId
                AND status != 'DRAFT'
              GROUP BY month, month_num, year
              ORDER BY year, month_num",
            new { clientId });
        return Ok(rows);
    }

    // ── KPI summary cards ─────────────────────────────────────────────────

    /// <summary>KPI counts: total, unassigned, open, pending, referred non-DRAFT claims.</summary>
    [HttpGet("kpis")]
    public async Task<IActionResult> GetKpis()
    {
        var clientId = tenant.ClientId;
        var row = await GetConnection().QueryFirstAsync(
            @"SELECT
                COUNT(*)                                             AS total,
                COUNT(*) FILTER (WHERE assigned_to IS NULL)         AS unassigned,
                COUNT(*) FILTER (WHERE status = 'OPEN')             AS open,
                COUNT(*) FILTER (WHERE status = 'PENDING')          AS pending,
                COUNT(*) FILTER (WHERE status = 'REFERRED')         AS referred
              FROM claim
              WHERE client_id = @clientId AND status != 'DRAFT'",
            new { clientId });
        return Ok(row);
    }

    // ── Widget: FNOL Reported (last 5 non-draft) ──────────────────────────

    /// <summary>Last 5 non-DRAFT claims for the FNOL Reported widget.</summary>
    [HttpGet("recent-fnol")]
    public async Task<IActionResult> GetRecentFnol()
    {
        var clientId = tenant.ClientId;
        var rows = await GetConnection().QueryAsync(
            @"SELECT
                c.id,
                COALESCE(c.claim_number, '')         AS claim_number,
                COALESCE(p.policy_number, '')         AS policy_number,
                COALESCE(c.claim_type, '')            AS claim_type,
                COALESCE('USD ' || c.claim_estimate, 'USD 0.00') AS claim_estimate
              FROM claim c
              LEFT JOIN policy p ON c.policy_id = p.id
              WHERE c.client_id = @clientId AND c.status != 'DRAFT'
              ORDER BY c.created_on DESC
              LIMIT 5",
            new { clientId });
        return Ok(rows);
    }

    // ── Widget: Assigned Claims (last 5 assigned to current user) ─────────

    /// <summary>Last 5 claims assigned to the current user for the Assigned Claims widget.</summary>
    [HttpGet("assigned")]
    public async Task<IActionResult> GetAssigned()
    {
        var clientId = tenant.ClientId;
        var userId   = tenant.UserId;
        var rows = await GetConnection().QueryAsync(
            @"SELECT
                c.id,
                COALESCE(c.claim_number, '')                     AS claim_number,
                COALESCE(p.policy_number, '')                    AS policy_number,
                COALESCE(c.claim_type, '')                       AS claim_type,
                COALESCE('USD ' || c.claim_estimate, 'USD 0.00') AS claim_incurred
              FROM claim c
              LEFT JOIN policy p ON c.policy_id = p.id
              WHERE c.client_id = @clientId
                AND c.status != 'DRAFT'
                AND c.assigned_to = @userId
              ORDER BY c.created_on DESC
              LIMIT 5",
            new { clientId, userId });
        return Ok(rows);
    }

    // ── Widget: Notifications (recent claim documents) ─────────────────────

    /// <summary>Last 5 claim documents for the Notifications &amp; Alerts widget.</summary>
    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications()
    {
        var clientId = tenant.ClientId;
        var rows = await GetConnection().QueryAsync(
            @"SELECT
                d.claim_id,
                COALESCE(c.claim_number, '')  AS claim_number,
                COALESCE(p.policy_number, '') AS policy_number,
                COALESCE(c.claim_type, '')    AS claim_type,
                d.file_name                   AS message
              FROM claim_document d
              JOIN  claim  c ON d.claim_id  = c.id
              LEFT JOIN policy p ON c.policy_id = p.id
              WHERE d.client_id = @clientId
              ORDER BY d.created_on DESC
              LIMIT 5",
            new { clientId });
        return Ok(rows);
    }

    // ── Widget: Notes (recent claim tasks) ────────────────────────────────

    /// <summary>Last 5 claim tasks for the Notes widget.</summary>
    [HttpGet("notes")]
    public async Task<IActionResult> GetNotes()
    {
        var clientId = tenant.ClientId;
        var rows = await GetConnection().QueryAsync(
            @"SELECT
                t.claim_id,
                COALESCE(c.claim_number, '')                    AS claim_number,
                COALESCE(p.policy_number, '')                   AS policy_number,
                COALESCE(c.claim_type, '')                      AS claim_type,
                COALESCE(t.task_description, t.comments, '-')  AS message
              FROM claim_task t
              JOIN  claim  c ON t.claim_id  = c.id
              LEFT JOIN policy p ON c.policy_id = p.id
              WHERE t.client_id = @clientId
              ORDER BY t.created_on DESC
              LIMIT 5",
            new { clientId });
        return Ok(rows);
    }

    // ── Claim Aging ───────────────────────────────────────────────────────

    /// <summary>Open claim aging bucketed by days, one row per assigned user.</summary>
    [HttpGet("aging")]
    public async Task<IActionResult> GetAging()
    {
        var clientId = tenant.ClientId;
        var rows = await GetConnection().QueryAsync(
            @"SELECT
                ROW_NUMBER() OVER (ORDER BY u.first_name, u.last_name) AS index,
                COALESCE(u.first_name || ' ' || u.last_name, 'Unassigned')     AS user_name,
                UPPER(COALESCE(LEFT(u.first_name,1) || LEFT(u.last_name,1), '?')) AS initials,
                COUNT(*) FILTER (WHERE NOW() - c.created_on < INTERVAL '3 days')  AS lt3,
                COUNT(*) FILTER (WHERE NOW() - c.created_on < INTERVAL '5 days')  AS lt5,
                COUNT(*) FILTER (WHERE NOW() - c.created_on < INTERVAL '10 days') AS lt10,
                COUNT(*) FILTER (WHERE NOW() - c.created_on < INTERVAL '15 days') AS lt15,
                COUNT(*) FILTER (WHERE NOW() - c.created_on < INTERVAL '20 days') AS lt20,
                COUNT(*) FILTER (WHERE NOW() - c.created_on < INTERVAL '25 days') AS lt25,
                COUNT(*) FILTER (WHERE NOW() - c.created_on < INTERVAL '30 days') AS lt30
              FROM claim c
              LEFT JOIN ""user"" u ON c.assigned_to = u.id
              WHERE c.client_id = @clientId AND c.status = 'OPEN'
              GROUP BY u.id, u.first_name, u.last_name",
            new { clientId });
        return Ok(rows);
    }
}
