# ART-1-005 — Screen & Navigation Catalogue
**Engagement:** InsureEdge Application Modernization (INSUREEDGE-2026)
**Agent:** Browser Agent
**Phase:** SCAN
**Date:** 2026-06-16
**Evidence sources:** EV-0-0218 (Q&P PRD), EV-0-0222 (User Management PRD), EV-0-0048 (Group Management PRD), EV-0-0226 (roles_permissions.md), EV-0-0003 (00_INDEX.md), EV-0-0168 to EV-0-0217 (50 UI screenshots — PNG, name-only), EV-0-0049 to EV-0-0155 (107 business logic screenshots — PNG, name-only), EV-0-0044 (Distribution PDF — not read)

---

## 1. Module Screen Inventory

### Coverage notation
- **HIGH** — Screen content directly observed in text PRD (VERIFIED/INFERRED tags present)
- **MEDIUM** — Screen existence confirmed; some content inferred from permission model or function index
- **LOW** — Screen existence inferred from screenshot filenames, permission model, or analogy only

---

### 1.1 Module: Global Shell / Portal (InsureEdgePortal)

| Screen | Primary Function | Roles with Access | Evidence | Confidence |
|--------|-----------------|-------------------|----------|------------|
| Global Dashboard (`/InsureEdgePortal`) | Cross-module KPI landing page: New Business Quotes cards (Uploaded, Approved, Not Approved, Expired), Policies cards (New Business Issued, Renewed, Non-Renewed, Cancelled), Written Premium by Coverage Level chart, Failed Payments grid | All authenticated roles (scoped by role) | EV-0-0218 | HIGH |
| View Profile (`/InsureEdgePortal/ViewProfile`) | User self-service profile: 8 tabs — Personal, Professional, Banking Details, Security, Activity, Preferences, Access, Documents | All authenticated roles (own profile only) | EV-0-0222 | MEDIUM |
| Global Search Dropdown | Cross-module search spanning Users, User Groups, Distribution (3 tabs) | All roles | EV-0-0222 | HIGH |
| User Avatar Dropdown | View Profile / Logout / Last Login timestamp | All roles | EV-0-0222 | HIGH |

---

### 1.2 Module: Quotes & Policies (`/Policy/`)

| Screen | Primary Function | Roles with Access | Evidence | Confidence |
|--------|-----------------|-------------------|----------|------------|
| Q&P Landing Page — Individual New Business Quotes | List of Individual new-business quotes with KPI cards (Uploaded/Approved/Not Approved/Expired); keyword search; column filter/sort; pagination | Client Admin (Full, scoped); Intermediary/Producer (Scoped); UserRole (per group) | EV-0-0218 | HIGH |
| Q&P Landing Page — Individual Endorsement Quotes | List of Individual endorsement quotes | Same as above | EV-0-0218 (noted; not individually captured) | MEDIUM |
| Q&P Landing Page — Individual Renewal Quotes | List of Individual renewal quotes | Same as above | EV-0-0218 (noted; not individually captured) | MEDIUM |
| Q&P Landing Page — Individual Policies | List of issued Individual policies with KPI cards (Total/Active/Lapsed/Expired); grid with Policy Number format 001-00004-0000318-00 | Same as above | EV-0-0218 | HIGH |
| Q&P Landing Page — Business New Business Quotes | List of Business-segment new-business quotes | Same as above | EV-0-0218 (noted; not individually captured) | MEDIUM |
| Q&P Landing Page — Business Endorsement Quotes | List of Business endorsement quotes | Same as above | EV-0-0218 | MEDIUM |
| Q&P Landing Page — Business Renewal Quotes | List of Business renewal quotes | Same as above | EV-0-0218 | MEDIUM |
| Q&P Landing Page — Business Policies | List of issued Business policies | Same as above | EV-0-0218 | MEDIUM |
| New Submission Wizard — Step 1: Policy Information | Capture effective date, policy term, writing company, primary insured type, insured name, mailing address (Google geocoded), contact info, additional named insureds | Client Admin, Intermediary/Producer | EV-0-0218 | HIGH |
| New Submission Wizard — Step 2.1: Risk Location | Define risk property locations; reuse mailing address toggle; add multiple locations with photo placeholder | Client Admin, Intermediary/Producer | EV-0-0218 | HIGH |
| New Submission Wizard — Step 2.2: Risk Information | Capture editable flood/building info; display read-only HexCat-provided risk data (zone IDs, construction type, etc.); HexCat status gates progression | Client Admin, Intermediary/Producer | EV-0-0218 | HIGH |
| New Submission Wizard — Step 2.3: Limits & Coverages | Select dwelling limits, deductibles, coverage level (Basic/Standard/Preferred), liability, and peril endorsements (Sinkhole, Earthquake, Flood, Wind & Hail, WildFire) | Client Admin, Intermediary/Producer | EV-0-0218 | HIGH |
| New Submission Wizard — Step 2.4: Plans Overview | Side-by-side plan comparison (Basic/Standard/Preferred); select deductible and liability coverage | Client Admin, Intermediary/Producer | EV-0-0218 | HIGH |
| New Submission Wizard — Step 3: Quote Review | Display estimated premium (Risk Premium + Coverage Premium); editable summary cards for Policy Information and Insured Detail; Limit & Premium Summary table; Document dropdown in footer | Client Admin, Intermediary/Producer | EV-0-0218 | HIGH |
| New Submission Wizard — Step 4: Finalize Quote | Final binding step before policy issuance | Client Admin, Intermediary/Producer | EV-0-0218 (present in stepper; content not captured) | LOW |
| New Submission Wizard — Step 5: Documents | Upload and manage submission documents | Client Admin, Intermediary/Producer | EV-0-0218 (present in stepper; content not captured) | LOW |
| Policy 360 — Summary tab | Policy Information card, Producer Information table, Financials cards (Coverage Premium, Taxes, Fees, Total Premium) | Client Admin (Full, scoped); Intermediary (own) | EV-0-0218 | HIGH |
| Policy 360 — Contacts tab | Contact details for policy parties | Same | EV-0-0218 (tab confirmed; content not deeply captured) | MEDIUM |
| Policy 360 — Billing tab | Premium payment details: Payment Frequency, Responsible Party, Mode of Payment, Number of Installments, Installment Fee; payment schedule grid | Same | EV-0-0218 | HIGH |
| Policy 360 — Pending Transactions tab | Open/pending transaction listing | Same | EV-0-0218 (tab confirmed; content not deeply captured) | MEDIUM |
| Policy 360 — Policy History tab | Transaction history grid: Action, Policy Number, Transaction Type, Transaction Effective Date | Same | EV-0-0218 | HIGH |
| Policy 360 — Claims tab | Claims associated with the policy | Same | EV-0-0218 (tab confirmed; content not deeply captured) | MEDIUM |
| Policy 360 — Notes tab | User-added notes on the policy | Same | EV-0-0218 (tab confirmed; content not deeply captured) | MEDIUM |
| Policy 360 — Timeline tab | Chronological event log: date badge, transaction-type chip, Created By, Timestamp | Same | EV-0-0218 | HIGH |
| Tools — Endorse Policy (wizard) | Mid-term endorsement transaction | Client Admin | EV-0-0218 (entry point confirmed; wizard content not captured) | LOW |
| Tools — Cancel Policy (wizard) | Policy cancellation transaction | Client Admin | EV-0-0218 (entry point confirmed; wizard content not captured) | LOW |
| Tools — Cancel/Rewrite Policy (wizard) | Cancel existing + create rewritten policy | Client Admin | EV-0-0218 (entry point confirmed; wizard content not captured) | LOW |
| Tools — Do Not Renew (wizard) | Set renewal disposition to non-renewal | Client Admin | EV-0-0218 (entry point confirmed; wizard content not captured) | LOW |
| Tools — Renew Manually (wizard) | Trigger manual renewal transaction | Client Admin | EV-0-0218 (entry point confirmed; wizard content not captured) | LOW |

