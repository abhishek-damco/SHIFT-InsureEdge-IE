# Renewal Quote E2E Testing Plan

## Test Flow: RenewalRegister → NewSubmission Stepper → Bind → Documents

### Step 1: Verify RenewalRegister displays renewal quotes
- [ ] Navigate to Quotes & Policies → Renewals
- [ ] Confirm renewal quotes are visible in the list
- [ ] Verify "View Renewal Quote" action is available

### Step 2: Click "View Renewal Quote" and verify navigation
- [ ] Click action button on a renewal quote
- [ ] Verify redirect to `/quotes-policies/submissions/{renewalPolicyId}?step=0`
- [ ] Verify NewSubmission stepper loads (Policy Information step shows)

### Step 3: Verify renewal quote detection and field state
- [ ] Confirm form is loaded with renewal data
- [ ] If logged in as Producer:
  - [ ] All Policy Information fields are EDITABLE
  - [ ] Can modify: Name, Type, Brokerage, Producer, Address, Phone, Email
- [ ] If logged in as Client Admin:
  - [ ] Policy Information fields are DISABLED (read-only)
  - [ ] Can still edit: Location, Phone, Email (contact info)
  - [ ] Cannot edit: Names, Types, Firm/Producer selections

### Step 4: Navigate through multi-step flow
- [ ] Step 0 (Policy Information): Scroll and verify all sections load
- [ ] Step 1 (Location): Verify locations can be added/edited
- [ ] Step 2 (Risk): Verify risk information is accessible
- [ ] Step 3 (Quote Review): Verify quote summary displays correctly
- [ ] Step 4 (Finalize Quote): Verify payment options are available

### Step 5: Attempt to Bind renewal quote
- [ ] Complete required fields (if any)
- [ ] Click "Bind Policy" or equivalent action
- [ ] Verify binding succeeds
- [ ] Confirm policy status changes to "Bound" or "Active"

### Step 6: Navigate to Documents step
- [ ] Click "Next" to reach Documents step
- [ ] Verify existing policy documents are listed (if any)
- [ ] Attempt to generate/download quote document
- [ ] Verify document generation works correctly

### Step 7: Verify field disable state throughout
- [ ] Switch between steps
- [ ] Confirm disable rules persist
- [ ] Verify no JavaScript errors in console

## Test Data Requirements
- Active test user with producer role (for field editability testing)
- Active test user with client admin role (for field disable testing)
- Existing renewal quote in the database with status "Draft"

## Success Criteria
✅ All navigation works correctly
✅ Field disable logic enforces persona rules
✅ No console errors or exceptions
✅ Bind action succeeds and updates policy status
✅ Documents can be generated for renewal quotes

## Known Issues to Watch For
- RenewalOfPolicyId link navigation (prefill from original policy)
- Field validation on required fields during bind
- Document generation with renewal quote data
