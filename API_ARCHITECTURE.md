# InsureEdge API Architecture

**REST API Design, Endpoints, and Integration Patterns**

---

## 1. API Overview

### Base Configuration
- **Framework:** ASP.NET Core 8.0
- **Pattern:** REST (Representational State Transfer)
- **URL Pattern:** `/api/{resource}`
- **Response Format:** JSON (snake_case naming)
- **Authentication:** HttpOnly Cookie
- **Authorization:** Role-based (ScreenPermissions)
- **Status Codes:** Standard HTTP codes (200, 201, 400, 403, 404, 500)
- **CORS:** Configured for specific origins

### Base URL
- **Development:** `http://localhost:5114/api`
- **Production:** `https://api.insureedge.com/api`

---

## 2. Request/Response Format

### Request Headers
```
GET /api/claims/123 HTTP/1.1
Host: api.insureedge.com
Content-Type: application/json
Accept: application/json
Cookie: insuredge_auth=<signed_cookie>
```

### Response Headers (Success)
```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 456
Set-Cookie: insuredge_auth=<new_cookie>; HttpOnly; SameSite=Strict; Path=/
```

### Response Payload (Snake_case Convention)
```json
{
  "claim_id": 123,
  "claim_number": "CLM-2026-001",
  "policy_id": 456,
  "status": "open",
  "incident_date": "2026-07-28T10:30:00Z",
  "reported_date": "2026-07-31T09:15:00Z",
  "assigned_adjuster_id": 789,
  "reserve_amount": 50000.00,
  "settlement_amount": 0.00,
  "closed_date": null,
  "created_date": "2026-07-31T09:15:00Z"
}
```

### Error Response
```json
{
  "error": "Claim not found",
  "status": 404,
  "timestamp": "2026-07-31T12:34:56Z"
}
```

---

## 3. API Endpoints by Controller

### AuthController (`/api/auth`)

#### Login
```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "user_id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "administrator"
}

Set-Cookie: insuredge_auth=<signed_cookie>
```

#### Logout
```
POST /api/auth/logout
Response: 200 OK

Set-Cookie: insuredge_auth=; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

#### Get Current User
```
GET /api/auth/me
Response: 200 OK
{
  "user_id": 1,
  "email": "user@example.com",
  "client_id": 1,
  "producer_id": null,
  "last_login": "2026-07-31T10:00:00Z"
}
```

#### Get User Permissions
```
GET /api/auth/me/permissions
Response: 200 OK
{
  "screens": [
    {
      "screen_id": 1,
      "screen_name": "Claims Dashboard",
      "can_view": true,
      "can_create": false,
      "can_edit": true,
      "can_delete": false
    },
    {
      "screen_id": 2,
      "screen_name": "Claim Workflow",
      "can_view": true,
      "can_create": false,
      "can_edit": true,
      "can_delete": false
    }
  ]
}
```

#### Update Profile
```
PUT /api/auth/me/profile
Content-Type: application/json

Request Body:
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "555-1234"
}

Response: 200 OK
```

---

### ClaimsController (`/api/claims`)

#### List Claims
```
GET /api/claims
Query Parameters:
  ?status=open&page=1&page_size=50&sort_by=incident_date&sort_order=desc

Response: 200 OK
{
  "data": [
    {
      "claim_id": 123,
      "claim_number": "CLM-2026-001",
      "policy_id": 456,
      "status": "open",
      ...
    }
  ],
  "total_count": 150,
  "page": 1,
  "page_size": 50
}
```

#### Get Claim Details
```
GET /api/claims/123
Response: 200 OK
{
  "claim_id": 123,
  "claim_number": "CLM-2026-001",
  "policy_id": 456,
  "status": "open",
  "incident_date": "2026-07-28",
  "coverages": [
    {
      "coverage_id": 1,
      "coverage_type": "dwelling",
      "limit": 500000,
      "is_covered": true
    }
  ],
  "claimants": [
    {
      "claimant_id": 1,
      "name": "John Smith",
      "role": "insured"
    }
  ],
  "tasks": [
    {
      "task_id": 1,
      "task_type": "investigation",
      "status": "in_progress",
      "due_date": "2026-08-10"
    }
  ]
}
```

#### Create Claim (FNOL)
```
POST /api/claims
Content-Type: application/json

