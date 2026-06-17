# ART-1-003 — Security & Roles Catalogue
## InsureEdge Application Modernization (INSUREEDGE-2026)
**Produced by:** Security Agent
**Phase:** SCAN
**Date:** 2026-06-16
**Confidence:** HIGH (all major findings grounded in HIGH-confidence evidence)

---

## 1. Role Inventory

**Source:** EV-0-0226 (roles_permissions.md), EV-0-0222 (usermanagement PRD)

| Role ID | Display Name | OutSystems Source Name | Scope | Capabilities Summary | Key Restrictions |
|---------|-------------|----------------------|-------|----------------------|-----------------|
| ROLE-001 | Platform Admin | PlatformAdmin | System-wide (all tenants) | Full access to all clients, modules, screens, and data. Manages all other roles. Bypasses all permission and scope checks. | None — no permission or scope check applies |
| ROLE-002 | Client Admin | ClientAdmin | Single client (tenant) scope | Full CRUD on users, groups, policies, claims, billing, and reports within their ClientId. Can manage permissions for users and groups within their tenant. | Scoped to their ClientId; cannot access other tenants |
| ROLE-003 | Intermediary / Producer | IntermediaryProducer | Client + Intermediary scope | Create/view quotes and policies for clients they serve. Can view commissions and distribution data. | Scoped by both ClientId and IntermediaryId; no claims or admin access |
| ROLE-004 | Adjuster | Adjuster | Client + Adjuster scope | Claims processing: create FNOL, view and update assigned claims, manage claim documents and worksheets. Own profile only. | Scoped to assigned claims via AdjusterId; no policy or billing access |
| ROLE-005 | User (Base) | UserRole | Client scope | Minimal authenticated access. Specific screen access granted entirely through group/screen permissions. | Per-group permissions; no default access beyond login and own profile |

**FND Reference:** INSUREEDGE-2026-FND-1-SEC-001 (EV-0-0226)

### Role × Module Access Matrix

| Module / Screen | PlatformAdmin | ClientAdmin | IntermediaryProducer | Adjuster | UserRole |
|----------------|--------------|------------|---------------------|----------|----------|
| Login / Auth | Full | Full | Full | Full | Full |
| Dashboard | Full | Scoped | Scoped | Scoped | Per group |
| ClaimsList | Full | Scoped (client) | Scoped (client) | Scoped (assigned) | Per group |
| ClaimDetail | Full | Scoped | Read-only | Scoped (assigned) | Per group |
| ClaimWorksheet | Full | Per IsApproveReject | None | Per IsApproveReject | Per group |
| ClaimDocuments | Full | Per Upload/Download | None | Per Upload/Download | Per group |
| QuoteList/PolicyList | Full | Scoped (client) | Scoped (intermediary) | None | Per group |
| NewQuote | Full | Full (client) | Full (own) | None | Per group |
| CoverageManager | Full | Per IsEditPermission | Per IsEditPermission | None | None |
| BillingList | Full | Scoped | Scoped | None | Per group |
| MakePayment | Full | Per IsCreatePermission | None | None | None |
| ClientList / ClientDetail | Full | Own only | None | None | None |
| IntermediaryList/Detail | Full | Full (client) | Own only | None | None |
| GroupList/Detail | Full | Full (client) | None | None | None |
| UserList/Detail | Full | Full (client) | None | None | Own profile only |
| ReportList/Viewer | Full | Scoped | Scoped | Scoped | Per group |
| ProductList/Detail | Full | None | None | None | None |
| PlatformAdminDashboard | Full | None | None | None | None |

---

## 2. Permission Model

**Source:** EV-0-0226, EV-0-0048, EV-0-0010

### 2.1 The 10 Permission Flags

| Flag # | Source Name | Display Name | Meaning |
|--------|------------|--------------|---------|
| 1 | IsViewPermission | View | Can see/read the screen and its data |
| 2 | IsCreatePermission | Add / Create | Can create new records on this screen |
| 3 | IsEditPermission | Edit | Can modify existing records |
| 4 | IsApproveReject | Approve / Reject | Can approve or reject workflow items (claims, submissions) |
| 5 | IsDuplicatePermission | Clone / Duplicate | Can duplicate/copy an existing record |
| 6 | IsUploadPermission | Upload | Can upload files and documents |
| 7 | IsDownloadPermission | Download | Can download files and documents |
| 8 | IsViewSensitiveInfo | Sensitive Data | Can unmask sensitive fields (SSN, bank account, routing numbers) |
| 9 | IsAccessSensitiveDoc | Sensitive Documents | Can open/download documents tagged as sensitive |
| 10 | AllAccess | All Access | Overrides all individual flags — grants full access to this screen |

