using Adwais.Api.DTOs.Monitoring;
using Adwais.Domain.Entities.Monitoring;
using Adwais.Domain.Enums;
using Adwais.Infrastructure;
using Adwais.Infrastructure.Services.Monitoring;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Api.Controllers;

/// <summary>
/// Manages uptime monitors and retrieves monitoring metrics.
/// </summary>
[ApiController]
[Route("api/monitors")]
public class MonitorController(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    IMonitorOrchestrationService monitorService) : ControllerBase
{
    /// <summary>
    /// Unified analytics endpoint for monitoring data.
    /// Provides latency time-series and filtered monitor lists hydrated with uptime for the specified timeframe (defaults to T30).
    /// </summary>
    [HttpGet("analytics")]
    public async Task<ActionResult<MonitorAnalyticsResponseDto>> GetAnalytics([FromQuery] MonitorRequestDto request)
    {
        var result = await monitorService.GetAnalyticsAsync(request.Timeframe, request.TenantId, request.MonitorId);

        return Ok(new MonitorAnalyticsResponseDto(
            result.GlobalAverageLatency,
            result.LatencyPoints.Select(p => new LatencyPointResponseDto(
                p.Label,
                p.Timestamp,
                p.Average,
                p.PreviousAverage,
                p.Lowest,
                p.Highest)).ToList(),
            result.Monitors.Select(ToDto).ToList()
        ));
    }

    /// <summary>
    /// Retrieves monitors, optionally filtered by tenant or specific monitor ID.
    /// Returns monitors hydrated with uptime for the specified timeframe (defaults to T30).
    /// </summary>
    /// <param name="tenantId">Optional tenant ID to filter by.</param>
    /// <param name="id">Optional monitor ID to retrieve a single monitor.</param>
    /// <param name="timeframe">The timeframe for calculating uptime percentage.</param>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UptimeMonitorDto>>> GetMonitors([FromQuery] MonitorRequestDto request)
    {
        if (request.MonitorId.HasValue)
        {
            await using var db = await dbContextFactory.CreateDbContextAsync();
            var tid = await db.Monitors.Where(m => m.Id == request.MonitorId.Value).Select(m => m.TenantId).SingleOrDefaultAsync();
            if (tid == default) return Ok(Enumerable.Empty<UptimeMonitorDto>());

            var m = await monitorService.GetMonitorAsync(tid, request.MonitorId.Value, request.Timeframe);
            return Ok(new[] { ToDto(m) });
        }

        if (request.TenantId.HasValue)
        {
            var monitors = await monitorService.GetMonitorsByTenantAsync(request.TenantId.Value, request.Timeframe);
            return Ok(monitors.Select(ToDto));
        }

        await using var dbCtx = await dbContextFactory.CreateDbContextAsync();
        var allMonitorIds = await dbCtx.Monitors
            .AsNoTracking()
            .Where(m => m.TenantId != AnalyticsDbContext.SystemTenantGuid)
            .Select(m => new { m.Id, m.TenantId })
            .ToListAsync();
        
        var dtos = new List<UptimeMonitorDto>();
        foreach (var m in allMonitorIds)
        {
            var hydrated = await monitorService.GetMonitorAsync(m.TenantId, m.Id, request.Timeframe);
            dtos.Add(ToDto(hydrated));
        }

        return Ok(dtos);
    }

    /// <summary>
    /// Retrieves monitors that are not assigned to any specific tenant.
    /// </summary>
    /// <param name="timeframe">The timeframe for calculating uptime percentage.</param>
    [HttpGet("unassigned")]
    public async Task<ActionResult<IEnumerable<UptimeMonitorDto>>> GetUnassignedMonitors([FromQuery] Timeframe timeframe = Timeframe.T30)
    {
        var monitors = await monitorService.GetMonitorsByTenantAsync(AnalyticsDbContext.SystemTenantGuid, timeframe);
        return Ok(monitors.Select(ToDto));
    }

