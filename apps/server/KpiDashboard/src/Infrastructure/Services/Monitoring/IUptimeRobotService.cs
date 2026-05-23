using System.Text.Json;
using Domain.Entities.Monitoring;
using Infrastructure.Services.Monitoring.UpstreamDTOs;

namespace Infrastructure.Services.Monitoring;

public interface IUptimeRobotService
{
    /// <summary>
    /// Creates a new monitor in UptimeRobot.
    /// </summary>
    /// <param name="name">The name of the monitor.</param>
    /// <param name="url">The URL to monitor.</param>
    /// <returns>A DTO representing the created monitor.</returns>
    Task<UptimeRobotMonitorDto> CreateMonitorAsync(string name, string url);

    /// <summary>
    /// Retrieves monitors from UptimeRobot.
    /// </summary>
    /// <param name="monitorIds">Optional array of monitor IDs to filter the results.</param>
    /// <returns>A list of monitor DTOs.</returns>
    Task<List<UptimeRobotMonitorDto>> GetMonitorsAsync(int[]? monitorIds = null);

    /// <summary>
    /// Retrieves the uptime percentage for a specific monitor within a timeframe.
    /// </summary>
    /// <param name="monitorId">The ID of the monitor.</param>
    /// <param name="startDate">Optional start date for the uptime calculation.</param>
    /// <param name="endDate">Optional end date for the uptime calculation.</param>
    /// <returns>The uptime percentage (0-100).</returns>
    Task<double> GetUptimeAsync(int monitorId, DateTimeOffset? startDate = null, DateTimeOffset? endDate = null);

    /// <summary>
    /// Retrieves response time metrics for a specific monitor within a timeframe.
    /// </summary>
    /// <param name="monitorId">The ID of the monitor.</param>
    /// <param name="startDate">Optional start date for metrics.</param>
    /// <param name="endDate">Optional end date for metrics.</param>
    /// <returns>A tuple containing average, lowest, and highest response times in milliseconds.</returns>
    Task<(int? Average, int? Lowest, int? Highest)> GetResponseTimeAsync(int monitorId, DateTimeOffset? startDate = null, DateTimeOffset? endDate = null);

    /// <summary>
    /// Deletes a monitor from UptimeRobot.
    /// </summary>
    /// <param name="monitorId">The ID of the monitor to delete.</param>
    Task DeleteMonitorAsync(int monitorId);

    /// <summary>
    /// Pauses a monitor in UptimeRobot.
    /// </summary>
    /// <param name="monitorId">The ID of the monitor to pause.</param>
    Task PauseMonitorAsync(int monitorId);

    /// <summary>
    /// Starts (resumes) a paused monitor in UptimeRobot.
    /// </summary>
    /// <param name="monitorId">The ID of the monitor to start.</param>
    Task StartMonitorAsync(int monitorId);
}