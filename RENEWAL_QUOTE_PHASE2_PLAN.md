# Phase 2: Backend Integration & Renewal Data Prefill

**Objective:** Enable NewSubmission to load and prefill renewal quote data from the linked original policy

---

## Discovery: Current Data Loading Flow

**Location:** `NewSubmission.tsx` lines 5259-5337 (loadSubmission function)

**Current Flow:**
```
loadSubmission() {
  1. GET /api/submissions/{id}
  2. Parse dataJson field
  3. Merge with defaults
  4. Load locations, mortgages, additionalInsureds, additionalOrgs
  5. Load limits & coverages from getLimitsAndCoverages()
  6. Set form state
}
```

**What We Need to Add:**
- Detect if this is a renewal quote (check policy_type)
- Load original policy data via backend
- Prefill form fields from original policy
- Apply renewal-specific field disable rules

---

## Phase 2 Implementation Steps

### Step 1: Verify Backend Returns Renewal Info

**Question:** When we call `GET /api/submissions/{id}` for a renewal quote, does it return:
- `policy_type: 'RENEWAL'`
- Link to original policy?
- Original policy ID?

**Action:** Check SubmissionDto type definition and GetSubmission API response structure.

### Step 2: Extend Backend to Load Original Policy Data

**If not already included**, the backend should return:
```json
{
  "id": "renewal_id",
  "policy_type": "RENEWAL",
  "priorPolicyId": 8,
  "priorPolicyNumber": "TEST-RENEW-POL-20260716-001",
  "form": { ... },
  "status": "Draft",
  ...
}
```

**Action:** Extend GetSubmission endpoint to include prior policy info if policy_type='RENEWAL'

### Step 3: Create Renewal Prefill Logic

**Location:** NewSubmission.tsx loadSubmission() function

**Changes:**
```typescript
async function loadSubmission() {
  const submission = await quotesPoliciesApi.getSubmission(id);
  const data = { ...submission };
  
  // NEW: Check if this is a renewal quote
  const isRenewal = data.policy_type === 'RENEWAL';
  
  if (isRenewal && data.priorPolicyId) {
    // NEW: Load original policy data
    const originalPolicy = await quotesPoliciesApi.getPolicyData(data.priorPolicyId);
    
    // NEW: Prefill form from original policy
    const renewalForm = {
      ...form,
      // Copy from original policy
      insuredName: originalPolicy.insuredName,
      lob: originalPolicy.lob,
      subProduct: originalPolicy.subProduct,
      // Don't copy these; calculate them:
      effectiveDate: addOneDay(originalPolicy.expiryDate),
      expirationDate: addOneYear(originalPolicy.expiryDate),
      // ... other fields
      
      // Mark as renewal
      isRenewal: true,
    };
    
    setForm(renewalForm);
    setLocations(originalPolicy.locations || []);
    setMortgages(originalPolicy.mortgages || []);
    // ... etc
  }
}
```

### Step 4: Add Renewal Field Disable Rules

**Location:** Throughout NewSubmission rendering code

**Pattern:**
```typescript
const isRenewalQuote = form.isRenewal === true;
const isClientAdmin = !isLoggedInUserProducer; // or check profile

// In JSX:
<input 
  value={form.insuredName}
  disabled={isRenewalQuote && isClientAdmin}
/>
```

**Fields to Disable for Client Admin on Renewals:**
- Insured Name (or make it read-only display)
- Line of Business
- Sub Product
- Country
- Primary Insured Type
- Effective Date (show only, don't disable - it's calculated)
- Expiry Date (show only)
- Intermediary (if linking to renewal flow)
- Producer (if applicable)

**Fields to Allow Editing:**
- Location (can change addresses)
- Risk Information (can update)
- Coverage/Limits (can modify)
- Mortgage information
- Additional insured/orgs

---

## Required Backend Changes

### 1. SubmissionDto Extension

**File:** `Backend/src/InsureEdge.Application/DTOs/QuotesPolicies/SubmissionDto.cs`

**Add fields:**
```csharp
public string? PolicyType { get; set; }  // "NEWBUSINESS", "RENEWAL", "ENDORSEMENT"
public long? PriorPolicyId { get; set; } // Link to original policy
public string? PriorPolicyNumber { get; set; } // Original policy number
```

### 2. GetSubmission Endpoint Enhancement

**File:** `Backend/src/InsureEdge.API/Controllers/SubmissionsController.cs`

**Logic:**
```csharp
public async Task<IActionResult> GetSubmission(string id)
{
  var submission = await _service.GetSubmissionAsync(id);
  if (submission == null) return NotFound();
  
  // If this is a renewal, also load original policy info
  if (submission.PolicyType == "RENEWAL" && submission.PriorPolicyId.HasValue) {
    var originalPolicy = await _policyService.GetPolicyAsync(submission.PriorPolicyId.Value);
    submission.PriorPolicyNumber = originalPolicy?.PolicyNumber;
    // Potentially copy location/risk data if needed
  }
  
  return Ok(submission);
}
```

### 3. New API Method: Get Original Policy Data (Optional)

**Endpoint:** `GET /api/renewals/{renewalPolicyId}/prior-policy`

**Purpose:** Load complete original policy data for prefill

**Returns:** Original policy structure (name, LOB, locations, risks, etc.)

---

## Frontend Changes Summary

### File: `NewSubmission.tsx`

**Changes Required:**
1. Modify `loadSubmission()` to detect renewal quotes
2. Add prefill logic for renewal data
3. Add `isRenewal` flag to FormState
4. Update field rendering to disable/readonly based on `isRenewal`
5. Update all `Field()` components to accept `disabled` prop
6. Add renewal dates auto-calculation

**Estimated changes:** ~200-300 lines

### File: `quotesPolicies.ts` (API)

**Additions:**
- Extend `getSubmission()` type to include PolicyType/PriorPolicyId
- Add `getPriorPolicy(renewalPolicyId)` method if needed

---

## Incremental Testing Checkpoints

✅ **After Step 1:** Verify backend returns policy_type for renewal quotes

✅ **After Step 2:** Confirm original policy data is included in response

✅ **After Step 3:** Prefill data appears in form on load

✅ **After Step 4:** Fields are properly disabled for client users

✅ **Full Phase 2:** Complete flow works - load renewal → see prefilled data → verify field states

---

## Known Gaps

1. **Location/Risk prefill complexity:** How much detail needs to be copied? (Address, coverage, limits, etc.) - Verify from PRD
2. **Underwriter role:** Different enable/disable rules for underwriter role - Not yet addressed
3. **UW Specific Change step:** Separate screen for underwriter modifications - Phase 3 task
4. **Payment gate:** Show in Finalize Quote for renewals - Phase 3 task

---

## Next Action

**Before implementing:** Verify backend structure by checking:
1. What does `getSubmission()` currently return for a renewal quote?
2. Does it include PolicyType and PriorPolicyId?
3. What is the exact data structure?

If backend doesn't return this info, add it first (Step 2 above).

---

*Status: Ready for Step 1 verification*
