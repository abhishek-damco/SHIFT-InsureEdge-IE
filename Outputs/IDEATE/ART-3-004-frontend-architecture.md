# ART-3-004 — Frontend Architecture
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Architecture Agent
**Phase:** IDEATE
**Date:** 2026-06-17
**Version:** 1.0 — GATE CANDIDATE
**Technology:** React 18 / TypeScript / Vite / React Router v6 / React Query v5 / Zustand / React Hook Form + Zod / shadcn/ui

---

## 1. Technology Stack Summary

| Concern | Library / Tool | Justification (ref ADR-007) |
|---|---|---|
| Build tool | Vite 5 | Fast HMR, ESM-native, static output → Azure Static Web Apps |
| Framework | React 18 (TypeScript strict) | Confirmed DEC-3-0001 |
| Routing | React Router v6 | Declarative nested routes, route guards, lazy loading |
| Server state | TanStack Query v5 (React Query) | API data fetching, caching, background refresh, optimistic updates |
| Client state | Zustand | User context, permission map, UI state (modals, navigation) |
| Forms | React Hook Form v7 + Zod | Multi-step wizards, heavy validation, uncontrolled for perf |
| Component library | shadcn/ui (Tailwind CSS) | Accessible, owned components, no vendor lock-in |
| HTTP client | Axios (with request interceptors for auth) | JWT attach, 401 refresh token intercept |
| Testing | Vitest + React Testing Library | Component and hook unit tests |
| E2E | Playwright | Critical path (quote, bind, pay) |

---

## 2. Application Shell and Entry Point

```
src/
├── main.tsx                    ← Vite entry; StrictMode; QueryClient; RouterProvider; ZustandProvider
├── App.tsx                     ← Root router outlet; AuthGuard wrapping all authenticated routes
├── router/
│   ├── routes.tsx              ← All route definitions (lazy-loaded per domain)
│   └── AuthGuard.tsx           ← Checks auth token; redirects unauthenticated to /login
├── store/
│   ├── authStore.ts            ← Zustand: user, accessToken, refreshToken, role, clientId
│   ├── permissionStore.ts      ← Zustand: permissionMap (screenCode → PermissionFlags), loading state
│   └── uiStore.ts              ← Zustand: global modals, sidebar state, breadcrumb
├── api/
│   ├── axiosClient.ts          ← Axios instance; request interceptor (attach JWT); response interceptor (refresh on 401)
│   └── queryClient.ts          ← React Query QueryClient configuration (staleTime, retry logic)
├── hooks/
│   ├── usePermission.ts        ← Hook: usePermission(screenCode, flag) → boolean
│   ├── useTenant.ts            ← Hook: useTenant() → { clientId, clientName }
│   └── useCurrentUser.ts       ← Hook: useCurrentUser() → { userId, role, userCode }
├── components/
│   └── shared/                 ← Shared UI components: DataTable, PageHeader, ConfirmDialog, LoadingSpinner
├── domains/
│   ├── policy/                 ← Policy domain (see §3)
│   ├── claims/
│   ├── billing/
│   ├── distribution/
│   ├── identity/
│   ├── documents/
│   └── admin/
└── lib/
    ├── permissions.ts          ← Permission flag enum, PermissionFlags type
    └── constants.ts            ← Screen codes, route paths
```

---

## 3. Domain Component Hierarchy

### 3.1 Policy Lifecycle (D1)

```
domains/policy/
├── index.ts                            ← Re-exports, lazy boundary
├── routes.tsx                          ← Policy domain routes
├── pages/
│   ├── QuoteListPage.tsx               ← Quotes grid; filter by status, date
│   ├── QuoteWizard/
│   │   ├── QuoteWizardPage.tsx         ← Multi-step wizard shell; step state via Zustand
│   │   ├── steps/
│   │   │   ├── Step1InsuredInfo.tsx    ← Insured type, personal/commercial info, age-65 flag
│   │   │   ├── Step2RiskLocation.tsx  ← Address entry, Google Maps embed, geocoding trigger
│   │   │   ├── Step3RiskAssessment.tsx ← HexCat + RPS results display; blocks if Not Approved
│   │   │   ├── Step4Coverage.tsx      ← Dwelling limit, deductible, coverage level, endorsements
│   │   │   └── Step5Review.tsx        ← Premium summary, fee breakdown, submit
│   ├── PolicyListPage.tsx              ← Active policies grid
│   ├── PolicyDetailPage.tsx            ← Policy detail tabs: Coverage, Billing, Documents, History
│   ├── PolicyBindPage.tsx              ← Binding confirmation; TranzPay redirect trigger
│   ├── EndorsementPage.tsx             ← Mid-term change form; premium diff display
│   ├── RenewalPage.tsx                 ← Renewal detail; manual renewal trigger
│   ├── CancellationPage.tsx            ← Cancellation form; refund calculation display
│   └── BulkUploadPage.tsx             ← File upload; job status polling
├── components/
│   ├── PremiumBreakdown.tsx            ← Reusable: coverage premium + taxes + fees
│   ├── MortgageeSection.tsx            ← LenderDock notification trigger display
│   ├── PolicyStatusBadge.tsx           ← Status chip with color coding
│   └── EndorsementDiffTable.tsx        ← Before/after premium comparison
├── api/
│   ├── quoteApi.ts                     ← React Query hooks: useCreateQuote, useQuoteStep, useQuoteList
│   └── policyApi.ts                    ← React Query hooks: usePolicies, usePolicyDetail, useBindPolicy
└── schemas/
    └── quoteSchema.ts                  ← Zod schemas for each wizard step
```

