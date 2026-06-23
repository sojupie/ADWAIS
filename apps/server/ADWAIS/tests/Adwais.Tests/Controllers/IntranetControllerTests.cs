using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using Adwais.Api.Controllers;
using Adwais.Api.DTOs.System;
using Adwais.Domain.Entities.Intranet;
using Adwais.Infrastructure.Persistence;

namespace Adwais.Tests.Controllers;

public class IntranetControllerTests
{
    private readonly DbContextOptions<AnalyticsDbContext> _options;

    public IntranetControllerTests()
    {
        _options = new DbContextOptionsBuilder<AnalyticsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
    }

    [Fact]
    public async Task GetHealth_ShouldReturnLastBlogSyncAndFeedsWithErrorsCount()
    {
        // Arrange
        using var db = new AnalyticsDbContext(_options);
        var source1 = new FeedSource { Id = Guid.NewGuid(), Name = "Parser 1", Url = "https://url1", IsActive = true, LastSuccessAt = DateTime.UtcNow.AddMinutes(-10) };
        var source2 = new FeedSource { Id = Guid.NewGuid(), Name = "Parser 2", Url = "https://url2", IsActive = true, LastSuccessAt = DateTime.UtcNow.AddMinutes(-5), LastSyncError = "Parser Error" };
        db.FeedSources.AddRange(source1, source2);
        await db.SaveChangesAsync();

        var factoryMock = new Mock<IDbContextFactory<AnalyticsDbContext>>();
        factoryMock.Setup(f => f.CreateDbContextAsync(default)).ReturnsAsync(() => new AnalyticsDbContext(_options));

        var controller = new SystemHealthController(factoryMock.Object);

        // Act
        var result = await controller.GetHealth();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var health = Assert.IsType<SystemHealthDto>(okResult.Value);

        Assert.Equal("Degraded", health.Sync.Status);
        Assert.Equal(1, health.Sync.FeedsWithErrorsCount);
        Assert.NotNull(health.LastBlogSync);
    }

    [Fact]
    public async Task ClearErrors_ShouldClearFeedErrors()
    {
        // Arrange
        using var db = new AnalyticsDbContext(_options);
        var source = new FeedSource { Id = Guid.NewGuid(), Name = "Parser 1", Url = "https://url1", IsActive = true, LastSyncError = "Some error" };
        db.FeedSources.Add(source);
        await db.SaveChangesAsync();

        var factoryMock = new Mock<IDbContextFactory<AnalyticsDbContext>>();
        factoryMock.Setup(f => f.CreateDbContextAsync(default)).ReturnsAsync(() => new AnalyticsDbContext(_options));

        var controller = new SystemHealthController(factoryMock.Object);

        // Act
        var result = await controller.ClearErrors();

        // Assert
        Assert.IsType<NoContentResult>(result);

        using var verifyDb = new AnalyticsDbContext(_options);
        var updatedSource = await verifyDb.FeedSources.FindAsync(source.Id);
        Assert.NotNull(updatedSource);
        Assert.Null(updatedSource.LastSyncError);
    }
}
