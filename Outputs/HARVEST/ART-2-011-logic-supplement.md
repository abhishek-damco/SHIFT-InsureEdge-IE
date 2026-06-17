# ART-2-011 — Logic Supplement: Rating Engine, Endorsements, Architecture
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Logic Agent
**Phase:** HARVEST (extended pass)
**Date:** 2026-06-17
**Confidence:** See per-section notes

**Evidence consumed:**
- EV-0-0252: `Inputs\Logic\Rater Functionality\09-11-2025 Hudson Bailey Homeowers SuperPerils rater (2).xlsx`
- EV-0-0253: `Inputs\Logic\Rater Functionality\State tax matrix_v2.xlsx`
- EV-0-0254: `Inputs\OutSystems\IE-LC Dev Docs\Endorsement Payments\Premium Bearing Endorsement Requirements_Final.pdf`
- EV-0-0255: `Inputs\OutSystems\IE-LC Dev Docs\Endorsement Payments\Effect of non-premium bearing endorsement on the UW Specific Change Document_Scenarios for dev team.pdf`
- EV-0-0256: `Inputs\OutSystems\IE-LC Dev Docs\Endorsement Payments\Flow Diagram Endorsement Add'' payments.png`
- EV-0-0257: `Inputs\OutSystems\IE-LC Dev Docs\Technical Documents\InsureEdge - Architectural Artifacts Audit Logs.pdf`
- EV-0-0258: `Inputs\OutSystems\IE-LC Dev Docs\Technical Documents\InsureEdge - Architectural Artifacts Bulk Quote Upload.pdf`
- EV-0-0259: `Inputs\OutSystems\IE-LC Dev Docs\Technical Documents\InsureEdge - Architectural Artifacts Login Machanism & Personas.pdf`
- EV-0-0260: `Inputs\OutSystems\IE-LC Dev Docs\Technical Documents\InsureEdge - Document Generation.pdf`
- EV-0-0261: `Inputs\OutSystems\IE-LC Dev Docs\Technical Documents\InsureEdge - Document Storage.pdf`
- EV-0-0262: `Inputs\OutSystems\IE-LC Dev Docs\Technical Documents\TECHNICAL_IMPLEMENTATION_DOCUMENT_Quotes_Bulk_Upload_for_HB.pdf`
- EV-0-0263: `Inputs\OutSystems\IE-LC Dev Docs\Technical Documents\Product_Overview.pdf`

**Relationship to ART-1-002:** This document ENRICHES the SCAN catalogue. Do not modify ART-1-002. All section references below point back to that document where gaps are being closed.

---

## Section 1: Rating Engine — RESOLVED
**Closes:** QST-1-LOGIC-001 (MAJOR gap from ART-1-002 §7, ASM-1-LOGIC-003)
**Confidence:** HIGH — extracted directly from structured workbook (EV-0-0252)

### 1.1 Product Identity

The rating workbook is titled **"Hudson Bailey Homeowners SuperPerils"** — a residential property insurance product covering both standard and catastrophic perils. The product name "SuperPerils" denotes comprehensive catastrophic wind, hail, wildfire, earthquake, sinkhole, and flood coverage in a single package.

### 1.2 Premium Calculation Structure

Total premium is assembled from three stacked components:

```
TOTAL PREMIUM
    = Base Peril Premiums (per 1,000 of insured value, by hexzone)
    + Package Selection Premiums (coverage tier upgrades)
    + Endorsement Premiums (optional add-ons)
    + Fixed Policy Fee ($195)
    [State surplus lines tax + stamping fee applied on top of Total Premium]
```

**Formula for each peril premium:**
```
Peril Premium = (Coverage Limit / 1,000) × Base Rate per 1,000 × Applicable Modifiers
```

### 1.3 Coverage Limits and Allocation Ratios

| Coverage Component | Allocation Ratio | Sample TIV $8M |
|---|---|---|
| Dwelling Asset (Owner or Tenant Occupied) | Explicit input | $4,000,000 |
| Appurtenant Structure Asset | 10% of Dwelling | $400,000 |
| Personal Belongings / Personal Asset | 65% of Dwelling | $2,600,000 |
| Dwelling Occupancy Disruption | 25% of Dwelling | $1,000,000 |

**Evidence:** EV-0-0252 (Rating sheet, rows 16–19)

Note: Allocation ratios (10%, 65%, 25%) appear as defaults in the workbook. Whether these are fixed product rules or configurable per submission requires confirmation — see ASM-2-LOGIC-001.

### 1.4 Peril Categories and Base Rates per 1,000

The rating engine separates perils into two groups. "Catastrophic wind and hail" is a composite of sub-perils from the Rate Summary lookup table. "All Other Perils" is a separate rate lane.

| Peril Category | Sub-Perils Composing It | Sample Base Rate / 1,000 |
|---|---|---|
| Catastrophic Wind & Hail | Hurricane + Tornado + Hail + Derecho | Varies by hexzone (see §1.5) |
| Wildfire | Wildfire (state-modified) | 0.199537 (NJ sample) |
| Earthquake | Earthquake | 1.626016 |
| Sinkhole | Sinkhole | 0.1142 |
| Flash Flood | Flash flood (non-flood-zone locations) | 1.42 |
| Excess Flood | Excess flood (flood-zone locations) | 1.42 (zone-adjusted) |
| All Other Perils | Non-catastrophic property | 2.576120 |
| Liability | General liability | 0.1142 |

**Formula for Catastrophic Wind rate:**
```
CatWind_rate = Hurricane_rate + Tornado_rate + Hail_rate + Derecho_rate
              (sourced from Rate Summary table keyed on HR HexZone ID)
```

**Evidence:** EV-0-0252 (Rating sheet row 5 label; Rate summary column headers O note)

