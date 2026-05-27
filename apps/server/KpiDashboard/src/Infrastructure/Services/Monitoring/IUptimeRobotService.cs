using System.Text.Json;
using Domain.DTOs.Monitoring;
using Domain.DTOs.Monitoring.Upstream;
using Domain.Entities.Monitoring;

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

    Task<UptimeRobotUserDto> GetAccountDetailsAsync();
}
