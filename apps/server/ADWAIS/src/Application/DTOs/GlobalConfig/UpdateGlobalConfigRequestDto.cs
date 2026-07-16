namespace Adwais.Application.DTOs.GlobalConfig;

public record UpdateGlobalConfigRequestDto(
    bool? LitiumFetchEnabled = null,
    bool? UptimeRobotFetchEnabled = null,
    int? LatencyDegradedFloor = null,
    string? UptimeRobotApiKey = null,
    int? SystemEventRetentionDays = null,
    double? DefaultUptimeSla = null,
    int? FeedFetchIntervalHours = null,
    string? WeatherLocation = null,
    int? WeatherFetchIntervalMinutes = null
);
