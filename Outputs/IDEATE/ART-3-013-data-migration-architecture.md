# ART-3-013 — Data Migration Architecture
## InsureEdge Application Modernization (INSUREEDGE-2026)

**Produced by:** Migration Agent
**Phase:** IDEATE
**Date:** 2026-06-17
**PRD Gate:** PASSED (DEC-2-0005, 2026-06-17)
**Confidence:** HIGH where derived from ART-1-001 DDL and ART-2-012 ERD delta; MEDIUM where inferred from ERD diagram annotations.

**Evidence consumed:**
- ART-1-001: Data Catalogue (DDL-derived, 118 tables)
- ART-2-012: Integration & Architecture Supplement (ERD delta, ~35 additional tables)
- ART-2-005: Business Rules Catalog
- ART-2-009: NFR Catalog

**Governance compliance:**
- No field silently dropped — every unmapped field has a QST- or DBT-
- Pattern recommendations marked ASM-3-MIG-{seq}
- No migration scripts produced — Forge Agent deliverable
- No cutover date committed — requires human DEC-

---

## Section 1: Entity Migration Inventory

### Classification Key

| Code | Meaning |
|---|---|
| MIGRATE-DIRECT | Name/type compatible, minor rename only |
| MIGRATE-TRANSFORM | Requires type conversion, NULL handling, sentinel date conversion, or schema typo fix |
| MIGRATE-SPLIT | One source table → multiple target tables |
| MIGRATE-MERGE | Multiple source tables → one target |
| MIGRATE-DERIVE | Computed/derived in target from source data |
| ARCHIVE | Data kept but not in live schema (historical, legacy mapping tables) |
| DROP | Data confirmed droppable (none confirmed — all DROP candidates raised as QST-) |

### Standard SQL Server → PostgreSQL Type Mapping (applies to all tables)

| Source Type | Target Type | Notes |
|---|---|---|
| `uniqueidentifier` | `uuid` | Direct mapping; PostgreSQL uuid type is standard |
| `bit` | `boolean` | SQL Server 0/1 → PostgreSQL false/true |
| `datetime` | `timestamp without time zone` | Sentinel `1900-01-01` → `NULL` (NFR-011) |
| `datetime2` | `timestamp without time zone` | Same sentinel rule applies |
| `nvarchar(max)` / `varchar(max)` | `text` | PostgreSQL text is unbounded |
| `nvarchar(n)` / `varchar(n)` | `varchar(n)` | Length preserved |
| `int` | `integer` | Direct mapping |
| `bigint` | `bigint` | Direct mapping |
| `decimal(p,s)` / `numeric(p,s)` | `numeric(p,s)` | Precision and scale preserved |
| `varbinary(max)` | Path extracted to Azure Blob; column becomes `text` (BlobPath) | RSK-1-DATA-002 |
| `varbinary(n)` | `bytea` if small inline binary; assess per table | Decision point per table |

### 1.1 InsureEdge_DEV — Domain: Policy & Quotes

| Source Table | Target Table | Classification | Key Transformations |
|---|---|---|---|
| Policy | policy.policy | MIGRATE-TRANSFORM | `datetime` → `timestamp`; sentinel dates → NULL; `PolicyId` type clarification (int vs uniqueidentifier — ART-1-001 shows both); `IntermediaryId` FK added; `WritingCompanyId` FK added; target schema: `policy` domain |
| PolicyProduct | policy.policy_product | MIGRATE-TRANSFORM | `datetime` → `timestamp`; FK constraints added for `PolicyId`, `ProductId` |
| PolicyLimitCoverage | policy.policy_limit_coverage | MIGRATE-TRANSFORM | `decimal` types preserved; FK added for `PolicyId`, `CoverageTypeId` |
| PolicyRiskInformation | policy.policy_risk_information | MIGRATE-TRANSFORM | `datetime` → `timestamp`; add `rps_value` column per ASM-2-ARCH-005 (QST-2-INT-011-003); FK added |
| PolicyMortgage | policy.policy_mortgage | MIGRATE-TRANSFORM | `datetime` → `timestamp`; FK added; `MortgageTypeId` FK added |
| AdditionalInsured | policy.additional_insured | MIGRATE-TRANSFORM | `datetime` → `timestamp`; `bit` → `boolean`; FK for `PolicyId` added |
| AdditionalOrganisation | policy.additional_organisation | MIGRATE-TRANSFORM | Schema typo: `OraganisationType` → `organisation_type` (NFR-012); FK added |
| PolicyCommission | policy.policy_commission | MIGRATE-TRANSFORM | Schema typo: `ComissionPercentage` → `commission_percentage` (NFR-012); FK added |
| CommissionPaymentTransaction | billing.commission_payment_transaction | MIGRATE-TRANSFORM | `datetime` → `timestamp`; FK added |
| Policy_Extended | policy.policy_extended | MIGRATE-TRANSFORM | `datetime` → `timestamp`; sentinel dates → NULL; FK for `PolicyId` added |
| Policy_Extended_Binary | (see note) | MIGRATE-TRANSFORM | `EndorsementSummary` varbinary → Azure Blob; `UWSpecificChange` varbinary → Azure Blob; resulting table stores BlobPaths as `text` |
| PolicyAccount | policy.policy_account | MIGRATE-TRANSFORM | Junction table; M:N corrects ART-1-001 1:N assumption (RSK-2-DATA-001); `Policy.AccountId` FK on Policy table retained as legacy reference pending confirmation — see DBT-3-MIG-001 |
| PolicyPremium | billing.policy_premium | MIGRATE-TRANSFORM | Intermediate entity between Policy and PolicyPaymentTransaction (RSK-2-DATA-002); `datetime` → `timestamp`; `bit` → `boolean`; FK for `PolicyId` added |

**DBT-3-MIG-001:** After confirming the M:N `PolicyAccount` junction table, the redundant `Policy.AccountId` column in the source DDL must be evaluated. If the junction table fully replaces this FK, `Policy.AccountId` should be dropped in the target. If it serves a "primary account" semantic, it should be retained with a comment. Forge Agent to resolve; no silent drop.

### 1.2 InsureEdge_DEV — Domain: Accounts & Clients

