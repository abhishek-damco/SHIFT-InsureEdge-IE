# ART-2-004 — Screen Specifications
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Business Analyst Agent
**Phase:** HARVEST
**Date:** 2026-06-17
**Source:** ART-1-005 (Screen & Navigation Catalogue), ART-1-001 (Data Catalogue), ART-1-003 (Security Catalogue)

**WHAT/HOW Firewall:** Specifications describe screen behavior and content — no implementation technology is named.

**Confidence Notation:**
- HIGH — content directly evidenced in PRD text (EV-0-0218, EV-0-0222, EV-0-0048)
- MEDIUM — screen confirmed; some fields inferred from data model or permission model
- LOW / PROVISIONAL — screen existence inferred from permission model or function index only (DBT-1-UI-003)

---

## Module 1: Quotes & Policies

### SCREEN-QP-001 — Quotes & Policies Landing Page

**Evidence:** EV-0-0218 (HIGH)
**Path:** `/Policy/LandingPage` (inferred)
**Purpose:** Entry point for the Quotes & Policies module. Provides tabbed navigation across all quote and policy list types for both Individual and Business policy segments.

**User Roles:**
- ClientAdmin: Full access to all tabs, scoped to tenant (ClientId)
- IntermediaryProducer: Access to tabs scoped to their IntermediaryId
- UserRole: Access per group permissions (IsViewPermission)

**Key Actions:**
- Navigate between list categories: Individual/Business × New Business Quotes / Endorsement Quotes / Renewal Quotes / Policies (8 tabs total)
- Search by keyword across the active list
- Filter by column conditions (multiple filter operators)
- Sort by any sortable column
- Click a record row to open quote wizard or Policy 360

**Layout (HIGH — EV-0-0218):**
- KPI cards at top of each list view:
  - For quote lists: Uploaded, Approved, Not Approved, Expired (counts)
  - For policy lists: Total, Active, Lapsed, Expired (counts)
- Data grid below KPI cards: Policy Number (format: 001-00004-0000318-00), Status, Insured Name, Effective Date, Expiration Date, Premium, Producer
- Pagination controls

**Navigation Entry Points:**
- Sidebar item: "Quotes & Policies"

**Navigation Exit Points:**
- Record row click → New Submission Wizard (quotes) or Policy 360 (policies)
- "New Submission" action button → New Submission Wizard Step 1

---

### SCREEN-QP-002 — New Submission Wizard — Step 1: Policy Information

**Evidence:** EV-0-0218 (HIGH)
**Purpose:** Captures the foundational policy information required to initiate a new business quote submission.

**User Roles:** ClientAdmin (Full), IntermediaryProducer (Full — creates quotes within their intermediary)

**Key Actions:**
- Enter or select effective date and policy term
- Select writing company (carrier)
- Select primary insured type (Individual or Business)
- Enter primary insured name and contact details
- Enter mailing address (with address autocomplete)
- Add additional named insureds (repeating section)
- Advance to Step 2.1 (validated)

**Form Fields (HIGH — EV-0-0218):**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| Effective Date | Date picker | Yes | Must be a future date; not blank |
| Policy Term | Dropdown | Yes | Configurable options (12 months, 6 months, etc.) |
| Writing Company | Dropdown | Yes | From WritingCompany reference list |
| Primary Insured Type | Radio (Individual / Business) | Yes | — |
| Primary Insured Name | Text | Yes | — |
| Mailing Address — Line 1 | Text (with autocomplete) | Yes | Address must be geocodable |
| Mailing Address — City | Text | Yes | — |
| Mailing Address — State | Dropdown | Yes | US state codes |
| Mailing Address — ZIP Code | Text | Yes | 5-digit or 5+4 format |
| Contact Email | Text | Yes | Valid email format |
| Contact Phone | Text | Yes | Valid phone format |
| Additional Named Insured (repeating) | Section | No | IsAdditionalInsuredValid if present |
| Additional Organisation (repeating) | Section | No | IsAdditionalOrgValid if present |

