# DropDownvaluesHB — Backend Reverse-Engineering PRD

**Module:** IERatingEngine (IE Rating Engine)
**Folder analyzed:** `Server Actions / DropDownvaluesHB`
**Method:** Live inspection in OutSystems Service Studio 11 (read-only — no changes made, nothing published, nothing refactored)
**Scope rule applied:** Only actions physically located inside the `DropDownvaluesHB` folder were opened and documented. Where an action calls another action outside this folder (e.g. the OutSystems system action `ListAppendAll`/`ListFilter`), only the relevant call signature is documented and it is flagged as an external dependency.

> **Scope note:** The user's request named 13 example actions. On opening the folder, it was found to contain **29 actions in total** (alphabetically sorted). All 29 are documented below per the instruction "Any other action inside this same DropDownvaluesHB folder."

---

## 1. Summary Table

| # | Action Name | Public | Purpose | Pattern | Output Var | Input Param(s) |
|---|---|---|---|---|---|---|
| 1 | AddCatastrophicWindToNonTransferredRisks | Yes | Static dropdown: catastrophic wind on non-transferred risks | Static list | AddCatastrophicWindToNonTransferredRisksOptions | none |
| 2 | AddWilFireToNonTransferredRisks | Yes | Static dropdown: wildfire on non-transferred risks (boolean-flavored) | Static list | AddWilFireToNonTransferredRisksOptions | none |
| 3 | AmountOfLiabilityCoverage | Yes | Liability coverage limit options | Static list | LiabilitiesLimitSelectionOptions | none |
| 4 | BuildingDescription | Yes | Building description options | Static list | BuildingDescriptionOptions | none |
| 5 | BuildingType | Yes | Building foundation/type options | Static list | BuildingTypeOptions | none |
| 6 | CoveredLiabilitySelfInsuredRetention | Yes | Self-insured retention (SIR) amount options | Static list | CoveredLiabilitySelfInsuredRetention | none |
| 7 | Deductibleselection2 | Yes | Deductible amount options | Static list | DeductibleselectionOptions | none |
| 8 | EarthquakeLimitSelection | Yes | Earthquake limit options | Static list | EarthquakeLimitSelectionOptions | none |
| 9 | EarthquakeLimitSelectionforChart | Yes | Earthquake limit options (chart-label variant) | Static list | EarthquakeLimitSelectionOptions (local) | none |
| 10 | EndorsementOptions | Yes | Generic Yes/No endorsement toggle (shared by 4 endorsement questions) | Static list | Options | none |
| 11 | ExcessLiabilitiesLimitSelection | Yes | Excess liability limit options | Static list | ExcessLiabilitiesLimitSelectionOptions | none |
| 12 | ExcessLiabilitiesLimitSelectionForChart | Yes | Same as #11, chart variant (identical logic) | Static list | ExcessLiabilitiesLimitSelectionOptions | none |
| 13 | ExcessLiabilitiesPremium | Yes | Premium for the 500K excess liability tier | Static list (+ disabled legacy calc) | PackageOptions | none |
| 14 | FloodZoneSelection | Yes | FEMA flood zone code options | Static list | FloodzoneselectionOptions | none |
| 15 | GeneralPackageselection | Yes | Package tier options (Basic/Standard/Preferred) | Static list | PackageOptions | none |
| 16 | GetStandardDeductiblefactor | **No** (internal) | Looks up the rating factor multiplier for a given deductible | Lookup/calc | Factor (Decimal) | Deductible (Text) |
| 17 | GetWildFireandWindHailValue | Yes | Wildfire/Wind & Hail treatment options | Static list | Windenums | none |
| 18 | LandlordEndorsementSelection | Yes | Premium lookup for Landlord Endorsement by plan tier | Lookup | Value (Integer) | PlanType (Text) |
| 19 | LiabilitiesLimitSelection | Yes | Duplicate of #3 (identical values/logic) | Static list | LiabilitiesLimitSelectionOptions | none |
| 20 | LiabilityPackageSelectionPremium | Yes | Premium for Liability package tier | Static list | LiabilityPackageSelectionPremiumOptions | none |
| 21 | OfficeEndorsementSelection | Yes | Premium lookup for Home Office Endorsement by plan tier | Lookup | Value (Integer) | PlanType (Text) |
| 22 | PhysicalDamagePackageSelectionPremium | Yes | Premium for Physical Damage package tier | Static list | PackageOptions | none |
| 23 | ResidentialNoFaultMedicalPackageSelection | Yes | Premium for Residential No-Fault Medical package tier | Static list | ResidentialNoFaultMedicalPackageSelectionOptions | none |
| 24 | SinkholeForPlanComparissionchart | Yes | Sinkhole inclusion options (chart variant) | Static list | Sinkhole | none |
| 25 | SinkholeIncludedOrNot | Yes | Sinkhole inclusion Yes/No options | Static list | SinkholeIncludedOrNotOptions | none |
| 26 | SmallScaleEndorsementSelection | Yes | Premium lookup for Small Scale Farming Endorsement by plan tier | Lookup | Value (Integer) | PlanType (Text) |
| 27 | WorkersNoFaultMedical | Yes | Premium lookup for Workers No-Fault Medical by plan tier | Lookup | Value (Integer) | PlanType (Text) |
| 28 | Flood_ExcessFloodForchart | Yes | Flood/Excess flood limit options (chart variant) | Static list | Flood_ExcessFloodLimitSelectionOptions | none |
| 29 | Flood_ExcessFloodLimitSelection | Yes | Flood/Excess flood limit options | Static list | Flood_ExcessFloodLimitSelectionOptions | none |

