using Adwais.Api.DTOs.Monitoring;
using Adwais.Domain.Entities.Monitoring;
using Adwais.Domain.Enums;
using Adwais.Application.Common.Interfaces;
using Adwais.Application.Interfaces;
using Adwais.Application.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Adwais.Api.Controllers;

/// <summary>
/// Manages uptime monitors and retrieves monitoring metrics.
/// </summary>
[ApiController]
[Route("api/monitors")]
public class MonitorController(
    IApplicationDbContext dbContext,
    IMonitorOrchestrationService monitorService,
    IReportingCalendar reportingCalendar) : ControllerBase
{
    private readonly IApplicationDbContext _dbContext = dbContext;
    private readonly IMonitorOrchestrationService _monitorService = monitorService;

    private async Task<bool> IsUptimeRobotConfiguredAsync(CancellationToken ct)
    {
        var db = _dbContext;
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
        var period = await reportingCalendar.ResolvePeriodAsync(request.Timeframe, request.Comparison, ct);
        var result = await _monitorService.GetAnalyticsAsync(period, request.TenantId, request.MonitorId, ct);

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
        var period = await reportingCalendar.ResolvePeriodAsync(request.Timeframe, request.Comparison, ct);

        if (request.MonitorId.HasValue)
        {
            var db = _dbContext;
            var tid = await db.Monitors.Where(m => m.Id == request.MonitorId.Value).Select(m => (Guid?)m.TenantId).SingleOrDefaultAsync(ct);
            if (tid == null) return Ok(Enumerable.Empty<UptimeMonitorDto>());

            var m = await _monitorService.GetMonitorAsync(tid.Value, request.MonitorId.Value, period, ct);
            return Ok(new[] { ToDto(m) });
        }

        if (request.TenantId.HasValue)
        {
            var monitors = await _monitorService.GetMonitorsByTenantAsync(request.TenantId.Value, period, ct);
            return Ok(monitors.Select(ToDto));
        }

        var dbCtx = _dbContext;
        var allMonitorIds = await dbCtx.Monitors
            .AsNoTracking()
            .Where(m => m.TenantId != IApplicationDbContext.SystemTenantGuid)
            .Select(m => new { m.Id, m.TenantId })
            .ToListAsync(ct);
        
        var dtos = new List<UptimeMonitorDto>();
        foreach (var m in allMonitorIds)
        {
            var hydrated = await _monitorService.GetMonitorAsync(m.TenantId, m.Id, period, ct);
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
        var period = await reportingCalendar.ResolvePeriodAsync(timeframe, comparison, ct);
        var monitors = await _monitorService.GetMonitorsByTenantAsync(IApplicationDbContext.SystemTenantGuid, period, ct);
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
        var m = await _monitorService.CreateMonitorAsync(tenantId, request.Name, request.Url, request.UptimeSla, ct);
        return CreatedAtAction(nameof(GetMonitors), new { id = m.Id }, ToDto(m));
    }

    /// <summary>
    /// Reassigns a monitor to a different tenant.
    /// </summary>
    [HttpPatch("{id:int}/assign/{tenantId:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> AssignMonitor(int id, Guid tenantId, CancellationToken ct = default)
    {
        await _monitorService.AssignMonitorAsync(id, tenantId, ct);
        return Ok();
    }

    /// <summary>
    /// Moves a monitor to the unassigned (system) tenant.
    /// </summary>
    [HttpPatch("{id:int}/unassign")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UnassignMonitor(int id, CancellationToken ct = default)
    {
        await _monitorService.AssignMonitorAsync(id, IApplicationDbContext.SystemTenantGuid, ct);
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
        await _monitorService.PauseMonitorAsync(id, ct);
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
        await _monitorService.StartMonitorAsync(id, ct);
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
            var db = _dbContext;
            tenantId = await db.Monitors.Where(m => m.Id == id).Select(m => (Guid?)m.TenantId).SingleOrDefaultAsync(ct);
        }

        if (tenantId == null) return NotFound();

        await _monitorService.DeleteMonitorAsync(tenantId.Value, id, ct);
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
             var db = _dbContext;
             tenantId = await db.Monitors.Where(m => m.Id == id).Select(m => (Guid?)m.TenantId).SingleOrDefaultAsync(ct);
        }

        if (tenantId == null) return NotFound();

        var metrics = await _monitorService.GetAggregatedLatencyAsync(tenantId.Value, id, from, to, ct);
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
        await _monitorService.UpdateMonitorAsync(id, request.Name, request.Url, request.Sla, request.Tags, ct);
        
        var db = _dbContext;
        var tenantId = await db.Monitors.Where(m => m.Id == id).Select(m => (Guid?)m.TenantId).SingleOrDefaultAsync(ct);
        if (tenantId == null) return NotFound();

        var period = await reportingCalendar.ResolvePeriodAsync(Timeframe.T30, ct: ct);
        var m = await _monitorService.GetMonitorAsync(tenantId.Value, id, period, ct);
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