| Source Table | Target Table | Classification | Key Transformations |
|---|---|---|---|
| Account | policy.account | MIGRATE-TRANSFORM | `datetime` → `timestamp`; FK for `ClientId` to `identity.client` added |
| Account_Extended | policy.account_extended | MIGRATE-TRANSFORM | `bit` → `boolean`; FK for `AccountId` added |
| AccountBinary | (see RSK-2-DATA-005) | MIGRATE-SPLIT | Polymorphic pattern: 8 nullable entity FKs. Each FK becomes a separate entity-specific document reference table or Blob path column on the entity. See Section 3.3. |
| Intermediary | distribution.intermediary | MIGRATE-TRANSFORM | Schema typo: `ComissionPercentage` → `commission_percentage`; FK for `ClientId` added |
| Producer | distribution.producer | MIGRATE-TRANSFORM | `datetime` → `timestamp`; FK for `IntermediaryId` added |
| Payee | billing.payee | MIGRATE-TRANSFORM | FK for `BankDetailId` added |
| BankDetail | billing.bank_detail | MIGRATE-TRANSFORM | `AccountNumber` (encrypted), `RoutingNumber` (encrypted) — verify AES-256 re-encryption in target (NFR-007); encryption key must move to Azure Key Vault (NFR-014) |
| StateSpecificDataTable | policy.state_specific_data | MIGRATE-DIRECT | Reference content, minimal transformation |

### 1.3 InsureEdge_DEV — Domain: Claims

| Source Table | Target Table | Classification | Key Transformations |
|---|---|---|---|
| Claim | claims.claim | MIGRATE-TRANSFORM | `datetime` → `timestamp`; sentinel dates → NULL; FK Claim→Policy **must be added** (NFR-010, RSK-1-DATA-001); orphan analysis required before migration |
| ClaimCoverage | claims.claim_coverage | MIGRATE-TRANSFORM | FK added; `decimal` preserved |
| ClaimImpactedCoverage | claims.claim_impacted_coverage | MIGRATE-TRANSFORM | FK added |
| ClaimImpactedCoverageAsset | claims.claim_impacted_coverage_asset | MIGRATE-TRANSFORM | FK added; `decimal` preserved |
| Worksheet | claims.worksheet | MIGRATE-TRANSFORM | FK Worksheet→Claim **must be added** (NFR-010); `datetime` → `timestamp` |
| WorksheetPayment | claims.worksheet_payment | MIGRATE-TRANSFORM | FK added; `datetime` → `timestamp` |
| WorksheetReserve | claims.worksheet_reserve | MIGRATE-TRANSFORM | FK added |
| Adjuster | claims.adjuster | MIGRATE-TRANSFORM | `datetime` → `timestamp`; FK for `ClientId` added |
| LossExposure | claims.loss_exposure | MIGRATE-TRANSFORM | ERD delta table; `datetime` → `timestamp` |
| LossExposureServiceDetail | claims.loss_exposure_service_detail | MIGRATE-TRANSFORM | ERD delta table |
| LossExposureDamage | claims.loss_exposure_damage | MIGRATE-TRANSFORM | ERD delta table |
| ClaimEscalation | claims.claim_escalation | MIGRATE-TRANSFORM | ERD delta table; `datetime` → `timestamp` |
| ClaimAuthority | claims.claim_authority | MIGRATE-TRANSFORM | ERD delta table; `decimal` preserved; `bit` → `boolean` |
| ClaimMortgage | claims.claim_mortgage | MIGRATE-TRANSFORM | ERD delta table; FK for `ClaimId` added |
| ClaimCoverageLimit | claims.claim_coverage_limit | MIGRATE-TRANSFORM | ERD delta table |
| CauseOfLossDescription | claims.cause_of_loss_description | MIGRATE-TRANSFORM | ERD delta table |
| CauseOfLossGroup | claims.cause_of_loss_group | MIGRATE-TRANSFORM | ERD delta table |
| CauseOfLossGroupDescription | claims.cause_of_loss_group_description | MIGRATE-TRANSFORM | ERD delta table |
| ClaimLetter | claims.claim_letter | MIGRATE-TRANSFORM | `EmailBody` is `nvarbinary` — extract to Azure Blob, store path; `datetime` → `timestamp` |
| ClaimReport | claims.claim_report | MIGRATE-TRANSFORM | ERD delta table; `datetime` → `timestamp` |
| Claimant | claims.claimant | MIGRATE-TRANSFORM | ERD delta table — full claimant entity; FK for `ClaimId` |
| Witness | claims.witness | MIGRATE-TRANSFORM | ERD delta table |
| AdjusterLicense | claims.adjuster_license | MIGRATE-TRANSFORM | ERD delta table; `datetime` → `timestamp` |
| PaymentSuperseding | claims.payment_superseding | MIGRATE-TRANSFORM | ERD delta table; FK to `WorksheetPayment` |

### 1.4 InsureEdge_DEV — Domain: Billing & Payments

| Source Table | Target Table | Classification | Key Transformations |
|---|---|---|---|
| PolicyPaymentTransaction | billing.policy_payment_transaction | MIGRATE-TRANSFORM | `datetime` → `timestamp`; sentinel dates → NULL; FK for `PolicyPremiumId` (via PolicyPremium intermediary — RSK-2-DATA-002) |
| PolicyPaymentTransaction_Extended | billing.policy_payment_transaction_extended | MIGRATE-TRANSFORM | ERD delta; 1:1 extension FK; `decimal` preserved |
| PolicyPaymentPlan | billing.policy_payment_plan | MIGRATE-TRANSFORM | FK added; `bit` → `boolean` |
| CancellationPaymentTransaction | billing.cancellation_payment_transaction | MIGRATE-TRANSFORM | ERD delta; `datetime` → `timestamp`; audit-class table; `bit` → `boolean` |
| CommissionDisbursement_Audit | billing.commission_disbursement_audit | MIGRATE-TRANSFORM | ERD delta; `nvarchar(2000)` → `text`; `datetime` → `timestamp`; FK for `DisbursementId` |
| PaymentCallbackResponses | billing.payment_callback_responses | MIGRATE-TRANSFORM | **QST-3-MIG-001:** Table marked "to be added" in ERD (RSK-2-DATA-003). Verify existence in InsureEdge_DEV before migration. If absent, create target table per ERD schema; no data migration. |

**QST-3-MIG-001 (derives from RSK-2-DATA-003 / QST-2-INT-007):** Does `PaymentCallbackResponses` exist in the current InsureEdge_DEV database? If absent, the table is a new schema addition in the target only — no source data to migrate. If present, confirm column set matches ERD annotation before ETL scripting begins.

### 1.5 InsureEdge_DEV — Domain: Documents & Storage

