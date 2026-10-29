# Dashboard API contract

Base route: `/api/dashboard`. All endpoints require the existing authenticated cookie/session and the `DASHBOARD` `View` permission. Tenant, client, producer, and intermediary scope are derived from authenticated claims; browser-supplied ownership identifiers are not accepted.

Dates returned for dashboard grids use `MM-dd-yyyy`. Request date filters accept values parseable by ASP.NET `DateOnly` (the UI sends ISO `yyyy-MM-dd`). Dashboard currency is unconditionally `USD`; every response currency field and every frontend monetary rendering uses USD.

## Endpoints

| Method and route | Persona | Request | Success response | Validation/errors | Entities and consumer |
|---|---|---|---|---|---|
| `GET /summary` | Client, Producer | None | `DashboardSummaryDto` | `401`, `403` | `policy`, `account`, `policy_limit_coverage`, `policy_premium`, `audits`; `DashboardPage` |
| `GET /quotes` | Client, Producer | `page`, `pageSize`, `search`, `sortColumn`, `sortDirection`, `accountType`, `transactionType`, `insuredName`, `lob`, `effectiveDate`, `approvalStatus`, `creationDate`, `premiumEstimate`, `status` | `DashboardQuoteResponse` | `400` invalid page/page size/date/decimal/direction; `401`, `403` | `policy`, `account`, `policy_product`, `product`, `policy_limit_coverage`; producer recent-quotes grid |
| `GET /pending-cancellations` | Producer | `page`, `pageSize`, optional `search`, `sortColumn`, `sortDirection` | `DashboardPagedResponse<DashboardPendingCancellationDto>` | `400` invalid paging/direction; `403` Client persona | `policy`, `policy_premium`, `policy_payment_transaction`, `account`; pending-cancellation grid |
| `GET /renewal-radar` | Producer | Same list query | `DashboardPagedResponse<DashboardRenewalRadarDto>` | `400`; `403` Client persona | `policy`, `account`, `policy_product`, `product`, `policy_premium`; renewal grid |
| `GET /failed-payments` | Client | List paging/sort plus optional `policyNumber`, `effectiveDate`, `expiryDate`, `paymentDate`, `amountDue`, `reason` column filters | `DashboardPagedResponse<DashboardFailedPaymentDto>` | `400` invalid paging, sort direction, date, or decimal; `403` Producer persona | `policy`, `policy_premium`, `policy_payment_transaction`; failed-payment grid |
| `GET /preference` | Client, Producer | None | `DashboardPreferenceDto` | `401`, `403`; returns the default widget layout when the optional `dashboard_preference` table has not been deployed | `dashboard_preference`; widget configuration dialog |
| `PUT /preference` | Client, Producer | `DashboardPreferenceDto` | Normalized `DashboardPreferenceDto` | `400` unknown/duplicate normalization leaves no visible widget; `401`, `403`; `503` when the Dashboard preference migration has not been deployed | `dashboard_preference`; widget configuration dialog |
| `POST /activity/view` | Client, Producer | `{ "policyId": number }` | `204` | `404` when the record is outside authenticated scope; `401`, `403` | `policy`, `audits`; quote/policy navigation actions |
| `POST /policies/{policyId}/renewal` | Producer | Route `policyId` | `DashboardRenewalResultDto` | `403` Client; `404` outside scope; `409` ineligible/duplicate/business failure | Existing `RenewalQuoteService` and policy graph; renewal action |

Valid page sizes are `10`, `25`, and `50`. The frontend exposes all three on the quote and compact policy-alert grids.

## Response DTOs

