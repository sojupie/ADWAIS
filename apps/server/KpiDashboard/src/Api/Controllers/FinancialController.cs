using Api.DTOs.Financial;
using Domain.Enums;
using Infrastructure.Services.Financial;
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
    public async Task<ActionResult<KpiResponseDto>> GetKpis([FromQuery] FinancialRequestDto request)
    {
        var result = await financialService.GetKpisAsync(request.Timeframe, request.TenantId);
        return Ok(new KpiResponseDto(
            result.CurrentRevenue,
            result.PreviousRevenue,
            result.RevenueGrowthPercentage,
            result.TransactionVolume,
            result.AverageOrderValue));
    }

    /// <summary>
    /// Daily time-series: current vs. previous period revenue.
    /// Scopes to a single tenant if tenantId is provided, otherwise portfolio-wide.
    /// </summary>
    [HttpGet("velocity")]
    public async Task<ActionResult<IEnumerable<VelocityPointResponseDto>>> GetVelocity([FromQuery] FinancialRequestDto request)
    {
        var result = await financialService.GetVelocityAsync(request.Timeframe, request.TenantId);
        return Ok(result.Select(v => new VelocityPointResponseDto(
            v.PeriodLabel,
            v.CurrentRevenue,
            v.PreviousRevenue,
            v.AbsoluteVariance)));
    }

    /// <summary>
    /// Per-tenant growth %, sorted descending. Portfolio view only.
    /// </summary>
    [HttpGet("growth-extremes")]
    public async Task<ActionResult<IEnumerable<GrowthExtremeResponseDto>>> GetGrowthExtremes([FromQuery] PortfolioRequestDto request)
    {
        var result = await financialService.GetGrowthExtremesAsync(request.Timeframe);
        return Ok(result.Select(g => new GrowthExtremeResponseDto(
            g.TenantId,
            g.TenantName,
            g.CurrentRevenue,
            g.PreviousRevenue,
            g.GrowthPercentage,
            g.AbsoluteVariance)));
    }

    /// <summary>
    /// Pareto distribution: revenue per tenant + cumulative portfolio share.
    /// Portfolio view only.
    /// </summary>
    [HttpGet("distribution")]
    public async Task<ActionResult<IEnumerable<DistributionEntryResponseDto>>> GetDistribution([FromQuery] DistributionRequestDto request)
    {
        var result = await financialService.GetDistributionAsync(request.Timeframe, request.TopN);
        return Ok(result.Select(d => new DistributionEntryResponseDto(
            d.TenantId,
            d.TenantName,
            d.AbsoluteRevenue,
            d.CumulativePortfolioShare)));
    }

    /// <summary>
    /// Scatter: baseline revenue × growth % × current volume. Portfolio view only.
    /// </summary>
    [HttpGet("momentum")]
    public async Task<ActionResult<MomentumResponseDto>> GetMomentum([FromQuery] PortfolioRequestDto request)
    {
        var result = await financialService.GetMomentumAsync(request.Timeframe);
        return Ok(new MomentumResponseDto(
            result.MedianBaselineRevenue,
            result.Tenants.Select(t => new MomentumTenantResponseDto(
                t.TenantId,
                t.TenantName,
                t.BaselineRevenue,
                t.GrowthPercentage,
                t.CurrentRevenue)).ToList()));
    }

    /// <summary>
    /// Step-line: running tally of daily growth delta. Drilldown view only.
    /// </summary>
    [HttpGet("daily-revenue-delta")]
    public async Task<ActionResult<IEnumerable<NetGrowthAdditionPointResponseDto>>> GetNetGrowthAddition([FromQuery] DrilldownRequestDto request)
    {
        var result = await financialService.GetNetGrowthAdditionAsync(request.Timeframe, request.TenantId);
        return Ok(result.Select(n => new NetGrowthAdditionPointResponseDto(
            n.PeriodLabel,
            n.NetGrowthAddition)));
    }

    /// <summary>
    /// Histogram of order values with adaptive binning. Drilldown view only.
    /// </summary>
    [HttpGet("order-distribution")]
    public async Task<ActionResult<IEnumerable<OrderBinResponseDto>>> GetOrderDistribution([FromQuery] OrderDistributionRequestDto request)
    {
        var result = await financialService.GetOrderDistributionAsync(request.Timeframe, request.TenantId, request.BinCount);
        return Ok(result.Select(b => new OrderBinResponseDto(
            b.BinLabel,
            b.BinMin,
            b.BinMax,
            b.OrderCount)));
    }

    /// <summary>
    /// Heatmap data: transaction count and revenue grouped by day of week and hour.
    /// Scopes to a single tenant if tenantId is provided, otherwise portfolio-wide.
    /// </summary>
    [HttpGet("transaction-density")]
    public async Task<ActionResult<IEnumerable<TransactionDensityPointResponseDto>>> GetTransactionDensity([FromQuery] FinancialRequestDto request)
    {
        var result = await financialService.GetTransactionDensityAsync(request.Timeframe, request.TenantId);
        return Ok(result.Select(p => new TransactionDensityPointResponseDto(
            p.DayOfWeek,
            p.Hour,
            p.Count,
            p.TotalRevenue)));
    }
}
