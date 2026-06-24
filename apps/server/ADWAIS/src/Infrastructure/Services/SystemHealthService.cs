using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.System;
using Adwais.Application.Interfaces;
using Adwais.Infrastructure.Persistence;
using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Infrastructure.Services;

public class SystemHealthService(IDbContextFactory<AnalyticsDbContext> dbContextFactory) : ISystemHealthService
{
    private readonly IDbContextFactory<AnalyticsDbContext> _dbContextFactory = dbContextFactory;

    public async Task<SystemHealthDto> GetHealthAsync(CancellationToken ct = default)
    {
        await using var db = await _dbContextFactory.CreateDbContextAsync(ct);
        
        string dbStatus = "Healthy";
        DateTimeOffset? lastLitiumSync = null;
        DateTimeOffset? lastBlogSync = null;
        DateTimeOffset? lastFleetUpdate = null;
        DateTimeOffset? lastFleetUptimeUpdate = null;
        DateTimeOffset? lastFleetLatencyUpdate = null;
        string? globalSyncError = null;
        
        int totalMonitors = 0;
        int monitorsWithErrors = 0;
        int tenantsWithErrors = 0;
        int feedsWithErrors = 0;

        try
        {
            var config = await db.GlobalConfigs.AsNoTracking().SingleOrDefaultAsync(ct);
            lastLitiumSync = config?.LastPolled;
            globalSyncError = config?.LastSyncError;

            // Safe checks in case of empty sequences
            if (await db.Monitors.AnyAsync(ct))
            {
                lastFleetUpdate = await db.Monitors.MaxAsync(m => m.LastUpdate, ct);
                lastFleetUptimeUpdate = await db.Monitors.MaxAsync(m => m.LastUptimeUpdate, ct);
                lastFleetLatencyUpdate = await db.Monitors.MaxAsync(m => m.LastLatencyUpdate, ct);
            }

            totalMonitors = await db.Monitors.CountAsync(m => m.UptimeMonitorEnabled, ct);
            monitorsWithErrors = await db.Monitors.CountAsync(m => m.LastSyncError != null && m.UptimeMonitorEnabled, ct);
            tenantsWithErrors = await db.Tenants.CountAsync(t => t.LastSyncError != null && t.Id != AnalyticsDbContext.SystemTenantGuid, ct);

            var activeFeeds = await db.FeedSources.AsNoTracking().Where(fs => fs.IsActive).ToListAsync(ct);
            if (activeFeeds.Any())
            {
                var successDates = activeFeeds.Where(fs => fs.LastSuccessAt.HasValue).Select(fs => fs.LastSuccessAt!.Value).ToList();
                if (successDates.Any())
                {
                    lastBlogSync = successDates.Max();
                }
                feedsWithErrors = activeFeeds.Count(fs => fs.LastSyncError != null);
            }
        }
        catch
        {
            dbStatus = "Unhealthy";
        }

        // Calculate Sync Status (Healthy, Degraded, Failed) based on thresholds
        string syncStatus = "Healthy";
        if (dbStatus == "Unhealthy" || globalSyncError != null)
        {
            syncStatus = "Failed";
        }
        else if (tenantsWithErrors > 0 || feedsWithErrors > 0)
        {
            syncStatus = "Degraded";
        }
        else if (totalMonitors > 0 && monitorsWithErrors > 0)
        {
            double errorRate = (double)monitorsWithErrors / totalMonitors;
            if (errorRate >= 0.15)
            {
                syncStatus = "Failed";
            }
            else
            {
                syncStatus = "Degraded";
            }
        }

        // Calculate Hangfire Status (Healthy, Warning, Failed)
        string hangfireStatus = "Healthy";
        long failedCount = 0;
        long processingCount = 0;
        long enqueuedCount = 0;
        long scheduledCount = 0;

        try
        {
            var monitorApi = JobStorage.Current.GetMonitoringApi();
            var stats = await Task.Run(() => monitorApi.GetStatistics(), ct);
            failedCount = stats.Failed;
            processingCount = stats.Processing;
            enqueuedCount = stats.Enqueued;
            scheduledCount = stats.Scheduled;
            
            var failedJobs = await Task.Run(() => monitorApi.FailedJobs(0, 15), ct);
            var recentFailures = failedJobs.Count(j => j.Value.FailedAt.HasValue && DateTime.UtcNow - j.Value.FailedAt.Value < TimeSpan.FromHours(24));

            if (recentFailures > 5)
            {
                hangfireStatus = "Failed";
            }
            else if (recentFailures > 0)
            {
                hangfireStatus = "Warning";
            }
        }
        catch
        {
            hangfireStatus = "Failed";
        }

        return new SystemHealthDto(
            DatabaseStatus: dbStatus,
            Hangfire: new HangfireHealthDto(
                Status: hangfireStatus,
                FailedCount: failedCount,
                ProcessingCount: processingCount,
                EnqueuedCount: enqueuedCount,
                ScheduledCount: scheduledCount
            ),
            Sync: new SyncHealthDto(
                Status: syncStatus,
                TenantsWithErrorsCount: tenantsWithErrors,
                MonitorsWithErrorsCount: monitorsWithErrors,
                FeedsWithErrorsCount: feedsWithErrors,
                GlobalSyncError: globalSyncError
            ),
            LastLitiumSync: lastLitiumSync,
            LastBlogSync: lastBlogSync,
            LastFleetUpdate: lastFleetUpdate,
            LastFleetUptimeUpdate: lastFleetUptimeUpdate,
            LastFleetLatencyUpdate: lastFleetLatencyUpdate
        );
    }

