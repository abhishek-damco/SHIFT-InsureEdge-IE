# ART-2-009 — Non-Functional Requirements Catalog
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Product Manager Agent
**Phase:** HARVEST
**Date:** 2026-06-17
**Confidence:** HIGH for evidence-grounded NFRs; QST- raised for all un-evidenced performance and availability targets.

**WHAT/HOW neutrality:** Technology-neutral throughout. No platform, vendor, or runtime names appear in requirement statements. Rewrites logged.

---

## NFR Category Definitions

| Category | Abbrev | Meaning |
|----------|--------|---------|
| Security | SEC | Access control, encryption, credential management, auditing |
| Multi-Tenancy | TEN | Tenant isolation, scope enforcement |
| Compliance | COM | Regulatory, data handling, financial controls |
| Scalability | SCA | Load handling, growth capacity |
| Performance | PER | Latency, throughput, response time |
| Availability | AVL | Uptime, recovery, continuity |
| Maintainability | MNT | Observability, configuration, extensibility |
| Data Integrity | DAT | Referential integrity, migration fidelity, data quality |

---

## Priority Definitions for NFRs

- **P1 (Must Have):** System is insecure, non-compliant, or non-functional without this NFR. No exceptions.
- **P2 (Should Have):** Significant operational or compliance risk if absent; waiver requires documented decision.
- **P3 (Nice to Have):** Improvement to operational posture; may be deferred to post-go-live.

---

## NFR-001: Tenant Data Isolation

| Attribute | Value |
|-----------|-------|
| **Category** | Multi-Tenancy |
| **ID** | INSUREEDGE-2026-NFR-001 |
| **Priority** | P1 |
| **Requirement** | The system must enforce tenant isolation for all data operations. Every query, API response, and background job execution affecting tenant-owned data must be scoped to the authenticated user's tenant identifier. A user in Tenant A must never receive, modify, or delete data belonging to Tenant B, regardless of input manipulation. |
| **Evidence** | FND-1-DATA-001 (ClientId scoping pattern, ART-1-001); EV-0-0226 (tenant resolution chain, ART-1-003); RSK-1-SEC-008 (ClientId=0 leakage risk) |
| **Priority Rationale** | Insurance data is regulated and confidential. Cross-tenant leakage is a CRITICAL security and regulatory failure. Evidence is HIGH confidence from primary DDL analysis. |

---

## NFR-002: Role-Based Access Control with 10-Flag Permission Model

| Attribute | Value |
|-----------|-------|
| **Category** | Security |
| **ID** | INSUREEDGE-2026-NFR-002 |
| **Priority** | P1 |
| **Requirement** | The system must enforce role-based access control using a group-based permission model. Each user's effective permissions for any given feature must be computed as the union of all permission flags across the user's group memberships. The permission model must support 10 distinct flags per feature: View, Create, Edit, ApproveReject, Duplicate, Upload, Download, ViewSensitiveInfo, AccessSensitiveDoc, and AllAccess. An AllAccess flag must grant full access to that feature but must not bypass scope (tenant, intermediary, adjuster) filters. |
| **Evidence** | FND-1-SEC-002 (10-flag model, EV-0-0226); EV-0-0048 (51 permission rows, Group Management PRD); ART-1-003 §2 |
| **Priority Rationale** | Role enforcement is foundational to system authorization. Without it, any user could access any data. Evidence HIGH. |

---

## NFR-003: Credential Storage Security

| Attribute | Value |
|-----------|-------|
| **Category** | Security |
| **ID** | INSUREEDGE-2026-NFR-003 |
| **Priority** | P1 |
| **Requirement** | All user passwords must be stored using a one-way cryptographic hashing algorithm with a per-record random salt. No plaintext or reversibly-encoded password may be stored in the user record at any time. The default bootstrap credential `[REDACTED-BOOTSTRAP-CREDENTIAL]` identified in the source system (RSK-1-SEC-001) must be eliminated and must not be replicated in the target system. |
| **Evidence** | RSK-1-SEC-001 (CRITICAL, ART-1-003); EV-0-0226; User2.Password column (ART-1-001) |
| **Priority Rationale** | Plaintext credential storage is a CRITICAL security risk. Insurance platforms with financial data require this unconditionally. Evidence HIGH. |

---

## NFR-004: Password Reset Token Security