**Validation Rules (MEDIUM — ART-1-002 §3):**
- IsAddressValid: All required address components must be non-empty
- IsContactInfoValid: Email and phone must be well-formed
- IsAdditionalInsuredValid: All additional insured fields must be complete if section is populated
- IsAdditionalOrgValid: Organisation name and type must be provided if section is populated

**Navigation Entry Points:** Quotes & Policies Landing Page (New Submission action)
**Navigation Exit Points:**
- Next → Step 2.1: Risk Location (on successful validation)
- Cancel → Quotes & Policies Landing Page (with discard confirmation)

---

### SCREEN-QP-003 — New Submission Wizard — Step 2.1: Risk Location

**Evidence:** EV-0-0218 (HIGH)
**Purpose:** Defines the insured property risk location(s). Supports multiple locations.

**User Roles:** Same as Step 1

**Key Actions:**
- Toggle "Reuse Mailing Address" to copy Step 1 address as risk location
- Add risk location address manually or via address autocomplete
- Add photo placeholder for each location
- Add multiple locations (repeating section)

**Form Fields (HIGH — EV-0-0218):**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| Reuse Mailing Address | Toggle | No | Copies Step 1 mailing address |
| Address Line 1 | Text (with autocomplete) | Yes | — |
| Address Line 2 | Text | No | — |
| City | Text | Yes | — |
| State | Dropdown | Yes | — |
| ZIP Code | Text | Yes | — |
| Location Photo | File upload placeholder | No | — |

**Validation Rules:**
- ValidateLatLong: Geocoordinates resolved from address must fall within valid bounds (ART-1-002 §3)
- At least one risk location must be provided before advancing

**Navigation Entry Points:** Step 1 (Next)
**Navigation Exit Points:** Next → Step 2.2: Risk Information | Back → Step 1

---

### SCREEN-QP-004 — New Submission Wizard — Step 2.2: Risk Information

**Evidence:** EV-0-0218 (HIGH)
**Purpose:** Displays risk rating data retrieved from the external risk rating service and captures editable property attributes. HexCat status gates progression.

**User Roles:** Same as Step 1

**Key Actions:**
- View read-only risk data retrieved for each risk location
- Edit flood zone designation and editable building attributes
- Review HexCat status — progression blocked if status is "Not Approved"

**Form Fields (HIGH — EV-0-0218):**

| Field | Type | Editable | Source |
|-------|------|----------|--------|
| HexCat Status | Display (chip/badge) | No | Risk rating service response |
| HexCat Status Timestamp | Display | No | Risk rating service response |
| Hex Zone ID (Lower / Higher) | Display | No | Risk rating service response |
| Year Built | Display | No | Risk rating service response |
| Construction Type | Display | No | Risk rating service response |
| Foundation Type | Display | No | Risk rating service response |
| Number of Stories | Display | No | Risk rating service response |
| Square Footage | Display | No | Risk rating service response |
| Residence Type | Display | No | Risk rating service response |
| Roof Age | Display | No | Risk rating service response |
| Roof Covering | Display | No | Risk rating service response |
| Roof Shape | Display | No | Risk rating service response |
| Basement | Display | No | Risk rating service response |
| Flood Zone | Input | Yes | User entry, validated |

**Validation Rules:**
- HexCat Status = "Not Approved" → Next button is disabled; user cannot advance
- HexCat Status = "Approved" → Next button is enabled

**Navigation Entry Points:** Step 2.1 (Next)
**Navigation Exit Points:** Next → Step 2.3: Limits & Coverages (gated by HexCat approval) | Back → Step 2.1

---

### SCREEN-QP-005 — New Submission Wizard — Step 2.3: Limits & Coverages

**Evidence:** EV-0-0218 (HIGH)
**Purpose:** Selection of coverage plan tier, dwelling limits, deductibles, liability, and peril endorsements.

**User Roles:** Same as Step 1

