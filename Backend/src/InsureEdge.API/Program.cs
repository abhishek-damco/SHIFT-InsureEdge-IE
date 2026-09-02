// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// ADR-002: Cookie auth (HttpOnly, SameSite=Strict). ADR-005: UseSnakeCaseNamingConvention.
// ADR-007: MailKit SMTP from env vars. ADR-009: PermissionContext via /api/auth/me/permissions.
// ADR-010: ICurrentTenantService scoped per request.
using InsureEdge.Application.Interfaces;
using InsureEdge.Application.Services;
using InsureEdge.Infrastructure.BackgroundJobs;
using InsureEdge.Infrastructure.Data;
using InsureEdge.Infrastructure.Email;
using InsureEdge.Infrastructure.Identity;
using InsureEdge.Infrastructure.Repositories;
using InsureEdge.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

// Load .env BEFORE CreateBuilder: the environment-variables configuration provider
// snapshots process env vars during CreateBuilder, so later loads are invisible to
// IConfiguration. TraversePath: the .env lives at Backend/.env, two levels above the
// API project, so search upward instead of requiring an exact cwd.
DotNetEnv.Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

// This API is run as a normal local process, not as a Windows service. Register
// only non-privileged providers explicitly: the Windows Event Log provider can
// throw AccessDenied while handling a different application error and mask the
// real API response.
builder.Logging.ClearProviders();
builder.Logging.AddConfiguration(builder.Configuration.GetSection("Logging"));
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// Allow Dapper to map snake_case column names to PascalCase C# properties
Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;

// Dapper has no built-in DateOnly support (System.NotSupportedException on parameters) —
// register handlers so raw-SQL controllers (UsersController, AuthController.UpdateMyProfile)
// can bind DateOnly?/DateOnly request fields directly.
Dapper.SqlMapper.AddTypeHandler(new InsureEdge.API.DateOnlyTypeHandler());
Dapper.SqlMapper.AddTypeHandler(new InsureEdge.API.NullableDateOnlyTypeHandler());

// Allow Npgsql to map PostgreSQL date/timestamptz to DateTime (legacy behaviour)
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// --- Database ---
builder.Services.AddDbContext<InsureEdgeDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")
            ?? builder.Configuration["DATABASE_URL"]
            ?? throw new InvalidOperationException("No connection string configured."))
        .UseSnakeCaseNamingConvention()); // ADR-005

// --- Auth (Cookie / ADR-002) ---
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(opts =>
    {
        opts.Cookie.HttpOnly = true;
        opts.Cookie.SameSite = SameSiteMode.Strict;
        opts.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.None
            : CookieSecurePolicy.Always;
        opts.Cookie.Name = "insuredge_auth";
        opts.ExpireTimeSpan = TimeSpan.FromHours(8);
        opts.SlidingExpiration = true;
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

builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();

// --- Application Services ---
builder.Services.AddScoped<GroupService>();
builder.Services.AddScoped<PasswordResetService>();
builder.Services.AddScoped<ClaimService>();
builder.Services.AddScoped<AdjusterService>();
builder.Services.AddScoped<InsureEdge.Infrastructure.Services.WorksheetService>();
builder.Services.AddScoped<InsureEdge.Application.Services.ClientService>();
builder.Services.AddScoped<PayeeService>();
builder.Services.AddScoped<ConfigurationService>();
builder.Services.AddScoped<LetterTemplateService>();
builder.Services.AddScoped<InsureEdge.Application.Services.TaskService>();
builder.Services.AddScoped<InsureEdge.Application.Services.ClaimLetterService>();
builder.Services.AddScoped<PolicyQuoteService>();
builder.Services.AddScoped<InsureEdge.Infrastructure.Services.RenewalQuoteService>();
builder.Services.AddScoped<InsureEdge.Infrastructure.Services.RenewalNoticeService>();
builder.Services.AddScoped<SubmissionService>();
builder.Services.AddScoped<RatingService>();
builder.Services.AddScoped<BulkUploadService>();
builder.Services.AddScoped<InsureEdge.Infrastructure.Services.IntermediaryService>();
builder.Services.AddScoped<InsureEdge.Infrastructure.Services.ProducerService>();
builder.Services.AddScoped<InsureEdge.Infrastructure.Services.IntermediaryScreenPermissionService>();

// --- Background Jobs (Timer equivalent to OutSystems BPT) ---
builder.Services.AddScoped<AutoRenewalTimerJob>();
builder.Services.AddHostedService<AutoRenewalHostedService>();

// --- Infrastructure ---
builder.Services.AddScoped<IGroupRepository, GroupRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IPasswordResetRepository, PasswordResetRepository>();
builder.Services.AddScoped<IClaimRepository, ClaimRepository>();
builder.Services.AddScoped<IAdjusterRepository, AdjusterRepository>();
builder.Services.AddScoped<InsureEdge.Application.Interfaces.IClientRepository, InsureEdge.Infrastructure.Repositories.ClientRepository>();
builder.Services.AddScoped<IPayeeRepository, PayeeRepository>();
builder.Services.AddScoped<InsureEdge.Application.Interfaces.ITaskRepository, InsureEdge.Infrastructure.Repositories.TaskRepository>();
builder.Services.AddScoped<InsureEdge.Application.Interfaces.IClaimLetterRepository, InsureEdge.Infrastructure.Repositories.ClaimLetterRepository>();
builder.Services.AddScoped<IConfigurationRepository, ConfigurationRepository>();
builder.Services.AddScoped<ILetterTemplateRepository, LetterTemplateRepository>();
builder.Services.AddScoped<IPolicyQuoteRepository, PolicyQuoteRepository>();
builder.Services.AddScoped<ISubmissionRepository, SubmissionRepository>();
builder.Services.AddScoped<IRatingRepository, RatingRepository>();
builder.Services.AddScoped<IBulkUploadRepository, BulkUploadRepository>();
builder.Services.AddScoped<ICurrentTenantService, CurrentTenantService>();  // ADR-010
builder.Services.AddScoped<IPermissionResolver, PermissionResolver>();
builder.Services.AddSingleton<IEmailService, SmtpEmailService>(); // stateless SMTP

// Document Generation (PRD): Plumsail integration module + IE_Policy_BL orchestration.
builder.Services.AddHttpClient("plumsail", c => c.Timeout = TimeSpan.FromSeconds(60));
builder.Services.AddScoped<IPlumsailDocumentGenerator, InsureEdge.Infrastructure.Documents.PlumsailDocumentGenerator>();
builder.Services.AddScoped<IDocumentGenerationService, InsureEdge.Infrastructure.Documents.DocumentGenerationService>();

// TEMPORARILY DISABLED — InsureEdge.Infrastructure.Rating (RaterBootstrap, RaterFunctions,
// Rater, HbisPlanComparisonChart) and HbisLimitsAndCoveragesService do not exist anywhere in
// this branch's source or history — a pre-existing gap unrelated to Producer/Distribution
// work, found while getting the solution building again. Re-enable alongside
// RatingController's matching disabled endpoints once that subsystem is actually
// ported/committed. See VERSIONS.md.
// builder.Services.AddScoped<InsureEdge.Infrastructure.Rating.RaterBootstrap>();
builder.Services.AddMemoryCache(); // aggregate-level "Cache in Minutes" support — still needed elsewhere
// builder.Services.AddScoped<InsureEdge.Infrastructure.Rating.RaterFunctions>();
// builder.Services.AddScoped<InsureEdge.Infrastructure.Rating.Rater>();
// builder.Services.AddScoped<InsureEdge.Infrastructure.Rating.HbisPlanComparisonChart>();
builder.Services.AddScoped<InsureEdge.Infrastructure.Services.HbisLimitsAndCoveragesService>();

// --- Controllers ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// --- CORS (allow frontend dev server) ---
builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(p =>
        p.WithOrigins(
            "http://localhost:3000",
            "https://localhost:3000",
            "http://localhost:3001",
            "https://localhost:3001",
            "https://insureedge-frontend.onrender.com")
          .AllowAnyHeader()
          .AllowAnyMethod()
          .AllowCredentials())); // credentials required for cookie auth

var app = builder.Build();

app.UseExceptionHandler(errApp => errApp.Run(async ctx =>
{
    var ex = ctx.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;
    var log = ctx.RequestServices.GetRequiredService<ILogger<Program>>();
    log.LogError(ex, "Unhandled exception on {Method} {Path}", ctx.Request.Method, ctx.Request.Path);
    ctx.Response.StatusCode  = 500;
    ctx.Response.ContentType = "application/json";
    await ctx.Response.WriteAsync($"{{\"error\":\"{ex?.Message?.Replace("\"","\\\"") ?? "Unknown error"}\"}}");
}));

