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
            result.VolumeGrowthPercentage,
            result.AverageOrderValue,
            result.AovGrowthPercentage,
            result.ActiveTenants,
            result.ActiveTenantsGrowthPercentage,
            result.AverageRevenuePerTenant,
            result.ArptGrowthPercentage));
    }

    /// <summary>
    /// Daily/Hourly time-series: current vs. previous period accumulated revenue.
    /// Scopes to a single tenant if tenantId is provided, otherwise portfolio-wide.
    /// </summary>
    [HttpGet("accumulated-revenue")]
    public async Task<ActionResult<IEnumerable<AccumulatedRevenuePointResponseDto>>> GetAccumulatedRevenue([FromQuery] FinancialRequestDto request)
    {
        var result = await financialService.GetAccumulatedRevenueAsync(request.Timeframe, request.TenantId);
        return Ok(result.Select(v => new AccumulatedRevenuePointResponseDto(
                v.Label,
                v.Timestamp,
                v.CurrentRevenue,
                v.PreviousRevenue,
                v.CurrentAccumulated,
                v.PreviousAccumulated)).ToList());
    }

    /// <summary>
    /// Daily/Hourly time-series: current vs. previous period revenue.
    /// Scopes to a single tenant if tenantId is provided, otherwise portfolio-wide.
    /// </summary>
    [HttpGet("velocity")]
    public async Task<ActionResult<IEnumerable<VelocityPointResponseDto>>> GetVelocity([FromQuery] FinancialRequestDto request)
    {
        var result = await financialService.GetVelocityAsync(request.Timeframe, request.TenantId);
        return Ok(result.Select(v => new VelocityPointResponseDto(
                v.Label,
                v.Timestamp,
                v.CurrentRevenue,
                v.PreviousRevenue,
                v.AbsoluteVariance)).ToList());
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
    /// Scatter plot data: revenue efficiency across all tenants. X: AOV, Y: Portfolio share, Bubble: Growth velocity.
    /// Portfolio view only.
    /// </summary>
    [HttpGet("revenue-efficiency")]
    public async Task<ActionResult<RevenueEfficiencyResponseDto>> GetRevenueEfficiency([FromQuery] PortfolioRequestDto request)
    {
        var result = await financialService.GetRevenueEfficiencyAsync(request.Timeframe);
        return Ok(new RevenueEfficiencyResponseDto(
            result.GlobalAverageOrderValue,
            result.MedianPortfolioShare,
            result.Tenants.Select(r => new RevenueEfficiencyTenantResponseDto(
                r.TenantId,
                r.TenantName,
                r.Type,
                r.AverageOrderValue,
                r.PortfolioSharePercentage,
                r.GrowthVelocity
            )).ToList()
        ));
    }

    /// <summary>
    /// Diverging bar chart data: volume anomalies compared to a baseline period.
    /// Portfolio view only.
    /// </summary>
    [HttpGet("volume-anomaly")]
    public async Task<ActionResult<IEnumerable<VolumeAnomalyResponseDto>>> GetVolumeAnomaly([FromQuery] PortfolioRequestDto request)
    {
        var result = await financialService.GetVolumeAnomalyAsync(request.Timeframe);
        return Ok(result.Select(r => new VolumeAnomalyResponseDto
        {
            TenantId = r.TenantId,
            TenantName = r.TenantName,
            VolumeDeviationPercentage = r.VolumeDeviationPercentage,
            CurrentVolume = r.CurrentVolume,
            BaselineVolume = r.BaselineVolume
        }));
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
            result.GlobalGrowthPercentage,
            result.Tenants.Select(t => new MomentumTenantResponseDto(
                t.TenantId,
                t.TenantName,
                t.Type,
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
                n.Label,
                n.Timestamp,
                n.NetGrowthAddition)).ToList());
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

    /// <summary>
    /// Line-chart: running sum of absolute daily variance between current and previous periods.
    /// Scopes to a single tenant if tenantId is provided, otherwise portfolio-wide.
    /// </summary>
    [HttpGet("cumulative-growth-delta")]
    public async Task<ActionResult<IEnumerable<CumulativeGrowthDeltaPointResponseDto>>> GetCumulativeGrowthDelta([FromQuery] FinancialRequestDto request)
    {
        var result = await financialService.GetCumulativeGrowthDeltaAsync(request.Timeframe, request.TenantId);
        return Ok(result.Select(p => new CumulativeGrowthDeltaPointResponseDto(
                p.Label,
                p.Timestamp,
                p.CurrentCumulative,
                p.PreviousCumulative,
                p.CumulativeGrowthDelta)).ToList());
    }
}
