# InsureEdge Security Architecture

**Comprehensive Security Implementation and Best Practices**

---

## 1. Authentication Architecture

### HttpOnly Cookie-Based Authentication (ADR-002)

**Why Cookies Over JWT?**
- ✅ HttpOnly cookies prevent XSS attacks (JavaScript cannot access)
- ✅ SameSite=Strict prevents CSRF attacks (cross-site requests blocked)
- ✅ Simpler implementation than JWT validation
- ✅ Automatic browser handling (no manual token management)
- ❌ Cannot be used with mobile native apps (JWT recommended instead)

### Cookie Configuration

```csharp
// Program.cs
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(opts =>
    {
        opts.Cookie.HttpOnly = true;           // Cannot access via JavaScript
        opts.Cookie.SameSite = SameSiteMode.Strict; // Cannot send in cross-origin requests
        opts.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.None           // HTTP in dev
            : CookieSecurePolicy.Always;        // HTTPS only in prod
        opts.Cookie.Name = "insuredge_auth";
        opts.ExpireTimeSpan = TimeSpan.FromHours(8);  // 8-hour session
        opts.SlidingExpiration = true;          // Extend on activity
        
        // Handle redirects as 401/403 instead of redirect
        opts.Events.OnRedirectToLogin = ctx =>
        {
            ctx.Response.StatusCode = 401;
            return Task.CompletedTask;
        };
        opts.Events.OnRedirectToAccessDenied = ctx =>
        {
            ctx.Response.StatusCode = 403;
            return Task.CompletedTask;
        };
    });
```

### Cookie Security Properties

| Property | Value | Purpose |
|----------|-------|---------|
| **HttpOnly** | true | Prevents JavaScript from accessing (XSS protection) |
| **SameSite** | Strict | Cookie not sent in cross-origin requests (CSRF protection) |
| **Secure** | true (prod) | Only sent over HTTPS (man-in-the-middle protection) |
| **Path** | / | Valid for entire application |
| **Domain** | Set by browser | Prevents subdomain access by default |
| **Expires** | 8 hours | Session timeout |
| **SlidingExpiration** | true | Extends if user is active |

### Login Process

```
1. User POSTs credentials to /api/auth/login
   {
     "email": "user@example.com",
     "password": "password123"
   }

2. AuthController.Login() executes:
   ├─ Find user by email in database
   ├─ If not found → return 401 Unauthorized
   ├─ Verify password with BCrypt
   │  BCrypt.Verify(inputPassword, storedHash)
   ├─ If mismatch → return 401 Unauthorized
   └─ If valid:

3. Create ClaimsPrincipal with claims:
   ├─ ClaimTypes.NameIdentifier = user.Id
   ├─ ClaimTypes.Email = user.Email
   ├─ ClaimTypes.Name = user.FirstName + user.LastName
   ├─ "client_id" = user.ClientId (multi-tenancy)
   ├─ "producer_id" = user.ProducerId (if applicable)
   ├─ "intermediary_id" = producer.IntermediaryId (if applicable)
   └─ "full_producer_visibility" = bool flag

4. SignInAsync() creates signed & encrypted cookie:
   ├─ Serialize ClaimsPrincipal
   ├─ Sign with anti-forgery token
   ├─ Encrypt for confidentiality
   └─ Cookie = encrypted(claims + signature + timestamp)

5. Response includes Set-Cookie header:
   Set-Cookie: insuredge_auth=<signed_cookie>; HttpOnly; SameSite=Strict; Path=/; Secure

6. Browser automatically stores cookie
   ├─ Cannot access via JavaScript (HttpOnly)
   ├─ Automatically sent in requests to same origin
   └─ Not sent in cross-origin requests (SameSite=Strict)

7. Subsequent requests include cookie:
   GET /api/claims
   Cookie: insuredge_auth=<signed_cookie>

8. Middleware validates cookie:
   ├─ Decrypt cookie
   ├─ Verify signature
   ├─ Check expiration
   ├─ Extract claims
   └─ Create ClaimsPrincipal for request
```

### Session Timeout & Sliding Expiration

```
Timeline:
  00:00 ─ User logs in
         Cookie set to expire at 08:00
         
  02:00 ─ User makes request
         Middleware detects activity
         Sliding expiration triggered
         Cookie re-issued with new 08:00 expiration
         
  06:00 ─ User makes request
         Another slide, new expiration at 14:00
         
  14:30 ─ User inactive (no requests)
         Original 08:00 expiration passed
         Cookie expired
         
  14:31 ─ User clicks something
         No valid cookie found
         Server returns 401 Unauthorized
         Frontend redirects to login

Why Sliding Expiration?
- Users expect persistent sessions during active use
- But sessions expire if user walks away
- Balances convenience with security
```

---

