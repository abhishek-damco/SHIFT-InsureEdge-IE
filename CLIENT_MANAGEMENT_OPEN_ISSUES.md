# Client Management — Open Issues

> **Status as of 23-Oct-2026.** Follow-up to the QA *Client Management Field Validation Report* (Abhishek Ojha, 22-Oct-2026).
> CM-01 – CM-13 are implemented on branch `deployment-render` (uncommitted at time of writing). Everything below is **not done** or **needs a decision**.

---

## 1. Blockers — need input before work can start

| # | Blocker | Needed from | Unblocks |
| --- | --- | --- | --- |
| B1 | **No OutSystems reference** for the missing screens (QA report Q3). | QA / PO: screenshots, OML export or field spec | CM-14 – CM-19, §3 review |
| B2 | **No Add Client wizard exists.** The QA report tests "Add Client – Step 1 of 6", but the repo only has the *View Client* page (`Frontend/src/pages/ClientManagementPage.tsx`), which edits the logged-in tenant's own client via `/api/clients/me`. There is no create-client API. | PO decision: build a real wizard, or treat the View Client page as the target | CM-14 – CM-16 |
| B3 | **Reference screenshots missing** (QA report Q8). Layout has not been compared against OutSystems. | QA | Layout sign-off for all screens |

---

## 2. Missing screens — not started

All blocked by **B1**; CM-14 – CM-16 also blocked by **B2**.

| ID | Screen | Mode |
| --- | --- | --- |
| CM-14 | Step 2: Assign Client Rights | Add Client wizard |
| CM-15 | Step 5: Choose Subscription | Add Client wizard |
| CM-16 | Step 6: Review and Submit | Add Client wizard |
| CM-17 | Tab 2: Client Rights | View mode (after onboarding) |
| CM-18 | Tab 5: Subscription | View mode |
| CM-19 | Tab 6: Timeline | View mode |

Today the View Client page has 3 tabs (Client Information, Client Company Information, Client Company Products). The target is 6.

---

## 3. "Review validations" items — not started

QA §3D lists these as *Exists → Review validations*. The report gives no field-level spec for them.

| Screen | Current state |
| --- | --- |
| Step 3 / Tab 3: Client Company Information | `CompanyModal` still uses plain text inputs with no validation, apart from the Company Name required check. Only the logo type/size check and the standard delete wording were carried over from the CM work. |
| Step 4 / Tab 4: Client Company Products | Not reviewed. |
| Tab 1: Client Information | Done as part of CM-01 – CM-13. |

**Suggested approach once a spec exists:** reuse `Frontend/src/pages/ClientManagement/` (`validation.ts`, `ClientFormFields.tsx`, `AddressEditor.tsx`) and `Backend/src/InsureEdge.Application/Validation/ClientValidator.cs`. Company addresses and contacts use the same rules as the client's.

---

## 4. Defaults applied — need QA / PO confirmation

These open questions from the QA report were implemented with a default so work could proceed. Each one is a small change if the answer differs.

| QA # | Question | Default implemented | Where to change |
| --- | --- | --- | --- |
| Q1 | Is Registered Trade Mark mandatory? | **Not mandatory** | `validation.ts` → `validateClientInfo`; `ClientValidator.ValidateInfo` |
| Q2 | Is Telephone mandatory (Client Primary Info, Contact Details, Office Contact)? | **Not mandatory** | `validateClientInfo`, `validateContact` (FE + BE) |
| Q4 | "Same as Home Office": copy once or keep in sync? | **Copy once.** Mailing fields are locked while the box is checked; unchecking unlocks them and keeps the data. The flag is saved (`client_address.is_same_as_legal`). | `AddressSection` in `ClientManagementPage.tsx` |
| Q5 | Pop-up cancel confirm label: "Yes, Cancel It" or "Yes, Delete It"? | **"Yes, Cancel It"** | `ConfirmModal` in `ClientFormFields.tsx` |
| Q6 | Are address fields read-only unless "Enter Address Manually" is checked? | **Yes.** Note: this means editing an *existing* address also needs the box ticked (or a Google search) first. | `AddressFields.tsx` (`entryDisabled`) |
| Q7 | Should Zip messages say "Postal Code" for Canada? | **Yes** | `zipLabel()` in `validation.ts`; `ClientValidator` |

---

## 5. Verification still outstanding

- [ ] **Browser walkthrough of CM-01 – CM-13** on `/client-management`. The API was tested end to end with curl; the UI has only been type-checked and built, never clicked through.
- [ ] **CM-13** (office card + View / Edit / Delete): the QA item is literally "verify once offices can be saved", and it needs that browser check.
- [ ] **Google address search** inside the Client pages. It needs `VITE_GOOGLE_MAPS_API_KEY`; the dropdown styling for these pages was added under `.cm-scope` in `index.css`.
- [ ] **Regression check:** other screens that use `AddressFields` (Distribution: Intermediary / Producers, UserForm) should look unchanged. The new props are additive and default to the old behaviour.
- [ ] **Apply `Backend/db/045_client_secondary_contacts.sql`** to the QA and other shared environments. It has only been applied to local `insuredge` so far.

---

## 6. Side effects worth telling QA about

- **Phone country code:** a Canadian number is now saved with code `CA +1`; existing `+1` values are read as US.
- **Company tab:** its logo upload now enforces PNG/JPEG/GIF at 10 KB – 10 MB, and its delete dialog uses the standard wording. Both are shared components.
- **Server-side validation:** client info, address, contact and office saves now return `400 { error }` with the field message when the input breaks the §5 rules.

---

## 7. Suggested prompt to resume

> Continue the Client Management work in IE H&B SHIFT using `CLIENT_MANAGEMENT_OPEN_ISSUES.md`. I've attached the OutSystems reference for [screens]. Start with [CM-xx]. Reuse the helpers in `Frontend/src/pages/ClientManagement/` and `ClientValidator.cs`. Tell me which files you'll change before changing them.
