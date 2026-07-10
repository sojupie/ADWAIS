namespace Adwais.Application.DTOs.GlobalConfig;

public record UpdateGlobalConfigRequestDto(
    bool? LitiumFetchEnabled = null,
    bool? UptimeRobotFetchEnabled = null,
    int? LatencyDegradedFloor = -1,
    string? UptimeRobotApiKey = null,
    int? SystemEventRetentionDays = null,
    double? DefaultUptimeSla = -1,
    int? FeedFetchIntervalHours = null,
    string? WeatherLocation = null,
    int? WeatherFetchIntervalMinutes = null
);
