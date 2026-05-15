using Api.DTOs.Monitoring;
using Domain.Entities.Monitoring;
using Infrastructure;
using Infrastructure.CacheModels;
using Infrastructure.Services.Monitoring.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Api.Controllers;

[ApiController]
[Route("api/fleet")]
public class FleetController(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    IMemoryCache cache) : ControllerBase
{
    [HttpGet("global")]
    public async Task<ActionResult<IEnumerable<UptimeRobotMonitorDto>>> GetGlobalFleet()
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var monitors = await db.Monitors.AsNoTracking().ToListAsync();
        return Ok(HydrateWithCache(monitors));
    }

    [HttpGet("unassigned")]
    public async Task<ActionResult<IEnumerable<UptimeRobotMonitorDto>>> GetUnassignedMonitors()
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var monitors = await db.Monitors.AsNoTracking()
            .Where(m => m.TenantId == AnalyticsDbContext.SystemTenantGuid)
            .ToListAsync();
        return Ok(HydrateWithCache(monitors));
    }

    [HttpGet("tenant/{tenantId:guid}")]
    public async Task<ActionResult<IEnumerable<UptimeRobotMonitorDto>>> GetTenantMonitors(Guid tenantId)
    {
        if (tenantId == AnalyticsDbContext.SystemTenantGuid)
        {
            return Forbid();
        }

        await using var db = await dbContextFactory.CreateDbContextAsync();
        var monitors = await db.Monitors.AsNoTracking()
            .Where(m => m.TenantId == tenantId)
            .ToListAsync();
        return Ok(HydrateWithCache(monitors));
    }

    private IEnumerable<UptimeMonitorDto> HydrateWithCache(IEnumerable<UptimeMonitor> monitors)
    {
        return monitors.Select(m =>
        {
            var hasLiveState = cache.TryGetValue(MonitorCacheKeys.MonitorState(m.Id), out LiveMonitorState? state);
            return new UptimeMonitorDto(
                m.Id,
                m.TenantId,
                m.Name,
                m.Url,
                m.UptimeSla,
                m.UptimeMonitorEnabled,
                hasLiveState && state != null ? state.StatusStr : "Unknown",
                0.0,
                m.CreatedDate);
        });
    }
}