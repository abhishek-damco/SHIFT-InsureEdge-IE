# Product Requirements Document (PRD)
## Module: Quotes & Policies — Landing Dashboard (First Screen)

**Application:** Hudson Bailey Insurance Platform
**Platform:** OutSystems (web)
**Document Type:** Reverse-engineered PRD from live application
**Scope:** Quotes & Policies module — first screen only (Dashboard + Data Table)
**Date Captured:** 2026-06-23
**Source URL:** https://damco-dev.outsystemsenterprise.com/Policy/

---

## 1. Overview

The Quotes & Policies module landing screen is the primary working surface for an insurance **Client Admin** persona (logged-in user shown as "Hudson Client … / Client Admin"). It presents an at-a-glance operational summary of quote submissions via scrollable KPI cards, a feature-rich data grid of quote/policy records, contextual actions in a collapsible sidebar, and a recent-activity feed.

The default landing view is **"Individual – New Business Quotes"**, indicating the screen is context-driven by the selected action in the sidebar (line of business + transaction type).

---

## 2. Client Persona

| Attribute | Detail |
|-----------|--------|
| **Role** | Client Admin |
| **Display Name** | Hudson Client (truncated in UI) |
| **Avatar** | Initials badge "HC" (top-right) |
| **Primary Goals** | Monitor quote submission pipeline; triage approval statuses; locate individual quotes/policies quickly; review recent activity; drill into submission details |
| **Key Concerns** | High volume of records (3,197 quotes); approval bottlenecks (3,174 Not Approved); fast filtering/searching across large datasets |
| **Permissions implied** | Administrative access across modules (Dashboard, Quotes & Policies, Claims, User Management, User Groups, Distribution, Billing, Reports) |

---

## 3. Global Layout & Navigation

### 3.1 Top Bar (persistent)
- **Brand logo:** "HUDSON BAILEY" (top-left).
- **Hamburger menu (≡):** Far top-left — global app menu toggle.
- **Global Search:** Centered search box with placeholder *"Looks for Module, Forms, Users, Group…"* — cross-entity search.
- **User Profile:** Top-right — "HC" avatar, greeting "Hi, Hudson Client …", role label "Client Admin", with a dropdown chevron.

### 3.2 Left Icon Rail (persistent, vertical)
A fixed vertical rail of module icons, each revealing a tooltip on hover:

| Order | Icon Tooltip |
|-------|--------------|
| 1 | Dashboard |
| 2 | Quotes & Policies *(active)* |
| 3 | Claims |
| 4 | User Management |
| 5 | User Groups Management |
| 6 | Distribution Management |
| 7 | Billing Management |
| 8 | Report Management |

---

## 4. Actions Sidebar (collapsible)

A secondary left panel titled **"Actions"** with a collapse/expand control (≡× icon).

### 4.1 Structure
Two expandable/collapsible groups, each with four action links:

**Individual**
- New Business Quote *(default selected)*
- Endorsement Quote
- Renewal Quote
- Policies

**Business**
- New Business Quote
- Endorsement Quote
- Renewal Quote
- Policies

Each item has a leading icon. Selecting an item changes the main panel context (title + KPIs + grid data).

### 4.2 Collapse / Close Behavior
- Clicking the collapse control (≡×) **collapses** the Actions panel into a thin vertical tab reading **"Actions"** with an expand icon (≥≡).
- When collapsed, the main content area widens, **revealing all 5 KPI cards fully** and the complete table (including the previously clipped "Last Updated" column).
- Clicking the collapsed "Actions" tab / expand icon **re-expands** the panel to its full state.

### 4.3 Recent Activity (within sidebar, below Actions)
A scrollable feed of recent user activity. Each entry contains:
- Action label: **"View"**
- Description: **"Submission viewed for Quote ID 0000000XXXX"**
- A right chevron ( > ) affordance to navigate to that record.

Observed sample IDs: 00000003737, 00000002843, 00000003707, 00000003719 (repeating), etc. The list is independently scrollable.

---

## 5. KPI Cards (scrollable carousel)

A horizontally scrollable carousel of **4 groups / 5 KPI cards** ("1 of 4" … "4 of 4"). Each card has a label, a large numeric value, and a themed icon.

| KPI | Value | Icon Theme |
|-----|-------|-----------|
| Uploaded | 3197 | Upload/check (blue) |
| Approved | 1 | Document check (green) |
| Not Approved | 3174 | Document X (red) |
| Expired | 2 | Document clock (red) |

**Behavior:** When the Actions sidebar is collapsed, all KPI cards fit and display fully; when expanded, the rightmost cards (Expired) are partially clipped and accessed via horizontal scroll/carousel.

