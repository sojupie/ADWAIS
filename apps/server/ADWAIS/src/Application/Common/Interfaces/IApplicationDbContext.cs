using Adwais.Domain.Entities;
using Adwais.Domain.Entities.Monitoring;
using Adwais.Domain.Entities.Office;
using Adwais.Domain.Entities.OrderData;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Application.Common.Interfaces;

public interface IApplicationDbContext : IDisposable, IAsyncDisposable
{
    public static readonly TenantId SystemTenantGuid = new TenantId(new Guid("00000000-0000-0000-0000-000000000001"));

    DbSet<GlobalConfig> GlobalConfigs { get; }
    DbSet<User> Users { get; }
    DbSet<Tenant> Tenants { get; }
    DbSet<Order> Orders { get; }
    DbSet<DailyFinancialTenantRollup> DailyTenantRollups { get; }
    DbSet<DailyFinancialGlobalRollup> DailyGlobalRollups { get; }
    DbSet<ResponseTime> ResponseTimes { get; }
    DbSet<MonitorAvailability> MonitorAvailabilities { get; }
    DbSet<UptimeMonitor> Monitors { get; }
    DbSet<DailyLatencyMonitorRollup> DailyLatencyMonitorRollups { get; }
    DbSet<DailyLatencyTenantRollup> DailyLatencyTenantRollups { get; }
    DbSet<DailyLatencyGlobalRollup> DailyLatencyGlobalRollups { get; }
    DbSet<DailyAvailabilityMonitorRollup> DailyAvailabilityMonitorRollups { get; }
    DbSet<DailyAvailabilityTenantRollup> DailyAvailabilityTenantRollups { get; }
    DbSet<DailyAvailabilityGlobalRollup> DailyAvailabilityGlobalRollups { get; }
    DbSet<OfficeEvent> OfficeEvents { get; }
    DbSet<OfficeVisit> OfficeVisits { get; }
    DbSet<OfficeMessage> OfficeMessages { get; }
    DbSet<SystemEvent> SystemEvents { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
