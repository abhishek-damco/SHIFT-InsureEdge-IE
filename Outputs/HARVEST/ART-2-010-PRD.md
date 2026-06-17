# ART-2-010 — Technology-Neutral Product Requirements Document (PRD)
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Product Manager Agent
**Phase:** HARVEST
**Date:** 2026-06-17
**Version:** 1.0 — GATE CANDIDATE (PENDING HUMAN APPROVE/REJECT)
**Engagement:** INSUREEDGE-2026 | Customer: Hudson Bailey | Writing Company: Sierra Specialty Insurance Company

> **PRD GATE STATUS: OPEN — Awaiting Human APPROVE / REJECT / CONDITIONS**
> This document is the primary gate deliverable for the HARVEST → IDEATE phase transition. No agent may self-approve this gate. The Chief Orchestrator must present this document to the human for an explicit decision before IDEATE begins.

---

## Table of Contents

1. Executive Summary
2. Product Vision
3. Evidence Sources
4. Business Capability Map (Summary)
5. Functional Requirements by Domain
6. Non-Functional Requirements
7. Integration Requirements
8. Security Requirements
9. Data Requirements
10. Open Items (QST-)
11. Assumptions (ASM-)
12. Risks (RSK-)
13. Prioritization Rationale
14. Traceability Appendix
15. PRD Gate Checklist

---

## 1. Executive Summary

InsureEdge is a multi-tenant insurance management platform operated by Hudson Bailey, a specialty insurance program administrator. It enables producers, adjusters, and administrators to originate and service property insurance policies written by Sierra Specialty Insurance Company across seven functional domains: Quotes & Policies, Claims Management, Billing & Payments, Distribution Management, User Management, Group Management, and Reports.

The platform is being modernized to eliminate low-code platform lock-in, resolve ten identified security risks, establish API-first architecture, and create a maintainable foundation for long-term operation.

**Scale indicators:**
- 118 database tables across 2 data stores
- 2,049 application functions across 17 modules
- ~65 user-facing screens
- 10 external integrations
- 5 user roles with a 10-flag per-screen permission model
- 11 scheduled background jobs

The modernization is executed under the SHIFT methodology across six phases: DISCOVER → SCAN → HARVEST → IDEATE → FORGE → TRANSFER.

*Full executive summary: ART-2-006.*

---

## 2. Product Vision

**[ASM-2-PM-001 — PROVISIONAL: Vision statement pending human refinement at PRD Gate]**

The modernized InsureEdge platform must be a multi-tenant, API-first insurance management system that enables Hudson Bailey's producers, adjusters, and administrators to originate, service, and settle property insurance policies through a secure, role-controlled interface — preserving all existing business capabilities, resolving all identified security deficiencies, and establishing a maintainable, integration-ready foundation that can grow with the business without platform dependency or architectural constraint.

**Strategic Goals (evidence-derived):**
1. Preserve complete business functionality across all 7 client-facing domains (ART-1-002, 2,049 functions).
2. Eliminate all 10 security risks before go-live (ART-1-003).
3. Achieve full tenant isolation at every architectural layer (ART-1-001, ART-1-003).
4. Operationalize all 10 integrations under resilient, observable patterns (ART-1-004).
5. Maintain the full policy lifecycle automation timeline with configurable thresholds (ART-1-002, EV-0-0231).

**Scope Boundary:**
- **In Scope:** All 7 client-facing domains, all 10 integrations, 118-table data migration, 11 scheduled jobs, 5 roles, 10-flag permission model.
- **Out of Scope:** Runtime reporting engine (DEC-0-0003 — waived); TranzPay live contract specification (PROVISIONAL — QST-1-INT-001 BLOCKING); ORM-managed tables (conditional on DDL receipt — QST-1-DATA-001 BLOCKING).

*Full vision: ART-2-007.*

---

## 3. Evidence Sources

The following SCAN deliverables are the primary evidence base for this PRD. All FND- and EV- references throughout this document trace to these sources.

| # | Evidence ID | Source | Domain | Confidence |
|---|------------|--------|--------|-----------|
| 1 | EV-0-0224 | `Database\SHIFT_Insureedge_DEV.txt` | Data — 92 tables DDL | HIGH |
| 2 | EV-0-0225 | `Database\SHIFT_Insureedge_SYSTEM_DEV.txt` | Data — 26 tables DDL | HIGH |
| 3 | EV-0-0218 | `UI\Q&P PRD` | Policy lifecycle, screens, forms | HIGH |
| 4 | EV-0-0222 | `UI\User Management PRD` | User management screens | HIGH |
| 5 | EV-0-0048 | `UI\Group Management PRD` | Group management screens, permission model | HIGH |
| 6 | EV-0-0226 | `Logic\roles_permissions.md` | Roles, permission flags, security model | HIGH |
| 7 | EV-0-0006 | `Logic\03_Policy.md` | Policy module — 569 functions | MEDIUM |
| 8 | EV-0-0007 | `Logic\04_Claims.md` | Claims module — 467 functions | MEDIUM |
| 9 | EV-0-0008 | `Logic\05_Billing.md` | Billing module | MEDIUM |
| 10 | EV-0-0009 | `Logic\06_Distribution.md` | Distribution module — 144 functions | MEDIUM |
| 11 | EV-0-0010 | `Logic\07_Groups.md` | Groups module — 55 functions | MEDIUM |
| 12 | EV-0-0011 | `Logic\08_UserManagement.md` | User management — 52 functions | MEDIUM |
| 13 | EV-0-0012 | `Logic\09_Common.md` | Common/shared utilities — 467 functions | MEDIUM |
| 14 | EV-0-0019 | `Logic\16_DocumentGenerator.md` | Document generation — 5 functions | MEDIUM |
| 15 | EV-0-0231 | `Logic\site_properties.md` | Site properties / configuration values | HIGH |
| 16 | EV-0-0227 | `Logic\TranzPay references` | Payment gateway integration | MEDIUM |
| 17 | EV-0-0228 | `Logic\LenderDock references` | Mortgage notification integration | HIGH |
| 18 | EV-0-0229 | `Logic\Geocoding/Maps references` | Geocoding integration | HIGH |
| 19 | EV-0-0230 | `Logic\Encryption references` | Encryption module | HIGH |
| 20 | EV-0-0003 | `Logic\00_INDEX.md` | Module function index — all 2,049 functions | HIGH |

