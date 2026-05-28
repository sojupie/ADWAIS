using Domain.Entities;
using Domain.Entities.Monitoring;
using Domain.Entities.OrderData;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Infrastructure.Helpers;

public static class DatabaseSeeder
{
    private record TenantProfile(string Name, string Type, int MinAov, int MaxAov, int DailyVolume, int VolumeVariance, decimal SeasonalMultiplier);

    public static async Task SeedSampleDataAsync(AnalyticsDbContext context)
    {
        if (await context.Orders.AnyAsync())
        {
            Console.WriteLine("Data already exists, skipping seed.");
            return;
        }

        var random = new Random(42);
        var profiles = GenerateProfiles();
        var tenants = await SeedTenantsAsync(context, profiles);
        
        var endDate = DateTimeOffset.UtcNow;
        var startDate = endDate.AddMonths(-24);

        Console.WriteLine($"Seeding 2 years of historical data for {tenants.Count} tenants...");
        var sw = System.Diagnostics.Stopwatch.StartNew();

        foreach (var tenant in tenants)
        {
            var profile = profiles.First(p => p.Name == tenant.Name);
            await BulkInsertOrdersForTenantAsync(context, tenant, profile, startDate, endDate, random);
        }

        await SeedMonitorsAndMetricsAsync(context, random);
        
        // Refresh views at the end to ensure dashboard is functional
        var views = new[]
        {
            "v_mat_financial_daily_tenant_rollup",
            "v_mat_financial_daily_global_rollup",
            "v_mat_daily_latency_monitor_rollup",
            "v_mat_daily_latency_tenant_rollup",
            "v_mat_daily_latency_global_rollup",
            "v_mat_daily_availability_monitor_rollup",
            "v_mat_daily_availability_tenant_rollup",
            "v_mat_daily_availability_global_rollup"
        };

        foreach (var view in views)
        {
            await context.Database.ExecuteSqlRawAsync($"REFRESH MATERIALIZED VIEW {view};");
        }

        Console.WriteLine($"Seeding completed in {sw.Elapsed.TotalMinutes:F2} minutes.");
    }

    private static async Task<int> BulkInsertOrdersForTenantAsync(
        AnalyticsDbContext context, 
        Tenant tenant, 
        TenantProfile profile,
        DateTimeOffset startDate,
        DateTimeOffset endDate,
        Random random)
    {
        var connection = (NpgsqlConnection)context.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

        using var writer = connection.BeginBinaryImport(
            "COPY orders (id, tenant_id, order_state, litium_order_id, created_date, total_value_inc_vat, total_value_exc_vat, currency) FROM STDIN (FORMAT BINARY)");

        int count = 0;
        for (var date = startDate; date <= endDate; date = date.AddDays(1))
        {
            var isHolidaySeason = date.Month == 11 || date.Month == 12;
            var dailyVolume = profile.DailyVolume + random.Next(-profile.VolumeVariance, profile.VolumeVariance + 1);
            
            if (isHolidaySeason) dailyVolume = (int)(dailyVolume * (double)profile.SeasonalMultiplier);
            if (date.DayOfWeek is DayOfWeek.Friday or DayOfWeek.Saturday or DayOfWeek.Sunday) dailyVolume = (int)(dailyVolume * 1.3);

            for (int i = 0; i < dailyVolume; i++)
            {
                var orderDate = new DateTimeOffset(date.Year, date.Month, date.Day, 
                    random.Next(0, 24), random.Next(0, 60), random.Next(0, 60), TimeSpan.Zero);

                double weight = random.NextDouble();
                decimal valueIncVat = Math.Round(profile.MinAov + (decimal)(Math.Pow(weight, 2.5) * (profile.MaxAov - profile.MinAov)), 2);
                decimal valueExcVat = Math.Round(valueIncVat / 1.25m, 2);

                writer.StartRow();
                writer.Write(Guid.NewGuid());
                writer.Write(tenant.Id);
                writer.Write("Completed");
                writer.Write($"MOCK-{tenant.Id.ToString()[..4]}-{orderDate.Ticks}-{i}");
                writer.Write(orderDate);
                writer.Write(valueIncVat);
                writer.Write(valueExcVat);
                writer.Write("SEK");
                count++;
            }
        }

        writer.Complete();
        return count;
    }

