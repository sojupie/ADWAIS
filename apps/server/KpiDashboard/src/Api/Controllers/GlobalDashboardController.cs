using Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class GlobalDashboardController(IDbContextFactory<AnalyticsDbContext> contextFactory) : ControllerBase
{
    [HttpGet("kpis/global")]
    public async Task<IActionResult> GetGlobalKpis([FromQuery] int days = 30)
    {
        days = NormalizeDays(days);
        var (currentStart, currentEnd, previousStart) = GetPeriods(days);

        await using var context = await contextFactory.CreateDbContextAsync();

        var current = await context.DailyGlobalRollups
            .AsNoTracking()
            .Where(r => r.CreatedDate >= currentStart && r.CreatedDate < currentEnd)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Revenue = g.Sum(r => r.GlobalRevenue),
                Volume = g.Sum(r => r.GlobalVolume)
            })
            .FirstOrDefaultAsync();

        var previous = await context.DailyGlobalRollups
            .AsNoTracking()
            .Where(r => r.CreatedDate >= previousStart && r.CreatedDate < currentStart)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Revenue = g.Sum(r => r.GlobalRevenue),
                Volume = g.Sum(r => r.GlobalVolume)
            })
            .FirstOrDefaultAsync();

        var totalRevenue = current?.Revenue ?? 0;
        var totalVolume = current?.Volume ?? 0;
        var previousRevenue = previous?.Revenue ?? 0;
        var previousVolume = previous?.Volume ?? 0;
        var aov = CalculateAov(totalRevenue, totalVolume);
        var previousAov = CalculateAov(previousRevenue, previousVolume);

        return Ok(new GlobalKpiResponse
        {
            TotalRevenue = totalRevenue,
            TotalVolume = totalVolume,
            Aov = aov,
            PreviousRevenue = previousRevenue,
            PreviousVolume = previousVolume,
            PreviousAov = previousAov,
            RevenuePoP = CalculatePoP(totalRevenue, previousRevenue),
            VolumePoP = CalculatePoP(totalVolume, previousVolume),
            AovPoP = CalculatePoP(aov, previousAov)
        });
    }

    [HttpGet("kpis/tenants")]
    public async Task<IActionResult> GetTenantKpis([FromQuery] int days = 30)
    {
        days = NormalizeDays(days);
        var (currentStart, currentEnd, previousStart) = GetPeriods(days);

        await using var context = await contextFactory.CreateDbContextAsync();

        var currentRollups = await context.DailyTenantRollups
            .AsNoTracking()
            .Where(r => r.CreatedDate >= currentStart && r.CreatedDate < currentEnd)
            .GroupBy(r => r.TenantId)
            .Select(g => new
            {
                TenantId = g.Key,
                TotalRevenue = g.Sum(r => r.Revenue),
                TotalVolume = g.Sum(r => r.Volume)
            })
            .ToListAsync();

        var previousRollups = await context.DailyTenantRollups
            .AsNoTracking()
            .Where(r => r.CreatedDate >= previousStart && r.CreatedDate < currentStart)
            .GroupBy(r => r.TenantId)
            .Select(g => new
            {
                TenantId = g.Key,
                PreviousRevenue = g.Sum(r => r.Revenue),
                PreviousVolume = g.Sum(r => r.Volume)
            })
            .ToDictionaryAsync(r => r.TenantId);

        var tenantIds = currentRollups.Select(r => r.TenantId).ToList();
        var tenants = await context.Tenants
            .AsNoTracking()
            .Where(t => tenantIds.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id);

        var tenantKpis = currentRollups
            .Where(rollup => tenants.ContainsKey(rollup.TenantId))
            .Select(rollup =>
            {
                previousRollups.TryGetValue(rollup.TenantId, out var previous);

                var previousRevenue = previous?.PreviousRevenue ?? 0;
                var previousVolume = previous?.PreviousVolume ?? 0;
                var currentAov = CalculateAov(rollup.TotalRevenue, rollup.TotalVolume);
                var previousAov = CalculateAov(previousRevenue, previousVolume);

                return new TenantKpiResponse
                {
                    TenantId = rollup.TenantId,
                    TenantName = tenants[rollup.TenantId].Name,
                    TotalRevenue = rollup.TotalRevenue,
                    TotalVolume = rollup.TotalVolume,
                    Aov = currentAov,
                    PreviousRevenue = previousRevenue,
                    PreviousVolume = previousVolume,
                    PreviousAov = previousAov,
                    RevenuePoP = CalculatePoP(rollup.TotalRevenue, previousRevenue),
                    VolumePoP = CalculatePoP(rollup.TotalVolume, previousVolume),
                    AovPoP = CalculatePoP(currentAov, previousAov)
                };
            })
            .OrderByDescending(t => t.TotalRevenue)
            .ToList();

        return Ok(tenantKpis);
    }

    [HttpGet("global-rollups")]
    public async Task<IActionResult> GetGlobalRollups([FromQuery] int days = 60)
    {
        days = NormalizeDays(days);
        var end = DateTime.UtcNow.Date.AddDays(1);
        var start = end.AddDays(-days);

        await using var context = await contextFactory.CreateDbContextAsync();

        var rollups = await context.DailyGlobalRollups
            .AsNoTracking()
            .Where(r => r.CreatedDate >= start && r.CreatedDate < end)
            .OrderBy(r => r.CreatedDate)
            .Select(r => new DailyGlobalRollupResponse
            {
                CreatedDate = r.CreatedDate,
                GlobalVolume = r.GlobalVolume,
                GlobalRevenue = r.GlobalRevenue
            })
            .ToListAsync();

        return Ok(rollups);
    }

    [HttpGet("tenants/{tenantId:guid}/diagnostics")]
    public async Task<IActionResult> GetTenantDiagnostics(Guid tenantId, [FromQuery] int days = 30)
    {
        days = NormalizeDays(days);
        var (currentStart, currentEnd, previousStart) = GetPeriods(days);

        await using var context = await contextFactory.CreateDbContextAsync();

        var tenant = await context.Tenants
            .AsNoTracking()
            .Where(t => t.Id == tenantId)
            .Select(t => new { t.Id, t.Name })
            .FirstOrDefaultAsync();

        if (tenant == null)
        {
            return NotFound();
        }

        var currentTenantRollups = await context.DailyTenantRollups
            .AsNoTracking()
            .Where(r => r.TenantId == tenantId && r.CreatedDate >= currentStart && r.CreatedDate < currentEnd)
            .OrderBy(r => r.CreatedDate)
            .ToListAsync();

        var previousTenantRollups = await context.DailyTenantRollups
            .AsNoTracking()
            .Where(r => r.TenantId == tenantId && r.CreatedDate >= previousStart && r.CreatedDate < currentStart)
            .OrderBy(r => r.CreatedDate)
            .ToListAsync();

        var globalRollups = await context.DailyGlobalRollups
            .AsNoTracking()
            .Where(r => r.CreatedDate >= currentStart && r.CreatedDate < currentEnd)
            .OrderBy(r => r.CreatedDate)
            .ToDictionaryAsync(r => r.CreatedDate.Date);

        var currentRevenue = currentTenantRollups.Sum(r => r.Revenue);
        var currentVolume = currentTenantRollups.Sum(r => r.Volume);
        var previousRevenue = previousTenantRollups.Sum(r => r.Revenue);
        var previousVolume = previousTenantRollups.Sum(r => r.Volume);
        var currentAov = CalculateAov(currentRevenue, currentVolume);
        var previousAov = CalculateAov(previousRevenue, previousVolume);
        var previousByIndex = previousTenantRollups
            .Select((rollup, index) => new { Index = index, Rollup = rollup })
            .ToDictionary(x => x.Index, x => x.Rollup);

        var daily = currentTenantRollups
            .Select((rollup, index) =>
            {
                previousByIndex.TryGetValue(index, out var previous);
                globalRollups.TryGetValue(rollup.CreatedDate.Date, out var global);

                var globalRevenue = global?.GlobalRevenue ?? 0;

                return new TenantDiagnosticDailyPoint
                {
                    CreatedDate = rollup.CreatedDate,
                    DayIndex = index + 1,
                    Revenue = rollup.Revenue,
                    Volume = rollup.Volume,
                    PreviousRevenue = previous?.Revenue ?? 0,
                    GlobalRevenue = globalRevenue,
                    PortfolioShare = globalRevenue == 0 ? 0 : (double)(rollup.Revenue / globalRevenue * 100)
                };
            })
            .ToList();

        var orderValues = await context.Orders
            .AsNoTracking()
            .Where(o => o.TenantId == tenantId
                        && o.CreatedDate >= new DateTimeOffset(currentStart, TimeSpan.Zero)
                        && o.CreatedDate < new DateTimeOffset(currentEnd, TimeSpan.Zero))
            .Select(o => o.TotalValueIncVat)
            .ToListAsync();

        return Ok(new TenantDiagnosticsResponse
        {
            TenantId = tenant.Id,
            TenantName = tenant.Name,
            Days = days,
            TotalRevenue = currentRevenue,
            TotalVolume = currentVolume,
            Aov = currentAov,
            PreviousRevenue = previousRevenue,
            PreviousVolume = previousVolume,
            PreviousAov = previousAov,
            RevenuePoP = CalculatePoP(currentRevenue, previousRevenue),
            VolumePoP = CalculatePoP(currentVolume, previousVolume),
            AovPoP = CalculatePoP(currentAov, previousAov),
            Daily = daily,
            OrderValueDistribution = BuildOrderValueDistribution(orderValues)
        });
    }

    private static int NormalizeDays(int days)
    {
        return Math.Clamp(days, 1, 365);
    }

    private static (DateTime CurrentStart, DateTime CurrentEnd, DateTime PreviousStart) GetPeriods(int days)
    {
        var currentEnd = DateTime.UtcNow.Date.AddDays(1);
        var currentStart = currentEnd.AddDays(-days);
        var previousStart = currentStart.AddDays(-days);

        return (currentStart, currentEnd, previousStart);
    }

    private static double CalculateAov(decimal revenue, decimal volume)
    {
        return volume == 0 ? 0 : (double)(revenue / volume);
    }

    private static double CalculatePoP(decimal current, decimal previous)
    {
        if (previous == 0)
        {
            return current == 0 ? 0 : 100;
        }

        return (double)((current - previous) / previous * 100);
    }

    private static double CalculatePoP(double current, double previous)
    {
        if (previous == 0)
        {
            return current == 0 ? 0 : 100;
        }

        return (current - previous) / previous * 100;
    }

    private static List<OrderValueBucketResponse> BuildOrderValueDistribution(List<int> orderValues)
    {
        const int bucketCount = 10;

        if (orderValues.Count == 0)
        {
            return [];
        }

        var minValue = orderValues.Min();
        var maxValue = orderValues.Max();
        var rawBucketSize = Math.Max(1, (int)Math.Ceiling((maxValue - minValue + 1) / (double)bucketCount));
        var magnitude = Math.Pow(10, Math.Max(0, Math.Floor(Math.Log10(rawBucketSize))));
        var bucketSize = (int)(Math.Ceiling(rawBucketSize / magnitude) * magnitude);
        var start = (minValue / bucketSize) * bucketSize;
        var buckets = new List<OrderValueBucketResponse>();

        for (var index = 0; index < bucketCount; index++)
        {
            var bucketStart = start + index * bucketSize;
            var bucketEnd = bucketStart + bucketSize;
            var count = orderValues.Count(value => value >= bucketStart && value < bucketEnd);

            buckets.Add(new OrderValueBucketResponse
            {
                Range = $"{bucketStart}-{bucketEnd}",
                MinValue = bucketStart,
                MaxValue = bucketEnd,
                OrderCount = count
            });
        }

        return buckets;
    }

    //below dtos probably to be replaced by the ones in the dto folder.
    public class GlobalKpiResponse
    {
        public decimal TotalRevenue { get; set; }
        public decimal TotalVolume { get; set; }
        public double Aov { get; set; }
        public decimal PreviousRevenue { get; set; }
        public decimal PreviousVolume { get; set; }
        public double PreviousAov { get; set; }
        public double RevenuePoP { get; set; }
        public double VolumePoP { get; set; }
        public double AovPoP { get; set; }
    }

    public class TenantKpiResponse
    {
        public Guid TenantId { get; set; }
        public string TenantName { get; set; } = string.Empty;
        public decimal TotalRevenue { get; set; }
        public decimal TotalVolume { get; set; }
        public double Aov { get; set; }
        public decimal PreviousRevenue { get; set; }
        public decimal PreviousVolume { get; set; }
        public double PreviousAov { get; set; }
        public double RevenuePoP { get; set; }
        public double VolumePoP { get; set; }
        public double AovPoP { get; set; }
    }

    public class DailyGlobalRollupResponse
    {
        public DateTime CreatedDate { get; set; }
        public decimal GlobalVolume { get; set; }
        public decimal GlobalRevenue { get; set; }
    }

    public class TenantDiagnosticsResponse
    {
        public Guid TenantId { get; set; }
        public string TenantName { get; set; } = string.Empty;
        public int Days { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalVolume { get; set; }
        public double Aov { get; set; }
        public decimal PreviousRevenue { get; set; }
        public decimal PreviousVolume { get; set; }
        public double PreviousAov { get; set; }
        public double RevenuePoP { get; set; }
        public double VolumePoP { get; set; }
        public double AovPoP { get; set; }
        public List<TenantDiagnosticDailyPoint> Daily { get; set; } = [];
        public List<OrderValueBucketResponse> OrderValueDistribution { get; set; } = [];
    }

    public class TenantDiagnosticDailyPoint
    {
        public DateTime CreatedDate { get; set; }
        public int DayIndex { get; set; }
        public decimal Revenue { get; set; }
        public decimal Volume { get; set; }
        public decimal PreviousRevenue { get; set; }
        public decimal GlobalRevenue { get; set; }
        public double PortfolioShare { get; set; }
    }

    public class OrderValueBucketResponse
    {
        public string Range { get; set; } = string.Empty;
        public int MinValue { get; set; }
        public int MaxValue { get; set; }
        public int OrderCount { get; set; }
    }
}