Request Body:
{
  "policy_id": 456,
  "incident_date": "2026-07-28T10:30:00Z",
  "incident_description": "Water damage to dwelling",
  "loss_type": "water_damage"
}

Response: 201 Created
{
  "claim_id": 123,
  "claim_number": "CLM-2026-001",
  ...
}
```

#### Update Claim
```
PUT /api/claims/123
Content-Type: application/json

Request Body:
{
  "status": "investigating",
  "reserve_amount": 50000
}

Response: 200 OK
```

#### Update Claim Status
```
PATCH /api/claims/123/status
Content-Type: application/json

Request Body:
{
  "new_status": "closed"
}

Response: 200 OK
```

---

### PoliciesController (`/api/policies`)

#### List Policies
```
GET /api/policies
Query Parameters:
  ?status=active&effective_date_from=2026-01-01&effective_date_to=2026-12-31&page=1

Response: 200 OK
{
  "data": [
    {
      "policy_id": 456,
      "policy_number": "POL-2026-001",
      "client_id": 1,
      "status": "active",
      "effective_date": "2026-01-01",
      "expiration_date": "2027-01-01",
      "insured_name": "John Smith"
    }
  ],
  "total_count": 500
}
```

#### Get Policy Details
```
GET /api/policies/456
Response: 200 OK
{
  "policy_id": 456,
  "policy_number": "POL-2026-001",
  "status": "active",
  "insured": {
    "insured_id": 1,
    "name": "John Smith",
    "type": "individual"
  },
  "risk_locations": [
    {
      "location_id": 1,
      "address": "123 Main St, Springfield, IL",
      "location_type": "primary_residence"
    }
  ],
  "products": [
    {
      "product_id": 1,
      "product_name": "Homeowners",
      "premium": 1200.00
    }
  ],
  "coverages": [
    {
      "coverage_id": 1,
      "coverage_type": "dwelling",
      "limit": 500000,
      "deductible": 1000
    }
  ],
  "premium_details": {
    "base_premium": 1000.00,
    "rate_factor": 1.1,
    "calculated_premium": 1200.00
  }
}
```

#### Create Policy
```
POST /api/policies
Content-Type: application/json

Request Body:
{
  "client_id": 1,
  "insured_name": "John Smith",
  "effective_date": "2026-01-01",
  "expiration_date": "2027-01-01"
}

Response: 201 Created
{
  "policy_id": 456,
  "policy_number": "POL-2026-001",
  ...
}
```

---

### SubmissionsController (`/api/submissions`)

#### Create Submission (New Quote)
```
POST /api/submissions
Content-Type: application/json

Request Body:
{
  "insured_name": "John Smith",
  "insured_type": "individual",
  "risk_address": "123 Main St, Springfield, IL",
  "coverage_requested": ["dwelling", "personal_property"]
}

Response: 201 Created
{
  "submission_id": 1001,
  "policy_id": 456,
  "status": "pending_underwriting",
  "submission_date": "2026-07-31T10:00:00Z"
}
```

#### Get Submission Status
```
GET /api/submissions/1001
Response: 200 OK
{
  "submission_id": 1001,
  "policy_id": 456,
  "status": "pending_underwriting",
  "current_step": "risk_information",
  "progress_percentage": 40
}
```

---

### RenewalsController (`/api/renewals`)

#### Create Renewal Quote
```
POST /api/renewals
Content-Type: application/json

Request Body:
{
  "policy_id": 456,
  "renewal_date": "2027-01-01"
}

Response: 201 Created
{
  "renewal_id": 2001,
  "policy_id": 456,
  "renewal_date": "2027-01-01",
  "premium": 1300.00,
  "status": "pending_approval"
}
```

#### Get Renewal Details
```
GET /api/renewals/2001
Response: 200 OK
{
  "renewal_id": 2001,
  "prior_policy_id": 456,
  "new_policy_id": 457,
  "renewal_premium": 1300.00,
  "changes": [
    {
      "field": "coverage_dwelling",
      "old_value": "500000",
      "new_value": "550000"
    }
  ]
}
```

---

### EndorsementsController (`/api/endorsements`)

#### Create Endorsement
```
POST /api/endorsements
Content-Type: application/json

