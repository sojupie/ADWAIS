using Api.DTOs.BackgroundJob;
using Hangfire;
using Infrastructure.Jobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Infrastructure;
using Infrastructure.Helpers;
using Infrastructure.Jobs.Monitor;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/job")]
    public class BackgroundJobController(
        IDbContextFactory<AnalyticsDbContext> dbContextFactory,
        ISystemEventService eventService) : ControllerBase
    {
        [HttpPost]
        [Route("trigger/monitor-sync")]
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
        
        [HttpPost]
        [Route("trigger/uptime-sync")]
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

        [HttpPost]
        [Route("trigger/latency-sync")]
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

        [HttpPost]
        [Route("trigger/litium-sync")]
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

        [HttpPost]
        [Route("trigger/refresh-historic-order-data")]
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
        
        [HttpPost]
        [Route("trigger/refresh-historic-latency-data")]
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
        
        [HttpPost]
        [Route("update/metrics-fetch-interval")]
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

        [HttpPost]
        [Route("update/litium-fetch-interval")]
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

        [HttpGet]
        [Route("metrics/fetch-intervals")]
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