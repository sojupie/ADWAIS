namespace Domain.Entities;

public class GlobalConfig
{
    public int Id { get; set; }
    public DateTimeOffset? LastPolled { get; set; }
    public bool LitiumFetchEnabled { get; set; } = true;
    public bool UptimeRobotFetchEnabled { get; set; } = true;
    public required int LitiumRateLimit { get; set; }
    public required int UptimeRobotRateLimit { get; set; }
    public int? LatencyDegradedFloor { get; set; }
    public string? UptimeRobotApiKey { get; set; }
    
    // Live telemetry from external APIs; do not persist.
    public int? MonitorsCount { get; set; }
    public int? MonitorsLimit { get; set; }
    public string? ActiveSubscription { get; set; }
}
