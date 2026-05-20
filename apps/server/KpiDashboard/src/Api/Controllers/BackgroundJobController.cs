using Api.DTOs.BackgroundJob;
using Hangfire;
using Infrastructure.Jobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/job")]
    public class BackgroundJobController(IDbContextFactory<AnalyticsDbContext> dbContextFactory) : ControllerBase
    {
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
        [Route("update/monitor-sync-rate")]
        public ActionResult UpdateMonitorSyncRate([FromQuery] int minutes = 5)
        {
            RecurringJob.AddOrUpdate<MonitorSynchronizationJob>("sync-uptimerobot-fleet", job => job.ExecuteAsync(), Cron.MinuteInterval(minutes));
            Console.WriteLine("Updated interval to {0} minutes", minutes);
            return Ok();
        }

        [HttpPost]
        [Route("update/metrics-sync-rate")]
        public async Task<OkResult> UpdateMetricsSyncRate([FromQuery] int? uptimeMinutes, [FromQuery] int? latencyMinutes)
        {


            await using var dbContext = await dbContextFactory.CreateDbContextAsync();
            var config = dbContext.GlobalConfigs.SingleOrDefault();
            if (config != null)
            {
                if (uptimeMinutes.HasValue)
                {
                    config.UptimeFetchIntervalMinutes = uptimeMinutes.Value;
                    RecurringJob.AddOrUpdate<UptimeDispatcherJob>("dispatch-uptimerobot-uptime", job => job.ExecuteAsync(), CronHelper.FromMinutes(uptimeMinutes.Value));
                }
                
                if (latencyMinutes.HasValue)
                {
                    config.LatencyFetchIntervalMinutes = latencyMinutes.Value;
                    RecurringJob.AddOrUpdate<LatencyDispatcherJob>("dispatch-uptimerobot-latency", job => job.ExecuteAsync(), CronHelper.FromMinutes(latencyMinutes.Value));
                }
                
                dbContext.SaveChanges();
            }
            return Ok();
        }

        [HttpPost]
        [Route("update/litium-sync-rate")]
        public async Task<ActionResult> UpdateLitiumSyncRate([FromQuery] int minutes)
        {


            await using var dbContext = await dbContextFactory.CreateDbContextAsync();
            var config = dbContext.GlobalConfigs.SingleOrDefault();
            if (config == null) return NotFound("Global config not found.");

            config.LitiumRateLimit = minutes;
            dbContext.SaveChanges();

            RecurringJob.AddOrUpdate<LitiumOrderFetchJob>("dispatch-litium-orders", job => job.ExecuteAsync(), CronHelper.FromMinutes(minutes));
            return Ok();
        }

        [HttpGet]
        [Route("metrics/rate-limits")]
        public async Task<ActionResult<RateLimits>> GetRateLimit()
        {
            await using var db = await dbContextFactory.CreateDbContextAsync();

            var data = await db.GlobalConfigs
                .AsNoTracking()
                .Select(g => new
                {
                    g.LatencyFetchIntervalMinutes,
                    g.UptimeFetchIntervalMinutes,
                    g.LitiumRateLimit
                })
                .SingleOrDefaultAsync();

            if (data == null) return NotFound("Global config not found");
            
            var lowestInterval = await db.Monitors
                .Where(m => m.TenantId != AnalyticsDbContext.SystemTenantGuid)
                .MinAsync(m => (int?)m.UpdateInterval);

            var lowestIntervalMins = Math.Max(1, (lowestInterval ?? 300) / 60);

            var rateLimits = new RateLimits
            {
                LatencyRateLimit = data.LatencyFetchIntervalMinutes,
                UptimeRateLimit = data.UptimeFetchIntervalMinutes,
                StatusRateLimit = lowestIntervalMins,
                LitiumRateLimit = data.LitiumRateLimit
            };

            return Ok(rateLimits);
        }
        
        
    }