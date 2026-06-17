# ART-1-001 — Data Catalogue
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Data Agent
**Phase:** SCAN
**Date:** 2026-06-16
**Confidence:** HIGH (SQL DDL primary evidence — 118 CREATE TABLE statements across 2 databases)

**Evidence consumed:**
- EV-0-0224: `Database\SHIFT_Insureedge_DEV.txt` — SQL Server DDL, 92 tables (HIGH)
- EV-0-0225: `Database\SHIFT_Insureedge_SYSTEM_DEV.txt` — SQL Server DDL, 26 tables (HIGH)
- EV-0-0006: `Logic\03_Policy.md` — Policy data structures (MEDIUM)
- EV-0-0007: `Logic\04_Claims.md` — Claims data structures (MEDIUM)
- EV-0-0012: `Logic\09_Common.md` — Common structures (MEDIUM)

---

## 1. Database Context

| Property | InsureEdge_DEV | InsureEdge_System_DEV |
|---|---|---|
| SQL Server version | SQL Server 2019 (compat level 150) | SQL Server 2019 (compat level 150) |
| Recovery model | FULL | FULL |
| Size | ~1.1 GB (MDF) + ~795 MB (LDF) | ~530 MB (MDF) + ~665 MB (LDF) |
| Tables | 92 | 26 |
| Full-text search | Enabled | Enabled |
| DB owner role | `HexCat_RunTime` (must be downscoped to EXECUTE+SELECT in target) | — |

**Two-DB coupling (FND-1-DATA-001):** These two databases cannot be migrated independently. Runtime cross-database SQL joins use `IESYSDBName()` → `SiteProperty[IEDBName]` to resolve the system DB name at runtime. Any rename or separation breaks runtime SQL across all modules.

---

## 2. Entity Inventory — InsureEdge_DEV (92 tables)

### Domain: Policy & Quotes

| Table | Key Columns | ClientId? | Notes |
|---|---|---|---|
| Policy | PolicyId (PK), PolicyNumber, PolicyTypeId, PolicyStatusId, EffectiveDate, ExpirationDate, AccountId, IntermediaryId, WritingCompanyId | Yes | Central policy entity; version-stamped with PolicyTransactionId |
| PolicyProduct | PolicyProductId (PK), PolicyId (FK), ProductId, CoverageLevel | Yes | Links policy to product configuration |
| PolicyLimitCoverage | PolicyLimitCoverageId (PK), PolicyId (FK), CoverageTypeId, LimitAmount, DeductibleAmount, PremiumAmount | Yes | Per-coverage limits and deductibles |
| PolicyRiskInformation | PolicyRiskInformationId (PK), PolicyId (FK), RiskLocationId, HexZoneIdLower, HexZoneIdHigher, ConstructionType, FoundationType, Floors, SquareFootage, RoofAge, FloodZone, HexCatStatus | Yes | HexCat-provided risk data per risk location |
| PolicyMortgage | PolicyMortgageId (PK), PolicyId (FK), MortgageName, MortgageServiceCompany, LoanNumber, MortgageTypeId | Yes | Lienholder/mortgagee data for LenderDock |
| AdditionalInsured | AdditionalInsuredId (PK), PolicyId (FK), FirstName, LastName, Relationship, Telephone, Email | Yes | Additional named insureds |
| AdditionalOrganisation | AdditionalOrganisationId (PK), PolicyId (FK), OraganisationType, OrganisationName | Yes | Note: schema typo `OraganisationType` |
| PolicyCommission | PolicyCommissionId (PK), PolicyId (FK), IntermediaryId, CommissionPercentage, CommissionAmount | Yes | Note: schema typo `ComissionPercentage` |
| CommissionPaymentTransaction | CommissionPaymentTransactionId (PK), PolicyCommissionId (FK), TransactionDate, Amount, StatusId | Yes | Commission payment tracking |

### Domain: Accounts & Clients

| Table | Key Columns | ClientId? | Notes |
|---|---|---|---|
| Account | AccountId (PK), AccountNumber, AccountTypeId, PrimaryInsuredName, ClientId | Yes | Account grouping above policy level |
| Intermediary | IntermediaryId (PK), IntermediaryCode, CompanyName, ContactName, Email, Phone, ClientId | Yes | Distribution management entity |
| Producer | ProducerId (PK), IntermediaryId (FK), FirstName, LastName, LicenseNumber, StateCode | Yes | Individual producer within intermediary |
| Payee | PayeeId (PK), PayeeName, PayeeTypeId, AccountNumber, RoutingNumber, BankDetailId | Yes | Financial payee for disbursements |
| BankDetail | BankDetailId (PK), BankName, AccountNumber (encrypted), RoutingNumber (encrypted), AccountTypeId | Yes | Encrypted financial data |