**Two structural patterns exist in this folder:**

- **Pattern A — Static list (21 actions):** `Start → ListAppendAll → End`. A hard-coded array of `{Key, Value}` records is appended to a local list variable and returned as the sole output parameter. No entities, no SQL, no session/site-property dependency.
- **Pattern B — Filtered lookup (6 actions: GetStandardDeductiblefactor, LandlordEndorsementSelection, OfficeEndorsementSelection, SmallScaleEndorsementSelection, WorkersNoFaultMedical, and the disabled logic inside ExcessLiabilitiesPremium):** `Start → ListAppendAll → ListFilter → Assign → End`. The same style of hard-coded `{Key, Value}` list is built, then `ListFilter` (OutSystems system action) finds the record whose `Key` matches an input parameter, and an `Assign` node converts `FilteredList.Current.Value` to the output type.

None of the 29 actions perform SQL queries, Aggregates, or Entity/table reads. All "dropdown data" is hard-coded in-memory list literals. None reference Site Properties, Session variables, UserId, QuoteId, PolicyId, LOB, Product, State, Persona, or Status. None distinguish "active" vs "inactive" records — every literal in every list is always returned in full, in the order written.

---

## 2. Detailed Action Documentation

### 2.1 AddCatastrophicWindToNonTransferredRisks

- **Purpose:** Supplies dropdown options for whether catastrophic wind coverage is added to non-transferred risks.
- **Public:** Yes | **Input parameters:** none | **Local variables:** none beyond the output list itself
- **Output parameter:** `AddCatastrophicWindToNonTransferredRisksOptions` — List of structure `ListItems` (`Key`: Text, `Value`: Text)
- **Logic:** `Start → ListAppendAll → End`. `ListAppendAll` (OutSystems system action, external dependency) appends a literal array to the output list.
- **Dropdown values returned (static, in order):**

| Key | Value |
|---|---|
| Add to non-transferred risks | Add to non-transferred risks |
| Yes | Yes |

- **SQL / Aggregates / Entities:** none.
- **Conditions / business rules:** none — unconditional static list.
- **Exception handling:** none.
- **Dependencies:** none (Site Properties/Session/QuoteId/etc. not used).
- **Active/inactive filtering:** not applicable — always returns both records.
- **Rebuild note:** Reproduce as a simple in-memory constant list of 2 text/text pairs.

---

### 2.2 AddWilFireToNonTransferredRisks

- **Purpose:** Dropdown for adding wildfire coverage to non-transferred risks.
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `AddWilFireToNonTransferredRisksOptions` — List of `ListItems` (`Key`: Text, `Value`: Text)
- **Logic:** `Start → ListAppendAll → End`.
- **Dropdown values returned:**

| Key | Value |
|---|---|
| Add to non-transferred risks | False |
| Yes | True |

  Note: the `Value` attribute's data type is **Text**, but the literal expression entered by the developer is the unquoted word `False`/`True` (not `"False"`/`"True"`) — i.e. this list encodes a boolean-like flag as text rather than mirroring the label, unlike action 2.1.
- **SQL / Aggregates / Entities:** none. **Conditions:** none. **Exceptions:** none. **Dependencies:** none.
- **Rebuild note:** Preserve the asymmetry — Key is a human label, Value is a literal "False"/"True" string, not the label repeated.

---

### 2.3 AmountOfLiabilityCoverage

- **Purpose:** Liability coverage amount dropdown.
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `LiabilitiesLimitSelectionOptions` — List of `ListItems` (Key: Text, Value: Text)
- **Logic:** `Start → ListAppendAll → End`.
- **Dropdown values returned:**

| Key | Value |
|---|---|
| 100,000 | 100000 |
| 300,000 | 300000 |
| 500,000 | 500000 |

- **SQL/Entities/Conditions/Exceptions:** none. **Dependencies:** none.
- **Duplicate note:** This action is functionally identical (same output variable name, same list, same values) to **action 2.19 LiabilitiesLimitSelection**. They appear to be duplicate/alias actions — both should be reconciled to a single source of truth during rebuild.

