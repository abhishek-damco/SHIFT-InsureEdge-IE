# ART-1-004 — Integration Catalogue
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Integration Agent
**Phase:** SCAN
**Date:** 2026-06-16
**Confidence:** HIGH (revised 2026-06-16) — Site properties supplied by human (EV-0-0231). LenderDock auth confirmed. IEDocumentGenerator = Plumsail confirmed. DisburseCloud URL + keys confirmed. SMTP confirmed. TranzPay contract remains placeholder per human instruction.

---

## 1. Integration Inventory

| # | System | Purpose | Direction | Confidence | Contract Status |
|---|--------|---------|-----------|-----------|----------------|
| INT-001 | TranzPay | Payment gateway — ACH debit, credit card charge, refunds | Outbound | MEDIUM | **PLACEHOLDER** — contract deferred per human instruction |
| INT-002 | LenderDock | Mortgage lender notifications for policy lifecycle events | Outbound | HIGH | **RESOLVED** — Basic auth header confirmed (EV-0-0231) |
| INT-003 | Google Geocoding / Maps | Address-to-lat/lng conversion + map display | Outbound | HIGH | **RESOLVED** — Both API keys confirmed (EV-0-0231) |
| INT-004 | RssExtensionCryptoAPI | AES-256 encryption/decryption — internal OutSystems extension | Internal | HIGH | **RESOLVED** — Base64Key value confirmed (EV-0-0231) |
| INT-005 | InsureEdgeEmails / SMTP | Transactional email dispatch via Office365 SMTP | Outbound | HIGH | **RESOLVED** — smtp.office365.com:587/TLS confirmed (EV-0-0231) |
| INT-006 | Plumsail API (IEDocumentGenerator) | Cloud document generation service — declaration pages, notices, packages | Outbound | HIGH | **RESOLVED** — Plumsail endpoint confirmed (EV-0-0231) |
| INT-007 | HexCat | Catastrophe zone / risk rating data per property location | Outbound | MEDIUM | **PARTIAL** — function confirmed; vendor API key not in site properties |
| INT-008 | Azure Blob Storage | Binary document storage and retrieval | Bidirectional | HIGH | **RESOLVED** — Account, container, and connection string confirmed (EV-0-0231) |
| INT-009 | DisburseCloud | Commission disbursement to intermediaries/producers | Outbound | HIGH | **RESOLVED** — Sandbox URL, secret key, and encryption key confirmed (EV-0-0231) |
| INT-010 | RssExtensionardoHTTP | Generic HTTP GET client for all outbound REST calls | Internal | HIGH | Known delegate pattern |

---

### INT-001 — TranzPay (Payment Gateway)

**EV References:** EV-0-0006 (03_Policy.md), EV-0-0227

**Trigger:** Policy issuance (first payment), automatic debit schedule, endorsement payment, cancellation refund.

**Confirmed action names (MEDIUM confidence):**
- `MakeTranzpayPayment`, `AutoDebitPaymentTranzpay`
- `AddCustomerACHDebit`, `AddCustomerCCCharge`
- `ACHRefund`, `ACHRefundCancellation`, `CreditCardRefund`, `CreditCardRefundCancellation`

**Outcome storage:** `PolicyPaymentTransaction.TransactionStatus = 'SUCCESS'` and `GatewayTransactionId` captured.

**Failure path:** `FailedNotificationLenderdock`, `FailedNotificationLenderdock2` exist, suggesting payment failures trigger downstream mortgage notifications.

**Assumption (ASM-1-INT-001):** TranzPay endpoint is a REST API. Specific URL, authentication method, and payload schema are entirely unknown.

**Questions (BLOCKING for IDEATE):**
- QST-1-INT-001: TranzPay endpoint URL(s), auth method, API version, sandbox vs production.

---

### INT-002 — LenderDock (Mortgage Notification Service)

**EV References:** EV-0-0006 (03_Policy.md), EV-0-0228

**Trigger:** Policy bound/issued, endorsement applied, cancelled, non-renewed, mortgage billing cycle.

**Confirmed action names (10 variants):**
- `Notify_Mortgage_LenderDock`, `Notify_MortgageBillLenderDock`
- `NotifyLenderDockForCancelledPolicy`, `NotifyLenderDockForEndorsement`, `NotifyLenderDockForRenewal`
- `NotifyLenderDockForCancelRewrite`, `FailedNotificationLenderdock`, `FailedNotificationLenderdock2`
- `NotifyMortgageeCoverage`, `NotifyMortagage`

**Operational note:** `ValidateMortgageName` and `ValidateMortgageservicecompany` in Policy module suggest LenderDock requires name/service-company validation prior to notification.

