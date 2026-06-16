using Adwais.Domain.Entities;
using Adwais.Domain.Entities.Monitoring;
using Adwais.Domain.Entities.OrderData;
using Adwais.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Adwais.Infrastructure.Helpers;

public static class DatabaseSeeder
{
    private record TenantProfile(string Name, string Type, int MinAov, int MaxAov, int DailyVolume, int VolumeVariance, decimal SeasonalMultiplier);

    public static async Task SeedSampleDataAsync(AnalyticsDbContext context)
    {
        var random = new Random(42);
        var profiles = GenerateProfiles();
        var tenants = await SeedTenantsAsync(context, profiles);

        var forceReSeed = Environment.GetEnvironmentVariable("RESEED") == "true";
        if (forceReSeed)
        {
            Console.WriteLine("Forcing re-seed of monitor and order data...");
            await context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE orders CASCADE;");
            await context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE monitor CASCADE;");
        }

        // Always run monitor seeding independently — idempotent per-tenant guard is inside the method.
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
            await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW " + view + ";");
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

                // Box-Muller transform for standard normal distribution
                double u1 = 1.0 - random.NextDouble();
                double u2 = 1.0 - random.NextDouble();
                double randStdNormal = Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Sin(2.0 * Math.PI * u2);

                // Create a log-normal distribution for e-commerce AOV
                // We want the peak (mode) to be around the lower-middle of the range.
                double meanLog = Math.Log((double)profile.MinAov * 2.5); // Shift mode up a bit from absolute minimum
                double stdDevLog = 0.6; // Controls the spread and skewness

                double logNormalValue = Math.Exp(meanLog + stdDevLog * randStdNormal);

                // Avoid artificial volume spikes at boundaries by softly clamping to reasonable ranges without piling up values.
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
            new("Adventure Gear", "B2C", 1000, 9000, 65, 15, 2.0m),
            new("Modern Furniture", "B2B", 2500, 25000, 25, 8, 1.7m),
            new("Eco Living", "B2C", 400, 3000, 145, 35, 1.3m),
            new("Toy Town", "B2C", 150, 1800, 260, 60, 3.0m),
            new("Bookworm Central", "B2C", 100, 800, 380, 80, 1.2m),
            new("Music Masters", "Mixed", 200, 5000, 95, 25, 1.5m),
            new("Gardener's Choice", "B2C", 300, 4500, 115, 30, 1.2m),
            new("Fitness First", "B2B", 450, 4000, 165, 40, 1.4m),
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

        // Determine the lowest existing seeded (negative) ID to avoid PK collisions on re-runs.
        var lowestExistingId = await context.Monitors.Where(m => m.Id < 0).MinAsync(m => (int?)m.Id) ?? 0;
        var nextId = lowestExistingId - 1;

        foreach (var tenant in tenants)
        {
            if (!await context.Monitors.AnyAsync(m => m.TenantId == tenant.Id))
            {
                // Distribute SLA tiers: ~50% at 99.0, ~30% at 99.5, ~20% at 99.9
                var slaTier = random.NextDouble();
                var sla = slaTier < 0.5 ? 99.0 : slaTier < 0.8 ? 99.5 : 99.9;

                // ~5% chance of a low degraded floor (~2 of 40 monitors will be caught by the filter)
                // Synthetic latency is 160–199ms, so floors below 180ms will trigger degraded state.
                var degradedFloor = random.NextDouble() < 0.05
                    ? random.Next(120, 160)   // Low: synthetic latency will exceed this
                    : random.Next(400, 900);  // Safe: well above synthetic latency

                context.Monitors.Add(new UptimeMonitor
                {
                    Id = nextId--,
                    TenantId = tenant.Id,
                    Name = $"{tenant.Name.Replace(" [MOCK]", "")} Storefront [MOCK]",
                    Url = tenant.LitiumBaseUrl,
                    UptimeSla = sla,
                    LatencyDegradedFloor = degradedFloor,
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
                    // Range 99.5–100.0% so most monitors stay above their SLA tier
                    UptimePercentage = random.NextDouble() * (100.0 - 99.5) + 99.5
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


