using System.ComponentModel.DataAnnotations;

namespace Adwais.Api.DTOs.Monitoring;

/// <summary>
/// Request DTO updating a monitor.
/// </summary>
public class UpdateMonitorRequestDto
{
    /// <summary>
    /// SLA for the monitor.
    /// </summary>
    [Required]
    public double Sla { get; set; } 
}