### 3.2 Claims Management (D2)

```
domains/claims/
├── pages/
│   ├── ClaimsListPage.tsx              ← Claims grid; filters (status, adjuster, date range)
│   ├── FNOLPage.tsx                    ← First Notice of Loss intake form
│   ├── ClaimDetailPage.tsx             ← Claim header; tabs: Workflow, Worksheet, Documents, History
│   ├── WorksheetPage.tsx               ← Financial worksheet; reserve allocation per coverage
│   ├── DisbursementPage.tsx            ← Payee list; disbursement amounts; DisburseCloud trigger
│   └── CatastropheEventPage.tsx        ← CAT event grouping; aggregate view
├── components/
│   ├── ClaimStatusWorkflow.tsx         ← Visual status progression: FNOL→Open→InReview→Closed/Denied
│   ├── AdjusterScopeFilter.tsx         ← Adjuster role: auto-filters to assigned claims only
│   ├── ReserveAllocationTable.tsx      ← Per-coverage reserve breakdown
│   └── ClaimDocumentViewer.tsx         ← Sensitive document gate: checks AccessSensitiveDoc flag
└── api/
    ├── claimApi.ts
    └── worksheetApi.ts
```

### 3.3 Billing & Payments (D3)

```
domains/billing/
├── pages/
│   ├── BillingDashboardPage.tsx        ← Payment plan status; upcoming installments
│   ├── PaymentPlanPage.tsx             ← Plan configuration; installment schedule display
│   ├── MakePaymentPage.tsx             ← Initiates TranzPay hosted redirect
│   ├── PaymentCallbackPage.tsx         ← TranzPay return URL handler; polls for callback result
│   ├── RefundPage.tsx                  ← Refund initiation; method-matched display
│   └── FailedPaymentPage.tsx           ← Failed payment detail; grace period countdown
└── components/
    ├── TranzPayRedirectButton.tsx       ← Handles redirect flow, loading state, return handling
    └── PaymentHistoryTable.tsx          ← Transaction history grid
```

### 3.4 Distribution Management (D4)

```
domains/distribution/
├── pages/
│   ├── IntermediaryListPage.tsx        ← Agency list; Intermediary-scoped for Producer role
│   ├── IntermediaryDetailPage.tsx      ← Agency detail; producer list; commission rate
│   ├── ProducerDetailPage.tsx          ← Individual producer detail; license info
│   ├── CommissionConfigPage.tsx        ← Commission percentage configuration
│   └── DisbursementListPage.tsx        ← Commission disbursement history; DisburseCloud status
└── api/
    └── distributionApi.ts
```

### 3.5 Identity & Access (D5)

```
domains/identity/
├── pages/
│   ├── LoginPage.tsx                   ← Email+password; MFA prompt for ClientAdmin/PlatformAdmin
│   ├── ForgotPasswordPage.tsx          ← Password reset request (30-min token)
│   ├── ResetPasswordPage.tsx           ← Code+new password (code match + expiry validation)
│   ├── OnboardingPage.tsx              ← New user setup (24-hr token; code + expiry required)
│   ├── UserListPage.tsx                ← User management grid
│   ├── UserDetailPage.tsx              ← User profile; group memberships; role display
│   ├── GroupListPage.tsx               ← Group list; permission matrix per group
│   └── GroupDetailPage.tsx             ← Group membership; 10-flag permission editor per screen
└── components/
    ├── MfaSetup.tsx                    ← TOTP QR code display; verification flow
    ├── PermissionMatrix.tsx            ← 10-flag editor: 65+ screens × 10 flags in grid
    └── GroupMembershipPanel.tsx        ← Add/remove users; triggers synchronous privilege revocation
```

