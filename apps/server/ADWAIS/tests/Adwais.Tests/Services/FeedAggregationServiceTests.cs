using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities.Intranet;
using Adwais.Infrastructure.Persistence;
using Adwais.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Adwais.Tests.Services;

public class FeedAggregationServiceTests
{
    [Fact]
    public async Task AggregateSourceAsync_ResolvesCorrectParser_AndPersistsItems()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AnalyticsDbContext>().UseInMemoryDatabase(dbName).Options;
        var dbContext = new AnalyticsDbContext(options);
        
        var source = new FeedSource { Id = Guid.NewGuid(), Name = "Litium", Url = "https://www.litium.com/blog", IsActive = true };
        dbContext.FeedSources.Add(source);
        await dbContext.SaveChangesAsync();

        var factoryMock = new Mock<IDbContextFactory<AnalyticsDbContext>>();
        factoryMock.Setup(f => f.CreateDbContextAsync(It.IsAny<CancellationToken>()))
            .Returns(() => Task.FromResult(new AnalyticsDbContext(options)));

        // Mock Parser Strategy
        var parserMock = new Mock<IFeedParser>();
        parserMock.Setup(p => p.CanParse("https://www.litium.com/blog")).Returns(true);
        parserMock.Setup(p => p.ParseAsync(It.IsAny<FeedSource>(), It.IsAny<HttpClient>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<FeedItem>
            {
                new FeedItem { Id = Guid.NewGuid(), FeedSourceId = source.Id, Title = "Strategy Decoupled Item", Link = "https://link" }
            });

        var service = new FeedAggregationService(
            factoryMock.Object,
            new[] { parserMock.Object },
            new HttpClient(),
            new Mock<ILogger<FeedAggregationService>>().Object,
            new Mock<ISystemEventService>().Object);

        // Act
        await service.AggregateSourceAsync(source.Id);

        // Assert
        var items = await dbContext.FeedItems.ToListAsync();
        var item = Assert.Single(items);
        Assert.Equal("Strategy Decoupled Item", item.Title);

        await using var verifyContext = new AnalyticsDbContext(options);
        var updatedSource = await verifyContext.FeedSources.FindAsync(source.Id);
        Assert.NotNull(updatedSource);
        Assert.NotNull(updatedSource.LastPolledAt);
        Assert.NotNull(updatedSource.LastSuccessAt);
        Assert.Null(updatedSource.LastSyncError);
    }

    [Fact]
    public async Task AggregateSourceAsync_LogsErrorsToSystemEvents_AndWritesToFeedSource_OnParserFailure()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AnalyticsDbContext>().UseInMemoryDatabase(dbName).Options;
        var dbContext = new AnalyticsDbContext(options);
        
        var source = new FeedSource { Id = Guid.NewGuid(), Name = "Error Source", Url = "https://error.com", IsActive = true };
        dbContext.FeedSources.Add(source);
        await dbContext.SaveChangesAsync();

        var factoryMock = new Mock<IDbContextFactory<AnalyticsDbContext>>();
        factoryMock.Setup(f => f.CreateDbContextAsync(It.IsAny<CancellationToken>()))
            .Returns(() => Task.FromResult(new AnalyticsDbContext(options)));

        var parserMock = new Mock<IFeedParser>();
        parserMock.Setup(p => p.CanParse(It.IsAny<string>())).Returns(true);
        parserMock.Setup(p => p.ParseAsync(It.IsAny<FeedSource>(), It.IsAny<HttpClient>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Scraper Blocked"));

        var eventServiceMock = new Mock<ISystemEventService>();

        var service = new FeedAggregationService(
            factoryMock.Object,
            new[] { parserMock.Object },
            new HttpClient(),
            new Mock<ILogger<FeedAggregationService>>().Object,
            eventServiceMock.Object);

        // Act
        await service.AggregateSourceAsync(source.Id);

        // Assert
        eventServiceMock.Verify(es => es.LogErrorAsync(
            nameof(FeedAggregationService), 
            It.Is<string>(msg => msg.Contains("Scraper Blocked")), 
            It.IsAny<Exception>()), Times.Once);

        await using var verifyContext = new AnalyticsDbContext(options);
        var updatedSource = await verifyContext.FeedSources.FindAsync(source.Id);
        Assert.NotNull(updatedSource);
        Assert.Equal("Scraper Blocked", updatedSource.LastSyncError);
    }
}
