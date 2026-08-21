# InsureEdge — Version / Change Log

Running log of features and changes added to this codebase, on top of
whatever was already there. Everyone adds to this file when they add a
feature, fix a bug, or make a notable change — newest entry at the top.

## How to use this file

- **Add a new entry every time you push a feature or change** — new
  section at the top, above the most recent one, not at the bottom.
- One entry per logical change (a PR, a feature, a fix) — not one per
  commit.
- Keep entries short: what changed and why it matters, not a full diff.
- Use your name/initials and today's date so entries are attributable
  and mergeable.
- **Merging**: this file changes on almost every branch, so conflicts
  are expected. Resolve by keeping both sides' entries (newest on top,
  in whatever chronological order makes sense) — do not drop either
  side's entry to "resolve" the conflict.
- Areas: `Backend`, `Frontend`, `DB`, `Infra`/`DevOps`, `Docs`.

---

## 2026-07-18 — Pragya

**Area:** Backend + Frontend (Claims — Financials Worksheet; Distribution Management)

**Claims — Financials Worksheet fixes:**

- **Cause of Loss auto-fill**: Fixed `GetColLossLimitAsync` to read from `claim_coverage_limit` (where `asset_type IS NULL`) instead of `cause_of_loss_description` — now correctly returns both the loss limit and the cause of loss code so both fields auto-populate when a COL description is selected.
- **Impacted Asset limit parsing**: Fixed decimal parsing in `GetAssetDetailAsync` to strip commas before parsing (handles Indian-notation values like "2,00,000" in the DB).
- **Worksheet Save**: Created missing `ws_number_seq` PostgreSQL sequence; fixed EF Core child-entity tracking (reserves/payments built before `db.Add`); fixed `SqlQueryRaw<long>` column alias to `"Value"`; added proper error surfacing in `WorksheetController`.
- **Worksheet status**: New worksheets now default to `"Draft"` instead of `"Open"`.
- **Accumulated view UI**: Fixed layout to show gray filler column to the right of worksheet columns; fixed label column width (240 px); "Personal liabilities" row label now renders in blue.

**Distribution Management:**

- Replaced minimal read-only intermediary/producer endpoints with full CRUD — Create, Update, Delete for both Intermediaries and Producers, with auto-generated codes (`IM`/`PR` prefix), request/response DTOs, and client-scoped ownership checks.

**DB (new tables applied — run these scripts if pulling fresh):**
- `029_user_extended.sql` — `user_extended` table + backfill from `user`
- `032_notes.sql` — `note` + `note_file` tables (Policy Summary Notes)
- `quote_document` table (created directly — no script file)
- `renewal_notice` table (created directly — no script file)
- `034_grant_producers_group_permissions.sql` — Producers group permissions for `NBQUOTESSCREEN`
- `035_grant_producers_dist_permissions.sql` — Producers group permissions for `DIST_VIEWINTERMEDIARY`

---

## 2026-07-17 — Akansha

**Area:** Backend + Frontend (Policy Summary — Notes tab; DB test data; navigation fixes)

Built the Policy Summary page's "Notes" feature end-to-end (Add Note modal, list
display, edit/delete), fixed several Policy Summary navigation bugs found while
testing it, and diagnosed (not fixed) a pre-existing permission gap on Bulk Upload.

**Notes feature (new):**
- New `note`/`note_file` tables (`032_notes.sql`), ported from the given
  `Notes2`/`NoteFile` OutSystems entities — `AccessType` (Diary/Internal/External),
  both `PolicyId` and `AccountId` set, file bytes stored as `bytea`.
- `PoliciesController`: `GET/POST /api/{insuredType}/policies/{policyNumber}/notes`,
  `PUT/DELETE .../notes/{noteId}`, `GET .../notes/files/{fileId}` — multipart file
  upload, 10 KB–10 MB enforced server-side.
- Frontend: `AddNoteModal` (Notes Type radios, rich-text note body via the existing
  `RichTextEditor`, drag-and-drop/browse file upload with an attached-files list),
  `NoteCard` (Created By/timestamp, module badge, working edit + delete), shared
  `NotesSection` used by both the dedicated Notes tab and the embedded Notes card
  on the Summary tab.
- Verified end-to-end via a scripted round trip (create + attachment → list →
  download → edit → delete).

