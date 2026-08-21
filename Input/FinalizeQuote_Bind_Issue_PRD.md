# FinalizeQuote — Bind & Issue Buttons — Reverse-Engineering PRD

**Module:** `Policy` (InsureEdge2.0 Policy)
**Block:** `HB_FinalizeQuote_WB → FinalizeQuote_HB`
**Method:** Read-only inspection via OutSystems Service Studio 11.55.77 (no code changes, no publish, no destructive actions)
**Author scope:** Bind button and Issue button only. All other buttons/sections of the block are out of scope and not documented.

---

## 1. Scope

This document reverse-engineers, strictly for the **Bind** button and the **Issue** button located inside the block `FinalizeQuote_HB` (nested under `HB_FinalizeQuote_WB`):

- Frontend behavior (enable/disable rules, validations, messages, UI state changes)
- Client action logic, step by step
- Every server/service action invoked directly or indirectly, including actions that live in referenced modules (`IE_Policy_BL`, `IE_Policy_CS`)
- Database/entity updates performed as a result of each action
- Status lifecycle transitions
- Exception handling
- Cross-module dependencies

No other widgets, buttons, or screens in the block were inspected or documented. Nothing was modified, saved, or published during this investigation.

---

## 2. Block Overview

`FinalizeQuote_HB` is a Reactive Web block rendering the "Finalize Quote" step of the Homeowners (HB) policy submission wizard. It shows a summary panel (Coverage Premium, Taxes, Fees, Total Premium), a Payment Plans section (Payment Frequency, Responsible Party, Mode of Payment, Number of Installments, Installment Fee), a Commission Details grid, and an action bar containing (among other controls not in scope) two key buttons:

| Widget | Caption | Notes |
|---|---|---|
| Button ("OK" style) | **Bind** | Plain OutSystems `Button` widget |
| `Utilities\ButtonLoading` block instance wrapping a `Button` | **Issue** | Uses a reusable loading-spinner button block; `IsLoading = IsIssueLoading` |

Both buttons sit inside nested `Container` widgets in the block's `Content` placeholder, alongside a "Lock Submission" toggle and a "Change Payment Mode" control (out of scope).

---

## 3. Bind Button — Complete Flow

### 3.1 Frontend widget properties

| Property | Value |
|---|---|
| Widget type | `Button` |
| Enabled | `GetPolicyDetails.PolicyInfo.Status <> "BOUND"` |
| Confirmation Message | *(empty — no confirmation dialog)* |
| Is Form Default | No |
| Style Classes | `"btn btn-small-width"` (inferred from sibling styling; base "OK" button) |
| Events → On Click | `BindOnClick` (Client Action) |

**Interpretation:** Bind is enabled for any policy whose status is not already `BOUND`. There is no confirmation prompt before binding.

### 3.2 Client Action: `BindOnClick` — step by step

Location: `Policy\HB_FinalizeQuote_WB\FinalizeQuote_HB\BindOnClick`

| Step | Node type | Detail |
|---|---|---|
| 1 | Assign | `Client.IsRestrictNavigation = False` |
| 2 | Run Server Action | `UpdatePolicyStatus_BL` → Action = `FinalizeQuote\UpdatePolicyStatus_BL`. Inputs: `PolicyID = PolicyID`, `PolicyStatus = "BOUND"` |
| 3 | Run Client Action | `SaveOnClick` → Action = `SaveOnClick`, `ShowSuccessMessage = False` |
| 4 | Trigger Event | `OnStatusChange` (Event = `OnStatusChange`, Param `PolicyStatus = "BOUND"`) — notifies the parent screen/container that the policy status changed |
| 5 | Assign | `Refreshblock = not Refreshblock` — flips a local boolean used to force a UI refresh binding |
| 6 | Message (Success) | Text: **"Renewal quote bound successfully."** |
| 7 | Run Client Action | `AESEncrypt` → Action = `Security\AESEncrypt`, `PlainText = GetPolicyDetails.PolicyInfo.Id` |
| 8 | Destination (navigate) | `MainFlow\NewSubmission`, `Key = AESEncrypt.EText`, `CurrentStep = 4`, Transition = `(Module Transition)` |

**End of flow.** There are no conditional branches in `BindOnClick` — every click that reaches this action runs the full sequence above and ends in a page navigation.

### 3.3 Server-side trace of `UpdatePolicyStatus_BL` (the actual DB write for Bind)

The call chain crosses three modules:

1. `Policy\FinalizeQuote\UpdatePolicyStatus_BL` (Service Action, defined in **Policy**) →
2. `IE_Policy_BL\UpdatePolicyStatus_BL` → internally runs `IE_Policy_BL\UpdatePolicyStatus` (Run Server Action, passthrough of `PolicyID`/`PolicyStatus`) →
3. `IE_Policy_CS\UpdatePolicyStatus` (Server Action, the actual implementation):
   - **Start**
   - **GetPolicy2ById** (Aggregate) — Source: entity **`Policy2`**, Filter: `Policy2.Id = LongIntegerToIdentifier(PolicyID)` and `Policy2.Id <> NullIdentifier()`, Max Records = 1
   - **Assign**:
     - `Policy2.PolicyStatus = PolicyStatus` (input param, `"BOUND"` for the Bind path)
     - `Policy2.UpdatedOn = CurrDateTime()`
     - `Policy2.UpdatedBy = GetUserId()`
   - **UpdatePolicy2** (Run Server Action — CRUD Update action for entity `Policy2`, Source = `GetPolicy2ById.List.Current.Policy2`)
   - **End**

