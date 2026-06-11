using Adwais.Application.DTOs.Monitoring.Upstream;
using Adwais.Domain.Entities.Monitoring;

namespace Adwais.Application.Interfaces;

public interface IUptimeRobotService
{
    Task<UptimeRobotMonitorDto> CreateMonitorAsync(string name, string url);

    Task UpdateMonitorAsync(int monitorId, string? name, string? url);

    Task<List<UptimeRobotMonitorDto>> GetMonitorsAsync(int[]? monitorIds = null);

    Task<double> GetUptimeAsync(int monitorId, DateTimeOffset? startDate = null, DateTimeOffset? endDate = null, string? monitorName = null);

    Task<(int? Average, int? Lowest, int? Highest)> GetResponseTimeAsync(int monitorId, DateTimeOffset? startDate = null, DateTimeOffset? endDate = null, string? monitorName = null);

    Task DeleteMonitorAsync(int monitorId);

    Task PauseMonitorAsync(int monitorId);

    Task StartMonitorAsync(int monitorId);

    Task<UptimeRobotUserDto> GetAccountDetailsAsync();
}