**Screenshot evidence (PNG filenames only — EV-0-0168 to EV-0-0217):** 50 screenshots taken 2026-06-12 and 2026-06-15 covering the Q&P module. Timestamps suggest a sequential walkthrough of the New Submission wizard and Policy 360. Content is not extractable from names; the PRD text (EV-0-0218) is the authoritative UI description.

---

### 1.3 Module: Claims (`/Claims/` — inferred)

| Screen | Primary Function | Roles with Access | Evidence | Confidence |
|--------|-----------------|-------------------|----------|------------|
| Claims List / Inquiry | Browse and search all claims | Client Admin (scoped), Adjuster (assigned only), UserRole (per group) | EV-0-0048, EV-0-0226 | LOW |
| Claims Dashboard | Claims KPI metrics | Client Admin, Adjuster | EV-0-0048 | LOW |
| FNOL Registration | First Notice of Loss intake form | Client Admin (Full, client-scoped), Adjuster (Full, client-scoped) | EV-0-0048, EV-0-0226 | LOW |
| Bulk Claim Upload | Batch claim import | Client Admin (per IsUploadPermission) | EV-0-0048 | LOW |
| Claims Authority | Claims authority/approval configuration | Client Admin | EV-0-0048 | LOW |
| Adjuster Management | Adjuster directory and assignment | Client Admin | EV-0-0226 | LOW |
| Payee List | Claimant payee records | Client Admin | EV-0-0048 | LOW |
| Catastrophic Events | CAT event tracking | Client Admin | EV-0-0048 | LOW |
| Claim Letter Template | Template management for claim letters | Client Admin | EV-0-0048 | LOW |
| Claims Master Configuration | Claims configuration/admin | Client Admin | EV-0-0048 | LOW |
| Claim Workflow — Claims Summary | Claim detail summary view | Client Admin, Adjuster | EV-0-0048 | LOW |
| Claim Workflow — Loss Information | Loss event details | Client Admin, Adjuster | EV-0-0048 | LOW |
| Claim Workflow — Claims Review | Review/approval step | Client Admin, Adjuster | EV-0-0048 | LOW |
| Claim Workflow — Documents | Claim document management | Client Admin, Adjuster (per Upload/Download) | EV-0-0048 | LOW |
| Claim Workflow — Financials: Worksheet | Claims financial worksheet | Client Admin, Adjuster (per IsApproveReject) | EV-0-0048 | LOW |
| Claim Workflow — Financials: Claims Payee | Payee and payment management | Client Admin | EV-0-0048 | LOW |
| Claim Workflow — Insured & Policy | Insured and policy details in claim context | Client Admin, Adjuster | EV-0-0048 | LOW |
| Claim Workflow — Claims Escalation | Escalation tracking | Client Admin | EV-0-0048 | LOW |
| Claim Workflow — Recovery | Subrogation/recovery tracking | Client Admin | EV-0-0048 | LOW |
| Claim Workflow — Claim Referred | Referral tracking | Client Admin | EV-0-0048 | LOW |
| Claim Workflow — Under Litigation | Litigation flag and tracking | Client Admin | EV-0-0048 | LOW |
| Claim Workflow — Task | Task assignment within claim | Client Admin, Adjuster | EV-0-0048 | LOW |
| Claim Workflow — Timeline | Chronological claim event log | Client Admin, Adjuster | EV-0-0048 | LOW |
| Claim Workflow — Claim Letters | Correspondence management | Client Admin | EV-0-0048 | LOW |