---

### 2.4 BuildingDescription

- **Purpose:** Building description dropdown (floors/basement/manufactured).
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `BuildingDescriptionOptions` — List of `ListItems` (Key: Text, Value: Text)
- **Logic:** `Start → ListAppendAll → End`.
- **Dropdown values returned:**

| Key | Value |
|---|---|
| y | y |
| More than 1 floor no basement | More than 1 floor no basement |
| More than 1 floor with basement | More than 1 floor with basement |
| Manufactured | Manufactured |

  Note: the first entry's label is literally the single character `y`, not an expanded phrase (e.g. "1 story"). This is exactly what is stored in the module today — carry it through verbatim during rebuild unless business confirms it's a data-entry defect.
- **SQL/Entities/Conditions/Exceptions/Dependencies:** none.

---

### 2.5 BuildingType

- **Purpose:** Building foundation type dropdown.
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `BuildingTypeOptions` — List of `ListItems` (Key: Text, Value: Text)
- **Logic:** `Start → ListAppendAll → End`.
- **Dropdown values returned:**

| Key | Value |
|---|---|
| No basement/enclosure | No basement/enclosure |
| With basement | With basement |
| With enclosure | With enclosure |
| Elevated on crawlspace | Elevated on crawlspace |
| non-elevated with subgrade crawlspace | non-elevated with subgrade crawlspace |
| manufactured | manufactured |

- **SQL/Entities/Conditions/Exceptions/Dependencies:** none.

---

### 2.6 CoveredLiabilitySelfInsuredRetention

- **Purpose:** Self-insured retention (SIR) amount dropdown for covered liability.
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `CoveredLiabilitySelfInsuredRetention` — List of `ListItems` (Key: Text, Value: Text). Note: the output variable shares the exact same name as the action itself (unlike most other actions in the folder, which append an "Options" suffix).
- **Logic:** `Start → ListAppendAll → End`.
- **Dropdown values returned:**

| Key | Value |
|---|---|
| None | None |
| 1,000 | 1,000 |
| 2,500 | 2,500 |

- **SQL/Entities/Conditions/Exceptions/Dependencies:** none.

---

### 2.7 Deductibleselection2

- **Purpose:** Deductible amount dropdown.
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `DeductibleselectionOptions` — List of `ListItems` (Key: Text, Value: **Integer**, not Text — this list departs from the Text/Text pattern seen elsewhere).
- **Logic:** `Start → ListAppendAll → End`.
- **Dropdown values returned:**

| Key (label) | Value (numeric) |
|---|---|
| 2,500 | 2500 |
| 5,000 | 5000 |
| 10,000 | 10000 |
| 25,000 | 25000 |

- **SQL/Entities/Conditions/Exceptions:** none.
- **Dependency note:** This exact list of Keys ("2500","5000","10000","25000" as raw numbers without commas — see action 2.16) is the lookup table consumed by `GetStandardDeductiblefactor` (2.16), which matches on the unformatted numeric string. Confirm during rebuild whether the two lists (`DeductibleselectionOptions` here vs. the internal `DeductibleselectionOptions` local variable inside 2.16) are meant to be the same master list — today they are maintained as two separate hard-coded copies with different Key formatting ("2,500" here vs "2500" in 2.16).

---

### 2.8 EarthquakeLimitSelection

- **Purpose:** Earthquake coverage limit dropdown.
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `EarthquakeLimitSelectionOptions` — List of `ListItems` (Key: Text, Value: Text)
- **Logic:** `Start → ListAppendAll → End`.
- **Dropdown values returned:**

| Key | Value |
|---|---|
| None | None |
| 25,000 | 25000 |
| 50,000 | 50000 |
| 100,000 | 100000 |

- **SQL/Entities/Conditions/Exceptions/Dependencies:** none.

---

### 2.9 EarthquakeLimitSelectionforChart

