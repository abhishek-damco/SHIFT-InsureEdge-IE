# Policy Module – Bulk Upload Backend Reverse Engineering

**Type:** Technical Backend Reverse-Engineering Document (PRD-style)
**Scope:** Backend flow of the Bulk Upload functionality on the Policy Module `LandingPage` screen only.
**Method:** Live inspection of OutSystems Service Studio (read-only) — no code changes, no publish, no entity/dependency changes were made.
**Environment inspected:** `damco-dev.outsystemsenterprise.com`, modules `Policy` (InsureEdge2.0 Policy), `IE_Policy_CS`, `IE_Policy_BL`, `IE_Policy_Lib`.

---

## 1. Executive Summary

The Bulk Upload feature on the Policy Module `LandingPage` lets a user download an Excel template, fill it in, and upload it back to create multiple business submissions (Homeowners/HB quotes) in one operation. The backend is split across four modules:

- **Policy** (Reactive Web module) — hosts the `LandingPage` screen, the popup UI, the client-side orchestration actions, and two "glue" server actions (`FormatBulkUploadExcel`, `SaveBulkUploadDump`) that parse the uploaded Excel file and stage it.
- **IE_Policy_Lib** — hosts the static Excel template resource and the `DownloadBusinessSubmissionsTemplate` server action used by "Download Template".
- **IE_Policy_CS** (Core Service) — hosts thin CRUD wrapper actions for the staging entities (`CreateUpdateBulkUploadAudit`, etc.).
- **IE_Policy_BL** (Business Logic) — hosts the real processing pipeline: `Execute_BulkUpload`, the `BulkUploadQuotes` BPT (asynchronous) process, `BulkUpload_Quotes_HB`, and `BulkUploadBusinessSubmissions` (the row-level submission/quote creation logic).

Two staging database entities — `BulkUploadAudit` (one row per upload batch/job) and `BulkUploadDump` (one row per Excel data row, with the row content stored as JSON in a `ColJSON` attribute) — sit between the raw upload and the final Policy/Quote records. Processing is **asynchronous**: the upload request creates the audit/dump rows synchronously, then hands off to a BPT (Business Process Technology) process that loops until all pending rows for that batch are processed.

---

## 2. Scope and Exclusions

**In scope:** Download Template, Upload File, Excel parsing, staging (`BulkUploadAudit`/`BulkUploadDump`), row-to-entity processing/creation, status lifecycle, error handling, and all cross-module dependencies these flows touch.

**Out of scope (explicitly not documented):** search, filters, grid refresh, pagination, KPI widgets, and the manual "New Submission" flow on `LandingPage` — these were not touched because they are not part of the Bulk Upload trigger chain.

**Not changed:** No entities, actions, dependencies, or UI were modified. No module was published. This is a read-only trace.

---

## 3. Starting Screen / Action Path

- **Module:** `Policy` (InsureEdge2.0 Policy), Reactive Web app.
- **Screen:** `MainFlow\LandingPage`.
- **Entry trigger:** A Button widget (internal Service Studio name `OK`, visible caption not confirmed from tree alone) with `OnClick = BulkUploadOnClick`, which sets screen variable `IsBulkUploadPopup = True` and opens the Bulk Upload popup.
- **Popup contents (relevant widgets):**
  - A reusable **Block** `BulkUpload\BulkUpload` embedded in `LandingPage`, whose upload/file-selection handler is wired to client action `BulkUploadUpload`.
  - A "Download Template" trigger wired to client action `BulkUploadDownloadTemplate`.
  - A "Proceed"/submit trigger wired to client action `BulkUploadProceed` (logic not fully traced — see Open Questions).
  - Cancel/close wired to `BulkUploadCancel` / `CloseBulkUpload_PopupOnClick`.
  - An error-file download trigger wired to `DownloadBulkUploadErrorFile`.

- **Relevant screen variables:** `IsBulkUploadPopup`, `IsLoadingBulk`, `BinaryDataHB`, `FileNameHB`, `Message`, `AuditId2`, `DownloadData`, `PolicyId`, `IsProceedingCompleted`.
- **Relevant screen aggregates:** `GetUploadFileAuditDetails` (drives batch/status display and returns a `PendingSum` field used to compute `IsLoadingBulk`), `GetErrorFile`.

---

## 4. Complete Backend Flow Diagram (Text Form)

