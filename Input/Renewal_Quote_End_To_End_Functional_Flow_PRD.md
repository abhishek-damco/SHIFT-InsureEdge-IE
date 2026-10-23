# Renewal Quote — End-to-End Functional Flow PRD

> **Application:** InsureEdge (OutSystems Reactive Web) — eSpace "Policy" — branded "Hudson Bailey" — footer "© 2025 Insure Edge (v2.0)"
> **Environment (observed):** damco-dev.outsystemsenterprise.com
> **Persona used for capture:** Client Admin ("Hudson Client Admin")
> **Test record:** Renewal ID 00000000135 | Original Policy 001-00004-0000015-00 | LOB "E&S Homeowners" | Sub Product "SuperPerils" | Status Draft
> **Nature of document:** Reverse-engineered from the running application (READ-ONLY). No application changes were made. Items that cannot be confirmed from the browser (Service Studio internals, exact DB columns, server-action logic, timers/BPT) are explicitly marked **Unverified**.

---

## 1. Executive Summary
The Renewal Quote flow lets an authorized user open an existing renewal record from the Quotes & Policies listing (via the **View** action) and walk a multi-step stepper — Policy Information → Risk (Location, Risk Information, Plans Overview, UW Specific Change) → Quote Review → Finalize Quote → Documents. The flow reuses common Homeowners blocks and integrates HexCat status lookup, Google Address autocomplete, and an international phone component. Several document actions (Download/Share/Preview Quote) currently surface a "Feature InProgress" toast. This PRD documents the observed frontend behaviour and observed network/screen actions, and flags backend/DB specifics as Unverified where the browser cannot confirm them.

## 2. Scope
**In scope:** Dashboard listing entry (View button) through completion of the Documents section, including screens, tabs, popups, fields, dropdowns, validations, observed client/screen actions, and observed data actions. **Out of scope / Unverified:** Service Studio module internals, exact entity/column names, server action logic, timers/BPT, and any flow that could not be exercised as Client Admin (Bind/Issue/Payment). This is a documentation task only — no modify/publish/deploy/delete performed.

## 3. Personas and Permissions
- **Client Admin (observed):** On the renewal listing, only the **View** action is visible in the Action cell; Edit and Delete links exist in the DOM but are hidden for this persona.
- **Producer / Underwriter (Unverified):** Not exercised. The presence of a "UW Specific Change" step and a payment-before-bind gate suggests an underwriter approval/bind gate, but persona-specific field/button differences could not be confirmed from this session.

## 4. Renewal Quote Generation
The mechanism that creates renewal records (Timer / BPT / scheduled server action / manual) is **Unverified** — not observable from the browser. Notice periods (e.g., 30/15/7 days), eligibility copy/reset/recalculation rules, renewal-number generation, and status assignment could not be confirmed. Observed: renewal records already exist in the listing with a Renewal ID, linked Original Policy Number, and Status.

## 5. Renewal Eligibility Rules
**Unverified.** Active-policy / premium-paid / grace-period / expiry conditions and blocking rules are server-side and not observable. No eligibility error was triggerable read-only.

## 6. Dashboard and View Entry Flow
Listing screen: **Policy.MainFlow.LandingPage** (Individual → Renewal Quote). Summary cards observed: Total 3, Draft 3, Pending 0, Declined 0, Expired 0. Grid columns: Action, Renewal ID, Original Policy Number, Insured Name, LOB, Sub Product, Intermediary Type, Intermediary (plus hidden columns: Effective/Expiration/Renewal Offer Date, Premium Estimate, Creation Date, Producer Name, Status). **View** click triggers screen action `setRequestStatus('View')`, which fires (observed network): `ActionCreateLog` → `ActionAESEncrypt` (via IE_Common_CW) → `DataActionGetHexCatStatus`, then navigates to **NewSubmission** passing `CurrentStep` and an AES-encrypted `Key` parameter. Error handling for missing/invalid records is **Unverified**.

## 7. End-to-End Navigation Map
NewSubmission stepper: Policy Information (Step 1) → Risk [Location (2.1) → Risk Information (2.2) → Plans Overview (2.4) → UW Specific Change (2.5)] → Quote Review (Step 3) → Finalize Quote (Step 4) → Documents (Step 5). Stepper enforces sequential completion for forward clicks; read-only traversal was possible via direct CurrentStep URL parameter.

