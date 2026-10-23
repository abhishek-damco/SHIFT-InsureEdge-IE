// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Submission (quote wizard draft) service — delegates to ISubmissionRepository.
// BR-SUB-001/002: id generation + shallow-merge semantics live in the repository.
using InsureEdge.Application.DTOs.QuotesPolicies;
using InsureEdge.Application.Interfaces;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace InsureEdge.Application.Services;

public class SubmissionService
{
    private readonly ISubmissionRepository _repo;
    private readonly ICurrentTenantService _tenant;

    public SubmissionService(ISubmissionRepository repo, ICurrentTenantService tenant)
    {
        _repo = repo;
        _tenant = tenant;
    }

    public Task<SubmissionDto> CreateAsync(CreateSubmissionRequest req)
        => _repo.CreateAsync(_tenant.ClientId, _tenant.UserId, req);

    public Task<SubmissionDto?> GetByIdAsync(string id)
        => _repo.GetByIdAsync(_tenant.ClientId, id);

    public Task<string?> GetSubmissionIdByQuoteNumberAsync(string quoteNumber)
        => _repo.GetSubmissionIdByQuoteNumberAsync(_tenant.ClientId, quoteNumber);

    public Task<SubmissionDto> UpsertAsync(string id, UpdateSubmissionRequest req)
        => _repo.UpsertAsync(_tenant.ClientId, _tenant.UserId, id, req);

    public Task<bool> DeleteAsync(string id)
        => _repo.DeleteAsync(_tenant.ClientId, id);

    public Task<SubmissionCommissionDto?> GetCommissionAsync(string id)
        => _repo.GetCommissionAsync(_tenant.ClientId, id);

    public Task<PaymentPlanResponse?> GetPaymentPlanAsync(string id)
        => _repo.GetPaymentPlanAsync(_tenant.ClientId, id);

    public Task<PaymentPlanResponse> SavePaymentPlanAsync(string id, SavePaymentPlanRequest req)
        => _repo.SavePaymentPlanAsync(_tenant.ClientId, _tenant.UserId, id, req);

    public Task<IssuePolicyResponse> BindPolicyAsync(string id)
        => _repo.BindPolicyAsync(_tenant.ClientId, _tenant.UserId, id);

    public Task<IssuePolicyResponse> IssuePolicyAsync(string id)
        => _repo.IssuePolicyAsync(_tenant.ClientId, _tenant.UserId, id);

    public Task<IssuePolicyResponse> IssueEndorsementAsync(string id)
        => _repo.IssueEndorsementAsync(_tenant.ClientId, _tenant.UserId, id);

    /// <summary>Convert a renewal policy to form data JSON for NewSubmission stepper, merging prior policy data</summary>
    public Task<string> BuildRenewalFormDataJsonAsync(Domain.Entities.Policy renewalPolicy, Domain.Entities.Policy? priorPolicy = null, string? priorSubmissionDataJson = null)
    {
        // Build renewal/endorsement form data by merging prior submission + policy data
        // Priority: submission data > policy data > fallback

        System.Console.WriteLine($"[BuildRenewalFormDataJsonAsync] priorPolicy={priorPolicy != null}, priorSubmissionDataJson={!string.IsNullOrEmpty(priorSubmissionDataJson)}");

        var formDict = new Dictionary<string, object?>();
        var otherData = new Dictionary<string, object?>();

        // Step 1: Start with prior submission data if available
        if (!string.IsNullOrEmpty(priorSubmissionDataJson))
        {
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(priorSubmissionDataJson);
                var priorDataElem = doc.RootElement;

                if (priorDataElem.TryGetProperty("form", out var formElement))
                {
                    var formData = JsonSerializer.Deserialize<Dictionary<string, object?>>(formElement.GetRawText());
                    if (formData != null)
                    {
                        System.Console.WriteLine($"[BuildRenewalFormDataJsonAsync] Loaded {formData.Count} form fields from prior submission");
                        System.Console.WriteLine($"  - Has state: {formData.ContainsKey("state")}, Value: {formData.FirstOrDefault(x => x.Key == "state").Value}");
                        System.Console.WriteLine($"  - Has addressLine1: {formData.ContainsKey("addressLine1")}, Value: {formData.FirstOrDefault(x => x.Key == "addressLine1").Value}");
                        foreach (var kvp in formData)
                        {
                            formDict[kvp.Key] = kvp.Value;
                        }
                    }
                }

                // Copy other data structures
                if (priorDataElem.TryGetProperty("locations", out var locsElement))
                    otherData["locations"] = JsonSerializer.Deserialize<object>(locsElement.GetRawText());
                if (priorDataElem.TryGetProperty("mortgages", out var mortElement))
                    otherData["mortgages"] = JsonSerializer.Deserialize<object>(mortElement.GetRawText());
                if (priorDataElem.TryGetProperty("additionalInsureds", out var addInsElement))
                    otherData["additionalInsureds"] = JsonSerializer.Deserialize<object>(addInsElement.GetRawText());
                if (priorDataElem.TryGetProperty("additionalOrgs", out var addOrgElement))
                    otherData["additionalOrgs"] = JsonSerializer.Deserialize<object>(addOrgElement.GetRawText());
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[BuildRenewalFormDataJsonAsync] Error parsing prior submission: {ex.Message}");
            }
        }