- **Purpose:** Same earthquake limit dropdown, used for chart/summary display.
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `EarthquakeLimitSelectionOptions` (locally scoped to this action — same name as 2.8's output but a distinct variable)
- **Logic:** `Start → ListAppendAll → End`.
- **Dropdown values returned:**

| Key | Value |
|---|---|
| Non-Transferred | Non-Transferred |
| 25,000 | 25000 |
| 50,000 | 50000 |
| 100,000 | 100000 |

- **Difference from 2.8:** first option's label/value is "Non-Transferred" here vs. "None" in the standard selector — this is the only distinction between the two actions.
- **SQL/Entities/Conditions/Exceptions/Dependencies:** none.

---

### 2.10 EndorsementOptions

- **Purpose:** Generic Yes/No toggle, reused by several endorsement questions.
- **Description field (as authored in the module):** *"Residential Worker No-fault Medical,Small Scale Farming Endorsement,Landlord Endorsement,Home Office Endorsement"* — indicating this single dropdown action backs the Yes/No question for **four** different endorsement UI fields, rather than each having its own dedicated Yes/No action.
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `Options` — List of `ListItems` (Key: Text, Value: Text)
- **Logic:** `Start → ListAppendAll → End`.
- **Dropdown values returned:**

| Key | Value |
|---|---|
| No | No |
| Yes | Yes |

- **SQL/Entities/Conditions/Exceptions/Dependencies:** none.

---

### 2.11 ExcessLiabilitiesLimitSelection

- **Purpose:** Excess liability limit dropdown.
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `ExcessLiabilitiesLimitSelectionOptions` — List of `ListItems` (Key: Text, Value: Text)
- **Logic:** `Start → ListAppendAll → End`.
- **Dropdown values returned:**

| Key | Value |
|---|---|
| Not Applicable | Not Applicable |
| 500,000 | 500000 |

- **SQL/Entities/Conditions/Exceptions/Dependencies:** none.

---

### 2.12 ExcessLiabilitiesLimitSelectionForChart

- **Purpose:** Chart-facing variant of 2.11.
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `ExcessLiabilitiesLimitSelectionOptions`
- **Logic:** `Start → ListAppendAll → End`.
- **Dropdown values returned:** identical to 2.11 —

| Key | Value |
|---|---|
| Not Applicable | Not Applicable |
| 500,000 | 500000 |

- **Note:** This is a byte-for-byte duplicate of action 2.11 (same list, same output variable name). No functional difference was found between the two actions.

---

### 2.13 ExcessLiabilitiesPremium

- **Purpose:** Returns the premium associated with the excess liability limit option.
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `PackageOptions` — List of `ListItems` (Key: appears numeric/Long Integer, Value: Decimal/Integer)
- **Active logic:** `Start → ListAppendAll → End`.
- **Active dropdown values returned:**

| Key | Value |
|---|---|
| 500000 | 100 |

  Only a single record is returned in the live flow — i.e. today this action effectively returns a fixed premium of 100 for the 500,000 excess-liability limit.

- **⚠️ Disabled/orphaned logic found (not executed, not connected to Start/End):** The canvas contains a second, disconnected node named `ListAppendAll2`, annotated with the comment "IN-2064 changes" (an apparent reference to a change ticket). This node is **not wired into the active flow** and does not run, but its configured expression reveals a richer, previously-live premium calculation for higher excess-liability tiers:

  | Key | Value expression |
  |---|---|
  | 1000000 | `BasePrice+BasePrice` |
  | 2000000 | `270/((BasePrice*70)/100)+PackageOptions[PackageOptions.CurrentRowNumber-1].Value` |
  | 3000000 | `330/((BasePrice*60)/100)+PackageOptions[PackageOptions.CurrentRowNumber-1].Value` |
  | 4000000 | `380/((BasePrice*50)/100)+PackageOptions[PackageOptions.CurrentRowNumber-1].Value` |
  | 5000000 | `420/((BasePrice*40)/100)+PackageOptions[PackageOptions.CurrentRowNumber-1].Value` |

  This formula computes a cumulative/tiered premium: each higher limit's premium is derived from a percentage of `BasePrice` plus the previous row's already-computed premium (self-referential accumulation via `CurrentRowNumber-1`). `BasePrice` is a variable referenced but not defined within this action's visible scope in the disabled node — it is presumably a parameter/session value from a calling context. **This logic is historical/inactive and should be treated as a reference only, not as current production behavior**, unless business confirms the ticket IN-2064 change was meant to restore it.
- **SQL/Entities/Conditions/Exceptions:** none in the active path.
- **Rebuild note:** Rebuild only the single active record (`500000 → 100`) as current behavior. Flag the disabled tiered-premium formula to the business/product owner to confirm whether the 1M–5M tiers should be reinstated, since as of today those higher limits have no premium logic wired up in this action.

---

### 2.14 FloodZoneSelection

- **Purpose:** FEMA flood zone designation dropdown.
- **Description field:** "Flood zone selection"
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `FloodzoneselectionOptions` — List of `ListItems` (Key: Text, Value: Text)
- **Logic:** `Start → ListAppendAll → End`.
- **Dropdown values returned:**

| Key | Value |
|---|---|
| A,AO,AH,D3 | A,AO,AH,D3 |
| V,VE,V1-V30 | V,VE,V1-V30 |
| A99,B,C,X | A99,B,C,X |
| D | D |
| AE, A1-A30 | AE, A1-A30 |
| None | None |

- **SQL/Entities/Conditions/Exceptions/Dependencies:** none.

---

### 2.15 GeneralPackageselection

- **Purpose:** General package tier dropdown (Basic/Standard/Preferred), used as the base tier selector across multiple endorsement premium lookups.
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `PackageOptions` — List of `ListItems` (Key: Text, Value: Text)
- **Logic:** `Start → ListAppendAll → End`.
- **Dropdown values returned:**

| Key | Value |
|---|---|
| Basic | Basic |
| Standard | Standard |
| Preferred | Preferred |

- **SQL/Entities/Conditions/Exceptions/Dependencies:** none.
- **Usage note:** The Key values here ("Basic"/"Standard"/"Preferred") are exactly the `PlanType` input values consumed by the premium-lookup actions (2.18, 2.21, 2.26, 2.27) — i.e. this is the master tier list that the UI dropdown shows, and the tier the user picks here is the `PlanType` fed into those lookup actions.

---

### 2.16 GetStandardDeductiblefactor  *(internal helper — Public = No)*

- **Purpose:** Converts a selected deductible amount into a rating factor multiplier used elsewhere in premium calculation. This is **not** a UI-facing dropdown data source — it is an internal calculation helper, included here because it physically lives in the `DropDownvaluesHB` folder.
- **Public:** No | **Function:** No
- **Input parameter:** `Deductible` — Text, Mandatory
- **Output parameter:** `Factor` — Decimal
- **Local variable:** `DeductibleselectionOptions` — List of `ListItems` (Key: Text, Value: Decimal), populated via `ListAppendAll`
- **Logic flow:** `Start → ListAppendAll → ListFilter → Assign(Factor) → End`
  1. `ListAppendAll` (external/system action) builds the local lookup table:

     | Key | Value (factor) |
     |---|---|
     | 2500 | 1 |
     | 5000 | 0.935 |
     | 10000 | 0.86 |
     | 25000 | 0.75 |

  2. `ListFilter` (external/system action): `SourceList = DeductibleselectionOptions`, **Condition:** `Key = Deductible` (the input parameter). Output: `FilteredList`.
  3. `Assign` node: `Factor = If(ListFilter.FilteredList.Empty, 0.00, TextToDecimal(ListFilter.FilteredList.Current.Value))`
- **Business rule:** if the input `Deductible` text doesn't match any of the 4 hard-coded keys, the function safely defaults to `Factor = 0.00` rather than erroring.
- **SQL/Entities:** none — pure in-memory lookup.
- **Exception handling:** implicit via the `Empty` check in the Assign expression (no try-catch block present).
- **Dependencies:** none on Site Properties/Session/QuoteId etc. Depends only on the `Deductible` input string matching one of "2500"/"5000"/"10000"/"25000" (no commas, no formatting).
- **Where used:** Not called by any other action inside this folder (verified — no callers found within DropDownvaluesHB). It is presumably invoked from rating/premium logic elsewhere in the module (outside the folder scope of this PRD).

---

### 2.17 GetWildFireandWindHailValue

- **Purpose:** Wildfire/Wind & Hail treatment dropdown.
- **Description field:** "WildFire and Wind & Hail"
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `Windenums` — List of `ListItems` (Key: Text, Value: Text)
- **Logic:** `Start → ListAppendAll → End`.
- **Dropdown values returned:**

| Key | Value |
|---|---|
| Included | Included |
| Non-Transferred | Non-Transferred |

- **SQL/Entities/Conditions/Exceptions/Dependencies:** none.

---

### 2.18 LandlordEndorsementSelection

- **Purpose:** Looks up the premium for the Landlord Endorsement given a selected package tier.
- **Public:** Yes
- **Input parameter:** `PlanType` — Text, Mandatory
- **Output parameter:** `Value` — Integer
- **Local variable:** `PackageOptions` — List of `ListItems` (Key: Text, Value: Text), populated via `ListAppendAll`
- **Logic flow:** `Start → ListAppendAll → ListFilter → Assign(Value) → End`
  1. `ListAppendAll` builds:

     | Key | Value (premium) |
     |---|---|
     | Basic | 50 |
     | Standard | 150 |
     | Preferred | 250 |

  2. `ListFilter`: `SourceList = PackageOptions`, **Condition:** `PlanType = Key`. Output: `FilteredList`.
  3. `Assign`: `Value = TextToInteger(ListFilter.FilteredList.Current.Value)`
- **⚠️ Business-rule / risk observation:** unlike `GetStandardDeductiblefactor` (2.16), this action does **not** check `FilteredList.Empty` before reading `.Current`. If `PlanType` does not match "Basic"/"Standard"/"Preferred" exactly, this will raise a runtime error (accessing `.Current` on an empty list) rather than returning a safe default. Same pattern/risk applies to 2.21, 2.26, 2.27 below.
- **SQL/Entities:** none. **Exception handling:** none present (see risk note above). **Dependencies:** none on Site Properties/Session/etc — depends only on caller supplying a valid `PlanType`.

---

### 2.19 LiabilitiesLimitSelection

- **Purpose:** Liability coverage amount dropdown — duplicate of action 2.3.
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `LiabilitiesLimitSelectionOptions` — List of `ListItems` (Key: Text, Value: Text)
- **Logic:** `Start → ListAppendAll → End`.
- **Dropdown values returned:** identical to 2.3 —

| Key | Value |
|---|---|
| 100,000 | 100000 |
| 300,000 | 300000 |
| 500,000 | 500000 |

- **SQL/Entities/Conditions/Exceptions/Dependencies:** none.
- **Duplicate note:** See 2.3 — recommend consolidating to one action during rebuild.

---

### 2.20 LiabilityPackageSelectionPremium

- **Purpose:** Premium for the Liability package tier.
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `LiabilityPackageSelectionPremiumOptions` — List of `ListItems` (Key: Text, Value: Decimal)
- **Logic:** `Start → ListAppendAll → End` (no filter — static list only, despite the "Premium" name suggesting a lookup).
- **Dropdown values returned:**

| Key | Value (premium) |
|---|---|
| Basic | 0 |
| Standard | 20.00 |
| Preferred | 40.00 |

- **SQL/Entities/Conditions/Exceptions/Dependencies:** none.

---

### 2.21 OfficeEndorsementSelection

- **Purpose:** Looks up the premium for the Home Office Endorsement given a selected package tier.
- **Public:** Yes
- **Input parameter:** `PlanType` — Text, Mandatory
- **Output parameter:** `Value` — Integer
- **Local variable:** `PackageOptions` — List of `ListItems` (Key: Text, Value: Text)
- **Logic flow:** `Start → ListAppendAll → ListFilter → Assign(Value) → End`
  1. `ListAppendAll` builds:

     | Key | Value (premium) |
     |---|---|
     | Basic | 20 |
     | Standard | 60 |
     | Preferred | 100 |

  2. `ListFilter`: Condition `PlanType = Key`.
  3. `Assign`: `Value = TextToInteger(ListFilter.FilteredList.Current.Value)`
- **Risk observation:** same as 2.18 — no `Empty` guard before `.Current`.
- **SQL/Entities/Exceptions/Dependencies:** none.

---

### 2.22 PhysicalDamagePackageSelectionPremium

- **Purpose:** Premium for the Physical Damage package tier.
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `PackageOptions` — List of `ListItems` (Key: Text, Value: Decimal)
- **Logic:** `Start → ListAppendAll → End` (static list, no filter).
- **Dropdown values returned:**

| Key | Value (premium) |
|---|---|
| Basic | 0.0 |
| Standard | 106.00 |
| Preferred | 212.00 |

- **SQL/Entities/Conditions/Exceptions/Dependencies:** none.

---

### 2.23 ResidentialNoFaultMedicalPackageSelection

- **Purpose:** Premium/options for Residential No-Fault Medical package tier.
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `ResidentialNoFaultMedicalPackageSelectionOptions` — List of `ListItems` (Key: Text, Value: Integer)
- **Logic:** `Start → ListAppendAll → End` (static list, no filter).
- **Dropdown values returned:**

| Key | Value |
|---|---|
| Add to non-transferred risks | 0 |
| Basic | 50 |
| Standard | 100 |
| Preferred | 250 |

- **Business rule note:** unlike the equivalent lookup actions (2.18, 2.21, 2.26, 2.27), this one returns the **full static list** (including the "Add to non-transferred risks" option) rather than performing a filtered single-value lookup — the UI presumably filters/selects client-side, or this action's list is consumed directly as the dropdown's full option set with premiums attached per option.
- **SQL/Entities/Conditions/Exceptions/Dependencies:** none.

---

### 2.24 SinkholeForPlanComparissionchart

- **Purpose:** Sinkhole coverage inclusion dropdown, chart-facing variant.
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `Sinkhole` — List of `ListItems` (Key: Text, Value: Text)
- **Logic:** `Start → ListAppendAll → End`.
- **Dropdown values returned:**

| Key | Value | Inline comment in source |
|---|---|---|
| Yes | Yes | `//"Add to non-transferred risks"` |
| Non-Transferred | Non-Transferred | — |

  The developer left an inline comment next to the "Yes" key clarifying its business meaning ("Add to non-transferred risks").
- **SQL/Entities/Conditions/Exceptions/Dependencies:** none.

---

### 2.25 SinkholeIncludedOrNot

- **Purpose:** Sinkhole coverage inclusion Yes/No dropdown.
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `SinkholeIncludedOrNotOptions` — List of `ListItems` (Key: Text, Value: Text)
- **Logic:** `Start → ListAppendAll → End`.
- **Dropdown values returned:**

| Key | Value | Inline comment in source |
|---|---|---|
| Yes | Yes | `//"Add to non-transferred risks"` |
| No | No | — |

  Same inline developer comment pattern as 2.24.
- **SQL/Entities/Conditions/Exceptions/Dependencies:** none.

---

### 2.26 SmallScaleEndorsementSelection

- **Purpose:** Looks up the premium for the Small Scale Farming Endorsement given a selected package tier.
- **Public:** Yes
- **Input parameter:** `PlanType` — Text, Mandatory
- **Output parameter:** `Value` — Integer
- **Local variable:** `PackageOptions` — List of `ListItems`
- **Logic flow:** `Start → ListAppendAll → ListFilter → Assign(Value) → End`
  1. `ListAppendAll` builds:

     | Key | Value (premium) |
     |---|---|
     | Basic | 40 |
     | Standard | 120 |
     | Preferred | 200 |

  2. `ListFilter`: Condition `PlanType = Key`.
  3. `Assign`: `Value = TextToInteger(ListFilter.FilteredList.Current.Value)`
- **Risk observation:** same missing `Empty` guard as 2.18/2.21.
- **SQL/Entities/Exceptions/Dependencies:** none.

---

### 2.27 WorkersNoFaultMedical

- **Purpose:** Looks up the premium for Workers No-Fault Medical coverage given a selected package tier.
- **Public:** Yes
- **Input parameter:** `PlanType` — Text, Mandatory
- **Output parameter:** `Value` — Integer
- **Local variable:** `PackageOptions` — List of `ListItems`
- **Logic flow:** `Start → ListAppendAll → ListFilter → Assign(Value) → End`
  1. `ListAppendAll` builds:

     | Key | Value (premium) |
     |---|---|
     | Basic | 50 |
     | Standard | 100 |
     | Preferred | 250 |

  2. `ListFilter`: Condition `PlanType = Key`.
  3. `Assign`: `Value = TextToInteger(ListFilter.FilteredList.Current.Value)`
- **Risk observation:** same missing `Empty` guard as 2.18/2.21/2.26.
- **Note:** these premium tiers (50/100/250) are identical to `ResidentialNoFaultMedicalPackageSelection`'s Basic/Standard/Preferred values (2.23), suggesting the two coverages share the same rate card.
- **SQL/Entities/Exceptions/Dependencies:** none.

---

### 2.28 Flood_ExcessFloodForchart

- **Purpose:** Flood / Excess Flood limit dropdown, chart-facing variant.
- **Description field:** "Flood/Excess flood limit selection"
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `Flood_ExcessFloodLimitSelectionOptions` — List of `ListItems` (Key: Text, Value: Text)
- **Logic:** `Start → ListAppendAll2 → End` (node is named `ListAppendAll2` here but functions identically to `ListAppendAll` used elsewhere — naming variance only).
- **Dropdown values returned:**

| Key | Value |
|---|---|
| Non-Transferred | Non-Transferred |
| 10,000 | 10000 |
| 25,000 | 25000 |
| 50,000 | 50000 |

- **SQL/Entities/Conditions/Exceptions/Dependencies:** none.

---

### 2.29 Flood_ExcessFloodLimitSelection

- **Purpose:** Flood / Excess Flood limit dropdown (standard, non-chart).
- **Description field:** "Flood/Excess flood limit selection"
- **Public:** Yes | **Input parameters:** none
- **Output parameter:** `Flood_ExcessFloodLimitSelectionOptions` — List of `ListItems` (Key: Text, Value: Text)
- **Logic:** `Start → ListAppendAll2 → End`.
- **Dropdown values returned:**

| Key | Value |
|---|---|
| None | None |
| 10,000 | 10000 |
| 25,000 | 25000 |
| 50,000 | 50000 |

- **Difference from 2.28:** first option is "None" here vs. "Non-Transferred" in the chart variant — same pattern as the Earthquake pair (2.8 vs 2.9).
- **SQL/Entities/Conditions/Exceptions/Dependencies:** none.

---

## 3. Cross-Cutting Observations

**External dependencies used by every action in this folder:**
- `ListAppendAll` (OutSystems system/platform action) — "Adds the elements of the source list to the end of the destination list." Used by all 29 actions to materialize their static option lists. This is a built-in OutSystems reference, not custom logic in this module.
- `ListFilter` (OutSystems system/platform action) — "Returns a new list with the elements from the List parameter satisfying the given condition." Used by the 5 lookup-style actions (2.16, 2.18, 2.21, 2.26, 2.27) to find the record matching an input key.

**"PackageOptions" naming duplication:** The variable name `PackageOptions` is independently reused (as a local or output variable) inside seven different, unrelated actions: 2.13 ExcessLiabilitiesPremium, 2.15 GeneralPackageselection, 2.18 LandlordEndorsementSelection (local), 2.21 OfficeEndorsementSelection (local), 2.22 PhysicalDamagePackageSelectionPremium, 2.26 SmallScaleEndorsementSelection (local), and 2.27 WorkersNoFaultMedical (local). These are independent, action-scoped variables that happen to share a name — they do not share data at runtime, but the naming collision is worth flagging for anyone rebuilding this in a different platform, to avoid accidentally treating them as a single shared list.

**Known duplicate action pairs (functionally identical):**
- `AmountOfLiabilityCoverage` (2.3) ≡ `LiabilitiesLimitSelection` (2.19)
- `ExcessLiabilitiesLimitSelection` (2.11) ≡ `ExcessLiabilitiesLimitSelectionForChart` (2.12)

**Known "chart variant" pairs (same data, one option's Key/Value differs — "None" vs "Non-Transferred"):**
- `EarthquakeLimitSelection` (2.8) vs `EarthquakeLimitSelectionforChart` (2.9)
- `Flood_ExcessFloodLimitSelection` (2.29) vs `Flood_ExcessFloodForchart` (2.28)

**Shared Yes/No action:** `EndorsementOptions` (2.10) is explicitly documented (via its Description field) as backing four separate UI questions (Residential Worker No-Fault Medical, Small Scale Farming Endorsement, Landlord Endorsement, Home Office Endorsement) rather than each having a dedicated Yes/No dropdown action.

**No entity/database access anywhere in this folder.** Every dropdown's data is a hard-coded literal list inside the action itself. There are no Aggregates, no SQL nodes, and no Entity actions (Create/Update/Delete/GetById) used by any of the 29 actions.

**No dependency on Site Properties, Session, UserId, QuoteId, PolicyId, LOB, Product, State, Persona, or Status** was found in any of the 29 actions — confirmed by inspecting each action's Start node (input parameters) and full node-by-node logic. The only inputs used anywhere in the folder are `Deductible` (2.16) and `PlanType` (2.18, 2.21, 2.26, 2.27), both plain Text parameters supplied by the caller.

**No active/inactive flagging exists.** None of the static lists filter on an "active" or "status" column, because there is no underlying table — every hard-coded record is always returned.

**Risk / code-quality observations for rebuild:**
1. Four lookup actions (2.18, 2.21, 2.26, 2.27, and by inference 2.16 already guards this) do not check whether `ListFilter` returned an empty list before reading `.Current`. Only `GetStandardDeductiblefactor` (2.16) has an `Empty` guard with a safe `0.00` fallback. The other four will throw a runtime error if called with a `PlanType` that doesn't match "Basic"/"Standard"/"Preferred" exactly. Recommend adding the same `Empty` guard pattern to all four during rebuild.
2. `ExcessLiabilitiesPremium` (2.13) contains a disabled, disconnected node with a materially different (and more complete) tiered-premium formula referencing an undefined-in-scope `BasePrice` variable and a ticket reference "IN-2064 changes." This should be surfaced to the business owner before rebuild to confirm whether the 1M/2M/3M/4M/5M tiers are intentionally unsupported today or were accidentally disabled.
3. `Deductibleselection2` (2.7) and the internal lookup table inside `GetStandardDeductiblefactor` (2.16) encode the same four deductible amounts but with different Key formatting ("2,500" vs "2500") — these are two independently maintained copies of what should probably be one master list.
4. Two pairs of actions (2.3/2.19 and 2.11/2.12) are exact duplicates and should be consolidated into a single action during rebuild to avoid drift.

---

## 4. Database / Entity Mapping

**None.** No table, entity, or Aggregate is read or written by any action in the `DropDownvaluesHB` folder. All 29 actions are pure in-memory static-list or static-lookup logic. If a rebuild target requires dropdown values to come from a database table instead of hard-coded lists, this would be a **new design decision**, not a port of existing behavior — today's implementation is 100% hard-coded literals inside OutSystems server action flows.

## 5. Rebuild-Ready Implementation Notes

- Each of the 21 "Pattern A" static-list actions can be rebuilt as a simple function/endpoint that returns a constant array of key/value pairs — no database, no parameters, no conditional logic required. Copy the exact literal tables in Section 2 above, preserving quirks noted (e.g. the single-character "y" key in BuildingDescription, the True/False-as-text values in AddWilFireToNonTransferredRisks).
- Each of the 5 "Pattern B" lookup actions (GetStandardDeductiblefactor, LandlordEndorsementSelection, OfficeEndorsementSelection, SmallScaleEndorsementSelection, WorkersNoFaultMedical) should be rebuilt as a function taking one Text parameter (`Deductible` or `PlanType`) and returning the matched numeric value, with an explicit "not found" branch (recommend defaulting to 0 for all five, matching 2.16's existing safe pattern, and fixing the missing guard in the other four as noted in the risk section).
- Decide during rebuild whether to consolidate the two duplicate pairs (2.3/2.19, 2.11/2.12) and the two informally-duplicated deductible tables (2.7 vs. the internal table in 2.16) into single master lists, to prevent the values drifting apart again in the future.
- Flag the disabled tiered-premium formula inside ExcessLiabilitiesPremium (2.13) to the business owner for an explicit decision before deciding whether to port it forward.
