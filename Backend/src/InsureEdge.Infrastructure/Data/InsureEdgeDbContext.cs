// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// ADR-005: UseSnakeCaseNamingConvention â€” all column/table names are snake_case in PostgreSQL
// ADR-010: Global Query Filters enforce tenant isolation on every query
using InsureEdge.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Data;

public class InsureEdgeDbContext : DbContext
{
    public InsureEdgeDbContext(DbContextOptions<InsureEdgeDbContext> options) : base(options) { }

    // â”€â”€ User Groups â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<ClientAddress> ClientAddresses => Set<ClientAddress>();
    public DbSet<ClientContact> ClientContacts => Set<ClientContact>();
    public DbSet<ClientOffice> ClientOffices => Set<ClientOffice>();
    public DbSet<ClientCompany> ClientCompanies => Set<ClientCompany>();
    public DbSet<CompanyAddress> CompanyAddresses => Set<CompanyAddress>();
    public DbSet<CompanyContact> CompanyContacts => Set<CompanyContact>();
    public DbSet<InsuranceProduct> InsuranceProducts => Set<InsuranceProduct>();
    public DbSet<InsuranceSubProduct> InsuranceSubProducts => Set<InsuranceSubProduct>();
    public DbSet<CompanyProductAccess> CompanyProductAccess => Set<CompanyProductAccess>();
    public DbSet<CompanyProductSubProduct> CompanyProductSubProducts => Set<CompanyProductSubProduct>();
    public DbSet<CompanyProductJurisdiction> CompanyProductJurisdictions => Set<CompanyProductJurisdiction>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupUser> GroupUsers => Set<GroupUser>();
    public DbSet<Module> Modules => Set<Module>();
    public DbSet<AppScreen> AppScreens => Set<AppScreen>();
    public DbSet<ScreenPermissions> ScreenPermissions => Set<ScreenPermissions>();
    public DbSet<UserPasswordReset> UserPasswordResets => Set<UserPasswordReset>();

    // â”€â”€ Claims â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    public DbSet<Policy> Policies => Set<Policy>();
    public DbSet<Insured> Insureds => Set<Insured>();
    public DbSet<RiskLocation> RiskLocations => Set<RiskLocation>();
    public DbSet<Claim> Claims => Set<Claim>();
    public DbSet<ClaimCoverage> ClaimCoverages => Set<ClaimCoverage>();
    public DbSet<ClaimCoverageAsset> ClaimCoverageAssets => Set<ClaimCoverageAsset>();
    public DbSet<ClaimCoverageLimit> ClaimCoverageLimits => Set<ClaimCoverageLimit>();
    public DbSet<CauseOfLossDescription> CauseOfLossDescriptions => Set<CauseOfLossDescription>();
    public DbSet<CauseOfLossGroup> CauseOfLossGroups => Set<CauseOfLossGroup>();
    public DbSet<CauseOfLossGroupDescription> CauseOfLossGroupDescriptions => Set<CauseOfLossGroupDescription>();
    public DbSet<ClaimImpactedCoverage> ClaimImpactedCoverages => Set<ClaimImpactedCoverage>();
    public DbSet<Claimant> Claimants => Set<Claimant>();
    public DbSet<ClaimDocument> ClaimDocuments => Set<ClaimDocument>();
    public DbSet<TempClaimReport> TempClaimReports => Set<TempClaimReport>();
    public DbSet<TempClaimParty> TempClaimParties => Set<TempClaimParty>();
    public DbSet<TempClaimWitness> TempClaimWitnesses => Set<TempClaimWitness>();
    public DbSet<TempAdjuster> TempAdjusters => Set<TempAdjuster>();
    public DbSet<TempAdjusterLicense> TempAdjusterLicenses => Set<TempAdjusterLicense>();
    public DbSet<ClaimWorksheet> Worksheets => Set<ClaimWorksheet>();
    public DbSet<WorksheetReserve> WorksheetReserves => Set<WorksheetReserve>();
    public DbSet<WorksheetPayment> WorksheetPayments => Set<WorksheetPayment>();
    public DbSet<ClaimAuthority> ClaimAuthorities => Set<ClaimAuthority>();
    public DbSet<Payee>         Payees          => Set<Payee>();
    public DbSet<BankDetail>    BankDetails     => Set<BankDetail>();
    public DbSet<CommonAddress> CommonAddresses => Set<CommonAddress>();

    // ── Master Configuration
    public DbSet<Configuration> Configurations => Set<Configuration>();
    public DbSet<ConfigurationValue> ConfigurationValues => Set<ConfigurationValue>();

    // ── Letter Templates
    public DbSet<LetterTemplate> LetterTemplates => Set<LetterTemplate>();
    public DbSet<LetterTemplateDocument> LetterTemplateDocuments => Set<LetterTemplateDocument>();
    public DbSet<LetterTemplateState> LetterTemplateStates => Set<LetterTemplateState>();

    // ── Claim Tasks
    public DbSet<ClaimTask> ClaimTasks => Set<ClaimTask>();
    public DbSet<ClaimTaskDocument> ClaimTaskDocuments => Set<ClaimTaskDocument>();
    public DbSet<ClaimTaskAuditLog> ClaimTaskAuditLogs => Set<ClaimTaskAuditLog>();

    // ── Claim Letters
    public DbSet<ClaimLetter> ClaimLetters => Set<ClaimLetter>();

    // ── Quotes & Policies (Underwriting) ────────────────────────────────────────────────
    public DbSet<Intermediary> Intermediaries => Set<Intermediary>();
    public DbSet<Producer> Producers => Set<Producer>();
    public DbSet<IntermediaryScreenPermission> IntermediaryScreenPermissions => Set<IntermediaryScreenPermission>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<PolicyAccount> PolicyAccounts => Set<PolicyAccount>();
    public DbSet<PolicyExtended> PolicyExtendeds => Set<PolicyExtended>();
    public DbSet<PolicyProduct> PolicyProducts => Set<PolicyProduct>();
    public DbSet<PolicyLimitCoverage> PolicyLimitCoverages => Set<PolicyLimitCoverage>();
    public DbSet<PolicyPremium> PolicyPremiums => Set<PolicyPremium>();
    public DbSet<PolicyPaymentTransaction> PolicyPaymentTransactions => Set<PolicyPaymentTransaction>();
    public DbSet<RenewalNotice> RenewalNotices => Set<RenewalNotice>();
    public DbSet<PolicyCommission> PolicyCommissions => Set<PolicyCommission>();
    public DbSet<CommissionPaymentTransaction> CommissionPaymentTransactions => Set<CommissionPaymentTransaction>();
    public DbSet<PolicyMortgage> PolicyMortgages => Set<PolicyMortgage>();
    public DbSet<PolicyDocument> PolicyDocuments => Set<PolicyDocument>();
    public DbSet<QuoteDocument> QuoteDocuments => Set<QuoteDocument>();
    public DbSet<Note> Notes => Set<Note>();
    public DbSet<NoteFile> NoteFiles => Set<NoteFile>();
    public DbSet<ProductDocument> ProductDocuments => Set<ProductDocument>();
    public DbSet<RiskAddress> RiskAddresses => Set<RiskAddress>();
    public DbSet<PolicyRiskInformation> PolicyRiskInformation => Set<PolicyRiskInformation>();
    public DbSet<AdditionalInsured> AdditionalInsureds => Set<AdditionalInsured>();
    public DbSet<AdditionalOrganisation> AdditionalOrganisations => Set<AdditionalOrganisation>();
    public DbSet<HbRaterStateTaxSheet> HbRaterStateTaxSheets => Set<HbRaterStateTaxSheet>();
    public DbSet<HbRaterExcessFloodCoverage> HbRaterExcessFloodCoverages => Set<HbRaterExcessFloodCoverage>();
    public DbSet<HbRaterHrHexzone> HbRaterHrHexzones => Set<HbRaterHrHexzone>();
    public DbSet<HbRaterLrHexzones> HbRaterLrHexzones => Set<HbRaterLrHexzones>();
    public DbSet<HbRaterRatingWildfire> HbRaterRatingWildfires => Set<HbRaterRatingWildfire>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<BulkUploadAudit> BulkUploadAudits => Set<BulkUploadAudit>();
    public DbSet<PolicyTransaction> PolicyTransactions => Set<PolicyTransaction>();
    public DbSet<PolicyTransactionType> PolicyTransactionTypes => Set<PolicyTransactionType>();
    public DbSet<PolicyPaymentTransactionExtended> PolicyPaymentTransactionExtendeds => Set<PolicyPaymentTransactionExtended>();
    public DbSet<CancellationPaymentTransaction> CancellationPaymentTransactions => Set<CancellationPaymentTransaction>();
    public DbSet<Audit> Audits => Set<Audit>();
    public DbSet<PolicyConfigurationRequestedBy> PolicyConfigurationRequestedBys => Set<PolicyConfigurationRequestedBy>();

