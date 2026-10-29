# InsureEdge Architecture Diagrams

**Visual representations of the solution architecture using Mermaid**

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph Users["👥 Users"]
        Producer["Insurance Producers"]
        Admin["Administrators"]
        Adjuster["Claims Adjusters"]
    end
    
    subgraph Client["🌐 Client Layer"]
        Browser["Web Browser"]
        React["React 18 SPA<br/>TypeScript + Vite"]
    end
    
    subgraph API["🔌 API Gateway"]
        CORS["CORS Middleware"]
        Auth["Authentication<br/>HttpOnly Cookies"]
        AuthZ["Authorization<br/>Permission Filters"]
        Controllers["30 Controllers<br/>REST Endpoints"]
    end
    
    subgraph Business["💼 Business Logic Layer"]
        Services["16 Application Services<br/>GroupService, ClaimService, etc."]
        PermissionResolver["Permission Resolver<br/>RBAC Logic"]
    end
    
    subgraph Data["🗄️ Data Access Layer"]
        Repositories["16 Repositories<br/>IClaimRepository, etc."]
        EFCore["Entity Framework Core 8<br/>DbContext + Migrations"]
    end
    
    subgraph Database["📊 Database Layer"]
        PostgreSQL["PostgreSQL 14+<br/>110+ Tables<br/>95+ Entities"]
    end
    
    subgraph External["🔗 External Services"]
        Email["Email Service<br/>MailKit SMTP"]
        Docs["Document Generation<br/>Plumsail API"]
        Rating["Rating Data<br/>HB Rater"]
    end
    
    Users -->|Access| Browser
    Browser -->|HTTP/HTTPS| React
    React -->|Axios<br/>REST Calls| CORS
    CORS --> Auth
    Auth --> AuthZ
    AuthZ --> Controllers
    Controllers -->|DI| Services
    Services -->|Tenant Isolation| PermissionResolver
    Services -->|CRUD| Repositories
    Repositories -->|Entity Queries| EFCore
    EFCore -->|Global Filters| PostgreSQL
    PostgreSQL <-->|Email| Email
    PostgreSQL <-->|Documents| Docs
    PostgreSQL <-->|Rating Data| Rating
    
    style Users fill:#e1f5ff
    style Client fill:#f3e5f5
    style API fill:#fff3e0
    style Business fill:#f1f8e9
    style Data fill:#fce4ec
    style Database fill:#e0f2f1
    style External fill:#ede7f6
```

---

## 2. Frontend Architecture

```mermaid
graph TB
    subgraph App["React Application (React 18 + TypeScript)"]
        Router["Router<br/>React Router 6"]
        
        subgraph Routes["Protected Routes"]
            AppShell["AppShell<br/>Navigation + Layout"]
            
            subgraph Modules["Feature Modules"]
                Claims["Claims Module"]
                Quotes["Quotes & Policies"]
                Distribution["Distribution Mgmt"]
                Users["User Management"]
                Billing["Billing"]
                Admin["Administration"]
            end
        end
        
        subgraph State["State Management"]
            PermContext["PermissionContext<br/>User Permissions"]
            ReactQuery["React Query<br/>Server State"]
        end
        
        subgraph Components["Shared Components"]
            Forms["Forms & Inputs"]
            Grids["Data Grids<br/>AG Grid"]
            Dialogs["Dialogs & Modals"]
            Cards["Cards & Stats"]
        end
    end
    
    subgraph API["API Services"]
        Auth["auth.ts"]
        Claims["claims.ts"]
        Quotes["quotesPolicies.ts"]
        Distribution["distribution.ts"]
        Users["users.ts"]
        Axios["Axios Instance<br/>Base URL: /api<br/>Auto-send Cookies"]
    end
    
    subgraph Backend["Backend API"]
        Controllers["30 Controllers"]
    end
    
    Router --> AppShell
    AppShell --> Modules
    
    Modules --> PermContext
    Modules --> ReactQuery
    Modules --> Components
    
    Components -->|API Calls| Auth
    Components -->|API Calls| Claims
    Components -->|API Calls| Quotes
    Components -->|API Calls| Distribution
    Components -->|API Calls| Users
    
    Auth --> Axios
    Claims --> Axios
    Quotes --> Axios
    Distribution --> Axios
    Users --> Axios
    
    Axios -->|HTTP with Cookie| Controllers
    
    style App fill:#f3e5f5
    style Routes fill:#ede7f6
    style State fill:#e1f5ff
    style Components fill:#fff3e0
    style API fill:#f1f8e9
