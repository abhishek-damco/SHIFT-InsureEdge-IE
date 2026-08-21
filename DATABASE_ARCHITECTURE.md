# InsureEdge Database Architecture

**Comprehensive Database Schema, Design, and Implementation**

---

## 1. Database Overview

### Technology Stack
- **Engine:** PostgreSQL 14+
- **Client Library:** Npgsql (ADO.NET provider for .NET)
- **ORM Integration:** Entity Framework Core 8
- **Migration Strategy:** Code-First (EF Core Migrations)
- **Connection Pooling:** Npgsql connection pooling
- **Naming Convention:** snake_case (columns, tables)

### Database Characteristics
- **Total Tables:** 110+
- **Total Entities:** 95+ domain models
- **Total Migrations:** 15+ versioned migrations
- **SQL Scripts:** 35+ initialization/seed scripts
- **Multi-Tenancy:** Client-based (client_id isolation)
- **ACID Compliance:** Full ACID support
- **Data Integrity:** Constraints, foreign keys, defaults

---

## 2. Core Schema Architecture

### Naming Convention

**Database Convention (PostgreSQL):**
```sql
CREATE TABLE user (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    password_hash VARCHAR(255),
    client_id INTEGER,
    is_active BOOLEAN,
    created_date TIMESTAMPTZ,
    updated_date TIMESTAMPTZ
);
```

**C# Code Mapping:**
```csharp
public class User
{
    public int Id { get; set; }
    public string Email { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string PasswordHash { get; set; }
    public int ClientId { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime UpdatedDate { get; set; }
}

// DbContext configuration:
builder.Services.AddDbContext<InsureEdgeDbContext>(opts =>
    opts.UseNpgsql(connectionString)
    .UseSnakeCaseNamingConvention()  // ADR-005
);
```

**JSON Response (API):**
```json
{
  "id": 1,
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "client_id": 1,
  "is_active": true,
  "created_date": "2026-07-31T12:34:56Z"
}
```

---