    /// <summary>
    /// Creates a new uptime monitor in UptimeRobot and registers it in the system.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<UptimeMonitorDto>> CreateMonitor(
        [FromQuery] Guid tenantId,
        [FromBody] CreateMonitorRequestDto request)
    {
        var m = await monitorService.CreateMonitorAsync(tenantId, request.Name, request.Url, request.UptimeSla);
        return CreatedAtAction(nameof(GetMonitors), new { id = m.Id }, ToDto(m));
    }

    /// <summary>
    /// Reassigns a monitor to a different tenant.
    /// </summary>
    [HttpPatch("{id:int}/assign/{tenantId:guid}")]
    public async Task<IActionResult> AssignMonitor(int id, Guid tenantId)
    {
        await monitorService.AssignMonitorAsync(id, tenantId);
        return Ok();
    }

    /// <summary>
    /// Moves a monitor to the unassigned (system) tenant.
    /// </summary>
    [HttpPatch("{id:int}/unassign")]
    public async Task<IActionResult> UnassignMonitor(int id)
    {
        await monitorService.AssignMonitorAsync(id, AnalyticsDbContext.SystemTenantGuid);
        return Ok();
    }

    /// <summary>
    /// Pauses monitoring for a specific monitor in UptimeRobot.
    /// </summary>
    [HttpPost("{id:int}/pause")]
    public async Task<IActionResult> PauseMonitor(int id)
    {
        await monitorService.PauseMonitorAsync(id);
        return Ok();
    }

    /// <summary>
    /// Resumes monitoring for a specific monitor in UptimeRobot.
    /// </summary>
    [HttpPost("{id:int}/start")]
    public async Task<IActionResult> StartMonitor(int id)
    {
        await monitorService.StartMonitorAsync(id);
        return Ok();
    }

    /// <summary>
    /// Deletes a monitor from both the system and UptimeRobot.
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteMonitor(int id, [FromQuery] Guid? tenantId)
    {
        if (!tenantId.HasValue)
        {
            await using var db = await dbContextFactory.CreateDbContextAsync();
            tenantId = await db.Monitors.Where(m => m.Id == id).Select(m => m.TenantId).SingleOrDefaultAsync();
        }

        if (tenantId == default) return NotFound();

        await monitorService.DeleteMonitorAsync(tenantId.Value, id);
        return NoContent();
    }

    /// <summary>
    /// Retrieves aggregated latency metrics for a specific monitor.
    /// </summary>
    [HttpGet("{id:int}/latency")]
    public async Task<ActionResult<IEnumerable<LatencyMetricsDto>>> GetLatencyMetrics(
        int id,
        [FromQuery] DateTimeOffset from,
        [FromQuery] DateTimeOffset to,
        [FromQuery] Guid? tenantId = null)
    {
        if (!tenantId.HasValue)
        {
             await using var db = await dbContextFactory.CreateDbContextAsync();
             tenantId = await db.Monitors.Where(m => m.Id == id).Select(m => m.TenantId).SingleOrDefaultAsync();
        }

        var metrics = await monitorService.GetAggregatedLatencyAsync(tenantId.Value, id, from, to);
        return Ok(metrics);
    }

    /// <summary>
    /// Updates monitor properties, such as SLA.
    /// </summary>
    [HttpPatch("{id:int}")]
    public async Task<ActionResult<UptimeMonitorDto>> UpdateMonitor(int id, [FromBody] UpdateMonitorRequestDto request)
    {
        await monitorService.UpdateMonitorSlaAsync(id, request.Sla);
        
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var tenantId = await db.Monitors.Where(m => m.Id == id).Select(m => m.TenantId).SingleOrDefaultAsync();
        if (tenantId == default) return NotFound();

        var m = await monitorService.GetMonitorAsync(tenantId, id);
        return Ok(ToDto(m));
    }

    private static UptimeMonitorDto ToDto(UptimeMonitor m)
    {
        return new UptimeMonitorDto(
            Id: m.Id,
            TenantId: m.TenantId,
            TenantName: m.Tenant?.Name,
            Name: m.Name,
            Url: m.Url,
            UpdateInterval: m.UpdateInterval,
            LatencyDegradedFloor: m.LatencyDegradedFloor,
            UptimeSla: m.UptimeSla,
            CurrentUptimePercentage: m.CurrentUptimePercentage,
            CurrentLatency: m.CurrentLatency,
            UptimeMonitorEnabled: m.UptimeMonitorEnabled,
            CurrentStatus: m.StatusStr, // Guaranteed by InMemoryCache service
            LastUpdate: m.LastUpdate,
            LastUptimeUpdate: m.LastUptimeUpdate,
            LastLatencyUpdate: m.LastLatencyUpdate,
            CreatedDate: m.CreatedDate,
            LastSyncError: m.LastSyncError);
    }
}