| Attribute | Value |
|-----------|-------|
| **Category** | Security |
| **ID** | INSUREEDGE-2026-NFR-004 |
| **Priority** | P1 |
| **Requirement** | Password reset tokens must be validated by code match AND expiry check in all flows — including the client onboarding flow. The standard reset token must expire within 30 minutes. The client onboarding token must expire within 24 hours. Existence-only token validation (without code comparison) is prohibited. No more than 2 active reset tokens per user may be valid within any 30-minute window. |
| **Evidence** | BR-COM-RESET (EV-0-0012); BR-COM-RATE (EV-0-0012); RSK-1-SEC-002 (HIGH — 24-hr account takeover window, ART-1-003) |
| **Priority Rationale** | RSK-1-SEC-002 is a HIGH severity finding: the current onboarding flow allows 24-hour account takeover with only token existence. This must be fixed by design in the target. Evidence HIGH. |

---

## NFR-005: Sensitive Field Redaction at API Layer

| Attribute | Value |
|-----------|-------|
| **Category** | Security |
| **ID** | INSUREEDGE-2026-NFR-005 |
| **Priority** | P1 |
| **Requirement** | Sensitive fields — including SSN/TIN, bank account numbers, and routing numbers — must be redacted in API responses when the requesting user does not have the ViewSensitiveInfo permission flag. Redaction must occur at the API response serialization layer, not solely at the presentation layer. The system must never return a sensitive field value in an API response to a user who lacks the appropriate permission, regardless of client-side behavior. |
| **Evidence** | RSK-1-SEC-005 (HIGH, ART-1-003); EV-0-0226 (sensitive field masking); ScreenPermissions.IsViewSensitiveInfo (ART-1-001) |
| **Priority Rationale** | The source system's display-layer-only masking means a developer-tools-level inspection could expose PII/financial data. This is a HIGH severity risk that must be remediated by design in the target. Evidence HIGH. |

---

## NFR-006: Synchronous Privilege Revocation

| Attribute | Value |
|-----------|-------|
| **Category** | Security |
| **ID** | INSUREEDGE-2026-NFR-006 |
| **Priority** | P1 |
| **Requirement** | When a user is removed from a group, all permission privileges derived from that group membership must be revoked synchronously before the removal operation returns successfully. Asynchronous privilege cleanup that creates a race window — where a removed user retains permissions — is prohibited. |
| **Evidence** | RSK-1-SEC-004 (HIGH, ART-1-003); EV-0-0010 (`LaunchDeleteUserGroupPrivelagesUpdated` async race) |
| **Priority Rationale** | Privilege escalation via race window is a HIGH severity security risk. Synchronous revocation closes this gap by design. Evidence HIGH. |

---

## NFR-007: Encryption of PII and Financial Data at Rest

| Attribute | Value |
|-----------|-------|
| **Category** | Security |
| **ID** | INSUREEDGE-2026-NFR-007 |
| **Priority** | P1 |
| **Requirement** | All personally identifiable information (SSN/TIN, bank account numbers, routing numbers) and sensitive financial data must be encrypted at rest using a symmetric encryption algorithm with a minimum equivalent security strength of AES-256. Encryption keys must be stored in an externalized, access-controlled secret management system — not as application configuration values or database columns. Key rotation must be supported. |
| **Evidence** | INT-004 (AES-256 CBC + HMAC-256, EV-0-0012); RSK-1-INT-003 (key stored as plaintext config — HIGH); BankDetail.AccountNumber (encrypted, ART-1-001) |
| **Priority Rationale** | Insurance and financial data regulation requires encryption at rest. The current single-environment key with no rotation evidence is a HIGH risk. Evidence HIGH. |

---

## NFR-008: Audit Trail for All Significant Actions

| Attribute | Value |
|-----------|-------|
| **Category** | Compliance |
| **ID** | INSUREEDGE-2026-NFR-008 |
| **Priority** | P1 |
| **Requirement** | The system must maintain an immutable audit log of all significant user actions. Each entry must record: user identifier, action type, affected entity type, affected record identifier, session identifier, module, and timestamp. Platform Administrator cross-tenant data access must also be logged with the target tenant identifier included. Audit records must not be modifiable or deletable by non-Platform Admin users. |
| **Evidence** | AuditLog table (ART-1-001); EV-0-0012; RSK-1-SEC-009 (PlatformAdmin audit gap, ART-1-003) |
| **Priority Rationale** | Regulatory and compliance requirement for insurance platforms. Evidence HIGH from schema. RSK-1-SEC-009 identifies a gap that must be closed. |

