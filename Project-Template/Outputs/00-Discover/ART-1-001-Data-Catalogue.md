# ART-1-001 — Data Catalogue
## InsureEdge Application Modernization (INSUREEDGE-2026)
### Phase: SCAN | Agent: @data | Date: 2026-06-16

---

**Document Control**

| Field | Value |
|-------|-------|
| Artifact ID | ART-1-001 |
| Title | Data Catalogue — InsureEdge Full Entity Inventory |
| Phase | SCAN (Phase 1) |
| Confidence | HIGH (all tables sourced from DDL evidence) |
| Evidence | EV-0-0224, EV-0-0225, EV-0-0006, EV-0-0007, EV-0-0012 |
| YAML Contract | SCAN-Data-YAML-Contract.yaml |

---

## 1. Database Context

### 1.1 Infrastructure

| Property | InsureEdge_DEV | InsureEdge_System_DEV |
|----------|---------------|----------------------|
| SQL Server Version | 2022 (MSSQL16) | 2022 (MSSQL16) |
| Compatibility Level | 150 (SQL 2019 feature set) | 150 |
| Recovery Model | FULL | FULL |
| Collation | DATABASE_DEFAULT | DATABASE_DEFAULT |
| Query Store | ON | ON |
| Table Count | 92 | 26 |
| FK Constraints | 37 (all via ALTER TABLE post-creation) | Multiple (inline) |
| Stored Procedures | 1 (usp_UpdateHexCatRiskInfo) | 0 |
| User-Defined Types | 1 (HexCatRiskInfoType) | 0 |
| Views | 2 (vw_HexCatInputRecords, vw_HexCatCompanyReference) | 0 |
| Role | Operational / Transactional | Platform Configuration |

### 1.2 Database Users (InsureEdge_DEV)

| User | Rights | Purpose |
|------|--------|---------|
| outsystems_ie_db_sudhir | db_datareader | OutSystems read access |
| jitendrak@damcogroup.com | db_datareader + db_datawriter | Developer access |
| HexCat_RunTime | db_owner | HexCat external system (OVERPRIVILEGED — see RSK-1-0006) |

### 1.3 OutSystems Connection Names

| Connection | Database | Usage |
|------------|----------|-------|
| InsureEdge-LC | InsureEdge_DEV | Operational data (Policy, Claim, Account, etc.) |
| InsureEdgeSYS-LC | InsureEdge_System_DEV | System/platform data (Client, User, Company, Product) |
| DatabaseAccess.ForCurrentDatabase | OutSystems Platform DB | [User] and Tenant tables (ORM-managed) |

---

## 2. Multi-Tenancy Pattern

Multi-tenancy is implemented at the **application layer** via a `ClientId` discriminator column.

- Every major operational entity in `InsureEdge_DEV` carries a `ClientId` column (bigint).
- `ClientId` is a logical FK to `InsureEdge_System_DEV.Client.Id` (no database-level FK constraint declared across databases).
- All application queries filter with `WHERE ClientId = @CurrentClientId`.
- No Row-Level Security (RLS) exists at the database layer — tenant isolation is entirely application-enforced.
- `ClientId = 1` is the platform-level default used for bootstrapped reference data (PolicyDropdownConfiguration).

**ClientCode format:** 5-digit zero-padded sequential integer (e.g., "00001", "00002"). Auto-generated on new Client creation.

**Risk:** If application-layer filtering fails, cross-tenant data leakage is possible at the database level (RSK-1-0001 adjacent; see YAML contract).

---

## 3. Entity Inventory — InsureEdge_DEV (92 Tables)

### 3.1 Domain Classification

| Domain | Tables |
|--------|--------|
| Policy & Underwriting | Policy, Policy_Extended, Policy_Extended_Binary, PolicyProduct, PolicyLimitCoverage, PolicyPremium, PolicyPaymentTransaction, PolicyPaymentTransaction_Extended, PolicyRiskInformation, HORiskInformation, PolicyMortgage, PolicyTransactions, PolicyDropdownConfiguration, PolicyDocument, PolicyAccounts, CancellationPaymentTransaction, StateSpecificDataTable |
| Account & Party | Account, Account_Extended, AccountBinary, AdditionalInsured, AdditionalOrganisation, CommonAddress, CommonContact |
| Claims | Claim, ClaimCoverage, ClaimCoverageLimit, ClaimImpactedCoverage, ClaimImpactedCoverageAsset, ClaimMortgage, ClaimDocument, ClaimEscalation, ClaimReport, ClaimLetter, ClaimAuthority |
| Claims Financials | Worksheet, WorksheetPayment, WorksheetReserve, Payee, PaymentSuperseding, PaymentCallbackResponses_Audit |
| Loss Exposure | LossExposure, LossExposureDamage, LossExposureServicedetail |
| Producer / Intermediary | Intermediary, Producer, IntermediaryCommission, IntermediaryContact, IntermediaryNonResidentState, IntermediaryProducerAddress, IntermediaryProducerLogo, ProducerNonResidentState, AdjusterLicense |
| Adjuster | Adjuster, BankDetail |
| Commission | PolicyCommission, CommissionPaymentTransaction, CommissionDisbursement_Audit |
| HexCat Integration | HexCat_RiskInfo_Audit, HexCatInputRecords_Audit, SampleTestForHexCat |
| HB Rater (Rating Lookup) | HBRater_ExcessFloodCoverage, HBRater_HRHexzones, HBRater_LRHexzones, HBRater_RatingWildfire, HBRater_StateTaxSheet |
| Deductible / Cause of Loss | CauseOfLossDescription, CauseOfLossGroup, CauseOfLossGroupDescription |
| Document / Correspondence | Template, TemplateDocument, TemplateState, ProductDocument, ClaimDocument |
| Communication | Email, EmailAttachment, Comment, Note, NoteFile |
| Task | Task, TaskAction |
| Reporting | AdhocReport, Report |
| Configuration | Configuration, ConfigurationValue |
| Claimant / Witness | Claimant, Witness |
| Audit | Audits, BulkUploadAudit, BulkUploadDump |
| Integration Audit | NotifyLenderdock, HOFormLimit&Coverage |