| Source Table | Target Table | Classification | Key Transformations |
|---|---|---|---|
| PolicyDocument | policy.policy_document | MIGRATE-TRANSFORM | `BlobPath`, `BlobContainer` already externalized — migrate metadata only; FK for `PolicyId`, `DocumentTypeId` added; `datetime` → `timestamp` |
| ClaimDocument | claims.claim_document | MIGRATE-TRANSFORM | `BlobPath` already externalized — migrate metadata only; `bit` → `boolean` for `IsSensitive`; FK for `ClaimId`, `DocumentTypeId` added |
| ProductDocument | policy.product_document | MIGRATE-TRANSFORM | ERD delta; `BlobPath` externalized; FK added; `datetime` → `timestamp` |
| Template | policy.template | MIGRATE-TRANSFORM | ERD delta; `datetime` → `timestamp` |
| TemplateDocument | policy.template_document | MIGRATE-TRANSFORM | ERD delta |
| TemplateState | policy.template_state | MIGRATE-TRANSFORM | ERD delta |
| NoteFile | policy.note_file | MIGRATE-TRANSFORM | ERD delta; binary content extracted to Azure Blob; `datetime` → `timestamp` |
| Note | policy.note | MIGRATE-TRANSFORM | ERD delta; FK to `Account`, `Policy`; `datetime` → `timestamp` |
| Report | system.report | MIGRATE-TRANSFORM | ERD delta; `BlobPath` externalized; `datetime` → `timestamp` |
| SystemDefaultContent | system.system_default_content | MIGRATE-TRANSFORM | ERD delta; `BlobPath` externalized |

### 1.6 InsureEdge_DEV — Domain: Risk Location

| Source Table | Target Table | Classification | Key Transformations |
|---|---|---|---|
| RiskLocation | policy.risk_location | MIGRATE-TRANSFORM | Geocoded `Latitude`, `Longitude` — migrate as `numeric(9,6)`; FK for `PolicyId` added; `datetime` → `timestamp` |

### 1.7 InsureEdge_DEV — Domain: Rating Engine

| Source Table | Target Table | Classification | Key Transformations |
|---|---|---|---|
| HBRater_LRHexzones | rating.hbrater_lr_hexzones | MIGRATE-DIRECT | Lookup/reference data; 103,739 H3 hexzone rows (per ART-2-012 §4.3); migrate as-is to PostgreSQL; column names lowercased per PostgreSQL convention |
| HBRater_HRHexzone | rating.hbrater_hr_hexzone | MIGRATE-DIRECT | High-risk zone rate table; migrate as-is |
| HBRater_StateTaxSheet | rating.hbrater_state_tax_sheet | MIGRATE-TRANSFORM | `Abbriviation` column — schema typo, rename to `abbreviation` in target (QST-3-MIG-002); `decimal` types preserved |
| HBRater_ExcessFloodCoverage | rating.hbrater_excess_flood_coverage | MIGRATE-DIRECT | Excess flood rate schedule; migrate as-is |
| Rating_Wildfire | rating.rating_wildfire | MIGRATE-DIRECT | Wildfire rating factor per state; migrate as-is |
| SampleTestForHexCat | (see note) | DROP (QST-3-MIG-003) | Diagnostic/test table. Evidence: "SampleTestForHexCat" naming and `Count, CreateDate` column pattern consistent with integration testing artifact. |

**QST-3-MIG-002:** Confirm `HBRater_StateTaxSheet.Abbriviation` is a schema typo to be corrected to `abbreviation` in the target. This is not listed in ART-1-001 RSK-1-DATA-004 but follows the same pattern.

**QST-3-MIG-003:** Confirm `SampleTestForHexCat` is a test/diagnostic table with no production data value and may be dropped. No silent drop without confirmation.

### 1.8 InsureEdge_DEV — Domain: Notifications & Retry

| Source Table | Target Table | Classification | Key Transformations |
|---|---|---|---|
| NotifyLenderdock | system.notify_lenderdock | MIGRATE-TRANSFORM | ERD delta; `datetime` → `timestamp`; FK for `PolicyId` added; `RetryCounter int` preserved |

### 1.9 InsureEdge_DEV — Domain: Risk Information Audit

| Source Table | Target Table | Classification | Key Transformations |
|---|---|---|---|
| HexCat_RiskInfo_Audit | system.hexcat_risk_info_audit | MIGRATE-TRANSFORM | ERD delta; full audit log of HexCat API calls; `datetime` → `timestamp`; `nvarchar(max)` → `text` for response fields |

### 1.10 InsureEdge_DEV — Domain: Cross-Module Infrastructure

| Source Table | Target Table | Classification | Key Transformations |
|---|---|---|---|
| Email | system.email | MIGRATE-TRANSFORM | ERD delta; `Message` is `varbinary` — extract to Azure Blob or convert to `text` (QST-3-MIG-004); `datetime` → `timestamp`; FK for `ClaimId`, `PolicyId` |
| EmailAttachment | system.email_attachment | MIGRATE-TRANSFORM | ERD delta; binary content → Azure Blob; `datetime` → `timestamp` |
| Task | system.task | MIGRATE-TRANSFORM | ERD delta; `datetime` → `timestamp` |
| TaskAction | system.task_action | MIGRATE-TRANSFORM | ERD delta; `datetime` → `timestamp` |
| Comment | system.comment | MIGRATE-TRANSFORM | ERD delta; `datetime` → `timestamp`; FK for `RecordId` is polymorphic — document pattern in target |
| Configuration | system.configuration | MIGRATE-TRANSFORM | ERD delta; `bit` → `boolean` |
| ConfigurationValues | system.configuration_values | MIGRATE-TRANSFORM | ERD delta |
| DropdownType | system.dropdown_type | MIGRATE-TRANSFORM | ERD delta |
| PolicyDropdownConfiguration | policy.policy_dropdown_configuration | MIGRATE-TRANSFORM | ERD delta |
| PolicyConfigurationRequestedBy | policy.policy_configuration_requested_by | MIGRATE-TRANSFORM | ERD delta |
| PolicyConfigurationTransactionType | policy.policy_configuration_transaction_type | MIGRATE-TRANSFORM | ERD delta |
| BulkUploadAudit | system.bulk_upload_audit | MIGRATE-TRANSFORM | ERD delta; `datetime` → `timestamp` |
| BulkUploadDump | system.bulk_upload_dump | MIGRATE-TRANSFORM | ERD delta; `datetime` → `timestamp`; large text fields → `text` |

**QST-3-MIG-004:** `Email.Message` column type is `varbinary`. Confirm whether this stores email body as binary-encoded text or as a document attachment. If text: convert to `text` using UTF-8 decoding during migration. If binary document: extract to Azure Blob. Transformation path differs significantly.

