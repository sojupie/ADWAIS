using Domain.DTOs.Financial;
using Domain.Enums;
using Domain.Services;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Financial;

public class FinancialService(IDbContextFactory<AnalyticsDbContext> contextFactory) : IFinancialService
{
    // Sentinel tenant for unassigned monitors — excluded from portfolio aggregations
    private static readonly Guid SystemTenantGuid = new("00000000-0000-0000-0000-000000000001");

    #region Internal data model for the merge layer

    private record DailyRow(DateTime Date, Guid? TenantId, decimal Revenue, int Volume);

    #endregion

    #region Historical + Fresh Data Merge

    /// <summary>
    /// Core merge: reads materialized view data up to yesterday, then unions
    /// today's raw orders (converted from öre to SEK) to produce a unified daily dataset.
    /// </summary>
    private async Task<List<DailyRow>> GetMergedTenantDailyDataAsync(
        AnalyticsDbContext context, DateTime start, DateTime end, Guid? tenantId = null)
    {
        var yesterday = DateTime.UtcNow.Date; // today 00:00 UTC = exclusive upper bound for views
        var viewEnd = yesterday < end ? yesterday : end;

        // Step A: Historical data from materialized tenant rollup
        var historicalQuery = context.DailyTenantRollups
            .AsNoTracking()
            .Where(r => r.CreatedDate >= start && r.CreatedDate < viewEnd);

        if (tenantId.HasValue)
            historicalQuery = historicalQuery.Where(r => r.TenantId == tenantId.Value);
        else
            historicalQuery = historicalQuery.Where(r => r.TenantId != SystemTenantGuid);

        var historical = await historicalQuery
            .Select(r => new DailyRow(r.CreatedDate, r.TenantId, r.Revenue, (int)r.Volume))
            .ToListAsync();

        // Step B+C: Fresh data from raw orders table (today only)
        if (yesterday < end)
        {
            var freshStart = yesterday; // today 00:00 UTC
            var freshEnd = end;

            var freshQuery = context.Orders
                .AsNoTracking()
                .Where(o => o.CreatedDate >= freshStart && o.CreatedDate < freshEnd);

            if (tenantId.HasValue)
                freshQuery = freshQuery.Where(o => o.TenantId == tenantId.Value);
            else
                freshQuery = freshQuery.Where(o => o.TenantId != SystemTenantGuid);

            var freshRows = await freshQuery
                .GroupBy(o => new { Date = o.CreatedDate.Date, o.TenantId })
                .Select(g => new DailyRow(
                    g.Key.Date,
                    g.Key.TenantId,
                    g.Sum(o => o.TotalValueIncVat), // Already in SEK
                    g.Count()))
                .ToListAsync();

            // Step D: Union
            historical.AddRange(freshRows);
        }

        return historical;
    }

    /// <summary>
    /// Global-level merge (no tenant dimension) for top-line KPIs.
    /// Uses the global rollup view + raw orders aggregated globally.
    /// </summary>
    private async Task<List<DailyRow>> GetMergedGlobalDailyDataAsync(
        AnalyticsDbContext context, DateTime start, DateTime end)
    {
        var yesterday = DateTime.UtcNow.Date;
        var viewEnd = yesterday < end ? yesterday : end;

        var historical = await context.DailyGlobalRollups
            .AsNoTracking()
            .Where(r => r.CreatedDate >= start && r.CreatedDate < viewEnd)
            .Select(r => new DailyRow(r.CreatedDate, null, r.GlobalRevenue, (int)r.GlobalVolume))
            .ToListAsync();

        if (yesterday < end)
        {
            var freshRows = await context.Orders
                .AsNoTracking()
                .Where(o => o.CreatedDate >= yesterday && o.CreatedDate < end)
                .Where(o => o.TenantId != SystemTenantGuid)
                .GroupBy(o => o.CreatedDate.Date)
                .Select(g => new DailyRow(
                    g.Key,
                    null,
                    g.Sum(o => o.TotalValueIncVat),
                    g.Count()))
                .ToListAsync();

            historical.AddRange(freshRows);
        }

        return historical;
    }

    #endregion

    #region Widget Implementations