```
LandingPage (Policy module)
 │
 ├─ [Button OnClick] BulkUploadOnClick (client action)
 │     ├─ Refresh aggregate: GetUploadFileAuditDetails
 │     ├─ Assign: IsBulkUploadPopup = True
 │     ├─ Assign: IsLoadingBulk = GetUploadFileAuditDetails.List.Current.PendingSum > 0
 │     └─ RefreshOnClick (client action)
 │
 ├─ [Download Template click] BulkUploadDownloadTemplate (client action)
 │     └─ Run Server Action: DownloadBusinessSubmissionsTemplate  (module: IE_Policy_Lib)
 │           └─ Assign: File = Resources.ESHomeownersInsuranceProductUploadTemplate.Content
 │     └─ Download (client-side): FileContent = File, FileName = "E&S Homeowners Insurance Products Upload Template.xlsx"
 │
 ├─ [File selected in Block "BulkUpload\BulkUpload"] BulkUploadUpload (client action)
 │     └─ Assign: FileNameHB = FileName   (BinaryData input captured as BinaryDataHB via widget binding)
 │
 ├─ [Proceed click] BulkUploadProceed (client action)  — NOT FULLY TRACED (see Open Questions)
 │     └─ (expected) Run Server Action: SaveBulkUploadDump
 │
 └─ SaveBulkUploadDump (server action, module: Policy)
       Start
        │
        ├─ Run Server Action: FormatBulkUploadExcel (module: Policy)
        │     Workbook_Open → Worksheet_Select → Row_Delete → Row_Delete2
        │     → Workbook_GetBinaryData → Workbook_Close → Assign ExcelOut
        │     (Advanced_Excel extension; deletes the first 2 template rows before processing)
        │
        ├─ ExcelToRecordList1 = Excel_ToRecordList(ExcelOut)   (Advanced_Excel extension)
        │     — converts worksheet rows into a structured Record List
        │
        ├─ GetUserClientID (aggregate)
        ├─ CreateBulkUploadAudit  → inserts 1 row into BulkUploadAudit (the batch/job header)
        │
        ├─ FOR EACH record in ExcelToRecordList1.List:
        │     ├─ ColumnJSONSerialized (serializes the row record to JSON)
        │     └─ CreateUpdateBulkUploadAuditDump → inserts 1 row into BulkUploadDump
        │          (BulkUploadAuditId = batch id, RowNumber, ColJSON = serialized row, Status = 'InProcess'/initial)
        │
        ├─ Execute_BulkUpload (server action, module: IE_Policy_BL)
        │     ├─ LaunchBulkUploadQuotes → Launches BPT Process "BulkUploadQuotes" (async, module: IE_Policy_BL)
        │     └─ UpdateBulkUploadAuditProcessID (server action, IE_Policy_BL) — stores the launched process id on BulkUploadAudit
        │
        End (synchronous part of the request finishes here — user gets control back; processing continues asynchronously)


ASYNCHRONOUS PART — BPT Process "BulkUploadQuotes" (module: IE_Policy_BL, folder BulkUpload)
 Start (input: AuditId)
  │
  └─ Loop: BulkUploadAutomaticActivity ⇄ Decision2 (loops while there is work; exits when done)
        │
        BulkUploadAutomaticActivity internal flow:
          Start
           ├─ GetBulkUploadAuditById (aggregate)
           ├─ BulkUpload_Quotes_HB (server action, module: IE_Policy_BL)
           │     ├─ Decision: Site Property "BulkUploadTimerEnable?" (kill-switch)
           │     ├─ GetBulkUploadFiles (aggregate — pending BulkUploadAudit batches)
           │     ├─ Decision: GetBulkUploadFilesListEmpty?
           │     ├─ Loop over files: CreateUpdateBulkUploadAudit, GetBulkUploadFilesListCurrent…Remove (list pop pattern)
           │     └─ (row-level submission creation — see §9, not fully confirmed to directly call
           │         BulkUploadBusinessSubmissions from inside this loop)
           ├─ Assign: RemainingRecords
           └─ End
          Exception path (AllExceptions):
           └─ SQL1 (raw SQL, module: IE_Policy_BL):
                 UPDATE {BulkUploadDump}
                 SET IsProcessed = 1, Status = 'Failed'
                 WHERE BulkUploadAuditId = @AuditId AND Status = 'InProcess '
              → End
  │
  End
```

---