## 8. Screen-by-Screen Functional Details
Screen container: **Policy.MainFlow.NewSubmission**. Blocks observed:
- Policy Information — `Policy.HBCommon.PolicyInfo_HB_Optimized`
- Risk Information — `Policy.HBIS.HBISRiskInformation_Optimized`
- Plans Overview (Homeowners) — `Policy.HBCommon.Homeowners_HB`
- Quote Review — `Policy.HBCommon.QuoteReview_HB_Optimized`
- Finalize Quote — `Policy.HB_FinalizeQuote_WB.FinalizeQuote_HB`
- Documents — `Policy.MainFlow.Documents` / `Policy.HBCommon.Documents_HB` / `Policy.HBCommon.CreateClientDocuments_HB`
Fields on Policy Information/Location/Risk were largely prefilled and many disabled/readonly in the observed Draft/View state. Location edit and Mortgage Information use popups (view/edit). Google Address autocomplete and International Telephone Input components are used on address/phone fields.

## 9. Field Mapping and Prefill Rules
Fields appear prefilled from the linked original policy/quote (values present on load). Which fields are copied vs recalculated vs reset is **Unverified** (server-side). Grid/field binding names captured serve as a proxy for DB mapping (see §22). Editability observed as mostly disabled in View/Draft for this persona.

## 10. UI Validations
Client-side mandatory/format validations exist on editable fields (standard OutSystems pattern), but exact messages and trigger points could not be exhaustively enumerated read-only. Confirmed UI feedback: **"Feature InProgress"** toast on Download/Share/Preview Quote actions. Other exact validation messages are **Unverified**.

## 11. Backend Validations
**Unverified.** Server-side validations (renewal eligibility, coverage/limit, payment, document) are not observable from the browser.

## 12. Button and Action Behaviour
- **View** (listing): `setRequestStatus('View')` → log/encrypt/HexCat → navigate to NewSubmission. Verified.
- **Save / Save & Next / Back / Continue:** present in stepper flow; exact server actions/DB updates **Unverified** (not exercised to avoid state change).
- **Cancel** split-button: Close Quote / Decline Quote / Delete Quote (destructive — NOT exercised).
- **Document** split-button: Download Quote / Share Quote / Preview Quote → all show **"Feature InProgress"** toast (Verified).
- **Bind / Issue / Pay Now / Generate Document:** Not reachable/exercised as Client Admin — **Unverified**.

## 13. Rating and Premium Calculation
**Unverified.** Premium/rating engine and recalculation triggers are server-side. Premium Estimate appears as a listing column value only.

## 14. Plans Overview and Selection
Rendered via `Homeowners_HB` block on step 2.4. Plan selection/coverage editing was not modified. Detailed plan option sources and calculation are **Unverified**.

## 15. Finalize Quote Flow
Rendered via `FinalizeQuote_HB` (module `HB_FinalizeQuote_WB`; endorsement counterpart `HB_FinalizeQuoteEndorsement_WB` referenced). Finalize actions not exercised (would change state) — logic **Unverified**.

## 16. Payment Flow
**Unverified / Not exercised.** A payment-before-bind gate is implied by the flow but was not reachable read-only as Client Admin. No card/bank data was entered (prohibited).

## 17. Bind Flow
**Unverified / Not exercised.**

## 18. Issue Policy Flow
**Unverified / Not exercised.**

## 19. Previous Policy Behaviour
Renewal record is linked to an Original Policy Number (001-00004-0000015-00 in test). Values appear inherited on load. Exact copy/reset/linkage logic is **Unverified**.

## 20. Documents Section
Rendered via `Documents_HB` / `CreateClientDocuments_HB` (step 5). Observed:
- **View / Preview:** Per-row eye icon renders the stored document inline as a base64 data-URI in a preview modal (Verified). The "Preview Quote" split-button option shows **"Feature InProgress"** (Verified).
- **Download:** Per-row download icon present; the "Download Quote" split-button option shows **"Feature InProgress"** (Verified).
- **Print:** No explicit Print control was found in the Documents section — **Not Found / Unverified**.
- **Share:** "Share Quote" split-button option shows **"Feature InProgress"**; the Client Documents **Share** button was disabled in the observed state. Email component behaviour (To/CC/BCC/From/attachment) is **Unverified** (not implemented/observable).
- **Upload (Attach Document modal):** Drag-drop or **Browse File**; supported formats Excel/PDF/Doc/JPG/JPEG/MP4; size range 10KB–10MB; document-type metadata via `DataActionGet_DocumentType` (in CreateClientDocuments_HB). Save/Close buttons present. Duplicate handling, storage location, and upload progress behaviour are **Unverified** (not exercised — uploading would change state).
- **Client Documents tab:** Lists a system document with view (eye) / download / delete icons; **Add** (upload) present; **Share** disabled.

