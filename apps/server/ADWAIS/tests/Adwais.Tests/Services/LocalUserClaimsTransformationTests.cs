using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using Adwais.Domain.Entities;
using Adwais.Domain.Enums;
using Adwais.Infrastructure.Persistence;
using Adwais.Infrastructure.Security;

namespace Adwais.Tests.Services;

public class LocalUserClaimsTransformationTests
{
    private readonly DbContextOptions<AnalyticsDbContext> _dbOptions;
    private readonly Mock<IDbContextFactory<AnalyticsDbContext>> _dbContextFactoryMock;
    private readonly LocalUserClaimsTransformation _transformation;

    public LocalUserClaimsTransformationTests()
    {
        _dbOptions = new DbContextOptionsBuilder<AnalyticsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _dbContextFactoryMock = new Mock<IDbContextFactory<AnalyticsDbContext>>();
        _dbContextFactoryMock.Setup(f => f.CreateDbContextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new AnalyticsDbContext(_dbOptions));

        _transformation = new LocalUserClaimsTransformation(_dbContextFactoryMock.Object);
    }

    [Fact]
    public async Task TransformAsync_ShouldAddRoleClaim_WhenUserExistsInDatabase()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var entraOid = Guid.NewGuid();
        var name = "Alice Smith";
        var email = "alice@example.com";

        await using (var db = new AnalyticsDbContext(_dbOptions))
        {
            db.Users.Add(new User
            {
                Id = userId,
                EntraObjectId = entraOid,
                Name = name,
                Email = email,
                Role = UserRole.Admin
            });
            await db.SaveChangesAsync();
        }

        var principal = CreatePrincipal(entraOid.ToString(), email, name);

        // Act
        var result = await _transformation.TransformAsync(principal);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsInRole("Admin"));
        Assert.True(result.HasClaim(c => c.Type == ClaimTypes.Role && c.Value == "Admin"));
    }

    [Fact]
    public async Task TransformAsync_ShouldAutoProvisionAndAddEmployeeRole_WhenUserDoesNotExist()
    {
        // Arrange
        var entraOid = Guid.NewGuid();
        var name = "Bob Jones";
        var email = "bob@example.com";
        var principal = CreatePrincipal(entraOid.ToString(), email, name);

        // Act
        var result = await _transformation.TransformAsync(principal);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsInRole("Employee"));
        Assert.True(result.HasClaim(c => c.Type == ClaimTypes.Role && c.Value == "Employee"));

        // Verify user is auto-provisioned in database
        await using var db = new AnalyticsDbContext(_dbOptions);
        var user = await db.Users.SingleOrDefaultAsync(u => u.EntraObjectId == entraOid);
        Assert.NotNull(user);
        Assert.Equal(name, user.Name);
        Assert.Equal(email, user.Email);
        Assert.Equal(UserRole.Employee, user.Role);
    }

    [Fact]
    public async Task TransformAsync_ShouldNotModifyPrincipal_WhenOidClaimIsMissing()
    {
        // Arrange
        var identity = new ClaimsIdentity("TestAuthentication");
        identity.AddClaim(new Claim(ClaimTypes.Name, "Anonymous Kiosk"));
        var principal = new ClaimsPrincipal(identity);

        // Act
        var result = await _transformation.TransformAsync(principal);

        // Assert
        Assert.Same(principal, result);
        Assert.False(result.HasClaim(c => c.Type == ClaimTypes.Role));
    }

    private static ClaimsPrincipal CreatePrincipal(string oid, string email, string name)
    {
        var identity = new ClaimsIdentity("FederatedAuthentication");
        identity.AddClaim(new Claim("http://schemas.microsoft.com/identity/claims/objectidentifier", oid));
        identity.AddClaim(new Claim("preferred_username", email));
        identity.AddClaim(new Claim("name", name));
        
        return new ClaimsPrincipal(identity);
    }
}
