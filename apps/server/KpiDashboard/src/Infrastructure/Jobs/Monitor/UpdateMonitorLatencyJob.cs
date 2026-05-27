using Domain.Entities.Monitoring;
using Infrastructure.CacheModels;
using Infrastructure.Services.Monitoring;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Infrastructure.Jobs.Monitor;

public class UpdateMonitorLatencyJob(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    IUptimeRobotService uptimeRobotService,
    IMemoryCache cache)
{
    public async Task ExecuteAsync(int monitorId, DateTimeOffset startDate, DateTimeOffset endDate)
    {
        await using var dbContext = await dbContextFactory.CreateDbContextAsync();
        var monitor = await dbContext.Monitors.FirstOrDefaultAsync(m => m.Id == monitorId);

        if (monitor == null || !monitor.UptimeMonitorEnabled) return;

        try
        {
            var responseTime = await uptimeRobotService.GetResponseTimeAsync(monitorId, startDate, endDate);

            if (responseTime.Average.HasValue)
            {
                dbContext.ResponseTimes.Add(new ResponseTime
                {
                    MonitorId = monitorId,
                    Average = responseTime.Average.Value,
                    Lowest = responseTime.Lowest,
                    Highest = responseTime.Highest,
                    Date = endDate
                });

                var globalConfig = await dbContext.GlobalConfigs.AsNoTracking().SingleOrDefaultAsync();
                var intervalMins = globalConfig?.LatencyFetchIntervalMinutes ?? 10;

                var existing = cache.TryGetValue(GlobalCacheKeys.MonitorState(monitorId), out LiveMonitorState? state) ? state : null;
                cache.Set(
                    GlobalCacheKeys.MonitorState(monitorId),
                    new LiveMonitorState(existing?.StatusStr ?? monitor.StatusStr, (double)responseTime.Average.Value),
                    TimeSpan.FromMinutes(intervalMins * 2)
                );
            }

            monitor.LastLatencyUpdate = endDate;
            monitor.LastSyncError = null;
            await dbContext.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            monitor.LastSyncError = ex.Message;
            await dbContext.SaveChangesAsync();
            throw;
        }
    }
}
