using System.Threading;
using System.Threading.Tasks;
using Adwais.Api.Controllers;
using Adwais.Application.DTOs.System;
using Adwais.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
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
}
