using Domain.Entities;
using Domain.Entities.Monitoring;
using Domain.Entities.Office;
using Domain.Entities.OrderData;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure;

public class AnalyticsDbContext(DbContextOptions<AnalyticsDbContext> options) : DbContext(options)
{
    public DbSet<GlobalConfig> GlobalConfigs => Set<GlobalConfig>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public static readonly Guid SystemTenantGuid = new Guid("00000000-0000-0000-0000-000000000001");
    
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<DailyFinancialTenantRollup> DailyTenantRollups => Set<DailyFinancialTenantRollup>();
    public DbSet<DailyFinancialGlobalRollup> DailyGlobalRollups => Set<DailyFinancialGlobalRollup>();
    
    public DbSet<ResponseTime> ResponseTimes => Set<ResponseTime>();
    public DbSet<UptimeMonitor> Monitors => Set<UptimeMonitor>();
    public DbSet<DailyLatencyMonitorRollup> DailyLatencyMonitorRollups => Set<DailyLatencyMonitorRollup>();
    public DbSet<DailyLatencyTenantRollup> DailyLatencyTenantRollups => Set<DailyLatencyTenantRollup>();
    public DbSet<DailyLatencyGlobalRollup> DailyLatencyGlobalRollups => Set<DailyLatencyGlobalRollup>();

    // intranät
    public DbSet<OfficeEvent> OfficeEvents => Set<OfficeEvent>();
    public DbSet<OfficeVisit> OfficeVisits => Set<OfficeVisit>();
    public DbSet<OfficeMessage> OfficeMessages => Set<OfficeMessage>();
    public DbSet<SystemEvent> SystemEvents => Set<SystemEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("uuid-ossp");

