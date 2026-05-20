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
[Route("api/[controller]")]
    public class BackgroundJobController(IDbContextFactory<AnalyticsDbContext> dbContextFactory) : ControllerBase
    {
        [HttpPost]
        [Route("TriggerMonitorSync")]
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
        [Route("TriggerUptimeSync")]
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
        [Route("TriggerLatencySync")]
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
        [Route("UpdateMonitorSyncRate")]
        public ActionResult UpdateMonitorSyncRate([FromQuery] int minutes = 5)
        {
            RecurringJob.AddOrUpdate<MonitorSynchronizationJob>("sync-uptimerobot-fleet", job => job.ExecuteAsync(), Cron.MinuteInterval(minutes));
            Console.WriteLine("Updated interval to {0} minutes", minutes);
            return Ok();
        }

        [HttpPost]
        [Route("UpdateMetricsSyncRate")]
        public async Task<OkResult> UpdateMetricsSyncRate([FromQuery] int? uptimeMinutes, [FromQuery] int? latencyMinutes)
        {
            string GetCron(int m) => m < 60 ? Cron.MinuteInterval(Math.Max(1, m)) : (m == 60 ? Cron.Hourly() : $"0 */{Math.Max(1, m/60)} * * *");

            await using var dbContext = await dbContextFactory.CreateDbContextAsync();
            var config = dbContext.GlobalConfigs.FirstOrDefault();
            if (config != null)
            {
                if (uptimeMinutes.HasValue)
                {
                    config.UptimeFetchIntervalMinutes = uptimeMinutes.Value;
                    RecurringJob.AddOrUpdate<UptimeDispatcherJob>("dispatch-uptimerobot-uptime", job => job.ExecuteAsync(), GetCron(uptimeMinutes.Value));
                }
                
                if (latencyMinutes.HasValue)
                {
                    config.LatencyFetchIntervalMinutes = latencyMinutes.Value;
                    RecurringJob.AddOrUpdate<LatencyDispatcherJob>("dispatch-uptimerobot-latency", job => job.ExecuteAsync(), GetCron(latencyMinutes.Value));
                }
                
                dbContext.SaveChanges();
            }
            return Ok();
        }

        [HttpGet]
        [Route("RateLimits")]
        public async Task<ActionResult<RateLimits>> GetRateLimit()
        {
            await using var db = await dbContextFactory.CreateDbContextAsync();

            var data = await db.GlobalConfigs
                .AsNoTracking()
                .Select(g => new
                {
                    g.LatencyFetchIntervalMinutes,
                    g.UptimeFetchIntervalMinutes
                })
                .FirstOrDefaultAsync();

            if (data == null) return NotFound("Global config not found");
            
            var lowestInterval = await db.Monitors
                .Where(m => m.TenantId != AnalyticsDbContext.SystemTenantGuid)
                .MinAsync(m => (int?)m.UpdateInterval);

            var lowestIntervalMins = Math.Max(1, (lowestInterval ?? 300) / 60);

            var rateLimits = new RateLimits
            {
                LatencyRateLimit = data.LatencyFetchIntervalMinutes,
                UptimeRateLimit = data.UptimeFetchIntervalMinutes,
                StatusRateLimit = lowestIntervalMins
            };

            return Ok(rateLimits);
        }
    }