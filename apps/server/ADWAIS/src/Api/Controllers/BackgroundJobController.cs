using Hangfire;
using Hangfire.Storage;
using Adwais.Infrastructure.Jobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Adwais.Infrastructure.Persistence;
using Adwais.Infrastructure.Helpers;
using Adwais.Infrastructure.Jobs.Monitor;
using Adwais.Application.Interfaces;
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
    [Authorize(Policy = "AdminOnly")]
    public ActionResult TriggerMonitorSync()
    {
        RecurringJob.TriggerJob("sync-uptimerobot-fleet");
        return Ok();
    }
    
    /// <summary>
    /// Triggers the UptimeRobot uptime metrics collection job immediately.
    /// </summary>
    [HttpPost("trigger/uptime-sync")]
    [Authorize(Policy = "AdminOnly")]
    public ActionResult TriggerUptimeSync()
    {
        RecurringJob.TriggerJob("dispatch-uptimerobot-uptime");
        return Ok();
    }

    /// <summary>
    /// Triggers the UptimeRobot latency metrics collection job immediately.
    /// </summary>
    [HttpPost("trigger/latency-sync")]
    [Authorize(Policy = "AdminOnly")]
    public ActionResult TriggerLatencySync()
    {
        RecurringJob.TriggerJob("dispatch-uptimerobot-latency");
        return Ok();
    }

    /// <summary>
    /// Triggers the UptimeRobot account statistics synchronization job immediately.
    /// </summary>
    [HttpPost("trigger/user-stats-sync")]
    [Authorize(Policy = "AdminOnly")]
    public ActionResult TriggerUserStatsSync()
    {
        RecurringJob.TriggerJob("sync-uptimerobot-account-stats");
        return Ok();
    }

    /// <summary>
    /// Triggers the Litium order data ingestion job immediately.
    /// </summary>
    [HttpPost("trigger/litium-sync")]
    [Authorize(Policy = "AdminOnly")]
    public ActionResult TriggerLitiumSync()
    {
        RecurringJob.TriggerJob("dispatch-litium-orders");
        return Ok();
    }

    /// <summary>
    /// Triggers a refresh of the financial materialized views.
    /// </summary>
    [HttpPost("trigger/refresh-historic-order-data")]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public ActionResult TriggerMaterialViewRefresh()
    {
        RecurringJob.TriggerJob("refresh-financial-materialized-views");
        return Ok();
    }
    
    /// <summary>
    /// Triggers a refresh of all monitoring materialized views (latency and availability).
    /// </summary>
    [HttpPost("trigger/refresh-monitoring-data")]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public ActionResult TriggerMonitoringMaterialViewRefresh()
    {
        RecurringJob.TriggerJob("refresh-monitoring-materialized-views");
        return Ok();
    }

    /// <summary>
    /// Retrieves a list of all registered recurring jobs and their current schedules.
    /// </summary>
    [HttpGet("recurring")]
    [Authorize(Policy = "KioskOrStaffAccess")]
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
    [Authorize(Policy = "KioskOrStaffAccess")]
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