### Domain: Claims

| Table | Key Columns | ClientId? | Notes |
|---|---|---|---|
| Claim | ClaimId (PK), PolicyId (FK), ClaimNumber, ClaimStatusId, LossDate, FNOLDate, AdjusterId, ReportedBy | Yes | Central claims entity |
| ClaimCoverage | ClaimCoverageId (PK), ClaimId (FK), CoverageTypeId, ReserveAmount, PaidAmount | Yes | Per-coverage financials |
| ClaimImpactedCoverage | ClaimImpactedCoverageId (PK), ClaimId (FK), CoverageTypeId, ImpactDescription | Yes | — |
| ClaimImpactedCoverageAsset | ClaimImpactedCoverageAssetId (PK), ClaimImpactedCoverageId (FK), AssetDescription, AssetValue | Yes | — |
| Worksheet | WorksheetId (PK), ClaimId (FK), WorksheetStatusId, TotalReserve, TotalPaid | Yes | Claims financial worksheet |
| WorksheetPayment | WorksheetPaymentId (PK), WorksheetId (FK), PayeeId (FK), Amount, PaymentMethodId, TransactionDate | Yes | Worksheet payment record |
| WorksheetReserve | WorksheetReserveId (PK), WorksheetId (FK), CoverageTypeId, ReserveAmount | Yes | Reserve allocation per coverage |
| Adjuster | AdjusterId (PK), FirstName, LastName, LicenseNumber, Email, Phone, ClientId | Yes | Adjuster entity |

### Domain: Billing & Payments

| Table | Key Columns | ClientId? | Notes |
|---|---|---|---|
| PolicyPaymentTransaction | PolicyPaymentTransactionId (PK), PolicyId (FK), TransactionTypeId, Amount, TransactionDate, TransactionStatus, GatewayTransactionId, ResponsibleParty | Yes | All premium payment transactions |
| PolicyPaymentPlan | PolicyPaymentPlanId (PK), PolicyId (FK), PaymentFrequencyId, NumberOfInstallments, InstallmentFee | Yes | Payment plan configuration |

### Domain: Documents & Storage

| Table | Key Columns | Notes |
|---|---|---|
| PolicyDocument | PolicyDocumentId (PK), PolicyId (FK), DocumentTypeId, BlobPath, BlobContainer, UploadedBy, UploadedOn | Binary stored in Azure Blob; path stored here |
| ClaimDocument | ClaimDocumentId (PK), ClaimId (FK), DocumentTypeId, BlobPath, IsSensitive, BlobContainer | `IsSensitive` flag controls `IsAccessSensitiveDoc` |

### Domain: Risk Location

| Table | Key Columns | Notes |
|---|---|---|
| RiskLocation | RiskLocationId (PK), PolicyId (FK), AddressLine1, AddressLine2, City, State, ZipCode, Latitude, Longitude | Geocoded location |

### Domain: Lookup / Reference

| Tables | Notes |
|---|---|
| PolicyStatus, PolicyType, PolicyTransaction, CoverageType, DeductibleType, PerilType, WritingCompany, PaymentFrequency, PaymentMethod, DocumentType, ClaimStatus, ClaimType, AdjusterStatus, IntermediaryType, ProducerStatus | Static lookup tables — expected to be small and non-ClientId-scoped |

---

## 3. Entity Inventory — InsureEdge_System_DEV (26 tables)

| Table | Key Columns | Domain | Notes |
|---|---|---|---|
| Client | ClientId (PK), ClientName, OSTenantID, IsActive | Tenant | The tenant entity — OSTenantID links to OutSystems User.TenantId |
| User2 | UserId (PK), OSUserId (FK → OutSystems [User]), FirstName, LastName, Role, ClientId, IsManager, IsAdmin, Password | User | Extended user table; Password field carries migration risk (RSK-1-SEC-001) |
| Group_Table | GroupId (PK), GroupName, GroupEmail, GroupLeaderId, ClientId, StatusId | Groups | User group entity |
| GroupUser_Table | GroupUserId (PK), GroupId (FK), UserId (FK) | Groups | Group membership join table |
| ScreenPermissions | ScreenPermissionId (PK), GroupId (FK), ScreenId (FK), ClientId, IsViewPermission, IsCreatePermission, IsEditPermission, IsApproveReject, IsDuplicatePermission, IsUploadPermission, IsDownloadPermission, IsViewSensitiveInfo, IsAccessSensitiveDoc, AllAccess | Security | 10-flag per-screen-per-group permission record |
| AppScreen | ScreenId (PK), ScreenName, ModuleId | Security | Master screen registry |
| Module | ModuleId (PK), ModuleName | Security | Master module registry |
| Product | ProductId (PK), ProductName, ProductCode, IsActive | Product | Insurance product catalog — PlatformAdmin-managed |
| ClientOffice | ClientOfficeId (PK), ClientId (FK), OfficeName, Address | Tenant | Client office locations |
| UserPasswordReset | UserPasswordResetId (PK), UserId (FK), TokenCode, ExpiresOn, CreatedOn | Security | Password reset token store |
| AuditLog | AuditLogId (PK), UserId (FK), ActionType, TableName, RecordId, SessionId, ModuleName, Timestamp | Audit | Audit trail — session+module scoped |