```

---

## 3. Backend Layered Architecture

```mermaid
graph TB
    subgraph HTTP["HTTP Layer"]
        Request["HTTP Request"]
        Response["HTTP Response"]
    end
    
    subgraph Middleware["Middleware Pipeline"]
        Exception["Exception Handler"]
        CORS["CORS"]
        Auth["Authentication"]
        AuthFilter["Authorization Filter"]
    end
    
    subgraph Controllers["Controller Layer"]
        ClaimsCtrl["ClaimsController"]
        PoliciesCtrl["PoliciesController"]
        UsersCtrl["UsersController"]
        OtherCtrl["27 Other Controllers"]
    end
    
    subgraph Services["Service Layer<br/>Business Logic"]
        ClaimSvc["ClaimService"]
        PolicySvc["PolicyQuoteService"]
        UserSvc["GroupService"]
        OtherSvc["13 Other Services"]
    end
    
    subgraph Repositories["Repository Layer<br/>Data Access"]
        ClaimRepo["ClaimRepository"]
        PolicyRepo["PolicyQuoteRepository"]
        UserRepo["UserRepository"]
        OtherRepo["13 Other Repositories"]
    end
    
    subgraph EFCore["Entity Framework Core"]
        DbContext["InsureEdgeDbContext<br/>110+ DbSets"]
        GlobalFilters["Global Query Filters<br/>Tenant Isolation"]
    end
    
    subgraph Domain["Domain Layer"]
        Entities["95+ Domain Entities<br/>Claim, Policy, User, etc."]
    end
    
    subgraph DB["PostgreSQL Database"]
        Tables["110+ Tables"]
    end
    
    Request --> Exception
    Exception --> CORS
    CORS --> Auth
    Auth --> AuthFilter
    AuthFilter --> Controllers
    
    ClaimsCtrl -->|Dependency Injection| ClaimSvc
    PoliciesCtrl -->|Dependency Injection| PolicySvc
    UsersCtrl -->|Dependency Injection| UserSvc
    OtherCtrl -->|Dependency Injection| OtherSvc
    
    ClaimSvc --> ClaimRepo
    PolicySvc --> PolicyRepo
    UserSvc --> UserRepo
    OtherSvc --> OtherRepo
    
    ClaimRepo --> DbContext
    PolicyRepo --> DbContext
    UserRepo --> DbContext
    OtherRepo --> DbContext
    
    DbContext --> GlobalFilters
    GlobalFilters --> Entities
    
    Entities --> Tables
    
    Tables --> Response
    
    style HTTP fill:#fff3e0
    style Middleware fill:#ffecb3
    style Controllers fill:#fff9c4
    style Services fill:#f1f8e9
    style Repositories fill:#c8e6c9
    style EFCore fill:#b2dfdb
    style Domain fill:#80cbc4
    style DB fill:#4db6ac
