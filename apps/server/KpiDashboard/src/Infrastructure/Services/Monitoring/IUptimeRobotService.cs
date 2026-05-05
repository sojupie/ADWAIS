using System.Text.Json;
using Domain.Entities.Monitoring;

namespace Infrastructure.Services.Monitoring;

public interface IUptimeRobotService
{
    Task<int> CreateMonitorAsync(string name, string url);
    Task<List<UptimeMonitor>> GetAllMonitorsAsync();
    Task<double> GetUptimeAsync(int monitorId);
    Task<int?> GetResponseTimeAsync(int monitorId);
    Task<JsonDocument> DeleteMonitorAsync(int monitorId);
    Task<JsonDocument> PauseMonitorAsync(int monitorId);
    Task<JsonDocument> StartMonitorAsync(int monitorId);
    Task<JsonDocument> GetAccountDetailsAsync();
}
