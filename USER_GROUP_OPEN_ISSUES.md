# User Group Management — Open Issues

> **Status as of 27-Oct-2026.** Follow-up to *User Group Management Analysis Report* (Abhishek Ojha, 26-Oct-2026).
> Fixes are on branch `deployment-render` (uncommitted at time of writing). Everything below is **not done**, **partly done**, or **needs QA sign-off**.
> Companions: `DAY1_QA_OPEN_ISSUES.md`, `CLIENT_MANAGEMENT_OPEN_ISSUES.md`.

---

## 1. Not started — blocked on OutSystems screenshots / answers

| ID | Issue | What's needed |
| --- | --- | --- |
| UGM-10 | `+ Add User` button and "Add User To Group" pop-up | Q1: the pop-up's fields, search, selection and save behaviour. Held back by decision on 27-Oct. Today, members are still added by typing in the search box and ticking users. |
| UGM-07 | KPI tile icons (Total, Inactive) | OutSystems icon names or assets. Change in `Frontend/src/components/StatCards/StatCards.tsx` (shared by the User and Group listings). |

## 2. Partly done

| ID | Done | Still open |
| --- | --- | --- |
| UGM-09 | Card per module with its own header row; Read Only / All Access are toggle switches (Add page); modules ordered by `module.sort_order` (Add **and** detail pages) | **Disabled permissions per screen** (e.g. Clone/Download on Quotes & Policies) need the module × permission matrix (Q3). Confirm `sort_order` matches the OutSystems order (Q2). The **detail page's** Group Rights editor (`GroupDetailPage.tsx`, `GroupRightsPanel`) still uses its own table layout. |
| UGM-05 / 03 / 04 | Shared filter `Frontend/src/components/grid/ColumnFilter.tsx` used by **User Management** and **User Group Management**. Filters now cover every page, not just the visible 10 rows. | About 13 other grids still have their own copy of the filter pop-up (one condition, current page only). Each needs moving onto the shared component, with a QA regression pass: AdjusterManagement, ClaimsAuthority, ClaimsAuthorityAddUser, ClaimsEnquiry, ClaimsLetterTemplate, ClaimWorkflow, FNOLReg, PayeeList, Billing PolicyPayments, Distribution index, AssignProducts, Q&P GridHelpers, NBQuotesRegister. |
| UGM-18 | Add page: warning with Stay Here / Yes when anything has been entered; straight back to the list when untouched | The detail page's inline-edit Cancel still discards without a prompt (message wording for edit mode not specified). |
| UGM-02 | Drag-to-reorder column headers on the **Group** listing (kept for the session) | Not on the User listing or other grids. Order isn't saved between visits. |

## 3. Defaults applied — need QA / PO confirmation

| QA # | Default implemented |
| --- | --- |
| Q4 | Group Name: typing stops at 75. Disallowed characters (anything but `A–Z 0–9 space - & . ' /`) show **"Provide valid Group Name to continue"** on Save. |
| Q5 | Group Leader stays a drop-down of active users. |
| Q6 / Q9 | Group Email ID and Group Description are **optional**. A filled-in email must be a valid format (**"Provide valid Group Email ID to continue"**), max 50. Description, when filled, must be 5–1000 characters. |
| Q7 | Full-page form cancel uses **Stay Here / Yes**; pop-ups keep the standard No, Keep It / Yes, Cancel It. |
| Q8 | Messages have **no** trailing period. |
| UGM-06 | Download menu items download the **ticked rows** when any are ticked, otherwise every row (the old menu had separate "Export Selected" items). |

## 4. Side effects worth telling QA about

- **Server-side limits tightened:** create/update now reject Group Name > 75 or with disallowed characters, Email > 50 or invalid, and Description of 1–4 or > 1000 characters (was 200 / 500). An existing group whose name breaks the new rule can't be saved until the name is fixed.
- **Error icon:** `.error-msg` (global CSS) now shows a red "!" icon. Also visible on Onboarding Setup and Password Reset Confirm.
- **Empty grids** now say "No Data Available" on Billing Make Payment, Claims Authority (+ Add User), Claims Enquiry, Claims Letter Template, Claims Master Config Edit, Claims Module, Claim Workflow, Claims Dashboard and New Submission grids, as well as the User and Group listings.
- **Module order** in Group Rights now follows `module.sort_order` (EF now maps `Module.DisplayOrder` to that column).
- Removed the unused `Frontend/src/pages/UserManagement/ColumnFilter.tsx` (superseded by the shared component).

## 5. Verification still outstanding

- [ ] Browser walkthrough: filters (both tabs, And/Or, Clear, Cancel) with more than 10 groups/users; column drag; Download menu; Add form errors clearing live; Cancel warning; Group Rights cards and toggles; tooltip.
- [ ] Verified so far: backend unit tests (151 pass, incl. new `GroupValidatorTests`), `tsc`, `npm run build`, and API checks (create/update return the new messages; screens come back in `sort_order`).
