using Domain.Entities.Monitoring;
using Domain.Entities.OrderData;

namespace Domain.Entities;

public class Tenant
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string LitiumBaseUrl { get; set; }
    public required string ServiceAccountToken { get; set; }
    public DateTimeOffset? FetchedFrom { get; set; }
    public DateTimeOffset? FetchedUntil { get; set; }
    public DateTimeOffset? LastPolled { get; set; }
    public bool OrderFetchingEnabled { get; set; }
    public bool CurrentlyFetching { get; set; }

    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<UptimeMonitor> Monitors { get; set; } = new List<UptimeMonitor>();
}