**Assumption (ASM-1-INT-002):** LenderDock endpoint is REST or SOAP webhook. Specific URL, protocol, and payload schema are unknown.

**Questions (BLOCKING for IDEATE):**
- QST-1-INT-002: LenderDock endpoint (URL, auth). REST, SOAP, or email notification? Payload shape?

---

### INT-003 — Google Geocoding API

**EV References:** EV-0-0012 (09_Common.md), EV-0-0229, EV-0-0009, EV-0-0218

**Confirmed:**
- `GetGeoCodeFromAddress` (Common CS) → `RssExtensionardoHTTP.MssHTTPGet`
- `SetLatLongViaGeoLocation`, `ValidateLatLong` (Policy BL)
- `GetHexcodeFromLatLng` converts resolved coordinates to HexCat zone code
- Google Maps Places autocomplete verified in Q&P PRD (EV-0-0218)
- API key stored in site property `GoogleMapAPIKey`

**Known contract (ASM):** `https://maps.googleapis.com/maps/api/geocode/json?address={addr}&key={key}` — standard Maps Platform endpoint.

---

### INT-004 — RssExtensionCryptoAPI (AES-256)

**EV References:** EV-0-0012, EV-0-0229, EV-0-0230

**Algorithm:** AES-256 CBC + HMAC-256 (Encrypt-then-MAC), PKCS7 padding.

**Entry points:** `MssAES_Encrypt`, `MssAES_Decrypt`, `MssAES_NewKey`, `MssAES_ReadKey`, `MssAES_SaveKey`, `MssGeneratePublicKey` (RSA).

**Key:** Stored in OutSystems site property `Base64Key`, provider `"Environment"`.

---

### INT-005 — InsureEdgeEmails OML

**EV References:** EV-0-0018, EV-0-0006

**Module exposes:** `SendEmail` (generic), `SendClaimLetterEmail`, `SendDisbursementEmail`.

**17+ email-triggering actions across Policy module:** renewal notifications, cancellation email, issuance email, endorsement email, producer notifications, non-renewal email, etc.

**Assumption (ASM-1-INT-007):** Delegates to OutSystems platform email infrastructure. SMTP relay identity unknown.

---

### INT-006 — IEDocumentGenerator

**EV References:** EV-0-0019, EV-0-0006

**Module exposes:** `HTTPGet`, `HTTPPost`, `HttpBinaryGet`.

**10+ document generation triggers in Policy BL:** `InitiateProcess_NewBusinessPolicyPackage`, `InitiateProcess_QuoteProposalPackage`, `InitiateProcess_RenewalPolicyPackage`, `GetJSON_DeclarationPage`, `GetJSON_NoticeOfCancellation`, `GetJSON_NoticeOfPolicyChange`, `GenerateNoticeOfNonRenewalDocument`, `GenerateUWSpecificDocument`, etc.

**Pattern:** Policy module builds JSON payload → calls `IEDocumentGenerator` → receives binary PDF → stored in Azure Blob (INT-008).

**Question (HIGH — QST-1-INT-003):** What service does IEDocumentGenerator call? Is it an internal service or third-party vendor?

---

### INT-007 — HexCat (Catastrophe / Risk Rating)

**EV References:** EV-0-0218 (PRD), EV-0-0006

**Verified in portal PRD:** `DataActionGetHexCatStatus` returns HexCat Status, StatusTimeStamp, Hex Zone ID Lower/Higher, Year Built, Construction Type, Foundation Type, Number of Stories, Square Footage, Residence Type, Roof Age/Covering/Shape, Basement presence.

**Flow:** Geocoding (INT-003) → `GetHexcodeFromLatLng` → `DataActionGetHexCatStatus` → populates read-only fields in Step 2.2 of quote wizard. HexCat Status gates risk acceptance ("Not Approved" blocks progression).

**Question (HIGH — QST-1-INT-004):** HexCat vendor name, API endpoint, auth method, rate limits, pricing.

---

### INT-008 — Azure Blob Storage

**EV References:** EV-0-0012, EV-0-0006, EV-0-0007

**Confirmed across all modules:**
- `GetAzureConnectionString` → `SitePropertyKeys.AzureConnectionString`
- `GetBlobContainerName` → `SitePropertyKeys.ContainerName`
- `UploadBlob`, `UploadBlobBinary`, `DownloadBlob`, `DownloadBlobBinary`
- `CheckAndCreateContainer`, `CreateContainer`, `ListBlobs`, `ListContainers`
- `GetURLForBlobWithSASToken` — time-limited SAS tokens used for downloads

