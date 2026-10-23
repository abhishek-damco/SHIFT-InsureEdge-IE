# Critical Merge Fixes - Document Generation & API Stability

**Date Fixed:** July 2026  
**Root Cause:** Silent error handling in Plumsail integration + disabled endpoints  
**Impact:** Document generation hung for 100+ seconds without reporting actual errors

## Critical Fixes (DO NOT REVERT WITHOUT UNDERSTANDING)

### 1. **Plumsail API Error Response Checking** ⚠️ CRITICAL
**File:** `Backend/src/InsureEdge.Infrastructure/Documents/DocumentGenerationService.cs`

**The Problem:**
- `GetFileUrlAsync()` returns a tuple: `(filePath, success, message)`
- Previous code ignored the `success` flag and `message` (error details)
- When Plumsail returned 4xx/5xx errors, we treated them as "job not ready" and retried 50 times
- Result: Document generation silently timed out after 100 seconds instead of immediately reporting the Plumsail error

**The Fix:**
```csharp
var (path, success, message) = await _plumsail.GetFileUrlAsync(quoteJobId);
if (!success)
    return new GenerateDocumentResult(false, $"Plumsail error: {message}", ...);
```

**Why This Matters:**
- Plumsail errors now surface immediately with specific details (template validation failed, missing field, etc.)
- Without this check, the error is hidden for 100 seconds
- Future developers: **NEVER** ignore the success flag returned by Plumsail

---

### 2. **LimitsAndCoverages Endpoint Must Stay Enabled** ⚠️ IMPORTANT
**File:** `Backend/src/InsureEdge.API/Controllers/RatingController.cs`

**The Problem:**
- Endpoint was accidentally commented out with other Rating endpoints
- Other endpoints (PlanComparison, Rate, HBPolicyTaxDetails) depend on missing HbisPlanComparisonChart/Rater classes
- But LimitsAndCoverages uses HbisLimitsAndCoveragesService which DOES exist
- Result: `GET /api/hbis/limits-and-coverages/{id}` returns 404, breaks Finalize Quote screen

**The Fix:**
- Moved `LimitsAndCoverages` endpoint OUTSIDE the disabled comment block
- Kept other 3 endpoints commented (they still need missing classes)

**Why This Matters:**
- Finalize Quote screen loads limits/coverage data via this endpoint
- If disabled, user sees "Failed to load limits and coverages" error
- Future developers: Do NOT comment out LimitsAndCoverages with other disabled endpoints

---

### 3. **User Entity [NotMapped] Attributes** ⚠️ IMPORTANT
**File:** `Backend/src/InsureEdge.Domain/Entities/User.cs`

**The Problem:**
- `User.ProducerId` and `User.Producer` properties don't have corresponding database columns
- Without `[NotMapped]`, EF Core tries to SELECT non-existent columns
- Result: Login fails with "column u.producer_id does not exist"

**The Fix:**
```csharp
[NotMapped]
public long? ProducerId { get; set; }
[NotMapped]
public Producer? Producer { get; set; }
```

**Why This Matters:**
- These are in-memory-only properties for producer self-service login scope
- If removing [NotMapped], you MUST create a database migration first
- Future developers: These properties will never have database columns

---

### 4. **State/Zip Field Mapping** 
**File:** `Backend/src/InsureEdge.Infrastructure/Documents/DocumentGenerationService.cs` (line ~515)

**The Fix:**
```csharp
["NamedInsuredAddressState"] = F("state"),  // Was: F("zip") - WRONG!
```

**Why This Matters:**
- Plumsail template expects state field to contain actual state, not zip code
- Malformed template data caused silent Plumsail processing failures
- Future developers: Watch for field name mismatches between form data and template tokens

---

## How to Prevent Future Breakage

### Before Merging Code
1. ✅ Check if any rating endpoints are being commented/uncommented (especially LimitsAndCoverages)
2. ✅ Check if any Plumsail integration code changes (verify success flag checks stay in place)
3. ✅ Check if User entity properties are being added/removed (verify [NotMapped] is used correctly)
4. ✅ Verify document generation works end-to-end

### Testing Document Generation
```
1. Create a new quote (New Business)
2. Navigate to "Finalize Quote" screen
3. Verify "Limits & Coverages" section loads (no 404 errors)
4. Click "Generate Document" button
5. Verify document generates or shows specific error (not generic timeout)
```

### What to Look For in Merge Conflicts
- `DocumentGenerationService.cs`: Ensure Plumsail success flag checks are present
- `RatingController.cs`: Ensure LimitsAndCoverages endpoint is NOT in comment block
- `User.cs`: Ensure [NotMapped] attributes are preserved
- `Program.cs`: Ensure RatingService is registered

---

## Error Messages (What They Mean)

### If You See These, Here's What Broke:

| Error | Cause | Fix |
|-------|-------|-----|
| "Document generation failed. Please try again." (after 100 sec) | Plumsail errors being ignored | Check Plumsail success flag |
| "Failed to load limits and coverages" (404) | LimitsAndCoverages endpoint disabled | Move it outside comment block |
| "column u.producer_id does not exist" (login fails) | Missing [NotMapped] attributes | Add [NotMapped] to ProducerId/Producer |
| "Plumsail: Invalid template data" | State/zip fields swapped or malformed | Verify BuildQuoteProposalDecJson mappings |

---

## References
- **Commit Messages:** Search git history for "CRITICAL FIX" or "Plumsail error response"
- **Related Files:**
  - `PlumsailDocumentGenerator.cs` - Returns (path, success, message) tuple
  - `HbisLimitsAndCoveragesService.cs` - Loads limit defaults
  - `DocumentGenerationService.cs` - Main document generation orchestration
  
---

**Last Updated:** July 2026  
**Reviewed By:** [AI-assisted merge conflict resolution]
