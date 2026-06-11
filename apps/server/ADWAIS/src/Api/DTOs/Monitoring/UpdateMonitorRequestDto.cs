using System.ComponentModel.DataAnnotations;

namespace Adwais.Api.DTOs.Monitoring;

/// <summary>
/// Request DTO updating a monitor.
/// </summary>
public class UpdateMonitorRequestDto
{
    /// <summary>
    /// Friendly name for the monitor.
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// URL for the monitor.
    /// </summary>
    public string? Url { get; set; }

    /// <summary>
    /// SLA for the monitor.
    /// </summary>
    public double? Sla { get; set; } = -1;

    /// <summary>
    /// Tags associated with the monitor.
    /// </summary>
    public List<string>? Tags { get; set; }
}