## 5. Download Template Flow

| Step | Trigger/Action | Module | Type | Input | Output | Purpose |
|---|---|---|---|---|---|---|
| 1 | Click "Download Template" | Policy\LandingPage | Client Action (`BulkUploadDownloadTemplate`) | — | — | Entry point for template download |
| 2 | `DownloadBusinessSubmissionsTemplate` | IE_Policy_Lib | Server Action (Public = Yes) | none | `File` (Binary Data) | Retrieves the static template file content |
| 3 | Assign node inside step 2 | IE_Policy_Lib | Assign | `Resources.ESHomeownersInsuranceProductUploadTemplate.Content` | `File` | Reads static resource binary into output parameter |
| 4 | `Download` client-side node | Policy\LandingPage | Client-side Download | `FileContent = File`, `FileName = "E&S Homeowners Insurance Products Upload Template.xlsx"` | Browser file download | Triggers the actual browser download |

**Static resource:** `ESHomeownersInsuranceProductUploadTemplate`, located in `IE_Policy_Lib\Resources\ExcelTemplates`, display name "E&S Homeowners Insurance Product Upload Template", ~1.2 MB. A second, similarly named resource ("…Template_O…", likely an older/unused version) also exists in the same folder but was not referenced by the traced action.

**Validations before download:** None found. No role/permission check, no file-existence check — the action unconditionally returns the static resource's `Content`.

**MIME type:** Not explicitly set in the traced flow (no `ContentType` assignment observed on the Download node); the `.xlsx` extension is set purely via the `FileName` string.

**Conversion:** None — the file is a pre-built `.xlsx` static resource, not generated at runtime.

---

## 6. Upload File Flow

| Step | Trigger/Action | Module | Type | Input | Output | Purpose |
|---|---|---|---|---|---|---|
| 1 | User selects file in Block `BulkUpload\BulkUpload` | Policy\LandingPage | Reusable Block (Upload widget inside) | User-selected file | — | UI file picker |
| 2 | `BulkUploadUpload` | Policy\LandingPage | Client Action (Block handler) | `BinaryData`, `FileName` | screen var `FileNameHB` (assigned); `BinaryDataHB` populated via widget binding | Captures uploaded file into screen state |
| 3 | (assumed) `BulkUploadProceed` | Policy\LandingPage | Client Action | `BinaryDataHB`, `FileNameHB` | — | Triggers server-side processing — **exact logic not confirmed**, see §12 |
| 4 | `SaveBulkUploadDump` | Policy | Server Action | uploaded Binary Data | — | Orchestrates parsing + staging (see §7) |

**Accepted file types / size validations:** Not found in inspected flow at the widget or `BulkUploadUpload` action level — no explicit extension or file-size check was observed in the traced nodes. (The Block `BulkUpload\BulkUpload` itself was not opened in detail; any client-side `Accept`/size constraints configured on the Upload widget inside that block were not inspected.)

**Temporary storage of uploaded binary:** Held only in the screen variable `BinaryDataHB` (in-memory, client/session scope) until `SaveBulkUploadDump` runs; the raw file is then persisted into `BulkUploadAudit.ExcelFile` (Binary Data attribute) as part of that action (see §7).

**Cross-module references in this stage:** None at this point — `BulkUploadUpload` is entirely local to the `Policy` module.

**Excel reading/parsing:** Performed by `FormatBulkUploadExcel` + `ExcelToRecordList1`, both in `SaveBulkUploadDump` — see §7 for full detail.

---

## 7. Staging Flow

### 7.1 Parsing (`SaveBulkUploadDump`, module `Policy`)

1. **`FormatBulkUploadExcel`** (module `Policy`, Public = No) — input `File` (Binary Data), output `ExcelOut` (Binary Data). Internally, using the **Advanced_Excel** extension (EPPlus-based):
   - `Workbook_Open` → `Worksheet_Select` → `Row_Delete` (`StartRowNumber = 1`) → `Row_Delete2` → `Workbook_GetBinaryData` → `Workbook_Close` → Assign `ExcelOut`.
   - A design-time comment on this call confirms: *"Removes 2 rows from excel for processing"* — i.e., the first two rows of the template (title/instruction rows) are stripped before the data is parsed as tabular records.
