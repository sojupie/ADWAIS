using Domain.Entities.Monitoring;
using Domain.DTOs.Monitoring;
using Domain.Enums;

namespace Infrastructure.Services.Monitoring;

public interface IMonitorOrchestrationService
{
    /// <summary>
    /// Retrieves aggregated monitoring analytics, including latency time-series and monitor list.
    /// </summary>
    Task<MonitorAnalyticsDto> GetAnalyticsAsync(Timeframe timeframe, Guid? tenantId = null, int? monitorId = null);

    /// <summary>
    /// Retrieves all uptime monitors associated with a specific tenant.
    /// </summary>
    /// <param name="tenantId">The ID of the tenant.</param>
    /// <returns>A collection of uptime monitors.</returns>
    Task<IEnumerable<UptimeMonitor>> GetMonitorsByTenantAsync(Guid tenantId);

    /// <summary>
    /// Retrieves a specific uptime monitor for a tenant.
    /// </summary>
    /// <param name="tenantId">The ID of the tenant.</param>
    /// <param name="id">The ID of the monitor.</param>
    /// <returns>The uptime monitor.</returns>
    Task<UptimeMonitor> GetMonitorAsync(Guid tenantId, int id);

    /// <summary>
    /// Creates a new uptime monitor for a tenant.
    /// </summary>
    /// <param name="tenantId">The ID of the tenant.</param>
    /// <param name="name">The name of the monitor.</param>
    /// <param name="url">The URL to monitor.</param>
    /// <param name="uptimeSla">The optional uptime SLA percentage.</param>
    /// <returns>The created uptime monitor.</returns>
    Task<UptimeMonitor> CreateMonitorAsync(Guid tenantId, string name, string url, double? uptimeSla); 

    /// <summary>
    /// Assigns an existing monitor to a specific tenant.
    /// </summary>
    /// <param name="monitorId">The ID of the monitor.</param>
    /// <param name="tenantId">The ID of the tenant.</param>
    Task AssignMonitorAsync(int monitorId, Guid tenantId);

    /// <summary>
    /// Reassigns all monitors from a specific tenant to the system tenant.
    /// </summary>
    /// <param name="tenantId">The ID of the tenant to move monitors from.</param>
    Task ReassignAllTenantMonitorsToSystemAsync(Guid tenantId);

    /// <summary>
    /// Deletes a monitor for a specific tenant.
    /// </summary>
    /// <param name="tenantId">The ID of the tenant.</param>
    /// <param name="id">The ID of the monitor.</param>
    Task DeleteMonitorAsync(Guid tenantId, int id);

    /// <summary>
    /// Pauses an uptime monitor.
    /// </summary>
    /// <param name="id">The ID of the monitor.</param>
    Task PauseMonitorAsync(int id);

    /// <summary>
    /// Starts (resumes) a paused uptime monitor.
    /// </summary>
    /// <param name="id">The ID of the monitor.</param>
    Task StartMonitorAsync(int id);

    /// <summary>
    /// Retrieves aggregated latency (response time) data for a specific monitor within a timeframe.
    /// </summary>
    /// <param name="tenantId">The ID of the tenant.</param>
    /// <param name="id">The ID of the monitor.</param>
    /// <param name="from">The start of the timeframe.</param>
    /// <param name="to">The end of the timeframe.</param>
    /// <returns>A collection of response time data points.</returns>
    Task<IEnumerable<ResponseTime>> GetAggregatedLatencyAsync(Guid tenantId, int id, DateTimeOffset from, DateTimeOffset to);

    /// <summary>
    /// Updates the uptime SLA for a specific monitor.
    /// </summary>
    /// <param name="id">The ID of the monitor.</param>
    /// <param name="uptimeSla">The new uptime SLA percentage.</param>
    /// <returns>The updated uptime monitor.</returns>
    Task<UptimeMonitor> UpdateMonitorSlaAsync(int id, double? uptimeSla);
}