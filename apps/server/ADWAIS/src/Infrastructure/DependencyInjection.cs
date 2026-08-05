using Adwais.Application.Common.Interfaces;
using Adwais.Application.Interfaces;
using Adwais.Application.Services;
using Adwais.Infrastructure.Caching;
using Adwais.Infrastructure.Persistence;
using Adwais.Infrastructure.Services;
using Adwais.Infrastructure.Services.Monitoring;
using Adwais.Infrastructure.Jobs.MaterializedViews;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Adwais.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("AnalyticsDb");

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
        services.AddScoped<IGlobalConfigService, GlobalConfigService>();
        services.AddScoped<IReportingCalendar, ReportingCalendar>();
        services.AddScoped<RefreshFinancialMaterializedViewJob>();
        services.AddScoped<RefreshMonitoringMaterializedViewJob>();
        services.AddScoped<IReportingRollupRefresher, ReportingRollupRefresher>();

        // Register Typed HTTP Clients with resilience policies
        services.AddTransient<UptimeRobotRateLimitHandler>();
        services.AddHttpClient<IUptimeRobotService, UptimeRobotService>()
            .AddHttpMessageHandler<UptimeRobotRateLimitHandler>()
            .AddStandardResilienceHandler();

        services.AddHttpClient<ILitiumIngestionService, LitiumIngestionService>()
            .AddStandardResilienceHandler(options =>
            {
                options.Retry.MaxRetryAttempts = 5;
            });

        services.AddHttpClient<IFeedAggregationService, FeedAggregationService>()
            .AddStandardResilienceHandler();

        services.AddTransient<IFeedParser, Services.Parsers.RssFeedParser>();
        services.AddTransient<IFeedParser, Services.Parsers.LitiumBlogParser>();
        services.AddTransient<IFeedParser, Services.Parsers.LitiumNyhetsrumParser>();
        services.AddTransient<IFeedParser, Services.Parsers.MotilloAktuelltParser>();
        services.AddTransient<ISystemHealthService, SystemHealthService>();
        services.AddTransient<ICommunityPostService, CommunityPostService>();
        services.AddTransient<IFeedService, FeedService>();

        services.AddScoped<IOfficeEventService, OfficeEventService>();
        services.AddScoped<ICalendarFeedService, CalendarFeedService>();
        services.AddHttpClient<ICalendarSubscriptionService, CalendarSubscriptionService>()
            .AddStandardResilienceHandler();
        services.AddHttpClient<IWeatherService, WeatherService>()
            .AddStandardResilienceHandler();

        return services;
    }
}