Request Body:
{
  "policy_id": 456,
  "endorsement_type": "coverage_increase",
  "changes": {
    "dwelling_limit": 550000
  }
}

Response: 201 Created
{
  "endorsement_id": 3001,
  "policy_id": 456,
  "status": "pending_approval"
}
```

---

### DistributionController (`/api/distribution`)

#### List Intermediaries
```
GET /api/distribution/intermediaries
Response: 200 OK
{
  "data": [
    {
      "intermediary_id": 1,
      "name": "Best Insurance Agency",
      "code": "BIA-001",
      "status": "active"
    }
  ]
}
```

#### Create Intermediary
```
POST /api/distribution/intermediaries
Content-Type: application/json

Request Body:
{
  "name": "Best Insurance Agency",
  "code": "BIA-001",
  "address": "456 Oak Ave, Chicago, IL",
  "phone": "312-555-1234",
  "email": "info@bestinsurance.com"
}

Response: 201 Created
{
  "intermediary_id": 1,
  ...
}
```

#### List Producers
```
GET /api/distribution/producers
Response: 200 OK
{
  "data": [
    {
      "producer_id": 1,
      "name": "Jane Doe",
      "email": "jane@bestinsurance.com",
      "intermediary_id": 1,
      "status": "active"
    }
  ]
}
```

#### Create Producer
```
POST /api/distribution/producers
Content-Type: application/json

Request Body:
{
  "name": "Jane Doe",
  "email": "jane@bestinsurance.com",
  "intermediary_id": 1,
  "license_number": "IL-123456"
}

Response: 201 Created
{
  "producer_id": 1,
  ...
}
```

---

### UsersController (`/api/users`)

#### List Users
```
GET /api/users
Response: 200 OK
{
  "data": [
    {
      "user_id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "groups": ["Administrators"]
    }
  ]
}
```

#### Create User
```
POST /api/users
Content-Type: application/json

Request Body:
{
  "email": "newuser@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "group_ids": [1, 2]
}

Response: 201 Created
{
  "user_id": 2,
  ...
}
```

#### Assign Permissions
```
POST /api/users/2/permissions
Content-Type: application/json

Request Body:
{
  "screen_ids": [1, 2, 3],
  "can_create": true,
  "can_edit": true,
  "can_delete": false
}

Response: 200 OK
```

---

### GroupsController (`/api/groups`)

#### List Groups
```
GET /api/groups
Response: 200 OK
{
  "data": [
    {
      "group_id": 1,
      "name": "Administrators",
      "member_count": 5
    }
  ]
}
```

#### Create Group
```
POST /api/groups
Content-Type: application/json

Request Body:
{
  "name": "Claims Managers",
  "description": "Claims management team"
}

Response: 201 Created
{
  "group_id": 2,
  ...
}
```

#### Add Member to Group
```
POST /api/groups/2/members
Content-Type: application/json

Request Body:
{
  "user_id": 3
}

Response: 200 OK
```

---

### ConfigurationsController (`/api/configurations`)

#### Get Configuration
```
GET /api/configurations
Response: 200 OK
{
  "data": [
    {
      "config_id": 1,
      "name": "company_name",
      "value": "Default Insurance Co"
    }
  ]
}
```

#### Update Configuration
```
PUT /api/configurations
Content-Type: application/json

Request Body:
{
  "config_id": 1,
  "value": "New Company Name"
}

Response: 200 OK
```

---

### RatingController (`/api/rating`)

#### Calculate Premium
```
POST /api/rating/calculate
Content-Type: application/json

Request Body:
{
  "coverage_type": "dwelling",
  "coverage_limit": 500000,
  "risk_address": "123 Main St, Springfield, IL",
  "deductible": 1000
}