    public async Task<KpiDto> GetKpisAsync(Timeframe timeframe, Guid? tenantId = null)
    {
        var (currentStart, currentEnd, previousStart, _) = TimeframeResolver.Resolve(timeframe);
        await using var context = await contextFactory.CreateDbContextAsync();

        List<DailyRow> currentRows, previousRows;

        if (tenantId.HasValue)
        {
            currentRows = await GetMergedTenantDailyDataAsync(context, currentStart, currentEnd, tenantId);
            previousRows = await GetMergedTenantDailyDataAsync(context, previousStart, currentStart, tenantId);
        }
        else
        {
            currentRows = await GetMergedGlobalDailyDataAsync(context, currentStart, currentEnd);
            previousRows = await GetMergedGlobalDailyDataAsync(context, previousStart, currentStart);
        }

        var currentRevenue = currentRows.Sum(r => r.Revenue);
        var previousRevenue = previousRows.Sum(r => r.Revenue);
        var volume = currentRows.Sum(r => r.Volume);
        var growthPct = CalculateGrowthPercentage(currentRevenue, previousRevenue);
        var aov = volume > 0 ? Math.Round(currentRevenue / volume, 2) : 0m;

        return new KpiDto(currentRevenue, previousRevenue, growthPct, volume, aov);
    }

    public async Task<IReadOnlyList<VelocityPointDto>> GetVelocityAsync(Timeframe timeframe, Guid? tenantId = null)
    {
        var (currentStart, currentEnd, previousStart, daysInPeriod) = TimeframeResolver.Resolve(timeframe);
        await using var context = await contextFactory.CreateDbContextAsync();

        List<DailyRow> currentRows, previousRows;

        if (tenantId.HasValue)
        {
            currentRows = await GetMergedTenantDailyDataAsync(context, currentStart, currentEnd, tenantId);
            previousRows = await GetMergedTenantDailyDataAsync(context, previousStart, currentStart, tenantId);
        }
        else
        {
            currentRows = await GetMergedGlobalDailyDataAsync(context, currentStart, currentEnd);
            previousRows = await GetMergedGlobalDailyDataAsync(context, previousStart, currentStart);
        }

        // Index by day offset within period
        var currentByDay = currentRows
            .GroupBy(r => (r.Date - currentStart).Days)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var previousByDay = previousRows
            .GroupBy(r => (r.Date - previousStart).Days)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var result = new List<VelocityPointDto>(daysInPeriod);
        for (var i = 0; i < daysInPeriod; i++)
        {
            var cur = currentByDay.GetValueOrDefault(i, 0m);
            var prev = previousByDay.GetValueOrDefault(i, 0m);
            result.Add(new VelocityPointDto(
                $"Day {i + 1}",
                cur,
                prev,
                cur - prev));
        }

        return result;
    }

