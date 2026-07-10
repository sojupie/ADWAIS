using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using Adwais.Api.Controllers;
using Adwais.Api.DTOs.Monitoring;
using Adwais.Application.DTOs.Monitoring;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities;
using Adwais.Domain.Entities.Monitoring;
using Adwais.Domain.Enums;
using Adwais.Infrastructure.Persistence;
using Adwais.Application.Common.Models;

namespace Adwais.Tests.Controllers;

public class MonitorControllerTests
{
    private readonly DbContextOptions<AnalyticsDbContext> _dbOptions;
    private readonly AnalyticsDbContext _dbContext;
    private readonly Mock<IMonitorOrchestrationService> _monitorServiceMock;
    private readonly MonitorController _controller;

    public MonitorControllerTests()
    {
        _dbOptions = new DbContextOptionsBuilder<AnalyticsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _dbContext = new AnalyticsDbContext(_dbOptions);
        _monitorServiceMock = new Mock<IMonitorOrchestrationService>();

        _controller = new MonitorController(_dbContext, _monitorServiceMock.Object);

        // Seed global config for IsUptimeRobotConfiguredAsync
        using var db = new AnalyticsDbContext(_dbOptions);
        db.GlobalConfigs.Add(new GlobalConfig
        {
            Id = 1,
            UptimeRobotApiKey = "valid-api-key",
            LitiumFetchIntervalMinutes = 30
        });
        db.SaveChanges();
    }

    [Fact]
    public async Task GetAnalytics_ShouldReturnOkWithData()
    {
        // Arrange
        var request = new MonitorRequestDto
        {
            TenantId = Guid.NewGuid(),
            Timeframe = Timeframe.T30,
            Comparison = ComparisonType.Preceding
        };
        var mockResult = new MonitorAnalyticsDto(
            GlobalAverageLatency: 120.5,
            LatencyPoints: new List<LatencyPointDto>
            {
                new(DateTimeOffset.UtcNow, 120.5, 115.0, 100.0, 150.0)
            },
            Monitors: new List<UptimeMonitor>(),
            Kpis: new MonitorKpiDto(99.9, 99.8, 0.1, 120.5, 115.0, 4.7, 150.0, 145.0, 3.4, 100.0, 95.0, 5.2)
        );

        _monitorServiceMock.Setup(s => s.GetAnalyticsAsync(It.IsAny<ResolvedPeriod>(), request.TenantId, request.MonitorId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockResult);

        // Act
        var result = await _controller.GetAnalytics(request, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<MonitorAnalyticsResponseDto>(okResult.Value);
        Assert.Equal(120.5, response.GlobalAverageLatency);
        Assert.Single(response.LatencyPoints);
    }

    [Fact]
    public async Task CreateMonitor_ShouldReturnCreated()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var request = new CreateMonitorRequestDto("New Monitor", "https://test.com", 99.5);
        var createdMonitor = new UptimeMonitor
        {
            Id = 123,
            TenantId = tenantId,
            Name = "New Monitor",
            Url = "https://test.com",
            UptimeSla = 99.5
        };

        _monitorServiceMock.Setup(s => s.CreateMonitorAsync(tenantId, request.Name, request.Url, request.UptimeSla, It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdMonitor);

        // Act
        var result = await _controller.CreateMonitor(tenantId, request, CancellationToken.None);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var response = Assert.IsType<UptimeMonitorDto>(createdResult.Value);
        Assert.Equal(123, response.Id);
        Assert.Equal("New Monitor", response.Name);
    }

    [Fact]
    public async Task AssignMonitor_ShouldReturnOk()
    {
        // Arrange
        var tenantId = Guid.NewGuid();

        // Act
        var result = await _controller.AssignMonitor(123, tenantId, CancellationToken.None);

        // Assert
        Assert.IsType<OkResult>(result);
        _monitorServiceMock.Verify(s => s.AssignMonitorAsync(123, tenantId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task PauseMonitor_ShouldReturnOk()
    {
        // Act
        var result = await _controller.PauseMonitor(123, CancellationToken.None);

        // Assert
        Assert.IsType<OkResult>(result);
        _monitorServiceMock.Verify(s => s.PauseMonitorAsync(123, It.IsAny<CancellationToken>()), Times.Once);
    }
}
