using Api.DTOs.Monitoring;
using Domain.Entities.Monitoring;
using Infrastructure;
using Infrastructure.Services.Monitoring;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

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
    /// Retrieves monitors, optionally filtered by tenant.
    /// </summary>
    /// <param name="tenantId">Optional tenant ID to filter by.</param>
    /// <returns>A list of monitors with live status and uptime data.</returns>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UptimeMonitorDto>>> GetMonitors([FromQuery] Guid? tenantId)
    {
        if (tenantId.HasValue)
        {
            var monitors = await monitorService.GetMonitorsByTenantAsync(tenantId.Value);
            return Ok(monitors.Select(ToDto));
        }

        await using var db = await dbContextFactory.CreateDbContextAsync();
        var allMonitors = await db.Monitors.AsNoTracking().ToListAsync();
        
        // Manual hydration for global list (could be moved to service if common)
        var dtos = new List<UptimeMonitorDto>();
        foreach (var m in allMonitors)
        {
            var hydrated = await monitorService.GetMonitorAsync(m.TenantId, m.Id);
            dtos.Add(ToDto(hydrated));
        }

        return Ok(dtos);
    }

    /// <summary>
    /// Retrieves monitors that are not assigned to any specific tenant (assigned to the system tenant).
    /// </summary>
    [HttpGet("unassigned")]
    public async Task<ActionResult<IEnumerable<UptimeMonitorDto>>> GetUnassignedMonitors()
    {
        return await GetMonitors(AnalyticsDbContext.SystemTenantGuid);
    }

    /// <summary>
    /// Creates a new uptime monitor in UptimeRobot and registers it in the system.
    /// </summary>
    /// <param name="tenantId">The tenant to assign the new monitor to.</param>
    /// <param name="request">The monitor configuration.</param>
    [HttpPost]
    public async Task<ActionResult<UptimeMonitorDto>> CreateMonitor(
        [FromQuery] Guid tenantId,
        [FromBody] CreateMonitorRequestDto request)
    {
        var m = await monitorService.CreateMonitorAsync(tenantId, request.Name, request.Url, request.UptimeSla);
        return CreatedAtAction(nameof(GetMonitor), new { id = m.Id }, ToDto(m));
    }

    /// <summary>
    /// Retrieves a single monitor by its UptimeRobot ID.
    /// </summary>
    /// <param name="id">The UptimeRobot monitor ID.</param>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<UptimeMonitorDto>> GetMonitor(int id)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var tenantId = await db.Monitors.Where(m => m.Id == id).Select(m => m.TenantId).SingleOrDefaultAsync();
        
        if (tenantId == default) return NotFound();

        var m = await monitorService.GetMonitorAsync(tenantId, id);
        return Ok(ToDto(m));
    }

    /// <summary>
    /// Reassigns a monitor to a different tenant.
    /// </summary>
    /// <param name="id">The monitor ID.</param>
    /// <param name="tenantId">The new tenant ID.</param>
    [HttpPatch("{id:int}/assign/{tenantId:guid}")]
    public async Task<IActionResult> AssignMonitor(int id, Guid tenantId)
    {
        await monitorService.AssignMonitorAsync(id, tenantId);
        return Ok();
    }

    /// <summary>
    /// Moves a monitor to the unassigned (system) tenant.
    /// </summary>
    /// <param name="id">The monitor ID.</param>
    [HttpPatch("{id:int}/unassign")]
    public async Task<IActionResult> UnassignMonitor(int id)
    {
        await monitorService.AssignMonitorAsync(id, AnalyticsDbContext.SystemTenantGuid);
        return Ok();
    }

    /// <summary>
    /// Pauses monitoring for a specific monitor in UptimeRobot.
    /// </summary>
    /// <param name="id">The monitor ID.</param>
    [HttpPost("{id:int}/pause")]
    public async Task<IActionResult> PauseMonitor(int id)
    {
        await monitorService.PauseMonitorAsync(id);
        return Ok();
    }

    /// <summary>
    /// Resumes monitoring for a specific monitor in UptimeRobot.
    /// </summary>
    /// <param name="id">The monitor ID.</param>
    [HttpPost("{id:int}/start")]
    public async Task<IActionResult> StartMonitor(int id)
    {
        await monitorService.StartMonitorAsync(id);
        return Ok();
    }

    /// <summary>
    /// Deletes a monitor from both the system and UptimeRobot.
    /// </summary>
    /// <param name="id">The monitor ID.</param>
    /// <param name="tenantId">Optional tenant ID for validation.</param>
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
    /// <param name="id">The monitor ID.</param>
    /// <param name="from">Start of the time range.</param>
    /// <param name="to">End of the time range.</param>
    /// <param name="tenantId">Optional tenant ID for validation.</param>
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
        
        if (tenantId == default) return NotFound();

        var metrics = await monitorService.GetAggregatedLatencyAsync(tenantId.Value, id, from, to);
        return Ok(metrics);
    }

    /// <summary>
    /// Updates monitor properties, such as SLA.
    /// </summary>
    /// <param name="id">The monitor ID.</param>
    /// <param name="request">The update details.</param>
    [HttpPatch("{id:int}")]
    public async Task<ActionResult<UptimeMonitorDto>> UpdateMonitor(int id, [FromBody] UpdateMonitorRequestDto request)
    {
        await monitorService.UpdateMonitorSlaAsync(id, request.Sla);
        
        return await GetMonitor(id);
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
            CurrentStatus: m.StatusStr, // Guaranteed by service
            CurrentUptimePercentage: m.CurrentUptimePercentage,
            LastUpdate: m.LastUpdate,
            LastUptimeUpdate: m.LastUptimeUpdate,
            LastLatencyUpdate: m.LastLatencyUpdate,
            CreatedDate: m.CreatedDate);
    }
}