    public async Task ClearErrorsAsync(CancellationToken ct = default)
    {
        await using var db = await _dbContextFactory.CreateDbContextAsync(ct);
        
        if (db.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory")
        {
            var sources = await db.FeedSources.ToListAsync(ct);
            foreach (var s in sources) s.LastSyncError = null;
            var tenants = await db.Tenants.ToListAsync(ct);
            foreach (var t in tenants) t.LastSyncError = null;
            var monitors = await db.Monitors.ToListAsync(ct);
            foreach (var m in monitors) m.LastSyncError = null;
            var configs = await db.GlobalConfigs.ToListAsync(ct);
            foreach (var c in configs) c.LastSyncError = null;
            await db.SaveChangesAsync(ct);
        }
        else
        {
            await db.Tenants.ExecuteUpdateAsync(s => s.SetProperty(t => t.LastSyncError, (string?)null), ct);
            await db.Monitors.ExecuteUpdateAsync(s => s.SetProperty(m => m.LastSyncError, (string?)null), ct);
            await db.GlobalConfigs.ExecuteUpdateAsync(s => s.SetProperty(c => c.LastSyncError, (string?)null), ct);
            await db.FeedSources.ExecuteUpdateAsync(s => s.SetProperty(fs => fs.LastSyncError, (string?)null), ct);
        }
    }

    public async Task<IEnumerable<BackgroundJobStatusDto>> GetRecentJobsAsync(CancellationToken ct = default)
    {
        var monitorApi = JobStorage.Current.GetMonitoringApi();
        
        var succeeded = await Task.Run(() => monitorApi.SucceededJobs(0, 15), ct);
        var failed = await Task.Run(() => monitorApi.FailedJobs(0, 15), ct);
        var processing = await Task.Run(() => monitorApi.ProcessingJobs(0, 10), ct);

        var list = new List<BackgroundJobStatusDto>();

        foreach (var job in processing)
        {
            var (jobName, jobArgs) = ParseJobDetails(job.Value.Job);
            list.Add(new BackgroundJobStatusDto(
                JobId: job.Key,
                JobName: jobName,
                JobArgs: jobArgs,
                State: "Processing",
                CreatedAt: job.Value.StartedAt,
                DurationSeconds: job.Value.StartedAt.HasValue ? (DateTime.UtcNow - job.Value.StartedAt.Value).TotalSeconds : 0.0,
                ExceptionMessage: null
            ));
        }

        foreach (var job in succeeded)
        {
            var (jobName, jobArgs) = ParseJobDetails(job.Value.Job);
            list.Add(new BackgroundJobStatusDto(
                JobId: job.Key,
                JobName: jobName,
                JobArgs: jobArgs,
                State: "Succeeded",
                CreatedAt: job.Value.SucceededAt,
                DurationSeconds: (double?)job.Value.TotalDuration / 1000.0,
                ExceptionMessage: null
            ));
        }

        foreach (var job in failed)
        {
            var (jobName, jobArgs) = ParseJobDetails(job.Value.Job);
            list.Add(new BackgroundJobStatusDto(
                JobId: job.Key,
                JobName: jobName,
                JobArgs: jobArgs,
                State: "Failed",
                CreatedAt: job.Value.FailedAt,
                DurationSeconds: null,
                ExceptionMessage: job.Value.ExceptionMessage
            ));
        }

        return list.OrderByDescending(j => j.CreatedAt).Take(20).ToList();
    }

    private static (string Name, string? Args) ParseJobDetails(Hangfire.Common.Job? job)
    {
        if (job == null) return ("Unknown Job", null);

        var typeName = job.Type.Name;
        var methodName = job.Method.Name;
        var baseName = methodName == "ExecuteAsync" ? typeName : $"{typeName}.{methodName}";

        string? args = null;
        if (job.Args != null && job.Args.Count > 0)
        {
            args = string.Join(", ", job.Args.Select(arg =>
            {
                if (arg == null) return "null";
                if (arg is DateTimeOffset dto) return dto.ToString("yyyy-MM-dd HH:mm:ss");
                if (arg is DateTime dt) return dt.ToString("yyyy-MM-dd HH:mm:ss");
                if (arg is string str) return $"\"{str}\"";
                return arg.ToString();
            }));
        }

        return (baseName, args);
    }
}
