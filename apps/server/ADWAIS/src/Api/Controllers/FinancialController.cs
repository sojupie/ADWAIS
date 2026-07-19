using Adwais.Application.Common.Models;
using Adwais.Api.DTOs.Financial;
using Adwais.Application.DTOs.Financial;
using Adwais.Domain.Enums;
using Adwais.Application.Interfaces;
using Adwais.Application.Services;
using Adwais.Domain.Entities.OrderData;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace Adwais.Api.Controllers;

[ApiController]
[Route("api/financial")]
[Authorize(Policy = "KioskOrStaffAccess")]
public class FinancialController(
    IFinancialService financialService,
    IReportingCalendar reportingCalendar) : ControllerBase
{
    /// <summary>
    /// Revenue, growth %, transaction volume, AOV.
    /// Scopes to a single tenant if tenantId is provided, otherwise portfolio-wide.
    /// </summary>
    [HttpGet("kpis")]
    public async Task<ActionResult<KpiResponseDto>> GetKpis([FromQuery] FinancialRequestDto request, CancellationToken ct = default)
    {
        var period = await reportingCalendar.ResolvePeriodAsync(request.Timeframe, request.Comparison, ct);
        var result = await financialService.GetKpisAsync(period, request.TenantId, ct);
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
    public async Task<ActionResult<IEnumerable<AccumulatedRevenuePointResponseDto>>> GetAccumulatedRevenue([FromQuery] FinancialRequestDto request, CancellationToken ct = default)
    {
        var period = await reportingCalendar.ResolvePeriodAsync(request.Timeframe, request.Comparison, ct);
        var result = await financialService.GetAccumulatedRevenueAsync(period, request.TenantId, ct);
        return Ok(result.Select(v => new AccumulatedRevenuePointResponseDto(
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
    public async Task<ActionResult<IEnumerable<VelocityPointResponseDto>>> GetVelocity([FromQuery] FinancialRequestDto request, CancellationToken ct = default)
    {
        var period = await reportingCalendar.ResolvePeriodAsync(request.Timeframe, request.Comparison, ct);
        var result = await financialService.GetVelocityAsync(period, request.TenantId, ct);
        return Ok(result.Select(v => new VelocityPointResponseDto(
                v.Timestamp,
                v.CurrentRevenue,
                v.PreviousRevenue,
                v.AbsoluteVariance)).ToList());
    }

    /// <summary>
    /// Per-tenant growth %, sorted descending. Portfolio view only.
    /// </summary>
    [HttpGet("growth-extremes")]
    public async Task<ActionResult<IEnumerable<GrowthExtremeResponseDto>>> GetGrowthExtremes([FromQuery] PortfolioRequestDto request, CancellationToken ct = default)
    {
        var period = await reportingCalendar.ResolvePeriodAsync(request.Timeframe, request.Comparison, ct);
        var result = await financialService.GetGrowthExtremesAsync(period, ct);
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
    public async Task<ActionResult<RevenueEfficiencyResponseDto>> GetRevenueEfficiency([FromQuery] PortfolioRequestDto request, CancellationToken ct = default)
    {
        var period = await reportingCalendar.ResolvePeriodAsync(request.Timeframe, request.Comparison, ct);
        var result = await financialService.GetRevenueEfficiencyAsync(period, ct);
        return Ok(new RevenueEfficiencyResponseDto(
            result.GlobalAverageOrderValue,
            result.MedianPortfolioShare,
            result.Tenants.Select(r => new RevenueEfficiencyTenantResponseDto(
                r.TenantId,
                r.TenantName,
                r.Type,
                r.AverageOrderValue,
                r.PortfolioSharePercentage,
                r.GrowthVelocity,
                r.LitiumBaseUrl
            )).ToList()
        ));
    }

    /// <summary>
    /// Diverging bar chart data: volume anomalies compared to a baseline period.
    /// Portfolio view only.
    /// </summary>
    [HttpGet("volume-anomaly")]
    public async Task<ActionResult<IEnumerable<VolumeAnomalyResponseDto>>> GetVolumeAnomaly([FromQuery] PortfolioRequestDto request, CancellationToken ct = default)
    {
        var period = await reportingCalendar.ResolvePeriodAsync(request.Timeframe, request.Comparison, ct);
        var result = await financialService.GetVolumeAnomalyAsync(period, ct);
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
    public async Task<ActionResult<MomentumResponseDto>> GetMomentum([FromQuery] PortfolioRequestDto request, CancellationToken ct = default)
    {
        var period = await reportingCalendar.ResolvePeriodAsync(request.Timeframe, request.Comparison, ct);
        var result = await financialService.GetMomentumAsync(period, ct);
        return Ok(new MomentumResponseDto(
            result.MedianBaselineRevenue,
            result.GlobalGrowthPercentage,
            result.Tenants.Select(t => new MomentumTenantResponseDto(
                t.TenantId,
                t.TenantName,
                t.Type,
                t.BaselineRevenue,
                t.GrowthPercentage,
                t.CurrentRevenue,
                t.LitiumBaseUrl)).ToList()));
    }

    /// <summary>
    /// Step-line: running tally of daily growth delta. Drilldown view only.
    /// </summary>
    [HttpGet("daily-revenue-delta")]
    public async Task<ActionResult<IEnumerable<NetGrowthAdditionPointResponseDto>>> GetNetGrowthAddition([FromQuery] DrilldownRequestDto request, CancellationToken ct = default)
    {
        var period = await reportingCalendar.ResolvePeriodAsync(request.Timeframe, request.Comparison, ct);
        var result = await financialService.GetNetGrowthAdditionAsync(period, request.TenantId, ct);
        return Ok(result.Select(n => new NetGrowthAdditionPointResponseDto(
                n.Timestamp,
                n.NetGrowthAddition)).ToList());
    }

    /// <summary>
    /// Histogram of order values with adaptive binning. Drilldown view only.
    /// </summary>
    [HttpGet("order-distribution")]
    public async Task<ActionResult<IEnumerable<OrderBinResponseDto>>> GetOrderDistribution([FromQuery] OrderDistributionRequestDto request, CancellationToken ct = default)
    {
        var period = await reportingCalendar.ResolvePeriodAsync(request.Timeframe, request.Comparison, ct);
        var result = await financialService.GetOrderDistributionAsync(period, request.TenantId, request.BinCount, ct);
        return Ok(result.Select(b => new OrderBinResponseDto(
            b.BinLabel,
            b.MinValue,
            b.MaxValue,
            b.OrderCount,
            b.CumulativePercentage,
            b.KdeDensity)));
    }

    /// <summary>
    /// Heatmap data: transaction count and revenue grouped by day of week and hour.
    /// Scopes to a single tenant if tenantId is provided, otherwise portfolio-wide.
    /// </summary>
    [HttpGet("transaction-density")]
    public async Task<ActionResult<TransactionDensityResponseDto>> GetTransactionDensity([FromQuery] TransactionDensityRequestDto request, CancellationToken ct = default)
    {
        var result = await financialService.GetTransactionDensityAsync(request.Period, request.TenantId, ct);
        return Ok(new TransactionDensityResponseDto(
            result.TotalCount,
            result.MinCount,
            result.MaxCount,
            result.AverageCountPerBucket,
            result.SampleQuality,
            result.RequestedPeriod,
            result.EffectivePeriod,
            result.TimeZoneId,
            result.PeriodStart,
            result.PeriodEnd,
            result.Points.Select(p => new TransactionDensityPointResponseDto(
                p.DayOfWeek,
                p.Hour,
                p.Count,
                p.TotalRevenue)).ToList()));
    }

    /// <summary>
    /// Line-chart: running sum of absolute daily variance between current and previous periods.
    /// Scopes to a single tenant if tenantId is provided, otherwise portfolio-wide.
    /// </summary>
    [HttpGet("cumulative-growth-delta")]
    public async Task<ActionResult<IEnumerable<CumulativeGrowthDeltaPointResponseDto>>> GetCumulativeGrowthDelta([FromQuery] FinancialRequestDto request, CancellationToken ct = default)
    {
        var period = await reportingCalendar.ResolvePeriodAsync(request.Timeframe, request.Comparison, ct);
        var result = await financialService.GetCumulativeGrowthDeltaAsync(period, request.TenantId, ct);
        return Ok(result.Select(p => new CumulativeGrowthDeltaPointResponseDto(
                p.Timestamp,
                p.CurrentCumulative,
                p.PreviousCumulative,
                p.CumulativeGrowthDelta)).ToList());
    }
    
    /// <summary>
    /// List of orders
    /// NOTE: DO NOT USE FOR LARGE BATCH EXPORTS. MAX 100 RECORDS.
    /// FOR LARGE BATCH EXPORTS USE /orders/export
    /// </summary>
    [HttpGet("orders")]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetOrders([FromQuery] OrderRequestDto request, CancellationToken ct = default)
    {
        var result = await financialService.GetOrdersAsync(request.DateSince, request.DateUntil, request.CeilingCount, ct);
        return Ok(result.Select(p => new OrderDto(
            AdwaisOrderId: p.AdwaisOrderId,
            LitiumOrderId: p.LitiumOrderId,
            AdwaisTenantId: p.AdwaisTenantId,
            OrderState: p.OrderState,
            CreatedDate: p.CreatedDate,
            TotalValueIncVat: p.TotalValueIncVat,
            TotalValueExcVat: p.TotalValueExcVat,
            Currency: p.Currency,
            TenantName: p.TenantName)).ToList());
    }
}