    private static List<TenantProfile> GenerateProfiles()
    {
        // Scaling up volumes by roughly 10x to ensure "significant" historical data (millions of rows)
        return new List<TenantProfile>
        {
            new("Nordic Fashion House", "B2C", 1200, 8000, 50, 15, 2.5m),
            new("Tech Gadgets Plus", "B2B", 400, 1500, 150, 40, 1.2m),
            new("Daily Grocery Express", "B2C", 150, 1200, 450, 80, 1.1m),
            new("Urban Style Co", "B2C", 800, 4500, 80, 20, 1.8m),
            new("Home & Hearth", "Mixed", 1500, 12000, 35, 10, 2.2m),
            new("Pet Paradise", "B2C", 200, 1500, 220, 50, 1.3m),
            new("Sporting Goods Pro", "Mixed", 600, 6000, 110, 30, 1.6m),
            new("Beauty & Bliss", "B2C", 300, 2500, 190, 45, 1.4m),
            new("The Coffee Beanery", "B2B", 50, 400, 650, 120, 1.1m),
            new("Gourmet Delights", "Mixed", 500, 3500, 130, 35, 1.5m),
            new("Adventure Gear", "B2C", 1000, 9000, 65, 15, 2.0m),
            new("Modern Furniture", "B2B", 2500, 25000, 25, 8, 1.7m),
            new("Eco Living", "B2C", 400, 3000, 145, 35, 1.3m),
            new("Toy Town", "B2C", 150, 1800, 260, 60, 3.0m),
            new("Bookworm Central", "B2C", 100, 800, 380, 80, 1.2m),
            new("Music Masters", "Mixed", 200, 5000, 95, 25, 1.5m),
            new("Gardener's Choice", "B2C", 300, 4500, 115, 30, 1.2m),
            new("Fitness First", "B2B", 450, 4000, 165, 40, 1.4m),
            new("Chef's Corner", "Mixed", 700, 5500, 75, 20, 1.5m),
            new("The Stationery Shop", "B2B", 80, 600, 480, 100, 1.1m),
            new("Artistic Soul", "B2C", 400, 7000, 55, 15, 1.6m),
            new("Gadget Galaxy", "B2C", 300, 2000, 230, 60, 1.3m),
            new("Luxe Jewelry", "Mixed", 5000, 50000, 15, 5, 1.8m),
            new("Baby Steps", "B2C", 250, 3000, 210, 50, 1.4m),
            new("Vintage Finds", "B2C", 400, 6000, 65, 15, 1.5m),
            new("Outdoor Oasis", "Mixed", 1200, 10000, 45, 12, 1.9m),
            new("Smart Home Solutions", "B2B", 600, 8000, 85, 20, 1.4m),
            new("The Shoe Box", "B2C", 400, 3500, 150, 35, 1.6m),
            new("Healthy Habits", "B2C", 200, 1200, 290, 70, 1.2m),
            new("Auto Accessories", "Mixed", 350, 4500, 140, 35, 1.3m)
        };
    }

    private static async Task<List<Tenant>> SeedTenantsAsync(AnalyticsDbContext context, List<TenantProfile> profiles)
    {
        var tenants = new List<Tenant>();
        foreach (var profile in profiles)
        {
            var tenant = await context.Tenants.FirstOrDefaultAsync(t => t.Name == profile.Name);
            if (tenant == null)
            {
                tenant = new Tenant
                {
                    Id = Guid.NewGuid(),
                    Name = profile.Name,
                    Type = Enum.Parse<Domain.Enums.TenantType>(profile.Type),
                    LitiumBaseUrl = $"https://{profile.Name.Replace(" ", "").ToLower()}.mock",
                    ServiceAccountToken = $"mock-token-{profile.Name.GetHashCode()}",
                    OrderFetchingEnabled = false
                };
                context.Tenants.Add(tenant);
            }
            tenants.Add(tenant);
        }
        await context.SaveChangesAsync();
        return tenants;
    }

    private static async Task SeedMonitorsAndMetricsAsync(AnalyticsDbContext context, Random random)
    {
        var tenants = await context.Tenants.Where(t => t.Id != AnalyticsDbContext.SystemTenantGuid).ToListAsync();
        
        foreach (var tenant in tenants)
        {
            if (!await context.Monitors.AnyAsync(m => m.TenantId == tenant.Id))
            {
                context.Monitors.Add(new UptimeMonitor
                {
                    TenantId = tenant.Id,
                    Name = $"{tenant.Name} Storefront",
                    Url = tenant.LitiumBaseUrl,
                    UptimeSla = 99.9,
                    UptimeMonitorEnabled = true,
                    CreatedDate = DateTimeOffset.UtcNow.AddDays(-60),
                    UpdateInterval = 300
                });
            }
        }
        await context.SaveChangesAsync();

        var allMonitors = await context.Monitors.ToListAsync();
        var sixtyDaysAgo = DateTimeOffset.UtcNow.Date.AddDays(-60);

        foreach (var monitor in allMonitors)
        {
            if (await context.MonitorAvailabilities.AnyAsync(ma => ma.MonitorId == monitor.Id))
                continue;

            var availabilityList = new List<MonitorAvailability>();
            var responseTimes = new List<ResponseTime>();

            for (var d = 0; d < 60; d++)
            {
                var date = sixtyDaysAgo.AddDays(d);
                var utcMidnight = new DateTimeOffset(date.Year, date.Month, date.Day, 0, 0, 0, TimeSpan.Zero);

                availabilityList.Add(new MonitorAvailability
                {
                    MonitorId = monitor.Id,
                    Date = utcMidnight,
                    UptimePercentage = random.NextDouble() * (100.0 - 99.0) + 99.0
                });

                for (int h = 0; h < 24; h++)
                {
                    var timestamp = utcMidnight.AddHours(h);
                    var avg = random.Next(150, 800);
                    responseTimes.Add(new ResponseTime
                    {
                        MonitorId = monitor.Id,
                        Date = timestamp,
                        Average = avg,
                        Lowest = avg - 50,
                        Highest = avg + 150
                    });
                }
                
                if (responseTimes.Count > 2000)
                {
                    context.ResponseTimes.AddRange(responseTimes);
                    await context.SaveChangesAsync();
                    responseTimes.Clear();
                }
            }
            
            if (availabilityList.Any()) context.MonitorAvailabilities.AddRange(availabilityList);
            if (responseTimes.Any()) context.ResponseTimes.AddRange(responseTimes);
            await context.SaveChangesAsync();
        }
    }
}
