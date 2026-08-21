# Renewal Quote Implementation Analysis & PRD-to-Code Mapping

**Date:** 2026-07-16  
**Status:** Pre-Implementation Analysis  
**Scope:** Align current implementation with Renewal Quote PRD requirements

---

## CRITICAL FINDING: Implementation Architecture Mismatch

### Current Implementation (INCORRECT)
- Created a separate `RenewalDetail.tsx` component
- Single-page detail view with action buttons (Bind, Payment, etc.)
- Direct route: `/quotes-policies/:insuredType/renewals/:renewalPolicyId`
- Does not follow PRD stepper flow

### PRD Requirement (CORRECT)
- Renewal Quotes navigate through the **existing NewSubmission stepper**
- Multi-step flow: Policy Info → Risk → Quote Review → Finalize Quote → Documents
- Route: `/quotes-policies/submissions/{id}?step={stepNumber}` (same as New Business Quotes)
- Reuses all existing blocks and components

---

## Implementation Architecture Decision

**DECISION:** Remove the separate RenewalDetail component. Route Renewal Quotes to NewSubmission stepper instead.

**RATIONALE:**
1. PRD explicitly shows stepper flow using existing blocks
2. Reduces code duplication
3. Leverages existing form, validation, and save logic
4. Reuses document generation, rating, and finalize quote functionality
5. Maintains consistency with New Business Quote flow

---

## PRD-to-Code Mapping

### 1. Dashboard View Entry Point

| PRD Requirement | Current Code | Status | Action Required |
|---|---|---|---|
| Renewal listing with View action | RenewalRegister.tsx (existing) | ✅ Exists | Modify navigation from `/renewals/{id}` to `/submissions/{id}?renewalQuote=1` |
| View action: log → encrypt → HexCat → navigate | RenewalRegister.tsx | ❌ Missing backend | Implement backend logging and HexCat lookup for renewals |
| Navigate to NewSubmission stepper | RenewalRegister.tsx | ❌ Missing | Update onClick to navigate to `/quotes-policies/{insuredType}/submissions/{renewalPolicyId}?step=0` |

**Files to Change:**
- `Frontend/src/pages/QuotesPolicies/RenewalRegister.tsx` — Change navigation target

---

### 2. NewSubmission Stepper Flow

| PRD Step | Component Block | Current Code | Status | Action Required |
|---|---|---|---|---|
| Step 0: Policy Information | PolicyInfo_HB_Optimized | NewSubmission.tsx (lines ~1000-2000) | ✅ Exists | Add renewal-specific prefill logic |
| Step 1: Location | Location popup | NewSubmission.tsx (existing) | ✅ Exists | Prefill from original policy location |
| Step 2: Risk Information | HBISRiskInformation_Optimized | NewSubmission.tsx (existing) | ✅ Exists | Prefill from original policy risk data |
| Step 3: Plans Overview | Homeowners_HB block | NewSubmission.tsx (existing) | ✅ Exists | Reuse; load from renewal policy |
| Step 4: UW Specific Change | NEW SCREEN | NewSubmission.tsx | ❌ Missing | Create new screen for underwriter-specific changes (renewal-only) |
| Step 5: Quote Review | QuoteReview_HB_Optimized block | NewSubmission.tsx (existing) | ✅ Exists | Reuse; show renewal-specific data |
| Step 6: Finalize Quote | FinalizeQuote_HB block | NewSubmission.tsx (existing) | ✅ Exists | Reuse; add renewal payment gate |
| Step 7: Documents | Documents_HB / CreateClientDocuments_HB | NewSubmission.tsx (existing) | ✅ Exists | Reuse; generate renewal-specific documents |

---

### 3. Field Prefill and Mapping

**Prefill Source:** Original policy linked via `policy_extended.prior_policy_id`

| Field | Source | Action | Status |
|---|---|---|---|
| Insured Name | account.first_name + last_name | Prefill, disable | ✅ Reuse existing prefill |
| Line of Business | policy.lob | Prefill, disable | ✅ Reuse |
| Sub Product | policy.sub_product | Prefill, disable | ✅ Reuse |
| Effective Date | policy.expiry_date + 1 day | Prefill, disable | ✅ Reuse |
| Expiry Date | policy.expiry_date + 1 year | Prefill, disable | ✅ Reuse |
| Location | policy_location (from original) | Prefill, editable | ✅ Reuse |
| Risk Information | policy_risk_information | Prefill, editable | ✅ Reuse |
| Limits & Coverages | policy_limit_coverage | Prefill, allow changes | ✅ Reuse |
| Premium | Recalculate via rating engine | Read-only display | ✅ Reuse rating engine |
| Producer | policy.producer_id | Prefill, disable for client admin | ✅ Reuse |
| Intermediary | policy.intermediary_id | Prefill, disable for client admin | ✅ Reuse |

