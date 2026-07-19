using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;
using Adwais.Application.Common.Interfaces;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities;
using Adwais.Domain.Entities.Monitoring;
using Adwais.Domain.Enums;
using Adwais.Infrastructure.Persistence;
using Adwais.Application.Services;
using Adwais.Application.Common.Models;

namespace Adwais.Tests.Services;

public class MonitorOrchestrationServiceTests
{
    private readonly DbContextOptions<AnalyticsDbContext> _dbOptions;
    private readonly AnalyticsDbContext _dbContext;
    private readonly Mock<IUptimeRobotService> _uptimeRobotServiceMock;
    private readonly Mock<ICacheService> _cacheServiceMock;
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly MonitorOrchestrationService _service;

    public MonitorOrchestrationServiceTests()
    {
        _dbOptions = new DbContextOptionsBuilder<AnalyticsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _dbContext = new AnalyticsDbContext(_dbOptions);

        _uptimeRobotServiceMock = new Mock<IUptimeRobotService>();
        _cacheServiceMock = new Mock<ICacheService>();
        _configurationMock = new Mock<IConfiguration>();

        _service = new MonitorOrchestrationService(
            _dbContext,
            _uptimeRobotServiceMock.Object,
            _cacheServiceMock.Object,
            _configurationMock.Object
        );
    }

    [Fact]
    public async Task GetAnalyticsAsync_Hourly_ShouldCalculateInMemoryPercentiles()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var tenant = new Tenant { Id = tenantId, Name = "Test Tenant", Type = TenantType.B2C, LitiumBaseUrl = "test.com" };
        var monitor = new UptimeMonitor { Id = 1, TenantId = tenantId, Name = "Test Monitor", Url = "https://test.com", UptimeMonitorEnabled = true };
        
        _dbContext.Tenants.Add(tenant);
        _dbContext.Monitors.Add(monitor);

        // Add 10 response time data points for the same hour to calculate exact P10/P90 percentiles
        var baseDate = DateTimeOffset.UtcNow.Date.AddHours(12);
        var values = new double[] { 10, 20, 30, 40, 50, 60, 70, 80, 90, 100 }; // Sorted values
        foreach (var val in values)
        {
            _dbContext.ResponseTimes.Add(new ResponseTime
            {
                Id = Guid.NewGuid(),
                MonitorId = 1,
                Date = baseDate.AddMinutes(5),
                Average = val,
                Lowest = val - 2,
                Highest = val + 2
            });
        }
        await _dbContext.SaveChangesAsync();

        var period = new ResolvedPeriod(
            currentStart: baseDate,
            currentEnd: baseDate.AddHours(1),
            previousStart: baseDate.AddHours(-1),
            previousEnd: baseDate,
            stepsInPeriod: 1,
            isHourly: true,
            includeActualTime: false
        );

        // Act
        var result = await _service.GetAnalyticsAsync(period, tenantId, null, null, null, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.LatencyPoints);
        var point = result.LatencyPoints.First();

