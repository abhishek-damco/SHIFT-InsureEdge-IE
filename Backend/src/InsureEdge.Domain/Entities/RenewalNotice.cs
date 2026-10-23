namespace InsureEdge.Domain.Entities;

/// <summary>
/// RenewalNotice - Tracks renewal notices sent to brokers/customers
/// Stores notice history for audit trail and customer communication tracking
/// </summary>
public class RenewalNotice
{
    public long Id { get; set; }
    public long ClientId { get; set; }
    public long PolicyId { get; set; }
    public string PolicyNumber { get; set; }

    /// <summary>Days before policy expiry when this notice should be sent (30, 15, or 7)</summary>
    public int DaysBeforeExpiry { get; set; }

    public string NoticeType { get; set; } // e.g., "Renewal Notice - 30 days"
    public DateTime? NoticeSentDate { get; set; }
    public string NoticeStatus { get; set; } // Sent, Acknowledged, Bounced
    public DateOnly? ExpiryDate { get; set; }

    /// <summary>Intermediary who receives the notice</summary>
    public long? IntermediaryId { get; set; }
    public string IntermediaryName { get; set; }

    /// <summary>Email/SMS delivery tracking</summary>
    public string DeliveryMethod { get; set; } // Email, SMS, Portal
    public string DeliveryStatus { get; set; } // Sent, Bounced, Delivered
    public DateTime? DeliveryDate { get; set; }

    /// <summary>Audit fields</summary>
    public long CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
}