```

---

## 4. Request Processing Pipeline

```mermaid
sequenceDiagram
    participant Browser
    participant Middleware as Middleware Pipeline
    participant Controller
    participant Service
    participant Repository
    participant EFCore as EF Core
    participant DB as PostgreSQL
    
    Browser->>Middleware: GET /api/claims/123
    Middleware->>Middleware: Exception Handler
    Middleware->>Middleware: CORS Check
    Middleware->>Middleware: Auth (validate cookie)
    Middleware->>Middleware: AuthFilter (check claims)
    Middleware->>Controller: Route to ClaimsController.GetClaim(id)
    
    Controller->>Controller: [Permission] filter check
    Controller->>Service: claimService.GetClaimAsync(123)
    
    Service->>Service: Business logic
    Service->>Repository: claimRepository.GetByIdAsync(123)
    
    Repository->>EFCore: _db.Claims.FirstOrDefaultAsync(...)
    
    EFCore->>EFCore: Apply GlobalQueryFilter<br/>(client_id == tenant)
    EFCore->>DB: SQL: SELECT * FROM claim<br/>WHERE id = 123 AND client_id = @clientId
    
    DB->>DB: Validate permissions
    DB->>DB: Execute query
    DB->>EFCore: Result row(s)
    
    EFCore->>EFCore: Materialize Claim entity
    EFCore->>Repository: Return Claim
    
    Repository->>Service: Return Claim
    Service->>Service: Apply business rules
    Service->>Controller: Return Claim entity
    
    Controller->>Controller: Map Claim → ClaimDto
    Controller->>Controller: Serialize to JSON (snake_case)
    Controller->>Browser: 200 OK + ClaimDto JSON
    
    Browser->>Browser: Parse JSON
    Browser->>Browser: Update React state
    Browser->>Browser: Re-render UI
```

---

## 5. Authentication & Authorization Flow

```mermaid
graph TB
    subgraph Login["Login Process"]
        Creds["User Credentials<br/>Email + Password"]
        POST["POST /api/auth/login"]
        Find["Find User by Email"]
        Verify["Verify Password<br/>BCrypt"]
        NotFound["Invalid?"]
        Claims["Create ClaimsPrincipal<br/>with Claims"]
        Cookie["Create HttpOnly Cookie"]
        Set["Set-Cookie Header"]
    end
    
    subgraph Session["Subsequent Requests"]
        Request["HTTP Request"]
        CookieAuto["Cookie Auto-sent<br/>in Header"]
        Middleware["Auth Middleware"]
        Extract["Extract Claims"]
        Principal["ClaimsPrincipal"]
        Allowed["Request Proceeds"]
    end
    
    subgraph Permission["Permission Check"]
        Filter["[Permission] Filter"]
        Query["Query ScreenPermissions<br/>for User's Groups"]
        Denied["Permission Denied?"]
        Proceed["Action Proceeds"]
    end
    
    subgraph DataAccess["Data Access"]
        Service["Service Layer"]
        TenantCheck["ICurrentTenantService<br/>Extract client_id"]
        Query2["All Queries Filtered<br/>by client_id"]
        Return["Return Tenant Data Only"]
    end
    
    Creds --> POST
    POST --> Find
    Find --> Verify
    Verify -->|No| NotFound
    NotFound -->|Return 401| Creds
    Verify -->|Yes| Claims
    Claims --> Cookie
    Cookie --> Set
    Set -->|Response| Browser["Browser"]
    
    Browser -->|Next Request| Request
    Request --> CookieAuto
    CookieAuto --> Middleware
    Middleware --> Extract
    Extract --> Principal
    Principal --> Filter
    Filter --> Query
    Query -->|No Permission| Denied
    Denied -->|Return 403| Browser
    Query -->|Has Permission| Proceed
    
    Proceed --> Service
    Service --> TenantCheck
    TenantCheck -->|Get from Principal| Query2
    Query2 --> Return
    Return -->|Response| Browser
    
    style Login fill:#fff3e0
    style Session fill:#f3e5f5
    style Permission fill:#e1f5ff
    style DataAccess fill:#f1f8e9