        // SystemEvent
        modelBuilder.Entity<SystemEvent>(entity =>
        {
            entity.ToTable("system_event");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.Source).HasMaxLength(100);
            entity.Property(e => e.Level).HasConversion<string>().HasMaxLength(50);
            entity.HasOne(e => e.Tenant)
                .WithMany()
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => e.Timestamp);
        });

        // Tenant
        modelBuilder.Entity<Tenant>(entity => 
        {
            entity.ToTable("tenant");
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Id).HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(t => t.Name).HasMaxLength(255);
            entity.Property(t => t.LitiumBaseUrl).HasMaxLength(2048);
            entity.Property(t => t.ServiceAccountToken).HasMaxLength(2048);
            entity.Property(t => t.CurrentlyFetching).HasDefaultValue(false);

            // to catch unassigned monitors since TenantId is not nullable and a foreign key
            entity.HasData(
                new Tenant
                {
                    Id = SystemTenantGuid,
                    Name = "System (unassigned monitors)",
                    LitiumBaseUrl = "N/A",
                    ServiceAccountToken = "N/A",
                    OrderFetchingEnabled = false
                }
            );
        });
        
        // Order
        modelBuilder.Entity<Order>(entity => 
        {
            entity.ToTable("orders");
            entity.HasKey(o => o.Id);
            entity.Property(o => o.OrderState).HasMaxLength(255);
            entity.Property(o => o.LitiumOrderId).HasMaxLength(255);
            entity.Property(o => o.Currency).HasMaxLength(10);
            
            entity.HasIndex(o => new { o.TenantId, o.LitiumOrderId })
                .IsUnique()
                .HasDatabaseName("uq_orders_tenant_litium");
                
            entity.HasIndex(o => new { o.CreatedDate, o.TenantId })
                .HasDatabaseName("idx_orders_composite_dash")
                .IncludeProperties(o => o.TotalValueIncVat);
                
            entity.HasIndex(o => new { o.TenantId, o.TotalValueIncVat })
                .HasDatabaseName("idx_orders_value_dist");
                
            entity.HasIndex(o => new { o.TenantId, o.CreatedDate })
                .HasDatabaseName("idx_orders_tenant_isolated")
                .IncludeProperties(o => o.TotalValueIncVat);
                
            entity.HasOne(o => o.Tenant)
                .WithMany(t => t.Orders)
                .HasForeignKey(o => o.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Rollups
        modelBuilder.Entity<DailyFinancialTenantRollup>(entity => 
        {
            entity.ToView("v_mat_financial_daily_tenant_rollup");
            entity.HasKey(r => new { r.CreatedDate, r.TenantId });
        });
        
        modelBuilder.Entity<DailyFinancialGlobalRollup>(entity => 
        {
            entity.ToView("v_mat_financial_daily_global_rollup");
            entity.HasKey(r => r.CreatedDate);
        });
        
        modelBuilder.Entity<DailyLatencyMonitorRollup>(entity => 
        {
            entity.ToView("v_mat_daily_latency_monitor_rollup");
            entity.HasKey(r => new { r.Date, r.MonitorId });
        });
        
        modelBuilder.Entity<DailyLatencyTenantRollup>(entity => 
        {
            entity.ToView("v_mat_daily_latency_tenant_rollup");
            entity.HasKey(r => new { r.Date, r.TenantId });
        });
        
        modelBuilder.Entity<DailyLatencyGlobalRollup>(entity => 
        {
            entity.ToView("v_mat_daily_latency_global_rollup");
            entity.HasKey(r => r.Date);
        });
        
        // GlobalConfig
        modelBuilder.Entity<GlobalConfig>(entity => 
        {
            entity.ToTable("global_config");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.UptimeRobotApiKey).HasMaxLength(1024);
            entity.Property(x => x.UptimeFetchIntervalMinutes).HasDefaultValue(60);
            entity.Property(x => x.LatencyFetchIntervalMinutes).HasDefaultValue(10);
            entity.Property(x => x.SystemEventRetentionDays).HasDefaultValue(30);
            entity.Property(x => x.LitiumFetchEnabled).HasDefaultValue(true);
            entity.Property(x => x.UptimeRobotFetchEnabled).HasDefaultValue(true);
            entity.Ignore(x => x.MonitorsCount);
            entity.Ignore(x => x.MonitorsLimit);
            entity.Ignore(x => x.ActiveSubscription);
        });
        
        // User
        modelBuilder.Entity<User>(entity => 
        {
            entity.ToTable("users");
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Id).HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(u => u.Name).HasMaxLength(255);
            entity.Property(u => u.Role)
                .HasConversion<string>()
                .HasMaxLength(50);
        });
            
        // ResponseTime
        modelBuilder.Entity<ResponseTime>(entity => 
        {
            entity.ToTable("response_time");
            entity.HasKey(rt => rt.Id);
            entity.Property(rt => rt.Id).HasDefaultValueSql("uuid_generate_v4()");
            entity.HasOne(rt => rt.UptimeMonitor)
                .WithMany(m => m.ResponseTimes)
                .HasForeignKey(rt => rt.MonitorId)
                .OnDelete(DeleteBehavior.Cascade);
        });
            
        // UptimeMonitor
        modelBuilder.Entity<UptimeMonitor>(entity => 
        {
            entity.ToTable("monitor");
            entity.HasKey(m => m.Id);
            entity.Ignore(m => m.StatusStr);
            entity.Property(m => m.Name).HasMaxLength(255);
            entity.Property(m => m.Url).HasMaxLength(2048);
            entity.HasOne(m => m.Tenant)
                .WithMany(t => t.Monitors)
                .HasForeignKey(m => m.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(m => m.UpdateInterval).HasDefaultValue(300);
        });
            
        // intranät
        // OfficeEvent
        modelBuilder.Entity<OfficeEvent>(entity => 
        {
            entity.ToTable("office_event");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.Title).HasMaxLength(255);
            entity.Property(e => e.Location).HasMaxLength(255);
            entity.Property(e => e.EventType)
                .HasConversion<string>()
                .HasMaxLength(50);
            entity.Property(e => e.Recurrence)
                .HasConversion<string>()
                .HasMaxLength(50);
            
            // om user raderas så sätts det till null och eventet bevaras
            entity.HasOne(e => e.CreatedBy)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
        
        // OfficeVisit
        modelBuilder.Entity<OfficeVisit>(entity => 
        {
            entity.ToTable("office_visit");
            entity.HasKey(v => v.Id);
            entity.Property(v => v.Id).HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(v => v.GuestName).HasMaxLength(255);
            entity.Property(v => v.Company).HasMaxLength(255);
            entity.Property(v => v.LogoUrl).HasMaxLength(2048);
            entity.HasOne(v => v.CreatedBy)
                .WithMany()
                .HasForeignKey(v => v.CreatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // OfficeMessage
        modelBuilder.Entity<OfficeMessage>(entity => 
        {
            entity.ToTable("office_message");
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Id).HasDefaultValueSql("uuid_generate_v4()");
            entity.HasOne(m => m.CreatedBy)
                .WithMany()
                .HasForeignKey(m => m.CreatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}