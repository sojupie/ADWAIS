using Domain.Entities;
using Domain.Entities.Monitoring;
using Domain.Entities.OrderData;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure;

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
                        random.Next(0, 24), random.Next(0, 60), random.Next(0, 60), date.Offset);

                    int valueIncVat = random.Next(100, 5001);
                    int valueExcVat = (int)(valueIncVat / 1.25);

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

        // 3. Seed Monitor and Response Times
        var mockMonitorId = 999999;
        var monitor = await context.Monitors.FindAsync(mockMonitorId);
        if (monitor == null)
        {
            monitor = new UptimeMonitor
            {
                Id = mockMonitorId,
                TenantId = testTenantId,
                Name = "Mock Monitor",
                Url = "https://mock-monitor.com",
                UptimeMonitorEnabled = true,
                CreatedDate = startDate,
                UpdateInterval = 300,
                CurrentUptimePercentage = 99.95
            };
            context.Monitors.Add(monitor);
            await context.SaveChangesAsync();
        }

        if (!await context.ResponseTimes.AnyAsync(rt => rt.MonitorId == mockMonitorId))
        {
            var responseTimes = new List<ResponseTime>();
            for (var date = startDate; date <= endDate; date = date.AddDays(1))
            {
                // 1-3 records per day to reduce startup time
                int recordsPerDay = random.Next(1, 4);
                for (int i = 0; i < recordsPerDay; i++)
                {
                    var rtDate = new DateTimeOffset(date.Year, date.Month, date.Day, 
                        random.Next(0, 24), random.Next(0, 60), random.Next(0, 60), date.Offset);

                    double baseLatency = 150 + (random.NextDouble() * 100); // 150-250ms
                    
                    responseTimes.Add(new ResponseTime
                    {
                        Id = Guid.NewGuid(),
                        MonitorId = mockMonitorId,
                        Date = rtDate,
                        Average = baseLatency,
                        Lowest = baseLatency - random.Next(5, 20),
                        Highest = baseLatency + random.Next(5, 50)
                    });
                }

                if (responseTimes.Count > 1000)
                {
                    context.ResponseTimes.AddRange(responseTimes);
                    await context.SaveChangesAsync();
                    responseTimes.Clear();
                }
            }

            if (responseTimes.Any())
            {
                context.ResponseTimes.AddRange(responseTimes);
                await context.SaveChangesAsync();
            }
        }

        // 4. Force refresh all materialized views
        await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW v_mat_financial_daily_tenant_rollup;");
        await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW v_mat_financial_daily_global_rollup;");
        await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW v_mat_daily_latency_monitor_rollup;");
        await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW v_mat_daily_latency_tenant_rollup;");
        await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW v_mat_daily_latency_global_rollup;");
    }
}
