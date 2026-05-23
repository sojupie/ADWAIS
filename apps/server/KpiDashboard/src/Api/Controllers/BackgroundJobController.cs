using Api.DTOs.BackgroundJob;
using Hangfire;
using Infrastructure.Jobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Infrastructure;
using Infrastructure.Helpers;
using Infrastructure.Jobs.Monitor;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

/// <summary>
/// Provides administrative endpoints to manually trigger or configure background jobs.
/// </summary>
[ApiController]
[Route("api/job")]
public class BackgroundJobController(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    ISystemEventService eventService) : ControllerBase
{
    /// <summary>
    /// Triggers the UptimeRobot monitor synchronization job immediately.
    /// </summary>
    [HttpPost("trigger/monitor-sync")]
    public ActionResult TriggerMonitorSync()
    {
        try
        {
            RecurringJob.TriggerJob("sync-uptimerobot-fleet");
            return Ok();
        }
        catch (Exception exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Failed to trigger monitor sync", detail = exception.Message });
        }
    }
    
    /// <summary>
    /// Triggers the UptimeRobot uptime metrics collection job immediately.
    /// </summary>
    [HttpPost("trigger/uptime-sync")]
    public ActionResult TriggerUptimeSync()
    {
        try
        {
            RecurringJob.TriggerJob("dispatch-uptimerobot-uptime");
            return Ok();
        }
        catch (Exception exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Failed to trigger uptime sync", detail = exception.Message });
        }
    }

    /// <summary>
    /// Triggers the UptimeRobot latency metrics collection job immediately.
    /// </summary>
    [HttpPost("trigger/latency-sync")]
    public ActionResult TriggerLatencySync()
    {
        try
        {
            RecurringJob.TriggerJob("dispatch-uptimerobot-latency");
            return Ok();
        }
        catch (Exception exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Failed to trigger latency sync", detail = exception.Message });
        }
    }

    /// <summary>
    /// Triggers the Litium order data ingestion job immediately.
    /// </summary>
    [HttpPost("trigger/litium-sync")]
    public ActionResult TriggerLitiumSync()
    {
        try
        {
            RecurringJob.TriggerJob("dispatch-litium-orders");
            return Ok();
        }
        catch (Exception exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Failed to trigger Litium sync", detail = exception.Message });
        }
    }

    /// <summary>
    /// Triggers a refresh of the financial materialized views.
    /// </summary>
    [HttpPost("trigger/refresh-historic-order-data")]
    public ActionResult TriggerMaterialViewRefresh()
    {
        try
        {
            RecurringJob.TriggerJob("refresh-financial-materialized-views");
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { error = "Failed to trigger materialized view refresh", detail = e.Message });
        }
    }
    
    /// <summary>
    /// Triggers a refresh of the latency materialized views.
    /// </summary>
    [HttpPost("trigger/refresh-historic-latency-data")]
    public ActionResult TriggerLatencyMaterialViewRefresh()
    {
        try
        {
            RecurringJob.TriggerJob("refresh-latency-materialized-views");
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { error = "Failed to trigger materialized view refresh", detail = e.Message });
        }
    }
    
    /// <summary>
    /// Updates the global fetch intervals for monitoring metrics.
    /// </summary>
    /// <param name="uptimeMinutes">The new uptime fetch interval in minutes.</param>
    /// <param name="latencyMinutes">The new latency fetch interval in minutes.</param>
    [HttpPost("update/metrics-fetch-interval")]
    public async Task<OkResult> UpdateMetricsFetchInterval([FromQuery] int? uptimeMinutes, [FromQuery] int? latencyMinutes)
    {
        await using var dbContext = await dbContextFactory.CreateDbContextAsync();
        var config = dbContext.GlobalConfigs.SingleOrDefault();
        if (config != null)
        {
            if (uptimeMinutes.HasValue)
            {
                config.UptimeFetchIntervalMinutes = uptimeMinutes.Value;
                RecurringJob.AddOrUpdate<UptimeDispatcherJob>("dispatch-uptimerobot-uptime", job => job.ExecuteAsync(), CronHelper.FromMinutes(uptimeMinutes.Value));
                await eventService.LogAsync(nameof(BackgroundJobController), $"Updated Uptime Fetch Interval to {uptimeMinutes} minutes");
            }
            
            if (latencyMinutes.HasValue)
            {
                config.LatencyFetchIntervalMinutes = latencyMinutes.Value;
                RecurringJob.AddOrUpdate<LatencyDispatcherJob>("dispatch-uptimerobot-latency", job => job.ExecuteAsync(), CronHelper.FromMinutes(latencyMinutes.Value));
                await eventService.LogAsync(nameof(BackgroundJobController), $"Updated Latency Fetch Interval to {latencyMinutes} minutes");
            }
            
            dbContext.SaveChanges();
        }
        return Ok();
    }

    /// <summary>
    /// Updates the global fetch interval for Litium order data.
    /// </summary>
    /// <param name="minutes">The new fetch interval in minutes.</param>
    [HttpPost("update/litium-fetch-interval")]
    public async Task<ActionResult> UpdateLitiumFetchInterval([FromQuery] int minutes)
    {
        await using var dbContext = await dbContextFactory.CreateDbContextAsync();
        var config = dbContext.GlobalConfigs.SingleOrDefault();
        if (config == null) return NotFound("Global config not found.");

        config.LitiumFetchIntervalMinutes = minutes;
        dbContext.SaveChanges();

        RecurringJob.AddOrUpdate<LitiumOrderFetchJob>("dispatch-litium-orders", job => job.ExecuteAsync(), CronHelper.FromMinutes(minutes));
        
        await eventService.LogAsync(nameof(BackgroundJobController), $"Updated Litium Fetch Interval to {minutes} minutes");

        return Ok();
    }

    /// <summary>
    /// Retrieves the current global fetch intervals for all background jobs.
    /// </summary>
    [HttpGet("metrics/fetch-intervals")]
    public async Task<ActionResult<FetchIntervalsDto>> GetFetchIntervals()
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();

        var data = await db.GlobalConfigs
            .AsNoTracking()
            .Select(g => new
            {
                g.LatencyFetchIntervalMinutes,
                g.UptimeFetchIntervalMinutes,
                g.LitiumFetchIntervalMinutes
            })
            .SingleOrDefaultAsync();

        if (data == null) return NotFound("Global config not found");
        
        var lowestInterval = await db.Monitors
            .Where(m => m.TenantId != AnalyticsDbContext.SystemTenantGuid)
            .MinAsync(m => (int?)m.UpdateInterval);

        var lowestIntervalMins = Math.Max(1, (lowestInterval ?? 300) / 60);

        var fetchIntervals = new FetchIntervalsDto
        {
            LatencyFetchIntervalMinutes = data.LatencyFetchIntervalMinutes,
            UptimeFetchIntervalMinutes = data.UptimeFetchIntervalMinutes,
            StatusFetchIntervalMinutes = lowestIntervalMins,
            LitiumFetchIntervalMinutes = data.LitiumFetchIntervalMinutes
        };

        return Ok(fetchIntervals);
    }
}
