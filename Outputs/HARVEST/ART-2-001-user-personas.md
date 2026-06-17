# ART-2-001 — User Personas
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Business Analyst Agent
**Phase:** HARVEST
**Date:** 2026-06-17
**Confidence:** HIGH (role evidence from ART-1-003-security-roles-catalogue.md, EV-0-0226)

**WHAT/HOW Firewall:** All persona descriptions are technology-neutral. No implementation technology is named.

---

## Overview

Five operational roles were confirmed in SCAN. Each maps to a distinct operational context and permission scope.

| Persona | Role Name | Scope | Primary Module Access |
|---------|-----------|-------|-----------------------|
| P-001 | PlatformAdmin | System-wide (all tenants) | All modules |
| P-002 | ClientAdmin | Single tenant (ClientId-scoped) | All modules within tenant |
| P-003 | Producer / Intermediary | Tenant + Intermediary scope | Quotes & Policies, Distribution, Billing, Reports |
| P-004 | Adjuster | Tenant + assigned claims | Claims, Documents |
| P-005 | User (Base) | Tenant + group permissions | Per-group assignment |

**Evidence:** FND-1-SEC-001 (EV-0-0226), ART-1-003 §1

---

## P-001 — Platform Administrator (PlatformAdmin)

**Role name in system:** PlatformAdmin
**Scope:** System-wide; not scoped to any single tenant (ClientId)

### Responsibilities
- Manages the master product catalog (insurance product types, coverage configurations) available across all tenant clients.
- Onboards new client tenants onto the platform; configures tenant identity and system settings.
- Performs cross-tenant operational monitoring and emergency interventions.
- Has full access to every screen in every tenant without exception.

### Primary Goals
1. Ensure the platform operates reliably across all tenants.
2. Keep the product and configuration catalog up to date.
3. Investigate and resolve cross-tenant anomalies.

### Key Screens Used
- Platform Admin Dashboard (exclusive — not visible to other roles)
- Product Management (create, edit, deactivate insurance products)
- All tenant modules (unrestricted read/write access)
- Audit logs (cross-tenant event visibility)

### Permission Summary
- No permission flag checks apply — PlatformAdmin bypasses all screen-level permission evaluation.
- No ClientId scope filter — all tenants' data is accessible.
- Global tables (Product, Module, AppScreen, WritingCompany) are PlatformAdmin-managed exclusively.

**Evidence:** ART-1-003 §1 (ROLE-001), EV-0-0226; ART-1-003 §2.3 (permission evaluation flow)

---

## P-002 — Client Administrator (ClientAdmin)

**Role name in system:** ClientAdmin
**Scope:** Single tenant (all data filtered to their ClientId)

### Responsibilities
- Day-to-day administration of their insurance company's platform instance.
- Creates and manages internal users, user groups, and their permission assignments.
- Manages intermediaries (agencies) and producers within the tenant.
- Supervises the full policy lifecycle: quotes, endorsements, renewals, cancellations, and non-renewals.
- Oversees the claims lifecycle: FNOL intake through financial disbursement.
- Executes or delegates billing actions including payment processing and payment plan setup.
- Runs all operational reports for the tenant.

### Primary Goals
1. Maintain accurate and up-to-date policy portfolio for their client tenant.
2. Ensure claims are handled promptly and within authority limits.
3. Control user access and permissions within the tenant.
4. Support distribution partners (intermediaries and producers).

### Key Screens Used
- Global Dashboard (KPI cards for their tenant)
- Quotes & Policies: full list, new submission wizard, policy 360, tools (endorse, cancel, renew)
- Claims: claims list, FNOL registration, claim workflow (all tabs), financial worksheet
- User Management: user list, add/view/edit user, reset password
- Group Management: group list, add/view/edit group, permission matrix
- Distribution Management: intermediary list, intermediary detail
- Billing Management: billing list, make payment
- Report Management: all report types

### Permission Summary
- Subject to all 10 permission flags (IsViewPermission, IsCreatePermission, IsEditPermission, IsApproveReject, IsDuplicatePermission, IsUploadPermission, IsDownloadPermission, IsViewSensitiveInfo, IsAccessSensitiveDoc, AllAccess).
- All data filtered to their ClientId — cannot access other tenants' data.
- Effective permissions = union of all group flag rows for each screen.

**Evidence:** ART-1-003 §1 (ROLE-002), §2.1, EV-0-0226; ART-1-001 §5 (multi-tenancy pattern)

