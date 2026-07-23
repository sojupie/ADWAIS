using Adwais.Domain.Entities.Monitoring;
using Adwais.Domain.Entities.OrderData;
using Adwais.Domain.Enums;
using Adwais.Infrastructure.Persistence;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Adwais.Infrastructure.DemoDataSeeding;

public class RuntimeDataSeederJob(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    ILogger<RuntimeDataSeederJob> logger)
{
    private const int RunsPerHour = 60;

    private static readonly double[] HourlyWeights = 
    { 
        0.020, 0.010, 0.005, 0.005, 0.007, 0.010, 0.020, 0.035, 
        0.050, 0.058, 0.065, 0.068, 0.075, 0.075, 0.068, 0.060, 
        0.050, 0.045, 0.048, 0.055, 0.070, 0.075, 0.065, 0.042 
    };

    private static readonly double[] DailyWeights = 
    { 
        0.12, 0.16, 0.16, 0.15, 0.16, 0.14, 0.11 
    };

    [DisableConcurrentExecution(timeoutInSeconds: 300)]
    [AutomaticRetry(Attempts = 0)]
    public async Task ExecuteAsync()
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var reportingTimeZoneId = await db.GlobalConfigs
            .Select(config => config.ReportingTimeZoneId)
            .SingleAsync();
        var reportingTimeZone = TimeZoneInfo.FindSystemTimeZoneById(reportingTimeZoneId);
        
        var demoTenantNames = DemoDataCatalog.Tenants.Select(profile => profile.Name).ToArray();
        var tenants = await db.Tenants
            .Where(t => demoTenantNames.Contains(t.Name))
            .ToListAsync();

        if (!tenants.Any()) return;

        var random = new Random();
        var now = DateTimeOffset.UtcNow;
        var reportingNow = TimeZoneInfo.ConvertTime(now, reportingTimeZone);
        var orders = new List<Order>();

        double currentHourWeight = HourlyWeights[reportingNow.Hour] / HourlyWeights.Sum();
        double currentDayWeight = DailyWeights[(int)reportingNow.DayOfWeek];

        foreach (var tenant in tenants)
        {
            var profile = DemoDataCatalog.FindTenant(tenant.Name);
            if (profile == null) continue;

            double weeklyVolume = profile.DailyVolume * 7.0;
            double expectedOrdersToday = weeklyVolume * currentDayWeight;
            double expectedOrdersThisHour = expectedOrdersToday * currentHourWeight;
            
            double expectedOrdersPerRun = expectedOrdersThisHour / RunsPerHour;
            int count = (int)expectedOrdersPerRun + (random.NextDouble() < (expectedOrdersPerRun % 1.0) ? 1 : 0);

            if (count > 0)
            {
                AddOrders(orders, tenant.Id, count, profile.MinAov, profile.MaxAov, now, random);
            }
        }

        if (orders.Any())
        {
            db.Orders.AddRange(orders);
            await db.SaveChangesAsync();
            
            logger.LogInformation("Added {Count} new orders across {TenantCount} tenants during runtime seeding.", 
                orders.Count, orders.Select(o => o.TenantId).Distinct().Count());
        }

        await SeedDemoMonitorLatencyAsync(db, now, random);
        await SeedDemoMonitorAvailabilityAsync(db, now, random);
    }

    private static async Task SeedDemoMonitorAvailabilityAsync(AnalyticsDbContext db, DateTimeOffset now, Random random)
    {
        var seededMonitors = await db.Monitors
            .AsNoTracking()
            .Where(m => m.Id < 0)
            .ToListAsync();

        if (!seededMonitors.Any()) return;

        var availabilities = seededMonitors.Select(m =>
        {
            var ordinal = (int)(Math.Abs((long)m.Id) - 1);
            var reliability = DemoDataCatalog.GetReliability(ordinal);
            var uptimePercentage = DemoDataCatalog.GenerateUptime(random, reliability);

            return new MonitorAvailability
            {
                MonitorId = m.Id,
                Date = now,
                UptimePercentage = uptimePercentage
            };
        }).ToList();

        db.MonitorAvailabilities.AddRange(availabilities);
        await db.SaveChangesAsync();
    }

    private static async Task SeedDemoMonitorLatencyAsync(AnalyticsDbContext db, DateTimeOffset now, Random random)
    {
        var seededMonitors = await db.Monitors
            .AsNoTracking()
            .Where(m => m.Id < 0)
            .ToListAsync();

        if (!seededMonitors.Any()) return;

        var responseTimes = seededMonitors.Select(m =>
        {
            int stableBaseLatency = 80 + (Math.Abs(m.Id.GetHashCode()) % 200);
            int avg = stableBaseLatency + random.Next(-10, 20);
            int highest = avg + random.Next(10, 60);

            double spikeChance = random.NextDouble();
            if (spikeChance < 0.005)
            {
                highest += random.Next(800, 2500);
                avg += random.Next(150, 400);
            }
            else if (spikeChance < 0.03)
            {
                highest += random.Next(150, 300);
                avg += random.Next(30, 80);
            }

            return new ResponseTime
            {
                MonitorId = m.Id,
                Date = now,
                Average = Math.Max(10, avg),
                Lowest = Math.Max(10, avg - random.Next(5, 20)),
                Highest = highest
            };
        }).ToList();

        db.ResponseTimes.AddRange(responseTimes);
        await db.SaveChangesAsync();
    }

    private static void AddOrders(List<Order> orders, Guid tenantId, int count, int minAov, int maxAov, DateTimeOffset now, Random random)
    {
        for (int i = 0; i < count; i++)
        {
            double weight = random.NextDouble();
            decimal valueIncVat = Math.Round(minAov + (decimal)(Math.Pow(weight, 2.5) * (maxAov - minAov)), 2);
            decimal valueExcVat = Math.Round(valueIncVat / 1.25m, 2);

            orders.Add(new Order
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                LitiumOrderId = $"RUNTIME-{tenantId.ToString()[..4]}-{now.Ticks}-{i}",
                OrderState = OrderState.Completed,
                CreatedDate = now,
                TotalValueIncVat = valueIncVat,
                TotalValueExcVat = valueExcVat,
                Currency = "SEK"
            });
        }
    }
}
