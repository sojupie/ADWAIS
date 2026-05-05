using System.Text.Json;
using Domain.Entities.Monitoring;

namespace Infrastructure.Services.Monitoring;

public interface IUptimeRobotService
{
    Task<int> CreateMonitorAsync(string name, string url);
    Task<List<UptimeMonitor>> GetAllMonitorsAsync();
    Task<double> GetUptimeAsync(int monitorId);
    Task<int?> GetResponseTimeAsync(int monitorId);
    Task<Type> DeleteMonitorAsync(int monitorId);
    Task PauseMonitorAsync(int monitorId);
    Task StartMonitorAsync(int monitorId);
    Task<JsonDocument> GetAccountDetailsAsync();
}