**Note (INSUREEDGE-2026-DBT-1-0003):** Zero UI text evidence for Claims. All rows above are inferred from permission model (EV-0-0048, EV-0-0226) and function index (467 functions — EV-0-0003). Confidence is LOW across the board.

---

### 1.4 Module: Billing Management (`/Billing/`)

| Screen | Primary Function | Roles with Access | Evidence | Confidence |
|--------|-----------------|-------------------|----------|------------|
| Billing List | Browse policy billing records | Client Admin (Scoped), Intermediary (Scoped) | EV-0-0226 | LOW |
| Make Payment | Process a payment | Client Admin (per IsCreatePermission) | EV-0-0226 | LOW |
| Policy Payments sub-feature | Policy payment management (only confirmed permission row for Billing) | Client Admin, UserRole (per group) | EV-0-0048 | LOW |

**Note (INSUREEDGE-2026-DBT-1-0005):** Only 13 functions and 1 permission row exist for Billing. The Policy 360 Billing tab (EV-0-0218) provides the most concrete billing UI detail.

---

### 1.5 Module: Distribution Management (`/DistributionManagement/`)

| Screen | Primary Function | Roles with Access | Evidence | Confidence |
|--------|-----------------|-------------------|----------|------------|
| Intermediary / Distributor List | Browse and manage intermediaries/producers | Client Admin (Full, client-scoped), Intermediary (own only) | EV-0-0226 | LOW |
| Intermediary Detail | View/edit intermediary profile and commission details | Client Admin, Intermediary (own) | EV-0-0226 | LOW |
| Distribution Management Landing Page | Module entry screen (confirmed in permission model) | Client Admin | EV-0-0048 | LOW |

**Note (INSUREEDGE-2026-DBT-1-0004):** Distribution Management PDF (EV-0-0044) was confirmed to exist but its content was not read. The function index shows 144 functions. All UI content for this module is LOW confidence.

---

### 1.6 Module: Groups / User Groups Management (`/GroupManagement/`)

| Screen | Primary Function | Roles with Access | Evidence | Confidence |
|--------|-----------------|-------------------|----------|------------|
| Group Management Landing Page | Browse groups with KPI cards (Total/Active/Inactive); searchable, filterable, sortable data grid; Download (PDF/CSV/Excel/TXT) | Client Admin (Full, client-scoped) | EV-0-0048 | HIGH |
| Add User Group | Create a new group: Group ID (auto), Status toggle, Group Name, Group Email, Group Leader (required searchable dropdown), Group Description, Group Members panel, Group Rights permission accordions (8 modules, 51 rows) | Client Admin | EV-0-0048 | HIGH |
| View Group | Read-only view of group with inline edit pencils for Information, Members, and Rights panels | Client Admin | EV-0-0048 | HIGH |
| Edit Group (inferred) | Same as Add but pre-populated; accessed via pencil icons in View Group | Client Admin (per IsEditPermission) | EV-0-0048 | MEDIUM |

---

### 1.7 Module: Users / User Management (`/UsersManagement/`)

| Screen | Primary Function | Roles with Access | Evidence | Confidence |
|--------|-----------------|-------------------|----------|------------|
| User Management Landing Page | Browse users: KPI cards (Total/Active/Inactive), keyword search, column filter, sortable User Name column, column picker, Import Users (stub), Add Users button | Client Admin (Full, client-scoped) | EV-0-0222 | HIGH |
| View User | Full user profile: Primary Info, Address, Contact Details, User-Rights (7 module accordions, 9-permission matrix); Reset Password button | Client Admin | EV-0-0222 | HIGH |
| Add User | Create user form: all Primary Info fields, Address (Google Maps), Contact Details, User-Rights (8 module accordions) | Client Admin | EV-0-0222 | HIGH |
| Edit User — Primary Info (inline) | Inline edit section for name, DOB, gender, work remotely, office location, groups, department, manager, reports-to | Client Admin | EV-0-0222 | HIGH |
| Edit User — Address (inline) | Inline edit section with Google Maps autocomplete or manual entry; "Same as Office Location" shortcut | Client Admin | EV-0-0222 | HIGH |
| Edit User — Contact Details (inline) | Inline edit section for phone (international), extension, alt phone, email | Client Admin | EV-0-0222 | HIGH |
| Edit User — User-Rights (inline) | Inline edit section for all 8-module permission accordions with Read Only / All Access toggles | Client Admin | EV-0-0222 | HIGH |
| Reset Password Modal | Confirmation overlay before sending temporary password email | Client Admin | EV-0-0222 | HIGH |
| Unsaved Changes Modal | Navigation guard: "Do you want to leave?" when navigating away with dirty form | Client Admin | EV-0-0222 | HIGH |
| Column Filter Panel | Floating filter with "Filter by Condition" (9 operators) and "Filter by Value" (multi-select) tabs | Client Admin | EV-0-0222 | HIGH |
| Column Picker | Column visibility toggle (9 columns) | Client Admin | EV-0-0222 | HIGH |
| Import Users Stub | Placeholder for bulk import (shows "Not Implemented" toast) | Client Admin | EV-0-0222 | HIGH |

---

### 1.8 Module: Reports / Report Management