Response: 200 OK
{
  "base_premium": 1000.00,
  "rate_factors": [
    {
      "factor_name": "location_risk",
      "factor_value": 0.95
    },
    {
      "factor_name": "construction_type",
      "factor_value": 1.1
    }
  ],
  "calculated_premium": 1200.00
}
```

---

## 4. Authorization Filters

### PermissionAttribute
```csharp
[ApiController]
[Route("api/claims")]
public class ClaimsController : ControllerBase
{
    [HttpGet]
    [Permission("CLAIMS_DASHBOARD", "view")]
    public async Task<IActionResult> GetClaims()
    {
        // Automatically checks if user has permission
        // Throws 403 Forbidden if denied
        return Ok(...);
    }
}
```

**How it works:**
1. Request arrives at controller action
2. `[Permission("CLAIMS_DASHBOARD", "view")]` filter executes
3. Filter queries `screen_permissions` table for user's groups
4. If permission found: request proceeds
5. If permission not found: returns 403 Forbidden

### ProducerOnlyAttribute
```csharp
[ProducerOnly]
public async Task<IActionResult> GetProducerQuotes()
{
    // Only users with Producer role can access
    return Ok(...);
}
```

**Verification:**
- Checks if `User.FindFirst("producer_id")` exists
- Returns 403 if not a producer

---

## 5. Error Handling

### Exception Handling Pipeline

```csharp
// Program.cs
app.UseExceptionHandler(errApp => errApp.Run(async ctx =>
{
    var ex = ctx.Features.Get<IExceptionHandlerFeature>()?.Error;
    var log = ctx.RequestServices.GetRequiredService<ILogger<Program>>();
    
    // Log error with full details
    log.LogError(ex, "Unhandled exception on {Method} {Path}", 
        ctx.Request.Method, ctx.Request.Path);
    
    // Return user-friendly error (no stack trace)
    ctx.Response.StatusCode = 500;
    ctx.Response.ContentType = "application/json";
    await ctx.Response.WriteAsync($"{{\"error\":\"{ex?.Message?.Replace("\"","\\\"") ?? "Unknown error"}\"}}");
}));
```

### Custom Exception Handling

```csharp
// Service layer
public async Task<Claim> GetClaimAsync(int id)
{
    var claim = await _claimRepository.GetByIdAsync(id);
    if (claim == null)
        throw new NotFoundException($"Claim {id} not found");
    return claim;
}

// Controller
[HttpGet("{id}")]
public async Task<IActionResult> GetClaim(int id)
{
    try
    {
        var claim = await _claimService.GetClaimAsync(id);
        return Ok(_mapper.Map<ClaimDto>(claim));
    }
    catch (NotFoundException ex)
    {
        return NotFound(new { error = ex.Message });
    }
    catch (UnauthorizedAccessException ex)
    {
        return Forbid();
    }
}
```

### HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | OK | GET claim successful |
| 201 | Created | POST policy created |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Not authenticated (cookie expired) |
| 403 | Forbidden | No permission for screen |
| 404 | Not Found | Claim doesn't exist |
| 500 | Internal Server Error | Unhandled exception |

---

## 6. Request/Response Lifecycle

```
1. Browser sends request
   GET /api/claims/123
   Cookie: insuredge_auth=...
   
2. Middleware Pipeline
   ├─ ExceptionHandler wraps request
   ├─ CORS validates origin
   ├─ Authentication validates cookie
   ├─ Gets ClaimsPrincipal from cookie
   └─ Authorization checks claims
   
3. Route Resolution
   → ClaimsController.GetClaim(123)
   
4. Authorization Filter
   [Permission("CLAIMS_DASHBOARD", "view")]
   ├─ Get user_id from ClaimsPrincipal
   ├─ Query screen_permissions for user's groups
   ├─ Check if CLAIMS_DASHBOARD + view permission exists
   └─ If no: return 403 Forbidden
   
5. Dependency Injection
   ├─ ClaimService injected
   ├─ ICurrentTenantService injected (scoped)
   ├─ ClaimRepository injected
   └─ InsureEdgeDbContext injected
   
6. Service Execution
   await _claimService.GetClaimAsync(123)
   ├─ Call repository
   ├─ Repository calls DbContext
   ├─ DbContext applies global filters (client_id)
   ├─ Execute on PostgreSQL
   └─ Return Claim entity
   
