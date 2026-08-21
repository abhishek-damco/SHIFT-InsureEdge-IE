// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// ClaimRepository — implements IClaimRepository.
// Sourced from: ClaimsEnquiry.md + 04_Claims.md (CS-148, CS-19, CS-141, CS-153)
// BR-CLM-001: DRAFT excluded from enquiry list (Status <> 'DRAFT')
// BR-CLM-002: all queries WHERE client_id = clientId
// BR-CLM-003: PolicyHolder = LegalBusinessName (InsuredName) when FirstName blank
// BR-CLM-004: EstimateAmount = "USD {amount}" only when non-empty
// BR-CLM-005: Aging = (today - CreatedOn).Days
// BR-CLM-006: free-text search across 16 fields in-memory
// BR-CLM-007: new insured-reported claims auto-populate reporter from policy insured
// BR-CLM-010: GetPolicyClaimsAsync returns DRAFT for in-progress + non-DRAFT for existing
using InsureEdge.Application.DTOs.Claim;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Data;
using System.Data.Common;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Repositories;

public class ClaimRepository : IClaimRepository
{
    private readonly InsureEdgeDbContext _db;
    private readonly ProducerScope? _producerScope;

    public ClaimRepository(InsureEdgeDbContext db, ICurrentTenantService tenant)
    {
        _db = db;
        _producerScope = ProducerScope.FromTenant(tenant);
    }

    // Staff retain client-wide access. Producer self-service sessions are restricted to
    // their own book, or their intermediary's book when full visibility is enabled.
    private IQueryable<Policy> ApplyProducerScope(IQueryable<Policy> query)
    {
        if (_producerScope == null) return query;

        return _producerScope.FullVisibility
            ? query.Where(p => p.IntermediaryId == _producerScope.IntermediaryId)
            : query.Where(p => p.ProducerId == _producerScope.ProducerId);
    }

    private IQueryable<Claim> ApplyProducerScope(IQueryable<Claim> query)
    {
        if (_producerScope == null) return query;

        return _producerScope.FullVisibility
            ? query.Where(c => c.Policy != null && c.Policy.IntermediaryId == _producerScope.IntermediaryId)
            : query.Where(c => c.Policy != null && c.Policy.ProducerId == _producerScope.ProducerId);
    }

    // ─── CS-148 · GetClaimEnquiryList ────────────────────────────────────────

    public async Task<(List<ClaimEnquiryDto> Items, int Total, int OpenCount, int UnassignedCount, int PendingCount, int ReferredCount)>
        GetEnquiryListAsync(long clientId, string? searchText)
    {
        // Stat card counts
        var openCount       = await _db.Claims.CountAsync(c => c.ClientId == clientId && c.Status == "OPEN");
        var unassignedCount = await _db.Claims.CountAsync(c => c.ClientId == clientId && c.Status != "DRAFT" && c.AssignedTo == null);
        var pendingCount    = await _db.Claims.CountAsync(c => c.ClientId == clientId && c.Status == "PENDING");
        var referredCount   = 0; // no referred status/field in current schema

        // Main query — excludes DRAFT (BR-CLM-001); ordered newest first
        var raw = await _db.Claims
            .Where(c => c.ClientId == clientId && c.Status != "DRAFT")
            .OrderByDescending(c => c.CreatedOn)
            .Select(c => new
            {
                c.Id, c.ClaimNumber, c.Status, c.ClaimType, c.CreatedOn,
                c.DateOfLoss, c.ClaimEstimate, c.AssignedTo, c.IsClaimReportedByInsured,
                c.ClaimInitiationChannel, c.MainCauseOfLoss, c.ConsequencesOfLoss,
                c.ClaimReimbursementType, c.CatastrophicEvent, c.InspectionRequired,
                c.IsThirdPartyDamage, c.ReporterFirstName, c.ReporterLastName, c.ReporterEmail,
                c.LossAddressLine1, c.LossAddressLine2, c.LossCity, c.LossState, c.LossZipCode,
                c.ClaimClosureDate, c.CreatedBy,
                PolicyNumber = c.Policy != null ? c.Policy.PolicyNumber : "",
                InsuredName  = c.Policy != null ? c.Policy.InsuredName  : "",
                Lob          = c.Policy != null ? c.Policy.Lob          : "",
                SubLob       = c.Policy != null ? c.Policy.SubProduct    : "",
            })
            .ToListAsync();

        // Claimant names (in-memory join; BR-CLM-006 — claimant name is one of the 16 search fields)
        var claimIds = raw.Select(c => c.Id).ToList();
        var claimants = await _db.Claimants
            .Where(cl => claimIds.Contains(cl.ClaimId))
            .Select(cl => new { cl.ClaimId, cl.FirstName, cl.LastName })
            .ToListAsync();

        // Assigned-to user names
        var assignedToIds = raw.Where(c => c.AssignedTo.HasValue).Select(c => c.AssignedTo!.Value).Distinct().ToList();
        var assignedUsers = await _db.Users
            .Where(u => assignedToIds.Contains(u.Id))
            .Select(u => new { u.Id, Name = u.FirstName + " " + u.LastName })
            .ToDictionaryAsync(u => u.Id, u => u.Name);

        var createdByIds = raw.Where(c => c.CreatedBy.HasValue).Select(c => c.CreatedBy!.Value).Distinct().ToList();
        var createdByUsers = await _db.Users
            .Where(u => createdByIds.Contains(u.Id))
            .Select(u => new { u.Id, Name = u.FirstName + " " + u.LastName })
            .ToDictionaryAsync(u => u.Id, u => u.Name);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var items = raw.Select(c =>
        {
            var claimantNames = claimants
                .Where(cl => cl.ClaimId == c.Id)
                .Select(cl => (cl.FirstName + " " + cl.LastName).Trim())
                .Where(n => n.Length > 0);
            var claimantName = string.Join(", ", claimantNames);

            // BR-CLM-003: PolicyHolder fallback
            var policyHolder = string.IsNullOrWhiteSpace(c.InsuredName) ? "(Unknown)" : c.InsuredName;

            // BR-CLM-004: Estimate amount
            var estimate = !string.IsNullOrWhiteSpace(c.ClaimEstimate) ? $"USD {c.ClaimEstimate}" : "";

            // BR-CLM-005: Aging
            var aging = c.DateOfLoss.HasValue
                ? (today.DayNumber - c.DateOfLoss.Value.DayNumber)
                : (today.DayNumber - DateOnly.FromDateTime(c.CreatedOn).DayNumber);

            var assignedToName = c.AssignedTo.HasValue && assignedUsers.TryGetValue(c.AssignedTo.Value, out var n) ? n : "";
            var createdByName = c.CreatedBy.HasValue && createdByUsers.TryGetValue(c.CreatedBy.Value, out var cbn) ? cbn : "";
            var reporterName = ((c.ReporterFirstName ?? "") + " " + (c.ReporterLastName ?? "")).Trim();
            var lossLocation = string.Join(", ", new[] { c.LossAddressLine1, c.LossAddressLine2, c.LossCity, c.LossState, c.LossZipCode }
                .Where(v => !string.IsNullOrWhiteSpace(v)));

            return new ClaimEnquiryDto(
                c.Id,
                c.ClaimNumber ?? "",
                c.PolicyNumber,
                policyHolder,
                claimantName,
                c.Status,
                c.Lob ?? "",
                c.SubLob ?? "",
                c.DateOfLoss.HasValue ? c.DateOfLoss.Value.ToString("MM-dd-yyyy") : "",
                c.CreatedOn.ToString("MM-dd-yyyy"),
                c.ClaimType ?? "",
                assignedToName,
                aging,
                estimate,
                c.ClaimInitiationChannel ?? "",
                c.MainCauseOfLoss ?? "",
                c.ConsequencesOfLoss ?? "",
                c.ClaimReimbursementType ?? "",
                c.CatastrophicEvent ?? "",
                c.InspectionRequired,
                c.IsThirdPartyDamage,
                reporterName,
                c.ReporterEmail ?? "",
                lossLocation,
                c.ClaimClosureDate.HasValue ? c.ClaimClosureDate.Value.ToString("MM-dd-yyyy") : "",
                createdByName,
                c.AssignedTo.HasValue,
                "",  // ApprovedAmount — not in current schema
                assignedToName, // AdjusterAssigned — maps to same assignee
                "",  // ClaimReferred — not in current schema
                "",  // ReferredDept — not in current schema
                ""   // FraudIndicator — not in current schema
            );
        }).ToList();

        // BR-CLM-006: in-memory free-text search across 16 fields
        if (!string.IsNullOrWhiteSpace(searchText))
        {
            var q = searchText.ToLower();
            items = items.Where(c =>
                Contains(c.ClaimNumber, q)    || Contains(c.PolicyNumber, q)  ||
                Contains(c.PolicyHolder, q)   || Contains(c.ClaimantName, q)  ||
                Contains(c.ClaimStatus, q)    || Contains(c.Lob, q)           ||
                Contains(c.SubLob, q)         || Contains(c.DateOfLoss, q)    ||
                Contains(c.SubmissionDate, q) || Contains(c.ClaimType, q)     ||
                Contains(c.AssignedTo, q)     || c.Aging.ToString().Contains(q) ||
                Contains(c.EstimateAmount, q)    || Contains(c.ClaimInitiationChannel, q) ||
                Contains(c.MainCauseOfLoss, q)  || Contains(c.ConsequencesOfLoss, q) ||
                Contains(c.ClaimReimbursementType, q) || Contains(c.CatastrophicEvent, q) ||
                Contains(c.ReporterName, q) || Contains(c.ReporterEmail, q) ||
                Contains(c.LossLocation, q) || Contains(c.ClosureDate, q) ||
                Contains(c.CreatedByName, q)
            ).ToList();
        }

        return (items, items.Count, openCount, unassignedCount, pendingCount, referredCount);
    }

    private static bool Contains(string? s, string q) =>
        s != null && s.ToLower().Contains(q);

    public async Task<byte[]> ExportAsync(long clientId, string format, string? search, List<long>? selectedIds)
    {
        var (items, _, _, _, _, _) = await GetEnquiryListAsync(clientId, search);
        if (selectedIds != null && selectedIds.Any())
            items = items.Where(c => selectedIds.Contains(c.Id)).ToList();

        var sb = new StringBuilder();
        sb.AppendLine("Claim No,Policy No,Policy Holder,Claimant,Status,LOB,Sub LOB,Date of Loss,Submission Date,Claim Type,Cause of Loss,Consequence,Channel,Reimbursement,Cat Event,Inspection,Third Party,Reporter,Reporter Email,Loss Location,Assigned To,Aging,Estimate,Closure Date,Created By");
        foreach (var c in items)
        {
            var values = new[]
            {
                c.ClaimNumber, c.PolicyNumber, c.PolicyHolder, c.ClaimantName, c.ClaimStatus,
                c.Lob, c.SubLob, c.DateOfLoss, c.SubmissionDate, c.ClaimType,
                c.MainCauseOfLoss, c.ConsequencesOfLoss, c.ClaimInitiationChannel,
                c.ClaimReimbursementType, c.CatastrophicEvent, c.InspectionRequired ? "Yes" : "No",
                c.IsThirdPartyDamage ? "Yes" : "No", c.ReporterName, c.ReporterEmail,
                c.LossLocation, c.AssignedTo, c.Aging.ToString(), c.EstimateAmount,
                c.ClosureDate, c.CreatedByName
            };
            sb.AppendLine(string.Join(",", values.Select(EscapeCsv)));
        }
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static string EscapeCsv(string? value) =>
        "\"" + (value ?? "").Replace("\"", "\"\"") + "\"";

    // ─── Policy Search (Step 1) ───────────────────────────────────────────────

    public async Task<(List<PolicySearchDto> Items, int Total)> SearchPoliciesAsync(
        long clientId, string? search, string? searchField, int page, int pageSize)
    {
        // FNOL starts from an issued policy, never from a quote/endorsement/renewal draft.
        var query = ApplyProducerScope(_db.Policies.Where(p =>
            p.ClientId == clientId && p.PolicyType == "POLICY"));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = searchField switch
            {
                "policyNumber" => query.Where(p => p.PolicyNumber.ToLower().Contains(s)),
                "insuredName"  => query.Where(p => p.InsuredName != null && p.InsuredName.ToLower().Contains(s)),
                _              => query.Where(p =>
                    p.PolicyNumber.ToLower().Contains(s) ||
                    (p.InsuredName != null && p.InsuredName.ToLower().Contains(s)))
            };
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(p => p.PolicyNumber)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => new PolicySearchDto(
                p.Id, p.PolicyNumber, p.InsuredName ?? "", p.Address ?? "",
                p.EffectiveDate.HasValue ? p.EffectiveDate.Value.ToString("MM-dd-yyyy") : "",
                p.Lob ?? "", p.PolicyStatus ?? p.Status))
            .ToListAsync();

        return (items, total);
    }

