using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Api.Controllers;
using Adwais.Application.DTOs.System;
using Adwais.Application.Interfaces;
using Adwais.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Adwais.Tests.Controllers;

public class IntranetControllerTests
{
    private readonly Mock<ISystemHealthService> _healthServiceMock;
    private readonly SystemHealthController _controller;

    public IntranetControllerTests()
    {
        _healthServiceMock = new Mock<ISystemHealthService>();
        _controller = new SystemHealthController(_healthServiceMock.Object);
    }

    [Fact]
    public async Task GetHealth_ShouldReturnOkWithSystemHealthDto()
    {
        // Arrange
        var healthDto = new SystemHealthDto(
            DatabaseStatus: "Healthy",
            Hangfire: new HangfireHealthDto("Healthy", 0, 0, 0, 0),
            Sync: new SyncHealthDto("Healthy", 0, 0, 0, null),
            LastLitiumSync: null,
            LastBlogSync: null,
            LastFleetUpdate: null,
            LastFleetUptimeUpdate: null,
            LastFleetLatencyUpdate: null
        );

        _healthServiceMock.Setup(s => s.GetHealthAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(healthDto);

        // Act
        var result = await _controller.GetHealth();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedHealth = Assert.IsType<SystemHealthDto>(okResult.Value);
        Assert.Equal("Healthy", returnedHealth.DatabaseStatus);
        _healthServiceMock.Verify(s => s.GetHealthAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ClearErrors_ShouldReturnNoContent()
    {
        // Arrange & Act
        var result = await _controller.ClearErrors();

        // Assert
        Assert.IsType<NoContentResult>(result);
        _healthServiceMock.Verify(s => s.ClearErrorsAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Webhooks_ReceiveNewsletter_ShouldReturnOk_AndSaveToDb_WhenApiKeyIsValid()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AnalyticsDbContext>().UseInMemoryDatabase(dbName).Options;
        var dbContext = new AnalyticsDbContext(options);

        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Webhooks:NewsletterApiKey"]).Returns("valid-secret-key");

        var controller = new WebhooksController(
            new Mock<ILitiumIngestionService>().Object,
            configMock.Object,
            new Mock<ILogger<WebhooksController>>().Object,
            dbContext);

        var payload = new CreateNewsletterDto { Title = "Weekly News", Body = "Content", Category = "General" };

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Api-Key"] = "valid-secret-key";
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        // Act
        var result = await controller.ReceiveNewsletter(payload, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var newsletter = await dbContext.Newsletters.SingleOrDefaultAsync();
        Assert.NotNull(newsletter);
        Assert.Equal("Weekly News", newsletter.Title);
    }

    [Fact]
    public async Task Webhooks_ReceiveNewsletter_ShouldReturnUnauthorized_WhenApiKeyIsInvalid()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AnalyticsDbContext>().UseInMemoryDatabase(dbName).Options;
        var dbContext = new AnalyticsDbContext(options);

        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Webhooks:NewsletterApiKey"]).Returns("valid-secret-key");

        var controller = new WebhooksController(
            new Mock<ILitiumIngestionService>().Object,
            configMock.Object,
            new Mock<ILogger<WebhooksController>>().Object,
            dbContext);

        var payload = new CreateNewsletterDto { Title = "Weekly News", Body = "Content", Category = "General" };
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Api-Key"] = "wrong-key";
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        // Act
        var result = await controller.ReceiveNewsletter(payload, CancellationToken.None);

        // Assert
        Assert.IsType<UnauthorizedResult>(result);
    }
}