### 1.11 InsureEdge_DEV — Domain: Lookup / Reference

| Source Tables | Target Schema | Classification | Key Transformations |
|---|---|---|---|
| PolicyStatus | policy.policy_status | MIGRATE-DIRECT | Small reference table |
| PolicyType | policy.policy_type | MIGRATE-DIRECT | Small reference table |
| PolicyTransaction | policy.policy_transaction | MIGRATE-DIRECT | Small reference table |
| CoverageType | policy.coverage_type | MIGRATE-DIRECT | Small reference table |
| DeductibleType | policy.deductible_type | MIGRATE-DIRECT | Small reference table |
| PerilType | policy.peril_type | MIGRATE-DIRECT | Small reference table |
| WritingCompany | policy.writing_company | MIGRATE-TRANSFORM | Schema typo in source: `WrittingCompany` (table name) → `writing_company` (NFR-012); `bit` → `boolean` |
| PaymentFrequency | billing.payment_frequency | MIGRATE-DIRECT | Small reference table |
| PaymentMethod | billing.payment_method | MIGRATE-DIRECT | Small reference table |
| DocumentType | policy.document_type | MIGRATE-DIRECT | Small reference table |
| ClaimStatus | claims.claim_status | MIGRATE-DIRECT | Small reference table |
| ClaimType | claims.claim_type | MIGRATE-DIRECT | Small reference table |
| AdjusterStatus | claims.adjuster_status | MIGRATE-DIRECT | Small reference table |
| IntermediaryType | distribution.intermediary_type | MIGRATE-DIRECT | Small reference table |
| ProducerStatus | distribution.producer_status | MIGRATE-DIRECT | Small reference table |

### 1.12 InsureEdge_DEV — Legacy Mapping Tables (ERD Delta)

| Source Tables | Classification | Notes |
|---|---|---|
| PremiumTable | ARCHIVE (QST-3-MIG-005) | ERD annotation: "legacy mapping/reference tables, likely migration reference from prior system — not active transactional tables" |
| BillingTable | ARCHIVE (QST-3-MIG-005) | Same |
| CommissionsTable | ARCHIVE (QST-3-MIG-005) | Same |
| PaymentTable | ARCHIVE (QST-3-MIG-005) | Same |
| PolicyFeeandTaxes | ARCHIVE (QST-3-MIG-005) | Same |
| PolicyInformation | ARCHIVE (QST-3-MIG-005) | Same |

**QST-3-MIG-005 (derives from RSK-2-DATA-004 / QST-2-INT-008):** What is the role of the legacy mapping tables (PremiumTable, BillingTable, CommissionsTable, PaymentTable, PolicyFeeandTaxes, PolicyInformation) visible in the ERD? Are these live transactional tables, audit records, or migration artifacts from a prior system ingestion? If the latter, confirm whether they need to be migrated to the target at all, or can be retained as a read-only archive in a separate `archive` schema or exported to CSV for record keeping.

**Provisional classification:** ARCHIVE pending QST-3-MIG-005 answer. If confirmed as live, reclassify to MIGRATE-TRANSFORM.

### 1.13 InsureEdge_System_DEV Tables

| Source Table | Target Schema + Table | Classification | Key Transformations |
|---|---|---|---|
| Client | identity.client | MIGRATE-TRANSFORM | ERD delta reveals 15+ additional columns (ClientCode, TypeOfCompany, NAICCode, etc.); `bit` → `boolean`; FK integrity added; `OSTenantID` retained for post-migration OutSystems reference |
| ClientConfig | identity.client_config | MIGRATE-TRANSFORM | ERD delta; per-client localisation config |
| ClientSubscription | identity.client_subscription | MIGRATE-TRANSFORM | ERD delta; `datetime` → `timestamp`; SaaS subscription management |
| ClientOffice | identity.client_office | MIGRATE-TRANSFORM | FK for `ClientId` added |
| User2 | identity.app_user | MIGRATE-TRANSFORM | **Reserved-word rename:** `User2` → `app_user` (PostgreSQL `user` is reserved); `Password` field — security migration risk (see Section 3 special case); `bit` → `boolean`; `OSUserId` retained as legacy reference |
| Group_Table | identity.user_group | MIGRATE-TRANSFORM | Rename: `Group_Table` → `user_group`; FK for `ClientId`, `GroupLeaderId` added |
| GroupUser_Table | identity.user_group_member | MIGRATE-TRANSFORM | Rename: `GroupUser_Table` → `user_group_member`; FKs for `GroupId`, `UserId` added |
| ScreenPermissions | identity.screen_permission | MIGRATE-TRANSFORM | `bit` → `boolean` for all 10 flag columns; FK for `GroupId`, `ScreenId`, `ClientId` added; ERD delta adds `IntermediaryId`, `AdjusterId` cross-references |
| AppScreen | identity.app_screen | MIGRATE-TRANSFORM | ERD delta enrichment: `IconString`, `RedirectURL`, `ScreenCode`, `DisplayOrder`, `IsActive`, `IsShowInMenu` columns; `bit` → `boolean` |
| Module | identity.module | MIGRATE-TRANSFORM | ERD delta: `IsSubmodule`, `ParentModuleId`, `ModuleSVG`, `ModuleCode`, `RedirectingURL`, `DisplayOrder`, `IsShowInMenu`; designer annotation confirms `ModuleCode` is to be deleted as redundant — remove in target; `bit` → `boolean` |
| Product | identity.product | MIGRATE-TRANSFORM | `bit` → `boolean` for `IsActive`; global lookup — no ClientId scope |
| CompanyProduct | identity.company_product | MIGRATE-TRANSFORM | ERD delta; FK for `Company`, `Product` |
| CompanyProductsJurisdiction | identity.company_products_jurisdiction | MIGRATE-TRANSFORM | ERD delta |
| InsuranceProduct | identity.insurance_product | MIGRATE-TRANSFORM | ERD delta; `datetime` → `timestamp`; `bit` → `boolean` |
| Company | identity.company | MIGRATE-TRANSFORM | ERD delta; writing company entity distinct from Client |
| ClientCompanyLogos | identity.client_company_logos | MIGRATE-TRANSFORM | `varbinary` binary → Azure Blob; store BlobPath |
| Users | identity.users | MIGRATE-TRANSFORM | ERD delta; more detailed than `User2`; Password field absent from ERD — see QST-3-MIG-006 |
| ClientScreens | identity.client_screen | MIGRATE-TRANSFORM | ERD delta |
| UserScreen | identity.user_screen | MIGRATE-TRANSFORM | ERD delta |
| UserBinary | identity.user_binary | MIGRATE-TRANSFORM | `varbinary` binary (profile images) → Azure Blob; store BlobPath |
| Contacts | identity.contact | MIGRATE-TRANSFORM | ERD delta; shared contact entity |
| Address | identity.address | MIGRATE-TRANSFORM | ERD delta; shared address entity |
| AuditLog | system.audit_log | MIGRATE-TRANSFORM | `datetime` → `timestamp`; FK for `UserId` added; immutable in target (NFR-008) |
| UserPasswordReset | identity.user_password_reset | MIGRATE-TRANSFORM | `datetime` → `timestamp`; token invalidated post-use (BR-USR-PWD-003) |
| Country | system.country | MIGRATE-DIRECT | Reference table |
| State | system.state | MIGRATE-DIRECT | Reference table |
| SystemDefaultContent | system.system_default_content | MIGRATE-TRANSFORM | `BlobPath` externalized |

