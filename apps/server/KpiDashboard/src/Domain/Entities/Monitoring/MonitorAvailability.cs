using System;

namespace Domain.Entities.Monitoring;

public class MonitorAvailability
{
    public Guid Id { get; set; }
    public int MonitorId { get; set; }
    public DateTimeOffset Date { get; set; }
    public double UptimePercentage { get; set; }

    public UptimeMonitor? UptimeMonitor { get; set; }
}