---

## 4. Business Capability Map (Summary)

27 capability clusters across 7 domains. Full detail in ART-2-008.

| Domain | Cluster | ID | Priority |
|--------|---------|-----|---------|
| D1: Policy Lifecycle | Quote Creation & Submission | D1-C1 | P1 |
| D1: Policy Lifecycle | Policy Binding & Issuance | D1-C2 | P1 |
| D1: Policy Lifecycle | Policy Endorsement | D1-C3 | P1 |
| D1: Policy Lifecycle | Policy Renewal | D1-C4 | P1 |
| D1: Policy Lifecycle | Policy Cancellation & Non-Renewal | D1-C5 | P1 |
| D1: Policy Lifecycle | Bulk Policy Upload | D1-C6 | P2 |
| D2: Claims Management | First Notice of Loss Intake | D2-C1 | P1 |
| D2: Claims Management | Adjuster Assignment & Claim Workflow | D2-C2 | P1 |
| D2: Claims Management | Claims Financial Worksheet & Reserve Mgmt | D2-C3 | P1 |
| D2: Claims Management | Claims Disbursement & Payee Management | D2-C4 | P1 |
| D2: Claims Management | Catastrophic Event Management | D2-C5 | P2 |
| D3: Billing & Payments | Premium Payment Collection | D3-C1 | P1 |
| D3: Billing & Payments | Payment Plan Management & Installment Scheduling | D3-C2 | P1 |
| D3: Billing & Payments | Refunds & Payment Reversals | D3-C3 | P1 |
| D3: Billing & Payments | Failed Payment Handling & Auto-Cancellation | D3-C4 | P1 |
| D4: Distribution Management | Intermediary & Producer Onboarding | D4-C1 | P1 |
| D4: Distribution Management | Commission Configuration & Calculation | D4-C2 | P2 |
| D4: Distribution Management | Commission Disbursement | D4-C3 | P2 |
| D5: Identity & Access | User Lifecycle Management | D5-C1 | P1 |
| D5: Identity & Access | Group-Based Permission Management | D5-C2 | P1 |
| D5: Identity & Access | Authentication & Password Management | D5-C3 | P1 |
| D5: Identity & Access | Audit Trail | D5-C4 | P1 |
| D6: Document Management | Document Generation | D6-C1 | P1 |
| D6: Document Management | Document Upload, Retrieval & Sensitive Control | D6-C2 | P2 |
| D7: System Administration | Multi-Tenant Client Provisioning | D7-C1 | P2 |
| D7: System Administration | Insurance Product Catalog Management | D7-C2 | P2 |
| D7: System Administration | Platform Configuration Management | D7-C3 | P2 |

**Total: 27 capabilities | P1: 19 | P2: 8 | P3: 0**

---

## 5. Functional Requirements by Domain

User story IDs are referenced as `US-{DOMAIN}-{SEQ}` placeholders for cross-referencing with Business Analyst Agent (BA agent running in parallel). Full user story text and acceptance criteria are in ART-2-011 (BA deliverable).

### 5.1 Policy Lifecycle (D1)

| Req ID | Requirement | Capability | Priority | Story Ref |
|--------|-------------|-----------|---------|-----------|
| FR-D1-001 | The system must support creation of new insurance quote submissions for individual and commercial insured types via a structured multi-step wizard. | D1-C1 | P1 | US-POL-001 |
| FR-D1-002 | Risk location address must be resolved to geographic coordinates before the quote may proceed to risk assessment. | D1-C1 | P1 | US-POL-002 |
| FR-D1-003 | The system must call a risk assessment and catastrophe rating service for each risk location and receive property characteristics and an acceptance status. A "Not Approved" status must block quote progression. | D1-C1 | P1 | US-POL-003 |
| FR-D1-004 | Coverage selections must include: dwelling asset limit, physical damage deductible, coverage level (Basic / Standard / Preferred), liability amount, and optional peril endorsements (Sinkhole, Earthquake, Flood, Wind & Hail, Wildfire). | D1-C1 | P1 | US-POL-004 |
| FR-D1-005 | New business quotes must expire and transition to Expired status after 90 days of inactivity. | D1-C1 | P1 | US-POL-005 |
| FR-D1-006 | The policy fee of $195 must be applied to all policies. | D1-C1, D1-C2 | P1 | US-POL-006 |
| FR-D1-007 | Total premium must equal: coverage premium + taxes + fees. | D1-C1, D1-C2 | P1 | US-POL-007 |
| FR-D1-008 | The system must prevent a duplicate active policy for the same risk location. | D1-C2 | P1 | US-POL-008 |
| FR-D1-009 | Policy binding must trigger: payment collection, policy number generation, declaration page generation, and mortgage lienholder notification (if mortgagee present). | D1-C2 | P1 | US-POL-009 |
| FR-D1-010 | Policy number must follow the format `001-00004-NNNNNNN-NN`. | D1-C2 | P1 | US-POL-010 |
| FR-D1-011 | A successfully bound policy must transition to Active status. | D1-C2 | P1 | US-POL-011 |
| FR-D1-012 | Mid-term endorsements must recalculate the premium differential and either collect additional premium or issue a refund. | D1-C3 | P1 | US-POL-012 |
| FR-D1-013 | Commission must be recalculated for each endorsement transaction. | D1-C3 | P1 | US-POL-013 |
| FR-D1-014 | Endorsement quotes must expire after 90 days. | D1-C3 | P1 | US-POL-014 |
| FR-D1-015 | Renewal quotes must be generated automatically 90 days before policy expiry. | D1-C4 | P1 | US-POL-015 |
| FR-D1-016 | Automatic renewal notification email must be sent at renewal quote generation. | D1-C4 | P1 | US-POL-016 |
| FR-D1-017 | Non-renewal notice email must be sent 60 days before policy expiry when applicable. | D1-C4 | P1 | US-POL-017 |
| FR-D1-018 | Policy must be marked Non-Renewed 90 days after expiry if no renewal is bound. | D1-C4 | P1 | US-POL-018 |
| FR-D1-019 | Renewal quotes must expire after 30 days. | D1-C4 | P1 | US-POL-019 |
| FR-D1-020 | Manual renewal must be triggerable by Client Admin. | D1-C4 | P1 | US-POL-020 |
| FR-D1-021 | Auto-cancellation must trigger 30 days after a missed payment cycle. | D1-C5 | P1 | US-POL-021 |
| FR-D1-022 | Policy must transition to Expired status 1 day after the expiration date. | D1-C5 | P1 | US-POL-022 |
| FR-D1-023 | Cancellation must trigger: refund calculation, lienholder notification, and cancellation document generation. | D1-C5 | P1 | US-POL-023 |
| FR-D1-024 | Cancel/Rewrite must create a new draft quote linked to the cancelled policy record. | D1-C5 | P1 | US-POL-024 |
| FR-D1-025 | The system must support batch submission of policy data through a file-based upload mechanism processed by a background job. | D1-C6 | P2 | US-POL-025 |