```

---

## 6. Data Access & Multi-Tenancy

```mermaid
graph TB
    subgraph Request["Incoming Request"]
        Cookie["HttpOnly Cookie"]
        Extract["Extract Claims"]
        ClaimID["ClaimsPrincipal<br/>client_id = 1"]
    end
    
    subgraph DI["Dependency Injection"]
        Scoped["Scoped Services<br/>per Request"]
        Tenant["ICurrentTenantService<br/>Scoped"]
    end
    
    subgraph DbContext["DbContext"]
        OnModel["OnModelCreating()"]
        Filter["Global Query Filters"]
    end
    
    subgraph Filters["Query Filters Applied"]
        PolicyFilter["modelBuilder.Entity&lt;Policy&gt;()<br/>.HasQueryFilter(p => p.ClientId == clientId)"]
        ClaimFilter["modelBuilder.Entity&lt;Claim&gt;()<br/>.HasQueryFilter(c => c.ClientId == clientId)"]
        OtherFilter["90+ other filters..."]
    end
    
    subgraph SQL["SQL Generation"]
        Query["Original Query:<br/>WHERE id = @id"]
        Auto["Auto-append:<br/>AND client_id = @clientId"]
    end
    
    subgraph DB["PostgreSQL Execution"]
        Execute["Execute Modified Query<br/>WHERE id = @id<br/>AND client_id = @clientId"]
        Result["Only Tenant's Data"]
    end
    
    Cookie --> Extract
    Extract --> ClaimID
    ClaimID --> Scoped
    Scoped --> Tenant
    Tenant -->|client_id| OnModel
    OnModel --> Filter
    Filter --> PolicyFilter
    Filter --> ClaimFilter
    Filter --> OtherFilter
    
    PolicyFilter --> Query
    ClaimFilter --> Query
    OtherFilter --> Query
    
    Query --> Auto
    Auto --> Execute
    Execute --> Result
    
    style Request fill:#fff3e0
    style DI fill:#f3e5f5
    style DbContext fill:#e1f5ff
    style Filters fill:#f1f8e9
    style SQL fill:#fce4ec
    style DB fill:#e0f2f1
```

---

## 7. Module Communication

```mermaid
graph TB
    subgraph React["Frontend<br/>React Module Pages"]
        ClaimsUI["Claims Module"]
        QuotesUI["Quotes & Policies Module"]
        DistUI["Distribution Module"]
        UsersUI["User Management Module"]
    end
    
    subgraph API["API Endpoints<br/>Controllers"]
        ClaimsAPI["ClaimsController"]
        QuotesAPI["PoliciesController"]
        RenewalsAPI["RenewalsController"]
        SubmitAPI["SubmissionsController"]
        DistAPI["DistributionController"]
        UsersAPI["UsersController"]
        GroupsAPI["GroupsController"]
    end
    
    subgraph Services["Services<br/>Business Logic"]
        ClaimSvc["ClaimService"]
        PolicySvc["PolicyQuoteService"]
        RenewalSvc["RenewalQuoteService"]
        SubmitSvc["SubmissionService"]
        DistSvc["IntermediaryService<br/>ProducerService"]
        UserSvc["GroupService"]
        PermSvc["PermissionResolver"]
    end
    
    subgraph Repos["Repositories<br/>Data Access"]
        ClaimRepo["ClaimRepository"]
        PolicyRepo["PolicyQuoteRepository"]
        DistRepo["IntermediaryRepository"]
        UserRepo["UserRepository"]
    end
    
    subgraph Domain["Domain Entities"]
        ClaimEnt["Claim<br/>ClaimCoverage<br/>ClaimTask"]
        PolicyEnt["Policy<br/>PolicyProduct<br/>PolicyPremium"]
        DistEnt["Intermediary<br/>Producer"]
        UserEnt["User<br/>Group<br/>GroupUser"]
    end
    
    ClaimsUI -->|GET /api/claims| ClaimsAPI
    QuotesUI -->|GET /api/policies| QuotesAPI
    QuotesUI -->|POST /api/renewals| RenewalsAPI
    QuotesUI -->|POST /api/submissions| SubmitAPI
    DistUI -->|GET /api/distribution| DistAPI
    UsersUI -->|GET /api/users| UsersAPI
    UsersUI -->|GET /api/groups| GroupsAPI
    
    ClaimsAPI --> ClaimSvc
    QuotesAPI --> PolicySvc
    RenewalsAPI --> RenewalSvc
    SubmitAPI --> SubmitSvc
    DistAPI --> DistSvc
    UsersAPI --> UserSvc
    GroupsAPI --> UserSvc
    
    ClaimSvc --> PermSvc
    PolicySvc --> PermSvc
    DistSvc --> PermSvc
    UserSvc --> PermSvc
    
    ClaimSvc --> ClaimRepo
    PolicySvc --> PolicyRepo
    DistSvc --> DistRepo
    UserSvc --> UserRepo
    
    ClaimRepo --> ClaimEnt
    PolicyRepo --> PolicyEnt
    DistRepo --> DistEnt
    UserRepo --> UserEnt
    
    style React fill:#f3e5f5
    style API fill:#fff3e0
    style Services fill:#f1f8e9
    style Repos fill:#c8e6c9
    style Domain fill:#b2dfdb