### 3.2 Full Table Inventory — InsureEdge_DEV

| # | Table Name | PK | PK Type | ClientId | Domain | Key Notes |
|---|-----------|-----|---------|----------|--------|-----------|
| 1 | Account | Id | bigint IDENTITY | Yes | Account | Insured/policyholder; FK_Account_Intermediary; self-FK |
| 2 | Account_Extended | AccountId | bigint (FK to Account.Id) | No | Account | 1:1 extension; AgeMoreThan65 field |
| 3 | AccountBinary | Id | bigint IDENTITY | Partial | Document | Multi-module binary store; BlobPath + varbinary coexist |
| 4 | AdditionalInsured | Id | bigint IDENTITY | No | Policy | Additional named insureds; linked to Policy |
| 5 | AdditionalOrganisation | Id | bigint IDENTITY | No | Policy | Additional org parties; OraganisationType typo |
| 6 | AdhocReport | Id | bigint IDENTITY | Yes | Reporting | Saved report configs; delivery mode; schedule type |
| 7 | Adjuster | Id | bigint IDENTITY | Yes | Adjuster | External adjuster profile; OsUserId links to OutSystems User |
| 8 | AdjusterLicense | Id | bigint IDENTITY | No | Adjuster | State licenses per adjuster |
| 9 | Audits | Id | bigint IDENTITY | Yes | Audit | System-wide audit log; AuditBin varbinary; Module filter |
| 10 | BankDetail | Id | bigint IDENTITY | No | Adjuster | Banking details for payees and adjusters; SSN/TIN stored |
| 11 | BulkUploadAudit | Id | bigint IDENTITY | Yes | Audit | Bulk upload session; ExcelFile varbinary |
| 12 | BulkUploadDump | Id | bigint IDENTITY | No | Audit | Row-level dump; ColJSON nvarchar(max) |
| 13 | CancellationPaymentTransaction | Id | bigint IDENTITY | No | Policy | Refund on cancellation; FK to Policy |
| 14 | CauseOfLossDescription | Id | bigint IDENTITY | No | Deductible | Deductible reduction rules; FK to ClaimCoverage (x2) |
| 15 | CauseOfLossGroup | Id | bigint IDENTITY | No | Deductible | Grouped deductible rules; FK to ClaimCoverage (x2) |
| 16 | CauseOfLossGroupDescription | Id | bigint IDENTITY | No | Deductible | Junction: CauseOfLossGroup x CauseOfLossDescription |
| 17 | Claim | Id | bigint IDENTITY | Yes | Claims | Core claim record; dual assignment: AdjusterId + AssignedTo |
| 18 | ClaimAuthority | Id | bigint IDENTITY | Yes | Claims | Adjuster authority limits; UserId references system User |
| 19 | ClaimCoverage | Id | bigint IDENTITY | Yes | Claims | Coverage catalog per client; config table |
| 20 | ClaimCoverageLimit | Id | bigint IDENTITY | No | Claims | Tiered limits (Basic/Standard/Preferred); 5 FKs to ClaimCoverage |
| 21 | ClaimDocument | Id | bigint IDENTITY | No | Claims | Documents on claims; DocumentFile varbinary(max) |
| 22 | ClaimEscalation | Id | bigint IDENTITY | No | Claims | Escalation records; FK to Claim |
| 23 | ClaimImpactedCoverage | Id | bigint IDENTITY | No | Claims | Coverages impacted per claim; Coverage stored as bigint |
| 24 | ClaimImpactedCoverageAsset | Id | bigint IDENTITY | No | Claims | Asset types under impacted coverages; FK to ClaimImpactedCoverage |
| 25 | ClaimLetter | Id | bigint IDENTITY | Yes | Claims | Correspondence letters; EmailBody varbinary(max) |
| 26 | ClaimMortgage | Id | bigint IDENTITY | No | Claims | Mortgage info on claim |
| 27 | ClaimReport | Id | bigint IDENTITY | No | Claims | Police/incident reports; FK to Claim |
| 28 | Claimant | Id | bigint IDENTITY | No | Claims | Parties in a claim; FK to Claim, AdditionalInsured, AdditionalOrganisation |
| 29 | Comment | Id | bigint IDENTITY | Yes | Communication | Multi-module comments; RecordId + ModuleCode polymorphic |
| 30 | CommissionDisbursement_Audit | Id | bigint IDENTITY | No | Commission | Audit log for disbursements; Request/Response fields |
| 31 | CommissionPaymentTransaction | Id | bigint IDENTITY | No | Commission | Payment installment per commission; FK to PolicyCommission |
| 32 | CommonAddress | Id | bigint IDENTITY | No | Shared | Polymorphic address; FK to Account (declared), others logical |
| 33 | CommonContact | Id | bigint IDENTITY | No | Shared | Shared contact; FK to Account (declared); indexed on AccountId, PolicyId |
| 34 | Configuration | Id | bigint IDENTITY | Yes | Config | Client-level config key definitions |
| 35 | ConfigurationValue | Id | bigint IDENTITY | No | Config | Config values; FK to Configuration; self-FK |
| 36 | Email | Id | bigint IDENTITY | Yes | Communication | Email log; Message varbinary(max); SentTo nvarchar(4000) |
| 37 | EmailAttachment | Id | bigint IDENTITY | Yes | Communication | Attachments; FileData varbinary(max); FK to Email (logical) |
| 38 | HBRater_ExcessFloodCoverage | Id | bigint IDENTITY | No | Rating | Flood coverage rates by building type/flood zone |
| 39 | HBRater_HRHexzones | Id | bigint IDENTITY | No | Rating | High-risk hex zones: hurricane, tornado, hail rates |
| 40 | HBRater_LRHexzones | Id | bigint IDENTITY | No | Rating | Low-risk hex zones: wind, derecho, earthquake, sinkhole rates |
| 41 | HBRater_RatingWildfire | Id | bigint IDENTITY | No | Rating | Wildfire K8 factor per state |
| 42 | HBRater_StateTaxSheet | Id | bigint IDENTITY | No | Rating | Surplus lines/stamping fee/fire premium tax by state |
| 43 | HexCat_RiskInfo_Audit | ID | int IDENTITY | No | Integration | HexCat audit trail; 27 risk fields + CreateDate DEFAULT getutcdate() |
| 44 | HexCatInputRecords_Audit | Id | int IDENTITY | No | Integration | Legacy HexCat audit; varchar types (vs nvarchar in _RiskInfo_Audit) |
| 45 | HOFormLimit&Coverage | Id | bigint IDENTITY | No | Policy | HO form limits; FormId FK (parent unknown — DBT-1-0006) |
| 46 | HORiskInformation | Id | bigint IDENTITY | No | Policy | HO property risk details; FK to Policy; 40+ fields |
| 47 | IntermediaryCommission | Id | bigint IDENTITY | No | Producer | Commission rates per Intermediary/Company/Product; FK to Intermediary |
| 48 | IntermediaryContact | Id | bigint IDENTITY | No | Producer | Contacts for intermediary; FK to Intermediary; UpatedOn typo |
| 49 | IntermediaryNonResidentState | Id | bigint IDENTITY | Yes | Producer | Non-resident state licenses per intermediary |
| 50 | IntermediaryProducerAddress | Id | bigint IDENTITY | No | Producer | Addresses for intermediary/producer; FK to both; UpatedOn typo |
| 51 | IntermediaryProducerLogo | Id | bigint IDENTITY | No | Producer | Logo files; Logo varbinary(max); FK to Intermediary and Producer |
| 52 | Intermediary | Id | bigint IDENTITY | Yes | Producer | Agency/broker entity; root of producer hierarchy |
| 53 | LossExposure | Id | bigint IDENTITY | No | Loss | Loss exposure detail per claim; FK to Claim; attorney data |
| 54 | LossExposureDamage | Id | bigint IDENTITY | No | Loss | Material damage % per exposure; FK to LossExposure |
| 55 | LossExposureServicedetail | Id | bigint IDENTITY | No | Loss | Additional services per exposure; FK to LossExposure |
| 56 | Note | Id | bigint IDENTITY | Yes | Communication | Notes/attachments; Notes varbinary(max); Module field |
| 57 | NoteFile | Id | bigint IDENTITY | Yes | Communication | Files attached to notes; FK to Note; FileData varbinary(max) |
| 58 | NotifyLenderdock | Id | bigint IDENTITY | No | Integration | Lenderdock notification log; PoilcyId typo; RetryCounter |
| 59 | Payee | Id | bigint IDENTITY | No | Claims Financials | Claim payment recipient; SSN/TIN/NationalId; OFAC/fraud checks |
| 60 | PaymentCallbackResponses_Audit | Id | bigint IDENTITY | No | Claims Financials | Payment gateway callback audit; FK to Policy |
| 61 | PaymentSuperseding | Id | bigint IDENTITY | No | Claims Financials | Junction: WorksheetPayment x CauseOfLossDescription |
| 62 | Policy | Id | bigint IDENTITY | Yes | Policy | Core policy (OutSystems: "Policy2"); WrittingCompany typo |
| 63 | Policy_Extended | PolicyId | bigint (FK to Policy.Id) | No | Policy | 1:1 extension; cancellation/endorsement/rewrite dates |
| 64 | Policy_Extended_Binary | PolicyId | None (no PK!) | No | Policy | Binary docs; FK to Policy_Extended; NO PK — schema defect |
| 65 | PolicyAccounts | Id | bigint IDENTITY | No | Policy | Policy-Account junction; NO UNIQUE constraint |
| 66 | PolicyCommission | Id | bigint IDENTITY | No | Commission | Commission per policy; FK to Policy + Intermediary; ComissionPercentage typo |
| 67 | PolicyDocument | Id | bigint IDENTITY | Yes | Policy | Policy documents; BlobPath + BinaryFile_Temp varbinary |
| 68 | PolicyDropdownConfiguration | Id | bigint IDENTITY | Yes | Config | UI dropdown values; seeded from Excel (BootstrapDropdownData) |
| 69 | PolicyLimitCoverage | Id | bigint IDENTITY | No | Policy | Coverage limits/premiums; 50+ columns; FK to Policy |
| 70 | PolicyMortgage | Id | bigint IDENTITY | No | Policy | Mortgage info on policy; IsDeleted soft-delete; RecordNumber |
| 71 | PolicyPaymentTransaction | Id | bigint IDENTITY | No | Policy | Payment installments; FK via PolicyPremiumId |
| 72 | PolicyPaymentTransaction_Extended | PolicyPaymentTransactionId | bigint (FK to PPT.Id) | No | Policy | 1:1 extension; tax breakdown fields |
| 73 | PolicyPremium | Id | bigint IDENTITY | No | Policy | Premium record; UNIQUE on PolicyId (1:1 with Policy) |
| 74 | PolicyProduct | Id | bigint IDENTITY | No | Policy | Policy-Product-SubProduct junction |
| 75 | PolicyRiskInformation | Id | bigint IDENTITY | No | Policy | Property risk for HexCat; ApprovalCounter; FloodZone/Elevation |
| 76 | PolicyTransactions | Id | bigint IDENTITY | No | Policy | Transaction timeline; MainPolicyId + RedirectionPolicyId |
| 77 | Producer | Id | bigint IDENTITY | No | Producer | Individual producer; FK to Intermediary; OsUserId |
| 78 | ProducerNonResidentState | Id | bigint IDENTITY | No | Producer | Non-resident state licenses per producer; FK to Producer |
| 79 | ProductDocument | Id | bigint IDENTITY | Yes | Document | Product document config; PlumSailProcessId (Plumsail integration) |
| 80 | Report | Id | bigint IDENTITY | Yes | Reporting | Generated reports; BlobPath; Module + ReportType |
| 81 | RiskAddress | Id | bigint IDENTITY | Yes | Policy | Physical risk location; PolicyId + LocationNumber |
| 82 | SampleTestForHexCat | Id | int IDENTITY | No | Integration | TEST ARTIFACT in production — see RSK-1-0009 |
| 83 | StateSpecificDataTable | Id | bigint IDENTITY | Yes | Policy | State disclaimers, license numbers per state/client |
| 84 | Task | Id | bigint IDENTITY | Yes | Task | Tasks linked to Claims; AssignedTo bigint (User) |
| 85 | TaskAction | Id | bigint IDENTITY | No | Task | Actions on tasks; FK to Task |
| 86 | Template | Id | bigint IDENTITY | Yes | Document | Letter/email templates; TemplateCode; InsuranceType; LineOfBusiness |
| 87 | TemplateDocument | Id | bigint IDENTITY | No | Document | Versioned template files; DocumentFile varbinary; FK to Template |
| 88 | TemplateState | Id | bigint IDENTITY | No | Document | States per template; FK to Template |
| 89 | Witness | Id | bigint IDENTITY | No | Claims | Witnesses to claim incidents; FK to Claim (logical) |
| 90 | Worksheet | Id | bigint IDENTITY | No | Claims Financials | Financial worksheet per claim; Bookingdate; EscalatedTo/By |
| 91 | WorksheetPayment | Id | bigint IDENTITY | No | Claims Financials | Payment lines; FK to Worksheet; PayeeName FK to Payee.Id |
| 92 | WorksheetReserve | Id | bigint IDENTITY | No | Claims Financials | Reserve amounts; FK to Worksheet |

