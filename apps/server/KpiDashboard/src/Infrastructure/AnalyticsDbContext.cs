using Microsoft.EntityFrameworkCore;
using Domain.Entities;

namespace Infrastructure;

public class AnalyticsDbContext : DbContext
{
    public AnalyticsDbContext(DbContextOptions<AnalyticsDbContext> options) : base(options) {}

    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<DailyTenantRollup> DailyTenantRollups => Set<DailyTenantRollup>();
    public DbSet<DailyGlobalRollup> DailyGlobalRollups => Set<DailyGlobalRollup>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Tenant>().ToTable("tenants");
        
        modelBuilder.Entity<Order>().ToTable("orders");
        modelBuilder.Entity<Order>()
            .HasIndex(o => new { o.TenantId, o.LitiumOrderId })
            .IsUnique()
            .HasDatabaseName("uq_orders_tenant_litium");

        modelBuilder.Entity<DailyTenantRollup>()
            .ToView("v_mat_daily_tenant_rollup")
            .HasKey(r => new { r.CreatedDate, r.TenantId });

        modelBuilder.Entity<DailyGlobalRollup>()
            .ToView("v_mat_daily_global_rollup")
            .HasKey(r => r.CreatedDate);
    }
}