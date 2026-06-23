using System;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.Intranet;
using Adwais.Infrastructure.Persistence;
using Adwais.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Adwais.Tests.Services;

public class NewsletterWebhookServiceTests
{
    [Fact]
    public async Task IngestNewsletterAsync_SavesNewsletterToDatabase_AndReturnsId()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AnalyticsDbContext>().UseInMemoryDatabase(dbName).Options;
        var dbContext = new AnalyticsDbContext(options);

        var factoryMock = new Mock<IDbContextFactory<AnalyticsDbContext>>();
        factoryMock.Setup(f => f.CreateDbContextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(() => new AnalyticsDbContext(options));

        var service = new NewsletterWebhookService(factoryMock.Object);

        var dto = new CreateNewsletterDto { Title = "Weekly News", Body = "Body content", Category = "General" };

        // Act
        var resultId = await service.IngestNewsletterAsync(dto, CancellationToken.None);

        // Assert
        Assert.NotEqual(Guid.Empty, resultId);

        var saved = await dbContext.Newsletters.SingleOrDefaultAsync(n => n.Id == resultId);
        Assert.NotNull(saved);
        Assert.Equal("Weekly News", saved.Title);
        Assert.Equal("Body content", saved.Body);
        Assert.Equal("General", saved.Category);
    }
}