**QST-3-MIG-006:** The `User2` DDL contains a `Password` field but the ERD for the `Users` table in InsureEdge_System_DEV does not show a Password column. Confirm whether `User2` and `Users` are duplicate entities (DDL vs ERD discrepancy) or two distinct tables. If duplicate, determine which is the authoritative source. If `Users` is the canonical target entity, confirm the `User2.Password` field disposition.

### 1.14 ORM-Managed Tables (DDL Gap — ASM-1-DATA-001)

| Table | Classification | Notes |
|---|---|---|
| UserSystemNotifications | MIGRATE-TRANSFORM (pending DDL extraction) | OutSystems ORM-managed; DDL not in source artifact. Raises **QST-3-MIG-007**: extract DDL from OutSystems platform before migration. |
| OS_UserConfigurations | MIGRATE-TRANSFORM (pending DDL extraction) | Same — QST-3-MIG-007 applies |
| GridDefaultLayouts | MIGRATE-TRANSFORM (pending DDL extraction) | Same — QST-3-MIG-007 applies |

**QST-3-MIG-007 (extends QST-1-DATA-001):** Provide DDL for `UserSystemNotifications`, `OS_UserConfigurations`, and `GridDefaultLayouts`. These tables are absent from the SQL DDL artifacts and presumed to be OutSystems ORM-managed. Without DDL, their structure cannot be mapped to the target schema. Migration cannot begin for these tables until DDL is provided. Suggested extraction method: OutSystems Service Center → Factory → Modules → Export database DDL, or direct DDL query from the SQL Server database.

### 1.15 Entity Count Summary by Classification

| Classification | Count | Tables |
|---|---|---|
| MIGRATE-DIRECT | 21 | Lookup/reference tables, rating tables (as-is), Country, State |
| MIGRATE-TRANSFORM | ~110 | All transactional, operational, and system tables |
| MIGRATE-SPLIT | 1 | AccountBinary (polymorphic → entity-specific references) |
| MIGRATE-MERGE | 0 | No merge candidates identified |
| MIGRATE-DERIVE | 0 | No derived-only tables identified; computed columns noted per table |
| ARCHIVE | 6 | Legacy mapping tables (provisional pending QST-3-MIG-005) |
| DROP | 1 candidate | SampleTestForHexCat (QST-3-MIG-003 required before drop) |
| Pending DDL | 3 | ORM-managed tables (QST-3-MIG-007) |

**Total entities inventoried: ~153** (118 DDL + ~35 ERD delta tables)

---

## Section 2: Two-Database Consolidation Plan

### 2.1 Problem Statement

InsureEdge operates across two SQL Server databases:
- `InsureEdge_DEV` — 92 tables (operational data: policy, claims, billing, distribution)
- `InsureEdge_System_DEV` — 26 tables (system/tenant data: identity, permissions, config)

These databases are coupled at runtime via the `IESYSDBName()` site property pattern, where OutSystems resolves the System DB name dynamically and constructs cross-database SQL joins. Any rename or separation of the databases in the target breaks all runtime cross-DB queries (FND-1-DATA-001, RSK-1-DATA-007).

**ASM-3-MIG-002:** The correct resolution is full consolidation into a single PostgreSQL database with domain-partitioned schemas. All cross-DB joins become same-database joins, eliminating the `IESYSDBName` coupling entirely. Confidence: HIGH — this is the standard pattern for PostgreSQL migration of a split-database application and is supported by the Azure Database for PostgreSQL Flexible Server deployment model.

### 2.2 Target Schema Namespace Strategy

A single PostgreSQL database (`insure_edge`) with six domain schemas is recommended:

| Schema | Purpose | Source DB |
|---|---|---|
| `policy` | Policy, accounts, products, risk locations, documents | InsureEdge_DEV |
| `claims` | Claims, adjusters, worksheets, loss exposure | InsureEdge_DEV |
| `billing` | Payments, premiums, commission transactions | InsureEdge_DEV |
| `distribution` | Intermediaries, producers | InsureEdge_DEV |
| `rating` | HBRater rate tables, Rating_Wildfire | InsureEdge_DEV |
| `identity` | Client (tenant), users, groups, permissions, products | InsureEdge_System_DEV |
| `system` | Audit log, email, config, notifications, system tables | Both DBs |

**Rationale:**
- Domain schemas enforce bounded-context separation that mirrors the OutSystems BL/CS module structure (ART-2-012 §4.1)
- Single database eliminates cross-DB coupling without requiring an API indirection layer
- Schema-level grants replace the `HexCat_RunTime` db_owner privilege with granular EXECUTE+SELECT per schema (RSK-1-DATA-005)
- Azure Database for PostgreSQL Flexible Server supports multiple schemas in a single database natively

### 2.3 InsureEdge_System_DEV Tables → Target Schema Mapping

| Source Table | Target Schema | Rationale |
|---|---|---|
| Client, ClientConfig, ClientSubscription, ClientOffice | `identity` | Tenant management — core identity domain |
| User2 (→ app_user), Users | `identity` | User identity |
| Group_Table (→ user_group), GroupUser_Table (→ user_group_member) | `identity` | Group management |
| ScreenPermissions, AppScreen, Module, ClientScreens, UserScreen | `identity` | Permission model |
| Product, InsuranceProduct, Company, CompanyProduct, CompanyProductsJurisdiction | `identity` | Global reference — PlatformAdmin-managed |
| UserPasswordReset, UserBinary | `identity` | User lifecycle |
| Contacts, Address, ClientCompanyLogos | `identity` | Supporting entities |
| AuditLog | `system` | Cross-cutting concern |
| UserSystemNotifications | `system` | Cross-cutting concern |
| OS_UserConfigurations | `system` | Platform configuration |
| GridDefaultLayouts | `system` | UI configuration |
| Country, State | `system` | Global reference data |