| Screen | Primary Function | Roles with Access | Evidence | Confidence |
|--------|-----------------|-------------------|----------|------------|
| Report List | Browse available reports | All roles (scoped per role) | EV-0-0226 | LOW |
| Report Viewer | View/export specific reports | All roles (scoped) | EV-0-0226 | LOW |
| Bordereaux — MGA to Issuer | MGA-to-issuer bordereaux report | Client Admin, Intermediary (Scoped) | EV-0-0048 | LOW |
| Claims Management Reports | Claims management reporting | Client Admin (Approve/Reject permission includes Reports) | EV-0-0048 | LOW |
| Claim Financial Reports | Claims financials reporting | Same | EV-0-0048 | LOW |
| Loss & Exposure Reports | Loss and exposure analysis | Same | EV-0-0048 | LOW |
| Compliance / Regulatory Reports | Regulatory reporting | Same | EV-0-0048 | LOW |
| Reinsurance / Catastrophe Reports | Reinsurance and CAT reporting | Same | EV-0-0048 | LOW |
| Policy — New Business Issuance Report | New business policy issuance counts/premiums | Client Admin | EV-0-0048 | LOW |
| Policy — New Business Premium Report | Premium reporting for new business | Client Admin | EV-0-0048 | LOW |
| Policy — No. of Policies by Transaction Type | Transaction-type segmentation report | Client Admin | EV-0-0048 | LOW |
| Commissions Reports | Producer/intermediary commission reporting | Client Admin | EV-0-0048 | LOW |

---

### 1.9 Modules: Admin, Products, Accounts, Clients

| Module | Evidence of UI | Notes |
|--------|---------------|-------|
| Admin / Platform Admin Dashboard | Confirmed in roles_permissions.md — PlatformAdmin only | No sidebar entry for client users. Not part of the client tenant UI. [EV-0-0226] |
| Products / Product Management | 12 functions in index; PlatformAdmin-only per roles_permissions.md | No sidebar entry; admin-only configuration. [EV-0-0003, EV-0-0226] |
| Accounts | 29 functions; AccountList/AccountDetail in roles matrix | No sidebar entry observed. May be accessed via a different navigation path or be an internal data layer. [EV-0-0003, EV-0-0226] |
| Clients | 93 functions; ClientList/ClientDetail in roles matrix (Client Admin = "Own only") | No sidebar entry observed. Client may be equivalent to "tenant" not a navigable screen. [EV-0-0003, EV-0-0226] |

**Cross-reference to Logic Agent (REF-1-0001):** The Clients and Accounts modules have significant function counts (93 and 29) but no UI evidence. Logic Agent should investigate whether these are backend-only or have unreached UI screens.

---

## 2. Navigation Graph

### 2.1 Top-Level Application Shell

The application uses a fixed three-region layout consistent across all modules:

```
+----------------------------------------------------------+
|  HEADER (fixed)                                           |
|  [☰] [HUDSON BAILEY logo] [Global Search.........] [HC▾]|
+--------+-------------------------------------------------+
|        |                                                  |
|  LEFT  |  MAIN CONTENT (module-specific)                 |
|  SIDE  |                                                  |
|  BAR   |                                                  |
| ~50px  |                                                  |
|  8     |                                                  |
| icons  |                                                  |
|        |                                                  |
+--------+-------------------------------------------------+
```

### 2.2 Sidebar Navigation Order (VERIFIED — EV-0-0218, EV-0-0222, EV-0-0048)

```
1  Dashboard          → /InsureEdgePortal (global KPI landing)
2  Quotes & Policies  → /Policy/LandingPage
3  Claims             → /Claims/ (inferred)
4  User Management    → /UsersManagement/LandingPage
5  User Groups Mgmt   → /GroupManagement/
6  Distribution Mgmt  → /DistributionManagement/ (inferred)
7  Billing Management → /Billing/ (inferred)
8  Report Management  → /ReportManagement/ (inferred)
```

### 2.3 Quotes & Policies Navigation Graph

```
Sidebar [Quotes & Policies]
    └── Q&P Landing Page (/Policy/)
            ├── Left Actions Panel
            │    ├── Individual
            │    │    ├── New Business Quotes → [List] → [eye] → New Submission Wizard
            │    │    │                                   Step 1: Policy Information
            │    │    │                                   Step 2.1: Risk Location
            │    │    │                                   Step 2.2: Risk Information
            │    │    │                                   Step 2.3: Limits & Coverages
            │    │    │                                   Step 2.4: Plans Overview
            │    │    │                                   Step 3: Quote Review
            │    │    │                                   Step 4: Finalize Quote (gated)
            │    │    │                                   Step 5: Documents (gated)
            │    │    ├── Endorsement Quotes → [List] → (wizard — not captured)
            │    │    ├── Renewal Quotes     → [List] → (wizard — not captured)
            │    │    └── Policies           → [List] → Policy 360 (/Policy/PolicySummary)
            │    │                                        ├── Summary
            │    │                                        ├── Contacts
            │    │                                        ├── Billing
            │    │                                        ├── Pending Transactions
            │    │                                        ├── Policy History
            │    │                                        ├── Claims
            │    │                                        ├── Notes
            │    │                                        ├── Timeline
            │    │                                        └── Tools ▾
            │    │                                             ├── Endorse Policy
            │    │                                             ├── Cancel Policy
            │    │                                             ├── Cancel/Rewrite
            │    │                                             ├── Do Not Renew
            │    │                                             └── Renew Manually
            │    └── Business (mirrors Individual structure)
            └── Recent Activity feed (right rail)
```

### 2.4 User Management Navigation Graph