---

### 4. Renewal-Specific Features

| Feature | PRD Requirement | Current Code | Status | Action Required |
|---|---|---|---|---|
| **Eligibility Check** | Validate active policy, premium paid, expiry date | Missing | ❌ Missing | Implement backend validation (eligibility service) |
| **Original Policy Link** | Display "Prior Policy: {number}" | NewSubmission.tsx | ✅ Can show in header | Add display of original policy number |
| **UW Specific Change** | Optional underwriter modifications to coverage/limits | Missing | ❌ Missing | Create new step with change tracking |
| **Field Editability** | Most fields disabled for client, editable for underwriter | NewSubmission.tsx | Partial | Update field disable rules based on role and renewal type |
| **Renewal Dates** | Effective = expiry+1, Expiry = expiry+1year | Missing | ❌ Missing | Add auto-calculation on load |
| **Payment Gate** | Payment must be approved before Bind | Finalize quote | Partial | Add payment check in Finalize Quote for renewals |
| **Status/Stage Values** | Renewal-specific statuses: Draft, Pending, Declined, Expired | DB schema | ✅ Exists in DB | Verify status logic in backend |

---

### 5. Reusable Components (No Changes Required)

✅ **Location block** — Reuse as-is  
✅ **Risk Information block** — Reuse as-is  
✅ **Plans Overview block** — Reuse as-is  
✅ **Quote Review block** — Reuse as-is  
✅ **Finalize Quote block** — Reuse with renewal payment gate  
✅ **Documents block** — Reuse as-is  
✅ **Save & Save Next** — Reuse existing logic  
✅ **Rating engine** — Reuse as-is  
✅ **Document generation (Plumsail)** — Reuse as-is  
✅ **Email component** — Reuse as-is  

---

### 6. New Components Required

| Component | Purpose | Scope |
|---|---|---|
| **UW Specific Change Step** | Allow underwriters to modify coverage/limits for renewal quotes | Renewal-only; new React component in NewSubmission |
| **Change Tracking** | Capture what was changed by underwriter and reason | Database: add change reason/audit to policy_extended |
| **Renewal Eligibility Service** | Backend validation of renewal eligibility | Backend: new service method or extend existing RenewalQuoteService |

---

### 7. Backend Changes Required

| Area | Current | Required | Status |
|---|---|---|---|
| **Renewal Policy Retrieval** | RenewalQuoteService.GetRenewalQuoteDetailAsync | Extend for use with NewSubmission form loading | ✅ Exists, needs integration |
| **Prefill Data** | Separate endpoint | Load via existing submissions API with renewal flag | ✅ Reuse |
| **UW Changes Storage** | No mechanism | Add policy_extended columns for change tracking | ❌ Missing |
| **Payment Gate** | No renewal-specific check | Add renewal payment validation in Finalize Quote | ❌ Missing |
| **Status Transitions** | Existing status logic | Verify renewal-specific states work correctly | ✅ Verify needed |
| **Document Generation** | Plumsail integration exists | Use for renewal documents (should work as-is) | ✅ Exists |

---

### 8. Database Changes Required

| Table | Change | Reason | Status |
|---|---|---|---|
| `policy_extended` | Add `uw_change_reason TEXT` | Track underwriter changes during renewal | ❌ New migration |
| `policy_extended` | Add `uw_changed_by BIGINT FK user` | Audit who made UW changes | ❌ New migration |
| `policy_extended` | Add `uw_changed_on TIMESTAMP` | Audit when UW changes were made | ❌ New migration |
| `policy` | Verify renewal status values | Ensure Draft/Pending/Declined/Expired work | ✅ Verify needed |

---

### 9. API Changes Required

| Endpoint | Change | Status |
|---|---|---|
| `GET /submissions/{id}` | Load renewal data if policy_type='RENEWAL' | ✅ Extend existing |
| `PUT /submissions/{id}` | Save renewal form data | ✅ Reuse existing |
| `POST /submissions/{id}/documents/generate-quote-package` | Generate renewal documents via Plumsail | ✅ Reuse existing |
| `POST /renewals/{id}/bind` | Bind renewal after Finalize Quote | ✅ Exists (but not called from UI) |
| `POST /renewals/{id}/process-payment` | Process payment | ✅ Exists (but not called from UI) |