**Key Actions:**
- Select dwelling limit amount
- Select deductible percentage or amount
- Select coverage level (Basic, Standard, Preferred)
- Select liability coverage amount
- Toggle optional peril endorsements: Sinkhole, Earthquake, Flood, Wind & Hail, Wildfire

**Form Fields (HIGH — EV-0-0218):**

| Field | Type | Required |
|-------|------|----------|
| Dwelling Limit | Dropdown or numeric input | Yes |
| Deductible | Dropdown | Yes |
| Coverage Level | Radio (Basic / Standard / Preferred) | Yes |
| Liability Coverage | Dropdown | Yes |
| Sinkhole Endorsement | Toggle | No |
| Earthquake Endorsement | Toggle | No |
| Flood Endorsement | Toggle | No |
| Wind & Hail Endorsement | Toggle | No |
| Wildfire Endorsement | Toggle | No |

**Validation Rules (MEDIUM — ART-1-002 §3 IsLimitsAndCoverageValid):**
- Coverage level must be selected
- Dwelling limit must be within allowed range for the product
- Deductible must be selected

**Navigation Entry Points:** Step 2.2 (Next, gated)
**Navigation Exit Points:** Next → Step 2.4: Plans Overview | Back → Step 2.2

---

### SCREEN-QP-006 — New Submission Wizard — Step 2.4: Plans Overview

**Evidence:** EV-0-0218 (HIGH)
**Purpose:** Side-by-side comparison of the three coverage plan tiers to help the user select the appropriate plan.

**User Roles:** Same as Step 1

**Key Actions:**
- Compare Basic, Standard, and Preferred plan side-by-side with premium estimates
- Select final deductible and liability amounts
- Confirm selected plan

**Layout:** Three-column plan comparison table with feature rows and premium totals per tier.

**Navigation Entry Points:** Step 2.3 (Next)
**Navigation Exit Points:** Next → Step 3: Quote Review | Back → Step 2.3

---

### SCREEN-QP-007 — New Submission Wizard — Step 3: Quote Review

**Evidence:** EV-0-0218 (HIGH)
**Purpose:** Final review of the full quote before finalization. All values are read-only summary.

**User Roles:** ClientAdmin, IntermediaryProducer

**Key Actions:**
- Review policy information summary card (insured, address, dates)
- Review limit and premium summary table
- Select a document from the document dropdown (quote proposal)
- Navigate to Step 4 to finalize / bind

**Layout (HIGH — EV-0-0218):**

| Section | Content |
|---------|---------|
| Policy Information card | Insured name, mailing address, effective/expiration dates, writing company, producer |
| Insured Detail card | Contact info, additional insureds |
| Limit & Premium Summary table | Per-coverage limits, deductibles, premiums |
| Premium Totals | Risk Premium, Coverage Premium, Taxes, Fees, **Total Premium** (computed) |
| Document dropdown (footer) | Quote proposal document link |

**Validation Rules:**
- Total Premium = Coverage Premium + Taxes + Fees (display computed — not user-editable)

**Navigation Entry Points:** Step 2.4 (Next)
**Navigation Exit Points:** Next → Step 4: Finalize Quote | Back → Step 2.4

---

### SCREEN-QP-008 — New Submission Wizard — Steps 4 & 5 (Finalize Quote / Documents) [PROVISIONAL]

**Evidence:** EV-0-0218 (LOW — steps confirmed in stepper; content not captured)
**Purpose:** Step 4 is the final binding step. Step 5 manages submission documents.
**Confidence:** LOW — content is provisional

[PROVISIONAL] Step 4 likely captures:
- Payment method selection (ACH or credit card) — inferred from FirstPaymentTransaction, AddCustomerACHDebit/CCCharge (ART-1-002 §2.1)
- Confirmation of binding terms

[PROVISIONAL] Step 5 likely captures:
- Upload of submission support documents
- Document list and status

**Note (QST-BA-003):** Steps 4 and 5 content must be confirmed via UI walkthrough or PRD supplement before finalizing specifications. Mark as PROVISIONAL. (ASM-BA-004)