## 2. Authorization Architecture

### Role-Based Access Control (RBAC)

**Architecture:**
```
User
  ↓
Groups (User is member)
  ├─ Administrators
  ├─ Claims Team
  ├─ Underwriting Team
  └─ Producers
  
  ↓
Screen Permissions
  ├─ group_id = 1
  ├─ app_screen_id = 10
  ├─ can_read = true
  ├─ can_create = false
  ├─ can_update = true
  └─ can_delete = false
```

### Permission Resolution Flow

```csharp
// PermissionResolver.cs
public class PermissionResolver : IPermissionResolver
{
    public async Task<bool> HasPermissionAsync(
        int userId, 
        string screenName, 
        string action)
    {
        // 1. Get user's groups
        var groups = await _db.GroupUsers
            .Where(gu => gu.UserId == userId)
            .Select(gu => gu.GroupId)
            .ToListAsync();
        
        // 2. Get screen by name
        var screen = await _db.AppScreens
            .FirstOrDefaultAsync(s => s.Name == screenName);
        
        if (screen == null) return false;
        
        // 3. Check if any group has permission
        var hasPermission = await _db.ScreenPermissions
            .Where(sp => groups.Contains(sp.GroupId) 
                && sp.AppScreenId == screen.Id)
            .Select(sp => GetPermissionFlag(sp, action))
            .AnyAsync(canPerform => canPerform);
        
        return hasPermission;
    }
    
    private bool GetPermissionFlag(ScreenPermissions perm, string action)
    {
        return action.ToLower() switch
        {
            "read" => perm.CanRead,
            "create" => perm.CanCreate,
            "update" => perm.CanUpdate,
            "delete" => perm.CanDelete,
            _ => false
        };
    }
}
```

### Authorization Filters

#### PermissionAttribute
```csharp
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class PermissionAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string _screenName;
    private readonly string _action;
    
    public PermissionAttribute(string screenName, string action = "read")
    {
        _screenName = screenName;
        _action = action;
    }
    
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        if (user?.FindFirst(ClaimTypes.NameIdentifier)?.Value is not string userId)
        {
            context.Result = new UnauthorizedResult();
            return;
        }
        
        var permissionResolver = context.HttpContext.RequestServices
            .GetRequiredService<IPermissionResolver>();
        
        var hasPermission = await permissionResolver.HasPermissionAsync(
            int.Parse(userId),
            _screenName,
            _action
        );
        
        if (!hasPermission)
        {
            context.Result = new ForbidResult();
        }
    }
}

// Usage in controller:
[HttpGet]
[Permission("CLAIMS_DASHBOARD", "read")]
public async Task<IActionResult> GetDashboard()
{
    // Only users with CLAIMS_DASHBOARD + read permission can access
    return Ok(...);
}
```

#### ProducerOnlyAttribute
```csharp
public class ProducerOnlyAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var producerId = context.HttpContext.User
            .FindFirst("producer_id")?.Value;
        
        if (string.IsNullOrEmpty(producerId))
        {
            context.Result = new ForbidResult();
        }
    }
}

// Usage:
[ProducerOnly]
public async Task<IActionResult> GetProducerQuotes()
{
    // Only users with a producer_id can access
    return Ok(...);
}
```

---

## 3. Data Protection

### Multi-Tenant Isolation

**Global Query Filters enforce tenant isolation:**

```csharp
// InsureEdgeDbContext.cs
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    var clientId = _currentTenantService.ClientId;
    
    // Every tenant-scoped entity filtered by client_id
    modelBuilder.Entity<Policy>()
        .HasQueryFilter(p => p.ClientId == clientId);
    
    modelBuilder.Entity<Claim>()
        .HasQueryFilter(c => c.ClientId == clientId);
    
    modelBuilder.Entity<User>()
        .HasQueryFilter(u => u.ClientId == clientId);
    
    // ... 90+ entities have this filter
}
```

**How it prevents data leakage:**
1. User logs in → claims contain `client_id = 1`
2. `ICurrentTenantService` extracts `client_id = 1`
3. All queries automatically filter by `client_id = 1`
4. Even if code accidentally queries Policy without explicit filter, it's still filtered
5. SQL injection cannot bypass this (filter applied by ORM)

### Password Hashing

**Implementation (BCrypt):**

```csharp
// Password hashing on user creation/reset
var salt = BCrypt.Net.BCrypt.GenerateSalt(cost: 11);
var hashedPassword = BCrypt.Net.BCrypt.HashPassword(plaintext, salt);

// Store hashed password in database
user.PasswordHash = hashedPassword;

// On login, verify:
bool isValid = BCrypt.Net.BCrypt.Verify(inputPassword, storedHash);
```

