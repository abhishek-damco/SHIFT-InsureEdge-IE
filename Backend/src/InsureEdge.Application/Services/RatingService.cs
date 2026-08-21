// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// HBIS rating service — delegates to IRatingRepository.
// BR-RATE-001: plan comparison is a pure calculation, no tenant scoping needed.
using InsureEdge.Application.DTOs.QuotesPolicies;
using InsureEdge.Application.Interfaces;

namespace InsureEdge.Application.Services;

public class RatingService
{
    private readonly IRatingRepository _repo;

    public RatingService(IRatingRepository repo)
    {
        _repo = repo;
    }

    public HbisPlanComparisonResultDto CalculatePlanComparison(HbisPlanComparisonForm form)
        => _repo.CalculatePlanComparison(form);

    public Task<HbTaxDetailsDto> GetHbTaxDetailsAsync(string state, decimal premiumValue, decimal policyFee)
        => _repo.GetHbTaxDetailsAsync(state, premiumValue, policyFee);
}