**Used for:** Policy documents, claim documents, account bin files, producer/intermediary logos, note attachments.

**Risk:** Azure connection string stored as plaintext site property — should migrate to Azure Managed Identity.

---

### INT-009 — DisburseCloud

**EV References:** EV-0-0009, EV-0-0006

**Confirmed:** `DisburseCloudURL`, `SendDisbursementEmail`, `SendDisbursementEmail_New` in Distribution BL. `DisperseMonthlyCommission` in Policy BL.

**Assumption (ASM-1-INT-005):** DisburseCloud is a third-party commission disbursement platform. Contract unknown — whether URL-redirect or full REST API with callbacks is unclear.

---

## 2. Internal Service Boundaries

### Module Layer Architecture

```
InsureEdgePortal / DistributionManagement (UI screens)
    ↓
IE_{Domain}_BL (Business Logic — thin proxy, version-stamped)
    ↓
IE_{Domain}_CS (Core Services — SQL + business logic)
    ↓
IE_Common_CS (shared: crypto, blob, email, geocoding)
    + InsureEdgeEmails (email dispatch)
    + IEDocumentGenerator (document rendering)
    + RssExtensionCryptoAPI (AES-256)
    + RssExtensionardoHTTP (HTTP client)
    + Azure Blob SDK (storage)
```

### Database Boundary

| Database | Content | Access Pattern |
|---|---|---|
| `InsureEdge-LC` (DEV) | Policy, Claim, Account, Billing, Premium, Intermediary, Producer, Document | Primary operational DB |
| `InsureEdgeSYS-LC` (SYSTEM_DEV) | Client, User2, Tenant, Product, Company, Configuration | System/metadata DB |

Cross-database joins use runtime name resolution via `IESYSDBName()` → `SiteProperty[IEDBName]`. This creates tight deployment-time coupling that must be resolved in target architecture.

---

## 3. Integration Gaps

| Gap | Integration | What is Known | What is Missing | Priority |
|---|---|---|---|---|
| ASM-1-INT-001 | TranzPay | ACH, CC, refund action names | Endpoint, auth, payload, PCI scope | CRITICAL |
| ASM-1-INT-002 | LenderDock | 10 notification variants; failure path | Endpoint, protocol, auth, payload | CRITICAL |
| ASM-1-INT-004 | IEDocumentGenerator | Module wraps HTTP POST/GET; JSON payload confirmed | Target service name/URL, auth, template management | HIGH |
| ASM-1-INT-006 | HexCat | Portal UI verified; lat/lng → hex flow confirmed | Vendor, API contract, auth, rate limits | HIGH |
| ASM-1-INT-005 | DisburseCloud | URL generation function present | Full API contract, auth, callback pattern | MEDIUM |
| DBT-1-INT-006 | "HB APIs" (GETHBAPIS) | Portal DataAction confirmed | Backend target, purpose, payload | MEDIUM |
| ASM-1-INT-007 | Email SMTP relay | InsureEdgeEmails module confirmed | SMTP gateway identity, bounce handling | LOW |

---

## 4. Integration Risks

| Risk ID | Severity | Statement | Mitigation |
|---------|----------|-----------|------------|
| INSUREEDGE-2026-RSK-1-INT-001 | CRITICAL | TranzPay is a single payment gateway — outage halts all premium collection | Design multi-gateway fallback in target architecture |
| INSUREEDGE-2026-RSK-1-INT-002 | HIGH | No retry / circuit-breaker on TranzPay or LenderDock calls | Implement async event-driven pattern with dead-letter queue |
| INSUREEDGE-2026-RSK-1-INT-003 | HIGH | AES-256 key in OutSystems site property — no rotation mechanism | Migrate to Azure Key Vault with managed identity |
| INSUREEDGE-2026-RSK-1-INT-004 | HIGH | Azure Blob connection string as plaintext site property | Migrate to Azure Managed Identity + RBAC |
| INSUREEDGE-2026-RSK-1-INT-005 | HIGH | Cross-database SQL via runtime `IESYSDBName` string — fragile at deployment | Eliminate cross-DB joins; use service calls in target DB design |
| INSUREEDGE-2026-RSK-1-INT-006 | MEDIUM | LenderDock failure paths exist but no retry/queue mechanism | Implement outbox pattern for mortgage notifications |
| INSUREEDGE-2026-RSK-1-INT-007 | MEDIUM | Google API key in site property — quota exhaustion or key leak breaks geocoding | Per-environment key with quota alerts; restrict by IP/referrer |

---

## 5. SCAN-Phase Questions (for Clarification Round)

