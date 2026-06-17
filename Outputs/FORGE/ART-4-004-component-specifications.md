# ART-4-004 — Component Specifications
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Status:** AI_GENERATED
**Produced by:** Forge Agent
**Phase:** FORGE
**Date:** 2026-06-17
**Version:** 1.0
**Engagement:** INSUREEDGE-2026 | Customer: Hudson Bailey
**Architecture gate:** PASSED (DEC-3-0003, 2026-06-17)
**Primary inputs:** ART-3-004 (Frontend Architecture), ART-2-003 (Acceptance Criteria), ART-3-002 ADR-007 (React SPA), ART-4-003 (API Specifications)

> **Coverage:** The 5 highest-priority modules as specified: Quotes & Policies (Q&P), Claims, Identity, Groups, Distribution. Document management and Administration are covered at summary level.

> **State convention:**
> - **React Query** = server state (API data); always invalidated on mutation
> - **Zustand** = client state (auth, permissions, UI — persists across navigation)
> - **Local state** = `useState` / `useReducer` — ephemeral, not shared

---

## Section 1: Application Shell Components

### 1.1 `App.tsx`

**File:** `src/App.tsx`
**Purpose:** Root router outlet; wraps all authenticated routes in `AuthGuard`

**No props (root component)**

**State:**
- Zustand `authStore` — read only at this level; guards consume it

**Behavior:**
- Renders `RouterProvider` with `routes.tsx` route tree
- `AuthGuard` wraps all authenticated routes
- On token expiry (Axios interceptor 401), Zustand `logout()` called; redirected to `/login`

---

### 1.2 `AuthGuard.tsx`

**File:** `src/router/AuthGuard.tsx`
**Purpose:** Route wrapper that redirects unauthenticated users to `/login`

**Props:**
```typescript
interface AuthGuardProps {
  children: React.ReactNode;
}
```

**State:** Zustand `authStore.isAuthenticated`, `authStore.accessToken`

**Behavior:**
- If `!isAuthenticated` or token is expired → navigate to `/login`
- Renders `<Outlet />` or `children` for authenticated users

---

### 1.3 `PermissionGuard.tsx`

**File:** `src/router/PermissionGuard.tsx`
**Purpose:** Renders `<ForbiddenPage />` if user lacks required permission flag

**Props:**
```typescript
interface PermissionGuardProps {
  screenCode: string;
  requiredFlag: keyof PermissionFlags;
  children: React.ReactNode;
}
```

**State:** Zustand `permissionStore.permissionMap`

**Behavior:**
- Calls `usePermission(screenCode, requiredFlag)` hook
- `true` → renders children
- `false` → renders `<ForbiddenPage />` (does NOT redirect — user is authenticated)
- PlatformAdmin always passes (hook returns true for all flags)

---

### 1.4 `usePermission` Hook

**File:** `src/hooks/usePermission.ts`

```typescript
function usePermission(screenCode: string, flag: keyof PermissionFlags): boolean
```

**Consumes:** `permissionStore.permissionMap`, `authStore.user.role`
**Returns:** `true` if PlatformAdmin; `true` if `allAccess`; `permissionMap[screenCode][flag]`; `false` if screen not found

---

## Section 2: Domain 1 — Quotes & Policies

### 2.1 `QuoteWizardPage.tsx`

**File:** `src/domains/policy/pages/QuoteWizard/QuoteWizardPage.tsx`
**Purpose:** 5-step multi-step quote creation wizard shell (US-POLICY-001)
**Permission:** `[POLICY_LIST.Create]`

**Props:** None (accessed via route `/policies/new`)

**State:**
- Zustand `quoteWizardStore` — current step (1–5), accumulated step data, quoteId once created
- Local `useState` — form submission loading state
- React Query `useMutation` — each step calls a separate API endpoint on advance

**Step map:**

