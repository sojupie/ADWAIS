using Adwais.Domain.Entities;
using Adwais.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.DTOs.Financial;

/// <summary>
/// Request parameters for standard financial metrics.
/// </summary>
public class FinancialRequestDto
{
    /// <summary>
    /// The primary timeframe for the calculation (e.g., T7, T30). 
    /// Defaults to T30.
    /// </summary>
    [FromQuery(Name = "timeframe")]
    public Timeframe Timeframe { get; set; } = Timeframe.T30;

    /// <summary>
    /// Optional. Scopes the metrics to a specific tenant. 
    /// If null, metrics represent the global portfolio total.
    /// </summary>
    [FromQuery(Name = "tenantId")]
    public TenantId? TenantId { get; set; }
}