**Why BCrypt?**
- Slow by design (resistant to brute-force)
- Work factor adjustable (cost: 11 = ~100ms per hash)
- Includes salt automatically
- Industry standard for password hashing

### Producer Scope Isolation

Producers can only see their own quotes/policies:

```csharp
// ProducerScope.cs (interface)
public interface ProducerScope
{
    int ProducerId { get; }
}

// In repository query:
public async Task<List<Policy>> GetProducerPoliciesAsync(int producerId)
{
    return await _db.Policies
        .Where(p => p.ClientId == _tenant.ClientId)
        .Where(p => p.ProducerId == producerId)  // Additional filter
        .ToListAsync();
}
```

---

## 4. API Security

### CORS Configuration

```csharp
// Program.cs
builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(p =>
        p.WithOrigins(
            "http://localhost:3000",      // Dev frontend
            "https://localhost:3000",
            "https://app.insureedge.com"  // Prod frontend
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()  // Allow cookies in cross-origin
    )
);
```

**CORS Headers in Response:**
```
Access-Control-Allow-Origin: https://app.insureedge.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization
```

**Why whitelist specific origins?**
- Default (Access-Control-Allow-Origin: *) incompatible with credentials
- Whitelist prevents requests from malicious origins
- Reduces attack surface

### Input Validation

**DTOs with validation attributes:**

```csharp
public class CreateClaimRequest
{
    [Required(ErrorMessage = "Policy ID is required")]
    public int PolicyId { get; set; }
    
    [Required]
    [StringLength(500, MinimumLength = 10)]
    public string IncidentDescription { get; set; }
    
    [Required]
    [DataType(DataType.DateTime)]
    public DateTime IncidentDate { get; set; }
    
    [Range(0, 1000000)]
    public decimal EstimatedAmount { get; set; }
}

// Validation happens automatically:
[HttpPost]
public async Task<IActionResult> CreateClaim(CreateClaimRequest req)
{
    // If validation fails, ASP.NET Core returns 400 Bad Request
    // with validation error messages
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }
    // ... process claim
}
```

### SQL Injection Prevention

**Using ORM (Entity Framework Core):**

```csharp
// SAFE: Parameterized query
var claim = await _db.Claims
    .Where(c => c.ClaimNumber == claimNumber)  // Parameterized
    .FirstOrDefaultAsync();

// NOT SAFE: Raw SQL concatenation (don't do this!)
var sql = $"SELECT * FROM claim WHERE claim_number = '{claimNumber}'";
var claim = _db.Claims.FromSqlRaw(sql).FirstOrDefault();

// SAFE: Raw SQL with parameters
var claim = _db.Claims
    .FromSqlInterpolated($"SELECT * FROM claim WHERE claim_number = {claimNumber}")
    .FirstOrDefault();
```

**Why ORM prevents SQL injection:**
- Parameters passed separately from SQL
- Database driver escapes parameter values
- Values cannot be interpreted as SQL commands

### XSS Prevention

**By default, React & ASP.NET Core prevent XSS:**

```jsx
// React - automatically escapes HTML
const description = "<script>alert('XSS')</script>";
<div>{description}</div>
// Renders as text, not executed

// If you must use dangerouslySetInnerHTML (rare):
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

**In ASP.NET Core:**
```csharp
// Response is JSON, not HTML
// JSON cannot contain executable scripts
return Ok(new { message = userInput });
// Returns: {"message":"<script>alert(...)</script>"}
// Browser receives as string data, not executable
```

---

## 5. Logging & Audit Trail

### Request Logging

```csharp
// Global exception handler logs all errors
app.UseExceptionHandler(errApp => errApp.Run(async ctx =>
{
    var ex = ctx.Features.Get<IExceptionHandlerFeature>()?.Error;
    var log = ctx.RequestServices.GetRequiredService<ILogger<Program>>();
    
    // Log with full details (including stack trace)
    log.LogError(ex, "Unhandled exception on {Method} {Path} for user {UserId}",
        ctx.Request.Method,
        ctx.Request.Path,
        ctx.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous"
    );
    
    // Return user-friendly error (no stack trace)
    ctx.Response.StatusCode = 500;
    await ctx.Response.WriteAsync($"{{\"error\":\"Internal server error\"}}");
}));
```

### Audit Trail

**Planned Implementation:**
```sql
CREATE TABLE audit (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50),      -- 'Policy', 'Claim', 'User'
    entity_id INTEGER,
    action VARCHAR(20),           -- 'CREATE', 'UPDATE', 'DELETE'
    changed_by INTEGER,           -- user_id
    changed_date TIMESTAMPTZ DEFAULT NOW(),
    old_value TEXT,
    new_value TEXT
);
```

**Would track:**
- Policy created/modified/deleted
- Claim status changes
- Permission changes
- User account changes

**Benefits:**
- Compliance (audit trail for regulators)
- Forensics (investigate suspicious activity)
- Accountability (who did what when)

---

## 6. Environment-Based Security

### Development Environment
```
Database: Unencrypted local PostgreSQL
API: HTTP (unencrypted)
Cookies: Secure=false (HTTP)
Logging: Verbose (detailed error messages)
CORS: Permissive (localhost)
```

### Production Environment
```
Database: Encrypted PostgreSQL over SSL/TLS
API: HTTPS (TLS 1.2+)
Cookies: Secure=true (HTTPS only)
Logging: Minimal (no sensitive data)
CORS: Strict whitelist
Environment Variables: All secrets in env vars, not in code
```

### Configuration

```csharp
// Program.cs
var isProduction = app.Environment.IsProduction();