This is the single DB write performed by Bind: **`Policy2.PolicyStatus` is set to `"BOUND"`.**

---

## 4. Issue Button — Complete Policy-Issue Flow

### 4.1 Frontend widget properties

The visible "Issue" control is a `Utilities\ButtonLoading` reusable block instance wrapping an inner `Button` widget.

**Outer block instance (`Utilities\ButtonLoading`) properties:**

| Property | Value |
|---|---|
| Source Block | `Utilities\ButtonLoading` |
| IsLoading | `IsIssueLoading` (local/client variable) |
| ShowLabelOnLoading | `True` |
| ExtendedClass | `"margin-left-base"` |
| Event: Initialized | *(no handler wired)* |

**Inner `Button` widget properties (the actual clickable control):**

| Property | Value |
|---|---|
| Enabled | `GetPolicyRiskInfoStatus.Status = "APPROVED" and not GetMortgageInformationDwelling.MortgageInformationList.Empty and GetPolicyDetails.PolicyPremiumInfo.PaymentFrequency = "ANNUAL" and GetPolicyDetails.PolicyPremiumInfo.ResponsibleParty = "MORTGAGEE" and CheckRole.Is_HBProducer` |
| Confirmation Message | *(empty — no confirmation dialog)* |
| Is Form Default | No |
| Visible | `True` |
| Style Classes | `"btn btn-small-width"` |
| Events → On Click | `IssueOnClick` (Client Action) |

**Interpretation of the Enabled expression:** as inspected, the Issue button is only enabled when **all** of the following hold simultaneously:
1. The policy's risk information status is `"APPROVED"`.
2. There is at least one Mortgage Information record on the quote (list not empty).
3. Payment Frequency is `"ANNUAL"`.
4. Responsible Party is `"MORTGAGEE"`.
5. The current user has the `Is_HBProducer` role.

This is a narrower condition than Bind's — in the inspected flow, Issue's UI enablement is scoped to the Mortgagee/Annual/HB-Producer scenario. *(See Open Questions — this narrow condition looks specific to a particular business scenario; no broader/alternate Enabled expression was found for this control.)*

### 4.2 Client Action: `IssueOnClick` — step by step

Location: `Policy\HB_FinalizeQuote_WB\FinalizeQuote_HB\IssueOnClick`

**Pre-flight validations (each ends the flow via `End` if triggered — Issue is aborted, nothing is written):**

| Step | Node type | Condition / Action | On failure |
|---|---|---|---|
| 1 | Run Client Action | `ListFilter(SourceList = CommissionDetailsss, Condition = ProducerName = "-")` | — |
| 2 | If | `ListFilter.FilteredList.Current.Percentage = 0.00 ?` | **True →** Error message: *"A commission schedule and valid percentage is not configured for this Intermediary. Please contact Hudson Bailey to add the state to the Intermediary's licensing schedule or transfer the policy to a licensed intermediary/producer."* → **End** |
| 3 | Run Client Action | `SaveOnClick` (Action = `SaveOnClick`, `ShowSuccessMessage = False`) | — |
| 4 | If | `GetPolicyDetails.PolicyPremiumInfo.ResponsibleParty = "" ?` | **True →** Assign `ResponsiblePartyDropdown3.Valid = False`, `ValidationMessage = "Provide Responsible Party to continue"` → **End** |
| 5 | If | `PaymentFrequency_Dropdown2.Valid ?` | **False →** Assign `PaymentFrequency_Dropdown2.Valid = False`, `ValidationMessage = "Provide Payment Frequency to continue"` → **End** |
| 6 | If | `ResponsibleParty = "MORTGAGEE" ?` | **False →** skip to step 10 (loading flag) |
| 7 | If (nested inside step 6 True) | `PaymentFrequency = "ANNUAL" ?` | **False →** Assign `PaymentFrequency_Dropdown2.Valid = False`, `ValidationMessage = "Payment Frequency should be Annual when Responsible Party is Mortgagee"` → **End** |
| 8 | Run Client Action | `ValidateLenderDockDetails` (external Lender/Mortgagee document-service validation call; inputs include `CLIENTID = GetPolicyDetails.PolicyInfo.ClientId` and several provider/sender integration parameters — `PROVIDER`, `WHIDHVERSION`, `WHIDHTEST`, `WSENDERORGNAME`, `WSENDEREIN`, `WSENDERELIT`, `WDATADATE`, etc.) | — |
| 9 | If | `NoErrorMessage` = `ValidateLenderDockDetails.ErrorMessage = "" ?` | **False →** Error message: `ValidateLenderDockDetails.ErrorMessage` (dynamic text from the service) → **End** |
| 9b | If | `GetMortgageInformationDwelling.MortgageInformationList.Empty ?` | **True →** Assign `ResponsiblePartyDropdown3.Valid = False`, `ValidationMessage = "Responsible Party cannot be Mortgagee when no Mortgagee Information records exist in the qu[ote]"` → **End** |

**Main issue sequence (only reached once all validations above pass):**