    // ─── Policy Claims Modal (Step 1 → Modal) ────────────────────────────────

    public async Task<PolicyClaimsModalDto> GetPolicyClaimsAsync(long policyId, long clientId)
    {
        var policyIsAccessible = await ApplyProducerScope(_db.Policies.Where(p => p.ClientId == clientId))
            .AnyAsync(p => p.Id == policyId);
        if (!policyIsAccessible)
            throw new KeyNotFoundException($"Policy {policyId} not found.");

        // In-progress = DRAFT only (BR-CLM-010)
        var drafts = await _db.Claims
            .Where(c => c.PolicyId == policyId && c.ClientId == clientId && c.Status == "DRAFT")
            .OrderByDescending(c => c.CreatedOn)
            .Select(c => new InProgressClaimDto(
                c.Id, c.ClaimNumber,
                c.DateOfLoss.HasValue ? c.DateOfLoss.Value.ToString("MM-dd-yyyy") : "",
                c.Policy != null ? c.Policy.InsuredName ?? "" : "",
                c.Policy != null ? c.Policy.Lob ?? "" : "",
                c.LastStepNumber))
            .ToListAsync();

        // Existing = non-DRAFT
        var existing = await _db.Claims
            .Where(c => c.PolicyId == policyId && c.ClientId == clientId && c.Status != "DRAFT")
            .OrderByDescending(c => c.CreatedOn)
            .Select(c => new
            {
                c.Id, c.ClaimNumber, c.DateOfLoss, c.Status, c.PolicyId,
                InsuredName = c.Policy != null ? c.Policy.InsuredName ?? "" : "",
                Lob = c.Policy != null ? c.Policy.Lob ?? "" : "",
            })
            .ToListAsync();

        var existingClaimIds = existing.Select(c => c.Id).ToList();
        var claimants = await _db.Claimants
            .Where(cl => existingClaimIds.Contains(cl.ClaimId))
            .Select(cl => new { cl.ClaimId, cl.FirstName, cl.LastName })
            .ToListAsync();

        var existingDtos = existing.Select(c =>
        {
            var names = claimants.Where(cl => cl.ClaimId == c.Id)
                .Select(cl => (cl.FirstName + " " + cl.LastName).Trim())
                .Where(n => n.Length > 0);
            return new ExistingClaimDto(
                c.Id, c.ClaimNumber ?? "",
                c.DateOfLoss.HasValue ? c.DateOfLoss.Value.ToString("MM-dd-yyyy") : "",
                c.InsuredName, string.Join(", ", names), c.Lob, c.Status);
        }).ToList();

        return new PolicyClaimsModalDto(drafts, existingDtos);
    }

    // ─── Policy Details (Step 2) ──────────────────────────────────────────────

