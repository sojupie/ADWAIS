using Adwais.Api.DTOs.System;
using Hangfire;
using Adwais.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Adwais.Api.Controllers;

/// <summary>
/// Provides a high-level overview of system health and background job status.
/// </summary>
[ApiController]
[Route("api/system/health")]
public class SystemHealthController(IDbContextFactory<AnalyticsDbContext> dbContextFactory) : ControllerBase
{
    /// <summary>
    /// Retrieves an aggregated health report of the entire application pipeline.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<SystemHealthDto>> GetHealth()
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        
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
            var config = await db.GlobalConfigs.AsNoTracking().FirstOrDefaultAsync();
            lastLitiumSync = config?.LastPolled;
            globalSyncError = config?.LastSyncError;

            lastFleetUpdate = await db.Monitors.MaxAsync(m => m.LastUpdate);
            lastFleetUptimeUpdate = await db.Monitors.MaxAsync(m => m.LastUptimeUpdate);
            lastFleetLatencyUpdate = await db.Monitors.MaxAsync(m => m.LastLatencyUpdate);

            totalMonitors = await db.Monitors.CountAsync(m => m.UptimeMonitorEnabled);
            monitorsWithErrors = await db.Monitors.CountAsync(m => m.LastSyncError != null && m.UptimeMonitorEnabled);
            tenantsWithErrors = await db.Tenants.CountAsync(t => t.LastSyncError != null && t.Id != AnalyticsDbContext.SystemTenantGuid);

            var activeFeeds = await db.FeedSources.AsNoTracking().Where(fs => fs.IsActive).ToListAsync();
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
        var monitorApi = JobStorage.Current.GetMonitoringApi();
        var stats = await Task.Run(() => monitorApi.GetStatistics());
        
        var failedJobs = await Task.Run(() => monitorApi.FailedJobs(0, 15));
        var recentFailures = failedJobs.Count(j => j.Value.FailedAt.HasValue && DateTime.UtcNow - j.Value.FailedAt.Value < TimeSpan.FromHours(24));

        string hangfireStatus = "Healthy";
        if (recentFailures > 5)
        {
            hangfireStatus = "Failed";
        }
        else if (recentFailures > 0)
        {
            hangfireStatus = "Warning";
        }

        var health = new SystemHealthDto(
            DatabaseStatus: dbStatus,
            Hangfire: new HangfireHealthDto(
                Status: hangfireStatus,
                FailedCount: stats.Failed,
                ProcessingCount: stats.Processing,
                EnqueuedCount: stats.Enqueued,
                ScheduledCount: stats.Scheduled
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

        return Ok(health);
    }

    /// <summary>
    /// Clears all stored sync errors from tenants, monitors, and global configuration.
    /// </summary>
    [HttpPost("clear-errors")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> ClearErrors()
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        
        await db.Tenants
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.LastSyncError, (string?)null));
            
        await db.Monitors
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.LastSyncError, (string?)null));
            
        await db.GlobalConfigs
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.LastSyncError, (string?)null));

        await db.FeedSources
            .ExecuteUpdateAsync(s => s.SetProperty(fs => fs.LastSyncError, (string?)null));
            
        return NoContent();
    }

    /// <summary>
    /// Retrieves a list of recent background job executions and their status.
    /// </summary>
    [HttpGet("jobs")]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<IEnumerable<BackgroundJobStatusDto>>> GetRecentJobs()
    {
        var monitorApi = JobStorage.Current.GetMonitoringApi();
        
        var succeeded = await Task.Run(() => monitorApi.SucceededJobs(0, 15));
        var failed = await Task.Run(() => monitorApi.FailedJobs(0, 15));
        var processing = await Task.Run(() => monitorApi.ProcessingJobs(0, 10));

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

        var sorted = list.OrderByDescending(j => j.CreatedAt).Take(20).ToList();
        return Ok(sorted);
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