| Step | Node type | Detail |
|---|---|---|
| 10 | Assign | `IsIssueLoading = True` (spinner shown on the Issue button) |
| 11 | Run Server Action | `IssuePolicyHB_BL` → Action = `HBIS\IssuePolicyHB_BL` (see §4.3 for the full internal trace). Key inputs: `GetMortgageInformationDwelling.MortgageInformationList`, `GetPolicyDetails.PolicyPremiumInfo`, `CommissionDetailsss`, `TotalPremium_Summary`, `PolicyID`, `InputForLenderDock`, `PolicyNumber`, `PaymentId`, `InstallmentDetailsList`, `TaxListLocal`, `GetPolicyDetails_PolicyInfo`, `GetAccountDetails_Accounts...`, `GetPlanComparisonChart...` (x2), `PolicyType` |
| 12 | Run Server Action | `CheckIfPolicyIsCancelRewrite_BL` → Action = `CancelRewrite\CheckIfPolicyIsCancelRewrite_BL(PolicyId)` |
| 13 | If | `CheckIfPolicyIsCancelRewrite_BL.IsRewrite ?` — **True branch:** Assign `InputForLenderDock = IssuePolicyHB_BL.Out_InputForLenderDock`, `Client.ProcessIds = If(Client.ProcessIds = "", IssuePolicyHB_BL.DocumentProcessId, Client.ProcessIds + ...)`. **False branch:** Assign `InputForLenderDock = IssuePolicyHB_BL.Out_InputForLenderDock`, `PolicyNumber = IssuePolicyHB_BL.Out_PolicyNumber`, `Client.ProcessIds = If(...)` (same pattern) |
| 14 | JavaScript | `RefreshClientVariable` → `setTimeout(function() {...})` (client-side timer, likely used to poll/refresh document-generation process status) |
| 15 | Assign | `IsSuccessPopup = True` |
| 16 | Trigger Event | `OnStatusChange` (Event = `OnStatusChange`, Param `PolicyStatus = "ACTIVE"`) |
| 17 | Run Client Action | `StartCountdown` (Action = `StartCountdown`) |
| 18 | Assign | `IsIssueLoading = False` |
| 19 | Assign | `Refreshblock = not Refreshblock`; `Client.IsRestrictNavigation = False` |
| 20 | **End** | |