### 3.6 Document Management (D6)

```
domains/documents/
├── pages/
│   ├── DocumentListPage.tsx            ← Documents list per policy or claim
│   ├── DocumentUploadPage.tsx          ← File upload; type selection
│   └── DocumentViewerPage.tsx          ← Time-limited SAS URL generation; sensitive doc gate
└── components/
    ├── SasDownloadButton.tsx           ← Requests time-limited SAS token; opens in new tab
    └── SensitiveDocGate.tsx            ← Checks AccessSensitiveDoc permission before rendering
```

### 3.7 System Administration (D7)

```
domains/admin/
├── pages/
│   ├── TenantListPage.tsx              ← Client/tenant registry (PlatformAdmin only)
│   ├── TenantDetailPage.tsx            ← Tenant provisioning; office locations; subscription
│   ├── ProductCatalogPage.tsx          ← Insurance product activate/deactivate
│   ├── ConfigurationPage.tsx           ← Timer thresholds; BypassRefundResponse flag visibility
│   └── HangfireDashboardLink.tsx       ← Link to /hangfire (PlatformAdmin only)
└── components/
    └── TimerControlPanel.tsx           ← Toggle per-timer enabled/disabled; shows last run status
```

---

## 4. Routing Strategy

### 4.1 Route Tree

```
/                           → Redirect to /dashboard or /login
/login                      → LoginPage (public)
/forgot-password            → ForgotPasswordPage (public)
/reset-password             → ResetPasswordPage (public, token in query)
/onboarding                 → OnboardingPage (public, token in query)

[AuthGuard — all routes below require valid JWT]

/dashboard                  → DashboardPage (role-specific content)

/policies
  /                         → PolicyListPage
  /new                      → QuoteWizardPage [PermissionGuard: POLICY_LIST, Create]
  /:policyId                → PolicyDetailPage [PermissionGuard: POLICY_LIST, View]
  /:policyId/bind           → PolicyBindPage [PermissionGuard: POLICY_LIST, Create]
  /:policyId/endorse        → EndorsementPage [PermissionGuard: POLICY_LIST, Edit]
  /:policyId/renew          → RenewalPage [PermissionGuard: POLICY_LIST, Edit]
  /:policyId/cancel         → CancellationPage [PermissionGuard: POLICY_LIST, Edit]
  /bulk-upload              → BulkUploadPage [PermissionGuard: POLICY_LIST, Upload]

/claims
  /                         → ClaimsListPage [AdjusterScopeFilter auto-applied]
  /new                      → FNOLPage [PermissionGuard: CLAIMS_LIST, Create]
  /:claimId                 → ClaimDetailPage [PermissionGuard: CLAIMS_LIST, View]
  /:claimId/worksheet       → WorksheetPage [PermissionGuard: CLAIM_WORKSHEET, View]
  /:claimId/disburse        → DisbursementPage [PermissionGuard: CLAIM_WORKSHEET, ApproveReject]

/billing
  /                         → BillingDashboardPage
  /:policyId/pay            → MakePaymentPage [PermissionGuard: BILLING_LIST, Create]
  /callback                 → PaymentCallbackPage (public endpoint — TranzPay return URL)

/distribution
  /intermediaries           → IntermediaryListPage
  /intermediaries/:id       → IntermediaryDetailPage
  /commissions              → CommissionConfigPage [PermissionGuard: DISTRIBUTION, Edit]
  /disbursements            → DisbursementListPage

/users
  /                         → UserListPage
  /:userId                  → UserDetailPage

/groups
  /                         → GroupListPage
  /:groupId                 → GroupDetailPage [PermissionGuard: USER_GROUP_PAGE]

/documents
  /                         → DocumentListPage
  /:documentId              → DocumentViewerPage [SensitiveDocGate if IsSensitive]

/admin
  /tenants                  → TenantListPage [RoleGuard: PlatformAdmin]
  /tenants/:clientId        → TenantDetailPage [RoleGuard: PlatformAdmin]
  /products                 → ProductCatalogPage [RoleGuard: PlatformAdmin]
  /configuration            → ConfigurationPage [RoleGuard: PlatformAdmin]
```

### 4.2 Route Guards

**`AuthGuard`:** Wraps all authenticated routes. Checks Zustand `authStore` for valid, non-expired access token. On 401 from any API call, the Axios interceptor attempts refresh — on refresh failure, redirects to `/login`.