```

---

## 8. Claims Workflow

```mermaid
stateDiagram-v2
    [*] --> FNOL
    
    FNOL: FNOL Reported
    FNOL: (claim created)
    
    INVEST: Investigation
    INVEST: (adjuster assigned)
    
    RESERVE: Reserve Setup
    RESERVE: (reserve calculated)
    
    APPROVED: Reserve Approved
    APPROVED: (manager approved)
    
    SETTLEMENT: Settlement
    SETTLEMENT: (payment processed)
    
    CLOSED: Claim Closed
    CLOSED: (completed)
    
    FNOL -->|Verify Coverage| INVEST
    INVEST -->|Calculate Reserve| RESERVE
    RESERVE -->|Request Approval| APPROVED
    APPROVED -->|Approve Reserve| SETTLEMENT
    SETTLEMENT -->|Process Payment| CLOSED
    CLOSED --> [*]
    
    INVEST -.->|Deny Coverage| [*]
    RESERVE -.->|Insufficient Funds| INVEST
```

---

## 9. Quote to Policy Workflow

```mermaid
stateDiagram-v2
    [*] --> SUBMIT
    
    SUBMIT: New Submission
    SUBMIT: (form submitted)
    
    POLICYINFO: Policy Information
    POLICYINFO: (details entered)
    
    RISKINFO: Risk Information
    RISKINFO: (property details)
    
    COVERAGE: Limits & Coverages
    COVERAGE: (selections made)
    
    PLANS: Plans Overview
    PLANS: (premium calc)
    
    REVIEW: Quote Review
    REVIEW: (validation)
    
    FINALIZE: Finalize Quote
    FINALIZE: (doc generation)
    
    ISSUED: Policy Issued
    ISSUED: (active)
    
    SUBMIT --> POLICYINFO
    POLICYINFO --> RISKINFO
    RISKINFO --> COVERAGE
    COVERAGE --> PLANS
    PLANS --> REVIEW
    REVIEW -->|Valid| FINALIZE
    REVIEW -->|Invalid| PLANS
    FINALIZE --> ISSUED
    ISSUED --> [*]
