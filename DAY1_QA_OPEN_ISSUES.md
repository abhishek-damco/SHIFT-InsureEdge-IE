# Day-1 QA Analysis — Open Issues

> **Status as of 23-Oct-2026.** Follow-up to *IE H&B SHIFT 1st Day Analysis* (Abhishek Ojha, 21-Oct-2026).
> Fixes are on branch `deployment-render` (uncommitted at time of writing). Everything below is **not done**, **needs a deploy step**, or **needs QA sign-off**.
> Companion: `CLIENT_MANAGEMENT_OPEN_ISSUES.md`.

---

## 1. Deploy actions required (fixes won't show in QA without these)

| # | Action | Why |
| --- | --- | --- |
| A1 | Run `Backend/db/046_distribution_detail_tables.sql` on QA | **D1-32 / D1-33.** The intermediary/producer address and Non-Resident State tables only existed in an EF migration that is never applied, so every view-mode read returned 500. |
| A2 | Run `Backend/db/045_client_secondary_contacts.sql` on QA | Client Management CM-05/08/12 (see the companion file). |
| A3 | Add a `VITE_GOOGLE_MAPS_API_KEY` secret and pass it to the frontend build | **D1-03.** Vite reads the key at build time; neither CI nor Render sets it, so Google Address Search is disabled everywhere. |
| A4 | Resolve the merge conflict in `.github/workflows/deploy.yml` | The file contains unresolved `<<<<<<<`/`>>>>>>>` markers from before this work. When resolving it, add `env: VITE_GOOGLE_MAPS_API_KEY: ${{ secrets.VITE_GOOGLE_MAPS_API_KEY }}` to each "Build frontend" step. |

---

## 2. Not started — need a screenshot or repro steps (QA Q9)

| ID | Module | Issue | What's needed |
| --- | --- | --- | --- |
| D1-06 | Q&P | "Invalid error" | Screen and field. (May have been D1-04: errors not clearing after Google fill, which is now fixed.) |
| D1-13 | Q&P grids | Cancel button UI broken | Screenshot |
| D1-14 | Q&P grids | Bulk-upload template doesn't work as expected | Steps, plus expected vs actual |
| D1-15 | Q&P grids | Drop-down fields have no values | Which drop-downs, and where their values should come from |
| D1-17 | Q&P grids | Pagination UI broken | Screenshot |
| D1-26 | Claims | Unexpected error | Steps to reproduce |

---

## 3. Defaults applied — need QA / PO confirmation

| QA # | Default implemented | Where to change |
| --- | --- | --- |
| Q1 | Failed login shows **"Invalid username or password"** (never says which is wrong) | `Frontend/src/pages/LoginPage.tsx` |
| Q2 | Unchecking Enter Address Manually **still asks for confirmation** (it clears the address), now in the standard centred modal: "No, Keep It" / "Yes, Continue" | `NewSubmission.tsx` (search `D1-02`) |
| Q3 | Delete success message: **"Record deleted successfully"** | `NewSubmission.tsx` (search `D1-12`) |
| Q4 | "Business" = the Quotes & Policies **Business** branch; it is **hidden**, and its URLs redirect to Individual | `QuotesPoliciesLandingShell.tsx`, `App.tsx` |
| Q5 | Date of Birth valid from **01-01-1900 to today** (no minimum age) | `UserForm/index.tsx` → `validateUser` |
| Q6 | Works Remotely **starts unselected and is required** | `UserForm/index.tsx` |
| Q7 | Reports To is **required only when Is a Manager = No** | `UserForm/index.tsx` → `validateUser` |
| Q8 | "Lenience" = **License**. Intermediary License **and** Producer PL/CL/Combined licenses are now **optional, letters + digits, max 10**. This reverses the earlier "exactly 10 digits" rule. | `ProducerLicenseInput.tsx`, `ProducerLicenseValidator.cs` |

---

## 4. Verification still outstanding

- [ ] **Browser walkthrough** of every fixed item. Typecheck, build, unit tests and API checks pass; the UI has not been clicked through.
- [ ] **D1-25 with a real producer account in the Producers group.** Verified locally: a producer gets 403 (from the new filter) on Users, Groups, Client Management and Distribution writes, and can still read Distribution lists. Dashboard and Claims access depends on the existing group screen permissions.
- [ ] **D1-33:** after A1, save an intermediary/producer address and contact, then confirm View mode shows them.
- [ ] **Regression:** Client Management, Distribution and User forms all share `Frontend/src/utils/fieldValidation.ts` and the `AddressFields` component.

---

## 5. Side effects worth telling QA about

- **Login:** a failed login no longer reloads the page (the old 401 handler wiped the message).
- **New Submission validation:** Next/Save now also checks Address Line 1 (non-producers), the Zip/Postal format, and Telephone/Email/Extension format when filled. County, Zip and Lat/Long follow the same editability as the other address fields (they were locked for producer logins).
- **Producers:** the backend blocks non-allowed modules globally (`ProducerModuleRestrictionFilter`); the menu and routes hide them too.
- **Distribution:** products are assigned to a real Client Management company. With no companies, "+ Add Product" is disabled and the list shows "No Data Available". Rows saved earlier under the hardcoded company `1` won't appear under any company.
- **`intermediary_contact`:** the EF mapping now uses the `email` / `alt_telephone_number` columns from 042, the same ones the DisburseCloud job reads.
- **Local only (not a code issue):** `GET /api/users` returns 500 locally because `SMTP_HOST` isn't set in `Backend/.env`.

---

## 6. Suggested prompt to resume

> Continue the Day-1 QA work using `DAY1_QA_OPEN_ISSUES.md`. I've attached screenshots/steps for [D1-xx]. Reuse `Frontend/src/utils/fieldValidation.ts` for any validation. Tell me which files you'll change before changing them.