### 2.4 Cross-DB Join Elimination

All source cross-database queries follow the pattern:
```sql
SELECT ... FROM InsureEdge_DEV.dbo.Policy p
JOIN [IESYSDBName()].dbo.Client c ON p.ClientId = c.ClientId
```

In the target, these become:
```sql
SELECT ... FROM policy.policy p
JOIN identity.client c ON p.client_id = c.client_id
```

**Migration implication:** Every OutSystems Advanced SQL action that uses `IESYSDBName()` must be identified and rewritten in the target application. This is an application migration concern (Forge Agent), not a data migration concern. However, the Migration Agent must document this as a prerequisite: the target schema must be provisioned and stable before application query migration begins.

**Assumption ASM-3-MIG-003:** The `InsureEdge_ext` and `InsureedgeSYS_ext` OutSystems External Database connections will be replaced by a single application database connection pointing to the consolidated PostgreSQL `insure_edge` database. All schema references in queries will use `policy.`, `claims.`, `billing.`, `distribution.`, `rating.`, `identity.`, or `system.` prefixes. Confidence: HIGH.

### 2.5 Database-Level Configuration

| Property | Value |
|---|---|
| Target DB name | `insure_edge` |
| Character encoding | UTF-8 (`ENCODING 'UTF8'`) |
| Locale | `en_US.UTF-8` |
| Collation | `en_US.UTF-8` (case-insensitive collation via `citext` extension for case-insensitive string columns, or `ILIKE` at query level) |
| Extensions required | `uuid-ossp` (UUID generation), `pg_trgm` (full-text search), `pgcrypto` (encryption functions) |
| Connection pool | PgBouncer (transaction mode) recommended for 100-concurrent-user scale |
| Schema search path | Set per application role: e.g., `SET search_path = policy, claims, billing, identity, system` |

---

## Section 3: Special Migration Cases

### 3.1 HBRater Rate Tables

**Tables:** `HBRater_LRHexzones`, `HBRater_HRHexzone`, `HBRater_StateTaxSheet`, `HBRater_ExcessFloodCoverage`, `Rating_Wildfire`

**Classification:** MIGRATE-DIRECT (with column name lowercasing)

**Context:** These are locally-hosted rate tables embedded in InsureEdge_DEV. The IE Rating Engine reads them directly via SQL (ASM-2-ARCH-007). The `HBRater_LRHexzones` table contains the 103,739-row H3 hexzone rate data derived from the rating workbook. Migration to the `rating` schema in PostgreSQL preserves all rate logic without requiring an external API.

**Migration approach:**
1. Extract all 5 rate tables from InsureEdge_DEV using SQL export
2. Load into `rating` schema in target PostgreSQL
3. Lowercase all column names per PostgreSQL snake_case convention
4. Correct `HBRater_StateTaxSheet.Abbriviation` → `abbreviation` (QST-3-MIG-002 must confirm)
5. Create appropriate indexes (rate tables are read-heavy; index on zone/state lookup columns)
6. Validate row counts post-migration against source counts

**Risk note (RSK-2-INT-009):** Rate table migration must occur before any policy rating test in the target environment. Rating logic in the application tier will be rewritten to query `rating.hbrater_*` schemas instead of `dbo.HBRater_*`.

### 3.2 Legacy Mapping Tables

**Tables:** `PremiumTable`, `BillingTable`, `CommissionsTable`, `PaymentTable`, `PolicyFeeandTaxes`, `PolicyInformation`

**Classification:** ARCHIVE (provisional — pending QST-3-MIG-005)

**Migration approach (if ARCHIVE confirmed):**
- Export full table contents to CSV + schema DDL files
- Store in `archive` schema in target PostgreSQL (read-only access, no application FKs)
- Alternatively, export to Azure Blob as parquet/CSV for long-term retention
- No application code references to these tables in target
- Document in the Data Lineage Register that these tables originated from a prior system migration

**If reclassified as LIVE:** Full MIGRATE-TRANSFORM classification applies; QST-3-MIG-005 answer required before proceeding.

### 3.3 AccountBinary / PolicyDocument / ClaimDocument — Binary Extraction Strategy

**RSK-2-DATA-005 — AccountBinary Polymorphic Pattern:**

`AccountBinary` uses nullable FKs to 8 entity types (AccountId, ClaimId, AdjusterId, PolicyId, PayeeBankId, ReportId, LossExposureId, WitnessId). This polymorphic pattern does not enforce referential integrity.

**Target architecture for AccountBinary:**
- Split `AccountBinary` into entity-specific Blob path reference columns or separate document tables per entity:
  - `policy.policy_binary_document` (PolicyId FK)
  - `claims.claim_binary_document` (ClaimId FK)
  - `claims.adjuster_binary_document` (AdjusterId FK)
  - `billing.payee_bank_binary_document` (PayeeBankId FK)
  - etc.
- Each entity-specific table contains `document_type`, `document_name`, `blob_path`, `blob_container`, `uploaded_by`, `uploaded_on`
- Binary content extracted to Azure Blob during migration per blob path convention: `{ClientCode}/{ModuleName}/{RecordId}/{Filename}` (FND-2-INT-008)

**For `Policy_Extended_Binary` (`EndorsementSummary`, `UWSpecificChange` — varbinary fields):**
- Extract binary content to Azure Blob
- Store blob paths in `policy.policy_extended` as `endorsement_summary_blob_path` and `uw_specific_change_blob_path`
- Drop `varbinary` columns from target schema

**For `ClaimLetter.EmailBody` (nvarbinary):**
- QST-3-MIG-004 applies: determine if binary is email body text or document
- If text: decode to UTF-8, store as `text` in `claim_letter.email_body`
- If document: extract to Azure Blob, store path

**For `ClientCompanyLogos` and `UserBinary` (varbinary — profile images):**
- Extract to Azure Blob under `{ClientCode}/logos/` and `{ClientCode}/users/` paths respectively
- Store `blob_path` as `text` in target table

**Blob extraction volume estimate (pre-migration check required):**
- Run size distribution query on all `varbinary(max)` columns to estimate total binary volume
- See Section 4 (Data Quality Pre-Migration Checks)