2. **`ExcelToRecordList1`** — an `Excel_ToRecordList` call (Advanced_Excel extension) that converts the cleaned worksheet into a structured **Record List**, presumably driven by the header row for column mapping. (The exact Record Definition/column list was not captured — see Open Questions.)
3. **`GetUserClientID`** (aggregate) — resolves the current user's client/tenant id.
4. **`CreateBulkUploadAudit`** — inserts one row into `BulkUploadAudit` (the batch/job header).
5. **Loop over `ExcelToRecordList1.List`** (For Each pattern):
   - `ColumnJSONSerialized` — serializes each row record into a JSON string.
   - `CreateUpdateBulkUploadAuditDump` — inserts one row into `BulkUploadDump` per Excel data row, linking it to the batch via `BulkUploadAuditId`, storing the row content in `ColJSON`.
6. **`Execute_BulkUpload`** (module `IE_Policy_BL`) — hands off to the asynchronous processing pipeline (see §7.2).

### 7.2 Staging Entities

| Entity | Owner | Purpose |
|---|---|---|
| `BulkUploadAudit` | `InsureEdgeDB` extension (shared DB layer, not owned by Policy/CS/BL modules directly) | One row per upload batch/job |
| `BulkUploadDump` | `InsureEdgeDB` extension | One row per Excel data row within a batch |

**`BulkUploadAudit` attributes:** `Id`, `FileName` (Text), `UploadedOn`, `UploadedBy`, `Status` (Text), `ClientId`, `ExcelFile` (Binary Data — the original uploaded file), `FileType`, `ModuleName`, `UserId`, `ProcessId` (stores the BPT process instance id, set by `UpdateBulkUploadAuditProcessID`).

**`BulkUploadDump` attributes:** `Id`, `BulkUploadAuditId` (FK to `BulkUploadAudit`), `RowNumber`, `IsProcessed` (Boolean), `Status` (Text), `Errors` (Text — row-level error capture), `ColJSON` (Text — the full row content as JSON, dynamic column mapping rather than fixed columns), `CreatedOn`, `UpdatedOn`, `SheetName`.

### 7.3 Synchronous vs. Asynchronous

