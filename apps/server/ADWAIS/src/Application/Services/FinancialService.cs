using System.Collections.Immutable;
using Adwais.Application.Common.Models;
using Adwais.Application.DTOs.Financial;
using Adwais.Application.Interfaces;
using Adwais.Application.Common.Interfaces;
using Adwais.Domain.Entities;
using Adwais.Domain.Entities.Monitoring;
using Adwais.Domain.Entities.OrderData;
using Adwais.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Application.Services;

/// <summary>
/// Provides financial analytics and KPI calculations by merging historical rollup data with real-time order data.
/// </summary>
public class FinancialService(
    IApplicationDbContext dbContext,
    IReportingCalendar reportingCalendar) : IFinancialService
{
    private const int DensityBucketCount = 7 * 24;
    private const int SparseDensityThreshold = DensityBucketCount * 5;
    private const int StableDensityThreshold = DensityBucketCount * 20;
    private readonly IApplicationDbContext _dbContext = dbContext;
    private readonly IReportingCalendar _reportingCalendar = reportingCalendar;

    #region Internal data model for the merge layer

    private record DataRow(DateTimeOffset Timestamp, Guid? TenantId, decimal Revenue, int Volume);

    #endregion

    #region Historical + Fresh Data Merge

    private async Task<List<DataRow>> GetMergedTenantDataAsync(
        IApplicationDbContext context, DateTimeOffset start, DateTimeOffset end, bool isHourly, Guid? tenantId = null, CancellationToken ct = default)
    {
        if (tenantId.HasValue)
        {
            var tenantExists = await context.Tenants.AnyAsync(t => t.Id == tenantId.Value, ct);
            if (!tenantExists) throw new KeyNotFoundException($"Tenant {tenantId.Value} not found.");
        }

        if (isHourly)
        {
            var query = context.Orders
                .AsNoTracking()
                .Where(o => o.OrderState != OrderState.Cancelled)
                .Where(o => o.CreatedDate >= start && o.CreatedDate < end);

            if (tenantId.HasValue)
                query = query.Where(o => o.TenantId == tenantId.Value);
            else
                query = query.Where(o => o.TenantId != IApplicationDbContext.SystemTenantGuid);

            var rows = await query
                .Select(o => new { o.CreatedDate, o.TenantId, o.TotalValueIncVat })
                .ToListAsync(ct);

            return rows.Select(x => new DataRow(
                x.CreatedDate,
                x.TenantId,
                x.TotalValueIncVat,
                1
            )).ToList();
        }

        var timeZone = await _reportingCalendar.GetTimeZoneAsync(ct);
        var currentDayStart = _reportingCalendar.GetStartOfDayUtc(DateTimeOffset.UtcNow, timeZone);
        var viewEnd = currentDayStart < end ? currentDayStart : end;
        
        var historicalQuery = context.DailyTenantRollups
            .AsNoTracking()
            .Where(r => r.CreatedDate >= start && r.CreatedDate < viewEnd);

        if (tenantId.HasValue)
            historicalQuery = historicalQuery.Where(r => r.TenantId == tenantId.Value);
        else
            historicalQuery = historicalQuery.Where(r => r.TenantId != IApplicationDbContext.SystemTenantGuid);

        var rawHist = await historicalQuery
            .Select(r => new { r.CreatedDate, r.TenantId, r.Revenue, r.Volume })
            .ToListAsync(ct);
        
        var historical = rawHist.Select(r => new DataRow(r.CreatedDate, r.TenantId, r.Revenue, (int)r.Volume)).ToList();
        
        if (currentDayStart < end)
        {
            var freshQuery = context.Orders
                .AsNoTracking()
                .Where(o => o.OrderState != OrderState.Cancelled)
                .Where(o => o.CreatedDate >= currentDayStart && o.CreatedDate < end);

            if (tenantId.HasValue)
                freshQuery = freshQuery.Where(o => o.TenantId == tenantId.Value);
            else
                freshQuery = freshQuery.Where(o => o.TenantId != IApplicationDbContext.SystemTenantGuid);

            var freshRows = await freshQuery
                .GroupBy(o => new { o.CreatedDate.Year, o.CreatedDate.Month, o.CreatedDate.Day, o.TenantId })
                .Select(g => new {
                    g.Key.Year,
                    g.Key.Month,
                    g.Key.Day,
                    g.Key.TenantId,
                    Revenue = g.Sum(o => o.TotalValueIncVat),
                    Volume = g.Count()
                })
                .ToListAsync(ct);
            
            historical.AddRange(freshRows.Select(x => new DataRow(
                new DateTimeOffset(x.Year, x.Month, x.Day, 0, 0, 0, TimeSpan.Zero),
                x.TenantId,
                x.Revenue,
                x.Volume
            )));
        }

        return historical;
    }

    private async Task<List<DataRow>> GetMergedGlobalDataAsync(
        IApplicationDbContext context, DateTimeOffset start, DateTimeOffset end, bool isHourly, CancellationToken ct = default)
    {
        if (isHourly)
        {
            var rows = await context.Orders
                .AsNoTracking()
                .Where(o => o.OrderState != OrderState.Cancelled)
                .Where(o => o.CreatedDate >= start && o.CreatedDate < end)
                .Where(o => o.TenantId != IApplicationDbContext.SystemTenantGuid)
                .Select(o => new { o.CreatedDate, o.TotalValueIncVat })
                .ToListAsync(ct);

            return rows.Select(x => new DataRow(
                x.CreatedDate,
                null,
                x.TotalValueIncVat,
                1
            )).ToList();
        }

        var timeZone = await _reportingCalendar.GetTimeZoneAsync(ct);
        var currentDayStart = _reportingCalendar.GetStartOfDayUtc(DateTimeOffset.UtcNow, timeZone);
        var viewEnd = currentDayStart < end ? currentDayStart : end;

        var rawHist = await context.DailyGlobalRollups
            .AsNoTracking()
            .Where(r => r.CreatedDate >= start && r.CreatedDate < viewEnd)
            .Select(r => new { r.CreatedDate, r.GlobalRevenue, r.GlobalVolume })
            .ToListAsync(ct);

        var historical = rawHist.Select(r => new DataRow(r.CreatedDate, null, r.GlobalRevenue, (int)r.GlobalVolume)).ToList();

        if (currentDayStart < end)
        {
            var freshRows = await context.Orders
                .AsNoTracking()
                .Where(o => o.OrderState != OrderState.Cancelled)
                .Where(o => o.CreatedDate >= currentDayStart && o.CreatedDate < end)
                .Where(o => o.TenantId != IApplicationDbContext.SystemTenantGuid)
                .GroupBy(o => new { o.CreatedDate.Year, o.CreatedDate.Month, o.CreatedDate.Day })
                .Select(g => new {
                    g.Key.Year,
                    g.Key.Month,
                    g.Key.Day,
                    Revenue = g.Sum(o => o.TotalValueIncVat),
                    Volume = g.Count()
                })
                .ToListAsync(ct);

            historical.AddRange(freshRows.Select(x => new DataRow(
                new DateTimeOffset(x.Year, x.Month, x.Day, 0, 0, 0, TimeSpan.Zero),
                null,
                x.Revenue,
                x.Volume
            )));
        }

        return historical;
    }

    #endregion

    #region Widget Implementations

    /// <inheritdoc />
    public async Task<KpiDto> GetKpisAsync(ResolvedPeriod period, Guid? tenantId = null, CancellationToken ct = default)
    {
        var currentStart = period.CurrentStart;
        var currentEnd = period.CurrentEnd;
        var previousStart = period.PreviousStart;
        var isHourly = period.IsHourly;
        var context = _dbContext;

        var currentRows = await GetMergedTenantDataAsync(context, currentStart, currentEnd, isHourly, tenantId, ct);
        var previousRows = await GetMergedTenantDataAsync(context, previousStart, period.PreviousEnd, isHourly, tenantId, ct);

        var currentRevenue = currentRows.Sum(r => r.Revenue);
        var previousRevenue = previousRows.Sum(r => r.Revenue);
        var volume = currentRows.Sum(r => r.Volume);
        var previousVolume = previousRows.Sum(r => r.Volume);
        
        var activeTenants = currentRows.Where(r => r.Revenue > 0 && r.TenantId.HasValue).Select(r => r.TenantId!.Value).Distinct().Count();
        var prevActiveTenants = previousRows.Where(r => r.Revenue > 0 && r.TenantId.HasValue).Select(r => r.TenantId!.Value).Distinct().Count();

        var growthPct = CalculateGrowthPercentage(currentRevenue, previousRevenue);
        var volumeGrowthPct = CalculateGrowthPercentage(volume, previousVolume);
        var activeTenantsGrowthPct = CalculateGrowthPercentage(activeTenants, prevActiveTenants);
        
        var aov = volume > 0 ? Math.Round(currentRevenue / volume, 2) : 0m;
        var previousAov = previousVolume > 0 ? Math.Round(previousRevenue / previousVolume, 2) : 0m;
        var aovGrowthPct = CalculateGrowthPercentage(aov, previousAov);

        var arpt = activeTenants > 0 ? Math.Round(currentRevenue / activeTenants, 2) : 0m;
        var prevArpt = prevActiveTenants > 0 ? Math.Round(previousRevenue / prevActiveTenants, 2) : 0m;
        var arptGrowthPct = CalculateGrowthPercentage(arpt, prevArpt);

        return new KpiDto(currentRevenue, previousRevenue, growthPct, volume, volumeGrowthPct, aov, aovGrowthPct, activeTenants, activeTenantsGrowthPct, arpt, arptGrowthPct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<VelocityPointDto>> GetVelocityAsync(ResolvedPeriod period, Guid? tenantId = null, CancellationToken ct = default)
    {
        var currentStart = period.CurrentStart;
        var currentEnd = period.CurrentEnd;
        var previousStart = period.PreviousStart;
        var steps = period.StepsInPeriod;
        var isHourly = period.IsHourly;
        var includeActualTime = period.IncludeActualTime;
        var context = _dbContext;

        List<DataRow> currentRows, previousRows;

        if (tenantId.HasValue)
        {
            currentRows = await GetMergedTenantDataAsync(context, currentStart, currentEnd, isHourly, tenantId, ct);
            previousRows = await GetMergedTenantDataAsync(context, previousStart, period.PreviousEnd, isHourly, tenantId, ct);
        }
        else
        {
            currentRows = await GetMergedGlobalDataAsync(context, currentStart, currentEnd, isHourly, ct);
            previousRows = await GetMergedGlobalDataAsync(context, previousStart, period.PreviousEnd, isHourly, ct);
        }

        var roundedTotalHours = Math.Ceiling((currentEnd - currentStart).TotalHours);
        var binSizeHours = isHourly 
            ? roundedTotalHours / steps 
            : 24;

        var currentByStep = currentRows
            .GroupBy(r => (int)((r.Timestamp - currentStart).TotalHours / binSizeHours))
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var previousByStep = previousRows
            .GroupBy(r => (int)((r.Timestamp - previousStart).TotalHours / binSizeHours))
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var points = new List<VelocityPointDto>(steps);
        for (var i = 0; i < steps; i++)
        {
            var timestamp = isHourly 
                ? currentStart.AddHours((i + 1) * binSizeHours) 
                : currentStart.AddDays(i);

            if (isHourly && i == steps - 1)
            {
                timestamp = currentEnd;
            }

            var cur = currentByStep.GetValueOrDefault(i, 0m);
            var prev = previousByStep.GetValueOrDefault(i, 0m);
            points.Add(new VelocityPointDto(
                timestamp,
                cur,
                prev,
                cur - prev));
        }

        return points;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AccumulatedRevenuePointDto>> GetAccumulatedRevenueAsync(ResolvedPeriod period, Guid? tenantId = null, CancellationToken ct = default)
    {
        var currentStart = period.CurrentStart;
        var currentEnd = period.CurrentEnd;
        var previousStart = period.PreviousStart;
        var steps = period.StepsInPeriod;
        var isHourly = period.IsHourly;
        var includeActualTime = period.IncludeActualTime;
        var context = _dbContext;

        List<DataRow> currentRows, previousRows;

        if (tenantId.HasValue)
        {
            currentRows = await GetMergedTenantDataAsync(context, currentStart, currentEnd, isHourly, tenantId, ct);
            previousRows = await GetMergedTenantDataAsync(context, previousStart, period.PreviousEnd, isHourly, tenantId, ct);
        }
        else
        {
            currentRows = await GetMergedGlobalDataAsync(context, currentStart, currentEnd, isHourly, ct);
            previousRows = await GetMergedGlobalDataAsync(context, previousStart, period.PreviousEnd, isHourly, ct);
        }

        // Determine bin size (Day, Week, Month)
        var binSizeDays = 1;
        if (!isHourly)
        {
            if (steps > 180) binSizeDays = 30; // Approx Month
            else if (steps > 31) binSizeDays = 7; // Week
        }

        var binnedSteps = isHourly ? steps : (int)Math.Ceiling((double)steps / binSizeDays);
        var roundedTotalHours = Math.Ceiling((currentEnd - currentStart).TotalHours);
        var binSizeHours = isHourly 
            ? roundedTotalHours / binnedSteps 
            : binSizeDays * 24;

        var currentByStep = currentRows
            .GroupBy(r => (int)((r.Timestamp - currentStart).TotalHours / binSizeHours))
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var previousByStep = previousRows
            .GroupBy(r => (int)((r.Timestamp - previousStart).TotalHours / binSizeHours))
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var points = new List<AccumulatedRevenuePointDto>(binnedSteps);
        decimal runningCur = 0;
        decimal runningPrev = 0;

        for (var i = 0; i < binnedSteps; i++)
        {
            var timestamp = isHourly 
                ? currentStart.AddHours((i + 1) * binSizeHours) 
                : currentStart.AddDays(i * binSizeDays);

            if (isHourly && i == binnedSteps - 1)
            {
                timestamp = currentEnd;
            }
            
            var curRev = currentByStep.GetValueOrDefault(i, 0m);
            var prevRev = previousByStep.GetValueOrDefault(i, 0m);
            
            runningCur += curRev;
            runningPrev += prevRev;

            points.Add(new AccumulatedRevenuePointDto(
                timestamp,
                curRev,
                prevRev,
                runningCur,
                runningPrev));
        }

        return points;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<GrowthExtremeDto>> GetGrowthExtremesAsync(ResolvedPeriod period, CancellationToken ct = default)
    {
        var currentStart = period.CurrentStart;
        var currentEnd = period.CurrentEnd;
        var previousStart = period.PreviousStart;
        var isHourly = period.IsHourly;
        var context = _dbContext;

        var currentRows = await GetMergedTenantDataAsync(context, currentStart, currentEnd, isHourly, ct: ct);
        var previousRows = await GetMergedTenantDataAsync(context, previousStart, period.PreviousEnd, isHourly, ct: ct);

        var tenantNames = await GetTenantNameMapAsync(context, ct);

        var currentByTenant = currentRows
            .GroupBy(r => r.TenantId!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var previousByTenant = previousRows
            .GroupBy(r => r.TenantId!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var allTenantIds = currentByTenant.Keys.Union(previousByTenant.Keys);

        return allTenantIds
            .Select(tid =>
            {
                var cur = currentByTenant.GetValueOrDefault(tid, 0m);
                var prev = previousByTenant.GetValueOrDefault(tid, 0m);
                var growth = CalculateGrowthPercentage(cur, prev);
                var name = tenantNames.GetValueOrDefault(tid, tid.ToString());
                return new GrowthExtremeDto(tid, name, cur, prev, growth, cur - prev);
            })
            .OrderByDescending(g => g.GrowthPercentage)
            .ToList();
    }

    /// <inheritdoc />
    public async Task<RevenueEfficiencyDto> GetRevenueEfficiencyAsync(ResolvedPeriod period, CancellationToken ct = default)
    {
        var currentStart = period.CurrentStart;
        var currentEnd = period.CurrentEnd;
        var previousStart = period.PreviousStart;
        var isHourly = period.IsHourly;
        var context = _dbContext;

        var currentRows = await GetMergedTenantDataAsync(context, currentStart, currentEnd, isHourly, ct: ct);
        var previousRows = await GetMergedTenantDataAsync(context, previousStart, period.PreviousEnd, isHourly, ct: ct);
        
        var tenantDetails = await context.Tenants
            .AsNoTracking()
            .Where(t => t.Id != IApplicationDbContext.SystemTenantGuid)
            .Select(t => new { t.Id, t.Name, t.Type, t.LitiumBaseUrl })
            .ToDictionaryAsync(t => t.Id, ct);

        var currentByTenant = currentRows
            .Where(r => r.TenantId.HasValue && r.TenantId.Value != IApplicationDbContext.SystemTenantGuid)
            .GroupBy(r => r.TenantId!.Value)
            .ToDictionary(g => g.Key, g => new { Revenue = g.Sum(r => r.Revenue), Volume = g.Sum(r => r.Volume) });

        var previousByTenant = previousRows
            .Where(r => r.TenantId.HasValue && r.TenantId.Value != IApplicationDbContext.SystemTenantGuid)
            .GroupBy(r => r.TenantId!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var totalRevenue = currentByTenant.Values.Sum(x => x.Revenue);
        var totalVolume = currentByTenant.Values.Sum(x => x.Volume);
        var globalAov = totalVolume > 0 ? Math.Round(totalRevenue / totalVolume, 2) : 0m;

        var tenants = currentByTenant.Keys.Union(previousByTenant.Keys)
            .Where(tid => tenantDetails.ContainsKey(tid))
            .Select(tid =>
            {
                var current = currentByTenant.GetValueOrDefault(tid);
                var curRev = current?.Revenue ?? 0m;
                var curVol = current?.Volume ?? 0;
                var prevRev = previousByTenant.GetValueOrDefault(tid, 0m);

                var aov = curVol > 0 ? Math.Round(curRev / curVol, 2) : 0m;
                var share = totalRevenue > 0 ? Math.Round((curRev / totalRevenue) * 100, 2) : 0m;
                var growth = CalculateGrowthPercentage(curRev, prevRev);
                var details = tenantDetails[tid];

                return new RevenueEfficiencyTenantDto(tid, details.Name, details.Type, aov, share, growth, details.LitiumBaseUrl);
            })
            .ToList();

        var medianPortfolioShare = tenants.Count > 0 
            ? CalculateMedian(tenants.Select(t => t.PortfolioSharePercentage).OrderBy(r => r).ToList()) 
            : 0m;

        return new RevenueEfficiencyDto(globalAov, medianPortfolioShare, tenants);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<VolumeAnomalyDto>> GetVolumeAnomalyAsync(ResolvedPeriod period, CancellationToken ct = default)
    {
        var currentStart = period.CurrentStart;
        var currentEnd = period.CurrentEnd;
        var previousStart = period.PreviousStart;
        var isHourly = period.IsHourly;
        
        var timeframeDuration = currentEnd - currentStart;
        if (timeframeDuration < TimeSpan.FromDays(30))
        {
            previousStart = currentStart.AddDays(-30);
        }
        var previousDuration = currentStart - previousStart;
        var durationRatio = (decimal)timeframeDuration.TotalDays / (decimal)Math.Max(1, previousDuration.TotalDays);

        var context = _dbContext;

        // Volume anomaly only calculates aggregate totals and does not need hourly resolution. 
        // Forcing 'false' ensures we use the fast DailyTenantRollups materialized view for the 30-day baseline 
        // instead of doing an expensive raw query on the Orders table when the timeframe is "Today" (1d).
        var currentRows = await GetMergedTenantDataAsync(context, currentStart, currentEnd, false, ct: ct);
        var previousRows = await GetMergedTenantDataAsync(context, previousStart, period.PreviousEnd, false, ct: ct);
        
        var tenantDetails = await context.Tenants
            .AsNoTracking()
            .Where(t => t.Id != IApplicationDbContext.SystemTenantGuid)
            .Select(t => new { t.Id, t.Name })
            .ToDictionaryAsync(t => t.Id, ct);

        var currentVolumeByTenant = currentRows
            .GroupBy(r => r.TenantId!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Volume));

        var previousVolumeByTenant = previousRows
            .GroupBy(r => r.TenantId!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Volume));

        return tenantDetails.Keys
            .Select(tid =>
            {
                var currentVol = currentVolumeByTenant.GetValueOrDefault(tid, 0);
                var prevVolRaw = previousVolumeByTenant.GetValueOrDefault(tid, 0);
                
                var baselineVol = Math.Round(prevVolRaw * durationRatio, 2);
                
                var deviation = baselineVol > 0 
                    ? Math.Round(((currentVol - baselineVol) / baselineVol) * 100, 2) 
                    : (currentVol > 0 ? 100m : 0m);

                return new VolumeAnomalyDto(tid, tenantDetails[tid].Name, deviation, currentVol, baselineVol);
            })
            .ToList();
    }

    /// <inheritdoc />
    public async Task<MomentumDto> GetMomentumAsync(ResolvedPeriod period, CancellationToken ct = default)
    {
        var currentStart = period.CurrentStart;
        var currentEnd = period.CurrentEnd;
        var previousStart = period.PreviousStart;
        var isHourly = period.IsHourly;
        var context = _dbContext;

        var currentRows = await GetMergedTenantDataAsync(context, currentStart, currentEnd, isHourly, ct: ct);
        var previousRows = await GetMergedTenantDataAsync(context, previousStart, period.PreviousEnd, isHourly, ct: ct);
        var tenantDetails = await context.Tenants
            .AsNoTracking()
            .Where(t => t.Id != IApplicationDbContext.SystemTenantGuid)
            .Select(t => new { t.Id, t.Name, t.Type, t.LitiumBaseUrl })
            .ToDictionaryAsync(t => t.Id, ct);

        var currentByTenant = currentRows
            .GroupBy(r => r.TenantId!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var previousByTenant = previousRows
            .GroupBy(r => r.TenantId!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var totalCurrentRevenue = currentByTenant.Values.Sum();
        var totalPreviousRevenue = previousByTenant.Values.Sum();
        var globalGrowthPct = CalculateGrowthPercentage(totalCurrentRevenue, totalPreviousRevenue);

        var allTenantIds = currentByTenant.Keys.Union(previousByTenant.Keys).Where(tid => tenantDetails.ContainsKey(tid)).ToList();

        var tenants = allTenantIds
            .Select(tid =>
            {
                var cur = currentByTenant.GetValueOrDefault(tid, 0m);
                var prev = previousByTenant.GetValueOrDefault(tid, 0m);
                var growth = CalculateGrowthPercentage(cur, prev);
                var details = tenantDetails[tid];

                return new MomentumTenantDto(tid, details.Name, details.Type, prev, growth, cur, details.LitiumBaseUrl);
            })
            .ToList();

        var medianBaselineRevenue = tenants.Count > 0 
            ? CalculateMedian(tenants.Select(t => t.BaselineRevenue).OrderBy(r => r).ToList()) 
            : 0m;

        return new MomentumDto(medianBaselineRevenue, globalGrowthPct, tenants);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<NetGrowthAdditionPointDto>> GetNetGrowthAdditionAsync(ResolvedPeriod period, Guid tenantId, CancellationToken ct = default)
    {
        var currentStart = period.CurrentStart;
        var currentEnd = period.CurrentEnd;
        var steps = period.StepsInPeriod;
        var isHourly = period.IsHourly;
        var includeActualTime = period.IncludeActualTime;
        var context = _dbContext;

        var currentRows = await GetMergedTenantDataAsync(context, currentStart, currentEnd, isHourly, tenantId, ct);

        var lookbackStart = isHourly ? currentStart.AddHours(-1) : currentStart.AddDays(-1);
        var beforeStartRows = await GetMergedTenantDataAsync(context, lookbackStart, currentStart, isHourly, tenantId, ct);
        var previousValue = beforeStartRows.Sum(r => r.Revenue);

        var currentByStep = currentRows
            .GroupBy(r => isHourly ? (int)(r.Timestamp - currentStart).TotalHours : (int)(r.Timestamp - currentStart).TotalDays)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var points = new List<NetGrowthAdditionPointDto>(steps);

        for (var i = 0; i < steps; i++)
        {
            var timestamp = isHourly ? currentStart.AddHours(i) : currentStart.AddDays(i);
            var cur = currentByStep.GetValueOrDefault(i, 0m);
            var delta = cur - previousValue;
            points.Add(new NetGrowthAdditionPointDto(timestamp, delta));
            previousValue = cur;
        }

        return points;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<OrderBinDto>> GetOrderDistributionAsync(ResolvedPeriod period, Guid tenantId, int? binCount = null, CancellationToken ct = default)
    {
        var currentStart = period.CurrentStart;
        var currentEnd = period.CurrentEnd;
        var context = _dbContext;

        var orderValues = await context.Orders
            .AsNoTracking()
            .Where(o => o.TenantId == tenantId)
            .Where(o => o.CreatedDate >= currentStart && o.CreatedDate < currentEnd)
            .Select(o => o.TotalValueIncVat)
            .ToListAsync(ct);

        if (orderValues.Count == 0)
            return Array.Empty<OrderBinDto>();

        orderValues.Sort();

        var effectiveBinCount = binCount ?? CalculateAdaptiveBinCount(orderValues);
        effectiveBinCount = Math.Clamp(effectiveBinCount, 5, 30);

        var min = orderValues[0];
        
        // Cap the max bin range at the 99th percentile to prevent extreme outliers from creating long tails of empty bins.
        var p99Index = (int)Math.Floor(orderValues.Count * 0.99);
        var max = p99Index > 0 ? orderValues[p99Index] : orderValues[^1];

        if (min == max)
        {
            return new[]
            {
                new OrderBinDto(
                    FormatBinLabel(min, max),
                    min,
                    max,
                    orderValues.Count,
                    100m,
                    orderValues.Count)
            };
        }

        var binWidth = (max - min) / effectiveBinCount;

        // --- KDE & CDF Calculations ---
        var n = orderValues.Count;
        var mean = orderValues.Average();
        var variance = orderValues.Select(v => (double)(v - mean)).Select(v => v * v).Average();
        var stdDev = Math.Sqrt(variance);
        if (stdDev == 0) stdDev = 1;
        // Silverman's Rule of Thumb for bandwidth (h)
        var h = 1.06 * stdDev * Math.Pow(n, -0.2);

        // Scale KDE so that it visually matches the histogram bars. 
        // Histogram bar area = count. KDE density integral = 1. Scaled KDE = density * n * binWidth.
        var scaleFactor = n * (double)binWidth;

        var bins = new List<OrderBinDto>(effectiveBinCount);
        var runningSum = 0;

        for (var i = 0; i < effectiveBinCount; i++)
        {
            var binMin = min + i * binWidth;
            var binMax = i == effectiveBinCount - 1 ? max : min + (i + 1) * binWidth;

            var count = i == effectiveBinCount - 1
                ? orderValues.Count(v => v >= binMin) // Catch all values >= max boundary
                : orderValues.Count(v => v >= binMin && v < binMax);

            runningSum += count;
            var cumulativePercentage = (decimal)runningSum / n * 100m;

            // KDE evaluation at the midpoint of the bin
            var midpoint = (double)(binMin + binMax) / 2.0;
            double densitySum = 0;
            foreach (var value in orderValues)
            {
                var u = (midpoint - (double)value) / h;
                var k = 0.3989422804 * Math.Exp(-0.5 * u * u);
                densitySum += k;
            }
            var kdeValue = (densitySum / (n * h)) * scaleFactor;

            var label = i == effectiveBinCount - 1 
                ? $"{Math.Round(binMin, 0):N0}+ SEK" 
                : FormatBinLabel(binMin, binMax);

            bins.Add(new OrderBinDto(
                label,
                Math.Round(binMin, 2),
                Math.Round(binMax, 2),
                count,
                Math.Round(cumulativePercentage, 2),
                (decimal)Math.Round(kdeValue, 2)));
        }

        return bins;
    }

    /// <inheritdoc />
    public async Task<TransactionDensityDto> GetTransactionDensityAsync(TransactionDensityPeriod requestedPeriod, Guid? tenantId = null, CancellationToken ct = default)
    {
        var context = _dbContext;
        var currentEnd = DateTimeOffset.UtcNow;
        var timeZone = await _reportingCalendar.GetTimeZoneAsync(ct);

        var query = context.Orders
            .AsNoTracking()
            .Where(o => o.OrderState != OrderState.Cancelled);

        if (tenantId.HasValue)
            query = query.Where(o => o.TenantId == tenantId.Value);
        else
            query = query.Where(o => o.TenantId != IApplicationDbContext.SystemTenantGuid);

        var starts = new Dictionary<TransactionDensityPeriod, DateTimeOffset>
        {
            [TransactionDensityPeriod.T30] = GetDensityPeriodStart(currentEnd, 30, timeZone),
            [TransactionDensityPeriod.T90] = GetDensityPeriodStart(currentEnd, 90, timeZone),
            [TransactionDensityPeriod.T180] = GetDensityPeriodStart(currentEnd, 180, timeZone),
            [TransactionDensityPeriod.T365] = GetDensityPeriodStart(currentEnd, 365, timeZone)
        };

        var effectivePeriod = requestedPeriod;
        if (requestedPeriod == TransactionDensityPeriod.Auto)
        {
            var oldestStart = starts[TransactionDensityPeriod.T365];
            var sampleCounts = await query
                .Where(o => o.CreatedDate >= oldestStart && o.CreatedDate < currentEnd)
                .GroupBy(_ => 1)
                .Select(group => new
                {
                    T30 = group.Count(o => o.CreatedDate >= starts[TransactionDensityPeriod.T30]),
                    T90 = group.Count(o => o.CreatedDate >= starts[TransactionDensityPeriod.T90]),
                    T180 = group.Count(o => o.CreatedDate >= starts[TransactionDensityPeriod.T180]),
                    T365 = group.Count()
                })
                .SingleOrDefaultAsync(ct);

            effectivePeriod = sampleCounts switch
            {
                { T30: >= StableDensityThreshold } => TransactionDensityPeriod.T30,
                { T90: >= StableDensityThreshold } => TransactionDensityPeriod.T90,
                { T180: >= StableDensityThreshold } => TransactionDensityPeriod.T180,
                _ => TransactionDensityPeriod.T365
            };
        }

        var currentStart = starts[effectivePeriod];
        var utcHourlyData = await query
            .Where(o => o.CreatedDate >= currentStart && o.CreatedDate < currentEnd)
            .GroupBy(o => new
            {
                o.CreatedDate.Year,
                o.CreatedDate.Month,
                o.CreatedDate.Day,
                o.CreatedDate.Hour
            })
            .Select(g => new {
                g.Key.Year,
                g.Key.Month,
                g.Key.Day,
                g.Key.Hour,
                Count = g.Count(),
                TotalRevenue = g.Sum(o => o.TotalValueIncVat)
            })
            .ToListAsync(ct);

        var dataMap = utcHourlyData
            .Select(point =>
            {
                var utcHour = new DateTimeOffset(point.Year, point.Month, point.Day, point.Hour, 0, 0, TimeSpan.Zero);
                var localHour = TimeZoneInfo.ConvertTime(utcHour, timeZone);
                return new
                {
                    DayOfWeek = (int)localHour.DayOfWeek,
                    localHour.Hour,
                    point.Count,
                    point.TotalRevenue
                };
            })
            .GroupBy(point => (point.DayOfWeek, point.Hour))
            .ToDictionary(
                group => group.Key,
                group => new
                {
                    Count = group.Sum(point => point.Count),
                    TotalRevenue = group.Sum(point => point.TotalRevenue)
                });
        var result = new List<TransactionDensityPointDto>(168);

        var days = new[] { 1, 2, 3, 4, 5, 6, 0 }; // 0 is Sunday in DayOfWeek

        foreach (var dow in days)
        {
            for (var h = 0; h < 24; h++)
            {
                if (dataMap.TryGetValue((dow, h), out var point))
                {
                    result.Add(new TransactionDensityPointDto(dow == 0 ? 7 : dow, h, point.Count, point.TotalRevenue));
                }
                else
                {
                    result.Add(new TransactionDensityPointDto(dow == 0 ? 7 : dow, h, 0, 0m));
                }
            }
        }

        var totalCount = result.Sum(point => point.Count);
        var sampleQuality = totalCount < SparseDensityThreshold
            ? TransactionDensitySampleQuality.Sparse
            : totalCount < StableDensityThreshold
                ? TransactionDensitySampleQuality.Indicative
                : TransactionDensitySampleQuality.Stable;

        return new TransactionDensityDto(
            totalCount,
            result.Count == 0 ? 0 : result.Min(point => point.Count),
            result.Count == 0 ? 0 : result.Max(point => point.Count),
            totalCount / (double)DensityBucketCount,
            sampleQuality,
            requestedPeriod,
            effectivePeriod,
            timeZone.Id,
            currentStart,
            currentEnd,
            result);
    }

    private static DateTimeOffset GetDensityPeriodStart(DateTimeOffset utcNow, int days, TimeZoneInfo timeZone)
    {
        var localNow = TimeZoneInfo.ConvertTime(utcNow, timeZone);
        var localStart = new DateTime(localNow.Year, localNow.Month, localNow.Day, 0, 0, 0, DateTimeKind.Unspecified)
            .AddDays(-(days - 1));
        return TimeframeResolver.ConvertLocalToUtc(localStart, timeZone);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<CumulativeGrowthDeltaPointDto>> GetCumulativeGrowthDeltaAsync(ResolvedPeriod period, Guid? tenantId = null, CancellationToken ct = default)
    {
        var currentStart = period.CurrentStart;
        var currentEnd = period.CurrentEnd;
        var previousStart = period.PreviousStart;
        var steps = period.StepsInPeriod;
        var isHourly = period.IsHourly;
        var includeActualTime = period.IncludeActualTime;
        var context = _dbContext;

        List<DataRow> currentRows, previousRows;

        if (tenantId.HasValue)
        {
            currentRows = await GetMergedTenantDataAsync(context, currentStart, currentEnd, isHourly, tenantId, ct);
            previousRows = await GetMergedTenantDataAsync(context, previousStart, period.PreviousEnd, isHourly, tenantId, ct);
        }
        else
        {
            currentRows = await GetMergedGlobalDataAsync(context, currentStart, currentEnd, isHourly, ct);
            previousRows = await GetMergedGlobalDataAsync(context, previousStart, period.PreviousEnd, isHourly, ct);
        }

        var currentByStep = currentRows
            .GroupBy(r => isHourly ? (int)(r.Timestamp - currentStart).TotalHours : (int)(r.Timestamp - currentStart).TotalDays)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var previousByStep = previousRows
            .GroupBy(r => isHourly ? (int)(r.Timestamp - previousStart).TotalHours : (int)(r.Timestamp - previousStart).TotalDays)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var points = new List<CumulativeGrowthDeltaPointDto>(steps);
        decimal runningSum = 0;
        decimal runningCur = 0;
        decimal runningPrev = 0;

        for (var i = 0; i < steps; i++)
        {
            var timestamp = isHourly ? currentStart.AddHours(i) : currentStart.AddDays(i);

            var cur = currentByStep.GetValueOrDefault(i, 0m);
            var prev = previousByStep.GetValueOrDefault(i, 0m);
            var variance = cur - prev;
            runningSum += variance;
            runningCur += cur;
            runningPrev += prev;

            points.Add(new CumulativeGrowthDeltaPointDto(timestamp, runningCur, runningPrev, runningSum));
        }

        return points;
    }

    public async Task<IReadOnlyList<OrderDto>> GetOrdersAsync(DateTimeOffset dateSince, DateTimeOffset dateUntil, int ceilingCount, CancellationToken ct)
    {
        var context = _dbContext;

        return await context.Orders
            .AsNoTracking()
            .Where(o => o.CreatedDate >= dateSince
                        && o.CreatedDate <= dateUntil
                        && o.OrderState != OrderState.Cancelled
                        && o.TotalValueIncVat > 0m)
            .OrderByDescending(o => o.CreatedDate)
            .Take(ceilingCount)
            .Select(p => new OrderDto(
                AdwaisOrderId: p.Id,
                LitiumOrderId: p.LitiumOrderId,
                AdwaisTenantId: p.TenantId,
                OrderState: p.OrderState,
                CreatedDate: p.CreatedDate,
                TotalValueIncVat: p.TotalValueIncVat,
                TotalValueExcVat: p.TotalValueExcVat,
                Currency: p.Currency,
                TenantName: p.Tenant != null ? p.Tenant.Name : null
                ))
            .ToListAsync(ct);
    }

    #endregion

    #region Helpers

    private static async Task<Dictionary<Guid, string>> GetTenantNameMapAsync(IApplicationDbContext context, CancellationToken ct = default)
    {
        return await context.Tenants
            .AsNoTracking()
            .Where(t => t.Id != IApplicationDbContext.SystemTenantGuid)
            .ToDictionaryAsync(t => t.Id, t => t.Name, ct);
    }

    private static decimal CalculateGrowthPercentage(decimal current, decimal previous)
    {
        if (previous == 0)
            return 0m;

        return Math.Round((current - previous) / previous * 100, 2);
    }

    private static decimal CalculateMedian(List<decimal> sorted)
    {
        if (sorted.Count == 0) return 0;
        var mid = sorted.Count / 2;
        return sorted.Count % 2 == 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    }

    private static int CalculateAdaptiveBinCount(List<decimal> sortedValues)
    {
        var n = sortedValues.Count;
        if (n < 2) return 5;

        var q1 = Percentile(sortedValues, 0.25);
        var q3 = Percentile(sortedValues, 0.75);
        var iqr = q3 - q1;

        if (iqr == 0)
        {
            return (int)Math.Ceiling(Math.Log2(n) + 1);
        }

        var binWidth = 2.0 * (double)iqr * Math.Pow(n, -1.0 / 3.0);
        var range = (double)(sortedValues[^1] - sortedValues[0]);
        var count = (int)Math.Ceiling(range / binWidth);

        return Math.Clamp(count, 5, 30);
    }

    private static decimal Percentile(List<decimal> sorted, double p)
    {
        var index = p * (sorted.Count - 1);
        var lower = (int)Math.Floor(index);
        var upper = (int)Math.Ceiling(index);
        if (lower == upper) return sorted[lower];

        var weight = (decimal)(index - lower);
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    }

    private static string FormatBinLabel(decimal min, decimal max)
    {
        return $"{min:N0}–{max:N0} SEK";
    }

    #endregion
}



