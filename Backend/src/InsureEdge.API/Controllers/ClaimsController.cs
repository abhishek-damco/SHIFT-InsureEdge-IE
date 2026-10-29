// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Claims Enquiry API — screens: CLAIMENQUIRYSCREEN, FNOLREGSCREEN
// ADR-003: PermissionAttribute guards all endpoints.
// BR-CLM-001: enquiry list excludes DRAFT.
// BR-CLM-002: all endpoints scoped by session clientId.
using InsureEdge.API.Filters;
using InsureEdge.Application.DTOs.Claim;
using InsureEdge.Application.Services;
using InsureEdge.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/claims")]
[Authorize]
public class ClaimsController : ControllerBase
{
    private readonly ClaimService _claims;

    public ClaimsController(ClaimService claims) => _claims = claims;

    // ── Claims Enquiry ──────────────────────────────────────────────────────

    /// <summary>CS-148: Paginated claims enquiry grid (excludes DRAFT).</summary>
    [HttpGet]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetEnquiryList([FromQuery] string? search)
    {
        var (items, total, open, unassigned, pending, referred) = await _claims.GetEnquiryListAsync(search);
        return Ok(new ClaimEnquiryResponse(items, total, open, unassigned, pending, referred));
    }


    /// <summary>Export claims enquiry rows.</summary>
    [HttpGet("export")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.Download)]
    public async Task<IActionResult> Export([FromQuery] string format = "csv", [FromQuery] string? search = null)
    {
        var bytes = await _claims.ExportAsync(format, search, null);
        return File(bytes, "text/csv", $"claims.{format.ToLower()}");
    }

    /// <summary>Export selected claims enquiry rows.</summary>
    [HttpPost("export/selected")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.Download)]
    public async Task<IActionResult> ExportSelected([FromBody] ClaimExportSelectedRequest req)
    {
        var bytes = await _claims.ExportAsync(req.Format, null, req.Ids);
        return File(bytes, "text/csv", $"claims.{req.Format.ToLower()}");
    }
    // ── FNOL Policy Search (Step 1) ─────────────────────────────────────────

    /// <summary>Search policies for FNOL step 1 grid.</summary>
    [HttpGet("policies")]
    [Permission("FNOLREGSCREEN", PermissionType.View)]
    public async Task<IActionResult> SearchPolicies(
        [FromQuery] string? search,
        [FromQuery] string? searchField,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var (items, total) = await _claims.SearchPoliciesAsync(search, searchField, page, pageSize);
        return Ok(new PolicySearchResponse(items, total));
    }

    // ── Policy Claims Modal (Step 1 → Modal) ────────────────────────────────

    /// <summary>In-progress (DRAFT) + existing (non-DRAFT) claims for a policy.</summary>
    [HttpGet("policies/{policyId:long}/claims")]
    [Permission("FNOLREGSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetPolicyClaims(long policyId)
    {
        try
        {
            return Ok(await _claims.GetPolicyClaimsAsync(policyId));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // ── Policy Details (Step 2) ─────────────────────────────────────────────

    /// <summary>Insured, Policy, Risk Location details for Step 2 accordions.</summary>
    [HttpGet("policies/{policyId:long}/details")]
    [Permission("FNOLREGSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetPolicyDetails(long policyId)
    {
        var result = await _claims.GetPolicyDetailsAsync(policyId);
        return result == null ? NotFound() : Ok(result);
    }

    // ── Claim CRUD ──────────────────────────────────────────────────────────

    /// <summary>Get full claim detail (resume FNOL or view summary).</summary>
    [HttpGet("{id:long}")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetById(long id)
    {
        var result = await _claims.GetClaimByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    /// <summary>Get full claim detail while creating or resuming an FNOL.</summary>
    [HttpGet("fnol/{id:long}")]
    [Permission("FNOLREGSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetFnolById(long id)
    {
        var result = await _claims.GetClaimByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    /// <summary>CS-19: Create or update claim (Step 3 Next persists + generates claim number).</summary>
    [HttpPost]
    [Permission("FNOLREGSCREEN", PermissionType.Add)]
    public async Task<IActionResult> CreateOrUpdate([FromBody] CreateOrUpdateClaimRequest req)
    {
        try
        {
            var id = await _claims.CreateOrUpdateAsync(req);
            var saved = await _claims.GetClaimByIdAsync(id);
            return Ok(new
            {
                id,
                claimNumber = saved?.ClaimNumber,
                status = saved?.Status,
                lastStepNumber = saved?.LastStepNumber
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>Delete a DRAFT (in-progress FNOL — modal delete button).</summary>
    [HttpDelete("{id:long}/draft")]
    [Permission("FNOLREGSCREEN", PermissionType.Edit)]
    public async Task<IActionResult> DeleteDraft(long id)
    {
        try
        {
            await _claims.DeleteDraftAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }


    // Claim workflow persistence

    [HttpPut("{id:long}/assignment")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.Edit)]
    public async Task<IActionResult> UpdateAssignment(long id, [FromBody] UpdateClaimAssignmentRequest req)
    {
        try
        {
            return Ok(await _claims.UpdateAssignmentAsync(id, req));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet("{id:long}/documents")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetDocuments(long id)
    {
        try
        {
            return Ok(await _claims.GetDocumentsAsync(id));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPost("{id:long}/documents")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.Add)]
    public async Task<IActionResult> AddDocument(long id, [FromBody] CreateClaimDocumentRequest req)
    {
        try
        {
            return Ok(await _claims.AddDocumentAsync(id, req));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet("{id:long}/documents/{documentId:long}/file")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetDocumentFile(long id, long documentId)
    {
        var doc = await _claims.GetDocumentFileAsync(id, documentId);
        if (doc == null || doc.Content == null) return NotFound();
        return File(doc.Content, doc.ContentType ?? "application/octet-stream", doc.FileName);
    }

    [HttpDelete("{id:long}/documents/{documentId:long}")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.Edit)]
    public async Task<IActionResult> DeleteDocument(long id, long documentId)
    {
        try
        {
            await _claims.DeleteDocumentAsync(id, documentId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet("{id:long}/temp-reports")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetTempReports(long id) => Ok(await _claims.GetTempClaimReportsAsync(id));

    [HttpPost("{id:long}/temp-reports")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.Add)]
    public async Task<IActionResult> UpsertTempReport(long id, [FromBody] UpsertTempClaimReportRequest req) => Ok(await _claims.UpsertTempClaimReportAsync(id, req));

    [HttpDelete("{id:long}/temp-reports/{rowId:long}")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.Edit)]
    public async Task<IActionResult> DeleteTempReport(long id, long rowId)
    {
        await _claims.DeleteTempClaimReportAsync(id, rowId);
        return NoContent();
    }

    [HttpGet("{id:long}/temp-parties")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetTempParties(long id) => Ok(await _claims.GetTempClaimPartiesAsync(id));

    [HttpPost("{id:long}/temp-parties")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.Add)]
    public async Task<IActionResult> UpsertTempParty(long id, [FromBody] UpsertTempClaimPartyRequest req) => Ok(await _claims.UpsertTempClaimPartyAsync(id, req));

    [HttpDelete("{id:long}/temp-parties/{rowId:long}")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.Edit)]
    public async Task<IActionResult> DeleteTempParty(long id, long rowId)
    {
        await _claims.DeleteTempClaimPartyAsync(id, rowId);
        return NoContent();
    }

    [HttpGet("{id:long}/temp-witnesses")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetTempWitnesses(long id) => Ok(await _claims.GetTempClaimWitnessesAsync(id));

    [HttpPost("{id:long}/temp-witnesses")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.Add)]
    public async Task<IActionResult> UpsertTempWitness(long id, [FromBody] UpsertTempClaimWitnessRequest req) => Ok(await _claims.UpsertTempClaimWitnessAsync(id, req));

    [HttpDelete("{id:long}/temp-witnesses/{rowId:long}")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.Edit)]
    public async Task<IActionResult> DeleteTempWitness(long id, long rowId)
    {
        await _claims.DeleteTempClaimWitnessAsync(id, rowId);
        return NoContent();
    }

    [HttpGet("{id:long}/loss-exposures")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetLossExposures(long id)
        => Ok(await _claims.GetLossExposuresAsync(id));

    [HttpGet("{id:long}/loss-exposures/form-data")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetLossExposureFormData(long id)
        => Ok(await _claims.GetLossExposureFormDataAsync(id));

    [HttpPost("{id:long}/loss-exposures")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.Add)]
    public async Task<IActionResult> CreateLossExposure(long id, [FromBody] CreateLossExposureRequest req)
    {
        try
        {
            return Ok(await _claims.CreateLossExposureAsync(id, req));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id:long}/loss-exposures/{rowId:long}")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.Edit)]
    public async Task<IActionResult> DeleteLossExposure(long id, long rowId)
    {
        await _claims.DeleteLossExposureAsync(id, rowId);
        return NoContent();
    }
    // Reference Data ──────────────────────────────────────────────────────

    /// <summary>All dropdown reference data needed for the FNOL form and worksheet.</summary>
    [HttpGet("reference-data")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetReferenceData()
    {
        var result = await _claims.GetReferenceDataAsync();
        return Ok(result);
    }

    [HttpGet("fnol/{id:long}/documents")]
    [Permission("FNOLREGSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetFnolDocuments(long id)
    {
        try
        {
            return Ok(await _claims.GetDocumentsAsync(id));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPost("fnol/{id:long}/documents")]
    [Permission("FNOLREGSCREEN", PermissionType.Add)]
    public async Task<IActionResult> AddFnolDocument(long id, [FromBody] CreateClaimDocumentRequest req)
    {
        try
        {
            return Ok(await _claims.AddDocumentAsync(id, req));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>FNOL-specific reference data access without granting Claims Inquiry.</summary>
    [HttpGet("fnol/reference-data")]
    [Permission("FNOLREGSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetFnolReferenceData()
    {
        var result = await _claims.GetReferenceDataAsync();
        return Ok(result);
    }

    /// <summary>Impacted asset types available for a coverage (from claim_coverage_limit).</summary>
    [HttpGet("coverage/{coverageId:long}/assets")]
    [Permission("FNOLREGSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetImpactedAssets(long coverageId)
    {
        var result = await _claims.GetImpactedAssetsForCoverageAsync(coverageId);
        return Ok(result);
    }

    /// <summary>Coverage limit from claim_coverage master (auto-fills worksheet Coverage Limit).</summary>
    [HttpGet("coverage/{coverageId:long}/coverage-limit")]
    [Permission("FNOLREGSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetCoverageLimit(long coverageId)
    {
        var limit = await _claims.GetCoverageLimitAsync(coverageId);
        return Ok(new { limit });
    }

    /// <summary>Loss limit from cause_of_loss_description (auto-fills worksheet Loss Limit).</summary>
    [HttpGet("coverage/{colId:long}/loss-limit")]
    [Permission("FNOLREGSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetColLossLimit(long colId)
    {
        var (limit, code) = await _claims.GetColLossLimitAsync(colId);
        return Ok(new { limit, code });
    }

    /// <summary>Asset limit and claim code from claim_coverage_limit (auto-fills worksheet Impacted Asset fields).</summary>
    [HttpGet("coverage/{coverageId:long}/asset-detail")]
    [Permission("FNOLREGSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetAssetDetail(long coverageId, [FromQuery] string assetType)
    {
        var (limit, code) = await _claims.GetAssetDetailAsync(coverageId, assetType);
        return Ok(new { limit, code });
    }

    /// <summary>Users available to assign claims to, filtered by optional search term.</summary>
    [HttpGet("assignable-users")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.Edit)]
    public async Task<IActionResult> GetAssignableUsers([FromQuery] string? search)
    {
        var result = await _claims.GetAssignableUsersAsync(search);
        return Ok(result);
    }

    // ── Claims Authority ────────────────────────────────────────────────────

    /// <summary>Authority list for the Claims Authority screen.</summary>
    [HttpGet("authority")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetAuthorityList([FromQuery] string? search)
    {
        var result = await _claims.GetAuthorityListAsync(search);
        return Ok(result);
    }

    /// <summary>Create a new claim authority for a user.</summary>
    [HttpPost("authority")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.Edit)]
    public async Task<IActionResult> CreateAuthority([FromBody] CreateClaimAuthorityRequest req)
    {
        var userId = long.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var id = await _claims.CreateAuthorityAsync(req, userId);
        return StatusCode(201, new { id });
    }

    /// <summary>Single authority detail for the view/edit screen.</summary>
    [HttpGet("authority/{id:long}")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetAuthorityDetail(long id)
    {
        var result = await _claims.GetAuthorityDetailAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Update editable authority fields.</summary>
    [HttpPut("authority/{id:long}")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.Edit)]
    public async Task<IActionResult> UpdateAuthority(long id, [FromBody] UpdateClaimAuthorityRequest req)
    {
        var userId = long.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var ok = await _claims.UpdateAuthorityAsync(id, req, userId);
        return ok ? Ok(new { success = true }) : NotFound();
    }

    /// <summary>Approve a claim authority.</summary>
    [HttpPost("authority/{id:long}/approve")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.Edit)]
    public async Task<IActionResult> ApproveAuthority(long id)
    {
        var userId = long.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var ok = await _claims.ApproveAuthorityAsync(id, userId);
        return ok ? Ok(new { success = true }) : NotFound();
    }

    /// <summary>Revoke a claim authority.</summary>
    [HttpPost("authority/{id:long}/revoke")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.Edit)]
    public async Task<IActionResult> RevokeAuthority(long id)
    {
        var userId = long.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var ok = await _claims.RevokeAuthorityAsync(id, userId);
        return ok ? Ok(new { success = true }) : NotFound();
    }

    /// <summary>Users eligible to be added as claim authorities (Department = Claims).</summary>
    [HttpGet("authority/available-users")]
    [Permission("CLAIMENQUIRYSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetAvailableUsersForAuthority(
        [FromQuery] string? searchKeyword,
        [FromQuery] string? searchParameter)
    {
        var result = await _claims.GetUsersForAuthoritySelectionAsync(searchKeyword, searchParameter);
        return Ok(result);
    }

    /// <summary>Insured & Policy screen data for the claim workflow.</summary>
    [HttpGet("{claimId:long}/insured-policy")]
    [Permission("FNOLREGSCREEN", PermissionType.View)]
    public async Task<IActionResult> GetInsuredPolicy(long claimId)
    {
        var result = await _claims.GetInsuredPolicyViewAsync(claimId);
        return result == null ? NotFound() : Ok(result);
    }
}

public record ClaimExportSelectedRequest(List<long> Ids, string Format = "csv");