| ID | Priority | Question |
|----|----------|----------|
| INSUREEDGE-2026-QST-1-INT-001 | **CRITICAL — BLOCKING for IDEATE** | What are the TranzPay endpoint URL(s), authentication method, and API version? Are there sandbox vs production endpoints? |
| INSUREEDGE-2026-QST-1-INT-002 | **CRITICAL — BLOCKING for IDEATE** | What is the LenderDock notification endpoint (URL, auth)? Is this REST, SOAP, or email? What payload does InsureEdge send? |
| INSUREEDGE-2026-QST-1-INT-003 | HIGH | What service does IEDocumentGenerator call (HTTPPost/HTTPGet target)? Internal service or third-party vendor? |
| INSUREEDGE-2026-QST-1-INT-004 | HIGH | What is HexCat? Self-hosted service, vendor API, or database? Authentication method? |
| INSUREEDGE-2026-QST-1-INT-005 | HIGH | What is "GETHBAPIS" (DataActionGETHBAPIS in portal)? Internal InsureEdge rater or external Hudson Bailey system? |

---

---

## 6. Resolved Contracts (from Site Properties — EV-0-0231)

### INT-002 — LenderDock (RESOLVED)

| Attribute | Value |
|---|---|
| Auth header | `Basic [REDACTED — Key Vault: LenderDock--BasicAuthHeader]` (Base64-encoded Basic auth) |
| Provider ID | `2` (site property `LenderDock_Provider`) |
| Username | `[REDACTED — Key Vault: LenderDock--Username]` (decoded from Basic header) |
| Password | `[REDACTED — Key Vault: LenderDock--Password]` (decoded from Basic header) |
| Environment | DEV/test credentials — production credentials needed before IDEATE |

**Security risk (RSK-1-INT-LenderDock):** LenderDock credentials stored as plaintext site property. Must migrate to Azure Key Vault in target architecture.

---

### INT-003 — Google APIs (RESOLVED)

| Site Property | Value | Purpose |
|---|---|---|
| `GoogleMapsAPIKey` | `[REDACTED — Key Vault: Google--MapsApiKey]` | Google Maps display (autocomplete in UI) |
| `GeocodeAPIKey` | `[REDACTED — Key Vault: Google--GeocodeApiKey]` | Geocoding API (lat/lng resolution) |

Two separate API keys — one for Maps display, one for Geocoding calls. Both stored as plaintext site properties. **Restrict by domain/IP in Google Cloud Console before production.**

---

### INT-004 — AES Encryption Key (RESOLVED)

| Site Property | Value |
|---|---|
| `Base64Key` | `[REDACTED — Key Vault: InsureEdge--AesBase64Key]` |

Key is a 128-byte Base64 string (256-bit AES key). Single key for all environments — **no key rotation evidence**. Migrate to Azure Key Vault in target. **Do not commit this value to source control.**

---

### INT-005 — Email / SMTP (RESOLVED)

| Site Property | Value |
|---|---|
| `SMTPHost` / `SMTPServer` | `smtp.office365.com` |
| `SMTPPort` | `587` |
| `SMTPSSL` | `TRUE` (STARTTLS) |
| `SMTPUser` / `SMTPUsername` | `[REDACTED — Key Vault: Smtp--Username]` |
| `SMTPPassword` | `[REDACTED — Key Vault: Smtp--Password]` |
| `DefaultSenderEmail` | `[REDACTED — Key Vault: Smtp--DefaultSenderEmail]` |
| `ReminderEmailConfiguration` | `[REDACTED — Key Vault: Smtp--ReminderEmail]` |
| `SystemDeveloperEmail` | No Value set |

**Environment:** DEV credentials. Production O365 service account credentials needed before IDEATE. **SMTPPassword stored plaintext — migrate to Key Vault.**

---

### INT-006 — Plumsail Document Generation (RESOLVED)

| Site Property | Value |
|---|---|
| `PlumsailAPI` | `https://api.plumsail.com/api/v2/processes/jobs/` |

The `IEDocumentGenerator` module wraps the **Plumsail Documents API** (`/api/v2/processes/jobs/`). This is the cloud document generation service that receives JSON payloads and returns PDFs. Plumsail authentication key not visible in site properties — likely in OML configuration.

---

### INT-008 — Azure Blob Storage (RESOLVED)

| Site Property | Value |
|---|---|
| `AzureConnectionString` | `[REDACTED — Key Vault: AzureBlob--ConnectionString]` |
| `ContainerName` | `insuredgedev` |
| Account Name | `[REDACTED — Key Vault: AzureBlob--AccountName]` |