### 1.5 HexCat Zone Rating Integration

The rating engine is fundamentally geo-spatial. Premium rates are keyed on **H3 hexagonal grid IDs** at two resolutions:

| Variable | Description | Example Value |
|---|---|---|
| LR Hexzone ID (Lower Resolution) | Parent H3 cell at resolution ~4 | `842a13dffffffff` |
| HR Hexzone ID (Higher Resolution) | Child H3 cell at resolution ~5 | `852a13c3fffffff` |

**Rate lookup flow:**
1. Latitude/Longitude captured from geocoding (Google Geocode API)
2. System calls HexCat API: `GetHexcodeFromLatLng` → returns LR Hex ID and HR Hex ID
3. HR Hex ID used to look up per-peril rates in Rate Summary table (103,739 rows covering all US states)
4. LR Hex ID used for parent-level geographic classification
5. Hexzones lookup table (100,932 rows) maps Hex IDs to State and County/Parish for state-level modifiers

**Evidence:** EV-0-0252 (Rating sheet rows 8–9; Rate summary and Hexzones worksheets)

### 1.6 Wildfire State Modifier

Wildfire premium is multiplied by a per-state modifier (K8 factor) before being added to total:

```
Wildfire_premium = (Dwelling_limit / 1,000) × Wildfire_base_rate × Wildfire_state_modifier
```

**State Wildfire Modifiers (K8 column):**

| State | Modifier | State | Modifier | State | Modifier |
|---|---|---|---|---|---|
| CA | 1.50 | OR | 1.35 | WA | 1.30 |
| AK | 1.10 | FL | 1.05 | GA | 1.00 |
| HI | 1.00 | CO | 1.25 | AZ | 1.15 |
| NM | 1.15 | UT | 1.10 | NV | 1.05 |
| ID | 0.90 | MT | 0.95 | WY | 0.90 |
| TX | 0.95 | OK | 0.85 | KS | 0.80 |
| NE | 0.80 | ND | 0.75 | SD | 0.80 |
| MN | 0.80 | IA | 0.80 | MO | 0.85 |
| AR | 0.90 | LA | 0.90 | MS | 0.90 |
| AL | 0.90 | TN | 0.95 | KY | 0.85 |
| VA | 0.90 | WV | 0.85 | MD | 0.80 |
| DE | 0.75 | PA | 0.80 | NJ | 0.80 |
| NY | 0.75 | CT | 0.75 | RI | 0.75 |
| MA | 0.75 | VT | 0.80 | NH | 0.80 |
| ME | 0.85 | NC | 0.95 | SC | 0.95 |
| IN | (not listed) | IL | (not listed) | OH | (not listed) |

**Evidence:** EV-0-0252 (Input lists worksheet, K8 column)

**Note:** Wildfire state = "Included" means wildfire IS rated. "Non-Transferred" appears as a wind flag (ASM-2-LOGIC-002: "Non-Transferred" likely means wind risk is retained by Hudson Bailey, not ceded to a reinsurer).

### 1.7 Flood Coverage Decision Logic

Flash Flood and Excess Flood are mutually exclusive:
- If property IS in a flood zone (A, AO, AH, D3, V, VE, A99, B, C, X, D) → use Excess Flood coverage
- If property is NOT in a flood zone → use Flash Flood coverage (limit: $10,000)

**Flood rate factors by zone and Base Flood Elevation:**

| Flood Zone | Coverage Type | Rate Modifier Range |
|---|---|---|
| A, AO, AH, D3 | Dwelling | Elevation-adjusted (BFE -16 to +4) |
| V, VE | Dwelling (coastal wave action) | Higher rate band |
| A99, B, C, X | Dwelling (lower hazard) | Lower rate band |
| D | Dwelling (undetermined) | Intermediate band |

**Building type factors:** "With basement" and "More than 1 floor with basement" have specific rate modifiers. Building description affects flood premium calculation.

**Evidence:** EV-0-0252 (Rating sheet rows 38–43; Input lists flood zone tables)

### 1.8 Deductible Schedule

Standard deductible options with premium factors:

| Deductible | Factor (multiplier of base rate) |
|---|---|
| $2,500 | 1.000 (baseline) |
| $5,000 | 0.935 |
| $10,000 | 0.860 |
| $25,000 | 0.750 |

**Evidence:** EV-0-0252 (Input lists worksheet)

### 1.9 Coverage Package Tiers

Three tiered packages control liability and physical damage premium add-ons:

| Package | Liability Package Premium | Physical Damage Package Premium | Residential No-Fault Medical |
|---|---|---|---|
| Basic | $0 | $0 | $50 |
| Standard | $20 | $106 | $100 |
| Preferred | $40 | $212 | $250 |

**Evidence:** EV-0-0252 (Input lists worksheet)

### 1.10 Optional Endorsement Premiums

| Endorsement | Basic Tier Premium |
|---|---|
| Covered Liabilities Package | $0 (included in package) |
| Residential No-Fault Medical | $50 |
| Excess Liabilities | $270 (base; scales by limit — see §1.11) |
| Landlord Endorsement | $50 |
| Small Scale Farming Endorsement | $40 |
| Home Office Endorsement | $20 |

**Evidence:** EV-0-0252 (Rating sheet rows 27–34)

### 1.11 Excess Liability Coverage Options

| Excess Liability Limit | Premium Factor |
|---|---|
| Not Applicable | $100 base |
| $1,000,000 | 1.00 × base |
| $2,000,000 | 0.70 × base |
| $3,000,000 | 0.60 × base |
| $4,000,000 | 0.50 × base |

Note: The factor schedule indicates decreasing marginal premium per additional million — ASM-2-LOGIC-003: this may reflect reinsurance structure.

**Evidence:** EV-0-0252 (Input lists worksheet)

