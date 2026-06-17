# ART-2-012 — Integration & Architecture Supplement
## InsureEdge Application Modernization (INSUREEDGE-2026)

**Produced by:** Integration Agent + Architecture Agent (extended HARVEST pass)
**Phase:** HARVEST
**Date:** 2026-06-17
**Confidence:** HIGH where derived from TIDs; MEDIUM where inferred from ERD/diagrams

**Purpose:** Supplementary catalogue for findings discovered in six newly-added PDF artifacts. This document DOES NOT modify ART-1-001 (Data Catalogue) or ART-1-004 (Integration Catalogue). It extends those catalogues with resolved contracts, new integrations, and architectural findings.

**Evidence consumed (this pass):**
- EV-0-0232: `TECHNICAL_IMPLEMENTATION_DOCUMENT__Tranzpay_Payment_Integration.pdf` — TranzPay TID v1.0 (HIGH)
- EV-0-0233: `InsureEdge - Domain Architecture.pdf` — OutSystems module/domain diagram (MEDIUM — diagram only)
- EV-0-0234: `InsureEdge-ERD .pdf` — Full operational DB ERD, InsureEdge_DEV (HIGH)
- EV-0-0235: `InsureEdgeSystem - ERD.pdf` — System/tenant DB ERD, InsureEdge_System_DEV (HIGH)
- EV-0-0236: `DisburseCloud API Documentation.pdf` — DisburseCloud REST API v1.2.1 (HIGH)
- EV-0-0237: `TECHNICAL_IMPLEMENTATION_DOCUMENT__RPS_(Risk_to_Potential_Structures)_Integration_using_PostgreSQLPostGIS__OutSystems.pdf` — RPS TID v1.0 (HIGH)
- EV-0-0238: `TECHNICAL_IMPLEMENTATION_DOCUMENT_Document_Storage_azure_blob.pdf` — Azure Blob TID v1.0 (HIGH)

**Also cross-referenced (read in SCAN phase, not modified):**
- EV-0-0224 / ART-1-001: Data Catalogue (DDL-derived)
- EV-0-0228 / ART-1-004: Integration Catalogue (OML-derived, INT-001 through INT-010)

---

## SECTION 1: TranzPay — RESOLVED CONTRACT (INT-001)

**Status change:** ART-1-004 INT-001 carried PLACEHOLDER status pending QST-1-INT-001. This section resolves that question with evidence from EV-0-0232.

### 1.1 QST-1-INT-001 Resolution

| Field | Value |
|---|---|
| Question | What is the TranzPay endpoint URL, authentication method, and complete request/response schema for payment processing? |
| Was blocking | YES — IDEATE could not begin target architecture for payment processing |
| Status | ANSWERED |
| Evidence | EV-0-0232 |

### 1.2 Resolved Endpoint Contract

| Property | Value |
|---|---|
| Base URL (sandbox/demo) | `https://demo.tranzpay.com/api/transaction.php` |
| Production URL | NOT documented in TID — only demo URL provided |
| HTTP Method | POST for all operations |
| Content type | JSON (Format: "JSON" field in request body) |
| Authentication | Credentials in request body: `UserName`, `Password`, `ProducerID` |
| Routing field | `ApiName` — all operations distinguished by this field value |
| Known `ApiName` values | `AddCustomerCCCharge`, `AddCustomerACHDebit`, `ThirdParty` (TransactionType) |

**Requirement (technology-neutral):** The system shall authenticate to the payment gateway per-request using credentials embedded in the payload; no session or OAuth token is used for this integration.

### 1.3 Operation: ThirdParty (Hosted Payment Redirect)

**Direction:** InsureEdge → TranzPay (request), TranzPay → InsureEdge callback (async response)

**Key request fields:**

| Field | Type | Notes |
|---|---|---|
| TransactionType | string | "ThirdParty" |
| BillingNameFirst / BillingNameLast / BillingNameFull | string | Insured billing name |
| BillingAddress / BillingCity / BillingState / BillingZipCode | string | Insured billing address |
| PhoneNumber / Email | string | Contact details |
| RedirectUrl | string | URL TranzPay redirects user to after payment |
| PostBackUrl | string | URL TranzPay calls asynchronously with result |
| CancelUrl | string | URL if user cancels hosted payment page |
| ThirdPartyCallID | string | Correlation ID; maps to `PolicyPaymentTransaction.ReferenceId` |
| AddVault | string | "Y" enables tokenization — stores payment method in TranzPay vault |
| CustomerID | string | Vault key for returning customers |
| PolicyNumber | string | Cross-reference to InsureEdge policy |
| TransactionAmount | decimal string | Payment amount |
| PaymentType | string | "ACH" or "CC" |

**Callback payload from TranzPay (async, to PostBackUrl):**

| Field | Maps to DB column |
|---|---|
| ReferenceId | `PolicyPaymentTransaction.ReferenceId` |
| Status | `PolicyPaymentTransaction.Status` (Success / Failed) |
| TransactionId | `PolicyPaymentTransaction.TransactionId` |
| ResponseCode | `PolicyPaymentTransaction.ResponseCode` ("00" = Approved) |

**Evidence from production transaction JSON embedded in ERD (EV-0-0234):**
- ACH success: `Status: "SUCCESS"`, `ResponseCode: "00"`, `PaymentMethod: "ACH"`, `BankName: "BANK OF AMERICA, N.A."`, `ThirdPartyCallID` confirms UUID format
- CC success: `Status: "SUCCESS"`, `ResponseCode: "00"`, `CardType: "Visa"`, `AuthCode: "638243"`, `AvsRsltCode: "Y"`, `CVV2ResponseCode: "M"` confirms card-present-equivalent response fields

### 1.4 Operation: AddCustomerCCCharge (Direct Card Charge)

**Key request fields:** `CardNumber`, `ExpiryDate`, `CVV` (raw PAN transmitted — no tokenization bypass)
**Response:** `ResponseCode` "00" = Approved; `TransactionID`, `Status`

**Security note:** Direct card charge transmits raw PAN. The preferred path for PCI scope reduction is the `ThirdParty` hosted flow with `AddVault: "Y"`. The direct charge operation should be used only where hosted redirect is not viable. (See also RSK-2-INT-001 below.)

### 1.5 Operation: AddCustomerACHDebit

**Key request fields:** `AccountNumber`, `RoutingNumber`
**Response:** `Status: "Pending"` — ACH is asynchronous by nature; final status arrives via callback

### 1.6 Fallback Timer (Scheduled Job)

A scheduled job polls `https://demo.tranzpay.com/api/transaction.php` for transactions that have not received a callback within the expected window. This is the mechanism that resolves the `BypassRefundResponse_ToBeFalseInPROD` site-property gap noted in ART-1-004.

**Requirement (technology-neutral):** The system shall implement a scheduled reconciliation process that polls the payment gateway for any transactions in "Pending" status that have not received an async callback within a configurable timeout window.

### 1.7 Tokenization (Vault)

When `AddVault: "Y"` is set, TranzPay stores the payment method and returns a vault token associated with `CustomerID`. Subsequent payments can reference `CustomerID` rather than raw card/bank data.

**Requirement (technology-neutral):** The system shall support payment method vaulting such that returning policyholders can complete subsequent payments without re-entering full payment credentials.