**Security risk (RSK-1-INT-Azure):** Full connection string with account key stored as plaintext site property. **Migrate to Azure Managed Identity + RBAC in target.** Account key grants full storage account access.

---

### INT-009 — DisburseCloud (RESOLVED)

| Site Property | Value |
|---|---|
| `DisbursementBaseURL` | `https://sandbox.disbursecloud.com/Vendors/RegisterVendor` |
| `DisbursementCompanySecrectKey` | `[REDACTED — Key Vault: DisburseCloud--CompanySecretKey]` |
| `DisbursementEncryptionKey` | `[REDACTED — Key Vault: DisburseCloud--EncryptionKey]` |

**Environment:** Sandbox URL — production DisburseCloud URL needed before IDEATE. Pattern: Vendor registration via POST to `RegisterVendor` with secret key + encryption key auth. **Both keys stored plaintext — migrate to Key Vault.**

---

## 7. Timer Thresholds (Resolved from Site Properties)

| Site Property | Value | Business Meaning |
|---|---|---|
| `RenewalQuoteDaysThreshold` | 90 | Renewal quote generated 90 days before policy expiry |
| `RenewalTimerEnable` | TRUE | Auto-renewal timer is active |
| `CancellationThresholdDays` | 30 | Grace period before auto-cancellation fires |
| `BulkUploadTimerEnable` | TRUE | Bulk upload background processing timer is active |
| `EndorsementQuotesExpiredAfterDays` | 90 | Endorsement quotes expire after 90 days |
| `QuoteExpiredAfterDays` | 90 | New business quotes expire after 90 days |
| `RenewalQuotesExpiredAfterDays` | 30 | Renewal quotes expire after 30 days |
| `PolicyExpiredAfterDays` | 1 | Policy expires 1 day after expiration date |
| `PolicyNonRenewedAfterDays` | 90 | Policy marked Non-Renewed after 90 days with no renewal |
| `SendNonRenewalEmailBeforeExpiryDays` | 60 | Non-renewal notice email sent 60 days before expiry |
| `NonRenewalNoticeDays` | No Value set | Not configured — uses SendNonRenewalEmailBeforeExpiryDays instead |
| `KillTimer` | FALSE | Emergency kill-switch for all timers — currently OFF |
| `ByPassLastMonthLogic` | FALSE | Month-end logic bypass — OFF |

**These directly answer QST-1-LOGIC-002 (cancellation threshold) and QST-1-LOGIC-004 (renewal notification timeline).**

---

## 8. Other Resolved Site Properties

| Site Property | Value | Notes |
|---|---|---|
| `PolicyFee` | 195 | Fixed policy fee applied to all policies |
| `IEDBName` / `EXT_DB_Name` | `InsureEdge_System_DEV` / `[InsureEdge_System_DEV]` | Cross-database runtime name — confirms two-DB coupling |
| `ProductVersion` | v2.0 | Application version |
| `IsProduction` | FALSE | Confirms this is DEV environment |
| `IsMultitenant` | (not set as a flag per row) | Multi-tenancy is confirmed active |
| `IsEnableClaimsPayment` | TRUE | Claims payment module is enabled |
| `ClaimsDefaultScreen` | CLAIMDASHBOARD | Claims module default landing screen |
| `PolicyDefaultScreen` | POLICIESINDIVIDUAL | Policy module default landing screen — Individual tab first |
| `WritingCompany` | Sierra Specialty Insurance Company | Default writing company |
| `HBProgramAdministrator` | HB Program Administrator | Hudson Bailey program admin label |
| `JuniperRELLC` | Juniper RE LLC | Reinsurer reference |
| `ProgramPartners` | Program Partners | Program partner label |
| `USERNAME` / `PRODUCERID` / `PASSWORD` | hudsonbaileydemo / 1000487 / (bcrypt hash) | LenderDock producer credentials — password is bcrypt `$2y$10$...` (confirms LenderDock uses bcrypt auth) |
| `BypassRefundResponse_ToBeFalseInPROD` | TRUE | Refund response bypass active in DEV — **must be FALSE in production** |
| `ConfigurationValueTimerClientId` | (empty) | Timer client ID not configured |
| `MonthCount` | (empty) | Month count not configured |

**Critical flag:** `BypassRefundResponse_ToBeFalseInPROD = TRUE` in the current environment. This must be explicitly set to FALSE before any production deployment or financial testing.

---

*End of ART-1-004 — Integration Catalogue | INSUREEDGE-2026 | SCAN Phase | Updated 2026-06-16 with site properties (EV-0-0231)*
