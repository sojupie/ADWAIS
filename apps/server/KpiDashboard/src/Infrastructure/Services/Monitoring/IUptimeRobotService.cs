using System.Text.Json;
using Domain.Entities.Monitoring;
using Infrastructure.Services.Monitoring.DTOs;

namespace Infrastructure.Services.Monitoring;

public interface IUptimeRobotService
{
    Task<UptimeRobotMonitorDto> CreateMonitorAsync(string name, string url);
    Task<List<UptimeRobotMonitorDto>> GetMonitorsAsync(int[]? monitorIds = null);
    Task<double> GetUptimeAsync(int monitorId);
    Task<int?> GetResponseTimeAsync(int monitorId);
    Task DeleteMonitorAsync(int monitorId);
    Task PauseMonitorAsync(int monitorId);
    Task StartMonitorAsync(int monitorId);
}