## 3. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ GROUP_USER : belongs_to
    GROUP ||--o{ GROUP_USER : has
    USER ||--o{ USER_PASSWORD_RESET : requests
    
    MODULE ||--o{ APP_SCREEN : contains
    APP_SCREEN ||--o{ SCREEN_PERMISSIONS : has
    GROUP ||--o{ SCREEN_PERMISSIONS : granted_to
    
    CLIENT ||--o{ CLIENT_ADDRESS : has
    CLIENT ||--o{ CLIENT_CONTACT : has
    CLIENT ||--o{ CLIENT_OFFICE : has
    
    INTERMEDIARY ||--o{ PRODUCER : has
    PRODUCER ||--o{ ACCOUNT : has
    INTERMEDIARY ||--o{ INTERMEDIARY_SCREEN_PERMISSION : has
    
    POLICY ||--o{ INSURED : has_primary
    POLICY ||--o{ ADDITIONAL_INSURED : has
    POLICY ||--o{ RISK_LOCATION : has
    POLICY ||--o{ POLICY_PRODUCT : has
    POLICY ||--o{ POLICY_LIMIT_COVERAGE : has
    POLICY ||--o{ POLICY_PREMIUM : has
    POLICY ||--o{ POLICY_PAYMENT_TRANSACTION : has
    POLICY ||--o{ POLICY_DOCUMENT : has
    POLICY ||--o{ RENEWAL_NOTICE : has
    POLICY ||--o{ POLICY_MORTGAGE : has
    POLICY ||--o{ POLICY_COMMISSION : has
    
    SUBMISSION ||--o{ POLICY : creates
    
    POLICY ||--o{ CLAIM : related_to
    CLAIM ||--o{ CLAIM_COVERAGE : affects
    CLAIM ||--o{ CLAIM_COVERAGE_LIMIT : limits
    CLAIM ||--o{ CLAIMANT : involves
    CLAIM ||--o{ CLAIM_TASK : has
    CLAIM ||--o{ CLAIM_WORKSHEET : calculates
    CLAIM ||--o{ CLAIM_LETTER : generates
    CLAIM ||--o{ CLAIM_DOCUMENT : has
    
    CLAIM_WORKSHEET ||--o{ WORKSHEET_RESERVE : has
    CLAIM_WORKSHEET ||--o{ WORKSHEET_PAYMENT : has
    
    LETTER_TEMPLATE ||--o{ LETTER_TEMPLATE_DOCUMENT : has
    LETTER_TEMPLATE ||--o{ LETTER_TEMPLATE_STATE : has
    
    CONFIGURATION ||--o{ CONFIGURATION_VALUE : has
    
    PAYEE ||--o{ BANK_DETAIL : has
```

---

## 4. Table Categories

### A. Access Control & User Management

#### `user`
- Core user accounts
- Columns: id, email, first_name, last_name, password_hash, client_id, is_active, created_date, last_login_on
- Primary Key: id
- Foreign Key: client_id → client.id
- Indexes: email (unique), client_id

#### `group`
- User groups (departments, roles)
- Columns: id, name, description, status, client_id
- Primary Key: id
- Foreign Key: client_id → client.id

#### `group_user`
- User-to-group membership
- Columns: id, user_id, group_id, client_id
- Primary Key: id
- Foreign Keys: user_id, group_id, client_id

#### `module`
- Feature modules (Claims, Quotes & Policies, etc.)
- Columns: id, name, description

#### `app_screen`
- Individual screens within modules
- Columns: id, module_id, name, description, route

#### `screen_permissions`
- Group-to-screen permissions
- Columns: id, group_id, app_screen_id, client_id, can_create, can_read, can_update, can_delete
- Foreign Keys: group_id, app_screen_id, client_id

#### `user_password_reset`
- Password reset tokens
- Columns: id, user_id, token, token_expiry, created_date
- Foreign Key: user_id

---

### B. Client Management

#### `client`
- Insurance client master
- Columns: id, name, code, status, industry, created_date
- Primary Key: id

#### `client_address`
- Client addresses
- Columns: id, client_id, type, street, city, state, postal_code, country
- Foreign Key: client_id

#### `client_contact`
- Client contacts/representatives
- Columns: id, client_id, name, title, email, phone
- Foreign Key: client_id

#### `client_office`
- Client office locations
- Columns: id, client_id, office_name, address, phone

#### `client_company`
- Company associated with client
- Columns: id, client_id, company_name, registration_number

#### `company_address`, `company_contact`
- Company-specific addresses and contacts

#### `common_address`
- Shared address definitions (for reuse)
- Columns: id, address_type, street, city, state, postal_code

---

### C. Distribution & Intermediaries

#### `intermediary`
- Distribution channels/agencies
- Columns: id, name, code, status, address, phone, email, allow_full_producer_visibility, client_id
- Primary Key: id
- Foreign Key: client_id

#### `producer`
- Insurance producers/agents
- Columns: id, intermediary_id, name, email, license_number, status, client_id
- Foreign Key: intermediary_id

#### `account`
- Producer accounts (billing/commission)
- Columns: id, producer_id, account_type, balance

#### `intermediary_screen_permission`
- Producer access to specific screens
- Columns: id, intermediary_id, app_screen_id, can_create, can_read, can_update, can_delete

---

### D. Products

#### `insurance_product`
- Product master (Homeowners, Auto, etc.)
- Columns: id, name, code, description, product_type, client_id

#### `insurance_sub_product`
- Product variants
- Columns: id, product_id, name, code

#### `company_product_access`
- Client-to-product entitlements
- Columns: id, client_id, product_id, is_active

#### `product_document`
- Product-related documents (Plumsail templates)
- Columns: id, product_id, name, plumsail_process_id, plumsail_user_id, client_id

---

### E. Quotes & Policies (Core Underwriting)

#### `policy`
- Policy master record (most critical table)
- Columns: id, policy_number (unique), client_id, status, issue_date, effective_date, expiration_date, created_date, created_by
- Primary Key: id
- Foreign Key: client_id
- Indexes: policy_number (unique), client_id, status, effective_date

#### `policy_account`
- Policy account information
- Columns: id, policy_id, account_holder_name, account_address
- Foreign Key: policy_id

#### `policy_extended`
- Extended policy fields (JSONB or additional columns)
- Columns: id, policy_id, custom_data
- Foreign Key: policy_id

#### `insured`
- Primary insured party
- Columns: id, policy_id, name, type (individual/business), email, phone
- Foreign Key: policy_id

#### `additional_insured`
- Additional insureds on policy
- Columns: id, policy_id, name, relationship

#### `risk_location`
- Property risk locations
- Columns: id, policy_id, location_number, location_type, description
- Foreign Key: policy_id

#### `risk_address`
- Risk property addresses
- Columns: id, risk_location_id, street, city, state, postal_code, country
- Foreign Key: risk_location_id

#### `policy_product`
- Products included in policy
- Columns: id, policy_id, product_id, premium_amount
- Foreign Keys: policy_id, product_id

#### `policy_limit_coverage`
- Coverage limits selected for policy
- Columns: id, policy_id, coverage_type, limit_amount, deductible_amount
- Foreign Key: policy_id

#### `policy_premium`
- Premium calculations
- Columns: id, policy_id, base_premium, rate_factor, calculated_premium, effective_date
- Foreign Key: policy_id

#### `policy_mortgage`
- Mortgage/lien information
- Columns: id, policy_id, mortgagee_name, loan_amount
- Foreign Key: policy_id

#### `policy_commission`
- Commission tracking
- Columns: id, policy_id, producer_id, commission_rate, commission_amount
- Foreign Keys: policy_id, producer_id

#### `policy_payment_transaction`
- Payment history
- Columns: id, policy_id, transaction_date, amount, payment_method, status
- Foreign Key: policy_id

#### `policy_document`
- Policy documents
- Columns: id, policy_id, document_type, file_path, created_date
- Foreign Key: policy_id

#### `submission`
- Quote submission workflow
- Columns: id, policy_id, submitted_by, submitted_date, status
- Foreign Keys: policy_id, submitted_by (user_id)

#### `renewal_notice`
- Renewal notifications
- Columns: id, policy_id, renewal_date, notice_sent_date, status
- Foreign Key: policy_id

#### `quote_document`
- Quote documents generated
- Columns: id, policy_id, document_type, file_path, created_date

---

### F. Claims Management

#### `claim`
- Claim master record
- Columns: id, claim_number (unique), policy_id, client_id, status, incident_date, reported_date, assigned_adjuster_id, reserve_amount, settlement_amount, closed_date
- Primary Key: id
- Foreign Keys: policy_id, client_id, assigned_adjuster_id
- Indexes: claim_number (unique), client_id, status, incident_date

#### `claim_coverage`
- Coverage involved in claim
- Columns: id, claim_id, coverage_type, is_covered
- Foreign Key: claim_id

#### `claim_coverage_limit`
- Coverage limits affected
- Columns: id, claim_coverage_id, limit_type, limit_amount
- Foreign Key: claim_coverage_id

#### `claim_impacted_coverage`
- Coverages impacted by claim
- Columns: id, claim_id, coverage_description, status

#### `claimant`
- Parties to the claim
- Columns: id, claim_id, name, role, contact_info
- Foreign Key: claim_id

#### `claim_task`
- Workflow tasks for claim
- Columns: id, claim_id, task_type, assigned_to, due_date, status, created_date
- Foreign Keys: claim_id, assigned_to

#### `claim_task_audit_log`
- Task change history
- Columns: id, task_id, changed_by, changed_date, change_description
- Foreign Key: task_id

#### `claim_task_document`
- Documents attached to tasks
- Columns: id, task_id, file_path, uploaded_date
- Foreign Key: task_id

#### `claim_worksheet`
- Claim reserve/payment worksheet
- Columns: id, claim_id, worksheet_type, total_reserve, total_payment, created_date
- Foreign Key: claim_id

#### `worksheet_reserve`
- Reserve line items
- Columns: id, worksheet_id, reserve_type, amount, description
- Foreign Key: worksheet_id

#### `worksheet_payment`
- Payment line items
- Columns: id, worksheet_id, payee_id, amount, payment_type, status
- Foreign Keys: worksheet_id, payee_id

#### `claim_letter`
- Generated claim letters
- Columns: id, claim_id, letter_type, recipient, sent_date
- Foreign Key: claim_id

#### `claim_authority`
- Claims authority configuration
- Columns: id, name, description, authority_level, client_id
- Foreign Key: client_id

#### `claim_document`
- Claim-related documents
- Columns: id, claim_id, document_type, file_path, uploaded_date
- Foreign Key: claim_id

#### `cause_of_loss_group`, `cause_of_loss_description`
- Reference data for loss causes
- Lookup tables for claim classification

#### Temporary Tables (FNOL Workflow)
- `temp_claim_report` - Temporary FNOL data
- `temp_claim_party` - Temporary party information
- `temp_claim_witness` - Temporary witness data

---

### G. Adjusters

#### `temp_adjuster`
- Adjuster staging table
- Columns: id, name, email, license_number, status

#### `temp_adjuster_license`
- Adjuster license staging
- Columns: id, adjuster_id, state, license_number, expiration_date

---

### H. Administration

#### `configuration`
- System configuration master
- Columns: id, name, description, value_type, client_id

#### `configuration_value`
- Configuration values
- Columns: id, configuration_id, value, created_date
- Foreign Key: configuration_id

#### `letter_template`
- Letter template master
- Columns: id, name, template_type, description, client_id
- Foreign Key: client_id

#### `letter_template_document`
- Template documents
- Columns: id, template_id, template_file_path, plumsail_id
- Foreign Key: template_id

#### `letter_template_state`
- Template workflow states
- Columns: id, template_id, state_name, description

#### `payee`
- Payment recipients
- Columns: id, payee_name, payee_type (individual/business), email, client_id
- Foreign Key: client_id

#### `bank_detail`
- Bank account information
- Columns: id, payee_id, bank_name, account_number, routing_number, account_type
- Foreign Key: payee_id

#### `note`
- Notes/comments
- Columns: id, note_text, created_by, created_date, related_entity_type, related_entity_id
- Foreign Key: created_by

#### `note_file`
- Files attached to notes
- Columns: id, note_id, file_path, uploaded_date
- Foreign Key: note_id

#### `task`
- Task management
- Columns: id, task_title, description, assigned_to, due_date, status, created_date
- Foreign Key: assigned_to

#### `audit`
- Audit trail
- Columns: id, entity_type, entity_id, action, changed_by, changed_date, old_value, new_value

#### `bulk_upload_audit`
- Bulk upload tracking
- Columns: id, upload_file, record_count, status, uploaded_by, uploaded_date

---

### I. Rating Engine (HB Rater Integration)

#### `hb_rater_excess_flood_coverage`
- Flood coverage ratings
- Columns: id, location_code, coverage_type, rate_factor

#### `hb_rater_hr_hexzone`
- High-risk hexagon zones
- Columns: id, hex_id, zone_code, risk_level

#### `hb_rater_lr_hexzones`
- Low-risk hexagon zones
- Columns: id, hex_id, zone_code, risk_level

#### `hb_rater_rating_wildfire`
- Wildfire risk ratings
- Columns: id, location_code, wildfire_risk_level, rate_adjustment

#### `hb_rater_state_tax_sheet`
- State tax reference data
- Columns: id, state_code, tax_rate, effective_date

---

## 5. Multi-Tenancy Implementation

### Tenant Isolation Strategy

Every table that contains tenant-specific data has a `client_id` column:

```sql
ALTER TABLE policy ADD COLUMN client_id INTEGER NOT NULL;
ALTER TABLE claim ADD COLUMN client_id INTEGER NOT NULL;
ALTER TABLE user ADD COLUMN client_id INTEGER NOT NULL;
-- ... [Applied to 90+ tables]
```

### Global Query Filters (EF Core)

In `InsureEdgeDbContext.OnModelCreating()`:

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    var clientId = _currentTenantService.ClientId;
    
    // Policy queries always filter by client
    modelBuilder.Entity<Policy>()
        .HasQueryFilter(p => p.ClientId == clientId);
    
    // Claim queries always filter by client
    modelBuilder.Entity<Claim>()
        .HasQueryFilter(c => c.ClientId == clientId);
    
    // User queries filter by client
    modelBuilder.Entity<User>()
        .HasQueryFilter(u => u.ClientId == clientId);
    
    // ... [Applied to 90+ entities]
}
```

### How It Works

1. **Request Arrives:**
   - HttpOnly cookie contains ClaimsPrincipal
   - Middleware extracts claims

2. **Extract Tenant:**
   - `ICurrentTenantService.ClientId` extracted from claim
   - Stored in scoped service

3. **DbContext Filter Applied:**
   - Every query automatically appended with `WHERE client_id = @clientId`
   - Enforced at DbContext level, before SQL generation

4. **SQL Example:**
   ```sql
   // Original query:
   SELECT * FROM claim WHERE id = @id
   
   // With global filter:
   SELECT * FROM claim WHERE id = @id AND client_id = @clientId
   ```

5. **Data Isolation Guaranteed:**
   - Even if developer forgets to filter, database query enforces it
   - SQL injection cannot bypass tenant filter

---

## 6. Data Integrity

### Primary Keys
- All tables have `id` (SERIAL) as primary key
- Ensures uniqueness within table

### Unique Constraints
- `policy.policy_number` - Unique policy identifiers
- `claim.claim_number` - Unique claim identifiers
- `user.email` - Unique email per client
- `producer.license_number` - Unique producer licenses

### Foreign Keys
- `policy_id` → `policy.id`
- `claim_id` → `claim.id`
- `user_id` → `user.id`
- `client_id` → `client.id`
- ... (200+ foreign key relationships)

### Not Null Constraints
- Critical fields: client_id, status, created_date, policy_number, claim_number
- Ensures data completeness

### Default Values
```sql
created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
is_active BOOLEAN DEFAULT true
status VARCHAR DEFAULT 'active'
```

---

## 7. Indexes

### Primary Indexes (Performance)
```sql
-- User lookups
CREATE UNIQUE INDEX idx_user_email ON user(email, client_id);
CREATE INDEX idx_user_client ON user(client_id);

-- Policy queries
CREATE UNIQUE INDEX idx_policy_number ON policy(policy_number);
CREATE INDEX idx_policy_client_status ON policy(client_id, status);
CREATE INDEX idx_policy_effective_date ON policy(effective_date);

-- Claim queries
CREATE UNIQUE INDEX idx_claim_number ON claim(claim_number);
CREATE INDEX idx_claim_client_status ON claim(client_id, status);
CREATE INDEX idx_claim_incident_date ON claim(incident_date);

-- Foreign key lookups
CREATE INDEX idx_claim_policy_id ON claim(policy_id);
CREATE INDEX idx_policy_product_id ON policy_product(policy_id);
CREATE INDEX idx_worksheet_claim_id ON claim_worksheet(claim_id);
```

### Composite Indexes (Multi-column queries)
- `idx_policy_client_status` - Query: `WHERE client_id = ? AND status = ?`
- `idx_claim_client_status` - Query: `WHERE client_id = ? AND status = ?`
- `idx_user_email` - Query: `WHERE email = ? AND client_id = ?`

---

## 8. JSONB Support

Some tables use JSONB for flexible, unstructured data:

```sql
CREATE TABLE policy_extended (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER NOT NULL,
    custom_data JSONB,
    FOREIGN KEY (policy_id) REFERENCES policy(id)
);
```

**Example JSONB Content:**
```json
{
  "underwriting_notes": "Client has excellent claims history",
  "special_conditions": [
    "Alarm system required",
    "Annual inspection mandatory"
  ],
  "risk_profile": {
    "hazard_level": "low",
    "mitigation_measures": ["sprinkler system", "security gates"]
  }
}
```

**Querying JSONB:**
```sql
-- Find policies with specific condition
SELECT * FROM policy_extended 
WHERE custom_data @> '{"hazard_level":"low"}';

-- Query array elements
SELECT * FROM policy_extended 
WHERE custom_data->'special_conditions' @> '"Alarm system required"';
```

---

## 9. Database Migrations

### Migration Strategy: Code-First (EF Core)

**Initial Migration (20260702061903_InitialCreate):**
- Creates all core tables
- Sets up foreign keys
- Defines indexes

**Subsequent Migrations:**
```
20260703000000_AddClaimAuthority.cs
20260703000001_SeedReferenceData.cs
20260703000002_ExtendClaimAuthority.cs
20260706000000_AddPayeeAndBankDetail.cs
20260707000000_AddLetterTemplate.cs
20260709000000_AddCommonAddress.cs
20260715000000_ResetUserSequence.cs
20260715000001_CreateProducersGroup.cs
... [15+ total]
```

### Migration Execution

```bash
# Create migration
dotnet ef migrations add "MigrationName" \
  --project Backend/src/InsureEdge.Infrastructure \
  --startup-project Backend/src/InsureEdge.API

# Apply migration to database
dotnet ef database update \
  --project Backend/src/InsureEdge.Infrastructure \
  --startup-project Backend/src/InsureEdge.API

# Rollback (remove last migration)
dotnet ef migrations remove
```

---

## 10. Database Initialization

### Seed Data (SQL Scripts)

**003_dev_seed.sql - Development Data:**
```sql
INSERT INTO client (id, name, code, status) VALUES
    (1, 'Default Insurance Co', 'DEFAULT', 'active');

INSERT INTO "user" (email, first_name, last_name, password_hash, client_id, is_active) VALUES
    ('admin@insureedge.com', 'Admin', 'User', '$2a$11$...', 1, true),
    ('producer@insureedge.com', 'John', 'Producer', '$2a$11$...', 1, true);

INSERT INTO "group" (name, description, status, client_id) VALUES
    ('Administrators', 'Full system access', 'active', 1),
    ('Producers', 'Producer self-service', 'active', 1);
```

**002_seed_modules_screens.sql - Module Setup:**
```sql
INSERT INTO module (id, name, description) VALUES
    (1, 'Claims', 'Claims management'),
    (2, 'Quotes & Policies', 'Underwriting'),
    (3, 'Distribution', 'Producer management');

INSERT INTO app_screen (module_id, name, description, route) VALUES
    (1, 'Claims Dashboard', 'View claims analytics', '/claims'),
    (1, 'Claim Workflow', 'Manage claim', '/claims/workflow/:id');
```

---

## 11. Connection Management

### Connection String

**Development (PostgreSQL local):**
```
DefaultConnection=postgresql://postgres:password@localhost:5432/insureedge
```

**Production (Environment Variable):**
```
DATABASE_URL=postgresql://user:password@prod-postgres.example.com:5432/insureedge_prod
```

### Connection Pooling

**Npgsql Configuration (Program.cs):**
```csharp
builder.Services.AddDbContext<InsureEdgeDbContext>(opts =>
    opts.UseNpgsql(
        connectionString,
        dbOpts => dbOpts.CommandTimeout(30)
    )
    .UseSnakeCaseNamingConvention()
);

// Npgsql connection pooling (automatic)
// Default: 25 connections per connection string
```

### Connection Handling

```csharp
// Scoped DbContext (1 per request)
var policy = await _db.Policies.FirstOrDefaultAsync(p => p.Id == id);

// Connection automatically returned to pool when DbContext disposed
using (var context = new InsureEdgeDbContext(options))
{
    // Connection acquired from pool
    var user = await context.Users.FirstOrDefaultAsync();
    // Connection released back to pool
}
```

---

## 12. Backup & Disaster Recovery

### Backup Strategy

**Daily Automated Backups:**
```
Time: 02:00 UTC (off-peak)
Frequency: Daily full backups
Retention: 30 days
Location: Cloud storage (AWS S3, Azure Blob)
```

### Point-in-Time Recovery (PITR)

**PostgreSQL WAL (Write-Ahead Logging):**
```
Archive command: pg_basebackup runs continuously
Recovery: Restore base backup + WAL replay to any point
Example: Restore to 2026-07-31 14:30:00 UTC
```

**Recovery Process:**
```bash
# Stop PostgreSQL
sudo systemctl stop postgresql

# Restore from backup
pg_basebackup -D /var/lib/postgresql/14/main -Ft -z

# Restore to specific point-in-time
recovery_target_timeline = 'latest'
recovery_target_time = '2026-07-31 14:30:00 UTC'
```

---

## 13. Performance Considerations

### Query Optimization

**N+1 Query Problem Prevention:**
```csharp
// Bad: N+1 queries (1 + N)
var policies = _db.Policies.ToList(); // 1 query
foreach (var policy in policies)
{
    var products = policy.PolicyProducts.ToList(); // N queries
}

// Good: Eager loading (1 query with join)
var policies = _db.Policies
    .Include(p => p.PolicyProducts)
    .ToList(); // 1 query with JOIN
```

### Large Result Sets

**Pagination:**
```csharp
var pageSize = 50;
var pageNumber = 1;

var claims = await _db.Claims
    .Where(c => c.ClientId == clientId)
    .OrderByDescending(c => c.CreatedDate)
    .Skip((pageNumber - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync();
```

**Projection (Only needed columns):**
```csharp
// Good: Project only needed columns
var claims = await _db.Claims
    .Where(c => c.ClientId == clientId)
    .Select(c => new ClaimListDto
    {
        ClaimId = c.Id,
        ClaimNumber = c.ClaimNumber,
        Status = c.Status
    })
    .ToListAsync();

// Avoids loading entire entity + unused columns
```

---

## 14. Monitoring & Maintenance

### Database Health Checks

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('insureedge'));

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check for missing indexes
SELECT * FROM pg_stat_user_tables WHERE seq_scan > idx_scan;
```

### Maintenance Tasks

**Weekly:**
- VACUUM ANALYZE (cleanup and statistics)
- Reindex (rebuild fragmented indexes)

**Monthly:**
- Full backup verification
- Slow query log analysis
- Connection pool monitoring

---

## Conclusion

InsureEdge's database architecture provides:

✅ **Multi-Tenancy:** Client-based isolation with global query filters  
✅ **Data Integrity:** ACID compliance, foreign keys, constraints  
✅ **Performance:** Optimized indexes, connection pooling, query optimization  
✅ **Security:** Tenant isolation, SQL injection prevention  
✅ **Scalability:** Horizontal read scaling via replicas  
✅ **Reliability:** Automated backups, point-in-time recovery  
✅ **Maintainability:** Code-First migrations, clear schema design  