---

### SCREEN-QP-009 — Policy 360

**Evidence:** EV-0-0218 (HIGH)
**Purpose:** Single-record policy detail view. All policy data accessible via tabbed navigation.

**User Roles:** ClientAdmin (Full, client-scoped), IntermediaryProducer (own policies, read-mostly)

**Tabs and Content (HIGH — EV-0-0218):**

| Tab | Content |
|-----|---------|
| Summary | Policy Information card (number, type, status, dates, writing company), Producer Information table, Financials cards (Coverage Premium, Taxes, Fees, Total Premium) |
| Contacts | Contact details for all policy parties (MEDIUM — tab confirmed, content not fully captured) |
| Billing | Payment Frequency, Responsible Party, Mode of Payment, Number of Installments, Installment Fee, Payment Schedule grid |
| Pending Transactions | Open/pending transaction listing (MEDIUM) |
| Policy History | Transaction history grid: Action, Policy Number, Transaction Type, Transaction Effective Date |
| Claims | Claims linked to this policy (MEDIUM) |
| Notes | User-entered notes on the policy (MEDIUM) |
| Timeline | Chronological event log: date badge, transaction-type chip, Created By, Timestamp |
| Tools ▾ | Dropdown: Endorse Policy, Cancel Policy, Cancel/Rewrite, Do Not Renew, Renew Manually |

**Key Actions:**
- View all policy data across tabs
- Launch endorsement, cancellation, cancel/rewrite, non-renewal, or manual renewal via Tools menu
- Download policy documents

**Navigation Entry Points:** Quotes & Policies Landing Page (record row click)
**Navigation Exit Points:**
- Tools → respective wizard (endorsement, cancellation, etc.)
- Back → Quotes & Policies Landing Page

---

## Module 2: Claims [PROVISIONAL]

**Note:** All Claims module screen specifications are PROVISIONAL due to LOW UI evidence coverage (DBT-1-UI-003, ART-1-005 §1.3). Specifications are derived from the permission model (EV-0-0048, EV-0-0226), function index (EV-0-0003, EV-0-0007), and data model (ART-1-001). UI text confirmation required.

---

### SCREEN-CLM-001 — Claims List / Inquiry [PROVISIONAL]

**Evidence:** EV-0-0048, EV-0-0226 (LOW)
**Purpose:** Browse and search claims across the tenant. Scope-filtered by role.

**User Roles:**
- ClientAdmin: All claims within tenant (ClientId)
- Adjuster: Only claims assigned to their AdjusterId
- UserRole: Per group permissions

**Key Actions (PROVISIONAL):**
- Search by claim number, policy number, or insured name
- Filter by claim status (FNOL, Open, In Review, Closed, Denied)
- Sort by loss date, claim number, status
- Click a record to open the Claim Workflow
- Navigate to FNOL Registration to create new claim

**Inferred Columns (MEDIUM — ART-1-001 Claim):**
- Claim Number, Policy Number, Insured Name, Loss Date, FNOL Date, Claim Status, Assigned Adjuster

**Note (QST-BA-004 PROVISIONAL):** Confirm the exact columns, KPI cards, and filter options displayed on the Claims List. The function index confirms 467 claims functions but no PRD text was recovered. (ASM-BA-005)

---

### SCREEN-CLM-002 — FNOL Registration [PROVISIONAL]

**Evidence:** EV-0-0048, EV-0-0007 (LOW)
**Purpose:** First Notice of Loss intake form. Creates a new Claim record linked to an existing policy.

**User Roles:** ClientAdmin (Full, client-scoped), Adjuster (Full, assigned scope)

**Inferred Form Fields (MEDIUM — ART-1-001 Claim):**

| Field | Type | Required |
|-------|------|----------|
| Policy Number (search) | Lookup | Yes |
| Loss Date | Date picker | Yes |
| FNOL Date | Date picker | Yes (defaults to today) |
| Reported By | Text / Dropdown | Yes |
| Claim Type | Dropdown | Yes |
| Initial Loss Description | Textarea | Yes |
| Affected Coverages (multi-select) | Checklist | No — at FNOL stage |

