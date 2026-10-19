# Dashboard frontend-backend gap analysis

Final verification date: 2026-10-19

## Evidence reviewed

- Complete `Input/Quotes_and_Policies_Dashboard_PRD.md`.
- Complete `Input/Dashboard screenshots/insureedge_scrape_notes.md` and every supplied Dashboard screenshot.
- Captured original SQL/actions for `GetCounts`, pending cancellation, renewal radar, `GetClientMappingSecrets`, widget configuration, Tasks & Reminders, My Notes, and the organization Dashboard.
- Relevant extracted backend references in `Input/OutDoc - eSpace IE_Policy_BL.pdf` and `Input/OutDoc - eSpace IE_Policy_CS.pdf`.
- Current React routes, Dashboard and Quotes & Policies components, API clients/types, permission context, and navigation.
- ASP.NET controllers/services, tenant claims, renewal service, repositories, entities, EF configuration/migrations/snapshot, and PostgreSQL scripts.
- Automated build/test output and a controlled PostgreSQL 18 fixture on `127.0.0.1:55439`.

The Markdown PRD primarily specifies the Quotes & Policies landing/register. The scrape material specifies the role-routed Client and Producer Dashboard. Both are included below.

## Final traceability and readiness table

| Persona / requirement | Expected rule | Implementation evidence | Test evidence | Status / blocker |
|---|---|---|---|---|
| Both / authentication | Authenticated Dashboard access | `[Authorize]` and `DASHBOARD/View` on `DashboardController`; shared cookie/session unchanged | Reflection contract test | **Verified** |
| Both / tenant isolation | Browser must not choose client scope | `DashboardService.ScopedPolicies()` starts with authenticated `tenant.ClientId`; related joins repeat client predicates | PostgreSQL fixture excludes another-client row | **Verified** |
| Producer / book scope | Own producer, or authenticated intermediary scope when full visibility is granted | `ScopedPolicies()` uses authenticated producer/intermediary claims only | PostgreSQL fixture excludes another-producer row; full-visibility branch query-reviewed | **Verified**, full-visibility login still needs manual browser verification |
| Both / persona guards | Client and Producer endpoints/actions remain distinct | Producer-only list/renewal and Client-only failed-payment service guards | Controller 403 test; contract review | **Verified** |
| HB classification override | Product rule requires `IsHB = true` for every Client and Producer Dashboard | `GetContext()` returns literal `true`; no client/company lookup remains; non-HB KPI and Tasks branches are not queried/rendered | PostgreSQL fixture uses non-HB company names and asserts true for both personas | **Verified** |
| Currency override | Product rule requires USD for every Dashboard amount | Backend uses one `DashboardCurrency = "USD"` constant; frontend formatter always renders `USD` | PostgreSQL context/row assertions; source scan | **Verified** |
| Producer non-HB KPI | Original non-HB branch had Active/New Business/Renewal/Endorsement tiles | Non-HB producer aggregation and rendering removed because the new rule makes this branch unreachable | Producer summary asserts `producerKpis = null` | **Not applicable under the override** |
| Producer HB quote KPI | Uploaded/Approved/Not Approved/Expired new-business quotes | Scoped new-business aggregation is shown for every Producer | PostgreSQL fixture asserts HB context and uploaded count | **Verified** |
| Client quote/policy KPI | Quote states; issued total/Active/Bound/Cancelled | `summary` SQL aggregates; issued policy types restricted | Empty/type contract tests plus query review | **Verified to available evidence** |
| Client coverage KPI | Basic/Standard/Preferred policy counts without duplicate joins | Issued policies counted with `Any` over tenant-owned coverage rows | Query review | **Verified**, duplicate-coverage database fixture remains desirable |
| Written premium | Original HB action returns `{Year, Premium}`; exact action SQL not supplied | Active/Bound issued policies; sum `TotalPremiumWithoutInstallmentFee` by effective year, previous/current/next | SQL-side query review; controlled premium is exercised by service test but original predicate cannot be asserted | **Blocked for business-definition sign-off**: need `GetInForcedWriitenPremmiumForHB` action SQL/logic |
| Recent quote grid | Real data, documented columns/actions, search, filter, sort, 10/25/50 paging | `GET quotes`, typed UI, server filtering/sorting/paging and real routes | Paging validation tests; TypeScript/build | **Verified** |
| Pending cancellation | Producer; Active; current-month overdue; unpaid; non-null status not `SUCCESS`; order oldest due date first | Exact predicates in `GetPendingCancellationsAsync`; search covers policy, days, due date, amount; 10/25/50 UI paging; API accepts sort | PostgreSQL fixture proves matching row and excludes null transaction status | **Verified data rule**; compact UI has no interactive sort control |
| Renewal radar | Producer; `POLICIESINDIVIDUAL/BUSINESS`; Active; `DoNotRenew = false`; expiry day 0-60; blank risk | Exact predicates; view and existing renewal service action; search covers policy/LOB/premium/date/days; API accepts sort | PostgreSQL fixture proves day 0/60 inclusion, day 61/generic/null-DNR exclusion, and premium search | **Verified data rule**; compact UI has no interactive sort control and mutation needs manual verification |
| Risk level | Original SQL hard-codes empty text and states calculation is not decided | Nullable DTO returns `null`; UI renders `-`; no duplicate field added | Original SQL trace and PostgreSQL assertion | **Verified parity** |
| Renewal initiation | Scoped eligible policy creates renewal through existing business service, then navigates to submission | `POST policies/{id}/renewal`, scope and eligibility recheck, `RenewalQuoteService`, submission route | Contract tests/build; no destructive mutation test added | **Manual verification required** |
| Client failed payments | Original action returns policy/payment detail; exact SQL/predicates unavailable | Client-scoped overdue, unpaid, null-or-non-success transactions; server-paged grid with functional sort and combined header filters for policy, dates, amount, and reason | Persona guard; controller query-forwarding test; query review | **UI and query controls verified**; exact inclusion definition still needs `OrgDashboardData.GetFailedPolicyPaymentData` SQL/action body |
| Tasks & Reminders | Original widget exists only in the non-HB Producer branch and is in-memory only | No Dashboard renders a non-HB branch under the new rule; widget is absent | Source scan/build | **Not applicable under the override** |
| My Notes | Static heading/SVG only; no data action | Static heading and empty state; no fabricated records/API | Original widget trace | **Verified parity** |
| Producer Config Widgets | Original Producer `ConfigWidgetsOnClick` only shows `Feature in progress` | Every Producer receives that message; Client configuration dialog remains | TypeScript/build; source trace | **Verified** |
| Client widget preferences | Original organization Dashboard saves CommonDashboard JSON and restores visibility/order | `GET/PUT preference`, per-client/per-user JSONB, allow-list, at-least-one validation, applied flex order. Missing preference table is non-fatal on read (default layout); save returns `503` until migration deployment | Controller 503 contract test; PostgreSQL missing-table fallback fixture; migration review | **Verified fallback**, browser persistence check still requires a migrated database |
| Recent activity | Dashboard record views should be real and scoped | `POST activity/view`, scoped audit records, latest ten, navigable items | Out-of-scope 404 contract test | **Verified in code**, browser sequence required |
| Loading/empty/error/refresh | Visible loading, empty results, errors, refresh without duplicate mutation | Dashboard states, abort guards, refresh action. Summary and preference loads use settled results so optional preference failure cannot blank valid Dashboard data | TypeScript/build; missing-table PostgreSQL test | **Verified** |
| Direct invalid record access | No cross-scope audit or renewal | Both actions resolve through `ScopedPolicies`; out-of-scope becomes 404 | Record-view 404 test; PostgreSQL scope fixture | **Verified** |
| Quotes & Policies register | PRD columns, actions, compound filters, sort, pagination | `NBQuotesRegister` implements UI behavior but requests up to 9999 then filters/sorts/pages in browser | Source review/build | **Partial**: functionally present, not server-side at scale as the PRD states |
| Quotes & Policies activity/collapse | Collapsible rail and real recent activity | Collapse control has no behavior and activity rows remain hard-coded frontend data | Source review | **Open gap** outside the scraped Dashboard API; needs an authoritative activity source/contract |
| EF migration/snapshot | Dashboard migration only; snapshot consistent for future migrations | Target migration is narrow; global snapshot predates Dashboard and unrelated model changes | Generated SQL inspection; `has-pending-model-changes` reports pending changes | **Deployment risk**: current migration is usable, but snapshot must be separately reconciled before generating another migration |

