// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Per-installment premium breakdown, 1:1 with a policy_payment_transaction row (PK = FK,
// no surrogate id). Ported from OutSystems PolicyPaymentTransaction_Extended entity.
// Backs the Billing screen's Premium Breakdown.
namespace InsureEdge.Domain.Entities;

public class PolicyPaymentTransactionExtended
{
    public long PolicyPaymentTransactionId { get; set; }
    public long ClientId { get; set; }
    public decimal? SurplusLinePremiumTax { get; set; }
    public decimal? SurplusLineTaxPercentile { get; set; }
    public decimal SurplusLineTaxInstallmentAmount { get; set; }
    public decimal? FirePremiumTax { get; set; }
    public decimal? FirePremiumTaxPercentile { get; set; }
    public decimal FirePremiumTaxInstallmentAmount { get; set; }
    public decimal CoveragePremium { get; set; }
    public decimal? TotalInstalmentTaxes { get; set; }
    public decimal InstallmentFee { get; set; }

    public PolicyPaymentTransaction? PolicyPaymentTransaction { get; set; }
}