### 1.12 Earthquake Coverage Options

| Earthquake Limit | Available |
|---|---|
| $25,000 | Yes |
| $50,000 | Yes |
| $100,000 | Yes |

**Evidence:** EV-0-0252 (Input lists worksheet)

### 1.13 Liability Coverage Limits

Available liability limit options: $100,000 / $300,000 / $500,000

**Evidence:** EV-0-0252 (Input lists worksheet)

### 1.14 Fixed Fee Structure — CONFIRMED

| Fee Component | Amount |
|---|---|
| Basic Policy Fee | $145 |
| Homeowners SuperPerils Excess Policy Fee | $50 |
| **TOTAL FIXED EXPENSE FEE** | **$195** |

This **confirms** the `PolicyFee = $195` site property in ART-1-002 §3 (BR-POL-T09). The $195 is composed of two sub-fees ($145 + $50), not a single flat fee.

**Evidence:** EV-0-0252 (Rating sheet rows 15–17)

### 1.15 Rate Modification Factor

A `Rate modification factor` field exists in the workbook (default: 1.0). This is a manual override multiplier that can adjust total premium upward or downward. When set to 1.0, `Total premium including rate modification = Total premium`. ASM-2-LOGIC-004: this may be the underwriter rate modification capability referenced in the endorsement documents.

**Evidence:** EV-0-0252 (Rating sheet row 23)

### 1.16 State Surplus Lines Tax Rates

Applied on top of total premium after all coverage and endorsement premiums are summed:

```
Tax_due = Total_premium × (Surplus_lines_rate + Stamping_fee_rate) + Fire_premium_tax
```

Special cases: Oregon stamping fee = $10 flat; Pennsylvania stamping fee = $20 flat.

**Full State Tax Table (EV-0-0253):**

| State | Surplus Lines | Stamping Fee | Fire Premium Tax |
|---|---|---|---|
| Alabama | 6.00% | — | — |
| Alaska | 2.70% | 1.00% | — |
| Arizona | 3.00% | 0.20% | — |
| Arkansas | 4.00% | — | — |
| California | 3.00% | 0.18% | — |
| Colorado | 3.00% | — | — |
| Connecticut | 4.00% | — | — |
| Delaware | 3.00% | — | — |
| District of Columbia | 2.00% | — | — |
| Florida | 4.94% | 0.06% | — |
| Georgia | 4.00% | — | — |
| Hawaii | 4.68% | — | — |
| Idaho | 1.50% | 0.50% | — |
| Illinois | 3.50% | 0.04% | 1.00% |
| Indiana | 2.50% | — | — |
| Iowa | 0.925% | — | — |
| Kansas | 3.00% | — | — |
| Kentucky | 3.00% | 1.80% | — |
| Louisiana | 4.85% | — | — |
| Maine | 3.00% | — | — |
| Maryland | 3.00% | — | — |
| Massachusetts | 4.00% | — | — |
| Michigan | 2.00% | 0.50% | — |
| Minnesota | 3.00% | 0.04% | — |
| Mississippi | 4.00% | 0.25% | — |
| Missouri | 5.00% | — | — |
| Montana | 2.75% | 0.25% | 2.50% |
| Nebraska | 3.00% | — | — |
| Nevada | 3.50% | 0.40% | — |
| New Hampshire | 3.00% | — | — |
| New Jersey | 5.00% | — | — |
| New Mexico | 3.003% | — | — |
| New York | 3.60% | 0.15% | — |
| North Carolina | 5.00% | 0.30% | — |
| North Dakota | 1.75% | — | — |
| Ohio | 5.00% | — | — |
| Oklahoma | 6.00% | 0.175% | — |
| Oregon | 2.00% | $10 flat | 0.30% |
| Pennsylvania | 3.00% | $20 flat | — |
| Rhode Island | 4.00% | — | — |
| South Carolina | 6.00% | — | — |
| South Dakota | 2.50% | — | 3.00% |
| Tennessee | 5.00% | 0.175% | — |
| Texas | 4.85% | 0.04% | — |
| Utah | 4.25% | 0.18% | — |
| Vermont | 3.00% | — | — |
| Virginia | 2.25% | — | — |
| Washington | 2.00% | 0.30% | — |
| West Virginia | 4.55% | — | — |
| Wisconsin | 3.00% | — | — |
| Wyoming | 3.00% | 0.175% | — |

**Evidence:** EV-0-0253 (Sheet1)

**Tax Calculation Example (Florida, EV-0-0253 Sheet2):**
```
Annual Premium:         $4,853.00
Policy fees:              $195.00
Surplus Lines Tax (4.94%):  $249.37
Stamping Fee (0.06%):        $3.03
Fire Premium Tax:            $0.00
Total:                  $5,300.40
```

---

## Section 2: Endorsement Payment Logic — NEW
**Evidence:** EV-0-0254, EV-0-0255, EV-0-0256
**Confidence:** HIGH for rules explicitly stated; MEDIUM for inferred steps

### 2.1 Endorsement Type Distinction

| Type | Who Can Perform | Coverage Impact | Payment Triggered |
|---|---|---|---|
| Premium-Bearing Endorsement | HB Underwriters ONLY | Changes Dwelling Asset Limit (and cascading limits) | YES — immediate collection or refund |
| Non-Premium-Bearing Endorsement | Producers OR HB Underwriters | Changes contact/address/insured/mortgagee data only | NO — document update only |

**Evidence:** EV-0-0254 p.1, EV-0-0255 p.1

### 2.2 Premium-Bearing Endorsement Rules

**Coverage item that may be changed:** Only the **Dwelling Asset Limit (DAL)** may be revised in a premium-bearing endorsement. Cascading limit changes to Appurtenant Structure, Personal Belongings, and Dwelling Occupancy Disruption follow automatically from the DAL change per the allocation ratios in §1.3.

