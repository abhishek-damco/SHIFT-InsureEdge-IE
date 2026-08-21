using System.Reflection;
using FluentAssertions;
using InsureEdge.API.Controllers;
using InsureEdge.API.Filters;
using InsureEdge.Application.DTOs.Claim;
using InsureEdge.Domain.Enums;
using Xunit;

namespace InsureEdge.UnitTests;

public class ClaimFlowContractTests
{
    [Fact]
    public void ClaimSaveRequest_PersistsStatusAndWizardProgress()
    {
        typeof(CreateOrUpdateClaimRequest).GetProperty(nameof(CreateOrUpdateClaimRequest.Status))
            .Should().NotBeNull();
        typeof(CreateOrUpdateClaimRequest).GetProperty(nameof(CreateOrUpdateClaimRequest.LastStepNumber))
            .Should().NotBeNull();
    }

    [Fact]
    public void RiskLocationId_IsNullableWhenPolicyHasNoLegacyLocation()
    {
        var idProperty = typeof(RiskLocationDetailsDto).GetProperty(nameof(RiskLocationDetailsDto.Id));
        Nullable.GetUnderlyingType(idProperty!.PropertyType).Should().Be(typeof(long));
    }

    [Theory]
    [InlineData(nameof(ClaimsController.GetFnolById), "FNOLREGSCREEN", PermissionType.View)]
    [InlineData(nameof(ClaimsController.GetFnolDocuments), "FNOLREGSCREEN", PermissionType.View)]
    [InlineData(nameof(ClaimsController.AddFnolDocument), "FNOLREGSCREEN", PermissionType.Add)]
    [InlineData(nameof(ClaimsController.GetById), "CLAIMENQUIRYSCREEN", PermissionType.View)]
    public void ClaimRoutes_KeepTheirIntendedPermissionBoundary(
        string methodName, string expectedScreen, PermissionType expectedPermission)
    {
        var method = typeof(ClaimsController).GetMethod(methodName);
        method.Should().NotBeNull();

        var attribute = method!.CustomAttributes.Single(a => a.AttributeType == typeof(PermissionAttribute));
        attribute.ConstructorArguments[0].Value.Should().Be(expectedScreen);
        attribute.ConstructorArguments[1].Value.Should().Be((int)expectedPermission);
    }
}