**FND Reference:** INSUREEDGE-2026-FND-1-SEC-002 (EV-0-0226)

### 2.2 Group-Based Permission Inheritance

1. Users are assigned to one or more Groups (via the `GroupUser_Table` join table).
2. Each Group has `screen_permissions` records — one row per screen, carrying all 10 flags.
3. A user's **effective permissions** for a screen = the **union (logical OR)** of all their groups' flag rows for that screen.
4. If **any** group grants `AllAccess = true` for a screen, the user has full access regardless of other flags.
5. Scope filters (ClientId, IntermediaryId, AdjusterId) apply even when `AllAccess = true`.

**Group operations (EV-0-0010):**
- `CreateGroupsUsers` (BL-05): Full membership sync — deletes users not in new list, adds new ones, then calls `CreatePrivilegesforGroupUsers`.
- `UpdateGroupsUsers` (BL-31): Permission-gated — requires `USERGROUPPAGE` permission before performing the sync.
- `DeleteGroupUser` (BL-11): Removes membership, then triggers **asynchronous** privilege cleanup via `LaunchDeleteUserGroupPrivelagesUpdated`.

### 2.3 Permission Evaluation Flow

```
Request to access Screen X
    │
    ▼
Is user PlatformAdmin?
    ├─ YES → Allow, no further checks
    └─ NO
        │
        ▼
Fetch all screen_permissions where GroupId IN (user's groups)
AND ScreenId = X AND ClientId = user's ClientId
        │
        ▼
Union all permission flags across matching rows
        │
        ▼
Apply scope filter:
    - ClientAdmin: filter data to user.ClientId
    - IntermediaryProducer: filter to user.IntermediaryId
    - Adjuster: filter claims to user.AdjusterId (assigned only)
        │
        ▼
Check specific action flag (IsCreatePermission, IsEditPermission, etc.)
    ├─ Flag = true OR AllAccess = true → Allow
    └─ Flag = false → Redirect to InvalidPermissions screen
```

---

## 3. Multi-Tenancy Enforcement

**Source:** EV-0-0226, EV-0-0011, EV-0-0010

| Scope Filter | Source Field | Applied To | Enforcement Point |
|-------------|-------------|-----------|-------------------|
| Client scope | `ClientId` | All entities | Every non-PlatformAdmin query |
| Intermediary scope | `IntermediaryId` | Policies, quotes, commissions, distribution | After ClientId filter for IntermediaryProducer |
| Adjuster scope | `AdjusterId` | Claims only | After ClientId filter for Adjuster |
| Visibility | `Visibility` | Configurable per screen_permission | Further narrows record access per group |

**Tenant resolution chain:** `OS User.TenantId` → `Client.OSTenantID` → `Client.Id` (used throughout as `ClientId`). Implemented in `GetClientIdByUserId_CS`.

**Risk:** `GetClientIdByUserId_CS` returns 0 for null UserId. Callers not guarding against `ClientId = 0` may leak cross-tenant data (RSK-1-SEC-008).

---

## 4. Sensitive Data Controls

**Source:** EV-0-0226

| Field | Masking Default | Flag to Unmask |
|-------|----------------|----------------|
| SSN / TIN | Displayed as `****` | `IsViewSensitiveInfo = true` |
| Bank account numbers | Displayed as `****` | `IsViewSensitiveInfo = true` |
| Routing numbers | Displayed as `****` | `IsViewSensitiveInfo = true` |

**Critical design gap:** Masking is enforced at the **screen/display layer only** — the data is fetched from the database regardless. In a REST API rebuild, API responses must enforce redaction at the serialization layer.

---

## 5. Authentication Pattern

**Source:** EV-0-0222, EV-0-0012

| Observation | Confidence |
|------------|-----------|
| Session-based authentication (cookie) | HIGH |
| OutSystems platform [User] table stores credentials via EncryptPassword | HIGH |
| Email = Username in OutSystems [User] table | HIGH |
| Password reset token stored in UserPasswordReset table, 30-min expiry | HIGH |
| Client onboarding token: 24-hour expiry, existence-only check (no code match) | HIGH |
| No OAuth, JWT, OIDC, or SAML evidence | HIGH (by absence) |
| MFA: not implemented | ASM (no evidence) |
| Session timeout: exists but duration unknown | ASM |

---

## 6. Encryption Controls

**Source:** EV-0-0012, EV-0-0230