**Underwriter tier authority:**

| UW Group | DAL Change Authority |
|---|---|
| Standard Underwriting (UW group) | Maximum +10% increase only |
| Senior Underwriting (Senior UW group) | Unlimited increase or decrease |

**One-per-term limit:** Only 1 premium-bearing endorsement is allowed per policy term.

**Evidence:** EV-0-0254 p.1–2

### 2.3 Payment Calculation for Premium-Bearing Endorsements

**When premium increases (additional premium due):**

| Billing Type | Payment Method | Timing |
|---|---|---|
| Insured Bill — Annual Policy | Pay Now via payment gateway | Immediate (right away) |
| Insured Bill — Monthly Policy | Pay Now via payment gateway | Immediate (right away) |
| Mortgage Bill | Pay Now via payment gateway | Immediate (TranzPay window displayed) |

**When premium decreases (return premium due):**

| Billing Type | Return Method | Timing |
|---|---|---|
| Insured Bill — Annual Policy | Return via payment gateway (ACH or Credit Card) | API call to return funds |
| Insured Bill — Monthly Policy | Spread/distribute return across remaining monthly installments | Pro-rated over remaining term |
| Mortgage Bill | DisburseCloud return (under research at time of document) | ACH or Check via DisburseCloud |

**Evidence:** EV-0-0254 p.1; EV-0-0256 (flow diagram)

### 2.4 Endorsement Payment Flow (from Flow Diagram EV-0-0256)

```
PREMIUM DECISION
    │
    ├─ Premium is INCREASING
    │       │
    │       ├─ Billing Type: Insured Bill?
    │       │       └─ [Button on UI: "Charge Insured"]
    │       │               → Send AddCustomerCCCharge OR AddCustomerACHDebit
    │       │               → API request with additional amount
    │       │
    │       └─ Billing Type: Mortgage Bill?
    │               └─ [Button on UI: "Pay Now"] → TranzPay modal appears
    │                       Note: HB UW needs INSURED'S payment information
    │
    └─ Premium is DECREASING
            │
            ├─ Billing Type: Insured Bill?
            │       └─ [Button: "Return Funds"]
            │               → Send CreditCardCredit OR ACHRefund
            │               → API request with amount to return
            │
            └─ Billing Type: Mortgage Bill?
                    └─ [Button: "Return Funds"] → Generates Email to Insured
                            → Insured clicks button in email → directs to DisburseCloud
                            → Registration screen populated with Insured details
                            → ACH and Check are ONLY methods for DisburseCloud payment

ALL paths lead to, on successful outcomes:
    → Generating Policy Change Doc
    → UW Specific Change Doc
    → Distributed by email to Insured and Producer
```

**Evidence:** EV-0-0256

### 2.5 LenderDock Notification — Endorsement

For mortgage bill endorsements, LenderDock notification is NOT required during the current term. The mortgagee will receive the full renewal premium at renewal. No current-term update is sent to LenderDock for premium-bearing endorsements.

**Evidence:** EV-0-0254 p.1

### 2.6 Document Generation Triggers — Endorsement Types

| Endorsement Type | Documents Generated |
|---|---|
| Premium-Bearing Endorsement | Policy Change Doc + UW Specific Change Document (with premium change section) |
| Non-Premium-Bearing Endorsement | UW Specific Change Document (with data change sections, cumulative across term) |
| New Business (any) | UW Specific Change Document is NOT generated (per EV-0-0254 p.2 revision) |

**Evidence:** EV-0-0254 p.2, EV-0-0255 p.1

### 2.7 Non-Premium-Bearing Endorsement: UW Specific Change Document Content

The document is **cumulative** throughout the policy term — all changes from all non-premium-bearing endorsements in the term accumulate in the "Additional Policy Change" text area on page 1. Two blank rows separate each change event.

**Tracked change types and their document format:**

| Change Type | Format in Document |
|---|---|
| Mailing Address | "Effective [date], Mailing Address of First-named insured changed: Delete: {old address} / Replace with: {new address}" |
| Phone Number | "Effective [date], Phone Number changed: Delete: {(xxx) xxx-xxxx} / Replace with: {(xxx) xxx-xxxx}" |
| Alternate Phone Number | Same format as phone number |
| Email Address | "Effective [date], Email Address changed: Delete: {old} / Replace with: {new}" |
| Add Additional Insured | "Effective [date], Additional Named Insured added: Add: {Name, Relationship, Phone, Alt Phone, Email, Type, DBA}" |
| Edit Additional Insured | "Effective [date], Additional Named Insured changed: Delete: {old record} / Replace with: {new record}" |
| Delete Additional Insured | "Effective [date], Additional Named Insured changed: Delete: {Name, Relationship, Phone, Email, Type}" |
| Add Additional Organization | Same as Add Additional Insured but with {Organization Name} |
| Add Mortgagee | "Effective [date], Mortgagee added: Add: {Name, Address}" |
| Edit Mortgagee | "Effective [date], Mortgagee changed: Delete: {old} / Replace with: {new}" |
| Delete Mortgagee | "Effective [date], Mortgagee changed: Delete: {Name, Address}" |

**Evidence:** EV-0-0255 pp.1–4

### 2.8 Open Design Questions (from EV-0-0254, items flagged in red — still unresolved at time of document)

- How to finalize the return premium transaction and clear the negative balance on annual policies.
- Whether an "Issue" button should be displayed to confirm the return premium process, linked to the payment API.
- Whether DisburseCloud can be used to return Mortgage Bill premiums (was under research).

These remain as open items — they should be carried forward as blocking design questions. See Section 8.

---

