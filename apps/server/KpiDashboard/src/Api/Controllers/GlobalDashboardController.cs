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
        var (currentStart, currentEnd, _) = GetPeriods(days);

        await using var context = await contextFactory.CreateDbContextAsync();

        var tenantKpis = await context.DailyTenantRollups
            .AsNoTracking()
            .Where(r => r.CreatedDate >= currentStart && r.CreatedDate < currentEnd)
            .GroupBy(r => r.TenantId)
            .Select(g => new
            {
                TenantId = g.Key,
                TotalRevenue = g.Sum(r => r.Revenue),
                TotalVolume = g.Sum(r => r.Volume)
            })
            .Join(
                context.Tenants.AsNoTracking(),
                rollup => rollup.TenantId,
                tenant => tenant.Id,
                (rollup, tenant) => new TenantKpiResponse
                {
                    TenantId = rollup.TenantId,
                    TenantName = tenant.Name,
                    TotalRevenue = rollup.TotalRevenue,
                    TotalVolume = rollup.TotalVolume,
                    Aov = CalculateAov(rollup.TotalRevenue, rollup.TotalVolume)
                })
            .OrderByDescending(t => t.TotalRevenue)
            .ToListAsync();

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
    }

    public class DailyGlobalRollupResponse
    {
        public DateTime CreatedDate { get; set; }
        public decimal GlobalVolume { get; set; }
        public decimal GlobalRevenue { get; set; }
    }
}
