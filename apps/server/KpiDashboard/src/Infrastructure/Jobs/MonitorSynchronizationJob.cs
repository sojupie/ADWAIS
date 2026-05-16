using Domain.Entities.Monitoring;
using Infrastructure.CacheModels;
using Infrastructure.Services.Monitoring;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Infrastructure.Jobs;

public class MonitorSynchronizationJob(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    IUptimeRobotService uptimeRobotService,
    IMemoryCache cache)
{
    public async Task ExecuteAsync()
    {
        await using var dbContext = await dbContextFactory.CreateDbContextAsync();

        var upStreamMonitors = await uptimeRobotService.GetMonitorsAsync();
        var localMonitors = await dbContext.Monitors.ToDictionaryAsync(m => m.Id);

        foreach (var remote in upStreamMonitors)
        {
            cache.Set(
                MonitorCacheKeys.MonitorState(remote.Id),
                new LiveMonitorState(remote.Status, null),
                TimeSpan.FromMinutes(6) //to do: validate timespan/strategy/rateLimit
            );

            if (localMonitors.TryGetValue(remote.Id, out var local))
            {
                local.Name = remote.FriendlyName;
                local.Url = remote.Url;
                local.CreatedDate = remote.CreatedDate;
                local.LastUpdate = new DateTimeOffset(DateTime.UtcNow);
            }
            else
            {
                var monitorState = !remote.Status.Equals("PAUSED");
                dbContext.Monitors.Add(new UptimeMonitor
                {
                    Id = remote.Id,
                    TenantId = AnalyticsDbContext.SystemTenantGuid,
                    Name = remote.FriendlyName,
                    Url = remote.Url,
                    UptimeMonitorEnabled = monitorState,
                    CreatedDate = remote.CreatedDate,
                    StatusStr = remote.Status
                });
            }
        }

        var upStreamIds = upStreamMonitors.Select(m => m.Id).ToHashSet();
        var toDelete = localMonitors.Values.Where(m => !upStreamIds.Contains(m.Id));
        dbContext.Monitors.RemoveRange(toDelete);

        await dbContext.SaveChangesAsync();
    }
}