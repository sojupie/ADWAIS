using System;
using System.ComponentModel.DataAnnotations;

namespace Domain.Entities;

public class GlobalConfig
{
    public DateTimeOffset? LastPolled { get; set; }
    public bool Enabled { get; set; } = true;
    [MinLength(0, ErrorMessage = "Rate limit must be zero or greater")]
    public int LitiumRateLimit { get; set; }
    [MinLength(0, ErrorMessage = "Rate limit must be zero or greater")]
    public int UptimeRobotRateLimit { get; set; }
    public int? LatencyDegradedFloor { get; set; }
    public int MonitorsCount { get; set; } = 0;
    public int MonitorsLimit { get; set; }
    public string? ActiveSubscription { get; set; }
    public string? UptimeRobotApiKey { get; set; }
}