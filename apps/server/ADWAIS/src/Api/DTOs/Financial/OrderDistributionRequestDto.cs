using Adwais.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.DTOs.Financial;

/// <summary>
/// Request parameters for order value distribution (histogram).
/// </summary>
public class OrderDistributionRequestDto
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

    /// <summary>
    /// Optional. The number of bins to use for the histogram. 
    /// If null, an adaptive binning strategy is used.
    /// </summary>
    [FromQuery(Name = "binCount")]
    public int? BinCount { get; set; }
}