### 1.8 Refund Operations

**Gap:** Refund actions (`ACHRefund`, `CreditCardRefund`) are known from OML code evidence (ART-1-004) but are NOT documented in EV-0-0232. The TID documents only charge/debit operations.

**Assumption:** ASM-2-ARCH-001 — Refund operations follow the same endpoint and credential pattern as charge operations, with `ApiName` set to `ACHRefund` or `CreditCardRefund`. Confidence: MEDIUM. Must be confirmed with TranzPay before FORGE.

### 1.9 Outstanding Gap

| Gap ID | Description | Impact |
|---|---|---|
| GAP-2-INT-001 | Production TranzPay base URL not documented | BLOCKING for FORGE — all payment code must reference production URL |
| GAP-2-INT-002 | Refund API contract not in TID | HIGH — refund flow cannot be fully specified without confirmed endpoint schema |

---

## SECTION 2: DisburseCloud — ENRICHED CONTRACT (INT-002)

**Status change:** ART-1-004 INT-002 had partial contract from site properties. This section enriches it with full REST API v1.2.1 contract from EV-0-0236.

### 2.1 Authentication — Resolved Two-Phase Flow

**Phase 1 — Obtain Bearer Token:**

| Property | Value |
|---|---|
| Endpoint | `POST /api/v1/companies/authenticate` |
| Auth type | Basic Auth |
| Username | Company TIN (Tax Identification Number) |
| Password | User API Key |
| Response | `access_token` (Bearer JWT), `token_type: "Bearer"`, `expires_in: 3600` (seconds) |

**Phase 2 — Authenticated Calls:**

| Header | Value |
|---|---|
| Authorization | `Bearer {access_token}` |
| CompanyApiKey | Required for multi-company users |

**Sandbox base URL:** `https://sandbox.services.disbursecloud.com`
**Production base URL:** `https://app.services.disbursecloud.com`

**Assumption:** ASM-2-ARCH-002 — The site property `DisbursementCompanySecrectKey` (stored in Key Vault: `DisburseCloud--CompanySecretKey`) maps to the User API Key used as the Basic Auth password in the authenticate call. The `DisbursementEncryptionKey` (stored in Key Vault: `DisburseCloud--EncryptionKey`) is not referenced in the v1.2.1 API documentation; it may be used for payload-level encryption in an older version or a separate signing mechanism. Confidence: LOW. Requires confirmation.

### 2.2 Critical Discrepancy — Site Property URL vs API v1.2.1

| Property | Current site property value | v1.2.1 documented value |
|---|---|---|
| Base URL | `https://sandbox.disbursecloud.com/Vendors/RegisterVendor` | `https://sandbox.services.disbursecloud.com` |
| Endpoint pattern | `/Vendors/RegisterVendor` (single path) | `/api/v1/{resource}` (RESTful hierarchy) |

**Finding (FND-2-INT-001):** The site property `DisbursementBaseURL` in the existing InsureEdge OutSystems environment points to a `RegisterVendor` endpoint that does not exist in the v1.2.1 API documentation. The current integration likely uses an older API version, a vendor-registration-only flow, or a deprecated endpoint. This is a migration risk — the target system must implement the v1.2.1 contract, not reverse-engineer the old one.

**Assumption:** ASM-2-ARCH-003 — The current InsureEdge DisburseCloud integration may be partially implemented or in vendor-registration-only state (not full disbursement lifecycle). Confidence: MEDIUM.

### 2.3 Complete Endpoint Inventory (v1.2.1)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/companies/authenticate` | Obtain Bearer token |
| POST | `/api/v1/disbursements/create` | Create disbursement with payees |
| POST | `/api/v1/disbursements/{uuid}/payees/{payee_uuid}/cancel` | Cancel individual payee |
| GET | `/api/v1/disbursements/{uuid}` | Retrieve disbursement status |
| GET | `/api/v1/disbursements/{uuid}/payees/{payee_uuid}` | Retrieve payee details |
| POST | `/api/v1/disbursements/{uuid}/payees/{payee_uuid}/resend-email` | Resend payee invite |
| GET | `/api/v1/disbursements/{uuid}/payees/{payee_uuid}/transaction` | Get payee transaction detail |
| POST | `/api/v1/documents/get-payee-disbursement-signed-documents` | Retrieve signed documents |
| POST | `/api/v1/documents/upload` | Upload document (base64 PDF) |
| POST | `/api/v1/documents/upload-check-payment-attachments` | Upload file attachment |
| POST | `/api/v1/documents/update-disbursement-document` | Link document to disbursement |
| POST | `/api/v1/documents/unlink-document` | Unlink document |
| POST | `/api/v1/companies/add-funds` | Add funds to company balance |

### 2.4 Payee Types

| ID | Type | Use in InsureEdge context |
|---|---|---|
| 1 | ONE_TIMER | One-off commission or claims payment to unregistered payee |
| 2 | VENDOR | Registered service vendor |
| 3 | AGENCY | Insurance agency / intermediary |
| 4 | NAMED_INSURED | Policyholder receiving claim indemnity |

### 2.5 Payment Method IDs

| ID | Method |
|---|---|
| 1 | ACH (bank transfer) |
| 2 | POSTAL_CHECK |
| 3 | VIRTUAL_CARD |
| 4 | INSTANT_DEPOSIT |
| 5 | DIGITAL_CHECK |
| 6 | VENMO |
| 7 | PAYPAL |

**Requirement (technology-neutral):** The system shall support configuring allowed payment methods per payee type for disbursements, including at minimum ACH and check delivery.

### 2.6 Create Disbursement — Key Request Structure

```
disbursement_uuid        (caller-generated unique ID)
large_disbursement       (bool — flags high-value disbursements)
authorization_parties[]  (optional approver list for auth workflow)
disbursement_third_parties[] (bundled check payments)
payees[]                 (array of payee objects — see 2.7)
```

### 2.7 Payee Object — Key Fields

| Field | Type | Notes |
|---|---|---|
| payee_type_id | int | 1-4 (see 2.4) |
| payee_uuid | string | Caller-generated |
| amount | decimal | Disbursement amount |
| email | string | Required for email delivery |
| first_name / last_name | string | Payee name |
| address_one / city / state / zip_code | string | Physical address |
| allowed_payment_method_ids[] | int[] | Restricts available payment methods |
| delivery_options | object | {email: bool, sms: bool, direct_disburse: bool} |
| permission_required_from[] | string[] | Auth party IDs if auth workflow needed |
| is_sent_to_thirdparty | bool | Flag for third-party payment routing |
| is_scheduled | bool | Scheduled future disbursement |
| issue_date | date | When to issue (for scheduled disbursements) |

### 2.8 Disbursement Status Values

`PendingAuthorizationPartiesPermission` → `EmailSentToPayee` / `SentRegistrationEmail` → `Pending` → `Processing` → `Success` / `Failed` / `Canceled` / `Unclaimed`

### 2.9 Webhook Events (Async Status Notification)

**Direction:** DisburseCloud → InsureEdge (inbound webhook to a registered callback URL)