    // ── Claim Reference Data ──────────────────────────────────────────────────────────
    public DbSet<ClaimInitiationChannel> ClaimInitiationChannels => Set<ClaimInitiationChannel>();
    public DbSet<CauseOfLoss> CausesOfLoss => Set<CauseOfLoss>();
    public DbSet<ConsequenceOfLoss> ConsequencesOfLoss => Set<ConsequenceOfLoss>();
    public DbSet<CoverageType> CoverageTypes => Set<CoverageType>();
    public DbSet<ImpactedAsset> ImpactedAssets => Set<ImpactedAsset>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Group â€” table is "group" (singular, reserved word)
        modelBuilder.Entity<Group>(e =>
        {
            e.ToTable("group");
            e.HasKey(x => x.Id);
            e.Property(x => x.GroupCode).IsRequired().HasMaxLength(10);
            e.Property(x => x.GroupName).IsRequired().HasMaxLength(200);
            e.Property(x => x.GroupEmailId).HasMaxLength(255);
            e.Property(x => x.GroupLeader).IsRequired();
            e.Property(x => x.GroupDesc).HasMaxLength(500);
            e.Property(x => x.Status).HasConversion<string>();
            e.HasOne(x => x.Client).WithMany().HasForeignKey(x => x.ClientId);
        });