```
Sidebar [User Management]
    └── Landing Page (/UsersManagement/LandingPage)
            ├── [+ Add Users] → Add User (/UsersManagement/AddUsers?IsViewMode=false)
            │                     ├── User Primary Info Form
            │                     ├── Address Form (Google Maps)
            │                     ├── Contact Details Form
            │                     ├── User-Rights (8 module accordions)
            │                     └── [Save] / [Cancel → Landing]
            ├── [👁 View] → View User (/UsersManagement/AddUsers?IsViewMode=true&Identifier={enc})
            │                ├── [✏ Primary Info] → Edit Primary Info (inline)
            │                ├── [✏ Address] → Edit Address (inline, Google Maps)
            │                ├── [✏ Contact Details] → Edit Contact Details (inline)
            │                ├── [✏ User-Rights] → Edit User-Rights (inline, 8 accordions)
            │                ├── [Reset Password] → Reset Password Modal → [Confirm] email sent
            │                └── [Back] → (if dirty → Unsaved Changes Modal → Landing)
            └── [Import Users] → "Not Implemented" toast (stub)
```

### 2.5 Group Management Navigation Graph

```
Sidebar [User Groups Management]
    └── Landing Page (/GroupManagement/)
            ├── [+ Add User Group] → Add User Group (/GroupManagement/AddUserGroup?IsViewMode=false)
            │                          ├── User Group Information panel (Group ID auto, Status, Name*, Email, Leader*, Description)
            │                          ├── Group Members panel (search, + Add User)
            │                          ├── Group Rights section (8 module accordions, 51 permission rows)
            │                          └── [Save] / [Cancel → Landing]
            ├── [👁 View] → View Group (/GroupManagement/AddUserGroup?IsViewMode=true&ID={enc})
            │                ├── [✏ Group Information] → Edit inline (inferred)
            │                ├── [✏ Group Members] → Edit inline (inferred)
            │                ├── [✏ Group Rights] → Edit inline (inferred)
            │                └── [Back → Landing]
            └── [Download ▾] → PDF / CSV / Excel / TXT export
```

### 2.6 Cross-Module Links

| From | To | Trigger | Confidence |
|------|----|---------|------------|
| User Avatar (any module) | View Profile (/InsureEdgePortal/ViewProfile) | "View Profile" menu item | HIGH |
| Policy 360 Claims tab | Claims module (inferred) | Tab click — exact target unknown | LOW |
| Global Search | Users / User Groups / Distribution results | Type in header search | HIGH (3-tab confirmed) |
| Sidebar icon | Any of 8 modules | Click sidebar icon | HIGH |

---

## 3. Key User Journeys

### Journey 1: New Quote Creation (New Business, Individual)

| Step | Screen | Action | Confidence |
|------|--------|--------|------------|
| 1 | Q&P Landing Page | Click "Individual > New Business Quotes" in left Actions panel | HIGH |
| 2 | Individual New Business Quotes list | Click "+ New Submission" or view an existing draft quote | HIGH |
| 3 | Step 1 — Policy Information | Enter Effective Date, Policy Term, Writing Company, Insured Type (Individual), Named Insured (First/Last Name, Is65OrOlder), Mailing Address (Google geocode), Contact Info, Additional Named Insureds | HIGH |
| 4 | Step 2.1 — Risk Location | Add risk location address (or copy mailing address via checkbox); system shows photo placeholder and address fields | HIGH |
| 5 | Step 2.2 — Risk Information | Enter Building Flood Elevation, Building Type, Building Description, Roof Year; system calls HexCat API and populates read-only risk fields; review HexCat status | HIGH |
| 6 | Step 2.3 — Limits & Coverages | Set Dwelling Asset Limit, deductible, Coverage Level, Liability Amount, peril endorsements (Flood, Wind & Hail, Wildfire, Earthquake, Sinkhole); totals auto-compute | HIGH |
| 7 | Step 2.4 — Plans Overview | Compare plan options (Basic/Standard/Preferred); select deductible and liability level | HIGH |
| 8 | Step 3 — Quote Review | Review estimated premium (Risk + Coverage Premium); review Policy Information and Insured Detail cards; access Document dropdown | HIGH |
| 9 | Step 4 — Finalize Quote | (Content not captured; assumed: final premium confirmation, binding agreement) | LOW |
| 10 | Step 5 — Documents | (Content not captured; assumed: upload/download submission documents) | LOW |
| 11 | System | Quote status changes from Draft to Approved/Bound; policy record created | MEDIUM |

**Evidence gaps:** Steps 9–10 not rendered in PRD (gated by completion of prior steps). Steps confirmed to exist in the stepper UI.

---

### Journey 2: Policy Issuance (Quote → Active Policy)

| Step | Screen | Action | Confidence |
|------|--------|--------|------------|
| 1 | Quote Review (Step 3) | Verify premium summary | HIGH |
| 2 | Finalize Quote (Step 4) | Bind the quote (content unknown) | LOW |
| 3 | Documents (Step 5) | Attach/generate issuance documents | LOW |
| 4 | System | Policy Number generated (format 001-00004-0000318-00); Status set to Active | HIGH |
| 5 | Policy 360 — Summary tab | Producer Information table, Financials cards rendered | HIGH |
| 6 | Policy 360 — Billing tab | Payment schedule created (Monthly/Annual installments) | HIGH |

**Business Logic Screenshots confirm:** `CreatePolicies2.png`, `CreatePolicyNumber_HB.png`, `GenerateNewBusinessHBISPolicyNumber.png`, `InitiateProcess_NewBusinessPolicyPackage.png` — these named flows support the issuance process. [EV-0-0049 to EV-0-0155 — LOW confidence from names]

---

### Journey 3: Claim FNOL Submission