---

## 4. Entity Inventory — InsureEdge_System_DEV (26 Tables)

| # | Table Name | PK | ClientId | Domain | Key Notes |
|---|-----------|-----|----------|--------|-----------|
| 1 | AppScreen | Id | No | Permission | Screen definitions; linked to Module |
| 2 | Client | Id | N/A | Tenant | Master tenant record; ClientCode; NAICCode; OSTenantID |
| 3 | ClientConfig | Id | Yes | Tenant | Client configuration settings |
| 4 | ClientSubscription | Id | Yes | Tenant | Subscription plan per client |
| 5 | Company | Id | Yes | Company | Insurance company; UNIQUE on CompanyCode; FK to Client |
| 6 | Contact | Id | Yes | Company | Company contacts; FK to ClientId and CompanyId |
| 7 | Department | Id | Yes | User Mgmt | Departments implemented as groups |
| 8 | Group | Id | Yes | Permission | User groups; maps to departments |
| 9 | GroupUser | Id | Yes | Permission | Group membership; DepartmentId maps to GroupUser.Id (BR-COM-007) |
| 10 | InsuranceProduct | Id | No | Product | Product configuration; states; rating services |
| 11 | LastProcessedHeavyTimer | Id | No | Platform | Timer tracking; indexed on TimerType |
| 12 | Module | Id | No | Permission | App modules; self-referential via ParentModuleId |
| 13 | Office | Id | Yes | Company | Company offices |
| 14 | Product | Id | No | Product | Product catalog; self-referential via ParentId (hierarchy) |
| 15 | ScreenPermissions | Id | No | Permission | Group-based screen permissions |
| 16 | ClientScreen | Id | Yes | Permission | Client-level screen access |
| 17 | User | Id | Yes | User Mgmt | Users (OutSystems: "User2"); self-FK via ReportsTo; OsUserId |
| 18 | UserPasswordReset | Id | No | Auth | Password reset tokens; 30-min (standard) / 24-hr (onboarding) |
| 19 | UserScreen | Id | Yes | Permission | User-level screen permissions |
| 20 | Address | Id | No | Shared | Addresses for Client, Company, Office, User; 4-column index |
| 21 | UserSystemNotifications | Id | No | Notification | In-app notifications; IsRead; idempotent create |
| 22 | OS_UserConfigurations | Id | No | Config | Per-user UI config (key-value); unique on UserId+ConfigKey |
| 23 | GridDefaultLayouts | Id | No | Config | Per-user grid column layout JSON |
| 24 | ClientLogo | Id | Yes | Tenant | Client logo storage |
| 25 | ClientModuleAccess | Id | Yes | Permission | Module-level access control per client |
| 26 | UserGroupJunction | Id | Yes | Permission | User-group memberships with privileges |