| Step | Component | API Call |
|---|---|---|
| 1 | `Step1InsuredInfo.tsx` | `POST /api/v1/quotes` |
| 2 | `Step2RiskLocation.tsx` | `PUT /api/v1/quotes/{quoteId}/risk-location` + `POST /api/v1/geocoding/resolve` |
| 3 | `Step3RiskAssessment.tsx` | Read-only display of HexCat/RPS result from Step 2 response |
| 4 | `Step4Coverage.tsx` | `PUT /api/v1/quotes/{quoteId}/coverage` |
| 5 | `Step5Review.tsx` | Read-only premium summary; Submit triggers `POST /api/v1/policies/{quoteId}/bind` |

**Child components:** All 5 Step components, `StepProgressBar.tsx`, `PremiumBreakdown.tsx`

**Key behaviors:**
- Step 2: blocks progression if HexCat status = "Not Approved" (AC-US-POLICY-002-02)
- Step 2: on address geocode success → auto-check for duplicate active policy at risk location (`GET /api/v1/policies?riskLocationAddress=...`)
- Step 5: triggers TranzPay redirect on bind submit; stores `thirdPartyCallId` for polling

---

### 2.2 `Step1InsuredInfo.tsx`

**File:** `src/domains/policy/pages/QuoteWizard/steps/Step1InsuredInfo.tsx`

**Props:**
```typescript
interface Step1Props {
  defaultValues?: Step1FormData;
  onComplete: (data: Step1FormData, quoteId: number) => void;
}
```

**State:** React Hook Form + Zod; local loading state

**Zod schema:**
```typescript
Step1Schema = z.object({
  effectiveDate:     z.string().min(1),
  policyTermMonths:  z.union([z.literal(6), z.literal(12)]),
  insuredType:       z.enum(['Individual', 'Commercial']),
  firstName:         z.string().optional(),
  lastName:          z.string().optional(),
  companyName:       z.string().optional(),
  isAge65OrOlder:    z.boolean().optional(),
  mailingAddress:    AddressSchema,
  intermediaryId:    z.number().optional(),
  productId:         z.number()
}).refine(
  data => data.insuredType !== 'Individual' || (!!data.firstName && !!data.lastName),
  { message: 'First and last name required for individual insureds', path: ['firstName'] }
).refine(
  data => data.insuredType !== 'Commercial' || !!data.companyName,
  { message: 'Company name required for commercial insureds', path: ['companyName'] }
)
```