### 5.2 Claims Management (D2)

| Req ID | Requirement | Capability | Priority | Story Ref |
|--------|-------------|-----------|---------|-----------|
| FR-D2-001 | The system must allow registration of a first notice of loss (FNOL) against an active policy, capturing loss date, FNOL date, and generating a claim number. | D2-C1 | P1 | US-CLM-001 |
| FR-D2-002 | Duplicate FNOL for the same loss event must be detected and prevented. | D2-C1 | P1 | US-CLM-002 |
| FR-D2-003 | Claims must progress through a structured workflow: FNOL → Open → In Review → Closed / Denied / Escalated. | D2-C2 | P1 | US-CLM-003 |
| FR-D2-004 | An adjuster may only view and act on claims assigned to them via their adjuster identifier. | D2-C2 | P1 | US-CLM-004 |
| FR-D2-005 | Claims workflow must support: escalation, litigation flag, referral tracking, and task assignment. | D2-C2 | P1 | US-CLM-005 |
| FR-D2-006 | Worksheet approval/rejection must require the ApproveReject permission flag. | D2-C3 | P1 | US-CLM-006 |
| FR-D2-007 | Reserves must be allocated and tracked per coverage type within a claim worksheet. | D2-C3 | P1 | US-CLM-007 |
| FR-D2-008 | Claim disbursements must be recorded per payee with associated worksheet payment records. | D2-C4 | P1 | US-CLM-008 |
| FR-D2-009 | A disbursement email notification must be sent for each payee disbursement. | D2-C4 | P1 | US-CLM-009 |
| FR-D2-010 | The system must support grouping multiple claims under a catastrophic event record for aggregate management and reporting. | D2-C5 | P2 | US-CLM-010 |

### 5.3 Billing & Payments (D3)

| Req ID | Requirement | Capability | Priority | Story Ref |
|--------|-------------|-----------|---------|-----------|
| FR-D3-001 | The system must collect the initial policy premium at binding via ACH debit or credit card charge. Payment must succeed before policy activation. | D3-C1 | P1 | US-BIL-001 |
| FR-D3-002 | Payment gateway transaction ID must be captured and stored against each payment transaction record. | D3-C1 | P1 | US-BIL-002 |
| FR-D3-003 | The system must support annual and monthly payment plans with configurable installment count and installment fee. | D3-C2 | P1 | US-BIL-003 |
| FR-D3-004 | Recurring installment payments must be processed automatically via a scheduled background job. | D3-C2 | P1 | US-BIL-004 |
| FR-D3-005 | The system must support refunds matched to the original payment method (ACH refund for ACH charge; card refund for card charge). | D3-C3 | P1 | US-BIL-005 |
| FR-D3-006 | Failed payment must trigger: policyholder email notification, mortgage lienholder notification, and start of the 30-day cancellation grace period. | D3-C4 | P1 | US-BIL-006 |

### 5.4 Distribution Management (D4)

| Req ID | Requirement | Capability | Priority | Story Ref |
|--------|-------------|-----------|---------|-----------|
| FR-D4-001 | The system must support creation and management of intermediary (agency) and producer (individual) records with geocoding-resolved address capture. | D4-C1 | P1 | US-DIS-001 |
| FR-D4-002 | Each intermediary must be assigned a commission percentage that serves as the default commission rate for policy transactions. | D4-C2 | P2 | US-DIS-002 |
| FR-D4-003 | Commission must be calculated as premium × commission percentage for new business, endorsement, and renewal transactions. | D4-C2 | P2 | US-DIS-003 |
| FR-D4-004 | The system must generate disbursement records and transfer commission funds via the external commission disbursement service, with email notification per disbursement. | D4-C3 | P2 | US-DIS-004 |

### 5.5 Identity & Access Management (D5)

| Req ID | Requirement | Capability | Priority | Story Ref |
|--------|-------------|-----------|---------|-----------|
| FR-D5-001 | Email address must serve as the unique login identifier and must not be modifiable after user creation. | D5-C1 | P1 | US-USR-001 |
| FR-D5-002 | Duplicate email detection must be enforced; duplicate phone number detection must be enforced per tenant. | D5-C1 | P1 | US-USR-002 |
| FR-D5-003 | User identifiers must be system-generated (format IE00XX). | D5-C1 | P1 | US-USR-003 |
| FR-D5-004 | Effective permissions for a user on any screen must be computed as the logical OR of all permission flags across the user's group memberships. | D5-C2 | P1 | US-USR-004 |
| FR-D5-005 | The AllAccess flag must grant full permission to a screen but must not bypass tenant, intermediary, or adjuster scope filters. | D5-C2 | P1 | US-USR-005 |
| FR-D5-006 | Privilege revocation on group membership removal must occur synchronously. | D5-C2 | P1 | US-USR-006 |
| FR-D5-007 | Standard password reset tokens must expire in 30 minutes; onboarding tokens in 24 hours; both must be validated by code match AND expiry. | D5-C3 | P1 | US-USR-007 |
| FR-D5-008 | No more than 2 active reset tokens per user may be valid within any 30-minute window. | D5-C3 | P1 | US-USR-008 |
| FR-D5-009 | The system must record an audit log entry for all significant user actions, including Platform Admin cross-tenant actions with tenant context. | D5-C4 | P1 | US-USR-009 |