**`PermissionGuard`:** Applied per-route. Props: `screenCode: string`, `requiredFlag: PermissionFlag`. Reads from `permissionStore`. Renders `<ForbiddenPage />` if flag is false (does NOT redirect — user is authenticated but not authorized).

**`RoleGuard`:** Applied per-route for role-only restrictions (e.g., PlatformAdmin pages). Reads role from `authStore`.

**`AdjusterScopeGuard`:** Not a route guard — a data-layer concern. The API enforces adjuster scoping server-side. The frontend displays only assigned claims — it does not need to filter client-side.

---

## 5. State Management

### 5.1 Zustand Stores

**`authStore`**
```typescript
interface AuthState {
  user: UserProfile | null;       // userId, userCode, email, role, clientId
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
}
```

**`permissionStore`**
```typescript
interface PermissionState {
  permissionMap: Record<string, PermissionFlags>;  // screenCode → flags
  isLoaded: boolean;
  loadPermissions: () => Promise<void>;            // called at login; loads from /api/v1/auth/permissions
  invalidateUser: (userId: string) => void;        // called on group membership change
}

interface PermissionFlags {
  view: boolean;
  create: boolean;
  edit: boolean;
  approveReject: boolean;
  duplicate: boolean;
  upload: boolean;
  download: boolean;
  viewSensitiveInfo: boolean;
  accessSensitiveDoc: boolean;
  allAccess: boolean;
}
```

**`uiStore`**
```typescript
interface UiState {
  sidebarOpen: boolean;
  activeModal: ModalConfig | null;
  breadcrumbs: Breadcrumb[];
  openModal: (config: ModalConfig) => void;
  closeModal: () => void;
}
```

### 5.2 React Query (Server State)

- `staleTime: 5 * 60 * 1000` (5 minutes) for reference data (lookup tables, products)
- `staleTime: 30 * 1000` (30 seconds) for operational data (policies, claims in progress)
- `staleTime: 0` for real-time status (payment callback polling)
- Cache invalidation on mutation: `queryClient.invalidateQueries({ queryKey: ['policies'] })` after bind/endorse/cancel
- Optimistic updates for status changes (e.g., claim status toggle) to improve perceived responsiveness

**Payment callback polling example:**
```typescript
// Poll TranzPay callback status every 3 seconds until resolved
const { data } = useQuery({
  queryKey: ['payment-callback', thirdPartyCallId],
  queryFn: () => fetchCallbackStatus(thirdPartyCallId),
  refetchInterval: (data) => data?.status === 'Pending' ? 3000 : false,
  staleTime: 0
});
```

---

## 6. Permission Enforcement Pattern (10-Flag Model)

### 6.1 `usePermission` Hook

```typescript
function usePermission(screenCode: string, flag: keyof PermissionFlags): boolean {
  const { permissionMap } = usePermissionStore();
  const { user } = useAuthStore();

  // PlatformAdmin bypasses all flags
  if (user?.role === 'PlatformAdmin') return true;

  const screenPerms = permissionMap[screenCode];
  if (!screenPerms) return false;
  if (screenPerms.allAccess) return true;
  return screenPerms[flag] ?? false;
}
```

### 6.2 Usage Patterns

**Conditional rendering (preferred):**
```tsx
// Create button only shown if user has Create permission
const canCreate = usePermission('POLICY_LIST', 'create');
<Button disabled={!canCreate} onClick={handleNewQuote}>New Quote</Button>
```

**Sensitive field masking:**
```tsx
// SSN display — masked unless ViewSensitiveInfo permission
const canViewSensitive = usePermission('ACCOUNT_DETAIL', 'viewSensitiveInfo');
<span>{canViewSensitive ? account.ssn : '****-**-****'}</span>
```

**Note:** Even with `canViewSensitive = true`, the API response only includes the unmasked field if the server also validates the `ViewSensitiveInfo` flag. The UI enforcement is defense-in-depth, not the primary security control. The API layer is the enforcing layer (NFR-005).

**Route-level guard:**
```tsx
<Route
  path="/claims/:id/worksheet"
  element={
    <PermissionGuard screenCode="CLAIM_WORKSHEET" requiredFlag="view">
      <WorksheetPage />
    </PermissionGuard>
  }
/>
```

### 6.3 AllAccess Handling

`allAccess: true` on a screen permission grants all individual flags true — but scope filters (ClientId, IntermediaryId, AdjusterId) still apply. The API enforces scope; the frontend respects `allAccess` as a shorthand for all 10 flags being true.

