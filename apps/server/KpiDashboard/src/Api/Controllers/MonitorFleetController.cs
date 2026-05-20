using Api.DTOs.Monitoring;
using Domain.Entities.Monitoring;
using Infrastructure;
using Infrastructure.CacheModels;
using Infrastructure.Services.Monitoring;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Api.Controllers;

[ApiController]
[Route("api/fleet")]
public class MonitorFleetController(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    IMemoryCache cache,
    IMonitorOrchestrationService monitorService) : ControllerBase
{
    [HttpGet("global")]
    public async Task<ActionResult<IEnumerable<UptimeMonitorDto>>> GetGlobalFleet()
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var monitors = await db.Monitors
            .AsNoTracking()
            .ToListAsync();

        return Ok(HydrateWithCache(monitors.Select(ToDto)));
    }

    [HttpGet("unassigned")]
    public async Task<ActionResult<IEnumerable<UptimeMonitorDto>>> GetUnassignedMonitors()
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var monitors = await db.Monitors
            .AsNoTracking()
            .Where(m => m.TenantId == AnalyticsDbContext.SystemTenantGuid)
            .ToListAsync();

        return Ok(HydrateWithCache(monitors.Select(ToDto)));
    }

    [HttpGet("tenant/{tenantId:guid}")]
    public async Task<ActionResult<IEnumerable<UptimeMonitorDto>>> GetTenantMonitors(Guid tenantId)
    {
        if (tenantId == AnalyticsDbContext.SystemTenantGuid)
        {
            return BadRequest("Can't access (system tenant) unassigned monitors via this end-point");
        }

        await using var db = await dbContextFactory.CreateDbContextAsync();
        var monitors = await db.Monitors
            .AsNoTracking()
            .Where(m => m.TenantId == tenantId)
            .ToListAsync();

        return Ok(HydrateWithCache(monitors.Select(ToDto)));
    }

    [HttpPost("tenant/{tenantId:guid}/monitors")]
    public async Task<ActionResult<UptimeMonitorDto>> CreateMonitor(Guid tenantId,
        [FromBody] CreateMonitorRequestDto request)
    {
        var m = await monitorService.CreateMonitorAsync(tenantId, request.Name, request.Url, request.UptimeSla);
        var dto = ToDto(m);

        return CreatedAtAction(nameof(GetMonitor), new { tenantId, id = m.Id },
            HydrateWithCache(new[] { dto }).First());
    }

    [HttpGet("tenant/{tenantId:guid}/monitors/{id:int}")]
    public async Task<ActionResult<UptimeMonitorDto>> GetMonitor(Guid tenantId, int id)
    {
        var m = await monitorService.GetMonitorAsync(tenantId, id);
        var dto = ToDto(m);

        return Ok(HydrateWithCache([dto]).First());
    }

    [HttpPost("monitors/{id:int}/pause")]
    public async Task<IActionResult> PauseMonitor(int id)
    {
        await monitorService.PauseMonitorAsync(id);
        return Ok();
    }

    [HttpPost("monitors/{id:int}/start")]
    public async Task<IActionResult> StartMonitor(Guid tenantId, int id)
    {
        await monitorService.StartMonitorAsync(id);
        return Ok();
    }

    [HttpGet("tenant/{tenantId:guid}/monitors/{id:int}/latency")]
    public async Task<ActionResult<IEnumerable<LatencyMetricsDto>>> GetLatencyMetrics(
        Guid tenantId,
        int id,
        [FromQuery] DateTimeOffset from,
        [FromQuery] DateTimeOffset to)
    {
        var metrics = await monitorService.GetAggregatedLatencyAsync(tenantId, id, from, to);
        return Ok(metrics);
    }

    private IEnumerable<UptimeMonitorDto> HydrateWithCache(IEnumerable<UptimeMonitorDto> monitors)
    {
        return monitors.Select(m =>
        {
            var hasLiveState = cache.TryGetValue(GlobalCacheKeys.MonitorState(m.Id), out LiveMonitorState? state);
            return m with { CurrentStatus = hasLiveState && state != null ? state.StatusStr : "Unknown" };
        });
    }

    private static UptimeMonitorDto ToDto(UptimeMonitor m)
    {
        return new UptimeMonitorDto(
            Id: m.Id,
            TenantId: m.TenantId,
            Name: m.Name,
            Url: m.Url,
            UpdateInterval: m.UpdateInterval,
            UptimeSla: m.UptimeSla,
            UptimeMonitorEnabled: m.UptimeMonitorEnabled,
            CurrentStatus: "Unknown",
            CurrentUptimePercentage: m.CurrentUptimePercentage,
            LastUpdate: m.LastUpdate,
            LastUptimeUpdate: m.LastUptimeUpdate,
            LastLatencyUpdate: m.LastLatencyUpdate,
            CreatedDate: m.CreatedDate);
    }
}