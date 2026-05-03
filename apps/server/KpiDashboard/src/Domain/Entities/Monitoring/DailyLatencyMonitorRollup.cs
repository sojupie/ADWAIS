using System;

namespace Domain.Entities.Monitoring;

public class DailyLatencyMonitorRollup
{
    public int MonitorId { get; set; }
    public DateTimeOffset Date { get; set; }
    public double? Average { get; set; }
    public double? Lowest { get; set; }
    public double? Highest { get; set; }

    public UptimeMonitor UptimeMonitor { get; set; } = null!;
}
