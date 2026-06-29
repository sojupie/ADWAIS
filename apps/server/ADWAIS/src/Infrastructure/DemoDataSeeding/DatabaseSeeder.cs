using Adwais.Domain.Entities;
using Adwais.Domain.Entities.Intranet;
using Adwais.Domain.Entities.Monitoring;
using Adwais.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Adwais.Infrastructure.DemoDataSeeding;

public static class DatabaseSeeder
{
    private record TenantProfile(string Name, string Type, int MinAov, int MaxAov, int DailyVolume, int VolumeVariance, decimal SeasonalMultiplier);

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

    public static async Task SeedSampleDataAsync(AnalyticsDbContext context)
    {
        var random = new Random(42);
        var profiles = GenerateProfiles();
        var tenants = await SeedTenantsAsync(context, profiles);

        if (!await context.FeedSources.AnyAsync())
        {
            context.FeedSources.AddRange(
                new FeedSource { Id = Guid.NewGuid(), Name = "Litium Blog", Url = "https://www.litium.com/blog", IsActive = true },
                new FeedSource { Id = Guid.NewGuid(), Name = "Litium Reports & Guides", Url = "https://www.litium.com/reports-and-guides", IsActive = true },
                new FeedSource { Id = Guid.NewGuid(), Name = "Litium Cision News", Url = "https://news.cision.com/se/litium/ListItems?format=rss", IsActive = true },
                new FeedSource { Id = Guid.NewGuid(), Name = "Motillo Aktuellt", Url = "https://www.motillo.com/sv/aktuellt", IsActive = true },
                new FeedSource { Id = Guid.NewGuid(), Name = "Litium Nyhetsrum", Url = "https://www.litium.se/nyhetsrum", IsActive = true },
                new FeedSource { Id = Guid.NewGuid(), Name = "Litium Rapporter & Guider (SV)", Url = "https://www.litium.se/insikter/rapporter-guider", IsActive = true }
            );
            await context.SaveChangesAsync();
        }

        var forceReSeed = Environment.GetEnvironmentVariable("RESEED") == "true";
        if (forceReSeed)
        {
            Console.WriteLine("Forcing re-seed of monitor and order data...");
            await context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE orders CASCADE;");
            await context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE monitor CASCADE;");
        }

        await SeedMonitorsAndMetricsAsync(context, random);

        if (!forceReSeed && await context.Orders.AnyAsync())
        {
            Console.WriteLine("Orders already exist, skipping order seed.");
            return;
        }

        var endDate = DateTimeOffset.UtcNow;
        var startDate = endDate.AddMonths(-24);

        Console.WriteLine($"Seeding 2 years of historical data for {tenants.Count} tenants...");
        var sw = System.Diagnostics.Stopwatch.StartNew();

        foreach (var tenant in tenants)
        {
            var baseName = tenant.Name.Replace(" [MOCK]", "");
            var profile = profiles.First(p => p.Name == baseName);
            await BulkInsertOrdersForTenantAsync(context, tenant, profile, startDate, endDate, random);
        }

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
#pragma warning disable EF1003
            await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW " + view + ";");
#pragma warning restore EF1003
        }

