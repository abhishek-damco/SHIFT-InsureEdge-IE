# ART-2-006 — Executive Summary
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Product Manager Agent
**Phase:** HARVEST
**Date:** 2026-06-17
**Confidence:** HIGH (synthesized from HIGH-confidence SCAN deliverables ART-1-001 through ART-1-005)

---

## What InsureEdge Does

InsureEdge is a multi-tenant insurance management platform built for Hudson Bailey, a specialty insurance program administrator. It enables insurance professionals — producers, adjusters, and administrators — to originate and service property insurance policies written by Sierra Specialty Insurance Company. The platform covers the full lifecycle of an insurance engagement: from quoting a risk and binding a policy, through claims intake and settlement, to billing, commission disbursement, and regulatory reporting.

The platform is structured as eight functional domains accessible through a unified browser-based interface:

1. **Quotes & Policies** — new business submissions, policy binding, endorsements, renewals, cancellations, and non-renewals for both individual and commercial insureds.
2. **Claims Management** — first notice of loss intake, adjuster assignment, reserve tracking, financial worksheets, payee disbursement, and claim closure.
3. **Billing & Payments** — premium collection, payment plan management, installment scheduling, refunds, and auto-cancellation on non-payment.
4. **Distribution Management** — intermediary and producer onboarding, commission configuration, geocoding-based address resolution, and commission disbursement.
5. **User Management** — user lifecycle, role assignment, permission management, and password security.
6. **Group Management** — group-based permission model with a 10-flag per-screen rights matrix governing every user's access.
7. **Reports** — business intelligence including policy production, claims, financials, commissions, bordereaux, and regulatory reports.
8. **System Administration** — platform-level configuration, product catalog management, and multi-tenant client provisioning (restricted to Platform Administrators).

---

## Why InsureEdge Is Being Modernized

InsureEdge is currently built on a low-code platform that has served as a rapid delivery vehicle but now imposes constraints on extensibility, portability, and long-term maintainability. Specific drivers for modernization include:

- **Technology lock-in:** All logic, data access, and UI rendering are tightly coupled to the source platform's runtime. This makes independent scaling, third-party integration, and cloud portability difficult.
- **Dual-database coupling:** Business data and system/tenant data live in two separate data stores that are joined at runtime through a configuration-resolved connection, creating a fragile deployment dependency.
- **Security technical debt:** Several high-severity risks were identified during SCAN — including a plaintext default password in the user table, an onboarding token that is validated by existence rather than code match, and sensitive field masking enforced only at the display layer rather than the API layer.
- **Integration opacity:** Ten external integrations are active in the platform but are embedded within the low-code runtime with no independent contracts, retry logic, or circuit-breaker patterns.
- **Scalability ceiling:** The current architecture does not support independent scaling of compute-intensive workloads such as the rating engine, document generation, or bulk policy upload processing.

The modernization objective is to migrate InsureEdge to a technology-neutral, API-first architecture that preserves all existing business capabilities, resolves identified security risks, and establishes a foundation suitable for long-term operation and extension.

---

## Scale of the System

| Dimension | Count |
|-----------|-------|
| Database tables | 118 (across 2 data stores) |
| Application functions | 2,049 (across 17 modules) |
| User-facing screens | ~65 |
| External integrations | 10 |
| User roles | 5 |
| Permission flags per screen | 10 |
| Scheduled background jobs | 11 |

---

## Modernization Objective

Deliver a production-ready, technology-neutral replacement for InsureEdge that:
- Preserves all business capabilities across all seven client-facing domains.
- Enforces tenant isolation, role-based access, and sensitive data protections at every layer.
- Migrates all 118 tables with full referential integrity and data quality remediation.
- Operationalizes all 10 current integrations under modern, resilient patterns.
- Resolves all 10 security risks identified in SCAN before go-live.

The modernization is executed under the SHIFT platform methodology across six phases: DISCOVER → SCAN → HARVEST → IDEATE → FORGE → TRANSFER.

---

*End of ART-2-006 — Executive Summary | INSUREEDGE-2026 | HARVEST Phase | 2026-06-17*
