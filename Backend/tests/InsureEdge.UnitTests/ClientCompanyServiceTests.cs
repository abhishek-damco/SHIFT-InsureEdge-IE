using FluentAssertions;
using InsureEdge.Application.DTOs.Client;
using InsureEdge.Application.Interfaces;
using InsureEdge.Application.Services;
using Moq;
using Xunit;

namespace InsureEdge.UnitTests;

public class ClientCompanyServiceTests
{
    private readonly Mock<IClientRepository> repository = new(MockBehavior.Strict);
    private readonly Mock<ICurrentTenantService> tenant = new(MockBehavior.Strict);

    public ClientCompanyServiceTests()
    {
        tenant.SetupGet(x => x.ClientId).Returns(42);
        tenant.SetupGet(x => x.UserId).Returns(7);
    }

    [Fact]
    public async Task Product_access_read_is_scoped_to_authenticated_client_and_company()
    {
        repository.Setup(x => x.GetProductAccessAsync(42, 101)).ReturnsAsync([]);

        var result = await Service().GetProductAccessAsync(101);

        result.Should().BeEmpty();
        repository.VerifyAll();
    }

    [Fact]
    public async Task Product_access_save_is_scoped_and_forwards_complete_selection()
    {
        var request = new SaveProductAccessRequest(9, [91, 92], [new JurisdictionDto("CA", "California")]);
        repository.Setup(x => x.SaveProductAccessAsync(42, 101, request)).Returns(Task.CompletedTask);

        await Service().SaveProductAccessAsync(101, request);

        repository.VerifyAll();
    }

    [Fact]
    public async Task Product_access_delete_is_scoped_to_authenticated_client()
    {
        repository.Setup(x => x.DeleteProductAccessAsync(42, 101, 9)).Returns(Task.CompletedTask);

        await Service().DeleteProductAccessAsync(101, 9);

        repository.VerifyAll();
    }

    [Fact]
    public async Task Company_update_forwards_authenticated_user_for_audit_fields()
    {
        var request = new SaveCompanyRequest(101, "Acme", "United States", "California", null,
            null, null, null, null, null, null, null, "Active", null, null, null,
            null, null, null, []);
        repository.Setup(x => x.SaveCompanyAsync(42, request, 7)).ReturnsAsync(101);

        var id = await Service().SaveCompanyAsync(request);

        id.Should().Be(101);
        repository.VerifyAll();
    }

    [Fact]
    public async Task Repository_not_found_result_is_not_hidden_by_service()
    {
        repository.Setup(x => x.GetProductAccessAsync(42, 999))
            .ThrowsAsync(new KeyNotFoundException("Company not found."));

        var action = () => Service().GetProductAccessAsync(999);

        await action.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("Company not found.");
    }

    private ClientService Service() => new(repository.Object, tenant.Object);
}
