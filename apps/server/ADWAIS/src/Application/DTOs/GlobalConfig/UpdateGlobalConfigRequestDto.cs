namespace Adwais.Application.DTOs.GlobalConfig;

public record UpdateGlobalConfigRequestDto(
    bool? LitiumFetchEnabled = null,
    bool? UptimeRobotFetchEnabled = null,
    string? UptimeRobotApiKey = null,
    int? SystemEventRetentionDays = null,
    int? FeedFetchIntervalHours = null,
    string? WeatherLocation = null,
    int? WeatherFetchIntervalMinutes = null,
    string? ReportingTimeZoneId = null,
    string? MonitoringProvider = null
);
