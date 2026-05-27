using Api.DTOs.System;
using Hangfire;
using Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

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
    public async Task<ActionResult<SystemHealthDto>> GetHealth()
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        
        string dbStatus = "Healthy";
        DateTimeOffset? lastLitiumSync = null;
        DateTimeOffset? lastFleetUpdate = null;
        DateTimeOffset? lastFleetUptimeUpdate = null;
        DateTimeOffset? lastFleetLatencyUpdate = null;
        string? globalSyncError = null;
        try
        {
            var config = await db.GlobalConfigs.AsNoTracking().FirstOrDefaultAsync();
            lastLitiumSync = config?.LastPolled;
            globalSyncError = config?.LastSyncError;

            lastFleetUpdate = await db.Monitors.MaxAsync(m => m.LastUpdate);
            lastFleetUptimeUpdate = await db.Monitors.MaxAsync(m => m.LastUptimeUpdate);
            lastFleetLatencyUpdate = await db.Monitors.MaxAsync(m => m.LastLatencyUpdate);
        }
        catch
        {
            dbStatus = "Unhealthy";
        }

        var tenantsWithErrors = await db.Tenants.CountAsync(t => t.LastSyncError != null && t.Id != AnalyticsDbContext.SystemTenantGuid);
        var monitorsWithErrors = await db.Monitors.CountAsync(m => m.LastSyncError != null);

        var monitorApi = JobStorage.Current.GetMonitoringApi();
        var stats = await Task.Run(() => monitorApi.GetStatistics());

        var health = new SystemHealthDto(
            DatabaseStatus: dbStatus,
            Hangfire: new HangfireHealthDto(
                FailedCount: stats.Failed,
                ProcessingCount: stats.Processing,
                EnqueuedCount: stats.Enqueued,
                ScheduledCount: stats.Scheduled
            ),
            Sync: new SyncHealthDto(
                TenantsWithErrorsCount: tenantsWithErrors,
                MonitorsWithErrorsCount: monitorsWithErrors,
                GlobalSyncError: globalSyncError
            ),
            LastLitiumSync: lastLitiumSync,
            LastFleetUpdate: lastFleetUpdate,
            LastFleetUptimeUpdate: lastFleetUptimeUpdate,
            LastFleetLatencyUpdate: lastFleetLatencyUpdate
        );

        return Ok(health);
    }
}
