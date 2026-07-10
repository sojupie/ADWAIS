using Adwais.Infrastructure.Persistence;
using Adwais.Infrastructure.Helpers;
using Adwais.Infrastructure.Jobs.Monitor;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Builder;
using System;
using System.Threading.Tasks;
using Adwais.Infrastructure.DemoDataSeeding;
using Adwais.Infrastructure.Jobs;
using Adwais.Infrastructure.Jobs.MaterializedViews;

namespace Adwais.Api.Extensions;

public static class ApplicationBootstrapperExtensions
{
    public static async Task BootstrapApplicationAsync(this WebApplication app)
    {
        var configuration = app.Services.GetRequiredService<IConfiguration>();
        var enableSeeding = configuration.GetValue<bool>("FeatureToggles:EnableRuntimeDataSeeding", false);

        using (var scope = app.Services.CreateScope())
        {
            var contextFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<AnalyticsDbContext>>();
            await using var context = await contextFactory.CreateDbContextAsync();
            
            await context.Database.MigrateAsync();
            await MaterializedViewOrchestrator.SyncViewsAsync(context);

            if (enableSeeding)
            {
                await DatabaseSeeder.SeedSampleDataAsync(context);
            }
        }

        using (var connection = JobStorage.Current.GetConnection())
        {
            var recurringJobManager = app.Services.GetRequiredService<IRecurringJobManager>();
            
            recurringJobManager.AddOrUpdate<MonitorSynchronizationJob>(
                "sync-uptimerobot-fleet", 
                newJob => newJob.ExecuteAsync(), 
                Cron.MinuteInterval(5));
            
            recurringJobManager.RemoveIfExists("dispatch-uptimerobot-metrics");

            using (var scope = app.Services.CreateScope())
            {
                var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<AnalyticsDbContext>>();
                await using var context = await dbFactory.CreateDbContextAsync();
                var config = await context.GlobalConfigs.SingleOrDefaultAsync();
                
                var uptimeInterval = config?.UptimeFetchIntervalMinutes ?? 60;
                var latencyInterval = config?.LatencyFetchIntervalMinutes ?? 10;
                var litiumFetchInterval = Math.Max(1, config?.LitiumFetchIntervalMinutes ?? 10);
                var userStatsInterval = config?.UserStatsFetchIntervalMinutes ?? 60;
                var feedInterval = Math.Max(1, config?.FeedFetchIntervalHours ?? 2);
                
                recurringJobManager.AddOrUpdate<UptimeDispatcherJob>(
                        "dispatch-uptimerobot-uptime",
                        newJob => newJob.ExecuteAsync(),
                        CronHelper.FromMinutes(uptimeInterval));

                recurringJobManager.AddOrUpdate<LatencyDispatcherJob>(
                    "dispatch-uptimerobot-latency",
                    newJob => newJob.ExecuteAsync(),
                    CronHelper.FromMinutes(latencyInterval));

                recurringJobManager.AddOrUpdate<LitiumOrderFetchJob>(
                    "dispatch-litium-orders",
                    newJob => newJob.ExecuteAsync(),
                    CronHelper.FromMinutes(litiumFetchInterval));

                recurringJobManager.AddOrUpdate<UpdateGlobalUptimeRobotUserStatsJob>(
                    "sync-uptimerobot-account-stats",
                    newJob => newJob.ExecuteAsync(),
                    CronHelper.FromMinutes(userStatsInterval));

                recurringJobManager.AddOrUpdate<RefreshMonitoringMaterializedViewJob>(
                    "refresh-monitoring-materialized-views",
                    newJob => newJob.ExecuteAsync(),
                    Cron.Daily);

                recurringJobManager.AddOrUpdate<RefreshFinancialMaterializedViewJob>(
                    "refresh-financial-materialized-views",
                    newJob => newJob.ExecuteAsync(),
                    Cron.Daily);

                recurringJobManager.AddOrUpdate<SystemEventCleanupJob>(
                    "system-event-cleanup",
                    newJob => newJob.ExecuteAsync(),
                    Cron.Daily(2));

                recurringJobManager.AddOrUpdate<FeedAggregationJob>(
                    "aggregate-intranet-feeds",
                    newJob => newJob.ExecuteAsync(CancellationToken.None),
                    Cron.HourInterval(feedInterval));

                recurringJobManager.AddOrUpdate<CalendarSyncJob>(
                    "sync-intranet-calendars",
                    newJob => newJob.ExecuteAsync(CancellationToken.None),
                    Cron.MinuteInterval(30));

                if (enableSeeding)
                {
                    recurringJobManager.AddOrUpdate<RuntimeDataSeederJob>(
                        "dev-runtime-data-seeder",
                        newJob => newJob.ExecuteAsync(),
                        Cron.MinuteInterval(1));
                }
                else
                {
                    recurringJobManager.RemoveIfExists("dev-runtime-data-seeder");
                }
            }
        }
    }
}
