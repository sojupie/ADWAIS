namespace Adwais.Domain.Entities;

public class GlobalConfig
{
    public int Id { get; set; }
    public DateTimeOffset? LastPolled { get; set; }
    public bool LitiumFetchEnabled { get; set; }
    public bool UptimeRobotFetchEnabled { get; set; }
    public required int LitiumFetchIntervalMinutes { get; set; }
    public string? UptimeRobotApiKey { get; set; }
    public int UptimeFetchIntervalMinutes { get; set; }
    public int LatencyFetchIntervalMinutes { get; set; }
    public int UserStatsFetchIntervalMinutes { get; set; }
    public int SystemEventRetentionDays { get; set; }
    
    public int? MonitorsCount { get; set; }
    public int? MonitorsLimit { get; set; }
    public string? ActiveSubscription { get; set; }
    public string? LastSyncError { get; set; }
    public int FeedFetchIntervalHours { get; set; } = 2;
    public string? WeatherLocation { get; set; }
    public int WeatherFetchIntervalMinutes { get; set; } = 15;
    public string ReportingTimeZoneId { get; set; } = "Europe/Stockholm";
}
