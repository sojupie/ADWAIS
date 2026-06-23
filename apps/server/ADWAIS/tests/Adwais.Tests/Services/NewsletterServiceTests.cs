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

public class NewsletterServiceTests
{
    [Fact]
    public async Task GetNewslettersAsync_ReturnsFilteredAndSortedNewsletters()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AnalyticsDbContext>().UseInMemoryDatabase(dbName).Options;
        var dbContext = new AnalyticsDbContext(options);

        var news1 = new Newsletter { Id = Guid.NewGuid(), Title = "News 1", Body = "Body 1", Category = "General", CreatedAt = DateTime.UtcNow.AddMinutes(-5) };
        var news2 = new Newsletter { Id = Guid.NewGuid(), Title = "News 2", Body = "Body 2", Category = "Tech", CreatedAt = DateTime.UtcNow.AddMinutes(-10) };
        var news3 = new Newsletter { Id = Guid.NewGuid(), Title = "News 3", Body = "Body 3", Category = "General", CreatedAt = DateTime.UtcNow };

        dbContext.Newsletters.AddRange(news1, news2, news3);
        await dbContext.SaveChangesAsync();

        var factoryMock = new Mock<IDbContextFactory<AnalyticsDbContext>>();
        factoryMock.Setup(f => f.CreateDbContextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(() => new AnalyticsDbContext(options));

        var service = new NewsletterService(factoryMock.Object);

        // Act & Assert 1: Get all newsletters, sorted descending by creation date
        var all = (await service.GetNewslettersAsync(null, CancellationToken.None)).ToList();
        Assert.Equal(3, all.Count);
        Assert.Equal("News 3", all[0].Title); // newest first
        Assert.Equal("News 1", all[1].Title);
        Assert.Equal("News 2", all[2].Title);

        // Act & Assert 2: Filter by category
        var tech = (await service.GetNewslettersAsync("Tech", CancellationToken.None)).ToList();
        var item = Assert.Single(tech);
        Assert.Equal("News 2", item.Title);
    }
}