---

### 10. Frontend Routing Changes

**Current (INCORRECT):**
```
View on RenewalRegister → /quotes-policies/:insuredType/renewals/:renewalPolicyId
```

**Required (CORRECT):**
```
View on RenewalRegister → /quotes-policies/submissions/:renewalPolicyId?renewalQuote=1&step=0
```

**Files to change:**
- `Frontend/src/pages/QuotesPolicies/RenewalRegister.tsx` (navigation logic)
- `App.tsx` (no route change needed; reuses existing `/submissions/:id` route)

---

### 11. Deletion: RenewalDetail Component

**Files to DELETE:**
- `Frontend/src/pages/QuotesPolicies/RenewalDetail.tsx` — Entire component (not needed)
- `App.tsx` — Remove route `/quotes-policies/:insuredType/renewals/:renewalPolicyId`

---

## Implementation Steps (Priority Order)

### Phase 1: Remove Incorrect Implementation
1. Delete `RenewalDetail.tsx`
2. Remove RenewalDetail route from `App.tsx`
3. Fix RenewalRegister navigation to use `/submissions/{id}` route

### Phase 2: Backend Setup
1. Extend `RenewalQuoteService.GetRenewalQuoteDetailAsync` to return data suitable for NewSubmission form
2. Add renewal-specific backend validation in existing endpoints
3. Create database migrations for UW change tracking columns
4. Implement payment gate validation for renewal finalize

### Phase 3: Frontend Integration
1. Update NewSubmission to detect renewal quotes via URL param or policy type
2. Add renewal-specific prefill logic (disable most fields for clients)
3. Create UW Specific Change step (if Underwriter role)
4. Update Finalize Quote block to show renewal payment gate
5. Test complete flow through Documents section

### Phase 4: Testing & Verification
1. Test full renewal flow from View → Documents
2. Verify prefill from original policy
3. Test field editability by persona
4. Verify document generation
5. Test all reused components with renewal data
6. Regression test New Business Quote flow

---

## Immediate Action Items

### 🔴 BLOCKING ISSUE: RenewalDetail Component
The current RenewalDetail component must be **deleted immediately** as it conflicts with the PRD architecture.

**Action:**
1. Delete `Frontend/src/pages/QuotesPolicies/RenewalDetail.tsx`
2. Delete route in `App.tsx`
3. Update `RenewalRegister.tsx` to navigate to `/submissions/{renewalPolicyId}?step=0` instead of `/renewals/{id}`

### 🟡 VERIFICATION NEEDED
- Confirm backend RenewalQuoteService can provide complete renewal quote data for form loading
- Verify existing policy linking works correctly
- Confirm Plumsail integration can generate renewal documents

---

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Breaking existing New Business Quote flow | HIGH | Reuse blocks without modification; only add renewal-specific logic in conditionals |
| Incomplete prefill logic | MEDIUM | Thoroughly test prefill from original policy; verify all mapped fields |
| Missing UW Specific Change step | MEDIUM | Create new step component; mark as optional/hidden if underwriter not enabled |
| Payment gate not enforced | MEDIUM | Add explicit check before Finalize Quote for renewals |

---

## Testing Checklist

- [ ] Dashboard View action navigates to correct NewSubmission route
- [ ] Policy Information prefilled with original policy data
- [ ] Non-editable fields disabled for Client Admin
- [ ] Location data prefilled and editable
- [ ] Risk Information prefilled
- [ ] Plans Overview loads and allows modifications
- [ ] Quote Review shows renewal-specific data
- [ ] Finalize Quote displays payment gate for renewals
- [ ] Documents generates and displays correctly
- [ ] New Business Quote flow still works unchanged
- [ ] Permissions enforced (Client Admin can only View)
- [ ] Renewal-specific status/stages work correctly

---

## Final Deliverables (After Implementation)

1. ✅ Renewed RenewalRegister.tsx navigation logic
2. ✅ Updated NewSubmission.tsx with renewal-specific prefill and UW change step
3. ✅ Database migrations for UW change tracking
4. ✅ Backend validation and payment gate logic
5. ✅ Complete test report with regression results
6. ✅ This analysis document updated with actual findings

---

*Status: Ready for Phase 1 implementation*