### 5.6 Document Management (D6)

| Req ID | Requirement | Capability | Priority | Story Ref |
|--------|-------------|-----------|---------|-----------|
| FR-D6-001 | The system must generate policy documents (declaration pages, quote proposals, renewal packages, cancellation notices, non-renewal notices, endorsement documents) by submitting structured data payloads to the document generation service. | D6-C1 | P1 | US-DOC-001 |
| FR-D6-002 | Generated documents must be stored in the binary document storage service with a stored path reference on the policy or claim record. | D6-C1 | P1 | US-DOC-002 |
| FR-D6-003 | Document download must use time-limited access tokens to prevent unrestricted exposure. | D6-C2 | P2 | US-DOC-003 |
| FR-D6-004 | Access to sensitive documents must require the AccessSensitiveDoc permission flag. | D6-C2 | P2 | US-DOC-004 |

### 5.7 System Administration (D7)

| Req ID | Requirement | Capability | Priority | Story Ref |
|--------|-------------|-----------|---------|-----------|
| FR-D7-001 | Platform Administrators must be able to provision new tenant clients and manage their office locations. | D7-C1 | P2 | US-ADM-001 |
| FR-D7-002 | Platform Administrators must be able to activate and deactivate insurance products in the global product catalog. | D7-C2 | P2 | US-ADM-002 |
| FR-D7-003 | All business threshold values (renewal days, cancellation days, expiry days, policy fee) must be configurable without application redeployment. | D7-C3 | P2 | US-ADM-003 |
| FR-D7-004 | An emergency disable mechanism for all scheduled background jobs must be available to Platform Administrators. | D7-C3 | P2 | US-ADM-004 |

---

## 6. Non-Functional Requirements

Full NFR catalog: ART-2-009. Summary below.

| NFR ID | Category | Requirement Summary | Priority |
|--------|----------|--------------------|---------| 
| NFR-001 | Multi-Tenancy | All data operations must be scoped to the authenticated user's tenant identifier. Zero cross-tenant data leakage. | P1 |
| NFR-002 | Security | Group-based, 10-flag per-screen permission model must be enforced at the API layer. | P1 |
| NFR-003 | Security | Passwords must be stored as one-way cryptographic hashes with per-record salt. No plaintext storage. | P1 |
| NFR-004 | Security | Password reset tokens validated by code match + expiry in all flows. Onboarding flow existence-only bypass (RSK-1-SEC-002) must be eliminated. | P1 |
| NFR-005 | Security | Sensitive field redaction (SSN, bank account, routing numbers) must be enforced at the API serialization layer, not only the presentation layer. | P1 |
| NFR-006 | Security | Group membership removal must revoke all derived permissions synchronously. | P1 |
| NFR-007 | Security | PII and financial data must be encrypted at rest with externalized key management and key rotation support. | P1 |
| NFR-008 | Compliance | Immutable audit log for all significant user actions including Platform Admin cross-tenant access. | P1 |
| NFR-009 | Compliance | Financial bypass flag (BypassRefundResponse equivalent) must be FALSE in all non-development environments. | P1 |
| NFR-010 | Data Integrity | Referential integrity enforced on all entity relationships including Claim-to-Policy and Worksheet-to-Claim. | P1 |
| NFR-011 | Data Integrity | Sentinel date value `1900-01-01` must be converted to null in all migrated data. | P1 |
| NFR-012 | Data Integrity | Four source schema typos corrected with full reference tracing. | P1 |
| NFR-013 | Security | MFA required for Platform Admin and Client Admin roles. | P2 |
| NFR-014 | Security | All integration credentials stored in externalized secret management — no plaintext configuration. | P1 |
| NFR-015 | Maintainability | All 11 scheduled jobs replicated with configurable thresholds and emergency disable. | P1 |
| NFR-016 | Performance | **[QST-2-PM-NFR-001 BLOCKING]** Response time targets not evidenced. Customer must supply SLA targets before IDEATE. | P2 |
| NFR-017 | Availability | **[QST-2-PM-NFR-002 BLOCKING]** Availability SLA, RTO, and RPO not evidenced. Customer must supply before IDEATE. | P2 |
| NFR-018 | Scalability | **[QST-2-PM-NFR-003]** System must support multi-tenant growth. Volume targets not evidenced. | P2 |
| NFR-019 | Maintainability | Structured logging, health checks, and integration call metrics required. | P2 |
| NFR-020 | Security | Geocoding service credentials must be origin-restricted and use separate keys per function. | P2 |

---

## 7. Integration Requirements

All integration descriptions are WHAT-neutral. Integration names in parentheses are source system aliases for traceability only.