### 3.4 User2.Password — Security Migration Risk

**Risk ID:** RSK-1-SEC-001 (from ART-1-003, referenced in ART-1-001)

**Finding:** `User2.Password` stores passwords in `varchar(max)`. Evidence of `UpdateUsersPassword` function and default credential `[REDACTED-BOOTSTRAP-CREDENTIAL]` indicates plaintext storage.

**Migration rule (NFR-003):**
- `User2.Password` must NOT be migrated to the target `identity.app_user` table in any form — not as plaintext, not as a hash of the existing value.
- Target `app_user.password_hash` column must store bcrypt/Argon2 hashes only.
- Migration script must set `password_hash = NULL` and `requires_password_reset = TRUE` for every migrated user record.
- Post-migration, all users must be prompted to set a new password on first login.
- The default `[REDACTED-BOOTSTRAP-CREDENTIAL]` credential must be confirmed eliminated before cutover (NFR-003).

**Communication requirement:** A user communication plan must notify all existing users that they will need to reset their password on first login to the new system. This is a business-level migration impact that must be approved by the customer before cutover.

### 3.5 PaymentCallbackResponses — "To Be Added" Status

**Risk ID:** RSK-2-DATA-003

**Finding:** The ERD annotation `(@mukulsinghnathawat)` marks `PaymentCallbackResponses` as "to be added", indicating this table may not exist in the current live InsureEdge_DEV database.

**QST-3-MIG-001** (already raised in Section 1.4) covers this. Migration approach:
- If table does NOT exist in source: create target table `billing.payment_callback_responses` per ERD schema; no data migration needed.
- If table EXISTS in source: classify MIGRATE-TRANSFORM; `datetime` → `timestamp`; FK for `PolicyId` added.
- Either way, the target schema requires this table for TranzPay callback auditing (INT-001, ART-2-012 §1.3).

### 3.6 ORM-Managed Tables — Gap Documentation

**Tables:** `UserSystemNotifications`, `OS_UserConfigurations`, `GridDefaultLayouts`

**Finding (ASM-1-DATA-001):** These tables are absent from the provided DDL scripts. They are presumed to be created by the OutSystems ORM at deploy time and are not included in the SQL DDL exports.

**Migration approach:**
1. **Extraction:** Query the SQL Server database directly using:
   ```sql
   SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN ('UserSystemNotifications', 'OS_UserConfigurations', 'GridDefaultLayouts')
   ```
   This will confirm existence and allow DDL generation via `sp_help` or `SSMS Script Table`.
2. **DDL extraction:** Once confirmed, extract DDL and add to the migration inventory.
3. **Data migration:** Standard MIGRATE-TRANSFORM once DDL is available.

**QST-3-MIG-007** raised (see Section 1.14). This must be resolved before migration planning is complete for the `system` schema.

### 3.7 PolicyAccount Junction Table — M:N Correction

**Risk ID:** RSK-2-DATA-001

**Finding (FND-2-INT-005):** The `PolicyAccount` junction table in the ERD confirms Policy↔Account is M:N, not the 1:N implied by `Policy.AccountId` FK in ART-1-001.

**Migration data mapping correction:**
- Source data may contain rows in `PolicyAccount` that represent additional account associations beyond the `Policy.AccountId` FK.
- During migration, the ETL must populate `policy.policy_account` from the `PolicyAccount` junction table, NOT from `Policy.AccountId` alone.
- `Policy.AccountId` must be analyzed: if it always maps to a corresponding `PolicyAccount` row, it is redundant. If it represents a "primary account" not captured in `PolicyAccount`, it must be migrated as a `is_primary` flag on the junction table.
- **DBT-3-MIG-001** covers the disposition of `Policy.AccountId` in the target.

---

## Section 4: Data Quality Pre-Migration Checks

The following checks must be executed against the source databases **before migration begins**. All checks are read-only queries against the production (or final pre-migration snapshot) SQL Server databases. Failures against defined thresholds must be resolved before migration proceeds.

### 4.1 Orphan Record Scan

**Scope:** Claim→Policy, Worksheet→Claim (no DB-level FK enforced in source)

| Check | Query Description | Pass Criteria | Risk If Fails |
|---|---|---|---|
| Claim orphan scan | SELECT COUNT(*) FROM Claim c LEFT JOIN Policy p ON c.PolicyId = p.PolicyId WHERE p.PolicyId IS NULL | Count = 0 | Orphan claims cannot be loaded to target with FK enforced; target migration would fail at load time |
| Worksheet orphan scan | SELECT COUNT(*) FROM Worksheet w LEFT JOIN Claim c ON w.ClaimId = c.ClaimId WHERE c.ClaimId IS NULL | Count = 0 | Orphan worksheets would violate target FK constraint |
| WorksheetPayment orphan scan | SELECT COUNT(*) FROM WorksheetPayment wp LEFT JOIN Worksheet w ON wp.WorksheetId = w.WorksheetId WHERE w.WorksheetId IS NULL | Count = 0 | Secondary orphan check |
| ClaimCoverage orphan scan | SELECT COUNT(*) FROM ClaimCoverage cc LEFT JOIN Claim c ON cc.ClaimId = c.ClaimId WHERE c.ClaimId IS NULL | Count = 0 | Secondary orphan check |

**Remediation if orphans found:** Orphan records must either be associated with a valid parent record (data correction by business team) or migrated to an `archive` schema with a note. No orphan record may be silently dropped without documented business approval.

### 4.2 Sentinel Date Audit

**Scope:** All `datetime` columns across both databases

| Check | Query Description | Output Required |
|---|---|---|
| Sentinel date count per table | For each datetime column: SELECT '{TableName}', '{ColumnName}', COUNT(*) FROM {Table} WHERE {Column} = '1900-01-01' | Count per table/column — report total sentinel volume |
| Sentinel date percentage | Sentinel count / total row count | Flag any column where >50% of rows are sentinel — business must confirm this is expected |

**Action:** All `1900-01-01` values must be converted to `NULL` during ETL. QST-1-DATA-003 from ART-1-001 must be answered to confirm this is the intended behavior.

### 4.3 Binary Column Size Distribution

**Scope:** All `varbinary(max)` columns requiring Azure Blob extraction

| Check | Query Description | Output Required |
|---|---|---|
| Binary size per column | SELECT MIN(DATALENGTH(col)), AVG(DATALENGTH(col)), MAX(DATALENGTH(col)), SUM(DATALENGTH(col)), COUNT(*) | Total binary volume per column (bytes) — sum across all varbinary columns gives total Blob migration volume estimate |
| Tables with binary content | All tables identified in Section 3.3 | Confirm blob volume before provisioning Azure Blob Storage capacity |