---

## NFR-009: Financial Bypass Flag Control

| Attribute | Value |
|-----------|-------|
| **Category** | Compliance |
| **ID** | INSUREEDGE-2026-NFR-009 |
| **Priority** | P1 |
| **Requirement** | The `BypassRefundResponse` configuration flag (or its equivalent in the target system) must be set to FALSE in all non-development environments. A deployment checklist item must exist that validates this flag is FALSE before any production deployment is accepted. The system must prevent this flag from being enabled in production environments without an explicit, documented approval. |
| **Evidence** | `BypassRefundResponse_ToBeFalseInPROD = TRUE` in DEV environment (EV-0-0231 CRITICAL finding, ART-1-004) |
| **Priority Rationale** | This flag bypasses the real payment gateway response in production, which would allow transactions to appear successful when they are not. CRITICAL financial integrity risk. Evidence HIGH. |

---

## NFR-010: Referential Integrity for All Entity Relationships

| Attribute | Value |
|-----------|-------|
| **Category** | Data Integrity |
| **ID** | INSUREEDGE-2026-NFR-010 |
| **Priority** | P1 |
| **Requirement** | The target data schema must enforce referential integrity constraints on all logical entity relationships, including Claim-to-Policy and Worksheet-to-Claim which currently lack database-level constraints in the source system. An orphan analysis must be performed on source data prior to migration; zero orphan records may be introduced into the target schema. |
| **Evidence** | RSK-1-DATA-001 (FND-1-DATA-002, ART-1-001); Claim.PolicyId (no DB FK), Worksheet.ClaimId (no DB FK) |
| **Priority Rationale** | Orphan claim records would silently break claim processing and financial reporting. Evidence HIGH. |

---

## NFR-011: Sentinel Date Value Elimination

| Attribute | Value |
|-----------|-------|
| **Category** | Data Integrity |
| **ID** | INSUREEDGE-2026-NFR-011 |
| **Priority** | P1 |
| **Requirement** | The date value `1900-01-01` is used as a "null date" sentinel throughout the source system. All occurrences of this sentinel in date/time columns must be converted to a true null value during data migration. No sentinel date values may exist in the target database after migration. |
| **Evidence** | RSK-1-DATA-003 (ART-1-001); QST-1-DATA-003 |
| **Priority Rationale** | Sentinel dates break date arithmetic, filtering, and reporting. Migration must eliminate all instances. Evidence HIGH. |

---

## NFR-012: Schema Typo Correction with Full Reference Tracing

| Attribute | Value |
|-----------|-------|
| **Category** | Data Integrity |
| **ID** | INSUREEDGE-2026-NFR-012 |
| **Priority** | P1 |
| **Requirement** | Four schema typos identified in the source system (`WrittingCompany`, `ComissionPercentage`, `OraganisationType`, `PoilcyId`) must be corrected in the target schema. A typo-to-correct-name mapping must be maintained and applied to all code, queries, and API contracts referencing the affected columns. No residual references to the typo forms may exist in target system code. |
| **Evidence** | RSK-1-DATA-004 (ART-1-001) |
| **Priority Rationale** | Uncorrected typos propagate through APIs and UI labels. Full code search required. Evidence HIGH. |

---

## NFR-013: Multi-Factor Authentication for Privileged Roles

| Attribute | Value |
|-----------|-------|
| **Category** | Security |
| **ID** | INSUREEDGE-2026-NFR-013 |
| **Priority** | P2 |
| **Requirement** | Platform Administrator and Client Administrator roles must be required to authenticate using a second factor (e.g., time-based one-time password or equivalent) in addition to their primary credential. |
| **Evidence** | RSK-1-SEC-006 (MEDIUM — no MFA evidence, ART-1-003) |
| **Priority Rationale** | MFA is not evidenced in the source system but is a recognized best practice for insurance platforms with financial data. MEDIUM severity risk. P2 because the system is functional without it, but exposed. |

---

## NFR-014: Integration Credential Externalization

| Attribute | Value |
|-----------|-------|
| **Category** | Security |
| **ID** | INSUREEDGE-2026-NFR-014 |
| **Priority** | P1 |
| **Requirement** | All integration credentials — including payment gateway API keys, mortgage lienholder notification service credentials, document generation API keys, binary storage service access credentials, commission disbursement service keys, geocoding API keys, and encryption keys — must be stored in an access-controlled externalized secret management system. No credential may be stored as a plain application configuration value, database column, or version-controlled file. |
| **Evidence** | RSK-1-INT-003 (AES key in config, HIGH); RSK-1-INT-004 (Blob connection string plaintext, HIGH); RSK-1-SEC-007 (key in site property, MEDIUM); EV-0-0231 (plaintext credentials confirmed) |
| **Priority Rationale** | Multiple HIGH-severity integration risks all share the same root cause: plaintext credentials in application configuration. Single remediation eliminates all. Evidence HIGH. |