| Step | Screen | Action | Confidence |
|------|--------|--------|------------|
| 1 | Claims module | Navigate to Claims via sidebar | MEDIUM |
| 2 | Claims List or Dashboard | Identify affected policy | LOW |
| 3 | FNOL Registration | Complete First Notice of Loss form (fields unknown) | LOW |
| 4 | Claim Workflow | Progress through Claims Summary → Loss Information → Claims Review | LOW |
| 5 | Documents tab | Upload supporting documentation | LOW |
| 6 | Financials — Worksheet | Assess claim financials | LOW |
| 7 | Claims Payee | Set up payment to claimant | LOW |

**Evidence gap (INSUREEDGE-2026-DBT-1-0003):** All FNOL and claims workflow UI is LOW confidence. Zero text PRD available for Claims. The permission matrix (EV-0-0048) and function count (467 functions — EV-0-0003) confirm this is a substantial module.

---

### Journey 4: User Management — Create User, Assign Group

| Step | Screen | Action | Confidence |
|------|--------|--------|------------|
| 1 | User Management Landing Page | Click "+ Add Users" | HIGH |
| 2 | Add User | Enter First Name, Last Name (required); select Gender, Office Location (required); set Work Remotely; optionally set DOB, Department | HIGH |
| 3 | Add User — Address | Type in Google Address Search → select address → lat/long auto-populated; OR check "Enter Address Manually" | HIGH |
| 4 | Add User — Contact Details | Enter Telephone (US format +1, required), Email ID (required) | HIGH |
| 5 | Add User — User-Rights | Expand module accordions; use "All Access" or "Read Only" toggles per module; or set individual checkboxes (9 permissions × N features) | HIGH |
| 6 | Add User — Group(s) field | Select one or more groups (Underwriting, Claims, Claims Department, All Access Group observed) from multi-select in Primary Info section | HIGH |
| 7 | Click Save | System auto-generates User ID (IE0007), creates user record | HIGH |
| 8 | Landing Page | New user appears in grid; KPI cards update (Total +1, Active +1) | HIGH |

**Alternative path — Assign group via Group Management:**
| Step | Screen | Action | Confidence |
|------|--------|--------|------------|
| 1 | Group Management Landing Page | Click eye icon on target group | HIGH |
| 2 | View Group — Group Members panel | Click "✏ Edit" on Members panel | MEDIUM |
| 3 | Edit Members | Click "+ Add User" → search for user → add | MEDIUM |
| 4 | Save | Member count increments | MEDIUM |

---

### Journey 5: Intermediary Onboarding

| Step | Screen | Action | Confidence |
|------|--------|--------|------------|
| 1 | Distribution Management Landing Page | Access via sidebar icon 6 | LOW |
| 2 | Intermediary List | Browse existing intermediaries | LOW |
| 3 | Add Intermediary / Onboarding form | (Content unknown — from PDF EV-0-0044 not read) | LOW |
| 4 | Commission configuration | Set commission percentage (e.g., 12% observed in Policy 360) | LOW |
| 5 | Association with policies | Intermediary appears in Producer Information table on Policy 360 Summary | MEDIUM |

**Evidence gap (INSUREEDGE-2026-DBT-1-0004):** All Distribution Management UI is LOW confidence. The PDF (EV-0-0044) must be read to close this gap.

---

## 4. Forms & Field Inventory (Quotes & Policies Module)

### 4.1 Form: Policy Information (Step 1) — EV-0-0218

| Field | Input Type | Required | Default / Example | Notes |
|-------|-----------|----------|-------------------|-------|
| Effective Date | Date picker | Yes | 06-18-2026 | — |
| Policy Term | Select | Yes | Annual | Lookup: GetPolicyTerm |
| Expiration Date | Date (derived, read-only) | — | 06-18-2027 | Effective + Term |
| Quote Creation Date | Date (read-only) | — | 06-05-2026 | System-set |
| Writing Company | Select | Yes | Sierra Specialty Insurance Company | Lookup: GetWritingCompanies |
| Type of Primary Insured | Select | Yes | Individual | Lookup: GetPrimaryInsuredType |
| First Name | Text | Yes | Sameer | Required for Individual |
| Middle Name | Text | No | J | Optional |
| Last Name | Text | Yes | Precious | Required for Individual |
| Are you 65 or older? | Select (Yes/No) | Yes | Yes | Lookup: GetIsOldEnum; rating/eligibility factor |
| Mailing Address | Autocomplete (Google Places) | — | 430 Oil Mill Drive, Tornillo, TX | Geocoding integration |
| Latitude | Numeric (derived) | — | 31.461081 | From geocoding |
| Longitude | Numeric (derived) | — | -106.0901812 | From geocoding |
| Telephone | Phone (country code) | — | (738) 283-1100 | — |
| Alt Telephone | Phone | — | — | Optional |
| Email ID | Email | — | sameerdamcogroup@yopmail.com | — |
| Additional Named Insured(s) | Table (repeating) | — | Name, Relationship, Telephone, Email, Alt Telephone | 0..n rows |

**Noted gap:** Organization Name / Doing Business As fields for Business-segment insured type not captured. Mortgage panel noted as missing in PRD.

---

### 4.2 Form: Risk Information (Step 2.2) — EV-0-0218

**Editable fields:**
| Field | Input Type | Required |
|-------|-----------|----------|
| Building Flood Elevation | Select | — |
| Building Type | Select | — (e.g., "No basement/enclosure") |
| Building Description | Select | — (e.g., "1 floor") |
| Roof Year | Numeric | — |
| Flood Zone | Select | Yes (*) |

**HexCat-provided (read-only after API call):**
| Field | Notes |
|-------|-------|
| Hex Zone ID Lower / Higher | CAT zone identifiers |
| Year Built | Property age |
| Construction Type | Frame/masonry/etc. |
| Foundation Type | — |
| Number of Stories | — |
| Square Footage | — |
| Residence Type | — |
| Roof Age / Covering / Shape | — |
| Presence of Basement | Boolean |
| HexCat Status | "Not Approved" / "Approved" — gates risk acceptance |
| Status Time Stamp | — |

