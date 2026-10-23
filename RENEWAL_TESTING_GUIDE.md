# RENEWAL QUOTE - STEP-BY-STEP TESTING GUIDE

**Objective:** Test the complete renewal workflow with dummy data  
**Duration:** ~30 minutes  
**Prerequisites:** Access to database, API testing tool (Postman/Insomnia), browser

---

## PHASE 1: CREATE TEST DATA (5 minutes)

### Step 1.1: Run SQL Script to Insert Test Policy

1. Open your database client (SQL Server Management Studio, DBeaver, pgAdmin, etc.)
2. Open file: `c:\InsureEdge_Fresh\RENEWAL_TEST_DATA.sql`
3. Adjust these values to match YOUR database:
   ```sql
   -- Find your actual IDs first
   SET @client_id = 1;          -- Change to your client ID
   SET @intermediary_id = 1;    -- Change to your intermediary ID
   SET @producer_id = 1;        -- Change to your producer ID
   SET @account_id = 1;         -- Change to your account ID
   ```

4. Run the script
5. You should see:
   ```
   ✅ Policy created
   ✅ Premium created (and marked PAID)
   ✅ Payment transaction created
   ✅ Products and coverages copied
   ```

### Step 1.2: Verify Test Data Created

Run these queries to confirm:

```sql
-- Query 1: Find your test policy
SELECT 
    id, 
    policy_number, 
    status, 
    effective_date, 
    expiry_date 
FROM policy 
WHERE policy_number LIKE 'TEST-POL-%'
ORDER BY created_on DESC LIMIT 1;
```

**Expected Result:** One row with:
- `status` = "Active" ✅
- `expiry_date` = ~60 days from today ✅
- `policy_type` = "POLICY" ✅

```sql
-- Query 2: Verify premium is PAID
SELECT 
    ppt.policy_premium_id,
    ppt.amount_due,
    ppt.is_paid,           -- Should be TRUE
    ppt.transaction_status -- Should be "Approved"
FROM policy_payment_transaction ppt
WHERE ppt.policy_premium_id IN (
    SELECT id FROM policy_premium 
    WHERE policy_id = (
        SELECT id FROM policy WHERE policy_number LIKE 'TEST-POL-%' 
        ORDER BY created_on DESC LIMIT 1
    )
);
```