```

---

## 10. Database Entity Relationships

```mermaid
graph TB
    subgraph Access["Access Control"]
        User["User"]
        Group["Group"]
        GroupUser["GroupUser<br/>(join)"]
        Module["Module"]
        Screen["AppScreen"]
        Permission["ScreenPermissions"]
    end
    
    subgraph Distribution["Distribution & Intermediaries"]
        Intermediary["Intermediary"]
        Producer["Producer"]
        Account["Account"]
        ISP["IntermediaryScreenPermission"]
    end
    
    subgraph Client["Client Management"]
        Client["Client"]
        ClientAddr["ClientAddress"]
        ClientContact["ClientContact"]
        ClientOffice["ClientOffice"]
    end
    
    subgraph Underwriting["Quotes & Policies"]
        Policy["Policy"]
        PolicyExt["PolicyExtended"]
        PolicyAccount["PolicyAccount"]
        Insured["Insured"]
        AddInsured["AdditionalInsured"]
        RiskLoc["RiskLocation"]
        RiskAddr["RiskAddress"]
        PolicyProduct["PolicyProduct"]
        PolicyCoverage["PolicyLimitCoverage"]
        PolicyPremium["PolicyPremium"]
        Submission["Submission"]
        RenewalNotice["RenewalNotice"]
    end
    
    subgraph Claims["Claims Management"]
        Claim["Claim"]
        ClaimCov["ClaimCoverage"]
        ClaimCovLim["ClaimCoverageLimit"]
        Claimant["Claimant"]
        ClaimTask["ClaimTask"]
        ClaimWorksheet["ClaimWorksheet"]
        WorksheetRes["WorksheetReserve"]
        WorksheetPay["WorksheetPayment"]
        ClaimLetter["ClaimLetter"]
    end
    
    User -->|belongs to| GroupUser
    GroupUser -->|joins| Group
    Group -->|accesses| Permission
    Permission -->|for| Screen
    Screen -->|in| Module
    
    Intermediary -->|has many| Producer
    Producer -->|has| Account
    Intermediary -->|has| ISP
    ISP -->|grants| Screen
    
    Client -->|has many| ClientAddr
    Client -->|has many| ClientContact
    Client -->|has many| ClientOffice
    
    Policy -->|belongs to| Client
    Policy -->|extends| PolicyExt
    Policy -->|has| PolicyAccount
    Policy -->|relates to| Insured
    Policy -->|has| AddInsured
    Policy -->|has| RiskLoc
    RiskLoc -->|has| RiskAddr
    Policy -->|has| PolicyProduct
    Policy -->|has| PolicyCoverage
    Policy -->|has| PolicyPremium
    Policy -->|from| Submission
    Policy -->|has| RenewalNotice
    
    Claim -->|references| Policy
    Claim -->|has| ClaimCov
    ClaimCov -->|has| ClaimCovLim
    Claim -->|has| Claimant
    Claim -->|has| ClaimTask
    Claim -->|has| ClaimWorksheet
    ClaimWorksheet -->|has| WorksheetRes
    ClaimWorksheet -->|has| WorksheetPay
    Claim -->|has| ClaimLetter
    
    style Access fill:#fff3e0
    style Distribution fill:#f3e5f5
    style Client fill:#e1f5ff
    style Underwriting fill:#f1f8e9
    style Claims fill:#fce4ec
```

---

## 11. Service Dependencies

```mermaid
graph TB
    subgraph DI["Dependency Injection Container"]
        DbContext["InsureEdgeDbContext"]
        CurrentTenant["ICurrentTenantService"]
        PermResolver["IPermissionResolver"]
        EmailService["IEmailService<br/>SmtpEmailService"]
        DocService["IDocumentGenerationService"]
        PlumsailService["IPlumsailDocumentGenerator"]
    end
    
    subgraph AppServices["Application Services"]
        ClaimService["ClaimService"]
        PolicyService["PolicyQuoteService"]
        SubmissionService["SubmissionService"]
        RenewalService["RenewalQuoteService"]
        UserService["GroupService"]
        PasswordService["PasswordResetService"]
        RatingService["RatingService"]
        BulkUploadService["BulkUploadService"]
    end
    
    subgraph InfraServices["Infrastructure Services"]
        HbisService["HbisLimitsAndCoveragesService"]
        IntermediaryService["IntermediaryService"]
        ProducerService["ProducerService"]
        WorksheetService["WorksheetService"]
    end
    
    subgraph Repositories["Repositories"]
        ClaimRepo["ClaimRepository"]
        PolicyRepo["PolicyQuoteRepository"]
        UserRepo["UserRepository"]
        OtherRepos["12 other repositories"]
    end
    
    DbContext -->|injected| ClaimRepo
    DbContext -->|injected| PolicyRepo
    DbContext -->|injected| UserRepo
    DbContext -->|injected| OtherRepos
    
    CurrentTenant -->|injected| ClaimService
    CurrentTenant -->|injected| PolicyService
    
    PermResolver -->|injected| ClaimService
    PermResolver -->|injected| UserService
    
    EmailService -->|injected| PasswordService
    
    DocService -->|injected| PolicyService
    DocService -->|injected| RenewalService
    
    PlumsailService -->|injected| DocService
    
    ClaimRepo -->|injected| ClaimService
    PolicyRepo -->|injected| PolicyService
    PolicyRepo -->|injected| RenewalService
    PolicyRepo -->|injected| SubmissionService
    UserRepo -->|injected| UserService
    
    style DI fill:#fff3e0
    style AppServices fill:#f1f8e9
    style InfraServices fill:#c8e6c9
    style Repositories fill:#b2dfdb
