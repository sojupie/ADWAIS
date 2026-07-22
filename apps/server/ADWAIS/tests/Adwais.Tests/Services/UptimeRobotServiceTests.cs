using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using Moq.Protected;
using Xunit;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities;
using Adwais.Infrastructure.Persistence;
using Adwais.Infrastructure.Services.Monitoring;

namespace Adwais.Tests.Services;

public class UptimeRobotServiceTests
{
    private readonly DbContextOptions<AnalyticsDbContext> _dbOptions;
    private readonly Mock<IDbContextFactory<AnalyticsDbContext>> _dbContextFactoryMock;
    private readonly Mock<ISystemEventService> _eventServiceMock;
    private readonly Mock<HttpMessageHandler> _httpHandlerMock;
    private readonly HttpClient _client;
    private readonly UptimeRobotService _service;

    public UptimeRobotServiceTests()
    {
        _dbOptions = new DbContextOptionsBuilder<AnalyticsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _dbContextFactoryMock = new Mock<IDbContextFactory<AnalyticsDbContext>>();
        _dbContextFactoryMock.Setup(f => f.CreateDbContextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new AnalyticsDbContext(_dbOptions));

        _eventServiceMock = new Mock<ISystemEventService>();
        _httpHandlerMock = new Mock<HttpMessageHandler>(MockBehavior.Strict);
        _client = new HttpClient(_httpHandlerMock.Object);

        _service = new UptimeRobotService(_client, _dbContextFactoryMock.Object, _eventServiceMock.Object);

        // Seed API key config
        using var db = new AnalyticsDbContext(_dbOptions);
        db.GlobalConfigs.Add(new GlobalConfig
        {
            Id = 1,
            UptimeRobotApiKey = "test-api-key",
            LitiumFetchIntervalMinutes = 30
        });
        db.SaveChanges();
    }

    [Fact]
    public async Task CreateMonitorAsync_ShouldSendPostRequest_AndReturnParsedMonitor()
    {
        // Arrange
        var monitorJson = @"
        {
            ""id"": 12345,
            ""type"": ""PING"",
            ""friendlyName"": ""Test Monitor"",
            ""url"": ""https://test.com"",
            ""status"": ""paused"",
            ""createDateTime"": ""2026-07-06T12:00:00Z"",
            ""interval"": 300
        }";

        var mockResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(monitorJson)
        };