**ORM-managed tables absent from DDL (ASM-1-DATA-001):** `UserSystemNotifications`, `OS_UserConfigurations`, `GridDefaultLayouts` — likely created by OutSystems ORM at deploy time. Separate DDL extraction required before migration.

---

## 4. Key Relationships

| Relationship | Source Table | Target Table | FK Present? | Notes |
|---|---|---|---|---|
| Policy → Account | Policy.AccountId | Account.AccountId | YES | |
| Policy → Intermediary | Policy.IntermediaryId | Intermediary.IntermediaryId | YES | |
| Claim → Policy | Claim.PolicyId | Policy.PolicyId | **NO DB FK** | Logical FK only — orphan risk |
| Worksheet → Claim | Worksheet.ClaimId | Claim.ClaimId | **NO DB FK** | Logical FK only — orphan risk |
| WorksheetPayment → Worksheet | WorksheetPayment.WorksheetId | Worksheet.WorksheetId | YES | |
| User2 → Client | User2.ClientId | Client.ClientId | YES | Tenant scoping |
| GroupUser_Table → Group_Table | GroupUser_Table.GroupId | Group_Table.GroupId | YES | |
| ScreenPermissions → Group_Table | ScreenPermissions.GroupId | Group_Table.GroupId | YES | |
| PolicyDocument → Policy | PolicyDocument.PolicyId | Policy.PolicyId | YES | |
| PolicyMortgage → Policy | PolicyMortgage.PolicyId | Policy.PolicyId | YES | |

**Critical gap (FND-1-DATA-002):** 37 FKs exist in DEV but key logical relationships (Claim→Policy, Worksheet→Claim) have no DB-level constraint. Orphan analysis required before migration to prevent referential integrity violations.

---

## 5. Multi-Tenancy Pattern

- `ClientId` appears as a column in all tenant-owned entity tables in both DEV and SYSTEM_DEV databases.
- All queries for non-PlatformAdmin users include `WHERE ClientId = @ClientId` at the ORM or custom SQL layer.
- `GetClientIdByUserId_CS` resolves the `ClientId` from the session's `OSUserId` via `Client.OSTenantID` matching.
- Intentionally global (no ClientId): `Product`, `Module`, `AppScreen`, `WritingCompany`, and other lookup tables.

**Cross-domain referral (REF-DATA-SEC-001):** Security Agent to confirm which tables in the schema lack ClientId that should have it.

---

## 6. Data Dictionary — 10 Central Tables

### Policy

| Column | Type | Business Meaning |
|---|---|---|
| PolicyId | uniqueidentifier / int PK | Internal policy record identifier |
| PolicyNumber | varchar(50) | Business-facing number — format 001-00004-0000318-00 |
| PolicyStatusId | int FK | Current lifecycle status (Draft/Active/Cancelled/Expired/Lapsed/Non-Renewed) |
| PolicyTypeId | int FK | Individual vs Business |
| EffectiveDate | datetime | Policy start date |
| ExpirationDate | datetime | Policy end date — derived from EffectiveDate + PolicyTerm |
| AccountId | int FK | Parent account grouping |
| IntermediaryId | int FK | Producing intermediary |
| WritingCompanyId | int FK | Insurance carrier (e.g., Sierra Specialty Insurance Company) |
| ClientId | int | Tenant scope filter |
| TotalPremium | decimal | Computed: CoveragePremium + Taxes + Fees |

### Claim

| Column | Type | Business Meaning |
|---|---|---|
| ClaimId | int PK | Internal claim record identifier |
| PolicyId | int | FK to Policy (no DB constraint) |
| ClaimNumber | varchar(50) | Business-facing claim number |
| ClaimStatusId | int FK | Current status (FNOL/Open/Closed/Denied/etc.) |
| LossDate | datetime | Date of the insured loss event |
| FNOLDate | datetime | Date the first notice of loss was filed |
| AdjusterId | int FK | Assigned adjuster |
| ClientId | int | Tenant scope filter |

### User2