> Note: Tables 21-26 (UserSystemNotifications, OS_UserConfigurations, GridDefaultLayouts, ClientLogo, ClientModuleAccess, UserGroupJunction) are OutSystems-platform-managed tables referenced in application logic (EV-0-0012). Exact DDL was not exported; column schema derived from application code analysis. Confidence: MEDIUM.

---

## 5. Key Relationships

### 5.1 Core Policy Hierarchy

```
Client (System_DEV)
  └── Intermediary (ClientId)
        └── Producer (IntermediaryId)
              └── Account (Intermediary FK, ProducerId)
                    └── Policy (AccountId, ClientId, IntermediaryId, ProducerId)
                          ├── Policy_Extended (PolicyId — 1:1)
                          │     └── Policy_Extended_Binary (PolicyId — 1:1, NO PK)
                          ├── PolicyProduct (PolicyId → Product/SubProduct in System_DEV)
                          ├── PolicyLimitCoverage (PolicyId — wide coverage/premium table)
                          ├── PolicyPremium (PolicyId — UNIQUE — 1:1)
                          │     └── PolicyPaymentTransaction (PolicyPremiumId)
                          │           └── PolicyPaymentTransaction_Extended (Id — 1:1)
                          ├── PolicyCommission (PolicyId)
                          │     └── CommissionPaymentTransaction (PolicyCommissionId)
                          ├── PolicyRiskInformation (PolicyId — HexCat data)
                          ├── HORiskInformation (PolicyId — HO product data)
                          ├── PolicyMortgage (PolicyId)
                          ├── PolicyDocument (PolicyId)
                          ├── RiskAddress (PolicyId)
                          ├── AdditionalInsured (PolicyId)
                          ├── AdditionalOrganisation (PolicyId)
                          └── CancellationPaymentTransaction (PolicyId)
```

