# Quotes & Policies — Open Issues

> **Status as of 29-Oct-2026.** Follow-up to *Quotes & Policies Analysis Report* (Abhishek Ojha, 29-Oct-2026).
> Fixes are on branch `deployment-render` (uncommitted at time of writing). Everything below is **not done**, **partly done**, or **needs QA sign-off**.
> Companions: `USER_MANAGEMENT_OPEN_ISSUES.md`, `USER_GROUP_OPEN_ISSUES.md`, `DAY1_QA_OPEN_ISSUES.md`, `CLIENT_MANAGEMENT_OPEN_ISSUES.md`.

---

## 1. Root cause of most High items

A Producer's new quote got the wrong role and quote flags, so most of New Submission was disabled:

1. **`isHBProducer` was never saved with a new quote.** Whichever of the submission load and the "who am I" producer lookup finished last decided the flag, and it often ended up `false`. The Producer was then treated as a Client Admin with HexCat not Approved. Fixed in `NewSubmission.tsx`:
   - `handleCreate` now saves the flag.
   - The load forces it to `true` when the logged-in user is a producer.
   - This fixes QP-12, 13, 16, 17, 18, 22, 25 and 26.
2. **Every Quick quote was treated as bulk-uploaded.** Fixed:
   - The load-time rule `isQuickQuote ⇒ isBulkUploaded` is removed.
   - `StepRiskInfo` now reads `form.isBulkUploaded` only. Bulk upload already saves its own `isBulkUploaded: true` (`BulkUploadService.cs`).
   - This fixes QP-28.

**Existing drafts** keep `isHBProducer=false` in their saved JSON. The load-time override corrects them when a Producer opens them.

## 2. Deploy steps

None. No SQL scripts; only API and frontend changes.

## 3. Not done: blocked

| ID | Issue | What's needed |
| --- | --- | --- |
| QP-29 | Producer can go past Limits & Coverages before approval | **Deferred (decision 29-Oct).** No quote-approval workflow exists: nothing sets HexCat status to Approved. Gating navigation now would block every Producer quote. Needs Q7: who approves, how, and how the Producer resumes. |
| QP-02 | KPI icons differ from OutSystems | Partly done: icons are no longer faint (opacity 0.18 → 0.85). Same icons/colours as OutSystems need the icon assets (same as UGM-07). |
| QP-17/18/23/24 | Add Named Insured / Add Organization / Add Location pop-ups, Location card | The existing modals and card are now reachable. Their **fields and layout** haven't been compared with OutSystems (Q5). |

## 4. Defaults applied: need QA / PO confirmation

| QA # | Default implemented |
| --- | --- |
| Q1 (QP-21) | **One app-wide name rule**: the Client Management rule `fv.isValidName` (max 50; letters, digits, space, `- ' .`, accented letters). Applies to First, Middle and Last Name on the primary insured, Add Named Insured, and Add Organization contact. The QP-21 character set (`@ &`, no digits) was **not** used. |
| Q2 | Invalid characters or over-length show **"Provide valid [Field] to continue"** on Save. Typing is not blocked. |
| Q3 (QP-07–09) | Type of Policy = Single, Type of Quote = Quick and Country = United States are locked for **every role**. |
| Q4 (QP-10) | Primary State is filtered **for Producer logins only**: the Intermediary's Resident State plus its Non-Resident States (`GET /auth/me/producer` → `states`). If there are none, the drop-down is disabled with "No states available for this Intermediary". Staff still see every state. Locally no intermediary has states saved, so filtering staff too would block every staff quote. |
| Q6 (QP-28) | The 13 coverage fields keep their pre-filled values as editable defaults. |
| Q8 (QP-05) | Pagination shows at **10 or more** records, as written (so exactly 10 records shows a one-page bar). |
| Q9 (QP-12) | Effective Date: any valid MM-DD-YYYY date (calendar picker), defaulting to today. No range limit. |
| Q10 (QP-15) | Brokerage Firm is locked for Producer logins; the value is the Producer's own Intermediary. |
| QP-20 | Organization Name, Doing Business As and the Named Insured DBA Name: max 75, any characters. |

## 5. Side effects worth telling QA about

- **Server-side:** `POST /api/submissions` returns 400 "Provide Primary State to continue" for a New Business draft with no state. Endorsement and renewal drafts from Policy Summary are unaffected.
- **Enter Address Manually** now starts unchecked on Policy Information (QP-14). An existing draft's address shows in the disabled fields until the box is ticked or Google search is used.
- **Location (QP-24):** with "same as Mailing Address" ticked (the default), the mailing address now appears as the location card as soon as the step opens.
- **Expiration Date:** the one-year default read MM-DD-YYYY dates as DD-MM-YYYY, giving wrong or blank dates. Fixed (`addOneYear`).
- **Actions panel (QP-06)** now shows on the New Submission landing (`?landing=1`). Both hamburgers (Actions panel, wizard sidebar) collapse the panel to a 52px strip.
- **Modify Columns Display (QP-04)** follows its header when the page or grid scrolls, scrolls internally past 320px, and has aligned checkboxes. The NB register now uses the shared `ColPanel` (`GridHelpers.tsx`), so Endorsement, Renewal and Policies get the same behaviour.
- **Pagination (QP-05):**
  - Applied to the shared `PaginationBar` (User Management, User Groups, Distribution, Adjuster, Claims Enquiry, Claims Module, Claim Workflow, FNOL, Payee list).
  - Applied to the four Q&P registers and the Additional Named Insured(s) / Organization(s) tables.
  - Grids with their own inline pagination elsewhere (Billing, Claims Authority, Claims Letter Template, etc.) are **not** changed yet.
- **Action column first (QP-19, QP-27):** done for Additional Named Insured(s), Additional Organization(s) and Mortgage Information. Other grids app-wide still need checking against the §2 standard.
- **State column (QP-03):** the NB and Endorsement lists fall back to `policy.state_province` when a quote has no `policy_product` row (for example, bulk uploads).

## 6. Verification

- [x] `tsc`, `npm run build`, `dotnet build`, `dotnet test` (177 pass).
- [x] API:
  - New Business create with an empty state → 400 with the standard message.
  - `/auth/me/producer` for staff → `null` producer (all states).
  - NB quote list → 200.
- [ ] **Producer login, end to end.** There is no producer-linked user in the local DB (`user.producer_id`), so the Producer path hasn't been clicked through. In QA, log in as a Producer and check:
  - Landing: defaults locked, states filtered, Create errors.
  - Policy Info:
    - Effective Date picker, Brokerage Firm locked
    - Contact Details enabled, Google search on by default
    - Add Named Insured / Add Organization, Action column first
    - name and length errors
  - Location card, then unticking enables + Add Location.
  - Risk: Flood drop-downs, Mortgage + ADD.
  - Limits: all 13 fields editable.
  - Then continue to Finalize.
- [ ] Listing: hamburger collapse, State column, Modify Columns pop-up scroll and anchor, pagination hidden under 10.
- [ ] Regression:
  - A Client Admin on the same quote (rules unchanged).
  - A bulk-uploaded quote stays locked.
  - Endorsement and Renewal open.
  - The other `PaginationBar` grids.
