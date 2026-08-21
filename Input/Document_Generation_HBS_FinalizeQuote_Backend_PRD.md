# Document Generation – HBS Finalize Quote — Reverse-Engineering PRD

**Scope:** Document Generation functionality only, inside the `FinalizeQuote_HB` block (module `HB_FinalizeQuote_WB`), including every dependency the execution flow touches.

**Method:** Live inspection of the actual OutSystems application in Service Studio 11 (environment `damco-dev.outsystemsenterprise.com`, workspace `InsureEdge2.0`). No code was modified, published, or refactored. Every fact below was observed directly in Service Studio (Interface, Logic, Data tabs) unless explicitly marked **"Not Found"** or **"Assumption."**

---

## 1. Functional Overview

The Finalize Quote flow lets a producer/underwriter generate, review, and download the two documents that make up a bound quote's "Quote Proposal Package": the **Quote Proposal Declaration** and the **Underwriter Specific Change Endorsement**. Generation is delegated to **Plumsail** (a cloud document-automation/workflow service). The application starts an asynchronous Plumsail job per document, polls for completion, merges the two resulting PDFs into a single file ("Quote Proposal Package.pdf"), stores it against the policy, and streams it back to the browser as a download.

A second, reusable "Documents" grid block (`Documents_HB`, module `HBCommon`) is embedded in the same screen area and is intended to offer **Download / Share / Preview** actions per already-generated document row. As built today, **all three of those grid-row actions are stub placeholders** that only show an info toast ("Feature InProgress") — see §3 and §13 for details. The actual working "Generate & Download" capability lives in a **separate, local client action on the `FinalizeQuote_HB` screen itself**, triggered by a "Download" link/button on the screen (style class `icon-text-box`), not by the grid.

## 2. Architecture

```
HB_FinalizeQuote_WB (module)
 └─ FinalizeQuote_HB (block/screen)
     ├─ Documents_HB (block, from HBCommon) — document list grid + stub actions
     ├─ DownloadQuoteOnClick (local Client Action) — REAL generate+download flow
     │    ├─ SaveOnClick                                    [local]
     │    ├─ InitiateDocumentGeneration_QuoteProposalDec    [Server Action ref → IE_Policy_BL]
     │    │    └─ IE_Policy_BL.GenerationDocuments_QuoteProposalPackage
     │    │         ├─ IE_Policy_BL.GetPlumsailIds (aggregate on ProductDocument)
     │    │         ├─ IE_Policy_BL.GetJSON_QuoteProposalDec (builds merge JSON)
     │    │         ├─ IEDocumentGenerator.GenerateDoc (Service Action → Plumsail REST)
     │    │         ├─ IE_Policy_BL.GetPlumsailIds2 / GetJSON_UWSpecificChange
     │    │         └─ IEDocumentGenerator.GenerateDoc (2nd call, UW Changes doc)
     │    └─ GetandDownloadDocument [Server Action ref → IE_Policy_BL]
     │         ├─ IEDocumentGenerator.GetFileURL (poll loop, Sleep 2s × ≤20)
     │         ├─ IEDocumentGenerator.DownloadFile ×2 (binary fetch)
     │         ├─ MergePDF (merges the two binaries)
     │         └─ IE_Policy_CS.CreateUpdatePolicyDocument_HB → PolicyDocument entity
     └─ (Site Property) IEDocumentGenerator.PlumsailAPI = 
          "https://api.plumsail.com/api/v2/processes/jobs/"
```

Modules involved (all inspected directly):

| Module | Role | Original/Display name observed |
|---|---|---|
| `HB_FinalizeQuote_WB` | Owns `FinalizeQuote_HB` block/screen and the real `DownloadQuoteOnClick` client action | "HB_FinalizeQuote_WB" |
| `HBCommon` | Owns the reusable `Documents_HB` block (stub grid actions) | "HBCommon" |
| `IE_Policy_BL` | Business logic: document-generation orchestration actions, `GetandDownloadDocument`, Plumsail template lookup | Tab title "Policy (InsureEdge2.0 Policy)" |
| `IE_Policy_CS` | Client/Server actions consumed by screens; owns `CreateUpdatePolicyDocument_HB` and the `PolicyDocument` entity | "IE_Policy_CS (InsureEdge2.0 Policy Core)" |
| `IE_Policy_Lib` | Referenced library module (Policy core) | "InsureEdge2.0 Policy Core Application" |
| `IEDocumentGenerator` | Dedicated Plumsail integration module: `GenerateDoc`, `GetFileURL`, `DownloadFile` Service Actions, `PlumsailAPI` Site Property | "IEDocumentGenerator" |

## 3. UI Analysis

### 3.1 Documents_HB block (HBCommon) — embedded documents grid

Visible inside the Finalize Quote screen area. Widget tree (as inspected):

- **Table/Grid** bound to a documents list. Columns: `Expression` (Action/Link Text), `Document Type` (binding `DocumentType`), `Version` (binding `Version`), `Created On` (binding `CreatedOn`). An "Action" column (`Columns\ActionColumn`, `ElementsType = Entities.ElementType.Link`) renders per-row icon links.
- Per-row/menu actions rendered as `Tooltip > Link` widgets:
  - **Download Quote** — icon `↓`, `OnClick = DownloadQuoteOnClick` (local to `Documents_HB`)
  - **Share Quote** — icon (share arrow), `OnClick = ShareQuoteOnClick` (local to `Documents_HB`)
  - **Preview Quote** — icon (eye), `OnClick = PreviewQuoteOnClick` (local to `Documents_HB`)