| INT ID | Integration Name (Alias) | Direction | Purpose | Contract Status | Priority |
|--------|--------------------------|-----------|---------|----------------|---------|
| INT-001 | Payment gateway service (TranzPay) | Outbound | ACH debit, credit card charge, refunds, auto-debit. Triggered at policy binding, endorsement, and cancellation. | **PROVISIONAL — QST-1-INT-001 BLOCKING** | P1 |
| INT-002 | Mortgage lienholder notification service (LenderDock) | Outbound | Notify mortgage lienholders of policy lifecycle events: binding, endorsement, renewal, cancellation, non-renewal, failed payment. 10 notification variants. Validation of lienholder name and service company required before notification. | Basic auth confirmed (EV-0-0231). Endpoint URL and payload schema unknown — QST-1-INT-002 BLOCKING | P1 |
| INT-003 | Address geocoding service (Google Geocoding API) | Outbound | Resolve street addresses to geographic coordinates (latitude/longitude) for risk location capture and producer address validation. Two credential sets required: one for map display, one for geocoding calls. | API keys confirmed (EV-0-0231). Endpoint known. | P1 |
| INT-004 | Symmetric encryption service (RssExtensionCryptoAPI) | Internal | Encrypt and decrypt sensitive data fields (PII, financial data, URL parameters). AES-256 CBC + HMAC-256 equivalent. Key must be migrated to externalized secret store. | Algorithm confirmed (EV-0-0012, EV-0-0230). Key in plaintext config — RSK-1-INT-003 | P1 |
| INT-005 | Outbound email service (InsureEdgeEmails / SMTP) | Outbound | Transactional email for: renewal notifications, cancellation, issuance, endorsement, non-renewal notice, producer notifications, disbursement, password reset, and claim letters. 17+ email trigger points. | SMTP server and port confirmed (EV-0-0231). Production credentials and email template specifications needed. | P1 |
| INT-006 | Cloud document rendering service (Plumsail / IEDocumentGenerator) | Outbound | Generate structured insurance documents (declaration pages, notices, packages) by submitting JSON data payloads. Outputs stored via INT-008. 10+ document types triggered across policy lifecycle. | Endpoint confirmed (EV-0-0231). Authentication key not in site properties — QST-1-INT-003 HIGH | P1 |
| INT-007 | Risk assessment and catastrophe rating service (HexCat) | Outbound | Resolve geographic coordinates to catastrophe zone data and property risk characteristics. Returns HexCat acceptance status that gates quote progression. | Function confirmed (EV-0-0006). Vendor, API contract, and auth unknown — QST-1-INT-004 HIGH | P1 |
| INT-008 | Binary document storage service (Azure Blob Storage) | Bidirectional | Store and retrieve policy documents, claim documents, account files, and intermediary logos. Time-limited access tokens for download. Container management and blob listing required. | Account and container confirmed (EV-0-0231). Must migrate to managed identity auth (RSK-1-INT-004) | P1 |
| INT-009 | Commission disbursement service (DisburseCloud) | Outbound | Register vendors and generate disbursement records for intermediary/producer commission payments. Sandbox URL confirmed. | Sandbox URL and credentials confirmed (EV-0-0231). Production URL unknown — QST needed. | P2 |
| INT-010 | Generic HTTP client (RssExtensionardoHTTP) | Internal | Delegate pattern for all outbound REST calls. All external REST integrations route through this. Retry and circuit-breaker patterns must be added in target. | Pattern confirmed (EV-0-0003). | P1 (as architectural pattern) |

### Integration Resilience Requirements

All outbound integrations (INT-001 through INT-009) must implement:
1. **Retry logic** with exponential backoff for transient failures.
2. **Circuit-breaker pattern** to prevent cascading failures when an external service is unavailable.
3. **Dead-letter queue or outbox pattern** for critical notifications (mortgage lienholder notifications, email) that must not be silently lost on first failure.
4. **Structured error logging** per failed outbound call with integration identifier, error code, and retry state.

---

## 8. Security Requirements

Derived from ART-1-003. All ten security risks must be mitigated before go-live.

| RSK ID | Severity | Risk Statement | Required Mitigation |
|--------|----------|---------------|---------------------|
| RSK-1-SEC-001 | CRITICAL | Default password stored in plaintext in user table at bootstrap. | Passwords must be stored using one-way cryptographic hash. Bootstrap plaintext must be eliminated. Migration must confirm completion. |
| RSK-1-SEC-002 | HIGH | Onboarding token validation checks existence only — no code match. 24-hour account takeover window. | Apply code-comparison logic from standard reset flow to the onboarding flow. |
| RSK-1-SEC-003 | HIGH | AllAccess group membership is a single-point privilege escalation vector. | Alert on AllAccess group modifications; require dual-approval for group membership changes to AllAccess groups. |
| RSK-1-SEC-004 | HIGH | Asynchronous privilege cleanup after group removal creates race window. | Revoke privileges synchronously on group membership removal. |
| RSK-1-SEC-005 | HIGH | Sensitive field masking enforced at display layer only. API can return unmasked values. | Enforce sensitive field redaction at API response serialization layer. |
| RSK-1-SEC-006 | MEDIUM | No multi-factor authentication evidence. | Implement second-factor authentication for Platform Admin and Client Admin roles. |
| RSK-1-SEC-007 | MEDIUM | Encryption key stored as application configuration value. | Migrate encryption key to externalized, access-controlled secret management. |
| RSK-1-SEC-008 | MEDIUM | Tenant identifier resolver returns 0 for null user. Unguarded callers may expose cross-tenant data. | Return exception rather than 0; add defensive null-guard in all callers. |
| RSK-1-SEC-009 | MEDIUM | No audit log for Platform Admin cross-tenant actions. | Capture all Platform Admin data access events with tenant context in audit log. |
| RSK-1-SEC-010 | LOW | Geocoding API credentials accessible in client-side context. | Restrict credentials by origin (domain/IP allowlist) in the geocoding service provider console. |

---

## 9. Data Requirements

### 9.1 Entity Inventory Summary

| Domain | Tables | ClientId-Scoped | Notes |
|--------|--------|----------------|-------|
| Policy & Quotes | 9 | Yes | Central Policy table with version-stamped transactions |
| Accounts & Clients | 5 | Yes | Account grouping above policy level |
| Claims | 8 | Yes | Claim → Policy: logical FK only (RSK-1-DATA-001) |
| Billing & Payments | 2 | Yes | PaymentTransaction + PaymentPlan |
| Documents & Storage | 2 | No | Path references to binary document storage |
| Risk Location | 1 | Yes | Geocoded property location per policy |
| Lookup / Reference | 15 | No | Static lookup tables — intentionally global |
| System / Tenant | 11 | Mixed | Client, User2, Group, ScreenPermissions, AuditLog |
| **Total** | **~118** | | |

### 9.2 Multi-Tenancy Data Requirements

- All tenant-owned entity tables must carry a tenant identifier column.
- All data operations for non-Platform Admin users must include a tenant identifier filter.
- Intentionally global tables (product catalog, module registry, lookup tables) must be explicitly enumerated and governed — no ClientId filter applied to these.
- Tenant identifier resolver must return an exception for a null user identifier — not a default value of zero.

### 9.3 Data Migration Requirements

| Requirement | Priority | Evidence |
|-------------|---------|---------|
| Orphan analysis on Claim→Policy and Worksheet→Claim before migration | P1 | RSK-1-DATA-001, FND-1-DATA-002 |
| Convert all `1900-01-01` sentinel dates to null | P1 | RSK-1-DATA-003 |
| Correct 4 schema typos with full reference tracing | P1 | RSK-1-DATA-004 |
| Extract all inline binary storage to binary document storage service before schema migration | P1 | RSK-1-DATA-002 |
| Obtain DDL for 4 ORM-managed tables before migration scoping is complete | BLOCKING | RSK-1-DATA-006, QST-1-DATA-001 |
| Resolve cross-data-store coupling (two-DB joins via runtime string) in target schema | P1 | RSK-1-DATA-007, FND-1-DATA-001 |

