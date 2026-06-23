using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Domain.Entities.Intranet;
using Adwais.Infrastructure.Persistence;
using Adwais.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Adwais.Tests.Services;

public class FeedServiceTests
{
    [Fact]
    public async Task GetFeedsAsync_ReturnsPaginatedAndFilteredFeeds()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AnalyticsDbContext>().UseInMemoryDatabase(dbName).Options;
        var dbContext = new AnalyticsDbContext(options);

        var source1 = new FeedSource { Id = Guid.NewGuid(), Name = "Source 1", Url = "https://source1" };
        var source2 = new FeedSource { Id = Guid.NewGuid(), Name = "Source 2", Url = "https://source2" };

        var item1 = new FeedItem { Id = Guid.NewGuid(), FeedSourceId = source1.Id, Title = "Title 1", Link = "https://link1", PublishDate = DateTime.UtcNow.AddHours(-1) };
        var item2 = new FeedItem { Id = Guid.NewGuid(), FeedSourceId = source2.Id, Title = "Title 2", Link = "https://link2", PublishDate = DateTime.UtcNow.AddHours(-2) };
        var item3 = new FeedItem { Id = Guid.NewGuid(), FeedSourceId = source1.Id, Title = "Title 3", Link = "https://link3", PublishDate = DateTime.UtcNow };

        dbContext.FeedSources.AddRange(source1, source2);
        dbContext.FeedItems.AddRange(item1, item2, item3);
        await dbContext.SaveChangesAsync();

        var factoryMock = new Mock<IDbContextFactory<AnalyticsDbContext>>();
        factoryMock.Setup(f => f.CreateDbContextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(() => new AnalyticsDbContext(options));

        var service = new FeedService(factoryMock.Object);

        // Act & Assert 1: No filters, sorting descending by date
        var allItems = (await service.GetFeedsAsync(null, 1, 10, CancellationToken.None)).ToList();
        Assert.Equal(3, allItems.Count);
        Assert.Equal("Title 3", allItems[0].Title); // newest first
        Assert.Equal("Title 1", allItems[1].Title);
        Assert.Equal("Title 2", allItems[2].Title);

        // Act & Assert 2: Filter by source
        var source1Items = (await service.GetFeedsAsync(source1.Id, 1, 10, CancellationToken.None)).ToList();
        Assert.Equal(2, source1Items.Count);
        Assert.All(source1Items, i => Assert.Equal(source1.Id, i.FeedSourceId));

        // Act & Assert 3: Pagination
        var paginatedItems = (await service.GetFeedsAsync(null, 2, 2, CancellationToken.None)).ToList();
        Assert.Single(paginatedItems);
        Assert.Equal("Title 2", paginatedItems[0].Title);
    }
}