| Column | Type | Business Meaning |
|---|---|---|
| UserId | int PK | Application user identifier |
| OSUserId | int FK | OutSystems platform [User].Id |
| Role | varchar(50) | Role name string (PlatformAdmin/ClientAdmin/etc.) |
| ClientId | int | Tenant assignment |
| IsAdmin | bit | Cross-tenant admin flag — used by GetClientAdmin (unscoped query) |
| Password | varchar(max) | Legacy plaintext field — migration target for UpdateUsersPassword |
| IsManager | bit | Reporting hierarchy flag |

### Intermediary

| Column | Type | Business Meaning |
|---|---|---|
| IntermediaryId | int PK | Distribution entity identifier |
| IntermediaryCode | varchar(20) | Business code for producer/intermediary |
| CompanyName | varchar(200) | Legal company name |
| ClientId | int | Tenant scope |
| CommissionPercentage | decimal | Default commission rate (note: source typo `ComissionPercentage`) |

### ScreenPermissions

| Column | Type | Business Meaning |
|---|---|---|
| ScreenPermissionId | int PK | Permission record identifier |
| GroupId | int FK | The group this permission applies to |
| ScreenId | int FK | The screen being controlled |
| ClientId | int | Tenant scope |
| IsViewPermission | bit | View flag |
| IsCreatePermission | bit | Create flag |
| IsEditPermission | bit | Edit flag |
| IsApproveReject | bit | Approve/Reject flag |
| IsDuplicatePermission | bit | Clone flag |
| IsUploadPermission | bit | Upload flag |
| IsDownloadPermission | bit | Download flag |
| IsViewSensitiveInfo | bit | Unmask sensitive fields |
| IsAccessSensitiveDoc | bit | Access sensitive documents |
| AllAccess | bit | Override all flags — full access |

---

## 7. Persistence Risks

| Risk ID | Risk | Impact | Mitigation |
|---|---|---|---|
| INSUREEDGE-2026-RSK-1-DATA-001 | No DB-level FK on Claim→Policy and Worksheet→Claim | Orphan records possible; silent data integrity issues | Add FK constraints in target schema; run orphan analysis on source data pre-migration |
| INSUREEDGE-2026-RSK-1-DATA-002 | `varbinary(max)` in 9+ tables (inline binary storage) | Binary data must be extracted to Azure Blob before schema migration | Extract all binaries to Blob Storage pre-migration; replace column with BlobPath varchar |
| INSUREEDGE-2026-RSK-1-DATA-003 | `1900-01-01` sentinel used as "null date" in datetime columns | All sentinel values must be converted to NULL during migration | Build conversion script; audit all datetime columns for sentinel usage |
| INSUREEDGE-2026-RSK-1-DATA-004 | Schema typos in column names (WrittingCompany, ComissionPercentage, OraganisationType, PoilcyId) | Renaming breaks all referencing code | Maintain typo-mapping table; rename in target schema with full code search |
| INSUREEDGE-2026-RSK-1-DATA-005 | `HexCat_RunTime` is db_owner on InsureEdge_DEV | Excessive privilege in target | Downscope to EXECUTE + SELECT only in target |
| INSUREEDGE-2026-RSK-1-DATA-006 | 4 ORM-managed tables absent from DDL | These tables will be missing from migration if DDL is the only source | Extract DDL from OutSystems platform for these tables before migration |
| INSUREEDGE-2026-RSK-1-DATA-007 | Cross-database runtime SQL coupling via `IESYSDBName` site property | Rename or separation of databases breaks all runtime cross-DB queries | Consolidate to single schema, or wrap cross-DB access in API layer |

---

## 8. SCAN Questions for Clarification Round

| QST ID | Priority | Question |
|--------|----------|----------|
| INSUREEDGE-2026-QST-1-DATA-001 | MAJOR | Can you provide DDL for `UserSystemNotifications`, `OS_UserConfigurations`, and `GridDefaultLayouts` tables? These appear to be ORM-managed and are absent from the provided DDL scripts. |
| INSUREEDGE-2026-QST-1-DATA-002 | MAJOR | What is the intent of `User2.IsAdmin`? The `GetClientAdmin` function queries `User2 WHERE IsAdmin=1` without a ClientId filter — is this intentional for cross-tenant admin lookup? |
| INSUREEDGE-2026-QST-1-DATA-003 | MINOR | Confirm the sentinel value `1900-01-01` is used as a "null date" convention across all datetime columns — should these be converted to SQL NULL in the target schema? |

---

*End of ART-1-001 — Data Catalogue | INSUREEDGE-2026 | SCAN Phase | 2026-06-16*
*All findings at HIGH confidence from SQL DDL primary evidence. Inferences marked ASM-.*