        // Step 2: Enhance with policy data (addresses, policy details, etc.)
        // Note: Dates come from submission data above, not from policy entity
        if (priorPolicy != null)
        {
            // Add policy details (submission data has the dates already)
            if (!string.IsNullOrEmpty(priorPolicy.PolicyNumber) && !formDict.ContainsKey("policyNumber"))
                formDict["policyNumber"] = priorPolicy.PolicyNumber;
            if (!string.IsNullOrEmpty(priorPolicy.QuoteNumber) && !formDict.ContainsKey("quoteNumber"))
                formDict["quoteNumber"] = priorPolicy.QuoteNumber;
            if (priorPolicy.IntermediaryId.HasValue && !formDict.ContainsKey("brokerageFirmId"))
                formDict["brokerageFirmId"] = priorPolicy.IntermediaryId;
            if (priorPolicy.ProducerId.HasValue && !formDict.ContainsKey("producerId"))
                formDict["producerId"] = priorPolicy.ProducerId;
            if (!string.IsNullOrEmpty(priorPolicy.Lob) && !formDict.ContainsKey("lob"))
                formDict["lob"] = priorPolicy.Lob;
            if (!string.IsNullOrEmpty(priorPolicy.SubProduct) && !formDict.ContainsKey("subProduct"))
                formDict["subProduct"] = priorPolicy.SubProduct;
            if (!string.IsNullOrEmpty(priorPolicy.PolicyTerm) && !formDict.ContainsKey("policyTerm"))
                formDict["policyTerm"] = priorPolicy.PolicyTerm;
            if (!string.IsNullOrEmpty(priorPolicy.InsuredName) && !formDict.ContainsKey("insuredName"))
                formDict["insuredName"] = priorPolicy.InsuredName;
            if (!string.IsNullOrEmpty(priorPolicy.Country) && !formDict.ContainsKey("country"))
                formDict["country"] = priorPolicy.Country;
            if (!string.IsNullOrEmpty(priorPolicy.StateProvince) && !formDict.ContainsKey("state"))
                formDict["state"] = priorPolicy.StateProvince;
            if (!string.IsNullOrEmpty(priorPolicy.Address) && !formDict.ContainsKey("addressLine1"))
                formDict["addressLine1"] = priorPolicy.Address;
        }

        // Step 3: Build final response
        var response = new
        {
            form = formDict,
            locations = otherData.ContainsKey("locations") ? otherData["locations"] : null,
            mortgages = otherData.ContainsKey("mortgages") ? otherData["mortgages"] : null,
            additionalInsureds = otherData.ContainsKey("additionalInsureds") ? otherData["additionalInsureds"] : null,
            additionalOrgs = otherData.ContainsKey("additionalOrgs") ? otherData["additionalOrgs"] : null,
            recordId = renewalPolicy.Id.ToString(),
            recordStatus = renewalPolicy.PolicyStatus,
            isRenewal = renewalPolicy.PolicyType == "RENEWAL",
            isEndorsement = renewalPolicy.PolicyType == "ENDORSEMENT",
            renewalOfPolicyId = renewalPolicy.Extended?.PriorPolicyId,
        };

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        });

        return Task.FromResult(json);
    }
}
