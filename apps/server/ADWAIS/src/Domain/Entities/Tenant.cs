using Adwais.Domain.Entities.Monitoring;
using Adwais.Domain.Entities.OrderData;
using Adwais.Domain.Enums;

namespace Adwais.Domain.Entities;

public class Tenant
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public TenantType Type { get; set; }
    public string? LitiumBaseUrl { get; set; }
    public string? ServiceAccountToken { get; set; }
    public DateTimeOffset? FetchedFrom { get; set; }
    public DateTimeOffset? FetchedUntil { get; set; }
    public DateTimeOffset? LastPolled { get; set; }
    public bool OrderFetchingEnabled { get; set; }
    public bool CurrentlyFetching { get; set; }
    public string? LastSyncError { get; set; }

    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<UptimeMonitor> Monitors { get; set; } = new List<UptimeMonitor>();
}


