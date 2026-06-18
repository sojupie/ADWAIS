using System.Text;
using Adwais.Api.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace Adwais.Tests.Middleware;

public class DashboardBasicAuthMiddlewareTests
{
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly DefaultHttpContext _context;

    public DashboardBasicAuthMiddlewareTests()
    {
        _configurationMock = new Mock<IConfiguration>();
        _configurationMock.Setup(c => c["DashboardAuth:Username"]).Returns("admin");
        _configurationMock.Setup(c => c["DashboardAuth:Password"]).Returns("admin123");
        _context = new DefaultHttpContext();
    }

    private DashboardBasicAuthMiddleware CreateMiddleware(RequestDelegate next)
    {
        return new DashboardBasicAuthMiddleware(next, _configurationMock.Object);
    }

    [Fact]
    public async Task InvokeAsync_NoAuthHeader_Returns401()
    {
        var nextCalled = false;
        var middleware = CreateMiddleware(ctx => { nextCalled = true; return Task.CompletedTask; });
        _context.Request.Path = "/swagger/index.html";

        await middleware.InvokeAsync(_context);

        Assert.False(nextCalled);
        Assert.Equal(StatusCodes.Status401Unauthorized, _context.Response.StatusCode);
        Assert.Equal("Basic realm=\"ADWAIS Dashboards\"", _context.Response.Headers.WWWAuthenticate.ToString());
    }

    [Fact]
    public async Task InvokeAsync_InvalidAuthHeader_Returns401()
    {
        var nextCalled = false;
        var middleware = CreateMiddleware(ctx => { nextCalled = true; return Task.CompletedTask; });
        _context.Request.Path = "/swagger/index.html";
        _context.Request.Headers.Authorization = "InvalidHeader";

        await middleware.InvokeAsync(_context);

        Assert.False(nextCalled);
        Assert.Equal(StatusCodes.Status401Unauthorized, _context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_ValidAuthHeader_WrongCredentials_Returns401()
    {
        var nextCalled = false;
        var middleware = CreateMiddleware(ctx => { nextCalled = true; return Task.CompletedTask; });
        _context.Request.Path = "/swagger/index.html";
        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes("admin:wrongpassword"));
        _context.Request.Headers.Authorization = $"Basic {credentials}";

        await middleware.InvokeAsync(_context);

        Assert.False(nextCalled);
        Assert.Equal(StatusCodes.Status401Unauthorized, _context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_ValidAuthHeader_CorrectCredentials_CallsNext()
    {
        var nextCalled = false;
        var middleware = CreateMiddleware(ctx => { nextCalled = true; return Task.CompletedTask; });
        _context.Request.Path = "/swagger/index.html";
        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes("admin:admin123"));
        _context.Request.Headers.Authorization = $"Basic {credentials}";

        await middleware.InvokeAsync(_context);

        Assert.True(nextCalled);
        Assert.Equal(StatusCodes.Status200OK, _context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_PathDoesNotRequireAuth_CallsNext()
    {
        var nextCalled = false;
        var middleware = CreateMiddleware(ctx => { nextCalled = true; return Task.CompletedTask; });
        _context.Request.Path = "/api/users"; // Doesn't start with /swagger or /hangfire

        await middleware.InvokeAsync(_context);

        Assert.True(nextCalled);
        Assert.Equal(StatusCodes.Status200OK, _context.Response.StatusCode);
    }
}
