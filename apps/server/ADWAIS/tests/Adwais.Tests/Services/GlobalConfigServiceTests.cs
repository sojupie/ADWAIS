using System;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.GlobalConfig;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities;
using Adwais.Infrastructure.Persistence;
using Adwais.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Hangfire;
using Hangfire.Storage;
using Moq;
using Xunit;

namespace Adwais.Tests.Services;

public class GlobalConfigServiceTests
{
    private readonly DbContextOptions<AnalyticsDbContext> _options;
    private readonly Mock<ISystemEventService> _eventServiceMock;
    private readonly Mock<IReportingRollupRefresher> _reportingRollupRefresherMock;

    public GlobalConfigServiceTests()
    {
        var dbName = Guid.NewGuid().ToString();
        _options = new DbContextOptionsBuilder<AnalyticsDbContext>().UseInMemoryDatabase(dbName).Options;
        _eventServiceMock = new Mock<ISystemEventService>();
        _reportingRollupRefresherMock = new Mock<IReportingRollupRefresher>();

        // Setup mock Hangfire JobStorage to avoid "JobStorage.Current has not been initialized" exception
        var jobStorageMock = new Mock<JobStorage>();
        var connectionMock = new Mock<IStorageConnection>();
        var transactionMock = new Mock<IWriteOnlyTransaction>();
        connectionMock.Setup(x => x.CreateWriteTransaction()).Returns(transactionMock.Object);
        jobStorageMock.Setup(x => x.GetConnection()).Returns(connectionMock.Object);
        JobStorage.Current = jobStorageMock.Object;
    }

    [Fact]
    public async Task GetConfigAsync_ShouldReturnConfigDto()
    {
        // Arrange
        var dbContext = new AnalyticsDbContext(_options);
        var config = new GlobalConfig
        {
            Id = 1,
            LitiumFetchIntervalMinutes = 60,
            UptimeFetchIntervalMinutes = 60,
            LatencyFetchIntervalMinutes = 10,
            UserStatsFetchIntervalMinutes = 60,
            FeedFetchIntervalHours = 2
        };
        dbContext.GlobalConfigs.Add(config);
        await dbContext.SaveChangesAsync();

        var service = new GlobalConfigService(dbContext, _eventServiceMock.Object, _reportingRollupRefresherMock.Object);

        // Act
        var result = await service.GetConfigAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal(2, result.FeedFetchIntervalHours);
    }

    [Fact]
    public async Task UpdateConfigAsync_ShouldUpdateConfigAndPersist()
    {
        // Arrange
        var dbContext = new AnalyticsDbContext(_options);
        var config = new GlobalConfig
        {
            Id = 1,
            LitiumFetchIntervalMinutes = 60,
            UptimeFetchIntervalMinutes = 60,
            LatencyFetchIntervalMinutes = 10,
            UserStatsFetchIntervalMinutes = 60,
            FeedFetchIntervalHours = 2
        };
        dbContext.GlobalConfigs.Add(config);
        await dbContext.SaveChangesAsync();

        var service = new GlobalConfigService(dbContext, _eventServiceMock.Object, _reportingRollupRefresherMock.Object);
        var request = new UpdateGlobalConfigRequestDto(FeedFetchIntervalHours: 4, LitiumFetchEnabled: false);

        // Act
        var result = await service.UpdateConfigAsync(request);

        // Assert
        Assert.Equal(4, result.FeedFetchIntervalHours);
        Assert.False(result.LitiumFetchEnabled);

        var dbCheck = new AnalyticsDbContext(_options);
        var configDb = await dbCheck.GlobalConfigs.FindAsync(1);
        Assert.NotNull(configDb);
        Assert.Equal(4, configDb.FeedFetchIntervalHours);
        Assert.False(configDb.LitiumFetchEnabled);
    }

