using Adwais.Domain;

namespace Adwais.Application.DTOs.GlobalConfig;

public record GlobalConfigResponseDto(
    int Id,
    DateTimeOffset? LastPolled,
    bool LitiumFetchEnabled,
    bool UptimeRobotFetchEnabled,
    int LitiumFetchIntervalMinutes,
    string? UptimeRobotApiKey,
    int UptimeFetchIntervalMinutes,
    int LatencyFetchIntervalMinutes,
    int UserStatsFetchIntervalMinutes,
    int SystemEventRetentionDays,
    int? MonitorsCount,
    int? MonitorsLimit,
    string? ActiveSubscription,
    int FeedFetchIntervalHours,
    string? WeatherLocation,
    int WeatherFetchIntervalMinutes,
    string ReportingTimeZoneId,
    string MonitoringProvider = IntegrationProviders.UptimeRobot
);