        Console.WriteLine($"Seeding completed in {sw.Elapsed.TotalMinutes:F2} minutes.");
    }

    private static int GetWeightedHour(Random random)
    {
        double r = random.NextDouble();
        double sum = 0;
        for (int i = 0; i < HourlyWeights.Length; i++)
        {
            sum += HourlyWeights[i];
            if (r <= sum) return i;
        }
        return 23; 
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
        double weeklyVolume = profile.DailyVolume * 7.0;

        for (var date = startDate; date <= endDate; date = date.AddDays(1))
        {
            double dayWeight = DailyWeights[(int)date.DayOfWeek];
            double expectedBaseDailyVolume = weeklyVolume * dayWeight;
            
            var dailyVolume = (int)expectedBaseDailyVolume + random.Next(-profile.VolumeVariance, profile.VolumeVariance + 1);
            if (dailyVolume < 0) dailyVolume = 0;
            
            var isHolidaySeason = date.Month == 11 || date.Month == 12;
            if (isHolidaySeason) dailyVolume = (int)(dailyVolume * (double)profile.SeasonalMultiplier);

            for (int i = 0; i < dailyVolume; i++)
            {
                int hour = GetWeightedHour(random);
                var orderDate = new DateTimeOffset(date.Year, date.Month, date.Day, 
                    hour, random.Next(0, 60), random.Next(0, 60), TimeSpan.Zero);

                double u1 = 1.0 - random.NextDouble();
                double u2 = 1.0 - random.NextDouble();
                double randStdNormal = Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Sin(2.0 * Math.PI * u2);

                double meanLog = Math.Log((double)profile.MinAov * 2.5); 
                double stdDevLog = 0.6; 

                double logNormalValue = Math.Exp(meanLog + stdDevLog * randStdNormal);

                decimal valueIncVat = Math.Round((decimal)logNormalValue, 2);
                if (valueIncVat < 50m) valueIncVat = 50m + (decimal)random.NextDouble() * 100m;

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
        return new List<TenantProfile>
        {
            // Segment 1: High-Volume FMCG & Essentials (Low AOV, High Volume, Low Seasonality)
            new("Daily Grocery Express", "B2C", 200, 800, 400, 50, 1.1m),
            new("Organic Pantry", "B2C", 300, 1000, 250, 40, 1.2m),
            new("Pet Paradise Essentials", "B2C", 150, 1200, 300, 60, 1.1m),
            new("Healthy Habits Supplements", "B2C", 250, 900, 350, 40, 1.3m),
            new("Office Supply Hub", "B2B", 500, 3000, 200, 80, 1.1m),

            // Segment 2: Enterprise B2B & Industrial (High AOV, Low Volume, High Variance)
            new("Nordic Heavy Machinery", "B2B", 15000, 150000, 5, 3, 1.0m),
            new("Construction Materials Direct", "B2B", 5000, 40000, 20, 10, 1.1m),
            new("Commercial Kitchen Supply", "B2B", 2000, 25000, 15, 8, 1.2m),
            new("Medical Equipment Pro", "B2B", 8000, 60000, 8, 4, 1.0m),
            new("Wholesale Electronics Dist", "B2B", 10000, 80000, 12, 6, 1.4m),

            // Segment 3: Fashion & Apparel (Medium AOV, Medium/High Volume, High Seasonality)
            new("Nordic Fashion House", "B2C", 800, 4500, 150, 40, 1.8m),
            new("Urban Style Co", "B2C", 600, 3500, 180, 50, 1.7m),
            new("Peak Performance Activewear", "B2C", 1000, 5000, 120, 30, 1.6m),
            new("Vintage Finds Boutique", "B2C", 400, 2500, 80, 20, 1.5m),
            new("The Shoe Box", "B2C", 700, 3000, 140, 35, 1.6m),

            // Segment 4: Consumer Electronics & Tech (Medium-High AOV, High Seasonality)
            new("Tech Gadgets Plus", "B2C", 1500, 8000, 100, 30, 2.5m),
            new("Smart Home Solutions", "Mixed", 1000, 12000, 80, 25, 2.2m),
            new("Cosmic PC Gaming", "B2C", 3000, 25000, 50, 15, 2.0m),
            new("Camera Gear Supply", "Mixed", 2500, 18000, 40, 12, 1.8m),
            new("Drone Store Pro", "B2C", 4000, 20000, 30, 10, 1.9m),

            // Segment 5: Niche Luxury & High-End (Extreme AOV, Very Low Volume)
            new("Luxe Jewelry", "B2C", 8000, 80000, 8, 4, 2.5m),
            new("Elite Timepieces", "B2C", 15000, 120000, 4, 2, 2.0m),
            new("Modern Art Prints", "B2C", 3000, 25000, 12, 5, 1.5m),
            new("Handcrafted Leather Goods", "B2C", 2000, 15000, 15, 6, 1.8m),

            // Segment 6: Home, Furniture & Garden (High AOV, Medium Volume, Low/Medium Seasonality)
            new("Home & Hearth", "B2C", 1500, 12000, 80, 20, 1.6m),
            new("Modern Furniture Direct", "Mixed", 3000, 35000, 40, 15, 1.4m),
            new("Scandi Design Studio", "B2C", 1000, 8000, 60, 15, 1.3m),
            new("Gardener's Choice", "B2C", 400, 3500, 90, 30, 1.8m),
            new("Outdoor Oasis", "Mixed", 2000, 15000, 50, 20, 1.7m),

            // Segment 7: Hobbies, Sports & Leisure (Mixed AOV, Mixed Volume, High Variance)
            new("Adventure Gear Outdoors", "B2C", 1200, 9000, 70, 25, 1.8m),
            new("Sporting Goods Pro", "Mixed", 800, 6000, 110, 30, 1.5m),
            new("Music Masters Instruments", "Mixed", 1500, 18000, 40, 15, 1.6m),
            new("Bookworm Central", "B2C", 150, 1000, 150, 40, 1.4m),
            new("Toy Town", "B2C", 200, 1500, 120, 40, 3.5m),
            new("Craft Brewery Supplies", "B2B", 1000, 8000, 60, 20, 1.2m)
        };
    }

    private static async Task<List<Tenant>> SeedTenantsAsync(AnalyticsDbContext context, List<TenantProfile> profiles)
    {
        var tenants = new List<Tenant>();
        foreach (var profile in profiles)
        {
            var expectedName = $"{profile.Name} [MOCK]";
            var tenant = await context.Tenants.FirstOrDefaultAsync(t => t.Name == expectedName);
            if (tenant == null)
            {
                tenant = new Tenant
                {
                    Id = Guid.NewGuid(),
                    Name = $"{profile.Name} [MOCK]",
                    Type = Enum.Parse<Adwais.Domain.Enums.TenantType>(profile.Type),
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

        var lowestExistingId = await context.Monitors.Where(m => m.Id < 0).MinAsync(m => (int?)m.Id) ?? 0;
        var nextId = lowestExistingId - 1;

        foreach (var tenant in tenants)
        {
            if (!await context.Monitors.AnyAsync(m => m.TenantId == tenant.Id))
            {
                var slaTier = random.NextDouble();
                var sla = slaTier < 0.5 ? 99.0 : slaTier < 0.8 ? 99.5 : 99.9;

                var degradedFloor = random.NextDouble() < 0.05
                    ? random.Next(120, 160)   
                    : random.Next(400, 900);  

                context.Monitors.Add(new UptimeMonitor
                {
                    Id = nextId--,
                    TenantId = tenant.Id,
                    Name = $"{tenant.Name.Replace(" [MOCK]", "")} Storefront [MOCK]",
                    Url = tenant.LitiumBaseUrl ?? "",
                    UptimeSla = sla,
                    LatencyDegradedFloor = degradedFloor,
                    UptimeMonitorEnabled = true,
                    CreatedDate = DateTimeOffset.UtcNow.AddDays(-730),
                    UpdateInterval = 300
                });
            }
        }
        await context.SaveChangesAsync();

        var allMonitors = await context.Monitors.ToListAsync();
        var historyStartDate = DateTimeOffset.UtcNow.Date.AddDays(-730);

        foreach (var monitor in allMonitors)
        {
            if (await context.MonitorAvailabilities.AnyAsync(ma => ma.MonitorId == monitor.Id))
                continue;

            int stableBaseLatency = 80 + (Math.Abs(monitor.Id.GetHashCode()) % 200);
            var availabilityList = new List<MonitorAvailability>();
            var responseTimes = new List<ResponseTime>();

            for (var d = 0; d < 730; d++)
            {
                var date = historyStartDate.AddDays(d);
                var utcMidnight = new DateTimeOffset(date.Year, date.Month, date.Day, 0, 0, 0, TimeSpan.Zero);

                for (int h = 0; h < 24; h += 6)
                {
                    var timestamp = utcMidnight.AddHours(h);
                    
                    double uptimePercentage = random.NextDouble() < 0.01 
                        ? random.NextDouble() * (99.8 - 98.0) + 98.0 
                        : random.NextDouble() * (100.0 - 99.9) + 99.9;

                    availabilityList.Add(new MonitorAvailability
                    {
                        MonitorId = monitor.Id,
                        Date = timestamp,
                        UptimePercentage = uptimePercentage
                    });
                    
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

                    responseTimes.Add(new ResponseTime
                    {
                        MonitorId = monitor.Id,
                        Date = timestamp,
                        Average = Math.Max(10, avg),
                        Lowest = Math.Max(10, avg - random.Next(5, 20)),
                        Highest = highest
                    });
                }
                
                if (responseTimes.Count > 2000)
                {
                    context.ResponseTimes.AddRange(responseTimes);
                    context.MonitorAvailabilities.AddRange(availabilityList);
                    await context.SaveChangesAsync();
                    responseTimes.Clear();
                    availabilityList.Clear();
                }
            }
            
            if (availabilityList.Any()) context.MonitorAvailabilities.AddRange(availabilityList);
            if (responseTimes.Any()) context.ResponseTimes.AddRange(responseTimes);
            await context.SaveChangesAsync();
        }
    }
}