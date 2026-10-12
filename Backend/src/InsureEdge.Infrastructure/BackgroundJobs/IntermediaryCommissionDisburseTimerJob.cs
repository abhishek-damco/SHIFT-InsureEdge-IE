// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Ported from OutSystems IntermediaryCommissionDisburseCloud: monthly batch that pays out
// each ACTIVE intermediary's due commissions via DisburseCloud's CreateDisbursement API.
// Scoped to client_id = 1 (matches this codebase's existing single-tenant hardcoding, e.g.
// Program.cs's Plumsail template sync) — extend to loop all clients if/when multi-tenant.
using Dapper;
using InsureEdge.Application.Interfaces;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace InsureEdge.Infrastructure.BackgroundJobs;

public class IntermediaryCommissionDisburseTimerJob
{
    private const long ClientId = 1;

    private readonly InsureEdgeDbContext _db;
    private readonly IDisburseCloudClient _disburseCloud;
    private readonly ILogger<IntermediaryCommissionDisburseTimerJob> _log;

    public IntermediaryCommissionDisburseTimerJob(
        InsureEdgeDbContext db, IDisburseCloudClient disburseCloud, ILogger<IntermediaryCommissionDisburseTimerJob> log)
    {
        _db = db;
        _disburseCloud = disburseCloud;
        _log = log;
    }

    private record IntermediaryRow(
        long Id, string IntermediaryName, string? FederalTaxId,
        string? ContactEmail, string? ContactFirstLastName,
        string? AddressLine1, string? AddressLine2, string? City, string? State, string? ZipCode, string? Country,
        string CommissionDisburseEmail);

    private record CommissionRow(long CommissionPaymentTransactionId, string? PolicyNumber, decimal CommissionAmount);

    public async Task ExecuteAsync()
    {
        var conn = (NpgsqlConnection)_db.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open) await conn.OpenAsync();

        // GetIntermediariesByClientId: ACTIVE intermediaries with a primary contact, their
        // own address (ProducerId IS NULL), and a CommissionDisburseEmail set.
        var intermediaries = (await conn.QueryAsync<IntermediaryRow>(
            @"SELECT i.id AS ""Id"", i.intermediary_name AS ""IntermediaryName"", i.federal_tax_id AS ""FederalTaxId"",
                     ic.email AS ""ContactEmail"", ic.name AS ""ContactFirstLastName"",
                     ipa.address_line1 AS ""AddressLine1"", ipa.address_line2 AS ""AddressLine2"",
                     ipa.city AS ""City"", ipa.state AS ""State"", ipa.zip_code AS ""ZipCode"", ipa.country AS ""Country"",
                     i.commission_disburse_email AS ""CommissionDisburseEmail""
              FROM intermediary i
              INNER JOIN intermediary_contact ic ON ic.intermediary_id = i.id AND ic.is_primary = true
              LEFT JOIN intermediary_producer_address ipa ON ipa.intermediary_id = i.id AND ipa.producer_id IS NULL
              WHERE i.status = 'ACTIVE' AND i.client_id = @clientId
                AND i.commission_disburse_email IS NOT NULL AND i.commission_disburse_email <> ''
              ORDER BY i.intermediary_code",
            new { clientId = ClientId })).ToList();

        _log.LogInformation("IntermediaryCommissionDisburse: {Count} eligible intermediaries for client {ClientId}",
            intermediaries.Count, ClientId);