        _httpHandlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req =>
                    req.Method == HttpMethod.Post &&
                    req.RequestUri != null &&
                    req.RequestUri.ToString() == "https://api.uptimerobot.com/v3/monitors"),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(mockResponse);

        // Act
        var result = await _service.CreateMonitorAsync("Test Monitor", "https://test.com", "ping");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(12345, result.Id);
        Assert.Equal("PING", result.Type);
        Assert.Equal("Test Monitor", result.FriendlyName);
        Assert.Equal("https://test.com", result.Url);
        Assert.Equal("paused", result.Status);
    }

    [Fact]
    public async Task GetResponseTimeAsync_ShouldQueryEndpoint_AndReturnStats()
    {
        // Arrange
        var responseTimeJson = @"
        {
            ""summary"": {
                ""avg"": 150,
                ""min"": 110,
                ""max"": 320
            }
        }";

        var mockResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(responseTimeJson)
        };

        _httpHandlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req =>
                    req.Method == HttpMethod.Get &&
                    req.RequestUri != null &&
                    req.RequestUri.ToString().Contains("/stats/response-time")),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(mockResponse);

        // Act
        var (avg, lowest, highest) = await _service.GetResponseTimeAsync(
            12345,
            DateTimeOffset.UtcNow.AddDays(-1),
            DateTimeOffset.UtcNow,
            "Test Monitor"
        );

        // Assert
        Assert.Equal(150, avg);
        Assert.Equal(110, lowest);
        Assert.Equal(320, highest);
    }

    [Fact]
    public async Task UpdateMonitorAsync_ShouldSendNormalizedType()
    {
        string? requestBody = null;
        var mockResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{}")
        };

        _httpHandlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(request =>
                    request.Method == HttpMethod.Patch &&
                    request.RequestUri != null &&
                    request.RequestUri.ToString() == "https://api.uptimerobot.com/v3/monitors/12345"),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((request, _) =>
                requestBody = request.Content!.ReadAsStringAsync().GetAwaiter().GetResult())
            .ReturnsAsync(mockResponse);

        await _service.UpdateMonitorAsync(12345, null, null, "ping", null);

        Assert.NotNull(requestBody);
        using var payload = JsonDocument.Parse(requestBody);
        Assert.Equal("PING", payload.RootElement.GetProperty("type").GetString());
    }

    [Fact]
    public async Task GetUptimeAsync_ShouldQueryEndpoint_AndReturnUptimeValue()
    {
        // Arrange
        var uptimeJson = @"
        {
            ""uptime"": 99.95
        }";

        var mockResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(uptimeJson)
        };

        _httpHandlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req =>
                    req.Method == HttpMethod.Get &&
                    req.RequestUri != null &&
                    req.RequestUri.ToString().Contains("/stats/uptime")),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(mockResponse);

        // Act
        var result = await _service.GetUptimeAsync(12345);

        // Assert
        Assert.Equal(99.95, result);
    }

    [Fact]
    public async Task GetResponseAsync_ShouldLogErrorAndThrow_WhenRequestFails()
    {
        // Arrange
        var mockResponse = new HttpResponseMessage(HttpStatusCode.BadRequest)
        {
            Content = new StringContent("Invalid parameters")
        };

        _httpHandlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(mockResponse);

        // Act & Assert
        await Assert.ThrowsAsync<HttpRequestException>(() =>
            _service.CreateMonitorAsync("Fail Monitor", "https://fail.com", null));

        _eventServiceMock.Verify(s => s.LogErrorAsync(
            nameof(UptimeRobotService),
            It.Is<string>(m => m.Contains("UptimeRobot request failed")),
            It.IsAny<Exception>()
        ), Times.Once);
    }

    [Fact]
    public async Task GetMonitorsAsync_ShouldQueryNextPages_WhenNextLinkPresent()
    {
        // Arrange
        var page1Json = @"
        {
            ""nextLink"": ""/v3/monitors?cursor=page2"",
            ""data"": [
                {
                    ""id"": 1,
                    ""type"": ""HTTP"",
                    ""friendlyName"": ""Monitor 1"",
                    ""url"": ""https://test1.com"",
                    ""status"": ""up"",
                    ""createDateTime"": ""2026-07-06T12:00:00Z"",
                    ""interval"": 300
                }
            ]
        }";

        var page2Json = @"
        {
            ""nextLink"": null,
            ""data"": [
                {
                    ""id"": 2,
                    ""type"": ""PING"",
                    ""friendlyName"": ""Monitor 2"",
                    ""url"": ""https://test2.com"",
                    ""status"": ""paused"",
                    ""createDateTime"": ""2026-07-06T12:00:00Z"",
                    ""interval"": 300
                }
            ]
        }";

        var responsePage1 = new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(page1Json) };
        var responsePage2 = new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(page2Json) };

        _httpHandlerMock.Protected()
            .SetupSequence<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(responsePage1)
            .ReturnsAsync(responsePage2);

        // Act
        var result = await _service.GetMonitorsAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal(1, result[0].Id);
        Assert.Equal("HTTP", result[0].Type);
        Assert.Equal("Monitor 1", result[0].FriendlyName);
        Assert.Equal(2, result[1].Id);
        Assert.Equal("PING", result[1].Type);
        Assert.Equal("Monitor 2", result[1].FriendlyName);

        _httpHandlerMock.Protected().Verify(
            "SendAsync",
            Times.Exactly(2),
            ItExpr.IsAny<HttpRequestMessage>(),
            ItExpr.IsAny<CancellationToken>());
    }
}
