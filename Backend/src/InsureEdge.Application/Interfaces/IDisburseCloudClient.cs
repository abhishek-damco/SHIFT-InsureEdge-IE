// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// DisburseCloud API contract — corrected against two real captured CreateDisbursement
// responses (team-provided, 2026-09/2026-03 sandbox calls). Numeric ids/type codes and the
// plural allowed_payment_method_ids array were wrong in the original screenshot-based port;
// fixed here. payee_type_id's actual numeric code for "Agency" is still unconfirmed — see
// IntermediaryCommissionDisburseTimerJob.cs.
using System.Text.Json.Serialization;

namespace InsureEdge.Application.Interfaces;

public record AuthorizationParty(
    string? Party_uuid,
    string? Party_type,
    string? Title,
    string? Company_name,
    string? Email,
    string? First_name,
    string? Last_name,
    string? Phone);

public record DeliveryOptions(bool? Email, bool? Sms, bool? Direct_disburse, bool? Automatic_disburst);

public record FieldValue(string? Name, string? Value);

public record PaymentMethodSettings(string? Check_postage_type);

public record DisbursementPayee(
    int? Payee_type_id,
    decimal Amount,
    string? Payee_uuid,
    string? Email,
    string? First_name,
    string? Last_name,
    string? Business_name,
    string? Address_one,
    string? Address_two,
    string? City,
    string? State,
    string? Zip_code,
    string? Country,
    string? Phone,
    DeliveryOptions? Delivery_options,
    List<int>? Allowed_payment_method_ids,
    List<string>? Permission_required_from,
    List<FieldValue>? Field_values,
    PaymentMethodSettings? Payment_method_settings,
    string? Attached_document_uuid,
    List<string>? Attached_document_ids,
    string? Mail_to_name,
    string? Issue_date,
    string? Status,
    long? Id,
    long? Original_payee_id,
    bool? Is_scheduled,
    int? Status_id,
    bool? Is_sent_to_thirdParty,
    bool? Is_it_international_payment,
    bool? Notify_payee,
    string? Recipient_instructions,
    string? Check_number,
    string? Company_logo_url,
    object? Custom_document_ids = null,
    object? Third_party = null);

// Request and Response share this shape (DisburseCloud echoes the request back populated
// with ids/status once created).
public record CreateDisbursementRequest(
    string? Disbursement_uuid,
    bool? Large_disbursement,
    List<AuthorizationParty>? Authorization_parties,
    List<DisbursementPayee>? Payees,
    string? Payor_email,
    string? Super_payor_email,
    string? Support_employee_email,
    string? Created_at,
    long? Id,
    long? Company_id,
    bool? IsCompanyAccountUsed,
    bool? Is_dc_disbursement,
    bool? Is_dc_disbursement_approved,
    long? Original_disbursement_id = null,
    object? Disbursement_third_parties = null);

public record CreateDisbursementResponse(
    string? Disbursement_uuid,
    bool? Large_disbursement,
    List<AuthorizationParty>? Authorization_parties,
    List<DisbursementPayee>? Payees,
    string? Payor_email,
    string? Super_payor_email,
    string? Support_employee_email,
    string? Created_at,
    long? Id,
    long? Company_id,
    bool? IsCompanyAccountUsed,
    bool? Is_dc_disbursement,
    bool? Is_dc_disbursement_approved,
    long? Original_disbursement_id = null,
    object? Disbursement_third_parties = null);

public interface IDisburseCloudClient
{
    Task<(CreateDisbursementResponse? Response, string RawJson, bool IsError)> CreateDisbursementAsync(CreateDisbursementRequest request);
}