| Event | Trigger |
|---|---|
| DISBURSEMENT.PENDING | Disbursement created, awaiting action |
| DISBURSEMENT.PROCESSING | Payment in transit |
| DISBURSEMENT.SUCCESS | Payment delivered |
| DISBURSEMENT.FAILED | Payment failed |
| DISBURSEMENT.CANCELED | Disbursement cancelled |
| DISBURSEMENT.UNCLAIMED | Payee did not claim within window |
| EMAIL_SENT_TO_PAYEE | Invite sent |
| REJECTED_BY_AUTH_PARTY | Authorizer rejected |
| REJECTED_BY_PAYEE | Payee declined |
| DISBURSEMENT_DOCUMENT_SIGNED | Document signed |
| CHECK_SENT_AUTO | Physical check dispatched |
| COMPANY_BALANCE_REPLENISHMENT | Wallet refilled |
| SIMPLE_PAYMENT.* | Equivalent events for direct (non-invitation) flow |

**Evidence for existing webhook handling:** ERD (EV-0-0234) shows `CommissionDisbursement_Audit` table (FK DisbursementId, PaymentDate, Status, Request nvarchar 2000, Response nvarchar 2000) — this is the audit log for DisburseCloud webhook callbacks.

**Requirement (technology-neutral):** The system shall expose a secure webhook receiver endpoint to accept asynchronous disbursement status events from the commission disbursement service. All events shall be persisted to an audit log before processing.

### 2.10 Error Types

`VALIDATION_ERROR`, `INTERNAL_SERVER_ERROR`, `LOW_FUNDS_ERROR`, `UNAUTHORIZED_ERROR`, `NOT_FOUND_ERROR`

**Requirement (technology-neutral):** The system shall handle `LOW_FUNDS_ERROR` from the disbursement service by alerting the operations team and pausing disbursement processing until the company balance is replenished.

### 2.11 Document Upload Pattern

DisburseCloud supports attaching documents to disbursements (signed agreements, loss reports). Documents are uploaded as base64-encoded PDFs. This aligns with the Azure Blob storage pattern used elsewhere in InsureEdge — documents may need to be retrieved from Blob and re-encoded for DisburseCloud upload at disbursement time.

---

## SECTION 3: RPS — NEW INTEGRATION (INT-011)

**Status:** NEW — not present in ART-1-004. Documented here for the first time.

### 3.1 Integration Summary

| Property | Value |
|---|---|
| Integration ID | INT-011 |
| Name | RPS (Risk to Potential Structures) Spatial Lookup |
| Direction | InsureEdge → Internal GIS service (outbound query) |
| Pattern | Direct SQL query to PostgreSQL/PostGIS database via OutSystems Integration Studio database connection |
| Source | EV-0-0237 |
| Status | DOCUMENTED (implementation TID v1.0 exists) |

### 3.2 Architecture Pattern

RPS is NOT a REST API integration. It is a direct database-level integration:

```
OutSystems Service Studio
  └─ Advanced SQL Action (GetRpsValueByLatLon)
       └─ OutSystems Integration Studio DB connection
            └─ PostgreSQL 16 / PostGIS 3.4 (Damco internal network)
                 └─ Table: public.rps_raster_5070 (or public.rps_raster)
                      └─ 26 GB GeoTIFF raster dataset (RPS_CONUS)
```

**Architecture note:** This integration does not traverse the public internet. The PostgreSQL/PostGIS server is on Damco's internal network. The OutSystems platform server must have network-level access to the PostgreSQL host.

**Assumption:** ASM-2-ARCH-004 — The PostgreSQL/PostGIS instance hosting the RPS raster is a Damco-internal infrastructure component, not a third-party SaaS service. Network path from OutSystems server to PostgreSQL must be confirmed and preserved in the target architecture. Confidence: HIGH (architecture diagram in EV-0-0237 explicitly labels "Damco's Network").

### 3.3 Data Source

| Property | Value |
|---|---|
| Dataset | RPS_CONUS (USDA Forest Service RDS-2020-0016-2) |
| Format | GeoTIFF (.TIF), 26 GB |
| CRS | EPSG 5070 (NAD83 / Conus Albers) |
| Tile size | 2000×2000 pixels (~2417 raster tiles in DB) |
| DB table | `public.rps_raster_5070` (production: `public.rps_raster`) |
| DB name | `gis` |
| DB engine | PostgreSQL 16 + PostGIS 3.4 |

### 3.4 Lookup Operation Contract

**Action name:** `GetRpsValueByLatLon`

| Parameter | Direction | Type | Notes |
|---|---|---|---|
| Lat | Input | Decimal | WGS84 latitude (EPSG 4326) |
| Lon | Input | Decimal | WGS84 longitude (EPSG 4326) |
| RpsValue | Output | Decimal | Risk to Potential Structures score |

**Core SQL (parameterised for OutSystems `@` syntax):**
```sql
SELECT ST_Value(
    r.rast,
    ST_Transform(ST_SetSRID(ST_MakePoint(@Lon, @Lat), 4326), 5070)
) AS RpsValue
FROM public.rps_raster_5070 r
WHERE ST_Intersects(
    r.rast,
    ST_Transform(ST_SetSRID(ST_MakePoint(@Lon, @Lat), 4326), 5070)
)
LIMIT 1;
```

**CRS transformation:** Input coordinates are in WGS84 (EPSG 4326); the raster is stored in EPSG 5070. `ST_Transform` is applied at query time — no pre-transformation of input is required.

### 3.5 Return Value Semantics

| Condition | RpsValue | Handling |
|---|---|---|
| Valid coverage area | 0.0 – 12.0 | Display risk value to underwriter |
| Point outside raster extent | NULL | Display "Out of coverage" |
| NoData pixel | NULL | Display "Out of coverage" |

**Requirement (technology-neutral):** The system shall display a clear "out of coverage area" indicator to the underwriter when the insured risk location falls outside the spatial coverage of the RPS dataset, rather than treating a null value as zero risk.

### 3.6 User Flow Integration

1. User (underwriter) enters insured property address during policy intake
2. Application geocodes address to Latitude/Longitude (via Google Maps or MapBox Geocode API — see also INT-005 HexCat which also uses geocoding)
3. `GetRpsValueByLatLon` is called with the resolved coordinates
4. Returned RPS value is displayed on the risk assessment screen and stored against `PolicyRiskInformation`

**Assumption:** ASM-2-ARCH-005 — The RPS value is stored in `PolicyRiskInformation` alongside the HexCat risk data (HexZoneIdLower, HexZoneIdHigher, HexCatStatus). The `PolicyRiskInformation` table in ART-1-001 does not currently include a `RpsValue` column; a schema extension or separate table is required in the target. Confidence: MEDIUM.

### 3.7 Performance Characteristics

| Metric | Value | Source |
|---|---|---|
| Spatial index | `rast_gist` (GiST index on raster column) | EV-0-0237 |
| Expected query time | 2–10 ms | EV-0-0237 |
| Access pattern | Single-point lookup per policy intake event | — |
| Server spec recommended | 32 GB RAM, 200 GB+ disk | EV-0-0237 |

### 3.8 Infrastructure Requirements (Technology-Neutral)

**REQ-2-RPS-001:** The system shall maintain access to the RPS spatial database, either by preserving the existing PostgreSQL/PostGIS infrastructure in the target environment or by migrating the raster dataset to an equivalent geospatial query service.

