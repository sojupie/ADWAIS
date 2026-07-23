using Adwais.Infrastructure.Persistence;
using Cronos;
using Adwais.Domain.Entities.Monitoring;
using Hangfire;
using Hangfire.Storage;
using Adwais.Application.Common.Caching;
using Adwais.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Adwais.Infrastructure.Jobs.Monitor;

public class MonitorSynchronizationJob(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    IUptimeRobotService uptimeRobotService,
    IMemoryCache cache,
    IRecurringJobManager recurringJobManager)
{
    public async Task ExecuteAsync()
    {
        await using var dbContext = await dbContextFactory.CreateDbContextAsync();
        var globalConfig = await dbContext.GlobalConfigs.SingleOrDefaultAsync();
        if (globalConfig == null || string.IsNullOrWhiteSpace(globalConfig.UptimeRobotApiKey) || !globalConfig.UptimeRobotFetchEnabled)
        {
            return;
        }
        
        var upStreamMonitors = await uptimeRobotService.GetMonitorsAsync();
        
        var lowestIntervalMins = upStreamMonitors.Any() 
            ? Math.Max(1, upStreamMonitors.Min(m => m.UpdateInterval) / 60)
            : 5;
        recurringJobManager.AddOrUpdate<MonitorSynchronizationJob>("sync-uptimerobot-fleet", job => job.ExecuteAsync(), Cron.MinuteInterval(lowestIntervalMins));

        var localMonitors = await dbContext.Monitors.ToDictionaryAsync(m => m.Id);
        var cronExpression = JobStorage.Current.GetConnection().GetRecurringJobs()
            .SingleOrDefault(j => j.Id == "sync-uptimerobot-fleet")?.Cron;
        
        TimeSpan cacheDuration = TimeSpan.FromMinutes(6);
        
        if (!string.IsNullOrWhiteSpace(cronExpression))
        {
            try
            {
                var cron = CronExpression.Parse(cronExpression, CronFormat.Standard);
                var nextRun = cron.GetNextOccurrence(DateTime.UtcNow);
            
                if (nextRun.HasValue)
                {
                    cacheDuration = nextRun.Value - DateTime.UtcNow + TimeSpan.FromMinutes(1);
                    Console.WriteLine("Set cache duration to {0} minute", cacheDuration.Minutes);
                }
            }
            catch (CronFormatException) { }
        }
        
        foreach (var remote in upStreamMonitors)
        {
            var existing = cache.TryGetValue(GlobalCacheKeys.MonitorState(remote.Id), out LiveMonitorState? state) ? state : null;

            cache.Set(
                GlobalCacheKeys.MonitorState(remote.Id),
                new LiveMonitorState(remote.Status, existing?.CurrentLatency),
                cacheDuration
            );
            if (localMonitors.TryGetValue(remote.Id, out var local))
            {
                local.Type = remote.Type;
                local.Name = remote.FriendlyName;
                local.Url = remote.Url;
                local.UpdateInterval = remote.UpdateInterval;
                local.HttpMethod = remote.HttpMethod;
                local.TimeoutSeconds = remote.TimeoutSeconds;
                local.SslExpiresAt = remote.SslExpiresAt;
                local.DomainExpiresAt = remote.DomainExpiresAt;
                local.MonitoredRegions = remote.MonitoredRegions ?? [];
                local.CurrentStateDurationSeconds = remote.CurrentStateDurationSeconds;
                local.LastIncidentId = remote.LastIncident?.Id;
                local.LastIncidentStatus = remote.LastIncident?.Status;
                local.LastIncidentCause = remote.LastIncident?.Cause;
                local.LastIncidentReason = remote.LastIncident?.Reason;
                local.LastIncidentStartedAt = remote.LastIncident?.StartedAt;
                local.LastIncidentDurationSeconds = remote.LastIncident?.DurationSeconds;
                local.CreatedDate = remote.CreatedDate;
                local.StatusStr = remote.Status;
                local.LastUpdate = DateTimeOffset.UtcNow;
                local.Tags = remote.Tags;
            }
            else
            {
                var monitorState = !remote.Status.Equals("PAUSED");
                dbContext.Monitors.Add(new UptimeMonitor
                {
                    Id = remote.Id,
                    TenantId = AnalyticsDbContext.SystemTenantGuid,
                    Type = remote.Type,
                    Name = remote.FriendlyName,
                    Url = remote.Url,
                    UpdateInterval = remote.UpdateInterval,
                    HttpMethod = remote.HttpMethod,
                    TimeoutSeconds = remote.TimeoutSeconds,
                    SslExpiresAt = remote.SslExpiresAt,
                    DomainExpiresAt = remote.DomainExpiresAt,
                    MonitoredRegions = remote.MonitoredRegions ?? [],
                    CurrentStateDurationSeconds = remote.CurrentStateDurationSeconds,
                    LastIncidentId = remote.LastIncident?.Id,
                    LastIncidentStatus = remote.LastIncident?.Status,
                    LastIncidentCause = remote.LastIncident?.Cause,
                    LastIncidentReason = remote.LastIncident?.Reason,
                    LastIncidentStartedAt = remote.LastIncident?.StartedAt,
                    LastIncidentDurationSeconds = remote.LastIncident?.DurationSeconds,
                    UptimeMonitorEnabled = monitorState,
                    CreatedDate = remote.CreatedDate,
                    StatusStr = remote.Status,
                    LastUpdate = DateTimeOffset.UtcNow,
                    Tags = remote.Tags
                });
            }
        }

        var upStreamIds = upStreamMonitors.Select(m => m.Id).ToHashSet();
        var toDelete = localMonitors.Values.Where(m => m.Id > 0 && !upStreamIds.Contains(m.Id));
        
        dbContext.Monitors.RemoveRange(toDelete);

        await dbContext.SaveChangesAsync();
    }
}