### 5.2 Core Claim Hierarchy

```
Policy
  └── Claim (PolicyId, ClientId)
        ├── Claimant (ClaimId → AdditionalInsured / AdditionalOrganisation)
        ├── ClaimImpactedCoverage (ClaimId → ClaimCoverage config)
        │     └── ClaimImpactedCoverageAsset (ClaimImpactedCoverageId)
        ├── ClaimMortgage (ClaimId)
        ├── ClaimDocument (ClaimId)
        ├── ClaimReport (ClaimId)
        ├── ClaimEscalation (ClaimId)
        ├── ClaimLetter (ClaimId)
        ├── LossExposure (ClaimId)
        │     ├── LossExposureDamage (LossExposureId)
        │     └── LossExposureServicedetail (LossExposureId)
        ├── Worksheet (ClaimId)
        │     ├── WorksheetPayment (WorksheetId → Payee)
        │     │     └── PaymentSuperseding (WorksheetPaymentId → CauseOfLossDescription)
        │     └── WorksheetReserve (WorksheetId)
        └── Task (ClaimId)
              └── TaskAction (TaskId)
```

### 5.3 Deductible Configuration Hierarchy

```
ClaimCoverage (ClientId-scoped config)
  ├── CauseOfLossDescription (ClaimCoverageId — deductible rules; FK to ClaimCoverage x2)
  ├── CauseOfLossGroup (ClaimCoverageId)
  │     └── CauseOfLossGroupDescription (CauseOfLossGroupId + CauseOfLossDescriptionId)
  └── ClaimCoverageLimit (ClaimCoverageId — tiered limits; FK to ClaimCoverage x5)
```

### 5.4 Producer / Intermediary Hierarchy

```
Intermediary (ClientId)
  ├── IntermediaryContact (IntermediaryId)
  ├── IntermediaryCommission (IntermediaryId, CompanyId, ProductId, SubProductId)
  ├── IntermediaryNonResidentState (IntermediaryId)
  ├── IntermediaryProducerAddress (IntermediaryId or ProducerId)
  ├── IntermediaryProducerLogo (IntermediaryId or ProducerId)
  └── Producer (IntermediaryId)
        ├── ProducerNonResidentState (ProducerId)
        ├── IntermediaryProducerAddress (ProducerId)
        └── IntermediaryProducerLogo (ProducerId)
```

### 5.5 Cross-Database Relationships (Logical, No Constraint)

| Child Table (InsureEdge_DEV) | Child Column | Parent Table (InsureEdge_System_DEV) | Parent Column |
|-------------------------------|--------------|--------------------------------------|---------------|
| Policy | ClientId | Client | Id |
| Account | ClientId | Client | Id |
| Claim | ClientId | Client | Id |
| Adjuster | OsUserId | User | Id |
| Producer | OsUserId | User | Id |
| PolicyProduct | ProductId, SubProductId | Product | Id |
| IntermediaryCommission | CompanyId | Company | Id |
| ClaimAuthority | UserId | User | Id |
| Any "CreatedBy/UpdatedBy" | bigint | User | Id |

---

## 6. Data Dictionary — 10 Central Tables

### 6.1 Policy (InsureEdge_DEV)

OutSystems alias: **Policy2** | PKs: Id | Has ClientId: Yes

| Column | SQL Type | Nullable | Description |
|--------|----------|----------|-------------|
| Id | bigint IDENTITY | NOT NULL | Primary key |
| ClientId | bigint | NOT NULL | Tenant discriminator |
| QuoteNumber | nvarchar(50) | NULL | 11-digit zero-padded sequential (per ClientId); format "00000000001" |
| PolicyNumber | nvarchar(50) | NULL | Assigned on issuance |
| PolicyStatus | nvarchar(50) | NULL | Current workflow status |
| PolicyStage | nvarchar(50) | NULL | QUOTE, RENEWALBUSINESS, RENEWALINDIVIDUAL |
| PolicyType | nvarchar(50) | NULL | NEWBUSINESS, NEWBUSINESSINDIVIDUAL, RENEWALINDIVIDUAL, RENEWALBUSINESS, POLICIESINDIVIDUAL, POLICIESBUSINESS, ENDORSEMENTINDIVIDUAL, ENDORSEMENTBUSINESS |
| IntermediaryId | bigint | NULL | FK to Intermediary.Id |
| ProducerId | bigint | NULL | FK to Producer.Id |
| AccountId | bigint | NULL | FK to Account.Id |
| EffectiveDate | date | NULL | Policy effective date |
| ExpiryDate | date | NULL | Policy expiry date |
| WrittingCompany | nvarchar(50) | NULL | Writing company code (TYPO — should be WritingCompany); updated by HexCat SP |
| DoNotRenew | bit | NULL | Renewal suppression flag |
| LockSubmission | bit | NULL | Submission lock flag |
| PolicyIssuedOn | datetime | NULL | Timestamp of issuance |
| LastStep | int | NULL | Workflow step tracker; set to 1 by HexCat approval |
| CreatedBy | bigint | NOT NULL | User.Id who created |
| CreatedOn | datetime | NOT NULL | Creation timestamp |
| UpdatedBy | bigint | NULL | User.Id of last updater |
| UpdatedOn | datetime | NULL | Last update timestamp |