    public async Task<PolicyDetailsDto?> GetPolicyDetailsAsync(long policyId, long clientId)
    {
        var policy = await ApplyProducerScope(_db.Policies.Where(p => p.ClientId == clientId))
            .Where(p => p.Id == policyId)
            .Include(p => p.Insured)
            .Include(p => p.RiskLocation)
            .Include(p => p.Account)
            .FirstOrDefaultAsync();

        if (policy == null) return null;

        JsonNode? form = null;
        if (!string.IsNullOrWhiteSpace(policy.QuoteNumber))
        {
            var submissionJson = await _db.Submissions
                .Where(s => s.ClientId == clientId && s.Id == policy.QuoteNumber)
                .Select(s => s.Data)
                .FirstOrDefaultAsync();
            if (!string.IsNullOrWhiteSpace(submissionJson))
            {
                try { form = JsonNode.Parse(submissionJson)?["form"]; }
                catch { form = null; }
            }
        }

        static string? FormText(JsonNode? node, string key)
        {
            var value = node?[key];
            if (value == null) return null;
            try
            {
                var text = value.GetValue<string>();
                return string.IsNullOrWhiteSpace(text) ? null : text;
            }
            catch
            {
                var text = value.ToString();
                return string.IsNullOrWhiteSpace(text) ? null : text;
            }
        }

        static string? FirstValue(params string?[] values) =>
            values.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v));

        var account = policy.Account;
        var legacyInsured = policy.Insured;

        var insuredDto = new InsuredDetailsDto(
            FirstValue(legacyInsured?.CustomerId, account?.AccountCode, account?.Id.ToString()),
            FirstValue(legacyInsured?.FirstName, account?.FirstName, FormText(form, "firstName")),
            FirstValue(account?.MiddleName, FormText(form, "middleName")),
            FirstValue(legacyInsured?.LastName, account?.LastName, FormText(form, "lastName")),
            FirstValue(legacyInsured?.AddressLine1, FormText(form, "addressLine1"), policy.Address),
            FirstValue(legacyInsured?.AddressLine2, FormText(form, "addressLine2")),
            FirstValue(legacyInsured?.Country, FormText(form, "country")),
            FirstValue(legacyInsured?.State, FormText(form, "state")),
            FirstValue(legacyInsured?.City, FormText(form, "city")),
            FirstValue(legacyInsured?.County, FormText(form, "county")),
            FirstValue(legacyInsured?.ZipCode, FormText(form, "zip")),
            FirstValue(legacyInsured?.Telephone, FormText(form, "phone")),
            FirstValue(legacyInsured?.TelephoneExt, FormText(form, "extension")),
            FirstValue(legacyInsured?.AlternateTelephone, FormText(form, "altPhone")),
            FirstValue(legacyInsured?.Email, FormText(form, "email")));

        var riskAddress = await _db.RiskAddresses
            .Where(r => r.PolicyId == policy.Id && r.ClientId == clientId)
            .OrderByDescending(r => r.IsActive == true)
            .ThenBy(r => r.LocationNumber)
            .FirstOrDefaultAsync();
        var riskInfo = await _db.PolicyRiskInformation
            .Where(r => r.PolicyId == policy.Id && r.ClientId == clientId)
            .OrderBy(r => r.Id)
            .FirstOrDefaultAsync();

        var addressParts = new[]
        {
            FirstValue(riskAddress?.AddressLine1, FormText(form, "addressLine1"), policy.Address),
            FirstValue(riskAddress?.City, FormText(form, "city")),
            FirstValue(riskAddress?.State, FormText(form, "state")),
            FirstValue(riskAddress?.ZipCode, FormText(form, "zip"))
        }.Where(v => !string.IsNullOrWhiteSpace(v));
        var propertyLocation = FirstValue(
            policy.RiskLocation?.PropertyLocation,
            riskAddress?.GoogleAddress,
            FormText(form, "googleAddress"),
            string.Join(", ", addressParts));

        var riskDto = new RiskLocationDetailsDto(
            policy.RiskLocation?.Id,
            propertyLocation,
            FirstValue(policy.RiskLocation?.Latitude, riskAddress?.Latitude, FormText(form, "latitude")),
            FirstValue(policy.RiskLocation?.Longitude, riskAddress?.Longitude, FormText(form, "longitude")),
            FirstValue(policy.RiskLocation?.OccupancyType, riskInfo?.ResidenceType, FormText(form, "buildingType")),
            FirstValue(policy.RiskLocation?.ConstructionType, riskInfo?.ConstructionType, FormText(form, "buildingDescription")),
            FirstValue(policy.RiskLocation?.AgeOfProperty,
                riskInfo?.YearBuilt is int yearBuilt ? (DateTime.UtcNow.Year - yearBuilt).ToString() : null),
            policy.RiskLocation?.LengthOfOccupancy,
            FirstValue(policy.RiskLocation?.RoofType, riskInfo?.RoofCovering, riskInfo?.RoofShape, FormText(form, "roofConstructionType")),
            policy.RiskLocation?.FireProtectionClass);

        var additionalInsureds = await _db.AdditionalInsureds
            .Where(a => a.PolicyId == policy.Id && a.ClientId == clientId)
            .OrderBy(a => a.RecordNumber).ThenBy(a => a.Id)
            .Select(a => new AdditionalInsuredDetailsDto(
                a.Id, a.FirstName, a.MiddleName, a.LastName, a.Relationship,
                a.TelephoneNumber, a.AltTelephoneNumber, a.Email, a.InsuredType, a.Dba))
            .ToListAsync();

        var additionalOrganisations = await _db.AdditionalOrganisations
            .Where(a => a.PolicyId == policy.Id && a.ClientId == clientId)
            .OrderBy(a => a.RecordNumber).ThenBy(a => a.Id)
            .Select(a => new AdditionalOrganisationDetailsDto(
                a.Id, a.OrganisationName, a.OrganisationType, a.TelephoneNumber,
                a.Extension, a.AltTelephoneNumber, a.Email,
                a.FirstName, a.MiddleName, a.LastName))
            .ToListAsync();

        var limits = await _db.PolicyLimitCoverages
            .Where(c => c.PolicyId == policy.Id && c.ClientId == clientId)
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync();

        return new PolicyDetailsDto(
            policy.Id, policy.PolicyNumber,
            FirstValue(policy.Lob, FormText(form, "lob")),
            FirstValue(policy.SubProduct, FormText(form, "subProduct")),
            FirstValue(policy.InsuredName,
                string.Join(" ", new[] { account?.FirstName, account?.MiddleName, account?.LastName }.Where(v => !string.IsNullOrWhiteSpace(v)))),
            FirstValue(policy.Address, FormText(form, "googleAddress"), FormText(form, "addressLine1")),
            policy.EffectiveDate.HasValue ? policy.EffectiveDate.Value.ToString("MM-dd-yyyy") : null,
            policy.ExpiryDate.HasValue ? policy.ExpiryDate.Value.ToString("MM-dd-yyyy") : FormText(form, "expirationDate"),
            policy.PolicyStatus ?? policy.Status,
            FirstValue(policy.InsuranceType, FormText(form, "policyInsuranceType"), FormText(form, "insuredType")),
            FirstValue(limits?.CoverageLevel, FormText(form, "coverageLevel")),
            limits?.PhysicalDamageDeductible?.ToString() ?? FormText(form, "deductible"),
            insuredDto, riskDto, additionalInsureds, additionalOrganisations);
    }

    // ─── Full Claim Detail ────────────────────────────────────────────────────

    public async Task<ClaimDetailDto?> GetClaimByIdAsync(long claimId, long clientId)
    {
        var claim = await ApplyProducerScope(_db.Claims.Where(c => c.ClientId == clientId))
            .Where(c => c.Id == claimId)
            .Include(c => c.Policy)
            .Include(c => c.Coverages).ThenInclude(cv => cv.Coverage)
            .Include(c => c.Coverages).ThenInclude(cv => cv.CauseOfLoss)
            .Include(c => c.Claimants)
            .Include(c => c.Documents)
            .Include(c => c.AssignedToUser)
            .FirstOrDefaultAsync();

        if (claim == null) return null;

        var notifyUserIds = claim.Documents.Where(d => d.NotifyTo.HasValue).Select(d => d.NotifyTo!.Value).Distinct().ToList();
        var notifyUsers = await _db.Users
            .Where(u => notifyUserIds.Contains(u.Id))
            .Select(u => new { u.Id, Name = u.FirstName + " " + u.LastName })
            .ToDictionaryAsync(u => u.Id, u => u.Name);

        var coverageDtos = claim.Coverages.Select(cv => new ClaimCoverageDto(
            cv.Id,
            cv.CoverageId,
            cv.Coverage?.Coverage,
            cv.CauseOfLossId,
            cv.CauseOfLoss?.CauseOfLoss,
            cv.AssetType)).ToList();

        var claimantDtos = claim.Claimants.Select(cl => new ClaimantDto(
            cl.Id, cl.PartyType, cl.FirstName, cl.MiddleName, cl.LastName,
            cl.RelationshipWithInsured, cl.Telephone, cl.TelephoneCC, cl.AlternateTelephone, cl.Email,
            cl.AddressLine1, cl.AddressLine2, cl.Country, cl.State, cl.City, cl.County,
            cl.ZipCode, cl.Latitude, cl.Longitude, cl.ListOfDamages)).ToList();

        // BR-CLM-011/012/013: doc list — no binary; NotifyTo resolved to name; date formatted
        var docDtos = claim.Documents.Select(d => new ClaimDocumentDto(
            d.Id, d.FileName, d.ContentType, d.FileSize,
            d.NotifyTo.HasValue && notifyUsers.TryGetValue(d.NotifyTo.Value, out var nn) ? nn : null,
            d.Comment,
            d.CreatedOn.ToString("MM-dd-yyyy"))).ToList();

        PolicyDetailsDto? policyDto = null;
        if (claim.Policy != null)
        {
            policyDto = await GetPolicyDetailsAsync(claim.Policy.Id, clientId);
        }

        var assignedToName = claim.AssignedToUser != null
            ? $"{claim.AssignedToUser.FirstName} {claim.AssignedToUser.LastName}".Trim()
            : null;

        return new ClaimDetailDto(
            claim.Id, claim.ClaimNumber, claim.PolicyId,
            claim.Policy?.PolicyNumber ?? "", claim.ClientId, claim.Status,
            claim.LastStepNumber, claim.IsClaimReportedByInsured,
            claim.ReporterFirstName, claim.ReporterLastName, claim.ReporterRelationship,
            claim.ReporterTelephone, claim.ReporterEmail,
            claim.DateOfLoss?.ToString("yyyy-MM-dd"), claim.TimeOfLoss?.ToString("HH:mm"),
            claim.ClaimInitiationChannel, claim.ClaimType,
            claim.MainCauseOfLoss, claim.ConsequencesOfLoss,
            claim.InspectionRequired, claim.ClaimReimbursementType, claim.CatastrophicEvent,
            claim.LossDescription, claim.ListOfDamageFirstParty,
            claim.PhysicalDamage, claim.ClaimOnlyThirdParty, claim.IsThirdPartyDamage,
            claim.LossAddressLine1, claim.LossAddressLine2, claim.LossCountry,
            claim.LossState, claim.LossCity, claim.LossCounty,
            claim.LossZipCode, claim.LossLatitude, claim.LossLongitude,
            claim.ClaimEstimate, claim.Comment,
            coverageDtos, claimantDtos, docDtos, policyDto,
            assignedToName,
            claim.CreatedOn.ToString("MM-dd-yyyy"));
    }

    // ─── CS-19 · Create or Update Claim ──────────────────────────────────────

    public async Task<long> CreateOrUpdateAsync(CreateOrUpdateClaimRequest req, long clientId, long userId)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();

        var requestedStatus = (req.Status ?? "DRAFT").Trim().ToUpperInvariant();
        if (requestedStatus is not ("DRAFT" or "OPEN"))
            throw new ArgumentException("Claim status must be DRAFT or OPEN.");
        var requestedStep = (short)Math.Clamp(req.LastStepNumber, (short)1, (short)4);

        var policyIsAccessible = await ApplyProducerScope(_db.Policies.Where(p => p.ClientId == clientId))
            .AnyAsync(p => p.Id == req.PolicyId && p.PolicyType == "POLICY");
        if (!policyIsAccessible)
            throw new KeyNotFoundException($"Policy {req.PolicyId} not found.");

        long? validatedRiskLocationId = null;
        if (req.RiskLocationId is > 0)
        {
            validatedRiskLocationId = await _db.RiskLocations
                .Where(r => r.Id == req.RiskLocationId.Value
                         && r.PolicyId == req.PolicyId
                         && r.ClientId == clientId)
                .Select(r => (long?)r.Id)
                .FirstOrDefaultAsync();

            if (!validatedRiskLocationId.HasValue)
                throw new ArgumentException("The selected risk location does not belong to this policy.");
        }

        Claim claim;
        bool isNew = !req.Id.HasValue || req.Id.Value == 0;

        if (isNew)
        {
            claim = new Claim
            {
                PolicyId = req.PolicyId,
                RiskLocationId = validatedRiskLocationId,
                ClientId = clientId,
                Status = "DRAFT",
                LastStepNumber = requestedStep,
                IsClaimReportedByInsured = req.IsClaimReportedByInsured,
                CreatedBy = userId,
                CreatedOn = DateTime.UtcNow,
            };

            _db.Claims.Add(claim);
            await _db.SaveChangesAsync();

            // Generate claim number after insert: CLM-{YYYY}-{id:D5}
            claim.ClaimNumber = $"CLM-{DateTime.UtcNow.Year}-{claim.Id:D5}";
        }
        else
        {
            claim = await ApplyProducerScope(_db.Claims.Where(c => c.ClientId == clientId))
                .FirstOrDefaultAsync(c => c.Id == req.Id!.Value)
                ?? throw new KeyNotFoundException($"Claim {req.Id} not found.");
            if (claim.PolicyId != req.PolicyId)
                throw new ArgumentException("The claim does not belong to the selected policy.");
            claim.UpdatedBy = userId;
            claim.UpdatedOn = DateTime.UtcNow;
        }

        claim.IsClaimReportedByInsured = req.IsClaimReportedByInsured;
        if (req.IsClaimReportedByInsured)
        {
            var insured = await _db.Insureds.FirstOrDefaultAsync(i => i.PolicyId == req.PolicyId);
            var account = await _db.Policies
                .Where(p => p.Id == req.PolicyId && p.ClientId == clientId)
                .Select(p => p.Account)
                .FirstOrDefaultAsync();
            claim.ReporterFirstName = insured?.FirstName ?? account?.FirstName;
            claim.ReporterLastName = insured?.LastName ?? account?.LastName;
            claim.ReporterRelationship = "Self";
            claim.ReporterTelephone = insured?.Telephone;
            claim.ReporterTelephoneCC = null;
            claim.ReporterEmail = insured?.Email;
        }
        else
        {
            claim.ReporterFirstName = req.ReporterFirstName;
            claim.ReporterLastName = req.ReporterLastName;
            claim.ReporterRelationship = req.ReporterRelationship;
            claim.ReporterTelephone = req.ReporterTelephone;
            claim.ReporterTelephoneCC = req.ReporterTelephoneCC;
            claim.ReporterEmail = req.ReporterEmail;
        }

        // Apply loss fields (Step 3 data)
        if (req.RiskLocationId.HasValue)
            claim.RiskLocationId = validatedRiskLocationId;
        if (!string.IsNullOrWhiteSpace(req.DateOfLoss))
        {
            if (!DateOnly.TryParse(req.DateOfLoss, out var dateOfLoss))
                throw new ArgumentException("Date of loss is invalid.");
            claim.DateOfLoss = dateOfLoss;
        }
        if (!string.IsNullOrWhiteSpace(req.TimeOfLoss))
        {
            if (!TimeOnly.TryParse(req.TimeOfLoss, out var timeOfLoss))
                throw new ArgumentException("Time of loss is invalid.");
            claim.TimeOfLoss = timeOfLoss;
        }
        claim.ClaimInitiationChannel = req.ClaimInitiationChannel ?? claim.ClaimInitiationChannel;
        claim.ClaimType              = req.ClaimType ?? claim.ClaimType;
        claim.MainCauseOfLoss        = req.MainCauseOfLoss ?? claim.MainCauseOfLoss;
        claim.ConsequencesOfLoss     = req.ConsequencesOfLoss ?? claim.ConsequencesOfLoss;
        claim.InspectionRequired     = req.InspectionRequired;
        claim.ClaimReimbursementType = req.ClaimReimbursementType ?? claim.ClaimReimbursementType;
        claim.CatastrophicEvent      = req.CatastrophicEvent ?? claim.CatastrophicEvent;
        claim.LossDescription        = req.LossDescription ?? claim.LossDescription;
        claim.ListOfDamageFirstParty = req.ListOfDamageFirstParty ?? claim.ListOfDamageFirstParty;
        claim.PhysicalDamage         = req.PhysicalDamage ?? claim.PhysicalDamage;
        claim.ClaimOnlyThirdParty    = req.ClaimOnlyThirdParty ?? claim.ClaimOnlyThirdParty;
        claim.IsThirdPartyDamage     = req.IsThirdPartyDamage;
        claim.LossAddressLine1       = req.LossAddressLine1 ?? claim.LossAddressLine1;
        claim.LossAddressLine2       = req.LossAddressLine2 ?? claim.LossAddressLine2;
        claim.LossCountry            = req.LossCountry ?? claim.LossCountry;
        claim.LossState              = req.LossState ?? claim.LossState;
        claim.LossCity               = req.LossCity ?? claim.LossCity;
        claim.LossCounty             = req.LossCounty ?? claim.LossCounty;
        claim.LossZipCode            = req.LossZipCode ?? claim.LossZipCode;
        claim.LossLatitude           = req.LossLatitude ?? claim.LossLatitude;
        claim.LossLongitude          = req.LossLongitude ?? claim.LossLongitude;
        claim.ClaimEstimate          = req.ClaimEstimate ?? claim.ClaimEstimate;
        claim.Comment                = req.Comment ?? claim.Comment;

        if (requestedStatus == "OPEN")
        {
            var missing = new List<string>();
            if (!claim.DateOfLoss.HasValue) missing.Add("Date of Loss");
            if (!claim.TimeOfLoss.HasValue) missing.Add("Time of Loss");
            if (string.IsNullOrWhiteSpace(claim.ClaimType)) missing.Add("Claim Type");
            if (string.IsNullOrWhiteSpace(claim.MainCauseOfLoss)) missing.Add("Main Cause of Loss");
            if (string.IsNullOrWhiteSpace(claim.ConsequencesOfLoss)) missing.Add("Consequences of Loss");
            if (!claim.PhysicalDamage.HasValue) missing.Add("Physical Damage");
            if (!claim.ClaimOnlyThirdParty.HasValue) missing.Add("Claim Only for Third Party");
            if (string.IsNullOrWhiteSpace(claim.LossDescription)) missing.Add("Loss Description");
            if (missing.Count > 0)
                throw new ArgumentException($"Cannot register claim. Missing: {string.Join(", ", missing)}.");
            claim.Status = "OPEN";
            claim.LastStepNumber = 4;
        }
        else if (claim.Status == "DRAFT")
        {
            claim.LastStepNumber = Math.Max(claim.LastStepNumber, requestedStep);
        }

        // Sync impacted coverage rows — full replace
        var selectedMasterIds = req.Coverages
            .SelectMany(c => new long?[] { c.CoverageId, c.CauseOfLossId })
            .Where(id => id is > 0)
            .Select(id => id!.Value)
            .Distinct()
            .ToList();
        if (selectedMasterIds.Count > 0)
        {
            var validMasterIds = await _db.ClaimCoverages
                .Where(c => selectedMasterIds.Contains(c.Id))
                .Select(c => c.Id)
                .ToListAsync();
            if (validMasterIds.Count != selectedMasterIds.Count)
                throw new ArgumentException("One or more selected coverages or causes of loss are invalid.");
        }

        var existingCoverages = await _db.ClaimImpactedCoverages
            .Where(cv => cv.ClaimId == claim.Id)
            .ToListAsync();
        _db.ClaimImpactedCoverages.RemoveRange(existingCoverages);

        foreach (var cov in req.Coverages)
        {
            _db.ClaimImpactedCoverages.Add(new ClaimImpactedCoverage
            {
                ClaimId = claim.Id,
                ClientId = clientId,
                CoverageId = cov.CoverageId,
                CauseOfLossId = cov.CauseOfLossId,
                AssetType = cov.AssetType
            });
        }

        // Sync claimants — full replace
        var existingClaimants = await _db.Claimants.Where(cl => cl.ClaimId == claim.Id).ToListAsync();
        _db.Claimants.RemoveRange(existingClaimants);
        if (req.IsThirdPartyDamage)
        {
            foreach (var cl in req.Claimants)
            {
                _db.Claimants.Add(new Claimant
                {
                    ClaimId = claim.Id, ClientId = clientId,
                    PartyType = cl.PartyType, FirstName = cl.FirstName, MiddleName = cl.MiddleName,
                    LastName = cl.LastName, RelationshipWithInsured = cl.RelationshipWithInsured,
                    Telephone = cl.Telephone, TelephoneCC = cl.TelephoneCC,
                    AlternateTelephone = cl.AlternateTelephone, Email = cl.Email,
                    AddressLine1 = cl.AddressLine1, AddressLine2 = cl.AddressLine2,
                    Country = cl.Country, State = cl.State, City = cl.City, County = cl.County,
                    ZipCode = cl.ZipCode, Latitude = cl.Latitude, Longitude = cl.Longitude,
                    ListOfDamages = cl.ListOfDamages
                });
            }
        }

        await _db.SaveChangesAsync();
        await tx.CommitAsync();
        return claim.Id;
    }

    // ─── Delete DRAFT ─────────────────────────────────────────────────────────


    // Claim workflow assignment/documents/temp records

    public async Task<ClaimAssignmentDto> UpdateAssignmentAsync(long claimId, UpdateClaimAssignmentRequest req, long clientId, long userId)
    {
        var claim = await _db.Claims.FirstOrDefaultAsync(c => c.Id == claimId && c.ClientId == clientId)
            ?? throw new KeyNotFoundException($"Claim {claimId} not found.");

        long? assignedTo = req.AssignedTo;
        if (!assignedTo.HasValue && !string.IsNullOrWhiteSpace(req.AssignedToName))
        {
            var name = req.AssignedToName.Trim().ToLower();
            assignedTo = await _db.Users
                .Where(u => u.ClientId == clientId && (u.FirstName + " " + u.LastName).ToLower() == name)
                .Select(u => (long?)u.Id)
                .FirstOrDefaultAsync();
        }

        claim.AssignedTo = assignedTo;
        claim.UpdatedBy = userId;
        claim.UpdatedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        string? assignedName = null;
        if (assignedTo.HasValue)
        {
            assignedName = await _db.Users
                .Where(u => u.Id == assignedTo.Value && u.ClientId == clientId)
                .Select(u => u.FirstName + " " + u.LastName)
                .FirstOrDefaultAsync();
        }

        return new ClaimAssignmentDto(assignedTo, assignedName);
    }

    public async Task<List<ClaimDocumentDto>> GetDocumentsAsync(long claimId, long clientId)
    {
        await EnsureClaimAsync(claimId, clientId);
        var docs = await _db.ClaimDocuments
            .Where(d => d.ClaimId == claimId && d.ClientId == clientId)
            .OrderByDescending(d => d.CreatedOn)
            .ToListAsync();
        return await MapDocumentsAsync(docs);
    }

    public async Task<ClaimDocumentDto> AddDocumentAsync(long claimId, CreateClaimDocumentRequest req, long clientId, long userId)
    {
        await EnsureClaimAsync(claimId, clientId);
        if (string.IsNullOrWhiteSpace(req.FileName))
            throw new ArgumentException("Document file name is required.");
        var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            { ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg" };
        if (!allowedExtensions.Contains(Path.GetExtension(req.FileName)))
            throw new ArgumentException("Unsupported document type.");

        byte[]? content;
        try
        {
            content = DecodeBase64(req.FileContentBase64);
        }
        catch (FormatException)
        {
            throw new ArgumentException("Document content is not valid base64.");
        }
        if (content == null || content.Length == 0)
            throw new ArgumentException("Document content is required.");
        if (content.LongLength > 25L * 1024 * 1024)
            throw new ArgumentException("Document size cannot exceed 25 MB.");

        var notifyTo = await ResolveUserIdAsync(req.NotifyToName, clientId);
        var doc = new ClaimDocument
        {
            ClaimId = claimId,
            ClientId = clientId,
            FileName = req.FileName,
            ContentType = req.ContentType,
            FileSize = content.LongLength,
            NotifyTo = notifyTo,
            Comment = req.Comment,
            CreatedBy = userId,
            CreatedOn = DateTime.UtcNow,
            DocumentFile = content
        };
        _db.ClaimDocuments.Add(doc);
        await _db.SaveChangesAsync();
        return (await MapDocumentsAsync(new List<ClaimDocument> { doc })).Single();
    }

    public async Task<ClaimDocumentFileDto?> GetDocumentFileAsync(long claimId, long documentId, long clientId)
    {
        await EnsureClaimAsync(claimId, clientId);
        var doc = await _db.ClaimDocuments
            .FirstOrDefaultAsync(d => d.Id == documentId && d.ClaimId == claimId && d.ClientId == clientId);
        return doc == null ? null : new ClaimDocumentFileDto(doc.Id, doc.FileName, doc.ContentType, doc.DocumentFile);
    }

    public async Task DeleteDocumentAsync(long claimId, long documentId, long clientId)
    {
        await EnsureClaimAsync(claimId, clientId);
        var doc = await _db.ClaimDocuments.FirstOrDefaultAsync(d => d.Id == documentId && d.ClaimId == claimId && d.ClientId == clientId)
            ?? throw new KeyNotFoundException($"Document {documentId} not found.");
        _db.ClaimDocuments.Remove(doc);
        await _db.SaveChangesAsync();
    }

    public async Task<List<TempClaimReportDto>> GetTempClaimReportsAsync(long claimId, long clientId)
    {
        await EnsureClaimAsync(claimId, clientId);
        return await _db.TempClaimReports
            .Where(x => x.ClaimId == claimId && x.ClientId == clientId)
            .OrderByDescending(x => x.CreatedOn)
            .Select(x => MapReport(x))
            .ToListAsync();
    }

    public async Task<TempClaimReportDto> UpsertTempClaimReportAsync(long claimId, UpsertTempClaimReportRequest req, long clientId, long userId)
    {
        await EnsureClaimAsync(claimId, clientId);
        TempClaimReport row;
        if (req.Id.HasValue && req.Id.Value > 0)
        {
            row = await _db.TempClaimReports.FirstOrDefaultAsync(x => x.Id == req.Id.Value && x.ClaimId == claimId && x.ClientId == clientId)
                ?? throw new KeyNotFoundException($"Report {req.Id} not found.");
            row.UpdatedBy = userId;
            row.UpdatedOn = DateTime.UtcNow;
        }
        else
        {
            row = new TempClaimReport { ClaimId = claimId, ClientId = clientId, CreatedBy = userId, CreatedOn = DateTime.UtcNow };
            _db.TempClaimReports.Add(row);
        }
        row.ReportType = req.ReportType;
        row.ReportNumber = req.ReportNumber;
        row.ReportFilingDate = req.ReportFilingDate;
        row.PrecinctName = req.PrecinctName;
        row.CaseStatus = req.CaseStatus;
        row.NumberOfWitness = req.NumberOfWitness;
        row.Description = req.Description;
        row.NotifyDocumentUpload = req.NotifyDocumentUpload;
        row.NotifyToName = req.NotifyToName;
        row.Comment = req.Comment;
        row.ContactFirstName = req.ContactFirstName;
        row.ContactLastName = req.ContactLastName;
        row.IdentityDocument = req.IdentityDocument;
        row.TelephoneNumber = req.TelephoneNumber;
        row.Extension = req.Extension;
        row.AlternateTelephoneNumber = req.AlternateTelephoneNumber;
        row.EmailId = req.EmailId;
        row.ReferenceDocumentName = req.ReferenceDocumentName;
        await _db.SaveChangesAsync();
        return MapReport(row);
    }

    public async Task DeleteTempClaimReportAsync(long claimId, long id, long clientId)
    {
        var row = await _db.TempClaimReports.FirstOrDefaultAsync(x => x.Id == id && x.ClaimId == claimId && x.ClientId == clientId)
            ?? throw new KeyNotFoundException($"Report {id} not found.");
        _db.TempClaimReports.Remove(row);
        await _db.SaveChangesAsync();
    }

    public async Task<List<TempClaimPartyDto>> GetTempClaimPartiesAsync(long claimId, long clientId)
    {
        await EnsureClaimAsync(claimId, clientId);
        return await _db.TempClaimParties.Where(x => x.ClaimId == claimId && x.ClientId == clientId).OrderByDescending(x => x.CreatedOn).Select(x => MapParty(x)).ToListAsync();
    }

    public async Task<TempClaimPartyDto> UpsertTempClaimPartyAsync(long claimId, UpsertTempClaimPartyRequest req, long clientId, long userId)
    {
        await EnsureClaimAsync(claimId, clientId);
        TempClaimParty row;
        if (req.Id.HasValue && req.Id.Value > 0)
        {
            row = await _db.TempClaimParties.FirstOrDefaultAsync(x => x.Id == req.Id.Value && x.ClaimId == claimId && x.ClientId == clientId)
                ?? throw new KeyNotFoundException($"Party {req.Id} not found.");
            row.UpdatedBy = userId;
            row.UpdatedOn = DateTime.UtcNow;
        }
        else
        {
            row = new TempClaimParty { ClaimId = claimId, ClientId = clientId, CreatedBy = userId, CreatedOn = DateTime.UtcNow };
            _db.TempClaimParties.Add(row);
        }
        ApplyParty(row, req);
        await _db.SaveChangesAsync();
        return MapParty(row);
    }

    public async Task DeleteTempClaimPartyAsync(long claimId, long id, long clientId)
    {
        var row = await _db.TempClaimParties.FirstOrDefaultAsync(x => x.Id == id && x.ClaimId == claimId && x.ClientId == clientId)
            ?? throw new KeyNotFoundException($"Party {id} not found.");
        _db.TempClaimParties.Remove(row);
        await _db.SaveChangesAsync();
    }

    public async Task<List<TempClaimWitnessDto>> GetTempClaimWitnessesAsync(long claimId, long clientId)
    {
        await EnsureClaimAsync(claimId, clientId);
        return await _db.TempClaimWitnesses.Where(x => x.ClaimId == claimId && x.ClientId == clientId).OrderByDescending(x => x.CreatedOn).Select(x => MapWitness(x)).ToListAsync();
    }

    public async Task<TempClaimWitnessDto> UpsertTempClaimWitnessAsync(long claimId, UpsertTempClaimWitnessRequest req, long clientId, long userId)
    {
        await EnsureClaimAsync(claimId, clientId);
        TempClaimWitness row;
        if (req.Id.HasValue && req.Id.Value > 0)
        {
            row = await _db.TempClaimWitnesses.FirstOrDefaultAsync(x => x.Id == req.Id.Value && x.ClaimId == claimId && x.ClientId == clientId)
                ?? throw new KeyNotFoundException($"Witness {req.Id} not found.");
            row.UpdatedBy = userId;
            row.UpdatedOn = DateTime.UtcNow;
        }
        else
        {
            row = new TempClaimWitness { ClaimId = claimId, ClientId = clientId, CreatedBy = userId, CreatedOn = DateTime.UtcNow };
            _db.TempClaimWitnesses.Add(row);
        }
        row.FirstName = req.FirstName; row.MiddleName = req.MiddleName; row.LastName = req.LastName; row.DateOfBirth = req.DateOfBirth; row.Gender = req.Gender; row.SocialSecurityNumber = req.SocialSecurityNumber; row.RelationshipWithInsured = req.RelationshipWithInsured; row.AddressLine1 = req.AddressLine1; row.AddressLine2 = req.AddressLine2; row.Country = req.Country; row.State = req.State; row.City = req.City; row.County = req.County; row.ZipCode = req.ZipCode; row.Latitude = req.Latitude; row.Longitude = req.Longitude; row.TelephoneNumber = req.TelephoneNumber; row.Extension = req.Extension; row.AlternateTelephoneNumber = req.AlternateTelephoneNumber; row.EmailId = req.EmailId; row.Description = req.Description; row.ProfileImageName = req.ProfileImageName; row.IdProofName = req.IdProofName;
        await _db.SaveChangesAsync();
        return MapWitness(row);
    }

    public async Task DeleteTempClaimWitnessAsync(long claimId, long id, long clientId)
    {
        var row = await _db.TempClaimWitnesses.FirstOrDefaultAsync(x => x.Id == id && x.ClaimId == claimId && x.ClientId == clientId)
            ?? throw new KeyNotFoundException($"Witness {id} not found.");
        _db.TempClaimWitnesses.Remove(row);
        await _db.SaveChangesAsync();
    }

    public async Task<List<LossExposureDto>> GetLossExposuresAsync(long claimId, long clientId)
    {
        await EnsureClaimAsync(claimId, clientId);
        const string sql = """
            SELECT id, claim_id AS ClaimId, COALESCE(loss_party, claimant_type) AS LossParty,
                   claimant_reference AS ClaimantReference, claimant_name AS ClaimantName,
                   claimant_type AS ClaimantType, loss_exposure_type_id AS LossExposureTypeId,
                   loss_type AS LossType, coverage_limit AS CoverageLimit,
                   COALESCE(severity, loss_consequences) AS Severity,
                   cause_of_loss_id AS CauseOfLossId,
                   COALESCE(cause_of_loss, loss_consequences) AS CauseOfLoss,
                   percentage_allocation AS PercentageAllocation,
                   property_usable AS PropertyUsable, contractors_involved AS ContractorsInvolved,
                   mold_suspected AS MoldSuspected,
                   additional_living_expense_required AS AdditionalLivingExpenseRequired,
                   content_damage AS ContentDamage, sprinkler_alarm_installed AS SprinklerAlarmInstalled,
                   lienholder_involved AS LienholderInvolved, attorney_involved AS AttorneyInvolved,
                   COALESCE(description_of_loss, notes) AS DescriptionOfLoss,
                   damage_details::text AS DamageDetailsJson,
                   additional_services_required AS AdditionalServicesRequired,
                   loss_consequences AS LossConsequences, loss_estimate AS LossEstimate,
                   currency, notes, to_char(created_on, 'MM-DD-YYYY') AS CreatedOn
            FROM claim_loss_exposure
            WHERE claim_id = @ClaimId AND client_id = @ClientId
            ORDER BY created_on DESC, id DESC
            """;
        var connection = _db.Database.GetDbConnection();
        var closeWhenDone = connection.State != ConnectionState.Open;
        if (closeWhenDone) await connection.OpenAsync();
        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = sql;
            AddParameter(command, "ClaimId", claimId);
            AddParameter(command, "ClientId", clientId);
            var rows = new List<LossExposureDto>();
            await using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync()) rows.Add(MapLossExposure(reader));
            return rows;
        }
        finally
        {
            if (closeWhenDone) await connection.CloseAsync();
        }
    }

    public async Task<LossExposureFormDataDto> GetLossExposureFormDataAsync(long claimId, long clientId)
    {
        await EnsureClaimAsync(claimId, clientId);
        var claim = await _db.Claims.Where(c => c.Id == claimId && c.ClientId == clientId)
            .Select(c => new { c.PolicyId }).SingleAsync();

        var risk = await _db.RiskLocations.Where(r => r.PolicyId == claim.PolicyId && r.ClientId == clientId)
            .OrderBy(r => r.Id).FirstOrDefaultAsync();
        var riskDto = new LossExposureRiskDetailsDto(risk?.OccupancyType, risk?.ConstructionType,
            risk?.AgeOfProperty, risk?.LengthOfOccupancy, risk?.RoofType, risk?.FireProtectionClass);

        var claimantOptions = new List<LossExposureClaimantOptionDto>();
        var insureds = await _db.Insureds.Where(i => i.PolicyId == claim.PolicyId && i.ClientId == clientId)
            .Select(i => new { i.Id, i.FirstName, i.LastName }).ToListAsync();
        claimantOptions.AddRange(insureds.Select(i => new LossExposureClaimantOptionDto(
            $"insured:{i.Id}", JoinName(i.FirstName, null, i.LastName), "First Party")));

        var additionalInsureds = await _db.AdditionalInsureds.Where(i => i.PolicyId == claim.PolicyId && i.ClientId == clientId)
            .Select(i => new { i.Id, i.FirstName, i.MiddleName, i.LastName, i.Dba }).ToListAsync();
        claimantOptions.AddRange(additionalInsureds.Select(i => new LossExposureClaimantOptionDto(
            $"additional-insured:{i.Id}", !string.IsNullOrWhiteSpace(i.Dba) ? i.Dba! : JoinName(i.FirstName, i.MiddleName, i.LastName), "First Party")));

        var claimants = await _db.Claimants.Where(c => c.ClaimId == claimId && c.ClientId == clientId)
            .Select(c => new { c.Id, c.FirstName, c.MiddleName, c.LastName }).ToListAsync();
        claimantOptions.AddRange(claimants.Select(c => new LossExposureClaimantOptionDto(
            $"claimant:{c.Id}", JoinName(c.FirstName, c.MiddleName, c.LastName), "Third Party")));

        var parties = await _db.TempClaimParties.Where(p => p.ClaimId == claimId && p.ClientId == clientId)
            .Select(p => new { p.Id, p.BusinessName, p.FirstName, p.MiddleName, p.LastName }).ToListAsync();
        claimantOptions.AddRange(parties.Select(p => new LossExposureClaimantOptionDto(
            $"party:{p.Id}", !string.IsNullOrWhiteSpace(p.BusinessName) ? p.BusinessName! : JoinName(p.FirstName, p.MiddleName, p.LastName), "Third Party")));
        claimantOptions = claimantOptions.Where(c => !string.IsNullOrWhiteSpace(c.Name))
            .GroupBy(c => new { c.LossParty, Name = c.Name.ToLowerInvariant() }).Select(g => g.First()).ToList();

        var policyLimit = await _db.PolicyLimitCoverages.Where(p => p.PolicyId == claim.PolicyId && p.ClientId == clientId)
            .OrderBy(p => p.Id).FirstOrDefaultAsync();
        var coverages = await _db.ClaimCoverages
            .Where(c => c.Coverage != null && c.Coverage != "Adjuster Fee" && (c.IsHoPhyscialDamage == true || c.IsHoPersonalLiability == true))
            .OrderBy(c => c.Id).ToListAsync();
        var exposureTypes = coverages.Select(c => new LossExposureTypeOptionDto(c.Id, c.Coverage!,
            c.IsHoPersonalLiability == true && c.IsHoPhyscialDamage != true ? "Third Party" : "First Party",
            ResolvePolicyCoverageLimit(c.Coverage!, c.CoverageLimit, policyLimit))).ToList();
        exposureTypes.Add(new LossExposureTypeOptionDto(-1, "Excess Scheduled Blanket Covered Personal Liabilities", "Third Party",
            policyLimit?.ExcessBlanketPlValue?.ToString("N2") ?? policyLimit?.ExcessBlanketPl ?? "-"));
        exposureTypes.Add(new LossExposureTypeOptionDto(-2, "Amount Of Liability Coverage", "Third Party",
            policyLimit?.LiabilityCoverage ?? "-"));

        var causes = (await _db.ClaimCoverages.Where(c => c.CauseOfLoss != null).OrderBy(c => c.CauseOfLoss)
            .Select(c => new CoverageOptionDto(c.Id, c.CauseOfLoss!)).ToListAsync())
            .Where(c => !string.IsNullOrWhiteSpace(c.Name))
            .GroupBy(c => c.Name.Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(g => new CoverageOptionDto(g.First().Id, g.Key))
            .ToList();
        var damageSections = new List<LossExposureDamageSectionDto>
        {
            new("Exterior Ceiling", new List<string> { "Hardwood", "Laminate", "Vinyl", "Concrete" }),
            new("Exterior Siding Cover Material", new List<string> { "Asphalt shingles", "Tiles", "Wood", "Metal", "PVC" })
        };
        return new LossExposureFormDataDto(riskDto, new List<string> { "First Party", "Third Party" },
            claimantOptions, exposureTypes, new List<string> { "Low", "Medium", "High", "Severe", "Catastrophic" }, causes, damageSections);
    }

    public async Task<LossExposureDto> CreateLossExposureAsync(long claimId, CreateLossExposureRequest req, long clientId, long userId)
    {
        await EnsureClaimAsync(claimId, clientId);
        if (req.LossParty is not ("First Party" or "Third Party")) throw new ArgumentException("Loss party is required.");
        if (string.IsNullOrWhiteSpace(req.ClaimantName)) throw new ArgumentException("Claimant name is required.");
        if (req.LossExposureTypeId == 0) throw new ArgumentException("Loss exposure type is required.");
        if (string.IsNullOrWhiteSpace(req.LossType)) throw new ArgumentException("Loss type is required.");
        if (string.IsNullOrWhiteSpace(req.Severity)) throw new ArgumentException("Severity is required.");
        if (string.IsNullOrWhiteSpace(req.CauseOfLoss)) throw new ArgumentException("Cause of loss is required.");
        if (req.PercentageAllocation is < 0 or > 100) throw new ArgumentException("Percentage allocation must be between 0 and 100.");
        if (req.DamageDetails.Any(d => d.PercentageOfDamage is < 0 or > 100)) throw new ArgumentException("Percentage of damage must be between 0 and 100.");
        if (req.DamageDetails.SelectMany(d => d.Images).Any(i => string.IsNullOrWhiteSpace(i.FileName) || i.ContentBase64.Length > 14_000_000))
            throw new ArgumentException("Each damage image must have a file name and be no larger than 10 MB.");
        if (req.LossEstimate < 0) throw new ArgumentException("Loss estimate cannot be negative.");

        var currency = string.IsNullOrWhiteSpace(req.Currency) ? "USD" : req.Currency.Trim().ToUpperInvariant();
        if (currency.Length != 3) throw new ArgumentException("Currency must be a three-letter code.");

        const string sql = """
            INSERT INTO claim_loss_exposure
                (claim_id, client_id, loss_party, claimant_reference, claimant_name, claimant_type,
                 loss_exposure_type_id, loss_type, coverage_limit, severity, cause_of_loss_id,
                 cause_of_loss, percentage_allocation, property_usable, contractors_involved,
                 mold_suspected, additional_living_expense_required, content_damage,
                 sprinkler_alarm_installed, lienholder_involved, attorney_involved,
                 description_of_loss, damage_details, additional_services_required,
                 loss_consequences, loss_estimate, currency, notes, created_by)
            VALUES
                (@ClaimId, @ClientId, @LossParty, @ClaimantReference, @ClaimantName, @LossParty,
                 @LossExposureTypeId, @LossType, @CoverageLimit, @Severity, @CauseOfLossId,
                 @CauseOfLoss, @PercentageAllocation, @PropertyUsable, @ContractorsInvolved,
                 @MoldSuspected, @AdditionalLivingExpenseRequired, @ContentDamage,
                 @SprinklerAlarmInstalled, @LienholderInvolved, @AttorneyInvolved,
                 @DescriptionOfLoss, CAST(@DamageDetails AS jsonb), @AdditionalServicesRequired,
                 @CauseOfLoss, @LossEstimate, @Currency, @Notes, @UserId)
            RETURNING id, claim_id AS ClaimId, loss_party AS LossParty,
                      claimant_reference AS ClaimantReference, claimant_name AS ClaimantName,
                      claimant_type AS ClaimantType, loss_exposure_type_id AS LossExposureTypeId,
                      loss_type AS LossType, coverage_limit AS CoverageLimit, severity AS Severity,
                      cause_of_loss_id AS CauseOfLossId, cause_of_loss AS CauseOfLoss,
                      percentage_allocation AS PercentageAllocation, property_usable AS PropertyUsable,
                      contractors_involved AS ContractorsInvolved, mold_suspected AS MoldSuspected,
                      additional_living_expense_required AS AdditionalLivingExpenseRequired,
                      content_damage AS ContentDamage, sprinkler_alarm_installed AS SprinklerAlarmInstalled,
                      lienholder_involved AS LienholderInvolved, attorney_involved AS AttorneyInvolved,
                      description_of_loss AS DescriptionOfLoss, damage_details::text AS DamageDetailsJson,
                      additional_services_required AS AdditionalServicesRequired,
                      loss_consequences AS LossConsequences, loss_estimate AS LossEstimate,
                      currency, notes, to_char(created_on, 'MM-DD-YYYY') AS CreatedOn
            """;
        var connection = _db.Database.GetDbConnection();
        var closeWhenDone = connection.State != ConnectionState.Open;
        if (closeWhenDone) await connection.OpenAsync();
        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = sql;
            AddParameter(command, "ClaimId", claimId);
            AddParameter(command, "ClientId", clientId);
            AddParameter(command, "LossParty", req.LossParty);
            AddParameter(command, "ClaimantReference", req.ClaimantReference);
            AddParameter(command, "ClaimantName", req.ClaimantName.Trim());
            AddParameter(command, "LossExposureTypeId", req.LossExposureTypeId);
            AddParameter(command, "LossType", req.LossType.Trim());
            AddParameter(command, "CoverageLimit", req.CoverageLimit);
            AddParameter(command, "Severity", req.Severity.Trim());
            AddParameter(command, "CauseOfLossId", req.CauseOfLossId);
            AddParameter(command, "CauseOfLoss", req.CauseOfLoss.Trim());
            AddParameter(command, "PercentageAllocation", req.PercentageAllocation);
            AddParameter(command, "PropertyUsable", req.PropertyUsable);
            AddParameter(command, "ContractorsInvolved", req.ContractorsInvolved);
            AddParameter(command, "MoldSuspected", req.MoldSuspected);
            AddParameter(command, "AdditionalLivingExpenseRequired", req.AdditionalLivingExpenseRequired);
            AddParameter(command, "ContentDamage", req.ContentDamage);
            AddParameter(command, "SprinklerAlarmInstalled", req.SprinklerAlarmInstalled);
            AddParameter(command, "LienholderInvolved", req.LienholderInvolved);
            AddParameter(command, "AttorneyInvolved", req.AttorneyInvolved);
            AddParameter(command, "DescriptionOfLoss", string.IsNullOrWhiteSpace(req.DescriptionOfLoss) ? null : req.DescriptionOfLoss.Trim());
            AddParameter(command, "DamageDetails", JsonSerializer.Serialize(req.DamageDetails));
            AddParameter(command, "AdditionalServicesRequired", req.AdditionalServicesRequired);
            AddParameter(command, "LossEstimate", req.LossEstimate);
            AddParameter(command, "Currency", currency);
            AddParameter(command, "Notes", string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes.Trim());
            AddParameter(command, "UserId", userId);
            await using var reader = await command.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) throw new InvalidOperationException("The loss exposure was not saved.");
            return MapLossExposure(reader);
        }
        finally
        {
            if (closeWhenDone) await connection.CloseAsync();
        }
    }

    public async Task DeleteLossExposureAsync(long claimId, long id, long clientId)
    {
        await EnsureClaimAsync(claimId, clientId);
        const string sql = """
            DELETE FROM claim_loss_exposure
            WHERE id = @Id AND claim_id = @ClaimId AND client_id = @ClientId
            """;
        var connection = _db.Database.GetDbConnection();
        var closeWhenDone = connection.State != ConnectionState.Open;
        if (closeWhenDone) await connection.OpenAsync();
        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = sql;
            AddParameter(command, "Id", id);
            AddParameter(command, "ClaimId", claimId);
            AddParameter(command, "ClientId", clientId);
            if (await command.ExecuteNonQueryAsync() == 0) throw new KeyNotFoundException($"Loss exposure {id} not found.");
        }
        finally
        {
            if (closeWhenDone) await connection.CloseAsync();
        }
    }

    private static void AddParameter(DbCommand command, string name, object? value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value ?? DBNull.Value;
        command.Parameters.Add(parameter);
    }

    private static LossExposureDto MapLossExposure(DbDataReader reader) => new(
        reader.GetInt64(reader.GetOrdinal("id")),
        reader.GetInt64(reader.GetOrdinal("claimid")),
        reader.GetString(reader.GetOrdinal("lossparty")),
        GetNullableString(reader, "claimantreference"),
        reader.GetString(reader.GetOrdinal("claimantname")),
        reader.GetString(reader.GetOrdinal("claimanttype")),
        GetNullableInt64(reader, "lossexposuretypeid"),
        reader.GetString(reader.GetOrdinal("losstype")),
        GetNullableString(reader, "coveragelimit"),
        reader.GetString(reader.GetOrdinal("severity")),
        GetNullableInt64(reader, "causeoflossid"),
        reader.GetString(reader.GetOrdinal("causeofloss")),
        GetNullableDecimal(reader, "percentageallocation"),
        reader.GetBoolean(reader.GetOrdinal("propertyusable")),
        reader.GetBoolean(reader.GetOrdinal("contractorsinvolved")),
        reader.GetBoolean(reader.GetOrdinal("moldsuspected")),
        reader.GetBoolean(reader.GetOrdinal("additionallivingexpenserequired")),
        reader.GetBoolean(reader.GetOrdinal("contentdamage")),
        reader.GetBoolean(reader.GetOrdinal("sprinkleralarminstalled")),
        reader.GetBoolean(reader.GetOrdinal("lienholderinvolved")),
        reader.GetBoolean(reader.GetOrdinal("attorneyinvolved")),
        GetNullableString(reader, "descriptionofloss"),
        JsonSerializer.Deserialize<List<LossExposureDamageDto>>(reader.GetString(reader.GetOrdinal("damagedetailsjson")), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new(),
        reader.GetBoolean(reader.GetOrdinal("additionalservicesrequired")),
        reader.GetString(reader.GetOrdinal("lossconsequences")),
        reader.GetDecimal(reader.GetOrdinal("lossestimate")),
        reader.GetString(reader.GetOrdinal("currency")),
        reader.IsDBNull(reader.GetOrdinal("notes")) ? null : reader.GetString(reader.GetOrdinal("notes")),
        reader.GetString(reader.GetOrdinal("createdon")));

    private static string? GetNullableString(DbDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : reader.GetString(reader.GetOrdinal(name));
    private static long? GetNullableInt64(DbDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : reader.GetInt64(reader.GetOrdinal(name));
    private static decimal? GetNullableDecimal(DbDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : reader.GetDecimal(reader.GetOrdinal(name));
    private static string JoinName(string? first, string? middle, string? last) => string.Join(" ", new[] { first, middle, last }.Where(x => !string.IsNullOrWhiteSpace(x)));

    private static string ResolvePolicyCoverageLimit(string coverage, string? masterLimit, PolicyLimitCoverage? limits)
    {
        if (limits == null) return string.IsNullOrWhiteSpace(masterLimit) ? "-" : masterLimit;
        return coverage switch
        {
            "Dwelling Asset" => FormatLimit(limits.DwellingAssetLimit),
            "Appurtenant structure" => FormatLimit(limits.AppurtenantStructureAsset),
            "Personal assets (other than fixed assets)" => FormatLimit(limits.PersonalBelongingsAsset),
            "Dwelling occupancy disruption" => FormatLimit(limits.DwellingOccupancy),
            "Personal liabilities" => string.IsNullOrWhiteSpace(limits.LiabilityCoverage) ? "-" : limits.LiabilityCoverage,
            _ => string.IsNullOrWhiteSpace(masterLimit) ? "-" : masterLimit
        };
    }

    private static string FormatLimit(decimal? value) => value.HasValue ? $"{value.Value:N2}" : "-";

    private async Task EnsureClaimAsync(long claimId, long clientId)
    {
        if (!await ApplyProducerScope(_db.Claims.Where(c => c.ClientId == clientId))
            .AnyAsync(c => c.Id == claimId))
            throw new KeyNotFoundException($"Claim {claimId} not found.");
    }

    private async Task<long?> ResolveUserIdAsync(string? fullName, long clientId)
    {
        if (string.IsNullOrWhiteSpace(fullName) || fullName == "-") return null;
        var name = fullName.Trim().ToLower();
        return await _db.Users.Where(u => u.ClientId == clientId && (u.FirstName + " " + u.LastName).ToLower() == name).Select(u => (long?)u.Id).FirstOrDefaultAsync();
    }

    private async Task<List<ClaimDocumentDto>> MapDocumentsAsync(List<ClaimDocument> docs)
    {
        var userIds = docs.Where(d => d.NotifyTo.HasValue).Select(d => d.NotifyTo!.Value).Distinct().ToList();
        var users = await _db.Users.Where(u => userIds.Contains(u.Id)).Select(u => new { u.Id, Name = u.FirstName + " " + u.LastName }).ToDictionaryAsync(u => u.Id, u => u.Name);
        return docs.Select(d => new ClaimDocumentDto(d.Id, d.FileName, d.ContentType, d.FileSize, d.NotifyTo.HasValue && users.TryGetValue(d.NotifyTo.Value, out var name) ? name : null, d.Comment, d.CreatedOn.ToString("MM-dd-yyyy"))).ToList();
    }

    private static byte[]? DecodeBase64(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var comma = value.IndexOf(',');
        var payload = comma >= 0 ? value[(comma + 1)..] : value;
        return Convert.FromBase64String(payload);
    }

    private static TempClaimReportDto MapReport(TempClaimReport x) => new(x.Id, x.ClaimId, x.ReportType, x.ReportNumber, x.ReportFilingDate, x.PrecinctName, x.CaseStatus, x.NumberOfWitness, x.Description, x.NotifyDocumentUpload, x.NotifyToName, x.Comment, x.ContactFirstName, x.ContactLastName, x.IdentityDocument, x.TelephoneNumber, x.Extension, x.AlternateTelephoneNumber, x.EmailId, x.ReferenceDocumentName, x.CreatedOn.ToString("MM-dd-yyyy"));

    private static TempClaimPartyDto MapParty(TempClaimParty x) => new(x.Id, x.ClaimId, x.PartyType, x.PartyCategory, x.BusinessName, x.TinId, x.FirstName, x.MiddleName, x.LastName, x.DateOfBirth, x.Gender, x.SocialSecurityNumber, x.RelationshipWithInsured, x.AddressLine1, x.AddressLine2, x.Country, x.State, x.City, x.County, x.ZipCode, x.Latitude, x.Longitude, x.TelephoneNumber, x.Extension, x.AlternateTelephoneNumber, x.EmailId, x.Description, x.ProfileImageName, x.IdProofName, x.CreatedOn.ToString("MM-dd-yyyy"));

    private static TempClaimWitnessDto MapWitness(TempClaimWitness x) => new(x.Id, x.ClaimId, x.FirstName, x.MiddleName, x.LastName, x.DateOfBirth, x.Gender, x.SocialSecurityNumber, x.RelationshipWithInsured, x.AddressLine1, x.AddressLine2, x.Country, x.State, x.City, x.County, x.ZipCode, x.Latitude, x.Longitude, x.TelephoneNumber, x.Extension, x.AlternateTelephoneNumber, x.EmailId, x.Description, x.ProfileImageName, x.IdProofName, x.CreatedOn.ToString("MM-dd-yyyy"));

    private static void ApplyParty(TempClaimParty row, UpsertTempClaimPartyRequest req)
    {
        row.PartyType = req.PartyType; row.PartyCategory = req.PartyCategory; row.BusinessName = req.BusinessName; row.TinId = req.TinId; row.FirstName = req.FirstName; row.MiddleName = req.MiddleName; row.LastName = req.LastName; row.DateOfBirth = req.DateOfBirth; row.Gender = req.Gender; row.SocialSecurityNumber = req.SocialSecurityNumber; row.RelationshipWithInsured = req.RelationshipWithInsured; row.AddressLine1 = req.AddressLine1; row.AddressLine2 = req.AddressLine2; row.Country = req.Country; row.State = req.State; row.City = req.City; row.County = req.County; row.ZipCode = req.ZipCode; row.Latitude = req.Latitude; row.Longitude = req.Longitude; row.TelephoneNumber = req.TelephoneNumber; row.Extension = req.Extension; row.AlternateTelephoneNumber = req.AlternateTelephoneNumber; row.EmailId = req.EmailId; row.Description = req.Description; row.ProfileImageName = req.ProfileImageName; row.IdProofName = req.IdProofName;
    }

    public async Task DeleteDraftAsync(long claimId, long clientId)
    {
        var claim = await ApplyProducerScope(_db.Claims.Where(c => c.ClientId == clientId))
            .FirstOrDefaultAsync(c => c.Id == claimId && c.Status == "DRAFT")
            ?? throw new KeyNotFoundException($"DRAFT claim {claimId} not found.");
        _db.Claims.Remove(claim);
        await _db.SaveChangesAsync();
    }

    // ─── Reference Data ───────────────────────────────────────────────────────

    public async Task<ClaimReferenceDataDto> GetReferenceDataAsync()
    {
        var channels = await _db.ClaimInitiationChannels.Select(c => c.Name).OrderBy(n => n).ToListAsync();
        var conseqs  = await _db.ConsequencesOfLoss.Select(c => c.Name).OrderBy(n => n).ToListAsync();

        // Coverage types from master catalog (IsHoPhyscialDamage = true, exclude Adjuster Fee)
        var physCov = await _db.ClaimCoverages
            .Where(c => c.IsHoPhyscialDamage == true && c.Coverage != null && c.Coverage != "Adjuster Fee")
            .OrderBy(c => c.Coverage)
            .Select(c => new CoverageOptionDto(c.Id, c.Coverage!))
            .ToListAsync();

        // Personal liability coverage types (IsHoPersonalLiability = true, exclude Adjuster Fee)
        var liabCov = await _db.ClaimCoverages
            .Where(c => c.IsHoPersonalLiability == true && c.Coverage != null && c.Coverage != "Adjuster Fee")
            .OrderBy(c => c.Coverage)
            .Select(c => new CoverageOptionDto(c.Id, c.Coverage!))
            .ToListAsync();

        // Cause of loss entries from master catalog
        var causes = await _db.ClaimCoverages
            .Where(c => c.CauseOfLoss != null && c.CauseOfLoss != "")
            .OrderBy(c => c.CauseOfLoss)
            .Select(c => new CoverageOptionDto(c.Id, c.CauseOfLoss!))
            .ToListAsync();

        // Impacted assets — legacy flat list from impacted_asset table for worksheet use
        var assets = await _db.ImpactedAssets.Select(a => a.Name).OrderBy(n => n).ToListAsync();

        var relationships = new List<string>
        {
            "No Prior Relationship", "Self", "Spouse", "Son", "Daughter",
            "Parent", "Sibling", "Friend", "Neighbor", "Tenant",
            "Employee", "Contractor", "Other"
        };

        return new ClaimReferenceDataDto(channels, causes, conseqs, physCov, liabCov, assets, relationships);
    }

    public async Task<List<string>> GetImpactedAssetsForCoverageAsync(long coverageId)
    {
        var now = DateTime.UtcNow;
        return await _db.ClaimCoverageLimits
            .Where(l => l.ClaimCoverageId == coverageId
                     && l.AssetType != null
                     && (l.FromDate == null || l.FromDate <= now)
                     && (l.ToDate == null || l.ToDate >= now))
            .Select(l => l.AssetType!)
            .Distinct()
            .OrderBy(a => a)
            .ToListAsync();
    }

    public async Task<string?> GetCoverageLimitAsync(long coverageId)
    {
        var cc = await _db.ClaimCoverages.FindAsync(coverageId);
        return cc?.CoverageLimit;
    }

    public async Task<(decimal? Limit, string? Code)> GetColLossLimitAsync(long colId)
    {
        var now = DateTime.UtcNow;
        var row = await _db.ClaimCoverageLimits
            .Where(l => l.ClaimCoverageId == colId
                     && (l.AssetType == null || l.AssetType == "")
                     && (l.FromDate == null || l.FromDate <= now)
                     && (l.ToDate == null || l.ToDate >= now))
            .FirstOrDefaultAsync();
        if (row == null) return (null, null);
        decimal? limit = null;
        if (decimal.TryParse(row.StandardLimit, System.Globalization.NumberStyles.Any,
                             System.Globalization.CultureInfo.InvariantCulture, out var lv)) limit = lv;
        return (limit, row.StandardClaimCode);
    }

    public async Task<(decimal? Limit, string? Code)> GetAssetDetailAsync(long coverageId, string assetType)
    {
        var now = DateTime.UtcNow;
        var row = await _db.ClaimCoverageLimits
            .Where(l => l.ClaimCoverageId == coverageId
                     && l.AssetType == assetType
                     && (l.FromDate == null || l.FromDate <= now)
                     && (l.ToDate == null || l.ToDate >= now))
            .FirstOrDefaultAsync();
        if (row == null) return (null, null);
        decimal? limit = null;
        var cleanLimit = row.StandardLimit?.Replace(",", "");
        if (decimal.TryParse(cleanLimit, System.Globalization.NumberStyles.Any,
                             System.Globalization.CultureInfo.InvariantCulture, out var lv)) limit = lv;
        return (limit, row.StandardClaimCode);
    }

    // ─── Assignable Users (Claim Assignment Modal) ────────────────────────────

    public async Task<List<AssignableUserDto>> GetAssignableUsersAsync(long clientId, string? search)
    {
        var joined = _db.ClaimAuthorities
            .Where(ca => ca.ClientId == clientId && ca.IsActive)
            .Join(_db.Users, ca => ca.UserId, u => u.Id, (ca, u) => new { ca, u })
            .Where(x => x.u.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            joined = joined.Where(x =>
                x.u.FirstName.ToLower().Contains(s) ||
                x.u.LastName.ToLower().Contains(s) ||
                x.u.Email.ToLower().Contains(s));
        }

        return await joined
            .OrderBy(x => x.u.FirstName).ThenBy(x => x.u.LastName)
            .Select(x => new AssignableUserDto(
                x.u.Id,
                $"{x.u.FirstName} {x.u.LastName}".Trim(),
                $"IE{x.u.Id:D4}",
                x.ca.PaymentApprovalLimit.ToString("C"),
                x.ca.ReserveApprovalLimit.ToString("C")
            ))
            .ToListAsync();
    }

    // ─── Claims Authority List ─────────────────────────────────────────────────

    public async Task<List<ClaimAuthorityDto>> GetAuthorityListAsync(long clientId, string? search)
    {
        var query = _db.ClaimAuthorities
            .Where(ca => ca.ClientId == clientId)
            .Join(_db.Users, ca => ca.UserId, u => u.Id, (ca, u) => new { ca, u });

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(x =>
                x.u.FirstName.ToLower().Contains(s) ||
                x.u.LastName.ToLower().Contains(s) ||
                x.ca.ApprovedLob.ToLower().Contains(s) ||
                x.ca.Currency.ToLower().Contains(s));
        }

        var items = await query
            .OrderBy(x => x.ca.IsActive ? 0 : 1)
            .ThenBy(x => x.u.FirstName).ThenBy(x => x.u.LastName)
            .ToListAsync();

        // Department: first Group with IsDepartment=true the user belongs to
        var userIds = items.Select(x => x.u.Id).Distinct().ToList();
        var deptMap = await _db.GroupUsers
            .Where(gu => userIds.Contains(gu.UserId))
            .Join(_db.Groups.Where(g => g.IsDepartment),
                  gu => gu.GroupId, g => g.Id,
                  (gu, g) => new { gu.UserId, g.GroupName })
            .GroupBy(x => x.UserId)
            .Select(g => new { UserId = g.Key, Dept = g.First().GroupName })
            .ToDictionaryAsync(x => x.UserId, x => x.Dept);

        return items.Select(x => new ClaimAuthorityDto(
            x.ca.Id,
            $"IE{x.u.Id:D4}",
            $"{x.u.FirstName} {x.u.LastName}".Trim(),
            x.u.Initials,
            deptMap.GetValueOrDefault(x.u.Id, "-"),
            "-",
            x.ca.ApprovedLob,
            x.ca.Currency,
            x.ca.ReserveApprovalLimit,
            x.ca.PaymentApprovalLimit,
            x.ca.FeePaymentLimit,
            x.ca.ExGratiaPaymentLimit,
            x.ca.JurisdictionLocation ?? "-",
            x.ca.IsActive ? "Active" : "Inactive"
        )).ToList();
    }

    // ─── Authority Detail ─────────────────────────────────────────────────────

    public async Task<ClaimAuthorityDetailDto?> GetAuthorityDetailAsync(long clientId, long id)
    {
        var ca = await _db.ClaimAuthorities
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Id == id && x.ClientId == clientId);

        if (ca is null || ca.User is null) return null;

        // Department: first group with IsDepartment=true the user belongs to
        var dept = await _db.GroupUsers
            .Where(gu => gu.UserId == ca.UserId)
            .Join(_db.Groups.Where(g => g.IsDepartment), gu => gu.GroupId, g => g.Id, (gu, g) => g.GroupName)
            .FirstOrDefaultAsync() ?? "-";

        // Resolve actor names (created_by, updated_by, approved_by)
        var actorIds = new[] { ca.CreatedBy, ca.UpdatedBy, ca.ApprovedBy }
            .Where(x => x.HasValue).Select(x => x!.Value).Distinct().ToList();

        var actors = await _db.Users
            .Where(u => actorIds.Contains(u.Id))
            .Select(u => new { u.Id, u.FirstName, u.LastName })
            .ToDictionaryAsync(u => u.Id);

        string ActorName(long? userId) =>
            userId.HasValue && actors.TryGetValue(userId.Value, out var a)
                ? $"{a.FirstName} {a.LastName}".Trim() : "-";

        string ActorInitials(long? userId) =>
            userId.HasValue && actors.TryGetValue(userId.Value, out var a)
                ? $"{(a.FirstName.Length > 0 ? a.FirstName[0] : ' ')}{(a.LastName.Length > 0 ? a.LastName[0] : ' ')}".Trim().ToUpper() : "-";

        // Jurisdiction country name — inline lookup (country table is not an EF entity)
        var _countryNames = new Dictionary<string, string>
        {
            ["US"] = "United States", ["CA"] = "Canada", ["GB"] = "United Kingdom",
            ["AU"] = "Australia", ["IN"] = "India", ["DE"] = "Germany",
            ["FR"] = "France", ["JP"] = "Japan", ["SG"] = "Singapore", ["AE"] = "United Arab Emirates",
        };
        var countryName = !string.IsNullOrWhiteSpace(ca.JurisdictionCountry) &&
                          _countryNames.TryGetValue(ca.JurisdictionCountry, out var cn) ? cn
                          : ca.JurisdictionCountry ?? "-";

        return new ClaimAuthorityDetailDto(
            ca.Id,
            $"IE{ca.User.Id:D4}",
            ca.User.FirstName,
            null,
            ca.User.LastName,
            ca.User.Initials,
            dept,
            ca.Designation ?? "-",
            ca.IsActive ? "Active" : "Inactive",
            ca.InsuranceType ?? "-",
            ca.ApprovedLob,
            ca.Currency,
            ca.ReserveApprovalLimit,
            ca.PaymentApprovalLimit,
            ca.FeePaymentLimit,
            ca.ExGratiaPaymentLimit,
            ca.PaymentMethodRestrictions ?? "-",
            ca.DateOfAuthorityAssignment.HasValue
                ? ca.DateOfAuthorityAssignment.Value.ToString("MM-dd-yyyy") : "-",
            ca.CanDenyWorksheet,
            countryName,
            ca.JurisdictionStates ?? "-",
            ActorName(ca.UpdatedBy),
            ActorInitials(ca.UpdatedBy),
            ActorName(ca.ApprovedBy),
            ActorInitials(ca.ApprovedBy),
            ActorName(ca.CreatedBy),
            ActorInitials(ca.CreatedBy),
            ca.UpdatedOn.HasValue ? ca.UpdatedOn.Value.ToString("MM-dd-yyyy") : "-",
            "Approved"
        );
    }

    // ─── Authority Create ─────────────────────────────────────────────────────

    public async Task<long> CreateAuthorityAsync(long clientId, CreateClaimAuthorityRequest req, long createdByUserId)
    {
        var now = DateTime.UtcNow;
        var ca = new ClaimAuthority
        {
            ClientId = clientId,
            UserId = req.UserId,
            InsuranceType = req.InsuranceType,
            ApprovedLob = req.ApprovedLob,
            Currency = req.Currency,
            ReserveApprovalLimit = req.ReserveLimit,
            PaymentApprovalLimit = req.IndemnityPaymentLimit,
            FeePaymentLimit = req.FeePaymentLimit,
            ExGratiaPaymentLimit = req.ExGratiaPaymentLimit,
            PaymentMethodRestrictions = req.PaymentMethodRestrictions,
            CanDenyWorksheet = req.CanDenyWorksheet,
            JurisdictionCountry = req.JurisdictionCountry,
            JurisdictionStates = req.JurisdictionStates,
            IsActive = true,
            CreatedOn = now,
            CreatedBy = createdByUserId,
            UpdatedBy = createdByUserId,
            UpdatedOn = now,
            ApprovedBy = createdByUserId,
            ApprovedOn = now,
        };

        if (!string.IsNullOrWhiteSpace(req.DateOfAuthorityAssignment) &&
            DateOnly.TryParseExact(req.DateOfAuthorityAssignment, "MM-dd-yyyy",
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None, out var d))
            ca.DateOfAuthorityAssignment = d;

        _db.ClaimAuthorities.Add(ca);
        await _db.SaveChangesAsync();
        return ca.Id;
    }

    // ─── Authority Update / Approve / Revoke ─────────────────────────────────

    public async Task<bool> UpdateAuthorityAsync(long clientId, long id, UpdateClaimAuthorityRequest req, long updatedByUserId)
    {
        var ca = await _db.ClaimAuthorities.FirstOrDefaultAsync(x => x.Id == id && x.ClientId == clientId);
        if (ca is null) return false;

        ca.InsuranceType = req.InsuranceType;
        ca.ApprovedLob = req.ApprovedLob;
        ca.Currency = req.Currency;
        ca.ReserveApprovalLimit = req.ReserveLimit;
        ca.PaymentApprovalLimit = req.IndemnityPaymentLimit;
        ca.FeePaymentLimit = req.FeePaymentLimit;
        ca.ExGratiaPaymentLimit = req.ExGratiaPaymentLimit;
        ca.PaymentMethodRestrictions = req.PaymentMethodRestrictions;
        ca.CanDenyWorksheet = req.CanDenyWorksheet;
        ca.JurisdictionCountry = req.JurisdictionCountry;
        ca.JurisdictionStates = req.JurisdictionStates;
        ca.UpdatedBy = updatedByUserId;
        ca.UpdatedOn = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(req.DateOfAuthorityAssignment) &&
            DateOnly.TryParseExact(req.DateOfAuthorityAssignment, "MM-dd-yyyy",
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None, out var d))
            ca.DateOfAuthorityAssignment = d;

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ApproveAuthorityAsync(long clientId, long id, long approvedByUserId)
    {
        var ca = await _db.ClaimAuthorities.FirstOrDefaultAsync(x => x.Id == id && x.ClientId == clientId);
        if (ca is null) return false;

        ca.IsActive = true;
        ca.ApprovedBy = approvedByUserId;
        ca.ApprovedOn = DateTime.UtcNow;
        ca.UpdatedBy = approvedByUserId;
        ca.UpdatedOn = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RevokeAuthorityAsync(long clientId, long id, long updatedByUserId)
    {
        var ca = await _db.ClaimAuthorities.FirstOrDefaultAsync(x => x.Id == id && x.ClientId == clientId);
        if (ca is null) return false;

        ca.IsActive = false;
        ca.UpdatedBy = updatedByUserId;
        ca.UpdatedOn = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return true;
    }

    // ─── Users for Authority Selection ────────────────────────────────────────

    public async Task<List<ClaimAuthorityUserSelectionDto>> GetUsersForAuthoritySelectionAsync(
        long clientId, string? searchKeyword, string? searchParameter)
    {
        // Users who belong to a group flagged as Department with "Claims" in the name
        var claimsUserIds = await _db.GroupUsers
            .Join(_db.Groups.Where(g => g.IsDepartment && g.GroupName.ToLower().Contains("claims")),
                  gu => gu.GroupId, g => g.Id,
                  (gu, g) => gu.UserId)
            .Distinct()
            .ToListAsync();

        var query = _db.Users.Where(u => u.ClientId == clientId && claimsUserIds.Contains(u.Id));

        // In-DB search for UserName only (UserCode and Department require in-memory resolution)
        if (!string.IsNullOrWhiteSpace(searchKeyword) && searchParameter?.ToLower() == "username")
        {
            var kw = searchKeyword.ToLower();
            query = query.Where(u => u.FirstName.ToLower().Contains(kw) || u.LastName.ToLower().Contains(kw));
        }

        var users = await query.OrderBy(u => u.FirstName).ThenBy(u => u.LastName).ToListAsync();

        // Resolve department names
        var userIds = users.Select(u => u.Id).ToList();
        var deptMap = await _db.GroupUsers
            .Where(gu => userIds.Contains(gu.UserId))
            .Join(_db.Groups.Where(g => g.IsDepartment),
                  gu => gu.GroupId, g => g.Id,
                  (gu, g) => new { gu.UserId, g.GroupName })
            .GroupBy(x => x.UserId)
            .Select(g => new { UserId = g.Key, Dept = g.First().GroupName })
            .ToDictionaryAsync(x => x.UserId, x => x.Dept);

        var result = users.Select(u => new ClaimAuthorityUserSelectionDto(
            u.Id,
            $"IE{u.Id:D4}",
            $"{u.FirstName} {u.LastName}".Trim(),
            u.Initials,
            deptMap.GetValueOrDefault(u.Id, "-"),
            "-",
            u.IsActive ? "Active" : "Inactive"
        )).ToList();

        // Post-query filters for UserId (IE code) and Department
        if (!string.IsNullOrWhiteSpace(searchKeyword))
        {
            var kw = searchKeyword.ToLower();
            var param = searchParameter?.ToLower();
            if (param == "userid")
                result = result.Where(r => r.UserCode.ToLower().Contains(kw)).ToList();
            else if (param == "department")
                result = result.Where(r => r.Department.ToLower().Contains(kw)).ToList();
        }

        return result;
    }

    // ─── Insured & Policy workflow screen ────────────────────────────────────────

    public async Task<InsuredPolicyViewDto?> GetInsuredPolicyViewAsync(long claimId, long clientId)
    {
        var claim = await _db.Claims
            .Where(c => c.Id == claimId && c.ClientId == clientId)
            .Include(c => c.Policy).ThenInclude(p => p!.Insured)
            .Include(c => c.Policy).ThenInclude(p => p!.RiskLocation)
            .FirstOrDefaultAsync();

        if (claim == null) return null;

        PolicyDetailsDto? policyDto = null;
        InsuredDetailsDto? insuredDto = null;

        if (claim.Policy != null)
        {
            policyDto = await GetPolicyDetailsAsync(claim.Policy.Id, clientId);
            insuredDto = policyDto?.Insured;
        }

        var parties = await _db.TempClaimParties
            .Where(p => p.ClaimId == claimId && p.ClientId == clientId)
            .ToListAsync();

        var namedInsureds = parties
            .Where(p => p.PartyType != "Organization")
            .Select(p => new NamedInsuredRowDto(
                p.Id,
                string.Join(" ", new[] { p.FirstName, p.MiddleName, p.LastName }
                    .Where(s => !string.IsNullOrWhiteSpace(s))),
                p.RelationshipWithInsured,
                p.TelephoneNumber,
                p.AlternateTelephoneNumber,
                p.EmailId,
                p.PartyCategory,
                p.BusinessName))
            .ToList();

        var organizations = parties
            .Where(p => p.PartyType == "Organization")
            .Select(p => new OrganizationRowDto(
                p.Id,
                p.BusinessName,
                p.PartyCategory,
                p.TelephoneNumber,
                p.Extension,
                p.AlternateTelephoneNumber,
                p.EmailId,
                string.Join(" ", new[] { p.FirstName, p.LastName }
                    .Where(s => !string.IsNullOrWhiteSpace(s)))))
            .ToList();

        var lossLocation = string.Join(", ", new[]
        {
            claim.LossAddressLine1, claim.LossAddressLine2,
            claim.LossCity, claim.LossCounty,
            claim.LossState, claim.LossZipCode
        }.Where(s => !string.IsNullOrWhiteSpace(s)));

        return new InsuredPolicyViewDto(insuredDto, namedInsureds, organizations, policyDto, lossLocation.Length > 0 ? lossLocation : null);
    }
}