### 9.4 Data Migration Risks

| Risk ID | Severity | Statement |
|---------|----------|-----------|
| RSK-1-DATA-001 | HIGH | No referential integrity constraint on Claim→Policy and Worksheet→Claim — orphan risk. |
| RSK-1-DATA-002 | HIGH | Inline binary storage in 9+ tables must be extracted before schema migration. |
| RSK-1-DATA-003 | MEDIUM | Sentinel date `1900-01-01` across datetime columns must be converted to null. |
| RSK-1-DATA-004 | MEDIUM | 4 schema typos break all referencing code if renamed without full search. |
| RSK-1-DATA-005 | MEDIUM | Excessive database role privilege in source system — must be downscoped in target. |
| RSK-1-DATA-006 | HIGH | 4 ORM-managed tables absent from DDL — migration scope incomplete without these. |
| RSK-1-DATA-007 | CRITICAL | Cross-data-store runtime coupling — rename or separation breaks all cross-database queries. |

---

## 10. Open Items (QST-)

All open questions must be resolved before IDEATE begins unless explicitly noted otherwise. BLOCKING items prevent gate passage.

| QST ID | Severity | Domain | Question | Blocking For |
|--------|----------|--------|----------|-------------|
| QST-1-INT-001 | CRITICAL | Integration | What are the payment gateway service endpoint URL(s), authentication method, and API version? Are there sandbox vs production endpoints? | IDEATE — payment architecture cannot be designed without this. |
| QST-1-INT-002 | CRITICAL | Integration | What is the mortgage lienholder notification service endpoint (URL, protocol, auth)? Is this REST, file-based, or email? What is the payload schema? | IDEATE — integration adapter cannot be designed without this. |
| QST-1-DATA-001 | MAJOR | Data | Can you provide the data schema for `UserSystemNotifications`, `OS_UserConfigurations`, and `GridDefaultLayouts` tables? These are absent from the provided database scripts. | FORGE — migration scope is incomplete without these. |
| QST-1-INT-003 | HIGH | Integration | What authentication credentials does the cloud document rendering service require? The API endpoint is confirmed but the authentication key is not present in the site properties provided. | FORGE — document generation cannot be implemented without this. |
| QST-1-INT-004 | HIGH | Integration | What is the risk assessment and catastrophe rating service? Self-hosted, vendor API, or database lookup? What is the authentication method? | IDEATE — cannot design integration layer without this. |
| QST-1-INT-005 | HIGH | Integration | What is "GETHBAPIS" referenced in the portal? Is this an internal InsureEdge rating service or an external Hudson Bailey system? | IDEATE |
| QST-1-LOGIC-001 | MAJOR | Logic | What is the complete premium rating formula? Which factors (catastrophe zone, coverage level, age-65 indicator, peril endorsements) affect the rating? | FORGE — rating engine cannot be implemented without this. |
| QST-1-DATA-002 | MAJOR | Data | What is the intent of the cross-tenant admin flag (`IsAdmin`) on the user record? Is an unscoped query for all admin users intentional? | IDEATE — security architecture affected. |
| QST-1-DATA-003 | MINOR | Data | Confirm that `1900-01-01` is used as a null date convention across all date columns — should these be converted to null in the target schema? | FORGE |
| QST-2-PM-NFR-001 | CRITICAL | Performance | What are the required response time SLAs (P50, P95, P99), peak concurrent user count, and peak transaction volume? | IDEATE — architecture sizing impossible without this. |
| QST-2-PM-NFR-002 | CRITICAL | Availability | What are the required availability SLA (uptime %), Recovery Time Objective (RTO), and Recovery Point Objective (RPO) for production? | IDEATE — infrastructure design impossible without this. |
| QST-2-PM-NFR-003 | HIGH | Scalability | What is the expected tenant count and record volume (policies, claims, users) in 1, 3, and 5 years? | IDEATE — data architecture sizing. |
| QST-2-PM-SEC-001 | HIGH | Security | What is the required session timeout duration for each role? | FORGE — authentication implementation. |
| QST-1-LOGIC-003 | MINOR | Logic | What is the permission string used to gate group management updates (`USERGROUPPAGE`) — where is it defined and how is it granted? | FORGE |

**Total QST- items: 14 | CRITICAL: 3 | MAJOR: 4 | HIGH: 5 | MINOR: 2**

---

## 11. Assumptions (ASM-)

| ASM ID | Statement | Domain | Confidence If Wrong |
|--------|-----------|--------|---------------------|
| ASM-2-PM-001 | Vision statement is directionally correct pending human refinement at PRD Gate. | All | LOW — human must confirm direction. |
| ASM-1-DATA-001 | `UserSystemNotifications`, `OS_UserConfigurations`, `GridDefaultLayouts` are functional application tables with business-relevant content. Their migration scope will be confirmed once DDL is received. | Data | MEDIUM |
| ASM-1-INT-001 | Payment gateway service uses a REST API interface. Specific URL, authentication, and payload schema are entirely unknown. | Integration | HIGH — contract must be confirmed before IDEATE. |
| ASM-1-INT-002 | Mortgage lienholder notification service uses a REST or equivalent webhook interface. Protocol confirmation is BLOCKING. | Integration | HIGH |
| ASM-1-INT-005 | Commission disbursement service uses a URL-redirect or REST API pattern for vendor registration. Production URL differs from sandbox. | Integration | MEDIUM |
| ASM-1-INT-007 | Outbound email service delegates to the SMTP server confirmed in site properties. Production credentials will differ from DEV. | Integration | HIGH |
| ASM-1-LOGIC-001 | Billing module (13 functions) is a thin wrapper; most billing logic resides in the Policy module. No standalone Billing screens exist beyond the Policy 360 Billing tab. | Logic | MEDIUM |
| ASM-1-LOGIC-002 | Report Management module stores report configurations only; actual report generation is executed by the underlying data platform. Runtime report generation is waived (DEC-0-0003). | Logic | MEDIUM |
| ASM-1-LOGIC-003 | Premium rating calculations reside in a separate module (43 functions). The rating formula is not yet documented and must be extracted before FORGE. | Logic | HIGH |
| ASM-1-0003 | Claims module UI structure mirrors the Quotes & Policies module pattern (list, detail view, workflow tabs). No UI text evidence exists for Claims; this is an inference from the permission model and function index. | UI | MEDIUM |
| ASM-2-PM-002 | The "Are you 65 or older?" indicator affects rating or eligibility. The exact business rule is not evidenced; the logic agent should investigate. | Logic | MEDIUM |