**Validation Rules (MEDIUM — ART-1-002 §3 CheckDuplicateClaim):**
- System checks for existing claims on the same policy with the same loss date
- If duplicate detected, user must confirm intent to create a second claim

**Note (QST-BA-004):** FNOL form fields are inferred from the data model. Must be confirmed via UI walkthrough.

---

### SCREEN-CLM-003 — Claim Workflow — Financial Worksheet [PROVISIONAL]

**Evidence:** EV-0-0048, EV-0-0007 (LOW)
**Purpose:** Manages the financial settlement for a claim. Records reserves and payments per coverage type.

**User Roles:**
- Adjuster: View and edit worksheet (subject to IsApproveReject for approval actions)
- ClientAdmin: Full access (subject to IsApproveReject)

**Inferred Sections (MEDIUM — ART-1-001 Worksheet, WorksheetReserve, WorksheetPayment):**

| Section | Fields |
|---------|--------|
| Worksheet Summary | Worksheet ID, Status, Total Reserve, Total Paid |
| Reserve per Coverage | Coverage Type, Reserve Amount (per row) |
| Payments | Payee, Amount, Payment Method, Transaction Date |

**Key Permission Gates (HIGH — ART-1-003 §2.1 IsApproveReject):**
- Approve or reject worksheet: requires IsApproveReject = true on the ClaimWorksheet screen
- All other users: view-only on worksheet approval controls

---

## Module 3: User Management

### SCREEN-USR-001 — User Management Landing Page

**Evidence:** EV-0-0222 (HIGH)
**Purpose:** Browse, search, filter, and manage all user accounts within the tenant.

**User Roles:** ClientAdmin (Full, ClientId-scoped)

**Key Actions:**
- View KPI cards: Total Users, Active Users, Inactive Users
- Search by keyword (user name, email)
- Filter by columns using "Filter by Condition" (9 operators) or "Filter by Value" (multi-select)
- Toggle column visibility via Column Picker (9 columns)
- Click View icon to open user profile
- Click "Add Users" to create a new user
- Click "Import Users" (stub — shows "Not Implemented" toast)

**Grid Columns (HIGH — EV-0-0222):**
User Name, Email, Role, Status, Department, Manager, Groups (up to 9 columns configurable)

**Navigation Entry Points:** Sidebar "User Management"
**Navigation Exit Points:**
- Add Users button → Add User form (SCREEN-USR-002)
- View icon → View User (SCREEN-USR-003)

---

### SCREEN-USR-002 — Add User

**Evidence:** EV-0-0222 (HIGH)
**Purpose:** Create a new user account within the tenant.

**User Roles:** ClientAdmin

**Form Sections and Fields (HIGH — EV-0-0222):**

**Primary Info:**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| First Name | Text | Yes | — |
| Last Name | Text | Yes | — |
| Date of Birth | Date picker | No | — |
| Gender | Dropdown | No | — |
| Work Remotely | Toggle | No | — |
| Office Location | Dropdown | No | From ClientOffice records |
| Groups | Multi-select (searchable) | No | From Group_Table (same tenant) |
| Department | Text | No | — |
| Manager | Searchable dropdown | No | From User2 (same tenant) |
| Reports To | Searchable dropdown | No | From User2 (same tenant) |

**Address:**

| Field | Type | Required |
|-------|------|----------|
| Address Line 1 | Text (with autocomplete) | No |
| Address Line 2 | Text | No |
| City | Text | No |
| State | Dropdown | No |
| ZIP Code | Text | No |
| Same as Office Location | Shortcut toggle | No |

**Contact Details:**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| Primary Phone | Text (international format) | Yes | Valid phone |
| Extension | Text | No | — |
| Alt Phone | Text | No | — |
| Email Address | Text | Yes | Valid email; unique within tenant (Check_Email_IsDuplicateOrNot) |