        // GroupUser
        modelBuilder.Entity<GroupUser>(e =>
        {
            e.ToTable("group_user");
            e.HasKey(x => new { x.GroupId, x.UserId });
            e.HasIndex(x => new { x.GroupId, x.UserId }).IsUnique();
            e.HasOne(x => x.Group).WithMany(g => g.GroupUsers).HasForeignKey(x => x.GroupId).IsRequired();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).IsRequired();
        });

        // ScreenPermissions
        modelBuilder.Entity<ScreenPermissions>(e =>
        {
            e.ToTable("screen_permissions");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.GroupId, x.ScreenId, x.ClientId }).IsUnique();
            e.HasOne(x => x.Group).WithMany(g => g.GroupPermissions).HasForeignKey(x => x.GroupId);
            e.HasOne(x => x.Screen).WithMany().HasForeignKey(x => x.ScreenId);
        });

        // AppScreen
        modelBuilder.Entity<AppScreen>(e =>
        {
            e.ToTable("app_screen");
            e.HasKey(x => x.Id);
            e.Property(x => x.ScreenCode).HasMaxLength(50);
            e.Property(x => x.ScreenName).HasMaxLength(100);
            e.Ignore(x => x.IsActive);
            e.Ignore(x => x.DisplayOrder);
            e.HasOne(x => x.Module).WithMany(m => m.Screens).HasForeignKey(x => x.ModuleId);
        });

        // Module
        modelBuilder.Entity<Module>(e =>
        {
            e.ToTable("module");
            e.HasKey(x => x.Id);
            e.Property(x => x.ModuleName).HasMaxLength(100);
            e.Ignore(x => x.IsActive);
            e.Ignore(x => x.IsSubmodule);
            e.Ignore(x => x.ParentModuleId);
            e.Ignore(x => x.DisplayOrder);
        });

        // User â€” table is "user" (singular); EF would pluralize to "users" without this
        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("user");
            e.HasKey(x => x.Id);
            e.Property(x => x.Email).IsRequired().HasMaxLength(255);
            e.Property(x => x.PasswordHash).IsRequired().HasMaxLength(100);
            e.Property(x => x.FirstName).IsRequired().HasMaxLength(100);
            e.Property(x => x.LastName).IsRequired().HasMaxLength(100);
            e.HasIndex(x => new { x.Email, x.ClientId }).IsUnique();
            e.Ignore(x => x.FullName);
            e.Ignore(x => x.Initials);
        });

        // UserPasswordReset
        modelBuilder.Entity<UserPasswordReset>(e =>
        {
            e.ToTable("user_password_reset");
            e.HasKey(x => x.Id);
            e.Property(x => x.Username).IsRequired().HasMaxLength(255);
            e.Property(x => x.CodeHash).IsRequired().HasMaxLength(64); // SHA-256 hex
        });

        // Client — DB column is "name" (snake_case of original ClientName property)
        modelBuilder.Entity<Client>(e =>
        {
            e.ToTable("client");
            e.HasKey(x => x.Id);
            e.Property(x => x.CompanyName).HasColumnName("name").IsRequired().HasMaxLength(200);
            e.Property(x => x.ClientCode).HasMaxLength(50);
            e.Property(x => x.Status).HasMaxLength(50);
            e.Ignore(x => x.IsActive); // stored implicitly via Status field
            e.HasMany(x => x.Addresses).WithOne().HasForeignKey(x => x.ClientId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Contacts).WithOne().HasForeignKey(x => x.ClientId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Offices).WithOne().HasForeignKey(x => x.ClientId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Companies).WithOne().HasForeignKey(x => x.ClientId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ClientAddress>(e =>
        {
            e.ToTable("client_address");
            e.HasKey(x => x.Id);
            e.Property(x => x.AddressType).HasMaxLength(20);
            e.HasIndex(x => new { x.ClientId, x.AddressType }).IsUnique();
        });

        modelBuilder.Entity<ClientContact>(e =>
        {
            e.ToTable("client_contact");
            e.HasKey(x => x.Id);
            e.Property(x => x.ContactType).HasMaxLength(20);
            e.HasIndex(x => new { x.ClientId, x.ContactType }).IsUnique();
        });

        modelBuilder.Entity<ClientOffice>(e =>
        {
            e.ToTable("client_office");
            e.HasKey(x => x.Id);
            e.Property(x => x.OfficeName).IsRequired().HasMaxLength(75);
        });

        modelBuilder.Entity<ClientCompany>(e =>
        {
            e.ToTable("client_company");
            e.HasKey(x => x.Id);
            e.Property(x => x.CompanyCode).IsRequired().HasMaxLength(10);
            e.Property(x => x.CompanyName).IsRequired().HasMaxLength(75);
            e.Property(x => x.Status).HasMaxLength(10);
            e.HasIndex(x => new { x.ClientId, x.CompanyCode }).IsUnique();
            e.HasMany(x => x.Addresses).WithOne().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Contacts).WithOne().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.ProductAccess).WithOne().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CompanyAddress>(e =>
        {
            e.ToTable("company_address");
            e.HasKey(x => x.Id);
            e.Property(x => x.AddressType).HasMaxLength(20);
            e.HasIndex(x => new { x.CompanyId, x.AddressType }).IsUnique();
        });

        modelBuilder.Entity<CompanyContact>(e =>
        {
            e.ToTable("company_contact");
            e.HasKey(x => x.Id);
            e.Property(x => x.ContactType).HasMaxLength(20);
            e.HasIndex(x => new { x.CompanyId, x.ContactType }).IsUnique();
        });

        modelBuilder.Entity<InsuranceProduct>(e =>
        {
            e.ToTable("insurance_product");
            e.HasKey(x => x.Id);
            e.Property(x => x.ProductName).IsRequired().HasMaxLength(75);
            e.Property(x => x.Category).IsRequired().HasMaxLength(30);
            e.HasIndex(x => new { x.ProductName, x.Category }).IsUnique();
            e.HasMany(x => x.SubProducts).WithOne(s => s.Product).HasForeignKey(s => s.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<InsuranceSubProduct>(e =>
        {
            e.ToTable("insurance_sub_product");
            e.HasKey(x => x.Id);
            e.Property(x => x.SubProductName).IsRequired().HasMaxLength(75);
        });

        modelBuilder.Entity<CompanyProductAccess>(e =>
        {
            e.ToTable("company_product_access");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.CompanyId, x.ProductId }).IsUnique();
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId);
            e.HasMany(x => x.SelectedSubProducts).WithOne().HasForeignKey(x => x.AccessId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Jurisdictions).WithOne().HasForeignKey(x => x.AccessId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CompanyProductSubProduct>(e =>
        {
            e.ToTable("company_product_sub_product");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.AccessId, x.SubProductId }).IsUnique();
            e.HasOne(x => x.SubProduct).WithMany().HasForeignKey(x => x.SubProductId);
        });

        modelBuilder.Entity<CompanyProductJurisdiction>(e =>
        {
            e.ToTable("company_product_jurisdiction");
            e.HasKey(x => x.Id);
            e.Property(x => x.StateCode).HasMaxLength(5);
            e.Property(x => x.StateName).HasMaxLength(50);
            e.HasIndex(x => new { x.AccessId, x.StateCode }).IsUnique();
        });

        // â”€â”€ Claims â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        modelBuilder.Entity<Policy>(e =>
        {
            e.ToTable("policy");
            e.HasKey(x => x.Id);
            e.Property(x => x.PolicyNumber).IsRequired().HasMaxLength(100);
            // Not unique: DRAFT pending-transaction rows (endorsements/renewals in progress)
            // share the same policy_number as the issued policy they're drafted against
            // (see db/014_relax_policy_number_uniqueness.sql, GetPendingTransactionsAsync).
            e.HasIndex(x => new { x.PolicyNumber, x.ClientId });
            e.HasOne(x => x.Client).WithMany().HasForeignKey(x => x.ClientId);

            // Underwriting (db/010, db/011)
            e.Property(x => x.QuoteNumber).HasMaxLength(50);
            e.Property(x => x.PolicyStage).HasMaxLength(50);
            e.Property(x => x.PolicyTerm).HasMaxLength(50);
            e.Property(x => x.ApprovalStatus).HasMaxLength(50);
            e.Property(x => x.WritingCompany).HasMaxLength(50);
            e.Property(x => x.InsuranceType).HasMaxLength(50);
            e.Property(x => x.Country).HasMaxLength(50);
            e.Property(x => x.StateProvince).HasMaxLength(50);
            e.Property(x => x.PolicyType).HasMaxLength(50);
            e.Property(x => x.PolicyStatus).HasMaxLength(50);
            e.Property(x => x.IntermediaryType).HasMaxLength(50);
            e.HasOne<User>().WithMany().HasForeignKey(x => x.CreatedBy).IsRequired(false);
            e.HasOne<User>().WithMany().HasForeignKey(x => x.UpdatedBy).IsRequired(false);
            e.HasOne(x => x.Intermediary).WithMany().HasForeignKey(x => x.IntermediaryId).IsRequired(false);
            e.HasOne(x => x.Producer).WithMany().HasForeignKey(x => x.ProducerId).IsRequired(false);
            e.HasOne(x => x.Account).WithMany(a => a.Policies).HasForeignKey(x => x.AccountId).IsRequired(false);
            e.HasOne(x => x.Extended).WithOne(x => x.Policy!).HasForeignKey<PolicyExtended>(x => x.PolicyId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Products).WithOne(x => x.Policy).HasForeignKey(x => x.PolicyId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.LimitCoverages).WithOne(x => x.Policy).HasForeignKey(x => x.PolicyId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Premium).WithOne(x => x.Policy!).HasForeignKey<PolicyPremium>(x => x.PolicyId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Commissions).WithOne(x => x.Policy).HasForeignKey(x => x.PolicyId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Mortgages).WithOne(x => x.Policy).HasForeignKey(x => x.PolicyId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Documents).WithOne(x => x.Policy).HasForeignKey(x => x.PolicyId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.RiskAddresses).WithOne(x => x.Policy).HasForeignKey(x => x.PolicyId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.RiskInformation).WithOne(x => x.Policy).HasForeignKey(x => x.PolicyId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.AdditionalInsureds).WithOne(x => x.Policy).HasForeignKey(x => x.PolicyId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.AdditionalOrganisations).WithOne(x => x.Policy).HasForeignKey(x => x.PolicyId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.PolicyAccounts).WithOne(x => x.Policy).HasForeignKey(x => x.PolicyId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Insured>(e =>
        {
            e.ToTable("insured");
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Policy).WithOne(p => p.Insured).HasForeignKey<Insured>(x => x.PolicyId).IsRequired(false);
        });

        modelBuilder.Entity<RiskLocation>(e =>
        {
            e.ToTable("risk_location");
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Policy).WithOne(p => p.RiskLocation).HasForeignKey<RiskLocation>(x => x.PolicyId).IsRequired(false);
        });

        modelBuilder.Entity<Claim>(e =>
        {
            e.ToTable("claim");
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasMaxLength(30);
            e.Property(x => x.ClaimNumber).HasMaxLength(50);
            e.HasOne(x => x.Policy).WithMany(p => p.Claims).HasForeignKey(x => x.PolicyId);
            e.HasOne(x => x.AssignedToUser).WithMany().HasForeignKey(x => x.AssignedTo).IsRequired(false);
            e.HasMany(x => x.Coverages).WithOne(c => c.Claim).HasForeignKey(c => c.ClaimId).OnDelete(DeleteBehavior.Cascade).IsRequired();
            e.HasMany(x => x.Claimants).WithOne(c => c.Claim).HasForeignKey(c => c.ClaimId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Documents).WithOne(d => d.Claim).HasForeignKey(d => d.ClaimId).OnDelete(DeleteBehavior.Cascade);
            // AdjusterId is external â€” no FK constraint
            e.Ignore(x => x.AdjusterId);
        });

        modelBuilder.Entity<ClaimCoverage>(e =>
        {
            e.ToTable("claim_coverage");
            e.HasKey(x => x.Id);
            e.Property(x => x.IsHoPhyscialDamage).HasColumnName("is_ho_physcial_damage");
            e.Property(x => x.IsHoPersonalLiability).HasColumnName("is_ho_personal_liability");
            e.HasMany(x => x.CoverageLimits).WithOne(l => l.ClaimCoverage).HasForeignKey(l => l.ClaimCoverageId);
        });

        modelBuilder.Entity<ClaimCoverageAsset>(e =>
        {
            e.ToTable("claim_coverage_asset");
            e.HasKey(x => x.Id);
            e.Property(x => x.AssetName).IsRequired().HasMaxLength(200);
        });

        modelBuilder.Entity<ClaimCoverageLimit>(e =>
        {
            e.ToTable("claim_coverage_limit");
            e.HasKey(x => x.Id);
            e.HasOne(x => x.ClaimCoverage).WithMany(c => c.CoverageLimits).HasForeignKey(x => x.ClaimCoverageId);
        });

        modelBuilder.Entity<CauseOfLossDescription>(e =>
        {
            e.ToTable("cause_of_loss_description");
            e.HasKey(x => x.Id);
            e.HasOne(x => x.ClaimCoverage).WithMany().HasForeignKey(x => x.ClaimCoverageId);
        });

        modelBuilder.Entity<CauseOfLossGroup>(e =>
        {
            e.ToTable("cause_of_loss_group");
            e.HasKey(x => x.Id);
            e.HasOne(x => x.ClaimCoverage).WithMany().HasForeignKey(x => x.ClaimCoverageId);
            e.HasMany(x => x.GroupDescriptions).WithOne(d => d.CauseOfLossGroup).HasForeignKey(d => d.CauseOfLossGroupId);
        });

        modelBuilder.Entity<CauseOfLossGroupDescription>(e =>
        {
            e.ToTable("cause_of_loss_group_description");
            e.HasKey(x => x.Id);
            e.HasOne(x => x.CauseOfLossGroup).WithMany(g => g.GroupDescriptions).HasForeignKey(x => x.CauseOfLossGroupId);
            e.HasOne(x => x.CauseOfLossDescription).WithMany().HasForeignKey(x => x.CauseOfLossDescriptionId);
        });

        modelBuilder.Entity<ClaimImpactedCoverage>(e =>
        {
            e.ToTable("claim_impacted_coverage");
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Claim).WithMany(c => c.Coverages).HasForeignKey(x => x.ClaimId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Coverage).WithMany().HasForeignKey(x => x.CoverageId).HasConstraintName("fk_claim_impacted_cov_coverage");
            e.HasOne(x => x.CauseOfLoss).WithMany().HasForeignKey(x => x.CauseOfLossId).HasConstraintName("fk_claim_impacted_cov_col");
        });

        modelBuilder.Entity<Claimant>(e =>
        {
            e.ToTable("claimant");
            e.HasKey(x => x.Id);
            e.Property(x => x.PartyType).HasMaxLength(20);
        });

        modelBuilder.Entity<ClaimDocument>(e =>
        {
            e.ToTable("claim_document");
            e.HasKey(x => x.Id);
            e.Property(x => x.FileName).IsRequired().HasMaxLength(255);
            e.Property(x => x.Comment);
        });

        modelBuilder.Entity<TempClaimReport>(e =>
        {
            e.ToTable("temp_claim_report");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.ClaimId, x.ClientId });
            e.Property(x => x.ReportType).HasMaxLength(100);
            e.Property(x => x.ReportNumber).HasMaxLength(100);
            e.Property(x => x.ReportFilingDate).HasMaxLength(30);
            e.Property(x => x.PrecinctName).HasMaxLength(200);
            e.Property(x => x.CaseStatus).HasMaxLength(80);
            e.Property(x => x.NumberOfWitness).HasMaxLength(30);
            e.Property(x => x.NotifyToName).HasMaxLength(200);
            e.Property(x => x.ContactFirstName).HasMaxLength(100);
            e.Property(x => x.ContactLastName).HasMaxLength(100);
            e.Property(x => x.IdentityDocument).HasMaxLength(100);
            e.Property(x => x.TelephoneNumber).HasMaxLength(40);
            e.Property(x => x.Extension).HasMaxLength(20);
            e.Property(x => x.AlternateTelephoneNumber).HasMaxLength(40);
            e.Property(x => x.EmailId).HasMaxLength(255);
            e.Property(x => x.ReferenceDocumentName).HasMaxLength(255);
            e.HasOne(x => x.Claim).WithMany().HasForeignKey(x => x.ClaimId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TempClaimParty>(e =>
        {
            e.ToTable("temp_claim_party");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.ClaimId, x.ClientId });
            e.Property(x => x.PartyType).HasMaxLength(80);
            e.Property(x => x.PartyCategory).HasMaxLength(120);
            e.Property(x => x.BusinessName).HasMaxLength(200);
            e.Property(x => x.TinId).HasMaxLength(80);
            e.Property(x => x.FirstName).HasMaxLength(100);
            e.Property(x => x.MiddleName).HasMaxLength(100);
            e.Property(x => x.LastName).HasMaxLength(100);
            e.Property(x => x.DateOfBirth).HasMaxLength(30);
            e.Property(x => x.Gender).HasMaxLength(40);
            e.Property(x => x.SocialSecurityNumber).HasMaxLength(80);
            e.Property(x => x.RelationshipWithInsured).HasMaxLength(120);
            e.Property(x => x.AddressLine1).HasMaxLength(255);
            e.Property(x => x.AddressLine2).HasMaxLength(255);
            e.Property(x => x.Country).HasMaxLength(100);
            e.Property(x => x.State).HasMaxLength(100);
            e.Property(x => x.City).HasMaxLength(100);
            e.Property(x => x.County).HasMaxLength(100);
            e.Property(x => x.ZipCode).HasMaxLength(20);
            e.Property(x => x.Latitude).HasMaxLength(60);
            e.Property(x => x.Longitude).HasMaxLength(60);
            e.Property(x => x.TelephoneNumber).HasMaxLength(40);
            e.Property(x => x.Extension).HasMaxLength(20);
            e.Property(x => x.AlternateTelephoneNumber).HasMaxLength(40);
            e.Property(x => x.EmailId).HasMaxLength(255);
            e.Property(x => x.ProfileImageName).HasMaxLength(255);
            e.Property(x => x.IdProofName).HasMaxLength(255);
            e.HasOne(x => x.Claim).WithMany().HasForeignKey(x => x.ClaimId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TempClaimWitness>(e =>
        {
            e.ToTable("temp_claim_witness");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.ClaimId, x.ClientId });
            e.Property(x => x.FirstName).HasMaxLength(100);
            e.Property(x => x.MiddleName).HasMaxLength(100);
            e.Property(x => x.LastName).HasMaxLength(100);
            e.Property(x => x.DateOfBirth).HasMaxLength(30);
            e.Property(x => x.Gender).HasMaxLength(40);
            e.Property(x => x.SocialSecurityNumber).HasMaxLength(80);
            e.Property(x => x.RelationshipWithInsured).HasMaxLength(120);
            e.Property(x => x.AddressLine1).HasMaxLength(255);
            e.Property(x => x.AddressLine2).HasMaxLength(255);
            e.Property(x => x.Country).HasMaxLength(100);
            e.Property(x => x.State).HasMaxLength(100);
            e.Property(x => x.City).HasMaxLength(100);
            e.Property(x => x.County).HasMaxLength(100);
            e.Property(x => x.ZipCode).HasMaxLength(20);
            e.Property(x => x.Latitude).HasMaxLength(60);
            e.Property(x => x.Longitude).HasMaxLength(60);
            e.Property(x => x.TelephoneNumber).HasMaxLength(40);
            e.Property(x => x.Extension).HasMaxLength(20);
            e.Property(x => x.AlternateTelephoneNumber).HasMaxLength(40);
            e.Property(x => x.EmailId).HasMaxLength(255);
            e.Property(x => x.ProfileImageName).HasMaxLength(255);
            e.Property(x => x.IdProofName).HasMaxLength(255);
            e.HasOne(x => x.Claim).WithMany().HasForeignKey(x => x.ClaimId).OnDelete(DeleteBehavior.Cascade);
        });

        // â”€â”€ Claim Reference Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


        modelBuilder.Entity<TempAdjuster>(e =>
        {
            e.ToTable("temp_adjuster");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.ClientId, x.UserCode }).IsUnique();
            e.Property(x => x.UserCode).IsRequired().HasMaxLength(30);
            e.Property(x => x.FirstName).HasMaxLength(100);
            e.Property(x => x.MiddleName).HasMaxLength(100);
            e.Property(x => x.LastName).HasMaxLength(100);
            e.Property(x => x.DateOfBirth).HasMaxLength(30);
            e.Property(x => x.Ssn).HasMaxLength(80);
            e.Property(x => x.TaxId).HasMaxLength(80);
            e.Property(x => x.Role).HasMaxLength(100);
            e.Property(x => x.AdjusterType).HasMaxLength(100);
            e.Property(x => x.Status).HasMaxLength(40);
            e.Property(x => x.ClaimTypesHandled).HasMaxLength(200);
            e.Property(x => x.TerritoryType).HasMaxLength(100);
            e.Property(x => x.TerritoriesAssigned).HasMaxLength(300);
            e.Property(x => x.EmailId).HasMaxLength(255);
            e.HasMany(x => x.Licenses).WithOne(x => x.Adjuster).HasForeignKey(x => x.AdjusterId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TempAdjusterLicense>(e =>
        {
            e.ToTable("temp_adjuster_license");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.AdjusterId);
            e.Property(x => x.LicensedState).HasMaxLength(100);
            e.Property(x => x.LicenseNumber).HasMaxLength(120);
            e.Property(x => x.LicenseStartDate).HasMaxLength(30);
            e.Property(x => x.LicenseExpirationDate).HasMaxLength(30);
        });
        modelBuilder.Entity<ClaimInitiationChannel>(e =>
        {
            e.ToTable("claim_initiation_channel");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(50);
            e.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<CauseOfLoss>(e =>
        {
            e.ToTable("cause_of_loss");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
            e.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<ConsequenceOfLoss>(e =>
        {
            e.ToTable("consequence_of_loss");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
            e.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<CoverageType>(e =>
        {
            e.ToTable("coverage_type");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
            e.Property(x => x.ClaimType).HasMaxLength(100);
        });

        modelBuilder.Entity<ImpactedAsset>(e =>
        {
            e.ToTable("impacted_asset");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
            e.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<ClaimWorksheet>(e =>
        {
            e.ToTable("claim_worksheet");
            e.HasKey(x => x.Id);
            e.Property(x => x.WsNumber).IsRequired().HasMaxLength(30);
            e.Property(x => x.Status).HasMaxLength(20);
            e.HasOne(x => x.ApprovedByUser).WithMany().HasForeignKey(x => x.ApprovedBy).IsRequired(false);
            e.HasOne(x => x.EscalatedToUser).WithMany().HasForeignKey(x => x.EscalatedTo).IsRequired(false);
            e.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedBy).IsRequired(false);
            e.HasOne(x => x.UpdatedByUser).WithMany().HasForeignKey(x => x.UpdatedBy).IsRequired(false);
            e.HasMany(x => x.Reserves).WithOne(r => r.Worksheet).HasForeignKey(r => r.WorksheetId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Payments).WithOne(p => p.Worksheet).HasForeignKey(p => p.WorksheetId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WorksheetReserve>(e =>
        {
            e.ToTable("worksheet_reserve");
            e.HasKey(x => x.Id);
        });

        modelBuilder.Entity<WorksheetPayment>(e =>
        {
            e.ToTable("worksheet_payment");
            e.HasKey(x => x.Id);
        });

        modelBuilder.Entity<Payee>(e =>
        {
            e.ToTable("payee");
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue("Draft");
            e.Property(x => x.PayeeType).HasMaxLength(100);
            e.Property(x => x.ClaimPayeeType).HasMaxLength(100);
            e.Property(x => x.FraudCheck).HasMaxLength(50);
            e.Property(x => x.OFACChecks).HasColumnName("o_f_a_c_checks").HasMaxLength(50);
            e.Property(x => x.TelephoneNumberCC).HasColumnName("telephone_number_c_c");
            e.Property(x => x.BankDetailsValidation).HasMaxLength(50);
            e.Property(x => x.DuplicatePayeeCheck).HasMaxLength(50);
            e.Property(x => x.CertificationVerification).HasMaxLength(50);
            e.HasOne(x => x.Claim).WithMany().HasForeignKey(x => x.ClaimId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(x => x.BankDetails).WithOne(b => b.Payee).HasForeignKey(b => b.PayeeId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Addresses).WithOne(a => a.Payee).HasForeignKey(a => a.PayeeId).IsRequired(false).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BankDetail>(e =>
        {
            e.ToTable("bank_detail");
            e.HasKey(x => x.Id);
            e.Property(x => x.PaymentMethod).HasMaxLength(50);
            e.Property(x => x.AccountType).HasMaxLength(50);
            e.Property(x => x.BankName).HasMaxLength(200);
            e.Property(x => x.AccountHolderName).HasMaxLength(200);
            // Digit-boundary naming fix: EF snake_case doesn't split after digits
            e.Property(x => x.W9FormOnFile).HasColumnName("w9_form_on_file");
            e.Property(x => x.DateW9Received).HasColumnName("date_w9_received");
            e.Property(x => x.W9FormIrs).HasColumnName("w9_form_irs");
            e.Property(x => x.Type1099).HasColumnName("type1099");
        });

        modelBuilder.Entity<CommonAddress>(e =>
        {
            e.ToTable("common_address");
            e.HasKey(x => x.Id);
            e.Property(x => x.AddressType).HasMaxLength(50);
            e.Property(x => x.Country).HasMaxLength(100);
            e.Property(x => x.State).HasMaxLength(100);
            e.Property(x => x.City).HasMaxLength(100);
            e.Property(x => x.ZipCode).HasMaxLength(20);
        });

        modelBuilder.Entity<Configuration>(e =>
        {
            e.ToTable("configuration");
            e.HasKey(x => x.Id);
            e.Property(x => x.ConfigurationName).IsRequired().HasMaxLength(500);
            e.Property(x => x.ConfigurationType).HasMaxLength(200);
            e.HasOne(x => x.UpdatedByUser).WithMany().HasForeignKey(x => x.UpdatedBy).IsRequired(false);
            e.HasMany(x => x.Values).WithOne(v => v.Configuration).HasForeignKey(v => v.ConfigurationId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ConfigurationValue>(e =>
        {
            e.ToTable("configuration_value");
            e.HasKey(x => x.Id);
            e.Property(x => x.Value).HasColumnName("configuration_value").HasMaxLength(500);
        });

        // ── Letter Templates
        modelBuilder.Entity<LetterTemplate>(e =>
        {
            e.ToTable("letter_template");
            e.HasKey(x => x.Id);
            e.Property(x => x.TemplateCode).HasMaxLength(100);
            e.Property(x => x.Status).HasMaxLength(50);
            e.Property(x => x.CurrentVersion).HasMaxLength(50);
            e.Property(x => x.TemplateName).HasMaxLength(500);
            e.Property(x => x.TemplateCategory).HasMaxLength(200);
            e.Property(x => x.InsuranceType).HasMaxLength(200);
            e.Property(x => x.LineOfBusiness).HasMaxLength(200);
            e.Property(x => x.SubjectLine).HasMaxLength(500);
            e.HasMany(x => x.Documents).WithOne(d => d.Template).HasForeignKey(d => d.TemplateId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.States).WithOne(s => s.Template).HasForeignKey(s => s.TemplateId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LetterTemplateDocument>(e =>
        {
            e.ToTable("letter_template_document");
            e.HasKey(x => x.Id);
            e.Property(x => x.DocumentName).HasMaxLength(500);
            e.Property(x => x.DocumentFile).HasMaxLength(500);
            e.Property(x => x.Version).HasMaxLength(50);
        });

        modelBuilder.Entity<LetterTemplateState>(e =>
        {
            e.ToTable("letter_template_state");
            e.HasKey(x => x.Id);
            e.Property(x => x.State).HasMaxLength(100);
        });

        modelBuilder.Entity<ClaimTask>(e =>
        {
            e.ToTable("claim_task");
            e.HasKey(x => x.Id);
            e.Property(x => x.TaskCode).HasMaxLength(20).IsRequired();
            e.Property(x => x.TaskType).HasMaxLength(100);
            e.Property(x => x.TaskHeading).HasMaxLength(500);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue("New");
            e.Property(x => x.TaskPriority).HasMaxLength(20);
            e.HasOne(x => x.AssignedToUser).WithMany().HasForeignKey(x => x.AssignedTo).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(x => x.Documents).WithOne(d => d.ClaimTask).HasForeignKey(d => d.ClaimTaskId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.AuditLogs).WithOne(l => l.ClaimTask).HasForeignKey(l => l.ClaimTaskId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ClaimTaskDocument>(e =>
        {
            e.ToTable("claim_task_document");
            e.HasKey(x => x.Id);
            e.Property(x => x.FileName).HasMaxLength(500).IsRequired();
            e.Property(x => x.ContentType).HasMaxLength(200);
        });

        modelBuilder.Entity<ClaimTaskAuditLog>(e =>
        {
            e.ToTable("claim_task_audit_log");
            e.HasKey(x => x.Id);
            e.Property(x => x.ActivityType).HasMaxLength(100);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ClaimLetter>(e =>
        {
            e.ToTable("claim_letter");
            e.HasKey(x => x.Id);
            e.Property(x => x.LetterCode).HasMaxLength(20).IsRequired();
            e.Property(x => x.LetterType).HasMaxLength(200);
            e.Property(x => x.Subject).HasMaxLength(500);
            e.Property(x => x.RecipientRole).HasMaxLength(100);
            e.Property(x => x.RecipientName).HasMaxLength(200);
            e.Property(x => x.DeliveryMethod).HasMaxLength(50);
            e.Property(x => x.RecipientEmail).HasMaxLength(255);
            e.Property(x => x.Priority).HasMaxLength(50);
            e.Property(x => x.Status).HasMaxLength(20).HasDefaultValue("Draft");
            e.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.SetNull).IsRequired(false);
            e.HasOne(x => x.UpdatedByUser).WithMany().HasForeignKey(x => x.UpdatedBy).OnDelete(DeleteBehavior.SetNull).IsRequired(false);
        });

        // ── Quotes & Policies (Underwriting) ────────────────────────────────────────────

        modelBuilder.Entity<Intermediary>(e =>
        {
            e.ToTable("intermediary");
            e.HasKey(x => x.Id);
            e.Property(x => x.IntermediaryCode).IsRequired().HasMaxLength(10);
            e.Property(x => x.Status).IsRequired().HasMaxLength(10);
            e.Property(x => x.IntermediaryName).IsRequired().HasMaxLength(50);
            e.Property(x => x.DoingBusinessAs).HasMaxLength(50);
            e.Property(x => x.LegalEntity).IsRequired().HasMaxLength(50);
            e.Property(x => x.FederalTaxId).HasMaxLength(10);
            e.Property(x => x.TypeOfIntermediary).HasMaxLength(50);
            e.Property(x => x.Country).HasMaxLength(50);
            e.Property(x => x.ResidentialState).HasMaxLength(50);
            e.Property(x => x.License).HasMaxLength(10);
            e.Property(x => x.OtherDescription).HasMaxLength(500);
            e.Property(x => x.CommissionDisburseEmail).HasMaxLength(100);
            e.HasIndex(x => new { x.ClientId, x.IntermediaryCode }).IsUnique();
            e.HasMany(x => x.Producers).WithOne(p => p.Intermediary).HasForeignKey(p => p.IntermediaryId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Producer>(e =>
        {
            e.ToTable("producer");
            e.HasKey(x => x.Id);
            e.Property(x => x.ProducerCode).IsRequired().HasMaxLength(10);
            e.Property(x => x.Status).IsRequired().HasMaxLength(10);
            e.Property(x => x.FirstName).IsRequired().HasMaxLength(50);
            e.Property(x => x.MiddleName).HasMaxLength(50);
            e.Property(x => x.LastName).IsRequired().HasMaxLength(50);
            e.Property(x => x.PcLicenseRequirement).HasMaxLength(10);
            e.Property(x => x.Country).HasMaxLength(50);
            e.Property(x => x.ResidentialState).HasMaxLength(50);
            e.Property(x => x.PlLicense).HasMaxLength(10);
            e.Property(x => x.ClLicense).HasMaxLength(10);
            e.Property(x => x.PlclCombinedLicense).HasMaxLength(10);
            e.Property(x => x.TelephoneNumberCC).IsRequired().HasMaxLength(10);
            e.Property(x => x.TelephoneNumber).IsRequired().HasMaxLength(20);
            e.Property(x => x.AltTelephoneNumberCC).HasMaxLength(10);
            e.Property(x => x.AltTelephoneNumber).HasMaxLength(20);
            e.Property(x => x.Email).HasMaxLength(50);
            e.Property(x => x.Suffix).HasMaxLength(4);
            e.Property(x => x.Gender).HasMaxLength(50);
            e.Property(x => x.PersonalBio).HasMaxLength(1000);
            e.HasOne(x => x.Manager).WithMany().HasForeignKey(x => x.ManagerId).IsRequired(false);
        });

        // Distribution Management "Assigned Rights" — per-intermediary screen grant for
        // that intermediary's producers (db/026_intermediary_screen_permissions.sql).
        modelBuilder.Entity<IntermediaryScreenPermission>(e =>
        {
            e.ToTable("intermediary_screen_permissions");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.IntermediaryId, x.ScreenId, x.ClientId }).IsUnique();
            e.HasOne(x => x.Intermediary).WithMany().HasForeignKey(x => x.IntermediaryId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Screen).WithMany().HasForeignKey(x => x.ScreenId);
        });

        modelBuilder.Entity<Account>(e =>
        {
            e.ToTable("account");
            e.HasKey(x => x.Id);
            e.Property(x => x.AccountCode).HasMaxLength(50);
            e.Property(x => x.Status).HasMaxLength(10);
            e.Property(x => x.AccountType).HasMaxLength(50);
            e.Property(x => x.FirstName).HasMaxLength(50);
            e.Property(x => x.MiddleName).HasMaxLength(50);
            e.Property(x => x.LastName).HasMaxLength(50);
            e.Property(x => x.Gender).HasMaxLength(50);
            e.Property(x => x.ProducerType).HasMaxLength(50);
            e.Property(x => x.LegalBusinessName).HasMaxLength(75);
            e.Property(x => x.DoingBusinessAs).HasMaxLength(50);
            e.Property(x => x.LegalEntityType).HasMaxLength(50);
            e.Property(x => x.IndustryType).HasMaxLength(50);
            e.Property(x => x.Suffix).HasMaxLength(4);
            e.HasOne(x => x.Intermediary).WithMany().HasForeignKey(x => x.IntermediaryId).IsRequired(false);
            e.HasOne(x => x.Producer).WithMany().HasForeignKey(x => x.ProducerId).IsRequired(false);
        });

        modelBuilder.Entity<PolicyAccount>(e =>
        {
            e.ToTable("policy_accounts");
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Account).WithMany(a => a.PolicyAccounts).HasForeignKey(x => x.AccountId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Policy).WithMany(p => p.PolicyAccounts).HasForeignKey(x => x.PolicyId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PolicyExtended>(e =>
        {
            e.ToTable("policy_extended");
            e.HasKey(x => x.PolicyId);
            e.Property(x => x.PrimaryInsuredType).HasMaxLength(100);
            e.Property(x => x.InternalReason).HasMaxLength(50);
            e.Property(x => x.ExplainationOfLetter).HasMaxLength(1000);
            e.Property(x => x.ProrationBasis).HasMaxLength(50);
            e.Property(x => x.RequestedBy).HasMaxLength(50);
            e.Property(x => x.ReasonOfCancellation).HasMaxLength(500);
            e.Property(x => x.OtherReason).HasMaxLength(1000);
            e.Property(x => x.Comments).HasMaxLength(1000);
            e.Property(x => x.DeclinedReason).HasMaxLength(100);
            e.Property(x => x.DeclinedReasonDescription).HasMaxLength(1000);
            e.Property(x => x.ReasonForRewritingPolicy).HasMaxLength(500);
            e.Property(x => x.RewriteOtherReason).HasMaxLength(500);
            e.HasOne(x => x.PriorPolicy).WithMany().HasForeignKey(x => x.PriorPolicyId).IsRequired(false);
        });

        modelBuilder.Entity<PolicyProduct>(e =>
        {
            e.ToTable("policy_product");
            e.HasKey(x => x.Id);
            e.Property(x => x.State).HasMaxLength(50);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).IsRequired(false);
            e.HasOne(x => x.SubProduct).WithMany().HasForeignKey(x => x.SubProductId).IsRequired(false);
        });

        modelBuilder.Entity<PolicyLimitCoverage>(e =>
        {
            e.ToTable("policy_limit_coverage");
            e.HasKey(x => x.Id);
            e.Property(x => x.CoverageLevel).HasMaxLength(50);
            e.Property(x => x.LiabilityCoverage).HasMaxLength(50);
            e.Property(x => x.ExcessBlanketPl).HasMaxLength(50);
            e.Property(x => x.CoveredLiabilitySir).HasMaxLength(50);
            e.Property(x => x.SinkholeCatastrophicGroundCollapse).HasMaxLength(50);
            e.Property(x => x.Earthquake).HasMaxLength(50);
            e.Property(x => x.Flood).HasMaxLength(50);
            e.Property(x => x.WindHail).HasMaxLength(50);
            e.Property(x => x.WildFire).HasMaxLength(50);
            e.Property(x => x.ResidentWorkerNfm).HasMaxLength(50);
            e.Property(x => x.SmallScaleFarmingEndorsement).HasMaxLength(50);
            e.Property(x => x.LandlordEndorsement).HasMaxLength(50);
            e.Property(x => x.HomeOfficeEndorsement).HasMaxLength(50);
        });

        modelBuilder.Entity<PolicyPremium>(e =>
        {
            e.ToTable("policy_premium");
            e.HasKey(x => x.Id);
            e.Property(x => x.PaymentFrequency).IsRequired().HasMaxLength(50);
            e.Property(x => x.ResponsibleParty).IsRequired().HasMaxLength(50);
            e.Property(x => x.ModeOfPaymentToUse).HasMaxLength(20);
            e.HasIndex(x => x.PolicyId).IsUnique();
            e.HasMany(x => x.Transactions).WithOne(t => t.PolicyPremium).HasForeignKey(t => t.PolicyPremiumId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PolicyPaymentTransaction>(e =>
        {
            e.ToTable("policy_payment_transaction");
            e.HasKey(x => x.Id);
            e.Property(x => x.TransactionStatus).HasMaxLength(50);
            e.Property(x => x.TransactionId).HasMaxLength(50);
            e.Property(x => x.CustomerReferenceId).HasMaxLength(50);
            e.Property(x => x.PaymentMethod).HasMaxLength(50);
            e.Property(x => x.ResponseCode).HasMaxLength(50);
            e.Property(x => x.ResponseJson).HasMaxLength(2000);
        });

        modelBuilder.Entity<PolicyCommission>(e =>
        {
            e.ToTable("policy_commission");
            e.HasKey(x => x.Id);
            e.Property(x => x.PaymentFrequency).IsRequired().HasMaxLength(50);
            e.HasOne(x => x.Intermediary).WithMany().HasForeignKey(x => x.IntermediaryId);
            e.HasOne(x => x.Producer).WithMany().HasForeignKey(x => x.ProducerId).IsRequired(false);
            e.HasMany(x => x.Transactions).WithOne(t => t.PolicyCommission).HasForeignKey(t => t.PolicyCommissionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CommissionPaymentTransaction>(e =>
        {
            e.ToTable("commission_payment_transaction");
            e.HasKey(x => x.Id);
            e.Property(x => x.TransactionStatus).HasMaxLength(50);
            e.Property(x => x.TransactionId).HasMaxLength(50);
            e.Property(x => x.CustomerReferenceId).HasMaxLength(50);
            e.Property(x => x.PaymentMethod).HasMaxLength(50);
            e.Property(x => x.ResponseCode).HasMaxLength(50);
            e.Property(x => x.ResponseJson).HasMaxLength(2000);
        });

        modelBuilder.Entity<PolicyMortgage>(e =>
        {
            e.ToTable("policy_mortgage");
            e.HasKey(x => x.Id);
            e.Property(x => x.MortgageName).HasMaxLength(100);
            e.Property(x => x.LoanNumber).HasMaxLength(50);
            e.Property(x => x.MortgageServiceCompany).HasMaxLength(100);
            e.Property(x => x.TelephoneNumber).HasMaxLength(50);
            e.Property(x => x.TelephoneNumberCC).HasMaxLength(10);
            e.Property(x => x.Extension).HasMaxLength(50);
            e.Property(x => x.AltTelephoneNumber).HasMaxLength(50);
            e.Property(x => x.AltTelephoneNumberCC).HasMaxLength(10);
            e.Property(x => x.EmailId).HasMaxLength(50);
            e.Property(x => x.GoogleAddress).HasMaxLength(200);
            e.Property(x => x.AddressLine1).HasMaxLength(500);
            e.Property(x => x.AddressLine2).HasMaxLength(500);
            e.Property(x => x.Country).HasMaxLength(50);
            e.Property(x => x.State).HasMaxLength(50);
            e.Property(x => x.City).HasMaxLength(50);
            e.Property(x => x.ZipCode).HasMaxLength(50);
            e.Property(x => x.Latitude).HasMaxLength(50);
            e.Property(x => x.Longitude).HasMaxLength(50);
            e.Property(x => x.County).HasMaxLength(50);
            e.Property(x => x.LenderType).HasMaxLength(50);
            e.Property(x => x.LoanType).HasMaxLength(50);
            e.Property(x => x.CoveredAsset).HasMaxLength(50);
        });

        modelBuilder.Entity<PolicyDocument>(e =>
        {
            e.ToTable("policy_document");
            e.HasKey(x => x.Id);
            e.Property(x => x.BlobPath).HasMaxLength(500);
            e.Property(x => x.FileName).HasMaxLength(500);
            e.Property(x => x.FileType).HasMaxLength(50);
            e.Property(x => x.TransactionType).HasMaxLength(100);
            e.Property(x => x.Version).HasMaxLength(5);
        });

        modelBuilder.Entity<Note>(e =>
        {
            e.ToTable("note");
            e.HasKey(x => x.Id);
            e.Property(x => x.AccessType).HasMaxLength(20);
            e.Property(x => x.Module).HasMaxLength(50);
            e.HasOne(x => x.Policy).WithMany().HasForeignKey(x => x.PolicyId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Account).WithMany().HasForeignKey(x => x.AccountId).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(x => x.Files).WithOne(x => x.Note).HasForeignKey(x => x.NotesId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<NoteFile>(e =>
        {
            e.ToTable("note_file");
            e.HasKey(x => x.Id);
            e.Property(x => x.FileName).HasMaxLength(255);
            e.Property(x => x.FileType).HasMaxLength(100);
            e.Property(x => x.Module).HasMaxLength(50);
        });

        modelBuilder.Entity<ProductDocument>(e =>
        {
            e.ToTable("product_document");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.PlumsailProcessId).HasMaxLength(200);
            e.Property(x => x.PlumsailUserId).HasMaxLength(200);
            e.Property(x => x.ClientMappingId).HasMaxLength(50);
        });

        modelBuilder.Entity<RiskAddress>(e =>
        {
            e.ToTable("risk_address");
            e.HasKey(x => x.Id);
            e.Property(x => x.AddressType).HasMaxLength(50);
            e.Property(x => x.AddressLine1).HasMaxLength(500);
            e.Property(x => x.AddressLine2).HasMaxLength(500);
            e.Property(x => x.Country).HasMaxLength(50);
            e.Property(x => x.State).HasMaxLength(50);
            e.Property(x => x.City).HasMaxLength(50);
            e.Property(x => x.ZipCode).HasMaxLength(50);
            e.Property(x => x.Latitude).HasMaxLength(50);
            e.Property(x => x.Longitude).HasMaxLength(50);
            e.Property(x => x.County).HasMaxLength(50);
            e.Property(x => x.GoogleAddress).HasMaxLength(200);
            e.HasMany(x => x.RiskInformation).WithOne(r => r.RiskAddress).HasForeignKey(r => r.RiskAddressId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PolicyRiskInformation>(e =>
        {
            e.ToTable("policy_risk_information");
            e.HasKey(x => x.Id);
            e.Property(x => x.BuildingFloodElevation).HasMaxLength(50);
            e.Property(x => x.BuildingType).HasMaxLength(50);
            e.Property(x => x.BuildingDecription).HasMaxLength(1000);
            e.Property(x => x.HexZoneLowerResolution).HasMaxLength(50);
            e.Property(x => x.HexZoneHigerResolution).HasMaxLength(50);
            e.Property(x => x.FloodZone).HasMaxLength(50);
            e.Property(x => x.ConstructionType).HasMaxLength(50);
            e.Property(x => x.NumberOfStories).HasMaxLength(50);
            e.Property(x => x.SquareFootage).HasMaxLength(50);
            e.Property(x => x.RoofShape).HasMaxLength(50);
            e.Property(x => x.RoofCovering).HasMaxLength(50);
            e.Property(x => x.PresenceOfBasement).HasMaxLength(50);
            e.Property(x => x.Status).HasMaxLength(50);
            e.Property(x => x.WritingCompany).HasMaxLength(500);
            e.Property(x => x.ResidenceType).HasMaxLength(100);
            e.Property(x => x.RoofArchitectureType).HasMaxLength(100);
            e.Property(x => x.FoundationType).HasMaxLength(100);
        });

        modelBuilder.Entity<AdditionalInsured>(e =>
        {
            e.ToTable("additional_insured");
            e.HasKey(x => x.Id);
            e.Property(x => x.FirstName).HasMaxLength(50);
            e.Property(x => x.MiddleName).HasMaxLength(50);
            e.Property(x => x.LastName).HasMaxLength(50);
            e.Property(x => x.Relationship).HasMaxLength(50);
            e.Property(x => x.TelephoneNumber).HasMaxLength(20);
            e.Property(x => x.TelephoneNumberCC).HasMaxLength(10);
            e.Property(x => x.AltTelephoneNumber).HasMaxLength(20);
            e.Property(x => x.AltTelephoneNumberCC).HasMaxLength(10);
            e.Property(x => x.Email).HasMaxLength(50);
            e.Property(x => x.Gender).HasMaxLength(50);
            e.Property(x => x.InsuredType).HasMaxLength(50);
            e.Property(x => x.Suffix).HasMaxLength(4);
            e.Property(x => x.Dba).HasMaxLength(75);
        });

        modelBuilder.Entity<AdditionalOrganisation>(e =>
        {
            e.ToTable("additional_organisation");
            e.HasKey(x => x.Id);
            e.Property(x => x.FirstName).HasMaxLength(50);
            e.Property(x => x.MiddleName).HasMaxLength(50);
            e.Property(x => x.LastName).HasMaxLength(50);
            e.Property(x => x.OrganisationName).HasMaxLength(75);
            e.Property(x => x.TelephoneNumber).HasMaxLength(50);
            e.Property(x => x.TelephoneNumberCC).HasMaxLength(50);
            e.Property(x => x.AltTelephoneNumber).HasMaxLength(50);
            e.Property(x => x.AltTelephoneNumberCC).HasMaxLength(50);
            e.Property(x => x.Email).HasMaxLength(50);
            e.Property(x => x.OrganisationType).HasMaxLength(50);
        });

        modelBuilder.Entity<HbRaterExcessFloodCoverage>(e =>
        {
            e.ToTable("hb_rater_excess_flood_coverage");
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).HasMaxLength(50);
            e.Property(x => x.TypeOfBuilding).HasMaxLength(50);
            e.Property(x => x.BuildingDescription).HasMaxLength(100);
            e.Property(x => x.FloodZone).HasMaxLength(50);
            e.Property(x => x.PValue).HasColumnType("numeric(37,8)");
        });

        modelBuilder.Entity<HbRaterHrHexzone>(e =>
        {
            e.ToTable("hb_rater_hr_hexzone");
            e.HasKey(x => x.Id);
            e.Property(x => x.HrHexzones).HasColumnName("hr_hexzones").HasMaxLength(50);
            e.Property(x => x.Hurricanerateper1000).HasColumnName("hurricanerateper1000").HasColumnType("numeric(37,8)");
            e.Property(x => x.Tornado).HasColumnType("numeric(37,8)");
            e.Property(x => x.Hail).HasColumnType("numeric(37,8)");
        });

        modelBuilder.Entity<HbRaterLrHexzones>(e =>
        {
            e.ToTable("hb_rater_lr_hexzones");
            e.HasKey(x => x.Id);
            e.Property(x => x.LrHexzones).HasColumnName("lr_hexzones").HasMaxLength(50);
            e.Property(x => x.StateAbb).HasMaxLength(50);
            e.Property(x => x.Derechorateper1000).HasColumnName("derechorateper1000").HasColumnType("numeric(37,8)");
            e.Property(x => x.XwindCombinedrateAllotherpe).HasColumnName("xwind_combinedrate_allotherpe").HasColumnType("numeric(37,8)");
            e.Property(x => x.Earthquakerate).HasColumnType("numeric(37,8)");
            e.Property(x => x.Sinkholerate).HasColumnType("numeric(37,8)");
            e.Property(x => x.Liabilityrates).HasColumnType("numeric(37,8)");
            e.Property(x => x.Flashfloodrates).HasColumnType("numeric(37,8)");
        });

        modelBuilder.Entity<HbRaterRatingWildfire>(e =>
        {
            e.ToTable("hb_rater_rating_wildfire");
            e.HasKey(x => x.Id);
            e.Property(x => x.State).HasMaxLength(50);
            e.Property(x => x.K8).HasColumnType("numeric(37,8)");
        });

        modelBuilder.Entity<HbRaterStateTaxSheet>(e =>
        {
            e.ToTable("hb_rater_state_tax_sheet");
            e.HasKey(x => x.Id);
            e.Property(x => x.State).HasMaxLength(50);
            e.Property(x => x.SurplusLines).HasColumnType("numeric(37,8)");
            e.Property(x => x.StampingFee).HasColumnType("numeric(37,8)");
            e.Property(x => x.FirePremiumTax).HasColumnType("numeric(37,8)");
            e.Property(x => x.Abbreviation).HasMaxLength(50);
        });

        modelBuilder.Entity<Submission>(e =>
        {
            e.ToTable("submissions");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(20).ValueGeneratedNever();
            e.Property(x => x.Status).IsRequired().HasMaxLength(50);
            e.Property(x => x.Data)
                .HasColumnType("jsonb")
                .IsRequired();
        });

        modelBuilder.Entity<BulkUploadAudit>(e =>
        {
            e.ToTable("bulk_upload_audit");
            e.HasKey(x => x.Id);
            e.Property(x => x.Module).IsRequired().HasMaxLength(50);
            e.Property(x => x.FileName).IsRequired().HasMaxLength(500);
            e.Property(x => x.Status).IsRequired().HasMaxLength(20);
            e.Property(x => x.ErrorFile).HasColumnType("bytea");
        });

        modelBuilder.Entity<PolicyTransactionType>(e =>
        {
            e.ToTable("policy_transaction_type");
            e.HasKey(x => x.Code);
            e.Property(x => x.Code).HasMaxLength(50);
            e.Property(x => x.Label).IsRequired().HasMaxLength(100);
        });

        modelBuilder.Entity<PolicyTransaction>(e =>
        {
            e.ToTable("policy_transaction");
            e.HasKey(x => x.Id);
            e.Property(x => x.PolicyNumber).IsRequired().HasMaxLength(100);
            e.Property(x => x.TransactionType).HasMaxLength(50);
            e.Property(x => x.Status).HasMaxLength(50);
            e.HasOne(x => x.MainPolicy).WithMany().HasForeignKey(x => x.MainPolicyId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.RedirectionPolicy).WithMany().HasForeignKey(x => x.RedirectionPolicyId).IsRequired(false);
            e.HasOne(x => x.TransactionTypeRef).WithMany().HasForeignKey(x => x.TransactionType).IsRequired(false);
        });

        modelBuilder.Entity<PolicyPaymentTransactionExtended>(e =>
        {
            e.ToTable("policy_payment_transaction_extended");
            e.HasKey(x => x.PolicyPaymentTransactionId);
            e.HasOne(x => x.PolicyPaymentTransaction).WithOne(x => x.Extended).HasForeignKey<PolicyPaymentTransactionExtended>(x => x.PolicyPaymentTransactionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CancellationPaymentTransaction>(e =>
        {
            e.ToTable("cancellation_payment_transaction");
            e.HasKey(x => x.Id);
            e.Property(x => x.TransactionStatus).HasMaxLength(50);
            e.Property(x => x.TransactionId).HasMaxLength(50);
            e.Property(x => x.PaymentMethod).HasMaxLength(50);
            e.Property(x => x.ResponseCode).HasMaxLength(50);
            e.Property(x => x.ResponseJson).HasMaxLength(2000);
            e.HasOne(x => x.Policy).WithMany(p => p.CancellationTransactions).HasForeignKey(x => x.PolicyId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Audit>(e =>
        {
            e.ToTable("audits");
            e.HasKey(x => x.Id);
            e.Property(x => x.ActivityType).HasMaxLength(50);
            e.Property(x => x.ActivityDescription).HasMaxLength(500);
            e.Property(x => x.Module).HasMaxLength(50);
            e.Property(x => x.TableName).HasMaxLength(100);
            e.HasOne(x => x.Transaction).WithMany().HasForeignKey(x => x.TransactionId).IsRequired(false);
        });

        modelBuilder.Entity<PolicyConfigurationRequestedBy>(e =>
        {
            e.ToTable("policy_configurations_requested_by");
            e.HasKey(x => x.Code);
            e.Property(x => x.Code).HasMaxLength(20);
            e.Property(x => x.Label).HasMaxLength(50);
            e.Property(x => x.TypeOfCompany).HasMaxLength(30);
        });
    }
}