    [Fact]
    public async Task UpdateConfigAsync_WhenReportingTimeZoneChanges_ShouldRefreshFinancialRollups()
    {
        var dbContext = new AnalyticsDbContext(_options);
        dbContext.GlobalConfigs.Add(new GlobalConfig
        {
            Id = 1,
            ReportingTimeZoneId = "Europe/Stockholm",
            LitiumFetchIntervalMinutes = 60,
            UptimeFetchIntervalMinutes = 60,
            LatencyFetchIntervalMinutes = 10,
            UserStatsFetchIntervalMinutes = 60
        });
        await dbContext.SaveChangesAsync();

        var service = new GlobalConfigService(
            dbContext,
            _eventServiceMock.Object,
            _reportingRollupRefresherMock.Object);

        var result = await service.UpdateConfigAsync(
            new UpdateGlobalConfigRequestDto(ReportingTimeZoneId: "UTC"));

        Assert.Equal("UTC", result.ReportingTimeZoneId);
        _reportingRollupRefresherMock.Verify(
            refresher => refresher.RefreshAsync(It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task UpdateFeedIntervalAsync_ShouldPersistInterval()
    {
        // Arrange
        var dbContext = new AnalyticsDbContext(_options);
        var config = new GlobalConfig
        {
            Id = 1,
            LitiumFetchIntervalMinutes = 60,
            UptimeFetchIntervalMinutes = 60,
            LatencyFetchIntervalMinutes = 10,
            UserStatsFetchIntervalMinutes = 60,
            FeedFetchIntervalHours = 2
        };
        dbContext.GlobalConfigs.Add(config);
        await dbContext.SaveChangesAsync();

        var service = new GlobalConfigService(dbContext, _eventServiceMock.Object, _reportingRollupRefresherMock.Object);

        // Act
        await service.UpdateFeedIntervalAsync(12);

        // Assert
        var dbCheck = new AnalyticsDbContext(_options);
        var configDb = await dbCheck.GlobalConfigs.FindAsync(1);
        Assert.NotNull(configDb);
        Assert.Equal(12, configDb.FeedFetchIntervalHours);
    }

    [Fact]
    public async Task GetFetchIntervalsAsync_ShouldReturnFetchIntervalsDto()
    {
        // Arrange
        var dbContext = new AnalyticsDbContext(_options);
        var config = new GlobalConfig
        {
            Id = 1,
            LitiumFetchIntervalMinutes = 60,
            UptimeFetchIntervalMinutes = 50,
            LatencyFetchIntervalMinutes = 10,
            UserStatsFetchIntervalMinutes = 40,
            FeedFetchIntervalHours = 3
        };
        dbContext.GlobalConfigs.Add(config);
        await dbContext.SaveChangesAsync();

        var service = new GlobalConfigService(dbContext, _eventServiceMock.Object, _reportingRollupRefresherMock.Object);

        // Act
        var result = await service.GetFetchIntervalsAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(60, result.LitiumFetchIntervalMinutes);
        Assert.Equal(50, result.UptimeFetchIntervalMinutes);
        Assert.Equal(10, result.LatencyFetchIntervalMinutes);
        Assert.Equal(40, result.UserStatsFetchIntervalMinutes);
        Assert.Equal(3, result.FeedFetchIntervalHours);
    }

    [Fact]
    public async Task UpdateFetchIntervalsAsync_ShouldUpdateIntervalsAndPersist()
    {
        // Arrange
        var dbContext = new AnalyticsDbContext(_options);
        var config = new GlobalConfig
        {
            Id = 1,
            LitiumFetchIntervalMinutes = 60,
            UptimeFetchIntervalMinutes = 60,
            LatencyFetchIntervalMinutes = 10,
            UserStatsFetchIntervalMinutes = 60,
            FeedFetchIntervalHours = 2
        };
        dbContext.GlobalConfigs.Add(config);
        await dbContext.SaveChangesAsync();

        var service = new GlobalConfigService(dbContext, _eventServiceMock.Object, _reportingRollupRefresherMock.Object);
        var request = new UpdateFetchIntervalsRequestDto(
            LitiumFetchIntervalMinutes: 120,
            UptimeFetchIntervalMinutes: 30,
            FeedFetchIntervalHours: 5
        );

        // Act
        var result = await service.UpdateFetchIntervalsAsync(request);

        // Assert
        Assert.Equal(120, result.LitiumFetchIntervalMinutes);
        Assert.Equal(30, result.UptimeFetchIntervalMinutes);
        Assert.Equal(5, result.FeedFetchIntervalHours);

        var dbCheck = new AnalyticsDbContext(_options);
        var configDb = await dbCheck.GlobalConfigs.FindAsync(1);
        Assert.NotNull(configDb);
        Assert.Equal(120, configDb.LitiumFetchIntervalMinutes);
        Assert.Equal(30, configDb.UptimeFetchIntervalMinutes);
        Assert.Equal(5, configDb.FeedFetchIntervalHours);
    }
}
