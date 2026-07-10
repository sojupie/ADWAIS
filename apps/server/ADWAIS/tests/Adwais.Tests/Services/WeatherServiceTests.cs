using System;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.GlobalConfig;
using Adwais.Application.Interfaces;
using Adwais.Infrastructure.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using Xunit;

namespace Adwais.Tests.Services;

public class WeatherServiceTests
{
    private readonly Mock<IGlobalConfigService> _configServiceMock;
    private readonly Mock<IMemoryCache> _cacheMock;
    private readonly Mock<ILogger<WeatherService>> _loggerMock;

    public WeatherServiceTests()
    {
        _configServiceMock = new Mock<IGlobalConfigService>();
        _cacheMock = new Mock<IMemoryCache>();
        _loggerMock = new Mock<ILogger<WeatherService>>();
    }

    [Fact]
    public async Task GetCurrentWeatherAsync_ShouldThrowException_WhenLocationIsEmpty()
    {
        // Arrange
        var configDto = new GlobalConfigResponseDto(
            Id: 1,
            LastPolled: null,
            LitiumFetchEnabled: true,
            UptimeRobotFetchEnabled: true,
            LitiumFetchIntervalMinutes: 60,
            LatencyDegradedFloor: 150,
            UptimeRobotApiKey: null,
            UptimeFetchIntervalMinutes: 60,
            LatencyFetchIntervalMinutes: 10,
            UserStatsFetchIntervalMinutes: 60,
            SystemEventRetentionDays: 2,
            MonitorsCount: 0,
            MonitorsLimit: 100,
            ActiveSubscription: null,
            DefaultUptimeSla: 99.9,
            FeedFetchIntervalHours: 2,
            WeatherLocation: null, // Null location
            WeatherFetchIntervalMinutes: 15
        );

        _configServiceMock.Setup(c => c.GetConfigAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(configDto);

        var httpClient = new HttpClient();
        var service = new WeatherService(httpClient, _configServiceMock.Object, _cacheMock.Object, _loggerMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.GetCurrentWeatherAsync());
    }

    [Fact]
    public async Task GetCurrentWeatherAsync_ShouldFetchForecast_WhenLocationIsConfigured()
    {
        // Arrange
        var configDto = new GlobalConfigResponseDto(
            Id: 1,
            LastPolled: null,
            LitiumFetchEnabled: true,
            UptimeRobotFetchEnabled: true,
            LitiumFetchIntervalMinutes: 60,
            LatencyDegradedFloor: 150,
            UptimeRobotApiKey: null,
            UptimeFetchIntervalMinutes: 60,
            LatencyFetchIntervalMinutes: 10,
            UserStatsFetchIntervalMinutes: 60,
            SystemEventRetentionDays: 2,
            MonitorsCount: 0,
            MonitorsLimit: 100,
            ActiveSubscription: null,
            DefaultUptimeSla: 99.9,
            FeedFetchIntervalHours: 2,
            WeatherLocation: "Karlstad",
            WeatherFetchIntervalMinutes: 15
        );

        _configServiceMock.Setup(c => c.GetConfigAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(configDto);

        // Mock caching
        object? cacheEntry = null;
        _cacheMock.Setup(c => c.TryGetValue(It.IsAny<object>(), out cacheEntry)).Returns(false);
        _cacheMock.Setup(c => c.CreateEntry(It.IsAny<object>())).Returns(Mock.Of<ICacheEntry>());

        // Mock HttpClient calls
        var handlerMock = new Mock<HttpMessageHandler>(MockBehavior.Strict);
        
        // Mock geocoding response
        var geocodingResponse = new
        {
            results = new[]
            {
                new { name = "Karlstad", latitude = 59.4, longitude = 13.5 }
            }
        };
        
        // Mock forecast response
        var forecastResponse = new
        {
            current = new
            {
                temperature_2m = 18.5,
                weather_code = 1,
                wind_speed_10m = 12.3
            }
        };

        handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req => req.RequestUri!.ToString().Contains("geocoding-api")),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(JsonSerializer.Serialize(geocodingResponse))
            });

        handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req => req.RequestUri!.ToString().Contains("forecast")),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(JsonSerializer.Serialize(forecastResponse))
            });

        var httpClient = new HttpClient(handlerMock.Object);
        var service = new WeatherService(httpClient, _configServiceMock.Object, _cacheMock.Object, _loggerMock.Object);

        // Act
        var result = await service.GetCurrentWeatherAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Karlstad", result.Location);
        Assert.Equal(18.5, result.Temperature);
        Assert.Equal(1, result.WeatherCode);
        Assert.Equal(12.3, result.WindSpeed);
    }
}
