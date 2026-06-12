using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;
using Moq;
using Microsoft.EntityFrameworkCore;
using Adwais.Infrastructure.Services;
using Adwais.Application.Interfaces;
using Adwais.Application.DTOs.Financial.Upstream;
using Adwais.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;

namespace Adwais.Tests.Services;

public class LitiumIngestionServiceTests
{
    [Fact]
    public async Task IngestSingleOrderAsync_ExecutesWithoutThrowing()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AnalyticsDbContext>()
            .UseInMemoryDatabase("TestDb")
            .Options;

        var dbContextFactoryMock = new Mock<IDbContextFactory<AnalyticsDbContext>>();
        dbContextFactoryMock.Setup(f => f.CreateDbContextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new AnalyticsDbContext(options));

        var httpClient = new System.Net.Http.HttpClient();
        var loggerMock = new Mock<ILogger<LitiumIngestionService>>();
        var eventServiceMock = new Mock<ISystemEventService>();

        ILitiumIngestionService service = new LitiumIngestionService(
            dbContextFactoryMock.Object, 
            httpClient, 
            loggerMock.Object, 
            eventServiceMock.Object);

        var orderDto = new LitiumOrderDto 
        { 
            Id = Guid.NewGuid(),
            OrderNumber = "123",
            CreatedDate = DateTimeOffset.UtcNow,
            OrderStatus = "Confirmed"
        };

        // Act
        var exception = await Record.ExceptionAsync(() => service.IngestSingleOrderAsync(Guid.NewGuid(), orderDto));

        // Assert
        Assert.Null(exception);
    }
}