### 6.2 Account (InsureEdge_DEV)

| Column | SQL Type | Nullable | Description |
|--------|----------|----------|-------------|
| Id | bigint IDENTITY | NOT NULL | Primary key; self-FK (FK_Account_Account) |
| ClientId | bigint | NOT NULL | Tenant discriminator |
| AccountCode | nvarchar(50) | NULL | Business account identifier |
| AccountType | nvarchar(50) | NULL | INDIVIDUAL or BUSINESS |
| FirstName | nvarchar(50) | NULL | Personal account first name |
| LastName | nvarchar(50) | NULL | Personal account last name |
| LegalBusinessName | nvarchar(100) | NULL | Business account legal name |
| DateOfBirth | date | NULL | For individual accounts |
| Intermediary | bigint | NULL | FK to Intermediary.Id (FK_Account_Intermediary) |
| ProducerId | bigint | NULL | FK to Producer.Id |
| IsDraft | bit | NULL | Draft/saved status |
| CreatedBy | bigint | NOT NULL | Audit |
| CreatedOn | datetime | NOT NULL | Audit |
| UpdatedBy | bigint | NULL | Audit |
| UpdatedOn | datetime | NULL | Audit |

### 6.3 Claim (InsureEdge_DEV)

| Column | SQL Type | Nullable | Description |
|--------|----------|----------|-------------|
| Id | bigint IDENTITY | NOT NULL | Primary key |
| ClientId | bigint | NOT NULL | Tenant discriminator |
| PolicyId | bigint | NOT NULL | FK to Policy.Id (logical — no DB constraint declared here) |
| ClaimNumber | nvarchar(50) | NULL | Human-readable claim reference |
| RiskLocationId | bigint | NULL | FK to RiskAddress.Id |
| Status | nvarchar(50) | NULL | Claim workflow status |
| AdjusterId | bigint | NULL | FK to Adjuster.Id (external adjuster) |
| AssignedTo | bigint | NULL | FK to User.Id in System_DEV (internal staff assignment) |
| Stage | nvarchar(50) | NULL | Claim lifecycle stage |
| ClaimType | nvarchar(50) | NULL | Physical damage / personal liability / etc. |
| IncidentSeverity | nvarchar(50) | NULL | Severity classification |
| FraudIndicator | nvarchar(50) | NULL | Fraud risk flag |
| ClaimClosureDate | datetime | NULL | Date closed (NullDate sentinel possible) |
| DateOfLoss | date | NULL | Incident date |
| CatastrophicEvent | nvarchar(50) | NULL | CAT event identifier if applicable |
| ReasonForDenial | nvarchar(max) | NULL | Denial justification text |
| CreatedBy | bigint | NOT NULL | Audit |
| CreatedOn | datetime | NOT NULL | Audit |
| UpdatedBy | bigint | NULL | Audit |
| UpdatedOn | datetime | NULL | Audit |

### 6.4 PolicyLimitCoverage (InsureEdge_DEV)

Wide table (50+ columns). FK to Policy.Id. Key fields:

| Column | SQL Type | Nullable | Description |
|--------|----------|----------|-------------|
| Id | bigint IDENTITY | NOT NULL | Primary key |
| PolicyId | bigint | NOT NULL | FK to Policy.Id |
| TIV | decimal | NULL | Total Insured Value |
| DwellingAssetLimit | decimal | NULL | Dwelling coverage limit |
| BasePremium | decimal | NULL | Premium before modifications |
| RateModification | decimal | NULL | HexCat/underwriter rate mod factor |
| TotalPremiumWithFee | decimal | NULL | Final premium including fees |
| TotalPremiumWithoutRateModification | decimal | NULL | Baseline comparison premium |
| *_EX suffix columns | decimal | NULL | "EX" = prior term / endorsement comparison values |
| EndorsementFlag fields | bit | NULL | Per-coverage endorsement toggles |

### 6.5 PolicyRiskInformation (InsureEdge_DEV)

HexCat integration target table. Key fields:

| Column | SQL Type | Nullable | Description |
|--------|----------|----------|-------------|
| Id | bigint IDENTITY | NOT NULL | Primary key |
| PolicyId | bigint | NOT NULL | FK to Policy.Id |
| Status | nvarchar(50) | NULL | APPROVED / NOT APPROVED / EXPIRED |
| ApprovalCounter | int | NULL | Count of HexCat approvals received |
| ApprovalExpirationDate | datetime | NULL | When current approval expires |
| BuildingFloodElevation | nvarchar(50) | NULL | "-15" sentinel = HexCat flood zone confirmed, elevation unknown |
| FloodZone | nvarchar(50) | NULL | FEMA flood zone classification |
| BuildingType | nvarchar(50) | NULL | |
| ConstructionType | nvarchar(50) | NULL | |
| SquareFootage | nvarchar(50) | NULL | |
| RoofYear | nvarchar(50) | NULL | Note: nvarchar not int — type mismatch risk |
| RoofShape | nvarchar(50) | NULL | |
| YearBuilt | int | NULL | Year of construction |
| ResidenceType | nvarchar(100) | NULL | |
| WritingCompany | nvarchar(50) | NULL | (note: NO typo on this column — only Policy.WrittingCompany has the typo) |
| StatusTimeStamp | datetime | NULL | Last status change timestamp |
| NotApprovedCounter | int | NULL | DEFAULT 0; incremented by ExpireTimer (not by HexCat SP) |