**No page navigation occurs at the end of Issue** (unlike Bind, which navigates to `MainFlow\NewSubmission`). Issue instead flips `IsSuccessPopup = True` and starts a countdown — indicating a success popup/modal is shown in place, with the screen presumably auto-advancing or auto-closing the popup after the countdown (the popup and countdown implementation itself live outside this block's client action and were not traced further, as they are UI elements outside the Bind/Issue scope).

### 4.3 Server-side trace of `IssuePolicyHB_BL` (module `IE_Policy_BL`)

`HBIS\IssuePolicyHB_BL` (as called from `Policy`) resolves to `IE_Policy_BL\IssuePolicyHB_BL`, a Service Action explicitly annotated in Service Studio as: *"This Action was automatically generated from 'IssueOnClick', using 'Extract To Action'."*

**Main path:**

| Step | Node | Detail |
|---|---|---|
| 1 | Run Server Action | `CreatePolicyNumber_HB` → Action = `Policy\CreatePolicyNumber_HB(PolicyID)` — **generates the actual policy number** |
| 2 | Assign | `PolicyNumber = CreatePolicyNumber_HB.PolicyNumber` |
| 3 | **For Each** | `GetMortgageInformation_MortgageInformationList` (loop over mortgage records on the quote) |
| 3a | If (inside loop) | `GetMortgageInformation_MortgageInformationList.Current.CoveredAsset = "Dwelling" ?` — **True →** Assign builds an `InputForLenderDock` record (`CLIENTID = GetPolicyDetails_PolicyInfo.ClientId`, `WDUEDATE = TextToLongInteger(...)`, `WINSUREDNAME1 = If(Trim(GetAccountDetails_AccountsList_AccountsStruct.LastName + " " + ...))`, `WPREMADDR1 = GetPlanComparisonChartValues_RiskAddress.Current.AddressLine1`, and additional lender-dock fields) → **JSONSerializeLenderDockInfo** (JSON Serialize of `InputForLenderDock`, `SerializeDefaultValues = Yes`, ISO date format) → loops back |
| 4 | (after loop) | **Notify_MortgageBillLenderDock** — Run Server Action, Action = `Process\Notify_MortgageBillLenderDock` (this is a **Launch Process** call, i.e. an asynchronous BPT process). Inputs: `JSONSerializeText = JSONSerializeLenderDockInfo.JSON`, `WritingCompanyCode = GetPolicyDetails_PolicyInfo.WritingCompanyCode`, `PolicyId = PolicyID`, `IsMortgagee = True` |
| 5 | Run Server Action | `FirstPaymentTransaction` → Action = `Payment\FirstPaymentTransaction`. Creates a `PolicyPaymentTransactionStructure`: `Id = NullIdentifier()` (new record), `PaymentDate = CurrDate()`, `IsPaid = False`, `ResponseCode`/`ResponseJSON` empty, `CreatedOn = CurrDateTime()`, `PolicyPremiumId = PaymentId` |
| 6 | Run Server Action | `CreateorUpdateHBIScommissiondetails` → Action = `HB\CreateorUpdateHBIScommissiondetails(Commissiondetails = CommissionDetailsss, PaymentFrequency = GetPolicyDetails_PolicyPremiumInfo..., EffectiveDate = GetPolicyDetails_PolicyInfo.EffectiveDate)` |
| 7 | Assign | Output Variables: `Out_InputForLenderDock = InputForLenderDock`, `Out_PolicyNumber = PolicyNumber` |
| 8 | Run Server Action | `GetUserClientID` → Action = `Tenant\GetUserClientID(UserId = GetUserId())` |
| 9 | Run Server Action (async Launch) | `LaunchGenerateAndSaveNewBusinessPolicyPackage` → Action = `GenerateAndSaveNewBusinessPolicyPackage(PolicyId2 = PolicyID, ClientId = GetUserClientID.ClientIDBasedOnTenant)` — **generates and saves the policy document package** |
| 10 | Assign | `DocumentProcessId = LaunchGenerateAndSaveNewBusinessPolicyPackage.ProcessId` (confirms step 9 is an asynchronous process) |
| 11 | Assign | `IsSucess = True`; `Out_InputForLenderDock = InputForLenderDock`; `Out_PolicyNumber = PolicyNumber` |
| 12 | Run Server Action | `CreatePolicyTransaction` → Action = `PolicyTransaction\CreatePolicyTransaction`. Creates a `PolicyTransaction` record: `PolicyNumber = CreatePolicyNumber_HB.PolicyNumber`, `EffectiveDate`/`ExpirationDate` from `GetPolicyDetails_PolicyInfo`, `TransactionType = If(PolicyType = "RENEWALBUSINESS", ...)`, `TransactionEffectiveDate = CurrDate()`, **`Status = "ACTIVE"`**, `MainPolicyId = PolicyID`, `RedirectionPolicyId = PolicyID`, `CreatedOn = CurrDateTime()`, `CreatedBy = GetUserId()`, `IsShowInTimeline = ...` |
| 13 | **End** | |

**Rewrite-policy sub-path** (reached when the policy is a "cancel/rewrite" policy — the exact join point of this branch relative to the main path above was not conclusively isolated in the canvas, but the logic itself was fully inspected):

| Step | Node | Detail |
|---|---|---|
| a | If | `CheckIfPolicyIsCancelRewrite.IsRewritePolicy ?` |
| b (True) | Run Server Action | `MakePriorPolicyCancelled_HB` → Action = `CancelRewrite\MakePriorPolicyCancelled_HB(CurrentPolicyId = PolicyID)` — **cancels the prior policy being rewritten** |
| c | If | `MakePriorPolicyCancelled_HB.IsSucess ?` — **True →** Output Variables assign → End. **False →** Assign `IsSucess = False` → End |
| d (main If, False) | — | straight to Output Variables → End |

**Global exception handler:**

| Node | Detail |
|---|---|
| `AllExceptions` (Exception Handler) | Exception = All Exceptions, **Abort Transaction = Yes**, **Log Error = Yes** |
| `LogMessage` | Run Server Action `LogMessage(Message = AllExceptions.ExceptionMessage, ModuleName = "IE_Policy_BL")` |
| `IsSucess` (Assign) | `IsSucess = False` |
| End | |

**Interpretation:** any unhandled exception anywhere in `IssuePolicyHB_BL` rolls back the entire DB transaction (Abort Transaction = Yes), logs the exception message, and returns `IsSucess = False` to the caller — meaning none of the writes in §4.3 (policy number, document package, payment transaction, commission, policy transaction, prior-policy cancellation) are persisted if any step fails.

---

## 5. Frontend Validations

| Button | Validation | Trigger | Message |
|---|---|---|---|
| Bind | None beyond the `Enabled` expression | n/a | n/a |
| Issue | Commission schedule/percentage configured | `ListFilter.FilteredList.Current.Percentage = 0.00` (blank-producer commission row has zero percentage) | "A commission schedule and valid percentage is not configured for this Intermediary. Please contact Hudson Bailey to add the state to the Intermediary's licensing schedule or transfer the policy to a licensed intermediary/producer." |
| Issue | Responsible Party required | `GetPolicyDetails.PolicyPremiumInfo.ResponsibleParty = ""` | "Provide Responsible Party to continue" |
| Issue | Payment Frequency required | `not PaymentFrequency_Dropdown2.Valid` | "Provide Payment Frequency to continue" |
| Issue | Payment Frequency must be Annual when Mortgagee | `ResponsibleParty = "MORTGAGEE"` and `PaymentFrequency <> "ANNUAL"` | "Payment Frequency should be Annual when Responsible Party is Mortgagee" |
| Issue | Lender/Mortgagee document service must return no error | `ValidateLenderDockDetails.ErrorMessage <> ""` | Dynamic: `ValidateLenderDockDetails.ErrorMessage` |
| Issue | Mortgage Information required when Mortgagee | `ResponsibleParty = "MORTGAGEE"` and `PaymentFrequency = "ANNUAL"` and `GetMortgageInformationDwelling.MortgageInformationList.Empty` | "Responsible Party cannot be Mortgagee when no Mortgagee Information records exist in the quote" |

---

## 6. Backend Validations

| Validation | Where enforced | Effect |
|---|---|---|
| All exceptions during Issue | `IssuePolicyHB_BL` → `AllExceptions` handler | Abort Transaction = Yes (full rollback), Log Error = Yes, `IsSucess = False` returned |
| Success of prior-policy cancellation (rewrite scenario) | `MakePriorPolicyCancelled_HB.IsSucess` check | If False, `IsSucess = False` returned to caller even though the new policy documents/records may already have been created earlier in the same action |
| Lender/Mortgagee external document service validation | `ValidateLenderDockDetails` (external integration call with `PROVIDER`, `WHIDHVERSION`, sender/org identifiers) | Blocks Issue if the service returns a non-empty `ErrorMessage` |

---

## 7. Business Rules

- **Bind** is allowed for any policy whose current `Status` is not already `"BOUND"` (no other business conditions gate Bind at the UI level).
- **Issue** is only enabled/allowed, per the inspected `Enabled` expression and validation chain, when: Risk Info Status = `APPROVED`, at least one Mortgage Information record exists, Payment Frequency = `ANNUAL`, Responsible Party = `MORTGAGEE`, and the current user holds the `Is_HBProducer` role.
- A valid, non-zero commission percentage must be configured for the producer/intermediary before a policy can be issued.
- If the policy being issued is a "cancel/rewrite" policy, the prior policy it replaces is automatically marked cancelled as part of the Issue transaction.
- Policy Transaction `TransactionType` is derived from `PolicyType`: renewal business is distinguished from new business via `If(PolicyType = "RENEWALBUSINESS", ...)`.
- Mortgagee/lender billing notification (`Notify_MortgageBillLenderDock`) is only triggered for mortgage records whose `CoveredAsset = "Dwelling"`.

---

## 8. Client Action Mapping

| Client Action | Owning Block | Triggered By | Summary |
|---|---|---|---|
| `BindOnClick` | `FinalizeQuote_HB` | Bind button On Click | Sets policy status to BOUND, saves, shows success message, navigates to `MainFlow\NewSubmission` (Step 4) |
| `IssueOnClick` | `FinalizeQuote_HB` | Issue button On Click | Runs multi-stage validation, then issues the policy, notifies mortgagee lender, generates documents, shows success popup |
| `SaveOnClick` | (shared/common) | Called by both `BindOnClick` and `IssueOnClick` | Generic save of the current quote/policy screen state (`ShowSuccessMessage = False` in both calls) |
| `ListFilter` | (shared/common) | Called by `IssueOnClick` | Filters `CommissionDetailsss` for blank `ProducerName` rows |
| `AESEncrypt` | `Security` (referenced) | Called by `BindOnClick` | Encrypts `PolicyInfo.Id` for use as a navigation key |
| `ValidateLenderDockDetails` | (external/common) | Called by `IssueOnClick` | Validates Lender Dock / mortgagee document details via an external service-style call |
| `StartCountdown` | (shared/common) | Called by `IssueOnClick` | Starts a client-side countdown after a successful Issue |
| `RefreshClientVariable` (inline JavaScript) | `IssueOnClick` | Inline JS node | `setTimeout(function(){...})` — client-side timing/refresh helper |

---

## 9. Server Action Mapping

| Server Action | Defined In | Called From | Purpose |
|---|---|---|---|
| `UpdatePolicyStatus_BL` | `Policy\FinalizeQuote` (wrapper) → `IE_Policy_BL` → `IE_Policy_CS` (implementation) | `BindOnClick` | Updates `Policy2.PolicyStatus` |
| `IssuePolicyHB_BL` | `IE_Policy_BL` (Service Action, auto-extracted from `IssueOnClick`) | `IssueOnClick` | Full policy-issue orchestration (see §4.3) |
| `CreatePolicyNumber_HB` | `Policy` | `IssuePolicyHB_BL` | Generates the policy number |
| `Notify_MortgageBillLenderDock` | `Process` (async Launch Process) | `IssuePolicyHB_BL` | Notifies mortgagee/lender billing system |
| `FirstPaymentTransaction` | `Payment` | `IssuePolicyHB_BL` | Creates the first payment transaction record |
| `CreateorUpdateHBIScommissiondetails` | `HB` | `IssuePolicyHB_BL` | Creates/updates commission detail records |
| `GetUserClientID` | `Tenant` | `IssuePolicyHB_BL` | Resolves current user's tenant/client ID |
| `LaunchGenerateAndSaveNewBusinessPolicyPackage` (async) | (module hosting `GenerateAndSaveNewBusinessPolicyPackage`) | `IssuePolicyHB_BL` | Generates and saves the policy document package |
| `CreatePolicyTransaction` | `PolicyTransaction` | `IssuePolicyHB_BL` | Creates the `PolicyTransaction` audit/status record |
| `CheckIfPolicyIsCancelRewrite_BL` | `CancelRewrite` | `IssueOnClick` (outer) and referenced inside `IssuePolicyHB_BL` logic | Determines if the policy is a cancel/rewrite policy |
| `MakePriorPolicyCancelled_HB` | `CancelRewrite` | `IssuePolicyHB_BL` (rewrite branch) | Cancels the prior policy being replaced |
| `LogMessage` | (common/logging) | `IssuePolicyHB_BL` exception handler | Logs exception messages |

---

## 10. Service / Reference Module Action Mapping

| Step | Trigger/Action | Module | Type | Input | Output | Purpose |
|---|---|---|---|---|---|---|
| Bind-1 | `UpdatePolicyStatus_BL` call | Policy → IE_Policy_BL | Cross-module Run Server Action | `PolicyID`, `PolicyStatus="BOUND"` | none consumed further | Entry point to update policy status |
| Bind-2 | `UpdatePolicyStatus` call | IE_Policy_BL → IE_Policy_CS | Cross-module Run Server Action | `PolicyID`, `PolicyStatus` | none | Delegates to Core Service implementation |
| Bind-3 | `GetPolicy2ById` | IE_Policy_CS | Aggregate | `PolicyID` | `Policy2` record | Fetch policy row to update |
| Bind-4 | `UpdatePolicy2` | IE_Policy_CS | Entity CRUD (Run Server Action) | Modified `Policy2` record | updated row | Persist status change |
| Issue-1 | `IssuePolicyHB_BL` call | Policy → IE_Policy_BL | Cross-module Run Server Action | Large parameter set (policy, premium, commission, mortgage, tax, installment, plan data) | `Out_InputForLenderDock`, `Out_PolicyNumber`, `IsSucess`, `DocumentProcessId` | Core issue orchestration |
| Issue-2 | `CreatePolicyNumber_HB` | Policy | Cross-module Run Server Action | `PolicyID` | `PolicyNumber` | Generates policy number |
| Issue-3 | `Notify_MortgageBillLenderDock` | Process | Async Launch Process | Serialized LenderDock JSON, `WritingCompanyCode`, `PolicyId`, `IsMortgagee=True` | (async) | Notifies mortgagee lender bill service |
| Issue-4 | `FirstPaymentTransaction` | Payment | Cross-module Run Server Action | `PolicyPaymentTransactionStructure` | new transaction row | Creates first payment transaction |
| Issue-5 | `CreateorUpdateHBIScommissiondetails` | HB | Cross-module Run Server Action | `CommissionDetailsss`, `PaymentFrequency`, `EffectiveDate` | commission rows | Creates/updates commission details |
| Issue-6 | `GetUserClientID` | Tenant | Cross-module Run Server Action | `UserId` | `ClientIDBasedOnTenant` | Resolve tenant client id |
| Issue-7 | `LaunchGenerateAndSaveNewBusinessPolicyPackage` | (document generation module) | Async Launch Process | `PolicyId2`, `ClientId` | `ProcessId` | Generates & saves policy document package |
| Issue-8 | `CreatePolicyTransaction` | PolicyTransaction | Cross-module Run Server Action | Policy/transaction fields, `Status="ACTIVE"` | new transaction row | Creates policy transaction/audit record |
| Issue-9 | `CheckIfPolicyIsCancelRewrite_BL` | CancelRewrite | Cross-module Run Server Action | `PolicyId` | `IsRewrite` | Determines rewrite scenario |
| Issue-10 | `MakePriorPolicyCancelled_HB` | CancelRewrite | Cross-module Run Server Action | `CurrentPolicyId` | `IsSucess` | Cancels prior policy in rewrite scenario |
| Issue-11 | `LogMessage` | (logging module) | Cross-module Run Server Action | `AllExceptions.ExceptionMessage`, `ModuleName` | none | Logs unhandled exceptions |

---

## 11. Database / Entity Update Mapping

| Entity | Field(s) updated | By | When |
|---|---|---|---|
| `Policy2` | `PolicyStatus = "BOUND"`, `UpdatedOn`, `UpdatedBy` | `IE_Policy_CS\UpdatePolicyStatus` | Bind |
| `Policy2` (indirectly, policy number) | Policy number field, populated via `CreatePolicyNumber_HB` | `IssuePolicyHB_BL` | Issue |
| `PolicyPaymentTransactionStructure` (Payment/Transaction entity) | New row: `Id (new)`, `PaymentDate = CurrDate()`, `IsPaid = False`, `CreatedOn`, `PolicyPremiumId` | `Payment\FirstPaymentTransaction` | Issue |
| Commission detail entity (`HBIScommissiondetails`) | Created/updated per commission line | `HB\CreateorUpdateHBIScommissiondetails` | Issue |
| `PolicyTransaction` | New row: `PolicyNumber`, `EffectiveDate`, `ExpirationDate`, `TransactionType`, `TransactionEffectiveDate = CurrDate()`, `Status = "ACTIVE"`, `MainPolicyId`, `RedirectionPolicyId`, `CreatedOn`, `CreatedBy`, `IsShowInTimeline` | `PolicyTransaction\CreatePolicyTransaction` | Issue |
| Prior `Policy` (rewrite scenario only) | Cancelled status (exact field not opened further — implementation lives fully inside `MakePriorPolicyCancelled_HB`) | `CancelRewrite\MakePriorPolicyCancelled_HB` | Issue (rewrite path only) |
| Policy document/package storage | New generated document package saved | `GenerateAndSaveNewBusinessPolicyPackage` (async) | Issue |
| Mortgagee/Lender external system | Notified via async process with LenderDock JSON payload | `Process\Notify_MortgageBillLenderDock` | Issue (Dwelling-covered mortgage records only) |

---

## 12. Status Transition Mapping

| Action | Entity | Prior state (implied) | New state |
|---|---|---|---|
| Bind | `Policy2.PolicyStatus` | anything `<> "BOUND"` (button only enabled in that case) | `"BOUND"` |
| Issue | `PolicyTransaction.Status` (new record) | n/a (new row) | `"ACTIVE"` |
| Issue (client-side event) | `OnStatusChange` trigger param `PolicyStatus` | — | `"ACTIVE"` (broadcast to parent UI) |
| Issue, rewrite scenario | Prior policy | active/bound | cancelled (via `MakePriorPolicyCancelled_HB`) |

**Note:** the inspected flow did not show `IssuePolicyHB_BL` writing a `Policy2.PolicyStatus = "ACTIVE"` field directly the same way Bind writes `"BOUND"` — the `"ACTIVE"` value was observed on the newly created `PolicyTransaction.Status` field and on the `OnStatusChange` event parameter. See Open Questions.

---

## 13. What Happens After Bind

**Frontend:**
- Success message shown: "Renewal quote bound successfully." (Success type)
- `OnStatusChange` event fired with `PolicyStatus = "BOUND"`, allowing parent containers to react (e.g. re-enable/disable other buttons based on new status)
- A local `Refreshblock` boolean is toggled to force any bound UI elements to re-render
- The browser navigates to `MainFlow\NewSubmission` with an AES-encrypted policy ID as the navigation key and `CurrentStep = 4` (returns the user to/refreshes the Finalize Quote step of the wizard)

**Database:**
- `Policy2.PolicyStatus` set to `"BOUND"`
- `Policy2.UpdatedOn` / `Policy2.UpdatedBy` stamped

---

## 14. What Happens After Issue

**Frontend:**
- `IsIssueLoading` flips to `True` during processing (spinner shown on the Issue button via `Utilities\ButtonLoading`), then back to `False` once complete
- `IsSuccessPopup` is set to `True` (a success popup/modal, implemented outside this block, is expected to display)
- `StartCountdown` client action begins a countdown (likely to auto-dismiss the popup or auto-navigate; the countdown's own implementation is outside the Bind/Issue scope of this document)
- `OnStatusChange` event fired with `PolicyStatus = "ACTIVE"`
- `Refreshblock` toggled and `Client.IsRestrictNavigation` reset to `False`
- No direct page navigation is issued at the end of `IssueOnClick` (unlike Bind)

**Database:**
- Policy number generated and stored (`CreatePolicyNumber_HB`)
- New `PolicyPaymentTransactionStructure` row created (`IsPaid = False`, awaiting payment processing)
- Commission detail rows created/updated
- New `PolicyTransaction` row created with `Status = "ACTIVE"`
- Policy document package generated and saved (asynchronously, tracked via `DocumentProcessId`)
- Mortgagee/lender billing system notified asynchronously (for Dwelling-covered mortgage records)
- If the policy is a rewrite: the prior policy is marked cancelled

**Document/number generation confirmed:** Yes — both the policy number (`CreatePolicyNumber_HB`) and the policy document package (`LaunchGenerateAndSaveNewBusinessPolicyPackage`) are generated as part of the Issue flow.

---

## 15. Success / Error Messages (verbatim, as found)

| Context | Type | Message |
|---|---|---|
| Bind success | Success | "Renewal quote bound successfully." |
| Issue — commission not configured | Error | "A commission schedule and valid percentage is not configured for this Intermediary. Please contact Hudson Bailey to add the state to the Intermediary's licensing schedule or transfer the policy to a licensed intermediary/producer." |
| Issue — missing Responsible Party | Validation | "Provide Responsible Party to continue" |
| Issue — missing Payment Frequency | Validation | "Provide Payment Frequency to continue" |
| Issue — Payment Frequency must be Annual for Mortgagee | Validation | "Payment Frequency should be Annual when Responsible Party is Mortgagee" |
| Issue — Lender Dock validation error | Error | Dynamic — `ValidateLenderDockDetails.ErrorMessage` (exact text returned by the external service, not a static literal) |
| Issue — no Mortgage Information for Mortgagee | Validation | "Responsible Party cannot be Mortgagee when no Mortgagee Information records exist in the qu[ote]" (message field was truncated in the field editor; text confirmed up to "...exist in the qu" and is very likely "...exist in the quote.") |
| Issue success | (no static message found) | UI relies on `IsSuccessPopup = True` rather than a `Message`/notification node; the actual popup text lives in the popup component itself, which is outside Bind/Issue scope |

---

## 16. Exception Handling

| Action | Handler | Abort Transaction | Log Error | Result on exception |
|---|---|---|---|---|
| `BindOnClick` / `UpdatePolicyStatus` chain | *Not found in inspected flow* — no explicit exception handler node was seen inside `BindOnClick` or `IE_Policy_CS\UpdatePolicyStatus` | — | — | Not found in inspected flow |
| `IssuePolicyHB_BL` | `AllExceptions` (Exception Handler, Exception = All Exceptions) | **Yes** | **Yes** (`LogMessage(AllExceptions.ExceptionMessage, "IE_Policy_BL")`) | `IsSucess = False` returned; entire DB transaction for the issue operation is rolled back |
| `MakePriorPolicyCancelled_HB` failure (rewrite path) | Handled via explicit `If MakePriorPolicyCancelled_HB.IsSucess` check (not a try/catch exception handler) | n/a | n/a | `IsSucess = False` propagated, even though earlier steps in the same transaction may have already run (see Open Questions re: whether this is also covered by the outer `AllExceptions` abort) |

---

## 17. Screenshot / Visual Reference Callouts

Screenshots could not be persisted to disk in this session (the screenshot tool's save-to-disk had no effect). The following are descriptive callouts of the key screens/panels that were visually inspected in Service Studio during this investigation, in place of image files:

1. **FinalizeQuote_HB canvas, action bar** — showing the "Lock Submission" toggle, greyed-out **Bind** button, and **Issue** button (with loading-spinner icon) side by side, above the Fees/Total Premium summary row.
2. **Bind button — Properties panel** — `Enabled = GetPolicyDetails.PolicyInfo.Status <> "BOUND"`, `Events > On Click = BindOnClick`.
3. **Issue button — Widget Tree drill-down** — `Container → Utilities\ButtonLoading (IsLoading=IsIssueLoading) → Button (Placeholder) → Button (OK)`, with the innermost real `Button`'s Properties panel showing the full `Enabled` boolean expression and `On Click = IssueOnClick`.
4. **`BindOnClick` client action canvas** — linear flow: Start → Assign → Run Server Action (`UpdatePolicyStatus_BL`) → Run Client Action (`SaveOnClick`) → Trigger Event (`OnStatusChange`) → Assign (`Refreshblock`) → Success Message → Run Client Action (`AESEncrypt`) → Destination (`MainFlow\NewSubmission`).
5. **`IE_Policy_CS\UpdatePolicyStatus` canvas** — Start → Aggregate (`GetPolicy2ById`) → Assign (`Policy2.PolicyStatus`, `UpdatedOn`, `UpdatedBy`) → Run Server Action (`UpdatePolicy2`) → End.
6. **`IssueOnClick` client action canvas (validation section)** — chain of `If` decision diamonds and red exception/message icons for commission %, Responsible Party, Payment Frequency, Lender Dock validation, and Mortgage Information checks, all converging to a shared `End` node.
7. **`IssueOnClick` client action canvas (main sequence)** — `IsIssueLoading = True` → `IssuePolicyHB_BL` → `CheckIfPolicyIsCancelRewrite_BL` → branching Assigns → `RefreshClientVariable` (JS) → `IsSuccessPopup = True` → `OnStatusChange` (PolicyStatus="ACTIVE") → `StartCountdown` → `IsIssueLoading = False` → final Assign → End.
8. **`IssuePolicyHB_BL` canvas (IE_Policy_BL module)** — annotated with "This Action was automatically generated from 'IssueOnClick', using 'Extract To Action'." Shows: `CreatePolicyNumber_HB` → `PolicyNumber` assign → For-Each loop over Mortgage Information with nested `CoveredAsset = "Dwelling"` check → `JSONSerializeLenderDockInfo` → `FirstPaymentTransaction` → `CreateorUpdateHBIScommissiondetails` → Output Variables → `GetUserClientID` → `LaunchGenerateAndSaveNewBusinessPolicyPackage` → `DocumentProcessId` assign → final Assign (`IsSucess=True`) → `CreatePolicyTransaction` → End; plus a parallel `CheckIfPolicyIsCancelRewrite.IsRewritePolicy` branch calling `MakePriorPolicyCancelled_HB`; plus a top-right `AllExceptions → LogMessage → IsSucess=False → End` exception chain.

---

## 18. Open Questions

1. The Issue button's `Enabled` expression is scoped tightly to the Mortgagee + Annual + HB-Producer scenario (`GetPolicyRiskInfoStatus.Status = "APPROVED" and not GetMortgageInformationDwelling.MortgageInformationList.Empty and PaymentFrequency = "ANNUAL" and ResponsibleParty = "MORTGAGEE" and CheckRole.Is_HBProducer`). No broader/alternate Enabled rule for non-Mortgagee issue scenarios was found on this widget — it is unclear whether Issue is ever enabled outside this specific combination, or whether a different widget/state handles the general case. Not found in inspected flow.
2. The precise origin point (source node) that branches into the `CheckIfPolicyIsCancelRewrite.IsRewritePolicy?` / `MakePriorPolicyCancelled_HB` sub-path inside `IssuePolicyHB_BL` was not conclusively identified on the canvas (the branch is visually separate from the main linear sequence). Its logic was fully inspected and documented in §4.3, but its exact entry point in the control flow graph is unconfirmed.
3. The exact field(s) changed on the "prior policy" by `MakePriorPolicyCancelled_HB` (e.g., which entity, which status field, "CANCELLED" literal or otherwise) were not opened — this server action lives in the `CancelRewrite` module folder and was not drilled into further, as it falls outside the strict Bind/Issue button scope.
4. No entity was observed being directly set to `Policy2.PolicyStatus = "ACTIVE"` during Issue in the flows inspected; `"ACTIVE"` was only observed on the new `PolicyTransaction.Status` field and the `OnStatusChange` event parameter. Whether/where the parent `Policy2` (or equivalent) status field itself is updated to reflect "Issued/Active" was not found in the inspected flow — this may happen inside `IssuePolicyHB_BL`'s `CreatePolicyNumber_HB` or another nested action not fully expanded, or inside document generation, and would require further tracing beyond the Bind/Issue scope.
5. The full parameter list and exact semantics of `ValidateLenderDockDetails` (e.g., `PROVIDER`, `WHIDHVERSION`, `WHIDHTEST`, `WSENDERORGNAME`, `WSENDEREIN`, `WSENDERELIT`, `WDATADATE`) were only partially visible before the parameter list was cut off; the acronym suggests an external lender/mortgagee document exchange integration, but its target system/API was not identified. Not found in inspected flow.
6. The exact success-popup UI (triggered by `IsSuccessPopup = True` and `StartCountdown`) is implemented outside `FinalizeQuote_HB`'s client actions and was not opened, per the strict Bind/Issue-only scope of this task.
7. Whether `IssuePolicyHB_BL`'s internal exception handling (`AllExceptions`, Abort Transaction = Yes) also covers/rolls back the `MakePriorPolicyCancelled_HB` rewrite branch, or whether that branch's failure is handled independently of the outer abort-transaction guarantee, was not conclusively confirmed from the canvas layout alone.
8. The full field-by-field content of the `InputForLenderDock` record (beyond `CLIENTID`, `WDUEDATE`, `WINSUREDNAME1`, `WPREMADDR1`) was visible but not exhaustively enumerated, as the assign node contained many additional fields beyond what fit in the properties panel during inspection.
