using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Domain.Entities.Monitoring;
using Domain.Entities.OrderData;
using Domain.Enums;

namespace Domain.Entities;

public class Tenant
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string LitiumBaseUrl { get; set; } = string.Empty;
    public string ServiceAccountToken { get; set; } = string.Empty;
    public int OrderCount { get; set; }
    public bool CurrentlyFetching { get; set; }
    public DateTimeOffset? FetchedFrom { get; set; }
    public DateTimeOffset? FetchedUntil { get; set; }
    public DateTimeOffset? LastPolled { get; set; }
    public bool? PingReachable { get; set; }
    public bool OrderFetchingEnabled { get; set; } = false;
    
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<UptimeMonitor> Monitors { get; set; } = new List<UptimeMonitor>();
}