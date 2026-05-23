using Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Api.DTOs.Financial;

/// <summary>
/// Request parameters for revenue distribution analysis.
/// </summary>
public class DistributionRequestDto
{
    /// <summary>
    /// The primary timeframe for the calculation (e.g., T7, T30). 
    /// Defaults to T30.
    /// </summary>
    [FromQuery(Name = "timeframe")]
    public Timeframe Timeframe { get; set; } = Timeframe.T30;

    /// <summary>
    /// The number of top tenants to include as individual items. 
    /// All other tenants are grouped into an "Other" category.
    /// </summary>
    [FromQuery(Name = "topN")]
    public int TopN { get; set; } = 10;
}
