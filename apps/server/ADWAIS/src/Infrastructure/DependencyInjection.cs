using Adwais.Application.Common.Interfaces;
using Adwais.Application.Interfaces;
using Adwais.Infrastructure.Caching;
using Adwais.Infrastructure.Persistence;
using Adwais.Infrastructure.Services;
using Adwais.Infrastructure.Services.Monitoring;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Polly;
using Polly.Extensions.Http;

namespace Adwais.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("AnalyticsDb");

        services.AddDbContext<AnalyticsDbContext>(options =>
            options.UseNpgsql(connectionString).UseSnakeCaseNamingConvention());

        services.AddDbContextFactory<AnalyticsDbContext>(options =>
            options.UseNpgsql(connectionString).UseSnakeCaseNamingConvention(), ServiceLifetime.Scoped);

        services.AddScoped<IApplicationDbContext>(provider => 
            provider.GetRequiredService<AnalyticsDbContext>());

        // Register the DbContextFactory wrapper for IApplicationDbContext
        services.AddScoped<IApplicationDbContextFactory, ApplicationDbContextFactory>();

        services.AddScoped<ISystemEventService, SystemEventService>();
        services.AddScoped<ICacheService, MemoryCacheService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IKioskService, KioskService>();
        services.AddScoped<IUserService, UserService>();

        // Register Typed HTTP Clients with resilience policies
        services.AddTransient<UptimeRobotRateLimitHandler>();
        services.AddHttpClient<IUptimeRobotService, UptimeRobotService>()
            .AddHttpMessageHandler<UptimeRobotRateLimitHandler>();

        services.AddHttpClient<ILitiumIngestionService, LitiumIngestionService>()
            .AddPolicyHandler(HttpPolicyExtensions
                .HandleTransientHttpError()
                .OrResult(msg => msg.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                .WaitAndRetryAsync(
                    retryCount: 5,
                    sleepDurationProvider: retryAttempt =>
                        TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)) + TimeSpan.FromMilliseconds(new Random().Next(0, 1000))
                ));

        services.AddHttpClient<IFeedAggregationService, FeedAggregationService>()
            .AddPolicyHandler(HttpPolicyExtensions
                .HandleTransientHttpError()
                .OrResult(msg => msg.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                .WaitAndRetryAsync(
                    retryCount: 3,
                    sleepDurationProvider: retryAttempt =>
                        TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)) + TimeSpan.FromMilliseconds(new Random().Next(0, 1000))
                ));

        services.AddTransient<IFeedParser, Services.Parsers.RssFeedParser>();
        services.AddTransient<IFeedParser, Services.Parsers.LitiumBlogParser>();
        services.AddTransient<IFeedParser, Services.Parsers.MotilloAktuelltParser>();
        services.AddTransient<ISystemHealthService, SystemHealthService>();

        return services;
    }
}
