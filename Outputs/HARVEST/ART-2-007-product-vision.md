# ART-2-007 — Product Vision
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Product Manager Agent
**Phase:** HARVEST
**Date:** 2026-06-17
**Confidence:** HIGH (derived from SCAN deliverables ART-1-001 through ART-1-005)

---

## 1. Vision Statement

**[ASM-2-PM-001 — PROVISIONAL: pending human refinement at PRD Gate]**

The modernized InsureEdge platform must be a multi-tenant, API-first insurance management system that enables Hudson Bailey's producers, adjusters, and administrators to originate, service, and settle property insurance policies through a secure, role-controlled interface — preserving all existing business capabilities, resolving all identified security deficiencies, and establishing a maintainable, integration-ready foundation that can grow with the business without platform dependency or architectural constraint.

---

## 2. Strategic Goals

The following goals are derived directly from SCAN evidence. Each goal is traceable to one or more findings.

### Goal 1: Preserve Complete Business Functionality
**Evidence:** ART-1-002 (2,049 functions across 17 modules, EV-0-0003); ART-1-001 (118 tables); ART-1-005 (~65 screens)

All capabilities across the seven client-facing domains — Quotes & Policies, Claims Management, Billing & Payments, Distribution Management, User Management, Group Management, and Reports — must operate with equivalent or improved fidelity in the target system. No business function may be silently dropped. Any descoped capability requires explicit human approval and a formal decision record.

### Goal 2: Eliminate Security Technical Debt Before Go-Live
**Evidence:** ART-1-003 (10 security risks — RSK-1-SEC-001 through RSK-1-SEC-010, EV-0-0226)

The target system must resolve all ten security risks identified in SCAN before accepting production traffic. Critical items include: credential storage in one-way hashed form, token validation by code-match rather than existence-only, sensitive field redaction enforced at the API serialization layer (not display layer only), synchronous privilege revocation on group membership removal, and encrypted secret storage for all integration credentials.

### Goal 3: Achieve Full Tenant Isolation at Every Layer
**Evidence:** ART-1-001 (ClientId scoping pattern, FND-1-DATA-001); ART-1-003 (multi-tenancy enforcement table, EV-0-0226)

All data operations, API responses, and background jobs must scope results to the authenticated user's tenant identifier. Cross-tenant data leakage — including the known risk of a zero-value tenant identifier returning unscoped data — must be eliminated by design. Intentionally global data (product catalog, module registry, reference lookups) must remain accessible without ClientId filtering, but this set must be explicitly enumerated and governed.

### Goal 4: Operationalize All Integrations Under Resilient Patterns
**Evidence:** ART-1-004 (10 integrations, EV-0-0006, EV-0-0007, EV-0-0009, EV-0-0012); RSK-1-INT-001 through RSK-1-INT-007

All ten current integrations must be replicated in the target system using modern, observable patterns — including asynchronous event queuing for mortgage lienholder notifications, retry and circuit-breaker behavior for payment gateway calls, and externalized secret management for all API credentials. The payment gateway integration (currently a contract placeholder) must be fully specified before the target integration layer is designed.

### Goal 5: Maintain the Full Policy Lifecycle Automation Timeline
**Evidence:** ART-1-002 (11 scheduled background jobs, EV-0-0231); BR-POL-T01 through BR-POL-T09

All scheduled background jobs must be replicated with equivalent precision. The renewal notification timeline (90 days), non-renewal notice (60 days), cancellation grace period (30 days), and expiry detection (1 day) are business-critical thresholds that affect policyholder communications and regulatory compliance. These values must be configurable without code changes in the target system.

---

## 3. Scope Boundary

### 3.1 In Scope

| Domain | Scope Statement |
|--------|----------------|
| Policy Lifecycle | Full quote-to-policy lifecycle including new business, endorsement, renewal, cancellation, non-renewal, and cancel/rewrite for both individual and commercial insureds |
| Claims Management | FNOL intake through claim closure including adjuster assignment, worksheet management, reserve tracking, disbursement, escalation, litigation, and CAT event association |
| Billing & Payments | Premium collection, payment plan management, installment scheduling, payment failure handling, refunds, and auto-cancellation trigger |
| Distribution Management | Intermediary and producer onboarding, commission configuration and calculation, geocoding-based address validation, and commission disbursement |
| User & Group Management | User lifecycle, group-based permission model (10-flag per-screen matrix), password management, and audit trail |
| Document Management | Policy and claim document storage, retrieval, and generation (declaration pages, notices, cancellation letters, non-renewal notices) |
| System Administration | Product catalog, writing company configuration, and multi-tenant client provisioning (Platform Admin only) |
| All 10 Integrations | Payment gateway, mortgage lienholder notification, address geocoding, risk rating data, outbound email, document generation, commission disbursement, binary document storage, symmetric encryption, and HTTP connectivity |
| Data Migration | All 118 tables with referential integrity remediation, sentinel value conversion, binary extraction, and schema typo correction |
| Background Jobs | All 11 scheduled jobs with configurable thresholds |

### 3.2 Explicitly Out of Scope

| Item | Decision Basis |
|------|---------------|
| Runtime reporting engine | DEC-0-0003 — Human decision: runtime report generation waived. Existing reports not in scope for FORGE. |
| Payment gateway contract specification | TranzPay integration is a placeholder (ASM-1-INT-001). Scope is limited to designing the integration adapter; the live contract must be supplied by the customer before IDEATE. This is a BLOCKING item (QST-1-INT-001). |
| Client onboarding self-service portal | No evidence of a standalone customer-facing portal. Onboarding is managed through the admin user interface. |
| OutSystems platform administration | Platform-level configuration of the source system is not carried forward — only the business capabilities it implements. |
| ORM-managed tables (3 tables) | `UserSystemNotifications`, `OS_UserConfigurations`, `GridDefaultLayouts` — DDL not provided (QST-1-DATA-001 BLOCKING). Scope conditional on DDL receipt. |

---

## 4. Success Criteria

The following measurable outcomes define a successful HARVEST-to-TRANSFER engagement. All items must be achieved before handover is declared complete.

| # | Success Criterion | Measurement |
|---|-------------------|-------------|
| SC-001 | All 10 identified integrations operational in target | Integration smoke test: 100% pass for all 10 integration contracts |
| SC-002 | All 118 tables migrated with zero orphan records | Post-migration data quality report: Claim→Policy and Worksheet→Claim orphan count = 0 |
| SC-003 | All 10 security risks resolved | Security acceptance checklist: 10/10 mitigations verified by independent review |
| SC-004 | Zero sentinel date values (`1900-01-01`) in migrated data | Post-migration query: COUNT of sentinel date values = 0 |
| SC-005 | All 11 scheduled background jobs operational with correct thresholds | Timer integration test: each job fires within its configured window |
| SC-006 | All 5 roles and 10 permission flags enforced in target | Role-based access test matrix: 100% pass |
| SC-007 | Multi-tenant isolation verified for all ClientId-scoped tables | Cross-tenant penetration test: 0 data leakage events |
| SC-008 | `BypassRefundResponse` flag is FALSE in production configuration | Pre-go-live configuration audit: confirmed FALSE |
| SC-009 | All schema typos corrected with full code search | Typo mapping table: 4 typos corrected, zero residual references |
| SC-010 | Payment gateway capability (PROVISIONAL) specified before IDEATE | QST-1-INT-001 answered and integration contract delivered |

---

*End of ART-2-007 — Product Vision | INSUREEDGE-2026 | HARVEST Phase | 2026-06-17*
*Vision statement marked ASM-2-PM-001 pending human refinement at PRD Gate.*
