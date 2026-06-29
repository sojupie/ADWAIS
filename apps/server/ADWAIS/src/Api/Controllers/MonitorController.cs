using Adwais.Api.DTOs.Monitoring;
using Adwais.Domain.Entities.Monitoring;
using Adwais.Domain.Enums;
using Adwais.Infrastructure.Persistence;
using Adwais.Application.Interfaces;
using Adwais.Application.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
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
    private async Task<bool> IsUptimeRobotConfiguredAsync(CancellationToken ct)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(ct);
        var config = await db.GlobalConfigs.AsNoTracking().SingleOrDefaultAsync(ct);
        return config != null && !string.IsNullOrWhiteSpace(config.UptimeRobotApiKey);
    }
    /// <summary>
    /// Unified analytics endpoint for monitoring data.
    /// Provides latency time-series and filtered monitor lists hydrated with uptime for the specified timeframe (defaults to T30).
    /// </summary>
    [HttpGet("analytics")]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<MonitorAnalyticsResponseDto>> GetAnalytics([FromQuery] MonitorRequestDto request, CancellationToken ct = default)
    {
        var period = TimeframeResolver.Resolve(request.Timeframe, request.Comparison);
        var result = await monitorService.GetAnalyticsAsync(period, request.TenantId, request.MonitorId, ct);

        return Ok(new MonitorAnalyticsResponseDto(
            result.GlobalAverageLatency,
            result.LatencyPoints.Select(p => new LatencyPointResponseDto(
                p.Timestamp,
                p.Average,
                p.PreviousAverage,
                p.Lowest,
                p.Highest)).ToList(),
            result.Monitors.Select(ToDto).ToList(),
            new MonitorKpiResponseDto(
                result.Kpis.AverageUptime,
                result.Kpis.PreviousAverageUptime,
                result.Kpis.UptimeGrowthPercentage,
                result.Kpis.AverageLatency,
                result.Kpis.PreviousAverageLatency,
                result.Kpis.LatencyGrowthPercentage,
                result.Kpis.HighestLatency,
                result.Kpis.PreviousHighestLatency,
                result.Kpis.HighestLatencyGrowthPercentage,
                result.Kpis.LowestLatency,
                result.Kpis.PreviousLowestLatency,
                result.Kpis.LowestLatencyGrowthPercentage)
        ));
    }

    /// <summary>
    /// Retrieves monitors, optionally filtered by tenant or specific monitor ID.
    /// Returns monitors hydrated with uptime for the specified timeframe (defaults to T30).
    /// </summary>
    /// <param name="request">The request containing query filters and timeframe.</param>
    /// <param name="ct">Cancellation token</param>
    [HttpGet]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<IEnumerable<UptimeMonitorDto>>> GetMonitors([FromQuery] MonitorRequestDto request, CancellationToken ct = default)
    {
        var period = TimeframeResolver.Resolve(request.Timeframe, request.Comparison);

        if (request.MonitorId.HasValue)
        {
            await using var db = await dbContextFactory.CreateDbContextAsync(ct);
            var tid = await db.Monitors.Where(m => m.Id == request.MonitorId.Value).Select(m => (Guid?)m.TenantId).SingleOrDefaultAsync(ct);
            if (tid == null) return Ok(Enumerable.Empty<UptimeMonitorDto>());

            var m = await monitorService.GetMonitorAsync(tid.Value, request.MonitorId.Value, period, ct);
            return Ok(new[] { ToDto(m) });
        }

        if (request.TenantId.HasValue)
        {
            var monitors = await monitorService.GetMonitorsByTenantAsync(request.TenantId.Value, period, ct);
            return Ok(monitors.Select(ToDto));
        }

        await using var dbCtx = await dbContextFactory.CreateDbContextAsync(ct);
        var allMonitorIds = await dbCtx.Monitors
            .AsNoTracking()
            .Where(m => m.TenantId != AnalyticsDbContext.SystemTenantGuid)
            .Select(m => new { m.Id, m.TenantId })
            .ToListAsync(ct);
        
        var dtos = new List<UptimeMonitorDto>();
        foreach (var m in allMonitorIds)
        {
            var hydrated = await monitorService.GetMonitorAsync(m.TenantId, m.Id, period, ct);
            dtos.Add(ToDto(hydrated));
        }

        return Ok(dtos);
    }

    /// <summary>
    /// Retrieves monitors that are not assigned to any specific tenant.
    /// </summary>
    /// <param name="timeframe">The timeframe for calculating uptime percentage.</param>
    /// <param name="ct">Cancellation token</param>
    /// <param name="comparison">The comparison period type.</param>
    [HttpGet("unassigned")]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<IEnumerable<UptimeMonitorDto>>> GetUnassignedMonitors([FromQuery] Timeframe timeframe = Timeframe.T30, [FromQuery] ComparisonType comparison = ComparisonType.Preceding, CancellationToken ct = default)
    {
        var period = TimeframeResolver.Resolve(timeframe, comparison);
        var monitors = await monitorService.GetMonitorsByTenantAsync(AnalyticsDbContext.SystemTenantGuid, period, ct);
        return Ok(monitors.Select(ToDto));
    }

    /// <summary>
    /// Creates a new uptime monitor in UptimeRobot and registers it in the system.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<UptimeMonitorDto>> CreateMonitor(
        [FromQuery] Guid tenantId,
        [FromBody] CreateMonitorRequestDto request,
        CancellationToken ct = default)
    {
        if (!await IsUptimeRobotConfiguredAsync(ct)) return BadRequest("UptimeRobot API key is not configured.");
        var m = await monitorService.CreateMonitorAsync(tenantId, request.Name, request.Url, request.UptimeSla, ct);
        return CreatedAtAction(nameof(GetMonitors), new { id = m.Id }, ToDto(m));
    }

    /// <summary>
    /// Reassigns a monitor to a different tenant.
    /// </summary>
    [HttpPatch("{id:int}/assign/{tenantId:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> AssignMonitor(int id, Guid tenantId, CancellationToken ct = default)
    {
        await monitorService.AssignMonitorAsync(id, tenantId, ct);
        return Ok();
    }

    /// <summary>
    /// Moves a monitor to the unassigned (system) tenant.
    /// </summary>
    [HttpPatch("{id:int}/unassign")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UnassignMonitor(int id, CancellationToken ct = default)
    {
        await monitorService.AssignMonitorAsync(id, AnalyticsDbContext.SystemTenantGuid, ct);
        return Ok();
    }

    /// <summary>
    /// Pauses monitoring for a specific monitor in UptimeRobot.
    /// </summary>
    [HttpPost("{id:int}/pause")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> PauseMonitor(int id, CancellationToken ct = default)
    {
        if (!await IsUptimeRobotConfiguredAsync(ct)) return BadRequest("UptimeRobot API key is not configured.");
        await monitorService.PauseMonitorAsync(id, ct);
        return Ok();
    }

    /// <summary>
    /// Resumes monitoring for a specific monitor in UptimeRobot.
    /// </summary>
    [HttpPost("{id:int}/start")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> StartMonitor(int id, CancellationToken ct = default)
    {
        if (!await IsUptimeRobotConfiguredAsync(ct)) return BadRequest("UptimeRobot API key is not configured.");
        await monitorService.StartMonitorAsync(id, ct);
        return Ok();
    }

    /// <summary>
    /// Deletes a monitor from both the system and UptimeRobot.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteMonitor(int id, [FromQuery] Guid? tenantId, CancellationToken ct = default)
    {
        if (!await IsUptimeRobotConfiguredAsync(ct)) return BadRequest("UptimeRobot API key is not configured.");

        if (!tenantId.HasValue)
        {
            await using var db = await dbContextFactory.CreateDbContextAsync(ct);
            tenantId = await db.Monitors.Where(m => m.Id == id).Select(m => (Guid?)m.TenantId).SingleOrDefaultAsync(ct);
        }

        if (tenantId == null) return NotFound();

        await monitorService.DeleteMonitorAsync(tenantId.Value, id, ct);
        return NoContent();
    }

    /// <summary>
    /// Retrieves aggregated latency metrics for a specific monitor.
    /// </summary>
    [HttpGet("{id:int}/latency")]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<IEnumerable<LatencyMetricsDto>>> GetLatencyMetrics(
        int id,
        [FromQuery] DateTimeOffset from,
        [FromQuery] DateTimeOffset to,
        [FromQuery] Guid? tenantId = null,
        CancellationToken ct = default)
    {
        if (!tenantId.HasValue)
        {
             await using var db = await dbContextFactory.CreateDbContextAsync(ct);
             tenantId = await db.Monitors.Where(m => m.Id == id).Select(m => (Guid?)m.TenantId).SingleOrDefaultAsync(ct);
        }

        if (tenantId == null) return NotFound();

        var metrics = await monitorService.GetAggregatedLatencyAsync(tenantId.Value, id, from, to, ct);
        return Ok(metrics);
    }

    /// <summary>
    /// Updates monitor properties, such as SLA.
    /// </summary>
    [HttpPatch("{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<UptimeMonitorDto>> UpdateMonitor(int id, [FromBody] UpdateMonitorRequestDto request, CancellationToken ct = default)
    {
        if (!await IsUptimeRobotConfiguredAsync(ct)) return BadRequest("UptimeRobot API key is not configured.");
        await monitorService.UpdateMonitorAsync(id, request.Name, request.Url, request.Sla, request.Tags, ct);
        
        await using var db = await dbContextFactory.CreateDbContextAsync(ct);
        var tenantId = await db.Monitors.Where(m => m.Id == id).Select(m => (Guid?)m.TenantId).SingleOrDefaultAsync(ct);
        if (tenantId == null) return NotFound();

        var m = await monitorService.GetMonitorAsync(tenantId.Value, id, TimeframeResolver.Resolve(Timeframe.T30), ct);
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
            LastSyncError: m.LastSyncError,
            Tags: m.Tags);
    }
}