### 4.4 ClientId NULL Audit

**Scope:** All tenant-scoped tables (those with ClientId column)

| Check | Query Description | Pass Criteria |
|---|---|---|
| ClientId NULL count | SELECT COUNT(*) FROM {TenantTable} WHERE ClientId IS NULL | Count = 0 — any NULL ClientId is a tenant isolation breach |
| ClientId = 0 count | SELECT COUNT(*) FROM {TenantTable} WHERE ClientId = 0 | Count = 0 — ClientId=0 is a sentinel for "no tenant" and violates BR-TENANT-001 |

**If NULLs or zeros found:** Investigate root cause. Records may be seeded test data or system-level records intentionally unscoped. Each must be reviewed and either assigned to a ClientId or archived.

### 4.5 Duplicate Detection

| Check | Query Description | Pass Criteria |
|---|---|---|
| PolicyNumber uniqueness | SELECT PolicyNumber, COUNT(*) FROM Policy GROUP BY PolicyNumber HAVING COUNT(*) > 1 | Count = 0 (within same ClientId) |
| User email uniqueness | SELECT Email, ClientId, COUNT(*) FROM User2 GROUP BY Email, ClientId HAVING COUNT(*) > 1 | Count = 0 (per BR-USR-ID-001) |
| User phone uniqueness | SELECT Phone, ClientId, COUNT(*) FROM User2 GROUP BY Phone, ClientId HAVING COUNT(*) > 1 | Count = 0 (per BR-USR-ID-002) |
| ClaimNumber uniqueness | SELECT ClaimNumber, COUNT(*) FROM Claim GROUP BY ClaimNumber HAVING COUNT(*) > 1 | Count = 0 |

### 4.6 Schema Typo Verification

Before migration, run a cross-database search to inventory all code references to the four documented typos (NFR-012):

| Typo | Correct Form | Check |
|---|---|---|
| `WrittingCompany` | `writing_company` | Confirm all OML references to be updated by Forge Agent before FORGE begins |
| `ComissionPercentage` | `commission_percentage` | Same |
| `OraganisationType` | `organisation_type` | Same |
| `PoilcyId` | `policy_id` | Same |

**Output:** A Typo Reference Map document (produced by Forge Agent as part of FORGE) listing every file, function, and API contract containing the typo form. Migration Agent provides the mapping; Forge Agent implements the rename.

---

## Risks Register (Migration Agent)

| Risk ID | Description | Impact | Mitigation |
|---|---|---|---|
| RSK-1-DATA-001 | No FK on Claim→Policy — orphan analysis required | HIGH | Section 4.1 pre-migration orphan scan; add FK in target |
| RSK-1-DATA-002 | varbinary(max) binary extraction volume unknown | MEDIUM | Section 4.3 size distribution query before planning Blob migration |
| RSK-1-DATA-003 | 1900-01-01 sentinel dates | HIGH | Section 4.2 audit; ETL converts all sentinels to NULL |
| RSK-1-DATA-004 | Schema typos in column names | HIGH | Section 1 maps all typos; Forge Agent implements rename |
| RSK-1-DATA-007 | Cross-DB coupling via IESYSDBName | HIGH | Section 2 consolidation plan; single PostgreSQL DB eliminates coupling |
| RSK-2-DATA-001 | PolicyAccount M:N junction table | HIGH | Section 3.7 and Section 1.1 correction; DBT-3-MIG-001 |
| RSK-2-DATA-002 | PolicyPremium intermediate entity | HIGH | Section 1.4 documents migration chain; FK chain in ETL must traverse PolicyPremium |
| RSK-2-DATA-003 | PaymentCallbackResponses "to be added" | MEDIUM | QST-3-MIG-001; target table created regardless; data migrated only if source table exists |
| RSK-2-DATA-004 | Legacy mapping tables — live vs archive unknown | MEDIUM | QST-3-MIG-005; provisionally classified ARCHIVE |
| RSK-2-DATA-005 | AccountBinary polymorphic pattern | MEDIUM | Section 3.3 split strategy; MIGRATE-SPLIT classification |

---

## Open Questions Register (Migration Agent — this document)

| QST ID | Priority | Question | Blocking For |
|---|---|---|---|
| QST-3-MIG-001 | MAJOR | Does `PaymentCallbackResponses` exist in InsureEdge_DEV? Confirm column set. | ETL script for billing.payment_callback_responses |
| QST-3-MIG-002 | MINOR | Confirm `HBRater_StateTaxSheet.Abbriviation` is a typo to be corrected to `abbreviation`. | Target schema DDL for rating.hbrater_state_tax_sheet |
| QST-3-MIG-003 | MAJOR | Confirm `SampleTestForHexCat` is a test/diagnostic table with no production data value; confirm it may be dropped. | No silent drop without confirmation |
| QST-3-MIG-004 | MAJOR | `Email.Message` column is varbinary — confirm whether it stores email body text or binary document. Determines conversion path (UTF-8 decode vs Azure Blob extraction). | ETL transformation for system.email |
| QST-3-MIG-005 | MAJOR | What is the role of legacy mapping tables (PremiumTable, BillingTable, CommissionsTable, PaymentTable, PolicyFeeandTaxes, PolicyInformation)? Live vs archive? | Classification and ETL approach for these 6 tables |
| QST-3-MIG-006 | MAJOR | Clarify relationship between `User2` (DDL) and `Users` (ERD). Are they duplicate entities or distinct? Determine authoritative source for identity.app_user. | Identity schema consolidation; User2.Password disposition |
| QST-3-MIG-007 | MAJOR | Provide DDL for `UserSystemNotifications`, `OS_UserConfigurations`, `GridDefaultLayouts`. | system schema completeness; migration cannot be planned for these 3 tables without DDL |

---

*End of ART-3-013 — Data Migration Architecture | INSUREEDGE-2026 | IDEATE Phase | 2026-06-17*
*Layer 0 §5: All findings cite ART-1-001 or ART-2-012. No field silently dropped — every unmapped or uncertain field has a QST- or DBT-.*
*Entity count: ~153 total | MIGRATE-DIRECT: 21 | MIGRATE-TRANSFORM: ~110 | MIGRATE-SPLIT: 1 | ARCHIVE: 6 (provisional) | DROP candidate: 1 (QST required) | Pending DDL: 3*
