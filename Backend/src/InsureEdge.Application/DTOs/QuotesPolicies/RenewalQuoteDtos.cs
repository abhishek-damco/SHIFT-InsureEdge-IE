namespace InsureEdge.Application.DTOs.QuotesPolicies;

/// <summary>Request to create a renewal quote from an active policy</summary>
public record CreateRenewalQuoteRequest
{
    public string PriorPolicyNumber { get; init; } = string.Empty;
    public DateOnly? RenewalOfferDate { get; init; }
}

/// <summary>Response when renewal quote is successfully created</summary>
public record CreateRenewalQuoteResponse
{
    public long PolicyId { get; init; }
    public string QuoteNumber { get; init; } = string.Empty;
    public string PolicyNumber { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateOnly? EffectiveDate { get; init; }
    public DateOnly? ExpiryDate { get; init; }
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
}

/// <summary>Request to bind a renewal quote to active policy</summary>
public record BindRenewalQuoteRequest
{
    public long RenewalPolicyId { get; init; }
}

/// <summary>Response when renewal quote is bound</summary>
public record BindRenewalQuoteResponse
{
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
    public string NewPolicyNumber { get; init; } = string.Empty;
    public string PreviousPolicyStatus { get; init; } = string.Empty;
}

/// <summary>Request to process payment for renewal quote</summary>
public record ProcessRenewalPaymentRequest
{
    public long RenewalPolicyId { get; init; }
    public string? PaymentMethod { get; init; }
    public string? TransactionId { get; init; }
    public decimal? AmountPaid { get; init; }
}

/// <summary>Response when payment is processed</summary>
public record ProcessRenewalPaymentResponse
{
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
    public long? PaymentTransactionId { get; init; }
    public string Status { get; init; } = string.Empty;
}

/// <summary>Detail view of a renewal quote</summary>
public record RenewalQuoteDetailDto
{
    public long PolicyId { get; init; }
    public string QuoteNumber { get; init; } = string.Empty;
    public string PolicyNumber { get; init; } = string.Empty;
    public string? PriorPolicyNumber { get; init; }
    public string InsuredName { get; init; } = string.Empty;
    public string? LineOfBusiness { get; init; }
    public string? SubProduct { get; init; }
    public DateOnly? EffectiveDate { get; init; }
    public DateOnly? ExpiryDate { get; init; }
    public DateOnly? RenewalOfferDate { get; init; }
    public decimal? PremiumEstimate { get; init; }
    public decimal? TotalPremium { get; init; }
    public string? PolicyStage { get; init; }
    public string? PolicyType { get; init; }
    public string? PolicyStatus { get; init; }
    public string? ApprovalStatus { get; init; }
    public string? IntermediaryType { get; init; }
    public string? IntermediaryName { get; init; }
    public string? ProducerName { get; init; }
    public List<PolicyPaymentTransactionDto> PaymentTransactions { get; init; } = new();
}

public record PolicyPaymentTransactionDto
{
    public long Id { get; init; }
    public decimal AmountDue { get; init; }
    public DateOnly InvoiceDate { get; init; }
    public DateOnly DueDate { get; init; }
    public DateOnly? TransactionPaymentDate { get; init; }
    public bool? IsPaid { get; init; }
    public string? TransactionStatus { get; init; }
    public string? PaymentMethod { get; init; }
}
