using Domain.Entities;
using Domain.Entities.OrderData;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Jobs;

public class RuntimeDataSeederJob(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    ILogger<RuntimeDataSeederJob> logger)
{
    private record TenantProfile(string Name, int MinAov, int MaxAov, int DailyVolume);

    private static readonly List<TenantProfile> Profiles = new()
    {
        new("Nordic Fashion House", 1200, 8000, 5),
        new("Tech Gadgets Plus", 400, 1500, 15),
        new("Daily Grocery Express", 150, 1200, 40),
        new("Urban Style Co", 800, 4500, 8),
        new("Home & Hearth", 1500, 12000, 3),
        new("Pet Paradise", 200, 1500, 20),
        new("Sporting Goods Pro", 600, 6000, 10),
        new("Beauty & Bliss", 300, 2500, 18),
        new("The Coffee Beanery", 50, 400, 60),
        new("Gourmet Delights", 500, 3500, 12),
        new("Adventure Gear", 1000, 9000, 6),
        new("Modern Furniture", 2500, 25000, 2),
        new("Eco Living", 400, 3000, 14),
        new("Toy Town", 150, 1800, 25),
        new("Bookworm Central", 100, 800, 35),
        new("Music Masters", 200, 5000, 9),
        new("Gardener's Choice", 300, 4500, 11),
        new("Fitness First", 450, 4000, 16),
        new("Chef's Corner", 700, 5500, 7),
        new("The Stationery Shop", 80, 600, 45),
        new("Artistic Soul", 400, 7000, 5),
        new("Gadget Galaxy", 300, 2000, 22),
        new("Luxe Jewelry", 5000, 50000, 1),
        new("Baby Steps", 250, 3000, 20),
        new("Vintage Finds", 400, 6000, 6),
        new("Outdoor Oasis", 1200, 10000, 4),
        new("Smart Home Solutions", 600, 8000, 8),
        new("The Shoe Box", 400, 3500, 14),
        new("Healthy Habits", 200, 1200, 28),
        new("Auto Accessories", 350, 4500, 13)
    };

    [DisableConcurrentExecution(timeoutInSeconds: 300)]
    [AutomaticRetry(Attempts = 0)]
    public async Task ExecuteAsync()
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        
        var tenants = await db.Tenants
            .Where(t => t.Id != AnalyticsDbContext.SystemTenantGuid)
            .ToListAsync();

        if (!tenants.Any()) return;

        var random = new Random();
        var now = DateTimeOffset.UtcNow;
        var orders = new List<Order>();

        foreach (var tenant in tenants)
        {
            var profile = Profiles.FirstOrDefault(p => p.Name == tenant.Name);
            if (profile == null) continue;

            // Seed a small amount of orders proportional to their daily volume
            double expectedOrdersPerRun = profile.DailyVolume / 288.0;
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

            // Refresh views so frontend gets the update
            await db.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW CONCURRENTLY v_mat_financial_daily_tenant_rollup;");
            await db.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW CONCURRENTLY v_mat_financial_daily_global_rollup;");
        }
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
                OrderState = "Completed",
                CreatedDate = now,
                TotalValueIncVat = valueIncVat,
                TotalValueExcVat = valueExcVat,
                Currency = "SEK"
            });
        }
    }
}
