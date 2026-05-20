using System.Text.Json;
using Domain.Entities.Monitoring;
using Infrastructure.Services.Monitoring.UpstreamDTOs;

namespace Infrastructure.Services.Monitoring;

public interface IUptimeRobotService
{
    Task<UptimeRobotMonitorDto> CreateMonitorAsync(string name, string url);
    Task<List<UptimeRobotMonitorDto>> GetMonitorsAsync(int[]? monitorIds = null);
    Task<double> GetUptimeAsync(int monitorId, DateTimeOffset? startDate = null, DateTimeOffset? endDate = null);
    Task<(int? Average, int? Lowest, int? Highest)> GetResponseTimeAsync(int monitorId, DateTimeOffset? startDate = null, DateTimeOffset? endDate = null);
    Task DeleteMonitorAsync(int monitorId);
    Task PauseMonitorAsync(int monitorId);
    Task StartMonitorAsync(int monitorId);
}