        // 10 values: indices 0 to 9.
        // P10 index = Math.Round(0.10 * 9) = 1. Value at index 1 is 20.
        // P90 index = Math.Round(0.90 * 9) = 8. Value at index 8 is 90.
        Assert.Equal(20, point.Lowest);
        Assert.Equal(90, point.Highest);
        Assert.Equal(55, point.Average); // Average of 10..100 is 55
    }

    [Fact]
    public async Task GetAnalyticsAsync_DailyHistorical_ShouldAggregateMaterializedPercentiles()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var tenant = new Tenant { Id = tenantId, Name = "Test Tenant", Type = TenantType.B2C, LitiumBaseUrl = "test.com" };
        var monitor = new UptimeMonitor { Id = 1, TenantId = tenantId, Name = "Test Monitor", Url = "https://test.com", UptimeMonitorEnabled = true };
        
        _dbContext.Tenants.Add(tenant);
        _dbContext.Monitors.Add(monitor);

        var date = DateTimeOffset.UtcNow.Date.AddDays(-5);
        _dbContext.DailyLatencyMonitorRollups.Add(new DailyLatencyMonitorRollup
        {
            MonitorId = 1,
            Date = date,
            Average = 150,
            P10 = 120,
            P90 = 250
        });
        await _dbContext.SaveChangesAsync();

        var period = new ResolvedPeriod(
            currentStart: date.AddDays(-1),
            currentEnd: date.AddDays(2),
            previousStart: date.AddDays(-4),
            previousEnd: date.AddDays(-1),
            stepsInPeriod: 3,
            isHourly: false,
            includeActualTime: false
        );

        // Act
        var result = await _service.GetAnalyticsAsync(period, tenantId, null, null, null, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        var matchingPoint = result.LatencyPoints.FirstOrDefault(p => p.Timestamp.Date == date.Date);
        Assert.NotNull(matchingPoint);
        Assert.Equal(120, matchingPoint.Lowest);  // Maps to P10
        Assert.Equal(250, matchingPoint.Highest); // Maps to P90
        Assert.Equal(150, matchingPoint.Average);
    }

    [Fact]
    public async Task CreateMonitorAsync_ShouldInvokeUptimeRobot_AndAddToDatabase()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var remoteMonitor = new Adwais.Application.DTOs.Monitoring.Upstream.UptimeRobotMonitorDto(
            Id: 9876,
            FriendlyName: "New Monitor",
            Url: "https://new.com",
            Status: "up",
            CreatedDate: DateTimeOffset.UtcNow,
            UpdateInterval: 300,
            Tags: new List<string>()
        );

        _uptimeRobotServiceMock.Setup(s => s.CreateMonitorAsync("New Monitor", "https://new.com"))
            .ReturnsAsync(remoteMonitor);

        // Act
        var result = await _service.CreateMonitorAsync(tenantId, "New Monitor", "https://new.com", 99.5, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(9876, result.Id);
        Assert.Equal(tenantId, result.TenantId);
        Assert.Equal(99.5, result.UptimeSla);

        var dbMonitor = await _dbContext.Monitors.FindAsync(9876);
        Assert.NotNull(dbMonitor);
        Assert.Equal("New Monitor", dbMonitor.Name);
    }

    [Fact]
    public async Task AssignMonitorAsync_ShouldUpdateTenantId_WhenValid()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var tenant = new Tenant { Id = tenantId, Name = "Test Tenant", Type = TenantType.B2C, LitiumBaseUrl = "test.com" };
        var monitor = new UptimeMonitor { Id = 50, TenantId = Guid.NewGuid(), Name = "Monitor", Url = "https://url.com" };
        
        _dbContext.Tenants.Add(tenant);
        _dbContext.Monitors.Add(monitor);
        await _dbContext.SaveChangesAsync();

        // Act
        await _service.AssignMonitorAsync(50, tenantId, CancellationToken.None);

        // Assert
        var updated = await _dbContext.Monitors.FindAsync(50);
        Assert.NotNull(updated);
        Assert.Equal(tenantId, updated.TenantId);
    }

    [Fact]
    public async Task ReassignAllTenantMonitorsToSystemAsync_ShouldReassignMatchingMonitors()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var monitor1 = new UptimeMonitor { Id = 60, TenantId = tenantId, Name = "M1", Url = "https://url.com" };
        var monitor2 = new UptimeMonitor { Id = 61, TenantId = tenantId, Name = "M2", Url = "https://url.com" };
        
        _dbContext.Monitors.AddRange(monitor1, monitor2);
        await _dbContext.SaveChangesAsync();

        // Act
        await _service.ReassignAllTenantMonitorsToSystemAsync(tenantId, CancellationToken.None);

        // Assert
        var updated1 = await _dbContext.Monitors.FindAsync(60);
        var updated2 = await _dbContext.Monitors.FindAsync(61);
        Assert.NotNull(updated1);
        Assert.NotNull(updated2);
        Assert.Equal(IApplicationDbContext.SystemTenantGuid, updated1.TenantId);
        Assert.Equal(IApplicationDbContext.SystemTenantGuid, updated2.TenantId);
    }

    [Fact]
    public async Task PauseMonitorAsync_ShouldCallPause_AndSetDisabledInDb()
    {
        // Arrange
        var monitor = new UptimeMonitor { Id = 70, TenantId = Guid.NewGuid(), Name = "M", Url = "https://url.com", UptimeMonitorEnabled = true };
        _dbContext.Monitors.Add(monitor);
        await _dbContext.SaveChangesAsync();

        _uptimeRobotServiceMock.Setup(s => s.PauseMonitorAsync(70))
            .Returns(Task.CompletedTask);

        // Act
        await _service.PauseMonitorAsync(70, CancellationToken.None);

        // Assert
        var updated = await _dbContext.Monitors.FindAsync(70);
        Assert.NotNull(updated);
        Assert.False(updated.UptimeMonitorEnabled);
        _uptimeRobotServiceMock.Verify(s => s.PauseMonitorAsync(70), Times.Once);
    }

    [Fact]
    public async Task UpdateMonitorAsync_ShouldPatchUptimeRobot_AndModifyDbFields()
    {
        // Arrange
        var monitor = new UptimeMonitor 
        { 
            Id = 80, 
            TenantId = Guid.NewGuid(), 
            Name = "Old Name", 
            Url = "https://old.com", 
            UptimeSla = 99.0, 
            Tags = new List<string> { "tag1" } 
        };
        _dbContext.Monitors.Add(monitor);
        await _dbContext.SaveChangesAsync();

        _uptimeRobotServiceMock.Setup(s => s.UpdateMonitorAsync(80, "New Name", "https://new.com", It.IsAny<List<string>>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.UpdateMonitorAsync(80, "New Name", "https://new.com", 99.9, new List<string> { "tag2" }, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("New Name", result.Name);
        Assert.Equal("https://new.com", result.Url);
        Assert.Equal(99.9, result.UptimeSla);
        Assert.Contains("tag2", result.Tags);
        _uptimeRobotServiceMock.Verify(s => s.UpdateMonitorAsync(80, "New Name", "https://new.com", It.IsAny<List<string>>()), Times.Once);
    }
}
