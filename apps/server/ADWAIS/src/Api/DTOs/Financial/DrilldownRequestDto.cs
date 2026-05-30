using Adwais.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.DTOs.Financial;

/// <summary>
/// Request parameters for tenant-specific (drilldown) metrics.
/// </summary>
public class DrilldownRequestDto
{
    /// <summary>
    /// The primary timeframe for the calculation (e.g., T7, T30). 
    /// Defaults to T30.
    /// </summary>
    [FromQuery(Name = "timeframe")]
    public Timeframe Timeframe { get; set; } = Timeframe.T30;

    /// <summary>
    /// The unique identifier of the tenant.
    /// </summary>
    [FromQuery(Name = "tenantId")]
    public required Guid TenantId { get; set; }
}