---

## P-003 — Producer / Intermediary (IntermediaryProducer)

**Role name in system:** IntermediaryProducer (maps to Intermediary entity)
**Scope:** Tenant (ClientId) + Intermediary scope (IntermediaryId)

### Responsibilities
- Submits new business quote applications on behalf of policyholders.
- Manages and tracks the status of their own book of business (quotes and issued policies).
- Views commissions earned on policies within their intermediary.
- Manages their own intermediary profile and producer roster.

### Primary Goals
1. Submit accurate, complete quote applications efficiently.
2. Track the status of submitted quotes through to policy issuance.
3. View and reconcile earned commissions.

### Key Screens Used
- Global Dashboard (scoped to their book of business)
- Quotes & Policies: new submission wizard (Steps 1–5), quote list, policy list (own intermediary only)
- Policy 360: Summary, Billing, Timeline (read access, own policies)
- Distribution Management: own intermediary profile and producer details (read-only)
- Billing Management: billing records for own policies
- Report Management: commission and production reports

### Permission Summary
- All data filtered first by ClientId, then additionally by IntermediaryId.
- No claims, no adjuster actions, no user or group management.
- Cannot access other intermediaries' policies or data.
- Screen-level permissions still apply (view, create, edit flags per group).

**Evidence:** ART-1-003 §1 (ROLE-003), §2.3 (scope filter: IntermediaryId), EV-0-0226; ART-1-001 §5

---

## P-004 — Adjuster

**Role name in system:** Adjuster (maps to Adjuster entity)
**Scope:** Tenant (ClientId) + assigned claims only (AdjusterId)

### Responsibilities
- Receives and processes First Notice of Loss (FNOL) registrations.
- Investigates claims: reviews loss information, collects documents, tracks reserves.
- Manages financial worksheets for assigned claims: records reserves and disbursements per coverage.
- Coordinates with claimants and payees for settlement payments.
- Manages claim-related correspondence (claim letters, disbursement emails).

### Primary Goals
1. Assess assigned claims accurately and promptly.
2. Manage reserves and disbursements within authority limits.
3. Document all claim events with supporting materials.

### Key Screens Used
- Claims List (restricted to assigned claims)
- Claim Workflow — all tabs (Claims Summary, Loss Information, Claims Review, Documents, Financials: Worksheet, Financials: Claims Payee, Insured & Policy, Timeline, Task)
- FNOL Registration form
- Claim Workflow — Financials: Worksheet (gated by IsApproveReject permission)
- Claim document upload/download (gated by Upload/Download permissions)

### Permission Summary
- All claim data filtered by AdjusterId — adjuster sees only claims assigned to them.
- All data also scoped by ClientId.
- Cannot access policy creation, billing, user management, or distribution screens.
- IsApproveReject permission governs worksheet approval actions.
- IsUploadPermission / IsDownloadPermission govern document actions.

**Evidence:** ART-1-003 §1 (ROLE-004), §2.3 (scope filter: AdjusterId), EV-0-0226; ART-1-001 Claims domain

---

## P-005 — Base User (UserRole)

**Role name in system:** UserRole
**Scope:** Tenant (ClientId) + group-defined screen permissions

### Responsibilities
- Performs day-to-day operational tasks within the modules and screens explicitly granted by their group permission assignments.
- May perform any combination of view, create, edit, approve, upload, or download actions depending on group configuration.
- Access profile and personal details via View Profile.

### Primary Goals
1. Complete assigned operational tasks within their permitted screens.
2. View and manage own profile information.

### Key Screens Used
- Determined entirely by group permission matrix (8-module, 10-flag permission records).
- Always: Global Dashboard (scoped), View Profile (own profile).
- Remaining screens: granted per group membership — could include any subset of Quotes & Policies, Claims, Billing, Reports, etc.

### Permission Summary
- Effective permissions = union of all group-assigned flag rows for each screen.
- AllAccess = true on any group grants full screen access (scope filters still apply).
- Minimum access = own profile only if no groups assign any screen permissions.

**Evidence:** ART-1-003 §1 (ROLE-005), §2.1–2.3, EV-0-0226; ART-1-001 §3 (ScreenPermissions, Group_Table)

---

*End of ART-2-001 — User Personas | INSUREEDGE-2026 | HARVEST Phase | 2026-06-17*
*All role definitions at HIGH confidence (EV-0-0226). Permission matrix at HIGH confidence (EV-0-0226, EV-0-0048).*
