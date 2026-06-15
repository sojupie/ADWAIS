using Adwais.Domain.Entities;
using Adwais.Domain.Entities.Monitoring;
using Adwais.Domain.Entities.Office;
using Adwais.Domain.Entities.OrderData;
using Adwais.Domain.Enums;
using Adwais.Application.Common.Interfaces;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Adwais.Infrastructure.Persistence.Converters;

namespace Adwais.Infrastructure.Persistence;

public class AnalyticsDbContext(DbContextOptions<AnalyticsDbContext> options, IDataProtectionProvider? dataProtectionProvider = null) 
    : DbContext(options), IApplicationDbContext
{
    public DbSet<GlobalConfig> GlobalConfigs => Set<GlobalConfig>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public static readonly Guid SystemTenantGuid = new Guid("00000000-0000-0000-0000-000000000001");
    
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<DailyFinancialTenantRollup> DailyTenantRollups => Set<DailyFinancialTenantRollup>();
    public DbSet<DailyFinancialGlobalRollup> DailyGlobalRollups => Set<DailyFinancialGlobalRollup>();
    
    public DbSet<ResponseTime> ResponseTimes => Set<ResponseTime>();
    public DbSet<MonitorAvailability> MonitorAvailabilities => Set<MonitorAvailability>();
    public DbSet<UptimeMonitor> Monitors => Set<UptimeMonitor>();
    public DbSet<DailyLatencyMonitorRollup> DailyLatencyMonitorRollups => Set<DailyLatencyMonitorRollup>();
    public DbSet<DailyLatencyTenantRollup> DailyLatencyTenantRollups => Set<DailyLatencyTenantRollup>();
    public DbSet<DailyLatencyGlobalRollup> DailyLatencyGlobalRollups => Set<DailyLatencyGlobalRollup>();
    public DbSet<DailyAvailabilityMonitorRollup> DailyAvailabilityMonitorRollups => Set<DailyAvailabilityMonitorRollup>();
    public DbSet<DailyAvailabilityTenantRollup> DailyAvailabilityTenantRollups => Set<DailyAvailabilityTenantRollup>();
    public DbSet<DailyAvailabilityGlobalRollup> DailyAvailabilityGlobalRollups => Set<DailyAvailabilityGlobalRollup>();

    // intranät
    public DbSet<OfficeEvent> OfficeEvents => Set<OfficeEvent>();
    public DbSet<OfficeVisit> OfficeVisits => Set<OfficeVisit>();
    public DbSet<OfficeMessage> OfficeMessages => Set<OfficeMessage>();
    public DbSet<SystemEvent> SystemEvents => Set<SystemEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // NOTE: This project strictly uses Fluent API for all database schema mapping and properties configuration.
        // Do not add EF Core data annotations directly to the Domain models/entities.
        modelBuilder.HasPostgresExtension("uuid-ossp");

        // Force all DateTime and DateTimeOffset to UTC
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                {
                    property.SetValueConverter(new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime, DateTime>(
                        v => v.Kind == DateTimeKind.Utc ? v : v.ToUniversalTime(),
                        v => DateTime.SpecifyKind(v, DateTimeKind.Utc)));
                }
                else if (property.ClrType == typeof(DateTime?))
                {
                    property.SetValueConverter(new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime?, DateTime?>(
                        v => v.HasValue ? (v.Value.Kind == DateTimeKind.Utc ? v : v.Value.ToUniversalTime()) : v,
                        v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v));
                }
                else if (property.ClrType == typeof(DateTimeOffset))
                {
                    property.SetValueConverter(new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTimeOffset, DateTimeOffset>(
                        v => v.Offset == TimeSpan.Zero ? v : v.ToUniversalTime(),
                        v => v));
                }
                else if (property.ClrType == typeof(DateTimeOffset?))
                {
                    property.SetValueConverter(new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTimeOffset?, DateTimeOffset?>(
                        v => v.HasValue ? (v.Value.Offset == TimeSpan.Zero ? v : v.Value.ToUniversalTime()) : v,
                        v => v));
                }
            }
        }

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
            entity.Property(t => t.Type)
                .HasConversion<string>()
                .HasMaxLength(50)
                .HasDefaultValue(TenantType.Mixed);
            entity.Property(t => t.LitiumBaseUrl).HasMaxLength(2048);
            entity.Property(t => t.ServiceAccountToken).HasMaxLength(2048);
            if (dataProtectionProvider != null)
            {
                entity.Property(t => t.ServiceAccountToken)
                    .HasConversion(new EncryptedStringConverter(dataProtectionProvider));
            }
            entity.Property(t => t.CurrentlyFetching).HasDefaultValue(false);

            // to catch unassigned monitors since TenantId is not nullable and a foreign key
            entity.HasData(
                new Tenant
                {
                    Id = SystemTenantGuid,
                    Name = "System (unassigned monitors)",
                    Type = TenantType.Mixed,
                    LitiumBaseUrl = null,
                    ServiceAccountToken = null,
                    OrderFetchingEnabled = false
                }
            );
        });
        
        // Order
        modelBuilder.Entity<Order>(entity => 
        {
            entity.ToTable("orders");
            entity.HasKey(o => o.Id);
            entity.Property(o => o.OrderState)
                .HasConversion<string>()
                .HasMaxLength(255);
            entity.Property(o => o.LitiumOrderId).HasMaxLength(255);
            entity.Property(o => o.Currency).HasMaxLength(10);
            
            entity.HasIndex(o => new { o.TenantId, o.CreatedDate, o.OrderState });
                
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
            entity.HasOne(r => r.UptimeMonitor)
                .WithMany()
                .HasForeignKey(r => r.MonitorId);
        });
        
        modelBuilder.Entity<DailyLatencyTenantRollup>(entity => 
        {
            entity.ToView("v_mat_daily_latency_tenant_rollup");
            entity.HasKey(r => new { r.Date, r.TenantId });
            entity.HasOne(r => r.Tenant)
                .WithMany()
                .HasForeignKey(r => r.TenantId);
        });
        
        modelBuilder.Entity<DailyLatencyGlobalRollup>(entity => 
        {
            entity.ToView("v_mat_daily_latency_global_rollup");
            entity.HasKey(r => r.Date);
        });

        modelBuilder.Entity<DailyAvailabilityMonitorRollup>(entity =>
        {
            entity.ToView("v_mat_daily_availability_monitor_rollup");
            entity.HasKey(r => new { r.Date, r.MonitorId });
            entity.HasOne(r => r.UptimeMonitor)
                .WithMany()
                .HasForeignKey(r => r.MonitorId);
        });

        modelBuilder.Entity<DailyAvailabilityTenantRollup>(entity =>
        {
            entity.ToView("v_mat_daily_availability_tenant_rollup");
            entity.HasKey(r => new { r.Date, r.TenantId });
            entity.HasOne(r => r.Tenant)
                .WithMany()
                .HasForeignKey(r => r.TenantId);
        });

        modelBuilder.Entity<DailyAvailabilityGlobalRollup>(entity =>
        {
            entity.ToView("v_mat_daily_availability_global_rollup");
            entity.HasKey(r => r.Date);
        });
        
        // GlobalConfig
        modelBuilder.Entity<GlobalConfig>(entity => 
        {
            entity.ToTable("global_config");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.UptimeRobotApiKey).HasMaxLength(1024);
            if (dataProtectionProvider != null)
            {
                entity.Property(x => x.UptimeRobotApiKey)
                    .HasConversion(new EncryptedStringConverter(dataProtectionProvider));
            }
            entity.Property(x => x.UptimeFetchIntervalMinutes).HasDefaultValue(60);
            entity.Property(x => x.LatencyFetchIntervalMinutes).HasDefaultValue(10);
            entity.Property(x => x.UserStatsFetchIntervalMinutes).HasDefaultValue(60);
            entity.Property(x => x.SystemEventRetentionDays).HasDefaultValue(30);
            entity.Property(x => x.LitiumFetchEnabled).HasDefaultValue(true);
            entity.Property(x => x.UptimeRobotFetchEnabled).HasDefaultValue(true);
            entity.Property(x => x.DefaultUptimeSla);
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

        // MonitorAvailability
        modelBuilder.Entity<MonitorAvailability>(entity =>
        {
            entity.ToTable("monitor_availability");
            entity.HasKey(ma => ma.Id);
            entity.Property(ma => ma.Id).HasDefaultValueSql("uuid_generate_v4()");
            entity.HasOne(ma => ma.UptimeMonitor)
                .WithMany()
                .HasForeignKey(ma => ma.MonitorId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(ma => new { ma.MonitorId, ma.Date }).IsUnique();
        });
            
        // UptimeMonitor
        modelBuilder.Entity<UptimeMonitor>(entity => 
        {
            entity.ToTable("monitor");
            entity.HasKey(m => m.Id);
            entity.Ignore(m => m.StatusStr);
            entity.Ignore(m => m.CurrentUptimePercentage);
            entity.Ignore(m => m.CurrentLatency);
            entity.Property(m => m.Name).HasMaxLength(255);
            entity.Property(m => m.Url).HasMaxLength(2048);
            entity.HasOne(m => m.Tenant)
                .WithMany(t => t.Monitors)
                .HasForeignKey(m => m.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.Property(m => m.UpdateInterval).HasDefaultValue(300);
            entity.Property(m => m.Tags).HasDefaultValueSql("'{}'");
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