**REQ-2-RPS-002:** The system shall support direct database-connection-based geospatial queries from the application tier to the RPS data store, with a target latency of under 100 ms per lookup under normal load.

**REQ-2-RPS-003:** The system shall handle the coordinate system transformation from WGS84 (EPSG 4326) to NAD83/Conus Albers (EPSG 5070) transparently, without requiring callers to pre-transform coordinates.

### 3.9 Migration Consideration

The RPS GeoTIFF dataset (26 GB) must be treated as a migration artifact. It is not regenerated from source data on demand — it is a licensed static dataset. Migration planning must include:
- Transfer of the GeoTIFF file to the target environment
- Re-execution of `raster2pgsql` load process (§4 of EV-0-0237)
- Re-application of SRID correction (EPSG 5070, §5 of EV-0-0237)
- Re-creation of spatial indexes

### 3.10 Open Questions

| QST ID | Priority | Question |
|---|---|---|
| QST-2-INT-011-001 | MAJOR | Is the PostgreSQL/PostGIS RPS server hosted on Damco infrastructure or InsureEdge client infrastructure? This determines who is responsible for it in the target environment. |
| QST-2-INT-011-002 | MAJOR | Is the RPS lookup currently live in production, or is this a new capability under development? The TID (v1.0) reads as a setup guide rather than operational documentation. |
| QST-2-INT-011-003 | MINOR | Where is the RPS score stored in the current data model? If it is not yet persisted, a schema extension is required. |

---

## SECTION 4: Domain Architecture Summary

**Source:** EV-0-0233 (diagram — text extraction only; no module-level DDL or OML available from this artifact)

### 4.1 Vertical Domain Inventory

Each vertical domain follows a two-layer OutSystems module pattern: `{Domain}_BL` (Business Logic — server actions, data access) and `{Domain}_CS` (Core Services — shared services, reusable actions). UI modules are separate per OutSystems O11 convention.

| Domain Name | BL Module | CS Module | Notes |
|---|---|---|---|
| InsureEdge 2.0 Portal | IE_Client_BL | IE_Client_CS | Main policyholder-facing portal |
| InsureEdge (legacy) | — | — | Likely the original single-module application; being superseded by 2.0 |
| Groups | IE_Groups_BL | IE_Groups_CS | User group management |
| Accounts | IE_Accounts_BL | IE_Accounts_CS | Account-level management |
| Policy | IE_Policy_BL | IE_Policy_CS | Policy lifecycle — core transactional domain |
| Product Maintenance | IE_ProductMaintenance_BL | IE_ProductMaintenance_CS | Product configuration management |
| Common | IE_Common_CW | IE_Common_BL | IE_Common_CS | Shared utilities; CW suffix = Component/Widget library |
| Claims | IE_Claims_BL | IE_Claims_CS | Claims management |
| Distribution Management | IE_DistributionManagement_BL | IE_DistributionManagement_CS | Intermediary/producer management |
| Product Management | IE_ProductManagement_BL | IE_ProductManagement_CS | Insurance product catalog |
| User Management | IE_UserManagement_BL | IE_UserManagement_CS | User/role/permission management |

**Assumption:** ASM-2-ARCH-006 — The `IE_Common_CW` module is the shared UI component library (widgets, theme overrides, reusable screen blocks). The `CW` suffix likely denotes Component/Widget, consistent with OutSystems O11 conventions for shared UI patterns. Confidence: MEDIUM.

### 4.2 Foundation / Horizontal Services

| Component | Module(s) | Role |
|---|---|---|
| InsureEdge 2.0 Theme | InsureEdge_Lib, InsureEdge_Th | Shared theme and UI style library |
| InsureEdge 2.0 DB (operational) | InsureEdge_ext | External database connection to InsureEdge_DEV |
| InsureEdge 2.0 DB (system) | InsureedgeSYS_ext | External database connection to InsureEdge_System_DEV |

**Critical architecture note:** The two `_ext` modules expose the two SQL Server databases (InsureEdge_DEV and InsureEdge_System_DEV) to the OutSystems application layer. All domain BL/CS modules consume these connections. This is the OutSystems O11 External Database pattern and is the architectural mechanism behind the cross-database coupling already identified in FND-1-DATA-001.

### 4.3 Rating Engine

The IE Rating Engine appears as a distinct module (`IERatingEngine`) connected to the Policy domain via a dashed line (indicating an indirect/async dependency rather than a direct BL reference). The dashed connection suggests:

- The rating engine is invoked from IE_Policy_BL but is not a direct dependency in the OutSystems sense
- It may be a separate OutSystems application or an independently deployed action

**Assumption:** ASM-2-ARCH-007 — The IE Rating Engine uses the `HBRater_*` tables in InsureEdge_DEV (confirmed in EV-0-0234: HBRater_LRHexzones, HBRater_HRHexzone, HBRater_StateTaxSheet, HBRater_ExcessFloodCoverage) as locally-hosted rate tables rather than making external API calls for rating. The rating engine is therefore a data-intensive internal service, not an external integration. Confidence: HIGH (rate tables confirmed in operational DB ERD).

### 4.4 Full Layer Architecture Pattern

```
Layer 4 (End User):        Browser / Mobile client
Layer 3 (External API):    Public-facing API endpoints (if any)
Layer 2 (Internal API):    Internal service APIs between modules
Layer 1 (Composite Logic): BL modules — workflow orchestration, business rules
Layer 0 (Core Services):   CS modules — entity CRUD, shared logic
Foundation:                InsureEdge_ext, InsureedgeSYS_ext (DB connections)
                           InsureEdge_Lib, InsureEdge_Th (UI theme/library)
```

**Requirement (technology-neutral):** The target architecture shall maintain the separation between workflow orchestration (BL equivalent), shared entity services (CS equivalent), and cross-cutting foundation services to support independent module evolution and testing.

### 4.5 Common Domain — Special Note

The Common domain is the only domain with three module types: `IE_Common_CW` (widget/component library), `IE_Common_BL` (business logic), and `IE_Common_CS` (core services). All other domains have only BL + CS. This means the Common domain serves the additional role of shared UI component provider across all other vertical domains.