## Confirmed aggregate definitions

- Every Dashboard summary is HB and USD. Producer summaries use HB quote KPIs; the non-HB producer KPI query is not executed.
- Pending cancellation matches the captured SQL, including SQL null behavior for `TransactionStatus <> 'SUCCESS'`.
- Renewal radar matches the captured policy types, explicit false DNR value, and inclusive 0-60-day interval. Risk remains intentionally blank.
- Coverage uses an existence predicate so multiple coverage rows cannot multiply a policy count.
- Written premium and failed-payment definitions remain provisional because the supplied evidence exposes their DTO/output but not their source SQL.

## Explicit conflicts with the original application

- The original application derives HB from `GetClientMappingSecret_BL.Secret = ProjectLineClients.HudsonBaily`. The current product rule intentionally overrides that behavior and returns HB for every Dashboard tenant without consulting a name, mapping, or database field.
- The original application resolves Dashboard currency through `GetClientCurrency2` and, in renewal processing, `ClientConfiguration.Currency`. The current product rule intentionally overrides that behavior with USD in API responses and frontend formatting.
- Original non-HB Producer KPI and Tasks branches are therefore unreachable. They were not repurposed as HB functionality.

## Database deployment readiness

Migration `20261019090000_AddDashboardPreferencesAndIndexes` adds only:

- `dashboard_preference` with client/user foreign keys and a unique client/user index;
- Dashboard read-path indexes;
- the missing Producer `DASHBOARD` view permission seed.

The manual scripts now use the same table columns, names, foreign-key actions, unique index, read indexes, and permission seed. Both paths preserve existing business records. Choose one path only:

1. Preferred: back up the schema, review the generated SQL, then run `dotnet ef database update 20261019090000_AddDashboardPreferencesAndIndexes` from `Backend` against the intended environment.
2. DBA path: execute `database/dashboard/001_dashboard_schema_changes.sql`, then `002_dashboard_indexes.sql`, then `003_dashboard_reference_data.sql`; reconcile `__EFMigrationsHistory` before any later EF update.

Do not run both. Large-table indexes may require a DBA-approved concurrent-index deployment. No migration or script was applied to a shared database during verification.

The checked-in `InsureEdgeDbContextModelSnapshot.cs` is already stale beyond Dashboard. An attempted normal migration generation produced broad unrelated changes and was discarded. The Dashboard migration itself was inspected and remains targeted, but future migration generation is unsafe until the team creates and reviews a separate model-snapshot rebaseline.

## Executed verification

| Command / check | Actual result |
|---|---|
| `dotnet build Backend/tests/InsureEdge.UnitTests/InsureEdge.UnitTests.csproj --no-restore -m:1 -nr:false` | Passed; 0 errors, 20 existing warnings |
| Dashboard-filtered tests | 12 passed, 1 opt-in PostgreSQL test skipped in the ordinary run |
| Isolated PostgreSQL 18 run, `Category=LocalPostgres` | **2 passed, 0 failed, 0 skipped**, including the new Dashboard aggregation/filter/isolation fixture |
| Post-override Dashboard PostgreSQL rerun | **1 passed, 0 failed, 0 skipped**; asserts HB=true and USD for both personas using non-HB company names |
| Client missing-preference-table regression | **1 passed, 0 failed** against isolated PostgreSQL; the expected `42P01` is converted to a default preference and Dashboard summary remains independent |
| Full ordinary backend tests | **77 passed, 0 failed, 2 opt-in PostgreSQL tests skipped**; opt-in Dashboard PostgreSQL coverage was separately executed and passed |
| `npm.cmd run typecheck` | Passed, 0 TypeScript errors |
| `dotnet build InsureEdge.sln --no-restore -m:1 -nr:false` | Passed; 0 errors, 0 warnings in the final incremental build |
| `npm.cmd run build` | Passed; 2,717 modules transformed. Existing Vite warnings remain for mixed `xlsx` imports and large chunks |
| EF generated migration SQL | Target table, six indexes, permission seed, and history row generated as expected |
| `dotnet ef migrations has-pending-model-changes` | Reports pending model changes, confirming the documented stale-snapshot risk |
| `git diff --check` plus `--no-index --check` for each new Dashboard file | Passed; no whitespace errors. Git emitted only existing LF-to-CRLF notices |

The temporary PostgreSQL cluster was initialized with trust authentication only on `127.0.0.1:55439`, used unique disposable databases, stopped, and deleted. No application connection string or shared database was used.

## Manual verification still required

### Client

1. Use a non-production migrated database and a Client user with Dashboard View.
2. Compare quote/policy/coverage KPIs with tenant-scoped SQL fixtures, including duplicate coverage rows.
3. Confirm failed-payment rows against the original action once its SQL is supplied.
4. Reorder/hide widgets, refresh, and confirm preference isolation between two users.
5. Open a policy, return, and confirm Recent Activity; directly call Producer endpoints and confirm 403.

### Producer

1. Test one ordinary Producer and one full-visibility Producer; verify own-producer versus same-intermediary scope.
2. Test Producers belonging to differently named clients and confirm every summary returns `isHudsonBailey: true`, displays HB quote KPIs, and never displays non-HB KPI/Tasks blocks.
3. Confirm every amount renders as USD and confirm written-premium totals after the HB action definition is supplied.
4. Exercise every recent-quote filter/sort/page size and pending/renewal compact-grid page size.
5. Seed expiry day 0, 60, and 61 plus DNR true/null/false rows.
6. Initiate renewal twice: first creates/navigates correctly; second follows the existing duplicate-prevention rule.
7. Alter record IDs/routes and confirm another producer/client record returns 404 without audit or mutation.

## Information required to close the remaining evidence gaps

1. The action/SQL bodies for `GetInForcedWriitenPremmiumForHB` and `GetFailedPolicyPaymentData`.
2. Approval and ownership for a separate EF model-snapshot rebaseline.

HB mapping, non-HB Tasks, and tenant currency configuration are no longer production blockers because the explicit product rules are now unconditional HB and USD. They remain documented above as intentional deviations from the original application.