**User-Rights:** 8-module accordion, each module shows 10 permission flag toggles (Read Only / All Access per screen row)

**Validation Rules:**
- Email must be unique within the tenant (duplicate check scoped to ClientId)
- Phone must be unique within the tenant (duplicate check scoped to ClientId)
- At least one of: email or phone must be provided

**Navigation Entry Points:** User Management Landing Page (Add Users)
**Navigation Exit Points:** Save → User Management Landing Page | Cancel → User Management Landing Page (with discard confirmation)

---

### SCREEN-USR-003 — View / Edit User

**Evidence:** EV-0-0222 (HIGH)
**Purpose:** Full user profile view with inline editing of each section. Central hub for user management actions.

**User Roles:** ClientAdmin

**Sections (HIGH — EV-0-0222):**
- Primary Info (view + inline edit via pencil icon)
- Address (view + inline edit with address autocomplete)
- Contact Details (view + inline edit)
- User-Rights (view + inline edit — 8 module accordions with 10-flag matrix per screen row)

**Key Actions:**
- Edit any section independently via pencil (✏) icons
- Reset Password — opens confirmation modal, sends reset email to user
- Back — returns to landing page; if unsaved changes exist, triggers Unsaved Changes modal

**Modals:**
- Reset Password Modal: "Confirm sending temporary password to [email]?" — [Confirm] dispatches reset email
- Unsaved Changes Modal: "You have unsaved changes. Do you want to leave?" — [Leave] discards, [Stay] returns to edit

**Navigation Entry Points:** User Management Landing Page (View icon)
**Navigation Exit Points:** Back → User Management Landing Page

---

### SCREEN-USR-004 — Reset Password Modal

**Evidence:** EV-0-0222 (HIGH)
**Purpose:** Confirmation overlay preventing accidental password reset dispatch.

**Fields:** Display only — user name and email shown for confirmation.
**Actions:** Confirm (sends reset email) / Cancel (closes modal, no action)

**Business Rules:**
- Dispatches password reset token with 30-minute expiry (BR-COM-RESET)
- Rate limited to fewer than 2 active tokens per 30-minute window (BR-COM-RATE)

---

## Module 4: Group Management

### SCREEN-GRP-001 — Group Management Landing Page

**Evidence:** EV-0-0048 (HIGH)
**Purpose:** Browse, search, filter, and manage all user groups within the tenant.

**User Roles:** ClientAdmin (Full, ClientId-scoped)

**Key Actions:**
- View KPI cards: Total Groups, Active Groups, Inactive Groups
- Search by keyword (group name)
- Filter by column conditions
- Sort by group name or status
- Click View icon to open group detail
- Click "Add User Group" to create a new group
- Export: Download as PDF, CSV, Excel, or TXT

**Grid Columns (HIGH — EV-0-0048):**
Group ID, Group Name, Group Email, Group Leader, Status, Member Count

**Navigation Entry Points:** Sidebar "User Groups Management"
**Navigation Exit Points:**
- Add User Group → Add User Group (SCREEN-GRP-002)
- View icon → View Group (SCREEN-GRP-003)

---

### SCREEN-GRP-002 — Add User Group

**Evidence:** EV-0-0048 (HIGH)
**Purpose:** Create a new user group with membership and permission configuration.

**User Roles:** ClientAdmin

**Form Sections (HIGH — EV-0-0048):**

**User Group Information:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Group ID | Auto-generated | N/A | System-assigned, read-only |
| Status | Toggle (Active/Inactive) | Yes | Defaults to Active |
| Group Name | Text | Yes | Must be unique within tenant |
| Group Email | Text (email) | Yes | Valid email format |
| Group Leader | Searchable dropdown | Yes | From User2 (same tenant) |
| Group Description | Textarea | No | — |

**Group Members Panel:**
- Search for users and add them to the group
- Member list with remove action per member