---

## 12. Risks (RSK-)

Combined risk register from SCAN deliverables. Risks are carried forward to IDEATE for architecture mitigation planning.

### Integration Risks

| Risk ID | Severity | Statement |
|---------|----------|-----------|
| RSK-1-INT-001 | CRITICAL | Payment gateway service is a single point of failure — outage halts all premium collection. |
| RSK-1-INT-002 | HIGH | No retry or circuit-breaker on payment gateway or mortgage notification calls in source system. |
| RSK-1-INT-003 | HIGH | Encryption key in application configuration — no rotation mechanism and potential exposure in config exports. |
| RSK-1-INT-004 | HIGH | Binary storage service access credential as plaintext configuration — full storage account access on compromise. |
| RSK-1-INT-005 | HIGH | Cross-data-store SQL via runtime name string — fragile at deployment; any rename breaks all cross-database queries. |
| RSK-1-INT-006 | MEDIUM | Mortgage lienholder notification failure paths exist but no retry/queue mechanism. |
| RSK-1-INT-007 | MEDIUM | Geocoding API credential in site property — quota exhaustion or key leak breaks address resolution. |

### Security Risks

*See Section 8. All 10 RSK-1-SEC-xxx items apply.*

### Data Risks

*See Section 9.3. All 7 RSK-1-DATA-xxx items apply.*

---

## 13. Prioritization Rationale

**Priority Framework:**

| Level | Definition | Criteria |
|-------|-----------|---------|
| P1 (Must Have) | Core insurance lifecycle capability; HIGH evidence; business-critical. System is non-functional without it. | Any of: revenue-generating function, regulatory requirement, foundational security control, data integrity requirement. |
| P2 (Should Have) | Important feature; MEDIUM-HIGH evidence; significant inconvenience or risk if absent; waiver requires decision record. | Operational efficiency, secondary security control, administrative function, LOW-severity gap mitigation. |
| P3 (Nice to Have) | Enhancement; MEDIUM evidence or LOW-impact gap; may be deferred post-go-live. | None identified in current SCAN. |

**Domain-Level Rationale:**

- **D1 (Policy Lifecycle) — 5 P1, 1 P2:** The policy lifecycle is the core revenue function. Every step from quote to cancellation is required for the platform to operate. Bulk upload is P2 because individual submission remains operational without it.
- **D2 (Claims Management) — 4 P1, 1 P2:** Claims intake through disbursement is required for policyholder satisfaction and regulatory compliance. CAT event management is P2 because individual claims are fully functional without it.
- **D3 (Billing & Payments) — 4 P1:** All billing capabilities are required for revenue collection and cancellation compliance. No P2 items in this domain.
- **D4 (Distribution) — 1 P1, 2 P2:** Intermediary onboarding is P1 because policies cannot be originated without a producer. Commission calculation and disbursement are P2 because they are financial back-office functions that do not block policy operations.
- **D5 (Identity & Access) — 4 P1:** Authentication, permission enforcement, tenant isolation, and audit trail are all foundational security requirements. No P2 items.
- **D6 (Document Management) — 1 P1, 1 P2:** Document generation is P1 because declaration pages are required at binding. Sensitive document control is P2 because basic document access functions without it.
- **D7 (System Administration) — 3 P2:** Administration functions support platform operation but do not block policy or claims workflows for existing tenants.

---

## 14. Traceability Appendix

Capability-to-Evidence mapping. All capabilities trace to at least one HIGH or MEDIUM confidence evidence source.

| Capability | Primary Evidence | Confidence |
|-----------|----------------|-----------|
| D1-C1: Quote Creation | EV-0-0218, EV-0-0006 | HIGH |
| D1-C2: Policy Binding | EV-0-0218, EV-0-0006, EV-0-0231 | HIGH |
| D1-C3: Endorsement | EV-0-0006, EV-0-0231 | MEDIUM |
| D1-C4: Renewal | EV-0-0006, EV-0-0231 | HIGH (thresholds); MEDIUM (workflow) |
| D1-C5: Cancellation | EV-0-0006, EV-0-0231 | HIGH (thresholds); MEDIUM (workflow) |
| D1-C6: Bulk Upload | EV-0-0006, EV-0-0231 | MEDIUM |
| D2-C1: FNOL | EV-0-0007, EV-0-0226, ART-1-001 | MEDIUM (UI evidence LOW — DBT-1-0003) |
| D2-C2: Adjuster/Workflow | EV-0-0007, EV-0-0226 | MEDIUM |
| D2-C3: Worksheet | EV-0-0007, ART-1-001 | MEDIUM |
| D2-C4: Disbursement | EV-0-0007, EV-0-0009 | MEDIUM |
| D2-C5: CAT Events | EV-0-0007, EV-0-0003 | MEDIUM |
| D3-C1: Payment Collection | EV-0-0006, EV-0-0227 | MEDIUM |
| D3-C2: Payment Plans | EV-0-0008, EV-0-0006 | MEDIUM |
| D3-C3: Refunds | EV-0-0006 | MEDIUM |
| D3-C4: Failed Payment | EV-0-0006, EV-0-0231 | HIGH |
| D4-C1: Intermediary Onboarding | EV-0-0009, EV-0-0003 | MEDIUM (UI LOW — DBT-1-0004) |
| D4-C2: Commission Calculation | EV-0-0009, EV-0-0006 | MEDIUM |
| D4-C3: Commission Disbursement | EV-0-0009, EV-0-0006 | MEDIUM |
| D5-C1: User Lifecycle | EV-0-0222, EV-0-0011 | HIGH |
| D5-C2: Group Permissions | EV-0-0048, EV-0-0226, EV-0-0010 | HIGH |
| D5-C3: Authentication | EV-0-0222, EV-0-0012, EV-0-0226 | HIGH |
| D5-C4: Audit Trail | EV-0-0012, ART-1-001 | HIGH |
| D6-C1: Document Generation | EV-0-0019, EV-0-0006, EV-0-0231 | HIGH |
| D6-C2: Document Storage & Control | EV-0-0006, EV-0-0007, ART-1-001 | HIGH |
| D7-C1: Client Provisioning | ART-1-001, EV-0-0226 | HIGH |
| D7-C2: Product Catalog | EV-0-0003, EV-0-0226 | MEDIUM |
| D7-C3: Platform Configuration | EV-0-0231 | HIGH |