---

## NFR-015: Background Job Precision and Configurability

| Attribute | Value |
|-----------|-------|
| **Category** | Maintainability |
| **ID** | INSUREEDGE-2026-NFR-015 |
| **Priority** | P1 |
| **Requirement** | All 11 scheduled background jobs must be replicated in the target system with equivalent execution timing. All threshold values (renewal days, cancellation days, expiry days, policy fee, etc.) must be stored as externalized configuration parameters that can be changed without application redeployment. An emergency disable mechanism equivalent to the current kill-switch must be available to Platform Administrators. |
| **Evidence** | EV-0-0231 (timer thresholds); ART-1-002 §5; `KillTimer = FALSE` site property |
| **Priority Rationale** | Timer precision directly affects policyholder communications and compliance deadlines. Misconfiguration could create legal exposure. Evidence HIGH. |

---

## NFR-016: System Performance Under Production Load

| Attribute | Value |
|-----------|-------|
| **Category** | Performance |
| **ID** | INSUREEDGE-2026-NFR-016 |
| **Priority** | P2 |
| **Requirement** | [QST-2-PM-NFR-001 — BLOCKING: No performance metrics are available from the source system. The following NFR statement is a PROVISIONAL placeholder and must be replaced with measured targets before IDEATE.] The target system must respond to all standard user interactions within an acceptable response time under the expected concurrent user load. Specific targets for page response time (P50, P95, P99), maximum concurrent sessions, and throughput (transactions per minute) must be provided by the customer before architecture design begins. |
| **Evidence** | NONE — no runtime metrics, load data, or SLA documentation was provided in SCAN artifacts. |
| **Priority Rationale** | Performance NFRs cannot be fabricated without baseline data. This question is BLOCKING for sizing and architecture decisions in IDEATE. |
| **Open Item** | QST-2-PM-NFR-001: What are the target response time SLAs, peak concurrent user count, and peak transaction volume for the InsureEdge platform? |

---

## NFR-017: System Availability and Recovery Objectives

| Attribute | Value |
|-----------|-------|
| **Category** | Availability |
| **ID** | INSUREEDGE-2026-NFR-017 |
| **Priority** | P2 |
| **Requirement** | [QST-2-PM-NFR-002 — BLOCKING: No availability SLA or recovery objective data was evidenced in SCAN artifacts. The following NFR is a PROVISIONAL placeholder.] The target system must meet a defined availability target expressed as a percentage of monthly uptime, with defined Recovery Time Objective (RTO) and Recovery Point Objective (RPO) for each critical module. These targets must be provided by the customer before architecture design begins. |
| **Evidence** | NONE — source system deployment model and historical uptime data not provided. |
| **Priority Rationale** | Insurance platforms typically require high availability commitments, but targets must be grounded in the customer's business requirements — not assumed. |
| **Open Item** | QST-2-PM-NFR-002: What are the required availability SLA (uptime %), RTO (hours), and RPO (hours or minutes) for the InsureEdge platform in production? |

---

## NFR-018: Scalability — Multi-Tenant and Data Volume Growth

| Attribute | Value |
|-----------|-------|
| **Category** | Scalability |
| **ID** | INSUREEDGE-2026-NFR-018 |
| **Priority** | P2 |
| **Requirement** | [QST-2-PM-NFR-003 — PROVISIONAL: No growth projections were evidenced.] The target system must be designed to support addition of new tenants without schema changes or application redeployment. The ClientId-scoped data model must continue to function correctly as tenant count and per-tenant record volumes grow. Specific growth targets (number of tenants in 3 years, expected record counts) must be supplied by the customer to inform architecture sizing decisions. |
| **Evidence** | Multi-tenancy pattern confirmed (ART-1-001, ART-1-003). No volume projections in SCAN artifacts. |
| **Priority Rationale** | Architecture must support growth but cannot be sized without targets. |
| **Open Item** | QST-2-PM-NFR-003: What is the expected number of active tenants and approximate record volume (policies, claims, users) in 1, 3, and 5 years? |

