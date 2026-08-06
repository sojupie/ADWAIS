using Adwais.Api.DTOs.Tenants;
using Adwais.Application.Interfaces;
using Adwais.Api.Validators.Tenants;
using Moq;
using Xunit;

namespace Adwais.Tests.Controllers;

public class TenantProviderValidationTests
{
    [Theory]
    [InlineData("")]
    [InlineData("unsupported")]
    public void CreateTenant_WithMissingOrUnknownProvider_IsInvalid(string provider)
    {
        var source = new Mock<IOrderSource>();
        source.SetupGet(x => x.Provider).Returns("litium");
        var validator = new CreateTenantRequestDtoValidator(new[] { source.Object });

        var result = validator.Validate(new CreateTenantRequestDto
        {
            Name = "Tenant",
            OrderProvider = provider
        });

        Assert.False(result.IsValid);
    }
}