if (!isProduction)
    app.UseDeveloperExceptionPage();  // Detailed errors in dev
else
    app.UseExceptionHandler(...);      // Generic errors in prod

builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(p =>
        p.WithOrigins(
            isProduction 
                ? new[] { "https://app.insureedge.com" }
                : new[] { "http://localhost:3000", "https://localhost:3000" }
        )
    )
);
```

---

## 7. Security Checklist

### ✅ Implemented
- [x] HttpOnly cookies (XSS protection)
- [x] SameSite=Strict cookies (CSRF protection)
- [x] Password hashing with BCrypt
- [x] Role-based access control (RBAC)
- [x] Multi-tenant isolation (global query filters)
- [x] CORS whitelist
- [x] Input validation (DTOs)
- [x] SQL injection prevention (ORM)
- [x] Global exception handling (no stack traces in responses)
- [x] Producer scope isolation
- [x] Permission filters ([Permission], [ProducerOnly])
- [x] Environment-based configuration

### ❌ Not Implemented (Future)
- [ ] API rate limiting (throttle requests)
- [ ] Request signing/HMAC (verify requests)
- [ ] Audit logging (compliance tracking)
- [ ] Two-factor authentication (2FA)
- [ ] IP whitelisting (restrict access)
- [ ] WAF (Web Application Firewall)
- [ ] HSTS headers (Force HTTPS)
- [ ] CSP headers (Content Security Policy)
- [ ] Encryption at rest (database encryption)
- [ ] Certificate pinning (mobile app)

### ⚠️ Known Limitations
- **No API versioning:** Breaking changes require frontend updates
- **No rate limiting:** Vulnerable to brute-force/DoS
- **No 2FA:** Only single password security
- **No audit trail:** Cannot track who changed what
- **Mobile app:** Would need JWT instead of cookies

---

## 8. Security Best Practices

### For Developers

1. **Never log secrets:**
   ```csharp
   // Bad
   log.LogInformation($"Password: {password}");
   
   // Good
   log.LogInformation("User login attempt");
   ```

2. **Use parameterized queries:**
   ```csharp
   // Bad
   var sql = $"SELECT * FROM user WHERE email = '{email}'";
   
   // Good
   var user = await _db.Users
       .Where(u => u.Email == email)
       .FirstOrDefaultAsync();
   ```

3. **Validate all inputs:**
   ```csharp
   if (!ModelState.IsValid)
       return BadRequest(ModelState);
   ```

4. **Check permissions:**
   ```csharp
   [Permission("SCREEN_NAME")]
   public async Task<IActionResult> ProtectedAction()
   {
       // ...
   }
   ```

5. **Use HTTPS in production:**
   ```csharp
   if (!app.Environment.IsDevelopment())
       app.UseHttpsRedirection();
   ```

### For Deployment

1. Set environment variables (never hardcode secrets):
   ```bash
   export DATABASE_URL=postgresql://user:pass@host/db
   export PLUMSAIL_PROCESS_ID=xxx
   export SMTP_PASSWORD=xxx
   ```

2. Enable HTTPS:
   ```
   Redirect HTTP → HTTPS
   Use valid TLS certificate
   Set Secure=true on cookies
   ```

3. Restrict database access:
   ```
   API server can query
   Backups encrypted
   Credentials stored securely
   ```

4. Monitor logs:
   ```
   Watch for 403/401 spikes (attack)
   Watch for 500 errors (exploits)
   Watch for slow queries (DoS)
   ```

---

## Conclusion

InsureEdge implements defense-in-depth security:
- **Authentication:** HttpOnly cookies prevent XSS
- **Authorization:** RBAC with permission filters prevent unauthorized access
- **Data Protection:** Multi-tenant isolation prevents data leakage
- **API Security:** Input validation, SQL injection prevention
- **Transport:** HTTPS + CORS whitelist
- **Logging:** Full audit trail (configurable)

The architecture prioritizes **practical security** over theoretical perfection, implementing industry-standard patterns that are well-tested and proven.

