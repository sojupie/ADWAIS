namespace Api.DTOs.Monitoring;

/// <summary>
/// Data transfer object for creating a new uptime monitor.
/// </summary>
/// <param name="Name">The display name for the monitor.</param>
/// <param name="Url">The absolute URL to monitor.</param>
/// <param name="UptimeSla">Optional target uptime percentage (0-1).</param>
public record CreateMonitorRequestDto(
    string Name, 
    string Url, 
    double? UptimeSla);
