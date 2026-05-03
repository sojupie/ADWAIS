using Microsoft.EntityFrameworkCore;
using Domain.Entities;
using Domain.Entities.Monitoring;
using Domain.Entities.OrderData;

namespace Infrastructure;

public class AnalyticsDbContext(DbContextOptions<AnalyticsDbContext> options) : DbContext(options)
{
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<GlobalConfig> GlobalConfigs => Set<GlobalConfig>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<ResponseTime> ResponseTimes => Set<ResponseTime>();
    public DbSet<UptimeMonitor> Monitors => Set<UptimeMonitor>();
    public DbSet<DailyTenantRollup> DailyTenantRollups => Set<DailyTenantRollup>();
    public DbSet<DailyGlobalRollup> DailyGlobalRollups => Set<DailyGlobalRollup>();
    public DbSet<DailyLatencyMonitorRollup> DailyLatencyMonitorRollups => Set<DailyLatencyMonitorRollup>();
    public DbSet<DailyLatencyTenantRollup> DailyLatencyTenantRollups => Set<DailyLatencyTenantRollup>();
    public DbSet<DailyLatencyGlobalRollup> DailyLatencyGlobalRollups => Set<DailyLatencyGlobalRollup>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Tenant>().ToTable("tenants");
        modelBuilder.Entity<Tenant>()
            .Property(t => t.Id)
            .HasDefaultValueSql("uuid_generate_v4()");
        
        modelBuilder.Entity<Order>().ToTable("orders");
        modelBuilder.Entity<Order>()
            .HasIndex(o => new { o.TenantId, o.LitiumOrderId })
            .IsUnique()
            .HasDatabaseName("uq_orders_tenant_litium");
            
        modelBuilder.Entity<Order>()
            .HasIndex(o => new { o.CreatedDate, o.TenantId })
            .HasDatabaseName("idx_orders_composite_dash")
            .IncludeProperties(o => o.TotalValueIncVat);
            
        modelBuilder.Entity<Order>()
            .HasIndex(o => new { o.TenantId, o.TotalValueIncVat })
            .HasDatabaseName("idx_orders_value_dist");
            
        modelBuilder.Entity<Order>()
            .HasIndex(o => new { o.TenantId, o.CreatedDate })
            .HasDatabaseName("idx_orders_tenant_isolated")
            .IncludeProperties(o => o.TotalValueIncVat);

        modelBuilder.Entity<DailyTenantRollup>()
            .ToView("v_mat_financial_daily_tenant_rollup")
            .HasKey(r => new { r.CreatedDate, r.TenantId });

        modelBuilder.Entity<DailyGlobalRollup>()
            .ToView("v_mat_financial_daily_global_rollup")
            .HasKey(r => r.CreatedDate);

        modelBuilder.Entity<DailyLatencyMonitorRollup>()
            .ToView("v_mat_daily_latency_monitor_rollup")
            .HasKey(r => new { r.Date, r.MonitorId });

        modelBuilder.Entity<DailyLatencyTenantRollup>()
            .ToView("v_mat_daily_latency_tenant_rollup")
            .HasKey(r => new { r.Date, r.TenantId });

        modelBuilder.Entity<DailyLatencyGlobalRollup>()
            .ToView("v_mat_daily_latency_global_rollup")
            .HasKey(r => r.Date);
        
        modelBuilder.Entity<GlobalConfig>().ToTable("global_config");
        modelBuilder.Entity<GlobalConfig>().HasNoKey();
        
        modelBuilder.Entity<User>().ToTable("users");
        modelBuilder.Entity<User>()
            .Property(u => u.Id)
            .HasDefaultValueSql("uuid_generate_v4()");
            
        modelBuilder.Entity<User>()
            .Property(u => u.Role)
            .HasConversion<string>()
            .HasMaxLength(50);
            
        modelBuilder.Entity<ResponseTime>().ToTable("response_times");
        modelBuilder.Entity<ResponseTime>()
            .Property(rt => rt.Id)
            .HasDefaultValueSql("uuid_generate_v4()");
            
        modelBuilder.Entity<UptimeMonitor>().ToTable("monitors");
        
        modelBuilder.Entity<UptimeMonitor>()
            .HasOne(m => m.Tenant)
            .WithMany(t => t.Monitors)
            .HasForeignKey(m => m.TenantId);
            
        modelBuilder.Entity<ResponseTime>()
            .HasOne(rt => rt.UptimeMonitor)
            .WithMany(m => m.ResponseTimes)
            .HasForeignKey(rt => rt.MonitorId);
    }
}