**Migration implication:** When migrating from OutSystems O11, the Common domain's widget library (`IE_Common_CW`) must be decomposed into:
- Shared UI component definitions (migrated to target framework's component library)
- Business logic currently mixed into the "Common" concern (migrated to domain-specific services)

---

## SECTION 5: ERD Delta Analysis

**Source:** EV-0-0234 (InsureEdge_DEV operational ERD) and EV-0-0235 (InsureEdge_System_DEV ERD), cross-referenced against ART-1-001 (DDL catalogue).

The DDL catalogue (ART-1-001) identified 92 tables in InsureEdge_DEV and 26 in InsureEdge_System_DEV from SQL DDL scripts. The ERD artifacts reveal an additional ~35 tables and significant schema enrichments not visible in the DDL at SCAN time. The following delta findings must be incorporated into target data modelling.

### 5.1 New Tables — InsureEdge_DEV (Operational DB)

#### Billing & Payments

| Table | Key Columns | Notes |
|---|---|---|
| PolicyPremium | StampingFee, PolicyFees, TotalInstallmentFee, TotalCoveragePremium, ResponsibleParty, PaymentFrequency, NumberOfInstallments, IsPolicyFullyPaid, IsPaymentRequiredToBind, FirstPaymentDate, ModeOfPaymentToUse (ACH/CC), IsCancelled | Replaces/enriches `PolicyPaymentPlan` from DDL; contains computed premium totals with formula annotations in ERD |
| PolicyPaymentTransaction_Extended | FK → PolicyPaymentTransaction; SurplusLine (amount + percentile), FirePremiumTax (amount + percentile), InstallmentFee | Itemised tax breakdown per transaction; 1:1 extension |
| CancellationPaymentTransaction | FK PolicyId, RefundAmount, TransactionStatus, TransactionId, PaymentMethod, ResponseCode, ResponseJSON | Audit log for cancellation refund transactions; read-only audit |
| PaymentCallbackResponses | FK PolicyId, TransactionStatus, TransactionId, ResponseCode, ResponseJSON | TranzPay callback audit; marked "to be added" in ERD annotation (@mukulsinghnathawat) |
| CommissionDisbursement_Audit | FK DisbursementId, PaymentDate, Status, Request (nvarchar 2000), Response (nvarchar 2000) | DisburseCloud webhook audit log |
| PaymentSuperseding | FK WorksheetPayment → CauseOfLossDescription | Links payment line items to cause-of-loss classification |

#### Rating Engine

| Table | Key Columns | Notes |
|---|---|---|
| HBRater_LRHexzones | LRHexzone, StateAbb, Derechorateper1000, XwindCombinedrate_allotherpen, Earthquakerate, sinkholeRate, Liabilityrates, Flashfloodrates | Low-risk zone rate table; internal to operational DB |
| HBRater_HRHexzone | HRHexzone, Hurricanerateper1000, Wildfire, Tornado, Hail | High-risk zone rate table |
| HBRater_StateTaxSheet | STATE, SurplusLines, StampingFee, FirePremiumTax, Abbriviation | State tax and fee schedule |
| HBRater_ExcessFloodCoverage | Type, TypeOfBuilding, BuildingDescription, BaseFloodElevation, FloodZone, PValue | Excess flood coverage rate schedule |
| Rating_Wildfire | State, K8 (decimal) | Wildfire rating factor per state |

**Architectural significance:** All HBRater/Rating tables are embedded in the operational InsureEdge_DEV database. The rating engine reads these tables directly via SQL rather than calling an external rating API. This means rating calculations are performed in-process against locally hosted rate tables. Rate updates require direct DB updates, not API contract changes.

#### Notifications & Retry

| Table | Key Columns | Notes |
|---|---|---|
| NotifyLenderdock | FK PolicyId, Response (nvarchar 2000), ResponseCode, FailedDateTime, RetryCounter (int) | LenderDock notification retry tracking; RetryCounter confirms retry mechanism exists |

#### Risk Information Audit

| Table | Key Columns | Notes |
|---|---|---|
| HexCat_RiskInfo_Audit | All HexCat API request/response fields | Full audit log of HexCat geocoding/risk API calls |
| SampleTestForHexCat | Id, Count, CreateDate | Diagnostic/test table — likely for HexCat integration testing |

#### Document Templates & Generation

| Table | Key Columns | Notes |
|---|---|---|
| ProductDocument | Name, ClientId, PlumSailProcessId, PlumsailUserId, BlobPath, ClientMappingId, DocOrder | Document template entity; PlumSailProcessId confirms Plumsail integration for document generation |
| Template / TemplateDocument / TemplateState | (document template management with versioning) | Template lifecycle management |

#### Claims Extension Tables

| Table | Key Columns | Notes |
|---|---|---|
| LossExposure / LossExposureServiceDetail / LossExposureDamage | (service and damage tracking per loss) | Detailed loss exposure records |
| ClaimEscalation | AssignedTo, EscalatedBy, EscalationCounter, Priority | Escalation workflow |
| ClaimAuthority | ReserveLimit, IndemnityPaymentLimit, FeePaymentLimit, ExGratiaPaymentLimit, PaymentMethodRestrictions, CanDenyClaim | Authority matrix for claim payments |
| ClaimMortgage | FK ClaimId, MortgageServiceCompany, LoanNumber, LossExposureId | Claims-side mortgage tracking (mirrors PolicyMortgage) |
| ClaimCoverage / ClaimCoverageLimit / CauseOfLossDescription / CauseOfLossGroup / CauseOfLossGroupDescription | (complex claims coverage configuration) | Cause of loss classification hierarchy |
| ClaimLetter | RecipientRole, DeliveryMethod, LetterType, EmailBody (nvarbinary), ClaimLetterCode | Claim correspondence |
| ClaimReport | PrecintName, CaseStatus, ReportFilingDate, NumberOfWitness | Police/incident report filing |
| Claimant | (full claimant entity) | Named claimant — not in DDL catalogue |
| Witness | (witness records) | Witness tracking for claims |
| AdjusterLicense | LicensedState, LicenseNumber, LicenseStart/Expiration dates | Adjuster licensing compliance |

#### Cross-Module Infrastructure

| Table | Key Columns | Notes |
|---|---|---|
| Email / EmailAttachment | Sender, SentTo, CC, BCC, Message (varbinary), Subject, ClaimId, PolicyId, EmailCategory, Department | Email audit trail across modules |
| Task / TaskAction | (task management system) | Workflow task management |
| Comment | CommentType, CommentCategory, Team, Assignee, ModuleCode, RecordId | Cross-module comment system |
| Configuration / ConfigurationValues | (client-scoped configuration) | Runtime configuration system |
| DropdownType / PolicyDropdownConfiguration / PolicyConfigurationRequestedBy / PolicyConfigurationTransactionType | (dynamic dropdown configuration) | UI dropdown data management |
| Report | BlobPath, ReportingPeriod, ReportType, Module | System-generated reports stored in Blob |
| NoteFile / Note | (notes with binary attachments) | Notes system — FK to Account, Policy |
| BulkUploadAudit / BulkUploadDump | (bulk upload tracking) | Batch data import tracking |

#### Policy Extension Tables

| Table | Key Columns | Notes |
|---|---|---|
| Policy_Extended | PrimaryInsuredType, CancellationEffectivedate, ProrationBasis, ReasonOfCancellation, EndorsementEffectiveDate, RewriteEffectiveDate, PriorPolicyId, RenewalOfferDate, DeclinedReason | Policy lifecycle extension; stores endorsement and cancellation data |
| Policy_Extended_Binary | EndorsementSummary, UWSpecificChange | Binary fields for policy documents |
| Account_Extended | AgeMoreThan65 (bit) | Simple account extension; eligibility flag |
| AccountBinary | DocumentType, DocumentName; references AccountId, ClaimId, AdjusterId, PolicyId, PayeeBankId, ReportId, LossExposureId, WitnessId | Multi-purpose binary document storage with cross-entity references |
| PolicyAccount | PolicyId, AccountId | Junction table confirming M:N Policy↔Account relationship |
| StateSpecificDataTable | StateAbbreviation, StateDisclaimer, LicenseNumber | State compliance content |

#### Reference / Display

| Table | Notes |
|---|---|
| PremiumTable / BillingTable / CommissionsTable / PaymentTable / PolicyFeeandTaxes / PolicyInformation | ERD shows these as legacy mapping/reference tables, likely migration reference from prior system — not active transactional tables |

### 5.2 ERD-Confirmed Relationship Updates

The following relationship findings from EV-0-0234 update or supplement ART-1-001 §4:

| Relationship | ERD Finding | Impact on ART-1-001 |
|---|---|---|
| Policy ↔ Account | `PolicyAccount` junction table confirms M:N — Policy can belong to multiple Accounts and vice versa | ART-1-001 shows Policy.AccountId as a simple FK suggesting 1:N; M:N is a structural correction |
| Policy → PolicyPremium | 1:1 FK confirmed in ERD | New relationship — `PolicyPremium` not in ART-1-001 |
| PolicyPremium → PolicyPaymentTransaction | 1:N via FKPolicyPremiumId | Changes the FK chain: PolicyPremium is the intermediary between Policy and transactions |
| PolicyPaymentTransaction → PolicyPaymentTransaction_Extended | 1:1 extension FK confirmed | New table — not in ART-1-001 |
| PolicyCommission → CommissionPaymentTransaction | 1:N (existing in ART-1-001) | Confirmed by ERD |
| Worksheet → Claim | FK shown in ERD (partially resolves FND-1-DATA-002) | ERD shows FK but DDL does not have DB-level constraint — remains a risk |
| Claim → Policy | Dashed line in ERD | Confirms logical-only FK; no DB constraint. FND-1-DATA-002 stands |
| IntermediaryProducerLogos / IntermediaryProducerAddress | Serve both Intermediary and Producer entities | Cross-entity document/address sharing pattern |

### 5.3 New Tables — InsureEdge_System_DEV

The System DB ERD (EV-0-0235) enriches the 26-table DDL catalogue with the following structural details:

| Finding | Impact |
|---|---|
| `Client` table has 15+ additional columns beyond ART-1-001: ClientCode, TypeOfCompany, NAICCode, DomicileCountry, StateOfDomicile, StateAllowedtooperate, FederalTaxID, OwnedBy, NumberofEmployees, EstDirectWrittenPremium, YearBusinessStarted, OSTenantID, ClientMappingId, ClientURL, EmailId, LastStep | Client entity is far richer than DDL suggests — it is the full insurer/carrier entity |
| `ClientConfig` table: Language, Currency, DateFormat, TimeZone, SystemTheme per client | Per-client localisation configuration — not in ART-1-001 |
| `ClientSubscription` table: ActivationDate, ExpiryDate, NoOfYearsInContracts, NumberOfUserPerContractYear, MaximumDWP, ExpRenewalReminder | SaaS subscription management — not in ART-1-001 |
| `Company` table: CompanyCode (UK), CompanyName, DomicileCountry, NAICCode, FederalTaxID | Writing company entity — distinct from Client |
| `CompanyProduct` / `CompanyProductsJurisdiction` | Company↔Product assignments with jurisdiction control |
| `InsuranceProduct` table: InsuranceType, ProductCode, USRatingService, MultiStateCircular, StateCircularReference, MSCEffectiveDate, Country, States, Expirationdate | Full insurable product configuration |
| `Users` (more detailed than `User2` in DDL): ClientID, UserCode, Status, OfficeLocation, IsManager, ReportsTo, IsRemoteWorking, OsUserId, Department | Password field absent from ERD — confirms Password is not intended to be shown in design |
| `ClientScreens` / `UserScreen` | Per-client and per-user screen permission overrides |
| `UserBinary` | User profile images/binary files |
| `Contacts` / `Address` / `ClientOffice` | Shared contact/address entities |
| `ClientCompanyLogos` | Logo varbinary per client/company combination |
| `SystemDefaultContent` | BlobPath, FileName, ScreenCode — system-managed content |
| `AppScreen` enrichment: IconString, RedirectURL, ScreenCode (UK), DisplayOrder, IsActive, IsShowInMenu | Screen registry is richer than DDL shows |
| `Module` enrichment: IsSubmodule, ParentModuleId, ModuleSVG, ModuleCode (UK), RedirectingURL, DisplayOrder, IsShowInMenu | Module hierarchy now confirmed; ModuleCode is UK |
| `ScreenPermissions` enrichment: Visibility field; IntermediaryId and AdjusterId cross-references | Permission model extends to Intermediary and Adjuster actors |
| `UserPasswordReset` | UserName, Code, CreatedOn, UserId — token-based password reset |
| `Country` / `State` | Reference tables not in DDL |

**Designer annotation from EV-0-0235:** "ModuleCode Is to be deleted as it is same as Module.Modulecode" (@ManideepYadlapalli) — confirms a known redundancy in the schema that should not be migrated to the target.

### 5.4 ERD Delta — Risk Implications

| Risk ID | Finding | Impact |
|---|---|---|
| RSK-2-DATA-001 | PolicyAccount junction table means Policy has M:N with Account — the DDL catalogue shows a simple FK suggesting 1:N. Migration data mapping must account for the junction table. | HIGH — data migration query design changes |
| RSK-2-DATA-002 | PolicyPremium is an intermediate entity between Policy and PolicyPaymentTransaction — not in ART-1-001. Any migration that reads PolicyPaymentTransaction without joining PolicyPremium will miss the payment plan context. | HIGH |
| RSK-2-DATA-003 | `PaymentCallbackResponses` is marked "to be added" in ERD — this table may not exist in the current InsureEdge_DEV DDL. If absent, TranzPay callback data has no dedicated audit log yet. | MEDIUM |
| RSK-2-DATA-004 | Legacy mapping tables (PremiumTable, BillingTable, etc.) visible in ERD may contain source data from a prior system migration. Their role must be confirmed before target schema is finalised. | MEDIUM |
| RSK-2-DATA-005 | `AccountBinary` references 8 different entity types via nullable FKs — this is a polymorphic binary storage pattern. Target architecture should migrate to entity-specific Blob path references rather than a single polymorphic table. | MEDIUM |

---

## SECTION 6: Document Storage — ENRICHED (INT-007)

**Source:** EV-0-0238 (Azure Blob TID v1.0). INT-007 in ART-1-004 already carries the basic Azure Blob entry. This section enriches the contract with TID-confirmed details.

### 6.1 Confirmed Storage Pattern

**Architecture:** File → OutSystems file upload widget → Binary in OutSystems session → `Create Blob & GenerateMetadata` call to Azure Blob Storage → Blob path stored in SQL `Bin` table

**Path format (confirmed from TID cover page):**
```
ClientCode/ModuleName/BinRecordId/Filename
```

This is the canonical Blob path structure used across all document types in InsureEdge.

### 6.2 Bin Table Schema (Confirmed)

The TID diagram shows a `Bin` table used as the document metadata store:

| Column | Type | Notes |
|---|---|---|
| Id | bigint | Primary key |
| Path | nvarchar(1000) | Full Blob path in format ClientCode/ModuleName/BinRecordId/Filename |
| RecordId | bigint | FK to the owning entity record |

**Enrichment note:** The `Bin` table appears to be a generic, module-reused metadata table. The ERD (EV-0-0234) shows `AccountBinary` as the equivalent polymorphic binary reference table in the operational DB, with `DocumentType` and `DocumentName` fields plus nullable FKs to multiple entity types. These two tables (Bin and AccountBinary) may serve the same purpose in different module contexts.

### 6.3 Access Pattern

**Write path:** OutSystems → `Create Blob & GenerateMetadata` action → Azure Blob Storage (insureedgeapplication container) → Returns Blob path → Path stored in `Bin.Path`

**Read path (inferred):** Application retrieves Blob path from `Bin` table → Generates SAS token → Returns time-limited URL to client

**Assumption:** ASM-2-ARCH-008 — Read access to stored documents uses Azure SAS (Shared Access Signature) tokens generated at request time, consistent with the secure-by-default Azure Blob pattern and the existing SAS token reference found in ART-1-004. The TID does not explicitly document read operations beyond path storage. Confidence: MEDIUM.

### 6.4 Requirement (Technology-Neutral)

**REQ-2-DOC-001:** The system shall store all binary documents (policy documents, claim documents, user uploads, system-generated reports) in an external object storage service. The application database shall store only a path reference, not the binary content.

**REQ-2-DOC-002:** The system shall organise stored documents using a hierarchical path that includes client identifier, module context, record identifier, and filename to enable per-client isolation and efficient retrieval.

**REQ-2-DOC-003:** The system shall generate time-limited access tokens for document retrieval rather than exposing direct permanent storage URLs to end users.

### 6.5 Module Coverage

Based on the ERD delta (Section 5.1) and the Bin path format, document storage is used across:
- Policy documents (`PolicyDocument` table — `BlobPath` column)
- Claim documents (`ClaimDocument` table)
- Account binary files (`AccountBinary` table)
- User profile images (`UserBinary` in System DB)
- Report files (`Report.BlobPath`)
- Product document templates (`ProductDocument.BlobPath`)
- System default content (`SystemDefaultContent.BlobPath`)
- Policy Extended binary fields (`Policy_Extended_Binary`)
- Note attachments (`NoteFile`)
- Claim letters (`ClaimLetter.EmailBody` — possibly inline vs blob)

---

## SECTION 7: Integration Risk Updates

The following risk entries supplement or update the risks in ART-1-004.

| Risk ID | Integration | Risk Description | Severity | Notes |
|---|---|---|---|---|
| RSK-2-INT-001 | TranzPay (INT-001) | Production URL not documented in TID. All code references demo endpoint `demo.tranzpay.com`. If production URL is not obtained before FORGE, there is a risk of deploying with sandbox endpoint. | CRITICAL | Blocks FORGE start for payment module |
| RSK-2-INT-002 | TranzPay (INT-001) | Raw PAN (card number, CVV) transmitted in `AddCustomerCCCharge` operation — not in the hosted redirect flow. If this operation is used in production, PCI-DSS SAQ D scope applies to the InsureEdge server. | HIGH | Prefer hosted `ThirdParty` flow for PCI scope reduction |
| RSK-2-INT-003 | TranzPay (INT-001) | `BypassRefundResponse_ToBeFalseInPROD = TRUE` in current DEV site property (from ART-1-004). Refund bypass in DEV may mask refund failure handling. Must be set to FALSE before UAT. | HIGH | Configuration risk |
| RSK-2-INT-004 | DisburseCloud (INT-002) | Site property `DisbursementBaseURL` points to deprecated/incorrect endpoint (`/Vendors/RegisterVendor`). Current integration may not be fully operational. Full reimplementation to v1.2.1 may be required. | HIGH | FND-2-INT-001 |
| RSK-2-INT-005 | DisburseCloud (INT-002) | `DisbursementEncryptionKey` in site properties has no corresponding reference in v1.2.1 API docs. Its purpose and whether it is still required is unknown. | MEDIUM | ASM-2-ARCH-002 |
| RSK-2-INT-006 | DisburseCloud (INT-002) | Token expiry is 3600 seconds (1 hour). If long-running batch disbursement processes do not refresh the token, calls will fail mid-batch with `UNAUTHORIZED_ERROR`. | MEDIUM | Token refresh logic required |
| RSK-2-INT-007 | RPS (INT-011) | RPS GeoTIFF raster is 26 GB. Transfer to target environment is a significant migration operation — must be planned separately from application data migration. | MEDIUM | Infrastructure migration item |
| RSK-2-INT-008 | RPS (INT-011) | OutSystems does not support PostGIS geometry types (confirmed in TID). The `rast` column in `rps_raster_5070` is ignored by Integration Studio. If the OutSystems database connection model changes in the target, this integration must be re-implemented via Advanced SQL or a microservice. | MEDIUM | Technology coupling risk |
| RSK-2-INT-009 | HBRater (internal) | Rating rate tables (HBRater_*) are embedded in the operational InsureEdge_DEV SQL Server database. If the target architecture separates the rating engine from the operational database, these tables must be migrated and their access patterns re-established. | HIGH | Architecture dependency |
| RSK-2-INT-010 | Document Storage (INT-007) | `AccountBinary` table uses a polymorphic FK pattern (nullable FKs to 8 entity types). This pattern does not enforce referential integrity and will be difficult to migrate to a normalized target schema. | MEDIUM | Data migration complexity |

---

## SECTION 8: Open Questions — Status Update

This section reports the status of open questions from ART-1-004 as of this HARVEST pass, and adds new questions arising from the six new PDFs.

### 8.1 Questions from ART-1-004 — Status Update

| QST ID | Original Question | Status |
|---|---|---|
| QST-1-INT-001 | TranzPay endpoint, auth, request/response schema | **ANSWERED** by EV-0-0232. See Section 1. Blocking status lifted. |
| QST-1-INT-002 | DisburseCloud full API contract and auth flow | **PARTIALLY ANSWERED** by EV-0-0236. Full v1.2.1 REST contract documented. Gap: `DisbursementBaseURL` site property does not match v1.2.1 — requires human confirmation on which version is actually integrated. |
| QST-1-INT-003 | HexCat API contract and rate limiting | **NOT YET ANSWERED** — no new PDF artifact for HexCat in this pass. Remains open. |
| QST-1-INT-004 | LenderDock retry mechanism detail | **PARTIALLY ANSWERED** — ERD (EV-0-0234) confirms `NotifyLenderdock.RetryCounter` exists. Retry logic confirmed at data level. Full retry policy (max attempts, backoff) still requires OML review. |
| QST-1-INT-005 | Plumsail document generation contract | **PARTIALLY ANSWERED** — ERD (EV-0-0234) confirms `ProductDocument.PlumSailProcessId` and `PlumsailUserId` columns, confirming Plumsail integration at template level. Full API contract not yet documented. |

### 8.2 New Questions Raised in This Pass

| QST ID | Priority | Domain | Question |
|---|---|---|---|
| QST-2-INT-001 | CRITICAL | TranzPay | What is the TranzPay production base URL? (`demo.tranzpay.com` is confirmed as sandbox only. FORGE cannot complete without the production URL.) |
| QST-2-INT-002 | MAJOR | TranzPay | What is the full contract for `ACHRefund` and `CreditCardRefund` operations? The TID (EV-0-0232) does not document refund endpoints. |
| QST-2-INT-003 | MAJOR | DisburseCloud | Confirm: is the existing InsureEdge DisburseCloud integration using the v1.2.1 REST API or an older version? The site property URL (`/Vendors/RegisterVendor`) does not match any v1.2.1 endpoint. |
| QST-2-INT-004 | MAJOR | DisburseCloud | What is the purpose of `DisbursementEncryptionKey` in the InsureEdge site properties? The key (stored in Key Vault: `DisburseCloud--EncryptionKey`) has no reference in the v1.2.1 API documentation. |
| QST-2-INT-005 | MAJOR | RPS | Is the PostgreSQL/PostGIS RPS server hosted on Damco infrastructure or on the InsureEdge client's infrastructure? Who is responsible for it in the target environment? |
| QST-2-INT-006 | MAJOR | RPS | Is the RPS lookup currently live in production, or is INT-011 a capability under development? |
| QST-2-INT-007 | MAJOR | Data | Confirm whether `PaymentCallbackResponses` table has been created in InsureEdge_DEV. It is marked "to be added" in the ERD annotation. |
| QST-2-INT-008 | MAJOR | Data | What is the role of the legacy mapping tables in the ERD (PremiumTable, BillingTable, CommissionsTable, PaymentTable, PolicyFeeandTaxes, PolicyInformation)? Are these live transactional tables or migration reference artifacts from a prior system? |
| QST-2-INT-009 | MINOR | Data | Confirm: does `PolicyRiskInformation` currently store the RPS value, or is a schema extension required? |
| QST-2-INT-010 | MINOR | DisburseCloud | What webhook receiver URL is currently registered with DisburseCloud in the sandbox environment? |
| QST-2-INT-011 | MINOR | Architecture | Confirm the `IERatingEngine` module deployment — is it a separate OutSystems application or a module within the same application as IE_Policy_BL? |

---

## Assumptions Register (this pass)

| ASM ID | Statement | Confidence | Section |
|---|---|---|---|
| ASM-2-ARCH-001 | TranzPay refund operations (`ACHRefund`, `CreditCardRefund`) use the same endpoint and credential pattern as charge operations, distinguished by `ApiName`. | MEDIUM | 1.8 |
| ASM-2-ARCH-002 | `DisbursementCompanySecrectKey` (Key Vault: `DisburseCloud--CompanySecretKey`) maps to the User API Key used as Basic Auth password in DisburseCloud authenticate call. `DisbursementEncryptionKey` (Key Vault: `DisburseCloud--EncryptionKey`) purpose unknown. | LOW | 2.1 |
| ASM-2-ARCH-003 | Current InsureEdge DisburseCloud integration may be in vendor-registration-only state or using a deprecated API version, not the full v1.2.1 disbursement lifecycle. | MEDIUM | 2.1 |
| ASM-2-ARCH-004 | The PostgreSQL/PostGIS RPS server is Damco-internal infrastructure, not a third-party SaaS. Network path from OutSystems server to PostgreSQL must be preserved in target environment. | HIGH | 3.2 |
| ASM-2-ARCH-005 | RPS value is intended to be stored in `PolicyRiskInformation` alongside HexCat data. A schema extension column (`RpsValue`) is required as it does not exist in the current DDL. | MEDIUM | 3.6 |
| ASM-2-ARCH-006 | `IE_Common_CW` module is the shared UI component/widget library for all vertical domains. `CW` suffix denotes Component/Widget per OutSystems O11 convention. | MEDIUM | 4.1 |
| ASM-2-ARCH-007 | IE Rating Engine uses locally-hosted `HBRater_*` SQL tables for rating calculations rather than external API calls. Rating is an internal data-driven service. | HIGH | 4.3 |
| ASM-2-ARCH-008 | Document read access uses Azure SAS tokens generated at request time. The TID does not explicitly document read operations. | MEDIUM | 6.3 |

---

## New Findings Summary (FND register entries for this pass)

| FND ID | Finding | Evidence | Confidence |
|---|---|---|---|
| FND-2-INT-001 | DisburseCloud site property `DisbursementBaseURL` (`/Vendors/RegisterVendor`) does not match any endpoint in v1.2.1 API. Current integration is likely using an older/different API version. | EV-0-0236 vs ART-1-004 | HIGH |
| FND-2-INT-002 | TranzPay integration uses a hosted redirect pattern (`ThirdParty` TransactionType) as the primary payment flow, not direct card charge. Vault tokenisation is enabled via `AddVault: "Y"` with `CustomerID` as vault key. | EV-0-0232 | HIGH |
| FND-2-INT-003 | RPS integration is a direct PostgreSQL/PostGIS database connection from OutSystems — not a REST API. The 26 GB GeoTIFF raster is hosted on Damco's internal network. | EV-0-0237 | HIGH |
| FND-2-INT-004 | HBRater rate tables are embedded in the operational InsureEdge_DEV SQL Server database (5 rate tables confirmed in ERD). Rating is an internal, locally-hosted function, not an external API dependency. | EV-0-0234 | HIGH |
| FND-2-INT-005 | `PolicyAccount` junction table in ERD confirms Policy↔Account relationship is M:N, not the 1:N implied by the simple `Policy.AccountId` FK in ART-1-001. | EV-0-0234 | HIGH |
| FND-2-INT-006 | `PolicyPremium` entity exists as an intermediate layer between Policy and PolicyPaymentTransaction. Premium totals (including taxes and fees) are computed at the PolicyPremium level. | EV-0-0234 | HIGH |
| FND-2-INT-007 | DisburseCloud v1.2.1 supports 7 payment delivery methods (ACH, postal check, virtual card, instant deposit, digital check, Venmo, PayPal) and 4 payee types (ONE_TIMER, VENDOR, AGENCY, NAMED_INSURED). | EV-0-0236 | HIGH |
| FND-2-INT-008 | Azure Blob storage path follows the convention `ClientCode/ModuleName/BinRecordId/Filename` as confirmed by TID. Metadata is persisted in a `Bin` table (Id bigint, Path nvarchar(1000), RecordId bigint). | EV-0-0238 | HIGH |
| FND-2-INT-009 | Domain architecture follows a consistent BL/CS two-layer pattern across 11 vertical domains, with Common domain uniquely adding a CW (widget) layer. Foundation layer uses two OutSystems external DB connections (`InsureEdge_ext`, `InsureedgeSYS_ext`). | EV-0-0233 | MEDIUM |
| FND-2-INT-010 | `CommissionDisbursement_Audit` table in ERD confirms DisburseCloud webhook responses are persisted. `PaymentCallbackResponses` table is marked "to be added" for TranzPay callbacks, meaning this audit log may not yet exist in the live database. | EV-0-0234 | HIGH |

---

*End of ART-2-012 — Integration & Architecture Supplement | INSUREEDGE-2026 | HARVEST Phase | 2026-06-17*
*Produced by Integration Agent + Architecture Agent. SCAN phase catalogues (ART-1-001, ART-1-004) not modified.*
*All inferences marked ASM-2-ARCH-{seq}. All findings cite EV- numbers. Technology-neutral requirement statements used throughout.*