- **Synchronous part** (within the user's request/`SaveBulkUploadDump` call): parsing the Excel file, creating the `BulkUploadAudit` row, creating all `BulkUploadDump` rows, and launching the async process.
- **Asynchronous part:** a **BPT (Business Process Technology) Process** named `BulkUploadQuotes` (module `IE_Policy_BL`, folder `BulkUpload`), launched via `LaunchBulkUploadQuotes` from `Execute_BulkUpload`. The process id is written back onto `BulkUploadAudit.ProcessId` via `UpdateBulkUploadAuditProcessID`.
- The BPT process consists of a single **Automatic Activity** (`BulkUploadAutomaticActivity`) wired in a loop with a **Decision** (`Decision2`): the activity runs, the decision evaluates whether more work remains (`Yes` → loop back into the activity; `No` → process ends).
- There is also a Site Property acting as a **kill-switch**: `BulkUploadTimerEnable?`, checked inside `BulkUpload_Quotes_HB` — if disabled, processing short-circuits (logs a message and ends without processing).

---

## 8. Validation Rules

| Validation type | Where found | Detail |
|---|---|---|
| Template format validation | Not found in inspected flow | No explicit "is this the right template" check was observed before `ExcelToRecordList1` runs. |
| Header validation | Not found in inspected flow (Record Definition of `Excel_ToRecordList` not opened) | The action likely maps by header name/position internally (standard `Excel_ToRecordList` behavior), but no explicit header-name comparison node was found in the traced flow. |
| Mandatory field validation | Present, but at the **row-processing** stage, not the upload stage | `BulkUploadBusinessSubmissions` (IE_Policy_BL) contains `IsFormValid`, `IsAddressValid`, `IsAdditionalInsuredValid`, `IsAdditionalOrgValid` decision/validation nodes with `AppendError…` assign nodes — these run per submission, appending validation errors to a working structure. Confirmed to exist; exact field-level rules not enumerated (large flow, not fully expanded). |
| Data type validation | Not found in inspected flow as a distinct step | No explicit type-coercion/validation node was found separate from the above `IsFormValid`-style checks. |
| Duplicate validation | Not found in inspected flow | No node explicitly checking for duplicate rows/policies was located in the traced portion of `BulkUpload_Quotes_HB` or `BulkUploadBusinessSubmissions`. |
| Business rule validation | Present | Same `BulkUploadBusinessSubmissions` action performs business-rule-style checks (address validity, additional insured/org validity) before appending to policy/quote structures. |
| File-type/size validation on upload | Not found in inspected flow | Not observed on the Block `BulkUpload\BulkUpload` handler (`BulkUploadUpload`) — the block's internal Upload widget configuration was not opened. |

---

## 9. Database Mapping / Record Creation

**Confirmed staging mapping** (Excel → `BulkUploadDump`):

| Excel Column | Staging Entity.Attribute | Final Entity.Attribute | Validation | Notes |
|---|---|---|---|---|
| (all columns, dynamically) | `BulkUploadDump.ColJSON` | — | None observed at this stage | Each Excel row is serialized wholesale into JSON via `ColumnJSONSerialized`, not mapped column-by-column into discrete `BulkUploadDump` attributes. Column-level mapping happens later, when `ColJSON` is deserialized during row processing. |
| — | `BulkUploadDump.RowNumber` | — | — | Set during the For-Each loop in `SaveBulkUploadDump`. |
| — | `BulkUploadDump.BulkUploadAuditId` | — | — | FK linking row to the batch created by `CreateBulkUploadAudit`. |
| — | `BulkUploadDump.SheetName` | — | — | Captured from the worksheet selected in `FormatBulkUploadExcel`. |
| Whole file | `BulkUploadAudit.ExcelFile` | — | — | Original uploaded binary is stored on the audit/batch header row. |

**Final entity mapping (staging → Policy/Quote):** **Not fully confirmed.** The row-processing action `BulkUploadBusinessSubmissions` (IE_Policy_BL, Public = No) clearly builds a `PolicyStruct`/submission structure and calls downstream actions including `CreatePolicies2`, `CreateRiskLocations3`, `CreateorUpdateHBISRiskInformationsNew3`, `GetPolicyProductInformation`, `GetCommissiondetailsForHb`, `IsAdditionalInsuredValid`, `IsAdditionalOrgValid`, `IsAddressValid` — indicating this is the same underlying "create a business submission" logic used elsewhere in the app, reused for bulk upload. However:
- The exact point where `ColJSON` is deserialized back into typed fields was not located.
- The exact call chain from `BulkUpload_Quotes_HB`'s per-file loop into `BulkUploadBusinessSubmissions` (or an equivalent per-row action) was not confirmed — the loop in `BulkUpload_Quotes_HB` processes `GetBulkUploadFiles` (batches), and the deeper per-row call into submission-creation logic was not traced to completion due to the size/complexity of that flow and environment connectivity interruptions during the session.
- Exact entity names touched for the final Policy/Quote record (e.g., `Policy2`, `PolicyPremium`, `PolicyTransactions` — all present in the `Policy` module's `InsureEdgeDB` entity list) were not attribute-mapped to Excel columns.

**Parent-child creation / FK resolution / create-vs-update / transaction handling:** Not found in inspected flow — not reached before the session's environment connectivity was exhausted. **Flagged as an open question (§12).**

---

## 10. Status Lifecycle

**Confirmed status values (exact strings, as found in code):**

| Status value | Set where | Meaning |
|---|---|---|
| `'InProcess '` *(note: trailing space present in the actual SQL literal — likely a latent bug/inconsistency)* | Set at row creation (implied initial state consumed by the exception-handler's `WHERE Status = 'InProcess '` filter) | Row is queued/being processed |
| `'Failed'` | `SQL1` node in `BulkUploadAutomaticActivity`'s exception handler (`AllExceptions`): `UPDATE {BulkUploadDump} SET IsProcessed = 1, Status = 'Failed' WHERE BulkUploadAuditId = @AuditId AND Status = 'InProcess '` | Row failed due to an unhandled exception during processing |

**Not found in inspected flow:** the exact string(s) used for "Completed", "Partially Completed", or "In Progress" at the `BulkUploadAudit` (batch) level — only the row-level (`BulkUploadDump`) `'Failed'`/`'InProcess '` pair was directly observed in code (via the exception-handling SQL). The task description's other named statuses (Completed, Partially Completed) were not located in the inspected nodes.

**Status update mechanics:**
- Normal-path status updates (success) are expected to happen inside `BulkUpload_Quotes_HB` / `BulkUploadBusinessSubmissions`, but the specific assign/SQL node that flips a row to a "success" status was not located before the trace ended.
- Failure-path status update is a **raw SQL UPDATE**, executed only from the BPT automatic activity's exception handler — i.e., normal (expected/handled) errors within `BulkUploadBusinessSubmissions` presumably use `Errors`/`Status` fields via ordinary entity actions (not confirmed), while **unhandled** exceptions are caught at the process level and force-marked `Failed` via direct SQL (bypassing normal entity-action transaction semantics, which is a way to guarantee the row doesn't stay stuck `InProcess` forever).

**UI refresh / how the Landing Page knows upload status:**
- The `GetUploadFileAuditDetails` aggregate (queried on `BulkUploadOnClick` and presumably elsewhere) returns a `PendingSum` field; `LandingPage` sets `IsLoadingBulk = PendingSum > 0` to reflect whether there's an in-flight batch. This is the only confirmed UI-status linkage found. No explicit polling/timer widget was located on `LandingPage` itself; whether the page relies on manual refresh or an automatic timer to re-query `GetUploadFileAuditDetails` was **not confirmed**.

---

## 11. Error Handling Flow

| Scenario | Behavior found |
|---|---|
| Wrong template format | Not found in inspected flow — no explicit format-mismatch check/message located. |
| Required fields missing | Handled inside `BulkUploadBusinessSubmissions` via `IsFormValid`/`AppendErrorAndIsValid`-style nodes (errors appended to a working error list), at the row-processing stage — not at upload time. |
| One row fails | The `BulkUploadDump.Errors` (Text) and `Status` attributes exist specifically to capture row-level failure without necessarily failing the whole batch — but the exact node writing per-row errors during normal (non-exceptional) processing was not located. |
| Entire upload fails (unhandled exception) | Caught by the BPT `BulkUploadAutomaticActivity`'s `AllExceptions` boundary event → raw SQL marks **all still-`InProcess` rows for that `AuditId`** as `Failed` (see §10) — this affects only rows still pending at the moment of the exception, not necessarily the entire batch if some rows already completed. |
| Failed rows blocking successful rows | Not found in inspected flow — the per-row loop structure (`GetBulkUploadFilesListCurrent…Remove` pattern) suggests independent row processing, implying one row's failure should not directly block others, but this was not explicitly confirmed with a try/catch-per-row node. |
| Rollback behavior | Not found in inspected flow — no explicit `RollbackTransaction` node was located in the traced actions. |
| User-facing error messages / downloadable error report | A dedicated client action `DownloadBulkUploadErrorFile` and aggregate `GetErrorFile` exist on `LandingPage`, indicating a downloadable error report feature — the underlying server-side generation of that error file was **not traced** (out of time/session budget). |

---

## 12. Status Update Flow (Recap / Consolidated)

- **"InProcess" set:** Inferred at row creation in `SaveBulkUploadDump`'s `CreateUpdateBulkUploadAuditDump` loop (exact assign node not screenshotted, inferred from the exception handler's filter `WHERE Status = 'InProcess '`).
- **"Failed" set:** Confirmed — raw SQL in the BPT exception handler (`SQL1` node), see §10.
- **"Completed" set:** Not found in inspected flow.
- **Which action updates status normally:** Presumed to be inside `BulkUpload_Quotes_HB` / `BulkUploadBusinessSubmissions`, not confirmed.
- **Status refresh on Landing Page:** Via `GetUploadFileAuditDetails` aggregate → `PendingSum` → `IsLoadingBulk`. No timer widget confirmed.
- **Aggregate that fetches status:** `GetUploadFileAuditDetails` (screen-level aggregate on `LandingPage`).

---

## 13. Cross-Module Dependency Table

| Module | Action/Entity/Resource | Purpose | Input | Output | Contribution to Bulk Upload |
|---|---|---|---|---|---|
| IE_Policy_Lib | `DownloadBusinessSubmissionsTemplate` (Server Action, Public) | Returns the static Excel template as binary | none | `File` (Binary Data) | Backend of "Download Template" |
| IE_Policy_Lib | Static Resource `ESHomeownersInsuranceProductUploadTemplate` (`Resources\ExcelTemplates`, ~1.2MB) | Pre-built `.xlsx` template file | — | — | The actual template content downloaded |
| IE_Policy_CS | `CreateUpdateBulkUploadAudit` (Server Action, Public) | Thin CreateOrUpdate wrapper over `BulkUploadAudit` entity | `Source` (record) | `Id` | Used to create/update the batch header row |
| IE_Policy_CS | `CreateUpdateBulkAuditDump` (Server Action) | Presumed CreateOrUpdate wrapper over `BulkUploadDump` | Not confirmed | Not confirmed | Likely used to create/update staging rows |
| IE_Policy_CS | `HB_CreatePolicyBulkUpload_CS`, `CreateorUpdateHBISPolicyMortgageViaBulkUpload` | Present in module, names imply policy/mortgage record creation for HB bulk upload | Not opened in detail | Not opened in detail | Likely part of final Policy record creation — not traced |
| IE_Policy_BL | `Execute_BulkUpload` (Server Action, Public) | Launches the async processing pipeline | `AuditId` | none observed | Bridges synchronous upload request to async BPT process |
| IE_Policy_BL | `LaunchBulkUploadQuotes` (Launch Process action, auto-generated for the BPT) | Starts the `BulkUploadQuotes` BPT process instance | `AuditId` | Process reference | Kicks off asynchronous batch processing |
| IE_Policy_BL | `UpdateBulkUploadAuditProcessID` (Server Action) | Persists the launched process id onto `BulkUploadAudit.ProcessId` | Not confirmed in detail | — | Links the audit row to its async process instance |
| IE_Policy_BL | BPT Process `BulkUploadQuotes` (folder `BulkUpload`) | Orchestrates asynchronous row processing via a looping Automatic Activity | `AuditId` | — | The actual "background job" that processes the batch |
| IE_Policy_BL | `BulkUpload_Quotes_HB` (Server Action) | Row/file batch processing entry point; checks kill-switch, fetches pending files, loops | none observed as direct input in the activity call | `RemainingRecords` | Core async worker logic |
| IE_Policy_BL | `BulkUploadBusinessSubmissions` (Server Action, Public = No) | Row-level submission/quote creation with field/address/insured/org validation | Large struct-based input (not fully enumerated) | Submission/error structures | Where individual Excel rows become Policy/Quote data |
| IE_Policy_BL | `GetBulkUploadFiles` (Aggregate, inside `BulkUpload_Quotes_HB`) | Queries pending `BulkUploadAudit` batches | — | List of pending audits | Determines what the worker should process next |
| IE_Policy_BL | Site Property `BulkUploadTimerEnable?` | Feature-flag/kill-switch for the automatic processing | — | Boolean | Can disable async bulk-upload processing entirely |
| Advanced_Excel (Extension) | `Workbook_Open`, `Worksheet_Select`, `Row_Delete`, `Workbook_GetBinaryData`, `Workbook_Close`, `Excel_ToRecordList` | EPPlus-based `.xlsx` manipulation library (per its own module description: *"Uses the EPPlus .net library to create and manipulate .xlsx files"*) | Binary Data / Worksheet objects | Binary Data / Record Lists | All Excel reading/writing in `FormatBulkUploadExcel` and `SaveBulkUploadDump` |
| InsureEdgeDB (Extension / shared DB layer) | Entities `BulkUploadAudit`, `BulkUploadDump` (and unrelated entities like `Policy2`, `PolicyPremium`, etc.) | Shared database schema definitions | — | — | Owns the physical tables backing both staging entities |
| IE_Common_CS / IE_Common_BL / IE_Common_CW | Referenced in the `Policy` module's Logic tree (visible as dependencies) | Not opened/traced | — | — | Presence noted only; no bulk-upload-specific action confirmed inside |

---

## 14. Entities Used

| Entity | Module/Owner | Role |
|---|---|---|
| `BulkUploadAudit` | InsureEdgeDB extension | Batch/job header — one row per upload |
| `BulkUploadDump` | InsureEdgeDB extension | Staging — one row per Excel data row, JSON payload in `ColJSON` |
| `Policy2`, `PolicyPremium`, `PolicyTransactions`, `PolicyCommission`, `Policy_Extended`, etc. | InsureEdgeDB extension | Final policy-related entities — presumed targets of `CreatePolicies2` etc., attribute-level mapping **not confirmed** |

---

## 15. Server Actions / Service Actions Used

- `DownloadBusinessSubmissionsTemplate` (IE_Policy_Lib)
- `FormatBulkUploadExcel` (Policy)
- `SaveBulkUploadDump` (Policy)
- `CreateUpdateBulkUploadAudit`, `CreateUpdateBulkAuditDump` (IE_Policy_CS)
- `Execute_BulkUpload`, `UpdateBulkUploadAuditProcessID`, `BulkUpload_Quotes_HB`, `BulkUploadBusinessSubmissions`, `RaterForBulkUpload`, `HB_CreatePolicyBulkUpload_CS`*, `CreateorUpdateHBISPolicyMortgageViaBulkUpload`* (IE_Policy_BL — *these two appeared in search results under IE_Policy_CS/IE_Policy_BL respectively; exact owning module for each was not double-confirmed for both)
- Advanced_Excel extension actions: `Workbook_Open`, `Worksheet_Select`, `Row_Delete`, `Workbook_GetBinaryData`, `Workbook_Close`, `Excel_ToRecordList`

---

## 16. Timers / BPT / Processes Used

- **BPT Process:** `BulkUploadQuotes` (module `IE_Policy_BL`, folder `BulkUpload`) — asynchronous, input `AuditId`, contains one looping Automatic Activity (`BulkUploadAutomaticActivity`) gated by `Decision2`, plus an `AllExceptions` boundary handler with a direct SQL failure-marking statement.
- **Site Property (feature flag, not a timer):** `BulkUploadTimerEnable?` — referenced inside `BulkUpload_Quotes_HB` to gate whether processing proceeds.
- **No classic OutSystems Timer (scheduled/recurring) was found** driving this flow — the async work is triggered by the BPT process launch (`LaunchBulkUploadQuotes`) at upload time, not by a periodic timer. (It's possible a Timer exists elsewhere to catch stuck/orphaned batches, but none was located in the inspected modules.)

---

## 17. Static Resources / Files Used

- `ESHomeownersInsuranceProductUploadTemplate` — `.xlsx`, ~1.2 MB, folder `IE_Policy_Lib\Resources\ExcelTemplates`, downloaded filename `E&S Homeowners Insurance Products Upload Template.xlsx`.
- A second, similarly named resource (name ends `…Template_O…`, likely `_Old`) exists in the same folder but is **not referenced** by the traced download action.

---

## 18. Open Questions / Missing Information

1. **`BulkUploadProceed` client action** (the "Proceed"/submit trigger in the popup) was located by name in the Elements tree but its internal logic (Start/End node graph) was **not opened** before the session ended — it is assumed to call `SaveBulkUploadDump` but this is inferred, not confirmed.
2. **Header validation and mandatory-field validation at the Excel/template level** (e.g., checking the uploaded file has the right column headers before accepting it) — no such check was located. It's possible this logic lives inside `Excel_ToRecordList`'s Record Definition mapping (which fails silently/errors if headers don't match) or inside `BulkUploadBusinessSubmissions`, but this wasn't confirmed either way.
3. **Exact call path from `BulkUpload_Quotes_HB` to `BulkUploadBusinessSubmissions`** (i.e., how a `BulkUploadDump.ColJSON` row is deserialized and fed into the row-creation logic) was not fully traced — the loop in `BulkUpload_Quotes_HB` iterates `GetBulkUploadFiles` (audits/batches), and the deeper per-row call was not reached.
4. **Full Excel column → entity attribute mapping table** could not be produced: the exact column headers of the template and the `Excel_ToRecordList` Record Definition structure were not opened.
5. **"Completed" / "Partially Completed" status strings** were not located anywhere in the inspected code — only `'InProcess '` (with a trailing space, likely a bug) and `'Failed'` were confirmed.
6. **Duplicate-record validation** — not found in the inspected flow; unclear whether/where this is handled.
7. **Transaction/commit and rollback behavior** for the final Policy/Quote record creation — not found in inspected flow.
8. **File type/size validation on the Upload widget itself** (inside Block `BulkUpload\BulkUpload`) was not opened.
9. **Downloadable error report** (`DownloadBulkUploadErrorFile` / `GetErrorFile`) — the client action exists and an aggregate feeds it, but the server-side generation of the error file content was not traced.
10. Session connectivity to Service Studio was interrupted multiple times during inspection (the environment repeatedly reverted to a "Not Connected" window); the above gaps are primarily a result of running out of stable session time rather than the logic not existing. A follow-up pass focused specifically on items 1–4 and 9 would close most of the remaining unknowns.

---

*Document generated via manual, read-only inspection of Service Studio. No publish, save, entity, or dependency changes were made during this analysis.*