**Policy Summary navigation fixes:**
- Pending Transactions' eye icon pointed at the wrong id (the draft's own row id
  instead of its `QuoteNumber`), and Policy History's eye icon likewise used the
  wrong identifier — both now resolve correctly to `/quotes-policies/submissions/:id`.
- `GetByIdAsync` (`SubmissionRepository`) now falls back to synthesizing a
  Submission from the `Policy` row when no `Submissions` row exists (true for
  most directly-seeded/legacy policies) — previously the read-only submission
  view 404'd for those; picks the non-Draft policy sharing a PolicyNumber over
  an unrelated later draft.
- Policy Summary's embedded "Policy History" card now shows a "View All" button
  (only when >3 rows) linking to the full History screen, capped at 3 rows inline.
- Added Cancel Policy / Cancel-Rewrite Cancellation Effective Date min/max/initial
  rules (`IsPolicyPaid`-gated), matching the given `InitialDate`/`MinDate`/`MaxDate`
  formulas.

**Diagnosed, not fixed (reported to team):** Bulk Upload 403s because
`NBQUOTESSCREEN`/`POLICIESSCREEN` (and 2 related screen codes) have no row in
`app_screen` — `010_quotes_policies_schema.sql`'s seed insert for these 4 codes
never landed in the current DB, so `PermissionResolver` hard-denies everyone
regardless of group. Needs the missing seed re-run (and `021`'s backfill re-run
after) before Bulk Upload / other `POLICIESSCREEN`-gated screens will work again.

Files: `Backend/db/031_more_policy_history_for_testing.sql`,
`Backend/db/032_notes.sql`, `Backend/src/InsureEdge.Domain/Entities/{Note,NoteFile}.cs`,
`Backend/src/InsureEdge.Application/DTOs/QuotesPolicies/NoteDtos.cs`,
`Backend/src/InsureEdge.Application/{Interfaces/IPolicyQuoteRepository.cs,
Services/PolicyQuoteService.cs}`,
`Backend/src/InsureEdge.Infrastructure/{Data/InsureEdgeDbContext.cs,
Repositories/PolicyQuoteRepository.cs, Repositories/SubmissionRepository.cs}`,
`Backend/src/InsureEdge.API/Controllers/PoliciesController.cs`,
`Frontend/src/{api/quotesPolicies.ts, types/Policy.ts, pages/PolicySummaryPage.tsx}`

---

## 2026-07-17 — Ashika

**Area:** Backend + Frontend (Quotes & Policies — Renewal Quote complete, safe merge with Endorsement Quote)

Completed end-to-end Renewal Quote flow with field-level validation, prior policy prefilling, and comprehensive UI fixes, then safely merged with teammate's Endorsement Quote implementation without code loss or overwrites.

**Renewal Quote workflow (Phases 1-4):**
- Phase 1: End-to-end header display, UW Specific Change step (Step 3), field disabling for non-producers, prior policy prefilling (location/broker/producer merge from prior policy via `BuildRenewalFormDataJsonAsync`)
- Phase 2: Mandatory field validation with error messages displayed under input fields in format "Provide [Field Label] to continue"; comprehensive validateStep0/1/2/3/4 functions covering 14+ mandatory fields per step; error clearing on field change
- Phase 3: Toast notification styling fix — changed from full-width banner to compact centered notification (max-width 600px, centered via transform, smooth top-property animation replacing conflicting transform)
- Phase 4: Renewal policy detection — `SubmissionsController.GetById()` checks Renewal Policies FIRST before Submission table (order critical); checks `PolicyType == "RENEWAL"` OR `PolicyStage.Contains("RENEWAL")`; fetches prior policy if exists and merges into form data

**Safe git merge (Phase 4):**
- Remote branch contained Mukul's Endorsement Quote implementation: comparison cards for Prior/Change/Updated, `IssueEndorsementAsync`, new `getSubmissionIdByQuoteNumber` API endpoint
- Merged both implementations without overwrites: SubmissionService.cs kept both `BuildRenewalFormDataJsonAsync` (local) and `IssueEndorsementAsync` (remote) as independent methods; RenewalRegister.tsx used remote `openRenewal()` function calling new quote-number API
- Conflict resolution approved by user; both flows now fully functional in same codebase
- Build verification: backend `dotnet build` succeeded, frontend `npm run build` succeeded (5.08s)
- Regression testing: all three flows (New Business, Renewal, Endorsement) tested live and confirmed working

