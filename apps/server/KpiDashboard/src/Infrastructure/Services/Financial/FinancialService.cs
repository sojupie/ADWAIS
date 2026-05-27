using Domain.DTOs.Financial;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Financial;

/// <summary>
/// Provides financial analytics and KPI calculations by merging historical rollup data with real-time order data.
/// </summary>
public class FinancialService(IDbContextFactory<AnalyticsDbContext> contextFactory) : IFinancialService
{
    #region Internal data model for the merge layer

    private record DataRow(DateTimeOffset Timestamp, Guid? TenantId, decimal Revenue, int Volume);

    #endregion

    #region Historical + Fresh Data Merge

    private async Task<List<DataRow>> GetMergedTenantDataAsync(
        AnalyticsDbContext context, DateTimeOffset start, DateTimeOffset end, bool isHourly, Guid? tenantId = null)
    {
        if (tenantId.HasValue)
        {
            var tenantExists = await context.Tenants.AnyAsync(t => t.Id == tenantId.Value);
            if (!tenantExists) throw new KeyNotFoundException($"Tenant {tenantId.Value} not found.");
        }

        if (isHourly)
        {
            var query = context.Orders
                .AsNoTracking()
                .Where(o => o.CreatedDate >= start && o.CreatedDate < end);

            if (tenantId.HasValue)
                query = query.Where(o => o.TenantId == tenantId.Value);
            else
                query = query.Where(o => o.TenantId != AnalyticsDbContext.SystemTenantGuid);

            var grouped = await query
                .GroupBy(o => new { 
                    o.CreatedDate.Year,
                    o.CreatedDate.Month,
                    o.CreatedDate.Day,
                    o.CreatedDate.Hour,
                    o.TenantId 
                })
                .Select(g => new {
                    g.Key.Year,
                    g.Key.Month,
                    g.Key.Day,
                    g.Key.Hour,
                    g.Key.TenantId,
                    Revenue = g.Sum(o => o.TotalValueIncVat),
                    Volume = g.Count()
                })
                .ToListAsync();

            return grouped.Select(x => new DataRow(
                new DateTimeOffset(x.Year, x.Month, x.Day, x.Hour, 0, 0, TimeSpan.Zero),
                x.TenantId,
                x.Revenue,
                x.Volume
            )).ToList();
        }

        var yesterday = new DateTimeOffset(DateTimeOffset.UtcNow.Date);
        var viewEnd = yesterday < end ? yesterday : end;
        
        var historicalQuery = context.DailyTenantRollups
            .AsNoTracking()
            .Where(r => r.CreatedDate >= start && r.CreatedDate < viewEnd);

        if (tenantId.HasValue)
            historicalQuery = historicalQuery.Where(r => r.TenantId == tenantId.Value);
        else
            historicalQuery = historicalQuery.Where(r => r.TenantId != AnalyticsDbContext.SystemTenantGuid);

        var rawHist = await historicalQuery
            .Select(r => new { r.CreatedDate, r.TenantId, r.Revenue, r.Volume })
            .ToListAsync();
        
        var historical = rawHist.Select(r => new DataRow(r.CreatedDate, r.TenantId, r.Revenue, (int)r.Volume)).ToList();
        
        if (yesterday < end)
        {
            var freshQuery = context.Orders
                .AsNoTracking()
                .Where(o => o.CreatedDate >= yesterday && o.CreatedDate < end);

            if (tenantId.HasValue)
                freshQuery = freshQuery.Where(o => o.TenantId == tenantId.Value);
            else
                freshQuery = freshQuery.Where(o => o.TenantId != AnalyticsDbContext.SystemTenantGuid);

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
                .ToListAsync();
            
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
        AnalyticsDbContext context, DateTimeOffset start, DateTimeOffset end, bool isHourly)
    {
        if (isHourly)
        {
            var grouped = await context.Orders
                .AsNoTracking()
                .Where(o => o.CreatedDate >= start && o.CreatedDate < end)
                .Where(o => o.TenantId != AnalyticsDbContext.SystemTenantGuid)
                .GroupBy(o => new { o.CreatedDate.Year, o.CreatedDate.Month, o.CreatedDate.Day, o.CreatedDate.Hour })
                .Select(g => new {
                    g.Key.Year,
                    g.Key.Month,
                    g.Key.Day,
                    g.Key.Hour,
                    Revenue = g.Sum(o => o.TotalValueIncVat),
                    Volume = g.Count()
                })
                .ToListAsync();

            return grouped.Select(x => new DataRow(
                new DateTimeOffset(x.Year, x.Month, x.Day, x.Hour, 0, 0, TimeSpan.Zero),
                null,
                x.Revenue,
                x.Volume
            )).ToList();
        }

        var yesterday = new DateTimeOffset(DateTimeOffset.UtcNow.Date);
        var viewEnd = yesterday < end ? yesterday : end;

        var rawHist = await context.DailyGlobalRollups
            .AsNoTracking()
            .Where(r => r.CreatedDate >= start && r.CreatedDate < viewEnd)
            .Select(r => new { r.CreatedDate, r.GlobalRevenue, r.GlobalVolume })
            .ToListAsync();

        var historical = rawHist.Select(r => new DataRow(r.CreatedDate, null, r.GlobalRevenue, (int)r.GlobalVolume)).ToList();

        if (yesterday < end)
        {
            var freshRows = await context.Orders
                .AsNoTracking()
                .Where(o => o.CreatedDate >= yesterday && o.CreatedDate < end)
                .Where(o => o.TenantId != AnalyticsDbContext.SystemTenantGuid)
                .GroupBy(o => new { o.CreatedDate.Year, o.CreatedDate.Month, o.CreatedDate.Day })
                .Select(g => new {
                    g.Key.Year,
                    g.Key.Month,
                    g.Key.Day,
                    Revenue = g.Sum(o => o.TotalValueIncVat),
                    Volume = g.Count()
                })
                .ToListAsync();

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
    public async Task<KpiDto> GetKpisAsync(Timeframe timeframe, Guid? tenantId = null)
    {
        var (currentStart, currentEnd, previousStart, _, isHourly, _) = TimeframeResolver.Resolve(timeframe);
        await using var context = await contextFactory.CreateDbContextAsync();

        List<DataRow> currentRows, previousRows;

        if (tenantId.HasValue)
        {
            currentRows = await GetMergedTenantDataAsync(context, currentStart, currentEnd, isHourly, tenantId);
            previousRows = await GetMergedTenantDataAsync(context, previousStart, currentStart, isHourly, tenantId);
        }
        else
        {
            currentRows = await GetMergedGlobalDataAsync(context, currentStart, currentEnd, isHourly);
            previousRows = await GetMergedGlobalDataAsync(context, previousStart, currentStart, isHourly);
        }

        var currentRevenue = currentRows.Sum(r => r.Revenue);
        var previousRevenue = previousRows.Sum(r => r.Revenue);
        var volume = currentRows.Sum(r => r.Volume);
        var growthPct = CalculateGrowthPercentage(currentRevenue, previousRevenue);
        var aov = volume > 0 ? Math.Round(currentRevenue / volume, 2) : 0m;

        return new KpiDto(currentRevenue, previousRevenue, growthPct, volume, aov);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<VelocityPointDto>> GetVelocityAsync(Timeframe timeframe, Guid? tenantId = null)
    {
        var (currentStart, currentEnd, previousStart, steps, isHourly, includeActualTime) = TimeframeResolver.Resolve(timeframe);
        await using var context = await contextFactory.CreateDbContextAsync();

        List<DataRow> currentRows, previousRows;

        if (tenantId.HasValue)
        {
            currentRows = await GetMergedTenantDataAsync(context, currentStart, currentEnd, isHourly, tenantId);
            previousRows = await GetMergedTenantDataAsync(context, previousStart, currentStart, isHourly, tenantId);
        }
        else
        {
            currentRows = await GetMergedGlobalDataAsync(context, currentStart, currentEnd, isHourly);
            previousRows = await GetMergedGlobalDataAsync(context, previousStart, currentStart, isHourly);
        }

        var currentByStep = currentRows
            .GroupBy(r => isHourly ? (int)(r.Timestamp - currentStart).TotalHours : (int)(r.Timestamp - currentStart).TotalDays)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var previousByStep = previousRows
            .GroupBy(r => isHourly ? (int)(r.Timestamp - previousStart).TotalHours : (int)(r.Timestamp - previousStart).TotalDays)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var points = new List<VelocityPointDto>(steps);
        for (var i = 0; i < steps; i++)
        {
            var timestamp = isHourly ? currentStart.AddHours(i) : currentStart.AddDays(i);
            var isLast = i == steps - 1;
            var label = isHourly 
                ? (isLast && includeActualTime ? currentEnd.ToString("HH:mm") : timestamp.ToString("HH:mm")) 
                : $"Day {i + 1}";
            
            var cur = currentByStep.GetValueOrDefault(i, 0m);
            var prev = previousByStep.GetValueOrDefault(i, 0m);
            points.Add(new VelocityPointDto(
                label,
                timestamp,
                cur,
                prev,
                cur - prev));
        }

        return points;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<GrowthExtremeDto>> GetGrowthExtremesAsync(Timeframe timeframe)
    {
        var (currentStart, currentEnd, previousStart, _, isHourly, _) = TimeframeResolver.Resolve(timeframe);
        await using var context = await contextFactory.CreateDbContextAsync();

        var currentRows = await GetMergedTenantDataAsync(context, currentStart, currentEnd, isHourly);
        var previousRows = await GetMergedTenantDataAsync(context, previousStart, currentStart, isHourly);

        var tenantNames = await GetTenantNameMapAsync(context);

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
    public async Task<IReadOnlyList<RevenueEfficiencyDto>> GetRevenueEfficiencyAsync(Timeframe timeframe)
    {
        var (currentStart, currentEnd, previousStart, _, isHourly, _) = TimeframeResolver.Resolve(timeframe);
        await using var context = await contextFactory.CreateDbContextAsync();

        var currentRows = await GetMergedTenantDataAsync(context, currentStart, currentEnd, isHourly);
        var previousRows = await GetMergedTenantDataAsync(context, previousStart, currentStart, isHourly);
        
        var tenantDetails = await context.Tenants
            .AsNoTracking()
            .Where(t => t.Id != AnalyticsDbContext.SystemTenantGuid)
            .Select(t => new { t.Id, t.Name, t.Type })
            .ToDictionaryAsync(t => t.Id);

        var currentByTenant = currentRows
            .Where(r => r.TenantId.HasValue && r.TenantId.Value != AnalyticsDbContext.SystemTenantGuid)
            .GroupBy(r => r.TenantId!.Value)
            .ToDictionary(g => g.Key, g => new { Revenue = g.Sum(r => r.Revenue), Volume = g.Sum(r => r.Volume) });

        var previousByTenant = previousRows
            .Where(r => r.TenantId.HasValue && r.TenantId.Value != AnalyticsDbContext.SystemTenantGuid)
            .GroupBy(r => r.TenantId!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var totalRevenue = currentByTenant.Values.Sum(x => x.Revenue);

        return currentByTenant.Keys.Union(previousByTenant.Keys)
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

                return new RevenueEfficiencyDto(tid, details.Name, details.Type, aov, share, growth);
            })
            .ToList();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<VolumeAnomalyDto>> GetVolumeAnomalyAsync(Timeframe timeframe)
    {
        var (currentStart, currentEnd, previousStart, _, isHourly, _) = TimeframeResolver.Resolve(timeframe);
        
        var timeframeDuration = currentEnd - currentStart;
        if (timeframeDuration < TimeSpan.FromDays(30))
        {
            previousStart = currentStart.AddDays(-30);
        }
        var previousDuration = currentStart - previousStart;
        var durationRatio = (decimal)timeframeDuration.TotalDays / (decimal)Math.Max(1, previousDuration.TotalDays);

        await using var context = await contextFactory.CreateDbContextAsync();

        var currentRows = await GetMergedTenantDataAsync(context, currentStart, currentEnd, isHourly);
        var previousRows = await GetMergedTenantDataAsync(context, previousStart, currentStart, isHourly);
        
        var tenantDetails = await context.Tenants
            .AsNoTracking()
            .Where(t => t.Id != AnalyticsDbContext.SystemTenantGuid)
            .Select(t => new { t.Id, t.Name })
            .ToDictionaryAsync(t => t.Id);

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
    public async Task<MomentumDto> GetMomentumAsync(Timeframe timeframe)
    {
        var (currentStart, currentEnd, previousStart, _, isHourly, _) = TimeframeResolver.Resolve(timeframe);
        await using var context = await contextFactory.CreateDbContextAsync();

        var currentRows = await GetMergedTenantDataAsync(context, currentStart, currentEnd, isHourly);
        var previousRows = await GetMergedTenantDataAsync(context, previousStart, currentStart, isHourly);
        var tenantNames = await GetTenantNameMapAsync(context);

        var currentByTenant = currentRows
            .GroupBy(r => r.TenantId!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var previousByTenant = previousRows
            .GroupBy(r => r.TenantId!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var allTenantIds = currentByTenant.Keys.Union(previousByTenant.Keys).ToList();

        var tenants = allTenantIds
            .Select(tid =>
            {
                var cur = currentByTenant.GetValueOrDefault(tid, 0m);
                var prev = previousByTenant.GetValueOrDefault(tid, 0m);
                var growth = CalculateGrowthPercentage(cur, prev);
                var name = tenantNames.GetValueOrDefault(tid, tid.ToString());
                return new MomentumTenantDto(tid, name, prev, growth, cur);
            })
            .ToList();

        var baselines = tenants
            .Select(t => t.BaselineRevenue)
            .OrderBy(b => b)
            .ToList();

        var median = CalculateMedian(baselines);

        return new MomentumDto(median, tenants);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<NetGrowthAdditionPointDto>> GetNetGrowthAdditionAsync(Timeframe timeframe, Guid tenantId)
    {
        var (currentStart, currentEnd, _, steps, isHourly, includeActualTime) = TimeframeResolver.Resolve(timeframe);
        await using var context = await contextFactory.CreateDbContextAsync();

        var currentRows = await GetMergedTenantDataAsync(context, currentStart, currentEnd, isHourly, tenantId);

        var lookbackStart = isHourly ? currentStart.AddHours(-1) : currentStart.AddDays(-1);
        var beforeStartRows = await GetMergedTenantDataAsync(context, lookbackStart, currentStart, isHourly, tenantId);
        var previousValue = beforeStartRows.Sum(r => r.Revenue);

        var currentByStep = currentRows
            .GroupBy(r => isHourly ? (int)(r.Timestamp - currentStart).TotalHours : (int)(r.Timestamp - currentStart).TotalDays)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var points = new List<NetGrowthAdditionPointDto>(steps);

        for (var i = 0; i < steps; i++)
        {
            var timestamp = isHourly ? currentStart.AddHours(i) : currentStart.AddDays(i);
            var isLast = i == steps - 1;
            var label = isHourly 
                ? (isLast && includeActualTime ? currentEnd.ToString("HH:mm") : timestamp.ToString("HH:mm")) 
                : $"Day {i + 1}";
            
            var cur = currentByStep.GetValueOrDefault(i, 0m);
            var delta = cur - previousValue;
            points.Add(new NetGrowthAdditionPointDto(label, timestamp, delta));
            previousValue = cur;
        }

        return points;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<OrderBinDto>> GetOrderDistributionAsync(Timeframe timeframe, Guid tenantId, int? binCount = null)
    {
        var (currentStart, currentEnd, _, _, _, _) = TimeframeResolver.Resolve(timeframe);
        await using var context = await contextFactory.CreateDbContextAsync();

        var orderValues = await context.Orders
            .AsNoTracking()
            .Where(o => o.TenantId == tenantId)
            .Where(o => o.CreatedDate >= currentStart && o.CreatedDate < currentEnd)
            .Select(o => o.TotalValueIncVat)
            .ToListAsync();

        if (orderValues.Count == 0)
            return Array.Empty<OrderBinDto>();

        orderValues.Sort();

        var effectiveBinCount = binCount ?? CalculateAdaptiveBinCount(orderValues);
        effectiveBinCount = Math.Clamp(effectiveBinCount, 5, 30);

        var min = orderValues[0];
        var max = orderValues[^1];

        if (min == max)
        {
            return new[]
            {
                new OrderBinDto(
                    FormatBinLabel(min, max),
                    min,
                    max,
                    orderValues.Count)
            };
        }

        var binWidth = (max - min) / effectiveBinCount;

        var bins = new List<OrderBinDto>(effectiveBinCount);
        for (var i = 0; i < effectiveBinCount; i++)
        {
            var binMin = min + i * binWidth;
            var binMax = i == effectiveBinCount - 1 ? max : min + (i + 1) * binWidth;

            var count = i == effectiveBinCount - 1
                ? orderValues.Count(v => v >= binMin && v <= binMax)
                : orderValues.Count(v => v >= binMin && v < binMax);

            bins.Add(new OrderBinDto(
                FormatBinLabel(binMin, binMax),
                Math.Round(binMin, 2),
                Math.Round(binMax, 2),
                count));
        }

        return bins;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<TransactionDensityPointDto>> GetTransactionDensityAsync(Timeframe timeframe, Guid? tenantId = null)
    {
        var (currentStart, currentEnd, _, _, _, _) = TimeframeResolver.Resolve(timeframe);
        await using var context = await contextFactory.CreateDbContextAsync();

        var query = context.Orders
            .AsNoTracking()
            .Where(o => o.CreatedDate >= currentStart && o.CreatedDate < currentEnd);

        if (tenantId.HasValue)
            query = query.Where(o => o.TenantId == tenantId.Value);
        else
            query = query.Where(o => o.TenantId != AnalyticsDbContext.SystemTenantGuid);

        
        var data = await query
            .GroupBy(o => new { DayOfWeek = (int)o.CreatedDate.DayOfWeek, o.CreatedDate.Hour })
            .Select(g => new {
                g.Key.DayOfWeek,
                g.Key.Hour,
                Count = g.Count(),
                TotalRevenue = g.Sum(o => o.TotalValueIncVat)
            })
            .ToListAsync();

        var dataMap = data.ToDictionary(x => (x.DayOfWeek, x.Hour));
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

        return result;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<CumulativeGrowthDeltaPointDto>> GetCumulativeGrowthDeltaAsync(Timeframe timeframe, Guid? tenantId = null)
    {
        var (currentStart, currentEnd, previousStart, steps, isHourly, includeActualTime) = TimeframeResolver.Resolve(timeframe);
        await using var context = await contextFactory.CreateDbContextAsync();

        List<DataRow> currentRows, previousRows;

        if (tenantId.HasValue)
        {
            currentRows = await GetMergedTenantDataAsync(context, currentStart, currentEnd, isHourly, tenantId);
            previousRows = await GetMergedTenantDataAsync(context, previousStart, currentStart, isHourly, tenantId);
        }
        else
        {
            currentRows = await GetMergedGlobalDataAsync(context, currentStart, currentEnd, isHourly);
            previousRows = await GetMergedGlobalDataAsync(context, previousStart, currentStart, isHourly);
        }

        var currentByStep = currentRows
            .GroupBy(r => isHourly ? (int)(r.Timestamp - currentStart).TotalHours : (int)(r.Timestamp - currentStart).TotalDays)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var previousByStep = previousRows
            .GroupBy(r => isHourly ? (int)(r.Timestamp - previousStart).TotalHours : (int)(r.Timestamp - previousStart).TotalDays)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var points = new List<CumulativeGrowthDeltaPointDto>(steps);
        decimal runningSum = 0;

        for (var i = 0; i < steps; i++)
        {
            var timestamp = isHourly ? currentStart.AddHours(i) : currentStart.AddDays(i);
            var isLast = i == steps - 1;
            var label = isHourly 
                ? (isLast && includeActualTime ? currentEnd.ToString("HH:mm") : timestamp.ToString("HH:mm")) 
                : $"Day {i + 1}";

            var cur = currentByStep.GetValueOrDefault(i, 0m);
            var prev = previousByStep.GetValueOrDefault(i, 0m);
            var variance = cur - prev;
            runningSum += variance;

            points.Add(new CumulativeGrowthDeltaPointDto(label, timestamp, runningSum));
        }

        return points;
    }

    #endregion

    #region Helpers

    private static async Task<Dictionary<Guid, string>> GetTenantNameMapAsync(AnalyticsDbContext context)
    {
        return await context.Tenants
            .AsNoTracking()
            .Where(t => t.Id != AnalyticsDbContext.SystemTenantGuid)
            .ToDictionaryAsync(t => t.Id, t => t.Name);
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
