# User Management — Open Issues

> **Status as of 28-Oct-2026.** Follow-up to *User Management Analysis Report* (Abhishek Ojha, 28-Oct-2026).
> Fixes are on branch `deployment-render` (uncommitted at time of writing). Everything below is **not done**, **partly done**, or **needs QA sign-off**.
> Companions: `USER_GROUP_OPEN_ISSUES.md`, `DAY1_QA_OPEN_ISSUES.md`, `CLIENT_MANAGEMENT_OPEN_ISSUES.md`.

---

## 1. Deploy steps (required)

Run on each environment's database, in order. Both are idempotent.

| Script | What it does |
| --- | --- |
| `Backend/db/047_rights_screen_cleanup.sql` | Adds `app_screen.is_visible`; merges Add/View grants into the **Landing Page** rows; hides the Add/View and Business rows; renames the landing rows; adds **Policy Summary** (seeded from each group's Policies grants). |
| `Backend/db/048_canada_reference.sql` | Adds country **Canada** and its 13 provinces and territories. |

**Deploy the API and run 047 together.** The Intermediary/Producer APIs now check `DISTRIBUTIONLANDINGPAGE` instead of `DIST_ADDINTERMEDIARY`. Until 047 has merged the grants, a group with only the old Add Intermediary rights would get 403.

## 2. Not done: needs screenshots or answers

| ID | Issue | What's needed |
| --- | --- | --- |
| UM-05 | Drop-down UI differs from OutSystems | Q8 screenshot. Done so far: the Gender and Reports To drop-downs on the User form now use the same searchable drop-down as the rest of the form. Anything else needs the screenshot. |
| UM-12 (2) | Country drop-down UI | Same as UM-05. |
| Q1 | Which three findings are High | Report doesn't say. |

## 3. Defaults applied: need QA / PO confirmation

| QA # | Default implemented |
| --- | --- |
| Q2 (UM-04 vs D1-21) | Works Remotely now defaults to **No** (this report wins over D1-21). |
| Q3 (UM-06) | Read Only / All Access are switches. Turning one off **clears** that module's checkboxes. A switch shows as on only when every screen in the module matches it exactly. |
| Q4 | Only User Groups, User and Distribution Management were reduced to one Landing Page row. Client Management already had one row; Claims and the others keep their rows. |
| Q5 (UM-07) | The accordion stays **Quotes & Policies**. Its rows show under an **Individual** sub-heading: New Business Quote, Endorsement Quote, Renewal Quote, Policies, Policy Summary. |
| Q6 | The User form keeps its checkbox accordion. Group Rights keeps its cards with switches (UGM-09). Both use the same switch control. |
| Q7 (UM-15) | The duplicate-phone rule applies to User Management, Client Management contacts and the New Submission contact / Named Insured / Organization forms. It's enforced on the server for Users and Client contacts. The Client Management message changed from "Telephone and Alternative Telephone must be different" to the standard wording. |
| UM-11 | Tooltip text has no trailing period, matching the Q8 decision from User Group. |
| UM-12 (6) | "Same as Office Location" checked with no Office Location shows **Provide Office Location to continue**. Changing the Office Location while the box is ticked fills in the new office's address. |
| UM-12 County | County is shown (optional) for the United States and hidden for Canada. |
| UM-13 | Continue keeps the Country and clears every other address field. |

## 4. Side effects worth telling QA about

- **Rights screens (User, Group Rights, Intermediary Assign Rights):**
  - Add/View rows and the four Business rows are no longer listed. Their old grants were folded into the Landing Page row (OR of the flags).
  - Saving a group or user from now on drops the hidden rows' grants, which is harmless because nothing checks them except the Business renewal path (Business is out of scope for H&B, per D1-16).
- **Policy Summary** is a new grantable screen. Nothing enforces it yet.
- **Shared address component** (Client Management, Distribution, User):
  - Latitude/Longitude are disabled until Enter Address Manually is ticked.
  - Unticking asks for confirmation.
  - Address Line 1/2 are capped at 500 and City/County at 50 by default.
- **New Submission:** the uncheck pop-up uses the same wording and buttons (**Cancel / Continue**, replacing "No, Keep It / Yes, Continue").
- **Server-side:** user create/update rejects Address Line > 500, City/County > 50, and identical Telephone / Alternative Telephone (400 with the standard message).
- **User listing:** columns can be dragged to reorder (UM-02), shared with the Group listing via `hooks/useColumnOrder.ts`. The order isn't saved between visits.
- **Local dev:** `Backend/.env` has `SMTP_HOST=` blank, so Users and Intermediaries return 500 locally (`SmtpEmailService` throws on construction). Not related to these changes. Set SMTP values, or start the API with `-- --SMTP_HOST=localhost --SMTP_USERNAME=dev --SMTP_PASSWORD=dev`.

## 5. Verification

- [x] `dotnet test`: 164 pass, including the new `UserValidatorTests`.
- [x] `tsc` and `npm run build`.
- [x] 047/048 applied locally, and the merge was checked (Administrators' Add/View Intermediary grants are on the Landing Page row).
- [x] API:
  - `/reference/modules` shows Landing Page ×3 and Policy Summary, with no Add/View or Business rows.
  - Canada returns 13 provinces.
  - `/intermediaries` returns 200.
  - Duplicate phones, a 501-character address and a 51-character city each return 400 with the standard message.
- [ ] Browser walkthrough:
  - DOB picker
  - Works Remotely default
  - rights switches, search, tooltip
  - US default, County shown and hidden for Canada
  - uncheck pop-up Cancel / Continue
  - Same as Office fill
  - phone messages
  - column drag on the User list
  - regression on Client Management address and Group Rights