---

### 4.3 Form: Limits & Coverages (Step 2.3) — EV-0-0218

| Field | Type | Required |
|-------|------|----------|
| Dwelling Asset Limit | Numeric | Yes (*) |
| Appurtenant Structure Assets Limit | Numeric | — |
| Personal Assets (Other than Fixed) | Numeric | — |
| Dwelling Occupancy Disruption Limit | Numeric | Yes (*) |
| Total Insured Values | Numeric (derived) | — |
| Physical Damage Deductible | Select | Yes (*) |
| Coverage Level | Select | — (Basic / Standard / Preferred) |
| Amount of Liability Coverage | Select | Yes (*) |
| Excess Scheduled Blanket Coverage | Select | Yes (*) |
| Sinkhole and Catastrophic Ground | Select | Yes (*) |
| Earthquake | Select | Yes (*) |
| Flood | Select | Yes (*) |
| Wind & Hail | Select | Yes (*) |
| WildFire | Select | Yes (*) |

**Noted gap:** Premium computation fields and additional coverage parameters were noted as missing in the PRD capture.

---

### 4.4 Form: Add User (User Management) — EV-0-0222

**User Primary Information:**
| Field | Input Type | Required |
|-------|-----------|----------|
| User ID | Read-only | Auto-generated (IE00XX) |
| Status | Toggle (Active/Inactive) | Default: Active |
| Profile Image | File upload (PNG/JPEG/GIF, 10KB–10MB) | No |
| First Name | Text | Yes |
| Middle / Initial Name | Text | No |
| Last Name | Text | Yes |
| Suffix | Text | No |
| Date of Birth | Date picker (MM-DD-YYYY) | No |
| Gender | Select | Yes |
| Works Remotely | Radio (Yes/No) | Yes (default: No) |
| Office Location | Select | Yes |
| Group(s) | Multi-select | No |
| Department / Function | Select/text | No |
| Is Manager | Checkbox/toggle | No |
| Reports To | Select/search | No (conditional) |

**Address:**
| Field | Input Type | Required |
|-------|-----------|----------|
| Same as Office Location | Checkbox shortcut | No |
| Google Address Search | Autocomplete | No (alternative to manual) |
| Enter Address Manually | Checkbox | No |
| Address Line 1 | Text | Yes |
| Address Line 2 | Text | No |
| Country | Select (clearable) | Yes (default: United States) |
| State | Select | Yes |
| City | Text | Yes |
| County | Text | Yes |
| Zip Code | Text | Yes |
| Latitude | Numeric (auto) | No |
| Longitude | Numeric (auto) | No |

**Contact Details:**
| Field | Input Type | Required |
|-------|-----------|----------|
| Telephone Number | Phone (country flag, US default) | Yes |
| Extension | Text | No |
| Alternative Telephone Number | Phone | No |
| Email ID | Email | Yes (immutable after creation) |

**User-Rights:** 8 module accordions × up to 23 feature rows × 9 permissions = up to 51 configurable permission rows per user.

---

### 4.5 Form: Add User Group (Group Management) — EV-0-0048

| Field | Input Type | Required |
|-------|-----------|----------|
| Group ID | Read-only | Auto-generated (4-digit padded) |
| Status | Toggle (Active/Inactive) | Default: Active |
| Group Name | Text | Yes |
| Group Email ID | Text (email) | No |
| Group Leader | Single-select searchable dropdown | Yes |
| Group Description | Textarea | No |
| Group Members | Panel with search + add-user button | No (0..n members) |
| Group Rights | 8-module accordion permission matrix | No (defaults to all-off) |

---

## 5. UI Evidence Gaps

### 5.1 Modules with NO UI Evidence

| Module | Gap ID | Evidence Available | Impact |
|--------|--------|--------------------|--------|
| Claims | INSUREEDGE-2026-DBT-1-0003 | Sidebar confirmed, 467 functions in index, 23 permission rows in group model | HIGH — complete blind spot for a major module |
| Billing Management (standalone) | INSUREEDGE-2026-DBT-1-0005 | 13 functions, 1 permission row; billing visible via Policy 360 tab only | MEDIUM |
| Admin / Platform Admin | — (intentional scope) | roles_permissions.md confirms scope; not a client-facing module | LOW |
| Products / Product Management | — | 12 functions, PlatformAdmin only | LOW |
| Accounts | — | 29 functions; no sidebar entry | MEDIUM |
| Clients | — | 93 functions; no sidebar entry | MEDIUM |

### 5.2 Modules with Partial UI Evidence

| Module | Gap ID | What's Missing | Confidence So Far |
|--------|--------|---------------|-------------------|
| Quotes & Policies | INSUREEDGE-2026-DBT-1-0001, DBT-1-0002 | Finalize Quote (Step 4), Documents (Step 5), all 5 Tools transaction wizards (Endorse, Cancel, Cancel/Rewrite, Do Not Renew, Renew Manually), Business-segment form fields, Contacts/Pending Transactions/Claims/Notes tab content, validation error messages, full dropdown enums | MEDIUM-HIGH for captured portions; LOW for missing steps |
| Distribution Management | INSUREEDGE-2026-DBT-1-0004 | PDF (EV-0-0044) not read; full UI unknown | LOW |
| Report Management | INSUREEDGE-2026-ASM-1-0004 | No PRD; report types listed in permission model only; no screen layouts | LOW |
| User Management | — | Validation error messages, full Office Location / Department / Gender dropdown option lists, full role matrix beyond Client Admin, Import Users specification | MEDIUM-HIGH for captured portions |
| Group Management | — | Edit Group wizard behavior, Add Member modal, bulk action behavior, Import Group specification | MEDIUM-HIGH for captured portions |