    public async Task<IReadOnlyList<GrowthExtremeDto>> GetGrowthExtremesAsync(Timeframe timeframe)
    {
        var (currentStart, currentEnd, previousStart, _) = TimeframeResolver.Resolve(timeframe);
        await using var context = await contextFactory.CreateDbContextAsync();

        var currentRows = await GetMergedTenantDailyDataAsync(context, currentStart, currentEnd);
        var previousRows = await GetMergedTenantDailyDataAsync(context, previousStart, currentStart);

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

    public async Task<IReadOnlyList<DistributionEntryDto>> GetDistributionAsync(Timeframe timeframe, int topN = 10)
    {
        var (currentStart, currentEnd, _, _) = TimeframeResolver.Resolve(timeframe);
        await using var context = await contextFactory.CreateDbContextAsync();

        var currentRows = await GetMergedTenantDailyDataAsync(context, currentStart, currentEnd);
        var tenantNames = await GetTenantNameMapAsync(context);

        var revenueByTenant = currentRows
            .GroupBy(r => r.TenantId!.Value)
            .Select(g => new { TenantId = g.Key, Revenue = g.Sum(r => r.Revenue) })
            .OrderByDescending(x => x.Revenue)
            .ToList();

        var totalRevenue = revenueByTenant.Sum(x => x.Revenue);
        if (totalRevenue == 0)
            return Array.Empty<DistributionEntryDto>();

        var result = new List<DistributionEntryDto>();
        decimal runningShare = 0;

        var topTenants = revenueByTenant.Take(topN).ToList();
        var otherTenants = revenueByTenant.Skip(topN).ToList();

        foreach (var t in topTenants)
        {
            runningShare += t.Revenue / totalRevenue;
            var name = tenantNames.GetValueOrDefault(t.TenantId, t.TenantId.ToString());
            result.Add(new DistributionEntryDto(t.TenantId, name, t.Revenue, Math.Round(runningShare, 4)));
        }

        if (otherTenants.Count > 0)
        {
            var otherRevenue = otherTenants.Sum(x => x.Revenue);
            // Force the last entry's cumulative share to exactly 1.0
            result.Add(new DistributionEntryDto(
                null,
                $"Other ({otherTenants.Count})",
                otherRevenue,
                1.0m));
        }
        else if (result.Count > 0)
        {
            // If no "Other" bucket, force last entry to 1.0
            var last = result[^1];
            result[^1] = last with { CumulativePortfolioShare = 1.0m };
        }

        return result;
    }

    public async Task<MomentumDto> GetMomentumAsync(Timeframe timeframe)
    {
        var (currentStart, currentEnd, previousStart, _) = TimeframeResolver.Resolve(timeframe);
        await using var context = await contextFactory.CreateDbContextAsync();

        var currentRows = await GetMergedTenantDailyDataAsync(context, currentStart, currentEnd);
        var previousRows = await GetMergedTenantDailyDataAsync(context, previousStart, currentStart);
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

    public async Task<IReadOnlyList<CumulativeGrowthPointDto>> GetCumulativeGrowthAsync(Timeframe timeframe, Guid tenantId)
    {
        var (currentStart, currentEnd, previousStart, daysInPeriod) = TimeframeResolver.Resolve(timeframe);
        await using var context = await contextFactory.CreateDbContextAsync();

        var currentRows = await GetMergedTenantDailyDataAsync(context, currentStart, currentEnd, tenantId);
        var previousRows = await GetMergedTenantDailyDataAsync(context, previousStart, currentStart, tenantId);

        var currentByDay = currentRows
            .GroupBy(r => (r.Date - currentStart).Days)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var previousByDay = previousRows
            .GroupBy(r => (r.Date - previousStart).Days)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Revenue));

        var result = new List<CumulativeGrowthPointDto>(daysInPeriod);
        decimal cumulative = 0;

        for (var i = 0; i < daysInPeriod; i++)
        {
            var cur = currentByDay.GetValueOrDefault(i, 0m);
            var prev = previousByDay.GetValueOrDefault(i, 0m);
            cumulative += cur - prev;
            result.Add(new CumulativeGrowthPointDto($"Day {i + 1}", cumulative));
        }

        return result;
    }

    public async Task<IReadOnlyList<OrderBinDto>> GetOrderDistributionAsync(Timeframe timeframe, Guid tenantId, int? binCount = null)
    {
        var (currentStart, currentEnd, _, _) = TimeframeResolver.Resolve(timeframe);
        await using var context = await contextFactory.CreateDbContextAsync();

        // Query raw orders directly (not views) — need individual values for histogram
        var orderValues = await context.Orders
            .AsNoTracking()
            .Where(o => o.TenantId == tenantId)
            .Where(o => o.CreatedDate >= currentStart && o.CreatedDate < currentEnd)
            .Select(o => o.TotalValueIncVat) // Already in SEK
            .ToListAsync();

        if (orderValues.Count == 0)
            return Array.Empty<OrderBinDto>();

        orderValues.Sort();

        var effectiveBinCount = binCount ?? CalculateAdaptiveBinCount(orderValues);
        effectiveBinCount = Math.Clamp(effectiveBinCount, 5, 30);

        var min = orderValues[0];
        var max = orderValues[^1];

        // Handle edge case: all orders have the same value
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

    #endregion

    #region Helpers

    private static async Task<Dictionary<Guid, string>> GetTenantNameMapAsync(AnalyticsDbContext context)
    {
        return await context.Tenants
            .AsNoTracking()
            .Where(t => t.Id != SystemTenantGuid)
            .ToDictionaryAsync(t => t.Id, t => t.Name);
    }

    private static decimal CalculateGrowthPercentage(decimal current, decimal previous)
    {
        if (previous == 0)
            return current == 0 ? 0m : 100m;

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

    /// <summary>
    /// Freedman–Diaconis rule: binWidth = 2 × IQR × n^(-1/3).
    /// Falls back to Sturges' rule if IQR = 0.
    /// </summary>
    private static int CalculateAdaptiveBinCount(List<decimal> sortedValues)
    {
        var n = sortedValues.Count;
        if (n < 2) return 5;

        var q1 = Percentile(sortedValues, 0.25);
        var q3 = Percentile(sortedValues, 0.75);
        var iqr = q3 - q1;

        if (iqr == 0)
        {
            // Sturges' rule fallback
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
