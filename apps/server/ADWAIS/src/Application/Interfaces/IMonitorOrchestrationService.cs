using Adwais.Domain.Entities.Monitoring;
using Adwais.Application.DTOs.Monitoring;
using Adwais.Domain.Entities;
using Adwais.Application.Common.Models;

namespace Adwais.Application.Interfaces;

public interface IMonitorOrchestrationService
{
    /// <summary>
    /// Retrieves aggregated monitoring analytics, including latency time-series and monitor list.
    /// </summary>
    Task<MonitorAnalyticsDto> GetAnalyticsAsync(ResolvedPeriod period, TenantId? tenantId = null, int? monitorId = null);

    /// <summary>
    /// Retrieves all uptime monitors associated with a specific tenant, hydrated with uptime for the given timeframe.
    /// </summary>
    Task<IEnumerable<UptimeMonitor>> GetMonitorsByTenantAsync(TenantId tenantId, ResolvedPeriod period);

    /// <summary>
    /// Retrieves a specific uptime monitor for a tenant, hydrated with uptime for the given timeframe.
    /// </summary>
    Task<UptimeMonitor> GetMonitorAsync(TenantId tenantId, int id, ResolvedPeriod period);

    /// <summary>
    /// Creates a new uptime monitor for a tenant.
    /// </summary>
    Task<UptimeMonitor> CreateMonitorAsync(TenantId tenantId, string name, string url, double? uptimeSla); 

    /// <summary>
    /// Assigns an existing monitor to a specific tenant.
    /// </summary>
    Task AssignMonitorAsync(int monitorId, TenantId tenantId);

    /// <summary>
    /// Reassigns all monitors from a specific tenant to the system tenant.
    /// </summary>
    Task ReassignAllTenantMonitorsToSystemAsync(TenantId tenantId);

    /// <summary>
    /// Deletes a monitor for a specific tenant.
    /// </summary>
    Task DeleteMonitorAsync(TenantId tenantId, int id);

    /// <summary>
    /// Pauses an uptime monitor.
    /// </summary>
    Task PauseMonitorAsync(int id);

    /// <summary>
    /// Starts (resumes) a paused uptime monitor.
    /// </summary>
    Task StartMonitorAsync(int id);

    /// <summary>
    /// Retrieves aggregated latency (response time) data for a specific monitor within a timeframe.
    /// </summary>
    Task<IEnumerable<ResponseTime>> GetAggregatedLatencyAsync(TenantId tenantId, int id, DateTimeOffset from, DateTimeOffset to);

    /// <summary>
    /// Updates the uptime SLA for a specific monitor.
    /// </summary>
    Task<UptimeMonitor> UpdateMonitorSlaAsync(int id, double? uptimeSla);
}