        foreach (var i in intermediaries)
        {
            var commissions = (await conn.QueryAsync<CommissionRow>(
                @"SELECT cpt.id AS ""CommissionPaymentTransactionId"", p.policy_number AS ""PolicyNumber"",
                         cpt.commission_amount_due AS ""CommissionAmount""
                  FROM commission_payment_transaction cpt
                  INNER JOIN policy_commission pc ON cpt.policy_commission_id = pc.id AND pc.intermediary_id = @intermediaryId
                  LEFT JOIN policy p ON p.id = pc.policy_id
                  WHERE EXTRACT(MONTH FROM cpt.due_date) = EXTRACT(MONTH FROM now())
                    AND EXTRACT(YEAR FROM cpt.due_date) = EXTRACT(YEAR FROM now())
                    AND (p.policy_status = 'ACTIVE' OR p.id IS NULL)
                  ORDER BY p.policy_number",
                new { intermediaryId = i.Id })).ToList();

            if (commissions.Count == 0) continue; // Payees.Empty? True → skip, not an error.

            var total = commissions.Sum(c => c.CommissionAmount);
            var (firstName, lastName) = SplitName(i.ContactFirstLastName);

            var request = new CreateDisbursementRequest(
                Disbursement_uuid: Guid.NewGuid().ToString(),
                Large_disbursement: false,
                Authorization_parties: null,
                Payees: new List<DisbursementPayee>
                {
                    new(
                        // Confirmed from the real OutSystems source: payee_type_id is hardcoded
                        // to 1 for this flow (not derived/looked up) — matches 1 of our 2 real
                        // captured sample responses.
                        Payee_type_id: 1,
                        Amount: total,
                        Payee_uuid: Guid.NewGuid().ToString(),
                        Email: i.CommissionDisburseEmail,
                        First_name: firstName,
                        Last_name: lastName,
                        Business_name: i.IntermediaryName,
                        Address_one: i.AddressLine1,
                        Address_two: i.AddressLine2,
                        City: i.City,
                        State: i.State,
                        Zip_code: i.ZipCode,
                        Country: i.Country,
                        Phone: null,
                        Delivery_options: new DeliveryOptions(Email: true, Sms: false, Direct_disburse: null, Automatic_disburst: null),
                        Allowed_payment_method_ids: null,
                        Permission_required_from: null,
                        Field_values: null,
                        Payment_method_settings: null,
                        Attached_document_uuid: null,
                        Attached_document_ids: null,
                        Mail_to_name: i.IntermediaryName,
                        Issue_date: DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
                        Status: null,
                        Id: null,
                        Original_payee_id: null,
                        Is_scheduled: false,
                        Status_id: null,
                        Is_sent_to_thirdParty: false,
                        Is_it_international_payment: false,
                        Notify_payee: true,
                        Recipient_instructions: null,
                        Check_number: null,
                        Company_logo_url: null),
                },
                Payor_email: null,
                Super_payor_email: null,
                Support_employee_email: null,
                Created_at: null,
                Id: null,
                Company_id: null,
                IsCompanyAccountUsed: null,
                Is_dc_disbursement: true,
                Is_dc_disbursement_approved: null);

            var (response, rawJson, isError) = await _disburseCloud.CreateDisbursementAsync(request);
            if (isError)
            {
                _log.LogWarning("DisburseCloud API Response failed for Client ID {ClientId}, Intermediary {IntermediaryId}: {Json}",
                    ClientId, i.Id, rawJson);
                continue; // leave commission rows PENDING, move to next intermediary.
            }

            // UpdateIntermediaryCommissions: mark this batch's rows SUCCESS + paid.
            await conn.ExecuteAsync(
                @"UPDATE commission_payment_transaction cpt
                  SET transaction_status = 'SUCCESS',
                      transaction_id = @transactionId,
                      customer_reference_id = @customerReferenceId,
                      response_code = @responseCode,
                      response_json = @responseJson,
                      is_paid = true
                  FROM policy_commission pc
                  LEFT JOIN policy p ON p.id = pc.policy_id
                  WHERE cpt.policy_commission_id = pc.id AND pc.intermediary_id = @intermediaryId
                    AND EXTRACT(MONTH FROM cpt.due_date) = EXTRACT(MONTH FROM now())
                    AND EXTRACT(YEAR FROM cpt.due_date) = EXTRACT(YEAR FROM now())
                    AND (p.policy_status = 'ACTIVE' OR p.id IS NULL)",
                new
                {
                    intermediaryId = i.Id,
                    transactionId = response?.Id,
                    customerReferenceId = response?.Disbursement_uuid,
                    responseCode = "SUCCESS",
                    responseJson = rawJson,
                });

            _log.LogInformation("IntermediaryCommissionDisburse: paid {Amount} to intermediary {IntermediaryId} ({Count} commission rows)",
                total, i.Id, commissions.Count);
        }
    }

    private static (string? First, string? Last) SplitName(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName)) return (null, null);
        var parts = fullName.Trim().Split(' ', 2);
        return parts.Length == 2 ? (parts[0], parts[1]) : (parts[0], null);
    }
}