**Form fields:**
- Effective Date (date picker, required)
- Policy Term (radio: 6 or 12 months, required)
- Insured Type (radio: Individual / Commercial, required)
- First Name, Last Name (required if Individual)
- Company Name (required if Commercial)
- Is Age 65 or Older (checkbox, required if Individual — AC-US-POLICY-001-01)
- Mailing Address (AddressInput component)
- Intermediary (dropdown, defaults to caller's IntermediaryId)
- Product (dropdown, required)

**Validation:** On submit. Missing required fields block submission with inline error messages (AC-US-POLICY-001-03).

---

### 2.3 `Step2RiskLocation.tsx`

**File:** `src/domains/policy/pages/QuoteWizard/steps/Step2RiskLocation.tsx`

**Props:**
```typescript
interface Step2Props {
  quoteId: number;
  onComplete: (data: RiskLocationResult) => void;
}
```

**State:**
- React Hook Form + Zod (address fields)
- React Query `useMutation` — `POST /api/v1/geocoding/resolve`
- React Query `useMutation` — `PUT /api/v1/quotes/{quoteId}/risk-location`
- Local state: geocodeResult, hexCatBlocked (bool)

**Form fields:**
- Address Line 1, City, State, Zip Code (all required)

**Behavior flow:**
1. User enters address → clicks "Geocode Address"
2. `POST /api/v1/geocoding/resolve` called; lat/lon displayed on map embed
3. User confirms → `PUT /api/v1/quotes/{quoteId}/risk-location` called
4. If response `hexCatStatus = "Not Approved"` → display blocking error message; prevent next button (AC-US-POLICY-002-02)
5. If `hexCatStatus = "Approved"` → enable Next; pass result to Step 3

**Child components:** `GoogleMapEmbed.tsx` (display only), `RiskAssessmentSummary.tsx`

---

### 2.4 `Step4Coverage.tsx`

**File:** `src/domains/policy/pages/QuoteWizard/steps/Step4Coverage.tsx`

**Props:**
```typescript
interface Step4Props {
  quoteId: number;
  onComplete: (data: CoverageResult) => void;
}
```

**State:** React Hook Form + Zod; React Query `useMutation` — `PUT /api/v1/quotes/{quoteId}/coverage`

**Form fields:**
- Dwelling Limit (currency input, required)
- Deductible Type (dropdown, required)
- Coverage Level (dropdown, required)
- Additional Coverages (repeatable section — add/remove)
- Mortgagees (repeatable section — MortgageeInput per lienholder)
- Additional Insureds (repeatable section)

**On successful submission:** Renders `PremiumBreakdown.tsx` with returned premium calculation (read-only).

---

### 2.5 `PolicyListPage.tsx`

**File:** `src/domains/policy/pages/PolicyListPage.tsx`
**Permission:** `[POLICY_LIST.View]`

**Props:** None

**State:**
- React Query `useQuery` — `GET /api/v1/policies?page=n&pageSize=25&status=...`
- Local state: filter values, pagination

**Child components:**
- `DataTable` (shadcn/ui) with columns: PolicyNumber, Status Badge, Insured Name, Effective Date, Expiration Date, Premium, Actions
- `PolicyStatusBadge.tsx`
- Filter bar (status dropdown, date range picker, search input)

**Behavior:**
- IntermediaryProducer: sees only their policies (enforced server-side; UI does not filter)
- "New Quote" button visible only if `usePermission('POLICY_LIST', 'create')`

---

### 2.6 `PolicyDetailPage.tsx`

**File:** `src/domains/policy/pages/PolicyDetailPage.tsx`
**Permission:** `[POLICY_LIST.View]`

**Props:** `policyId: number` (from route param)

**State:** React Query `useQuery` — `GET /api/v1/policies/{policyId}`

**Child components (tabs):**
- `PolicyCoverageTab.tsx` — coverage limits, risk information, mortgages
- `PolicyBillingTab.tsx` — payment plan, transaction history
- `PolicyDocumentsTab.tsx` — documents list with download; `AccessSensitiveDoc` gate
- `PolicyHistoryTab.tsx` — audit trail of status changes and transactions

**Action buttons (permission-gated):**
- Endorse: `usePermission('POLICY_LIST', 'edit')`
- Cancel: `usePermission('POLICY_LIST', 'edit')`
- Renew: `usePermission('POLICY_LIST', 'edit')`

---

### 2.7 `PremiumBreakdown.tsx` (Shared Component)

**File:** `src/domains/policy/components/PremiumBreakdown.tsx`

**Props:**
```typescript
interface PremiumBreakdownProps {
  riskPremium:     number;
  coveragePremium: number;
  taxes:           number;
  policyFee:       number;  // Always 195.00 (BR-POL-FEE-001)
  totalPremium:    number;
  isReadOnly:      boolean;
}
```

**State:** None — pure display component

**Renders:** Itemized table: Risk Premium, Coverage Premium, Taxes, Policy Fee ($195.00), Total Premium (bold)

---

### 2.8 `TranzPayRedirectButton.tsx`

**File:** `src/domains/billing/components/TranzPayRedirectButton.tsx`
**Purpose:** Handles the TranzPay hosted redirect flow

**Props:**
```typescript
interface TranzPayRedirectButtonProps {
  policyId: number;
  paymentRequest: InitiatePaymentRequest;
  onSuccess: (transactionId: number) => void;
  onFailure: (error: string) => void;
}
```

**State:**
- React Query `useMutation` — `POST /api/v1/billing/{policyId}/payment/initiate`
- React Query `useQuery` (polling) — `GET /api/v1/billing/payment/status/{callId}` every 3 seconds while status = "Pending"
- Local state: `isRedirecting`, `thirdPartyCallId`, `pollingActive`

**Behavior:**
1. Click "Pay Now" → mutate payment initiate endpoint
2. Store `thirdPartyCallId`; redirect browser to `redirectUrl`
3. On return (PaymentCallbackPage.tsx), resume polling on `thirdPartyCallId`
4. When status = "Success" → call `onSuccess`; when "Failed" → call `onFailure`

---

## Section 3: Domain 2 — Claims

### 3.1 `ClaimsListPage.tsx`

**File:** `src/domains/claims/pages/ClaimsListPage.tsx`
**Permission:** `[CLAIMS_LIST.View]`

**State:**
- React Query `useQuery` — `GET /api/v1/claims?page=n&pageSize=25`
- Local state: filters (status, adjuster, date range)

**Child components:** `DataTable`, `ClaimStatusBadge.tsx`

**Behavior:** Adjuster role: API enforces scope; UI shows all returned claims (no client-side filter).

---

### 3.2 `FNOLPage.tsx`

**File:** `src/domains/claims/pages/FNOLPage.tsx`
**Permission:** `[CLAIMS_LIST.Create]`

**Props:** None

**State:**
- React Hook Form + Zod
- React Query `useMutation` — `POST /api/v1/claims`

**Zod schema:**
```typescript
FnolSchema = z.object({
  policyId:    z.number({ required_error: 'Policy is required' }),
  claimTypeId: z.number(),
  lossDate:    z.string().min(1, 'Loss date is required'),
  reportedBy:  z.string().min(1),
  description: z.string().optional()
})
```

**Form fields:**
- Policy (searchable dropdown — `GET /api/v1/policies?status=Active`)
- Claim Type (dropdown)
- Loss Date (date picker)
- Date Reported (auto-filled = today)
- Reported By (text input)
- Description (textarea)

**Behavior on duplicate response (409):**
- Show warning dialog: "An open claim may already exist for this policy with this loss date. Claim #{existingClaimId}. Do you want to proceed?"
- Requires explicit confirmation before re-submitting with confirmation flag

---

### 3.3 `ClaimDetailPage.tsx`

**File:** `src/domains/claims/pages/ClaimDetailPage.tsx`
**Permission:** `[CLAIMS_LIST.View]`

**Props:** `claimId: number` (route param)

**State:** React Query `useQuery` — `GET /api/v1/claims/{claimId}`

**Child components (tabs):**
- `ClaimStatusWorkflow.tsx` — visual status timeline
- `WorksheetTab.tsx` — worksheet with reserves; needs `[CLAIM_WORKSHEET.View]`
- `ClaimDocumentsTab.tsx` — with `SensitiveDocGate.tsx`
- `ClaimHistoryTab.tsx`

**Action buttons:**
- Assign Adjuster: `usePermission('CLAIMS_LIST', 'edit')`
- Close/Deny: `usePermission('CLAIMS_LIST', 'approveReject')`

---

### 3.4 `WorksheetPage.tsx`

**File:** `src/domains/claims/pages/WorksheetPage.tsx`
**Permission:** `[CLAIM_WORKSHEET.View]`

**Props:** `claimId: number` (route param)

**State:**
- React Query `useQuery` — `GET /api/v1/claims/{claimId}/worksheet`
- React Query `useMutation` — `POST /api/v1/claims/{claimId}/worksheet/approve`

**Child components:**
- `ReserveAllocationTable.tsx` — per-coverage reserve amounts (editable if `[CLAIM_WORKSHEET.Edit]`)
- `WorksheetPaymentsTable.tsx` — disbursement payment records

**Behavior:**
- Approve button visible only if `usePermission('CLAIM_WORKSHEET', 'approveReject')` (AC-US-CLAIMS-004-02)
- On approve mutation success: optimistic status update; invalidate query

---

### 3.5 `ClaimStatusWorkflow.tsx`

**File:** `src/domains/claims/components/ClaimStatusWorkflow.tsx`

**Props:**
```typescript
interface ClaimStatusWorkflowProps {
  currentStatus: string;
  statusHistory: StatusHistoryEntry[];
}
```

**State:** None — display only

**Renders:** Horizontal timeline: FNOL → Open → In Review → (Closed | Denied). Current status highlighted. History entries show date and actor.

---

## Section 4: Domain 3 — Distribution

### 4.1 `IntermediaryListPage.tsx`

**File:** `src/domains/distribution/pages/IntermediaryListPage.tsx`
**Permission:** `[DISTRIBUTION.View]`

**State:** React Query — `GET /api/v1/distribution/intermediaries`

**Behavior:** IntermediaryProducer role: API returns only their Intermediary; UI renders accordingly.

---

### 4.2 `IntermediaryDetailPage.tsx`

**File:** `src/domains/distribution/pages/IntermediaryDetailPage.tsx`
**Permission:** `[DISTRIBUTION.View]`

**Props:** `intermediaryId: number`

**State:** React Query — `GET /api/v1/distribution/intermediaries/{intermediaryId}`

**Child components:**
- `ProducerTable.tsx` — list of producers under this intermediary
- `CommissionRateDisplay.tsx` — commission percentage (read-only unless `[DISTRIBUTION.Edit]`)

**Form fields (inline edit, `[DISTRIBUTION.Edit]`):**
- Commission Percentage (decimal input) — HUMAN_VALIDATION_REQUIRED display note

---

### 4.3 `CommissionConfigPage.tsx`

**File:** `src/domains/distribution/pages/CommissionConfigPage.tsx`
**Permission:** `[DISTRIBUTION.Edit]`

**State:** React Query — `GET /api/v1/distribution/commissions`; `useMutation` for updates

**Renders:** Table of policies with commission percentages; inline editable commission rate per intermediary.

> **HUMAN_VALIDATION_REQUIRED:** Commission percentage changes directly affect financial calculations. This screen must be reviewed before enabling in production.

---

## Section 5: Domain 4 — Identity & Access

### 5.1 `LoginPage.tsx`

**File:** `src/domains/identity/pages/LoginPage.tsx`
**Permission:** Public

**State:**
- React Hook Form + Zod
- React Query `useMutation` — `POST /api/v1/auth/login`
- Zustand `authStore.login`

**Zod schema:**
```typescript
LoginSchema = z.object({
  email:    z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
  mfaCode:  z.string().length(6).optional()
})
```

**Form fields:**
- Email (type="email", required)
- Password (type="password", required)
- MFA Code (conditionally shown after first submit if role requires MFA)

**Behavior:**
1. Submit email + password
2. If `requiresMfaSetup = true` in response → redirect to `/auth/mfa/setup`
3. If response includes MFA challenge → show MFA code field; re-submit with code
4. On success → call `authStore.login(tokens, user)` → `permissionStore.loadPermissions()` → navigate to `/dashboard`
5. On 401 → show generic "Invalid email or password" (no field-specific error to prevent enumeration)
6. On 403 → show "Account locked" message

---

### 5.2 `UserListPage.tsx`

**File:** `src/domains/identity/pages/UserListPage.tsx`
**Permission:** `[USER_LIST.View]`

**State:** React Query — `GET /api/v1/users`; local filter state

**Child components:** `DataTable` with columns: UserCode, Name, Email, Role, Active, Groups Count, Actions

**"New User" button:** Visible only if `usePermission('USER_LIST', 'create')`

---

### 5.3 `UserDetailPage.tsx`

**File:** `src/domains/identity/pages/UserDetailPage.tsx`
**Permission:** `[USER_LIST.View]`

**Props:** `userId: number`

**State:**
- React Query — `GET /api/v1/users/{userId}`
- React Query `useMutation` — `PUT /api/v1/users/{userId}`

**Form fields (editable if `[USER_LIST.Edit]`):**
- First Name, Last Name, Phone
- Role (dropdown — requires careful validation: demoting ClientAdmin requires MFA setup review)
- Intermediary ID (if IntermediaryProducer)
- Adjuster ID (if Adjuster)
- Active toggle

**Child components:** `GroupMembershipPanel.tsx`

---

### 5.4 `GroupListPage.tsx`

**File:** `src/domains/identity/pages/GroupListPage.tsx`
**Permission:** `[USER_GROUP_PAGE.View]`

**State:** React Query — `GET /api/v1/groups`

**Child components:** `DataTable` with columns: GroupName, Members Count, Lead, Status, Actions

---

### 5.5 `GroupDetailPage.tsx`

**File:** `src/domains/identity/pages/GroupDetailPage.tsx`
**Permission:** `[USER_GROUP_PAGE.View]`

**Props:** `groupId: number`

**State:**
- React Query — `GET /api/v1/groups/{groupId}`
- React Query `useMutation` — `POST /api/v1/groups/{groupId}/members`
- React Query `useMutation` — `DELETE /api/v1/groups/{groupId}/members/{userId}`
- React Query `useMutation` — `PUT /api/v1/groups/{groupId}/permissions`

**Child components:**
- `GroupMembershipPanel.tsx`
- `PermissionMatrix.tsx`

---

### 5.6 `PermissionMatrix.tsx`

**File:** `src/domains/identity/components/PermissionMatrix.tsx`
**Purpose:** 65+ screens × 10 flags permission editor grid

**Props:**
```typescript
interface PermissionMatrixProps {
  groupId:     number;
  permissions: ScreenPermission[];  // current state from API
  readOnly:    boolean;             // true if !usePermission('USER_GROUP_PAGE', 'edit')
  onSave:      (updated: ScreenPermission[]) => void;
}
```

**State:** Local `useState` — draft permission state before save

**Renders:** Virtualized grid (react-window or shadcn/ui Table) — screen names as rows, 10 flag columns as headers. Checkboxes per cell. "AllAccess" column: when checked, all other checkboxes in the row appear checked (visual shorthand). Save button triggers `PUT /api/v1/groups/{groupId}/permissions`.

**Performance note:** Grid may render 65+ rows × 10 columns = 650 cells. Virtualize if screen count grows. Initial load: React Query cache; mutation: optimistic update.

---

### 5.7 `GroupMembershipPanel.tsx`

**File:** `src/domains/identity/components/GroupMembershipPanel.tsx`
**Purpose:** Add/remove users from a group; triggers synchronous privilege revocation on remove

**Props:**
```typescript
interface GroupMembershipPanelProps {
  groupId:  number;
  members:  UserSummary[];
  readOnly: boolean;
}
```

**State:**
- React Query `useMutation` — `POST /api/v1/groups/{groupId}/members`
- React Query `useMutation` — `DELETE /api/v1/groups/{groupId}/members/{userId}`
- Local: user search state

**Behavior on member removal:**
- Display confirmation dialog: "Removing this user will immediately revoke their permissions for this group. Continue?"
- On confirm: call DELETE endpoint; invalidate `permissionStore` for affected user (if same browser session)
- API handles Redis cache invalidation synchronously within DB transaction (NFR-006)

---

### 5.8 `MfaSetup.tsx`

**File:** `src/domains/identity/components/MfaSetup.tsx`

**Props:**
```typescript
interface MfaSetupProps {
  onComplete: () => void;
}
```

**State:**
- React Query `useMutation` — `POST /api/v1/auth/mfa/setup`
- React Query `useMutation` — `POST /api/v1/auth/mfa/verify`
- Local: verificationCode input

**Renders:**
1. QR code image (generated from `qrCodeUri`)
2. Manual entry code (base32 secret)
3. Verification code input (6-digit numeric)
4. "Verify" button → calls verify endpoint; on success calls `onComplete`

---

## Section 6: Shared Components

### 6.1 `DataTable` (shadcn/ui wrapper)

**File:** `src/components/shared/DataTable.tsx`

**Props:**
```typescript
interface DataTableProps<T> {
  columns:     ColumnDef<T>[];
  data:        T[];
  isLoading:   boolean;
  pagination:  { page: number; pageSize: number; totalCount: number; onPageChange: (p: number) => void };
}
```

**Renders:** shadcn/ui Table with sorting, pagination controls, loading skeleton.

---

### 6.2 `PolicyStatusBadge.tsx`

**File:** `src/domains/policy/components/PolicyStatusBadge.tsx`

**Props:** `status: string`

**Renders:** Colored badge chip per status:
- Draft → gray
- Approved → blue
- Active → green
- Lapsed → orange
- Cancelled → red
- Expired → dark gray
- Non-Renewed → purple

---

### 6.3 `SasDownloadButton.tsx`

**File:** `src/domains/documents/components/SasDownloadButton.tsx`
**Purpose:** Request time-limited SAS URL; open in new tab

**Props:**
```typescript
interface SasDownloadButtonProps {
  documentId:  number;
  fileName:    string;
  isSensitive: boolean;
}
```

**State:** React Query `useMutation` — `GET /api/v1/documents/{documentId}/download`

**Behavior:**
- If `isSensitive` and `!usePermission('DOCUMENTS_LIST', 'accessSensitiveDoc')` → button disabled with tooltip "Insufficient permissions"
- On click → call download endpoint → open `sasUrl` in `_blank` tab (15-min expiry)
- API enforces permission server-side — UI gate is defense-in-depth only

---

### 6.4 `SensitiveDocGate.tsx`

**File:** `src/domains/documents/components/SensitiveDocGate.tsx`

**Props:**
```typescript
interface SensitiveDocGateProps {
  isSensitive: boolean;
  children:    React.ReactNode;
}
```

**State:** `usePermission('DOCUMENTS_LIST', 'accessSensitiveDoc')`

**Renders:** Children if `!isSensitive || hasAccessSensitiveDoc`; otherwise renders a "Restricted Document" placeholder card.

---

## Section 7: State Architecture Summary

| State Category | Store / Mechanism | Persistence | Scope |
|---|---|---|---|
| Auth tokens + user | Zustand `authStore` | Memory (session; refreshed on tab reload) | Global |
| Permission map | Zustand `permissionStore` | Memory; loaded at login | Global |
| UI state (modals, sidebar) | Zustand `uiStore` | Memory | Global |
| Quote wizard multi-step data | Zustand `quoteWizardStore` | Memory (lost on navigate away — warn user) | Feature |
| API server state (lists, details) | React Query cache | Memory; stale times per data type | Per query key |
| Form field values | React Hook Form (uncontrolled) | Component lifecycle | Local |
| Filter/pagination state | `useState` | Component lifecycle | Local |

**React Query stale times (from ART-3-004 §5.2):**
- Reference data (lookup tables, products): `staleTime: 5 * 60 * 1000` (5 minutes)
- Operational data (policies, claims in progress): `staleTime: 30 * 1000` (30 seconds)
- Payment callback status: `staleTime: 0` (real-time polling)

---

## Section 8: Open Doubts (DBT-4-FORGE) Raised in This Document

| DBT ID | Severity | Statement | Affected Components |
|--------|----------|-----------|---------------------|
| DBT-4-FORGE-007 | LOW | The `PermissionMatrix.tsx` grid renders up to 65 screens × 10 flags. If the screen count grows, virtualization (react-window) will be needed. Initial implementation should log a warning if screen count > 80. | `PermissionMatrix.tsx` |
| DBT-4-FORGE-008 | LOW | Payment callback polling (`PaymentCallbackPage.tsx`) uses a 3-second refetch interval. If TranzPay callback takes > 60 seconds, the UI may time out. Engineer must implement a maximum polling duration (suggest 5 minutes) with a graceful "Please check your transaction history" fallback. | `TranzPayRedirectButton.tsx` |

---

*End of ART-4-004 — Component Specifications | INSUREEDGE-2026 | FORGE Phase | 2026-06-17*
*Status: AI_GENERATED. Covers 5 priority modules: Q&P, Claims, Distribution, Identity, Groups. Permission enforcement pattern applied throughout. HUMAN_VALIDATION_REQUIRED on financial display components. 2 DBT-4-FORGE items raised.*