app.UseCors();
if (!app.Environment.IsDevelopment()) app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Sync Plumsail template mapping from .env (PLUMSAIL_PROCESS_ID / PLUMSAIL_USER_ID) into
// product_document at startup, so a fresh clone just needs a filled-in .env instead of a
// manual SQL step. Only touches the row while it's still the seeded placeholder — a value
// set directly in the DB (e.g. for a real deployment) is left alone.
var plumsailProcessId = app.Configuration["PLUMSAIL_PROCESS_ID"];
var plumsailUserId = app.Configuration["PLUMSAIL_USER_ID"];
if (!string.IsNullOrWhiteSpace(plumsailProcessId) && !string.IsNullOrWhiteSpace(plumsailUserId))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<InsureEdgeDbContext>();
    var template = await db.ProductDocuments.FirstOrDefaultAsync(d =>
        d.ClientId == 1 && d.Name == "QuoteProposalDeclarationPage");
    if (template != null && (template.PlumsailProcessId?.StartsWith("REPLACE_WITH", StringComparison.OrdinalIgnoreCase) ?? true))
    {
        template.PlumsailProcessId = plumsailProcessId;
        template.PlumsailUserId = plumsailUserId;
        await db.SaveChangesAsync();
    }
}

// Copy email templates to output directory at startup
var templateSrc = Path.Combine(app.Environment.ContentRootPath, "..","InsureEdge.Infrastructure","Email","Templates");
var templateDst = Path.Combine(AppContext.BaseDirectory, "Email", "Templates");
if (Directory.Exists(templateSrc))
{
    Directory.CreateDirectory(templateDst);
    foreach (var file in Directory.GetFiles(templateSrc))
        File.Copy(file, Path.Combine(templateDst, Path.GetFileName(file)), overwrite: true);
}

// TEMPORARILY DISABLED — see the matching disabled DI registrations above; RaterBootstrap
// doesn't exist yet on this branch. Re-enable together.
// using (var scope = app.Services.CreateScope())
// {
//     var raterBootstrap = scope.ServiceProvider.GetRequiredService<InsureEdge.Infrastructure.Rating.RaterBootstrap>();
//     try
//     {
//         await raterBootstrap.BootstrapExcessFloodCoveragesAsync();
//         await raterBootstrap.BootstrapHRHexzonesAsync();
//         await raterBootstrap.BootstrapLRHexzonesAsync();
//         await raterBootstrap.BootstrapStateTaxSheetAsync();
//     }
//     catch (Exception ex)
//     {
//         scope.ServiceProvider.GetRequiredService<ILogger<Program>>()
//             .LogError(ex, "Rater bootstrap failed — HBRater tables may be unseeded");
//     }
// }

app.Run();
