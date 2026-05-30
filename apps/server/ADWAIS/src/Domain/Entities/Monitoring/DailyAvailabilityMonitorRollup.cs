using System;

namespace Adwais.Domain.Entities.Monitoring;

public class DailyAvailabilityMonitorRollup
{
    public required int MonitorId { get; set; }
    public required DateTimeOffset Date { get; set; }
    public double? UptimePercentage { get; set; }

    public UptimeMonitor UptimeMonitor { get; set; } = null!;
}


