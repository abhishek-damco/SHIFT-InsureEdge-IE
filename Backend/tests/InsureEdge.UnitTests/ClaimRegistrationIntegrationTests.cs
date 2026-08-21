using FluentAssertions;
using InsureEdge.Application.DTOs.Claim;
using InsureEdge.Application.Interfaces;
using InsureEdge.Infrastructure.Data;
using InsureEdge.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace InsureEdge.UnitTests;

public class ClaimRegistrationIntegrationTests
{
    [Fact]
    [Trait("Category", "Integration")]
    public async Task Producer_CanSaveResumeFinalizeAndAttachDocument()
    {
        var connectionString = Environment.GetEnvironmentVariable("INSUREEDGE_INTEGRATION_DB");
        if (string.IsNullOrWhiteSpace(connectionString)) return;

        var options = new DbContextOptionsBuilder<InsureEdgeDbContext>()
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention()
            .Options;

        long? createdClaimId = null;
        await using var db = new InsureEdgeDbContext(options);
        var policy = await db.Policies.AsNoTracking()
            .Where(p => p.PolicyType == "POLICY" && p.ProducerId != null && p.IntermediaryId != null)
            .OrderByDescending(p => p.Id)
            .Select(p => new { p.Id, p.ClientId, ProducerId = p.ProducerId!.Value, IntermediaryId = p.IntermediaryId!.Value })
            .FirstAsync();
        var userId = await db.Users.AsNoTracking()
            .Where(u => u.ClientId == policy.ClientId)
            .Select(u => u.Id)
            .FirstAsync();
        var coverageId = await db.ClaimCoverages.AsNoTracking()
            .Where(c => c.IsHoPhyscialDamage == true && c.Coverage != null)
            .Select(c => c.Id)
            .FirstAsync();
        var cause = await db.ClaimCoverages.AsNoTracking()
            .Where(c => c.CauseOfLoss != null && c.CauseOfLoss != "")
            .Select(c => new { c.Id, Name = c.CauseOfLoss! })
            .FirstAsync();
        var consequence = await db.ConsequencesOfLoss.AsNoTracking().Select(c => c.Name).FirstAsync();

        var tenant = new TestTenant(policy.ClientId, userId, policy.ProducerId, policy.IntermediaryId);
        var repository = new ClaimRepository(db, tenant);

        try
        {
            var draftId = await repository.CreateOrUpdateAsync(
                Request(null, policy.Id, "DRAFT", 3), policy.ClientId, userId);
            createdClaimId = draftId;

            var draft = await repository.GetClaimByIdAsync(draftId, policy.ClientId);
            draft.Should().NotBeNull();
            draft!.Status.Should().Be("DRAFT");
            draft.LastStepNumber.Should().Be(3);
            draft.ClaimNumber.Should().StartWith($"CLM-{DateTime.UtcNow.Year}-");

            var finalizedId = await repository.CreateOrUpdateAsync(
                Request(
                    draftId, policy.Id, "OPEN", 4,
                    dateOfLoss: "2026-08-19",
                    timeOfLoss: "14:30",
                    claimType: "HO - Physical Damage",
                    mainCause: cause.Name,
                    consequence: consequence,
                    lossDescription: "Automated end-to-end claim registration verification",
                    physicalDamage: true,
                    claimOnlyThirdParty: false,
                    coverages: [new ClaimCoverageSaveDto(null, coverageId, cause.Id, null)]),
                policy.ClientId, userId);

            finalizedId.Should().Be(draftId);
            var finalized = await repository.GetClaimByIdAsync(draftId, policy.ClientId);
            finalized!.Status.Should().Be("OPEN");
            finalized.LastStepNumber.Should().Be(4);
            finalized.Coverages.Should().ContainSingle();

            var document = await repository.AddDocumentAsync(
                draftId,
                new CreateClaimDocumentRequest(
                    "fnol-e2e.png", "image/png", 4,
                    Convert.ToBase64String([1, 2, 3, 4]), null, "E2E verification"),
                policy.ClientId, userId);
            document.FileName.Should().Be("fnol-e2e.png");
            (await repository.GetDocumentsAsync(draftId, policy.ClientId)).Should().ContainSingle();

            var otherProducerId = await db.Producers.AsNoTracking()
                .Where(p => p.ClientId == policy.ClientId && p.Id != policy.ProducerId)
                .Select(p => (long?)p.Id)
                .FirstOrDefaultAsync();
            if (otherProducerId.HasValue)
            {
                var otherTenant = new TestTenant(policy.ClientId, userId, otherProducerId.Value, policy.IntermediaryId);
                var otherRepository = new ClaimRepository(db, otherTenant);
                (await otherRepository.GetClaimByIdAsync(draftId, policy.ClientId)).Should().BeNull();
            }
        }
        finally
        {
            if (createdClaimId.HasValue)
            {
                await db.ClaimDocuments.Where(x => x.ClaimId == createdClaimId.Value).ExecuteDeleteAsync();
                await db.Claimants.Where(x => x.ClaimId == createdClaimId.Value).ExecuteDeleteAsync();
                await db.ClaimImpactedCoverages.Where(x => x.ClaimId == createdClaimId.Value).ExecuteDeleteAsync();
                await db.Claims.Where(x => x.Id == createdClaimId.Value).ExecuteDeleteAsync();
            }
        }
    }

    private static CreateOrUpdateClaimRequest Request(
        long? id,
        long policyId,
        string status,
        short lastStep,
        string? dateOfLoss = null,
        string? timeOfLoss = null,
        string? claimType = null,
        string? mainCause = null,
        string? consequence = null,
        string? lossDescription = null,
        bool? physicalDamage = null,
        bool? claimOnlyThirdParty = null,
        List<ClaimCoverageSaveDto>? coverages = null) => new(
            Id: id,
            PolicyId: policyId,
            RiskLocationId: null,
            Status: status,
            LastStepNumber: lastStep,
            IsClaimReportedByInsured: true,
            ReporterFirstName: null,
            ReporterLastName: null,
            ReporterRelationship: null,
            ReporterTelephone: null,
            ReporterTelephoneCC: null,
            ReporterEmail: null,
            DateOfLoss: dateOfLoss,
            TimeOfLoss: timeOfLoss,
            ClaimInitiationChannel: null,
            ClaimType: claimType,
            MainCauseOfLoss: mainCause,
            ConsequencesOfLoss: consequence,
            InspectionRequired: false,
            ClaimReimbursementType: null,
            CatastrophicEvent: null,
            LossDescription: lossDescription,
            ListOfDamageFirstParty: null,
            PhysicalDamage: physicalDamage,
            ClaimOnlyThirdParty: claimOnlyThirdParty,
            IsThirdPartyDamage: false,
            LossAddressLine1: null,
            LossAddressLine2: null,
            LossCountry: null,
            LossState: null,
            LossCity: null,
            LossCounty: null,
            LossZipCode: null,
            LossLatitude: null,
            LossLongitude: null,
            ClaimEstimate: "USD 100.00",
            Comment: "FNOL E2E verification",
            Coverages: coverages ?? [],
            Claimants: []);

    private sealed record TestTenant(
        long ClientId,
        long UserId,
        long ProducerIdValue,
        long IntermediaryIdValue) : ICurrentTenantService
    {
        public long? ProducerId => ProducerIdValue;
        public long? IntermediaryId => IntermediaryIdValue;
        public bool IsFullProducerVisibility => false;
    }
}