### 5.3 Assumption flags (INSUREEDGE-2026-ASM-1-000x)

All 6 assumptions recorded in the YAML contract apply here. Key LOW-confidence assumptions to validate:
- **ASM-1-0003:** Claims module UI mirrors Quotes & Policies pattern (no evidence).
- **ASM-1-0004:** Distribution Management UI contains intermediary management screens (PDF not read).
- **ASM-1-0005:** Finalize Quote triggers document generation (inferred from BL screenshot names only).

---

## 6. Cross-Domain Referrals (REF-)

The following UI findings surface data entity, business rule, or logic concerns that should be captured by the respective agents:

| REF ID | Finding | Referred To | Detail |
|--------|---------|-------------|--------|
| REF-1-0001 | Clients module (93 functions) has no sidebar UI entry. Either it is a backend-only data layer or its UI is embedded in another module (e.g., Quotes & Policies shows "Insured" not "Client"). | Data Agent + Logic Agent | Clarify whether Client and Insured are the same entity or different. |
| REF-1-0002 | HexCat integration populates 12+ read-only risk fields in the Quote wizard and drives an approval-status decision gate. | Integration Agent | HexCat API contract (request/response schema, status values, retry behavior) must be documented. |
| REF-1-0003 | Premium calculation formula (CoveragePremium + Taxes + Fees = TotalPremium) is visible in Policy 360 Financials and Quote Review. Underlying rating engine involves HexCat zone data and coverage selections. | Logic Agent | Rating Engine is a separate OutSystems module (43 functions — EV-0-0003). Rating formula is not exposed in the UI. |
| REF-1-0004 | LenderDock integration appears in Business Logic Screenshots (Notify_Mortgage_LenderDock.png, Notify_MortgageBillLenderDock.png, FailedNotificationLenderdock2.png). Mortgage panel is noted as missing in the PRD Step 2.2 capture. | Integration Agent + Logic Agent | Mortgage/lienholder data and LenderDock notification workflow need separate discovery. |
| REF-1-0005 | Commission is computed per producer/agency (sample: 12% → 1,452.00 total commission, CommissionPaid field). CommissionDetails_Endorsements.png and CreateorUpdateHBIScommissiondetails BL screenshots exist. | Data Agent + Logic Agent | Commission entity, calculation rules, and endorsement commission adjustments need full documentation. |
| REF-1-0006 | ActionCreateLog + RecentActivity feed is active across all screens — suggests a unified audit entity in the data model. | Data Agent | Audit/activity log entity structure and retention rules should be documented. |
| REF-1-0007 | Password reset generates a "temporary password" emailed to the user's registered email. InsureEdgeEmails module has 5 functions (EV-0-0003). | Logic Agent + Integration Agent | Email delivery mechanism (SMTP, SendGrid, etc.) and email template definitions need documentation. |
| REF-1-0008 | Policy status lifecycle (Draft → Approved/Not Approved/Expired for quotes; Active → Lapsed/Expired/Cancelled/Non-Renewed for policies) is a core state machine. | Logic Agent | Full state transition diagram with triggers and business rules should be documented. |
| REF-1-0009 | "Are you 65 or older?" is captured per insured — suggests age-based underwriting or eligibility rule. | Logic Agent | Business rule for how Is65OrOlder affects rating, eligibility, or coverage options needs documentation. |
| REF-1-0010 | Billing installment plan: failed payments are tracked on the Global Dashboard grid. CancellationDueToNoPayment_BL.png exists in Business Logic Screenshots. | Logic Agent + Data Agent | Auto-cancellation trigger for failed payment cycles needs documentation. |
| REF-1-0011 | Bulk upload flows exist for both Quotes (BulkUpload_Quotes_HB.png) and Business Submissions (BulkUploadBusinessSubmissions.png) — these are background/batch processes not visible in the main UI. | Logic Agent | Bulk upload schema, validation rules, and error handling need documentation. |
| REF-1-0012 | Timer-based background processes exist (timer.png, AutomaticRenewalNotificationEmail.png, SendRenewalDraftProducerEmailViaTimer.png) — renewal automation is not exposed in the UI but affects policy lifecycle. | Logic Agent | Timer schedule, trigger conditions, and renewal email content need documentation. |

---

## 7. Summary Statistics

| Dimension | Count |
|-----------|-------|
| Total screens identified (all modules) | ~65 |
| Screens with HIGH confidence (text PRD) | ~35 |
| Screens with MEDIUM confidence (partial/inferred) | ~10 |
| Screens with LOW confidence (permission model / names only) | ~20 |
| Modules with HIGH UI coverage | 3 (Quotes & Policies, User Management, Group Management) |
| Modules with MEDIUM UI coverage | 1 (Global Shell / Portal) |
| Modules with LOW / NO UI coverage | 5 (Claims, Distribution, Billing, Reports, Admin) |
| Total unique forms identified | 5 major forms fully documented |
| Total form fields catalogued | ~80 |
| Total permission rows across all modules | 51 (Group Rights) / equivalent in User Rights |
| Named business logic screenshots (BL) | 107 (names only — LOW confidence) |
| UI screenshots (Q&P) | 50 (PNG — visual content not extractable) |

---

*End of ART-1-005 — Screen & Navigation Catalogue*
*Generated by: Browser Agent (INSUREEDGE-2026) | Phase: SCAN | Date: 2026-06-16*
*Layer 0 Governance applies — every FND cites EV-, every ASM/DBT flags confidence appropriately.*
