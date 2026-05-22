using Domain.Enums;
using Domain.Services;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/financial")]
public class FinancialController(IFinancialService financialService) : ControllerBase
{
    /// <summary>
    /// Revenue, growth %, transaction volume, AOV.
    /// Scopes to a single tenant if tenantId is provided, otherwise portfolio-wide.
    /// </summary>
    [HttpGet("kpis")]
    public async Task<IActionResult> GetKpis(
        [FromQuery] Timeframe timeframe = Timeframe.T30,
        [FromQuery] Guid? tenantId = null)
    {
        var result = await financialService.GetKpisAsync(timeframe, tenantId);
        return Ok(result);
    }

    /// <summary>
    /// Daily time-series: current vs. previous period revenue.
    /// Scopes to a single tenant if tenantId is provided, otherwise portfolio-wide.
    /// </summary>
    [HttpGet("velocity")]
    public async Task<IActionResult> GetVelocity(
        [FromQuery] Timeframe timeframe = Timeframe.T30,
        [FromQuery] Guid? tenantId = null)
    {
        var result = await financialService.GetVelocityAsync(timeframe, tenantId);
        return Ok(result);
    }

    /// <summary>
    /// Per-tenant growth %, sorted descending. Portfolio view only.
    /// </summary>
    [HttpGet("growth-extremes")]
    public async Task<IActionResult> GetGrowthExtremes(
        [FromQuery] Timeframe timeframe = Timeframe.T30)
    {
        var result = await financialService.GetGrowthExtremesAsync(timeframe);
        return Ok(result);
    }

    /// <summary>
    /// Pareto distribution: revenue per tenant + cumulative portfolio share.
    /// Portfolio view only.
    /// </summary>
    [HttpGet("distribution")]
    public async Task<IActionResult> GetDistribution(
        [FromQuery] Timeframe timeframe = Timeframe.T30,
        [FromQuery] int topN = 10)
    {
        var result = await financialService.GetDistributionAsync(timeframe, topN);
        return Ok(result);
    }

    /// <summary>
    /// Scatter: baseline revenue × growth % × current volume. Portfolio view only.
    /// </summary>
    [HttpGet("momentum")]
    public async Task<IActionResult> GetMomentum(
        [FromQuery] Timeframe timeframe = Timeframe.T30)
    {
        var result = await financialService.GetMomentumAsync(timeframe);
        return Ok(result);
    }

    /// <summary>
    /// Step-line: running tally of daily growth delta. Drilldown view only.
    /// Returns 400 if tenantId is omitted.
    /// </summary>
    [HttpGet("cumulative-growth")]
    public async Task<IActionResult> GetCumulativeGrowth(
        [FromQuery] Timeframe timeframe = Timeframe.T30,
        [FromQuery] Guid? tenantId = null)
    {
        if (!tenantId.HasValue)
            return BadRequest(new { error = "tenantId is required for cumulative-growth." });

        var result = await financialService.GetCumulativeGrowthAsync(timeframe, tenantId.Value);
        return Ok(result);
    }

    /// <summary>
    /// Histogram of order values with adaptive binning. Drilldown view only.
    /// Returns 400 if tenantId is omitted.
    /// </summary>
    [HttpGet("order-distribution")]
    public async Task<IActionResult> GetOrderDistribution(
        [FromQuery] Timeframe timeframe = Timeframe.T30,
        [FromQuery] Guid? tenantId = null,
        [FromQuery] int? binCount = null)
    {
        if (!tenantId.HasValue)
            return BadRequest(new { error = "tenantId is required for order-distribution." });

        var result = await financialService.GetOrderDistributionAsync(timeframe, tenantId.Value, binCount);
        return Ok(result);
    }
}
