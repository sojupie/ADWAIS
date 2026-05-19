using Domain.Entities.Monitoring;

namespace Infrastructure.Services.Monitoring;

public interface IMonitorOrchestrationService
{
    Task<IEnumerable<UptimeMonitor>> GetMonitorsByTenantAsync(Guid tenantId);
    Task<UptimeMonitor> GetMonitorAsync(Guid tenantId, int id);
    Task<UptimeMonitor> CreateMonitorAsync(Guid tenantId, string name, string url, double? uptimeSla); 
    Task DeleteMonitorAsync(Guid tenantId, int id);
    Task PauseMonitorAsync(int id);
    Task StartMonitorAsync(int id);
    Task<IEnumerable<ResponseTime>> GetAggregatedLatencyAsync(Guid tenantId, int id, DateTimeOffset from, DateTimeOffset to);
}