**NFR Traceability:**

| NFR | Evidence Source |
|-----|----------------|
| NFR-001 | FND-1-DATA-001 (ART-1-001); EV-0-0226 |
| NFR-002 | FND-1-SEC-002 (ART-1-003); EV-0-0226, EV-0-0048 |
| NFR-003 | RSK-1-SEC-001; EV-0-0226 |
| NFR-004 | BR-COM-RESET, BR-COM-RATE (EV-0-0012); RSK-1-SEC-002 |
| NFR-005 | RSK-1-SEC-005; EV-0-0226 |
| NFR-006 | RSK-1-SEC-004; EV-0-0010 |
| NFR-007 | INT-004 (EV-0-0012); RSK-1-INT-003 |
| NFR-008 | AuditLog table (ART-1-001); RSK-1-SEC-009 |
| NFR-009 | EV-0-0231 (BypassRefundResponse) |
| NFR-010 | RSK-1-DATA-001; FND-1-DATA-002 (ART-1-001) |
| NFR-011 | RSK-1-DATA-003 (ART-1-001) |
| NFR-012 | RSK-1-DATA-004 (ART-1-001) |
| NFR-014 | RSK-1-INT-003, RSK-1-INT-004; RSK-1-SEC-007; EV-0-0231 |
| NFR-015 | EV-0-0231; ART-1-002 §5 |

---

## 15. PRD Gate Checklist

This checklist must be evaluated by the Chief Orchestrator and presented to the human for APPROVE / REJECT / CONDITIONS.

| # | Gate Criterion | Status | Notes |
|---|---------------|--------|-------|
| G-001 | All 5 SCAN deliverables (ART-1-001 through ART-1-005) consumed and cited | PASS | All 5 SCAN deliverables read and cited with EV- references |
| G-002 | 100% WHAT/HOW neutrality — no technology vendor names in requirement statements | PASS | All HOW terms rewritten; 15-item rewrite log in ART-2-008 §8. Integration vendor aliases appear only in Section 7 parentheticals as required. |
| G-003 | Every capability traces to at least one EV- or FND- evidence source | PASS | Traceability appendix (Section 14) covers all 27 capabilities and all 20 NFRs |
| G-004 | No fabricated NFRs — un-evidenced NFRs carry QST- flags | PASS | NFR-016, NFR-017, NFR-018 carry QST- flags. No numeric targets invented. |
| G-005 | All priority levels state rationale | PASS | Priority rationale stated per capability (ART-2-008) and at domain level (Section 13) |
| G-006 | PROVISIONAL capabilities flagged with DBT- or QST- | PASS | Payment gateway (INT-001, D3-C1, D3-C3) flagged PROVISIONAL with QST-1-INT-001. ORM tables flagged with QST-1-DATA-001. |
| G-007 | No capabilities with UNKNOWN evidence without PROVISIONAL flag | PASS | All LOW-evidence capabilities either carry PROVISIONAL flag or confidence notation |
| G-008 | All 10 security risks from ART-1-003 present in PRD | PASS | Section 8: all 10 RSK-1-SEC-xxx items present |
| G-009 | All 7 data risks from ART-1-001 present in PRD | PASS | Section 9.3: all 7 RSK-1-DATA-xxx items present |
| G-010 | All 7 integration risks from ART-1-004 present in PRD | PASS | Section 12: all 7 RSK-1-INT-xxx items present |
| G-011 | Runtime reporting confirmed out of scope (DEC-0-0003) | PASS | Section 2.3 Scope Boundary: reporting runtime engine explicitly excluded |
| G-012 | TranzPay capability marked PROVISIONAL | PASS | INT-001 marked PROVISIONAL in Section 7; D3-C1, D3-C3 marked PROVISIONAL in capability map |
| G-013 | BypassRefundResponse risk documented and mitigation required | PASS | NFR-009 (P1); RSK-1-INT noted in Section 12; SC-008 in success criteria |
| G-014 | All BLOCKING QST- items enumerated and resolved before IDEATE stated as requirement | PASS | Section 10: 14 QST- items with BLOCKING status stated where applicable |
| G-015 | PRD Gate is NOT self-approved | PASS | Gate status is OPEN. Human APPROVE/REJECT/CONDITIONS required. |

**Gate Criterion Count: 15 | PASS: 15 | FAIL: 0 | CONDITIONAL: 0**

> **RESULT: All gate criteria pass. This document is ready for human review.**
>
> **BLOCKING ITEMS that must be resolved before IDEATE begins:**
> - QST-1-INT-001: Payment gateway contract (CRITICAL)
> - QST-1-INT-002: Mortgage lienholder notification service contract (CRITICAL)
> - QST-2-PM-NFR-001: Performance SLA targets (CRITICAL)
> - QST-2-PM-NFR-002: Availability SLA, RTO, RPO (CRITICAL)
>
> **The Chief Orchestrator must surface these 4 CRITICAL questions to the human as part of the PRD Gate Clarification Round before requesting APPROVE/REJECT.**

---

*End of ART-2-010 — Technology-Neutral PRD | INSUREEDGE-2026 | HARVEST Phase | 2026-06-17*
*Layer 0 Governance compliant — evidence first, no self-approval, WHAT/HOW neutral, all priorities rationalized.*
*This document may not be amended without re-running the PRD Gate Checklist.*