**Technical details:**
- `SubmissionService.BuildRenewalFormDataJsonAsync(renewalPolicy, priorPolicy)` merges renewal + prior location/broker data, returns JSON with isRenewal=true, renewalOfPolicyId, prefilled fields
- `SubmissionsController.GetById()` reordered to detect renewals before submissions, avoiding 404 and blank-form bugs
- `SubmissionsController.GetIdByQuoteNumber(quoteNumber)` resolves quote numbers to submission IDs (renewals/endorsements use quote numbers not submission IDs for register navigation)
- Form data merge fixed: changed from `data.form || {}` to `data.form || data` to handle renewal policies without nested form property
- Renewal detection: `const isRenewal = data.isRenewal === true || data.isRenewal === 'true';`
- Field disable logic: `const disableRenewalFields = isRenewalQuote && !isLoggedInUserProducer;`

**Critical bugs found and fixed:**
- Form data merging bug (CRITICAL): Renewal policies structured at top level without `form` property; old code only processed renewals inside `if (data.form)` block, causing validation never to run
- Mandatory field validation incomplete: validateStep0 expanded to comprehensively check all fields (firstName, lastName, organizationName, effectiveDate, policyTerm, insuredType, brokerageFirmId, producerId, country, state, city, zip, lob, subProduct, age65OrOlder)
- Toast animation jerky: CSS transform conflict (centering used translateX, animation used translateY); switched to top-property animation with initial `top: -100px` position

**Verified live end-to-end post-merge:**
- Renewal Quote: open renewal from Renewals register, validate mandatory fields (errors appear under fields), prefilled fields appear (location/broker/producer from prior policy), Save & Next blocked on validation failure
- Endorsement Quote: open endorsement from Endorsements register, comparison cards show Previous/Change/Updated amounts, Issue button works, prior policy marked Cancelled after issue
- New Business Quote: unaffected by changes, still works
- All toast notifications: compact centered display with smooth animation

Files: `Backend/src/InsureEdge.API/Controllers/SubmissionsController.cs`, `Backend/src/InsureEdge.Application/Services/SubmissionService.cs`, `Frontend/src/pages/QuotesPolicies/NewSubmission.tsx`, `Frontend/src/pages/QuotesPolicies/RenewalRegister.tsx`, `Frontend/src/index.css`

---

## 2026-07-15 — Mukul

**Area:** Backend + Frontend (Quotes & Policies — Endorsement Finalize Quote)