---

## 7. Form Strategy

### 7.1 React Hook Form + Zod

All forms use React Hook Form with Zod schema validation. Zod schemas defined in `schemas/` per domain — colocated with the form they validate.

**Multi-step quote wizard pattern:**
```typescript
// Each step has its own Zod schema
const step1Schema = z.object({
  insuredType: z.enum(['Individual', 'Commercial']),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  isAge65OrOlder: z.boolean().optional(),  // required if insuredType === 'Individual'
  ...
}).refine(
  (data) => data.insuredType !== 'Individual' || data.isAge65OrOlder !== undefined,
  { message: "Age indicator required for individual insureds", path: ["isAge65OrOlder"] }
);

// Step state stored in Zustand; each step submits to API on advance
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(step1Schema),
  defaultValues: quoteWizardStore.step1Data
});
```

**Complex multi-field validation (example — duplicate policy check):**
- Step 2 (Risk Location) calls the API on address geocode completion to check for duplicate active policy at the same risk location. Error displayed inline, blocking step progression.

### 7.2 Form Performance

React Hook Form uses uncontrolled inputs — no re-render on every keystroke. Critical for the policy quote wizard which has 30+ fields across 5 steps. Validation on blur (not on change) for most fields; on change for amount fields with live premium recalculation.

### 7.3 Permission-gated Form Fields

Fields that require specific permissions to edit are rendered read-only (not hidden) when the user lacks the `edit` permission. This provides visibility without write access:
```tsx
<Input
  {...register('commissionPercentage')}
  readOnly={!usePermission('DISTRIBUTION', 'edit')}
  className={!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}
/>
```

---

## 8. Multi-Tenant UI Isolation

### 8.1 Tenant Context in UI

- `clientId` is embedded in the JWT access token claim.
- `useTenant()` hook reads `clientId` from `authStore`.
- No tenant-switching in the UI for non-PlatformAdmin users — each user sees only their tenant's data.
- PlatformAdmin sees a **tenant selector** in the admin section. Selecting a tenant sets a `targetClientId` in the admin store; all admin API calls include `X-Target-Client-Id` header.

### 8.2 Tenant-Specific Branding

The `ClientConfig` table includes `SystemTheme` per client. On login, the API returns `clientConfig` (language, dateFormat, theme) in the authentication response. The React app applies CSS variables from the theme at login. This supports per-tenant visual customization without multiple builds.

### 8.3 Data Isolation Assurance

The UI never constructs tenant-filtering queries — it relies entirely on the API's server-side tenant enforcement (EF Core global filters). The only tenant identifier the UI sends is the one embedded in the JWT — it cannot be overridden by a URL parameter or request body field.

---

## 9. UI Component Library

**shadcn/ui** (Tailwind CSS):
- Components installed into `src/components/ui/` — no runtime dependency, no update lock
- Core components used: `Button`, `Input`, `Select`, `Dialog`, `Table`, `DataTable`, `Badge`, `Tabs`, `Card`, `Form`, `Tooltip`, `AlertDialog`
- Custom insurance-domain components: `PolicyStatusBadge`, `PermissionMatrix`, `PremiumBreakdown`, `ClaimStatusTimeline`
- Tailwind config: single color theme per `ClientConfig.SystemTheme`; `data-theme` attribute on root `<html>` element

---

## 10. Key Frontend-Backend Contract Points

| Area | Contract |
|---|---|
| Authentication | POST `/api/v1/auth/login` → `{ accessToken, refreshToken, user }` |
| Token refresh | POST `/api/v1/auth/refresh` → `{ accessToken }` |
| Permission load | GET `/api/v1/auth/permissions` → `Record<screenCode, PermissionFlags>` |
| Sensitive fields | API returns masked value (`"****"`) unless user has `ViewSensitiveInfo`; no boolean flag in response |
| TranzPay redirect | POST `/api/v1/billing/payment/initiate` → `{ redirectUrl, thirdPartyCallId }` |
| Payment callback | GET `/api/v1/billing/payment/status/:callId` → `{ status: 'Pending' | 'Success' | 'Failed' }` |
| Document download | GET `/api/v1/documents/:id/download` → `{ sasUrl, expiresAt }` — 15-minute SAS token |
| Geocoding | POST `/api/v1/geocoding/resolve` → `{ lat, lon, formattedAddress }` |

---

*End of ART-3-004 — Frontend Architecture | INSUREEDGE-2026 | IDEATE Phase | 2026-06-17*