```

---

## 12. Frontend Permission Flow

```mermaid
graph TB
    subgraph Login["Login"]
        LoginPage["LoginPage"]
        PostLogin["POST /api/auth/login"]
        Cookie["Set-Cookie: insuredge_auth"]
    end
    
    subgraph Startup["App Startup"]
        PermProvider["&lt;PermissionProvider&gt;<br/>wraps AppShell"]
        FetchPerms["GET /api/auth/me/permissions"]
        ParsePerms["Parse permissions JSON"]
        ContextSet["Set PermissionContext"]
    end
    
    subgraph Component["Component Rendering"]
        UseContext["useContext(PermissionContext)"]
        CheckPerm["canViewScreen('SCREEN_NAME')?"]
        Render["Render Screen"]
        Hide["Render Nothing/Error"]
    end
    
    subgraph Controller["Backend Permission Check"]
        Action["[Permission('SCREEN_NAME')] Filter"]
        Query["Query ScreenPermissions<br/>for User's Groups"]
        Allow["Allowed?"]
        Deny["Return 403"]
        Proceed["Execute Action"]
    end
    
    LoginPage --> PostLogin
    PostLogin --> Cookie
    
    Cookie --> PermProvider
    PermProvider --> FetchPerms
    FetchPerms --> ParsePerms
    ParsePerms --> ContextSet
    
    ContextSet --> UseContext
    UseContext --> CheckPerm
    CheckPerm -->|Yes| Render
    CheckPerm -->|No| Hide
    
    Render -->|User clicks| Action
    Action --> Query
    Query --> Allow
    Allow -->|No| Deny
    Allow -->|Yes| Proceed
    
    style Login fill:#fff3e0
    style Startup fill:#f3e5f5
    style Component fill:#e1f5ff
    style Controller fill:#f1f8e9
```

---

## 13. External Service Integration

```mermaid
graph TB
    subgraph Application["Application"]
        Service["Service Layer"]
    end
    
    subgraph Email["Email Service"]
        EmailSvc["SmtpEmailService"]
        MailKit["MailKit Library"]
        Config["SMTP Config<br/>From .env"]
        SMTP["SMTP Server<br/>smtp.gmail.com:587"]
    end
    
    subgraph Documents["Document Generation"]
        DocSvc["DocumentGenerationService"]
        PlumsailGen["PlumsailDocumentGenerator"]
        HttpClient["HttpClient"]
        PlumsailAPI["Plumsail Cloud API"]
        Response["Generated PDF/Word<br/>Document"]
    end
    
    subgraph Rating["Rating Engine"]
        RatingSvc["RatingService"]
        RatingData["HbRater Tables<br/>Reference Data"]
        Calculation["Rating Calculation<br/>Business Logic"]
        Premium["Premium Result"]
    end
    
    Service -->|send welcome email| EmailSvc
    EmailSvc -->|using| MailKit
    MailKit -->|configured by| Config
    MailKit -->|connects to| SMTP
    SMTP -->|sends email| EmailSvc
    
    Service -->|generate document| DocSvc
    DocSvc -->|delegates to| PlumsailGen
    PlumsailGen -->|HTTP POST| HttpClient
    HttpClient -->|calls| PlumsailAPI
    PlumsailAPI -->|returns| Response
    Response -->|stored in| Service
    
    Service -->|calculate rating| RatingSvc
    RatingSvc -->|reads| RatingData
    RatingSvc -->|applies| Calculation
    Calculation -->|returns| Premium
    Premium -->|used by| Service
    
    style Application fill:#f1f8e9
    style Email fill:#fff3e0
    style Documents fill:#f3e5f5
    style Rating fill:#e1f5ff
