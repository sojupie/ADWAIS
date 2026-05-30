using Adwais.Api.DTOs.BackgroundJob;
using Adwais.Api.DTOs.GlobalConfig;
using Hangfire;
using Hangfire.Storage;
using Adwais.Infrastructure.Jobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Adwais.Infrastructure;
using Adwais.Infrastructure.Helpers;
using Adwais.Infrastructure.Jobs.Monitor;
using Adwais.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Api.Controllers;

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
        RecurringJob.TriggerJob("sync-uptimerobot-fleet");
        return Ok();
    }
    
    /// <summary>
    /// Triggers the UptimeRobot uptime metrics collection job immediately.
    /// </summary>
    [HttpPost("trigger/uptime-sync")]
    public ActionResult TriggerUptimeSync()
    {
        RecurringJob.TriggerJob("dispatch-uptimerobot-uptime");
        return Ok();
    }

    /// <summary>
    /// Triggers the UptimeRobot latency metrics collection job immediately.
    /// </summary>
    [HttpPost("trigger/latency-sync")]
    public ActionResult TriggerLatencySync()
    {
        RecurringJob.TriggerJob("dispatch-uptimerobot-latency");
        return Ok();
    }

    /// <summary>
    /// Triggers the UptimeRobot account statistics synchronization job immediately.
    /// </summary>
    [HttpPost("trigger/user-stats-sync")]
    public ActionResult TriggerUserStatsSync()
    {
        RecurringJob.TriggerJob("sync-uptimerobot-account-stats");
        return Ok();
    }

    /// <summary>
    /// Triggers the Litium order data ingestion job immediately.
    /// </summary>
    [HttpPost("trigger/litium-sync")]
    public ActionResult TriggerLitiumSync()
    {
        RecurringJob.TriggerJob("dispatch-litium-orders");
        return Ok();
    }

    /// <summary>
    /// Triggers a refresh of the financial materialized views.
    /// </summary>
    [HttpPost("trigger/refresh-historic-order-data")]
    public ActionResult TriggerMaterialViewRefresh()
    {
        RecurringJob.TriggerJob("refresh-financial-materialized-views");
        return Ok();
    }
    
    /// <summary>
    /// Triggers a refresh of all monitoring materialized views (latency and availability).
    /// </summary>
    [HttpPost("trigger/refresh-monitoring-data")]
    public ActionResult TriggerMonitoringMaterialViewRefresh()
    {
        RecurringJob.TriggerJob("refresh-monitoring-materialized-views");
        return Ok();
    }

    /// <summary>
    /// Updates the global fetch intervals for all background jobs.
    /// Returns the updated list of intervals.
    /// </summary>
    /// <param name="request">The request containing the new intervals to set.</param>
    [HttpPatch("update/intervals")]
    public async Task<ActionResult<FetchIntervalsDto>> UpdateFetchIntervals([FromBody] UpdateFetchIntervalsRequestDto? request)
    {
        if (request == null) return BadRequest("Request body cannot be null.");

        await using var dbContext = await dbContextFactory.CreateDbContextAsync();
        var config = await dbContext.GlobalConfigs.SingleOrDefaultAsync();
        
        if (config == null) return NotFound("Global configuration not found.");
        
        if (request.UptimeFetchIntervalMinutes.HasValue)
        {
            config.UptimeFetchIntervalMinutes = request.UptimeFetchIntervalMinutes.Value;
            RecurringJob.AddOrUpdate<UptimeDispatcherJob>("dispatch-uptimerobot-uptime", job => job.ExecuteAsync(), CronHelper.FromMinutes(request.UptimeFetchIntervalMinutes.Value));
            await eventService.LogAsync(nameof(BackgroundJobController), $"Updated Uptime Fetch Interval to {request.UptimeFetchIntervalMinutes.Value} minutes");
        }
            
        if (request.LatencyFetchIntervalMinutes.HasValue)
        {
            config.LatencyFetchIntervalMinutes = request.LatencyFetchIntervalMinutes.Value;
            RecurringJob.AddOrUpdate<LatencyDispatcherJob>("dispatch-uptimerobot-latency", job => job.ExecuteAsync(), CronHelper.FromMinutes(request.LatencyFetchIntervalMinutes.Value));
            await eventService.LogAsync(nameof(BackgroundJobController), $"Updated Latency Fetch Interval to {request.LatencyFetchIntervalMinutes.Value} minutes");
        }

        if (request.UserStatsFetchIntervalMinutes.HasValue)
        {
            config.UserStatsFetchIntervalMinutes = request.UserStatsFetchIntervalMinutes.Value;
            RecurringJob.AddOrUpdate<UpdateGlobalUptimeRobotUserStatsJob>("sync-uptimerobot-account-stats", job => job.ExecuteAsync(), CronHelper.FromMinutes(request.UserStatsFetchIntervalMinutes.Value));
            await eventService.LogAsync(nameof(BackgroundJobController), $"Updated User Stats Fetch Interval to {request.UserStatsFetchIntervalMinutes.Value} minutes");
        }
            
        if (request.LitiumFetchIntervalMinutes.HasValue)
        {
            config.LitiumFetchIntervalMinutes = request.LitiumFetchIntervalMinutes.Value;
            RecurringJob.AddOrUpdate<LitiumOrderFetchJob>("dispatch-litium-orders", job => job.ExecuteAsync(), CronHelper.FromMinutes(request.LitiumFetchIntervalMinutes.Value));
            await eventService.LogAsync(nameof(BackgroundJobController), $"Updated Litium Fetch Interval to {request.LitiumFetchIntervalMinutes.Value} minutes");
        }
            
        await dbContext.SaveChangesAsync();
        return await GetFetchIntervals();
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
                g.LitiumFetchIntervalMinutes,
                g.UserStatsFetchIntervalMinutes
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
            LitiumFetchIntervalMinutes = data.LitiumFetchIntervalMinutes,
            UserStatsFetchIntervalMinutes = data.UserStatsFetchIntervalMinutes
        };

        return Ok(fetchIntervals);
    }

    /// <summary>
    /// Retrieves a list of all registered recurring jobs and their current schedules.
    /// </summary>
    [HttpGet("recurring")]
    public async Task<ActionResult> GetRecurringJobs()
    {
        var recurringJobs = await Task.Run(() => JobStorage.Current.GetConnection().GetRecurringJobs());
        return Ok(recurringJobs.Select(j => new
        {
            j.Id,
            j.Cron,
            j.LastExecution,
            j.NextExecution,
            j.LastJobState,
            j.Queue
        }));
    }

    /// <summary>
    /// Retrieves the status and history of a specific background job.
    /// </summary>
    /// <param name="jobId">The Hangfire Job ID.</param>
    [HttpGet("status/{jobId}")]
    public async Task<ActionResult> GetJobStatus(string jobId)
    {
        var monitoringApi = JobStorage.Current.GetMonitoringApi();
        var jobDetails = await Task.Run(() => monitoringApi.JobDetails(jobId));

        if (jobDetails == null) return NotFound("Job not found.");

        var history = jobDetails.History.OrderByDescending(h => h.CreatedAt).ToList();
        var latestState = history.FirstOrDefault();

        return Ok(new
        {
            JobId = jobId,
            State = latestState?.StateName,
            Reason = latestState?.Reason,
            CreatedAt = jobDetails.CreatedAt,
            History = history.Select(h => new
            {
                h.StateName,
                h.CreatedAt,
                h.Reason
            })
        });
    }
}