---

## 6. Data Grid (Quotes Table)

The core of the screen. Section title reflects active context: **"Individual - New Business Quotes"**.

### 6.1 Keyword Search
- A **"Search by Keyword"** input above the grid for free-text filtering across the dataset.

### 6.2 Columns
| # | Column | Type / Notes |
|---|--------|--------------|
| 1 | Row number (≡ header) | Sequential index; header has a list/menu icon |
| 2 | Action | "View" eye icon per row (tooltip: *View*) — opens submission detail |
| 3 | Quote Number | e.g., 00000000019 |
| 4 | Insured Name | Avatar initials + name (e.g., "Joseph Last") — filterable |
| 5 | LOB (Line of Business) | e.g., "E&S Homeowners" — filterable |
| 6 | Effective Date | e.g., 01-10-2026 — filterable |
| 7 | Premium Estimate | numeric (often "-") — filterable |
| 8 | Creation Date | e.g., 06-22-2026 — sortable & filterable |
| 9 | Approval Status | Pill badge (e.g., "Not Approved" red dot) — filterable |
| 10 | Last Updated | e.g., 06-22-2026 |

### 6.3 Sorting
- Clicking a column header (e.g., **Creation Date**) sorts the grid; an ascending arrow (▲) indicates active sort direction. A loading indicator appears ("Your data is being loaded to the grid.") during server-side sort. Sort state persists across pagination.

### 6.4 Filtering (per-column funnel icon)
Each filterable column header has a funnel icon opening a filter popover with **two tabs**:

**A. Filter by Condition**
- "Show items where the value" + operator dropdown (default "(not set)")
- Value input
- **And / Or** radio toggle
- Second condition row (operator dropdown + value) — enables compound conditions.

**B. Filter by Value**
- Search box
- Checkbox list: **Select All**, **(nothing)**, and distinct values (e.g., for Approval Status: *Approved, Expired, Not Approved*)

**Popover actions:** **Apply**, **Cancel**, **Clear**.

### 6.5 Pagination (footer)
- **Records-per-page** dropdown: options **10 / 25 / 50** (default 10).
- Result summary: **"Showing 10 records from 3197 Results"**.
- Page controls: First («), Previous (‹), numbered pages (1, 2, 3, 4 … 320), Next (›), Last (»).
- Total pages: **320** at 10/page. Selecting a page (e.g., page 2) loads the corresponding record range (e.g., rows 11–16) and retains active sort/filter.

### 6.6 Utility
- **"Top" floating button** (bottom-right, circular) — scrolls the grid/page back to top.
- Vertical scrollbar on the grid; horizontal scroll reveals all 10 columns within the viewport.

---

## 7. Functional Requirements Summary

1. The system shall display context-driven KPI cards (Uploaded, Approved, Not Approved, Expired) for the selected action context.
2. KPI cards shall be horizontally scrollable as a 4-group carousel and shall fully render when the Actions sidebar is collapsed.
3. The system shall provide a left module rail with 8 modules, each exposing a hover tooltip.
4. The Actions sidebar shall offer Individual and Business groupings, each with New Business Quote, Endorsement Quote, Renewal Quote, and Policies actions.
5. The Actions sidebar shall be collapsible/expandable; collapsing shall widen the content area and reveal clipped KPIs/columns.
6. The system shall display a Recent Activity feed of recently viewed submissions with navigable entries.
7. The grid shall support keyword search across records.
8. The grid shall support column sorting with visible direction indicators and server-side reload.
9. The grid shall support per-column filtering via "Filter by Condition" (compound And/Or) and "Filter by Value" (checkbox list), with Apply / Cancel / Clear.
10. The grid shall support pagination with 10/25/50 page sizes, page navigation (first/prev/numbered/next/last), and a result count summary.
11. Each row shall expose a "View" action to open the submission/quote detail.
12. A global search and a user-profile menu shall be persistently available in the top bar.
13. A floating "Top" control shall return the user to the top of the grid.

---

## 8. Non-Functional Observations

- **Scale:** Grid handles large datasets (3,197 records / 320 pages) with server-side paging, sorting, and filtering (async loading indicator observed).
- **Responsiveness:** Layout adapts when the sidebar collapses (KPIs and columns reflow).
- **Discoverability:** Icon-only rail relies on hover tooltips for module identification.
- **Data formatting:** Dates in MM-DD-YYYY; Quote Numbers zero-padded to 11 digits; status shown as colored pill badges; empty numerics rendered as "-".

---

*End of PRD.*
