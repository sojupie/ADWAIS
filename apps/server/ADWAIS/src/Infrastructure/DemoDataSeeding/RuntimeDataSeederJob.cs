using Adwais.Domain.Entities.Monitoring;
using Adwais.Domain.Entities.OrderData;
using Adwais.Domain.Enums;
using Adwais.Infrastructure.Persistence;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Adwais.Infrastructure.DemoDataSeeding;

public class RuntimeDataSeederJob(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    ILogger<RuntimeDataSeederJob> logger,
    IConfiguration configuration)
{
    private const int RunsPerHour = 60;
    private const string ReportingTimeZoneId = "Europe/Stockholm";
    private static readonly TimeZoneInfo ReportingTimeZone = TimeZoneInfo.FindSystemTimeZoneById(ReportingTimeZoneId);
    private record TenantProfile(string Name, int MinAov, int MaxAov, int DailyVolume);

    private static readonly List<TenantProfile> Profiles = new()
    {
        // Segment 1: High-Volume FMCG & Essentials (Low AOV, High Volume, Low Seasonality)
        new("Daily Grocery Express", 200, 800, 400),
        new("Organic Pantry", 300, 1000, 250),
        new("Pet Paradise Essentials", 150, 1200, 300),
        new("Healthy Habits Supplements", 250, 900, 350),
        new("Office Supply Hub", 500, 3000, 200),

        // Segment 2: Enterprise B2B & Industrial (High AOV, Low Volume, High Variance)
        new("Nordic Heavy Machinery", 15000, 150000, 5),
        new("Construction Materials Direct", 5000, 40000, 20),
        new("Commercial Kitchen Supply", 2000, 25000, 15),
        new("Medical Equipment Pro", 8000, 60000, 8),
        new("Wholesale Electronics Dist", 10000, 80000, 12),

        // Segment 3: Fashion & Apparel (Medium AOV, Medium/High Volume, High Seasonality)
        new("Nordic Fashion House", 800, 4500, 150),
        new("Urban Style Co", 600, 3500, 180),
        new("Peak Performance Activewear", 1000, 5000, 120),
        new("Vintage Finds Boutique", 400, 2500, 80),
        new("The Shoe Box", 700, 3000, 140),

        // Segment 4: Consumer Electronics & Tech (Medium-High AOV, High Seasonality)
        new("Tech Gadgets Plus", 1500, 8000, 100),
        new("Smart Home Solutions", 1000, 12000, 80),
        new("Cosmic PC Gaming", 3000, 25000, 50),
        new("Camera Gear Supply", 2500, 18000, 40),
        new("Drone Store Pro", 4000, 20000, 30),

        // Segment 5: Niche Luxury & High-End (Extreme AOV, Very Low Volume)
        new("Luxe Jewelry", 8000, 80000, 8),
        new("Elite Timepieces", 15000, 120000, 4),
        new("Modern Art Prints", 3000, 25000, 12),
        new("Handcrafted Leather Goods", 2000, 15000, 15),

        // Segment 6: Home, Furniture & Garden (High AOV, Medium Volume, Low/Medium Seasonality)
        new("Home & Hearth", 1500, 12000, 80),
        new("Modern Furniture Direct", 3000, 35000, 40),
        new("Scandi Design Studio", 1000, 8000, 60),
        new("Gardener's Choice", 400, 3500, 90),
        new("Outdoor Oasis", 2000, 15000, 50),

        // Segment 7: Hobbies, Sports & Leisure (Mixed AOV, Mixed Volume, High Variance)
        new("Adventure Gear Outdoors", 1200, 9000, 70),
        new("Sporting Goods Pro", 800, 6000, 110),
        new("Music Masters Instruments", 1500, 18000, 40),
        new("Bookworm Central", 150, 1000, 150),
        new("Toy Town", 200, 1500, 120),
        new("Craft Brewery Supplies", 1000, 8000, 60)
    };

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
        
        var tenants = await db.Tenants
            .Where(t => t.Id != AnalyticsDbContext.SystemTenantGuid && t.Name.EndsWith(" [MOCK]"))
            .ToListAsync();

        if (!tenants.Any()) return;

        var random = new Random();
        var now = DateTimeOffset.UtcNow;
        var reportingNow = TimeZoneInfo.ConvertTime(now, ReportingTimeZone);
        var orders = new List<Order>();

        double currentHourWeight = HourlyWeights[reportingNow.Hour] / HourlyWeights.Sum();
        double currentDayWeight = DailyWeights[(int)reportingNow.DayOfWeek];

        foreach (var tenant in tenants)
        {
            var baseName = tenant.Name.Replace(" [MOCK]", "");
            var profile = Profiles.FirstOrDefault(p => p.Name == baseName);
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

        var isMockEnabled = configuration.GetValue<bool>("FeatureToggles:MockUptimeRobotIntegrations", false);
        if (isMockEnabled)
        {
            await SeedMockMonitorLatencyAsync(db, now, random);
            await SeedMockMonitorAvailabilityAsync(db, now, random);
        }
    }

    private static async Task SeedMockMonitorAvailabilityAsync(AnalyticsDbContext db, DateTimeOffset now, Random random)
    {
        var seededMonitors = await db.Monitors
            .AsNoTracking()
            .Where(m => m.Id < 0)
            .ToListAsync();

        if (!seededMonitors.Any()) return;

        var availabilities = seededMonitors.Select(m =>
        {
            double uptimePercentage = random.NextDouble() < 0.01 
                ? random.NextDouble() * (99.8 - 98.0) + 98.0 
                : random.NextDouble() * (100.0 - 99.9) + 99.9;

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

    private static async Task SeedMockMonitorLatencyAsync(AnalyticsDbContext db, DateTimeOffset now, Random random)
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