7. DTO Mapping
   Claim entity → ClaimDto
   ├─ Map properties
   ├─ Convert data types
   └─ Create response object
   
8. Serialization
   ClaimDto → JSON
   ├─ Apply UseSnakeCaseNamingConvention()
   ├─ Convert ClaimId → claim_id
   ├─ Convert CreatedDate → created_date
   └─ Generate JSON string
   
9. Response Headers
   HTTP/1.1 200 OK
   Content-Type: application/json
   Content-Length: 456
   
10. Response Body
    {
      "claim_id": 123,
      "claim_number": "CLM-2026-001",
      ...
    }
    
11. Browser Receives
    ├─ Parse JSON
    ├─ Update React state
    ├─ Re-render UI
    └─ Display claim details
```

---

## 7. API Versioning

**Current Status:** Not implemented

**Future Consideration:**
```csharp
// Option 1: URL-based versioning
GET /api/v1/claims/123
GET /api/v2/claims/123

// Option 2: Header-based versioning
GET /api/claims/123
API-Version: 1.0

// Option 3: Accept-header
GET /api/claims/123
Accept: application/vnd.insureedge.v1+json
```

---

## 8. Rate Limiting & Throttling

**Current Status:** Not implemented

**Future Consideration:**
```csharp
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var userId = context.User.FindFirst("sub")?.Value ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetSlidingWindowLimiter(userId, _ =>
            new SlidingWindowRateLimiterOptions
            {
                AutoReplenishmentPeriod = TimeSpan.FromMinutes(1),
                PermitLimit = 100,  // 100 requests per minute
                Window = TimeSpan.FromMinutes(1)
            });
    });
});
```

---

## 9. Pagination

### Query Parameter Pattern

```
GET /api/claims?page=1&page_size=50&sort_by=incident_date&sort_order=desc
```

### Response Format

```json
{
  "data": [
    { ... },
    { ... }
  ],
  "pagination": {
    "current_page": 1,
    "page_size": 50,
    "total_count": 500,
    "total_pages": 10
  }
}
```

### Implementation

```csharp
public async Task<PagedResult<ClaimDto>> GetClaimsAsync(int page, int pageSize)
{
    var query = _db.Claims.Where(c => c.ClientId == _tenant.ClientId);
    
    var totalCount = await query.CountAsync();
    var claims = await query
        .OrderByDescending(c => c.CreatedDate)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();
    
    return new PagedResult<ClaimDto>
    {
        Data = _mapper.Map<List<ClaimDto>>(claims),
        TotalCount = totalCount,
        CurrentPage = page,
        PageSize = pageSize
    };
}
```

---

## 10. Filtering & Searching

### Common Query Parameters

```
// Claims by status
GET /api/claims?status=open

// Claims in date range
GET /api/claims?incident_date_from=2026-01-01&incident_date_to=2026-12-31

// Search by claim number
GET /api/claims?search=CLM-2026

// Combine filters
GET /api/claims?status=open&incident_date_from=2026-07-01&page=1
```

---

## 11. Bulk Operations

### Bulk Upload
```
POST /api/bulk-upload
Content-Type: multipart/form-data

Form Data:
  file: <CSV/Excel file>
  entity_type: "policies"

Response: 202 Accepted
{
  "upload_id": "abc-123-def",
  "status": "processing",
  "records_processed": 0,
  "total_records": 1000
}
```

### Bulk Upload Status
```
GET /api/bulk-upload/abc-123-def
Response: 200 OK
{
  "upload_id": "abc-123-def",
  "status": "completed",
  "records_processed": 1000,
  "total_records": 1000,
  "success_count": 998,
  "error_count": 2,
  "errors": [
    {
      "row": 5,
      "field": "policy_number",
      "error": "Duplicate policy number"
    }
  ]
}
```

---

## Conclusion

The InsureEdge API provides a clean, RESTful interface to all insurance operations with:
- Clear, consistent naming (snake_case JSON)
- Proper HTTP status codes
- Strong authentication & authorization
- Pagination for large datasets
- Global error handling
- Multi-tenant isolation