```

---

## 14. Infrastructure Components

```mermaid
graph TB
    subgraph DevEnv["Development Environment"]
        DevFront["Frontend Dev Server<br/>Vite localhost:3000"]
        DevBack["Backend Dev Server<br/>ASP.NET Core localhost:5114"]
        DevDB["PostgreSQL<br/>localhost:5432"]
    end
    
    subgraph ProdEnv["Production Environment"]
        CDN["CDN/Static Assets<br/>React Bundle"]
        LB["Load Balancer<br/>TLS Termination"]
        APIServers["API Servers<br/>ASP.NET Core (3+ instances)"]
        DBCluster["Database Cluster<br/>PostgreSQL Primary<br/>+ Read Replicas<br/>+ Backups"]
    end
    
    subgraph Services["Services"]
        EmailSvc["Email Service<br/>SMTP"]
        DocSvc["Document Service<br/>Plumsail"]
        RatingSvc["Rating Service<br/>HB Rater"]
    end
    
    subgraph Deployment["Deployment"]
        Docker["Docker Containers"]
        Kubernetes["Kubernetes<br/>Orchestration<br/>(optional)"]
    end
    
    DevFront -->|calls| DevBack
    DevBack -->|queries| DevDB
    
    CDN -->|serves to| LB
    LB -->|routes /api| APIServers
    LB -->|routes /| CDN
    APIServers -->|query| DBCluster
    
    DBCluster -->|replicates to| DBCluster
    DBCluster -->|backups| DBCluster
    
    APIServers -->|calls| EmailSvc
    APIServers -->|calls| DocSvc
    APIServers -->|calls| RatingSvc
    
    APIServers -->|deployed| Docker
    Docker -->|managed by| Kubernetes
    
    style DevEnv fill:#fff3e0
    style ProdEnv fill:#f1f8e9
    style Services fill:#f3e5f5
    style Deployment fill:#e1f5ff
```

---

## 15. Error Handling Flow

```mermaid
graph TB
    subgraph Request["Request Execution"]
        Action["Controller Action"]
        Service["Service Method"]
        Repository["Repository Query"]
        Database["Database Operation"]
    end
    
    subgraph Errors["Error Scenarios"]
        NotFound["Entity Not Found"]
        Validation["Validation Error"]
        Permission["Permission Denied"]
        Database_Error["Database Error"]
        Unhandled["Unhandled Exception"]
    end
    
    subgraph Handling["Exception Handling"]
        ServiceThrow["Service throws<br/>custom exception"]
        ControllerCatch["Controller catches"]
        BadRequest["Return BadRequest(400)"]
        Forbidden["Return Forbidden(403)"]
        NotFoundResp["Return NotFound(404)"]
        InternalError["Return InternalError(500)"]
    end
    
    subgraph Middleware["Global Exception Handler"]
        ExceptionMiddleware["Exception Handler<br/>Middleware"]
        Logging["Log Error with<br/>ILogger"]
        JsonResponse["Return JSON Error<br/>No Stack Trace"]
    end
    
    Action --> Service
    Service --> Repository
    Repository --> Database
    
    Database -->|throws| Database_Error
    Service -->|throws| Validation
    Service -->|throws| NotFound
    Action -->|throws| Permission
    Action -->|throws| Unhandled
    
    NotFound --> ServiceThrow
    Validation --> ServiceThrow
    Permission --> ControllerCatch
    
    ServiceThrow --> BadRequest
    ControllerCatch --> Forbidden
    NotFound --> NotFoundResp
    
    Unhandled -->|unhandled| ExceptionMiddleware
    Database_Error -->|unhandled| ExceptionMiddleware
    
    ExceptionMiddleware --> Logging
    Logging --> JsonResponse
    JsonResponse -->|500 + message| Client["Client"]
    
    BadRequest --> Client
    Forbidden --> Client
    NotFoundResp --> Client
    
    style Request fill:#fff3e0
    style Errors fill:#ffcdd2
    style Handling fill:#f1f8e9
    style Middleware fill:#c8e6c9
```