### 6.6 Adjuster (InsureEdge_DEV)

| Column | SQL Type | Nullable | Description |
|--------|----------|----------|-------------|
| Id | bigint IDENTITY | NOT NULL | Primary key |
| ClientId | bigint | NOT NULL | Tenant discriminator |
| OsUserId | bigint | NOT NULL | FK to User.Id in System_DEV (OutSystems user) |
| SSNID | nvarchar(50) | NULL | SSN (sensitive — encryption status unknown) |
| TaxID | nvarchar(50) | NULL | Tax ID (sensitive) |
| Role | nvarchar(50) | NULL | Adjuster role |
| ClaimTypeHandled | nvarchar(max) | NULL | List of claim types this adjuster handles |
| TerritoriesAssigned | nvarchar(max) | NULL | Territory coverage list |
| AdjusterType | nvarchar(50) | NULL | Staff / Independent / Catastrophe |
| AdjusterId | nvarchar(50) | NULL | Secondary business ID code (in addition to PK Id) |
| EmploymentType | nvarchar(50) | NULL | |
| ComplianceFlag | nvarchar(50) | NULL | |

### 6.7 Intermediary (InsureEdge_DEV)

| Column | SQL Type | Nullable | Description |
|--------|----------|----------|-------------|
| Id | bigint IDENTITY | NOT NULL | Primary key |
| ClientId | bigint | NOT NULL | Tenant discriminator |
| IntermediaryCode | nvarchar(50) | NULL | Agency code |
| IntermediaryName | nvarchar(100) | NULL | Agency name |
| Status | nvarchar(50) | NULL | Active/Inactive |
| StatusToggle | bit | NULL | Soft active/inactive toggle |
| FedralTaxId | nvarchar(50) | NULL | Federal Tax ID (note: "Fedral" typo) |
| License | nvarchar(50) | NULL | Primary state license |
| AllowFullProducerVisibility | bit | NULL | Visibility permission flag |
| LastStep | int | NULL | Workflow step tracker |

### 6.8 Client (InsureEdge_System_DEV)

| Column | SQL Type | Nullable | Description |
|--------|----------|----------|-------------|
| Id | bigint IDENTITY | NOT NULL | Primary key — master tenant ID |
| ClientCode | nvarchar(5) | NOT NULL | 5-digit zero-padded code ("00001"–"99999") |
| CompanyName | nvarchar(100) | NULL | Client company name |
| Status | nvarchar(50) | NULL | Active/Inactive |
| NAICCode | nvarchar(10) | NULL | NAIC carrier code |
| FederalTaxID | nvarchar(20) | NULL | Federal Tax ID |
| OSTenantID | bigint | NULL | OutSystems platform tenant ID |
| TelephoneNumber | nvarchar(20) | NULL | |
| EmailId | nvarchar(100) | NULL | |
| ClientURL | nvarchar(200) | NULL | |
| GUID | nvarchar(50) | NULL | External reference GUID |

### 6.9 User / User2 (InsureEdge_System_DEV)

OutSystems alias: **User2**

| Column | SQL Type | Nullable | Description |
|--------|----------|----------|-------------|
| Id | bigint IDENTITY | NOT NULL | Primary key |
| ClientId | bigint | NOT NULL | Tenant discriminator |
| Username | nvarchar(100) | NOT NULL | Login username |
| Password | nvarchar(max) | NULL | Encrypted via OutSystems EncryptPassword; plain-text risk exists (see RSK-1-0007) |
| IsActive | bit | NULL | Active flag |
| TenantId | bigint | NULL | OutSystems platform tenant (TenantId=1 = platform admin) |
| OsUserId | bigint | NULL | OutSystems platform user ID cross-reference |
| ReportsTo | bigint | NULL | Self-FK to User.Id (management hierarchy) |
| FirstName | nvarchar(50) | NULL | |
| LastName | nvarchar(50) | NULL | |
| EmailId | nvarchar(100) | NULL | |

### 6.10 Audits (InsureEdge_DEV)

| Column | SQL Type | Nullable | Description |
|--------|----------|----------|-------------|
| Id | bigint IDENTITY | NOT NULL | Primary key |
| ClientId | bigint | NOT NULL | Tenant discriminator |
| TransactionId | nvarchar(50) | NULL | Business transaction reference |
| ActivityType | nvarchar(50) | NULL | CREATE, UPDATE, DELETE, etc. |
| RecordId | bigint | NULL | ID of affected record; indexed (IX_Table_RecordId) |
| ActivityDescription | nvarchar(max) | NULL | Human-readable description |
| Module | nvarchar(50) | NULL | POLICY, CLAIMS, etc. |
| CreatedBy | bigint | NOT NULL | User.Id; indexed (IX_Table_CreatedBy) |
| CreatedOn | datetime | NOT NULL | Audit creation timestamp (field also observed as CreatedDateTime) |
| AuditBin | varbinary(max) | NULL | Binary audit payload (serialized change data) |
| TableName | nvarchar(100) | NULL | Table affected by the activity |

---

## 7. Persistence Risks Summary

| Risk ID | Severity | Title |
|---------|----------|-------|
| RSK-1-0001 | HIGH | No database-level referential integrity on most DEV relationships |
| RSK-1-0002 | HIGH | Cross-database coupling — both DBs must migrate together |
| RSK-1-0003 | HIGH | Inline varbinary(max) binary storage creates migration volume risk |
| RSK-1-0004 | MEDIUM | Column name typos in production schema affect integration mapping |
| RSK-1-0005 | MEDIUM | OutSystems NullDate sentinel (1900-01-01) must be transformed in migration |
| RSK-1-0006 | MEDIUM | HexCat_RunTime has db_owner — overprivileged on operational database |
| RSK-1-0007 | MEDIUM | Plain-text default password 'Damco@12345' may exist in production |
| RSK-1-0008 | LOW | ORM-managed tables not in DDL present migration blind spots |
| RSK-1-0009 | LOW | SampleTestForHexCat is a test artifact in production |

