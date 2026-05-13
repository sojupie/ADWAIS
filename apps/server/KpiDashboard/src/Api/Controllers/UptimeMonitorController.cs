using Api.DTOs.Monitoring;
using Infrastructure.Services.Monitoring;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/tenants/{tenantId:guid}/monitors")]
public class UptimeMonitorController(IMonitorOrchestrationService monitorService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UptimeMonitorDto>>> GetMonitors(Guid tenantId)
    {
        var entities = await monitorService.GetMonitorsByTenantAsync(tenantId);
        var dtos = entities.Select(m => new UptimeMonitorDto(
            m.Id, m.TenantId, m.Name, m.Url, m.UptimeSla, m.UptimeMonitorEnabled, m.StatusStr, 0.0));
        return Ok(dtos);
    }

    [HttpPost]
    public async Task<ActionResult<UptimeMonitorDto>> CreateMonitor(Guid tenantId, [FromBody] CreateMonitorRequestDto request)
    {
        var monitor = await monitorService.CreateMonitorAsync(tenantId, request.Name, request.Url, request.UptimeSla);
        var dto = new UptimeMonitorDto(
            monitor.Id, monitor.TenantId, monitor.Name, monitor.Url, monitor.UptimeSla, monitor.UptimeMonitorEnabled, "Unknown", 0.0);
        return CreatedAtAction(nameof(GetMonitor), new { tenantId, id = monitor.Id }, dto);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<UptimeMonitorDto>> GetMonitor(Guid tenantId, int id)
    {
        var m = await monitorService.GetMonitorAsync(tenantId, id);
        var dto = new UptimeMonitorDto(
            m.Id, m.TenantId, m.Name, m.Url, m.UptimeSla, m.UptimeMonitorEnabled, m.StatusStr, 0.0);
        return Ok(dto);
    }

    [HttpPost("{id:int}/pause")]
    public async Task<IActionResult> PauseMonitor(Guid tenantId, int id)
    {
        await monitorService.PauseMonitorAsync(tenantId, id);
        return Ok();
    }

    [HttpPost("{id:int}/start")]
    public async Task<IActionResult> StartMonitor(Guid tenantId, int id)
    {
        await monitorService.StartMonitorAsync(tenantId, id);
        return Ok();
    }

    [HttpGet("{id:int}/latency")]
    public async Task<ActionResult<IEnumerable<LatencyMetricsDto>>> GetLatencyMetrics(
        Guid tenantId, 
        int id, 
        [FromQuery] DateTimeOffset from, 
        [FromQuery] DateTimeOffset to)
    {
        // Service layer handles fetching from Materialized View + current day live data
        var metrics = await monitorService.GetAggregatedLatencyAsync(tenantId, id, from, to);
        return Ok(metrics);
    }
}