```text
DashboardSummaryDto
  context: { persona: "client"|"producer", isHudsonBailey: true, currency: "USD" }
  quoteKpis: { uploaded, approved, notApproved, expired: int }
  producerKpis: null (the non-HB Producer branch is unreachable)
  policyKpis: { totalPolicies, activePolicies, boundPolicies, cancelledPolicies: int } | null
  coverageKpis: { basic, standard, preferred: int } | null
  writtenPremium: [{ year: int, amount: decimal }]
  pendingCancellations, renewalRadar, failedPayments: [] (detail lists use their paged endpoints)
  recentActivities: [{ id, policyId, recordNumber, recordType, description, createdAt }]

DashboardQuoteResponse
  data: [{ policyId, quoteNumber, transactionType, insuredName, insuredType?, lob?,
           transactionEffectiveDate?, approvalStatus?, creationDate, lastUpdated?,
           premiumEstimate?, status? }]
  total, page, pageSize: int

DashboardPendingCancellationDto
  paymentTransactionId, policyId, policyNumber, insuredName, daysOverdue,
  dueDate, premiumAmount, currency

DashboardRenewalRadarDto
  policyId, policyNumber, insuredName, lineOfBusiness?, premiumAmount?, riskLevel?,
  expiryDate, daysUntilExpiry, currency

DashboardFailedPaymentDto
  paymentTransactionId, policyId, policyNumber, effectiveDate?, expiryDate?,
  paymentDate, amountDue, reason, currency

DashboardPreferenceDto
  widgets: [{ widgetKey, displayOrder, isVisible }]
```

## Scoping and business rules

- Every query starts with `policy.client_id = authenticated client_id`.
- A normal Producer is additionally restricted to `policy.producer_id = authenticated producer_id`.
- A Producer with the authenticated `full_producer_visibility` claim is restricted to their `intermediary_id`; it is not granted cross-client access.
- Client-only and Producer-only endpoints enforce persona on the server.
- `context.isHudsonBailey` is always `true`. No Dashboard query reads company/client name or a mapping field to classify HB.
- `context.currency` and every detail-row currency are always `USD`; frontend formatting also enforces USD.
- Pending cancellation includes active policies whose unpaid payment is overdue in the current calendar month and whose non-null transaction status is not `SUCCESS`. Free-text search covers policy number, days overdue, due date, and amount.
- Renewal radar includes only `POLICIESINDIVIDUAL`/`POLICIESBUSINESS` rows with Active status, `do_not_renew = false`, and expiry from today through day 60 inclusive. Free-text search covers policy number, LOB, premium, expiry date, and days. `riskLevel` is null because the original SQL hard-codes it blank.
- Written premium currently sums active/bound issued policy premium by effective year for previous/current/next year. Aggregation is database-side, but this definition remains provisional until the original HB written-premium action SQL is supplied.
- View audit creation revalidates record scope and suppresses identical rapid requests within five seconds.
- Loading the Dashboard does not depend on preference persistence: `GET /preference` falls back to the default widget layout if PostgreSQL reports that `dashboard_preference` is missing. Saving a changed layout remains explicit and returns `503` until the Dashboard migration is deployed.

## Status and null handling

Status comparison is case-insensitive. Optional account, coverage, premium, product, and date fields remain nullable in JSON; the frontend renders `-`. Empty datasets return an empty `data` list with `total: 0`, never `null`.

## Evidence-limited contract fields and original-system deviations

- Always-HB intentionally conflicts with the original mapping-secret comparison. It is an explicit product override, not an inferred classification.
- Always-USD intentionally conflicts with the original `GetClientCurrency2`/`ClientConfiguration.Currency` lookup. No currency configuration is consulted by Dashboard code.
- Failed-payment inclusion currently means due through today, unpaid, and transaction status null or not `SUCCESS`. The original `GetFailedPolicyPaymentData` output shape is known, but its action SQL was not supplied.
- Producer `Config Widgets` deliberately shows `Feature in progress` to match the original Producer action. Persisted configuration is consumed by the Client Dashboard.
- Tasks & Reminders has no API and is not rendered because it belongs only to the now-unreachable original non-HB Producer branch.

## Configuration

No new environment variable is required. The API continues to use the existing authentication configuration and PostgreSQL connection (`ConnectionStrings:DefaultConnection` / the project's existing environment override). CORS and cookie handling are unchanged.