---

## 8. OutSystems-Specific Data Patterns

| Pattern | Description | Migration Action |
|---------|-------------|-----------------|
| NullDate Sentinel | `convert(datetime, '1900-01-01')` = logical NULL | Transform to NULL in migration scripts |
| OutSystems Entity Aliases | Policy2 = Policy, User2 = User | Map to canonical SQL names |
| ORM-Managed Tables | UserPasswordReset, UserSystemNotifications, OS_UserConfigurations, GridDefaultLayouts not in exported DDL | Obtain full DDL from OutSystems system DB |
| Binary Inline Storage | varbinary(max) inline in multiple tables | Extract to Azure Blob pre-migration |
| Cross-DB Runtime Name | IEDBName site property used in SQL strings | Resolve at migration time; target may merge DBs |
| Default Client ID | ClientId=1 used for platform-level bootstrap data | Preserve or remap during migration |

---

## 9. Stored Procedure and View Inventory

### 9.1 Stored Procedures (InsureEdge_DEV)

| Name | Purpose |
|------|---------|
| usp_UpdateHexCatRiskInfo | Receives TVP HexCatRiskInfoType from HexCat system. Atomically: (1) audits to HexCat_RiskInfo_Audit, (2) updates PolicyRiskInformation with non-null-win logic, (3) sets Policy.WrittingCompany and LastStep=1. |

### 9.2 Views (InsureEdge_DEV — referenced in logic, DDL not fully captured)

| Name | Purpose |
|------|---------|
| vw_HexCatInputRecords | Provides HexCat with current policy risk data for catastrophe modelling; cross-joins to InsureEdge_System_DEV.Company |
| vw_HexCatCompanyReference | Company reference view for HexCat batch submission context |

### 9.3 User-Defined Table Type (InsureEdge_DEV)

| Name | Columns | Purpose |
|------|---------|---------|
| HexCatRiskInfoType | 27 (PolicyId, TIV, Lat/Lng, Rate fields, building attributes, flood data, roof data, etc.) | TVP input for usp_UpdateHexCatRiskInfo; receives HexCat approval batch |

---

## 10. Application Logic Tables (OutSystems ORM — not in DDL export)

These tables are referenced in IE_Common_CS logic (EV-0-0012) and reside in InsureEdge_System_DEV or the OutSystems platform database. They are NOT visible in the exported DDL.

| Table | Location | Purpose | Key Columns (from code analysis) |
|-------|----------|---------|----------------------------------|
| UserPasswordReset | InsureEdgeSYS-LC | Password reset tokens | Code, Username, CreatedOn |
| UserSystemNotifications | InsureEdgeSYS-LC | In-app notifications | UserId, NotificationType, Message, ReferenceId, IsRead |
| OS_UserConfigurations | InsureEdgeSYS-LC | Per-user UI preferences | UserId, ConfigKey, ConfigValue |
| GridDefaultLayouts | InsureEdgeSYS-LC | Per-user grid column layouts | UserId, GridName, LayoutJson |

---

## 11. Business Rules with Data Impact

| Rule ID | Source | Description |
|---------|--------|-------------|
| BR-POL-001 | EV-0-0006 | QuoteNumber: 11-digit zero-padded sequential per ClientId |
| BR-POL-002 | EV-0-0006 | PolicyType enum: 8 values (NEWBUSINESS, NEWBUSINESSINDIVIDUAL, RENEWALINDIVIDUAL, RENEWALBUSINESS, POLICIESINDIVIDUAL, POLICIESBUSINESS, ENDORSEMENTINDIVIDUAL, ENDORSEMENTBUSINESS) |
| BR-POL-003 | EV-0-0006 | Policy.LastStep updated to 1 by HexCat SP on approval |
| BR-FND-0018 | EV-0-0224 | HexCat non-null-win: existing non-null values in PolicyRiskInformation are never overwritten by HexCat data |
| BR-FND-0018b | EV-0-0224 | HexCat flood sentinel: FloodZone<>None AND HexCat elevation null → write '-15' to BuildingFloodElevation |
| BR-COM-001 | EV-0-0012 | Standard password reset token expires 30 minutes after creation |
| BR-COM-002 | EV-0-0012 | Client onboarding reset token expires 24 hours after creation |
| BR-COM-003 | EV-0-0012 | Onboarding token validation checks existence only, not token value |
| BR-COM-004 | EV-0-0012 | Resend rate limit: max 2 active tokens in 30-min window; on success deletes ALL existing tokens |
| BR-COM-005 | EV-0-0012 | UpdateUsersPassword targets Password='Damco@12345' AND IsActive=1 AND TenantId<>1 |
| BR-COM-007 | EV-0-0012 | DepartmentId maps to GroupUser.Id (not GroupUser.GroupId) — departments = groups |
| BR-COM-B01 | EV-0-0012 | PolicyDropdownConfiguration Bootstrap is idempotent: only seeds when table is empty |
| BR-COM-B02 | EV-0-0012 | Bootstrapped dropdown records assigned ClientId=1 (platform defaults) |
| BR-COM-C01 | EV-0-0012 | ClientCode: 5-digit zero-padded sequential auto-generated on new client creation |

---

*End of ART-1-001 Data Catalogue*
*Produced by @data agent — INSUREEDGE-2026 SCAN Phase — 2026-06-16*
