// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// HBIS rating engine: plan comparison (pure calculation, no DB) + state tax lookup
// (DB-first with in-memory fallback table), ported faithfully from server.js
// hbisPlanComparison() / GET /api/hb-tax-details.
using InsureEdge.Application.DTOs.QuotesPolicies;

namespace InsureEdge.Application.Interfaces;

public interface IRatingRepository
{
    // Pure in-memory calculation — no clientId scoping needed (mirrors server.js: no DB access).
    HbisPlanComparisonResultDto CalculatePlanComparison(HbisPlanComparisonForm form);

    // DB-first lookup against hb_rater_state_tax_sheet, falling back to the hardcoded
    // HB_STATE_TAX matrix when the state isn't found in the table.
    Task<HbTaxDetailsDto> GetHbTaxDetailsAsync(string state, decimal premiumValue, decimal policyFee);
}