**Group Rights Section (HIGH — EV-0-0048):**
- 8 module accordions, each expandable
- 51 permission rows total across all modules
- Each row: Screen Name + 10 toggles (View, Create, Edit, Approve/Reject, Clone, Upload, Download, Sensitive Data, Sensitive Docs, All Access)

**Validation Rules:**
- Group Leader is required before saving
- Group Name must not duplicate an existing group within the tenant

**Navigation Entry Points:** Group Management Landing Page (Add User Group)
**Navigation Exit Points:** Save → Group Management Landing Page | Cancel → Group Management Landing Page (with discard confirmation)

---

### SCREEN-GRP-003 — View Group / Edit Group

**Evidence:** EV-0-0048 (HIGH)
**Purpose:** Read-only view of group details with inline editing capability for each section.

**User Roles:** ClientAdmin (edit requires IsEditPermission on Group Management screen)

**Sections:**
- Group Information (view + inline edit via pencil)
- Group Members (view + inline edit via pencil — add/remove members)
- Group Rights (view + inline edit via pencil — permission matrix)

**Key Actions:**
- Edit any section independently
- Back → Group Management Landing Page

**Navigation Entry Points:** Group Management Landing Page (View icon)
**Navigation Exit Points:** Back → Group Management Landing Page

---

## Module 5: Distribution Management [PROVISIONAL]

**Note:** Distribution Management UI evidence is LOW. The Distribution Management PDF (EV-0-0044) was not read. All screen specifications below are PROVISIONAL, derived from the permission model (EV-0-0226), function index (ART-1-002 §1, 144 functions), and data model (ART-1-001).

---

### SCREEN-DIST-001 — Distribution Management Landing Page [PROVISIONAL]

**Evidence:** EV-0-0048, EV-0-0226 (LOW)
**Purpose:** Browse and manage intermediaries (agencies) and their producer rosters.

**User Roles:**
- ClientAdmin: Full access, ClientId-scoped
- IntermediaryProducer: Own intermediary record only

**Inferred Key Actions (MEDIUM — ART-1-002 §1 Distribution):**
- Browse intermediary list with search and filter
- View intermediary details and producer list
- Create a new intermediary (ClientAdmin only)
- View and edit commission configuration

**Inferred Grid Columns (MEDIUM — ART-1-001 Intermediary):**
Intermediary Code, Company Name, Contact Name, Email, Phone, Commission %, Status

**Note (QST-BA-005 PROVISIONAL):** Distribution Management PDF (EV-0-0044) must be read to confirm screen content, field lists, and navigation structure. Mark all Distribution screen specifications as PROVISIONAL. (ASM-BA-006)

---

### SCREEN-DIST-002 — Intermediary Detail [PROVISIONAL]

**Evidence:** EV-0-0226 (LOW)
**Purpose:** View and edit an individual intermediary record including company details, producer list, and commission configuration.

**User Roles:** ClientAdmin (Full, edit), IntermediaryProducer (own record, read-only)

**Inferred Sections (MEDIUM — ART-1-001 Intermediary, Producer):**

| Section | Fields |
|---------|--------|
| Company Information | Company Name, Intermediary Code, Company Address (geocoded), Phone, Email, Status |
| Commission Configuration | Default Commission %, Commission Type |
| Producer List | Producer Name, License Number, State Code, Status |

**Key Actions:**
- Edit company information and commission rate (ClientAdmin)
- Add/remove producers from the roster (ClientAdmin)
- View own profile only (IntermediaryProducer)

---

*End of ART-2-004 — Screen Specifications | INSUREEDGE-2026 | HARVEST Phase | 2026-06-17*
*Quotes & Policies: HIGH confidence (EV-0-0218). User Management: HIGH (EV-0-0222). Group Management: HIGH (EV-0-0048). Claims: PROVISIONAL (LOW UI coverage — DBT-1-UI-003). Distribution: PROVISIONAL (PDF not read — EV-0-0044).*
*QST-BA-003 through QST-BA-005: must be resolved in next Clarification Round before IDEATE phase.*