## Section 3: Audit Log Specification — NEW
**Evidence:** EV-0-0257
**Confidence:** HIGH — schema directly evidenced from architectural diagram

### 3.1 Audit Log Data Model

The `Audit Logs` entity in the InsureEdgeSYSDB database has the following fields:

| Field | Description |
|---|---|
| `Id` | Primary key / unique log entry identifier |
| `Module` | Module where the change occurred (e.g., Policy, Claims, User, Group) |
| `RecordId` | ID of the changed record (entity-agnostic — can be any entity's PK) |
| `Description` | Human-readable description of the change event |
| `UserId` | ID of the user who performed the action |
| `ColumnName` | Name of the specific column/field that was changed |
| `UpdatedValue` | New value after the change |
| `PreviousValue` | Old value before the change |
| `dateTime` | Timestamp of the change |
| `ClientId` | Tenant identifier (multi-tenant isolation) |

**Evidence:** EV-0-0257 (Audit Logs entity diagram)

### 3.2 Audit Log Architecture

The audit system captures **both** the Old Record state and the New Record state, then compares them to determine which columns changed before calling the `Save Audit Log` action. The log is stored in SQL Server (InsureEdgeSYSDB).

The entity scope is universal: "Entity can be any entity, may it be claims or policy or User or group" — meaning audit logging is applied across all business domains, not limited to a specific module.

**Evidence:** EV-0-0257 (architecture diagram notes)

### 3.3 Trigger Events

No explicit list of which user actions trigger audit logging is documented in EV-0-0257. The architectural diagram shows the pattern is applied to any create/update/delete operation on any entity. ASM-2-LOGIC-005: all data mutations (create, update, delete) across Policy, Claims, User, Group modules are assumed to be audit-logged given the "any entity" scope.

### 3.4 Retention Period

No retention period is documented in EV-0-0257. This is an open question. See Section 8.

---

## Section 4: Bulk Quote Upload — ENRICHED
**Evidence:** EV-0-0258, EV-0-0262
**Confidence:** HIGH for flow; MEDIUM for field-level detail (field names in template not listed in PDFs)

### 4.1 Bulk Upload Processing Flow

```
STEP 1: Records uploaded from Excel spreadsheet → staging table
STEP 2: Scheduler (background timer, BulkUploadTimerEnable = TRUE from ART-1-002)
         picks up records iteratively (Next record loop)
STEP 3: For each record:
    a. Quote Record Creation (QuoteId generated, initial record written to DB)
    b. Get Lat/Lng — if lat/lng NOT already in the record:
           → Call Google Geocode API with address
           → Retrieve Latitude and Longitude
    c. Premium Generation:
           → Inputs: TIV, Latitude, Longitude
           → Calls Rating Engine module
           → Calls HexCat API (GetHexcodeFromLatLng → HexZone IDs)
           → Rate lookup against Rate Summary table (103,739 rows)
           → Premium calculated and stored
STEP 4: HexCat Approval check:
    → HexCat SP Communication (stored procedure / service call)
    → InsureEdge DB updated with HexCat status
    → If APPROVED: Email to Broker sent (notification of completed quote)
    → Loop back to next record
```

**Evidence:** EV-0-0258, EV-0-0262 (both show identical flow diagram)

### 4.2 Key Data Inputs for Premium Generation

The Premium Generation step receives: TIV (Total Insured Value), Latitude, and Longitude. These three fields are the minimum required inputs for the rating engine to produce a quote during bulk upload.

**Evidence:** EV-0-0258, EV-0-0262 (flow diagram labels on arrows)

### 4.3 Timer-Based Processing Confirmation

Bulk upload is confirmed as scheduler-driven (OS Scheduler / OutSystems Timer). Processing is asynchronous — records are uploaded in one operation, processed in background by the timer. This is consistent with the `BulkUploadTimerEnable = TRUE` site property documented in ART-1-002 §5.

**Evidence:** EV-0-0258, EV-0-0262 (OS Scheduler icon in diagram)

### 4.4 External Dependencies in Bulk Upload Path

| Dependency | Purpose in Bulk Upload |
|---|---|
| Google Geocode API | Converts address to lat/lng when coordinates are missing from the upload record |
| HexCat API | Converts lat/lng to hexzone IDs; provides CAT hazard approval status |
| Rating Engine (internal module) | Calculates premium from TIV + hexzone rates |

**Evidence:** EV-0-0258

### 4.5 Broker Notification

On successful HexCat approval for each record, an email is sent to the Broker (producer/intermediary who submitted the upload). This is the completion notification for that quote record.

**Evidence:** EV-0-0258

### 4.6 Validation Rules and Field Template

Detailed field-level validation rules and the exact Excel template column layout are NOT documented in EV-0-0258 or EV-0-0262. The technical document (EV-0-0262) is version 1.0 and contains only the architecture diagram — no field mapping table is present. This remains a gap.

**Evidence gap:** ASM-2-LOGIC-006 — exact upload template columns and validation error codes are unconfirmed.

---

## Section 5: Login Mechanism & Personas — ENRICHED
**Evidence:** EV-0-0259, EV-0-0263
**Confidence:** HIGH — architectural diagrams are explicit

### 5.1 Login Architecture

The platform uses a **centralized login** based on the framework's default authentication model. All user types — internal and external — authenticate through a single login entry point.

**Evidence:** EV-0-0259, EV-0-0263 §4

### 5.2 Persona Hierarchy and Module Access

The login diagram confirms a two-tier creation hierarchy:

**Tier 1 — Internal Client Admin:**
- Created by the platform operator (Damco/platform team)
- Creates and assigns access to Internal Client Users
- Assigns module-level access across: Accounts Management, Policies, Claims, Group Management, User Management, Distribution Management

**Tier 2 — Internal Client Users (created by Client Admin):**
- Can access any or all modules as assigned
- Create External Users: Intermediaries (Producers) and Adjusters
- External users have scoped, limited access

**Evidence:** EV-0-0259

### 5.3 Persona Catalogue (confirmed from EV-0-0259 + EV-0-0263)

| Persona | Type | Created By | Module Access | Scope |
|---|---|---|---|---|
| Platform Admin | Internal — Platform Operator | Platform team | Client Management, Insurance Product Management, Document Management | Global (all clients) |
| Internal Client Admin | Internal — Client | Platform Admin | All modules for that client | Client-specific |
| Internal Client Users | Internal — Client | Client Admin | Assigned modules only | Client-specific |
| Intermediary / Producer | External | Client Users (via Distribution Management) | Policy submissions, distribution | Scoped — own submissions |
| Adjuster | External | Client Users | Claims only | Scoped — assigned claims |

**Relationship to ART-1-003:** This confirms and extends the role inventory in the Security Roles Catalogue. The diagram explicitly shows that Adjusters are created by Client Users (not Client Admin), which is a nuance worth noting for the target access control model.

**Evidence:** EV-0-0259, EV-0-0263 §8

### 5.4 Platform Admin Module Scope (confirmed)

Platform Admin accesses: Client Management, Insurance Product Management, Document Management. This persona does NOT access operational modules (Policies, Claims, Accounts). Operational modules are the domain of Client Admin and Client Users.

**Evidence:** EV-0-0259 (Platform Admin box in login diagram), EV-0-0263 §5 module table

### 5.5 Session Management

No session timeout values or token lifecycle details are documented in EV-0-0259. The authentication model is described as "OutSystems Default" — session management follows standard framework behavior. This is a gap for the target architecture team (NFR consideration).

---

## Section 6: Document Generation & Storage — ENRICHED
**Evidence:** EV-0-0260, EV-0-0261, EV-0-0263
**Confidence:** HIGH for architecture pattern; MEDIUM for specific document types (some inferred from EV-0-0254/0255)

### 6.1 Document Generation Architecture

The document generation system uses a two-step template-based approach:

**Step 1 — Template Creation:**
1. Document template uploaded (source document)
2. Template stored in system
3. Placeholders automatically extracted from template (via background action)
4. Placeholder list stored in database

**Step 2 — Placeholder Mapping:**
1. User selects data source for each placeholder (dropdown — "Option 1")
2. Placeholder mappings configured and stored
3. Meta Model built from mapped placeholders (hierarchical data structure linking placeholders to data entities)
4. Meta Model stored in database

**Step 3 — Document Generation:**
- At trigger time: Generate action called
- System renders HTML from template + Meta Model data
- Output: HTML → Document file
- AI Assistant component available (document creation aid — scope unclear from diagram)

**Evidence:** EV-0-0260

### 6.2 Document Generation Tooling

The document generation service uses **Plumsail** as the external document generation service (confirmed from EV-0-0263 §7 key integrations table). The IEDocumentGenerator module (5 functions, from ART-1-002 §1) calls Plumsail via HTTP.

**Evidence:** EV-0-0263 §7

### 6.3 Document Types by Trigger Event

From evidence across ART-1-002 and this supplement:

| Document Type | Trigger Event | Evidence |
|---|---|---|
| Declaration Page / New Business Policy Package | Policy bound (first payment complete) | EV-0-0006 (ART-1-002 ref) |
| Endorsement Documents (Quote Proposal Package) | Endorsement issued | EV-0-0006 (ART-1-002 ref) |
| Policy Change Doc | Premium-bearing endorsement completed | EV-0-0254, EV-0-0256 |
| UW Specific Change Document | Non-premium-bearing endorsement (cumulative, per term) | EV-0-0255 |
| Renewal Policy Package | Renewal bound | EV-0-0006 (ART-1-002 ref) |
| Notice of Non-Renewal | 60 days before expiry (timer) | EV-0-0231 (ART-1-002 ref) |
| Cancellation Notice | Policy cancellation | EV-0-0006 (ART-1-002 ref) |
| Claim Letters | Claims disbursement events | EV-0-0007 (ART-1-002 ref) |

**Note:** UW Specific Change Document is explicitly NOT generated during new business (per EV-0-0254 p.2 revision).

### 6.4 Document Storage Architecture

Documents are stored in **Azure Blob Storage** (container: `insureedgeieapplication`).

**Storage path structure:**
```
[Environment: Dev/QA/UAT]
    └─ [ClientId: Dev-Client-1, Dev-Client-2, ...]
            ├─ Users/
            │       └─ [file1, file2, ...]
            ├─ Policies/
            │       └─ [file1, file2, ...]
            ├─ Claims/
            │       └─ [file1, file2, ...]
            └─ Accounts/
                    └─ [file1, file2, ...]
```

**Key characteristics:**
- Multi-tenant isolation: each ClientId has its own directory tree
- Domain-based partitioning: Users, Policies, Claims, Accounts sub-folders per client
- Environment separation: Dev/QA/UAT share the same blob account, separated by environment prefix
- The Common module `AzureBlob` functions (from ART-1-002 §1) handle all read/write operations to this storage

**Evidence:** EV-0-0261

**Note:** Production blob container name and path structure may differ from the `Dev/QA/UAT` container shown in EV-0-0261. ASM-2-LOGIC-007: production uses same path pattern with a production-named container.

---

## Section 7: Updated Business Rules
**New rules discovered — not present in ART-1-002.**

| Rule ID | Statement | Evidence |
|---|---|---|
| BR-LOGIC-SUPP-001 | Only Underwriter-role users may initiate a premium-bearing endorsement; Producer-role users may only perform non-premium-bearing endorsements | EV-0-0254 |
| BR-LOGIC-SUPP-002 | A maximum of one premium-bearing endorsement is allowed per policy term | EV-0-0254 |
| BR-LOGIC-SUPP-003 | Standard Underwriters may change the Dwelling Asset Limit by a maximum of +10%; Senior Underwriters may increase or decrease the DAL without limit | EV-0-0254 |
| BR-LOGIC-SUPP-004 | Only the Dwelling Asset Limit may be modified in a premium-bearing endorsement; all other limit changes (Appurtenant Structure, Personal Belongings, Dwelling Occupancy Disruption) cascade automatically from the DAL change per their fixed allocation ratios | EV-0-0254 |
| BR-LOGIC-SUPP-005 | Additional premium on an endorsement (both annual and monthly insured-bill policies) is collected immediately; monthly policy return premium is spread across remaining installments | EV-0-0254 |
| BR-LOGIC-SUPP-006 | LenderDock notification is not sent for premium-bearing endorsements during the current policy term; mortgagees receive updated premium at renewal only | EV-0-0254 |
| BR-LOGIC-SUPP-007 | The UW Specific Change Document accumulates ALL non-premium-bearing endorsement changes across the entire policy term; each change event is separated by two blank rows | EV-0-0255 |
| BR-LOGIC-SUPP-008 | The UW Specific Change Document is NOT generated during new business submission | EV-0-0254 |
| BR-LOGIC-SUPP-009 | Premium rates are determined by H3 hexagonal zone ID (derived from property lat/lng via HexCat API); rates are keyed at higher-resolution (HR) hex level | EV-0-0252 |
| BR-LOGIC-SUPP-010 | Wildfire premium is multiplied by a per-state modifier (K8 factor) ranging from 0.75 (low-risk states) to 1.50 (California) | EV-0-0252 |
| BR-LOGIC-SUPP-011 | Flash Flood and Excess Flood coverages are mutually exclusive; flood-zone-designated properties use Excess Flood; non-flood-zone properties use Flash Flood with a $10,000 limit cap | EV-0-0252 |
| BR-LOGIC-SUPP-012 | The fixed policy fee of $195 is composed of two components: Basic Policy Fee ($145) + SuperPerils Excess Policy Fee ($50) | EV-0-0252 |
| BR-LOGIC-SUPP-013 | Deductible options carry premium factors: $2,500 = 1.00 (baseline), $5,000 = 0.935, $10,000 = 0.860, $25,000 = 0.750 | EV-0-0252 |
| BR-LOGIC-SUPP-014 | Catastrophic wind premium is calculated as the sum of four sub-peril rates: Hurricane + Tornado + Hail + Derecho, all sourced from the hexzone rate table | EV-0-0252 |
| BR-LOGIC-SUPP-015 | Surplus lines tax is applied to total premium at state-specific rates; Oregon and Pennsylvania use flat stamping fees ($10 and $20 respectively) rather than percentage fees | EV-0-0253 |
| BR-LOGIC-SUPP-016 | Audit logs capture old record state AND new record state; each log entry records: Module, RecordId, Description, UserId, ColumnName, UpdatedValue, PreviousValue, dateTime, ClientId | EV-0-0257 |
| BR-LOGIC-SUPP-017 | Audit logging applies to all entity types across all modules (Policy, Claims, User, Group) — no module is exempt | EV-0-0257 |
| BR-LOGIC-SUPP-018 | Bulk quote upload processing is asynchronous; records are geocoded via Google Geocode API (if lat/lng absent), rated by the internal rating engine, and HexCat-approved by a background scheduler | EV-0-0258, EV-0-0262 |
| BR-LOGIC-SUPP-019 | External users (Intermediaries/Producers and Adjusters) are created by Internal Client Users via Distribution Management; they are not created directly by Client Admins | EV-0-0259 |
| BR-LOGIC-SUPP-020 | Platform Admin (Damco administration) has access only to Client Management, Insurance Product Management, and Document Management; Platform Admin does NOT access Policies, Claims, or Accounts modules | EV-0-0259, EV-0-0263 |
| BR-LOGIC-SUPP-021 | Document templates use a placeholder-mapping model: placeholders are extracted from uploaded templates, mapped to data-source fields via a Meta Model, and resolved at generation time | EV-0-0260 |
| BR-LOGIC-SUPP-022 | Document files are stored in cloud blob storage partitioned by environment, then by ClientId, then by domain (Users / Policies / Claims / Accounts) | EV-0-0261 |

---

## Section 8: Open Questions — Answered and Still Open

| QST ID | Status | Artifact | Resolution |
|---|---|---|---|
| QST-1-LOGIC-001 | **ANSWERED** | EV-0-0252, EV-0-0253 | Full premium rating formula extracted. Per-peril rates from hexzone lookup (103,739 rows), wildfire state modifier (per-state K8 factor), deductible factors, package tiers, fixed fee structure ($145+$50=$195), and state surplus lines tax table (50 states + DC). See Section 1 above. |
| QST-1-LOGIC-002 | Already answered in ART-1-002 §8 | EV-0-0231 | CancellationThresholdDays = 30 days (confirmed) |
| QST-1-LOGIC-003 | Still open | — | USERGROUPPAGE permission string source still not evidenced. Not present in any newly read artifact. |
| QST-1-LOGIC-004 | Already answered in ART-1-002 §8 | EV-0-0231 | Renewal 90d, Non-Renewal notice 60d, Non-Renewed status 90d (confirmed) |

**New open questions raised by these artifacts:**

| New QST ID | Priority | Question | Raised By |
|---|---|---|---|
| QST-2-LOGIC-001 | MAJOR | Return premium transaction finalization for annual policies: how is the negative balance cleared after ACH/CC refund issued? Is there an "Issue" button flow? | EV-0-0254 (unresolved design item) |
| QST-2-LOGIC-002 | MAJOR | Can DisburseCloud be used to return Mortgage Bill premiums? If not, what is the confirmed return mechanism for mortgage-billed policies? | EV-0-0254 (unresolved design item) |
| QST-2-LOGIC-003 | MAJOR | What is the exact bulk upload Excel template field layout? What validation rules are applied per field (required/optional, data type, length)? | Gap in EV-0-0262 |
| QST-2-LOGIC-004 | MINOR | What is the audit log retention period? Are logs purged after any defined period? | Gap in EV-0-0257 |
| QST-2-LOGIC-005 | MINOR | Are the coverage allocation ratios (Appurtenant 10%, Personal Belongings 65%, Occupancy 25%) fixed product rules or configurable per submission? | ASM-2-LOGIC-001 from EV-0-0252 |
| QST-2-LOGIC-006 | MINOR | What does the "Non-Transferred" wind flag in the rater mean? Does it indicate wind risk is retained, and does it affect which rate lane is applied? | ASM-2-LOGIC-002 from EV-0-0252 |
| QST-2-LOGIC-007 | MINOR | What is the session timeout configuration for the platform? Is there a separate timeout for internal vs. external users? | Gap in EV-0-0259 |

---

## Assumptions Log (New)

| ASM ID | Statement | Based On |
|---|---|---|
| ASM-2-LOGIC-001 | Coverage allocation ratios (10% / 65% / 25% of dwelling limit for appurtenant / personal belongings / occupancy) are fixed product rules for the HB SuperPerils product, not user-configurable per submission | EV-0-0252 default values in Rating sheet |
| ASM-2-LOGIC-002 | "Non-Transferred" wind flag in the rater indicates Hudson Bailey retains wind risk on their own balance sheet rather than transferring/ceding it to a reinsurer | EV-0-0252 Rating sheet row 19 |
| ASM-2-LOGIC-003 | Decreasing excess liability premium factors (1.0x → 0.5x as limit increases from $1M to $4M) reflect a layered reinsurance cost structure where upper layers carry lower per-dollar cost | EV-0-0252 Input lists |
| ASM-2-LOGIC-004 | The Rate modification factor (default 1.0) is the underwriter manual rate override mentioned in endorsement documents; values above 1.0 surcharge, below 1.0 discount | EV-0-0252 Rating sheet row 23 |
| ASM-2-LOGIC-005 | All data mutation operations (create, update, delete) across all modules trigger audit log entries given the architectural diagram states "Entity can be any entity" | EV-0-0257 |
| ASM-2-LOGIC-006 | The bulk upload Excel template contains at minimum: address fields, TIV, coverage limits, and flood zone designation; exact columns not confirmed from available evidence | EV-0-0252 Rating sheet inputs section |
| ASM-2-LOGIC-007 | The production Azure Blob container uses the same path pattern (ClientId / domain subdirectory) as the dev/QA/UAT container shown in EV-0-0261, with a different container name for production isolation | EV-0-0261 |

---

## Artifact Read Status

| Artifact | EV ID | Status | Notes |
|---|---|---|---|
| Hudson Bailey Homeowners SuperPerils rater (2).xlsx | EV-0-0252 | READ — Full content extracted via PowerShell COM automation | 4 worksheets: Rating sheet (85 rows), Rate summary (103,739 rows), Hexzones (100,932 rows), Input lists (46 rows). Rating formula fully extracted. |
| State tax matrix_v2.xlsx | EV-0-0253 | READ — Full content extracted via PowerShell COM automation | 2 worksheets: Sheet1 (state tax table, 51 rows), Sheet2 (worked example). All 50 states + DC captured. |
| Premium Bearing Endorsement Requirements_Final.pdf | EV-0-0254 | READ — 2 pages, full content | Premium-bearing endorsement rules, UW authority tiers, payment collection flows. |
| Effect of non-premium bearing endorsement...pdf | EV-0-0255 | READ — 4 pages, full content | Non-premium-bearing change types, UW Specific Change document format for all change scenarios. |
| Flow Diagram Endorsement Add'' payments.png | EV-0-0256 | READ — image rendered | Full endorsement payment decision flow diagram extracted. |
| InsureEdge - Architectural Artifacts Audit Logs.pdf | EV-0-0257 | READ — 1 page, full content | Audit log entity schema and architectural diagram. |
| InsureEdge - Architectural Artifacts Bulk Quote Upload.pdf | EV-0-0258 | READ — 1 page, full content | Bulk upload flow diagram (architecture overview). |
| InsureEdge - Architectural Artifacts Login Machanism & Personas.pdf | EV-0-0259 | READ — 1 page, full content | Login architecture diagram, persona hierarchy. |
| InsureEdge - Document Generation.pdf | EV-0-0260 | READ — 1 page, full content | Document generation template-placeholder-meta model flow. |
| InsureEdge - Document Storage.pdf | EV-0-0261 | READ — 1 page, full content | Azure Blob storage hierarchy diagram (environment → client → domain). |
| TECHNICAL_IMPLEMENTATION_DOCUMENT_Quotes_Bulk_Upload_for_HB.pdf | EV-0-0262 | READ — 1 page text + architecture diagram | Technical implementation document (v1.0). Architecture diagram matches EV-0-0258. No field-level detail present. |
| Product_Overview.pdf | EV-0-0263 | READ — 5 pages, full content | Platform overview, module descriptions, technology stack, integration catalogue, roles model, compliance posture. |

---

*End of ART-2-011 — Logic Supplement | INSUREEDGE-2026 | HARVEST Phase | 2026-06-17*
*All findings cite evidence IDs EV-0-0252 through EV-0-0263. Inferences marked ASM-2-LOGIC-{seq}.*
