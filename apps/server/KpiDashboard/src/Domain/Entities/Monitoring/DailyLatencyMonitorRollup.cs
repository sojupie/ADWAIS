using System;

namespace Domain.Entities.Monitoring;

public class DailyLatencyMonitorRollup
{
    public required int MonitorId { get; set; }
    public required DateTimeOffset Date { get; set; }
    public double? Average { get; set; }
    public double? Lowest { get; set; }
    public double? Highest { get; set; }

    public UptimeMonitor UptimeMonitor { get; set; } = null!;
}