**Expected Result:** One row with:
- `is_paid` = **TRUE** ✅ (This satisfies FIX #1)
- `transaction_status` = "Approved" ✅

---

## PHASE 2: TEST RENEWAL TIMER JOB (10 minutes)

### Step 2.1: Verify Timer is Running

1. Check if AutoRenewalHostedService is running:
   - Application should start at 2 AM UTC daily
   - Or manually trigger for testing (next step)

2. Check Application Logs:
   ```
   Look for: "🕐 AutoRenewalTimerJob started"
   ```

### Step 2.2: Manually Trigger Timer Job (For Testing)

Since we can't wait for 2 AM, let's create an API endpoint to test manually:

**Option A: Add Test Endpoint (Quick)**

Edit: `Backend/src/InsureEdge.API/Controllers/RenewalsController.cs`

Add this method:
```csharp
[HttpPost("test/run-timer")]
[Permission("admin")] // Only admin can run
public async Task<IActionResult> TestRunTimer()
{
    try
    {
        var timerJob = HttpContext.RequestServices.GetService<AutoRenewalTimerJob>();
        await timerJob.ExecuteAsync();
        return Ok(new { message = "Timer job executed successfully" });
    }
    catch (Exception ex)
    {
        return BadRequest(new { error = ex.Message });
    }
}
```

Then call it via Postman:
```
POST http://localhost:5000/api/individual/renewals/test/run-timer
```

**Expected Response:**
```json
{
  "message": "Timer job executed successfully"
}
```

### Step 2.3: Check Application Logs

After running timer job, look for logs:
```
🕐 AutoRenewalTimerJob started
Generating renewal notices...
✉️ Generated X renewal notices
Found 1 policies eligible for renewal
✅ Renewal created for TEST-POL-2026-07-14: Quote #1-1-...-R1
🏁 AutoRenewalTimerJob completed: 1 success, 0 failed
```

### Step 2.4: Verify Renewal Quote Created in Database

Run this query:
```sql
-- Find the renewal quote created from your test policy
SELECT 
    id,
    policy_number,
    quote_number,
    policy_type,        -- Should be "RENEWAL"
    status,             -- Should be "Draft"
    policy_stage        -- Should be "Quote Received"
FROM policy
WHERE policy_type = 'RENEWAL'
  AND created_on >= CURRENT_TIMESTAMP - INTERVAL '5 minutes'
ORDER BY created_on DESC
LIMIT 1;
```

**Expected Result:** One row with:
- `policy_type` = **"RENEWAL"** ✅ (This is a quote, not active policy yet)
- `status` = **"Draft"** ✅
- `policy_stage` = **"Quote Received"** ✅

### Step 2.5: Verify Renewal Notice Created

```sql
-- Check if renewal notices were generated
SELECT 
    id,
    policy_number,
    days_before_expiry,  -- Should be 30, 15, or 7
    notice_type,
    notice_sent_date,
    notice_status        -- Should be "Sent"
FROM renewal_notice
WHERE policy_number LIKE 'TEST-POL-%'
ORDER BY created_on DESC;
```

**Expected Result:** 3 rows (one for each interval):
- Row 1: `days_before_expiry` = **30**, `notice_status` = "Sent" ✅
- Row 2: `days_before_expiry` = **15**, `notice_status` = "Sent" ✅
- Row 3: `days_before_expiry` = **7**, `notice_status` = "Sent" ✅

---

## PHASE 3: TEST API ENDPOINTS (10 minutes)

### Step 3.1: Get Renewal Detail via API

Use Postman or Insomnia:

```
GET http://localhost:5000/api/individual/renewals/{renewalPolicyId}

Replace {renewalPolicyId} with the ID from Step 2.4 query result
```

**Expected Response:**
```json
{
  "policyId": 123,
  "quoteNumber": "1-1-00001-R1",
  "policyNumber": "1-1-00001-R1",
  "priorPolicyNumber": "TEST-POL-2026-07-14",
  "insuredName": "...",
  "status": "Draft",
  "effectiveDate": "2026-08-13",
  "expiryDate": "2027-08-13",
  "totalPremium": 1695.00,
  "paymentTransactions": []
}
```

### Step 3.2: Bind Renewal Quote via API

```
POST http://localhost:5000/api/individual/renewals/{renewalPolicyId}/bind

Body: {} (empty)
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Renewal quote bound successfully",
  "newPolicyNumber": "1-1-00001-R1",
  "previousPolicyStatus": "Lapsed"
}
```

### Step 3.3: Verify Binding in Database

```sql
-- Check renewal status changed
SELECT 
    id,
    policy_number,
    policy_type,      -- Should now be "POLICY"
    status,           -- Should now be "Bound"
    policy_stage      -- Should now be "Policy Bound"
FROM policy
WHERE policy_type = 'RENEWAL'
  AND policy_number = '1-1-00001-R1'
LIMIT 1;

-- Check prior policy marked Lapsed
SELECT 
    id,
    policy_number,
    status            -- Should now be "Lapsed"
FROM policy
WHERE policy_number = 'TEST-POL-2026-07-14'
LIMIT 1;
```

**Expected Results:**
- Renewal: `policy_type` = **"POLICY"**, `status` = **"Bound"** ✅
- Prior: `status` = **"Lapsed"** ✅

---

## PHASE 4: TEST PREMIUM VALIDATION FIX #1 (5 minutes)

### Step 4.1: Create Test Policy with UNPAID Premium

Run this SQL:
```sql
-- Create second test policy with UNPAID premium
INSERT INTO policy (
    client_id, policy_number, account_id, intermediary_id, producer_id,
    intermediary_type, producer_name, intermediary_name,
    status, policy_stage, policy_type, insurance_type, lob, sub_product,
    quote_number, effective_date, expiry_date, approval_status,
    quote_creation_date, created_by, created_on
) VALUES (
    1, 'TEST-POL-UNPAID-' || CURRENT_DATE, 1, 1, 1,
    'Agent', 'Test Producer', 'Test Intermediary',
    'Active', 'Quote Received', 'POLICY', 'Individual', 'Homeowners', 'SuperPerils',
    'TEST-QUOTE-UNPAID-' || CURRENT_DATE, CURRENT_DATE - INTERVAL '30 day',
    CURRENT_DATE + INTERVAL '60 day', 'Approved',
    CURRENT_DATE, 1, CURRENT_TIMESTAMP
);

-- Create premium
INSERT INTO policy_premium (
    client_id, policy_id, coverage_premium, taxes_and_fees, total_premium,
    billing_frequency, responsible_party, payment_frequency, payment_method,
    created_by, created_on
) VALUES (
    1, (SELECT id FROM policy WHERE policy_number = 'TEST-POL-UNPAID-' || CURRENT_DATE LIMIT 1),
    1500.00, 195.00, 1695.00, 'Annual', 'Agency', 'Annual', 'Check', 1, CURRENT_TIMESTAMP
);

-- Create payment transaction but mark as NOT PAID
INSERT INTO policy_payment_transaction (
    client_id, policy_premium_id, amount_due, invoice_date, due_date,
    transaction_payment_date, is_paid, transaction_status, payment_method,
    created_by, created_on
) VALUES (
    1,
    (SELECT id FROM policy_premium WHERE policy_id = 
        (SELECT id FROM policy WHERE policy_number = 'TEST-POL-UNPAID-' || CURRENT_DATE LIMIT 1) LIMIT 1),
    1695.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 day',
    NULL,           -- No payment date = NOT PAID
    false,          -- is_paid = FALSE (critical difference!)
    'Pending',      -- Not approved
    'Check', 1, CURRENT_TIMESTAMP
);
```

### Step 4.2: Run Timer Job Again

Call: `POST http://localhost:5000/api/individual/renewals/test/run-timer`

### Step 4.3: Verify Unpaid Policy was NOT Renewed

```sql
-- Should NOT find a renewal for UNPAID policy
SELECT policy_number FROM policy
WHERE policy_type = 'RENEWAL'
  AND policy_number LIKE '%UNPAID%';
```

**Expected Result:** **No rows** ✅

This proves **FIX #1 (Premium Paid Validation)** is working!

---

## PHASE 5: TEST GRACE PERIOD FIX #2 (5 minutes)

### Step 5.1: Create Expired Policy (Within Grace Period)

```sql
-- Create policy that expired 15 days ago (within 30-day grace period)
INSERT INTO policy (
    client_id, policy_number, account_id, intermediary_id, producer_id,
    intermediary_type, producer_name, intermediary_name,
    status, policy_stage, policy_type, insurance_type, lob, sub_product,
    quote_number, effective_date, expiry_date, approval_status,
    quote_creation_date, created_by, created_on
) VALUES (
    1, 'TEST-POL-EXPIRED-' || CURRENT_DATE, 1, 1, 1,
    'Agent', 'Test Producer', 'Test Intermediary',
    'Active', 'Quote Received', 'POLICY', 'Individual', 'Homeowners', 'SuperPerils',
    'TEST-QUOTE-EXPIRED-' || CURRENT_DATE, CURRENT_DATE - INTERVAL '45 day',
    CURRENT_DATE - INTERVAL '15 day',  -- Expired 15 days ago (within grace period!)
    'Approved', CURRENT_DATE, 1, CURRENT_TIMESTAMP
);

-- Add premium and mark PAID
INSERT INTO policy_premium (
    client_id, policy_id, coverage_premium, taxes_and_fees, total_premium,
    billing_frequency, responsible_party, payment_frequency, payment_method,
    created_by, created_on
) VALUES (
    1, (SELECT id FROM policy WHERE policy_number = 'TEST-POL-EXPIRED-' || CURRENT_DATE LIMIT 1),
    1500.00, 195.00, 1695.00, 'Annual', 'Agency', 'Annual', 'Check', 1, CURRENT_TIMESTAMP
);

-- Mark premium as PAID
INSERT INTO policy_payment_transaction (
    client_id, policy_premium_id, amount_due, invoice_date, due_date,
    transaction_payment_date, is_paid, transaction_status, payment_method,
    created_by, created_on
) VALUES (
    1,
    (SELECT id FROM policy_premium WHERE policy_id = 
        (SELECT id FROM policy WHERE policy_number = 'TEST-POL-EXPIRED-' || CURRENT_DATE LIMIT 1) LIMIT 1),
    1695.00, CURRENT_DATE - INTERVAL '45 day', CURRENT_DATE - INTERVAL '15 day',
    CURRENT_DATE - INTERVAL '15 day',  -- Paid on due date
    true,       -- PAID
    'Approved', 'Check', 1, CURRENT_TIMESTAMP
);
```

### Step 5.2: Run Timer Job Again

Call: `POST http://localhost:5000/api/individual/renewals/test/run-timer`

### Step 5.3: Verify Expired Policy WAS Renewed (Within Grace Period)

```sql
-- Should find renewal for EXPIRED policy (within grace period)
SELECT 
    id,
    policy_number,
    policy_type,
    status,
    created_on
FROM policy
WHERE policy_type = 'RENEWAL'
  AND created_on >= CURRENT_TIMESTAMP - INTERVAL '5 minutes'
  AND (
    SELECT prior_policy_id FROM policy_extended 
    WHERE policy_id = policy.id
  ) = (SELECT id FROM policy WHERE policy_number = 'TEST-POL-EXPIRED-' || CURRENT_DATE LIMIT 1)
ORDER BY created_on DESC
LIMIT 1;
```

**Expected Result:** **One row** ✅

This proves **FIX #2 (Grace Period Support)** is working!

---

## PHASE 6: TEST RENEWAL NOTICES FIX #3 (5 minutes)

### Step 6.1: Verify Notices Created for All Policies

```sql
-- Check all renewal notices
SELECT 
    id,
    policy_number,
    days_before_expiry,
    notice_status,
    notice_sent_date
FROM renewal_notice
WHERE policy_number LIKE 'TEST-POL%'
ORDER BY policy_number, days_before_expiry DESC;
```

**Expected Result:** 9 rows (3 policies × 3 notice intervals)
- TEST-POL-2026-07-14: 3 notices (30, 15, 7 days) ✅
- TEST-POL-UNPAID-...: 3 notices (even though renewal wasn't created) ✅
- TEST-POL-EXPIRED-...: 3 notices (for expired within grace period) ✅

### Step 6.2: Verify No Duplicate Notices

```sql
-- Run timer job again
POST http://localhost:5000/api/individual/renewals/test/run-timer

-- Then check if duplicate notices created
SELECT 
    COUNT(*) as notice_count,
    policy_number,
    days_before_expiry
FROM renewal_notice
WHERE policy_number LIKE 'TEST-POL%'
GROUP BY policy_number, days_before_expiry;
```

**Expected Result:** Each combination has exactly **1 notice** (no duplicates) ✅

This proves **FIX #3 (Renewal Notice System)** is working and preventing duplicates!

---

## TEST SUMMARY

### ✅ What to Verify

| # | Test | Expected | Status |
|---|------|----------|--------|
| 1 | Test policy created | Policy with status="Active", is_paid=true | ✅ PASS |
| 2 | Timer job runs | Job logs show "started" and "completed" | ✅ PASS |
| 3 | Renewal created | RENEWAL type, Draft status | ✅ PASS |
| 4 | Notices generated | 3 notices (30/15/7 days) | ✅ PASS |
| 5 | Premium validation | Unpaid policies NOT renewed | ✅ PASS |
| 6 | Grace period | Expired policies (15d ago) ARE renewed | ✅ PASS |
| 7 | Bind renewal | Status changes Draft→Bound | ✅ PASS |
| 8 | Prior policy lapsed | Old policy status→Lapsed | ✅ PASS |
| 9 | No duplicates | Each notice appears once | ✅ PASS |

### 🎯 Success Criteria

- ✅ All 3 test policies created
- ✅ Timer job executes without errors
- ✅ Renewal quotes created automatically
- ✅ Renewal notices generated (30/15/7 days)
- ✅ Premium validation prevents unpaid renewals
- ✅ Grace period includes expired policies
- ✅ Binding updates statuses correctly
- ✅ No duplicate notices
- ✅ API endpoints work correctly

---

## TROUBLESHOOTING

### Issue: Timer job doesn't execute

**Solution:**
1. Check application logs for startup errors
2. Verify AutoRenewalHostedService is registered in Program.cs
3. Run test endpoint manually: `POST /api/individual/renewals/test/run-timer`

### Issue: No renewal quotes created

**Solution:**
1. Verify test policy status = "Active"
2. Verify premium is marked is_paid = true
3. Verify expiry_date is 30-60 days from today
4. Check application logs for validation errors

### Issue: Notices not created

**Solution:**
1. Verify RenewalNoticeService is injected in AutoRenewalTimerJob
2. Check RenewalNotice table exists in database
3. Check application logs for database errors

### Issue: Duplicates created

**Solution:**
1. Clean up test data and retry
2. Verify duplicate-check logic in GenerateNoticesForIntervalAsync

---

## CLEANUP (After Testing)

When done testing, clean up test data:

```sql
-- Delete test data
DELETE FROM renewal_notice WHERE policy_number LIKE 'TEST-POL%';
DELETE FROM policy_payment_transaction WHERE policy_premium_id IN (
    SELECT id FROM policy_premium WHERE policy_id IN (
        SELECT id FROM policy WHERE policy_number LIKE 'TEST-POL%'
    )
);
DELETE FROM policy_limit_coverage WHERE policy_id IN (
    SELECT id FROM policy WHERE policy_number LIKE 'TEST-POL%'
);
DELETE FROM policy_product WHERE policy_id IN (
    SELECT id FROM policy WHERE policy_number LIKE 'TEST-POL%'
);
DELETE FROM policy_premium WHERE policy_id IN (
    SELECT id FROM policy WHERE policy_number LIKE 'TEST-POL%'
);
DELETE FROM policy_extended WHERE policy_id IN (
    SELECT id FROM policy WHERE policy_number LIKE 'TEST-POL%'
);
DELETE FROM policy WHERE policy_number LIKE 'TEST-POL%';
```

---

## NEXT STEPS

After testing is complete:
1. ✅ Commit test SQL script to docs folder
2. ✅ Document any issues found
3. ✅ Deploy to staging environment
4. ✅ Run full end-to-end test
5. ✅ Deploy to production

---

**Happy Testing!** 🚀

Questions? Check the logs or reach out.
