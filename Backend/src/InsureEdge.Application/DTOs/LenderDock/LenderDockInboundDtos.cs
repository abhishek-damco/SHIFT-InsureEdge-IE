// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Inbound LenderDock API — endpoints LenderDock's own platform calls INTO this app (opposite
// direction from ILenderDockClient, which we use to call OUT to LenderDock). Ported from the
// OutSystems "lenderdock_essentials/rest/hudsonbailey" module (payment / search / search/alt /
// search/details), team-provided Swagger + SQL.
using System.Text.Json.Serialization;

namespace InsureEdge.Application.DTOs.LenderDock;

public record LenderDockPaymentRequest(
    [property: JsonPropertyName("policyNumber")] string? PolicyNumber,
    [property: JsonPropertyName("effectiveYear")] string? EffectiveYear,
    [property: JsonPropertyName("amountPaid")] decimal? AmountPaid,
    [property: JsonPropertyName("paymentMethod")] string? PaymentMethod,
    [property: JsonPropertyName("paymentDate")] string? PaymentDate,
    [property: JsonPropertyName("paidBy")] string? PaidBy);

public record LenderDockSearchResultDto(
    string? PolicyStatus, string? PolicyNumber, DateOnly? EffectiveDate, DateOnly? ExpirationDate,
    string? PolicyType, string? FirstName, string? LastName, string FullName,
    string? Address, string? Address2, string? City, string? State, string? Zip,
    string? LoanNbr, string Vin = "");

public record LenderDockAddressDto(string? Address, string? Address2, string? City, string? State, string? Zip);

public record LenderDockCoverageDto(string Id, string Name, string? Description, string ValueType, string? Value, string SortIndex);

public record LenderDockDeductibleDto(string Id, string Name, string ValueType, string? Value);

public record LenderDockPolicyHeaderDto(
    string? PolicyNumber, string? PolicyType, DateOnly? EffectiveDate, DateOnly? ExpirationDate,
    string? PolicyStatus, string CancellationDate, string CancellationReason,
    List<LenderDockCoverageDto> CoveragesAndEndorsements, List<LenderDockDeductibleDto> Deductables);

public record LenderDockInsuredDetailsDto(
    string? FirstName, string? LastName, string FullName, LenderDockAddressDto Address,
    int? YearBuilt, string? Construction, string Occupancy);

public record LenderDockAgentDetailsDto(string? AgentName, string? AgencyName);

public record LenderDockUnderwriterDetailsDto(string? UnderwriterName, string? NaicCode, string? TaxpayerId);

public record LenderDockBillingDetailsDto(
    string? PaymentPlan, decimal? TotalPremium, decimal? PremiumBalance,
    string ReplacementCostCoverage, string ReplacementCostValue);

public record LenderDockInterestedPartyDto(
    string? Company, string? PayeeType, string EscrowBilled, LenderDockAddressDto MailingAddress);

public record LenderDockRiskDto(
    string RiskId, LenderDockInsuredDetailsDto RiskDescription,
    List<LenderDockInterestedPartyDto> InterestedParties, List<LenderDockCoverageDto> CoveragesAndEndorsements);

public record LenderDockRiskLocationDto(string LocationId, List<LenderDockRiskDto> Risks);

public record LenderDockPolicyDetailsDto(
    LenderDockPolicyHeaderDto PolicyDetails, LenderDockInsuredDetailsDto InsuredDetails,
    List<LenderDockInsuredDetailsDto> AdditionalInsured, LenderDockAgentDetailsDto AgentDetails,
    LenderDockUnderwriterDetailsDto UnderwriterDetails, LenderDockBillingDetailsDto BillingDetails,
    List<LenderDockRiskLocationDto> RiskLocations);