---

## NFR-019: Observability and Operational Monitoring

| Attribute | Value |
|-----------|-------|
| **Category** | Maintainability |
| **ID** | INSUREEDGE-2026-NFR-019 |
| **Priority** | P2 |
| **Requirement** | The target system must emit structured logs for all significant events, expose health-check endpoints for all services, and provide operational metrics for background job execution (run time, record count, error rate). All integration call-outs must be instrumented with latency, success rate, and error classification metrics. |
| **Evidence** | ART-1-002 §5 (11 background jobs requiring monitoring); RSK-1-INT-002 (no retry/circuit-breaker on critical integrations); IELogEngine module (EV-0-0003, 7 functions) |
| **Priority Rationale** | Source system has a logging module (IELogEngine) confirming operational logging intent. Target must formalize this. P2 because logging is not a blocking functional requirement. |

---

## NFR-020: Geographic Restriction for Geocoding API Credentials

| Attribute | Value |
|-----------|-------|
| **Category** | Security |
| **ID** | INSUREEDGE-2026-NFR-020 |
| **Priority** | P2 |
| **Requirement** | Geocoding service API credentials must be restricted by allowed origin (domain or IP allowlist) so that key theft or exposure does not enable unlimited usage by unauthorized parties. Separate keys must be used for the map display integration and the address geocoding integration. |
| **Evidence** | RSK-1-SEC-010 (LOW — geocoding API key client-side exposure, ART-1-003); two API keys confirmed (EV-0-0231) |
| **Priority Rationale** | LOW severity risk but a configuration requirement that must be verified before production deployment. P2 because the system functions without it, but exposure could result in quota exhaustion and billing. |

---

## Open Questions Raised (QST-)

| QST ID | Severity | Question | Blocking For |
|--------|----------|----------|-------------|
| QST-2-PM-NFR-001 | CRITICAL | What are the target response time SLAs (P50, P95, P99), peak concurrent user count, and peak transaction volume? | IDEATE (architecture sizing) |
| QST-2-PM-NFR-002 | CRITICAL | What are the required availability SLA (uptime %), RTO, and RPO for production? | IDEATE (infrastructure design) |
| QST-2-PM-NFR-003 | HIGH | What is the expected tenant count and record volume in 1, 3, and 5 years? | IDEATE (data architecture sizing) |
| QST-2-PM-SEC-001 | HIGH | What is the required session timeout duration for each role? No evidence in SCAN artifacts. | FORGE (authentication implementation) |

---

## NFR Summary

| ID | Category | Priority | Evidence Status |
|----|----------|----------|----------------|
| NFR-001 | Multi-Tenancy | P1 | HIGH confidence |
| NFR-002 | Security | P1 | HIGH confidence |
| NFR-003 | Security | P1 | HIGH confidence |
| NFR-004 | Security | P1 | HIGH confidence |
| NFR-005 | Security | P1 | HIGH confidence |
| NFR-006 | Security | P1 | HIGH confidence |
| NFR-007 | Security | P1 | HIGH confidence |
| NFR-008 | Compliance | P1 | HIGH confidence |
| NFR-009 | Compliance | P1 | HIGH confidence |
| NFR-010 | Data Integrity | P1 | HIGH confidence |
| NFR-011 | Data Integrity | P1 | HIGH confidence |
| NFR-012 | Data Integrity | P1 | HIGH confidence |
| NFR-013 | Security | P2 | MEDIUM confidence (by absence) |
| NFR-014 | Security | P1 | HIGH confidence |
| NFR-015 | Maintainability | P1 | HIGH confidence |
| NFR-016 | Performance | P2 | QST-2-PM-NFR-001 BLOCKING |
| NFR-017 | Availability | P2 | QST-2-PM-NFR-002 BLOCKING |
| NFR-018 | Scalability | P2 | QST-2-PM-NFR-003 BLOCKING |
| NFR-019 | Maintainability | P2 | MEDIUM confidence |
| NFR-020 | Security | P2 | HIGH confidence |

**Total NFRs: 20 | P1: 14 | P2: 6 | P3: 0 | QST- raised: 4**

---

*End of ART-2-009 — NFR Catalog | INSUREEDGE-2026 | HARVEST Phase | 2026-06-17*
*Layer 0 §5 compliance: all evidenced NFRs cite EV- or FND-. Un-evidenced NFRs carry QST- flags. No performance targets fabricated.*