## 21. Plumsail or Document Integration
No Plumsail evidence was observed in the renewal flow. Document view renders base64 inline; Download/Share/Preview Quote = "Feature InProgress". Any document-generation integration for the renewal flow is **Not Found / Unverified**.

## 22. Database Entity Mapping
**Unverified** (requires Service Studio). Grid/field binding names captured serve as a proxy. Observed data/screen actions (names only): `DataActionGetDetails`, `DataActionGetClientDocuments`, `DataActionGetHexCatStatus`, `DataActionGet_DocumentType`, `DataActionGetKey`, `DataActionGetClientMappingSecret`, `ActionCreateLog`, `ActionAESEncrypt`. Exact entities/columns and save mappings are Unverified.

## 23. Status and Stage Transition Matrix
Verified statuses (from summary cards): **Draft, Pending, Declined, Expired** (plus Total count). Observed record status: **Draft**. Bound / Issued / Converted / Payment states were **Not Found / Unverified** in this session. Transition triggers are Unverified.

## 24. Client / Server / Service Action Inventory
- **Screen/Client actions (observed):** `setRequestStatus` (listing View).
- **Data actions (observed):** `DataActionGetDetails`, `DataActionGetClientDocuments`, `DataActionGetHexCatStatus`, `DataActionGet_DocumentType`, `DataActionGetKey`, `DataActionGetClientMappingSecret`.
- **Server/common actions (observed):** `ActionCreateLog`, `ActionAESEncrypt` (IE_Common_CW).
- **Blocks:** PolicyInfo_HB_Optimized, HBISRiskInformation_Optimized, Homeowners_HB, QuoteReview_HB_Optimized, FinalizeQuote_HB, Documents_HB, CreateClientDocuments_HB.
Internal logic of these actions is **Unverified**.

## 25. Exception and Error Handling
Confirmed UI: **"Feature InProgress"** toast for Download/Share/Preview Quote. Missing/invalid-record handling on View, transaction rollback, and partial-save behaviour are **Unverified**.

## 26. Notifications and Messages
Confirmed: "Feature InProgress" toast; a Recent Activity / audit feed is populated (consistent with `ActionCreateLog` on View). Email notifications for renewal/documents are **Unverified**.

## 27. Persona-Specific Differences
- **Client Admin (Verified):** Listing Action cell shows only **View**; Edit/Delete links present in DOM but hidden.
- **Producer / Underwriter (Unverified):** Not exercised. UW Specific Change step and implied payment-before-bind gate suggest an underwriter gate; field/button/permission differences are Unverified.

## 28. Unverified or Missing Functionality
The following are explicitly **Unverified** (browser-inaccessible or not exercised to preserve read-only state): renewal generation mechanism & notice periods; renewal eligibility rules; exact DB entities/columns & save mappings; server-action/rating logic; Bind, Issue, and Payment flows; document-generation integration (Plumsail or other); exact validation messages/trigger points; Print control; Share email component behaviour; Producer/Underwriter persona differences; status transition triggers.

## 29. Dependencies and Referenced Modules
Policy (main eSpace); IE_Common_CW (AES/log); IE_Policy_CS (referenced); HBCommon blocks (PolicyInfo/Homeowners/QuoteReview/Documents/CreateClientDocuments); HBIS (Risk Information); HB_FinalizeQuote_WB; HB_FinalizeQuoteEndorsement_WB; GoogleAddressAutocompleteReact; InternationalTelephoneInputReactive; OutSystemsUI; HexCat integration.

## 30. Rebuild Acceptance Criteria
A rebuild is acceptance-complete when it: (1) starts from the Dashboard **View** button firing log→encrypt→HexCat→navigate; (2) reproduces the stepper Policy Info → Risk (Location/Risk Info/Plans Overview/UW Specific Change) → Quote Review → Finalize Quote → Documents; (3) reproduces prefill-from-original-policy and observed disabled/editable states per persona; (4) reproduces the Documents section (base64 inline view, per-row view/download/delete, Attach Document modal with the listed formats/sizes, and the "Feature InProgress" placeholders where applicable); (5) reproduces summary-card statuses (Draft/Pending/Declined/Expired); (6) reproduces Client Admin action visibility (View only). All **Unverified** items above must be confirmed against Service Studio before they are treated as final.

---

*Generated read-only from the running application. No application logic was modified, published, deployed, or deleted. Unverified items must be validated in Service Studio.*
