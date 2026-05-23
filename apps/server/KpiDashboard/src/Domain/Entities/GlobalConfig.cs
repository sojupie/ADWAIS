namespace Domain.Entities;

public class GlobalConfig
{
    public int Id { get; set; }
    public DateTimeOffset? LastPolled { get; set; }
    public bool LitiumFetchEnabled { get; set; }
    public bool UptimeRobotFetchEnabled { get; set; }
    public required int LitiumFetchIntervalMinutes { get; set; }
    public int? LatencyDegradedFloor { get; set; }
    public string? UptimeRobotApiKey { get; set; }
    public int UptimeFetchIntervalMinutes { get; set; }
    public int LatencyFetchIntervalMinutes { get; set; }
    public int SystemEventRetentionDays { get; set; }
    
    // Live telemetry from external APIs; do not persist.
    public int? MonitorsCount { get; set; }
    public int? MonitorsLimit { get; set; }
    public string? ActiveSubscription { get; set; }
}