- A second, adjacent popup/dropdown exposes **Close Quote**, **Decline Quote**, **Delete Quote** — these are quote-lifecycle actions, not document generation, and are out of scope for this PRD (noted for completeness only).
- Bottom action bar: **"Document"** button (opens the action dropdown) and **"Cancel"** button.
- Popups present in the block's widget tree: two generic `Popup` widgets, `CommonWidgets\DeletePopup` (from `IE_Common_CW`, args `IsShow`, `RowNumber`; handlers `DeletePopupKeepItEvent`, `DeletePopupDeleteEvent`), another `Popup`, and `ClosepopupNew`.
- Grid events present: `OnColumnPickerChange`, `OnFiltersChange`, `OnSortChange`. Filter bar shows "Applied Filter(s): ColumnName (SelectedFilterCount)" with a "Clear All" link — standard OutSystems Grid/Table widget filter chips.
- Block input parameters: `InsuredName`, `PolicyId` (both Text, In parameters). Local variables: `IsShowDeletePopup`, `ShowClosePopup` (Booleans). `Public = No` (block is only consumable within its own module scope as built, though it is embedded via the FinalizeQuote_HB screen's own module dependency).

**Critical finding:** All three grid-row document actions in `Documents_HB` (`DownloadQuoteOnClick`, `ShareQuoteOnClick`, `PreviewQuoteOnClick`) have an identical, trivial implementation:

```
Start → Message("Feature InProgress", Type=Info) → End
```

None of them call any server-side logic. They are **non-functional placeholders**. Clicking any of the three simply shows an info toast reading "Feature InProgress." This was verified by opening each action's flow individually in Service Studio.

### 3.2 FinalizeQuote_HB screen — real "Download" control

- The screen header area ("Finalize Quote" title, Summary panel with Coverage Premium / Taxes, Payment Plans panel with Payment Frequency / Responsible Party dropdowns) sits above the Documents_HB block.
- A `Link` widget (style class `icon-text-box`) with `OnClick = DownloadQuoteOnClick` exists **directly in `FinalizeQuote_HB`** (module `HB_FinalizeQuote_WB`) — this is a **different, fully-implemented action** from the same-named stub in `Documents_HB`. This is the actual "Generate & Download the Quote Proposal Package" trigger.
- No local, working `ShareOnClick`/`ShareQuoteOnClick` or `PreviewQuoteOnClick` exist directly on `FinalizeQuote_HB` — only `DownloadQuoteOnClick` was found as a local, screen-level action (confirmed via module-scoped search; zero results for the other two at this level).
- Loading/progress indicator: an `Assign` step named `LoadingDownload` toggles a loading/boolean flag before and after the generation call (used to drive a spinner/disabled state — exact widget binding not traced further; see Open Questions).
- Error notification: on failure, a `Message` widget (`Type = Error`) is shown with text bound to `InitiateDocumentGeneration_QuoteProposalDec.Message` (the error text returned by the orchestration Server Action).

### 3.3 Controls summary table

| Control | Location | Purpose | Bound Event | Status |
|---|---|---|---|---|
| Download Quote (grid) | Documents_HB | Intended per-document download | DownloadQuoteOnClick (stub) | **Not implemented** – shows "Feature InProgress" |
| Share Quote (grid) | Documents_HB | Intended per-document share | ShareQuoteOnClick (stub) | **Not implemented** |
| Preview Quote (grid) | Documents_HB | Intended per-document preview | PreviewQuoteOnClick (stub) | **Not implemented** |
| Document / Cancel buttons | Documents_HB | Opens/closes the row action dropdown | n/a | Functional (UI only) |
| Close/Decline/Delete Quote | Documents_HB | Quote lifecycle (out of scope) | Close/DeclineQuoteOnClick, DeletePopup* | Out of scope |
| **Download link (header)** | **FinalizeQuote_HB** | **Generates + downloads the merged Quote Proposal Package PDF** | **DownloadQuoteOnClick (real)** | **Functional** |

## 4. Client Actions

### 4.1 `DownloadQuoteOnClick` (Documents_HB, HBCommon) — stub
- Trigger: OnClick of "Download Quote" grid link.
- Logic: `Start → Message("Feature InProgress", Info) → End`. No parameters, no server calls, no navigation, no refresh.

### 4.2 `ShareQuoteOnClick` (Documents_HB, HBCommon) — stub
- Identical pattern to 4.1.

### 4.3 `PreviewQuoteOnClick` (Documents_HB, HBCommon) — stub
- Identical pattern to 4.1.

### 4.4 `DownloadQuoteOnClick` (FinalizeQuote_HB, HB_FinalizeQuote_WB) — real implementation

This is the actual Document Generation trigger. Full flow as observed:

1. **Start**
2. **SaveOnClick** (Run Server Action) — persists current screen edits (e.g., payment plan) before generating documents.
3. **GetPolicyDetails/PolicyPremiumInfo…** (Aggregate) — re-reads policy/premium data.
4. **Decision: `PaymentFrequency_Dropdown2.Valid?`**
   - True → Assign → **End** (stops; implies the UI requires a valid Payment Frequency selection before document generation can proceed — see Business Rules).
   - False → Assign → continues.
5. **LoadingDownload** (Assign) — sets a loading/in-progress flag.
6. **InitiateDocumentGeneration_QuoteProposalDec** (Run Server Action) → calls `IE_Policy_BL.Documents\GenerationDocuments_QuoteProposalPackage` with input `PolicyId2 = PolicyID`.
7. **Decision: `InitiateDocumentGeneration_QuoteProposalDec.Success?`**
   - **True** → **GetandDownloadDocument** (Run Server Action, from `IE_Policy_BL`) → `LoadingDownload` (Assign, clears flag) → **End**.
   - **False** → `LoadingDownload` (Assign, clears flag) → **Message** widget (`Type = Error`, `Message = InitiateDocumentGeneration_QuoteProposalDec.Message`) → (flow continues off-screen past the captured region; presumed End).

No explicit popup handling, no Ajax-Refresh call, and no client-side navigation were observed in this action; the file is expected to be delivered by the browser's native download of the binary response.

## 5. Server Actions

### 5.1 `GenerationDocuments_QuoteProposalPackage` (IE_Policy_BL)

Purpose: Orchestrates generation of **both** documents that make up the Quote Proposal Package (Quote Proposal Declaration + Underwriter Specific Change Endorsement) via Plumsail, and returns their Plumsail Job IDs.

Full flow:
1. Start
2. `GetUserClientID` (Run Server Action) — resolves the logged-in user's ClientID/tenant (comment on the wire: "Updated the check to check for client id as well as same quote number can exist for different clients").
3. `GetPolicyByPolicyId` (Aggregate).
4. Decision `GetPolicyByPolicyId.List.Empty?` → True: Assign → End (no policy found).
5. Assign `PolicyId`.
6. `GetPlumsailIds` (Aggregate) — see §5.4.
7. `GetJSON_QuoteProposalDec` (Run Server Action, `Documents\GetJSON_QuoteProposalDec`, input `PolicyId`) — builds the JSON merge-data payload for the Quote Proposal document.
8. `LogMessage` (Run Server Action) — logging checkpoint.
9. `GenerateDoc` (Run Server Action, wraps `IEDocumentGenerator.GenerateDoc`) with:
   - `JSON = GetJSON_QuoteProposalDec.JSON`
   - `ProcessId = GetPlumsailIds.List.Current.ProductDocument.PlumSailProcessId`
   - `UserId = GetPlumsailIds.List.Current.ProductDocument.PlumsailUserId`
10. Decision `GenerateDocJobId<>''?` → False: Assign → End; True: Assign (`QuoteProposalJobId = GenerateDoc.JobId`, `FileNameQuoteProposal = GetJSON_QuoteProposalDec.FileName`).
11. `GetPlumsailIds2` (Aggregate) — same pattern as step 6, for the second document.
12. `GetJSON_UWSpecificChange` (Run Server Action) — builds JSON merge data for the Underwriter Specific Change Endorsement doc.
13. `LogMessage2`.
14. `GenerateDoc2` (2nd call to `IEDocumentGenerator.GenerateDoc`), same parameter pattern.
15. Decision `GenerateDoc2JobId<>''?` → False: Assign → End; True: Assign (`UWChangesJobId = GenerateDoc2.JobId` — inferred name) → End.

Exception handling: an `AllExceptions` global handler → Assign → End is present at the action level (generic catch, no explicit rollback/retry logic observed beyond capturing the error into an output message).

Output parameters (inferred from assignments): `Success`, `Message`, `QuoteProposalJobId`, `UWChangesJobId` (exact output parameter list not fully enumerated — see Open Questions).

### 5.2 `GenerationDocuments_UnderwriterSpecificChangeEndor` (IE_Policy_BL)
Sibling action, listed alongside 5.1 in the same folder. **Not opened in detail** — presumed to generate only the Underwriter Specific Change Endorsement document in isolation (mirrors part of 5.1's logic). Not Found: full internal flow (out of the time-boxed trace; flagged as Open Question).

### 5.3 `GenerationDocuments_RenewalPolicyPackage`, `GenerationDocuments_QuoteProposalPackage2` (IE_Policy_BL)
Present in the same Documents/action group. **Not opened in detail** — out of scope (Renewal Policy, not Finalize Quote) or duplicate/alternate variant. Marked **Not Found** (not traced).

### 5.4 `GetPlumsailIds` / `GetPlumsailIds2` (Aggregates, IE_Policy_BL)

This is the **template selection mechanism**. Both aggregates query the `ProductDocument` entity:

- Source: `ProductDocument`
- Filters: `ProductDocument.ClientId = GetUserClientID.ClientIDBasedonTenant` **AND** `ProductDocument.Name = "QuoteProposalDeclarationPage"` (for `GetPlumsailIds`; `GetPlumsailIds2` uses the equivalent name for the UW Specific Change document — exact literal not captured, presumed `"UnderwriterSpecificChangeEndorsement"` or similar — **Not Found**, flagged as Open Question).
- Sorting: `ProductDocument.Name (ASC)`
- Max Records: 1

This returns exactly one `ProductDocument` row per (Client, DocumentName) combination, supplying `PlumSailProcessId` and `PlumsailUserId` for the `GenerateDoc` call. **This is how the Plumsail template/process is selected per tenant and per document type.**

### 5.5 `GetandDownloadDocument` (IE_Policy_BL)

Purpose: Polls both generation jobs to completion, downloads both binaries, merges them into a single PDF, persists the result as a policy document, and returns the binary for download.

Full flow:
1. Start
2. Decision `Trim(QuoteProposalJobId)<>''?` → False: Assign → End.
3. Loop (While-style, via repeated decision + back-edge): Decision `(Trim(FileUrlQuoteProposal)="" or Trim(FileUrlUWChanges)="") and Count<20`
   - **True branch:**
     - Decision `Trim(FileUrlQuoteProposal)=''?`
       - True → `Sleep` (2000 ms) → `GetFileURL` (Run Server Action → `IEDocumentGenerator.GetFileURL`, `JobId = QuoteProposalJobId`) → loop back.
       - False → `Count` (Assign, increments retry counter) → loop back.
     - Decision `Trim(FileUrlUWChanges)=''?`
       - True → `Sleep2` (Run Server Action Sleep) → `GetFileURL2` (2nd call to `IEDocumentGenerator.GetFileURL`, `JobId = UWChangesJobId` — inferred) → `Assign` → loop back.
       - False → `Assign` → loop back.
4. Exit loop → `LoadingDocumentDownload` (Assign) → `Message` (Assign) → Decision `FileUrlQuoteProposal<>"" and ...` 
   - False → Assign → End (generation failed/timed out).
   - True → `DownloadFile` (Run Server Action → `IEDocumentGenerator.DownloadFile`, `Path = FileUrlQuoteProposal`) → `DownloadFile2` (same, `Path = FileUrlUWChanges`) →
     - Decision `DownloadFile.BinaryFile<>NullBinaryData()?` → False: Assign → End; True: continue.
     - Decision `DownloadFile2.BinaryFile<>NullBinaryData()?` → False: Assign → End; True: continue.
     - `GetStaticDocumentScheldeuedOfInsurers` (Run Server Action) — **Not Found**: purpose not traced (likely appends a static "Schedule of Insurers" page/attachment; name suggests a fixed/boilerplate document merged into the package).
     - `GetStaticDocument` (Run Server Action) — **Not Found**: purpose not traced (likely retrieves another static/boilerplate document to merge).
     - `MergePDF` (Run Server Action) — merges the downloaded binaries (and any static documents) into one PDF. Output used downstream as `MergePDF.PDFFile`.
     - `CreatePolicyDocument_HB` (Run Server Action → `IE_Policy_CS.Documents\CreateUpdatePolicyDocument_HB`) with:
       - `PolicyId = TextToLongInteger(PolicyId)`
       - `FileName = "Quote Proposal Package.pdf"`
       - `FileType = "pdf"`
       - `BinaryFile = MergePDF.PDFFile`
       - `LoggedInUserId = GetUserId()`
       - `TransactionType`, `Version` — left blank in this call.
     - Decision `CreatePolicyDocument_HB.Success?` → False: End; True: `BinaryData` (Assign) → End.

**Business-rule constants observed:** poll interval = **2000 ms**; max poll attempts = **20** (≈40 seconds worst-case wait before giving up); two documents are always generated and merged together for the Quote Proposal Package.

### 5.6 `CreateUpdatePolicyDocument_HB` (IE_Policy_CS, folder `Document`)

Purpose (per its own description field): *"1. Created entry in policy document."*

Flow: `Start → CreateOrUpdatePolicyDocument (Entity CreateOrUpdate action) → Assign → End`, with `AllExceptions → Assign → End` handler.

Entity mapping (`PolicyDocument_Struct` → `PolicyDocument` entity):
- `Id = LongIntegerToIdentifier(Id)`
- `PolicyId`
- `ClientId`
- `BlobPath`
- `FileName`
- `FileType`
- `CreatedBy`
- (additional attributes — `CreatedOn`, `Updatedby`, `UpdatedOn` — exist on the entity; whether all are explicitly mapped in this action was not fully confirmed for every field.)

### 5.7 `GetJSON_QuoteProposalDec` / `GetJSON_UWSpecificChange` (IE_Policy_BL, folder `Documents`)

Purpose: Build the JSON merge-field payload sent to Plumsail for each document type, given `PolicyId`. **Internal field-by-field mapping not traced** (would require opening each action's full logic separately) — flagged as an Open Question / area for a follow-up deep-dive if exact merge-field-to-database mapping is required for template rebuild.

## 6. Service Actions (IEDocumentGenerator module)

This module is the sole point of contact with the Plumsail REST API. It exposes exactly three Service Actions (all under a "Service Actions" folder, meaning they are published for cross-module consumption) and no custom database entities.

### 6.1 `GenerateDoc`
- Inputs: `JSON` (Text — merge data), `ProcessId` (Text), `UserId` (Text).
- Logic (active flow only — a legacy/disabled parallel flow also exists on canvas, annotated "Let's talk on this - Manideep", and is not used):
  1. `HTTPPost2` (Run Server Action, `Action = HTTPPost`)
     - `URL = Site.PlumsailAPI + UserId + "/" + ProcessId + "/start"`
     - `Data = JSON`, `Content_Type = "application/json"`
     - `Headers`, `Username`, `Password` — all **empty** (no authentication header configured on this call, as observed).
  2. Cycle over `HTTPPost2.Response_Headers` → Decision `ToLower(HTTPPost2.Response_Headers.Current.HTTPHeader.Name) = "location"` (case-insensitive header-name match).
  3. On match → Assign `JobId = Replace(HTTPPost2.Response_Headers.Current.HTTPHeader.Value, "https://api.plumsail.com/api/v2/processes/jobs/", "")` → End.
  4. If no match after cycling all headers → End (JobId presumably remains empty).
- Output: `JobId` (Text).
- This implements Plumsail's asynchronous "start a process" pattern: POST kicks off the job, and the job identifier is extracted from the `Location` response header rather than the JSON body.

### 6.2 `GetFileURL`
- Input: `JobId` (Text).
- Logic: `HTTPGet` (`URL = Site.PlumsailAPI + JobId`, i.e. `GET https://api.plumsail.com/api/v2/processes/jobs/{JobId}`) → `JSONDeserializeStructure1` (deserializes `HTTPGet.Response` into structure `GetResponseText`) → Assign (`FilePath = JSONDeserializeStructure1.Data.Link`, `Success = HTTPGet.Status="OK"`, `Message = HTTPGet.Response`) → End.
- Exception handler: `AllExceptions` → Assign → End.
- Outputs: `FilePath`, `Success`, `Message`.
- This is the **job-status/poll endpoint**: returns `Data.Link` once Plumsail has finished generating the file.

### 6.3 `DownloadFile`
- Input: `Path` (Text — a file URL, typically the `FilePath` returned by `GetFileURL`).
- Logic: `HttpBinaryGet` (`URL = Path`) → Assign (`BinaryFile = HttpBinaryGet.Content`, `ContentType = HttpBinaryGet.ContentType`) → End.
- Outputs: `BinaryFile` (Binary Data), `ContentType` (Text).

### 6.4 Site Property: `PlumsailAPI`
- Data Type: Text.
- Default Value: `"https://api.plumsail.com/api/v2/processes/jobs/"`.
- Used as the base URL for both the job-start call (`GenerateDoc`) and the job-status call (`GetFileURL`).

### 6.5 Structures
- `GetResponseText` — deserialization target for Plumsail's JSON status response; contains at minimum a `Data.Link` field (file URL) based on observed usage.
- A structure named `ardoHTTP…` (truncated in tree; likely an HTTP response wrapper structure used internally by the `ardoHTTP` extension) — **Not Found**: full field list not inspected.

### 6.6 Integrations folder
Empty placeholders exist for "SOAP", "REST", "SAP" integration categories, but **no formal REST API Integration (consumer) was defined** for Plumsail — the module talks to Plumsail using raw `HTTPPost`/`HTTPGet`/`HttpBinaryGet` server actions instead of a generated REST consumer. This is a deliberate architecture choice to note for rebuild.

### 6.7 References (extensions) used by IEDocumentGenerator
- `ardoHTTP` (HTTP client extension providing `HTTPPost`, `HTTPGet`, `HttpBinaryGet` actions)
- `RichMail` (present as a reference; not observed to be used in the document-generation flow)
- A `ZIP` folder exists in the module tree (implying Zip-file capability is available) — **not observed to be invoked** by the traced Quote Proposal flow; may be used by another document type. Flagged as Open Question.

## 7. Business Rules

1. **Payment Frequency must be valid** before the "Download" action proceeds to generate documents (`PaymentFrequency_Dropdown2.Valid?` gate in `DownloadQuoteOnClick`).
2. **Screen state is saved first**: `SaveOnClick` runs before any document generation is attempted, ensuring generated documents reflect the latest edited values.
3. **Two documents are always generated together** for the Quote Proposal Package: the Quote Proposal Declaration and the Underwriter Specific Change Endorsement. If either individual `GenerateDoc` call fails to return a Job ID, that document's ID is not set and the corresponding poll loop iteration for it is skipped (but the overall flow does not appear to short-circuit the other document).
4. **Per-tenant / per-document template selection**: the Plumsail `ProcessId`/`UserId` (i.e., which Plumsail template/workflow to invoke) is looked up from the `ProductDocument` entity, filtered by `ClientId` (tenant) and a fixed document `Name` (e.g., `"QuoteProposalDeclarationPage"`). Max 1 record is expected/used.
5. **Polling/timeout rule**: the system polls Plumsail every **2 seconds**, up to **20 times** (~40 seconds), for each document's file URL. If the URL is still empty after 20 attempts, the loop exits and generation is treated as incomplete/failed.
6. **Merge rule**: once both file URLs are available and both binaries download successfully (non-null), the two PDFs are merged into a single file via `MergePDF`, plus static document(s) fetched via `GetStaticDocument`/`GetStaticDocumentScheldeuedOfInsurers` (exact merge order/composition not fully confirmed).
7. **Persistence rule**: the merged file is always named **`"Quote Proposal Package.pdf"`**, `FileType = "pdf"`, and is saved against the `PolicyDocument` entity keyed by `PolicyId`, with `ClientId`, `BlobPath`, `CreatedBy` also populated.
8. **Failure short-circuits**: if the policy cannot be found (`GetPolicyByPolicyId.List.Empty?` = True), if a `GenerateDoc` call returns no JobId, if a downloaded binary is null, or if `CreatePolicyDocument_HB` fails, the flow ends without producing/persisting a document, and (at the UI layer) an error message is displayed using the returned `Message`.
9. **Duplicate-generation prevention**: **Not Found** — no explicit "already generating" / duplicate-click guard (e.g., disabling the button, checking an in-progress flag before starting a new job) was observed in the traced flow beyond the `LoadingDownload` UI flag, whose actual effect on the button (disable vs. just a spinner) was not confirmed at the widget-property level.

## 8. Validation Rules

| Rule | Where enforced | Type |
|---|---|---|
| Payment Frequency dropdown must be valid | `DownloadQuoteOnClick` (FinalizeQuote_HB), client-side decision | Client-side gate |
| Policy must exist for the given PolicyId | `GenerationDocuments_QuoteProposalPackage`, `GetPolicyByPolicyId.List.Empty?` | Server-side |
| ProductDocument (Plumsail template mapping) must exist for ClientId + document Name | Implicit — `GetPlumsailIds`/`GetPlumsailIds2` aggregates (Max Records = 1); no explicit "not found" branch observed, meaning a missing mapping would likely produce empty `ProcessId`/`UserId` passed to Plumsail | Server-side (implicit) |
| Generated Job ID must be non-empty to proceed | `GenerateDocJobId<>''?` / `GenerateDoc2JobId<>''?` decisions | Server-side |
| Downloaded binaries must be non-null before merge | `DownloadFile(2).BinaryFile<>NullBinaryData()?` decisions | Server-side |
| Poll retry ceiling | `Count<20` in the polling decision | Server-side |

## 9. Database Mapping

### 9.1 `PolicyDocument` (owned by `IE_Policy_CS`)

| Attribute | Data Type | Notes |
|---|---|---|
| Id | Identifier (Long Integer underlying) | Primary Key |
| PolicyId | (per struct: mapped from `PolicyId`) | FK → Policy |
| ClientId | Long Integer | FK → Client/tenant |
| BlobPath | — | Storage path/reference for the binary |
| FileName | Text | e.g. `"Quote Proposal Package.pdf"` |
| FileType | Text | e.g. `"pdf"` |
| CreatedBy | — | User who generated the document |
| CreatedOn | DateTime | |
| UpdatedOn | DateTime | |
| Updatedby | — | |
| BinaryFile_Temp | Binary Data (Image original type), Not Mandatory | Temporary/staging binary attribute |

Operations observed: **Create/Update** via `CreateOrUpdatePolicyDocument` entity action (invoked by `CreateUpdatePolicyDocument_HB`). No explicit **Read** (list/detail) or **Delete** operation was traced in the Document Generation flow itself (Delete exists at the entity level per the earlier `DeletePolicyDocument` action seen in search results, but is used by the separate "Delete Quote/Document" lifecycle feature, out of this scope).

### 9.2 `ProductDocument` (owned by `InsureEdgeDB Extension`, consumed by `IE_Policy_BL`)

| Attribute | Data Type | Notes |
|---|---|---|
| Id | Long Integer | Primary Key |
| Name | Text | Document/template identifier, e.g. `"QuoteProposalDeclarationPage"` |
| ClientId | Long Integer | Tenant scoping |
| PlumSailProcessId | Text (per usage) | Plumsail Process ID (template selector) |
| PlumsailUserId | Text (per usage) | Plumsail "user"/tenant ID for the API path |
| CreatedBy | — | |
| CreatedOn | DateTime | |
| Updatedby | — | |
| UpdatedOn | DateTime | |
| ClientMappingId | Text(50) | Not mandatory |

Operations observed: **Read only** (via `GetPlumsailIds`/`GetPlumsailIds2` aggregates, filtered by `ClientId` + `Name`, `Max Records = 1`). Create/Update/Delete actions exist on this entity (`CreateOrUpdateProductDocument`, `CreateProductDocument`, `DeleteProductDocument`, `GetProductDocument`, `GetProductDocumentForUpdate`, `UpdateProductDocument`) but were **not exercised** by the Document Generation flow — they belong to template-configuration/administration, out of this scope.

### 9.3 No entities in IEDocumentGenerator
The `IEDocumentGenerator` module owns **no custom database entities**; it is a stateless integration wrapper around Plumsail's REST API plus two Structures (`GetResponseText`, an `ardoHTTP…` response structure).

## 10. Entity Relationship Summary

```
Policy (1) ──< PolicyDocument (many)          [PolicyDocument.PolicyId → Policy]
Client/Tenant (1) ──< PolicyDocument (many)   [PolicyDocument.ClientId → Client]
Client/Tenant (1) ──< ProductDocument (many)  [ProductDocument.ClientId → Client]
ProductDocument (1 per Client+Name) ──► Plumsail Process (external, via PlumSailProcessId/PlumsailUserId)
```

`ProductDocument` acts as the **template/configuration mapping table** connecting a tenant + logical document name to a specific Plumsail process; `PolicyDocument` is the **generated-artifact record** connecting a policy to a stored, generated file.

## 11. Plumsail Integration

- **Where called:** exclusively from `IEDocumentGenerator` module (`GenerateDoc`, `GetFileURL`, `DownloadFile` Service Actions). No other module makes direct Plumsail HTTP calls.
- **Which actions invoke it:** `IE_Policy_BL.GenerationDocuments_QuoteProposalPackage` (and sibling generation actions) call `GenerateDoc` (start job) and, via `GetandDownloadDocument`, `GetFileURL` (poll) and `DownloadFile` (fetch binary).
- **REST endpoints (base URL from Site Property `PlumsailAPI` = `https://api.plumsail.com/api/v2/processes/jobs/`):**
  - **Start job:** `POST {Site.PlumsailAPI}{UserId}/{ProcessId}/start` — Note this concatenates the *jobs/* base with `UserId`/`ProcessId`/`start`; body = merge-field JSON, `Content-Type: application/json`.
  - **Poll job status:** `GET {Site.PlumsailAPI}{JobId}` (i.e., `.../processes/jobs/{JobId}`).
  - **Download file:** `GET {FilePath}` where `FilePath` is the `Data.Link` value returned by the poll call (an absolute URL supplied by Plumsail, not necessarily on the same host).
- **Authentication:** **Not Found / no authentication header, username, or password was observed configured** on the `HTTPPost2`/`HTTPGet` calls (`Headers`, `Username`, `Password` fields were all empty in Service Studio). This strongly suggests either (a) authentication is embedded in the `UserId` path segment as Plumsail's own tenant-routing mechanism rather than a bearer/API-key header, or (b) credentials are configured elsewhere not discovered in this trace (e.g., at the Plumsail account/workflow level). **Flagged as an Open Question / security item.**
- **Job identification:** extracted from the `Location` HTTP response header of the start call (case-insensitive header name match `"location"`), with the known URL prefix stripped via `Replace(...)`.
- **Request payload:** JSON produced by `GetJSON_QuoteProposalDec` / `GetJSON_UWSpecificChange` (merge-field data); exact schema **Not Found** (not traced field-by-field).
- **Response payload:** the start call returns headers only (job accepted, 202-style pattern); the status call returns JSON deserialized into structure `GetResponseText`, containing at least `Data.Link`.
- **Template selection:** via `ProductDocument` entity lookup (see §5.4, §9.2).
- **Retry / timeout:** custom polling loop (2s interval, 20 attempts) implemented in application code (`GetandDownloadDocument`), not via any Plumsail SDK/webhook — this is a **client-driven polling pattern**, not a callback/webhook pattern.
- **Error handling:** `AllExceptions` catch blocks around `GetFileURL` and around the top-level generation orchestration action; failures surface via `Success`/`Message` output parameters propagated up to the UI's error `Message` widget.
- **File conversion / PDF vs DOCX:** the final artifact is always merged and stored as **PDF** (`FileType = "pdf"`, `MergePDF` action). **Not Found**: whether Plumsail is asked to render DOCX and convert, or renders PDF natively — the merge-field JSON/Plumsail process configuration itself was not opened.
- **Binary/file handling:** `HttpBinaryGet` → `BinaryFile` (Binary Data) → passed directly into `MergePDF` → passed directly into `CreateUpdatePolicyDocument_HB.BinaryFile`. No intermediate disk/temp-file storage was observed; everything stays in-memory as OutSystems Binary Data until persisted to the entity.

## 12. Template Processing

- **Template location:** hosted in Plumsail (external SaaS), referenced only by `PlumSailProcessId` + `PlumsailUserId`.
- **Template selection logic:** `ProductDocument` entity row matched on `ClientId` (tenant) + `Name` (fixed literal per document type, e.g. `"QuoteProposalDeclarationPage"`), `Max Records = 1`.
- **Template version:** **Not Found** — no version attribute observed on `ProductDocument` beyond audit columns (`CreatedOn`/`UpdatedOn`); no explicit template-version selection logic found.
- **Dynamic placeholders / merge fields:** populated via the JSON built by `GetJSON_QuoteProposalDec`/`GetJSON_UWSpecificChange`. **Not Found**: the exact placeholder-to-database-field mapping (would require opening those two actions' internal logic, not done in this pass).
- **Conditional sections, images, logos, tables:** **Not Found** — this logic (if any) lives inside the Plumsail template itself (external system), not in OutSystems code, and is therefore outside what Service Studio can reveal.
- **Attachments:** `GetStaticDocument` / `GetStaticDocumentScheldeuedOfInsurers` server actions suggest one or more fixed/boilerplate documents are appended to the package (e.g., a static "Schedule of Insurers" page) in addition to the two Plumsail-generated documents, then all merged via `MergePDF`. Exact composition/order **Not Found** (would require opening `MergePDF`'s parameter list in detail).

## 13. File Generation Flow

1. User clicks the **Download** link on the Finalize Quote screen (`FinalizeQuote_HB.DownloadQuoteOnClick`).
2. Screen state saved (`SaveOnClick`); Payment Frequency validated.
3. `InitiateDocumentGeneration_QuoteProposalDec` → `GenerationDocuments_QuoteProposalPackage`:
   a. Resolve tenant/client and policy.
   b. Look up Plumsail Process/User IDs for "Quote Proposal Declaration" template.
   c. Build merge JSON; call Plumsail `start` endpoint; capture `JobId` from `Location` header.
   d. Repeat b–c for "Underwriter Specific Change Endorsement" template.
4. On success, `GetandDownloadDocument`:
   a. Poll both job statuses every 2s (max 20 tries) until both file URLs are populated.
   b. Download both binaries (`HttpBinaryGet`).
   c. Fetch static document(s) (`GetStaticDocument`, `GetStaticDocumentScheldeuedOfInsurers`).
   d. Merge all into a single PDF (`MergePDF`).
   e. Persist as `PolicyDocument` (`FileName = "Quote Proposal Package.pdf"`, `FileType = "pdf"`).
   f. Return the binary (`BinaryData`) up the call stack.
5. UI clears the loading flag; on failure at any step, shows an Error message with the propagated `Message` text.

**File naming convention:** fixed string `"Quote Proposal Package.pdf"` (not dynamically named per policy/quote number in the traced path).

**Storage location:** persisted via the `PolicyDocument` entity's `BlobPath`/`BinaryFile_Temp` attributes (OutSystems-managed storage; exact physical storage — database BLOB vs. External Storage provider — **Not Found**, would require checking the entity's "Storage" advanced setting, not inspected in this pass).

## 14. Download Flow

- The merged PDF binary, once returned by `GetandDownloadDocument`, flows back to `DownloadQuoteOnClick` on the screen.
- **Not Found:** the exact mechanism by which the binary is delivered to the browser (e.g., a `Download` widget/URL vs. a client-side `Ajax` binary handler) was not traced past the `End` node of the client action in the time available — this is the single biggest gap in the trace and is called out explicitly in Open Questions. Given the block/entity design (BinaryFile assigned all the way through), the most likely mechanism is an OutSystems download URL built from the newly created `PolicyDocument` record (e.g., via a standard "Download File" pattern), but this was **not directly confirmed** on-screen.

## 15. Error Handling

| Scenario | Handling observed |
|---|---|
| Policy not found | `GenerationDocuments_QuoteProposalPackage`: `GetPolicyByPolicyId.List.Empty?` → early End (no explicit error message assignment seen on this branch — **Not Found** whether a message is set) |
| Plumsail start call fails / returns no Job ID | `GenerateDocJobId<>''?` False branch → Assign → End |
| Plumsail poll never completes (timeout) | Loop exits after `Count>=20`; downstream decision `FileUrlQuoteProposal<>"" and ...` False → Assign → End |
| Downloaded binary is null | `DownloadFile(2).BinaryFile<>NullBinaryData()?` False → Assign → End |
| `CreatePolicyDocument_HB` fails | `CreatePolicyDocument_HB.Success?` False → End |
| Any unhandled exception in `GenerationDocuments_QuoteProposalPackage` | `AllExceptions` global handler → `LogMessage3` → Assign → End |
| Any unhandled exception in `GetFileURL` | `AllExceptions` → Assign (sets `Success=False`/`Message`) → End |
| Any unhandled exception in `CreateUpdatePolicyDocument_HB` | `AllExceptions` → Assign → End |
| UI-level failure | `FinalizeQuote_HB.DownloadQuoteOnClick`: `InitiateDocumentGeneration_QuoteProposalDec.Success?` False → Error `Message` widget shown with `InitiateDocumentGeneration_QuoteProposalDec.Message` |

**Not Found:** specific user-facing copy for each failure branch beyond the generic propagated `Message`; whether failures are surfaced for the *download/merge* stage (`GetandDownloadDocument`) the same way as the *generation* stage (only the generation-stage error message binding was confirmed on the UI).

## 16. Logging & Audit

- `LogMessage`, `LogMessage2`, `LogMessage3` (Run Server Action nodes) appear at checkpoints inside `GenerationDocuments_QuoteProposalPackage` (before/after each `GenerateDoc` call, and in the exception handler). **Not Found:** the target of these log calls (Application logs / a custom log entity / OutSystems `ScreenLog`/`ServerLog`) — the action's internal definition was not opened.
- `PolicyDocument` entity carries `CreatedBy`/`CreatedOn`/`Updatedby`/`UpdatedOn` audit columns, providing a basic audit trail of who generated/updated each document and when.
- **No explicit correlation ID / tracking ID** distinct from the Plumsail `JobId` itself was observed being persisted or logged for cross-system traceability beyond the `JobId` used transiently in-memory during polling.
- **Not Found:** any dedicated "Document Generation Log" or "Audit Trail" entity specific to this feature.

## 17. Security

- **Role/permission checks:** **Not Found** in the traced client/server actions — no explicit role-check (`CheckRole`/`CheckPermission`) node was observed inside `DownloadQuoteOnClick`, `GenerationDocuments_QuoteProposalPackage`, or `GetandDownloadDocument`. Screen-level/menu-level security (if any) would be configured on the screen's role settings, not inspected in this pass.
- **Authentication to Plumsail:** as noted in §11, no credentials (headers/username/password) were observed on the outbound HTTP calls — flagged as a potential gap or an intentionally externally-managed auth scheme.
- **Tenant isolation:** enforced via `ClientId` filtering in both the `ProductDocument` lookup (template selection) and the `PolicyDocument` write (`ClientId` attribute), keyed off `GetUserClientID`/`GetUserClientID.ClientIDBasedonTenant`.
- **LoggedInUserId:** captured via `GetUserId()` and stored on the `PolicyDocument` record via the `LoggedInUserId` parameter of `CreateUpdatePolicyDocument_HB`.
- **File access security / download authorization:** **Not Found** — no explicit check-before-download (e.g., verifying the requesting user's ClientId matches the `PolicyDocument.ClientId`) was observed in the traced download path, though this may be enforced by a lower-level, unopened action.

## 18. Dependencies

**Entities:** `PolicyDocument` (IE_Policy_CS), `ProductDocument` (InsureEdgeDB Extension, consumed by IE_Policy_BL).

**Structures:** `PolicyDocument_Struct`, `GetResponseText`, `ardoHTTP…` (response wrapper, exact name truncated).

**Site Properties:** `PlumsailAPI` (IEDocumentGenerator, Text, default `https://api.plumsail.com/api/v2/processes/jobs/`).

**Modules:** `HB_FinalizeQuote_WB`, `HBCommon`, `IE_Policy_BL`, `IE_Policy_CS`, `IE_Policy_Lib`, `IEDocumentGenerator`, `IE_Common_BL`, `IE_Common_CS`, `IE_Common_CW` (referenced; `CommonWidgets\DeletePopup` used by Documents_HB), `HTTPRequestHandler` (referenced by FinalizeQuote_HB — purpose not traced).

**External services:** Plumsail (`api.plumsail.com`, REST v2 Processes/Jobs API).

**Extensions:** `ardoHTTP` (HTTP client extension used by IEDocumentGenerator for `HTTPPost`/`HTTPGet`/`HttpBinaryGet`).

**Resources/Templates:** Plumsail-hosted templates, referenced indirectly via `ProductDocument.PlumSailProcessId`/`PlumsailUserId` — no template files exist inside the OutSystems application itself.

## 19. End-to-End Execution Flow

```
User opens Finalize Quote screen (FinalizeQuote_HB)
↓
User edits Payment Plan (Payment Frequency / Responsible Party) [optional]
↓
User clicks "Download" (icon-text-box Link, OnClick=DownloadQuoteOnClick — real, screen-level action)
↓
SaveOnClick (persists edits)
↓
GetPolicyDetails/PolicyPremiumInfo (aggregate re-read)
↓
Validate Payment Frequency dropdown → if invalid, stop
↓
LoadingDownload = true (UI loading indicator)
↓
InitiateDocumentGeneration_QuoteProposalDec → GenerationDocuments_QuoteProposalPackage (IE_Policy_BL)
   ↓ resolve ClientId, load Policy
   ↓ GetPlumsailIds (ProductDocument lookup: ClientId + "QuoteProposalDeclarationPage")
   ↓ GetJSON_QuoteProposalDec (build merge JSON)
   ↓ IEDocumentGenerator.GenerateDoc → Plumsail POST .../start → JobId (from Location header)
   ↓ GetPlumsailIds2 (ProductDocument lookup, 2nd document)
   ↓ GetJSON_UWSpecificChange (build merge JSON)
   ↓ IEDocumentGenerator.GenerateDoc (2nd call) → Plumsail POST .../start → JobId
↓ (Success?)
GetandDownloadDocument (IE_Policy_BL)
   ↓ Poll loop: IEDocumentGenerator.GetFileURL (GET .../jobs/{JobId}) every 2s, up to 20x, for both jobs
   ↓ Once both FileUrl* populated: IEDocumentGenerator.DownloadFile ×2 (HttpBinaryGet)
   ↓ GetStaticDocument / GetStaticDocumentScheldeuedOfInsurers (static attachments)
   ↓ MergePDF (combine into one PDF)
   ↓ CreateUpdatePolicyDocument_HB (IE_Policy_CS) → INSERT/UPDATE PolicyDocument
   ↓ Return BinaryData
↓
LoadingDownload = false
↓
(Success) Binary delivered to browser  |  (Failure) Error Message widget shown with propagated Message
```

## 20. Sequence Diagram

```
User          FinalizeQuote_HB        IE_Policy_BL              IEDocumentGenerator        Plumsail API           IE_Policy_CS        DB
 |  click Download  |                        |                          |                        |                     |             |
 |------------------>| SaveOnClick            |                          |                        |                     |             |
 |                   |----------------------->|                          |                        |                     |             |
 |                   | GenerationDocuments_QuoteProposalPackage           |                        |                     |             |
 |                   |----------------------->| GetPlumsailIds (ProductDocument)                    |                     |             |
 |                   |                        |------------------------------------------------------------------------->|             |
 |                   |                        |<-------------------------------------------------------------------------|             |
 |                   |                        | GenerateDoc(JSON,ProcessId,UserId)                  |                     |             |
 |                   |                        |------------------------>| POST {UserId}/{ProcessId}/start                |             |
 |                   |                        |                          |----------------------->|                     |             |
 |                   |                        |                          |<--- 202 + Location -----|                     |             |
 |                   |                        |<-------- JobId ----------|                          |                    |             |
 |                   |                        | (repeat for 2nd document)                            |                    |             |
 |                   |<---- Success/JobIds ---|                          |                          |                    |             |
 |                   | GetandDownloadDocument |                          |                          |                    |             |
 |                   |----------------------->| loop: GetFileURL(JobId)  |                          |                    |             |
 |                   |                        |------------------------>| GET .../jobs/{JobId}      |                    |             |
 |                   |                        |                          |----------------------->  |                    |             |
 |                   |                        |                          |<---- {Data.Link} --------|                    |             |
 |                   |                        |<------ FilePath ---------|                          |                    |             |
 |                   |                        | (Sleep 2s, retry up to 20x per doc)                  |                    |             |
 |                   |                        | DownloadFile(Path) x2    |                          |                    |             |
 |                   |                        |------------------------>| GET {Path}                |                   |             |
 |                   |                        |                          |----------------------->  |                    |             |
 |                   |                        |                          |<---- binary content -----|                    |             |
 |                   |                        |<---- BinaryFile ---------|                          |                    |             |
 |                   |                        | MergePDF(binaries)       |                          |                    |             |
 |                   |                        | CreateUpdatePolicyDocument_HB(BinaryFile, FileName, PolicyId, ClientId)   |             |
 |                   |                        |------------------------------------------------------------------------->|             |
 |                   |                        |                          |                          |                    | Create/Update|
 |                   |                        |                          |                          |                    |------------->|
 |                   |                        |<----------------------------------------- Success ---|--------------------|             |
 |                   |<---- BinaryData -------|                          |                          |                    |             |
 |  file downloaded  |                        |                          |                          |                    |             |
 |<------------------|                        |                          |                          |                    |             |
```

## 21. Rebuild Guide

**Components required:**
- A screen/block (`FinalizeQuote_HB`) with a header action control (link/button) wired to a client action equivalent to `DownloadQuoteOnClick`, plus (optionally, and left as a real to-do) working versions of Share/Preview if those are actually required by the business — today's `Documents_HB` grid stubs must be treated as **unimplemented, not a spec to copy**.
- A document-generation orchestration Server Action (per document package type) equivalent to `GenerationDocuments_QuoteProposalPackage`, taking `PolicyId`, resolving tenant/client, looking up Plumsail template IDs, building merge JSON, and calling the Plumsail integration module twice (once per document in the package).
- A dedicated Plumsail integration module (equivalent to `IEDocumentGenerator`) exposing three primitives: **start job**, **poll job status**, **download binary**, all as Service Actions, backed by a Site Property for the Plumsail base URL.
- A polling/merge/persist orchestration action (`GetandDownloadDocument` equivalent): bounded retry loop (interval + max attempts as configurable constants, not hard-coded, for a clean rebuild), binary download, PDF merge, and entity persistence.
- A `PolicyDocument`-equivalent entity to store generated artifacts, and a `ProductDocument`-equivalent entity to store per-tenant Plumsail template mappings.

**Modules required:** one module for the screen/UI, one shared "Documents" UI block (if the grid is to be kept), one Policy business-logic module (orchestration), one Policy client/server module (entity CRUD), one dedicated Plumsail-integration module.

**Actions required:** see §§4–6 in full; at minimum: `DownloadQuoteOnClick` (real), `GenerationDocuments_QuoteProposalPackage`, `GetPlumsailIds`, `GetJSON_QuoteProposalDec`, `GenerateDoc`, `GetFileURL`, `DownloadFile`, `GetandDownloadDocument`, `MergePDF`, `CreateUpdatePolicyDocument_HB`.

**APIs required:** Plumsail Documents/Processes REST API v2 (`/api/v2/processes/{userId}/{processId}/start` to start, `/api/v2/processes/jobs/{jobId}` to poll status; note the exact URL concatenation pattern observed uses the *jobs* base URL for both, relying on string concatenation rather than two distinct configured endpoints — a rebuild should likely use two clean, separate Site Properties/endpoints instead of reusing one string for both purposes).

**Database objects required:** `PolicyDocument` (Id, PolicyId, ClientId, BlobPath, FileName, FileType, CreatedBy, CreatedOn, UpdatedOn, Updatedby, BinaryFile_Temp) and `ProductDocument` (Id, Name, ClientId, PlumSailProcessId, PlumsailUserId, ClientMappingId, audit columns).

**Templates required:** two Plumsail templates/processes per tenant — one for "Quote Proposal Declaration," one for "Underwriter Specific Change Endorsement" — registered as rows in `ProductDocument` per client.

**Configuration required:** `PlumsailAPI` Site Property (base URL); Plumsail authentication (currently **not found configured** — must be explicitly designed for a rebuild, since the observed implementation sends no auth header); poll interval and max-retry constants (currently hard-coded to 2000 ms / 20 tries).

**Dependencies required:** an HTTP client extension equivalent to `ardoHTTP` (or native OutSystems HTTP actions), a PDF-merge capability (`MergePDF`), and standard OutSystems entity CRUD generation.

## 22. Test Scenarios

1. Click Download with a valid Payment Frequency and a policy that has a matching `ProductDocument` mapping for both document types → expect both Plumsail jobs to start, both to complete within 20 polls, merged PDF persisted, file delivered.
2. Click Download with an **invalid** Payment Frequency → expect the flow to stop before any Plumsail call (client-side gate).
3. Click Download for a `PolicyId` with **no** matching `ProductDocument` row for the tenant → expect `GenerateDoc` to be called with empty/invalid `ProcessId`/`UserId`; verify actual Plumsail/error behavior (likely an HTTP error, not explicitly branch-handled in the traced logic).
4. Simulate Plumsail responding but never completing the job (status never returns `Data.Link`) → expect the poll loop to exhaust at `Count=20` and the flow to end without a downloaded file, surfacing whatever the `False` branch does (verify whether a user-facing error is shown here — flagged as unclear in §15).
5. Simulate one of the two `DownloadFile` calls returning a null binary → expect early End with no merge/persist and no output file.
6. Simulate `CreateUpdatePolicyDocument_HB` failing (e.g., DB constraint) → expect End with `Success=False`, no file delivered, and (per §15 gap) unclear whether the UI actually surfaces this specific failure.
7. Click the "Download Quote" / "Share Quote" / "Preview Quote" links inside the `Documents_HB` grid → expect only an info toast "Feature InProgress," confirming they remain unimplemented as documented.
8. Generate documents twice in quick succession for the same policy (double-click) → verify whether duplicate Plumsail jobs are started and whether the `PolicyDocument` record is updated (versioned) or duplicated (Not Found — no explicit duplicate-prevention logic was observed; recommend testing this directly against the live app).
9. Multi-tenant test: verify a `ProductDocument` mapping scoped to Client A is not used for a policy belonging to Client B.

## 23. Assumptions

- `GetPlumsailIds2`'s `ProductDocument.Name` filter literal for the Underwriter Specific Change Endorsement document was not directly read on-screen (only `GetPlumsailIds`'s `"QuoteProposalDeclarationPage"` was); it is assumed to be an analogous, differently-named literal for the second document type.
- `GenerateDoc2JobId`/`UWChangesJobId` variable names are inferred by symmetry with the confirmed `GenerateDocJobId`/`QuoteProposalJobId` pattern; exact spelling not screenshotted for the second document's variables.
- The `LoadingDownload` Assign nodes are assumed to toggle a UI-facing boolean bound to a loading indicator/button-disable state; the exact widget property binding was not traced.
- The final binary delivery mechanism to the browser (§14) is assumed to follow a standard OutSystems "download the just-created file" pattern, but was not directly confirmed.

## 24. Open Questions

1. **How is the merged PDF actually delivered to the browser** after `DownloadQuoteOnClick` receives the `BinaryData`? (No Download widget/URL construction was captured in the traced screenshots — this is the most important gap to close before a 1:1 rebuild.)
2. What is the exact `ProductDocument.Name` filter literal used by `GetPlumsailIds2` for the second document?
3. What is the full field-by-field merge-JSON schema built by `GetJSON_QuoteProposalDec` / `GetJSON_UWSpecificChange`?
4. What do `GetStaticDocument` and `GetStaticDocumentScheldeuedOfInsurers` actually retrieve, and how are they merged relative to the two Plumsail-generated documents in `MergePDF`?
5. Where/how is Plumsail authentication actually enforced, given no headers/credentials were observed on the outbound calls?
6. What do `LogMessage`/`LogMessage2`/`LogMessage3` write to (Application log, custom entity, or elsewhere)?
7. Is there any duplicate-generation guard beyond the UI loading flag (e.g., server-side lock/check for an already-in-flight job for the same PolicyId)?
8. What exactly happens on the timeout/failure path inside `GetandDownloadDocument` from a **user-facing** perspective — is an error surfaced to the screen, or does the UI simply stop with no file and no message?
9. What are the complete output parameter lists of `GenerationDocuments_QuoteProposalPackage` and `GetandDownloadDocument` (only the assignments actually observed on-canvas were captured; formal signatures were not opened)?
10. Role/permission model for who is allowed to trigger generation or download the resulting file — **Not Found** in this trace; likely governed by screen-level role security not inspected here.
11. Purpose of the `HTTPRequestHandler` reference on `FinalizeQuote_HB` — not investigated in this pass.
12. Purpose of the `ZIP` folder/capability present in `IEDocumentGenerator` — not observed to be invoked by this particular flow; may support a different document/download path (e.g., bulk document ZIP download) not covered here.

---

*Everything in this document reflects what was directly observed in Service Studio on 2026-07-07 against the `damco-dev.outsystemsenterprise.com` environment. No source was modified. Items explicitly marked "Not Found" indicate logic that exists but was not opened/traced in this pass, not logic confirmed to be absent — a follow-up session targeting the Open Questions list would close the remaining gaps.*
