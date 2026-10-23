// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// LenderDock API contract — ported field-for-field from OutSystems Notify_MortgageBill /
// Notify_MortgageeCoverage sample request/response payloads (team-provided). The
// W-ENDORSE-CODE1..5 (and LIMIT/QUAL/DEDUCT) blocks were blank in every sample and have no
// source in our schema — omitted rather than sent always-blank.
using System.Text.Json.Serialization;

namespace InsureEdge.Application.Interfaces;

public class LenderDockRequest
{
    [JsonPropertyName("PROVIDER")] public string? Provider { get; set; }
    [JsonPropertyName("CLIENT-ID")] public string? ClientId { get; set; }
    [JsonPropertyName("W-HI-DH-VERSION")] public int WHiDhVersion { get; set; } = 1;
    [JsonPropertyName("W-HI-DH-TEST")] public string? WHiDhTest { get; set; }
    [JsonPropertyName("W-SENDER-ORGNAME")] public string? WSenderOrgName { get; set; }
    [JsonPropertyName("W-SENDER-EIN")] public long? WSenderEin { get; set; }
    [JsonPropertyName("W-SENDER-ELIT")] public string? WSenderElit { get; set; }
    [JsonPropertyName("W-DATA-DATE")] public long? WDataDate { get; set; }
    [JsonPropertyName("W-DUE-DATE")] public long? WDueDate { get; set; }
    [JsonPropertyName("W-INS-CO-NAME")] public string? WInsCoName { get; set; }
    [JsonPropertyName("W-INS-CO-TAX-ID")] public long? WInsCoTaxId { get; set; }
    [JsonPropertyName("W-INS-CO-NAIC-CODE")] public long? WInsCoNaicCode { get; set; }
    [JsonPropertyName("W-INSURED-NAME-1")] public string? WInsuredName1 { get; set; }
    [JsonPropertyName("W-INSURED-NAME-2")] public string? WInsuredName2 { get; set; }
    [JsonPropertyName("W-PREM-ADDR-1")] public string? WPremAddr1 { get; set; }
    [JsonPropertyName("W-PREM-ADDR-2")] public string? WPremAddr2 { get; set; }
    [JsonPropertyName("W-PREM-CITY")] public string? WPremCity { get; set; }
    [JsonPropertyName("W-PREM-STATE")] public string? WPremState { get; set; }
    [JsonPropertyName("W-PREM-ZIP")] public string? WPremZip { get; set; }
    [JsonPropertyName("W-POLICY-NO")] public string? WPolicyNo { get; set; }
    [JsonPropertyName("W-POL-EFF-DATE")] public long? WPolEffDate { get; set; }
    [JsonPropertyName("W-POL-EXP-DATE")] public long? WPolExpDate { get; set; }
    [JsonPropertyName("W-PROCESS-DATE")] public long? WProcessDate { get; set; }
    [JsonPropertyName("W-ACT-EFF-DATE")] public long? WActEffDate { get; set; }
    [JsonPropertyName("W-ACTIVITY-CODE")] public string? WActivityCode { get; set; }
    [JsonPropertyName("W-CANCEL-REASON")] public string? WCancelReason { get; set; }
    [JsonPropertyName("W-ACORD-TRAN")] public string? WAcordTran { get; set; }
    [JsonPropertyName("W-ACORD-CODE")] public string? WAcordCode { get; set; } = "HOME";
    [JsonPropertyName("W-AGENT-NO")] public string? WAgentNo { get; set; }
    [JsonPropertyName("W-AGENT-NAME-1")] public string? WAgentName1 { get; set; }
    [JsonPropertyName("W-AGENT-NAME-2")] public string? WAgentName2 { get; set; }
    [JsonPropertyName("W-AGENT-ADDR-1")] public string? WAgentAddr1 { get; set; }
    [JsonPropertyName("W-AGENT-ADDR-2")] public string? WAgentAddr2 { get; set; }
    [JsonPropertyName("W-AGENT-CITY")] public string? WAgentCity { get; set; }
    [JsonPropertyName("W-AGENT-STATE")] public string? WAgentState { get; set; }
    [JsonPropertyName("W-AGENT-ZIP")] public string? WAgentZip { get; set; }
    [JsonPropertyName("W-AGENT-TELE")] public string? WAgentTele { get; set; }
    [JsonPropertyName("W-MORT-NAME-1")] public string? WMortName1 { get; set; }
    [JsonPropertyName("W-MORT-NAME-2")] public string? WMortName2 { get; set; }
    [JsonPropertyName("W-MORT-ADDR-1")] public string? WMortAddr1 { get; set; }
    [JsonPropertyName("W-MORT-ADDR-2")] public string? WMortAddr2 { get; set; }
    [JsonPropertyName("W-MORT-CITY")] public string? WMortCity { get; set; }
    [JsonPropertyName("W-MORT-STATE")] public string? WMortState { get; set; }
    [JsonPropertyName("W-MORT-ZIP")] public string? WMortZip { get; set; }
    [JsonPropertyName("W-ACCOUNT-NO")] public string? WAccountNo { get; set; }
    [JsonPropertyName("W-DWELLING-LIMIT")] public string? WDwellingLimit { get; set; }
    [JsonPropertyName("W-OTH-STRUCT-LIMIT")] public string? WOthStructLimit { get; set; }
    [JsonPropertyName("W-FULL-VALUE-REP")] public string? WFullValueRep { get; set; }
    [JsonPropertyName("W-TOTAL-PREMIUM")] public string? WTotalPremium { get; set; }
    [JsonPropertyName("W-DEDUCTIBLE")] public string? WDeductible { get; set; }
    [JsonPropertyName("W-MORT-NUM")] public string? WMortNum { get; set; }
    [JsonPropertyName("W-UNIT-PRICE")] public string? WUnitPrice { get; set; }
    [JsonPropertyName("W-EST-REPLACE-COST")] public string? WEstReplaceCost { get; set; }
    [JsonPropertyName("W-MAILING-ADDR-1")] public string? WMailingAddr1 { get; set; }
    [JsonPropertyName("W-MAILING-ADDR-2")] public string? WMailingAddr2 { get; set; }
    [JsonPropertyName("W-MAILING-CITY")] public string? WMailingCity { get; set; }
    [JsonPropertyName("W-MAILING-STATE")] public string? WMailingState { get; set; }
    [JsonPropertyName("W-MAILING-ZIP")] public string? WMailingZip { get; set; }
    [JsonPropertyName("W-TRANSACTION-GROUP-CODE")] public string? WTransactionGroupCode { get; set; }
    [JsonPropertyName("W-LEGAL-DESCRIPTION")] public string? WLegalDescription { get; set; }
    [JsonPropertyName("W-LOAN-NO")] public string? WLoanNo { get; set; }
    [JsonPropertyName("W-PAYOR")] public string? WPayor { get; set; }
    [JsonPropertyName("W-PREM-FREQ")] public string? WPremFreq { get; set; }
    [JsonPropertyName("W-AMOUNT-DUE")] public string? WAmountDue { get; set; }
}

public class LenderDockErrorDetail
{
    [JsonPropertyName("field")] public string? Field { get; set; }
    [JsonPropertyName("message")] public string? Message { get; set; }
}

public class LenderDockResponse
{
    [JsonPropertyName("status")] public string? Status { get; set; }
    [JsonPropertyName("code")] public int Code { get; set; }
    [JsonPropertyName("errors")] public List<LenderDockErrorDetail>? Errors { get; set; }
}

public interface ILenderDockClient
{
    Task<(LenderDockResponse? Response, string RawJson, bool IsSuccess)> PostBillAsync(LenderDockRequest request);
    Task<(LenderDockResponse? Response, string RawJson, bool IsSuccess)> PostCoverageAsync(LenderDockRequest request);
}
