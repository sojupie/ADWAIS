using System.ComponentModel.DataAnnotations;

namespace Adwais.Api.DTOs.Monitoring;

/// <summary>
/// Request DTO updating a monitor.
/// </summary>
public record UpdateMonitorRequestDto
{
    /// <summary>
    /// Friendly name for the monitor.
    /// </summary>
    public string? Name { get; init; }

    /// <summary>
    /// URL for the monitor.
    /// </summary>
    public string? Url { get; init; }

    /// <summary>
    /// SLA for the monitor.
    /// </summary>
    public double? Sla { get; init; }

    /// <summary>
    /// Tags associated with the monitor.
    /// </summary>
    public List<string>? Tags { get; init; }
}