| Property | Value |
|----------|-------|
| Algorithm | AES-256 CBC + HMAC-256 (Encrypt-then-MAC) |
| Padding | PKCS7 |
| Library | `RssExtensionCryptoAPI` (OutSystems extension) |
| Key storage | OutSystems site property `Base64Key`, provider "Environment" |
| Key rotation | No evidence of automated rotation |

**What is encrypted:** URL parameters (UserId, GroupId), sensitive application data fields.

**Password hashing:** `EncryptPassword` → `RsseSpaceUsers.MssEncryptPassword(Username, Password)`. Exact algorithm proprietary to OutSystems Users extension (SHA-1 / bcrypt / PBKDF2 not confirmed — DBT-1-SEC-001).

---

## 7. Security Risks

| Risk ID | Severity | Statement | Mitigation |
|---------|----------|-----------|------------|
| INSUREEDGE-2026-RSK-1-SEC-001 | CRITICAL | Default password `[REDACTED-BOOTSTRAP-CREDENTIAL]` stored in plaintext in `User2.Password` at bootstrap. `UpdateUsersPassword` targets these rows but completion status unknown. | Confirm migration ran to completion in all environments; block new plaintext user creation. |
| INSUREEDGE-2026-RSK-1-SEC-002 | HIGH | Onboarding token validation (`IsResetPasswordTokenValid_ClientOnboarding`) checks existence only — does not verify token value. 24-hour account takeover window. | Apply code-comparison logic from standard reset flow. |
| INSUREEDGE-2026-RSK-1-SEC-003 | HIGH | `AllAccess = true` on any group is a single-point privilege escalation vector. "All Access Group" observed in test environment. | Alert on AllAccess group modifications; require dual-approval for group membership changes. |
| INSUREEDGE-2026-RSK-1-SEC-004 | HIGH | Async privilege cleanup after group removal (`LaunchDeleteUserGroupPrivelagesUpdated`) creates race window where removed user retains permissions. | Revoke privileges synchronously, or add reconciliation job with monitoring. |
| INSUREEDGE-2026-RSK-1-SEC-005 | HIGH | Sensitive field masking is screen-layer only — data is fetched to server regardless. REST API rebuild must enforce API-level redaction. | Enforce `IsViewSensitiveInfo` at API response serialization layer. |
| INSUREEDGE-2026-RSK-1-SEC-006 | MEDIUM | No MFA evidence. Insurance platform with financial data should require MFA for PlatformAdmin and ClientAdmin roles. | Implement TOTP/SMS MFA for privileged roles. |
| INSUREEDGE-2026-RSK-1-SEC-007 | MEDIUM | AES key stored as OutSystems site property — accessible to LifeTime admins; may appear in environment exports. | Migrate to Azure Key Vault with managed identity in target architecture. |
| INSUREEDGE-2026-RSK-1-SEC-008 | MEDIUM | `GetClientIdByUserId_CS` returns 0 for null UserId. Unguarded callers may expose cross-tenant data. | Return exception rather than 0; add defensive guard in all callers. |
| INSUREEDGE-2026-RSK-1-SEC-009 | MEDIUM | No audit log evidence for PlatformAdmin cross-tenant actions. AuditLogRecordRecent filters by session+module only. | Capture all PlatformAdmin data-access events with ClientId context. |
| INSUREEDGE-2026-RSK-1-SEC-010 | LOW | Google Maps API key fetched client-side — visible in browser developer tools. | Restrict key by domain in Google Cloud Console; use server-side proxy. |

---

## 8. Cross-Domain Referrals

| REF ID | Target | Finding |
|--------|--------|---------|
| REF-SEC-DATA-001 | Data Agent | Audit schema: which tables lack ClientId? Confirm intentionally global tables (Product, Module, AppScreen). |
| REF-SEC-DATA-002 | Data Agent | `GetClientAdmin` queries `User2 WHERE IsAdmin=1` without ClientId filter — confirm whether intentional. |
| REF-SEC-LOGIC-001 | Logic Agent | `AllAccess` bypasses all individual permission flags — confirm no business rules (approval, financial limits) are undermined. |
| REF-SEC-LOGIC-002 | Logic Agent | `USERGROUPPAGE` named permission is a string literal — trace where this privilege is defined, granted, and revoked. |
| REF-SEC-LOGIC-003 | Logic Agent | `GetClientIdByUserId_CS` returns 0 for null UserId — identify all callers and confirm null-guard. |
| REF-SEC-LOGIC-004 | Logic Agent | `UpdateUsersPassword` targets `Password = '[REDACTED-BOOTSTRAP-CREDENTIAL]'` — confirm migration has run to completion. |

---

*End of ART-1-003 — Security & Roles Catalogue | INSUREEDGE-2026 | SCAN Phase | 2026-06-16*
