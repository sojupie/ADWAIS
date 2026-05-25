using Domain.Entities;
using Domain.Entities.Monitoring;
using Domain.Entities.OrderData;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Helpers;

public static class DatabaseSeeder
{
    public static async Task SeedSampleDataAsync(AnalyticsDbContext context)
    {
        // 1. Ensure we have at least one test tenant besides the System tenant
        var testTenantId = new Guid("11111111-1111-1111-1111-111111111111");
        var tenant = await context.Tenants.FindAsync(testTenantId);
        
        if (tenant == null)
        {
            tenant = new Tenant
            {
                Id = testTenantId,
                Name = "Demo Store (Mock Data)",
                LitiumBaseUrl = "https://mock-store.com",
                ServiceAccountToken = "mock-token",
                OrderFetchingEnabled = true,
                CurrentlyFetching = false
            };
            context.Tenants.Add(tenant);
            await context.SaveChangesAsync();
        }

        var random = new Random();
        var startDate = DateTimeOffset.UtcNow.AddMonths(-24);
        var endDate = DateTimeOffset.UtcNow;

        // 2. Seed Orders if none exist
        if (!await context.Orders.AnyAsync(o => o.TenantId == testTenantId))
        {
            var orders = new List<Order>();
            for (var date = startDate; date <= endDate; date = date.AddDays(1))
            {
                int dailyVolume = random.Next(1, 4);
                if (date.DayOfWeek == DayOfWeek.Friday || date.DayOfWeek == DayOfWeek.Saturday)
                    dailyVolume = (int)(dailyVolume * 1.5);

                for (int i = 0; i < dailyVolume; i++)
                {
                    var orderDate = new DateTimeOffset(date.Year, date.Month, date.Day, 
                        random.Next(0, 24), random.Next(0, 60), random.Next(0, 60), TimeSpan.Zero);

                    decimal valueIncVat = random.Next(100, 5001);
                    decimal valueExcVat = valueIncVat / 1.25m;

                    orders.Add(new Order
                    {
                        Id = Guid.NewGuid(),
                        TenantId = testTenantId,
                        LitiumOrderId = $"MOCK-{orderDate.Ticks}-{i}",
                        OrderState = "Completed",
                        CreatedDate = orderDate,
                        TotalValueIncVat = valueIncVat,
                        TotalValueExcVat = valueExcVat,
                        Currency = "SEK"
                    });
                }

                if (orders.Count > 1000)
                {
                    context.Orders.AddRange(orders);
                    await context.SaveChangesAsync();
                    orders.Clear();
                }
            }

            if (orders.Any())
            {
                context.Orders.AddRange(orders);
                await context.SaveChangesAsync();
            }
        }

        // 3. Seed Monitor if none exist
        if (!await context.Monitors.AnyAsync())
        {
            context.Monitors.Add(new UptimeMonitor
            {
                Id = 1, // Mock ID
                TenantId = testTenantId,
                Name = "Google",
                Url = "https://google.com",
                UptimeSla = 99.9,
                UptimeMonitorEnabled = true,
                CreatedDate = DateTimeOffset.UtcNow.AddDays(-60),
                UpdateInterval = 300
            });
            await context.SaveChangesAsync();
        }

        // 4. BRUTE FORCE: Ensure ALL monitors have historical data for analytics
        var allMonitors = await context.Monitors.ToListAsync();
        var sixtyDaysAgo = DateTimeOffset.UtcNow.Date.AddDays(-60);

        foreach (var monitor in allMonitors)
        {
            // Wipe existing metrics for this monitor to ensure a clean 60-day seed
            await context.MonitorAvailabilities.Where(ma => ma.MonitorId == monitor.Id).ExecuteDeleteAsync();
            await context.ResponseTimes.Where(rt => rt.MonitorId == monitor.Id).ExecuteDeleteAsync();

            var availabilityList = new List<MonitorAvailability>();
            var responseTimes = new List<ResponseTime>();

            // Seed from 60 days ago up to YESTERDAY (to populate rollups)
            for (var d = 0; d < 60; d++)
            {
                var date = sixtyDaysAgo.AddDays(d);
                var utcMidnight = new DateTimeOffset(date.Year, date.Month, date.Day, 0, 0, 0, TimeSpan.Zero);

                availabilityList.Add(new MonitorAvailability
                {
                    MonitorId = monitor.Id,
                    Date = utcMidnight,
                    UptimePercentage = random.NextDouble() * (100.0 - 99.5) + 99.5
                });

                for (int h = 0; h < 24; h++)
                {
                    var timestamp = utcMidnight.AddHours(h);
                    var avg = random.Next(100, 400);
                    responseTimes.Add(new ResponseTime
                    {
                        MonitorId = monitor.Id,
                        Date = timestamp,
                        Average = avg,
                        Lowest = avg - 20,
                        Highest = avg + 50
                    });
                }
                
                if (responseTimes.Count > 2000)
                {
                    context.ResponseTimes.AddRange(responseTimes);
                    await context.SaveChangesAsync();
                    responseTimes.Clear();
                }
            }
            
            // Seed TODAY's data so far (to test live merge)
            var today = DateTimeOffset.UtcNow.Date;
            var todayMidnight = new DateTimeOffset(today.Year, today.Month, today.Day, 0, 0, 0, TimeSpan.Zero);
            var currentHour = DateTimeOffset.UtcNow.Hour;

            availabilityList.Add(new MonitorAvailability
            {
                MonitorId = monitor.Id,
                Date = todayMidnight,
                UptimePercentage = 100.0
            });

            for (int h = 0; h <= currentHour; h++)
            {
                var timestamp = todayMidnight.AddHours(h);
                var avg = random.Next(100, 400);
                responseTimes.Add(new ResponseTime
                {
                    MonitorId = monitor.Id,
                    Date = timestamp,
                    Average = avg,
                    Lowest = avg - 20,
                    Highest = avg + 50
                });
            }

            if (availabilityList.Any()) context.MonitorAvailabilities.AddRange(availabilityList);
            if (responseTimes.Any()) context.ResponseTimes.AddRange(responseTimes);
            await context.SaveChangesAsync();
        }

        // 5. Force refresh all materialized views
        await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW v_mat_financial_daily_tenant_rollup;");
        await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW v_mat_financial_daily_global_rollup;");
        await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW v_mat_daily_latency_monitor_rollup;");
        await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW v_mat_daily_latency_tenant_rollup;");
        await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW v_mat_daily_latency_global_rollup;");
        await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW v_mat_daily_availability_monitor_rollup;");
        await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW v_mat_daily_availability_tenant_rollup;");
        await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW v_mat_daily_availability_global_rollup;");
    }
}