Added: Finalize Quote's Summary panel (Coverage Premium/Taxes/Fees/Total
Premium cards) now shows Previous Amount / Change in Amount / Updated
Amount for the endorsement flow, plus a reconciliation strip ("Updated
Amount − Previous Amount = Change in Premium") under Total Premium —
matching the OutSystems prototype's layout. New Business and Renewal
keep the existing single-value cards unchanged, since only endorsements
have a prior policy to compare against.

The premium formula (`calculatePlanAmounts`/`STATE_TAX`/
`getCoveragePremiums`, including the full 50-state tax table) only
exists on the frontend — rather than port it to C#, new endpoint `GET
{policyNumber}/endorsement-prior-premium`
(`GetEndorsementPriorPremiumFormAsync`, same prior-policy lookup as the
existing `endorsement-changes` endpoint) returns just the prior
policy's raw inputs (coverage level, state, deductible, endorsement
flags, policy fee). `StepFinalize` runs its own existing
`calculatePlanAmounts()` against those inputs, exactly like it already
does for the current draft — the formula stays in exactly one place.

Fixed along the way: change amounts now round to 2 decimals
consistently (`toLocaleString` needs `maximumFractionDigits`, not just
`minimumFractionDigits`, or floating-point subtraction leaks a 3rd
digit), and a decrease now shows in red / an increase in green
(previously always green regardless of sign).

Verified live against the real endorsement found earlier this session
(Submission `00004206358`, policy 18/`HB-2024-00003`, prior policy 3):
Total Premium correctly shows Previous USD 867.36, Change −USD 344.55,
Updated USD 522.81, with matching values on Coverage Premium/Taxes/
Fees and the reconciliation strip. New Business submission
`00004512577` confirmed still renders the original simple layout,
unaffected.

**Area:** Backend + Frontend (Quotes & Policies — Endorsement/Renewal registers)

Fixed: editing an endorsement quote (open it from the Endorsements
register, then edit and save) lost all the real draft data. Renewals
had the identical exposure, not yet hit in practice but fixed the same
way.

Root cause: `EndorsementListItemDto.Id`/`RenewalListItemDto.Id` are the
Policy's `QuoteNumber` (documented inline as `p.quote_number`), not the
Submission's own Id — those two values are independently generated for
endorsement/renewal drafts (only New Business has them equal by
construction, since `EnsurePolicyForSubmissionAsync` sets
`QuoteNumber = id` there). `EndorsementRegister.tsx`/`RenewalRegister.tsx`
navigated straight to `/quotes-policies/submissions/{quoteNumber}`,
which `NewSubmission.tsx` loaded as the Submission Id. `GET
/submissions/{quoteNumber}` 404'd, and the 404 handler only set
`notFound` when `readOnly` was set — in normal edit mode it silently
fell through to the blank default form. The next Save then called `PUT
/submissions/{quoteNumber}`, and `UpsertAsync`'s "no existing row"
branch created a **brand-new Submission whose Id was literally the
quote number**, seeded from the blank form — orphaning the real
Submission with no way back to it from the UI.

Fix: new endpoint `GET /submissions/by-quote-number/{quoteNumber}`
(`SubmissionRepository.GetSubmissionIdByQuoteNumberAsync`) resolves the
real Submission Id by scanning the client's Submissions and matching
`form.quoteNumber` inside each row's JSON (no relational link exists;
note `Submission.Data` is `jsonb`, so a LINQ `.Contains()` prefilter
fails at the SQL layer — Postgres has no `like_escape(jsonb, ...)`
overload — hence the full per-client scan). Both registers now resolve
through this endpoint before navigating. When more than one Submission
shares a `quoteNumber` (i.e. a phantom row already exists from this
bug), the lookup prefers whichever Id differs from the quote number
itself, since the phantom's Id is by construction identical to it.
Also hardened `NewSubmission.tsx`'s load-failure handling: a 404 now
sets `notFound` in both edit and read-only mode, instead of only
read-only, as a safety net against any future Id/QuoteNumber mixup.

Verified live: policy 18 (`HB-2024-00003`, quote `00004512578`) had
exactly this shape — a phantom Submission `00004512578` (blank fields,
wrong screenCode) and the real Submission `00004206358` (Patricia
Williams' correct data). Opening the endorsement from the register now
navigates to `00004206358` and loads the real data; before the fix it
opened `00004512578` and rendered blank fields.

Known follow-up, not yet done: the pre-existing phantom Submission row
`00004512578` (and possibly others created before this fix shipped)
still exists in the DB — the lookup routes around it but hasn't been
deleted.

**Area:** Backend (Quotes & Policies — Endorsement wizard)

Fixed: endorsement quotes were appearing in the New Business Quotes
register (with a working "Issue" button that shouldn't exist there),
instead of only in the Endorsements register.

Root cause: `EnsurePolicyForSubmissionAsync` and
`SyncPolicyFromSubmissionAsync` both resolved "the policy this
Submission belongs to" via `QuoteNumber == id || PolicyNumber == id`,
where `id` is the Submission's own randomly-generated Id. That's correct
for New Business (there, `EnsurePolicyForSubmissionAsync` deliberately
sets `QuoteNumber = id` on creation — same value by construction). But
an endorsement's real `Policy` draft is created up front by
`CreateEndorsementDraftAsync` with its own independent, sequential
`QuoteNumber` — never equal to the Submission's Id. So every time an
endorsement's Submission was saved:
- `EnsurePolicyForSubmissionAsync` found no matching policy and
  silently created a **phantom second `Policy` row**, type
  `NEWBUSINESS`, status `Draft`, `PolicyNumber = QuoteNumber =` the
  Submission's Id — this is the row that leaked into the New Business
  listing.
- `SyncPolicyFromSubmissionAsync` also found no matching policy, so
  wizard field edits silently never reached the real draft `Policy`
  row via this path either.

Fixed both functions to check the form's `screenCode` first: for
`ENDORSEMENT*`/`RENEWAL*` screens, resolve the real policy via the
form's own `quoteNumber` field instead of the Submission's Id, and
never fall through to creating a new `NEWBUSINESS` policy for what's
explicitly not new business.

Found and deleted 3 pre-existing phantom rows already in the local DB
from earlier test sessions (ids 12/14/16). Verified live: created a
fresh endorsement, saved an edit through it, confirmed the edit reached
the real draft row (not a phantom), confirmed zero phantom rows were
created, and confirmed the endorsement shows up in `GET
/api/{insuredType}/endorsements` but not `GET
/api/{insuredType}/nb-quotes`.

Files: `Backend/src/InsureEdge.Infrastructure/Repositories/SubmissionRepository.cs`

---

**Area:** DB, Backend

Merged Akansha's My Profile/My Producer + Cancel Policy "Requested By"
commit (`a1c6297`) into this branch — resolved conflicts across
`PoliciesController.cs`, `PolicyQuoteDtos.cs`, `IPolicyQuoteRepository.cs`,
`PolicyQuoteService.cs`, `quotesPolicies.ts`, `Policy.ts` (all purely
additive on both sides, no logic conflicts). While verifying the merge
builds AND runs without errors (not just compiles), found and fixed two
pre-existing DB gaps, neither introduced by this merge:

- **`user_extended` table never existed.** Akansha's new
  `GET/PUT /api/auth/me/profile` queries it directly (`ue.user_code`,
  `ue.status`, joined via `group_user gu ON gu.user_id = ue.id`) but no
  migration anywhere created it — the endpoint 500'd on first call.
  Added `Backend/db/029_user_extended.sql`: one row per `"user"` row,
  with `user_extended.id` deliberately set equal to `"user".id` (not an
  independent sequence) so the existing `group_user`/`user_screen` FKs
  — which point at `"user"(id)`, confirmed against the live schema, not
  at `user_extended` despite what the query's join implies — still
  resolve correctly without needing those FKs changed. Backfilled
  `user_code`/`status`/name/DOB/gender/bio from `"user"` for all 15
  existing users.
- **Migration `012` exists as two different files**
  (`012_bulk_upload.sql` and `012_policy_transactions.sql` — an old
  filename collision, not renumbered here since that's a bigger,
  separate cleanup) — **neither had ever been applied**. Bulk Upload
  and Policy History/Timeline would have 500'd on `bulk_upload_audit`/
  `policy_transaction`/`policy_transaction_type` not existing. Ran both;
  confirmed `GET .../policies/{policyNumber}/history` now returns the
  seeded transaction rows correctly.

Verified live end-to-end post-merge: `GET/PUT /me/profile`, `GET
/me/producer`, Policy History, and the Policies/Quotes register UI all
work; 0 TypeScript errors for the first time this session (Akansha's
commit added the `getMyProfile`/`updateMyProfile`/`getMyProducer` API
surface that `MyProfilePage.tsx`/`NewSubmission.tsx` were calling with
no backend, the 3 persistent pre-existing errors all session). One
remaining gap, not caused by this merge and left alone as out of scope:
`MyProfilePage.tsx` has no route registered in `App.tsx` and no link
from the header — the page is unreachable in the UI despite its backend
now working.

Files: `Backend/db/029_user_extended.sql` (new), `VERSIONS.md`.

---

## 2026-07-14 — Mukul

**Area:** Backend, Frontend (Quotes & Policies — Endorsement wizard)

Four fixes to the Endorsement Quote wizard, found while testing the
"Review/Compare Updated Information" panel added earlier the same day:

- **Data loss on save**: creating an endorsement cloned the full policy
  (risk address, contact info, limits, additional insureds) into new
  `Policy`-family rows, but the wizard's `Submission` draft blob was
  seeded with only ~15 hand-picked fields — everything else was
  invisible from the start, not wiped on save. Added
  `GET /api/{insuredType}/policies/{policyNumber}/endorsement-draft-form`,
  which reads the real cloned data back out shaped like the wizard's
  `FormState`, and wired `PolicySummaryPage.tsx`'s endorse handler to
  use it instead of the old stub.
- **Limits & Coverages reachable on endorsements**: same root cause (a
  mis-seeded `screenCode` made the wizard misclassify the quote as New
  Business) — fixed by the above, plus a belt-and-braces guard in
  `goToStep()` so it can never land on a step invalid for the flow.
- **Delete Quote silently did nothing**: the dropdown item had no
  `onClick` at all. Wired it up — and found a deeper issue: deleting
  only removed the `Submission` blob, leaving the linked endorsement
  `Policy` draft behind forever (linked only via a `quoteNumber` inside
  the blob's own JSON, not the `Submission.Id` itself), permanently
  blocking a future endorsement attempt. `SubmissionRepository.DeleteAsync`
  now finds and cleans up that whole linked draft graph.
- **Issue button**: existed but was gated behind
  `responsibleParty === 'Mortgagee'` (invisible for the common "Insured"
  case), and called a `POST .../issue-endorsement` endpoint that never
  existed on the backend — every click was a silently-swallowed 404.
  Built the real endpoint (`SubmissionRepository.IssueEndorsementAsync`,
  mirroring `IssuePolicyAsync`'s validation gates), ungated the button.
  Issuing flips the draft to the policy's new Active record and
  unconditionally cancels the prior policy it was drafted against.

All four verified live end-to-end (create → hydrate → delete-and-retry →
issue → confirm prior policy Cancelled), then test data cleaned up.

Files: `Backend/src/InsureEdge.Infrastructure/Repositories/PolicyQuoteRepository.cs`,
`Backend/src/InsureEdge.Infrastructure/Repositories/SubmissionRepository.cs`,
`Backend/src/InsureEdge.Application/{DTOs/QuotesPolicies/PolicyQuoteDtos.cs,
Interfaces/IPolicyQuoteRepository.cs, Interfaces/ISubmissionRepository.cs,
Services/PolicyQuoteService.cs, Services/SubmissionService.cs}`,
`Backend/src/InsureEdge.API/Controllers/{PoliciesController.cs, SubmissionsController.cs}`,
`Frontend/src/{api/quotesPolicies.ts, types/Policy.ts,
pages/PolicySummaryPage.tsx, pages/QuotesPolicies/NewSubmission.tsx}`

---

## 2026-07-14 — Akansha

**Area:** Backend, DB

Added My Profile / My Producer self-service endpoints (the frontend for these
already existed — `MyProfilePage.tsx`, New Submission's producer prefill —
but had no backend to call):
- `GET/PUT /api/auth/me/profile` — own profile view/edit, correctly joined
  through `user_extended` (the table `UsersController.cs` should have been
  using all along but wasn't — that controller still has this bug, out of
  scope here).
- `GET /api/auth/me/producer` — Producer self-service login's own
  producer/intermediary record, for pre-filling New Submission.
- `last_login_on`/`password_updated_on` now actually get written (the
  migration for these columns existed since `022_user_last_login.sql` but
  nothing populated them).
- Added a Dapper `DateOnly` type handler (`DateOnlyTypeHandler.cs`) —
  Dapper has no built-in support for it and throws `NotSupportedException`
  on any raw-SQL query binding a `DateOnly`/`DateOnly?` parameter.

Also includes the in-progress Cancel Policy "Requested By" feature:
`PolicyConfigurationRequestedBy` entity + `027_cancel_policy_requested_by.sql`
+ `028_remove_do_not_renew_transaction_type.sql`.

---

## 2026-07-13 — Mukul

**Area:** Backend (Distribution / Producers, plus branch build fixes)

Landed the Producer self-service login feature (Distribution Management:
Producers/Intermediaries CRUD, per-intermediary screen permissions,
producer-scoped visibility) on top of `feature/insure-edge`, plus fixed
several pre-existing gaps found while getting the branch building again.

**Producer login / default password:**
- Every Producer with an email on file now automatically gets a linked
  external-user login when created — no separate manual "invite" step
  required (`ProducerService.CreateAsync` → `CreateLinkedUserAsync`).
- That user gets a **default password** immediately
  (`PRODUCER_DEFAULT_PASSWORD` env var, falls back to `Producer@123` if
  unset) — so the Producer can log in right away even if the onboarding
  email never sends (e.g. SMTP not configured). The onboarding email is
  still sent, letting them set their own password if they want, but
  it's no longer required to get in. A failed send is logged as a
  warning, not rolled back.
- `POST /api/producers/{id}/invite` still exists, repurposed as the
  recovery path for a Producer created without an email on file.
- These external/producer users stay out of User Management
  (`UsersController.GetAll` filters `producer_id IS NULL`).
- Configure the default via `Backend/.env.example` →
  `PRODUCER_DEFAULT_PASSWORD` (left blank there — set your own locally;
  it's not committed with a real value). Change it before any non-dev
  use — it's a shared secret across every Producer who hasn't changed
  their password yet.

**Producer-scoped visibility (completed a half-wired feature):**
- `ICurrentTenantService` gained `ProducerId` / `IntermediaryId` /
  `IsFullProducerVisibility`, read from claims set at login
  (`AuthController.Login`) — `ProducerScope.cs` already expected these
  but nothing populated them before this.
- `PermissionResolver.ResolveAsync` now ORs in the producer's own
  intermediary's `intermediary_screen_permissions` grant (Distribution
  Management → Assigned Rights) alongside the "Producers" group grant,
  per the design already documented in
  `db/026_intermediary_screen_permissions.sql`. Only applies to the
  requesting user's own session — a producer can't inherit another
  producer's intermediary's rights.
- Registered `IntermediaryScreenPermission` on `InsureEdgeDbContext`
  (DbSet + table mapping) — existed as a class but wasn't wired into EF.
- Registered `IntermediaryService`, `ProducerService`,
  `IntermediaryScreenPermissionService` in `Program.cs` DI — the
  controllers using them (`IntermediariesController`,
  `ProducersController`, `ScreenPermissionsController`,
  `ModulesController`) would 500 on every request without this.

**Pre-existing branch build breakage fixed (found while merging, not
part of the Producer work):**
- Added 4 missing domain entities referenced by `InsureEdgeDbContext`
  but never committed: `HbRaterExcessFloodCoverage`, `HbRaterHrHexzone`,
  `HbRaterLrHexzones`, `HbRaterRatingWildfire`. Shapes inferred from the
  DbContext's own `OnModelCreating` config and the matching `db/014`–
  `db/017` migration SQL. **Note:** the actual DB tables for these don't
  exist locally either (no migration ever created them) — only the C#
  side is fixed; nothing rating-related was tested end-to-end.
- Temporarily disabled (commented out, clearly marked) `RatingController`
  endpoints and `Program.cs` DI/bootstrap for an entire missing
  `InsureEdge.Infrastructure.Rating` namespace (`Rater`, `RaterFunctions`,
  `RaterBootstrap`, `HbisPlanComparisonChart`) and
  `HbisLimitsAndCoveragesService` — none of this exists anywhere in the
  branch's history. This is a real gap, not something introduced here;
  whoever owns the rating engine needs to actually port/commit it, then
  re-enable the commented blocks (search this branch for "TEMPORARILY
  DISABLED").

Files touched: `Backend/src/InsureEdge.Infrastructure/Services/ProducerService.cs`,
`Backend/src/InsureEdge.Application/Interfaces/ICurrentTenantService.cs`,
`Backend/src/InsureEdge.Infrastructure/Identity/CurrentTenantService.cs`,
`Backend/src/InsureEdge.Infrastructure/Identity/PermissionResolver.cs`,
`Backend/src/InsureEdge.API/Controllers/AuthController.cs`,
`Backend/src/InsureEdge.Domain/Entities/User.cs`,
`Backend/src/InsureEdge.Infrastructure/Data/InsureEdgeDbContext.cs`,
`Backend/src/InsureEdge.API/Program.cs`,
`Backend/src/InsureEdge.API/Controllers/RatingController.cs`,
`Backend/.env.example`,
`Backend/src/InsureEdge.Domain/Entities/HbRater*.cs` (4 new files)

---

## 2026-07-13 — Mukul

**Area:** Docs / DevOps

- Added `.claude/skills/run/SKILL.md` — documents how to launch the
  app locally (Backend API, Frontend Vite dev server, backed by local
  PostgreSQL with schema provisioned via `Backend/db/*.sql`).
- Added this `VERSIONS.md` changelog.
