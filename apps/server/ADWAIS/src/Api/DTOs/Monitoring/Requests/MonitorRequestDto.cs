using Adwais.Domain.Entities;
using Adwais.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.DTOs.Monitoring;

/// <summary>
/// Request parameters for monitor metrics.
/// </summary>
public record MonitorRequestDto
{
    /// <summary>
    /// Optional. Scopes the metrics to a specific tenant. 
    /// If null, metrics represent the global portfolio total.
    /// </summary>
    [FromQuery(Name = "tenantId")] 
    public Guid? TenantId { get; init; }
    
    /// <summary>
    /// Optional. Scopes the metrics to a specific monitor. 
    /// If null, metrics represent the global portfolio total.
    /// Overrides tenantId parameter.
    /// </summary>
    [FromQuery(Name = "monitorId")] 
    public int? MonitorId { get; init; }

    /// <summary>
    /// The primary timeframe for the calculation (e.g., T7, T30). 
    /// Defaults to T30.
    /// </summary>
    [FromQuery(Name = "timeframe")] 
    public Timeframe Timeframe { get; init; } = Timeframe.T30;
}

